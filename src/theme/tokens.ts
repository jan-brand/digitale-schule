// Source of truth: doc/design.md (Campus Design System 1.0).
// Do not invent new brand colors here — extend doc/design.md first.

export const brand = "#4C1D95";

export const palette = {
  light: {
    background: "#F8F7FC",
    surface: "#FFFFFF",
    text: "#1A1028",
    action: "#4C1D95",
  },
  dark: {
    background: "#120C1D",
    surface: "#1D152A",
    text: "#F7F3FF",
    action: "#A78BFA",
  },
} as const;

export type ColorScheme = keyof typeof palette;

export const radius = {
  card: 12,
} as const;

// Base spacing unit per doc/design.md; derive a small scale from it.
const baseSpacing = 4;
export const spacing = {
  xs: baseSpacing, // 4
  sm: baseSpacing * 2, // 8
  md: baseSpacing * 4, // 16
  lg: baseSpacing * 6, // 24
  xl: baseSpacing * 8, // 32
} as const;
