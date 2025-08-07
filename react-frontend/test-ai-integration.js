// Quick test for AI integration
const testAI = async () => {
  console.log('🧪 Testing AI Integration...');
  
  try {
    // Test backend API
    const response = await fetch('http://localhost:8000/api/search-images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'elegant classic white and gold luxury hotel wedding venue',
        num_results: 4
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Backend API working:', result.images.length, 'images returned');
      
      // Test React app
      const reactResponse = await fetch('http://localhost:3000');
      if (reactResponse.ok) {
        console.log('✅ React app accessible at http://localhost:3000');
        console.log('');
        console.log('🎉 AI Integration Test Results:');
        console.log('✅ Backend API (Port 8000): Working');
        console.log('✅ React Frontend (Port 3000): Working');
        console.log('✅ Image Search API: Working');
        console.log('');
        console.log('🚀 Ready to test AI features!');
        console.log('1. Go to: http://localhost:3000');
        console.log('2. Navigate to Wedding Preferences');
        console.log('3. Fill in theme details');
        console.log('4. Click "Generate AI Images"');
        console.log('5. See real wedding venue images!');
      } else {
        console.log('❌ React app not accessible');
      }
    } else {
      console.log('❌ Backend API not working');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testAI(); 