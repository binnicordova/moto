import type {Ride} from "@/atoms/store";

export function isRideActive(status: Ride["status"]): boolean {
    return (
        status === "pending" ||
        status === "accepted" ||
        status === "in_progress"
    );
}

export function isRideFinished(status: Ride["status"]): boolean {
    return (
        status === "completed" ||
        status === "client_canceled" ||
        status === "driver_canceled"
    );
}
