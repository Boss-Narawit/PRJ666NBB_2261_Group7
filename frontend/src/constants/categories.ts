// Single source of truth for clothing categories. Backend stores these
// lowercase; the UI displays them capitalized and compares case-insensitively.
// 'Other' is a real backend enum value (and the bucket Activewear maps into),
// so filters must offer it or those items are only reachable under "All".
export const CLOTHING_CATEGORIES = [
  'Tops',
  'Bottoms',
  'Dresses',
  'Outerwear',
  'Shoes',
  'Accessories',
  'Other',
] as const;

// Size options vary by category — alpha sizing doesn't fit pants or shoes.
// `size` is stored as a free string on the backend, so these are UI guidance
// only. Keyed lowercase to match backend category values; getSizeOptions
// lowercases its input and falls back to the alpha set for unknown categories.
const ALPHA_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const WAIST_SIZES = ['26', '28', '30', '32', '34', '36', '38', '40'];
const SHOE_SIZES = [
  '5',
  '5.5',
  '6',
  '6.5',
  '7',
  '7.5',
  '8',
  '8.5',
  '9',
  '9.5',
  '10',
  '10.5',
  '11',
  '11.5',
  '12',
  '12.5',
  '13',
];

const SIZE_OPTIONS_BY_CATEGORY: Record<string, string[]> = {
  bottoms: WAIST_SIZES,
  shoes: SHOE_SIZES,
  accessories: ['One Size'],
};

export function getSizeOptions(category: string): string[] {
  return SIZE_OPTIONS_BY_CATEGORY[category?.toLowerCase()] ?? ALPHA_SIZES;
}

// Subset featured as quick-filter cards on the home screen, each with an image.
// `label` is the display text shown on the card; `name` must be one of
// CLOTHING_CATEGORIES — it's the filter value the card navigates to. `label`
// now intentionally matches `name` so the card text matches the wardrobe
// filter chip it opens.
export const FEATURED_CATEGORIES = [
  {
    label: 'Outerwear',
    name: 'Outerwear',
    image: require('../assets/images/Jacket.png'),
  },
  {
    label: 'Tops',
    name: 'Tops',
    image: require('../assets/images/Shirts.png'),
  },
  {
    label: 'Bottoms',
    name: 'Bottoms',
    image: require('../assets/images/Pants.png'),
  },
  {
    label: 'Shoes',
    name: 'Shoes',
    image: require('../assets/images/Shoes.png'),
  },
] as const;
