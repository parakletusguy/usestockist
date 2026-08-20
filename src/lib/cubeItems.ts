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

const CUBE_KEYS = CUBE_ITEM_NAMES.map(normalize);

/** Loose match so catalog naming variants (e.g. "Hennessey XO 70cl") still resolve. */
export function isCubeItem(itemName: string | null | undefined): boolean {
  if (!itemName) return false;
  const name = normalize(itemName);
  return CUBE_KEYS.some((key) => name === key || name.includes(key) || key.includes(name));
}
