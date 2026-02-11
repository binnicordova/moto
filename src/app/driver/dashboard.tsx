import * as Location from "expo-location";
import {useRouter} from "expo-router";
import {
    collection,
    doc,
    onSnapshot,
    orderBy,
    query,
    setDoc,
    updateDoc,
    where,
} from "firebase/firestore";
import {useAtom} from "jotai";
import React, {useEffect, useState} from "react";
import {Alert, FlatList, StyleSheet, Switch, Text, View} from "react-native";
import {
    activeRideAtom,
    driverOnlineAtom,
    type Ride,
    userAtom,
} from "@/atoms/store";
import {Button} from "@/components/Button/Button";
import {db} from "@/config/firebase";
import {
    MAX_RIDE_DISTANCE_METERS,
    RIDE_REQUEST_FILTER_MINUTES,
} from "@/constants/env";
import {ROUTES} from "@/constants/routes";
import {STRINGS} from "@/constants/strings";
import {getDistanceInMeters, getFormattedDistance} from "@/utils/distance";
import {getFormattedTime} from "@/utils/time";

export default function DriverDashboard() {
    const [user] = useAtom(userAtom);
    const [, setActiveRide] = useAtom(activeRideAtom);
    const [isOnline, setIsOnline] = useAtom(driverOnlineAtom);
    const [location, setLocation] = useState<Location.LocationObject | null>(
        null
    );
    const [rides, setRides] = useState<Ride[]>([]);
    const router = useRouter();

    const filteredRides = React.useMemo(() => {
        if (!location) return [];
        return rides.filter((ride) => {
            const distance = getDistanceInMeters(
                location.coords.latitude,
                location.coords.longitude,
                ride.origin.latitude,
                ride.origin.longitude
            );
            return distance <= MAX_RIDE_DISTANCE_METERS;
        });
    }, [rides, location]);

    // Location tracking when online
    useEffect(() => {
        let locationSubscription: Location.LocationSubscription | null = null;

        const startTracking = async () => {
            try {
                const {status} =
                    await Location.requestForegroundPermissionsAsync();
                if (status !== "granted") return;

                locationSubscription = await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.High,
                        timeInterval: 5000,
                        distanceInterval: 10,
                    },
                    (newLoc) => {
                        setLocation(newLoc);
                        if (user && isOnline) {
                            setDoc(
                                doc(db, "drivers", user.uid),
                                {
                                    location: {
                                        latitude: newLoc.coords.latitude,
                                        longitude: newLoc.coords.longitude,
                                    },
                                    isOnline: true,
                                    updatedAt: new Date(),
                                },
                                {merge: true}
                            );
                        }
                    }
                );
            } catch (error) {
                console.error("Error starting location tracking:", error);
                setIsOnline(false);
                Alert.alert(STRINGS.common.error, "Could not start tracking.");
            }
        };

        if (isOnline) {
            startTracking();
        } else {
            if (locationSubscription) {
                (
                    locationSubscription as Location.LocationSubscription
                ).remove();
            }
            // Update offline status
            if (user) {
                setDoc(
                    doc(db, "drivers", user.uid),
                    {isOnline: false},
                    {merge: true}
                );
            }
        }

        return () => {
            if (locationSubscription) {
                (
                    locationSubscription as Location.LocationSubscription
                ).remove();
            }
        };
    }, [isOnline, user, setIsOnline]);

    // Listen for rides
    useEffect(() => {
        if (!isOnline) {
            setRides([]);
            return;
        }

        const threshold = new Date(
            Date.now() - RIDE_REQUEST_FILTER_MINUTES * 60000
        );
        const q = query(
            collection(db, "rides"),
            where("status", "==", "pending"),
            where("createdAt", ">=", threshold),
            orderBy("createdAt", "desc")
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const pendingRides: Ride[] = [];
            snapshot.forEach((doc) => {
                pendingRides.push({id: doc.id, ...doc.data()} as Ride);
            });
            setRides(pendingRides);
        });

        return unsubscribe;
    }, [isOnline]);

    const handleAcceptRide = async (rideId: string) => {
        try {
            await updateDoc(doc(db, "rides", rideId), {
                status: "accepted",
                driverId: user?.uid,
            });

            const ride = rides.find((r) => r.id === rideId);
            if (ride) {
                setActiveRide({
                    ...ride,
                    status: "accepted",
                    driverId: user?.uid,
                });
                router.push(ROUTES.DRIVER.RIDE);
            }

            Alert.alert(STRINGS.driverDashboard.rideAccepted);
        } catch (e) {
            console.error(e);
            Alert.alert(
                STRINGS.common.error,
                STRINGS.driverDashboard.acceptError
            );
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>
                    {STRINGS.driverDashboard.title}
                </Text>
                <View style={styles.switchContainer}>
                    <Text>
                        {isOnline
                            ? STRINGS.driverDashboard.online
                            : STRINGS.driverDashboard.offline}
                    </Text>
                    <Switch
                        testID="driver-online-switch"
                        value={isOnline}
                        onValueChange={setIsOnline}
                    />
                </View>
            </View>

            {isOnline ? (
                <FlatList
                    data={filteredRides}
                    keyExtractor={(item) => item.id}
                    renderItem={({item}) => {
                        let distanceText = "?";
                        if (location) {
                            const {value, unit} = getFormattedDistance(
                                location.coords.latitude,
                                location.coords.longitude,
                                item.origin.latitude,
                                item.origin.longitude
                            );
                            distanceText = `${value} ${unit}`;
                        }

                        return (
                            <View style={styles.rideCard}>
                                <View style={styles.rideInfoRow}>
                                    <Text style={styles.rideText}>
                                        {STRINGS.common.distance}:{" "}
                                        {distanceText}
                                    </Text>
                                    <Text style={styles.timeText}>
                                        {item.createdAt
                                            ? getFormattedTime(item.createdAt)
                                            : ""}
                                    </Text>
                                </View>
                                <View style={{marginTop: 10}}>
                                    <Button
                                        title={STRINGS.driverDashboard.accept}
                                        onPress={() =>
                                            handleAcceptRide(item.id)
                                        }
                                    />
                                </View>
                            </View>
                        );
                    }}
                    ListEmptyComponent={
                        <Text style={{textAlign: "center", marginTop: 20}}>
                            {STRINGS.driverDashboard.noRides}
                        </Text>
                    }
                />
            ) : (
                <Text style={{textAlign: "center", marginTop: 20}}>
                    {STRINGS.driverDashboard.connectToSeeRides}
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        paddingTop: 50,
        backgroundColor: "#f5f5f5",
    },
    header: {gap: 10, marginBottom: 20, alignItems: "center"},
    title: {fontSize: 24, fontWeight: "bold"},
    switchContainer: {flexDirection: "row", alignItems: "center", gap: 10},
    rideCard: {
        padding: 15,
        backgroundColor: "white",
        marginBottom: 10,
        borderRadius: 8,
        elevation: 2,
    },
    rideInfoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 5,
    },
    rideText: {fontSize: 16, fontWeight: "bold"},
    timeText: {fontSize: 12, color: "#666"},
});
