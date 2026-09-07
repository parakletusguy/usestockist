import { isCubeItem } from './cubeItems';

const KITCHEN_KEYWORDS = [
  'kitchen glory', 'raw corn', 'honey', 'maggi', 'sugar', 'vegetable oil',
  'butter', 'fillo mix', 'grill tongs', 'hotdog tong', 'salt', 'tin tomatoes',
  'doughnut', 'meat pie', 'small chops', 'sliced cake', 'short bread', 'wafers biscuits',
  'shawarma', 'chicken', 'sausage', 'pepper', 'flour', 'seasoning', 'curry', 'thyme',
  'groundnut oil', 'onion', 'garlic', 'crayfish', 'fish', 'beef', 'egg'
];

const HOUSEKEEPING_KEYWORDS = [
  'chafing gel', 'portion nylon', 'pos roll', 'rubber band', 'take away bags',
  'thermal roll', 'gloves', 'ziploc', 'bleach', 'detergent', 'mop', 'broom',
  'cleaning', 'air freshener', 'bin liner', 'trash bag', 'hypo', 'harpic'
];

const BAR_KEYWORDS = [
  'schweppes chapman', 'zobo', 'monster energy', 'pulpy', 'tigernut',
  'ice cream cups', 'straw', 'vodka', 'whiskey', 'rum', 'gin', 'brandy', 'tequila',
  'liqueur', 'cognac', 'beer', 'cider', 'wine', 'syrup', 'grenadine', 'blue curacao',
  'red bull', 'tonic', 'bitters', 'lime juice', 'lemon juice', 'cocktail', 'mocktail'
];

const SHARED_COMMON_KEYWORDS = [
  'disposable cups', 'serviette', 'tissue', 'water', 'soda'
];

/**
 * Resolves the default departments for an item when explicit assignments
 * have not yet been stored in item_departments.
 */
export function getDefaultItemDepartments(name: string, category?: string, fallbackDept?: string): string[] {
  const lower = (name || '').toLowerCase().trim();
  const depts: string[] = [];

  // Check Cube
  if (isCubeItem(lower)) {
    depts.push('Cube');
  }

  // Check Kitchen
  if (KITCHEN_KEYWORDS.some(k => lower.includes(k))) {
    depts.push('Kitchen');
  }

  // Check Housekeeping
  if (HOUSEKEEPING_KEYWORDS.some(k => lower.includes(k))) {
    depts.push('Housekeeping');
  }

  // Check Bar
  if (BAR_KEYWORDS.some(k => lower.includes(k))) {
    depts.push('Bar');
  }

  // Check Shared items (e.g. Cups, Serviette, Water, Soda are used across Retail, Bar, Cube)
  if (SHARED_COMMON_KEYWORDS.some(k => lower.includes(k))) {
    if (!depts.includes('Retail')) depts.push('Retail');
    if (!depts.includes('Bar')) depts.push('Bar');
    if (!depts.includes('Cube')) depts.push('Cube');
  }

  // If Food category and not matched yet, assign Kitchen
  if (category === 'Food' && depts.length === 0) {
    depts.push('Kitchen');
  }

  // If Supplies category and not matched yet, assign Housekeeping
  if (category === 'Supplies' && depts.length === 0) {
    depts.push('Housekeeping');
  }

  // If Equipment category and not matched yet, assign Kitchen
  if (category === 'Equipment' && depts.length === 0) {
    depts.push('Kitchen');
  }

  // Retail specific items: Popcorn, Yoghurt, Parfait, Pringles, Bounty, Concessions, Maltina
  if (
    lower.includes('popcorn') ||
    lower.includes('yoghurt') ||
    lower.includes('parfait') ||
    lower.includes('pringles') ||
    lower.includes('bounty') ||
    lower.includes('maltina') ||
    category === 'Concessions'
  ) {
    if (!depts.includes('Retail')) depts.push('Retail');
  }

  // If a custom department (not the default 'Retail') was explicitly saved on items.department
  if (fallbackDept && fallbackDept !== 'Retail' && !depts.includes(fallbackDept)) {
    depts.push(fallbackDept);
  }

  // Final fallback if completely unclassified
  if (depts.length === 0) {
    depts.push('Retail');
  }

  return depts;
}
