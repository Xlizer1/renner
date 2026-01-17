/* eslint-disable no-undef */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// 1. SETUP PATHS
const RENNER_DIR = path.join(__dirname, '../assets/images/renner');
const OUTPUT_FILE = path.join(__dirname, '../rennerColors.json');

// 2. DEFINE COLLECTIONS (To map folder -> ID)
const COLLECTIONS = [
  { folder: 'TM-M006', id: 'tm' },
  { folder: 'CHROMA', id: 'chroma' },
  { folder: 'CS', id: 'cs' },
];

// Helper: Get Median Hex from Image
async function getAverageHex(filePath) {
  try {
    const { data, info } = await sharp(filePath)
      .resize(50, 50) // Resize to speed up calc
      .raw()
      .toBuffer({ resolveWithObject: true });

    let r = 0, g = 0, b = 0, count = 0;

    for (let i = 0; i < data.length; i += info.channels) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      count++;
    }

    // Calculate Average
    r = Math.round(r / count);
    g = Math.round(g / count);
    b = Math.round(b / count);

    const toHex = (c) => {
      const hex = c.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  } catch (e) {
    console.error(`Error processing ${filePath}:`, e.message);
    return null;
  }
}

async function run() {
  console.log("🪵 Starting Wood Color Extraction...");
  const database = [];

  for (const col of COLLECTIONS) {
    const dirPath = path.join(RENNER_DIR, col.folder);
    const listJsonPath = path.join(dirPath, 'list.json');

    if (!fs.existsSync(listJsonPath)) {
      console.warn(`Skipping ${col.id}: list.json not found.`);
      continue;
    }

    // Read the existing list.json to get the correct Keys/Names
    const items = JSON.parse(fs.readFileSync(listJsonPath, 'utf8'));

    console.log(`Processing ${col.id} (${items.length} items)...`);

    for (const item of items) {
      // Logic to find the file based on the URL in list.json
      // URL example: "assets/images/renner/TM-M006/T01_01.png"
      // We need relative path from script: "../assets/images/renner/TM-M006/T01_01.png"
      
      const filename = path.basename(item.url);
      const filePath = path.join(dirPath, filename);

      if (fs.existsSync(filePath)) {
        const hex = await getAverageHex(filePath);
        
        if (hex) {
          database.push({
            key: item.code || item.revision, // Store the Title
            hex: hex,                        // Store the calculated Color
            collection: col.id,              // Store the Group ID
            hue: col.folder                  // Keep compatibility
          });
        }
      }
    }
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(database, null, 2));
  console.log(`✅ Done! Database saved to ${OUTPUT_FILE}`);
  console.log(`Total Colors: ${database.length}`);
}

run();