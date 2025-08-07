/**
 * Test script for Wedding Blueprint functionality
 * Run this to test the AI integration
 */

// Mock preferences for testing
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

// Test the Wedding Blueprint Service
async function testWeddingBlueprint() {
  console.log('🧪 Testing Wedding Blueprint Service...\n');
  
  try {
    // Test Cloudflare AI Service
    console.log('1. Testing Cloudflare AI Service...');
    const { CloudflareAIService } = await import('./src/services/cloudflare_ai_service.ts');
    
    const cloudflareTest = await CloudflareAIService.generateWeddingThemeImages({
      theme: 'Traditional Hindu',
      style: 'Traditional',
      colors: 'Red and Gold',
      season: 'Wedding Season',
      venueType: 'Luxury Hotel',
      customDescription: 'A beautiful traditional Hindu wedding setup',
      guestCount: 200,
      location: 'Mumbai, India',
      imageCount: 1
    });
    
    console.log('✅ Cloudflare AI Service:', cloudflareTest.success ? 'SUCCESS' : 'FAILED');
    if (cloudflareTest.success) {
      console.log('   - Images generated:', cloudflareTest.images?.length || 0);
      console.log('   - Description:', cloudflareTest.generatedDescription?.substring(0, 100) + '...');
    } else {
      console.log('   - Error:', cloudflareTest.error);
    }
    
    // Test Gemini Service
    console.log('\n2. Testing Gemini Service...');
    const { GeminiService } = await import('./src/services/gemini_service.ts');
    
    const geminiTest = await GeminiService.generateThemeAnalysis({
      theme: 'Traditional Hindu',
      style: 'Traditional',
      colors: 'Red and Gold',
      season: 'Wedding Season',
      venueType: 'Luxury Hotel',
      customDescription: 'A beautiful traditional Hindu wedding setup',
      guestCount: 200,
      location: 'Mumbai, India'
    });
    
    console.log('✅ Gemini Service:', geminiTest.success ? 'SUCCESS' : 'FAILED');
    if (geminiTest.success) {
      console.log('   - Description:', geminiTest.generatedDescription?.substring(0, 100) + '...');
      console.log('   - Keywords:', geminiTest.themeAnalysis?.keywords?.join(', '));
    } else {
      console.log('   - Error:', geminiTest.error);
    }
    
    // Test Wedding Blueprint Service
    console.log('\n3. Testing Wedding Blueprint Service...');
    const { WeddingBlueprintService } = await import('./src/services/wedding_blueprint_service.ts');
    
    const blueprintTest = await WeddingBlueprintService.generateWeddingBlueprint(testPreferences);
    
    console.log('✅ Wedding Blueprint Service:', blueprintTest.success ? 'SUCCESS' : 'FAILED');
    if (blueprintTest.success && blueprintTest.blueprint) {
      console.log('   - Summary length:', blueprintTest.blueprint.summary?.length || 0);
      console.log('   - Venue image:', blueprintTest.blueprint.venueImage ? 'GENERATED' : 'NOT GENERATED');
      console.log('   - Theme image:', blueprintTest.blueprint.themeImage ? 'GENERATED' : 'NOT GENERATED');
      console.log('   - Photography image:', blueprintTest.blueprint.photographyImage ? 'GENERATED' : 'NOT GENERATED');
      console.log('   - Recommendations:', Object.keys(blueprintTest.blueprint.recommendations || {}).length);
      console.log('   - Timeline items:', blueprintTest.blueprint.timeline?.length || 0);
      console.log('   - Budget total:', blueprintTest.blueprint.budgetBreakdown?.total || 0);
    } else {
      console.log('   - Error:', blueprintTest.error);
    }
    
    console.log('\n🎉 Wedding Blueprint Test Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testWeddingBlueprint(); 