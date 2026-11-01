export const ACCENT = "#C81E3A";
const INK = "#0C0C0E";
const WHITE = "#FFFFFF";
const CREAM = "#FFF5F2";

function rgb(hex: string) {
  return [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
}

export function mix(a: string, b: string, t: number) {
  const to = rgb(b);
  const channels = rgb(a).map((v, i) =>
    Math.round(v + ((to[i] as number) - v) * t)
      .toString(16)
      .padStart(2, "0"),
  );
  return `#${channels.join("")}`;
}

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

export function bayer(row: number, col: number) {
  return (BAYER[row % 4]?.[col % 4] as number) / 16 - 0.5;
}

export function paint(
  ctx: CanvasRenderingContext2D,
  pixels: string[],
  cols: number,
) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  pixels.forEach((color, i) => {
    if (color === "transparent") return;
    ctx.fillStyle = color;
    ctx.fillRect(i % cols, Math.floor(i / cols), 1, 1);
  });
}

const skyInk = mix(ACCENT, "#000000", 0.74);
const mascotColors: Record<string, string> = {
  o: skyInk,
  w: WHITE,
  f: mix(CREAM, ACCENT, 0.22),
  e: skyInk,
  c: mix(ACCENT, WHITE, 0.36),
};

export const MASCOT = [
  "oooooooooooooooo",
  "offwwwwwwwwwwffo",
  "owfffwwwwwwfffwo",
  "owwwfffwwfffwwwo",
  "owwwwwffffwwwwwo",
  "owwwwwwwwwwwwwwo",
  "owwweewwwwweewwo",
  "owwweewwwwweewwo",
  "owcwwwwwwwwwwcwo",
  "owwwwwwoowwwwwwo",
  "owwwwwwwwwwwwwwo",
  "oooooooooooooooo",
].flatMap((row) => [...row].map((ch) => mascotColors[ch] as string));

export const GLYPH = ["oxxo", "xxxx", "xxxx", "oxxo"].flatMap((row, r) =>
  [...row].map((ch, c) => {
    if (ch !== "x") return "transparent";
    return (r + c) % 2 ? ACCENT : mix(ACCENT, WHITE, 0.3);
  }),
);

const skyPalette = [
  CREAM,
  mix(CREAM, ACCENT, 0.16),
  mix(CREAM, ACCENT, 0.36),
  mix(CREAM, ACCENT, 0.6),
  mix(CREAM, ACCENT, 0.84),
  mix(ACCENT, "#000000", 0.12),
];

export const SKY_COLS = 60;
export const SKY = Array.from({ length: 20 * SKY_COLS }, (_, i) => {
  const r = Math.floor(i / SKY_COLS);
  const c = i % SKY_COLS;
  const x = c / SKY_COLS;
  const y = 1 - r / 20;
  const n =
    (Math.sin(c * 0.35 + r * 0.9) +
      Math.sin(c * 0.13 - r * 0.41 + 1.7) +
      Math.sin((c + r) * 0.21 + 0.4)) /
    3;
  const v =
    y * 4.4 +
    n * 1.1 -
    0.1 -
    2.8 * Math.exp(-((x - 0.3) ** 2 / 0.1 + (y - 0.55) ** 2 / 0.09));
  const index = Math.max(0, Math.min(5, Math.round(v + bayer(r, c))));
  return skyPalette[index] as string;
});

export const FIELD_COLS = 60;
export const FIELD_ROWS = 36;
const FILTER_COL = FIELD_COLS * 0.58;
const fieldPalette = [
  INK,
  mix(INK, ACCENT, 0.09),
  mix(INK, ACCENT, 0.2),
  mix(INK, ACCENT, 0.36),
  mix(INK, ACCENT, 0.58),
  mix(INK, ACCENT, 0.82),
  ACCENT,
  mix(ACCENT, WHITE, 0.45),
];

const stripPalette = [
  "transparent",
  mix(INK, ACCENT, 0.08),
  mix(INK, ACCENT, 0.16),
  mix(INK, ACCENT, 0.28),
  mix(INK, ACCENT, 0.42),
  mix(INK, ACCENT, 0.6),
];

export const STRIP_COLS = 60;
export const STRIP_ROWS = 6;

