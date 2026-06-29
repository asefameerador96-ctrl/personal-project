type PdfData = { text: string; numpages: number; info: Record<string, string> };

async function loadPdfParse() {
  const mod = await import("pdf-parse");
  return (mod.default || mod) as unknown as (buf: Buffer) => Promise<PdfData>;
}

export interface ParsedDocument {
  text: string;
  pages: number;
  metadata: Record<string, string>;
  structured: Record<string, unknown>;
}

export async function parsePdf(buffer: Buffer): Promise<ParsedDocument> {
  const pdfParse = await loadPdfParse();
  const data = await pdfParse(buffer);

  const structured = extractStructuredData(data.text);

  return {
    text: data.text,
    pages: data.numpages,
    metadata: {
      title: data.info?.Title || "",
      author: data.info?.Author || "",
      creator: data.info?.Creator || "",
    },
    structured,
  };
}

function extractStructuredData(text: string): Record<string, unknown> {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const result: Record<string, unknown> = {};

  const datePattern = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/g;
  const amountPattern = /\$?\d{1,3}(?:,\d{3})*(?:\.\d{2})\b/g;
  const emailPattern = /[\w.-]+@[\w.-]+\.\w+/g;
  const invoiceNumPattern = /(?:invoice|inv|bill|receipt)\s*(?:#|no\.?|number)?\s*[:\s]?\s*([A-Z0-9\-]+)/i;

  const dates = text.match(datePattern) || [];
  const amounts = text.match(amountPattern) || [];
  const emails = text.match(emailPattern) || [];
  const invoiceMatch = text.match(invoiceNumPattern);

  if (dates.length) result.dates = [...new Set(dates)];
  if (amounts.length) result.amounts = [...new Set(amounts)];
  if (emails.length) result.emails = [...new Set(emails)];
  if (invoiceMatch) result.invoice_number = invoiceMatch[1];

  result.line_count = lines.length;

  const keyValuePairs: Record<string, string> = {};
  for (const line of lines) {
    const kvMatch = line.match(/^([A-Za-z\s]{2,30}):\s*(.+)$/);
    if (kvMatch) {
      const key = kvMatch[1].trim().toLowerCase().replace(/\s+/g, "_");
      keyValuePairs[key] = kvMatch[2].trim();
    }
  }
  if (Object.keys(keyValuePairs).length > 0) result.fields = keyValuePairs;

  return result;
}
