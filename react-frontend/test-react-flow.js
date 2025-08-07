// Test the exact React app flow
const testReactFlow = async () => {
  console.log('🧪 Testing React app flow...');
  
  try {
    // Simulate the exact request data that React app sends
    const requestData = {
      theme: 'Elegant',
      style: 'Classic',
      colors: 'White and Gold',
      season: 'Spring',
      venueType: 'Luxury Hotel',
      customDescription: '',
      guestCount: 100,
      location: 'Urban setting'
    };

    console.log('📤 Sending request data:', requestData);

    // Simulate the LocalAIService.generateWeddingThemeImages call
    const response = await fetch('http://localhost:8000/api/search-images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `${requestData.theme} ${requestData.style} ${requestData.colors} ${requestData.venueType} wedding venue`,
        num_results: 4
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Backend response received');
      console.log('   Success:', result.success);
      console.log('   Images count:', result.images?.length || 0);
      
      // Simulate the URL extraction that LocalAIService does
      const imageUrls = result.images.map((img) => img.url || img);
      console.log('✅ URL extraction completed');
      console.log('   Extracted URLs count:', imageUrls.length);
      
      // Show the first few URLs
      imageUrls.forEach((url, index) => {
        console.log(`   Image ${index + 1}: ${url.substring(0, 60)}...`);
      });
      
      // Simulate what React app would receive
      const reactResponse = {
        images: imageUrls,
        success: true,
        generatedDescription: `Beautiful ${requestData.theme} ${requestData.style} wedding venue with ${requestData.colors} theme`,
        themeAnalysis: {
          keywords: [requestData.theme, requestData.style, requestData.venueType, 'wedding', 'venue'],
          mood: requestData.theme.toLowerCase(),
          style: requestData.style.toLowerCase(),
          colors: requestData.colors.toLowerCase().split(' and ')
        }
      };
      
      console.log('');
      console.log('🎉 React app would receive:');
      console.log('   Success:', reactResponse.success);
      console.log('   Images count:', reactResponse.images.length);
      console.log('   Description:', reactResponse.generatedDescription);
      console.log('   Keywords:', reactResponse.themeAnalysis.keywords.join(', '));
      
      // Test if images are accessible
      console.log('');
      console.log('🔍 Testing image accessibility...');
      for (let i = 0; i < Math.min(2, imageUrls.length); i++) {
        try {
          const imgResponse = await fetch(imageUrls[i], { method: 'HEAD' });
          console.log(`   Image ${i + 1}: ${imgResponse.ok ? '✅ Accessible' : '❌ Not accessible'} (${imgResponse.status})`);
        } catch (error) {
          console.log(`   Image ${i + 1}: ❌ Error accessing (${error.message})`);
        }
      }
      
    } else {
      console.log('❌ Backend API error:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testReactFlow(); 