import type {Meta, StoryObj} from "@storybook/react";
import {View} from "react-native";
import {Map} from "./Map";

const meta = {
    title: "Map",
    component: Map,
    decorators: [
        (Story) => (
            <View style={{flex: 1, minHeight: 400}}>
                <Story />
            </View>
        ),
    ],
} satisfies Meta<typeof Map>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        initialRegion: {
            latitude: 37.78825,
            longitude: -122.4324,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
        },
    },
};
