
/**
 * Enhanced Indian Wedding Theme Prompts for External Image Generation
 * Use these prompts with any AI image generation service (Midjourney, DALL-E, Stable Diffusion, etc.)
 */

const INDIAN_WEDDING_THEME_PROMPTS = {
  // Royal & Traditional Themes
  'royal-palace-rajasthani': {
    name: 'Royal Palace/Rajasthani Theme',
    description: 'Majestic Rajasthani palace celebrations with royal grandeur, mirror work, and desert charm',
    prompt: `Cinematic wide shot of a magnificent Rajasthani royal palace Indian wedding ceremony. Traditional red sandstone architecture with intricate carved jharokhas and ornate mirror work. Golden mandap decorated with vibrant marigold garlands and roses. Bride in red lehenga with heavy gold jewelry, groom in cream sherwani with kalgi. Traditional Rajasthani musicians playing shehnai and tabla. Warm golden hour lighting, rich red and gold color palette, ultra-detailed, 4K quality, professional wedding photography style.`,
    colors: ['Red', 'Gold', 'Cream', 'Orange'],
    features: ['Heritage Palaces', 'Royal Rajasthani Decor', 'Mirror Work', 'Traditional Music']
  },

  'traditional-regional-roots': {
    name: 'Traditional Regional Themes',
    description: 'Authentic celebrations reflecting specific cultural roots and regional traditions',
    prompt: `Beautiful traditional South Indian temple wedding ceremony with authentic cultural elements. Ornate carved stone pillars and temple architecture. Bride in silk Kanjivaram saree with temple jewelry, groom in white dhoti and angavastram. Sacred fire ceremony with banana leaves, coconut decorations, and colorful rangoli patterns. Traditional nadaswaram music, brass oil lamps, jasmine garlands. Warm temple lighting, rich jewel tones, ultra-detailed Indian cultural authenticity, 4K cinematic quality.`,
    colors: ['Gold', 'Red', 'White', 'Green'],
    features: ['Regional Customs', 'Cultural Authenticity', 'Local Traditions', 'Heritage Elements']
  },

  'eco-friendly-sustainable': {
    name: 'Eco-Friendly Sustainable Weddings',
    description: 'Green celebrations with sustainable practices, organic decorations, and eco-conscious choices',
    prompt: `Stunning eco-friendly Indian wedding in lush garden setting. Natural bamboo mandap with living plants and organic decorations. Couple in sustainable traditional wear - bride in handloom saree, groom in organic cotton kurta. Potted plants replacing cut flowers, solar string lights, biodegradable leaf plates. Natural wood furniture, jute decorations, earthen diyas. Green and earth tone color palette, soft natural lighting, 4K eco-conscious celebration, professional nature photography style.`,
    colors: ['Green', 'Brown', 'Natural', 'Earth Tones'],
    features: ['Organic Decorations', 'Sustainable Practices', 'Natural Elements', 'Eco-Conscious']
  },

  'bollywood-glamour': {
    name: 'Bollywood Glamour Theme',
    description: 'Vibrant Bollywood-inspired celebrations with glamour, dance, and cinematic grandeur',
    prompt: `Glamorous Bollywood-style Indian wedding reception with cinematic grandeur. Large dance floor with disco balls and dramatic spotlights. Vintage Bollywood movie posters and film reel decorations. Bride in heavily embellished lehenga with statement jewelry, groom in designer sherwani. Golden and red sequined draping, champagne towers, red carpet entrance. Professional dancers performing, live orchestra, vibrant party atmosphere. Rich golden lighting, 4K cinematic quality, Bollywood movie aesthetic.`,
    colors: ['Gold', 'Red', 'Black', 'Silver'],
    features: ['Cinematic Setup', 'Glamorous Decor', 'Dance Floor', 'Vibrant Colors']
  },

  'minimalist-modern': {
    name: 'Minimalist Modern Theme',
    description: 'Clean, contemporary celebrations with sophisticated simplicity and modern elegance',
    prompt: `Sophisticated minimalist modern Indian wedding with contemporary elegance. Clean geometric mandap with simple white and gold decorations. Couple in modern traditional wear - bride in subtle pastel lehenga, groom in contemporary sherwani. Sleek furniture, geometric floral arrangements, modern lighting fixtures. Neutral color palette of whites, greys, and soft pastels. Uncluttered space design, glass elements, architectural lines. Soft professional lighting, 4K ultra-clean aesthetic, luxury hotel setting.`,
    colors: ['White', 'Grey', 'Pastels', 'Gold Accents'],
    features: ['Clean Lines', 'Modern Furniture', 'Neutral Colors', 'Sophisticated Simplicity']
  },

  'floral-paradise': {
    name: 'Floral Paradise Theme',
    description: 'Enchanting celebrations surrounded by abundant flowers, garden elements, and natural beauty',
    prompt: `Breathtaking floral paradise Indian wedding in blooming garden. Mandap completely covered in roses, jasmine, and marigolds. Massive floral archways and hanging flower installations. Bride in floral-themed lehenga with fresh flower jewelry, groom with floral sehra. Flower walls as backdrops, floral carpets, botanical ceiling decorations. Pastel color palette with pinks, whites, and soft greens. Natural garden setting with butterflies, 4K botanical paradise, dreamy romantic lighting, professional garden photography.`,
    colors: ['Pink', 'White', 'Soft Green', 'Lavender'],
    features: ['Abundant Flowers', 'Garden Elements', 'Floral Arches', 'Natural Beauty']
  },

  'bohemian-chic': {
    name: 'Bohemian Chic Theme',
    description: 'Free-spirited celebrations with eclectic decor, artistic elements, and bohemian charm',
    prompt: `Bohemian chic Indian wedding with artistic eclectic decorations. Mandap with flowing fabrics, macrame hanging installations, vintage rugs and floor cushions. Bride in boho-style lehenga with oxidized jewelry, groom in artistic kurta. Dreamcatchers, feathers, mixed textures and patterns. Vintage furniture pieces, natural wood elements, fairy lights. Warm earth tones with jewel color pops, outdoor garden setting. 4K artistic bohemian aesthetic, free-spirited celebration, warm golden lighting.`,
    colors: ['Earth Tones', 'Jewel Colors', 'Rust', 'Turquoise'],
    features: ['Eclectic Decor', 'Artistic Elements', 'Vintage Furniture', 'Free-Spirited Vibe']
  },

  'vintage-classic': {
    name: 'Vintage Classic Theme',
    description: 'Timeless celebrations with classic elegance, antique elements, and nostalgic charm',
    prompt: `Vintage classic Indian wedding with timeless elegance and nostalgic charm. Heritage mandap with antique furniture and vintage lace decorations. Bride in classic heavy silk saree with traditional gold jewelry, groom in vintage-style achkan. Vintage Indian brass items, heritage photographs, classic floral arrangements in antique vases. Old Bollywood music setup, heritage textiles, sepia-toned lighting. Warm vintage color palette, 4K classic elegance, professional heritage photography style, old-world charm.`,
    colors: ['Sepia', 'Gold', 'Cream', 'Bronze'],
    features: ['Antique Elements', 'Classic Elegance', 'Vintage Furniture', 'Nostalgic Charm']
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = INDIAN_WEDDING_THEME_PROMPTS;
}

// For browser usage
if (typeof window !== 'undefined') {
  window.INDIAN_WEDDING_THEME_PROMPTS = INDIAN_WEDDING_THEME_PROMPTS;
}

console.log('🎨 Indian Wedding Theme Prompts loaded successfully!');
console.log(`📝 Total themes available: ${Object.keys(INDIAN_WEDDING_THEME_PROMPTS).length}`);

// Print all prompts for easy copying
Object.entries(INDIAN_WEDDING_THEME_PROMPTS).forEach(([key, theme]) => {
  console.log(`\n🎭 ${theme.name}`);
  console.log(`📖 Description: ${theme.description}`);
  console.log(`🎨 Colors: ${theme.colors.join(', ')}`);
  console.log(`✨ Features: ${theme.features.join(', ')}`);
  console.log(`📝 PROMPT:\n${theme.prompt}`);
  console.log('=' repeat(80));
});
