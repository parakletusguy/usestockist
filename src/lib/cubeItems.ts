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

const CUBE_KEYS = [...CUBE_ITEM_NAMES, 'Hennessey XO', 'Louise Roederer', 'Castilo Grande', 'Loise Roederer'].map(normalize);

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
export const CUBE_BASELINE_DATE = '2026-09-07';

export const CUBE_BASELINE_STOCK: Record<string, number> = {
  'Louis Roederer': 1,
  'Loise Roederer': 1,
  'Alita': 1,
  'Lamothe Parrot': 8,
  'Castillo Grande': 6,
  'Castilo Grande': 6,
  'Chamdor': 6,
  'Soda': 36,
  'Water': 42,
  'Bombay': 2,
  'Hennesy XO': 1,
  'Hennessy XO': 1,
  'Regular Popcorn': 0,
  'Serviette': 0,
  'Tissue': 0,
  'Chafing Gel': 0,
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

