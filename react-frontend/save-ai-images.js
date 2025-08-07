const fs = require('fs');
const path = require('path');

/**
 * Save base64 image data as a file
 */
function saveBase64Image(base64Data, filename, outputDir = 'public/images/venues') {
  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Remove data URL prefix if present
    const base64Image = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
    
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Image, 'base64');
    
    // Save file
    const filePath = path.join(outputDir, filename);
    fs.writeFileSync(filePath, imageBuffer);
    
    console.log(`✅ Saved image: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error(`❌ Error saving image ${filename}:`, error);
    return null;
  }
}

/**
 * Convert base64 image to file and return the file path
 */
function convertBase64ToFile(base64Data, venueId) {
  const filename = `${venueId}.jpg`;
  const filePath = saveBase64Image(base64Data, filename);
  
  if (filePath) {
    // Return the public URL path
    return `/images/venues/${filename}`;
  }
  
  return null;
}

module.exports = {
  saveBase64Image,
  convertBase64ToFile
}; 