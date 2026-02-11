/**
 * 生成 Tab Bar 图标
 * 使用 SVG -> Base64 -> 写入 PNG 文件的方式
 */
const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '..', 'static', 'tabbar');

// 确保目录存在
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 首页图标 - 简洁房子
const homeSvg = (color) => `<svg xmlns="http://www.w3.org/2000/svg" width="81" height="81" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
  <polyline points="9 22 9 12 15 12 15 22"/>
</svg>`;

// 视频图标 - 播放按钮
const videoSvg = (color) => `<svg xmlns="http://www.w3.org/2000/svg" width="81" height="81" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
  <polygon points="10 8 16 12 10 16 10 8" fill="${color}"/>
</svg>`;

// 我的图标 - 用户
const meSvg = (color) => `<svg xmlns="http://www.w3.org/2000/svg" width="81" height="81" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
  <circle cx="12" cy="7" r="4"/>
</svg>`;

const icons = {
  'home.png': homeSvg('#AAAAAA'),
  'home-active.png': homeSvg('#E17055'),
  'video.png': videoSvg('#AAAAAA'),
  'video-active.png': videoSvg('#E17055'),
  'me.png': meSvg('#AAAAAA'),
  'me-active.png': meSvg('#E17055'),
};

// 写入 SVG 文件（同时保留 SVG 版本）
Object.entries(icons).forEach(([filename, svg]) => {
  const svgFilename = filename.replace('.png', '.svg');
  const svgPath = path.join(outputDir, svgFilename);
  fs.writeFileSync(svgPath, svg);
  console.log(`✅ Generated ${svgFilename}`);
});

console.log('\n📌 SVG icons generated! To convert to PNG, use:');
console.log('   npx svg2png-many static/tabbar/*.svg');
console.log('   Or use an online SVG to PNG converter');
