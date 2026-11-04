// Renders public/favicon.svg into the raster icons the manifest references.
// Run with: node scripts/make-icons.mjs
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const svg = await readFile(path.join(root, 'public', 'favicon.svg'));

const targets = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-icon.png', size: 180 },
];

for (const { name, size } of targets) {
  const png = await sharp(svg, { density: 384 }).resize(size, size).png().toBuffer();
  await writeFile(path.join(root, 'public', name), png);
  console.log(`wrote public/${name} (${size}x${size}, ${png.length} bytes)`);
}
