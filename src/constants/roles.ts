export const ROLES = {
    CLIENT: "client",
    DRIVER: "driver",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
