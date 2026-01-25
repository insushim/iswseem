const fs = require('fs');
const path = require('path');

// Create PNG icons using Canvas
// This script creates icon files using pure JavaScript

const { createCanvas } = require('canvas');

function createIcon(size, filename, type = 'full') {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  if (type === 'full' || type === 'splash') {
    // Dark gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, size, size);
    bgGrad.addColorStop(0, '#1a1a2e');
    bgGrad.addColorStop(0.5, '#16213e');
    bgGrad.addColorStop(1, '#0f0f23');

    // Rounded rectangle
    const radius = size * 0.15;
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, radius);
    ctx.fillStyle = bgGrad;
    ctx.fill();

    // Decorative stars
    ctx.fillStyle = 'rgba(251, 191, 36, 0.8)';
    ctx.beginPath();
    ctx.arc(size * 0.15, size * 0.2, size * 0.015, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(251, 191, 36, 0.6)';
    ctx.beginPath();
    ctx.arc(size * 0.85, size * 0.15, size * 0.02, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(168, 85, 247, 0.7)';
    ctx.beginPath();
    ctx.arc(size * 0.12, size * 0.7, size * 0.012, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(168, 85, 247, 0.5)';
    ctx.beginPath();
    ctx.arc(size * 0.88, size * 0.75, size * 0.018, 0, Math.PI * 2);
    ctx.fill();
  }

  const centerX = size * 0.5;
  const centerY = type === 'splash' ? size * 0.4 : size * 0.48;
  const ballRadius = type === 'splash' ? size * 0.18 : size * 0.3;

  // Crystal ball outer glow
  ctx.fillStyle = 'rgba(124, 58, 237, 0.3)';
  ctx.beginPath();
  ctx.arc(centerX, centerY, ballRadius * 1.15, 0, Math.PI * 2);
  ctx.fill();

  // Crystal ball main
  const crystalGrad = ctx.createLinearGradient(
    centerX - ballRadius, centerY - ballRadius,
    centerX + ballRadius, centerY + ballRadius
  );
  crystalGrad.addColorStop(0, '#a855f7');
  crystalGrad.addColorStop(0.5, '#7c3aed');
  crystalGrad.addColorStop(1, '#6d28d9');

  ctx.fillStyle = crystalGrad;
  ctx.beginPath();
  ctx.arc(centerX, centerY, ballRadius, 0, Math.PI * 2);
  ctx.fill();

  // Crystal ball inner highlight ring
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = size * 0.01;
  ctx.beginPath();
  ctx.arc(centerX, centerY, ballRadius * 0.87, 0, Math.PI * 2);
  ctx.stroke();

  // Face silhouette inside crystal ball
  const faceWidth = ballRadius * 0.43;
  const faceHeight = ballRadius * 0.57;
  ctx.fillStyle = 'rgba(251, 191, 36, 0.65)';
  ctx.beginPath();
  ctx.ellipse(centerX, centerY - ballRadius * 0.1, faceWidth, faceHeight, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#1a1a2e';
  const eyeY = centerY - ballRadius * 0.2;
  const eyeWidth = ballRadius * 0.083;
  const eyeHeight = ballRadius * 0.05;

  ctx.beginPath();
  ctx.ellipse(centerX - ballRadius * 0.2, eyeY, eyeWidth, eyeHeight, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(centerX + ballRadius * 0.2, eyeY, eyeWidth, eyeHeight, 0, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = ballRadius * 0.033;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - ballRadius * 0.13);
  ctx.lineTo(centerX, centerY + ballRadius * 0.03);
  ctx.stroke();

  // Smile
  ctx.lineWidth = ballRadius * 0.04;
  ctx.beginPath();
  ctx.arc(centerX, centerY + ballRadius * 0.03, ballRadius * 0.17, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  // Crystal ball shine
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.save();
  ctx.translate(centerX - ballRadius * 0.33, centerY - ballRadius * 0.43);
  ctx.rotate(-30 * Math.PI / 180);
  ctx.beginPath();
  ctx.ellipse(0, 0, ballRadius * 0.27, ballRadius * 0.17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Crystal ball base
  const baseY = centerY + ballRadius * 0.9;
  const baseGrad = ctx.createLinearGradient(
    centerX - ballRadius * 0.5, baseY,
    centerX + ballRadius * 0.5, baseY + ballRadius * 0.4
  );
  baseGrad.addColorStop(0, '#fbbf24');
  baseGrad.addColorStop(1, '#f59e0b');

  ctx.fillStyle = baseGrad;
  ctx.beginPath();
  ctx.moveTo(centerX - ballRadius * 0.5, baseY);
  ctx.quadraticCurveTo(centerX, baseY + ballRadius * 0.23, centerX + ballRadius * 0.5, baseY);
  ctx.lineTo(centerX + ballRadius * 0.33, baseY + ballRadius * 0.33);
  ctx.quadraticCurveTo(centerX, baseY + ballRadius * 0.43, centerX - ballRadius * 0.33, baseY + ballRadius * 0.33);
  ctx.closePath();
  ctx.fill();

  // Base shine
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = ballRadius * 0.033;
  ctx.beginPath();
  ctx.arc(centerX, baseY + ballRadius * 0.03, ballRadius * 0.27, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  // Text for splash
  if (type === 'splash') {
    ctx.fillStyle = '#fbbf24';
    ctx.font = `bold ${size * 0.055}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('FaceFortune', centerX, size * 0.74);

    ctx.fillStyle = '#94a3b8';
    ctx.font = `${size * 0.03}px Arial`;
    ctx.fillText('AI 관상 분석', centerX, size * 0.82);
  }

  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
  console.log(`Created: ${filename}`);
}

const assetsDir = path.join(__dirname, '..', 'assets');

try {
  createIcon(1024, path.join(assetsDir, 'icon.png'), 'full');
  createIcon(1024, path.join(assetsDir, 'adaptive-icon.png'), 'adaptive');
  createIcon(1024, path.join(assetsDir, 'splash-icon.png'), 'splash');
  createIcon(48, path.join(assetsDir, 'favicon.png'), 'full');
  console.log('\\nAll icons created successfully!');
} catch (err) {
  console.error('Error:', err.message);
  console.log('\\nCanvas package not available. Creating base64 encoded icons instead...');

  // Fallback: write the SVG icons and provide instructions
  console.log('Please install canvas: npm install canvas');
}
