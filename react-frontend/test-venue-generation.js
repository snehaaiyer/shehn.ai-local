// Test script to verify venue image generation

async function testVenueGeneration() {
  console.log('🧪 Testing Venue Image Generation with React App...\n');

  try {
    // Test the worker endpoint
    console.log('1. Testing worker endpoint...');
    const workerResponse = await fetch('http://localhost:8787/generate-image', {
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
      console.log('✅ Worker response:', result);
      console.log('   Image URL:', result.images[0]);
    } else {
      console.log('❌ Worker error:', workerResponse.status);
    }

    // Test React app endpoint
    console.log('\n2. Testing React app...');
    const reactResponse = await fetch('http://localhost:3000');
    if (reactResponse.ok) {
      console.log('✅ React app is running');
    } else {
      console.log('❌ React app error:', reactResponse.status);
    }

    console.log('\n📋 Next Steps:');
    console.log('1. Open http://localhost:3000 in your browser');
    console.log('2. Go to Wedding Preferences tab');
    console.log('3. Click on Venue tab');
    console.log('4. Look for "Generate Venue Images" button');
    console.log('5. Click the button to generate images');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testVenueGeneration(); 