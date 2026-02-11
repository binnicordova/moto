import {atom} from "jotai";
import {ROLES} from "@/constants/roles";
import {ROUTES} from "@/constants/routes";
import {remoteConfigService} from "@/services/remoteConfig";
import {getDeviceId} from "@/utils/device";
import {isRideActive} from "@/utils/ride";
import {activeRideAtom, roleAtom, userAtom} from "./store";

export const initializeAppAtom = atom(null, async (get, set) => {
    let user = await get(userAtom);
    if (!user) {
        const uid = await getDeviceId();
        user = {uid};
        set(userAtom, user);
    }

    const isAuthorized = await remoteConfigService.isDriverAuthorized();
    const targetRole = isAuthorized ? ROLES.DRIVER : ROLES.CLIENT;

    const currentRole = await get(roleAtom);
    if (currentRole !== targetRole) {
        set(roleAtom, targetRole);
    }

    const activeRide = await get(activeRideAtom);
    const isActive = activeRide && isRideActive(activeRide.status);

    if (isActive) {
        if (targetRole === ROLES.CLIENT) return ROUTES.CLIENT.RIDE;
        if (targetRole === ROLES.DRIVER) return ROUTES.DRIVER.RIDE;
    }

    if (targetRole === ROLES.CLIENT) return ROUTES.CLIENT.HOME;
    return ROUTES.DRIVER.DASHBOARD;
});
