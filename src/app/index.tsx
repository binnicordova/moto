import {useRouter} from "expo-router";
import {useSetAtom} from "jotai";
import {useEffect} from "react";
import {ActivityIndicator, Text, View} from "react-native";
import {initializeAppAtom} from "@/atoms/role";
import {STRINGS} from "@/constants/strings";

export default function Index() {
    const initializeApp = useSetAtom(initializeAppAtom);
    const router = useRouter();

    useEffect(() => {
        let mounted = true;

        const init = async () => {
            try {
                const route = await initializeApp();
                if (mounted && route) {
                    router.replace(route);
                }
            } catch (error) {
                console.error("Initialization failed:", error);
            }
        };

        init();

        return () => {
            mounted = false;
        };
    }, [initializeApp, router]);

    return (
        <View style={{flex: 1, justifyContent: "center", alignItems: "center"}}>
            <ActivityIndicator size="large" />
            <Text style={{marginTop: 20}}>
                {STRINGS.common?.loadingApp || "Loading..."}
            </Text>
        </View>
    );
}
