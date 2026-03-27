// ─── Reflections Engine ──────────────────────────────────────────────────────
// Reads localStorage data from all Veil modules and provides the intelligence
// layer for the Reflections tab: prompt generation, compass, mirror, themes.

export type CompassDirection =
  | "NORTH"
  | "SOUTH"
  | "EAST"
  | "WEST"
  | "NORTH_EAST"
  | "NORTH_WEST"
  | "SOUTH_EAST"
  | "SOUTH_WEST";

export interface StoredReflection {
  id: string;
  prompt: string;
  promptType: string;
  response: string;
  followUpQuestion?: string;
  followUpResponse?: string;
  emotionType?: string;
  timestamp: number;
  season: string;
}

export interface ActivePrompt {
  text: string;
  type: string;
  priority: number;
  sourceContext?: string;
  sourceEventType?: string;
}

export interface CompassState {
  direction: CompassDirection;
  narrative: string;
  monthlyHistory: Array<{ month: string; direction: CompassDirection }>;
}

export interface ConnectionObservation {
  personLabel: string;
  observation: string;
  reflectionPrompt: string;
  source: string;
}

export interface Theme {
  title: string;
  description: string;
  count: number;
}

export interface EmotionEvent {
  type: string;
  emotionType: string;
  emotionCategory: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  weight: "PROFOUND" | "HIGH" | "MEDIUM" | "LIGHT";
  timestamp: number;
  contentPreview?: string;
}

export interface ReflectionsSettings {
  promptFrequency: "daily" | "every-few-days" | "weekly";
  seasonalPrompts: boolean;
  anniversaryPrompts: boolean;
  showCompass: boolean;
  showPeople: boolean;
  monthlyNarrative: boolean;
  quarterlyNarrative: boolean;
  annualNarrative: boolean;
  thematicClustering: boolean;
  lastDismissed?: number;
  firstReflectionDone?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeParseJSON(raw: string | null): any {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ─── Event collection ─────────────────────────────────────────────────────────

export function getRecentEvents(days: number): EmotionEvent[] {
  const events: EmotionEvent[] = [];
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const raw = localStorage.getItem(key);
      const parsed = safeParseJSON(raw);
      if (!parsed) continue;

      const ts = parsed.createdAt ?? parsed.timestamp ?? parsed.startedAt ?? 0;
      if (ts < cutoff) continue;

      if (key.startsWith("veil-captured-joy-")) {
        events.push({
          type: "CAPTURED_JOY",
          emotionType: parsed.emotionType ?? "hopeful",
          emotionCategory: "POSITIVE",
          weight: "HIGH",
          timestamp: ts,
          contentPreview: parsed.description?.slice(0, 80),
        });
      } else if (key.startsWith("veil-ei-session-")) {
        events.push({
          type: "TRANSFORMATION_ARC",
          emotionType: parsed.emotionType ?? "stressed",
          emotionCategory: "NEGATIVE",
          weight: parsed.phase >= 4 ? "PROFOUND" : "HIGH",
          timestamp: ts,
        });
      } else if (key.startsWith("veil-arc-")) {
        events.push({
          type: "EMOTION_ARC",
          emotionType: parsed.emotionType ?? "stressed",
          emotionCategory: "NEGATIVE",
          weight: "MEDIUM",
          timestamp: ts,
        });
      } else if (key.startsWith("veil-journal-")) {
        const emotionType = parsed.emotionType ?? "reflective";
        const isVoice = parsed.pageType === "VOICE_JOURNAL";
        const isTucked = parsed.pageType === "TUCKED_LETTER";
        const isDedication = parsed.pageType === "DEDICATION";
        const isTurningPoint = parsed.isTurningPoint;
        events.push({
          type: isDedication
            ? "DEDICATION"
            : isTucked
              ? "TUCKED_LETTER"
              : isTurningPoint
                ? "TURNING_POINT"
                : isVoice
                  ? "VOICE_JOURNAL"
                  : "JOURNAL_ENTRY",
          emotionType,
          emotionCategory: ["grateful", "hopeful", "calm", "elated"].includes(
            emotionType,
          )
            ? "POSITIVE"
            : "NEGATIVE",
          weight:
            isDedication || isTucked || isTurningPoint
              ? "PROFOUND"
              : isVoice
                ? "HIGH"
                : "MEDIUM",
          timestamp: ts,
          contentPreview: parsed.content?.slice(0, 80),
        });
      } else if (key.startsWith("veil-checkin-")) {
        const emotionType = parsed.emotion?.key ?? "reflective";
        events.push({
          type: "CHECKIN",
          emotionType,
          emotionCategory: ["grateful", "hopeful", "calm", "happy"].includes(
            emotionType,
          )
            ? "POSITIVE"
            : "NEGATIVE",
          weight: parsed.text ? "MEDIUM" : "LIGHT",
          timestamp: ts,
        });
      } else if (key.startsWith("veil-confession-")) {
        events.push({
          type: "CONFESSION",
          emotionType: parsed.emotionType ?? "reflective",
          emotionCategory: "NEUTRAL",
          weight: "PROFOUND",
          timestamp: ts,
        });
      } else if (key.startsWith("veil-love-letter-")) {
        events.push({
          type: "LOVE_LETTER",
          emotionType: "grateful",
          emotionCategory: "POSITIVE",
          weight: "HIGH",
          timestamp: ts,
          contentPreview: parsed.recipient,
        });
      } else if (key.startsWith("veil-apology-")) {
        events.push({
          type: "APOLOGY",
          emotionType: parsed.emotionType ?? "reflective",
          emotionCategory: "NEUTRAL",
          weight: "HIGH",
          timestamp: ts,
        });
      }
    }
  } catch {
    // ignore
  }

