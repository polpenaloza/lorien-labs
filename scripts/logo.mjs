// The Lorien Labs mark as pixel art: one 49x49 grid, every file an integer upscale of it.
// Run `pnpm logo` after changing the grid.
import { writeFileSync } from 'node:fs';
import { encodePng } from './png.mjs';

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

// For light pages: the paper pixels in navy, so the tree still reads on paper without a tile.
const ON_LIGHT = { ...COLOURS, P: COLOURS['.'] };

// `size` adds navy around the upscaled grid, for sizes that are not a multiple of the grid.
// `ground: false` leaves the navy transparent.
function render(scale, size = GRID.length * scale, { ground = true, colours = COLOURS } = {}) {
  const offset = Math.floor((size - GRID.length * scale) / 2);
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const gridRow = GRID[Math.floor((y - offset) / scale)];
      const pixel = gridRow?.[Math.floor((x - offset) / scale)] ?? '.';
      if (ground || pixel !== '.') pixels.set([...colours[pixel], 255], (y * size + x) * 4);
    }
  }
  return encodePng(size, size, pixels);
}

// Every mark is transparent. Only the touch icon keeps its navy: iOS fills transparency with black.
const clear = { ground: false };
const clearOnLight = { ground: false, colours: ON_LIGHT };
writeFileSync('design/assets/lorien-labs-mark.png', render(16, undefined, clear));
writeFileSync('public/logo.png', render(4, undefined, clear));
writeFileSync('public/logo-light.png', render(4, undefined, clearOnLight));
writeFileSync('public/favicon.png', render(1, undefined, clear));
writeFileSync('public/favicon-light.png', render(1, undefined, clearOnLight));
writeFileSync('public/apple-touch-icon.png', render(3, 180));
