import AsyncStorage from "@react-native-async-storage/async-storage";
import {atom} from "jotai";
import {atomWithStorage, createJSONStorage} from "jotai/utils";

import {ROLES, type Role} from "@/constants/roles";

export type UserRole = Role | null;

export interface SimplifiedUser {
    uid: string;
}

export interface Location {
    latitude: number;
    longitude: number;
}

export interface Ride {
    id: string;
    status:
        | "pending"
        | "accepted"
        | "in_progress"
        | "completed"
        | "client_canceled"
        | "driver_canceled";
    origin: Location;
    destination?: Location;
    destinationAddress?: string;
    driverId?: string;
    driverLocation?: Location & {heading?: number};
    clientLocation?: Location;
    clientId: string;
    polyline?: Location[];
    createdAt?: {toDate: () => Date} | Date | number | string | null;
}

const storage = createJSONStorage<UserRole>(() => AsyncStorage);
const sessionStorage = createJSONStorage<SimplifiedUser | null>(
    () => AsyncStorage
);
const rideStorage = createJSONStorage<Ride | null>(() => AsyncStorage);
const onlineStorage = createJSONStorage<boolean>(() => AsyncStorage);

export const userAtom = atomWithStorage<SimplifiedUser | null>(
    "moto_user_identity",
    null,
    sessionStorage
);

export const roleAtom = atomWithStorage<UserRole>(
    "moto_user_role",
    ROLES.CLIENT,
    storage
);

export const driverOnlineAtom = atomWithStorage<boolean>(
    "moto_driver_online",
    false,
    onlineStorage
);

export const locationAtom = atom<Location | null>(null);

export const activeRideAtom = atomWithStorage<Ride | null>(
    "moto_active_ride",
    null,
    rideStorage
);
