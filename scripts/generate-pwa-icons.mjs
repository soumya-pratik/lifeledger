import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");
const source = join(publicDir, "icon.svg");

const sizes = [
  { name: "apple-touch-icon.png", size: 180 },
  { name: "pwa-192x192.png", size: 192 },
  { name: "pwa-512x512.png", size: 512 },
  { name: "maskable-icon-512x512.png", size: 512, padding: 0.18 },
];

const svg = await readFile(source);

for (const spec of sizes) {
  const pad = spec.padding ? Math.round(spec.size * spec.padding) : 0;
  const inner = spec.size - pad * 2;
  const png = await sharp(svg)
    .resize(inner, inner, { fit: "contain", background: { r: 11, g: 18, b: 32, alpha: 1 } })
    .extend({
      top: pad,
      bottom: pad,
      left: pad,
      right: pad,
      background: { r: 11, g: 18, b: 32, alpha: 1 },
    })
    .png()
    .toBuffer();
  await writeFile(join(publicDir, spec.name), png);
  console.log(`wrote ${spec.name}`);
}
