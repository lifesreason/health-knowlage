const fs = require('fs');
const path = require('path');

async function createAvatar() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    // If sharp isn't available, create a simple SVG fallback
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <rect width="200" height="200" rx="100" fill="#E8E0DC"/>
  <circle cx="100" cy="78" r="36" fill="#C4B5AE"/>
  <path d="M100 124c-38 0-64 20-64 44v8h128v-8c0-24-26-44-64-44z" fill="#C4B5AE"/>
</svg>`;
    
    // Write SVG first
    const outputPath = path.join(__dirname, '..', 'static', 'default-avatar.svg');
    fs.writeFileSync(outputPath, svg);
    console.log('✅ Created default-avatar.svg (SVG fallback)');
    
    // Try to convert with sharp
    try {
      require('child_process').execSync('npm list sharp', { stdio: 'pipe' });
      sharp = require('sharp');
    } catch {
      console.log('⚠️  sharp not available, using SVG. Convert to PNG manually or install sharp.');
      return;
    }
  }
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <rect width="200" height="200" rx="100" fill="#E8E0DC"/>
  <circle cx="100" cy="78" r="36" fill="#C4B5AE"/>
  <path d="M100 124c-38 0-64 20-64 44v8h128v-8c0-24-26-44-64-44z" fill="#C4B5AE"/>
</svg>`;
  
  const outputPath = path.join(__dirname, '..', 'static', 'default-avatar.png');
  await sharp(Buffer.from(svg)).resize(200, 200).png().toFile(outputPath);
  console.log('✅ Created default-avatar.png');
}

createAvatar().catch(console.error);
