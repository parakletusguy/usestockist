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
    { id: '7', name: 'Soda', unit_cost: 1200 },
    { id: '8', name: 'Water', unit_cost: 1000 },
    { id: '9', name: 'Maltina', unit_cost: 1500 },
    { id: '10', name: 'Large Popcorn', unit_cost: 5500 },
    { id: '11', name: 'Small Chops', unit_cost: 4000 },
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

  it('matches SODA to Soda', () => {
    const res = matchToCatalog('SODA', catalog);
    expect(res?.name).toBe('Soda');
  });

  it('matches WATER to Water', () => {
    const res = matchToCatalog('WATER', catalog);
    expect(res?.name).toBe('Water');
  });

  it('returns null for completely uncatalogued items without defaulting', () => {
    const res = matchToCatalog('UNKNOWN ITEM XYZ 99', catalog);
    expect(res).toBeNull();
  });

  it('matches MOJITO CHAPMAN CAN to Schweppes Chapman Can catalog item', () => {
    const extendedCatalog: MockItem[] = [
      ...catalog,
      { id: '20', name: 'Schweppes Chapman Can', unit_cost: 1500 },
    ];
    const res = matchToCatalog('MOJITO CHAPMAN CAN', extendedCatalog);
    expect(res?.name).toBe('Schweppes Chapman Can');
  });
});

import { isPreparedBarDrink, isBarCupConsumingDrink } from '@/lib/barCupMapping';

describe('barCupMapping — packaged product overrides', () => {
  it('isPreparedBarDrink returns false for MOJITO CHAPMAN CAN', () => {
    expect(isPreparedBarDrink('MOJITO CHAPMAN CAN')).toBe(false);
  });

  it('isPreparedBarDrink returns false for Schweppes Chapman Can', () => {
    expect(isPreparedBarDrink('Schweppes Chapman Can')).toBe(false);
  });

  it('isPreparedBarDrink returns true for a genuine mojito cocktail', () => {
    expect(isPreparedBarDrink('Virgin Mojito')).toBe(true);
  });

  it('isBarCupConsumingDrink returns false for MOJITO CHAPMAN CAN', () => {
    expect(isBarCupConsumingDrink('MOJITO CHAPMAN CAN')).toBe(false);
  });

  it('isBarCupConsumingDrink returns true for a genuine mojito cocktail', () => {
    expect(isBarCupConsumingDrink('Mojito Cocktail')).toBe(true);
  });
});

import { getDefaultItemDepartments } from '@/lib/itemDepartmentRules';
import { findRecipe } from '@/lib/recipeMapping';

describe('Retail Shawarma Department Rules', () => {
  it('assigns Retail department to Mixed Grill Shawarma', () => {
    const depts = getDefaultItemDepartments('Mixed Grill Shawarma', 'Food');
    expect(depts).toContain('Retail');
  });

  it('assigns Retail department to Beef Shawarma', () => {
    const depts = getDefaultItemDepartments('Beef Shawarma', 'Food');
    expect(depts).toContain('Retail');
  });

  it('assigns Retail department to Shawarma (2 Sausages)', () => {
    const depts = getDefaultItemDepartments('Shawarma (2 Sausages)', 'Food');
    expect(depts).toContain('Retail');
  });

  it('does not assign Retail department to Shawarma Bread by default', () => {
    const depts = getDefaultItemDepartments('Shawarma Bread', 'Food');
    expect(depts).toContain('Kitchen');
    expect(depts).not.toContain('Retail');
  });
});

describe('Shawarma Recipe Mapping', () => {
  it('Beef Shawarma resolves to Beef Shawarma recipe with Shawarma Bread + Portioned Chicken', () => {
    const recipe = findRecipe('Beef Shawarma');
    expect(recipe).not.toBeNull();
    expect(recipe!.name).toBe('Beef Shawarma');
    const bread = recipe!.ingredients.find(i => i.catalogItemName === 'Shawarma Bread');
    const chicken = recipe!.ingredients.find(i => i.catalogItemName === 'Portioned Chicken');
    expect(bread?.quantityPerServing).toBe(1);
    expect(chicken?.quantityPerServing).toBe(0.15);
  });

  it('Mixed Grill Shawarma resolves to Mixed Grill Shawarma recipe with Shawarma Bread + Portioned Chicken', () => {
    const recipe = findRecipe('Mixed Grill Shawarma');
    expect(recipe).not.toBeNull();
    expect(recipe!.name).toBe('Mixed Grill Shawarma');
    const bread = recipe!.ingredients.find(i => i.catalogItemName === 'Shawarma Bread');
    const chicken = recipe!.ingredients.find(i => i.catalogItemName === 'Portioned Chicken');
    expect(bread?.quantityPerServing).toBe(1);
    expect(chicken?.quantityPerServing).toBe(0.15);
  });

  it('Shawarma (2 Sausages) resolves to sausage recipe with 2 Hotdog Sausages + 1 Shawarma Bread', () => {
    const recipe = findRecipe('Shawarma (2 Sausages)');
    expect(recipe).not.toBeNull();
    expect(recipe!.name).toBe('Shawarma (2 Sausages)');
    const bread = recipe!.ingredients.find(i => i.catalogItemName === 'Shawarma Bread');
    const sausages = recipe!.ingredients.find(i => i.catalogItemName === 'Hotdog Sausages');
    expect(bread?.quantityPerServing).toBe(1);
    expect(sausages?.quantityPerServing).toBe(2);
    // Sausage shawarma should NOT deduct Portioned Chicken
    const chicken = recipe!.ingredients.find(i => i.catalogItemName === 'Portioned Chicken');
    expect(chicken).toBeUndefined();
  });

  it('Shawarma (2 Sausages) does NOT match the generic Shawarma recipe', () => {
    const recipe = findRecipe('Shawarma (2 Sausages)');
    expect(recipe!.name).not.toBe('Shawarma');
  });

  it('plain Shawarma falls back to generic Shawarma recipe with Portioned Chicken', () => {
    const recipe = findRecipe('Shawarma');
    expect(recipe).not.toBeNull();
    expect(recipe!.name).toBe('Shawarma');
    const chicken = recipe!.ingredients.find(i => i.catalogItemName === 'Portioned Chicken');
    expect(chicken).toBeDefined();
  });
});
