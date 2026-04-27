const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

const SIZES = [16, 48, 128];
const STATES = {
  inactive: "#9E9E9E",
  active: "#0073B1",
  success: "#4CAF50",
};

const outputDir = path.join(__dirname, "..", "assets");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

for (const size of SIZES) {
  for (const [state, color] of Object.entries(STATES)) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext("2d");

    // Draw circle background
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Draw "JT" text
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `bold ${Math.round(size * 0.4)}px Arial`;
    ctx.fillText("JT", size / 2, size / 2 + 1);

    const filename = `icon-${state}-${size}.png`;
    const filepath = path.join(outputDir, filename);
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(filepath, buffer);
    console.log(`Generated: ${filename}`);
  }
}

// Also generate default icons (using inactive state)
for (const size of SIZES) {
  const src = path.join(outputDir, `icon-inactive-${size}.png`);
  const dst = path.join(outputDir, `icon-${size}.png`);
  fs.copyFileSync(src, dst);
  console.log(`Copied default: icon-${size}.png`);
}

console.log("All icons generated successfully!");
