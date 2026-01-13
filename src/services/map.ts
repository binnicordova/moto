export interface LatLng {
    latitude: number;
    longitude: number;
}

export const getRoutePolyline = async (
    start: LatLng,
    end: LatLng
): Promise<LatLng[]> => {
    try {
        // Using OSRM (Open Source Routing Machine) public demo server
        // NOTE: For production, you should host your own OSRM instance or use Google Directions API / Mapbox
        const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson`
        );

        const json = await response.json();

        if (json.routes && json.routes.length > 0) {
            const coordinates = json.routes[0].geometry.coordinates;
            return coordinates.map((coord: number[]) => ({
                latitude: coord[1],
                longitude: coord[0],
            }));
        }

        return [];
    } catch (error) {
        console.error("Error fetching route:", error);
        return [];
    }
};
