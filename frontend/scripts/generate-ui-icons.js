const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const outDir = path.join(__dirname, '..', 'static', 'icons');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const wrap = (body, color = '#ffffff', strokeWidth = 1.9, fill = 'none') => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${fill}" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
${body}
</svg>
`;

const icons = {
  'home-search-btn.png': wrap(`
  <circle cx="11" cy="11" r="6"/>
  <line x1="20" y1="20" x2="15.8" y2="15.8"/>
  `, '#e17055', 2),
  'home-search-field.png': wrap(`
  <circle cx="11" cy="11" r="6"/>
  <line x1="20" y1="20" x2="15.8" y2="15.8"/>
  `, '#b17866', 2),
  'home-publish.png': wrap(`
  <circle cx="12" cy="12" r="9"/>
  <line x1="12" y1="8" x2="12" y2="16"/>
  <line x1="8" y1="12" x2="16" y2="12"/>
  `, '#ffffff', 2),
  'common-plus-white.png': wrap(`
  <line x1="12" y1="6.5" x2="12" y2="17.5"/>
  <line x1="6.5" y1="12" x2="17.5" y2="12"/>
  `, '#ffffff', 2),
  'common-plus-muted.png': wrap(`
  <line x1="12" y1="6.5" x2="12" y2="17.5"/>
  <line x1="6.5" y1="12" x2="17.5" y2="12"/>
  `, '#b9bfc7', 2),
  'common-check-accent.png': wrap(`
  <polyline points="5 12.5 10 17 19 8"/>
  `, '#e17055', 2),
  'common-check-white.png': wrap(`
  <polyline points="5 12.5 10 17 19 8"/>
  `, '#ffffff', 2),
  'common-close-muted.png': wrap(`
  <line x1="7.2" y1="7.2" x2="16.8" y2="16.8"/>
  <line x1="16.8" y1="7.2" x2="7.2" y2="16.8"/>
  `, '#9aa0a8', 2),
  'common-close-white.png': wrap(`
  <line x1="7.2" y1="7.2" x2="16.8" y2="16.8"/>
  <line x1="16.8" y1="7.2" x2="7.2" y2="16.8"/>
  `, '#ffffff', 2),
  'common-arrow-right-muted.png': wrap(`
  <polyline points="9 6 15 12 9 18"/>
  `, '#c6beb9', 2),
  'common-arrow-right-dark.png': wrap(`
  <polyline points="9 6 15 12 9 18"/>
  `, '#704c3f', 2),
  'common-arrow-right-accent.png': wrap(`
  <polyline points="9 6 15 12 9 18"/>
  `, '#e17055', 2),
  'common-play-white.png': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ffffff" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
<polygon points="9,7 18,12 9,17"/>
</svg>
`,
  'auth-wechat.png': wrap(`
  <path d="M8.5 5A6.5 6.5 0 0 0 2 11.5c0 2 1 3.8 2.6 5L4 20l3.8-1A6.5 6.5 0 1 0 8.5 5z"/>
  <path d="M15.5 9A5.5 5.5 0 0 0 10 14.5c0 1.7.8 3.1 2.1 4.1l-.5 2.4 2.6-.7a5.5 5.5 0 1 0 1.3-11.3z"/>
  <circle cx="6.8" cy="11.3" r="0.7" fill="#ffffff" stroke="none"/>
  <circle cx="10.2" cy="11.3" r="0.7" fill="#ffffff" stroke="none"/>
  <circle cx="14.8" cy="14.3" r="0.7" fill="#ffffff" stroke="none"/>
  <circle cx="17.8" cy="14.3" r="0.7" fill="#ffffff" stroke="none"/>
  `, '#ffffff', 1.4),
  'auth-phone.png': wrap(`
  <rect x="7" y="2.5" width="10" height="19" rx="2"/>
  <line x1="10" y1="5.5" x2="14" y2="5.5"/>
  <circle cx="12" cy="18.2" r="0.8"/>
  `, '#ffffff', 1.8),
  'auth-code.png': wrap(`
  <rect x="3" y="6" width="18" height="12" rx="2"/>
  <line x1="8" y1="10" x2="11" y2="10"/>
  <line x1="13" y1="10" x2="16" y2="10"/>
  <line x1="8" y1="14" x2="11" y2="14"/>
  <line x1="13" y1="14" x2="16" y2="14"/>
  `, '#ffffff', 1.8),
  'auth-knowledge.png': wrap(`
  <path d="M4 4h8a3 3 0 0 1 3 3v13H7a3 3 0 0 0-3 3z"/>
  <path d="M20 4h-8a3 3 0 0 0-3 3v13h8a3 3 0 0 1 3 3z"/>
  `, '#4b5563', 1.8),
  'auth-doctor.png': wrap(`
  <path d="M8 6h8"/>
  <path d="M12 2v8"/>
  <circle cx="12" cy="13" r="8"/>
  `, '#4b5563', 1.8),

  'quick-post.png': wrap(`
  <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/>
  <polyline points="14 2 14 8 20 8"/>
  <line x1="9" y1="13" x2="15" y2="13"/>
  <line x1="9" y1="17" x2="15" y2="17"/>
  `),
  'quick-collect.png': wrap(`
  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
  `),
  'quick-history.png': wrap(`
  <circle cx="12" cy="12" r="9"/>
  <polyline points="12 7 12 12 15 14"/>
  `),
  'quick-circle.png': wrap(`
  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
  <circle cx="9" cy="7" r="4"/>
  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  `),

  'publisher-tab-image.png': wrap(`
  <rect x="3" y="5" width="18" height="14" rx="2"/>
  <circle cx="9" cy="10" r="1.7"/>
  <path d="M21 15l-4.5-4.5L11 16"/>
  `, '#4b5563', 1.8),
  'publisher-tab-image-active.png': wrap(`
  <rect x="3" y="5" width="18" height="14" rx="2"/>
  <circle cx="9" cy="10" r="1.7"/>
  <path d="M21 15l-4.5-4.5L11 16"/>
  `, '#d25f45', 1.8),
  'publisher-tab-video.png': wrap(`
  <rect x="3" y="5" width="14" height="14" rx="2"/>
  <polygon points="10 10 14 12 10 14"/>
  <path d="M17 10l4-2v8l-4-2z"/>
  `, '#4b5563', 1.8),
  'publisher-tab-video-active.png': wrap(`
  <rect x="3" y="5" width="14" height="14" rx="2"/>
  <polygon points="10 10 14 12 10 14"/>
  <path d="M17 10l4-2v8l-4-2z"/>
  `, '#d25f45', 1.8),
  'publisher-label-title.png': wrap(`
  <polyline points="4 7 4 4 20 4 20 7"/>
  <line x1="12" y1="4" x2="12" y2="20"/>
  <line x1="9" y1="20" x2="15" y2="20"/>
  `, '#4b5563', 1.8),
  'publisher-label-content.png': wrap(`
  <line x1="6" y1="7" x2="18" y2="7"/>
  <line x1="6" y1="12" x2="18" y2="12"/>
  <line x1="6" y1="17" x2="14" y2="17"/>
  `, '#4b5563', 1.8),
  'publisher-label-media.png': wrap(`
  <rect x="3" y="5" width="18" height="14" rx="2"/>
  <circle cx="9" cy="10" r="1.7"/>
  <path d="M21 15l-4.5-4.5L11 16"/>
  `, '#4b5563', 1.8),
  'publisher-label-circle.png': wrap(`
  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
  <circle cx="9" cy="7" r="4"/>
  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  `, '#4b5563', 1.8),

  'setting-font.png': wrap(`
  <polyline points="4 7 4 4 20 4 20 7"/>
  <line x1="12" y1="4" x2="12" y2="20"/>
  <line x1="9" y1="20" x2="15" y2="20"/>
  `, '#c5664d'),
  'setting-service.png': wrap(`
  <path d="M3 12a9 9 0 0 1 18 0"/>
  <rect x="2" y="12" width="4" height="7" rx="2"/>
  <rect x="18" y="12" width="4" height="7" rx="2"/>
  <path d="M6 19a6 6 0 0 0 6 3h2"/>
  `, '#c5664d'),
  'setting-about.png': wrap(`
  <circle cx="12" cy="12" r="9"/>
  <line x1="12" y1="10" x2="12" y2="16"/>
  <circle cx="12" cy="7" r="0.6" fill="#c5664d" stroke="none"/>
  `, '#c5664d'),

  'feed-like.png': wrap(`
  <path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 0 0-7.1 7.1L12 21.5l8.8-8.8a5 5 0 0 0 0-7.1z"/>
  `, '#747474', 1.8),
  'feed-like-active.png': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#e17055" stroke="#e17055" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
