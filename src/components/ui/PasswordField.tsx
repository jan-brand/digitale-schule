import { useState } from "react";
import { Pressable, TextInputProps, View } from "react-native";
import { Input } from "./Input";
import { Text } from "./Text";
import { useTheme } from "@/providers/ThemeProvider";

interface PasswordFieldProps extends Omit<TextInputProps, "secureTextEntry"> {
  label: string;
  errorMessage?: string;
}

// SCR-01 (doc/UI_UX_SPECIFICATION.md §5) explicitly requires an
// "Anzeigen/Verbergen" toggle on the login password field — Input alone
// only supports a fixed secureTextEntry.
export function PasswordField({ label, errorMessage, ...rest }: PasswordFieldProps) {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);

  return (
    <View>
      <Input label={label} secureTextEntry={!visible} errorMessage={errorMessage} {...rest} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={visible ? "Passwort verbergen" : "Passwort anzeigen"}
        onPress={() => setVisible((v) => !v)}
        style={{ alignSelf: "flex-end", marginTop: theme.spacing.xs }}
      >
        <Text variant="caption" style={{ color: theme.colors.action }}>
          {visible ? "Verbergen" : "Anzeigen"}
        </Text>
      </Pressable>
    </View>
  );
}
