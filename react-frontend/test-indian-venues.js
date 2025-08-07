// Test script to verify Indian-specific venue prompts


async function testIndianVenues() {
  console.log('🧪 Testing Indian-Specific Venue Prompts...\n');

  const testVenues = [
    {
      name: 'Heritage Palaces',
      prompt: 'A majestic heritage palace wedding venue with grand Mughal architecture, intricately carved marble walls, royal courtyards with fountains, ornate chandeliers, traditional Indian wedding mandap setup, elegant arches with floral decorations, and historical grandeur perfect for royal celebrations'
    },
    {
      name: 'Luxury Hotels',
      prompt: 'A luxurious five-star Indian hotel wedding venue with grand ballrooms, crystal chandeliers, sophisticated modern decor, premium white and gold color scheme, beautifully set tables with fine china, traditional Indian wedding mandap setup, and world-class amenities perfect for grand Indian celebrations'
    },
    {
      name: 'Heritage Havelis',
      prompt: 'A beautiful heritage haveli wedding venue with traditional Rajasthani architecture, ornate courtyards with jharokhas, colorful frescoes depicting Indian mythology, traditional wedding mandap setup with marigold decorations, and cultural authenticity perfect for traditional Indian weddings'
    }
  ];

  for (const venue of testVenues) {
    console.log(`🎯 Testing: ${venue.name}`);
    console.log(`📝 Prompt: ${venue.prompt.substring(0, 100)}...`);
    
    try {
      const response = await fetch('https://wedding-ai-worker.aiyersneha19.workers.dev/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: venue.prompt,
          num_images: 1,
          width: 1024,
          height: 1024
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Success! Generated image for ${venue.name}`);
        console.log(`   Model: ${result.model}`);
        console.log(`   Image length: ${result.images[0].length} characters`);
        console.log(`   Is base64: ${result.images[0].startsWith('data:image') || result.images[0].length > 1000}`);
      } else {
        console.log(`❌ Failed to generate image for ${venue.name}: Status ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Error generating image for ${venue.name}:`, error.message);
    }
    
    console.log('---\n');
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('🎉 Indian venue prompt testing completed!');
  console.log('\n📋 Next Steps:');
  console.log('1. Open http://localhost:3000 in your browser');
  console.log('2. Go to Wedding Preferences → Venue tab');
  console.log('3. Click "Generate Venue Images"');
  console.log('4. Watch as Indian-specific venue images are generated!');
}

testIndianVenues(); 