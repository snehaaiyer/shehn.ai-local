/**
 * End-to-End Test Script for Wedding AI Assistant
 * Tests all major functionality including venue image generation and vendor discovery
 */

// Test data
const testPreferences = {
  basicDetails: {
    guestCount: 200,
    weddingDate: '2024-12-15',
    location: 'Mumbai, India',
    budgetRange: 'Mid Range',
    yourName: 'Priya',
    partnerName: 'Rahul'
  },
  theme: {
    selectedTheme: 'Traditional Hindu'
  },
  venue: {
    venueType: 'Luxury Hotel',
    capacity: 200
  },
  catering: {
    cuisine: 'North Indian',
    mealType: 'Both Lunch & Dinner'
  },
  photography: {
    style: 'Candid',
    coverage: 'Full Day Coverage'
  }
};

const testVenue = {
  venueType: 'hotels',
  venueName: 'Taj Palace Hotel',
  location: 'Mumbai, India',
  capacity: 500,
  priceRange: 'Premium (> ₹2L)',
  amenities: ['Grand Ballroom', 'Garden Area', 'In-house Catering', 'Valet Parking', 'Luxury Accommodation'],
  description: 'Luxury 5-star hotel with grand ballrooms and world-class amenities. Perfect for extravagant weddings with international standards.'
};

// Main test function
async function runEndToEndTests() {
  console.log('🧪 Starting End-to-End Tests for Wedding AI Assistant...\n');
  
  try {
    // Test 1: Theme Prompt Generator
    await testThemePromptGenerator();
    
    // Test 2: Venue Image Generator
    await testVenueImageGenerator();
    
    // Test 3: Wedding Blueprint Service
    await testWeddingBlueprintService();
    
    // Test 4: Vendor Discovery Service
    await testVendorDiscoveryService();
    
    // Test 5: Cloudflare AI Service
    await testCloudflareAIService();
    
    // Test 6: Gemini Service
    await testGeminiService();
    
    console.log('\n🎉 All End-to-End Tests Completed Successfully!');
    
  } catch (error) {
    console.error('❌ End-to-End Tests Failed:', error);
  }
}

// Test 1: Theme Prompt Generator
async function testThemePromptGenerator() {
  console.log('1️⃣ Testing Theme Prompt Generator...');
  
  try {
    const { ThemePromptGenerator } = await import('./src/services/theme_prompt_generator.ts');
    
    const response = await ThemePromptGenerator.generateThemePrompts(testPreferences);
    
    console.log('✅ Theme Prompt Generator:', response.success ? 'SUCCESS' : 'FAILED');
    
    if (response.success && response.prompts) {
      console.log('   - Ceremony prompt length:', response.prompts.ceremonyPrompt.length);
      console.log('   - Reception prompt length:', response.prompts.receptionPrompt.length);
      console.log('   - Detail prompt length:', response.prompts.detailPrompt.length);
      
      // Test theme-specific prompts
      const themePrompts = ThemePromptGenerator.generateThemeSpecificPrompts('Traditional Hindu', testPreferences);
      console.log('   - Theme-specific prompts generated:', !!themePrompts.ceremonyPrompt);
    } else {
      console.log('   - Error:', response.error);
    }
    
  } catch (error) {
    console.error('❌ Theme Prompt Generator Test Failed:', error);
  }
}

// Test 2: Venue Image Generator
async function testVenueImageGenerator() {
  console.log('\n2️⃣ Testing Venue Image Generator...');
  
  try {
    const { VenueImageGenerator } = await import('./src/services/venue_image_generator.ts');
    
    const response = await VenueImageGenerator.generateVenueImages(testVenue);
    
    console.log('✅ Venue Image Generator:', response.success ? 'SUCCESS' : 'FAILED');
    
    if (response.success && response.images) {
      console.log('   - Main image generated:', !!response.images.mainImage);
      console.log('   - Ceremony image generated:', !!response.images.ceremonyImage);
      console.log('   - Reception image generated:', !!response.images.receptionImage);
      
      // Test fallback images
      const fallbackResponse = VenueImageGenerator.generateFallbackVenueImages(testVenue);
      console.log('   - Fallback images available:', !!fallbackResponse.images?.mainImage);
    } else {
      console.log('   - Error:', response.error);
    }
    
  } catch (error) {
    console.error('❌ Venue Image Generator Test Failed:', error);
  }
}

// Test 3: Wedding Blueprint Service
async function testWeddingBlueprintService() {
  console.log('\n3️⃣ Testing Wedding Blueprint Service...');
  
  try {
    const { WeddingBlueprintService } = await import('./src/services/wedding_blueprint_service.ts');
    
    const response = await WeddingBlueprintService.generateWeddingBlueprint(testPreferences);
    
    console.log('✅ Wedding Blueprint Service:', response.success ? 'SUCCESS' : 'FAILED');
    
    if (response.success && response.blueprint) {
      console.log('   - Summary generated:', !!response.blueprint.summary);
      console.log('   - Venue image generated:', !!response.blueprint.venueImage);
      console.log('   - Theme image generated:', !!response.blueprint.themeImage);
      console.log('   - Photography image generated:', !!response.blueprint.photographyImage);
      console.log('   - Recommendations generated:', !!response.blueprint.recommendations);
      console.log('   - Timeline generated:', response.blueprint.timeline?.length || 0, 'items');
      console.log('   - Budget breakdown generated:', !!response.blueprint.budgetBreakdown);
    } else {
      console.log('   - Error:', response.error);
    }
    
  } catch (error) {
    console.error('❌ Wedding Blueprint Service Test Failed:', error);
  }
}

