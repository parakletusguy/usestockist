import { describe, it, expect } from 'vitest';

/** Clean currency symbols (₦, $, N) and commas from numbers */
function cleanNumber(str: string): number | null {
  const cleaned = str.replace(/[₦\$N\s]/gi, '').replace(/,/g, '').trim();
  if (!cleaned) return null;
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/** Check if line is a skip keyword line */
function isSkipLine(lineStr: string): boolean {
  const lower = lineStr.toLowerCase();
  const skipKeywords = [
    'cash reconciliation report',
    'username:',
    'date:',
    'time:',
    'price',
    'quantity',
    'value',
    'total',
    'ticket sales',
    'concession sales',
  ];

  if (lower.includes('total')) return true;
  return skipKeywords.some(k => lower === k || lower.startsWith(k));
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
      // ignore
    }
  }

  return { retailMember, reportDate };
}

describe('PDF Parsing Utilities', () => {
  describe('cleanNumber', () => {
    it('strips Naira symbols and commas correctly', () => {
      expect(cleanNumber('₦ 4,500')).toBe(4500);
      expect(cleanNumber('N 94,500')).toBe(94500);
      expect(cleanNumber('$2.50')).toBe(2.5);
      expect(cleanNumber('21')).toBe(21);
    });

    it('returns null for non-numeric strings', () => {
      expect(cleanNumber('MEDIUM POPCORN')).toBeNull();
      expect(cleanNumber('')).toBeNull();
    });
  });

  describe('isSkipLine', () => {
    it('correctly identifies total and header lines', () => {
      expect(isSkipLine('MID WEEK JOLLY Total')).toBe(true);
      expect(isSkipLine('Popcorn Total')).toBe(true);
      expect(isSkipLine('Username: Chinenye Joy')).toBe(true);
      expect(isSkipLine('Price Quantity Value')).toBe(true);
    });

    it('returns false for actual item rows', () => {
      expect(isSkipLine('MEDIUM POPCORN ₦ 4,500 21')).toBe(false);
      expect(isSkipLine('SODA ₦ 1,200 36')).toBe(false);
    });
  });

  describe('extractHeaderMetadata', () => {
    it('extracts retail member name and date from Reach POS report header', () => {
      const headerText = 'Cash Reconciliation Report Username: Chinenye Joy Date: Wed Jul 22 2026 Time: 08:30:36 AM';
      const meta = extractHeaderMetadata(headerText);

      expect(meta.retailMember).toBe('Chinenye Joy');
      expect(meta.reportDate).toBe('2026-07-22');
    });
  });
});
