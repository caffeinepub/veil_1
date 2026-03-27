// ─── Veil Emotional Compass — Data Layer ──────────────────────────────────────
// All emotion mappings, zone colors, narratives, and mock state for the
// Emotional Compass feature. This is a pure data module — no React.

export type CompassDirection =
  | "NORTH"
  | "SOUTH"
  | "EAST"
  | "WEST"
  | "NORTH_EAST"
  | "NORTH_WEST"
  | "SOUTH_EAST"
  | "SOUTH_WEST";

export type ReflectionDirection =
  | "DEEPENING"
  | "STEADY"
  | "QUIETER"
  | "BEGINNING";
export type ConnectionGivingDirection = "SHOWING_UP" | "QUIET_GIVING";
export type ConnectionReceivingDirection = "HELD" | "INDEPENDENT";
export type GrowthDirection = "MOVING" | "STEADY" | "RECOVERING" | "DEEPENING";
export type MeaningDirection = "FULL" | "SEARCHING" | "EXPRESSING" | "QUIET";

// ─── Zone Color Map ───────────────────────────────────────────────────────────

export const ZONE_COLORS: Record<string, string> = {
  NORTH: "#F9E4A0",
  SOUTH: "#C3B8D8",
  EAST: "#F4C28A",
  WEST: "#B8C4D4",
  NORTH_EAST: "#F4D494",
  NORTH_WEST: "#D4CCBC",
  SOUTH_EAST: "#D8B8A8",
  SOUTH_WEST: "#C4BCD0",
};

// ─── Needle Rotation Degrees ──────────────────────────────────────────────────

export const NEEDLE_ROTATION: Record<CompassDirection, number> = {
  NORTH: 0,
  NORTH_EAST: 45,
  EAST: 90,
  SOUTH_EAST: 135,
  SOUTH: 180,
  SOUTH_WEST: 225,
  WEST: 270,
  NORTH_WEST: 315,
};

// ─── Zone Label Map ───────────────────────────────────────────────────────────

export const ZONE_LABELS: Record<CompassDirection, string> = {
  NORTH: "Expansive",
  SOUTH: "Contracted",
  EAST: "Active",
  WEST: "Reflective",
  NORTH_EAST: "Expansive & Active",
  NORTH_WEST: "Expansive & Reflective",
  SOUTH_EAST: "Contracted & Active",
  SOUTH_WEST: "Contracted & Reflective",
};

// ─── Needle Narratives ────────────────────────────────────────────────────────
// Exact copy from spec — never modified.

export const NEEDLE_NARRATIVES: Record<CompassDirection, string> = {
  NORTH:
    "You have been living in an expansive place lately. Something is opening up.",
  SOUTH:
    "You have been in a contracted place. Carrying something inward. That has its own depth.",
  EAST: "You have been active — carrying a lot, moving fast, feeling the pressure of things in motion.",
  WEST: "You have been sitting with something. Not rushing to answers. That is its own wisdom.",
  NORTH_EAST:
    "Something full and energized is moving through you. Both expansive and active at the same time.",
  NORTH_WEST:
    "Something good has happened — and you are sitting with what it means. That is how joy deepens.",
  SOUTH_EAST:
    "Something heavy and something urgent — both present. That combination is a lot to carry.",
  SOUTH_WEST:
    "You have been going deeply inward. Sitting with something difficult — slowly and honestly. That takes courage.",
};

// ─── Reflection Dimension Narratives ─────────────────────────────────────────

export const REFLECTION_NARRATIVES: Record<ReflectionDirection, string> = {
  DEEPENING:
    "You have been going deeper with yourself lately. Writing more. Sitting longer with difficult questions.",
  STEADY:
    "You have been showing up for yourself consistently. Not dramatically — just reliably.",
  QUIETER:
    "You have been quieter with yourself lately. Sometimes life moves faster than reflection allows. That is natural.",
  BEGINNING:
    "You are beginning to sit with yourself. These are the earliest and most important pages of any honest self-understanding.",
};

