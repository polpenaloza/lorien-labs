// The Lorien Labs mark as pixel art: one 49x49 grid, every file an integer upscale of it.
// Run `pnpm logo` after changing the grid.
import { writeFileSync } from 'node:fs';
import { crc32, deflateSync } from 'node:zlib';

// Colours from design/tokens.json.
const COLOURS = {
  '.': [0x1d, 0x2d, 0x3f], // brand-navy
  P: [0xe9, 0xe8, 0xe2], // brand-paper
  L: [0x42, 0x72, 0x8d], // brand-leaf
};

// The left half of the tree plus its centre column. The right half is its mirror.
const LEFT_HALF = [
  '.........................',
  '.........................',
  '........................P',
  '.......................PP',
  '.......................PL',
  '......................PLP',
  '......................PLP',
  '..................PP..PLP',
  '..................PLP..PP',
  '..................PLLP..P',
  '.............PP....PLLP.P',
  '.............PLPP...PPP.P',
  '.............PLLLP....P.P',
  '..............PLLLP....PP',
  '.........PP....PLLP.L...P',
  '.........PLPP...PPP..L..P',
  '..........PLLP.....P....P',
  '..........PLLLP.P...P...P',
  '...........PLLP.PPP..P..P',
  '............PPP.PLLP..P.P',
  '.......PPPPP..P..PLP...PP',
  '........PLLLP..P..PP...PP',
  '.........PPPPPPP...PP..PP',
  '...............PPP..P..PP',
  '.......L.......PPPPPPP.PP',
  '.......L.....PPP....PPPPP',
  '.......L....PLLP......PPP',
  '........L...PPP.......PPP',
  '........L..............PP',
  '........L..............PP',
  '.........L.............PP',
  '.........L.............PP',
  '..........L............PP',
  '...........L..........PPP',
  '............LL.......PPPP',
  '..............LLPPPPPPPPP',
  '..............PP.....PP.P',
  '............PP.....PPP..P',
  '...........P.P..PPP.P..PP',
  '.................P..P..PP',
  '.................P..P.P.P',
  '................P..PP.P.P',
  '..................P.P...P',
  '....................P...P',
  '........................P',
  '........................P',
  '.........................',
  '.........................',
  '.........................',
];

const GRID = LEFT_HALF.map((row) => {
  if (row.length !== 25) throw new Error(`Grid row must be 25 pixels: ${row}`);
  return row + [...row.slice(0, -1)].reverse().join('');
});

// `size` adds navy around the upscaled grid, for sizes that are not a multiple of the grid.
function render(scale, size = GRID.length * scale) {
  const offset = Math.floor((size - GRID.length * scale) / 2);
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = [0]; // PNG filter type: none
    for (let x = 0; x < size; x++) {
      const gridRow = GRID[Math.floor((y - offset) / scale)];
      const pixel = gridRow?.[Math.floor((x - offset) / scale)] ?? '.';
      row.push(...COLOURS[pixel]);
    }
    rows.push(Buffer.from(row));
  }
  return encodePng(size, Buffer.concat(rows));
}

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, checksum]);
}

function encodePng(size, pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header.set([8, 2], 8); // 8 bits per channel, RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(pixels, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

writeFileSync('design/assets/lorien-labs-mark.png', render(16));
writeFileSync('public/logo.png', render(4));
writeFileSync('public/favicon.png', render(1));
writeFileSync('public/apple-touch-icon.png', render(3, 180));
