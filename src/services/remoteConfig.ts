import {getDefaultStore} from "jotai";
import {roleAtom} from "@/atoms/store";
import {getDeviceId} from "@/utils/device";

const CONFIG_DOCUMENT =
    "https://firebasestorage.googleapis.com/v0/b/mototaxia.firebasestorage.app/o/config%2Fconfig.json?alt=media&token=9a7cef53-aad0-4e9c-a018-7be04ee7fb41";

type ConfigData = {
    authorizedDrivers: string[];
};

export interface RemoteConfigService {
    isDriverAuthorized: () => Promise<boolean>;
}

export const remoteConfigService: RemoteConfigService = {
    isDriverAuthorized: async (): Promise<boolean> => {
        try {
            const deviceId = await getDeviceId();
            const response = await fetch(CONFIG_DOCUMENT);
            if (!response.ok) {
                console.error("Remote config fetch failed:", response.status);
                return false;
            }
            const configData: ConfigData = await response.json();
            const isAuthorized =
                configData.authorizedDrivers.includes(deviceId);

            // If user is not authorized as driver, automatically switch back to client role
            if (!isAuthorized) {
                const store = getDefaultStore();
                const currentRole = store.get(roleAtom);

                // Only switch if they're currently set as driver
                if (currentRole === "driver") {
                    store.set(roleAtom, "client");
                    console.log(
                        "User authorization revoked - switching to client role"
                    );
                }
            }

            return isAuthorized;
        } catch (error) {
            console.error("Error fetching remote config:", error);
            return false;
        }
    },
};
