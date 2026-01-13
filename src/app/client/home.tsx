import * as Location from "expo-location";
import {useRouter} from "expo-router";
import {doc, serverTimestamp, setDoc} from "firebase/firestore";
import {useAtom} from "jotai";
import {useEffect, useState} from "react";
import {ActivityIndicator, Alert, StyleSheet, Text, View} from "react-native";
import MapView from "react-native-maps";
import {activeRideAtom, type Ride, userAtom} from "@/atoms/store";
import {Button} from "@/components/Button/Button";
import {CenterMarker} from "@/components/Markers";
import {db} from "@/config/firebase";
import {STRINGS} from "@/constants/strings";

export default function ClientHome() {
    const [user] = useAtom(userAtom);
    const [, setActiveRide] = useAtom(activeRideAtom);
    const [location, setLocation] = useState<Location.LocationObject | null>(
        null
    );
    const [pickupLocation, setPickupLocation] = useState<{
        latitude: number;
        longitude: number;
    } | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        (async () => {
            try {
                const {status} =
                    await Location.requestForegroundPermissionsAsync();
                if (status !== "granted") {
                    setErrorMsg(STRINGS.clientHome.locationDenied);
                    return;
                }

                const location = await Location.getCurrentPositionAsync({});
                setLocation(location);
                setPickupLocation(location.coords);
            } catch (error) {
                console.error("Error obtaining location:", error);
                setErrorMsg(STRINGS.clientHome.locationDenied);
            }
        })();
    }, []);

    const handleRequestRide = async () => {
        if (!pickupLocation) {
            Alert.alert(
                STRINGS.common.error,
                STRINGS.clientHome.selectLocation
            );
            return;
        }

        try {
            const rideData = {
                clientId: user?.uid || "anon",
                origin: {
                    latitude: pickupLocation.latitude,
                    longitude: pickupLocation.longitude,
                },
                status: "pending" as const,
                createdAt: serverTimestamp(),
            };

            const rideId = user?.uid || "anon_ride";
            await setDoc(doc(db, "rides", rideId), rideData);

            // Optimistic update / Set active ride
            setActiveRide({
                id: rideId,
                clientId: rideData.clientId,
                origin: rideData.origin,
                status: "pending",
            } as Ride);

            Alert.alert(
                STRINGS.common.success,
                STRINGS.clientHome.requestSuccess
            );
            router.push("/client/ride");
        } catch (e) {
            console.error(e);
            Alert.alert(STRINGS.common.error, STRINGS.clientHome.requestError);
        }
    };

    if (errorMsg) {
        return (
            <View style={styles.container}>
                <Text>{errorMsg}</Text>
            </View>
        );
    }

    if (!location) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" />
                <Text>{STRINGS.clientHome.locationLoading}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                initialRegion={{
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                }}
                showsUserLocation
                onRegionChangeComplete={(region) => {
                    setPickupLocation({
                        latitude: region.latitude,
                        longitude: region.longitude,
                    });
                }}
            />

            <CenterMarker />

            <View style={styles.overlay}>
                <Button
                    title={STRINGS.clientHome.requestRideHere}
                    onPress={handleRequestRide}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, justifyContent: "center", alignItems: "center"},
    map: {width: "100%", height: "100%"},
    overlay: {
        position: "absolute",
        bottom: 40,
        left: 20,
        right: 20,
        backgroundColor: "white",
        padding: 20,
        borderRadius: 10,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    input: {
        borderBottomWidth: 1,
        borderBottomColor: "#ccc",
        marginBottom: 20,
        padding: 10,
        fontSize: 18,
    },
});
