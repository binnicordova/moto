import React, {forwardRef} from "react";
import MapView, {
    MapViewProps,
    PROVIDER_GOOGLE,
    PROVIDER_DEFAULT,
} from "react-native-maps";
import {Platform} from "react-native";
import {styles} from "./Map.styles";

export type MapProps = MapViewProps;

export const Map = forwardRef<MapView, MapProps>((props, ref) => {
    return (
        <MapView
            ref={ref}
            provider={
                Platform.OS === "android" ? PROVIDER_GOOGLE : PROVIDER_DEFAULT
            }
            style={[styles.map, props.style]}
            showsUserLocation
            showsMyLocationButton={false}
            {...props}
        />
    );
});
