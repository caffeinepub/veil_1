// ─── Aura Color System ───────────────────────────────────────────────────────
// Pure utility: reads emotion_type, returns color + opacity. No side effects.

export const AURA_COLOR_MAP: Record<string, string> = {
  grateful: "#F9E4A0",
  calm: "#A8D8EA",
  stressed: "#F4C28A",
  sad: "#C3B8D8",
  frustrated: "#E8A598",
  reflective: "#B8C4D4",
  anxious: "#C8D4B8",
  lonely: "#B8C8D8",
  numb: "#D0D0D0",
  hopeful: "#A8D8B8",
  default: "#C8C8D4",
};

type IntensityLevel = {
  lightOpacity: number;
  darkOpacity: number;
};

export const AURA_INTENSITY: Record<string, IntensityLevel> = {
  // Level 1 — LUMINOUS
  grateful: { lightOpacity: 0.11, darkOpacity: 0.18 },
  hopeful: { lightOpacity: 0.11, darkOpacity: 0.18 },
  calm: { lightOpacity: 0.11, darkOpacity: 0.18 },
  // Level 2 — PRESENT
  reflective: { lightOpacity: 0.08, darkOpacity: 0.145 },
  anxious: { lightOpacity: 0.08, darkOpacity: 0.145 },
  // Level 3 — SOFT (default for difficult + custom)
  stressed: { lightOpacity: 0.06, darkOpacity: 0.12 },
  frustrated: { lightOpacity: 0.06, darkOpacity: 0.12 },
  sad: { lightOpacity: 0.06, darkOpacity: 0.12 },
  lonely: { lightOpacity: 0.06, darkOpacity: 0.12 },
  numb: { lightOpacity: 0.06, darkOpacity: 0.12 },
  default: { lightOpacity: 0.06, darkOpacity: 0.12 },
};

// Level intensities ordered for "own post +1 step" logic
const INTENSITY_STEPS: IntensityLevel[] = [
  { lightOpacity: 0.11, darkOpacity: 0.18 }, // Level 1 — LUMINOUS (cap)
  { lightOpacity: 0.08, darkOpacity: 0.145 }, // Level 2 — PRESENT
  { lightOpacity: 0.06, darkOpacity: 0.12 }, // Level 3 — SOFT
];

function getIntensityStepIndex(emotion: string): number {
  const level1 = new Set(["grateful", "hopeful", "calm"]);
  const level2 = new Set(["reflective", "anxious"]);
  if (level1.has(emotion)) return 0;
  if (level2.has(emotion)) return 1;
  return 2;
}

// ─── Hex ↔ HSL helpers ───────────────────────────────────────────────────────

function hexToHsl(hex: string): [number, number, number] {
  const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const b = Number.parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  const sN = s / 100;
  const lN = l / 100;
  const a = sN * Math.min(lN, 1 - lN);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = lN - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the aura hex color for the given emotion type.
 * In dark mode, desaturates by 20% and brightens by 10%.
 */
export function getAuraColor(emotion_type: string, isDark: boolean): string {
  const key = emotion_type.toLowerCase();
  const base = AURA_COLOR_MAP[key] ?? AURA_COLOR_MAP.default;
  if (!isDark) return base;
  const [h, s, l] = hexToHsl(base);
  const adjustedS = Math.max(0, s - 20);
  const adjustedL = Math.min(100, l + 10);
  return hslToHex(h, adjustedS, adjustedL);
}

/**
 * Returns the aura opacity for the given emotion type.
 * Own posts receive +1 intensity step (capped at Level 1).
 */
export function getAuraOpacity(
  emotion_type: string,
  isDark: boolean,
  isOwnPost: boolean,
): number {
  const key = emotion_type.toLowerCase();
  let stepIndex = getIntensityStepIndex(key);
  if (isOwnPost) stepIndex = Math.max(0, stepIndex - 1);
  const step = INTENSITY_STEPS[stepIndex];
  return isDark ? step.darkOpacity : step.lightOpacity;
}
