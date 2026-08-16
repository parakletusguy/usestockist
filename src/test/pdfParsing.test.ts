import { describe, it, expect } from 'vitest';
import { isTicketItem } from '@/lib/parsePdf';
import { isBarCupConsumingDrink, calculateBarCupDeductions } from '@/lib/barCupMapping';

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

/** Check if line is a skip keyword line */
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

  if (lower.includes('total')) return true;
  return skipKeywords.some(k => lower === k || lower.startsWith(k));
}

/** Parse a single line of tokens into an item row */
function parseLineToRow(tokens: string[]): { item_name: string; quantity: number; unit_price: number } | null {
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

  return { item_name: itemName, quantity, unit_price };
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

describe('Reach POS PDF Parsing — Item Focus', () => {
  describe('Header Metadata Extraction', () => {
    it('extracts retail member name and date from Reach POS report header', () => {
      const headerText = 'Cash Reconciliation Report Username: Chinenye Joy Date: Wed Jul 22 2026 Time: 08:30:36 AM';
      const meta = extractHeaderMetadata(headerText);

      expect(meta.retailMember).toBe('Chinenye Joy');
      expect(meta.reportDate).toBe('2026-07-22');
    });
  });

  describe('Item Extraction from Reach PDF Report', () => {
    const reachReportLines = [
      { tokens: ['MID WEEK JOLLY', '₦ 4,500', '21', '₦ 94,500', '7', '₦ 31,500', '21', '₦ 94,500'], name: 'MID WEEK JOLLY', price: 4500, qty: 21 },
      { tokens: ['Regular Ticket', '₦ 6,000', '16', '₦ 96,000', '0', '₦ 0', '16', '₦ 96,000'], name: 'Regular Ticket', price: 6000, qty: 16 },
      { tokens: ['Gold Seat', '₦ 5,000', '4', '₦ 20,000', '0', '₦ 0', '4', '₦ 20,000'], name: 'Gold Seat', price: 5000, qty: 4 },
      { tokens: ['MEDIUM POPCORN', '₦ 4,500', '21', '₦ 94,500', '8', '₦ 36,000', '21', '₦ 94,500'], name: 'MEDIUM POPCORN', price: 4500, qty: 21 },
      { tokens: ['REGULAR POPCORN', '₦ 4,000', '16', '₦ 64,000', '0', '₦ 0', '16', '₦ 64,000'], name: 'REGULAR POPCORN', price: 4000, qty: 16 },
      { tokens: ['LARGE POPCORN', '₦ 5,500', '9', '₦ 49,500', '1', '₦ 5,500', '9', '₦ 49,500'], name: 'LARGE POPCORN', price: 5500, qty: 9 },
      { tokens: ['SODA', '₦ 1,200', '36', '₦ 43,200', '9', '₦ 10,800', '36', '₦ 43,200'], name: 'SODA', price: 1200, qty: 36 },
      { tokens: ['SCHWEPPES BITTERLEMON', '₦ 2,000', '3', '₦ 6,000', '2', '₦ 4,000', '3', '₦ 6,000'], name: 'SCHWEPPES BITTERLEMON', price: 2000, qty: 3 },
      { tokens: ['WATER', '₦ 1,000', '19', '₦ 19,000', '0', '₦ 0', '19', '₦ 19,000'], name: 'WATER', price: 1000, qty: 19 },
      { tokens: ['PARFAIT', '₦ 4,000', '1', '₦ 4,000', '0', '₦ 0', '1', '₦ 4,000'], name: 'PARFAIT', price: 4000, qty: 1 },
      { tokens: ['BLACKBULLET', '₦ 3,000', '1', '₦ 3,000', '0', '₦ 0', '1', '₦ 3,000'], name: 'BLACKBULLET', price: 3000, qty: 1 },
      { tokens: ['VR GAME', '₦ 2,000', '15', '₦ 30,000', '0', '₦ 0', '15', '₦ 30,000'], name: 'VR GAME', price: 2000, qty: 15 },
    ];

    reachReportLines.forEach(({ tokens, name, price, qty }) => {
      it(`accurately extracts ${name} (Qty: ${qty}, Price: ₦${price})`, () => {
        const row = parseLineToRow(tokens);
        expect(row).not.toBeNull();
        expect(row?.item_name).toBe(name);
        expect(row?.unit_price).toBe(price);
        expect(row?.quantity).toBe(qty);
      });
    });
  });

  describe('Ticket Identification (Non-Inventory Exclusion)', () => {
    it('identifies ticket and admission items', () => {
      expect(isTicketItem('Regular Ticket')).toBe(true);
      expect(isTicketItem('Gold Seat')).toBe(true);
      expect(isTicketItem('Platinum Seat')).toBe(true);
      expect(isTicketItem('VR GAME')).toBe(true);
      expect(isTicketItem('BOX-SIGNATR ACCESS (SINGLE)')).toBe(true);
      expect(isTicketItem('BOX-SIGNATR ACCESS(COUPLE SEAT)')).toBe(true);
      expect(isTicketItem('MID WEEK JOLLY')).toBe(true);
      expect(isTicketItem('Cinema Access Pass')).toBe(true);
    });

    it('correctly distinguishes physical inventory items from tickets', () => {
      expect(isTicketItem('MEDIUM POPCORN')).toBe(false);
      expect(isTicketItem('SODA')).toBe(false);
      expect(isTicketItem('WATER')).toBe(false);
      expect(isTicketItem('FROZEN MAGARITA')).toBe(false);
      expect(isTicketItem('BAILEYS MILKSHAKE')).toBe(false);
      expect(isTicketItem('Sex Boaster')).toBe(false);
    });
  });

  describe('Bar Cup Auto-Reconciliation', () => {
    it('identifies cup-consuming drinks (cocktails, mocktails, milkshakes, smoothies)', () => {
      expect(isBarCupConsumingDrink('Long Island')).toBe(true);
      expect(isBarCupConsumingDrink('FROZEN MAGARITA')).toBe(true);
      expect(isBarCupConsumingDrink('Porn Star Martini')).toBe(true);
      expect(isBarCupConsumingDrink('TROPICAL BLAST')).toBe(true);
      expect(isBarCupConsumingDrink('Virgin Mojito')).toBe(true);
      expect(isBarCupConsumingDrink('BAILEYS MILKSHAKE')).toBe(true);
      expect(isBarCupConsumingDrink('COMBO MILKSHAKE')).toBe(true);
      expect(isBarCupConsumingDrink('Mango Smoothie')).toBe(true);
    });

    it('excludes non-cup items (beers, wines, whole bottles, shots, coffee/tea, supplies)', () => {
      expect(isBarCupConsumingDrink('Tiger Beer')).toBe(false);
      expect(isBarCupConsumingDrink('Heineken')).toBe(false);
      expect(isBarCupConsumingDrink('Coffee')).toBe(false);
      expect(isBarCupConsumingDrink('Tea')).toBe(false);
      expect(isBarCupConsumingDrink('Tequila Shot')).toBe(false);
      expect(isBarCupConsumingDrink('Andre Rose')).toBe(false);
      expect(isBarCupConsumingDrink('Four Cousins')).toBe(false);
      expect(isBarCupConsumingDrink('Cups')).toBe(false);
      expect(isBarCupConsumingDrink('Milk Cups')).toBe(false);
    });

    it('calculates aggregate cup deduction accurately', () => {
      const salesRows = [
        { itemName: 'Long Island', qtySold: 4, department: 'Bar' },
        { itemName: 'BAILEYS MILKSHAKE', qtySold: 2, department: 'Bar' },
        { itemName: 'Tiger Beer', qtySold: 5, department: 'Bar' },
        { itemName: 'Andre Rose', qtySold: 1, department: 'Bar' },
        { itemName: 'Tequila Shot', qtySold: 3, department: 'Bar' },
        { itemName: 'TROPICAL BLAST', qtySold: 3, department: 'Bar' },
      ];

      const result = calculateBarCupDeductions(salesRows);
      // 4 (Long Island) + 2 (Milkshake) + 3 (Tropical Blast) = 9 cups
      expect(result.totalCupsToDeduct).toBe(9);
      expect(result.cupEligibleItems.length).toBe(3);
      expect(result.nonCupItems.length).toBe(3);
    });
  });

  describe('Skipping Summary & Total Lines', () => {
    const totalLines = [
      ['MID WEEK JOLLY Total', '21', '₦ 94,500', '7', '₦ 31,500'],
      ['Regular ticket Total', '16', '₦ 96,000'],
      ['Popcorn Total', '46', '₦ 208,000'],
      ['Cold Drinks Total', '60', '₦ 75,200'],
      ['Concession Sales Total', '178', '₦ 464,200'],
      ['Sales Reconciliation'],
      ['Payment Channel', 'Expected Amount', 'Amount Remitted', 'Variance'],
    ];

    totalLines.forEach(tokens => {
      it(`skips total summary line "${tokens.join(' ')}"`, () => {
        const row = parseLineToRow(tokens);
        expect(row).toBeNull();
      });
    });
  });
});
