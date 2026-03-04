// Generate minimal PNG icons for PWA
const fs = require('fs');

function createPNG(size) {
  // Create a minimal valid PNG file with a red square
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);  // width
  ihdrData.writeUInt32BE(size, 4);  // height
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // color type (RGB)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdr = createChunk('IHDR', ihdrData);

  // IDAT chunk - raw image data with zlib
  const rawData = [];
  for (let y = 0; y < size; y++) {
    rawData.push(0); // filter none
    for (let x = 0; x < size; x++) {
      // Red background with white cross in center
      const cx = size / 2, cy = size / 2;
      const dx = Math.abs(x - cx), dy = Math.abs(y - cy);
      const crossWidth = size * 0.08;
      const crossLen = size * 0.25;

      const isHCross = dy < crossWidth && dx < crossLen;
      const isVCross = dx < crossWidth && dy < crossLen;

      // Border radius effect
      const cornerDist = Math.sqrt(
        Math.pow(Math.max(0, Math.abs(x - cx) - cx * 0.6), 2) +
        Math.pow(Math.max(0, Math.abs(y - cy) - cy * 0.6), 2)
      );
      const isCorner = cornerDist > size * 0.18;

      if (isCorner) {
        rawData.push(0, 0, 0); // black corners
      } else if (isHCross || isVCross) {
        rawData.push(255, 255, 255); // white cross
      } else {
        rawData.push(220, 38, 38); // red (#dc2626)
      }
    }
  }

  const raw = Buffer.from(rawData);
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(raw);
  const idat = createChunk('IDAT', compressed);

  // IEND chunk
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);

  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData), 0);

  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(data) {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

fs.writeFileSync('public/icons/icon-192.png', createPNG(192));
fs.writeFileSync('public/icons/icon-512.png', createPNG(512));
console.log('Icons generated successfully');
