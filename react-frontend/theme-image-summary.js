#!/usr/bin/env node

const { ThemeImageGenerator } = require('./src/services/theme_image_generator.ts');

function showThemeImageSummary() {
  console.log('🎨 Theme Image Summary\n');
  
  const themesWithExistingImages = ThemeImageGenerator.getThemesWithExistingImages();
  const themesNeedingGeneration = ThemeImageGenerator.getThemesNeedingGeneration();
  const allThemes = ThemeImageGenerator.getAllThemes();
  
  console.log('📋 Themes with Existing Images:');
  themesWithExistingImages.forEach(themeId => {
    const theme = allThemes[themeId];
    const existingImage = ThemeImageGenerator.getExistingImageForTheme(themeId);
    console.log(`  ✅ ${theme.name} - ${existingImage}`);
  });
  
  console.log('\n🖼️ Themes Needing Generation:');
  themesNeedingGeneration.forEach(themeId => {
    const theme = allThemes[themeId];
    console.log(`  🔄 ${theme.name} - Will generate new image`);
  });
  
  console.log('\n📊 Statistics:');
  console.log(`  • Total themes: ${Object.keys(allThemes).length}`);
  console.log(`  • Themes with existing images: ${themesWithExistingImages.length}`);
  console.log(`  • Themes needing generation: ${themesNeedingGeneration.length}`);
  console.log(`  • Existing image coverage: ${Math.round((themesWithExistingImages.length / Object.keys(allThemes).length) * 100)}%`);
  
  console.log('\n🎯 Action Required:');
  if (themesNeedingGeneration.length === 0) {
    console.log('  ✅ All themes have images! No generation needed.');
  } else {
    console.log(`  🔄 Need to generate images for ${themesNeedingGeneration.length} themes`);
    console.log('  💡 Run the theme image processing to generate missing images');
  }
  
  console.log('\n🚀 Next Steps:');
  console.log('  1. Visit http://localhost:3000');
  console.log('  2. Go to Wedding Preferences');
  console.log('  3. Click "Process Theme Images"');
  console.log('  4. Watch as existing images are preserved and new ones are generated');
}

// Run the summary
if (require.main === module) {
  showThemeImageSummary();
}

module.exports = { showThemeImageSummary }; 