  return events.sort((a, b) => b.timestamp - a.timestamp);
}

// ─── Prompt generation ────────────────────────────────────────────────────────

const DEFAULT_PROMPTS = [
  "What emotion have you been carrying that you haven't named yet?",
  "What is one thing you know about yourself today that you didn't know a year ago?",
  "What has been the hardest thing to admit to yourself lately?",
  "What are you grateful for that you rarely say out loud?",
  "What would you do with your life if you trusted yourself more completely?",
  "What feeling have you been avoiding sitting with?",
  "What does your best self look like right now?",
  "What is the kindest thing you could do for yourself today?",
];

const PROFOUND_PROMPTS: Record<string, string> = {
  CONFESSION:
    "You said something you had been carrying alone. What does it feel like to have said it?",
  TURNING_POINT:
    "You recognized a moment that changed things. What changed in you because of it?",
  TUCKED_LETTER:
    "You wrote something for a specific moment that hasn't arrived yet. What are you hoping that person finds when they read it?",
  TRANSFORMATION_ARC:
    "In a difficult moment — you found one true thing about yourself. Looking at it now — does it still feel true?",
  DEDICATION:
    "You dedicated your Journal to someone or something. What does that dedication reveal about what matters most to you?",
  VOLUME_CLOSED:
    "You named a chapter of your life and closed it. What would you say to the person who lived that chapter?",
};

function getSeasonalPrompt(): string | null {
  const now = new Date();
  const month = now.getMonth();
  const day = now.getDate();
  const near = day >= 15 && day <= 28;
  if (!near) return null;

  const prompts: Record<number, string> = {
    2: "A new season is beginning.\n\nWhat do you most want to grow in the months ahead?",
    4: "Spring is ending.\n\nWhat grew in you during it?",
    5: "A new season is beginning.\n\nWhat do you want to feel more of in the months ahead?",
    7: "Summer is fading.\n\nWhat from it do you want to carry into the quieter months?",
    8: "Something in the air is changing.\n\nWhat are you ready to let go of?",
    10: "The year is getting quieter.\n\nWhat did this year ask of you?",
    11: "Winter is a time for going inward.\n\nWhat do you find when you go there?",
    1: "Something is about to wake up.\n\nWhat in you is ready to wake up with it?",
  };
  return prompts[month] ?? null;
}

