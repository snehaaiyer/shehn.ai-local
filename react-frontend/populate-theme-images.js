#!/usr/bin/env node

// Script to populate localStorage with theme images
const themeImages = {
  // Indian themes with Unsplash fallbacks
  'traditional-hindu': [
    'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1024&h=1024&fit=crop'
  ],
  'sikh-anand-karaj': [
    'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1024&h=1024&fit=crop'
  ],
  'muslim-nikah': [
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1024&h=1024&fit=crop'
  ],
  'christian-church': [
    'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1024&h=1024&fit=crop'
  ],
  'luxury-hotel': [
    'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1024&h=1024&fit=crop'
  ],
  'farmhouse-wedding': [
    'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1024&h=1024&fit=crop'
  ],
  'mountain-retreat': [
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1024&h=1024&fit=crop'
  ],
  
  // Themes with existing images
  'bollywood-sangeet': ['/images/themes/bollywood-sangeet.jpg'],
  'south-indian-temple': ['/images/themes/south-indian-temple.jpg'],
  
  // Original themes with existing images
  'royal-palace': ['/images/themes/royal-palace.jpg'],
  'beach-destination': ['/images/themes/beach-destination.jpg'],
  'boho-garden': ['/images/themes/boho-garden.jpg'],
  'minimalist-pastel': ['/images/themes/minimalist-pastel.jpg'],
  'traditional-cultural': ['/images/themes/traditional-cultural.jpg']
};

console.log('🎨 Theme Images Data for localStorage:');
console.log(JSON.stringify(themeImages, null, 2));

console.log('\n📋 Instructions:');
console.log('1. Open your browser and go to http://localhost:3000');
console.log('2. Open Developer Tools (F12)');
console.log('3. Go to Console tab');
console.log('4. Copy and paste this command:');
console.log('');
console.log('localStorage.setItem("themeImages", \'' + JSON.stringify(themeImages) + '\')');
console.log('');
console.log('5. Refresh the page');
console.log('6. All theme cards should now show images!');

console.log('\n🎯 Expected Results:');
console.log('✅ All 14 themes will have images');
console.log('✅ No more grey placeholders');
console.log('✅ Mix of existing images and Unsplash fallbacks');
console.log('✅ Ready for AI generation when you click "Process Theme Images"');

console.log('\n🗑️ Removed Themes:');
console.log('  • Destination Goa (removed)');
console.log('  • Heritage Palace (removed)');
console.log('  • Garden Mehendi (removed)'); 