import {useRouter} from "expo-router";
import {useAtom} from "jotai";
import {
    Alert,
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {roleAtom} from "@/atoms/store";
import {Button} from "@/components/Button/Button";
import {WHATSAPP_ACTIVATION_URL, WHATSAPP_SUPPORT_URL} from "@/constants/env";
import {STRINGS} from "@/constants/strings";
import {remoteConfigService} from "@/services/remoteConfig";
import {getDeviceId} from "@/utils/device";

export default function RoleSelector() {
    const [, setRole] = useAtom(roleAtom);
    const router = useRouter();

    const handleSelectRole = async (role: "client" | "driver") => {
        if (role === "driver") {
            const isAuthorized = await remoteConfigService.isDriverAuthorized();
            if (!isAuthorized) {
                const deviceId = await getDeviceId();
                Alert.alert(
                    STRINGS.roleSelector.activationRequired,
                    STRINGS.roleSelector.activationMessage,
                    [
                        {text: STRINGS.common.cancel, style: "cancel"},
                        {
                            text: STRINGS.roleSelector.activateAccount,
                            onPress: () =>
                                Linking.openURL(
                                    `${WHATSAPP_ACTIVATION_URL}+${deviceId}`
                                ),
                        },
                    ]
                );
                return;
            }
        }

        setRole(role);
        if (role === "client") {
            router.replace("/client/home");
        } else {
            router.replace("/driver/dashboard");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{STRINGS.roleSelector.title}</Text>

            <TouchableOpacity
                style={[styles.card, {backgroundColor: "#e0f7fa"}]}
                onPress={() => handleSelectRole("client")}
            >
                <Text style={styles.cardText}>
                    {STRINGS.roleSelector.client}
                </Text>
                <Text style={styles.subText}>
                    {STRINGS.roleSelector.clientSub}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.card, {backgroundColor: "#fff3e0"}]}
                onPress={() => handleSelectRole("driver")}
            >
                <Text style={styles.cardText}>
                    {STRINGS.roleSelector.driver}
                </Text>
                <Text style={styles.subText}>
                    {STRINGS.roleSelector.driverSub}
                </Text>
            </TouchableOpacity>

            <View style={{marginTop: 20}}>
                <Button
                    title={STRINGS.ride.support}
                    variant="text"
                    onPress={() => Linking.openURL(WHATSAPP_SUPPORT_URL)}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        padding: 20,
        backgroundColor: "#fff",
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 40,
    },
    card: {
        padding: 30,
        marginBottom: 20,
        alignItems: "center",
        borderRadius: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardText: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 8,
    },
    subText: {
        fontSize: 14,
        color: "#666",
    },
});
