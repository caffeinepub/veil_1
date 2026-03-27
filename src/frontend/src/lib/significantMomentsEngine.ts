// ─── Significant Moments Engine ─────────────────────────────────────────────
// Silent intelligence layer. Runs beneath all existing features.
// The user never sees this system — they only feel its warmth.

const STORAGE_KEY = "veil-significant-moments-v1";
const MILESTONE_SHOWN_KEY = "veil-milestone-shown";

// ─── Types ───────────────────────────────────────────────────────────────────

export type SignalType =
  | "SIGNAL_FIRST_COMPLETE_DUMP"
  | "SIGNAL_ARC_FULL_COMPLETION"
  | "SIGNAL_LETTER_SENT"
  | "SIGNAL_CONFESSION_WITNESS"
  | "SIGNAL_LONG_CARRY_BROKEN"
  | "SIGNAL_POSITIVE_PEAK"
  | "SIGNAL_FIRST_REFLECTION_WRITTEN"
  | "SIGNAL_DEEP_JOURNAL_SESSION"
  | "SIGNAL_TURNING_POINT_MARKED"
  | "SIGNAL_BREATH_FULL_SESSION"
  | "SIGNAL_FUTURE_LETTER_WRITTEN"
  | "SIGNAL_BECOMING_ACKNOWLEDGED"
  | "SIGNAL_FIRST_INNER_CIRCLE_SHARE"
  | "SIGNAL_CRISIS_RESOLVED";

export type SurfaceType =
  | "SIGNIFICANCE_WHISPER"
  | "MEMORY_MIRROR"
  | "RETURN_LETTER"
  | "BECOMING_MOMENT"
  | "MILESTONE_HOLD"
  | "PEAK_SEAL";

export interface StoredSignal {
  id: string;
  signalType: SignalType;
  rawEmotionType: string;
  rawEmotionIntensity: number;
  contextSnapshot: Record<string, unknown>;
  baseWeight: number;
  significanceScore: number;
  usedInSurface: boolean;
  surfaceTypeUsed: string | null;
  createdAt: number;
  eligibleForReturnAfter: number;
  returnedAt: number | null;
}

export interface ScheduledDelivery {
  id: string;
  signalId: string;
  surfaceType: SurfaceType;
  deliveryStatus: "SCHEDULED" | "DELIVERED" | "EXPIRED" | "DISMISSED";
  scheduledForSessionAfter: number;
  deliveredAt: number | null;
  dismissed: boolean;
  createdAt: number;
}

export interface SignificantMomentsState {
  signals: StoredSignal[];
  deliveries: ScheduledDelivery[];
  lastEngineRunAt: number;
  lastSurfaceDeliveredAt: number | null;
  sessionCount: number;
  settings: {
    enabled: boolean;
    whisperEnabled: boolean;
    memoryMirrorEnabled: boolean;
    returnLetterEnabled: boolean;
    becomingMomentEnabled: boolean;
    milestoneHoldEnabled: boolean;
    peakSealEnabled: boolean;
    frequency: "RARELY" | "OCCASIONALLY" | "OFTEN";
  };
  sessionSurfaceDeliveredThisSession: boolean;
}

// ─── Base weights ─────────────────────────────────────────────────────────────

const BASE_WEIGHTS: Record<SignalType, number> = {
  SIGNAL_FIRST_COMPLETE_DUMP: 0.9,
  SIGNAL_ARC_FULL_COMPLETION: 0.85,
  SIGNAL_LETTER_SENT: 0.8,
  SIGNAL_CONFESSION_WITNESS: 0.75,
  SIGNAL_LONG_CARRY_BROKEN: 0.85,
  SIGNAL_POSITIVE_PEAK: 0.75,
  SIGNAL_FIRST_REFLECTION_WRITTEN: 0.7,
  SIGNAL_DEEP_JOURNAL_SESSION: 0.68,
  SIGNAL_TURNING_POINT_MARKED: 0.85,
  SIGNAL_BREATH_FULL_SESSION: 0.65,
  SIGNAL_FUTURE_LETTER_WRITTEN: 0.8,
  SIGNAL_BECOMING_ACKNOWLEDGED: 0.9,
  SIGNAL_FIRST_INNER_CIRCLE_SHARE: 0.72,
  SIGNAL_CRISIS_RESOLVED: 0.95,
};

