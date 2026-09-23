#!/usr/bin/env node
'use strict';

const path = require('node:path');
const sharp = require('sharp');

const source = process.argv[2];
if (!source) throw new Error('Usage: node scripts/pack-hockey-pieces.cjs <sprite-sheet.png>');

const output = path.resolve(__dirname, '../public/assets/gameplay/tabletop');
const names = ['striker-lime.webp', 'striker-violet.webp', 'puck.webp'];

(async () => {
  const image = sharp(source);
  const meta = await image.metadata();
  if (!meta.width || !meta.height || !meta.hasAlpha) throw new Error('Expected a transparent sprite sheet');
  const cell = Math.floor(meta.width / 3);
  for (let index = 0; index < names.length; index += 1) {
    const cellBuffer = await sharp(source)
      .extract({ left: index * cell, top: 0, width: cell, height: meta.height })
      .png()
      .toBuffer();
    const padded = await sharp(cellBuffer)
      .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .resize(456, 456, {
        fit: 'contain',
        withoutEnlargement: false,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .extend({
        top: 28,
        bottom: 28,
        left: 28,
        right: 28,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();
    const cleanCircle = Buffer.from(
      '<svg width="512" height="512"><circle cx="256" cy="256" r="227" fill="white"/></svg>',
    );
    await sharp(padded)
      .composite([{ input: cleanCircle, blend: 'dest-in' }])
      .webp({ lossless: true, alphaQuality: 100 })
      .toFile(path.join(output, names[index]));
  }
  console.log(`Packed ${names.join(', ')} at 512px with a clean antialiased circular edge`);
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