export function generateActivePrompt(
  savedReflections: StoredReflection[],
): ActivePrompt {
  const now = Date.now();

  // Priority 1: PROFOUND events in last 72h
  const events72h = getRecentEvents(3);
  const profoundEvent = events72h.find((e) => e.weight === "PROFOUND");
  if (profoundEvent && PROFOUND_PROMPTS[profoundEvent.type]) {
    return {
      text: PROFOUND_PROMPTS[profoundEvent.type],
      type: "PROFOUND_EVENT",
      priority: 1,
      sourceEventType: profoundEvent.type,
      sourceContext: "Inspired by something you wrote recently.",
    };
  }

  // Priority 2: pattern detection — same emotion 3+ times in 7 days
  const weekEvents = getRecentEvents(7);
  const emotionCounts: Record<string, number> = {};
  for (const e of weekEvents) {
    emotionCounts[e.emotionType] = (emotionCounts[e.emotionType] ?? 0) + 1;
  }
  for (const [emotion, count] of Object.entries(emotionCounts)) {
    if (count >= 3) {
      const isRecovery = ["hopeful", "calm", "grateful"].includes(emotion);
      if (isRecovery) {
        return {
          text: "Something shifted recently. You were carrying something heavy — and then it lightened. What helped it change?",
          type: "PATTERN_DETECTION",
          priority: 2,
          sourceContext: "Veil noticed a pattern in how you've been feeling.",
        };
      }
      if (emotion === "stressed" && count >= 5) {
        return {
          text: "You've been carrying this for a while now. What is underneath the stress — what is it actually about?",
          type: "PATTERN_DETECTION",
          priority: 2,
          sourceContext: "Veil noticed a pattern in how you've been feeling.",
        };
      }
      if (emotion === "stressed") {
        return {
          text: "Stress has appeared several times this week. If this feeling had a voice — what would it be trying to tell you?",
          type: "PATTERN_DETECTION",
          priority: 2,
          sourceContext: "Veil noticed a pattern in how you've been feeling.",
        };
      }
      if (emotion === "lonely") {
        return {
          text: "Loneliness has visited you more than once lately. What does it feel like you are missing?",
          type: "PATTERN_DETECTION",
          priority: 2,
          sourceContext: "Veil noticed a pattern in how you've been feeling.",
        };
      }
    }
  }

  // Priority 3: Write tab events in last 48h
  const recentWrite = getRecentEvents(2).filter((e) =>
    ["CONFESSION", "LOVE_LETTER", "APOLOGY", "JOURNAL_ENTRY"].includes(e.type),
  );
  if (recentWrite.length > 0) {
    const ev = recentWrite[0];
    const prompts: Record<string, string> = {
      APOLOGY:
        "You said something that took courage. What did it feel like to finally say it?",
      LOVE_LETTER:
        "You put into words what you feel for someone. What did writing it reveal that you didn't know before?",
      CONFESSION:
        "You said something to the universe. What are you carrying differently now?",
      JOURNAL_ENTRY:
        "You wrote something down. Sometimes the act of writing tells us what we already know. What surprised you in what you wrote?",
    };
    const prompt = prompts[ev.type];
    if (prompt) {
      return {
        text: prompt,
        type: "WRITE_TAB_EVENT",
        priority: 3,
        sourceEventType: ev.type,
        sourceContext: "Inspired by something you wrote recently.",
      };
    }
  }

  // Priority 4: Trajectory
  const last7 = getRecentEvents(7);
  const prior7 = getRecentEvents(14).filter(
    (e) => now - e.timestamp > 7 * 24 * 60 * 60 * 1000,
  );
  const posRecent = last7.filter(
    (e) => e.emotionCategory === "POSITIVE",
  ).length;
  const posOlder = prior7.filter(
    (e) => e.emotionCategory === "POSITIVE",
  ).length;
  const negRecent = last7.filter(
    (e) => e.emotionCategory === "NEGATIVE",
  ).length;
  const negOlder = prior7.filter(
    (e) => e.emotionCategory === "NEGATIVE",
  ).length;
  if (last7.length >= 3 && prior7.length >= 3) {
    if (posRecent > posOlder + 1) {
      return {
        text: "Something seems to be getting lighter. What do you think is shifting?",
        type: "TRAJECTORY",
        priority: 4,
      };
    }
    if (negRecent > negOlder + 1) {
      return {
        text: "Things seem heavier than they were. What do you most need right now?",
        type: "TRAJECTORY",
        priority: 4,
      };
    }
  }

  // Priority 5: No reflection in 7+ days
  const lastReflection =
    savedReflections.length > 0
      ? Math.max(...savedReflections.map((r) => r.timestamp))
      : 0;
  if (
    savedReflections.length > 0 &&
    now - lastReflection > 7 * 24 * 60 * 60 * 1000
  ) {
    return {
      text: "You haven't sat with yourself in a while. No particular reason — just: how are you? Really.",
      type: "TIME_GAP",
      priority: 5,
    };
  }

  // Priority 6: Seasonal
  const seasonal = getSeasonalPrompt();
  if (seasonal) {
    return { text: seasonal, type: "SEASONAL", priority: 6 };
  }

  // Priority 7: Anniversary
  const yearAgo = now - 365 * 24 * 60 * 60 * 1000;
  const yearWindow = 7 * 24 * 60 * 60 * 1000;
  const allEvents = getRecentEvents(400);
  const anniversaryEvent = allEvents.find(
    (e) =>
      e.weight === "PROFOUND" && Math.abs(e.timestamp - yearAgo) < yearWindow,
  );
  if (anniversaryEvent) {
    const ap: Record<string, string> = {
      TURNING_POINT:
        "A year ago you marked a moment that changed things. Reading it now — what do you see that you couldn't see then?",
      CONFESSION:
        "A year ago you said something you had been carrying alone. What are you carrying differently now?",
    };
    const aPrompt = ap[anniversaryEvent.type];
    if (aPrompt) {
      return { text: aPrompt, type: "ANNIVERSARY", priority: 7 };
    }
  }

  // Priority 8: Default rotating
  const idx =
    Math.floor(Date.now() / (24 * 60 * 60 * 1000)) % DEFAULT_PROMPTS.length;
  return { text: DEFAULT_PROMPTS[idx], type: "DEFAULT", priority: 8 };
}

