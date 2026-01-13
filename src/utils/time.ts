export const getFormattedTime = (
    createdAt: {toDate?: () => Date} | Date | number | string | null
) => {
    if (!createdAt) return "";
    // Handle both Firestore Timestamp and regular Date/string
    const date =
        typeof (createdAt as {toDate?: () => Date}).toDate === "function"
            ? (createdAt as {toDate: () => Date}).toDate()
            : new Date(createdAt as Date | number | string);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 0) return "Recién solicitado";
    if (diffInSeconds < 60) return "Hace menos de 1 min";
    const minutes = Math.floor(diffInSeconds / 60);
    return `Hace ${minutes} min`;
};
