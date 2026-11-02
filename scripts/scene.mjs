// The hero scene: a night forest of silver trees under snowy mountains, drawn by code in pixel art.
// Every colour is a design token. `pnpm scene` writes one transparent PNG per parallax layer to
// public/scene/ and a flattened preview to design/assets/hero-scene.png.
import { mkdirSync, writeFileSync } from 'node:fs';
import { encodePng } from './png.mjs';

const W = 480;
const H = 270;

// Colours from design/tokens.json, dark theme values: the hero is night in both themes.
const COLOURS = {
  night: '#172536', // surface-000
  navy: '#1d2d3f', // brand-navy
  dusk: '#263f54', // surface-200
  hairline: '#3b5068', // hairline
  mist: '#5f8eaa', // border-strong
  leaf: '#42728d', // brand-leaf
  accent: '#8fb8d1', // accent
  muted: '#9fb3c4', // ink-muted
  paper: '#e9e8e2', // brand-paper
};
const RGB = Object.fromEntries(
  Object.entries(COLOURS).map(([name, hex]) => [name, [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))]),
);

// Seeded (mulberry32), so every run draws the same scene.
function random(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
// Ordered dithering: true on a share `t` (0 to 1) of pixels, spread evenly. Pixel art has no blends.
const dither = (x, y, t) => t > (BAYER[y & 3][x & 3] + 0.5) / 16;

// Sines with whole cycles across the width, so a layer drawn with it tiles seamlessly.
const wave = (x, parts) =>
  parts.reduce((sum, [amplitude, cycles, phase]) => sum + amplitude * Math.sin((2 * Math.PI * cycles * x) / W + phase), 0);

function canvas() {
  const pixels = new Uint8Array(W * H * 4);
  const set = (x, y, colour) => {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    pixels.set([...RGB[colour], 255], (y * W + x) * 4);
  };
  const empty = (x, y) => pixels[(Math.round(y) * W + Math.round(x)) * 4 + 3] === 0;
  return { pixels, set, empty };
}

function line(c, x0, y0, x1, y1, colour) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= steps; i++) c.set(x0 + ((x1 - x0) * i) / steps, y0 + ((y1 - y0) * i) / steps, colour);
}

// A clump of leaves, lit from the moon on the upper right. Random speckles, not a dither: a regular
// pattern reads as stripes on leaves.
function leaves(c, cx, cy, rx, ry, rand) {
  for (let y = -ry; y <= ry; y++) {
    for (let x = -rx; x <= rx; x++) {
      const d = (x * x) / (rx * rx) + (y * y) / (ry * ry);
      if (d > 1 || (d > 0.7 && rand() < 0.4)) continue;
      const lit = y < -ry * 0.2 && x > -rx * 0.3 && rand() < 0.5;
      const shade = y > ry * 0.45 || rand() < 0.08;
      c.set(cx + x, cy + y, shade ? 'dusk' : lit ? 'accent' : 'leaf');
    }
  }
}

const MOON = { x: 356, y: 54, r: 12 };

function sky() {
  const c = canvas();
  const bands = ['night', 'navy', 'dusk', 'hairline'];
  for (let y = 0; y < H; y++) {
    const t = Math.min(y / 165, 1) * (bands.length - 1);
    const i = Math.floor(t);
    for (let x = 0; x < W; x++) c.set(x, y, dither(x, y, t - i) ? bands[Math.min(i + 1, bands.length - 1)] : bands[i]);
  }
  // Halo: a dithered ring, since pixel art has no glow.
  for (let y = -MOON.r - 8; y <= MOON.r + 8; y++) {
    for (let x = -MOON.r - 8; x <= MOON.r + 8; x++) {
      const d = Math.hypot(x, y);
      if (d > MOON.r && dither(MOON.x + x, MOON.y + y, (1 - (d - MOON.r) / 9) * 0.6)) c.set(MOON.x + x, MOON.y + y, 'hairline');
      if (d <= MOON.r) c.set(MOON.x + x, MOON.y + y, Math.hypot(x - 4, y + 3) > MOON.r ? 'muted' : 'paper');
    }
  }
  for (const [x, y] of [[-4, 2], [-3, 2], [2, -5], [5, 4], [-6, -3]]) c.set(MOON.x + x, MOON.y + y, 'muted');
  return c;
}

