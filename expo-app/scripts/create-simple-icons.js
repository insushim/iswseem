const fs = require('fs');
const path = require('path');

// Create simple PNG icons using pure Node.js (no external deps)
// This creates a simple gradient icon with crystal ball design

// Simple PNG encoder
function createPNG(width, height, rgbaData) {
  const zlib = require('zlib');

  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth
  ihdrData.writeUInt8(6, 9); // color type (RGBA)
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT chunk (image data)
  // Add filter byte (0) at start of each row
  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0; // filter type none
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = y * (1 + width * 4) + 1 + x * 4;
      rawData[dstIdx] = rgbaData[srcIdx];
      rawData[dstIdx + 1] = rgbaData[srcIdx + 1];
      rawData[dstIdx + 2] = rgbaData[srcIdx + 2];
      rawData[dstIdx + 3] = rgbaData[srcIdx + 3];
    }
  }

  const compressedData = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = createChunk('IDAT', compressedData);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type);
  const crc = crc32(Buffer.concat([typeBuffer, data]));

  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc, 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

// CRC32 implementation
function crc32(buffer) {
  let crc = 0xffffffff;
  const table = makeCRCTable();

  for (let i = 0; i < buffer.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buffer[i]) & 0xff];
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function makeCRCTable() {
  const table = new Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) {
        c = 0xedb88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
    }
    table[n] = c;
  }
  return table;
}

// Draw functions
function setPixel(data, width, x, y, r, g, b, a = 255) {
  x = Math.round(x);
  y = Math.round(y);
  if (x < 0 || x >= width || y < 0 || y >= width) return;
  const idx = (y * width + x) * 4;

  // Alpha blending
  const srcA = a / 255;
  const dstA = data[idx + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);

  if (outA > 0) {
    data[idx] = Math.round((r * srcA + data[idx] * dstA * (1 - srcA)) / outA);
    data[idx + 1] = Math.round((g * srcA + data[idx + 1] * dstA * (1 - srcA)) / outA);
    data[idx + 2] = Math.round((b * srcA + data[idx + 2] * dstA * (1 - srcA)) / outA);
    data[idx + 3] = Math.round(outA * 255);
  }
}

function fillCircle(data, width, cx, cy, radius, r, g, b, a = 255) {
  const r2 = radius * radius;
  for (let y = cy - radius - 1; y <= cy + radius + 1; y++) {
    for (let x = cx - radius - 1; x <= cx + radius + 1; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const d2 = dx * dx + dy * dy;
      if (d2 <= r2) {
        // Anti-aliasing at edge
        const edge = Math.sqrt(d2) - radius + 1;
        const alpha = edge < 0 ? a : Math.max(0, Math.round(a * (1 - edge)));
        setPixel(data, width, x, y, r, g, b, alpha);
      }
    }
  }
}

function fillEllipse(data, width, cx, cy, rx, ry, r, g, b, a = 255) {
  for (let y = cy - ry - 1; y <= cy + ry + 1; y++) {
    for (let x = cx - rx - 1; x <= cx + rx + 1; x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      const d2 = dx * dx + dy * dy;
      if (d2 <= 1) {
        const edge = Math.sqrt(d2) - 1 + 0.02;
        const alpha = edge < 0 ? a : Math.max(0, Math.round(a * (1 - edge * 50)));
        setPixel(data, width, x, y, r, g, b, alpha);
      }
    }
  }
}

function fillRoundedRect(data, width, x1, y1, w, h, radius, r, g, b, a = 255) {
  for (let y = y1; y < y1 + h; y++) {
    for (let x = x1; x < x1 + w; x++) {
      let inside = false;

      // Check corners
      if (x < x1 + radius && y < y1 + radius) {
        const dx = x - (x1 + radius);
        const dy = y - (y1 + radius);
        inside = dx * dx + dy * dy <= radius * radius;
      } else if (x >= x1 + w - radius && y < y1 + radius) {
        const dx = x - (x1 + w - radius);
        const dy = y - (y1 + radius);
        inside = dx * dx + dy * dy <= radius * radius;
      } else if (x < x1 + radius && y >= y1 + h - radius) {
        const dx = x - (x1 + radius);
        const dy = y - (y1 + h - radius);
        inside = dx * dx + dy * dy <= radius * radius;
      } else if (x >= x1 + w - radius && y >= y1 + h - radius) {
        const dx = x - (x1 + w - radius);
        const dy = y - (y1 + h - radius);
        inside = dx * dx + dy * dy <= radius * radius;
      } else {
        inside = true;
      }

      if (inside) {
        setPixel(data, width, x, y, r, g, b, a);
      }
    }
  }
}

