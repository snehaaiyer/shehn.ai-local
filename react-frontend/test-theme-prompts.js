/**
 * Test script for Theme Prompt Generator
 * Tests the AI-powered prompt generation for wedding theme images
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

// Test the Theme Prompt Generator
async function testThemePromptGenerator() {
  console.log('🧪 Testing Theme Prompt Generator...\n');
  
  try {
    // Test Theme Prompt Generator
    console.log('1. Testing Theme Prompt Generator...');
    const { ThemePromptGenerator } = await import('./src/services/theme_prompt_generator.ts');
    
    const promptResponse = await ThemePromptGenerator.generateThemePrompts(testPreferences);
    
    console.log('✅ Theme Prompt Generator:', promptResponse.success ? 'SUCCESS' : 'FAILED');
    
    if (promptResponse.success && promptResponse.prompts) {
      console.log('\n📝 Generated Prompts:');
      console.log('\n🎭 Ceremony Prompt:');
      console.log(promptResponse.prompts.ceremonyPrompt);
      
      console.log('\n🍽️ Reception Prompt:');
      console.log(promptResponse.prompts.receptionPrompt);
      
      console.log('\n✨ Detail Prompt:');
      console.log(promptResponse.prompts.detailPrompt);
      
      if (promptResponse.descriptions) {
        console.log('\n📋 Descriptions:');
        console.log('Ceremony:', promptResponse.descriptions.ceremonyDescription);
        console.log('Reception:', promptResponse.descriptions.receptionDescription);
        console.log('Details:', promptResponse.descriptions.detailDescription);
      }
    } else {
      console.log('❌ Error:', promptResponse.error);
    }
    
    // Test Theme-Specific Prompts
    console.log('\n2. Testing Theme-Specific Prompts...');
    const themeSpecificPrompts = ThemePromptGenerator.generateThemeSpecificPrompts(
      'Traditional Hindu',
      testPreferences
    );
    
    console.log('✅ Theme-Specific Prompts: SUCCESS');
    console.log('\n🎭 Ceremony Prompt (Theme-Specific):');
    console.log(themeSpecificPrompts.ceremonyPrompt);
    
    console.log('\n🍽️ Reception Prompt (Theme-Specific):');
    console.log(themeSpecificPrompts.receptionPrompt);
    
    console.log('\n✨ Detail Prompt (Theme-Specific):');
    console.log(themeSpecificPrompts.detailPrompt);
    
    // Test different themes
    console.log('\n3. Testing Different Themes...');
    const themes = ['Luxury Hotel', 'Royal Palace', 'Beach Destination', 'Farmhouse Wedding', 'Bollywood Sangeet'];
    
    for (const theme of themes) {
      console.log(`\n🎨 Testing ${theme} theme...`);
      const themePrompts = ThemePromptGenerator.generateThemeSpecificPrompts(theme, testPreferences);
      
      console.log(`✅ ${theme}: SUCCESS`);
      console.log(`   Ceremony: ${themePrompts.ceremonyPrompt.substring(0, 100)}...`);
      console.log(`   Reception: ${themePrompts.receptionPrompt.substring(0, 100)}...`);
      console.log(`   Detail: ${themePrompts.detailPrompt.substring(0, 100)}...`);
    }
    
    console.log('\n🎉 Theme Prompt Generator Test Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testThemePromptGenerator(); 