function stars(seed, count) {
  const c = canvas();
  const rand = random(seed);
  for (let i = 0; i < count; i++) {
    const x = Math.floor(rand() * W);
    const y = Math.floor(rand() * 130);
    if (Math.hypot(x - MOON.x, y - MOON.y) < MOON.r + 12) continue;
    if (rand() < 0.1) {
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) c.set(x + dx, y + dy, 'accent');
      c.set(x, y, 'paper');
    } else {
      c.set(x, y, rand() < 0.35 ? 'paper' : 'muted');
    }
  }
  return c;
}

// A jagged ridge through hand-placed [x, y] points, roughened by midpoint displacement: each pass
// splits every segment and nudges the middle up or down in proportion to its length.
function ridge(points, roughness, rand) {
  let line = points;
  for (let pass = 0; pass < 7; pass++) {
    const next = [line[0]];
    for (let i = 1; i < line.length; i++) {
      const [ax, ay] = line[i - 1];
      const [bx, by] = line[i];
      next.push([(ax + bx) / 2, (ay + by) / 2 + (rand() - 0.5) * roughness * (bx - ax)], line[i]);
    }
    line = next;
  }
  const heights = new Float32Array(W);
  for (let i = 1; i < line.length; i++) {
    const [ax, ay] = line[i - 1];
    const [bx, by] = line[i];
    for (let x = Math.max(0, Math.ceil(ax)); x <= Math.min(W - 1, bx); x++) heights[x] = ay + ((by - ay) * (x - ax)) / (bx - ax || 1);
  }
  return heights;
}

// A mountain range: snow that runs down the gullies, faces towards the moon lit, rock streaks below.
function range(points, roughness, seed, snowline, colours) {
  const c = canvas();
  const rand = random(seed);
  const heights = ridge(points, roughness, rand);
  let gully = 0;
  for (let x = 0; x < W; x++) {
    const top = Math.round(heights[x]);
    const lit = heights[Math.min(x + 2, W - 1)] > heights[Math.max(x - 2, 0)]; // the ground falls away to the right
    gully = Math.max(0, Math.min(10, gully + (rand() - 0.5) * 4));
    const snow = top < snowline ? (snowline - top) * 0.22 + 1 + gully * 0.5 : 0;
    const streak = rand() < 0.06 ? 3 + rand() * 10 : 0;
    for (let y = top; y < H; y++) {
      const depth = y - top;
      let colour = colours.body;
      if (depth < snow) colour = dither(x, y, 1.2 - depth / snow) ? 'paper' : colours.snow;
      else if (lit && depth < snow + 4 && dither(x, y, 0.8 - (depth - snow) / 4)) colour = colours.lit;
      else if (depth > snow + 3 && depth < snow + streak && y % 2 === 0) colour = colours.rock;
      c.set(x, y, colour);
    }
  }
  return Object.assign(c, { heights });
}

const farRange = () =>
  range(
    [[-12, 118], [26, 94], [68, 110], [108, 76], [146, 102], [178, 92], [204, 126], [240, 150], [276, 124], [306, 86], [338, 102], [392, 72], [428, 98], [462, 82], [492, 108]],
    0.32, 7, 112, { body: 'hairline', lit: 'mist', snow: 'muted', rock: 'dusk' },
  );

const nearRange = () =>
  range(
    [[-12, 150], [18, 126], [58, 142], [96, 114], [136, 140], [166, 132], [194, 164], [222, 180], [240, 184], [258, 180], [286, 162], [318, 128], [352, 142], [394, 118], [432, 138], [470, 120], [492, 140]],
    0.38, 13, 126, { body: 'dusk', lit: 'hairline', snow: 'muted', rock: 'navy' },
  );

// The elven refuge at the head of the valley, where the river is born: halls with low gabled roofs
// stepping down terraces, one tower, two waterfalls. Drawn in faded colours, because the far mist
// passes in front of it.
const HOUSE = { x: 240, base: 172 };
const far = farRange();

// A thin waterfall down the cliff: mostly slanted runs towards the valley, broken by short drops and,
// now and then, a jog back, like water finding its way down rock. It never steps off the rock into sky.
// `reach` caps how far it strays sideways, so it ends at the foot of the cliff, not on the buildings.
function fallPath(x, bottom, toward, seed, reach = 10) {
  const rand = random(seed);
  const start = x;
  const path = [];
  let y = Math.round(far.heights[x]) + 8;
  let side = toward;
  while (y < bottom) {
    const drop = 1 + Math.floor(rand() * 2);
    for (let i = 0; i < drop && y < bottom; i++) path.push([x, y++]);
    const run = 3 + Math.floor(rand() * 4);
    for (let i = 0; i < run && y < bottom; i++) {
      if (Math.abs(x + side - start) > reach) side = -side; // at the edge of its band it turns back: the zigzag
      if (y >= far.heights[x + side] + 3) x += side;
      path.push([x, y++]);
    }
    side = rand() < 0.85 ? toward : -toward;
  }
  return path;
}

