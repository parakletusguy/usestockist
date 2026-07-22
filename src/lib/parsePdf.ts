/**
 * parsePdfSalesReport
 *
 * Extracts item rows from a Reach POS PDF report using PDF.js (pdfjs-dist).
 * Works entirely in the browser — no backend needed.
 *
 * Strategy:
 *  1. Load all pages and extract raw text items with their x/y positions.
 *  2. Cluster text items into logical lines by y-coordinate proximity.
 *  3. Scan each line for a pattern: item name (text) + quantity (number).
 *  4. Return an array of { item_name, quantity } rows for user review.
 */

import * as pdfjsLib from 'pdfjs-dist';

// Point the worker at the bundled worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

export interface ParsedPdfRow {
  item_name: string;
  quantity: number;
  raw_line: string;
}

interface TextItem {
  str: string;
  x: number;
  y: number;
}

/** Round y to nearest 2pt bucket so items on the same line cluster together */
const bucket = (y: number) => Math.round(y / 2) * 2;

/**
 * Extract all text items with their approximate page coordinates.
 */
async function extractTextItems(pdfData: ArrayBuffer): Promise<TextItem[]> {
  const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
  const allItems: TextItem[] = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();

    for (const item of content.items) {
      if (!('str' in item)) continue;
      const str = (item as any).str as string;
      if (!str.trim()) continue;
      const [, , , , x, y] = (item as any).transform as number[];
      allItems.push({ str: str.trim(), x, y });
    }
  }

  return allItems;
}

/**
 * Group text items into lines sorted top-to-bottom, left-to-right.
 */
function groupIntoLines(items: TextItem[]): string[][] {
  // Group by y-bucket
  const byY = new Map<number, TextItem[]>();
  for (const item of items) {
    const key = bucket(item.y);
    const arr = byY.get(key) ?? [];
    arr.push(item);
    byY.set(key, arr);
  }

  // Sort y keys descending (PDF y increases upward)
  const sortedY = [...byY.keys()].sort((a, b) => b - a);

  return sortedY.map(y =>
    (byY.get(y) ?? [])
      .sort((a, b) => a.x - b.x)
      .map(i => i.str)
  );
}

/**
 * Determine whether a token looks like a valid quantity number.
 * Accepts integers and decimals; ignores pure dates or prices with $ prefix.
 */
function isQuantity(token: string): boolean {
  if (token.startsWith('$')) return false;
  // Match e.g. "12", "1.5", "100.00" but not "12/07/2026"
  return /^\d+(\.\d+)?$/.test(token) && !token.includes('/');
}

/**
 * Skip header / footer / summary lines that aren't stock rows.
 */
function isSkipLine(line: string[]): boolean {
  const joined = line.join(' ').toLowerCase();
  const skipPatterns = [
    'item', 'description', 'product', 'name', 'qty', 'quantity',
    'total', 'subtotal', 'grand', 'date', 'invoice', 'report',
    'page', 'tax', 'vat', 'discount', 'amount', 'price', 'unit',
    'sales report', 'reach', 'retail',
  ];
  return skipPatterns.some(p => joined.includes(p));
}

/**
 * Given a line of tokens, try to extract (item_name, quantity).
 *
 * Heuristic: The last numeric token that looks like a quantity IS the quantity;
 * everything before it (non-numeric tokens) forms the item name.
 */
function parseLineToRow(line: string[]): ParsedPdfRow | null {
  if (isSkipLine(line)) return null;

  const raw_line = line.join(' ');

  // Find rightmost quantity-like token
  let qtyIndex = -1;
  for (let i = line.length - 1; i >= 0; i--) {
    if (isQuantity(line[i])) {
      qtyIndex = i;
      break;
    }
  }

  if (qtyIndex <= 0) return null; // Need at least one name token before qty

  const nameParts = line.slice(0, qtyIndex).filter(t => !/^\$/.test(t));
  const item_name = nameParts.join(' ').trim();
  const quantity = parseFloat(line[qtyIndex]);

  if (!item_name || isNaN(quantity) || quantity <= 0) return null;

  // Skip implausible quantities (e.g. year numbers)
  if (quantity > 10000) return null;

  return { item_name, quantity, raw_line };
}

/**
 * Main export: parse a PDF File object and return extracted rows.
 */
export async function parsePdfSalesReport(file: File): Promise<ParsedPdfRow[]> {
  const buffer = await file.arrayBuffer();
  const items = await extractTextItems(buffer);
  const lines = groupIntoLines(items);

  const rows: ParsedPdfRow[] = [];
  for (const line of lines) {
    if (line.length < 2) continue;
    const row = parseLineToRow(line);
    if (row) rows.push(row);
  }

  // Deduplicate by item name (sum quantities if same item appears multiple times)
  const merged = new Map<string, ParsedPdfRow>();
  for (const row of rows) {
    const key = row.item_name.toLowerCase();
    if (merged.has(key)) {
      merged.get(key)!.quantity += row.quantity;
    } else {
      merged.set(key, { ...row });
    }
  }

  return [...merged.values()];
}
