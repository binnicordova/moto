export function getDistanceInMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
) {
    var R = 6371000; // Radius of the earth in meters
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) *
            Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export function getFormattedDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
) {
    const distanceInMeters = getDistanceInMeters(lat1, lon1, lat2, lon2);

    if (distanceInMeters < 1000) {
        return {value: Math.round(distanceInMeters), unit: "m"};
    }
    return {
        value: Number.parseFloat((distanceInMeters / 1000).toFixed(2)),
        unit: "km",
    };
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
}
