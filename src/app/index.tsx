import {useRouter} from "expo-router";
import {useAtom} from "jotai";
import {useEffect} from "react";
import {ActivityIndicator, Text, View} from "react-native";
import {activeRideAtom, roleAtom, userAtom} from "@/atoms/store";
import {STRINGS} from "@/constants/strings";
import {getDeviceId} from "@/utils/device";
import {isRideActive} from "@/utils/ride";

export default function Index() {
    const [user, setUser] = useAtom(userAtom);
    const [role] = useAtom(roleAtom);
    const [activeRide] = useAtom(activeRideAtom);
    const router = useRouter();

    // Handle "Authentication" (Local ID generation)
    useEffect(() => {
        if (!user) {
            // Create a new anonymous user ID
            getDeviceId().then((uid) => setUser({uid}));
        }
    }, [user, setUser]);

    // Handle Routing based on Auth & Role
    useEffect(() => {
        if (user) {
            if (!role) {
                router.replace("/role-selector");
                return;
            }

            // Check for active ride persistence
            const isActive = activeRide && isRideActive(activeRide.status);

            if (isActive) {
                if (role === "client") {
                    router.replace("/client/ride");
                    return;
                }
                if (role === "driver") {
                    router.replace("/driver/ride");
                    return;
                }
            }

            if (role === "client") {
                router.replace("/client/home");
            } else if (role === "driver") {
                router.replace("/driver/dashboard");
            }
        }
    }, [user, role, activeRide, router]);

    return (
        <View style={{flex: 1, justifyContent: "center", alignItems: "center"}}>
            <ActivityIndicator size="large" />
            <Text style={{marginTop: 20}}>{STRINGS.common.loadingApp}</Text>
        </View>
    );
}
