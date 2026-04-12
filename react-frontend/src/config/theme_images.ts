// Mapping of wedding theme names/IDs to local image paths.
// Images live in react-frontend/public/ (PNGs from "decor themes images" folder)
// and react-frontend/public/images/themes/ (JPG alternates).

/** Theme image lookup — returns the best local image path for a given theme string. */
export function getThemeImage(theme: string | undefined | null): string {
  if (!theme) return '/classic contemporary.png';

  const t = theme.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Exact ID matches (from WeddingPreferences theme selector)
  const idMap: Record<string, string> = {
    'royalpalacerajasthani': '/rajasthani royal.png',
    'traditionalregionalroots': '/traditional.png',
    'vintageclassic': '/vintage.png',
    'bollywoodglamour': '/bollywoodglamor.png',
    'minimalistmodern': '/minimalist pastel.png',
    'luxurycontemporary': '/classic contemporary.png',
    'ecofriendlysustainable': '/eco sustainable.png',
    'floralparadise': '/floralparadise.png',
    'bohemianchic': '/boho.png',
  };

  if (idMap[t]) return idMap[t];

  // Fuzzy keyword matches (for AI-generated or free-text theme names)
  const keywords: Array<{ match: string[]; image: string }> = [
    { match: ['rajasthan', 'royal', 'palace', 'regal', 'maharaja'], image: '/rajasthani royal.png' },
    { match: ['traditional', 'regional', 'heritage', 'temple', 'cultural'], image: '/traditional.png' },
    { match: ['vintage', 'classic', 'retro', 'antique', 'oldworld'], image: '/vintage.png' },
    { match: ['bollywood', 'glamour', 'glamor', 'cinematic', 'filmy'], image: '/bollywoodglamor.png' },
    { match: ['minimalist', 'modern', 'pastel', 'clean', 'simple'], image: '/minimalist pastel.png' },
    { match: ['luxury', 'contemporary', 'premium', 'urban', 'elegant'], image: '/classic contemporary.png' },
    { match: ['eco', 'sustainable', 'green', 'organic', 'nature'], image: '/eco sustainable.png' },
    { match: ['floral', 'flower', 'garden', 'botanical', 'paradise'], image: '/floralparadise.png' },
    { match: ['boho', 'bohemian', 'chic', 'artistic', 'eclectic'], image: '/boho.png' },
    { match: ['beach', 'destination', 'coastal', 'sea', 'tropical'], image: '/images/themes/beach-destination.jpg' },
    { match: ['south', 'indian', 'temple'], image: '/images/themes/south-indian-temple.jpg' },
  ];

  for (const kw of keywords) {
    if (kw.match.some((m) => t.includes(m))) return kw.image;
  }

  return '/classic contemporary.png';
}

/** All available theme images for gallery/grid displays */
export const ALL_THEME_IMAGES = [
  { id: 'rajasthani-royal', label: 'Royal Rajasthani', src: '/rajasthani royal.png' },
  { id: 'traditional', label: 'Traditional Heritage', src: '/traditional.png' },
  { id: 'vintage', label: 'Vintage Classic', src: '/vintage.png' },
  { id: 'bollywood', label: 'Bollywood Glamour', src: '/bollywoodglamor.png' },
  { id: 'minimalist', label: 'Minimalist Modern', src: '/minimalist pastel.png' },
  { id: 'contemporary', label: 'Luxury Contemporary', src: '/classic contemporary.png' },
  { id: 'eco', label: 'Eco Sustainable', src: '/eco sustainable.png' },
  { id: 'floral', label: 'Floral Paradise', src: '/floralparadise.png' },
  { id: 'boho', label: 'Bohemian Chic', src: '/boho.png' },
];

/** All venue images for venue displays */
export const VENUE_IMAGES: Record<string, string> = {
  'heritage-palaces': '/images/venues/heritage palace.png',
  'luxury-hotels': '/images/venues/luxury hotel.png',
  'heritage-havelis': '/images/venues/heritagehaveli.png',
  'royal-forts': '/images/venues/royal fort.png',
  'beach-resorts': '/images/venues/beachresort.png',
  'mountain-resorts': '/images/venues/mountain.png',
  'garden-venues': '/images/venues/garden.png',
  'farmhouses': '/images/venues/farmhouse.png',
  'lake-resorts': '/images/venues/lakeresort.png',
  'banquet-halls': '/images/venues/banquet.png',
  'community-halls': '/images/venues/communityhall.png',
  'temple-venues': '/images/venues/temple.png',
  'gurudwara-venues': '/images/venues/gurudwara.png',
  'rooftop-venues': '/images/venues/rooftop.png',
  'luxury-villas': '/images/venues/luxuryvilla.png',
  'industrial-venues': '/images/venues/industrial.png',
};
