/**
 * Recipe and Ingredient Mapping
 * Maps POS prepared cocktails, mocktails, smoothies, and kitchen dishes
 * into direct inventory ingredient deductions.
 */

import { Item } from '@/hooks/useItems';

export interface RecipeIngredient {
  catalogItemName: string;
  quantityPerServing: number;
}

export interface Recipe {
  name: string;
  keywords: string[];
  ingredients: RecipeIngredient[];
}

export interface ExplodedIngredient {
  itemId: string;
  itemName: string;
  qtyToDeduct: number;
  unitCost: number;
  department: string;
  parentItemName: string;
}

// ─── Quantity Reference ───────────────────────────────────────────────────────
// Bottle size for all syrups, spirits (gin, vodka, tequila, rum): 70 cl
// Standard serve — cocktail (single spirit/syrup): 5 cl → 5/70 ≈ 0.07 bottles
// Standard serve — long drink (multi-spirit, e.g. Long Island): 3 cl each → 3/70 ≈ 0.04
// Standard serve — shot: 4 cl → 4/70 ≈ 0.06 bottles
// Straw pack: 100–150 pcs → 1 straw per drink = 1/100 = 0.01 pack
// ─────────────────────────────────────────────────────────────────────────────
export const RECIPES: Recipe[] = [
  // ── Cocktails ──────────────────────────────────────────────────────────────
  {
    name: 'Mojito (Alcoholic)',
    keywords: ['mojito', 'classic mojito', 'rum mojito'],
    ingredients: [
      { catalogItemName: 'Bacardi White', quantityPerServing: 0.07 },   // 5cl ÷ 70cl
      { catalogItemName: 'Mojito Syrup', quantityPerServing: 0.07 },    // 5cl ÷ 70cl
      { catalogItemName: 'Soda', quantityPerServing: 1 },
      { catalogItemName: 'Cups', quantityPerServing: 1 },
      { catalogItemName: 'Straw', quantityPerServing: 0.01 },           // 1 pc ÷ 100 pc/pack
    ],
  },
  {
    name: 'Virgin Mojito / Mocktail Mojito',
    keywords: ['virgin mojito', 'mocktail mojito', 'no alcohol mojito'],
    ingredients: [
      { catalogItemName: 'Mojito Syrup', quantityPerServing: 0.07 },    // 5cl ÷ 70cl
      { catalogItemName: 'Soda', quantityPerServing: 1 },
      { catalogItemName: 'Cups', quantityPerServing: 1 },
      { catalogItemName: 'Straw', quantityPerServing: 0.01 },           // 1 pc ÷ 100 pc/pack
    ],
  },
  {
    name: 'Margarita',
    keywords: ['margarita', 'magarita'],
    ingredients: [
      { catalogItemName: 'Sierra Tequilla', quantityPerServing: 0.07 }, // 5cl ÷ 70cl
      { catalogItemName: 'Triple Sec (Bardinet)', quantityPerServing: 0.04 }, // 3cl ÷ 70cl
      { catalogItemName: 'Cups', quantityPerServing: 1 },
    ],
  },
  {
    name: 'Tequila Shot',
    keywords: ['tequila shot', 'shot of tequila'],
    ingredients: [
      { catalogItemName: 'Sierra Tequilla', quantityPerServing: 0.06 }, // 4cl ÷ 70cl
    ],
  },
  {
    name: 'Vodka Shot',
    keywords: ['vodka shot', 'shot of vodka', 'flirt shot'],
    ingredients: [
      { catalogItemName: 'Flirt Vodka', quantityPerServing: 0.06 },     // 4cl ÷ 70cl
    ],
  },
  {
    name: 'Chapman',
    keywords: ['chapman', 'signature chapman'],
    ingredients: [
      { catalogItemName: 'Schweppes Chapman Can', quantityPerServing: 1 },
      { catalogItemName: 'Cups', quantityPerServing: 1 },
      { catalogItemName: 'Straw', quantityPerServing: 0.01 },           // 1 pc ÷ 100 pc/pack
    ],
  },
  {
    name: 'Pina Colada',
    keywords: ['pina colada', 'pinacolada'],
    ingredients: [
      { catalogItemName: 'Bacardi White', quantityPerServing: 0.07 },   // 5cl ÷ 70cl
      { catalogItemName: 'Coconut Syrup', quantityPerServing: 0.07 },   // 5cl ÷ 70cl
      { catalogItemName: 'Pineapple Juice', quantityPerServing: 0.2 },
      { catalogItemName: 'Cups', quantityPerServing: 1 },
      { catalogItemName: 'Straw', quantityPerServing: 0.01 },           // 1 pc ÷ 100 pc/pack
    ],
  },
  {
    // Long Island: 5 spirits × 3cl each = 15cl total → each spirit at 3cl ÷ 70cl ≈ 0.04
    name: 'Long Island Iced Tea',
    keywords: ['long island', 'long island iced tea'],
    ingredients: [
      { catalogItemName: 'Flirt Vodka', quantityPerServing: 0.04 },     // 3cl ÷ 70cl
      { catalogItemName: 'Gordon/Lord Gin', quantityPerServing: 0.04 }, // 3cl ÷ 70cl
      { catalogItemName: 'Bacardi White', quantityPerServing: 0.04 },   // 3cl ÷ 70cl
      { catalogItemName: 'Sierra Tequilla', quantityPerServing: 0.04 }, // 3cl ÷ 70cl
      { catalogItemName: 'Triple Sec (Bardinet)', quantityPerServing: 0.03 }, // 2cl ÷ 70cl
      { catalogItemName: 'Cups', quantityPerServing: 1 },
      { catalogItemName: 'Straw', quantityPerServing: 0.01 },           // 1 pc ÷ 100 pc/pack
    ],
  },
  {
    name: 'Sex on the Beach',
    keywords: ['sex on the beach', 'sex on the driveway'],
    ingredients: [
      { catalogItemName: 'Flirt Vodka', quantityPerServing: 0.07 },     // 5cl ÷ 70cl
      { catalogItemName: 'Peach Syrup', quantityPerServing: 0.07 },     // 5cl ÷ 70cl
      { catalogItemName: 'Cranberry Juice', quantityPerServing: 0.1 },
      { catalogItemName: 'Orange Juice', quantityPerServing: 0.1 },
      { catalogItemName: 'Cups', quantityPerServing: 1 },
      { catalogItemName: 'Straw', quantityPerServing: 0.01 },           // 1 pc ÷ 100 pc/pack
    ],
  },
  {
    // Milkshake: Vanilla Syrup is a flavouring syrup — same 5cl ÷ 70cl = 0.07
    name: 'Milkshake',
    keywords: ['milkshake', 'milk shake', 'milkshae', 'milshake'],
    ingredients: [
      { catalogItemName: 'Ice Cream Mix', quantityPerServing: 0.1 },
      { catalogItemName: 'Milk', quantityPerServing: 0.1 },
      { catalogItemName: 'Vanilla Syrup', quantityPerServing: 0.07 },   // 5cl ÷ 70cl
      { catalogItemName: 'Milk Cups', quantityPerServing: 1 },
      { catalogItemName: 'Straw', quantityPerServing: 0.01 },           // 1 pc ÷ 100 pc/pack
    ],
  },
  {
    name: 'Smoothie / Blast',
    keywords: ['smoothie', 'blast', 'tropical blast', 'fruit smoothie'],
    ingredients: [
      { catalogItemName: 'Ice Cream Mix', quantityPerServing: 0.05 },
      { catalogItemName: 'Milk', quantityPerServing: 0.05 },
      { catalogItemName: 'Milk Cups', quantityPerServing: 1 },
      { catalogItemName: 'Straw', quantityPerServing: 0.01 },           // 1 pc ÷ 100 pc/pack
    ],
  },

  // ── Kitchen Food Items ─────────────────────────────────────────────────────
  {
    name: 'Shawarma',
    keywords: ['shawarma', 'chicken shawarma', 'beef shawarma'],
    ingredients: [
      { catalogItemName: 'Shawarma Bread', quantityPerServing: 1 },
      { catalogItemName: 'Portioned Chicken', quantityPerServing: 0.15 },
      { catalogItemName: 'Foil', quantityPerServing: 0.05 },
    ],
  },
  {
    name: 'Hotdog',
    keywords: ['hotdog', 'hot dog'],
    ingredients: [
      { catalogItemName: 'Hotdog Sausages', quantityPerServing: 1 },
      { catalogItemName: 'Hotdog Bread Bun', quantityPerServing: 1 },
    ],
  },
  {
    name: 'Burger',
    keywords: ['burger', 'beef burger', 'chicken burger'],
    ingredients: [
      { catalogItemName: 'Burger', quantityPerServing: 1 },
      { catalogItemName: 'Hotdog Bread Bun', quantityPerServing: 1 },
    ],
  },
  {
    name: 'Corn Dog',
    keywords: ['corn dog', 'corndog'],
    ingredients: [
      { catalogItemName: 'Corn Dog', quantityPerServing: 1 },
    ],
  },
];

