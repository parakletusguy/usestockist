/**
 * Items the Cube department holds and gives out to guests.
 * Cube stock is exclusively what has been transferred/issued to them from Retail.
 */
export const CUBE_ITEM_NAMES = [
  'Regular Popcorn',
  'Soda',
  'Water',
  'Serviette',
  'Tissue',
  'Chafing Gel',
  'Alita',
  'Lamothe Parrot',
  'Castillo Grande',
  'Chamdor',
  'Louis Roederer',
  'Bombay',
  'Hennessy XO',
] as const;

/** Cube issues out to guests only. */
export const CUBE_RECIPIENT_GROUPS = ['Guest'] as const;

const normalize = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const CUBE_KEYS = [...CUBE_ITEM_NAMES, 'Hennessey XO', 'Louise Roederer'].map(normalize);

/** Loose match so catalog naming variants (e.g. "Hennessey XO 70cl") still resolve. */
export function isCubeItem(itemName: string | null | undefined): boolean {
  if (!itemName) return false;
  const name = normalize(itemName);
  return CUBE_KEYS.some((key) => name === key || name.includes(key) || key.includes(name));
}

/**
 * Physically counted Cube stock as of the baseline date.
 * Ledger movements recorded on/after this date are applied on top of these figures.
 */
export const CUBE_BASELINE_DATE = '2026-08-26';

export const CUBE_BASELINE_STOCK: Record<string, number> = {
  'Alita': 1,
  'Bombay': 2,
  'Louis Roederer': 1,
  'Chamdor': 5,
  'Lamothe Parrot': 4,
  'Castillo Grande': 6,
  'Soda': 7,
  'Water': 14,
};

const BASELINE_ENTRIES = Object.entries(CUBE_BASELINE_STOCK).map(
  ([name, qty]) => [normalize(name), qty] as const,
);

/** Baseline on-hand quantity for a catalog item name (0 when not part of the baseline count). */
export function getCubeBaselineStock(itemName: string | null | undefined): number {
  if (!itemName) return 0;
  const name = normalize(itemName);
  const match = BASELINE_ENTRIES.find(([key]) => name === key || name.includes(key) || key.includes(name));
  return match ? match[1] : 0;
}

