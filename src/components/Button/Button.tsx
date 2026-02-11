import {
    type ButtonProps as RNButtonProps,
    Text,
    TouchableOpacity,
    type ViewStyle,
} from "react-native";
import {theme} from "@/theme/colors";
import {styles} from "./Button.styles";

export type ButtonVariant =
    | "primary"
    | "secondary"
    | "danger"
    | "outline"
    | "text"
    | "fill";

export type ButtonProps = RNButtonProps & {
    variant?: ButtonVariant;
    style?: ViewStyle | ViewStyle[];
    onLongPress?: () => void;
};

export const Button = ({
    title,
    onPress,
    onLongPress,
    disabled,
    variant = "primary",
    style,
    ...props
}: ButtonProps) => {
    const {background, accent, error, darkness} = theme();

    let backgroundColor: string = accent;
    let contentColor: string = background;
    let borderColor = "transparent";
    let borderWidth = 0;

    switch (variant) {
        case "danger":
            backgroundColor = error;
            break;
        case "secondary":
            backgroundColor = darkness;
            break;
        case "outline":
            backgroundColor = "transparent";
            contentColor = accent;
            borderColor = accent;
            borderWidth = 2;
            break;
        case "text":
            backgroundColor = "transparent";
            contentColor = accent;
            break;
        default:
            backgroundColor = accent;
            contentColor = background;
            break;
    }

    return (
        <TouchableOpacity
            {...props}
            style={[
                styles.container,
                {backgroundColor, borderColor, borderWidth},
                disabled && styles.disabled,
                style,
            ]}
            onPress={disabled ? undefined : onPress}
            onLongPress={disabled ? undefined: onLongPress}
            disabled={disabled}
        >
            <Text style={[styles.text, {color: contentColor}]}>{title}</Text>
        </TouchableOpacity>
    );
};