// ─── Default state ────────────────────────────────────────────────────────────

function defaultState(): SignificantMomentsState {
  return {
    signals: [],
    deliveries: [],
    lastEngineRunAt: 0,
    lastSurfaceDeliveredAt: null,
    sessionCount: 0,
    settings: {
      enabled: true,
      whisperEnabled: true,
      memoryMirrorEnabled: true,
      returnLetterEnabled: true,
      becomingMomentEnabled: true,
      milestoneHoldEnabled: true,
      peakSealEnabled: true,
      frequency: "OCCASIONALLY",
    },
    sessionSurfaceDeliveredThisSession: false,
  };
}

// ─── Persistence ─────────────────────────────────────────────────────────────

function loadState(): SignificantMomentsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initDemoState();
    const parsed = JSON.parse(raw) as SignificantMomentsState;
    // Merge with defaults for any missing fields
    return {
      ...defaultState(),
      ...parsed,
      settings: { ...defaultState().settings, ...parsed.settings },
    };
  } catch {
    return initDemoState();
  }
}

function saveState(state: SignificantMomentsState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ─── Demo state ───────────────────────────────────────────────────────────────
// Pre-populated so all 6 surface moments are visible in demo

function initDemoState(): SignificantMomentsState {
  const now = Date.now();
  const DAY = 86400000;

  const signals: StoredSignal[] = [
    {
      id: "demo-sig-1",
      signalType: "SIGNAL_FIRST_COMPLETE_DUMP",
      rawEmotionType: "stressed",
      rawEmotionIntensity: 7,
      contextSnapshot: { firstEver: true },
      baseWeight: 0.9,
      significanceScore: 0.92,
      usedInSurface: false,
      surfaceTypeUsed: null,
      createdAt: now - 8 * DAY,
      eligibleForReturnAfter: now - 1 * DAY, // 7 days elapsed
      returnedAt: null,
    },
    {
      id: "demo-sig-2",
      signalType: "SIGNAL_ARC_FULL_COMPLETION",
      rawEmotionType: "anxious",
      rawEmotionIntensity: 8,
      contextSnapshot: {
        phasesCompleted: 4,
        wellbeingDelta: 5,
        firstArc: false,
      },
      baseWeight: 0.85,
      significanceScore: 0.91,
      usedInSurface: false,
      surfaceTypeUsed: null,
      createdAt: now - 31 * DAY,
      eligibleForReturnAfter: now - 1 * DAY,
      returnedAt: null,
    },
    {
      id: "demo-sig-3",
      signalType: "SIGNAL_CRISIS_RESOLVED",
      rawEmotionType: "sad",
      rawEmotionIntensity: 9,
      contextSnapshot: { carryDays: 7, wellbeingPost: 7 },
      baseWeight: 0.95,
      significanceScore: 0.97,
      usedInSurface: false,
      surfaceTypeUsed: null,
      createdAt: now - 45 * DAY,
      eligibleForReturnAfter: now - 42 * DAY,
      returnedAt: null,
    },
    {
      id: "demo-sig-4",
      signalType: "SIGNAL_TURNING_POINT_MARKED",
      rawEmotionType: "hopeful",
      rawEmotionIntensity: 7,
      contextSnapshot: { date: new Date(now - 91 * DAY).toISOString() },
      baseWeight: 0.85,
      significanceScore: 0.88,
      usedInSurface: false,
      surfaceTypeUsed: null,
      createdAt: now - 91 * DAY,
      eligibleForReturnAfter: now - 61 * DAY,
      returnedAt: null,
    },
  ];

  const deliveries: ScheduledDelivery[] = [
    {
      id: "demo-del-1",
      signalId: "demo-sig-1",
      surfaceType: "SIGNIFICANCE_WHISPER",
      deliveryStatus: "SCHEDULED",
      scheduledForSessionAfter: now - 1 * DAY,
      deliveredAt: null,
      dismissed: false,
      createdAt: now - 7 * DAY,
    },
    {
      id: "demo-del-2",
      signalId: "demo-sig-2",
      surfaceType: "MEMORY_MIRROR",
      deliveryStatus: "SCHEDULED",
      scheduledForSessionAfter: now - 1 * DAY,
      deliveredAt: null,
      dismissed: false,
      createdAt: now - 30 * DAY,
    },
    {
      id: "demo-del-3",
      signalId: "demo-sig-3",
      surfaceType: "RETURN_LETTER",
      deliveryStatus: "SCHEDULED",
      scheduledForSessionAfter: now - 1 * DAY,
      deliveredAt: null,
      dismissed: false,
      createdAt: now - 44 * DAY,
    },
    {
      id: "demo-del-4",
      signalId: "demo-sig-4",
      surfaceType: "BECOMING_MOMENT",
      deliveryStatus: "SCHEDULED",
      scheduledForSessionAfter: now - 1 * DAY,
      deliveredAt: null,
      dismissed: false,
      createdAt: now - 90 * DAY,
    },
  ];

  const state: SignificantMomentsState = {
    ...defaultState(),
    signals,
    deliveries,
    sessionCount: 30, // demo: 30 sessions (triggers 30-day MILESTONE_HOLD)
    lastEngineRunAt: 0,
    lastSurfaceDeliveredAt: null,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

function scoreSignal(signal: StoredSignal, allSignals: StoredSignal[]): number {
  let score = signal.baseWeight;
  const ctx = signal.contextSnapshot;
  const now = new Date(signal.createdAt);
  const hour = now.getHours();
  const dow = now.getDay(); // 0 = Sunday

  // Time modifiers
  if (hour >= 21 && hour < 23) score += 0.06;
  if (dow === 0) score += 0.04;

  // Recency modifiers
  const sameTypeLast7 = allSignals.filter(
    (s) =>
      s.signalType === signal.signalType &&
      s.id !== signal.id &&
      Math.abs(s.createdAt - signal.createdAt) < 7 * 86400000,
  );
  if (sameTypeLast7.length > 0) score -= 0.1;

  const isHighestIntensity =
    signal.rawEmotionIntensity >=
    Math.max(...allSignals.map((s) => s.rawEmotionIntensity), 0);
  if (isHighestIntensity) score += 0.05;

  // Relationship modifiers
  if (ctx.innerCircle) score += 0.08;
  if (ctx.shiftingPositive) score += 0.12;

  // Signal-specific modifiers
  if (signal.signalType === "SIGNAL_ARC_FULL_COMPLETION") {
    if ((signal.rawEmotionIntensity ?? 0) >= 8) score += 0.1;
    if ((ctx.wellbeingDelta as number) >= 4) score += 0.08;
    if (ctx.firstArc) score += 0.05;
  }
  if (signal.signalType === "SIGNAL_LETTER_SENT") {
    if (ctx.firstLetter) score += 0.15;
    if (ctx.innerCircle) score += 0.1;
    if ((ctx.heldDays as number) >= 7) score += 0.08;
  }
  if (signal.signalType === "SIGNAL_LONG_CARRY_BROKEN") {
    if ((ctx.carryDays as number) >= 10) score += 0.12;
    if (ctx.newEmotionPositive) score += 0.08;
  }
  if (signal.signalType === "SIGNAL_POSITIVE_PEAK") {
    if (ctx.lifeMilestone) score += 0.15;
    const difficultLast30 = allSignals.filter(
      (s) =>
        s.createdAt >= signal.createdAt - 30 * 86400000 &&
        ["stressed", "sad", "anxious", "frustrated", "lonely", "numb"].includes(
          s.rawEmotionType,
        ),
    ).length;
    if (difficultLast30 >= 5) score += 0.1;
  }

  return Math.min(1.0, score);
}

function eligibleReturnAfter(signal: StoredSignal): number {
  const base = signal.createdAt;
  if (signal.signalType === "SIGNAL_FIRST_COMPLETE_DUMP")
    return base + 7 * 86400000;
  if (signal.signalType === "SIGNAL_LETTER_SENT") return base + 3 * 86400000;
  return base + 30 * 86400000;
}

// ─── Delivery routing ─────────────────────────────────────────────────────────

function routeSignalToDeliveries(
  signal: StoredSignal,
  now: number,
): ScheduledDelivery[] {
  const deliveries: ScheduledDelivery[] = [];
  const makeDelivery = (
    surfaceType: SurfaceType,
    delayMs: number,
  ): ScheduledDelivery => ({
    id: `del-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    signalId: signal.id,
    surfaceType,
    deliveryStatus: "SCHEDULED",
    scheduledForSessionAfter: now + delayMs,
    deliveredAt: null,
    dismissed: false,
    createdAt: now,
  });

  const DAY = 86400000;

  switch (signal.signalType) {
    case "SIGNAL_FIRST_COMPLETE_DUMP":
      deliveries.push(makeDelivery("SIGNIFICANCE_WHISPER", 7 * DAY));
      break;
    case "SIGNAL_ARC_FULL_COMPLETION":
      deliveries.push(makeDelivery("PEAK_SEAL", 0));
      deliveries.push(makeDelivery("MEMORY_MIRROR", 30 * DAY));
      break;
    case "SIGNAL_LETTER_SENT":
      deliveries.push(makeDelivery("SIGNIFICANCE_WHISPER", 3 * DAY));
      break;
    case "SIGNAL_LONG_CARRY_BROKEN":
      deliveries.push(makeDelivery("RETURN_LETTER", 0));
      break;
    case "SIGNAL_POSITIVE_PEAK":
      deliveries.push(makeDelivery("MEMORY_MIRROR", 90 * DAY));
      break;
    case "SIGNAL_TURNING_POINT_MARKED":
      deliveries.push(makeDelivery("BECOMING_MOMENT", 90 * DAY));
      deliveries.push(makeDelivery("MEMORY_MIRROR", 365 * DAY));
      break;
    case "SIGNAL_CRISIS_RESOLVED":
      deliveries.push(makeDelivery("RETURN_LETTER", 0));
      deliveries.push(makeDelivery("BECOMING_MOMENT", 90 * DAY));
      break;
    case "SIGNAL_BECOMING_ACKNOWLEDGED":
      deliveries.push(makeDelivery("MILESTONE_HOLD", 0));
      break;
  }

  return deliveries;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function collectSignal(
  signalType: SignalType,
  emotionType: string,
  emotionIntensity: number,
  contextSnapshot: Record<string, unknown>,
): void {
  const state = loadState();
  const now = Date.now();

  // Check for duplicate signal of same type in last 7 days
  const recentSame = state.signals.filter(
    (s) => s.signalType === signalType && now - s.createdAt < 7 * 86400000,
  );
  // Still record it but score will be lower

  const signal: StoredSignal = {
    id: `sig-${now}-${Math.random().toString(36).slice(2)}`,
    signalType,
    rawEmotionType: emotionType,
    rawEmotionIntensity: emotionIntensity,
    contextSnapshot,
    baseWeight: BASE_WEIGHTS[signalType] ?? 0.65,
    significanceScore: 0,
    usedInSurface: false,
    surfaceTypeUsed: null,
    createdAt: now,
    eligibleForReturnAfter: 0,
    returnedAt: null,
  };

  // Score immediately
  const allSignals = [...state.signals, signal];
  signal.significanceScore = scoreSignal(signal, allSignals);
  signal.eligibleForReturnAfter = eligibleReturnAfter(signal);

  state.signals.push(signal);

  // Route to deliveries if eligible
  if (signal.significanceScore >= 0.65) {
    const newDeliveries = routeSignalToDeliveries(signal, now);
    state.deliveries.push(...newDeliveries);
    signal.usedInSurface = true;
    signal.surfaceTypeUsed = newDeliveries[0]?.surfaceType ?? null;
  }

  // Suppress duplicate same-signal deliveries
  if (recentSame.length > 0 && signalType !== "SIGNAL_ARC_FULL_COMPLETION") {
    // Don't re-add deliveries if recently fired
    state.deliveries = state.deliveries.filter(
      (d) => d.signalId !== signal.id || signal.significanceScore >= 0.65,
    );
  }

  saveState(state);
}

export function runSignificanceEngine(currentState: {
  carryingDays: number;
  emotionType: string;
  sessionNumber: number;
  isInCrisis: boolean;
}): void {
  const state = loadState();
  state.sessionCount = Math.max(state.sessionCount, currentState.sessionNumber);
  state.lastEngineRunAt = Date.now();
  state.sessionSurfaceDeliveredThisSession = false; // Reset per session

  // Score any unscored signals
  for (const signal of state.signals) {
    if (signal.significanceScore === 0) {
      signal.significanceScore = scoreSignal(signal, state.signals);
      signal.eligibleForReturnAfter = eligibleReturnAfter(signal);
    }
  }

  // Expire old deliveries
  const now = Date.now();
  for (const delivery of state.deliveries) {
    if (
      delivery.deliveryStatus === "SCHEDULED" &&
      now - delivery.scheduledForSessionAfter > 90 * 86400000
    ) {
      delivery.deliveryStatus = "EXPIRED";
    }
  }

  saveState(state);
}

export function getPendingDelivery(currentState: {
  carryingDays?: number;
  isInCrisis?: boolean;
  surfaceTypeFilter?: SurfaceType;
}): { delivery: ScheduledDelivery; signal: StoredSignal } | null {
  const state = loadState();
  const { settings } = state;
  if (!settings.enabled) return null;

  // CONSTRAINT 5: max 1 per session
  if (state.sessionSurfaceDeliveredThisSession) return null;

  const now = Date.now();
  const GAP_14_DAYS = 14 * 86400000;
  const carryingDays = currentState.carryingDays ?? 0;
  const isInCrisis = currentState.isInCrisis ?? false;

  // CONSTRAINT 1: 14-day gap
  const gapOk =
    !state.lastSurfaceDeliveredAt ||
    now - state.lastSurfaceDeliveredAt > GAP_14_DAYS;

  const eligible = state.deliveries.filter((d) => {
    if (d.deliveryStatus !== "SCHEDULED") return false;
    if (d.dismissed) return false;
    if (d.scheduledForSessionAfter > now) return false;

    // CONSTRAINT 2: During crisis (carryingDays >= 5), only RETURN_LETTER
    if (isInCrisis && d.surfaceType !== "RETURN_LETTER") return false;
    if (carryingDays >= 5 && d.surfaceType !== "RETURN_LETTER") return false;

    // PEAK_SEAL bypasses gap constraint
    if (d.surfaceType === "PEAK_SEAL") return settings.peakSealEnabled;

    if (!gapOk) return false;

    // Filter by surface type if specified
    if (
      currentState.surfaceTypeFilter &&
      d.surfaceType !== currentState.surfaceTypeFilter
    )
      return false;

    // Per-surface settings check
    if (d.surfaceType === "SIGNIFICANCE_WHISPER" && !settings.whisperEnabled)
      return false;
    if (d.surfaceType === "MEMORY_MIRROR" && !settings.memoryMirrorEnabled)
      return false;
    if (d.surfaceType === "RETURN_LETTER" && !settings.returnLetterEnabled)
      return false;
    if (d.surfaceType === "BECOMING_MOMENT" && !settings.becomingMomentEnabled)
      return false;
    if (d.surfaceType === "MILESTONE_HOLD" && !settings.milestoneHoldEnabled)
      return false;

    return true;
  });

  if (eligible.length === 0) return null;

  // Priority: highest significance_score signal
  const withSignals = eligible
    .map((d) => ({
      delivery: d,
      signal: state.signals.find((s) => s.id === d.signalId),
    }))
    .filter(
      (x): x is { delivery: ScheduledDelivery; signal: StoredSignal } =>
        x.signal !== undefined,
    );

  if (withSignals.length === 0) return null;

  // CRISIS_RESOLVED gets priority for RETURN_LETTER
  const crisisReturn = withSignals.find(
    (x) =>
      x.signal.signalType === "SIGNAL_CRISIS_RESOLVED" &&
      x.delivery.surfaceType === "RETURN_LETTER",
  );
  if (crisisReturn) return crisisReturn;

  withSignals.sort(
    (a, b) => b.signal.significanceScore - a.signal.significanceScore,
  );
  return withSignals[0] ?? null;
}

export function markDelivered(deliveryId: string): void {
  const state = loadState();
  const delivery = state.deliveries.find((d) => d.id === deliveryId);
  if (delivery) {
    delivery.deliveryStatus = "DELIVERED";
    delivery.deliveredAt = Date.now();
    state.lastSurfaceDeliveredAt = Date.now();
    state.sessionSurfaceDeliveredThisSession = true;

    // Mark corresponding signal as returned
    const signal = state.signals.find((s) => s.id === delivery.signalId);
    if (signal) signal.returnedAt = Date.now();
  }
  saveState(state);
}

export function markDismissed(deliveryId: string): void {
  const state = loadState();
  const delivery = state.deliveries.find((d) => d.id === deliveryId);
  if (delivery) {
    delivery.deliveryStatus = "DISMISSED";
    delivery.dismissed = true;
    state.sessionSurfaceDeliveredThisSession = true;
  }
  saveState(state);
}

export function getState(): SignificantMomentsState {
  return loadState();
}

export function getSettings(): SignificantMomentsState["settings"] {
  return loadState().settings;
}

export function saveSettings(
  settings: Partial<SignificantMomentsState["settings"]>,
): void {
  const state = loadState();
  state.settings = { ...state.settings, ...settings };
  saveState(state);
}

export function getSignalList(): Array<{
  date: Date;
  humanLabel: string;
  reflected: boolean;
}> {
  const state = loadState();
  return state.signals
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((s) => ({
      date: new Date(s.createdAt),
      humanLabel: getHumanLabel(s),
      reflected: s.returnedAt !== null,
    }));
}

function getHumanLabel(signal: StoredSignal): string {
  const ctx = signal.contextSnapshot;
  switch (signal.signalType) {
    case "SIGNAL_ARC_FULL_COMPLETION":
      return "You completed all four phases.";
    case "SIGNAL_LETTER_SENT":
      return "You sent a letter.";
    case "SIGNAL_LONG_CARRY_BROKEN": {
      const days = (ctx.carryDays as number) ?? 5;
      return `You carried something for ${days} days, and then put it down.`;
    }
    case "SIGNAL_FIRST_COMPLETE_DUMP":
      return "You put something down here for the first time.";
    case "SIGNAL_CRISIS_RESOLVED":
      return "You came through something difficult.";
    case "SIGNAL_TURNING_POINT_MARKED":
      return "You marked something as a turning point.";
    case "SIGNAL_POSITIVE_PEAK":
      return "You captured something worth holding.";
    case "SIGNAL_FIRST_REFLECTION_WRITTEN":
      return "You wrote your first reflection.";
    case "SIGNAL_DEEP_JOURNAL_SESSION":
      return "You wrote something deeply in your journal.";
    case "SIGNAL_BECOMING_ACKNOWLEDGED":
      return "You affirmed your becoming.";
    case "SIGNAL_FUTURE_LETTER_WRITTEN":
      return "You wrote a letter to your future self.";
    case "SIGNAL_FIRST_INNER_CIRCLE_SHARE":
      return "You let someone in for the first time.";
    default:
      return "You showed up.";
  }
}

export function getMilestoneShown(): Record<number, boolean> {
  try {
    return JSON.parse(localStorage.getItem(MILESTONE_SHOWN_KEY) || "{}");
  } catch {
    return {};
  }
}

export function markMilestoneShown(milestone: number): void {
  const shown = getMilestoneShown();
  shown[milestone] = true;
  localStorage.setItem(MILESTONE_SHOWN_KEY, JSON.stringify(shown));
}

export function incrementSessionCount(): void {
  const state = loadState();
  state.sessionCount += 1;
  saveState(state);
}
