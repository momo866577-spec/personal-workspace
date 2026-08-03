import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const iconsDir = join(process.cwd(), "public", "icons");
const source = join(iconsDir, "icon-source.png");
mkdirSync(iconsDir, { recursive: true });

if (!existsSync(source)) {
  const defaultIcon = `
  <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="120" y1="80" x2="920" y2="944" gradientUnits="userSpaceOnUse">
        <stop stop-color="#9B8CFF"/><stop offset="0.48" stop-color="#6C5CE7"/><stop offset="1" stop-color="#3425A7"/>
      </linearGradient>
      <linearGradient id="mark" x1="340" y1="300" x2="690" y2="730" gradientUnits="userSpaceOnUse">
        <stop stop-color="#FFFFFF"/><stop offset="1" stop-color="#E7E2FF"/>
      </linearGradient>
      <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="28" stdDeviation="30" flood-color="#1B115C" flood-opacity=".3"/></filter>
    </defs>
    <rect width="1024" height="1024" rx="232" fill="url(#bg)"/>
    <circle cx="790" cy="205" r="210" fill="#FFFFFF" opacity=".075"/>
    <circle cx="180" cy="850" r="245" fill="#FFFFFF" opacity=".055"/>
    <g filter="url(#shadow)">
      <rect x="286" y="252" width="452" height="520" rx="116" fill="#FFFFFF" opacity=".13" stroke="#FFFFFF" stroke-width="8" stroke-opacity=".24"/>
      <path d="M391 640V389c0-24 20-44 44-44h14c18 0 34 11 41 27l56 130 56-130c7-16 23-27 41-27h14c24 0 44 20 44 44v251c0 24-20 44-44 44s-44-20-44-44V494l-61 135c-7 16-23 26-40 26h-12c-18 0-34-10-41-26l-60-135v146c0 24-20 44-44 44s-44-20-44-44Z" fill="url(#mark)"/>
      <circle cx="512" cy="274" r="18" fill="#FFFFFF" opacity=".9"/>
    </g>
  </svg>`;
  await sharp(Buffer.from(defaultIcon)).png().toFile(source);
}

const normal = [[192, "icon-192.png"], [512, "icon-512.png"], [180, "apple-touch-icon.png"], [32, "favicon-32.png"]];
for (const [size, name] of normal) {
  await sharp(source).resize(size, size, { fit: "cover" }).png().toFile(join(iconsDir, name));
}

// Maskable icons keep the full source inside the central 66% safe zone.
for (const size of [192, 512]) {
  const inner = Math.round(size * 0.64);
  const rendered = await sharp(source).resize(inner, inner, { fit: "contain" }).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: "#5846D9" } })
    .composite([{ input: rendered, gravity: "center" }])
    .png()
    .toFile(join(iconsDir, `icon-maskable-${size}.png`));
}

console.log("App icons generated from public/icons/icon-source.png");
