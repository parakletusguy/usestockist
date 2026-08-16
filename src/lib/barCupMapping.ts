/**
 * Bar Cup Mapping Utility
 *
 * Rules:
 * - All served drinks (cocktails, mocktails, milkshakes, smoothies, mixed drinks, juices by glass) consume 1 Cup.
 * - Non-cup items:
 *   1. Beers in cans/bottles (Tiger, Heineken, etc.)
 *   2. Coffee & Tea
 *   3. Shots (Tequila shot, etc.)
 *   4. Bottled Wines / Champagnes / Whole Spirits
 *   5. Food ingredients & supplies (Milk Cups, Straws, Serviettes, Mint Leaf, Fruits, Syrups)
 */

const NO_CUP_EXACT_OR_KEYWORD = [
  // Beers
  'tiger',
  'heineken',
  'beer',
  'star',
  'gulder',
  'budweiser',
  'desperados',
  'guinness',
  'trophy',
  'origin',
  'climax',
  'black bullet',

  // Coffee & Tea
  'coffee',
  'tea',
  'espresso',
  'cappuccino',
  'latte',
  'hot chocolate',

  // Shots (served in shot glasses)
  'shot',
  'tequila shot',

  // Bottled Wines & Champagnes / Whole bottles
  'andre rose',
  'four cousins',
  'chamdor',
  'lamothe parrot',
  'castilo grande',
  'louis roederer',
  'hennesy',
  'hennessy',
  'william lawson',
  'captain morgan',
  'shipmaster',
  'bacardi',
  'flirt vodka',
  'priskaia',
  'bombay',
  'alita',
  'sierra tequilla',
  'avacati tequila',
  'beun amigo',
  'captain jack',
  'kahlua',
  'marie brizard',

  // Supplies & Raw Ingredients
  'cups',
  'milk cups',
  'smoothie cups',
  'straw',
  'serviette',
  'mint leaf',
  'cucumber',
  'grapes',
  'dates',
  'groundnut',
  'lime seed',
  'ice cream mix',
  'beet root',
  'apple',
  'avocado',
  'banana',
  'pineapple fruit',
  'strawberry fruit',
  'syrup',
  'sport sirop',
  'da montare',
  'sweet and sour',
  'bitters',
  'blue curacao',
  'grenadine',
  'pos roll',
];

const DEFINITE_CUP_KEYWORDS = [
  'cocktail',
  'mocktail',
  'milkshake',
  'milk shake',
  'milkshae',
  'milshake',
  'smoothie',
  'margarita',
  'magarita',
  'martini',
  'long island',
  'tropical blast',
  'virgin mojito',
  'mojito',
  'pinacolada',
  'pina colada',
  'daiquiri',
  'chapman',
  'colada',
  'sunrise',
  'lemonade',
  'sangria',
  'cosmopolitan',
  'bailey',
  'baileys',
  'boaster',
  'booster',
  'sex on the beach',
  'screw driver',
  'screwdriver',
  'shake',
  'blast',
  'punch',
  'slush',
  'slushy',
  'fizz',
];

const PREPARED_BEVERAGES_AND_SERVICES = [
  ...DEFINITE_CUP_KEYWORDS,
  'shot',
  'tequila shot',
  'tea',
  'arabian tea',
  'green tea',
  'black tea',
  'coffee',
  'espresso',
  'cappuccino',
  'latte',
  'hot chocolate',
  'membership',
];

/**
 * Returns true if the item is a prepared cocktail, mocktail, milkshake, tea, coffee,
 * shot, or service that should be recorded in the sales report for revenue (and cup deduction if applicable),
 * without requiring a physical raw stock catalog entry or transaction ledger entry.
 */
export function isPreparedBarDrink(itemName: string): boolean {
  if (!itemName) return false;
  const lower = itemName.toLowerCase().trim();

  // If it matches a prepared beverage or bar service keyword, it is a prepared drink!
  if (PREPARED_BEVERAGES_AND_SERVICES.some(kw => lower.includes(kw))) {
    return true;
  }

  // Fallback: if it's a known non-raw item in Bar
  if (NO_CUP_EXACT_OR_KEYWORD.some(kw => lower.includes(kw))) {
    return false;
  }

  return false;
}

/**
 * Returns true if the sold item consumes 1 physical Cup from the Bar department.
 */
export function isBarCupConsumingDrink(itemName: string): boolean {
  if (!itemName) return false;
  const lower = itemName.toLowerCase().trim();

  // If explicitly a definite cup drink keyword (cold cocktail, milkshake, smoothie, mojito)
  if (DEFINITE_CUP_KEYWORDS.some(kw => lower.includes(kw))) {
    return true;
  }

  // Non-cup items (shots, hot tea, coffee, bottled beer, wine, supplies)
  return false;
}

/**
 * Calculate total cups to deduct from Bar department inventory.
 * Cups are exclusive to Bar: all served cocktails, milkshakes, and smoothies deduct Bar cups.
 */
export function calculateBarCupDeductions(
  rows: Array<{ itemName: string; qtySold: number; department?: string }>
): {
  totalCupsToDeduct: number;
  cupEligibleItems: Array<{ name: string; qty: number }>;
  nonCupItems: Array<{ name: string; qty: number }>;
} {
  let totalCupsToDeduct = 0;
  const cupEligibleItems: Array<{ name: string; qty: number }> = [];
  const nonCupItems: Array<{ name: string; qty: number }> = [];

  for (const row of rows) {
    if (isBarCupConsumingDrink(row.itemName)) {
      totalCupsToDeduct += row.qtySold;
      cupEligibleItems.push({ name: row.itemName, qty: row.qtySold });
    } else {
      nonCupItems.push({ name: row.itemName, qty: row.qtySold });
    }
  }

  return {
    totalCupsToDeduct,
    cupEligibleItems,
    nonCupItems,
  };
}
