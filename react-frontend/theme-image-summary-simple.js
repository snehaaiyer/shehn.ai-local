#!/usr/bin/env node

// Comprehensive theme image summary including both original and Indian themes
function showThemeImageSummary() {
  console.log('🎨 Comprehensive Theme Image Summary\n');
  
  // Define all themes with their existing image status
  const themes = [
    // Original Themes
    { id: 'royal-palace', name: 'Royal Palace', hasExisting: true, image: '/images/themes/royal-palace.jpg', category: 'original' },
    { id: 'beach-destination', name: 'Beach Destination', hasExisting: true, image: '/images/themes/beach-destination.jpg', category: 'original' },
    { id: 'boho-garden', name: 'Boho Garden', hasExisting: true, image: '/images/themes/boho-garden.jpg', category: 'original' },
    { id: 'minimalist-pastel', name: 'Minimalist Pastel', hasExisting: true, image: '/images/themes/minimalist-pastel.jpg', category: 'original' },
    { id: 'traditional-cultural', name: 'Traditional Cultural', hasExisting: true, image: '/images/themes/traditional-cultural.jpg', category: 'original' },
    
    // Indian Wedding Themes
    { id: 'traditional-hindu', name: 'Traditional Hindu', hasExisting: false, category: 'indian' },
    { id: 'sikh-anand-karaj', name: 'Sikh Anand Karaj', hasExisting: false, category: 'indian' },
    { id: 'muslim-nikah', name: 'Muslim Nikah', hasExisting: false, category: 'indian' },
    { id: 'christian-church', name: 'Christian Church', hasExisting: false, category: 'indian' },
    { id: 'luxury-hotel', name: 'Luxury Hotel', hasExisting: false, category: 'indian' },
    { id: 'farmhouse-wedding', name: 'Farmhouse Wedding', hasExisting: false, category: 'indian' },
    { id: 'mountain-retreat', name: 'Mountain Retreat', hasExisting: false, category: 'indian' },
    { id: 'bollywood-sangeet', name: 'Bollywood Sangeet', hasExisting: true, image: '/images/themes/bollywood-sangeet.jpg', category: 'indian' },
    { id: 'south-indian-temple', name: 'South Indian Temple', hasExisting: true, image: '/images/themes/south-indian-temple.jpg', category: 'indian' }
  ];
  
  const themesWithExistingImages = themes.filter(t => t.hasExisting);
  const themesNeedingGeneration = themes.filter(t => !t.hasExisting);
  const originalThemes = themes.filter(t => t.category === 'original');
  const indianThemes = themes.filter(t => t.category === 'indian');
  
  console.log('📋 Original Themes (Classic):');
  originalThemes.forEach(theme => {
    const status = theme.hasExisting ? '✅' : '🔄';
    const imageInfo = theme.hasExisting ? ` - ${theme.image}` : ' - Will generate new image';
    console.log(`  ${status} ${theme.name}${imageInfo}`);
  });
  
  console.log('\n🪔 Indian Wedding Themes:');
  indianThemes.forEach(theme => {
    const status = theme.hasExisting ? '✅' : '🔄';
    const imageInfo = theme.hasExisting ? ` - ${theme.image}` : ' - Will generate new image';
    console.log(`  ${status} ${theme.name}${imageInfo}`);
  });
  
  console.log('\n📊 Overall Statistics:');
  console.log(`  • Total themes: ${themes.length}`);
  console.log(`  • Original themes: ${originalThemes.length}`);
  console.log(`  • Indian themes: ${indianThemes.length}`);
  console.log(`  • Themes with existing images: ${themesWithExistingImages.length}`);
  console.log(`  • Themes needing generation: ${themesNeedingGeneration.length}`);
  console.log(`  • Existing image coverage: ${Math.round((themesWithExistingImages.length / themes.length) * 100)}%`);
  
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
  
  console.log('\n💡 Smart Mapping Strategy:');
  console.log('  • All original themes use their existing images');
  console.log('  • Indian themes use existing images where available');
  console.log('  • Only truly unique Indian themes get new AI-generated images');
  
  console.log('\n🎨 Theme Categories:');
  console.log('  📚 Classic Wedding Themes: 5 themes (all with existing images)');
  console.log('  🪔 Indian Wedding Themes: 9 themes (2 with existing, 7 need generation)');
  console.log('  🎯 Total Coverage: 14 comprehensive wedding themes!');
  
  console.log('\n🗑️ Removed Themes:');
  console.log('  • Destination Goa (removed)');
  console.log('  • Heritage Palace (removed)');
  console.log('  • Garden Mehendi (removed)');
}

// Run the summary
if (require.main === module) {
  showThemeImageSummary();
}

module.exports = { showThemeImageSummary }; 