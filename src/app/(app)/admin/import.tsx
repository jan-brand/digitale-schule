import { useState } from "react";
import { View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { useTheme } from "@/providers/ThemeProvider";
import { parseCsvImport } from "@/features/identity/csv";
import {
  ImportJobRow,
  confirmAndProcessCsvImport,
  listImportJobRows,
  stageCsvImport,
} from "@/features/identity/adminApi";

// CSV import (M5 part 2): paste CSV text (header row:
// first_name,last_name,role_code,class_name — class_name optional) ->
// validate+preview -> confirm. Uses a paste field rather than a native
// file picker for now — no new native dependency added without a way
// to verify it actually works on a real device/simulator in this
// environment; the backend only ever sees parsed rows either way, so a
// real file picker can replace this later with no backend changes.
export default function AdminImportScreen() {
  const { theme } = useTheme();
  const [csvText, setCsvText] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [rows, setRows] = useState<ImportJobRow[]>([]);
  const [staging, setStaging] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleValidate() {
    setParseError(null);
    setResult(null);
    setStaging(true);
    try {
      const parsed = parseCsvImport(csvText);
      const newJobId = await stageCsvImport(parsed, "CSV-Import über die Benutzerverwaltung");
      setJobId(newJobId);
      setRows(await listImportJobRows(newJobId));
    } catch {
      setParseError(
        "CSV konnte nicht gelesen werden. Erwartete Spalten: first_name,last_name,role_code,class_name (optional).",
      );
    } finally {
      setStaging(false);
    }
  }

  async function handleConfirm() {
    if (!jobId) return;
    setConfirming(true);
    setResult(null);
    try {
      const outcome = await confirmAndProcessCsvImport(jobId);
      setResult(`Import abgeschlossen: ${outcome.imported} erfolgreich, ${outcome.failed} fehlgeschlagen.`);
      setRows(await listImportJobRows(jobId));
    } catch {
      setResult("Import konnte nicht ausgeführt werden. Bitte Berechtigung prüfen.");
    } finally {
      setConfirming(false);
    }
  }

  const errorRows = rows.filter((r) => r.validationState === "error");
  const validRows = rows.filter((r) => r.validationState === "valid" || r.validationState === "imported");
  const canConfirm = jobId !== null && validRows.length > 0 && rows.every((r) => r.validationState !== "pending");

  return (
    <Screen scroll title="CSV-Import">
      <Text variant="title">CSV-Benutzerimport</Text>
      <Text variant="caption" style={{ marginTop: theme.spacing.xs }}>
        Spalten: first_name,last_name,role_code,class_name (class_name optional). Keine Passwörter
        in der Datei.
      </Text>

      <Card style={{ marginTop: theme.spacing.lg }}>
        <Input
          label="CSV-Inhalt einfügen"
          value={csvText}
          onChangeText={setCsvText}
          multiline
          style={{ minHeight: 120 }}
        />
        <View style={{ marginTop: theme.spacing.sm }}>
          <Button
            label="Prüfen und Vorschau anzeigen"
            onPress={handleValidate}
            loading={staging}
            disabled={!csvText.trim()}
          />
        </View>
        {parseError ? (
          <Text style={{ color: "#D92D20", marginTop: theme.spacing.sm }}>{parseError}</Text>
        ) : null}
      </Card>

      {rows.length > 0 ? (
        <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
          <Text variant="body">
            Vorschau: {validRows.length} gültig, {errorRows.length} fehlerhaft
          </Text>
          {rows.map((row) => (
            <Card key={row.rowNumber}>
              <Text>
                Zeile {row.rowNumber}: {row.rowData.first_name} {row.rowData.last_name} (
                {row.rowData.role_code}
                {row.rowData.class_name ? `, ${row.rowData.class_name}` : ""})
              </Text>
              <Text variant="caption" style={row.validationState === "error" ? { color: "#D92D20" } : undefined}>
                {row.validationState === "error" ? `Fehler: ${row.errorCode}` : row.validationState}
              </Text>
            </Card>
          ))}
          <Button
            label={`Import bestätigen (${validRows.length} Konten anlegen)`}
            onPress={handleConfirm}
            loading={confirming}
            disabled={!canConfirm}
          />
          {result ? <Text variant="caption">{result}</Text> : null}
        </View>
      ) : null}
    </Screen>
  );
}
