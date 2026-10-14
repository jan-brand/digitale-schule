// Minimal CSV parser for the user-import format: a header row
// (first_name,last_name,role_code,class_name — class_name optional) plus
// one row per person. No external dependency; handles double-quoted
// fields (with "" as an escaped quote) since that's the one thing a
// naive comma-split gets wrong for real-world names/data.
//
// Deliberately NOT a general-purpose CSV library — if a row doesn't
// parse into the expected shape it is just passed through as-is and
// fn_stage_csv_import's own validation (required fields, allowed role)
// will reject it with a clear error code; this parser's only job is
// turning text into an array of plain objects.

export interface CsvImportRow {
  first_name: string;
  last_name: string;
  role_code: string;
  class_name?: string;
}

function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields.map((f) => f.trim());
}

export function parseCsvImport(text: string): CsvImportRow[] {
  const lines = text
    .split(/\r\n|\n|\r/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return [];
  }

  const header = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const firstNameIdx = header.indexOf("first_name");
  const lastNameIdx = header.indexOf("last_name");
  const roleCodeIdx = header.indexOf("role_code");
  const classNameIdx = header.indexOf("class_name");

  if (firstNameIdx === -1 || lastNameIdx === -1 || roleCodeIdx === -1) {
    throw new Error("csv_missing_required_columns");
  }

  return lines.slice(1).map((line) => {
    const fields = splitCsvLine(line);
    const row: CsvImportRow = {
      first_name: fields[firstNameIdx] ?? "",
      last_name: fields[lastNameIdx] ?? "",
      role_code: fields[roleCodeIdx] ?? "",
    };
    if (classNameIdx !== -1 && fields[classNameIdx]) {
      row.class_name = fields[classNameIdx];
    }
    return row;
  });
}
