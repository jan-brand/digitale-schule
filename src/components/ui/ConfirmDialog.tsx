import { useState } from "react";
import { View } from "react-native";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { Input } from "./Input";
import { Text } from "./Text";
import { useTheme } from "@/providers/ThemeProvider";

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  /** When set, the dialog requires a typed reason before confirming —
   * for the critical, server-required-reason actions (role changes,
   * suspensions, etc. — doc/SECURITY_AUTH.md "Pflichtbegründung"). */
  requireReason?: boolean;
  destructive?: boolean;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
}

// doc/UI_UX_SPECIFICATION.md §16.3: "Kritische Rechteänderungen
// erfordern immer explizite Bestätigung... Ein Dialog allein ist keine
// Sicherheitskontrolle" — this only collects the reason/confirmation
// for the UI; every target server function re-validates and requires
// the reason itself regardless of what happens here.
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = "Bestätigen",
  requireReason = false,
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { theme } = useTheme();
  const [reason, setReason] = useState("");

  function handleConfirm() {
    onConfirm(requireReason ? reason : undefined);
    setReason("");
  }

  return (
    <Dialog visible={visible} title={title} onClose={onCancel}>
      <Text>{message}</Text>
      {requireReason ? (
        <View style={{ marginTop: theme.spacing.sm }}>
          <Input label="Begründung" value={reason} onChangeText={setReason} />
        </View>
      ) : null}
      <View style={{ flexDirection: "row", gap: theme.spacing.sm, marginTop: theme.spacing.lg }}>
        <Button label="Abbrechen" variant="secondary" onPress={onCancel} />
        <Button
          label={confirmLabel}
          onPress={handleConfirm}
          disabled={requireReason && reason.trim().length === 0}
          variant={destructive ? "danger" : "primary"}
        />
      </View>
    </Dialog>
  );
}