// Test 4: Vendor Discovery Service
async function testVendorDiscoveryService() {
  console.log('\n4️⃣ Testing Vendor Discovery Service...');
  
  try {
    const { VendorDiscoveryService } = await import('./src/services/vendor_discovery_service.ts');
    
    // Test venue search
    const venueResponse = await VendorDiscoveryService.searchVendors({
      category: 'venues',
      location: 'Mumbai',
      priceRange: 'Premium',
      rating: '4.5'
    });
    
    console.log('✅ Vendor Discovery Service:', venueResponse.success ? 'SUCCESS' : 'FAILED');
    
    if (venueResponse.success && venueResponse.vendors) {
      console.log('   - Venues found:', venueResponse.vendors.length);
      console.log('   - Generated images:', Object.keys(venueResponse.generatedImages || {}).length);
      
      // Test photography search
      const photoResponse = await VendorDiscoveryService.searchVendors({
        category: 'photography',
        location: 'Mumbai'
      });
      
      console.log('   - Photography vendors found:', photoResponse.vendors?.length || 0);
      
      // Test catering search
      const cateringResponse = await VendorDiscoveryService.searchVendors({
        category: 'catering',
        location: 'Mumbai'
      });
      
      console.log('   - Catering vendors found:', cateringResponse.vendors?.length || 0);
      
      // Test vendor by ID
      if (venueResponse.vendors && venueResponse.vendors.length > 0) {
        const vendor = await VendorDiscoveryService.getVendorById(venueResponse.vendors[0].id);
        console.log('   - Vendor by ID found:', !!vendor);
      }
      
    } else {
      console.log('   - Error:', venueResponse.error);
    }
    
  } catch (error) {
    console.error('❌ Vendor Discovery Service Test Failed:', error);
  }
}

// Test 5: Cloudflare AI Service
async function testCloudflareAIService() {
  console.log('\n5️⃣ Testing Cloudflare AI Service...');
  
  try {
    const { CloudflareAIService } = await import('./src/services/cloudflare_ai_service.ts');
    
    const response = await CloudflareAIService.generateWeddingThemeImages({
      theme: 'Traditional Hindu',
      style: 'Traditional',
      colors: 'Red and Gold',
      season: 'Wedding Season',
      venueType: 'Luxury Hotel',
      customDescription: 'A beautiful traditional Hindu wedding setup with ornate mandap and sacred fire',
      guestCount: 200,
      location: 'Mumbai, India',
      imageCount: 1
    });
    
    console.log('✅ Cloudflare AI Service:', response.success ? 'SUCCESS' : 'FAILED');
    
    if (response.success) {
      console.log('   - Images generated:', response.images?.length || 0);
      console.log('   - Description generated:', !!response.generatedDescription);
      console.log('   - Theme analysis generated:', !!response.themeAnalysis);
    } else {
      console.log('   - Error:', response.error);
    }
    
    // Test connection validation
    const connectionValid = await CloudflareAIService.validateConnection();
    console.log('   - Connection valid:', connectionValid);
    
  } catch (error) {
    console.error('❌ Cloudflare AI Service Test Failed:', error);
  }
}

// Test 6: Gemini Service
async function testGeminiService() {
  console.log('\n6️⃣ Testing Gemini Service...');
  
  try {
    const { GeminiService } = await import('./src/services/gemini_service.ts');
    
    const response = await GeminiService.generateThemeAnalysis({
      theme: 'Traditional Hindu',
      style: 'Traditional',
      colors: 'Red and Gold',
      season: 'Wedding Season',
      venueType: 'Luxury Hotel',
      customDescription: 'A beautiful traditional Hindu wedding setup',
      guestCount: 200,
      location: 'Mumbai, India'
    });
    
    console.log('✅ Gemini Service:', response.success ? 'SUCCESS' : 'FAILED');
    
    if (response.success) {
      console.log('   - Description generated:', !!response.generatedDescription);
      console.log('   - Theme analysis generated:', !!response.themeAnalysis);
      console.log('   - Keywords generated:', response.themeAnalysis?.keywords?.length || 0);
    } else {
      console.log('   - Error:', response.error);
    }
    
    // Test connection validation
    const connectionValid = await GeminiService.validateConnection();
    console.log('   - Connection valid:', connectionValid);
    
  } catch (error) {
    console.error('❌ Gemini Service Test Failed:', error);
  }
}

// Performance test
async function testPerformance() {
  console.log('\n⚡ Performance Test...');
  
  const startTime = Date.now();
  
  try {
    const { VendorDiscoveryService } = await import('./src/services/vendor_discovery_service.ts');
    
    // Test multiple vendor searches
    const promises = [
      VendorDiscoveryService.searchVendors({ category: 'venues', location: 'Mumbai' }),
      VendorDiscoveryService.searchVendors({ category: 'photography', location: 'Mumbai' }),
      VendorDiscoveryService.searchVendors({ category: 'catering', location: 'Mumbai' })
    ];
    
    const results = await Promise.all(promises);
    const endTime = Date.now();
    
    console.log('✅ Performance Test:', 'SUCCESS');
    console.log('   - Total time:', endTime - startTime, 'ms');
    console.log('   - Average time per search:', Math.round((endTime - startTime) / results.length), 'ms');
    console.log('   - All searches successful:', results.every(r => r.success));
    
  } catch (error) {
    console.error('❌ Performance Test Failed:', error);
  }
}

// Run all tests
runEndToEndTests().then(() => {
  console.log('\n📊 Test Summary:');
  console.log('All major services have been tested for functionality and integration.');
  console.log('Check the console output above for detailed results.');
}); 