/* eslint-disable no-undef */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// TARGET DIRECTORY
const TARGET_DIR = path.join(__dirname, '../assets/images/renner');

async function processDirectory(directory) {
  const files = fs.readdirSync(directory);

  for (const file of files) {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      await processDirectory(filePath);
    } else if (file.match(/\.(png|jpeg|jpg)$/i)) {
      try {
        // 1. FIX: Read file into memory buffer first
        // This ensures the OS closes the file handle immediately.
        const inputBuffer = fs.readFileSync(filePath);
        
        const metadata = await sharp(inputBuffer).metadata();
        
        // If image is huge (width > 600px), resize it
        if (metadata.width > 600) {
          console.log(`📉 Resizing: ${file} (Width: ${metadata.width}px -> 600px)`);
          
          let pipeline = sharp(inputBuffer).resize(600);

          // 2. Optimization: Apply compression based on format
          // (Prevents turning PNGs into JPEGs with wrong extensions)
          if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
            pipeline = pipeline.jpeg({ quality: 80 });
          } else if (metadata.format === 'png') {
            pipeline = pipeline.png({ quality: 80, compressionLevel: 8 });
          }

          const outputBuffer = await pipeline.toBuffer();

          // 3. Overwrite safely
          fs.writeFileSync(filePath, outputBuffer);
        }
      } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
      }
    }
  }
}

console.log("🚀 Starting Image Optimization...");
processDirectory(TARGET_DIR).then(() => {
  console.log("✅ All images optimized!");
});