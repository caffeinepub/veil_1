// ─── Royal Signature Generator ───────────────────────────────────────────────
// Deterministic SVG cursive signature from name + seed string.
// Same inputs always produce the same signature (seeded PRNG via mulberry32).

export interface SignatureResult {
  svgPath: string;
  viewBox: string;
  width: number;
  height: number;
  pathLength: number;
}

/** Simple hash to convert string → 32-bit integer */
function hashStr(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mulberry32 seeded PRNG — returns 0..1 */
function makePrng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}

/** Per-character path data for flowing cursive letterforms */
function letterSegment(
  rand: () => number,
  x: number,
  y: number,
  ch: string,
): { d: string; endX: number; endY: number } {
  const lc = ch.toLowerCase();
  const wide = "mwv".includes(lc);
  const narrow = "iljft".includes(lc);
  const hasAscender = "bdfhijklt".includes(lc);
  const hasDescender = "gjpqy".includes(lc);

  const charWidth = narrow
    ? 9 + rand() * 4
    : wide
      ? 20 + rand() * 5
      : 14 + rand() * 5;
  const jitter = () => (rand() - 0.5) * 3;

  // Baseline drift — slight downward/upward wander
  const endY = y + (rand() - 0.5) * 2.5;

  // Ascender / descender determines which way the loop goes
  let loopHeight = 8 + rand() * 6;
  let loopDir = -1; // upward
  if (hasDescender) {
    loopHeight = 10 + rand() * 8;
    loopDir = 1;
  }
  if (hasAscender) loopHeight = 14 + rand() * 10;

  const cp1x = x + charWidth * 0.25 + jitter();
  const cp1y = y + loopDir * loopHeight + jitter();
  const cp2x = x + charWidth * 0.75 + jitter();
  const cp2y = endY + loopDir * (loopHeight * 0.3) + jitter();
  const ex = x + charWidth;

  const d = ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${ex.toFixed(1)},${endY.toFixed(1)}`;
  return { d, endX: ex, endY };
}

/** Generate a trailing calligraphic flourish */
function flourish(rand: () => number, x: number, y: number): string {
  const fx1 = x + 8 + rand() * 6;
  const fy1 = y - 18 - rand() * 8;
  const fx2 = x + 22 + rand() * 8;
  const fy2 = y + 12 + rand() * 6;
  const fx3 = x + 18 + rand() * 5;
  const fy3 = y - 8 - rand() * 4;
  return ` C${fx1.toFixed(1)},${fy1.toFixed(1)} ${fx2.toFixed(1)},${fy2.toFixed(1)} ${fx3.toFixed(1)},${fy3.toFixed(1)}`;
}

/**
 * Generate a deterministic cursive SVG signature.
 * @param name  The user's display name
 * @param seed  A stable seed string (e.g. user principal)
 */
export function generateSignature(name: string, seed: string): SignatureResult {
  const rand = makePrng(hashStr(`${name}|${seed}`));

  const PAD = 10;
  const midY = 38;
  let x = PAD;
  let y = midY;
  let path = `M${x},${y}`;

  const chars = name.trim().split("");

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (ch === " ") {
      x += 10 + rand() * 4;
      continue;
    }
    const seg = letterSegment(rand, x, y, ch);
    path += seg.d;
    x = seg.endX;
    y = seg.endY;
  }

  // Trailing flourish on last character
  path += flourish(rand, x, y);
  const finalX = x + 26;

  const viewWidth = Math.ceil(finalX + PAD);
  const viewHeight = 72;

  // Approximate path length for stroke-dasharray animation.
  // Real length would need SVGPathElement.getTotalLength() in browser;
  // use a generous estimate so the drawing animation works correctly.
  const segCount = chars.filter((c) => c !== " ").length;
  const estimatedLength = segCount * 40 + 80;

  return {
    svgPath: path,
    viewBox: `0 0 ${viewWidth} ${viewHeight}`,
    width: viewWidth,
    height: viewHeight,
    pathLength: estimatedLength,
  };
}
