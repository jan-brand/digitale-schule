import { palette, radius, spacing, brand, ColorScheme } from "./tokens";

export type ThemeMode = "system" | "light" | "dark";

export interface Theme {
  scheme: ColorScheme;
  colors: (typeof palette)["light" | "dark"];
  radius: typeof radius;
  spacing: typeof spacing;
  brand: typeof brand;
}

export function resolveTheme(scheme: ColorScheme): Theme {
  return {
    scheme,
    colors: palette[scheme],
    radius,
    spacing,
    brand,
  };
}

export * from "./tokens";
