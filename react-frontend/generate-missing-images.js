#!/usr/bin/env node

// Script to generate missing theme images immediately
const { LocalAIService } = require('./src/services/local_ai_service.ts');

async function generateMissingImages() {
  console.log('🎨 Generating missing theme images...\n');
  
  const missingThemes = [
    {
      id: 'traditional-hindu',
      name: 'Traditional Hindu',
      prompt: 'Traditional Hindu wedding mandap with red and gold decorations, marigold flowers, sacred fire, and traditional Indian architecture. Elegant and spiritual atmosphere with intricate designs and cultural elements.'
    },
    {
      id: 'sikh-anand-karaj',
      name: 'Sikh Anand Karaj',
      prompt: 'Sikh Anand Karaj ceremony in a beautiful gurudwara with golden domes, white marble, and traditional Sikh decorations. Sacred atmosphere with Guru Granth Sahib and traditional Sikh wedding setup.'
    },
    {
      id: 'muslim-nikah',
      name: 'Muslim Nikah',
      prompt: 'Muslim Nikah ceremony in an elegant mosque or Islamic wedding hall with traditional Islamic architecture, beautiful arches, and elegant decorations. Peaceful and sacred atmosphere with traditional Islamic wedding elements.'
    },
    {
      id: 'christian-church',
      name: 'Christian Church',
      prompt: 'Beautiful Christian church wedding with stained glass windows, elegant white decorations, and traditional church architecture. Romantic and sacred atmosphere with classic wedding elements.'
    },
    {
      id: 'luxury-hotel',
      name: 'Luxury Hotel',
      prompt: 'Luxury hotel wedding venue with modern amenities, elegant ballroom, crystal chandeliers, and sophisticated decorations. Contemporary and luxurious atmosphere with high-end wedding elements.'
    },
    {
      id: 'farmhouse-wedding',
      name: 'Farmhouse Wedding',
      prompt: 'Farmhouse wedding venue with rustic charm, natural surroundings, and modern comforts. Cozy and intimate atmosphere with traditional Indian farmhouse wedding elements.'
    },
    {
      id: 'mountain-retreat',
      name: 'Mountain Retreat',
      prompt: 'Mountain retreat wedding in the Himalayas with breathtaking views, natural beauty, and serene atmosphere. Peaceful and romantic setting with traditional Indian mountain wedding elements.'
    }
  ];

  const generatedImages = {};
  
  for (const theme of missingThemes) {
    try {
      console.log(`🖼️ Generating image for: ${theme.name}`);
      
      const requestData = {
        theme: theme.name,
        style: 'Traditional',
        colors: 'Red & Gold',
        season: 'Wedding Season',
        venueType: getVenueTypeForTheme(theme.id),
        customDescription: theme.prompt,
        guestCount: 200,
        location: 'India',
        imageCount: 1
      };

      const response = await LocalAIService.generateWeddingThemeImages(requestData);
      
      if (response.success && response.images) {
        generatedImages[theme.id] = response.images;
        console.log(`✅ Generated image for ${theme.name}: ${response.images[0]}`);
      } else {
        console.log(`❌ Failed to generate image for ${theme.name}`);
        // Use fallback image
        generatedImages[theme.id] = [
          'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1024&h=1024&fit=crop'
        ];
      }
      
      // Add delay between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ Error generating image for ${theme.name}:`, error.message);
      // Use fallback image
      generatedImages[theme.id] = [
        'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1024&h=1024&fit=crop'
      ];
    }
  }
  
  // Save to localStorage
  const fs = require('fs');
  const localStorageData = JSON.stringify(generatedImages, null, 2);
  
  console.log('\n💾 Saving generated images to localStorage...');
  console.log('Generated images:', localStorageData);
  
  console.log('\n🎉 Image generation completed!');
  console.log('📋 Next steps:');
  console.log('1. Copy the generated images data above');
  console.log('2. Open browser console on http://localhost:3000');
  console.log('3. Run: localStorage.setItem("themeImages", \'[PASTE_DATA_HERE]\')');
  console.log('4. Refresh the page to see the new images');
  
  console.log('\n🗑️ Removed Themes:');
  console.log('  • Destination Goa (removed)');
  console.log('  • Heritage Palace (removed)');
  console.log('  • Garden Mehendi (removed)');
}

function getVenueTypeForTheme(themeId) {
  const venueMapping = {
    'traditional-hindu': 'Heritage Palace',
    'sikh-anand-karaj': 'Gurudwara',
    'muslim-nikah': 'Banquet Hall',
    'christian-church': 'Church',
    'luxury-hotel': 'Luxury Hotel',
    'farmhouse-wedding': 'Farmhouse',
    'mountain-retreat': 'Mountain Resort'
  };
  
  return venueMapping[themeId] || 'Heritage Palace';
}

// Run the generation
if (require.main === module) {
  generateMissingImages();
}

module.exports = { generateMissingImages }; 