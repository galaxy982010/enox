import fs from "fs";
import zlib from "zlib";
import path from "path";

const srcPath = "C:/Users/hp/.gemini/antigravity/brain/cf517218-c14e-41ea-80af-17a5f69148fb/.user_uploaded/media_1793617349732_881c8264.png";
const brandDir = path.join(process.cwd(), "public", "assets", "brand");
fs.mkdirSync(brandDir, { recursive: true });

const origDest = path.join(brandDir, "enox-logo-original.png");
fs.copyFileSync(srcPath, origDest);

const buf = fs.readFileSync(srcPath);
const width = buf.readUInt32BE(16);
const height = buf.readUInt32BE(20);
const bitDepth = buf[24];
const colorType = buf[25];
console.log({ width, height, bitDepth, colorType });

// Parse PNG chunks to decode raw pixels, find exact bounding box of logo (cream + charcoal),
// and output a tightly-cropped PNG with transparent outer background while preserving 100% of the logo pixels.
let offset = 8;
const idatChunks = [];
while (offset < buf.length) {
  const length = buf.readUInt32BE(offset);
  const type = buf.subarray(offset + 4, offset + 8).toString("ascii");
  const data = buf.subarray(offset + 8, offset + 8 + length);
  if (type === "IDAT") idatChunks.push(data);
  if (type === "IEND") break;
  offset += 12 + length;
}

const decompressed = zlib.inflateSync(Buffer.concat(idatChunks));
const bpp = colorType === 6 ? 4 : colorType === 2 ? 3 : 4;
const stride = width * bpp + 1;
const rgba = Buffer.alloc(width * height * 4);

function paethPredictor(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

const recon = Buffer.alloc(width * height * bpp);
for (let y = 0; y < height; y++) {
  const filter = decompressed[y * stride];
  for (let x = 0; x < width * bpp; x++) {
    const raw = decompressed[y * stride + 1 + x];
    const a = x >= bpp ? recon[y * width * bpp + x - bpp] : 0;
    const b = y > 0 ? recon[(y - 1) * width * bpp + x] : 0;
    const c = y > 0 && x >= bpp ? recon[(y - 1) * width * bpp + x - bpp] : 0;
    let val = raw;
    if (filter === 1) val = (raw + a) & 0xff;
    else if (filter === 2) val = (raw + b) & 0xff;
    else if (filter === 3) val = (raw + Math.floor((a + b) / 2)) & 0xff;
    else if (filter === 4) val = (raw + paethPredictor(a, b, c)) & 0xff;
    recon[y * width * bpp + x] = val;
  }
}

let minX = width, minY = height, maxX = 0, maxY = 0;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (y * width + x) * bpp;
    const r = recon[idx];
    const g = recon[idx + 1];
    const b = recon[idx + 2];
    const a = bpp === 4 ? recon[idx + 3] : 255;

    const outIdx = (y * width + x) * 4;
    // Pure white background is (255, 255, 255); warm cream is ~ (237, 233, 218)
    const isPureWhite = r > 250 && g > 250 && b > 250;
    if (!isPureWhite && a > 0) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      rgba[outIdx] = r;
      rgba[outIdx + 1] = g;
      rgba[outIdx + 2] = b;
      rgba[outIdx + 3] = 255;
    } else {
      rgba[outIdx] = 255;
      rgba[outIdx + 1] = 255;
      rgba[outIdx + 2] = 255;
      rgba[outIdx + 3] = 0;
    }
  }
}

const pad = 16;
minX = Math.max(0, minX - pad);
minY = Math.max(0, minY - pad);
maxX = Math.min(width - 1, maxX + pad);
maxY = Math.min(height - 1, maxY + pad);

const cropW = maxX - minX + 1;
const cropH = maxY - minY + 1;
console.log({ minX, minY, maxX, maxY, cropW, cropH });

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) {
    c = (c >>> 8) ^ crcTable[(c ^ buf[i]) & 0xff];
  }
  return (c ^ -1) >>> 0;
}
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcVal = crc32(Buffer.concat([typeBuf, data]));
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function writePng(filePath, w, h, pixelGetter) {
  const rawData = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) {
    rawData[y * (w * 4 + 1)] = 0; // filter 0
    for (let x = 0; x < w; x++) {
      const [r, g, b, a] = pixelGetter(x, y);
      const off = y * (w * 4 + 1) + 1 + x * 4;
      rawData[off] = r;
      rawData[off + 1] = g;
      rawData[off + 2] = b;
      rawData[off + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const compressed = zlib.deflateSync(rawData);
  const pngSig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const out = Buffer.concat([
    pngSig,
    makeChunk("IHDR", ihdr),
    makeChunk("IDAT", compressed),
    makeChunk("IEND", Buffer.alloc(0)),
  ]);
  fs.writeFileSync(filePath, out);
}

// 1. Cropped transparent-background version of the exact original artwork
writePng(path.join(brandDir, "enox-logo.png"), cropW, cropH, (x, y) => {
  const srcIdx = ((minY + y) * width + (minX + x)) * 4;
  return [rgba[srcIdx], rgba[srcIdx + 1], rgba[srcIdx + 2], rgba[srcIdx + 3]];
});

// 2. Dark-surface legible variant preserving exact geometry & warm cream blocks, with light warm-cream lettering for N, O, X while E remains charcoal on its warm cream block
writePng(path.join(brandDir, "enox-logo-dark-bg.png"), cropW, cropH, (x, y) => {
  const srcIdx = ((minY + y) * width + (minX + x)) * 4;
  const r = rgba[srcIdx];
  const g = rgba[srcIdx + 1];
  const b = rgba[srcIdx + 2];
  const a = rgba[srcIdx + 3];
  if (a === 0) return [0, 0, 0, 0];
  // Check if pixel is inside the left warm-cream E block (roughly left 28% of cropW) or bottom ebooks strip (bottom 26% of cropH)
  const inLeftBlock = x < cropW * 0.255 && y < cropH * 0.76;
  const inBottomBlock = y > cropH * 0.72 && x > cropW * 0.42;
  const isDarkCharcoal = r < 100 && g < 100 && b < 100;
  if (isDarkCharcoal && !inLeftBlock && !inBottomBlock) {
    // Render N, O, X in warm cream (#ECE8D9) on dark backgrounds for crisp legibility
    return [236, 232, 217, a];
  }
  return [r, g, b, a];
});

console.log("Logo assets generated successfully in public/assets/brand/");
