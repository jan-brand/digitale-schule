import { resolveTheme } from "@/theme";

describe("resolveTheme", () => {
  it("resolves the light palette from doc/design.md", () => {
    const theme = resolveTheme("light");
    expect(theme.colors.background).toBe("#F8F7FC");
    expect(theme.colors.action).toBe("#4C1D95");
  });

  it("resolves the dark palette from doc/design.md", () => {
    const theme = resolveTheme("dark");
    expect(theme.colors.background).toBe("#120C1D");
    expect(theme.colors.action).toBe("#A78BFA");
  });

  it("uses the Campus Purple card radius and base spacing everywhere", () => {
    const theme = resolveTheme("light");
    expect(theme.radius.card).toBe(12);
    expect(theme.spacing.xs).toBe(4);
  });
});
