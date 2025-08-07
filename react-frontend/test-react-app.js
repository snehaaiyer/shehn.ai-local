// Test React app accessibility
const testReactApp = async () => {
  console.log('🧪 Testing React app accessibility...');
  
  try {
    const response = await fetch('http://localhost:3000');
    if (response.ok) {
      console.log('✅ React app is accessible');
      console.log('✅ Status:', response.status);
      
      // Check if it's a React app
      const html = await response.text();
      if (html.includes('react') || html.includes('React')) {
        console.log('✅ Confirmed React app');
      } else {
        console.log('⚠️  May not be React app');
      }
      
      console.log('');
      console.log('🎯 Next steps:');
      console.log('1. Open http://localhost:3000 in browser');
      console.log('2. Navigate to Wedding Preferences');
      console.log('3. Fill in wedding details');
      console.log('4. Click "Generate AI Images"');
      console.log('5. Check browser console for debug messages');
      
    } else {
      console.log('❌ React app not accessible:', response.status);
    }
  } catch (error) {
    console.error('❌ Error accessing React app:', error.message);
  }
};

testReactApp(); 