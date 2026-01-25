const fs = require('fs');
const path = require('path');

// SVG 아이콘 생성 (수정구 + 얼굴 실루엣)
const createIconSVG = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e"/>
      <stop offset="50%" style="stop-color:#16213e"/>
      <stop offset="100%" style="stop-color:#0f0f23"/>
    </linearGradient>
    <linearGradient id="crystalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#a855f7"/>
      <stop offset="50%" style="stop-color:#7c3aed"/>
      <stop offset="100%" style="stop-color:#6d28d9"/>
    </linearGradient>
    <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#fbbf24"/>
      <stop offset="100%" style="stop-color:#f59e0b"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${size}" height="${size}" fill="url(#bgGrad)" rx="${size * 0.15}"/>

  <!-- Decorative stars -->
  <circle cx="${size * 0.15}" cy="${size * 0.2}" r="${size * 0.015}" fill="#fbbf24" opacity="0.8"/>
  <circle cx="${size * 0.85}" cy="${size * 0.15}" r="${size * 0.02}" fill="#fbbf24" opacity="0.6"/>
  <circle cx="${size * 0.12}" cy="${size * 0.7}" r="${size * 0.012}" fill="#a855f7" opacity="0.7"/>
  <circle cx="${size * 0.88}" cy="${size * 0.75}" r="${size * 0.018}" fill="#a855f7" opacity="0.5"/>
  <circle cx="${size * 0.25}" cy="${size * 0.85}" r="${size * 0.01}" fill="#fbbf24" opacity="0.4"/>
  <circle cx="${size * 0.75}" cy="${size * 0.88}" r="${size * 0.014}" fill="#fbbf24" opacity="0.6"/>

  <!-- Crystal ball outer glow -->
  <circle cx="${size * 0.5}" cy="${size * 0.48}" r="${size * 0.34}" fill="url(#crystalGrad)" opacity="0.3" filter="url(#glow)"/>

  <!-- Crystal ball main -->
  <circle cx="${size * 0.5}" cy="${size * 0.48}" r="${size * 0.3}" fill="url(#crystalGrad)" opacity="0.9"/>

  <!-- Crystal ball inner highlight -->
  <circle cx="${size * 0.5}" cy="${size * 0.48}" r="${size * 0.26}" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="${size * 0.01}"/>

  <!-- Face silhouette inside crystal ball -->
  <ellipse cx="${size * 0.5}" cy="${size * 0.45}" rx="${size * 0.13}" ry="${size * 0.17}" fill="rgba(251,191,36,0.6)"/>

  <!-- Eyes -->
  <ellipse cx="${size * 0.44}" cy="${size * 0.42}" rx="${size * 0.025}" ry="${size * 0.015}" fill="#1a1a2e"/>
  <ellipse cx="${size * 0.56}" cy="${size * 0.42}" rx="${size * 0.025}" ry="${size * 0.015}" fill="#1a1a2e"/>

  <!-- Nose line -->
  <line x1="${size * 0.5}" y1="${size * 0.44}" x2="${size * 0.5}" y2="${size * 0.49}" stroke="#1a1a2e" stroke-width="${size * 0.01}" stroke-linecap="round"/>

  <!-- Smile -->
  <path d="M ${size * 0.45} ${size * 0.52} Q ${size * 0.5} ${size * 0.56} ${size * 0.55} ${size * 0.52}" fill="none" stroke="#1a1a2e" stroke-width="${size * 0.012}" stroke-linecap="round"/>

  <!-- Crystal ball shine -->
  <ellipse cx="${size * 0.4}" cy="${size * 0.35}" rx="${size * 0.08}" ry="${size * 0.05}" fill="rgba(255,255,255,0.4)" transform="rotate(-30 ${size * 0.4} ${size * 0.35})"/>

  <!-- Crystal ball base -->
  <path d="M ${size * 0.35} ${size * 0.75} Q ${size * 0.5} ${size * 0.82} ${size * 0.65} ${size * 0.75} L ${size * 0.6} ${size * 0.85} Q ${size * 0.5} ${size * 0.88} ${size * 0.4} ${size * 0.85} Z" fill="url(#glowGrad)"/>

  <!-- Base shine -->
  <path d="M ${size * 0.42} ${size * 0.78} Q ${size * 0.5} ${size * 0.82} ${size * 0.58} ${size * 0.78}" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="${size * 0.01}"/>
</svg>`;

// Adaptive icon (foreground only, transparent background)
const createAdaptiveIconSVG = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="crystalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#a855f7"/>
      <stop offset="50%" style="stop-color:#7c3aed"/>
      <stop offset="100%" style="stop-color:#6d28d9"/>
    </linearGradient>
    <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#fbbf24"/>
      <stop offset="100%" style="stop-color:#f59e0b"/>
    </linearGradient>
  </defs>

  <!-- Crystal ball main -->
  <circle cx="${size * 0.5}" cy="${size * 0.45}" r="${size * 0.28}" fill="url(#crystalGrad)"/>

  <!-- Crystal ball inner highlight -->
  <circle cx="${size * 0.5}" cy="${size * 0.45}" r="${size * 0.24}" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="${size * 0.01}"/>

  <!-- Face silhouette inside crystal ball -->
  <ellipse cx="${size * 0.5}" cy="${size * 0.42}" rx="${size * 0.12}" ry="${size * 0.15}" fill="rgba(251,191,36,0.7)"/>

  <!-- Eyes -->
  <ellipse cx="${size * 0.45}" cy="${size * 0.4}" rx="${size * 0.022}" ry="${size * 0.013}" fill="#1a1a2e"/>
  <ellipse cx="${size * 0.55}" cy="${size * 0.4}" rx="${size * 0.022}" ry="${size * 0.013}" fill="#1a1a2e"/>

  <!-- Nose line -->
  <line x1="${size * 0.5}" y1="${size * 0.42}" x2="${size * 0.5}" y2="${size * 0.46}" stroke="#1a1a2e" stroke-width="${size * 0.008}" stroke-linecap="round"/>

  <!-- Smile -->
  <path d="M ${size * 0.46} ${size * 0.49} Q ${size * 0.5} ${size * 0.52} ${size * 0.54} ${size * 0.49}" fill="none" stroke="#1a1a2e" stroke-width="${size * 0.01}" stroke-linecap="round"/>

  <!-- Crystal ball shine -->
  <ellipse cx="${size * 0.42}" cy="${size * 0.34}" rx="${size * 0.07}" ry="${size * 0.04}" fill="rgba(255,255,255,0.4)" transform="rotate(-30 ${size * 0.42} ${size * 0.34})"/>

  <!-- Crystal ball base -->
  <path d="M ${size * 0.38} ${size * 0.7} Q ${size * 0.5} ${size * 0.76} ${size * 0.62} ${size * 0.7} L ${size * 0.58} ${size * 0.78} Q ${size * 0.5} ${size * 0.81} ${size * 0.42} ${size * 0.78} Z" fill="url(#glowGrad)"/>
</svg>`;

// Splash icon SVG
const createSplashIconSVG = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="crystalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#a855f7"/>
      <stop offset="50%" style="stop-color:#7c3aed"/>
      <stop offset="100%" style="stop-color:#6d28d9"/>
    </linearGradient>
    <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#fbbf24"/>
      <stop offset="100%" style="stop-color:#f59e0b"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Crystal ball outer glow -->
  <circle cx="${size * 0.5}" cy="${size * 0.4}" r="${size * 0.22}" fill="url(#crystalGrad)" opacity="0.3" filter="url(#glow)"/>

  <!-- Crystal ball main -->
  <circle cx="${size * 0.5}" cy="${size * 0.4}" r="${size * 0.18}" fill="url(#crystalGrad)"/>

  <!-- Crystal ball inner highlight -->
  <circle cx="${size * 0.5}" cy="${size * 0.4}" r="${size * 0.15}" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="${size * 0.006}"/>

  <!-- Face silhouette inside crystal ball -->
  <ellipse cx="${size * 0.5}" cy="${size * 0.38}" rx="${size * 0.08}" ry="${size * 0.1}" fill="rgba(251,191,36,0.7)"/>

  <!-- Eyes -->
  <ellipse cx="${size * 0.47}" cy="${size * 0.36}" rx="${size * 0.015}" ry="${size * 0.009}" fill="#1a1a2e"/>
  <ellipse cx="${size * 0.53}" cy="${size * 0.36}" rx="${size * 0.015}" ry="${size * 0.009}" fill="#1a1a2e"/>

  <!-- Nose -->
  <line x1="${size * 0.5}" y1="${size * 0.37}" x2="${size * 0.5}" y2="${size * 0.4}" stroke="#1a1a2e" stroke-width="${size * 0.005}" stroke-linecap="round"/>

  <!-- Smile -->
  <path d="M ${size * 0.47} ${size * 0.42} Q ${size * 0.5} ${size * 0.44} ${size * 0.53} ${size * 0.42}" fill="none" stroke="#1a1a2e" stroke-width="${size * 0.006}" stroke-linecap="round"/>

  <!-- Crystal ball shine -->
  <ellipse cx="${size * 0.45}" cy="${size * 0.32}" rx="${size * 0.045}" ry="${size * 0.025}" fill="rgba(255,255,255,0.4)" transform="rotate(-30 ${size * 0.45} ${size * 0.32})"/>

  <!-- Crystal ball base -->
  <path d="M ${size * 0.42} ${size * 0.55} Q ${size * 0.5} ${size * 0.59} ${size * 0.58} ${size * 0.55} L ${size * 0.55} ${size * 0.61} Q ${size * 0.5} ${size * 0.63} ${size * 0.45} ${size * 0.61} Z" fill="url(#glowGrad)"/>

  <!-- Title text -->
  <text x="${size * 0.5}" y="${size * 0.74}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${size * 0.055}" font-weight="bold" fill="#fbbf24">FaceFortune</text>
  <text x="${size * 0.5}" y="${size * 0.82}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${size * 0.03}" fill="#94a3b8">AI 관상 분석</text>
</svg>`;

const assetsDir = path.join(__dirname, '..', 'assets');

// Make sure assets directory exists
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Write SVG files
fs.writeFileSync(path.join(assetsDir, 'icon.svg'), createIconSVG(1024));
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.svg'), createAdaptiveIconSVG(1024));
fs.writeFileSync(path.join(assetsDir, 'splash-icon.svg'), createSplashIconSVG(1024));
fs.writeFileSync(path.join(assetsDir, 'favicon.svg'), createIconSVG(48));

console.log('SVG icons created successfully!');
console.log('');
console.log('To convert to PNG, use one of these methods:');
console.log('1. Online tool: https://cloudconvert.com/svg-to-png');
console.log('2. Or use sharp/canvas npm packages');
console.log('');
console.log('Required sizes:');
console.log('- icon.png: 1024x1024');
console.log('- adaptive-icon.png: 1024x1024');
console.log('- splash-icon.png: 1024x1024');
console.log('- favicon.png: 48x48');
