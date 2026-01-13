import * as Application from "expo-application";
import {Platform} from "react-native";

export async function getDeviceId(): Promise<string> {
    let id: string | null = null;

    if (Platform.OS === "ios") {
        id = await Application.getIosIdForVendorAsync();
    } else if (Platform.OS === "android") {
        id = await Application.getAndroidId();
    }

    // Fallback if ID is null (e.g. web or simulator issues)
    return id || Math.random().toString(36).substring(2, 15);
}