// Either side of the refuge, flowing towards it.
const FALLS = [fallPath(201, 168, 1, 61), fallPath(286, 166, -1, 67, 8)];

function valley() {
  const c = canvas();
  const { x, base } = HOUSE;
  const rect = (x0, y0, x1, y1, colour) => {
    for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) c.set(xx, yy, colour);
  };
  // A low gable: each row two pixels narrower, the eaves lit.
  const roof = (cx, y, half, step = 2) => {
    for (let k = 0; half - k * step > 0; k++) line(c, cx - half + k * step, y - k, cx + half - k * step, y - k, k === 0 ? 'muted' : 'mist');
  };
  const hall = (x0, x1, floor, height) => {
    rect(x0, floor - height, x1, floor - 1, 'mist');
    for (let wx = x0 + 2; wx <= x1 - 2; wx += 3) {
      c.set(wx, floor - height + 3, wx % 4 ? 'hairline' : 'paper'); // arched windows, a few lit
      c.set(wx, floor - height + 4, 'hairline');
    }
    roof((x0 + x1) / 2, floor - height - 1, Math.round((x1 - x0) / 2) + 2);
  };
  for (const [x0, x1, y] of [[x - 30, x + 30, base], [x - 26, x - 8, base - 7], [x + 8, x + 27, base - 6]]) {
    rect(x0, y, x1, y + 1, 'hairline');
    line(c, x0, y, x1, y, 'mist');
  }
  hall(x - 24, x - 10, base - 7, 6);
  hall(x + 10, x + 22, base - 6, 5);
  // A tower with a pyramid roof stands over the right-hand hall.
  rect(x + 23, base - 28, x + 27, base - 7, 'mist');
  for (const wy of [base - 24, base - 17]) c.set(x + 25, wy, 'paper');
  roof(x + 25, base - 29, 4, 1);
  hall(x - 12, x + 12, base, 8);
  // A bridge over the young river.
  for (let i = -7; i <= 7; i++) c.set(x + i, base + 4 - Math.round(Math.sqrt(49 - i * i) * 0.35), 'mist');
  for (const path of FALLS) for (const [fx, fy] of path) c.set(fx, fy, 'mist');
  return c;
}

// The waterfalls catch the moon: two frames that alternate, like the stars.
function falls(seed) {
  const c = canvas();
  const rand = random(seed);
  for (const path of FALLS) {
    for (const [fx, fy] of path) if (rand() < 0.2) c.set(fx, fy, 'accent');
    const [ex, ey] = path.at(-1);
    for (let i = 0; i < 3; i++) c.set(ex + Math.round((rand() - 0.5) * 4), ey + 1, 'mist');
  }
  return c;
}

// Haze: tapered wisps, after the fog in shorts-factory's studio. HeroScene.astro blends them with
// `mix-blend-mode: lighten`, so a wisp lifts every darker colour behind it to its own and leaves
// anything brighter (snow, trunks, lanterns) cutting through. Edges thin out in a dither, so a wisp has
// no outline; `core` is the colour of its middle, one step lighter for thick haze. Wisps wrap around
// the edges, so the layer tiles and can drift forever.
function haze(top, bottom, count, seed, core = 'mist') {
  const c = canvas();
  const rand = random(seed);
  for (let i = 0; i < count; i++) {
    const width = 70 + Math.floor(rand() * 110);
    const thickness = 3 + Math.floor(rand() * 3);
    const y = top + Math.floor(rand() * (bottom - top));
    const x = Math.floor(rand() * W);
    const phase = rand() * 6;
    for (let dx = -width / 2; dx < width / 2; dx++) {
      // Thickness swells and thins along the wisp, so it billows instead of reading as a bar.
      const local = thickness * (0.6 + 0.4 * Math.sin(dx / 7 + phase));
      for (let dy = -thickness - 1; dy <= thickness + 1; dy++) {
        const wx = (((x + Math.round(dx)) % W) + W) % W;
        const edge = Math.hypot(dx / (width / 2), dy / (local + 1));
        if (!dither(wx, y + dy, 1.4 - edge * 1.4)) continue;
        const thick = dither(wx, y + dy, 1 - edge * 2); // the middle lifts two steps, fading out
        if (thick || c.empty(wx, y + dy)) c.set(wx, y + dy, thick ? core : 'hairline');
      }
    }
  }
  return c;
}