export function stripPixels(frame: number) {
  const T = frame * 0.05;
  const pixels: string[] = [];
  for (let r = 0; r < STRIP_ROWS; r++) {
    const y = r / STRIP_ROWS;
    for (let c = 0; c < STRIP_COLS; c++) {
      const n =
        Math.sin(c * 0.21 + T) * Math.sin(r * 0.5 - T * 0.7) +
        Math.sin((c + r) * 0.11 + T * 0.5) * 0.6;
      const v = (0.1 + y * 2.4) * (0.6 + 0.4 * n) * 1.7;
      const index = Math.max(0, Math.min(5, Math.round(v + bayer(r, c))));
      pixels.push(stripPalette[index] as string);
    }
  }
  return pixels;
}

// Commits repeat in this order; true means it became a user-facing update.
const COMMITS = [
  true,
  false,
  true,
  false,
  false,
  true,
  false,
  true,
  false,
  true,
  false,
  false,
];
const EDITION_SIZE = COMMITS.length;

type Pulse = { row: number; x: number; speed: number; dropped: boolean };

export type Sim = {
  frame: number;
  commits: boolean[];
  cursor: number;
  edition: number;
  sentTicks: number | null;
  pulses: Pulse[];
};

export function createSim(): Sim {
  return {
    frame: 0,
    commits: COMMITS.slice(0, 4),
    cursor: 4,
    edition: 14,
    sentTicks: null,
    pulses: [],
  };
}

export function tickSim(sim: Sim) {
  if (sim.sentTicks !== null) {
    if (sim.sentTicks >= 2) {
      sim.commits = [];
      sim.cursor = 0;
      sim.sentTicks = null;
      sim.edition += 1;
    } else {
      sim.sentTicks += 1;
    }
    return;
  }
  if (sim.commits.length >= EDITION_SIZE) {
    sim.sentTicks = 0;
    return;
  }
  const keep = COMMITS[sim.cursor % EDITION_SIZE] as boolean;
  const row = 6 + ((sim.cursor * 11 + sim.pulses.length * 5) % 23);
  sim.pulses = [
    ...sim.pulses,
    { row, x: -6, speed: keep ? 1.6 : 1.3, dropped: !keep },
  ].slice(-10);
  sim.commits.push(keep);
  sim.cursor += 1;
}

export function frameSim(sim: Sim) {
  sim.frame += 1;
  sim.pulses = sim.pulses
    .map((p) => ({ ...p, x: p.x + p.speed }))
    .filter(
      (p) => p.x < FIELD_COLS + 6 && !(p.dropped && p.x > FILTER_COL + 3),
    );
}

export function fieldPixels(sim: Sim) {
  const T = sim.frame * 0.06;
  const pixels: string[] = [];
  for (let r = 0; r < FIELD_ROWS; r++) {
    const y = r / FIELD_ROWS;
    const band = Math.exp(-((y - 0.78) ** 2) / 0.045) * 3.6;
    for (let c = 0; c < FIELD_COLS; c++) {
      const n =
        Math.sin(c * 0.21 + T) * Math.sin(r * 0.33 - T * 0.7) +
        Math.sin((c + r) * 0.11 + T * 0.5) * 0.6 +
        Math.sin(c * 0.07 - r * 0.19 + T * 1.3) * 0.5;
      let v =
        band *
        (0.55 + 0.45 * n) *
        (0.55 + 0.45 * Math.sin((c / FIELD_COLS) * 3.1 + T * 0.4));
      if (Math.abs(c - FILTER_COL) < 0.6 && y > 0.5) v += 1.2;
      for (const p of sim.pulses) {
        const dr = r - p.row;
        const dx = c - p.x;
        if (dr === 0 && dx <= 0 && dx > -8) {
          v += (p.dropped ? 3.2 : 6) * (1 + dx / 8);
        } else if (Math.abs(dr) === 1 && dx <= 0 && dx > -4) {
          v += (p.dropped ? 1 : 2.2) * (1 + dx / 4);
        }
      }
      const index = Math.max(0, Math.min(7, Math.round(v + bayer(r, c))));
      pixels.push(fieldPalette[index] as string);
    }
  }
  return pixels;
}
