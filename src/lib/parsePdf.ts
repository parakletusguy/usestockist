/**
 * parsePdfSalesReport
 *
 * Browser-side parser for Reach POS PDF reports (Cash Reconciliation Report).
 * Uses pdfjs-dist with dynamic line clustering (Y-coordinate proximity) to handle
 * table columns and layout accurately.
 *
 * Separates Physical Inventory Items from Non-Inventory Ticket Sales.
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
  ticketRows: ParsedPdfRow[];
  totalTicketRevenue: number;
  totalTicketQuantity: number;
  retailMember?: string;
  reportDate?: string;
}

interface TextItem {
  str: string;
  x: number;
  y: number;
  page: number;
}

/** Check if item name is a cinema ticket / seat / admission product (non-inventory) */
export function isTicketItem(name: string): boolean {
  if (!name) return false;
  const lower = name.toLowerCase().trim();
  return (
    lower.includes('ticket') ||
    lower.includes('seat') ||
    lower.includes('access') ||
    lower.includes('signat') ||
    lower.includes('signatr') ||
    lower.includes('gold') ||
    lower.includes('platinum') ||
    lower.includes('vr game') ||
    lower.includes('ps5 game') ||
    lower.includes('ps5') ||
    lower.includes('game time') ||
    lower.includes('cinema access') ||
    lower.includes('mid week jolly') ||
    lower.includes('admission')
  );
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
      const textItem = item as { str: string; transform: number[] };
      const str = textItem.str;
      if (!str.trim()) continue;
      const [, , , , x, y] = textItem.transform;
      allItems.push({ str: str.trim(), x, y, page: p });
    }
  }

  return allItems;
}

/** Group text items into lines using ±6pt Y-coordinate tolerance */
function groupItemsIntoLines(items: TextItem[]): TextItem[][] {
  const pages = new Map<number, TextItem[]>();
  for (const item of items) {
    const arr = pages.get(item.page) || [];
    arr.push(item);
    pages.set(item.page, arr);
  }

  const allLines: TextItem[][] = [];

  for (const [, pageItems] of pages.entries()) {
    const sorted = [...pageItems].sort((a, b) => b.y - a.y);
    const pageLines: TextItem[][] = [];

    for (const item of sorted) {
      const matchedLine = pageLines.find(line => {
        const avgY = line.reduce((sum, i) => sum + i.y, 0) / line.length;
        return Math.abs(avgY - item.y) <= 6;
      });

      if (matchedLine) {
        matchedLine.push(item);
      } else {
        pageLines.push([item]);
      }
    }

    for (const line of pageLines) {
      line.sort((a, b) => a.x - b.x);
      allLines.push(line);
    }
  }

  return allLines;
}

/** Clean currency symbols (₦, $, N) and commas from numbers */
function cleanNumber(str: string): number | null {
  const cleaned = str.replace(/[₦$N\s]/gi, '').replace(/,/g, '').trim();
  if (!cleaned) return null;
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/** Check if token is a currency symbol */
function isCurrencySymbol(token: string): boolean {
  return /^[₦$N]$/i.test(token.trim());
}

/** Lines to skip (headers, footers, total rows, summary sections) */
function isSkipLine(lineStr: string): boolean {
  const lower = lineStr.toLowerCase().trim();
  const skipExactOrStart = [
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
    'ticket sales by price cards',
    'concession sales',
    'admin actions occurrences',
    'sales reconciliation',
    'no data found',
    'payment channel',
    'expected amount',
    'amount remitted',
    'variance',
  ];

  if (lower.includes('total')) return true;
  if (skipExactOrStart.some(k => lower === k || lower.startsWith(k))) return true;

  return false;
}

/** Parse header text for Username (retail member) and Date */
function extractHeaderMetadata(allText: string): { retailMember?: string; reportDate?: string } {
  let retailMember: string | undefined;
  let reportDate: string | undefined;

  const userMatch = allText.match(/Username:\s*([A-Za-z0-9\s]+?)(?=\s*Date:|\s*Time:|\n|$)/i);
  if (userMatch && userMatch[1].trim()) {
    retailMember = userMatch[1].trim();
  }

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

  const nameTokens: string[] = [];
  const numTokens: number[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i].trim();
    if (!tok || isCurrencySymbol(tok)) continue;

    const num = cleanNumber(tok);
    if (num !== null && /^[\d,₦$N.\s]+$/i.test(tok)) {
      numTokens.push(num);
    } else {
      if (numTokens.length === 0) {
        nameTokens.push(tok);
      }
    }
  }

  const itemName = nameTokens.join(' ').trim();
  if (!itemName || numTokens.length === 0) return null;

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

  const fullText = items.map(i => i.str).join(' ');
  const { retailMember, reportDate } = extractHeaderMetadata(fullText);

  const lines = groupItemsIntoLines(items);

  const rawRows: ParsedPdfRow[] = [];
  for (const lineItems of lines) {
    const tokens = lineItems.map(i => i.str);
    const row = parseLineToRow(tokens);
    if (row) rawRows.push(row);
  }

  const inventoryMap = new Map<string, ParsedPdfRow>();
  const ticketMap = new Map<string, ParsedPdfRow>();

  for (const r of rawRows) {
    const key = r.item_name.toLowerCase();
    if (isTicketItem(r.item_name)) {
      if (ticketMap.has(key)) {
        const existing = ticketMap.get(key)!;
        existing.quantity += r.quantity;
      } else {
        ticketMap.set(key, { ...r });
      }
    } else {
      if (inventoryMap.has(key)) {
        const existing = inventoryMap.get(key)!;
        existing.quantity += r.quantity;
      } else {
        inventoryMap.set(key, { ...r });
      }
    }
  }

  const ticketRows = [...ticketMap.values()];
  const totalTicketRevenue = ticketRows.reduce((sum, t) => sum + t.quantity * t.unit_price, 0);
  const totalTicketQuantity = ticketRows.reduce((sum, t) => sum + t.quantity, 0);

  return {
    rows: [...inventoryMap.values()],
    ticketRows,
    totalTicketRevenue,
    totalTicketQuantity,
    retailMember,
    reportDate,
  };
}