/** Find recipe for a raw item name based on keywords */
export function findRecipe(rawName: string): Recipe | null {
  if (!rawName) return null;
  const lower = rawName.toLowerCase().trim();

  // 1. Virgin / Mocktail Mojito special handling
  if (lower.includes('virgin') && lower.includes('mojito')) {
    return RECIPES.find(r => r.name.startsWith('Virgin Mojito')) || null;
  }

  // 2. Exact or keyword match
  for (const recipe of RECIPES) {
    if (recipe.keywords.some(k => lower.includes(k))) {
      return recipe;
    }
  }

  return null;
}

/**
 * Explode a prepared item into its constituent ingredients mapped to catalog item IDs
 */
export function explodePreparedItem(
  rawName: string,
  quantitySold: number,
  catalogItems: Item[]
): ExplodedIngredient[] {
  const recipe = findRecipe(rawName);
  if (!recipe || quantitySold <= 0) return [];

  const results: ExplodedIngredient[] = [];

  for (const ingredient of recipe.ingredients) {
    // Find catalog item by exact or case-insensitive name match
    const catalogItem = catalogItems.find(
      it => it.name.toLowerCase().trim() === ingredient.catalogItemName.toLowerCase().trim()
    );

    if (catalogItem) {
      results.push({
        itemId: catalogItem.id,
        itemName: catalogItem.name,
        qtyToDeduct: Math.round(ingredient.quantityPerServing * quantitySold * 100) / 100,
        unitCost: catalogItem.unit_cost || 0,
        department: catalogItem.department || 'Bar',
        parentItemName: rawName,
      });
    }
  }

  return results;
}