// ─── Compass ──────────────────────────────────────────────────────────────────

const NORTH_EMOTIONS = new Set([
  "hopeful",
  "grateful",
  "calm",
  "elated",
  "loved",
  "happy",
  "joyful",
]);
const SOUTH_EMOTIONS = new Set([
  "sad",
  "lonely",
  "numb",
  "hurt",
  "broken",
  "depressed",
]);
const EAST_EMOTIONS = new Set([
  "stressed",
  "frustrated",
  "anxious",
  "overwhelmed",
  "excited",
  "angry",
  "rushed",
]);
const WEST_EMOTIONS = new Set([
  "thoughtful",
  "reflective",
  "processing",
  "uncertain",
  "introspective",
  "searching",
  "tired",
]);

function emotionToZone(emotion: string): "N" | "S" | "E" | "W" | null {
  const e = emotion.toLowerCase();
  if (NORTH_EMOTIONS.has(e)) return "N";
  if (SOUTH_EMOTIONS.has(e)) return "S";
  if (EAST_EMOTIONS.has(e)) return "E";
  if (WEST_EMOTIONS.has(e)) return "W";
  return "W";
}

function zonesToDirection(counts: Record<string, number>): CompassDirection {
  const n = counts.N ?? 0;
  const s = counts.S ?? 0;
  const e = counts.E ?? 0;
  const w = counts.W ?? 0;
  const max = Math.max(n, s, e, w);
  if (max === 0) return "WEST";

  const top = ["N", "S", "E", "W"].filter((z) => (counts[z] ?? 0) === max);
  if (top.length === 1) {
    const dir: Record<string, CompassDirection> = {
      N: "NORTH",
      S: "SOUTH",
      E: "EAST",
      W: "WEST",
    };
    return dir[top[0]];
  }
  const has = (z: string) => top.includes(z);
  if (has("N") && has("E")) return "NORTH_EAST";
  if (has("N") && has("W")) return "NORTH_WEST";
  if (has("S") && has("E")) return "SOUTH_EAST";
  if (has("S") && has("W")) return "SOUTH_WEST";
  return "NORTH";
}

