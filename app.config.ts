import "dotenv/config";
import type {ExpoConfig} from "@expo/config-types";

const EAS_OWNER = process.env.EAS_OWNER; // by https://www.binnicordova.com
const EAS_SLUG = "moto";
const EAS_PROJECT_ID = process.env.EAS_PROJECT_ID;

const VERSION = "0.0.1";
const VERSION_CODE = 1;

const APP_VARIANTS = {
    development: {
        identifier: "com.motoai.dev",
        name: "Moto (Dev)",
        scheme: "dev.motoai.com",
    },
    preview: {
        identifier: "com.motoai.preview",
        name: "Moto (Preview)",
        scheme: "preview.motoai.com",
    },
    production: {
        identifier: "com.motoai",
        name: "Moto",
        scheme: "motoai.com",
    },
};

const getAppVariant = () => {
    if (process.env.APP_VARIANT === "development")
        return APP_VARIANTS.development;
    if (process.env.APP_VARIANT === "preview") return APP_VARIANTS.preview;
    return APP_VARIANTS.production;
};

const getUniqueIdentifier = () => getAppVariant().identifier;
const getAppName = () => getAppVariant().name;
const getScheme = () => getAppVariant().scheme;

export default ({config}: {config: ExpoConfig}): ExpoConfig => ({
    ...config,
    name: getAppName(),
    scheme: getScheme(),
    slug: EAS_SLUG,
    version: VERSION,
    orientation: "portrait",
    icon: "./assets/icon.png",
    newArchEnabled: true,
    splash: {
        image: "./assets/splash.png",
        resizeMode: "contain",
        backgroundColor: "#ffffff",
    },
    updates: {
        url: `https://u.expo.dev/${EAS_PROJECT_ID}`,
        fallbackToCacheTimeout: 0,
        enabled: true,
        checkAutomatically: "ON_LOAD",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
        supportsTablet: true,
        bundleIdentifier: getUniqueIdentifier(),
        infoPlist: {
            UIBackgroundModes: ["process"],
        },
    },
    android: {
        adaptiveIcon: {
            foregroundImage: "./assets/adaptive-icon.png",
            backgroundColor: "#FFFFFF",
        },
        package: getUniqueIdentifier(),
    },
    web: {
        favicon: "./assets/favicon.png",
        bundler: "metro",
    },
    extra: {
        router: {
            root: "src/app",
        },
        eas: {
            projectId: EAS_PROJECT_ID,
        },
    },
    owner: EAS_OWNER,
    runtimeVersion: `${VERSION}+${VERSION_CODE}`,
    userInterfaceStyle: "automatic",
    plugins: [
        [
            "expo-router",
            {
                root: "src/app",
            },
        ],
        [
            "expo-notifications",
            {
                icon: "./assets/images/notification_icon.png",
                color: "#ffffff",
                defaultChannel: "default",
                sounds: ["./assets/sounds/notification_sound.wav"],
                enableBackgroundRemoteNotifications: true,
            },
        ],
        "expo-updates",
        "expo-background-task",
        [
            "expo-maps",
            {
                requestLocationPermission: true,
                locationPermission:
                    "Allow $(PRODUCT_NAME) to use your location",
            },
        ],
    ],
});
