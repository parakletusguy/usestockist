import { describe, it, expect } from 'vitest';

const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

const tokenize = (str: string) =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !['can', 'bottle', 'pack', 'pcs', 'drink', 'item', 'product'].includes(w));

interface MockItem {
  id: string;
  name: string;
  unit_cost: number;
}

function matchToCatalog(rawName: string, items: MockItem[]): MockItem | null {
  if (!items || items.length === 0 || !rawName) return null;

  const rawLower = rawName.toLowerCase().trim();
  const rawNorm = normalize(rawName);
  const rawTokens = tokenize(rawName);

  // 1. Direct exact match
  const exact = items.find(it => it.name.toLowerCase().trim() === rawLower);
  if (exact) return exact;

  // 2. Normalized exact match (e.g. "BLACKBULLET" === "blackbullet" from "Black Bullet")
  const normExact = items.find(it => normalize(it.name) === rawNorm);
  if (normExact) return normExact;

  // 3. Substring match on lower & normalized
  const substringMatch = items.find(it => {
    const itLower = it.name.toLowerCase().trim();
    const itNorm = normalize(it.name);
    return (
      rawLower.includes(itLower) ||
      itLower.includes(rawLower) ||
      (rawNorm.length >= 4 && itNorm.length >= 4 && (rawNorm.includes(itNorm) || itNorm.includes(rawNorm)))
    );
  });
  if (substringMatch) return substringMatch;

  // 4. Token overlap match (> 30% overlap of meaningful words)
  if (rawTokens.length > 0) {
    let bestItem: MockItem | null = null;
    let bestScore = 0;

    for (const item of items) {
      const itemTokens = tokenize(item.name);
      if (itemTokens.length === 0) continue;

      const commonTokens = rawTokens.filter(t => itemTokens.includes(t));
      const overlapRatio = commonTokens.length / Math.max(rawTokens.length, itemTokens.length);

      if (overlapRatio > 0.3 && overlapRatio > bestScore) {
        bestScore = overlapRatio;
        bestItem = item;
      }
    }

    if (bestItem) return bestItem;
  }

  return null;
}

describe('Catalog Matching Algorithm', () => {
  const catalog: MockItem[] = [
    { id: '1', name: 'Air Freshner Spray', unit_cost: 1500 },
    { id: '2', name: 'Black Bullet', unit_cost: 3000 },
    { id: '3', name: 'Meat Pie', unit_cost: 1500 },
    { id: '4', name: 'Shawarma (2 Sausages)', unit_cost: 5000 },
    { id: '5', name: 'Tiger Nut Drink', unit_cost: 2500 },
    { id: '6', name: 'Box-Signatr Access (Couple Seat)', unit_cost: 7000 },
    { id: '7', name: 'Cube Soda Drink', unit_cost: 1200 },
    { id: '8', name: 'Maltina', unit_cost: 1500 },
    { id: '9', name: 'Large Popcorn', unit_cost: 5500 },
    { id: '10', name: 'Small Chops', unit_cost: 4000 },
  ];

  it('matches BLACKBULLET to Black Bullet', () => {
    const res = matchToCatalog('BLACKBULLET', catalog);
    expect(res?.name).toBe('Black Bullet');
  });

  it('matches MEATPIE to Meat Pie', () => {
    const res = matchToCatalog('MEATPIE', catalog);
    expect(res?.name).toBe('Meat Pie');
  });

  it('matches SHAWARMA 2 SAUSAGES to Shawarma (2 Sausages)', () => {
    const res = matchToCatalog('SHAWARMA 2 SAUSAGES', catalog);
    expect(res?.name).toBe('Shawarma (2 Sausages)');
  });

  it('matches TIGER NUT DRINK to Tiger Nut Drink', () => {
    const res = matchToCatalog('TIGER NUT DRINK', catalog);
    expect(res?.name).toBe('Tiger Nut Drink');
  });

  it('matches BOX-SIGNATR ACCESS(COUPLE SEAT) to Box-Signatr Access (Couple Seat)', () => {
    const res = matchToCatalog('BOX-SIGNATR ACCESS(COUPLE SEAT)', catalog);
    expect(res?.name).toBe('Box-Signatr Access (Couple Seat)');
  });

  it('matches MALTINA CAN to Maltina', () => {
    const res = matchToCatalog('MALTINA CAN', catalog);
    expect(res?.name).toBe('Maltina');
  });

  it('matches SODA to Cube Soda Drink', () => {
    const res = matchToCatalog('SODA', catalog);
    expect(res?.name).toBe('Cube Soda Drink');
  });

  it('returns null for completely uncatalogued items without defaulting', () => {
    const res = matchToCatalog('UNKNOWN ITEM XYZ 99', catalog);
    expect(res).toBeNull();
  });
});