export function computeCompassDirection(
  events: EmotionEvent[],
): CompassDirection {
  const counts: Record<string, number> = {};
  for (const ev of events) {
    const zone = emotionToZone(ev.emotionType);
    if (zone) counts[zone] = (counts[zone] ?? 0) + 1;
  }
  return zonesToDirection(counts);
}

export function getCompassNarrative(direction: CompassDirection): string {
  const narratives: Record<CompassDirection, string> = {
    NORTH:
      "You have been living in an expansive place lately. Something is opening up.",
    SOUTH:
      "You have been in a contracted place. Carrying something inward. That has its own kind of depth.",
    EAST: "You have been active — carrying a lot, processing a lot, pushing through a lot. That takes energy.",
    WEST: "You have been reflective. Sitting with things. Not rushing to answers. That is its own wisdom.",
    NORTH_EAST:
      "You have been full — carrying something energized and something grateful at the same time. That is a complex place.",
    NORTH_WEST:
      "You have been expanding inward — something hopeful is growing quietly inside you.",
    SOUTH_EAST:
      "Something heavy and something urgent — both present. That combination is exhausting to carry.",
    SOUTH_WEST:
      "You have been retreating inward. Something is being processed slowly. Give it time.",
  };
  return narratives[direction];
}

export function buildCompassState(): CompassState {
  const allEvents = getRecentEvents(365);
  const events30 = allEvents.filter(
    (e) => Date.now() - e.timestamp < 30 * 24 * 60 * 60 * 1000,
  );
  const direction = computeCompassDirection(events30);
  const narrative = getCompassNarrative(direction);

  const now = new Date();
  const monthlyHistory: Array<{ month: string; direction: CompassDirection }> =
    [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStart = d.getTime();
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
    const mEvents = allEvents.filter(
      (e) => e.timestamp >= monthStart && e.timestamp < monthEnd,
    );
    const label = d.toLocaleString("default", {
      month: "short",
      year: "2-digit",
    });
    monthlyHistory.push({
      month: label,
      direction: mEvents.length > 0 ? computeCompassDirection(mEvents) : "WEST",
    });
  }

  return { direction, narrative, monthlyHistory };
}

// ─── Connection Mirror ────────────────────────────────────────────────────────

export function buildConnectionMirror(): ConnectionObservation[] {
  const observations: ConnectionObservation[] = [];
  const seen = new Set<string>();

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const raw = localStorage.getItem(key);
      const parsed = safeParseJSON(raw);
      if (!parsed) continue;

      if (key.startsWith("veil-love-letter-") && parsed.recipient) {
        const label = parsed.recipient as string;
        if (!seen.has(label)) {
          seen.add(label);
          observations.push({
            personLabel: label,
            observation: `You wrote ${label} something beautiful this year.`,
            reflectionPrompt: `What does ${label} bring to your life that no one else does?`,
            source: "LOVE_LETTER",
          });
        }
      }

      if (
        key.startsWith("veil-journal-") &&
        Array.isArray(parsed.personLabels)
      ) {
        for (const label of parsed.personLabels as string[]) {
          if (!seen.has(label)) {
            seen.add(label);
            observations.push({
              personLabel: label,
              observation: `${label} appears in your Journal — present in moments that mattered.`,
              reflectionPrompt: `What has your relationship with ${label} taught you about yourself?`,
              source: "JOURNAL_TAG",
            });
          }
        }
      }

      if (
        key.startsWith("veil-apology-") &&
        parsed.recipient &&
        !parsed.isSent
      ) {
        const label = parsed.recipient as string;
        if (!seen.has(label)) {
          seen.add(label);
          observations.push({
            personLabel: label,
            observation: `You wrote ${label} an apology you haven't sent yet.`,
            reflectionPrompt: `What would it mean to ${label} to receive what you wrote?`,
            source: "APOLOGY",
          });
        }
      }
    }
  } catch {
    // ignore
  }

  return observations;
}

// ─── Growth Narrative ─────────────────────────────────────────────────────────

