#!/usr/bin/env node

const { ThemeImageGenerator } = require('./src/services/theme_image_generator.ts');

async function generateAllThemeImages() {
  console.log('🎨 Starting theme image generation for all Indian wedding themes...');
  console.log('⏳ This will take approximately 2-3 minutes for all 12 themes...\n');
  
  try {
    const startTime = Date.now();
    
    const themeImages = await ThemeImageGenerator.generateAllThemeImages();
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log('\n🎉 Theme image generation completed!');
    console.log(`⏱️  Total time: ${duration} seconds`);
    console.log('\n📊 Generation Summary:');
    
    let totalImages = 0;
    let successfulThemes = 0;
    
    for (const [themeId, themeData] of Object.entries(themeImages)) {
      const imageCount = themeData.images.length;
      totalImages += imageCount;
      
      if (imageCount > 0) {
        successfulThemes++;
        console.log(`✅ ${themeData.name}: ${imageCount} images`);
      } else {
        console.log(`❌ ${themeData.name}: No images generated`);
      }
    }
    
    console.log(`\n📈 Statistics:`);
    console.log(`   • Total themes: ${Object.keys(themeImages).length}`);
    console.log(`   • Successful themes: ${successfulThemes}`);
    console.log(`   • Total images generated: ${totalImages}`);
    console.log(`   • Average images per theme: ${Math.round(totalImages / Object.keys(themeImages).length)}`);
    
    // Save the results to a JSON file
    const fs = require('fs');
    const outputPath = './src/data/theme-images.json';
    
    // Ensure the directory exists
    const dir = require('path').dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(themeImages, null, 2));
    console.log(`\n💾 Theme images saved to: ${outputPath}`);
    
    console.log('\n🚀 Next steps:');
    console.log('   1. Check the generated images in the JSON file');
    console.log('   2. Update the theme components to use these images');
    console.log('   3. Test the theme selection in the UI');
    
  } catch (error) {
    console.error('❌ Error generating theme images:', error);
    process.exit(1);
  }
}

// Run the generation
if (require.main === module) {
  generateAllThemeImages();
}

module.exports = { generateAllThemeImages }; 