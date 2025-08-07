#!/usr/bin/env node

// Simple test script to generate images for a few themes
const { LocalAIService } = require('./src/services/local_ai_service.ts');

async function testThemeGeneration() {
  console.log('🧪 Testing theme image generation...\n');
  
  const testThemes = [
    {
      id: 'traditional-hindu',
      name: 'Traditional Hindu',
      prompt: 'Traditional Hindu wedding mandap with red and gold decorations, marigold flowers, sacred fire, and traditional Indian architecture. Elegant and spiritual atmosphere with intricate designs and cultural elements.'
    },
    {
      id: 'destination-goa',
      name: 'Destination Goa',
      prompt: 'Goa destination wedding on a beautiful beach with Portuguese colonial architecture, palm trees, and tropical decorations. Romantic beachside setting with Indian and Portuguese cultural fusion.'
    },
    {
      id: 'heritage-palace',
      name: 'Heritage Palace',
      prompt: 'Heritage palace wedding venue with royal Indian architecture, grand halls, intricate carvings, and luxurious decorations. Majestic and opulent atmosphere with traditional palace elements.'
    }
  ];

  for (const theme of testThemes) {
    try {
      console.log(`🖼️ Testing: ${theme.name}`);
      
      const requestData = {
        theme: theme.name,
        style: 'Traditional',
        colors: 'Red & Gold',
        season: 'Wedding Season',
        venueType: 'Heritage Palace',
        customDescription: theme.prompt,
        guestCount: 200,
        location: 'India',
        imageCount: 1
      };

      const response = await LocalAIService.generateWeddingThemeImages(requestData);
      
      if (response.success && response.images) {
        console.log(`✅ ${theme.name}: Generated ${response.images.length} images`);
        console.log(`   Images: ${response.images.join(', ')}`);
      } else {
        console.log(`❌ ${theme.name}: Failed to generate images`);
        console.log(`   Error: ${response.error || 'Unknown error'}`);
      }
      
      console.log('');
      
      // Add delay between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ Error testing ${theme.name}:`, error.message);
      console.log('');
    }
  }
  
  console.log('🎉 Theme generation test completed!');
}

// Run the test
if (require.main === module) {
  testThemeGeneration();
}

module.exports = { testThemeGeneration }; 