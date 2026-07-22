/**
 * parsePdfSalesReport
 *
 * Browser-side parser for Reach POS PDF reports (Cash Reconciliation Report).
 * Uses pdfjs-dist with dynamic line clustering (Y-coordinate proximity) to handle
 * table columns and layout accurately.
 */

import * as pdfjsLib from 'pdfjs-dist';

// Point the worker at bundled worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

export interface ParsedPdfRow {
  item_name: string;
  quantity: number;
  unit_price: number;
  raw_line: string;
}

export interface ParsedPdfResult {
  rows: ParsedPdfRow[];
  retailMember?: string;
  reportDate?: string;
}

interface TextItem {
  str: string;
  x: number;
  y: number;
  page: number;
}

/** Extract raw text items with x, y, page from PDF buffer */
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
      allItems.push({ str: str.trim(), x, y, page: p });
    }
  }

  return allItems;
}

/** Group text items into lines using ±6pt Y-coordinate tolerance */
function groupItemsIntoLines(items: TextItem[]): TextItem[][] {
  // Process page by page
  const pages = new Map<number, TextItem[]>();
  for (const item of items) {
    const arr = pages.get(item.page) || [];
    arr.push(item);
    pages.set(item.page, arr);
  }

  const allLines: TextItem[][] = [];

  for (const [, pageItems] of pages.entries()) {
    // Sort page items by y descending (top to bottom)
    const sorted = [...pageItems].sort((a, b) => b.y - a.y);
    const pageLines: TextItem[][] = [];

    for (const item of sorted) {
      let matchedLine = pageLines.find(line => {
        const avgY = line.reduce((sum, i) => sum + i.y, 0) / line.length;
        return Math.abs(avgY - item.y) <= 6; // ±6pt tolerance
      });

      if (matchedLine) {
        matchedLine.push(item);
      } else {
        pageLines.push([item]);
      }
    }

    // Sort items within each line left-to-right by X
    for (const line of pageLines) {
      line.sort((a, b) => a.x - b.x);
      allLines.push(line);
    }
  }

  return allLines;
}

/** Clean currency symbols (₦, $, N) and commas from numbers */
function cleanNumber(str: string): number | null {
  const cleaned = str.replace(/[₦\$N\s]/gi, '').replace(/,/g, '').trim();
  if (!cleaned) return null;
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/** Check if token is a currency symbol */
function isCurrencySymbol(token: string): boolean {
  return /^[₦\$N]$/i.test(token.trim());
}

/** Lines to skip (headers, footers, total rows, summary sections) */
function isSkipLine(lineStr: string): boolean {
  const lower = lineStr.toLowerCase();
  const skipKeywords = [
    'cash reconciliation report',
    'box office',
    'username:',
    'date:',
    'time:',
    'sales',
    'refunds',
    'gross',
    'net',
    'price',
    'quantity',
    'value',
    'total',
    'subtotal',
    'ticket sales by price cards',
    'concession sales',
    'admin actions occurrences',
    'sales reconciliation',
    'no data found',
    'payment channel',
    'expected amount',
    'amount remitted',
    'variance',
    'card',
    'transfer',
    'ext. voucher',
  ];

  // If line contains any skip keyword or "total"
  if (lower.includes('total')) return true;
  if (skipKeywords.some(k => lower === k || lower.startsWith(k))) return true;

  return false;
}

/** Parse header text for Username (retail member) and Date */
function extractHeaderMetadata(allText: string): { retailMember?: string; reportDate?: string } {
  let retailMember: string | undefined;
  let reportDate: string | undefined;

  // Username: Chinenye Joy
  const userMatch = allText.match(/Username:\s*([A-Za-z0-9\s]+?)(?=\s*Date:|\s*Time:|\n|$)/i);
  if (userMatch && userMatch[1].trim()) {
    retailMember = userMatch[1].trim();
  }

  // Date: Wed Jul 22 2026 or 2026-07-22
  const dateMatch = allText.match(/Date:\s*([A-Za-z0-9\s,]+?)(?=\s*Time:|\n|$)/i);
  if (dateMatch && dateMatch[1].trim()) {
    try {
      const parsedDate = new Date(dateMatch[1].trim());
      if (!isNaN(parsedDate.getTime())) {
        const year = parsedDate.getFullYear();
        const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
        const day = String(parsedDate.getDate()).padStart(2, '0');
        reportDate = `${year}-${month}-${day}`;
      }
    } catch {
      // Keep date as is if parsing fails
    }
  }

  return { retailMember, reportDate };
}

/** Parse a single line into a row if it matches an item row structure */
function parseLineToRow(tokens: string[]): ParsedPdfRow | null {
  const lineStr = tokens.join(' ').trim();
  if (!lineStr || isSkipLine(lineStr)) return null;

  // Separate item name tokens from numeric/price tokens
  const nameTokens: string[] = [];
  const numTokens: number[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i].trim();
    if (!tok || isCurrencySymbol(tok)) continue;

    const num = cleanNumber(tok);
    // If token is purely numeric or price (e.g. 4,500 or 21)
    if (num !== null && /^[\d,₦\$N\.\s]+$/i.test(tok)) {
      numTokens.push(num);
    } else {
      // If we haven't encountered numeric columns yet, it's part of the item name
      if (numTokens.length === 0) {
        nameTokens.push(tok);
      }
    }
  }

  const itemName = nameTokens.join(' ').trim();
  if (!itemName || numTokens.length === 0) return null;

  // Reach POS table layout:
  // numTokens[0] = Price (e.g. 4500)
  // numTokens[1] = Sales Quantity (e.g. 21)
  // numTokens[2] = Sales Value (e.g. 94500)
  // If price is missing, first number is quantity
  let unit_price = 0;
  let quantity = 0;

  if (numTokens.length >= 2) {
    unit_price = numTokens[0];
    quantity = numTokens[1];
  } else if (numTokens.length === 1) {
    quantity = numTokens[0];
  }

  if (quantity <= 0 || quantity > 10000) return null;

  return {
    item_name: itemName,
    quantity,
    unit_price,
    raw_line: lineStr,
  };
}

/** Main exported function to parse a PDF file */
export async function parsePdfSalesReport(file: File): Promise<ParsedPdfResult> {
  const buffer = await file.arrayBuffer();
  const items = await extractTextItems(buffer);

  // Extract full text for header metadata
  const fullText = items.map(i => i.str).join(' ');
  const { retailMember, reportDate } = extractHeaderMetadata(fullText);

  // Group text items into lines
  const lines = groupItemsIntoLines(items);

  const rows: ParsedPdfRow[] = [];
  for (const lineItems of lines) {
    const tokens = lineItems.map(i => i.str);
    const row = parseLineToRow(tokens);
    if (row) rows.push(row);
  }

  // Deduplicate items by name (merge quantities if same item appears multiple times)
  const mergedMap = new Map<string, ParsedPdfRow>();
  for (const r of rows) {
    const key = r.item_name.toLowerCase();
    if (mergedMap.has(key)) {
      const existing = mergedMap.get(key)!;
      existing.quantity += r.quantity;
    } else {
      mergedMap.set(key, { ...r });
    }
  }

  return {
    rows: [...mergedMap.values()],
    retailMember,
    reportDate,
  };
}
