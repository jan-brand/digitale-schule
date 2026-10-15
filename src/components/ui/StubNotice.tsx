import React from "react";
import { Text } from "./Text";

// Marks a screen as not-yet-implemented so nobody mistakes an F0 route stub
// for a finished feature (see doc/PROJECT_PLAN.md: "Keine Platzhalter so
// darstellen, als wäre eine Funktion fertig.").
export function StubNotice({ screen }: { screen: string }) {
  return <Text variant="caption">{screen} – Platzhalter, wird in einer späteren Phase implementiert.</Text>;
}