function createAppIcon(size) {
  const data = Buffer.alloc(size * size * 4);

  // Background gradient (dark purple)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const t = (x + y) / (size * 2);
      const r = Math.round(26 + (15 - 26) * t);
      const g = Math.round(26 + (15 - 26) * t);
      const b = Math.round(46 + (35 - 46) * t);
      setPixel(data, size, x, y, r, g, b, 255);
    }
  }

  // Rounded corners (make transparent)
  const cornerRadius = size * 0.15;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let distance = Infinity;

      if (x < cornerRadius && y < cornerRadius) {
        const dx = x - cornerRadius;
        const dy = y - cornerRadius;
        distance = Math.sqrt(dx * dx + dy * dy) - cornerRadius;
      } else if (x >= size - cornerRadius && y < cornerRadius) {
        const dx = x - (size - cornerRadius);
        const dy = y - cornerRadius;
        distance = Math.sqrt(dx * dx + dy * dy) - cornerRadius;
      } else if (x < cornerRadius && y >= size - cornerRadius) {
        const dx = x - cornerRadius;
        const dy = y - (size - cornerRadius);
        distance = Math.sqrt(dx * dx + dy * dy) - cornerRadius;
      } else if (x >= size - cornerRadius && y >= size - cornerRadius) {
        const dx = x - (size - cornerRadius);
        const dy = y - (size - cornerRadius);
        distance = Math.sqrt(dx * dx + dy * dy) - cornerRadius;
      }

      if (distance > 0) {
        const idx = (y * size + x) * 4;
        data[idx + 3] = Math.max(0, Math.round(255 * (1 - distance)));
      }
    }
  }

  // Small decorative dots
  fillCircle(data, size, size * 0.15, size * 0.2, size * 0.015, 251, 191, 36, 200);
  fillCircle(data, size, size * 0.85, size * 0.15, size * 0.02, 251, 191, 36, 150);
  fillCircle(data, size, size * 0.12, size * 0.7, size * 0.012, 168, 85, 247, 180);
  fillCircle(data, size, size * 0.88, size * 0.75, size * 0.018, 168, 85, 247, 130);

  const cx = size * 0.5;
  const cy = size * 0.48;
  const ballRadius = size * 0.3;

  // Crystal ball outer glow
  fillCircle(data, size, cx, cy, ballRadius * 1.13, 124, 58, 237, 80);

  // Crystal ball main (purple gradient approximation)
  for (let y = cy - ballRadius; y <= cy + ballRadius; y++) {
    for (let x = cx - ballRadius; x <= cx + ballRadius; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d <= ballRadius) {
        const t = (dx + dy + ballRadius * 2) / (ballRadius * 4);
        const r = Math.round(168 - 60 * t);
        const g = Math.round(85 - 30 * t);
        const b = Math.round(247 - 30 * t);
        const edge = d - ballRadius + 1;
        const alpha = edge < 0 ? 230 : Math.max(0, Math.round(230 * (1 - edge)));
        setPixel(data, size, x, y, r, g, b, alpha);
      }
    }
  }

  // Inner highlight ring
  const ringRadius = ballRadius * 0.87;
  for (let angle = 0; angle < Math.PI * 2; angle += 0.01) {
    const x = cx + Math.cos(angle) * ringRadius;
    const y = cy + Math.sin(angle) * ringRadius;
    setPixel(data, size, x, y, 255, 255, 255, 80);
  }

  // Face (golden ellipse)
  fillEllipse(data, size, cx, cy - ballRadius * 0.1, ballRadius * 0.43, ballRadius * 0.57, 251, 191, 36, 170);

  // Eyes
  const eyeY = cy - ballRadius * 0.2;
  fillEllipse(data, size, cx - ballRadius * 0.2, eyeY, ballRadius * 0.083, ballRadius * 0.05, 26, 26, 46, 255);
  fillEllipse(data, size, cx + ballRadius * 0.2, eyeY, ballRadius * 0.083, ballRadius * 0.05, 26, 26, 46, 255);

  // Nose (simple line)
  const noseStartY = cy - ballRadius * 0.13;
  const noseEndY = cy + ballRadius * 0.03;
  for (let y = noseStartY; y <= noseEndY; y++) {
    const thickness = ballRadius * 0.025;
    for (let dx = -thickness; dx <= thickness; dx++) {
      setPixel(data, size, cx + dx, y, 26, 26, 46, 255);
    }
  }

  // Smile (arc)
  const smileRadius = ballRadius * 0.17;
  const smileY = cy + ballRadius * 0.03;
  for (let angle = 0.15 * Math.PI; angle <= 0.85 * Math.PI; angle += 0.02) {
    const x = cx + Math.cos(angle) * smileRadius;
    const y = smileY + Math.sin(angle) * smileRadius * 0.5;
    const thickness = ballRadius * 0.03;
    for (let dy = -thickness; dy <= thickness; dy++) {
      setPixel(data, size, x, y + dy, 26, 26, 46, 255);
    }
  }

  // Shine highlight (top-left ellipse)
  const shineX = cx - ballRadius * 0.33;
  const shineY = cy - ballRadius * 0.43;
  fillEllipse(data, size, shineX, shineY, ballRadius * 0.2, ballRadius * 0.12, 255, 255, 255, 100);

  // Base (golden trapezoid)
  const baseY = cy + ballRadius * 0.9;
  for (let y = baseY; y < baseY + ballRadius * 0.4; y++) {
    const t = (y - baseY) / (ballRadius * 0.4);
    const halfWidth = ballRadius * (0.5 - t * 0.17);
    const r = Math.round(251 - 6 * t);
    const g = Math.round(191 - 33 * t);
    const b = Math.round(36 - 25 * t);
    for (let x = cx - halfWidth; x <= cx + halfWidth; x++) {
      setPixel(data, size, x, y, r, g, b, 255);
    }
  }

  return createPNG(size, size, data);
}

// Create icons
const assetsDir = path.join(__dirname, '..', 'assets');

console.log('Creating app icons...');

const icon1024 = createAppIcon(1024);
fs.writeFileSync(path.join(assetsDir, 'icon.png'), icon1024);
console.log('Created: icon.png (1024x1024)');

const adaptiveIcon = createAppIcon(1024);
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.png'), adaptiveIcon);
console.log('Created: adaptive-icon.png (1024x1024)');

const splashIcon = createAppIcon(1024);
fs.writeFileSync(path.join(assetsDir, 'splash-icon.png'), splashIcon);
console.log('Created: splash-icon.png (1024x1024)');

const favicon = createAppIcon(48);
fs.writeFileSync(path.join(assetsDir, 'favicon.png'), favicon);
console.log('Created: favicon.png (48x48)');

console.log('\nAll icons created successfully!');
