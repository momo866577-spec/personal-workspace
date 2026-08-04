import sharp from "sharp";

const source = process.argv[2];
if (!source) throw new Error("Usage: node scripts/crop-workspace-avatar.mjs <image-path>");

const crop = { left: 27, top: 365, width: 536, height: 536 };
await Promise.all([
  sharp(source).extract(crop).resize(1024, 1024).png().toFile("public/icons/icon-source.png"),
  sharp(source).extract(crop).resize(512, 512).png().toFile("public/icons/workspace-avatar.png"),
]);

console.log("Workspace avatar and icon source updated.");
