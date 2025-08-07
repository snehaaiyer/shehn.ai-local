async function testVenueImageGeneration() {
  console.log('🧪 Testing Venue Image Generation...\n');

  const venueTypes = [
    {
      id: 'heritage-palaces',
      name: 'Heritage Palaces',
      prompt: 'A majestic heritage palace wedding venue with grand architecture, royal courtyards, ornate decorations, traditional Indian wedding setup, elegant arches, and historical grandeur'
    },
    {
      id: 'luxury-hotels',
      name: 'Luxury Hotels',
      prompt: 'A luxurious five-star hotel wedding venue with elegant ballrooms, crystal chandeliers, sophisticated modern decor, premium white and gold color scheme, beautifully set tables with fine china'
    }
  ];

  for (const venue of venueTypes) {
    console.log(`🎯 Testing: ${venue.name}`);
    
    try {
      const requestData = {
        prompt: venue.prompt,
        num_images: 1,
        width: 1024,
        height: 1024
      };

      console.log('📤 Sending request to local worker...');
      const response = await fetch('http://localhost:8787/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Success! Generated image for ${venue.name}:`);
        console.log(`   URL: ${result.images[0]}`);
        console.log(`   Image count: ${result.images.length}`);
        console.log(`   Success: ${result.success}`);
      } else {
        console.log(`❌ Failed to generate image for ${venue.name}:`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Text: ${await response.text()}`);
      }
    } catch (error) {
      console.log(`❌ Error generating image for ${venue.name}:`);
      console.log(`   Error: ${error.message}`);
    }
    
    console.log('---\n');
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('🏁 Venue image generation test completed!');
}

// Run the test
testVenueImageGeneration().catch(console.error); 