// Test script to verify venue image generation fix
async function testVenueImageFix() {
  console.log('🧪 Testing Venue Image Generation Fix...\n');

  const testPrompt = 'A majestic heritage palace wedding venue with grand Mughal architecture, intricately carved marble walls, royal courtyards with fountains, ornate chandeliers, traditional Indian wedding mandap setup, elegant arches with floral decorations, and historical grandeur perfect for royal celebrations';

  try {
    console.log('📝 Testing prompt:', testPrompt.substring(0, 100) + '...');
    
    const response = await fetch('http://localhost:8787/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: testPrompt,
        num_images: 1,
        width: 1024,
        height: 1024
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Response received:');
      console.log(`   Success: ${result.success}`);
      console.log(`   Model: ${result.model}`);
      console.log(`   Images count: ${result.images ? result.images.length : 0}`);
      
      if (result.images && result.images.length > 0) {
        const imageUrl = result.images[0];
        console.log(`   Image URL: ${imageUrl}`);
        
        if (imageUrl.startsWith('/images/venues/')) {
          console.log('✅ Image saved as local file!');
          console.log('   This should display properly in the React app');
        } else if (imageUrl.startsWith('data:image')) {
          console.log('⚠️  Image returned as base64 (might be corrupted)');
        } else if (imageUrl.startsWith('http')) {
          console.log('✅ Image returned as external URL (fallback)');
        }
      } else {
        console.log('❌ No images in response');
      }
    } else {
      console.log(`❌ Failed to generate image: Status ${response.status}`);
      const errorText = await response.text();
      console.log(`   Error: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Error generating image:`, error.message);
  }

  console.log('\n📋 Next Steps:');
  console.log('1. Open http://localhost:3000 in your browser');
  console.log('2. Go to Wedding Preferences → Venue tab');
  console.log('3. Click "Generate Venue Images"');
  console.log('4. Check if images display properly now');
}

testVenueImageFix(); 