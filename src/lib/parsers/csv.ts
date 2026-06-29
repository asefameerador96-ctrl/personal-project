import { parse } from "csv-parse/sync";

export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
  row_count: number;
  column_count: number;
}

export function parseCsv(text: string): ParsedCsv {
  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  }) as Record<string, string>[];

  const headers = records.length > 0 ? Object.keys(records[0]) : [];

  const normalized = headers.map((h) =>
    h.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")
  );

  const rows = records.map((row) => {
    const clean: Record<string, string> = {};
    headers.forEach((original, i) => {
      clean[normalized[i]] = row[original];
    });
    return clean;
  });

  return {
    headers: normalized,
    rows,
    row_count: rows.length,
    column_count: normalized.length,
  };
}
