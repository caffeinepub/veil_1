// ─── Emotion Shape Configuration ───────────────────────────────────────────
// Maps each Veil emotion to its visual character: color, shape, motion, behavior

export type EmotionType =
  | "grateful"
  | "calm"
  | "stressed"
  | "sad"
  | "frustrated"
  | "reflective"
  | "anxious"
  | "lonely"
  | "numb"
  | "hopeful"
  | "custom";

export type MotionType =
  | "pulse"
  | "drift-down"
  | "tremor"
  | "push-out"
  | "drift-separate"
  | "still"
  | "radiate"
  | "wave"
  | "rise"
  | "rotate"
  | "float";

export type ShapeType =
  | "elongated"
  | "droplet"
  | "fragment"
  | "angular"
  | "dot"
  | "flat-disc"
  | "soft-circle"
  | "fluid-blob"
  | "teardrop"
  | "arc"
  | "blob";

export type MultiTouchBehavior = "repel" | "blend" | "drift-separate" | "none";

export interface EmotionShape {
  color: string;
  glowColor: string;
  bgDark: string; // very dark background version
  shapeType: ShapeType;
  motionType: MotionType;
  multiTouch: MultiTouchBehavior;
  sizeBase: number; // base shape size in px
  label: string;
}

export const EMOTION_SHAPES: Record<EmotionType, EmotionShape> = {
  stressed: {
    color: "#F4C28A",
    glowColor: "rgba(244,194,138,0.35)",
    bgDark: "#1a0f00",
    shapeType: "elongated",
    motionType: "pulse",
    multiTouch: "repel",
    sizeBase: 48,
    label: "Stressed",
  },
  sad: {
    color: "#C3B8D8",
    glowColor: "rgba(195,184,216,0.35)",
    bgDark: "#0d0810",
    shapeType: "droplet",
    motionType: "drift-down",
    multiTouch: "drift-separate",
    sizeBase: 44,
    label: "Sad",
  },
  anxious: {
    color: "#C8D4B8",
    glowColor: "rgba(200,212,184,0.3)",
    bgDark: "#0a0f06",
    shapeType: "fragment",
    motionType: "tremor",
    multiTouch: "none",
    sizeBase: 28,
    label: "Anxious",
  },
  frustrated: {
    color: "#E8A598",
    glowColor: "rgba(232,165,152,0.35)",
    bgDark: "#150600",
    shapeType: "angular",
    motionType: "push-out",
    multiTouch: "repel",
    sizeBase: 50,
    label: "Frustrated",
  },
  lonely: {
    color: "#B8C8D8",
    glowColor: "rgba(184,200,216,0.3)",
    bgDark: "#060b12",
    shapeType: "dot",
    motionType: "drift-separate",
    multiTouch: "drift-separate",
    sizeBase: 30,
    label: "Lonely",
  },
  numb: {
    color: "#D0D0D0",
    glowColor: "rgba(208,208,208,0.2)",
    bgDark: "#080808",
    shapeType: "flat-disc",
    motionType: "still",
    multiTouch: "none",
    sizeBase: 52,
    label: "Numb",
  },
  grateful: {
    color: "#F9E4A0",
    glowColor: "rgba(249,228,160,0.4)",
    bgDark: "#120e00",
    shapeType: "soft-circle",
    motionType: "radiate",
    multiTouch: "blend",
    sizeBase: 54,
    label: "Grateful",
  },
  calm: {
    color: "#A8D8EA",
    glowColor: "rgba(168,216,234,0.35)",
    bgDark: "#020e14",
    shapeType: "fluid-blob",
    motionType: "wave",
    multiTouch: "blend",
    sizeBase: 56,
    label: "Calm",
  },
  hopeful: {
    color: "#A8D8B8",
    glowColor: "rgba(168,216,184,0.35)",
    bgDark: "#040e06",
    shapeType: "teardrop",
    motionType: "rise",
    multiTouch: "blend",
    sizeBase: 44,
    label: "Hopeful",
  },
  reflective: {
    color: "#B8C4D4",
    glowColor: "rgba(184,196,212,0.3)",
    bgDark: "#06080e",
    shapeType: "arc",
    motionType: "rotate",
    multiTouch: "none",
    sizeBase: 48,
    label: "Reflective",
  },
  custom: {
    color: "#C8C8D4",
    glowColor: "rgba(200,200,212,0.3)",
    bgDark: "#080808",
    shapeType: "blob",
    motionType: "float",
    multiTouch: "none",
    sizeBase: 46,
    label: "Custom",
  },
};

export function getEmotionShape(emotionType: string): EmotionShape {
  const key = emotionType.toLowerCase() as EmotionType;
  return EMOTION_SHAPES[key] ?? EMOTION_SHAPES.custom;
}
