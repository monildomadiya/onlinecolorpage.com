// Renders the brand art in assets/brand into every file the site serves:
// the header logo, the favicons and the PWA / Apple icons.
//
// Sources live outside public/ on purpose - only the generated files are
// shipped. Run with: npm run icons
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const src = (name) => path.join(root, 'assets', 'brand', name);
const out = (name) => path.join(root, 'public', name);

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

/** The art ships with a wide transparent margin; crop it to the ink. */
async function trim(file) {
  return sharp(await readFile(file)).trim({ threshold: 1 }).png().toBuffer();
}

/**
 * One square icon.
 *
 * `pad` is the share of the side left empty around the art - Android masks
 * a maskable icon down to a circle, so those need room to lose. `bg` flattens
 * the transparency onto a colour, which iOS needs and the .ico does not.
 */
async function square(buf, size, { pad = 0, bg = null } = {}) {
  const inner = Math.max(1, Math.round(size * (1 - pad * 2)));
  const lead = Math.floor((size - inner) / 2);
  const trail = size - inner - lead;

  let img = sharp(buf)
    .resize(inner, inner, { fit: 'contain', background: TRANSPARENT })
    .extend({ top: lead, bottom: trail, left: lead, right: trail, background: TRANSPARENT });

  if (bg) img = img.flatten({ background: bg });

  // The art is flat colour, so a 256-entry palette is lossless to the eye and
  // about a quarter of the bytes.
  return img.png({ compressionLevel: 9, palette: true }).toBuffer();
}

/**
 * Packs PNGs into a .ico. Every browser that still asks for /favicon.ico
 * reads PNG-in-ICO, so the frames go in untouched.
 */
function ico(frames) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(frames.length, 4);

  const dir = Buffer.alloc(16 * frames.length);
  let offset = header.length + dir.length;

  frames.forEach(({ size, png }, i) => {
    const at = i * 16;
    dir.writeUInt8(size >= 256 ? 0 : size, at); // width (0 means 256)
    dir.writeUInt8(size >= 256 ? 0 : size, at + 1); // height
    dir.writeUInt8(0, at + 2); // palette size
    dir.writeUInt8(0, at + 3); // reserved
    dir.writeUInt16LE(1, at + 4); // colour planes
    dir.writeUInt16LE(32, at + 6); // bits per pixel
    dir.writeUInt32LE(png.length, at + 8);
    dir.writeUInt32LE(offset, at + 12);
    offset += png.length;
  });

  return Buffer.concat([header, dir, ...frames.map((f) => f.png)]);
}

async function write(name, buffer) {
  await writeFile(out(name), buffer);
  const meta = await sharp(buffer).metadata().catch(() => null);
  const dims = meta ? `${meta.width}x${meta.height}, ` : '';
  console.log(`wrote public/${name} (${dims}${buffer.length} bytes)`);
}

// ---------------------------------------------------------------- the logo
const logo = await trim(src('logo.webp'));
const logoMeta = await sharp(logo).metadata();

// 360px tall covers a 120px display height at 3x, which is more than the
// header or the footer ever asks for.
await write(
  'logo.png',
  await sharp(logo).resize({ height: 360 }).png({ compressionLevel: 9, palette: true }).toBuffer(),
);
console.log(`  source ${logoMeta.width}x${logoMeta.height} (aspect ${(logoMeta.width / logoMeta.height).toFixed(3)})`);

// --------------------------------------------------------------- the icons
const icon = await trim(src('icon.webp'));

await write('icon-512.png', await square(icon, 512, { pad: 0.04 }));
await write('icon-192.png', await square(icon, 192, { pad: 0.14, bg: '#ffffff' })); // maskable
await write('apple-icon.png', await square(icon, 180, { pad: 0.08, bg: '#ffffff' }));
await write('favicon-32.png', await square(icon, 32, { pad: 0.02 }));
await write('favicon-16.png', await square(icon, 16, { pad: 0.02 }));

const frames = await Promise.all(
  [16, 32, 48].map(async (size) => ({ size, png: await square(icon, size, { pad: 0.02 }) })),
);
await write('favicon.ico', ico(frames));
