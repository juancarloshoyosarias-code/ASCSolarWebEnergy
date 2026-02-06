const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// SVG del icono (sol solar en ámbar)
const svgIcon = `
<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e293b"/>
      <stop offset="100%" style="stop-color:#0f172a"/>
    </linearGradient>
    <linearGradient id="sun" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#fbbf24"/>
      <stop offset="100%" style="stop-color:#f59e0b"/>
    </linearGradient>
  </defs>
  <!-- Fondo -->
  <rect width="512" height="512" rx="100" fill="url(#bg)"/>
  <!-- Rayos del sol -->
  <g stroke="url(#sun)" stroke-width="20" stroke-linecap="round">
    <line x1="256" y1="80" x2="256" y2="140"/>
    <line x1="256" y1="372" x2="256" y2="432"/>
    <line x1="80" y1="256" x2="140" y2="256"/>
    <line x1="372" y1="256" x2="432" y2="256"/>
    <line x1="131" y1="131" x2="175" y2="175"/>
    <line x1="337" y1="337" x2="381" y2="381"/>
    <line x1="131" y1="381" x2="175" y2="337"/>
    <line x1="337" y1="175" x2="381" y2="131"/>
  </g>
  <!-- Círculo central (sol) -->
  <circle cx="256" cy="256" r="90" fill="url(#sun)"/>
  <!-- Panel solar estilizado -->
  <rect x="200" y="320" width="112" height="80" rx="8" fill="#334155" stroke="#475569" stroke-width="3"/>
  <line x1="228" y1="320" x2="228" y2="400" stroke="#475569" stroke-width="2"/>
  <line x1="256" y1="320" x2="256" y2="400" stroke="#475569" stroke-width="2"/>
  <line x1="284" y1="320" x2="284" y2="400" stroke="#475569" stroke-width="2"/>
  <line x1="200" y1="350" x2="312" y2="350" stroke="#475569" stroke-width="2"/>
  <line x1="200" y1="380" x2="312" y2="380" stroke="#475569" stroke-width="2"/>
</svg>
`;

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outputDir = path.join(__dirname, '../public/icons');

// Crear directorio si no existe
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
  console.log('Generando iconos PWA...\n');

  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);

    await sharp(Buffer.from(svgIcon))
      .resize(size, size)
      .png()
      .toFile(outputPath);

    console.log(`✓ Generado: icon-${size}x${size}.png`);
  }

  console.log('\n¡Iconos generados exitosamente!');
}

generateIcons().catch(console.error);
