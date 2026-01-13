import {useEffect, useState} from "react";
import {StyleSheet, Text, View} from "react-native";
import {Marker} from "react-native-maps";
import {Icon} from "@/components/Icon/Icon";

interface BaseMarkerProps {
    coordinate: {latitude: number; longitude: number; heading?: number};
    title?: string;
}

const useTracksViewChanges = () => {
    const [tracksViewChanges, setTracksViewChanges] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setTracksViewChanges(false);
        }, 100); // Give time for icon font to render
        return () => clearTimeout(timer);
    }, []);

    return tracksViewChanges;
};

export const PickupMarker = ({
    coordinate,
    title = "Punto de Recogida",
}: BaseMarkerProps) => {
    const tracksViewChanges = useTracksViewChanges();
    return (
        <Marker
            coordinate={coordinate}
            title={title}
            anchor={{x: 0.5, y: 1.0}}
            tracksViewChanges={tracksViewChanges}
        >
            <View style={styles.pickupContainer}>
                <Icon name="map-marker" size={36} color="white" />
            </View>
        </Marker>
    );
};

export const DriverMarker = ({coordinate}: BaseMarkerProps) => {
    const tracksViewChanges = useTracksViewChanges();
    // Use native rotation prop for better performance on Android
    // instead of transforming the View
    return (
        <Marker
            coordinate={coordinate}
            title="Conductor"
            anchor={{x: 0.5, y: 0.5}}
            rotation={coordinate.heading || 0}
            flat={false} // Ensure it stays upright (billboard) but rotated by heading
            tracksViewChanges={tracksViewChanges}
        >
            <View>
                <Icon name="rickshaw" size={36} color="#1E88E5" />
            </View>
        </Marker>
    );
};

export const ClientMarker = ({coordinate}: BaseMarkerProps) => {
    const tracksViewChanges = useTracksViewChanges();
    return (
        <Marker
            coordinate={coordinate}
            title="Cliente"
            anchor={{x: 0.5, y: 0.5}}
            tracksViewChanges={tracksViewChanges}
        >
            <View style={styles.clientContainer}>
                <Icon name="account" size={24} color="white" />
            </View>
        </Marker>
    );
};

export const CenterMarker = () => {
    return (
        <View style={styles.centerMarker} pointerEvents="none">
            <View style={styles.markerTitleContainer}>
                <Text style={styles.markerTitle}>Ubicación de partida</Text>
            </View>
            <Icon name="map-marker" size={48} color="red" />
        </View>
    );
};

const styles = StyleSheet.create({
    centerMarker: {
        position: "absolute",
        top: "50%",
        left: "50%",
        marginTop: -48, // Adjust based on icon size/anchor
        marginLeft: -24,
        zIndex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    markerTitleContainer: {
        position: "absolute",
        bottom: 52, // Place above the icon with some spacing
        backgroundColor: "white",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        minWidth: 100,
        alignItems: "center",
    },
    markerTitle: {
        fontWeight: "bold",
        fontSize: 14,
        color: "#333",
    },
    pickupContainer: {
        backgroundColor: "#D32F2F",
        padding: 8,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: "white",
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        // Removed marginBottom hack for Android compatibility
        // Rely on anchor {{ x: 0.5, y: 1.0 }} which puts the bottom of this view at the coord
    },
    clientContainer: {
        backgroundColor: "#2196F3",
        padding: 6,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: "white",
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
});