// ─── Connection Dimension Narratives ─────────────────────────────────────────

export const CONNECTION_GIVING_NARRATIVES: Record<
  ConnectionGivingDirection,
  string
> = {
  SHOWING_UP:
    "You have been showing up for the people in your circle. That is what connection is made of.",
  QUIET_GIVING:
    "You have been quieter in your expressions lately. Not every season calls for reaching out.",
};

export const CONNECTION_RECEIVING_NARRATIVES: Record<
  ConnectionReceivingDirection,
  string
> = {
  HELD: "The people in your circle have been present for you. You have been held.",
  INDEPENDENT:
    "You have been carrying things mostly alone lately. That is sometimes a choice and sometimes a season. Your circle is here.",
};

// ─── Growth Dimension Narratives ─────────────────────────────────────────────

export const GROWTH_NARRATIVES: Record<GrowthDirection, string> = {
  MOVING:
    "Something has been shifting. The direction of your emotional life has been changing. That takes something.",
  STEADY:
    "You have been consistent. Holding something stable over time is its own kind of growth — harder than it looks.",
  RECOVERING:
    "You have been coming through something. The evidence of that is in the direction your compass has been slowly turning.",
  DEEPENING:
    "You have been going deeper rather than wider lately. That is where real growth happens.",
};

// ─── Meaning Dimension Narratives ────────────────────────────────────────────

export const MEANING_NARRATIVES: Record<MeaningDirection, string> = {
  FULL: "Your life has been full of meaning lately. Not in a dramatic sense — just in the sense that things have mattered. You have let them matter.",
  SEARCHING:
    "You have been looking for what this period means. The searching is part of the answer.",
  EXPRESSING:
    "You have been expressing what matters to you — through letters, through confessions, through the things you have finally said. That is meaning being made.",
  QUIET:
    "This has been a quieter period for meaning. Not every chapter announces itself. Some of the most meaningful chapters only reveal themselves in retrospect.",
};

// ─── Mock Compass State ───────────────────────────────────────────────────────

export interface CompassState {
  needleDirection: CompassDirection;
  daysOfData: number;
  reflectionDirection: ReflectionDirection;
  connectionGivingDirection: ConnectionGivingDirection;
  connectionReceivingDirection: ConnectionReceivingDirection;
  growthDirection: GrowthDirection;
  meaningDirection: MeaningDirection;
  hasJournalEntry: boolean;
  hasInnerCircleInteraction: boolean;
  hasTurningPoint: boolean;
}

export const mockCompassState: CompassState = {
  needleDirection: "SOUTH_WEST",
  daysOfData: 42,
  reflectionDirection: "DEEPENING",
  connectionGivingDirection: "QUIET_GIVING",
  connectionReceivingDirection: "HELD",
  growthDirection: "DEEPENING",
  meaningDirection: "SEARCHING",
  hasJournalEntry: true,
  hasInnerCircleInteraction: true,
  hasTurningPoint: true,
};

// ─── Mock Monthly History ─────────────────────────────────────────────────────

export interface MonthEntry {
  month: string;
  direction: CompassDirection;
}

export const mockMonthHistory: MonthEntry[] = [
  { month: "Apr", direction: "EAST" },
  { month: "May", direction: "SOUTH_EAST" },
  { month: "Jun", direction: "SOUTH" },
  { month: "Jul", direction: "SOUTH" },
  { month: "Aug", direction: "SOUTH_WEST" },
  { month: "Sep", direction: "SOUTH_WEST" },
  { month: "Oct", direction: "WEST" },
  { month: "Nov", direction: "NORTH_WEST" },
  { month: "Dec", direction: "NORTH" },
  { month: "Jan", direction: "NORTH" },
  { month: "Feb", direction: "NORTH_WEST" },
  { month: "Mar", direction: "SOUTH_WEST" }, // current
];
