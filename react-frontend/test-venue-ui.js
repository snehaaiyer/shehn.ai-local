// Test script to verify venue image generation with React UI

async function testVenueUI() {
  console.log('🧪 Testing Venue Image Generation with React UI...\n');

  try {
    // Test the deployed worker directly
    console.log('1. Testing deployed worker...');
    const workerResponse = await fetch('https://wedding-ai-worker.aiyersneha19.workers.dev/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'A beautiful heritage palace wedding venue',
        num_images: 1,
        width: 1024,
        height: 1024
      })
    });

    if (workerResponse.ok) {
      const result = await workerResponse.json();
      console.log('✅ Deployed worker response:');
      console.log(`   Success: ${result.success}`);
      console.log(`   Model: ${result.model}`);
      console.log(`   Images count: ${result.images.length}`);
      console.log(`   First image length: ${result.images[0].length} characters`);
      console.log(`   Is base64: ${result.images[0].startsWith('data:image') || result.images[0].length > 1000}`);
    } else {
      console.log('❌ Deployed worker error:', workerResponse.status);
    }

    // Test React app
    console.log('\n2. Testing React app...');
    const reactResponse = await fetch('http://localhost:3000');
    if (reactResponse.ok) {
      console.log('✅ React app is running at http://localhost:3000');
    } else {
      console.log('❌ React app error:', reactResponse.status);
    }

    console.log('\n🎯 Next Steps:');
    console.log('1. Open http://localhost:3000 in your browser');
    console.log('2. Navigate to Wedding Preferences');
    console.log('3. Click on the Venue tab');
    console.log('4. Look for "Generate Venue Images" button in the top-right');
    console.log('5. Click the button to generate real AI images');
    console.log('6. Watch as venue cards display real AI-generated images!');

    console.log('\n📋 Expected Results:');
    console.log('- Real AI-generated images should appear in venue cards');
    console.log('- Images should be saved as files in public/images/venues/');
    console.log('- No more placeholder "Generate image to see venue" text');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testVenueUI(); 