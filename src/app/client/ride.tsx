import * as Location from "expo-location";
import {useRouter} from "expo-router";
import {doc, onSnapshot, updateDoc} from "firebase/firestore";
import {useAtom} from "jotai";
import {useCallback, useEffect, useRef, useState} from "react";
import {
    ActivityIndicator,
    Alert,
    AppState,
    type AppStateStatus,
    Linking,
    StyleSheet,
    Text,
    View,
} from "react-native";
import MapView, {Polyline} from "react-native-maps";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {activeRideAtom, type Ride} from "@/atoms/store";
import {Button} from "@/components/Button/Button";
import {DriverMarker, PickupMarker} from "@/components/Markers";
import {db} from "@/config/firebase";
import {WHATSAPP_REPORT_URL, WHATSAPP_SUPPORT_URL} from "@/constants/env";
import {STRINGS} from "@/constants/strings";
import {getRoutePolyline, type LatLng} from "@/services/map";
import {isRideFinished} from "@/utils/ride";

export default function ClientRide() {
    const [activeRide, setActiveRide] = useAtom(activeRideAtom);
    const [routeCoordinates, setRouteCoordinates] = useState<LatLng[]>([]);
    const [timeoutReset, setTimeoutReset] = useState(0);
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const mapRef = useRef<MapView>(null);
    const prevStatus = useRef<string | null>(null);
    const rideStatusRef = useRef<string | null>(activeRide?.status || null);

    const handleCancelRide = useCallback(async () => {
        if (!activeRide?.id) return;
        try {
            await updateDoc(doc(db, "rides", activeRide.id), {
                status: "client_canceled",
            });
            setActiveRide(null);
            router.replace("/client/home");
        } catch (e) {
            console.error("Error cancelling ride:", e);
        }
    }, [activeRide?.id, setActiveRide, router.replace]);

    // Sync ref with state
    useEffect(() => {
        rideStatusRef.current = activeRide?.status || null;
    }, [activeRide?.status]);

    // Handle 5-minute timeout, unmount cancellation, and app backgrounding
    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout> | undefined;

        const handleAppStateChange = async (nextAppState: AppStateStatus) => {
            if (
                nextAppState.match(/inactive|background/) &&
                rideStatusRef.current === "pending" &&
                activeRide?.id
            ) {
                console.log("App moved to background, cancelling pending ride");
                await handleCancelRide();
            }
        };

        const appStateSubscription = AppState.addEventListener(
            "change",
            handleAppStateChange
        );

        if (activeRide?.status === "pending") {
            // timeoutReset is used to re-trigger this effect when user chooses to continue waiting
            const _resetCount = timeoutReset;
            timeoutId = setTimeout(async () => {
                if (rideStatusRef.current === "pending") {
                    Alert.alert(
                        STRINGS.ride.timeout_title,
                        STRINGS.ride.timeout_message,
                        [
                            {
                                text: STRINGS.ride.cancel_request,
                                onPress: () => handleCancelRide(),
                                style: "cancel",
                            },
                            {
                                text: STRINGS.ride.continue_waiting,
                                onPress: () =>
                                    setTimeoutReset((prev) => prev + 1),
                            },
                        ]
                    );
                }
            }, 300000); // 5 minutes (300,000 ms)
        }

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            appStateSubscription.remove();
        };
    }, [activeRide?.status, activeRide?.id, handleCancelRide, timeoutReset]);

    // Track Client Location
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
                            timeInterval: 5000,
                            distanceInterval: 20,
                        },
                        async (loc) => {
                            if (
                                activeRide?.id &&
                                activeRide?.status !== "completed"
                            ) {
                                await updateDoc(
                                    doc(db, "rides", activeRide.id),
                                    {
                                        clientLocation: {
                                            latitude: loc.coords.latitude,
                                            longitude: loc.coords.longitude,
                                        },
                                    }
                                );
                            }
                        }
                    );
                }
            } catch (error) {
                console.error("Error watching client position:", error);
            }
        })();

        return () => {
            sub?.remove();
        };
    }, [activeRide?.id, activeRide?.status]);

    useEffect(() => {
        if (!activeRide?.id) {
            router.replace("/client/home");
            return;
        }

        const unsubscribe = onSnapshot(
            doc(db, "rides", activeRide.id),
            (docSnapshot) => {
                if (docSnapshot.exists()) {
                    const data = docSnapshot.data() as Ride;
                    const updatedRide = {...data, id: docSnapshot.id};

                    // Update global state directly
                    setActiveRide(updatedRide);
                } else {
                    // Document deleted or missing
                    console.log("Ride document missing, resetting state");
                    setActiveRide(null);
                    router.replace("/client/home");
                }
            },
            (error) => {
                console.error("Snapshot error:", error);
            }
        );

        return unsubscribe;
    }, [activeRide?.id, router.replace, setActiveRide]); // Only re-subscribe if ID changes

    useEffect(() => {
        // Handle status changes (clear route if we change phases)
        if (prevStatus.current && prevStatus.current !== activeRide?.status) {
            setRouteCoordinates([]);
        }
        if (activeRide?.status) prevStatus.current = activeRide.status;

        if (activeRide?.driverLocation && routeCoordinates.length === 0) {
            let target: LatLng | undefined;
            if (activeRide.status === "accepted" && activeRide.origin)
                target = activeRide.origin;
            else if (
                activeRide.status === "in_progress" &&
                activeRide.destination
            )
                target = activeRide.destination;

            if (target) {
                getRoutePolyline(
                    {
                        latitude: activeRide.driverLocation.latitude,
                        longitude: activeRide.driverLocation.longitude,
                    },
                    target
                ).then((coords) => {
                    if (coords.length > 0) setRouteCoordinates(coords);
                });
            }
        }
    }, [
        activeRide?.driverLocation,
        activeRide?.origin,
        activeRide?.destination,
        activeRide?.status,
        routeCoordinates.length,
    ]);

    useEffect(() => {
        if (activeRide?.driverLocation && mapRef.current) {
            const targetPoint =
                activeRide.status === "in_progress"
                    ? activeRide.destination
                    : activeRide.origin;

            if (!targetPoint) return;

            const lat1 = activeRide.driverLocation.latitude;
            const lon1 = activeRide.driverLocation.longitude;
            const lat2 = targetPoint.latitude;
            const lon2 = targetPoint.longitude;

            const minLat = Math.min(lat1, lat2);
            const maxLat = Math.max(lat1, lat2);
            const minLon = Math.min(lon1, lon2);
            const maxLon = Math.max(lon1, lon2);

            const midLat = (minLat + maxLat) / 2;
            const midLon = (minLon + maxLon) / 2;
            const latDelta = (maxLat - minLat) * 2.5;
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
    }, [activeRide]);

    if (!activeRide) return <ActivityIndicator style={{marginTop: 50}} />;

    return (
        <View style={styles.container}>
            {(activeRide.status === "pending" ||
                activeRide.status === "accepted") && (
                <View
                    style={[styles.topCancelContainer, {top: insets.top || 20}]}
                >
                    <Button
                        title={STRINGS.ride.cancel_request}
                        onPress={handleCancelRide}
                        variant="danger"
                    />
                </View>
            )}
            <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={{
                    latitude: activeRide.origin.latitude,
                    longitude: activeRide.origin.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                }}
            >
                <PickupMarker coordinate={activeRide.origin} />

                {activeRide.driverLocation && (
                    <DriverMarker coordinate={activeRide.driverLocation} />
                )}

                {routeCoordinates.length > 0 &&
                    activeRide.status === "accepted" && (
                        <Polyline
                            coordinates={routeCoordinates}
                            strokeColor="#D32F2F"
                            strokeWidth={6}
                        />
                    )}
            </MapView>
            <View style={styles.statusPanel}>
                <Text style={styles.statusText}>
                    {activeRide.status === "pending" && STRINGS.ride.searching}
                    {activeRide.status === "accepted" &&
                        STRINGS.ride.driverNear}
                    {activeRide.status === "in_progress" &&
                        STRINGS.ride.inProgress}
                    {activeRide.status === "completed" &&
                        STRINGS.ride.completed}
                    {activeRide.status === "client_canceled" &&
                        STRINGS.ride.clientCanceled}
                    {activeRide.status === "driver_canceled" &&
                        STRINGS.ride.driverCanceled}
                </Text>

                {activeRide.status === "pending" && (
                    <View style={{alignItems: "center", marginTop: 10}}>
                        <ActivityIndicator
                            size="small"
                            color="#000"
                            style={{marginBottom: 10}}
                        />
                        <Text
                            style={{
                                textAlign: "center",
                                color: "#666",
                                fontSize: 13,
                                lineHeight: 18,
                            }}
                        >
                            {STRINGS.ride.instructions}
                        </Text>
                    </View>
                )}

                {activeRide.driverId && activeRide.status === "accepted" && (
                    <Text style={{marginTop: 5, color: "green"}}>
                        {STRINGS.ride.driverAssigned}
                    </Text>
                )}

                {activeRide.status === "in_progress" && (
                    <View style={{width: "100%", marginTop: 15}}>
                        <Button
                            title={STRINGS.ride.reportProblem}
                            onPress={() => Linking.openURL(WHATSAPP_REPORT_URL)}
                            variant="outline"
                        />
                    </View>
                )}

                {isRideFinished(activeRide.status) && (
                    <View style={{width: "100%", marginTop: 15}}>
                        <Button
                            title={STRINGS.common.back_to_start}
                            onPress={() => {
                                setActiveRide(null);
                                router.replace("/client/home");
                            }}
                        />
                    </View>
                )}

                <View style={{width: "100%", marginTop: 10}}>
                    <Button
                        title={STRINGS.ride.support}
                        variant="text"
                        onPress={() => Linking.openURL(WHATSAPP_SUPPORT_URL)}
                    />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1},
    map: {flex: 1},
    topCancelContainer: {
        position: "absolute",
        left: 20,
        right: 20,
        zIndex: 10,
    },
    statusPanel: {
        padding: 20,
        paddingBottom: 50,
        backgroundColor: "white",
        alignItems: "center",
        borderBottomWidth: 1,
        borderColor: "#eee",
    },
    statusText: {fontSize: 20, fontWeight: "bold"},
});