export function generateGrowthNarrative(
  reflections: StoredReflection[],
  type: "monthly" | "quarterly" | "annual",
): string {
  if (reflections.length === 0) return "";

  const sorted = [...reflections].sort((a, b) => a.timestamp - b.timestamp);
  const first = sorted[0];
  const promptTypes = reflections.map((r) => r.promptType);
  const hasProfound = promptTypes.includes("PROFOUND_EVENT");
  const hasPattern = promptTypes.includes("PATTERN_DETECTION");

  if (type === "annual" && reflections.length >= 10) {
    return `A year of pages. A year of prompts. A year of honest answers.

When you first came here — you were asking questions about what you were feeling.

Now you are asking questions about what you want.

That is a long way to travel.

You traveled it one page at a time. One reflection at a time. One honest answer at a time.

That is who you are now. Someone who knows themselves a little better than before.`;
  }

  if (type === "quarterly" && reflections.length >= 5) {
    return `Three months of honest sitting.

${hasProfound ? "You looked at something real — something that took courage to name." : "You showed up, even on the days it was hard."}

${hasPattern ? "You noticed patterns in yourself. That is how understanding begins." : "The questions you are asking are deeper now than when you started."}

The needle on your compass has been slowly turning. You might not feel the change yet.

Veil sees it.`;
  }

  const firstPromptSnippet = first.prompt.slice(0, 60);
  const lastPromptSnippet = sorted[sorted.length - 1].prompt.slice(0, 60);
  if (firstPromptSnippet !== lastPromptSnippet && sorted.length > 1) {
    return `This month you sat with yourself more than once.

You began with: "${firstPromptSnippet}..."

And by the end you were asking different questions.

The questions shifted. That is how understanding begins.`;
  }

  return `This month you showed up for yourself.

${reflections.length} honest sit${reflections.length === 1 ? "" : "s"}. ${reflections.length === 1 ? "That" : "Each one"} matters.

That is rarer than it sounds.`;
}

// ─── Thematic Clustering ──────────────────────────────────────────────────────

export function detectThemes(reflections: StoredReflection[]): Theme[] {
  if (reflections.length < 10) return [];

  const allText = reflections
    .map((r) => `${r.prompt} ${r.response} ${r.followUpResponse ?? ""}`)
    .join(" ")
    .toLowerCase();

  const themePatterns = [
    {
      title: "Fear of failure",
      description:
        "Something about fear of failure appears in several of your reflections this year.",
      keywords: ["fail", "failure", "wrong", "mistake", "enough", "disappoint"],
    },
    {
      title: "The desire for rest",
      description:
        "You return often to the idea of rest — permission to stop pushing.",
      keywords: ["rest", "tired", "stop", "pause", "slow", "exhaust", "break"],
    },
    {
      title: "Connection and longing",
      description:
        "Connection — the desire for it and the fear of it — appears throughout.",
      keywords: [
        "lonely",
        "alone",
        "connect",
        "relationship",
        "belong",
        "together",
      ],
    },
    {
      title: "Self-worth",
      description: "A recurring question: whether you are enough.",
      keywords: ["worth", "enough", "deserve", "value", "matter", "seen"],
    },
    {
      title: "Change and transition",
      description: "You write often about being in a place of change.",
      keywords: [
        "change",
        "transition",
        "different",
        "shift",
        "becoming",
        "moving",
      ],
    },
    {
      title: "Grief and loss",
      description:
        "Something about loss surfaces again and again in your words.",
      keywords: ["grief", "loss", "miss", "gone", "lost", "mourn"],
    },
  ];

  const themes: Theme[] = [];
  for (const theme of themePatterns) {
    const keywordsFound = theme.keywords.filter((kw) =>
      allText.includes(kw),
    ).length;
    if (keywordsFound >= 2) {
      themes.push({
        title: theme.title,
        description: theme.description,
        count: reflections.filter((r) =>
          theme.keywords.some((kw) =>
            `${r.prompt} ${r.response}`.toLowerCase().includes(kw),
          ),
        ).length,
      });
    }
  }

  return themes.sort((a, b) => b.count - a.count).slice(0, 4);
}

// ─── Follow-up ────────────────────────────────────────────────────────────────

