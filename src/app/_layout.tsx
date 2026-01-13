import {useFonts} from "expo-font";
import {Slot} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import {StatusBar} from "expo-status-bar";
import {Provider, useAtom} from "jotai";
import {Suspense, useEffect} from "react";
import {View} from "react-native";
import {roleAtom} from "@/atoms/store";
import {remoteConfigService} from "@/services/remoteConfig";
import {styles} from "@/styles";
import {theme} from "@/theme/colors";

SplashScreen.preventAutoHideAsync();

const FONT_SETTINGS = {
    MaterialCommunityIcons: require("../../assets/fonts/MaterialCommunityIcons.ttf"),
    LatoLight: require("../../assets/fonts/Lato-Light.ttf"),
    LatoRegular: require("../../assets/fonts/Lato-Regular.ttf"),
    LatoBold: require("../../assets/fonts/Lato-Bold.ttf"),
};

const RoleUpdater = () => {
    const [role, setRole] = useAtom(roleAtom);

    useEffect(() => {
        const checkRoleStart = async () => {
            if (role === "client") {
                const isAuthorized =
                    await remoteConfigService.isDriverAuthorized();
                if (isAuthorized) {
                    setRole("driver");
                }
            } else if (role === "driver") {
                const isAuthorized =
                    await remoteConfigService.isDriverAuthorized();
                if (!isAuthorized) {
                    setRole("client");
                }
            }
        };
        checkRoleStart();
    }, [role, setRole]);

    return null;
};

const RootLayout = () => {
    const {background} = theme();
    const [fontsLoaded, fontError] = useFonts(FONT_SETTINGS);

    useEffect(() => {
        if (fontsLoaded || fontError) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded, fontError]);

    if (!fontsLoaded) {
        return null;
    }

    return (
        <Provider>
            <Suspense fallback={null}>
                <RoleUpdater />
            </Suspense>
            <View style={[styles.baseLayer, {backgroundColor: background}]}>
                <StatusBar style="auto" />
                <Slot />
            </View>
        </Provider>
    );
};

let AppEntryPoint = RootLayout;

if (process.env.EXPO_PUBLIC_STORYBOOK_ENABLED === "true") {
    try {
        AppEntryPoint = require("../../.rnstorybook").default;
        SplashScreen.hideAsync();
    } catch (error) {
        console.warn("Storybook not available:", error);
    }
}

export default AppEntryPoint;
