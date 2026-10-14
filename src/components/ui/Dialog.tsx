import { Modal, Pressable, View } from "react-native";
import { Text } from "./Text";
import { useTheme } from "@/providers/ThemeProvider";

interface DialogProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

// Generic dialog shell (doc/UI_UX_SPECIFICATION.md §8/§16.3: "kurze,
// begrenzte Aktion... Fokusführung, Escape/Schließen, Screenreader-
// Titel"). RN's Modal already traps focus and maps the hardware
// back-button/Escape to onRequestClose on the platforms that have one;
// web gets a click-outside-to-close backdrop here as the equivalent.
export function Dialog({ visible, title, onClose, children }: DialogProps) {
  const { theme } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        accessibilityLabel="Schließen"
        onPress={onClose}
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", alignItems: "center" }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.card,
            padding: theme.spacing.lg,
            minWidth: 280,
            maxWidth: 480,
          }}
        >
          <Text variant="title" accessibilityRole="header">
            {title}
          </Text>
          <View style={{ marginTop: theme.spacing.md }}>{children}</View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
