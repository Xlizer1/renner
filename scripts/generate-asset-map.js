/* eslint-disable no-undef */
const fs = require("fs");
const path = require("path");

// CONFIGURATION
const ASSETS_DIR = path.join(__dirname, "../assets/images/renner");
const OUTPUT_FILE = path.join(
  __dirname,
  "../src/features/color-fan/data/rennerAssets.ts"
);

// Helper to crawl directories
function getImages(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getImages(filePath, fileList);
    } else {
      if (
        file.toLowerCase().endsWith(".png") ||
        file.toLowerCase().endsWith(".jpg") ||
        file.toLowerCase().endsWith(".jpeg")
      ) {
        // We store the relative path from the ASSETS_DIR root
        // e.g. "CHROMA/chroma_rc1000.png"
        const relativePath = path.relative(ASSETS_DIR, filePath);
        fileList.push(relativePath);
      }
    }
  });

  return fileList;
}

console.log(`🔍 Scanning for images in: ${ASSETS_DIR}`);

try {
  if (!fs.existsSync(ASSETS_DIR)) {
    console.error(`❌ Directory not found: ${ASSETS_DIR}`);
    console.error("Please create the directory and add your images first.");
    process.exit(1);
  }

  const images = getImages(ASSETS_DIR);
  console.log(`✅ Found ${images.length} images.`);

  // Generate the TypeScript content
  // We use standard relative paths from the OUTPUT location to the ASSETS location
  const relativeToAssets = "../../../../assets/images/renner";

  const lines = images.map((imgRelPath) => {
    // Normalize path separators for Windows compatibility
    const cleanPath = imgRelPath.split(path.sep).join("/");

    // Key: "CHROMA/chroma_rc1000.png"
    // Value: require("../../../../assets/images/renner/CHROMA/chroma_rc1000.png")
    return `  "${cleanPath}": require("${relativeToAssets}/${cleanPath}"),`;
  });

  const fileContent = `// ⚠️ AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.
// Run "node scripts/generate-asset-map.js" to update.

export const RENNER_ASSETS: Record<string, any> = {
${lines.join("\n")}
};
`;

  fs.writeFileSync(OUTPUT_FILE, fileContent);
  console.log(`🎉 Asset map generated at: ${OUTPUT_FILE}`);
} catch (err) {
  console.error("❌ Error generating map:", err);
}
