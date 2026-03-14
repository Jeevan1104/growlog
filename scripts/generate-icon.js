const sharp = require('sharp');
const path = require('path');

const ASSETS = path.join(__dirname, '../assets/images');

// GrowLog icon: white seedling on deep green gradient background
const iconSvg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stop-color="#1B4332"/>
      <stop offset="100%" stop-color="#2D6A4F"/>
    </linearGradient>
    <linearGradient id="leafLeft" x1="1" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#d8f3dc"/>
    </linearGradient>
    <linearGradient id="leafRight" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#d8f3dc"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1024" height="1024" fill="url(#bg)"/>

  <!-- Subtle inner glow -->
  <radialGradient id="glow" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#52b788" stop-opacity="0.18"/>
    <stop offset="100%" stop-color="#1B4332" stop-opacity="0"/>
  </radialGradient>
  <rect width="1024" height="1024" fill="url(#glow)"/>

  <!-- Stem -->
  <path d="M 512 800 L 512 490"
        stroke="white" stroke-width="40" stroke-linecap="round" fill="none" opacity="0.95"/>

  <!-- Left leaf -->
  <path d="M 512 590
           C 496 548 440 500 356 472
           C 296 452 238 458 210 486
           C 216 530 264 576 336 600
           C 406 624 480 604 512 590 Z"
        fill="url(#leafLeft)"/>
  <!-- Left leaf vein -->
  <path d="M 512 590 C 440 550 340 520 230 488"
        stroke="#2D6A4F" stroke-width="6" fill="none" opacity="0.3" stroke-linecap="round"/>

  <!-- Right leaf -->
  <path d="M 512 590
           C 528 548 584 500 668 472
           C 728 452 786 458 814 486
           C 808 530 760 576 688 600
           C 618 624 544 604 512 590 Z"
        fill="url(#leafRight)"/>
  <!-- Right leaf vein -->
  <path d="M 512 590 C 584 550 684 520 794 488"
        stroke="#2D6A4F" stroke-width="6" fill="none" opacity="0.3" stroke-linecap="round"/>

  <!-- Central upward shoot -->
  <path d="M 512 510
           C 486 448 476 360 512 248
           C 548 360 538 448 512 510 Z"
        fill="white" opacity="0.95"/>
  <!-- Shoot vein -->
  <line x1="512" y1="510" x2="512" y2="260"
        stroke="#2D6A4F" stroke-width="5" opacity="0.25" stroke-linecap="round"/>

  <!-- Small soil mound at base -->
  <ellipse cx="512" cy="808" rx="150" ry="24" fill="#52b788" opacity="0.35"/>
</svg>`;

// Android adaptive icon foreground: same plant on transparent bg
const adaptiveSvg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <!-- Stem -->
  <path d="M 512 800 L 512 490"
        stroke="white" stroke-width="40" stroke-linecap="round" fill="none"/>

  <!-- Left leaf -->
  <path d="M 512 590
           C 496 548 440 500 356 472
           C 296 452 238 458 210 486
           C 216 530 264 576 336 600
           C 406 624 480 604 512 590 Z"
        fill="white"/>

  <!-- Right leaf -->
  <path d="M 512 590
           C 528 548 584 500 668 472
           C 728 452 786 458 814 486
           C 808 530 760 576 688 600
           C 618 624 544 604 512 590 Z"
        fill="white"/>

  <!-- Central shoot -->
  <path d="M 512 510
           C 486 448 476 360 512 248
           C 548 360 538 448 512 510 Z"
        fill="white"/>
</svg>`;

// Splash icon: just the plant centered (shown on splash screen)
const splashSvg = `<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <path d="M 200 320 L 200 190" stroke="#4CAF50" stroke-width="16" stroke-linecap="round" fill="none"/>
  <path d="M 200 230
           C 194 213 170 196 138 184
           C 116 176 92 180 82 192
           C 84 208 102 226 130 236
           C 158 246 188 238 200 230 Z" fill="#4CAF50"/>
  <path d="M 200 230
           C 206 213 230 196 262 184
           C 284 176 308 180 318 192
           C 316 208 298 226 270 236
           C 242 246 212 238 200 230 Z" fill="#66BB6A"/>
  <path d="M 200 198 C 188 174 184 140 200 96
           C 216 140 212 174 200 198 Z" fill="#4CAF50"/>
</svg>`;

async function generate() {
  await sharp(Buffer.from(iconSvg))
    .resize(1024, 1024)
    .png()
    .toFile(`${ASSETS}/icon.png`);
  console.log('✅ icon.png');

  await sharp(Buffer.from(adaptiveSvg))
    .resize(1024, 1024)
    .png()
    .toFile(`${ASSETS}/android-icon-foreground.png`);
  console.log('✅ android-icon-foreground.png');

  // Android background: solid dark green
  await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: '#1B4332' }
  })
    .png()
    .toFile(`${ASSETS}/android-icon-background.png`);
  console.log('✅ android-icon-background.png');

  await sharp(Buffer.from(splashSvg))
    .resize(200, 200)
    .png()
    .toFile(`${ASSETS}/splash-icon.png`);
  console.log('✅ splash-icon.png');

  console.log('\nDone! Run `npx expo start` to see the new icon.');
}

generate().catch(console.error);