const riverCentre = (y) => 240 + 26 * Math.sin((y - 186) / 13) * ((y - 186) / 84);
const riverHalfWidth = (y) => 1 + (y - 186) * 0.24;

function hills() {
  const c = canvas();
  const rand = random(11);
  const ridge = (x) => Math.round(186 + wave(x, [[3, 2, 1], [2, 5, 0.3], [1, 11, 2]]));
  for (let x = 0; x < W; x++) for (let y = ridge(x); y < H; y++) c.set(x, y, 'dusk');
  // A far tree line along the ridge, kept clear where the river leaves the hills.
  for (let x = 0; x < W; x += 3 + Math.floor(rand() * 4)) {
    if (Math.abs(x - 240) < 10) continue;
    const height = 3 + Math.floor(rand() * 7);
    const width = 2 + Math.floor(rand() * 3);
    for (let dy = 0; dy < height; dy++) {
      const half = Math.round(width * Math.sin((Math.PI * (dy + 1)) / (height + 1)));
      for (let dx = -half; dx <= half; dx++) c.set(x + dx, ridge(x) - dy, 'navy');
    }
  }
  for (let y = 186; y < H; y++) {
    const half = riverHalfWidth(y);
    for (let x = Math.round(riverCentre(y) - half); x <= riverCentre(y) + half; x++) c.set(x, y, 'leaf');
  }
  return c;
}

function riverShimmer(seed) {
  const c = canvas();
  const rand = random(seed);
  for (let y = 188; y < H; y++) {
    const half = riverHalfWidth(y);
    for (let x = Math.round(riverCentre(y) - half); x <= riverCentre(y) + half; x++) {
      if (rand() < 0.07) c.set(x, y, rand() < 0.3 ? 'paper' : 'accent');
    }
  }
  return c;
}

// The silver trees, each with its own shape: pale trunks that widen to the ground, blue crowns.
function trunk(c, x, base, top, rand, { lean = 0, width = 3 } = {}) {
  const at = (y) => Math.round(x + lean * ((base - y) / (base - top)) ** 2);
  for (let y = top; y <= base; y++) {
    const t = (y - top) / (base - top);
    const half = Math.round(((width - 1) / 2) * (0.4 + t) + Math.max(0, y - (base - 6)) * 0.7);
    for (let dx = -half; dx <= half; dx++) c.set(at(y) + dx, y, dx === -half || (dx === 0 && rand() < 0.08) ? 'muted' : 'paper');
  }
  return at;
}

function lantern(c, x, y) {
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) c.set(x + dx, y + dy, 'accent');
  c.set(x, y, 'paper');
}

const TREES = {
  // Tall, with crowns in widening tiers.
  tiered(c, rand, x, base, height) {
    const top = base - height;
    for (const [rise, side] of [[0.3, -1], [0.34, 1], [0.4, -1], [0.44, 1]]) line(c, x, top + height * rise, x + side * 20, top + 22, 'paper');
    for (const [drop, rx, ry] of [[4, 9, 5], [14, 17, 6], [25, 24, 7], [36, 19, 6]]) {
      leaves(c, x - Math.round(rx * 0.5), top + drop, rx, ry, rand);
      leaves(c, x + Math.round(rx * 0.5), top + drop + 1, rx, ry, rand);
    }
    trunk(c, x, base, top + 40, rand, { width: 5 });
    lantern(c, x - 18, top + 44);
  },
  // One round crown with smaller lumps around it.
  dome(c, rand, x, base, height) {
    const top = base - height;
    for (const side of [-1, 1]) line(c, x, top + 40, x + side * 14, top + 18, 'paper');
    leaves(c, x, top + 16, 22, 15, rand);
    for (const [dx, dy, r] of [[-20, 24, 8], [19, 22, 9], [2, 2, 9]]) leaves(c, x + dx, top + dy, r, Math.round(r * 0.6), rand);
    trunk(c, x, base, top + 28, rand, { width: 4 });
  },
  // Narrow and young: small clumps climbing the trunk.
  slender(c, rand, x, base, height) {
    const top = base - height;
    trunk(c, x, base, top, rand, { width: 2 });
    for (let i = 0; i < 7; i++) leaves(c, x + (i % 2 ? 3 : -3), top + 4 + i * 8, 5 + (i > 1 ? 1 : 0), 4, rand);
  },
  // Bent by the wind: the trunk curves right, one long branch reaches left.
  leaning(c, rand, x, base, height) {
    const top = base - height;
    const at = trunk(c, x, base, top + 10, rand, { lean: 16, width: 4 });
    line(c, at(top + 40), top + 40, at(top + 40) - 22, top + 30, 'paper');
    leaves(c, at(top + 40) - 24, top + 28, 9, 5, rand);
    leaves(c, at(top + 10) - 2, top + 8, 18, 9, rand);
    leaves(c, at(top + 10) + 12, top + 14, 9, 6, rand);
  },
  // Splits in two halfway up, each fork with its own crown.
  twin(c, rand, x, base, height) {
    const top = base - height;
    const fork = Math.round(top + height * 0.5);
    for (const [dx, crownTop, r] of [[-12, top + 6, 15], [13, top + 14, 13]]) {
      line(c, x, fork, x + dx, crownTop + 8, 'paper');
      line(c, x + 1, fork, x + dx + 1, crownTop + 8, 'paper');
      leaves(c, x + dx, crownTop, r, Math.round(r * 0.55), rand);
      leaves(c, x + dx + Math.sign(dx) * 8, crownTop + 7, 7, 4, rand);
    }
    trunk(c, x, base, fork, rand, { width: 5 });
    lantern(c, x + 2, fork + 6);
  },
  // A bare, tall trunk under one wide, flat crown, a lantern hanging beneath it.
  umbrella(c, rand, x, base, height) {
    const top = base - height;
    for (const side of [-1, -0.5, 0.5, 1]) line(c, x, top + 22, x + side * 30, top + 8, 'paper');
    leaves(c, x, top + 6, 34, 7, rand);
    leaves(c, x - 22, top + 11, 14, 5, rand);
    leaves(c, x + 24, top + 10, 14, 5, rand);
    trunk(c, x, base, top + 10, rand, { width: 5 });
    lantern(c, x + 10, top + 16);
  },
};