export function generateFollowUp(
  responseText: string,
  promptType: string,
): string {
  const text = responseText.toLowerCase();
  if (
    text.includes("fear") ||
    text.includes("afraid") ||
    text.includes("scared")
  )
    return "What would it mean if that happened?";
  if (
    text.includes("carrying") ||
    text.includes("weight") ||
    text.includes("holding")
  )
    return "What were you waiting for, do you think?";
  if (
    text.includes("calm") ||
    text.includes("lighter") ||
    text.includes("better")
  )
    return "What shifted?";
  if (
    text.includes("don't know") ||
    text.includes("not sure") ||
    text.includes("unclear")
  )
    return "What would knowing feel like?";
  if (text.includes("love") || text.includes("care") || text.includes("matter"))
    return "Who knows that about you?";
  if (text.includes("tired") || text.includes("exhaust"))
    return "What would real rest look like?";
  if (promptType === "PROFOUND_EVENT")
    return "What are you carrying differently now?";
  if (promptType === "PATTERN_DETECTION")
    return "When did you first notice it?";
  if (promptType === "TRAJECTORY") return "What needs to change?";
  return "What else is true?";
}

// ─── Completion messages ──────────────────────────────────────────────────────

export function getCompletionMessage(promptType: string): string {
  const messages: Record<string, string> = {
    PROFOUND_EVENT:
      "You looked at something real. That takes honesty. Veil is keeping this.",
    PATTERN_DETECTION:
      "You sat with a pattern long enough to see it. That is how understanding begins.",
    WRITE_TAB_EVENT:
      "You traced the feeling back to where it started. That is a rare kind of honesty.",
    TRAJECTORY: "You named where you are. Sometimes that is the whole work.",
    TIME_GAP: "You came back to yourself. That is never small.",
    SEASONAL: "You marked a turning in the year. Those observations matter.",
    ANNIVERSARY:
      "You read who you were and saw who you are. That gap — that is growth.",
    DEFAULT:
      "You took a moment to understand yourself. That is rarer than it sounds.",
    COMPASS_REFLECTION:
      "You looked at the direction you've been heading. Awareness is the first movement.",
    CONNECTION_REFLECTION:
      "You thought about someone who matters. That attention is its own form of love.",
  };
  return messages[promptType] ?? messages.DEFAULT;
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

const REFLECTIONS_KEY_PREFIX = "veil-reflection-v2-";
const SETTINGS_KEY = "veil-reflections-settings";

export const DEFAULT_REFLECTIONS_SETTINGS: ReflectionsSettings = {
  promptFrequency: "every-few-days",
  seasonalPrompts: true,
  anniversaryPrompts: true,
  showCompass: true,
  showPeople: true,
  monthlyNarrative: true,
  quarterlyNarrative: true,
  annualNarrative: true,
  thematicClustering: true,
};

export function loadReflectionsSettings(): ReflectionsSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_REFLECTIONS_SETTINGS };
    return { ...DEFAULT_REFLECTIONS_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_REFLECTIONS_SETTINGS };
  }
}

export function saveReflectionsSettings(s: ReflectionsSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}

export function loadLocalReflections(): StoredReflection[] {
  const result: StoredReflection[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(REFLECTIONS_KEY_PREFIX)) continue;
      const raw = localStorage.getItem(key);
      const parsed = safeParseJSON(raw);
      if (parsed) result.push(parsed as StoredReflection);
    }
  } catch {
    // ignore
  }
  return result.sort((a, b) => b.timestamp - a.timestamp);
}

export function saveLocalReflection(r: StoredReflection): void {
  try {
    localStorage.setItem(`${REFLECTIONS_KEY_PREFIX}${r.id}`, JSON.stringify(r));
  } catch {
    // ignore
  }
}

// ─── Crisis detection ─────────────────────────────────────────────────────────

const CRISIS_KEYWORDS = [
  "suicide",
  "kill myself",
  "end my life",
  "don't want to live",
  "don't want to be here",
  "self harm",
  "hurt myself",
  "cutting",
  "overdose",
  "not worth living",
  "better off dead",
];

export function detectCrisisSignal(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
}
