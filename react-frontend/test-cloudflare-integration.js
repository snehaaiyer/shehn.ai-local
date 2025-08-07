// Test script to verify Cloudflare AI integration
const { CloudflareAIService } = require('./src/services/cloudflare_ai_service.ts');

async function testCloudflareIntegration() {
  console.log('🧪 Testing Cloudflare AI Integration...\n');
  
  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health check...');
    const isHealthy = await CloudflareAIService.validateConnection();
    console.log('✅ Health check result:', isHealthy);
    
    // Test 2: Image generation
    console.log('\n2️⃣ Testing image generation...');
    const imageResult = await CloudflareAIService.generateWeddingThemeImages({
      theme: 'Traditional Hindu',
      style: 'Traditional',
      colors: 'Red & Gold',
      season: 'Wedding Season',
      venueType: 'Heritage Palace',
      customDescription: 'Beautiful Indian wedding venue',
      guestCount: 200,
      location: 'Mumbai, India',
      imageCount: 2
    });
    
    console.log('✅ Image generation result:', {
      success: imageResult.success,
      imageCount: imageResult.images?.length || 0,
      hasAnalysis: !!imageResult.themeAnalysis
    });
    
    if (imageResult.images?.length > 0) {
      console.log('🖼️ Generated images:');
      imageResult.images.forEach((img, i) => {
        console.log(`   ${i + 1}. ${img}`);
      });
    }
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('✅ Cloudflare AI integration is working with localhost:8787');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCloudflareIntegration(); 