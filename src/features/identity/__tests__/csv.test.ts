import { parseCsvImport } from "../csv";

describe("parseCsvImport", () => {
  it("parses a simple batch with and without class_name", () => {
    const rows = parseCsvImport(
      "first_name,last_name,role_code,class_name\n" +
        "Lena,Beispiel,student,10a\n" +
        "Jan,Lehrer,teacher,",
    );
    expect(rows).toEqual([
      { first_name: "Lena", last_name: "Beispiel", role_code: "student", class_name: "10a" },
      { first_name: "Jan", last_name: "Lehrer", role_code: "teacher" },
    ]);
  });

  it("handles quoted fields containing commas", () => {
    const rows = parseCsvImport('first_name,last_name,role_code\n"Lena, Marie",Beispiel,student');
    expect(rows[0].first_name).toBe("Lena, Marie");
  });

  it("handles an escaped quote inside a quoted field", () => {
    const rows = parseCsvImport('first_name,last_name,role_code\n"Ann""a",Beispiel,student');
    expect(rows[0].first_name).toBe('Ann"a');
  });

  it("ignores column order and works with class_name omitted entirely", () => {
    const rows = parseCsvImport("role_code,first_name,last_name\nstudent,Lena,Beispiel");
    expect(rows).toEqual([{ first_name: "Lena", last_name: "Beispiel", role_code: "student" }]);
  });

  it("throws if a required column is missing", () => {
    expect(() => parseCsvImport("first_name,last_name\nLena,Beispiel")).toThrow(
      "csv_missing_required_columns",
    );
  });

  it("returns an empty array for empty input", () => {
    expect(parseCsvImport("")).toEqual([]);
  });

  it("skips blank lines", () => {
    const rows = parseCsvImport("first_name,last_name,role_code\n\nLena,Beispiel,student\n\n");
    expect(rows).toHaveLength(1);
  });
});
