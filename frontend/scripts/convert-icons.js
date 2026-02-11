const fs = require('fs');
const path = require('path');

async function convert() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.log('Installing sharp...');
    require('child_process').execSync('npm install sharp --no-save', { stdio: 'inherit' });
    sharp = require('sharp');
  }
  
  const dir = path.join(__dirname, '..', 'static', 'tabbar');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.svg'));
  
  for (const file of files) {
    const svgPath = path.join(dir, file);
    const pngPath = path.join(dir, file.replace('.svg', '.png'));
    
    await sharp(svgPath)
      .resize(81, 81)
      .png()
      .toFile(pngPath);
    
    console.log(`✅ ${file} -> ${file.replace('.svg', '.png')}`);
  }
  
  // 清理 SVG 文件
  for (const file of files) {
    fs.unlinkSync(path.join(dir, file));
  }
  console.log('\n🎉 All icons converted!');
}

convert().catch(console.error);