function forest() {
  const c = canvas();
  const rand = random(23);
  // [shape, x, base, height]: the tallest stand at the sides, leaving the centre to the title and the valley.
  const trees = [['tiered', 58, 236, 152], ['dome', 130, 230, 104], ['slender', 188, 226, 88], ['leaning', 286, 226, 84], ['twin', 350, 230, 116], ['umbrella', 424, 236, 148]];
  for (const [shape, x, base, height] of trees) TREES[shape](c, rand, x, base, height);
  return c;
}

function foreground() {
  const c = canvas();
  const rand = random(31);
  const ground = (x) => Math.round(240 + wave(x, [[4, 1, 0.5], [2, 3, 1.7], [1, 7, 0.2]]));
  for (let x = 0; x < W; x++) {
    for (let y = ground(x); y < H; y++) c.set(x, y, 'navy');
    if (rand() < 0.45) for (let dy = 1; dy <= 1 + Math.floor(rand() * 3); dy++) c.set(x, ground(x) - dy, 'navy');
  }
  return c;
}

// Back to front, as HeroScene.astro stacks them.
const LAYERS = {
  sky: sky(),
  'stars-a': stars(3, 90),
  'stars-b': stars(5, 50),
  'mountains-far': far,
  valley: valley(),
  'falls-a': falls(51),
  'falls-b': falls(53),
  'mountains-near': nearRange(),
  'haze-far': haze(150, 186, 8, 61),
  'haze-far-fast': haze(156, 184, 5, 63),
  hills: hills(),
  'river-a': riverShimmer(41),
  'river-b': riverShimmer(43),
  forest: forest(),
  'haze-near': haze(204, 238, 6, 67),
  foreground: foreground(),
};

mkdirSync('public/scene', { recursive: true });
for (const [name, layer] of Object.entries(LAYERS)) writeFileSync(`public/scene/${name}.png`, encodePng(W, H, layer.pixels));

// Flatten every layer (both twinkle frames shown) into a ×2 preview for the design folder. Haze layers
// blend as CSS `lighten` does: each channel keeps the brighter value.
const SCALE = 2;
const preview = new Uint8Array(W * SCALE * H * SCALE * 4);
for (const [name, layer] of Object.entries(LAYERS)) {
  const lighten = name.startsWith('haze');
  for (let y = 0; y < H * SCALE; y++) {
    for (let x = 0; x < W * SCALE; x++) {
      const from = (Math.floor(y / SCALE) * W + Math.floor(x / SCALE)) * 4;
      const to = (y * W * SCALE + x) * 4;
      if (!layer.pixels[from + 3]) continue;
      for (let k = 0; k < 4; k++) preview[to + k] = lighten ? Math.max(preview[to + k], layer.pixels[from + k]) : layer.pixels[from + k];
    }
  }
}
writeFileSync('design/assets/hero-scene.png', encodePng(W * SCALE, H * SCALE, preview));
