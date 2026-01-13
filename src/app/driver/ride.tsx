import * as Location from "expo-location";
import {useRouter} from "expo-router";
import {doc, onSnapshot, updateDoc} from "firebase/firestore";
import {useAtom} from "jotai";
import {useEffect, useRef, useState} from "react";
import {Alert, Linking, StyleSheet, Text, View} from "react-native";
import MapView, {Polyline, PROVIDER_DEFAULT} from "react-native-maps";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {activeRideAtom, type Ride} from "@/atoms/store";
import {Button} from "@/components/Button/Button";
import {ClientMarker, PickupMarker} from "@/components/Markers";
import {db} from "@/config/firebase";
import {WHATSAPP_SUPPORT_URL} from "@/constants/env";
import {STRINGS} from "@/constants/strings";
import {getRoutePolyline, type LatLng} from "@/services/map";
import {getFormattedDistance} from "@/utils/distance";
import {isRideActive, isRideFinished} from "@/utils/ride";

export default function DriverRide() {
    const [activeRide, setActiveRide] = useAtom(activeRideAtom);
    // Local First
    const [rideData, setRideData] = useState<Ride | null>(activeRide);
    const [location, setLocation] = useState<Location.LocationObject | null>(
        null
    );
    const [routeCoordinates, setRouteCoordinates] = useState<LatLng[]>(
        activeRide?.polyline || []
    );

    const insets = useSafeAreaInsets();
    const router = useRouter();
    const mapRef = useRef<MapView>(null);

    useEffect(() => {
        if (!activeRide?.id) {
            if (!rideData) router.replace("/driver/dashboard");
            return;
        }

        const unsubscribe = onSnapshot(
            doc(db, "rides", activeRide.id),
            (docSnapshot) => {
                if (docSnapshot.exists()) {
                    const data = docSnapshot.data() as Ride;
                    const updatedRide = {...data, id: docSnapshot.id};
                    setRideData(updatedRide);

                    // Sync global state
                    if (data.status !== activeRide.status) {
                        setActiveRide(updatedRide);
                    }
                } else {
                    setActiveRide(null);
                    router.replace("/driver/dashboard");
                }
            }
        );

        return unsubscribe;
    }, [
        activeRide?.id,
        activeRide?.status,
        rideData,
        router.replace,
        setActiveRide,
    ]);

    useEffect(() => {
        let sub: Location.LocationSubscription | null = null;
        (async () => {
            try {
                const {status} =
                    await Location.requestForegroundPermissionsAsync();
                if (status === "granted") {
                    sub = await Location.watchPositionAsync(
                        {
                            accuracy: Location.Accuracy.High,
                            timeInterval: 1000,
                            distanceInterval: 5,
                        },
                        (loc) => {
                            setLocation(loc);
                            if (activeRide?.id) {
                                updateDoc(doc(db, "rides", activeRide.id), {
                                    driverLocation: {
                                        latitude: loc.coords.latitude,
                                        longitude: loc.coords.longitude,
                                        heading: loc.coords.heading || 0,
                                    },
                                });
                            }
                        }
                    );
                }
            } catch (error) {
                console.error("Error watching position in driver ride:", error);
            }
        })();
        return () => {
            sub?.remove();
        };
    }, [activeRide?.id]);

    useEffect(() => {
        // Optimization: If we already have the polyline persisted, use it and don't re-fetch
        // But only if it matches our current "empty" state needs
        if (
            activeRide?.polyline &&
            activeRide.polyline.length > 0 &&
            routeCoordinates.length === 0
        ) {
            setRouteCoordinates(activeRide.polyline);
            return;
        }

        if (location && rideData && routeCoordinates.length === 0) {
            let target: LatLng | undefined;
            if (rideData.status === "accepted") {
                target = rideData.origin;
            } else if (
                rideData.status === "in_progress" &&
                rideData.destination
            ) {
                target = rideData.destination;
            }

            if (target) {
                getRoutePolyline(
                    {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                    },
                    target
                ).then((coords) => {
                    if (coords.length > 0) {
                        setRouteCoordinates(coords);
                        // Persist locally
                        if (activeRide) {
                            setActiveRide({...activeRide, polyline: coords});
                        }
                    }
                });
            }
        }
    }, [
        rideData?.origin,
        rideData?.destination,
        rideData?.status,
        location?.coords.latitude,
        location?.coords.longitude,
        activeRide,
        location,
        routeCoordinates.length,
        rideData,
        setActiveRide,
    ]);

    useEffect(() => {
        if (location && rideData && mapRef.current) {
            const targetPoint =
                rideData.status === "in_progress"
                    ? rideData.destination
                    : rideData.origin;

            if (!targetPoint) return;

            const lat1 = location.coords.latitude;
            const lon1 = location.coords.longitude;
            const lat2 = targetPoint.latitude;
            const lon2 = targetPoint.longitude;

            const minLat = Math.min(lat1, lat2);
            const maxLat = Math.max(lat1, lat2);
            const minLon = Math.min(lon1, lon2);
            const maxLon = Math.max(lon1, lon2);

            const midLat = (minLat + maxLat) / 2;
            const midLon = (minLon + maxLon) / 2;
            const latDelta = (maxLat - minLat) * 2.5; // Large padding for status panel
            const lonDelta = (maxLon - minLon) * 2.5;

            mapRef.current.animateToRegion(
                {
                    latitude: midLat,
                    longitude: midLon,
                    latitudeDelta: Math.max(latDelta, 0.005),
                    longitudeDelta: Math.max(lonDelta, 0.005),
                },
                600
            );
        }
    }, [location, rideData]);

    const updateStatus = async (status: Ride["status"]) => {
        if (!activeRide?.id) return;

        const updatePayload: Partial<Ride> = {status};

        // When starting the trip, clear the Pickup Route so we can calculate the Destination Route
        if (status === "in_progress") {
            setRouteCoordinates([]);
            if (activeRide) {
                // Clear persisted polyline
                setActiveRide({...activeRide, polyline: []});
            }
        }

        // When finishing the trip, save the current location as the destination
        if (status === "completed" && location) {
            updatePayload.destination = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };
        }

        await updateDoc(doc(db, "rides", activeRide.id), updatePayload);
        if (status === "completed") {
            setActiveRide(null);
            router.replace("/driver/dashboard");
        }
    };

    const handleCancelByDriver = async () => {
        if (!activeRide?.id) return;

        Alert.alert(
            STRINGS.driverRide.confirmCancelTitle,
            STRINGS.driverRide.confirmCancelMessage,
            [
                {text: STRINGS.driverRide.cancelReject, style: "cancel"},
                {
                    text: STRINGS.driverRide.cancelConfirm,
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await updateDoc(doc(db, "rides", activeRide.id), {
                                status: "driver_canceled",
                            });
                            setActiveRide(null);
                            router.replace("/driver/dashboard");
                        } catch (e) {
                            console.error("Error driver cancelling ride:", e);
                            Alert.alert(
                                STRINGS.common.error,
                                STRINGS.driverRide.cancelError ||
                                    "No se pudo cancelar el viaje."
                            );
                        }
                    },
                },
            ]
        );
    };

    if (!rideData)
        return (
            <View style={styles.container}>
                <Text>{STRINGS.common.loading}</Text>
            </View>
        );

    let distanceDisplay = "--";
    if (location && rideData) {
        const {value, unit} = getFormattedDistance(
            location.coords.latitude,
            location.coords.longitude,
            rideData.origin.latitude,
            rideData.origin.longitude
        );
        distanceDisplay = `${value} ${unit}`;
    }

    return (
        <View style={styles.container}>
            {rideData?.status === "accepted" && (
                <View
                    style={[styles.topCancelContainer, {top: insets.top || 20}]}
                >
                    <Button
                        title={STRINGS.driverRide.cancelRide}
                        onPress={handleCancelByDriver}
                        variant="danger"
                    />
                </View>
            )}
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_DEFAULT}
                showsUserLocation
                initialRegion={{
                    latitude:
                        location?.coords.latitude ||
                        rideData?.origin.latitude ||
                        0,
                    longitude:
                        location?.coords.longitude ||
                        rideData?.origin.longitude ||
                        0,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }}
            >
                {rideData && (
                    <>
                        {/* Origin/Pickup Point Pin */}
                        <PickupMarker coordinate={rideData.origin} />

                        {/* Real-time Client Position */}
                        {rideData.clientLocation && (
                            <ClientMarker
                                coordinate={rideData.clientLocation}
                            />
                        )}

                        {routeCoordinates.length > 0 &&
                            rideData.status === "accepted" && (
                                <Polyline
                                    coordinates={routeCoordinates}
                                    strokeColor="#D32F2F"
                                    strokeWidth={6}
                                />
                            )}
                    </>
                )}
            </MapView>

            <View style={styles.overlay}>
                <View style={styles.infoCard}>
                    <Text style={styles.title}>
                        {rideData.status === "accepted" &&
                            STRINGS.driverRide.pickingUp}
                        {rideData.status === "in_progress" &&
                            STRINGS.driverRide.inProgress}
                        {rideData.status === "completed" &&
                            STRINGS.driverRide.finished}
                        {rideData.status === "driver_canceled" &&
                            STRINGS.driverRide.canceledByMe}
                        {rideData.status === "client_canceled" &&
                            STRINGS.driverRide.canceledByClient}
                        {!isRideActive(rideData.status) &&
                            !isRideFinished(rideData.status) &&
                            STRINGS.driverRide.details}
                    </Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>
                            {STRINGS.common.distance}:
                        </Text>
                        <Text style={styles.value}>{distanceDisplay}</Text>
                    </View>

                    <View style={styles.actions}>
                        {rideData.status === "accepted" && (
                            <Button
                                title={STRINGS.driverRide.passengerPickedUp}
                                onPress={() => updateStatus("in_progress")}
                            />
                        )}
                        {rideData.status === "in_progress" && (
                            <Button
                                title={STRINGS.driverRide.completeRide}
                                onPress={() => updateStatus("completed")}
                            />
                        )}
                        {isRideFinished(rideData.status) && (
                            <Button
                                title={STRINGS.driverRide.backToDashboard}
                                onPress={() => {
                                    setActiveRide(null);
                                    router.replace("/driver/dashboard");
                                }}
                            />
                        )}
                        <Button
                            title={STRINGS.ride.support}
                            variant="text"
                            onPress={() =>
                                Linking.openURL(WHATSAPP_SUPPORT_URL)
                            }
                            style={{marginTop: 10}}
                        />
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1},
    map: {...StyleSheet.absoluteFillObject},
    topCancelContainer: {
        position: "absolute",
        left: 20,
        right: 20,
        zIndex: 10,
    },
    overlay: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        marginBottom: 30,
    },
    infoCard: {
        backgroundColor: "white",
        borderRadius: 20,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    title: {fontSize: 20, fontWeight: "bold", marginBottom: 15},
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 20,
    },
    label: {fontSize: 16, color: "#666"},
    value: {fontSize: 16, fontWeight: "bold"},
    actions: {gap: 10},
});
