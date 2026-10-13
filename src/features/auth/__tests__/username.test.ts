import { normalizeUsername, normalizeSchoolSlug, isValidLoginInput } from "../username";

describe("normalizeUsername", () => {
  it("trims and lowercases", () => {
    expect(normalizeUsername("  MMueller ")).toBe("mmueller");
  });
});

describe("normalizeSchoolSlug", () => {
  it("trims and lowercases", () => {
    expect(normalizeSchoolSlug(" Demo-A ")).toBe("demo-a");
  });
});

describe("isValidLoginInput", () => {
  it("rejects empty fields", () => {
    expect(isValidLoginInput("", "mmueller", "pw")).toBe(false);
    expect(isValidLoginInput("demo-a", "", "pw")).toBe(false);
    expect(isValidLoginInput("demo-a", "mmueller", "")).toBe(false);
  });

  it("accepts all fields present", () => {
    expect(isValidLoginInput("demo-a", "mmueller", "pw")).toBe(true);
  });

  it("whitespace-only fields still count as empty", () => {
    expect(isValidLoginInput("   ", "mmueller", "pw")).toBe(false);
  });
});
