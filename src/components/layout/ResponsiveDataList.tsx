import React from "react";
import { View, useWindowDimensions } from "react-native";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Text } from "@/components/ui/Text";
import { useTheme } from "@/providers/ThemeProvider";

export interface DataListColumn<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
}

interface ResponsiveDataListProps<T> {
  columns: DataListColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyMessage: string;
  /** Rendered after the row's columns, both in table and card mode —
   * typically row actions (buttons). */
  renderActions?: (row: T) => React.ReactNode;
}

const TABLE_BREAKPOINT = 768;

// doc/UI_UX_SPECIFICATION.md §8/§16.4 (UX-DEC-10): "Desktop: Tabellen
// mit Suche, Filtern und Sortierung. Smartphone: adaptive Kartenlisten."
// Search/filter/sort aren't built here yet (none of the current call
// sites need them) — this covers the table-vs-card layout switch, which
// is the part every admin list screen needs regardless.
export function ResponsiveDataList<T>({
  columns,
  rows,
  rowKey,
  emptyMessage,
  renderActions,
}: ResponsiveDataListProps<T>) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isTable = width >= TABLE_BREAKPOINT;

  if (rows.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  if (isTable) {
    return (
      <View>
        <View style={{ flexDirection: "row", paddingVertical: theme.spacing.xs }}>
          {columns.map((col) => (
            <Text key={col.key} variant="caption" style={{ flex: 1, fontWeight: "600" }}>
              {col.header}
            </Text>
          ))}
          {renderActions ? <View style={{ minWidth: 220 }} /> : null}
        </View>
        {rows.map((row) => (
          <View
            key={rowKey(row)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: theme.spacing.sm,
              borderTopWidth: 1,
              borderTopColor: theme.colors.accent,
            }}
          >
            {columns.map((col) => (
              <View key={col.key} style={{ flex: 1 }}>
                {col.render(row)}
              </View>
            ))}
            {renderActions ? (
              <View style={{ minWidth: 220, flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.xs, justifyContent: "flex-end" }}>
                {renderActions(row)}
              </View>
            ) : null}
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={{ gap: theme.spacing.sm }}>
      {rows.map((row) => (
        <Card key={rowKey(row)}>
          {columns.map((col) => (
            <View key={col.key} style={{ marginBottom: theme.spacing.xs }}>
              {col.render(row)}
            </View>
          ))}
          {renderActions ? (
            <View style={{ flexDirection: "row", gap: theme.spacing.xs, marginTop: theme.spacing.xs }}>
              {renderActions(row)}
            </View>
          ) : null}
        </Card>
      ))}
    </View>
  );
}