<path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 0 0-7.1 7.1L12 21.5l8.8-8.8a5 5 0 0 0 0-7.1z"/>
</svg>
`,
  'feed-comment.png': wrap(`
  <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H7l-4 3v-5.5A8.5 8.5 0 1 1 21 11.5z"/>
  `, '#747474', 1.8),
  'feed-view.png': wrap(`
  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/>
  <circle cx="12" cy="12" r="3"/>
  `, '#747474', 1.8),

  'detail-circle.png': wrap(`
  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
  <circle cx="9" cy="7" r="4"/>
  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  `, '#ffffff', 1.8),
  'detail-collect.png': wrap(`
  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
  `, '#555555', 1.8),
  'detail-collect-active.png': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#e17055" stroke="#e17055" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
</svg>
`,
  'detail-share.png': wrap(`
  <circle cx="18" cy="5" r="2.5"/>
  <circle cx="6" cy="12" r="2.5"/>
  <circle cx="18" cy="19" r="2.5"/>
  <line x1="8.2" y1="10.8" x2="15.8" y2="6.2"/>
  <line x1="8.2" y1="13.2" x2="15.8" y2="17.8"/>
  `, '#555555', 1.8),
  'detail-poster.png': wrap(`
  <rect x="4" y="3" width="16" height="18" rx="2"/>
  <line x1="8" y1="8" x2="16" y2="8"/>
  <line x1="8" y1="12" x2="16" y2="12"/>
  <line x1="8" y1="16" x2="13" y2="16"/>
  `, '#555555', 1.8),

  'section-font.png': wrap(`
  <polyline points="4 7 4 4 20 4 20 7"/>
  <line x1="12" y1="4" x2="12" y2="20"/>
  <line x1="9" y1="20" x2="15" y2="20"/>
  `),
  'section-user.png': wrap(`
  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
  <circle cx="9" cy="7" r="4"/>
  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  `),
  'section-setting.png': wrap(`
  <path d="M3 12a9 9 0 0 1 18 0"/>
  <rect x="2" y="12" width="4" height="7" rx="2"/>
  <rect x="18" y="12" width="4" height="7" rx="2"/>
  <path d="M6 19a6 6 0 0 0 6 3h2"/>
  `),
  'section-doc.png': wrap(`
  <circle cx="12" cy="12" r="9"/>
  <line x1="12" y1="10" x2="12" y2="16"/>
  <circle cx="12" cy="7" r="0.6" fill="#ffffff" stroke="none"/>
  `),
};

(async () => {
  for (const [name, svg] of Object.entries(icons)) {
    await sharp(Buffer.from(svg)).resize(64, 64).png().toFile(path.join(outDir, name));
    console.log(`generated ${name}`);
  }
  console.log('ui icons generated');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
