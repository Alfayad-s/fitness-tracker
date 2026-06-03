/**
 * Generates PWA icons from an inline SVG (run: node scripts/generate-pwa-icons.mjs).
 * Requires: npm install sharp --save-dev
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "../public/icons");

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#059669"/>
  <g fill="none" stroke="#ffffff" stroke-width="28" stroke-linecap="round">
    <path d="M96 256h64"/>
    <path d="M352 256h64"/>
    <rect x="160" y="220" width="192" height="72" rx="12" fill="#ffffff" stroke="none"/>
    <circle cx="96" cy="256" r="40" fill="#ffffff" stroke="none"/>
    <circle cx="416" cy="256" r="40" fill="#ffffff" stroke="none"/>
  </g>
</svg>`;

async function main() {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.error("Install sharp first: npm install sharp --save-dev");
    process.exit(1);
  }

  await mkdir(outDir, { recursive: true });
  const buffer = Buffer.from(svg);

  const sizes = [
    { name: "icon-192.png", size: 192 },
    { name: "icon-512.png", size: 512 },
    { name: "apple-touch-icon.png", size: 180 },
    { name: "splash-1170x2532.png", width: 1170, height: 2532 },
  ];

  for (const item of sizes) {
    if (item.width && item.height) {
      const splashSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${item.width}" height="${item.height}" viewBox="0 0 ${item.width} ${item.height}">
  <rect width="100%" height="100%" fill="#059669"/>
  <g transform="translate(${item.width / 2 - 128}, ${item.height / 2 - 128}) scale(0.5)">
    <rect width="512" height="512" rx="112" fill="#059669"/>
    <g fill="none" stroke="#ffffff" stroke-width="28" stroke-linecap="round">
      <path d="M96 256h64"/>
      <path d="M352 256h64"/>
      <rect x="160" y="220" width="192" height="72" rx="12" fill="#ffffff" stroke="none"/>
      <circle cx="96" cy="256" r="40" fill="#ffffff" stroke="none"/>
      <circle cx="416" cy="256" r="40" fill="#ffffff" stroke="none"/>
    </g>
  </g>
  <text x="50%" y="${item.height - 120}" text-anchor="middle" fill="#ffffff" font-family="system-ui,sans-serif" font-size="42" font-weight="600">Fitness Tracker</text>
</svg>`;
      await sharp(Buffer.from(splashSvg))
        .png()
        .toFile(path.join(outDir, item.name));
    } else {
      await sharp(buffer)
        .resize(item.size, item.size)
        .png()
        .toFile(path.join(outDir, item.name));
    }
    console.log(`Wrote ${item.name}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
