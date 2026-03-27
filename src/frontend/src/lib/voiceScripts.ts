// ─── Veil Voice System — Script Library ────────────────────────────────────────────────────────────────
// All 6 voice moments. Scripts are pre-crafted, warm, brief.
// Audio files live at /assets/voice/m{moment}_s{scriptIndex}.mp3
// Duration hints (seconds) used for overlay auto-dismiss when audio unavailable.

export type MomentId = 1 | 2 | 3 | 4 | 5 | 6;

export interface VoiceScript {
  id: string; // e.g. "m1_s1"
  text: string; // full transcript (multi-line preserved as \n)
  durationHint: number; // estimated seconds
  audioPath: string; // path to pre-rendered MP3
}

// ── Moment 1: After Companion Card Voice Dump ─────────────────────────────────────────────────

export const MOMENT_1_SCRIPTS: VoiceScript[] = [
  {
    id: "m1_s1",
    text: "Veil heard every word.\nEvery breath. All of it.\nYou don't have to carry\nany of it anymore.\nGo be present.",
    durationHint: 10,
    audioPath: "/assets/voice/m1_s1.mp3",
  },
  {
    id: "m1_s2",
    text: "That took something —\nsaying it out loud.\nVeil has it now.\nYou can go.",
    durationHint: 8,
    audioPath: "/assets/voice/m1_s2.mp3",
  },
  {
    id: "m1_s3",
    text: "You spoke. Veil listened.\nIt's here now — not with you.\nGo home.\nThe people you love\nget the real you tonight.",
    durationHint: 11,
    audioPath: "/assets/voice/m1_s3.mp3",
  },
  {
    id: "m1_s4",
    text: "Every word you said\nis safe here.\nAll of it.\nYou're lighter now.\nGo.",
    durationHint: 9,
    audioPath: "/assets/voice/m1_s4.mp3",
  },
  {
    id: "m1_s5",
    text: "Veil received everything\nyou gave it.\nNothing was too much.\nNothing will be.\nBreathe.",
    durationHint: 10,
    audioPath: "/assets/voice/m1_s5.mp3",
  },
  {
    id: "m1_s6",
    text: "You gave it away.\nThat was brave.\nIt's gone from you now.\nGo be present.",
    durationHint: 9,
    audioPath: "/assets/voice/m1_s6.mp3",
  },
  {
    id: "m1_s7",
    text: "Veil was here for\nevery second of that.\nIt's safe here.\nYou're free to go.",
    durationHint: 8,
    audioPath: "/assets/voice/m1_s7.mp3",
  },
  {
    id: "m1_s8",
    text: "That's all Veil's now.\nNot yours.\nGo home.\nBe there.",
    durationHint: 7,
    audioPath: "/assets/voice/m1_s8.mp3",
  },
];

// ── Moment 2: After Companion Card Text Dump ──────────────────────────────────────────────────

export const MOMENT_2_SCRIPTS: VoiceScript[] = [
  {
    id: "m2_s1",
    text: "Veil has it now.\nYou can breathe.\nGo be present.",
    durationHint: 7,
    audioPath: "/assets/voice/m2_s1.mp3",
  },
  {
    id: "m2_s2",
    text: "You put it down.\nIt lives here now —\nnot with you.",
    durationHint: 7,
    audioPath: "/assets/voice/m2_s2.mp3",
  },
  {
    id: "m2_s3",
    text: "Veil read every word.\nAll of it.\nYou're lighter now.\nGo.",
    durationHint: 8,
    audioPath: "/assets/voice/m2_s3.mp3",
  },
  {
    id: "m2_s4",
    text: "It's out of you now.\nThat matters.\nGo be somewhere else.",
    durationHint: 7,
    audioPath: "/assets/voice/m2_s4.mp3",
  },
];

// ── Moment 3: After Silent Check-In ─────────────────────────────────────────────────────────────────────

export const MOMENT_3_SCRIPTS: VoiceScript[] = [
  {
    id: "m3_s1",
    text: "You showed up.\nThat was enough.\nVeil sees you.",
    durationHint: 7,
    audioPath: "/assets/voice/m3_s1.mp3",
  },
  {
    id: "m3_s2",
    text: "You came here.\nEven when you had nothing.\nThat is something.",
    durationHint: 7,
    audioPath: "/assets/voice/m3_s2.mp3",
  },
  {
    id: "m3_s3",
    text: "You didn't have words.\nYou didn't need them.\nVeil is here anyway.",
    durationHint: 8,
    audioPath: "/assets/voice/m3_s3.mp3",
  },
  {
    id: "m3_s4",
    text: "Silence is its own kind of truth.\nVeil received it.",
    durationHint: 7,
    audioPath: "/assets/voice/m3_s4.mp3",
  },
];

// ── Moment 4: Emotion Check-In Response ─────────────────────────────────────────────────────────────────

type Moment4Scripts = Record<string, VoiceScript[]>;

export const MOMENT_4_SCRIPTS: Moment4Scripts = {
  GRATEFUL: [
    {
      id: "m4_grateful_s1",
      text: "Gratitude is a form of paying attention.\nYou just paid attention.\nThat's rare.",
      durationHint: 9,
      audioPath: "/assets/voice/m4_grateful_s1.mp3",
    },
    {
      id: "m4_grateful_s2",
      text: "You named what is good.\nThat takes practice.\nYou're getting better at it.",
      durationHint: 8,
      audioPath: "/assets/voice/m4_grateful_s2.mp3",
    },
  ],
  CALM: [
    {
      id: "m4_calm_s1",
      text: "Calm is not nothing.\nCalm is what you've been working toward.\nStay here a moment.",
      durationHint: 9,
      audioPath: "/assets/voice/m4_calm_s1.mp3",
    },
  ],
  STRESSED: [
    {
      id: "m4_stressed_s1",
      text: "You're carrying something today.\nVeil knows.\nYou don't have to solve it right now.",
      durationHint: 9,
      audioPath: "/assets/voice/m4_stressed_s1.mp3",
    },
    {
      id: "m4_stressed_s2",
      text: "Stressed means you care about something.\nThat's not a flaw.\nThat's you.",
      durationHint: 8,
      audioPath: "/assets/voice/m4_stressed_s2.mp3",
    },
  ],
  SAD: [
    {
      id: "m4_sad_s1",
      text: "Sadness is honest.\nVeil is not afraid of it.\nNeither should you be.",
      durationHint: 8,
      audioPath: "/assets/voice/m4_sad_s1.mp3",
    },
  ],
  FRUSTRATED: [
    {
      id: "m4_frustrated_s1",
      text: "Something matters enough to frustrate you.\nThat means you have standards.\nThat's not nothing.",
      durationHint: 9,
      audioPath: "/assets/voice/m4_frustrated_s1.mp3",
    },
  ],
  ANXIOUS: [
    {
      id: "m4_anxious_s1",
      text: "Anxiety is your nervous system trying to protect you.\nYou can thank it\nand ask it to quiet down.",
      durationHint: 10,
      audioPath: "/assets/voice/m4_anxious_s1.mp3",
    },
  ],
  REFLECTIVE: [
    {
      id: "m4_reflective_s1",
      text: "Reflection is a form of courage.\nMost people don't do it.\nYou do.",
      durationHint: 8,
      audioPath: "/assets/voice/m4_reflective_s1.mp3",
    },
  ],
  LONELY: [
    {
      id: "m4_lonely_s1",
      text: "Loneliness is the feeling\nthat you are the only one.\nYou are not.",
      durationHint: 8,
      audioPath: "/assets/voice/m4_lonely_s1.mp3",
    },
  ],
  NUMB: [
    {
      id: "m4_numb_s1",
      text: "Numb means something was too much\nfor too long.\nVeil is a safe place to not feel everything.",
      durationHint: 9,
      audioPath: "/assets/voice/m4_numb_s1.mp3",
    },
  ],
  HOPEFUL: [
    {
      id: "m4_hopeful_s1",
      text: "Hope takes practice.\nYou're practicing.\nKeep going.",
      durationHint: 7,
      audioPath: "/assets/voice/m4_hopeful_s1.mp3",
    },
  ],
};

// ── Moment 5: Emotional Intelligence — Transformation Arc ──────────────────────────────────────────────

export interface Moment5ScriptTemplate {
  id: string;
  text: (emotionWord: string) => string;
  durationHint: number;
  audioPath: string;
}

export const MOMENT_5_TEMPLATES: Record<string, Moment5ScriptTemplate[]> = {
  RELEASE: [
    {
      id: "m5_release_s1",
      text: (e) =>
        `You named it ${e}.\nNaming it is the first release.\nLet that be enough for now.`,
      durationHint: 8,
      audioPath: "/assets/voice/m5_release_s1.mp3",
    },
  ],
  CALM: [
    {
      id: "m5_calm_s1",
      text: () =>
        "This is the calm after the naming.\nStay here.\nNothing needs solving right now.",
      durationHint: 8,
      audioPath: "/assets/voice/m5_calm_s1.mp3",
    },
  ],
  GROUND: [
    {
      id: "m5_ground_s1",
      text: () =>
        "Feel where your feet are.\nFeel what's holding you.\nYou are here. That's real.",
      durationHint: 8,
      audioPath: "/assets/voice/m5_ground_s1.mp3",
    },
  ],
  REBUILD: [
    {
      id: "m5_rebuild_s1",
      text: () =>
        "From here you can choose one thing.\nJust one.\nThat is enough to begin.",
      durationHint: 8,
      audioPath: "/assets/voice/m5_rebuild_s1.mp3",
    },
  ],
};

export const EMOTION_WORDS: Record<string, string> = {
  stressed: "stress",
  anxious: "anxiety",
  sad: "sadness",
  frustrated: "frustration",
  lonely: "loneliness",
  numb: "numbness",
  reflective: "something heavy",
};

export function getMoment5Script(
  bracket: string,
  emotionType: string,
): VoiceScript {
  const templates = MOMENT_5_TEMPLATES[bracket];
  if (!templates || templates.length === 0) {
    return {
      id: "fallback",
      text: "Veil is here.",
      durationHint: 4,
      audioPath: "",
    };
  }
  const template = templates[Math.floor(Math.random() * templates.length)];
  const emotionWord = EMOTION_WORDS[emotionType] ?? emotionType;
  return {
    id: template.id,
    text: template.text(emotionWord),
    durationHint: template.durationHint,
    audioPath: template.audioPath,
  };
}

// ── Moment 6: After Apology Sent ─────────────────────────────────────────────────────────────────────

export const MOMENT_6_SCRIPTS: VoiceScript[] = [
  {
    id: "m6_s1",
    text: "You said sorry.\nThat took courage.\nHowever it lands — you did the right thing.",
    durationHint: 9,
    audioPath: "/assets/voice/m6_s1.mp3",
  },
  {
    id: "m6_s2",
    text: "You reached out.\nNot because you had to.\nBecause you wanted to.\nThat matters.",
    durationHint: 9,
    audioPath: "/assets/voice/m6_s2.mp3",
  },
  {
    id: "m6_s3",
    text: "An apology is a gift.\nYou gave one.\nThat is yours to keep, whatever happens next.",
    durationHint: 9,
    audioPath: "/assets/voice/m6_s3.mp3",
  },
];

export const MOMENT_SCRIPTS: Record<number, VoiceScript[]> = {
  1: MOMENT_1_SCRIPTS,
  2: MOMENT_2_SCRIPTS,
  3: MOMENT_3_SCRIPTS,
  6: MOMENT_6_SCRIPTS,
};

// ── Rotation logic ────────────────────────────────────────────────────────────────────────────────────

const ROTATION_KEY = "veil-voice-rotation";

interface RotationRecord {
  lastScriptId: string;
  lastPlayedWeek: number;
}

function getRotationRecord(): Record<string, RotationRecord> {
  try {
    const raw = localStorage.getItem(ROTATION_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* */
  }
  return {};
}

function saveRotationRecord(rec: Record<string, RotationRecord>): void {
  try {
    localStorage.setItem(ROTATION_KEY, JSON.stringify(rec));
  } catch {
    /* */
  }
}

function getCurrentWeek(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(
    ((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7,
  );
}

export function getNextScript(
  momentId: MomentId,
  overrideScripts?: VoiceScript[],
): VoiceScript {
  const scripts = overrideScripts ?? MOMENT_SCRIPTS[momentId];
  if (!scripts || scripts.length === 0) {
    return {
      id: "fallback",
      text: "Veil is here.",
      durationHint: 4,
      audioPath: "",
    };
  }
  if (scripts.length === 1) return scripts[0];
  const records = getRotationRecord();
  const key = `m${momentId}`;
  const rec = records[key];
  const currentWeek = getCurrentWeek();
  let candidates = scripts;
  if (rec && rec.lastPlayedWeek === currentWeek) {
    const filtered = scripts.filter((s) => s.id !== rec.lastScriptId);
    if (filtered.length > 0) candidates = filtered;
  }
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  records[key] = { lastScriptId: chosen.id, lastPlayedWeek: currentWeek };
  saveRotationRecord(records);
  return chosen;
}

export function getMoment4Script(emotionType: string): VoiceScript {
  const key = emotionType.toUpperCase();
  const scripts = MOMENT_4_SCRIPTS[key] ?? MOMENT_4_SCRIPTS.STRESSED;
  return scripts[Math.floor(Math.random() * scripts.length)];
}

// ── Apology Scripts ────────────────────────────────────────────────────────────────────────────────────────

export type ApologyMomentKey =
  | "ap_a"
  | "ap_b"
  | "ap_c"
  | "ap_d"
  | "ap_e"
  | "ap_f";

export const APOLOGY_SCRIPTS: Record<ApologyMomentKey, VoiceScript[]> = {
  ap_a: [
    {
      id: "ap_a_s1",
      text: "You came here to say sorry.\nThat is already something.",
      durationHint: 7,
      audioPath: "/assets/voice/ap_a_s1.mp3",
    },
    {
      id: "ap_a_s2",
      text: "Before you begin —\nknow that this takes courage.\nYou have it.",
      durationHint: 8,
      audioPath: "/assets/voice/ap_a_s2.mp3",
    },
  ],
  ap_b: [
    {
      id: "ap_b_s1",
      text: "Take your time.\nThere is no wrong way to mean it.",
      durationHint: 7,
      audioPath: "/assets/voice/ap_b_s1.mp3",
    },
  ],
  ap_c: [
    {
      id: "ap_c_s1",
      text: "You wrote it.\nHowever it lands — you said something true.",
      durationHint: 8,
      audioPath: "/assets/voice/ap_c_s1.mp3",
    },
  ],
  ap_d: [
    {
      id: "ap_d_s1",
      text: "You sent it.\nThat is the bravest part.\nIt's theirs now.",
      durationHint: 8,
      audioPath: "/assets/voice/ap_d_s1.mp3",
    },
  ],
  ap_e: [
    {
      id: "ap_e_s1",
      text: "They received it.\nWhatever comes next — you did your part.",
      durationHint: 8,
      audioPath: "/assets/voice/ap_e_s1.mp3",
    },
  ],
  ap_f: [
    {
      id: "ap_f_s1",
      text: "You kept this one private.\nThat is still a form of honesty.\nVeil has it now.",
      durationHint: 9,
      audioPath: "/assets/voice/ap_f_s1.mp3",
    },
  ],
};

export function getApologyScript(key: ApologyMomentKey): VoiceScript {
  const scripts = APOLOGY_SCRIPTS[key];
  if (!scripts || scripts.length === 0) {
    return {
      id: "fallback",
      text: "Veil is here.",
      durationHint: 4,
      audioPath: "",
    };
  }
  return scripts[Math.floor(Math.random() * scripts.length)];
}

// ── Love Letter Scripts ─────────────────────────────────────────────────────────────────────────────────────

export type LoveLetterMomentKey =
  | "ll_a"
  | "ll_b"
  | "ll_c"
  | "ll_d"
  | "ll_e"
  | "ll_f"
  | "ll_self";

export const LOVE_LETTER_SCRIPTS: Record<LoveLetterMomentKey, VoiceScript[]> = {
  ll_a: [
    {
      id: "ll_a_s1",
      text: "You came here to say something beautiful.\nTake your time.",
      durationHint: 7,
      audioPath: "/assets/voice/ll_a_s1.mp3",
    },
  ],
  ll_b: [
    {
      id: "ll_b_s1",
      text: "Let it come from the honest place.\nThat is the only place love letters are real.",
      durationHint: 9,
      audioPath: "/assets/voice/ll_b_s1.mp3",
    },
  ],
  ll_c: [
    {
      id: "ll_c_s1",
      text: "You wrote love into words.\nThat is one of the hardest things to do.\nYou did it.",
      durationHint: 9,
      audioPath: "/assets/voice/ll_c_s1.mp3",
    },
  ],
  ll_d: [
    {
      id: "ll_d_s1",
      text: "It's on its way.\nSomewhere, someone is about to feel seen.\nBecause of you.",
      durationHint: 9,
      audioPath: "/assets/voice/ll_d_s1.mp3",
    },
  ],
  ll_e: [
    {
      id: "ll_e_s1",
      text: "They received it.\nA letter of love, from you.\nThat is a rare gift.",
      durationHint: 8,
      audioPath: "/assets/voice/ll_e_s1.mp3",
    },
  ],
  ll_f: [
    {
      id: "ll_f_s1",
      text: "You kept this one.\nSome love lives privately.\nIt is still real.",
      durationHint: 8,
      audioPath: "/assets/voice/ll_f_s1.mp3",
    },
  ],
  ll_self: [
    {
      id: "ll_self_s1",
      text: "A letter to yourself.\nThat takes a kind of courage\nmost people never find.",
      durationHint: 9,
      audioPath: "/assets/voice/ll_self_s1.mp3",
    },
  ],
};

export function getLoveLetterScript(key: LoveLetterMomentKey): VoiceScript {
  const scripts = LOVE_LETTER_SCRIPTS[key];
  if (!scripts || scripts.length === 0) {
    return {
      id: "fallback",
      text: "Veil is here.",
      durationHint: 4,
      audioPath: "",
    };
  }
  return scripts[Math.floor(Math.random() * scripts.length)];
}

// ── Confession Scripts ────────────────────────────────────────────────────────────────────────────────────────

export type ConfessionMomentKey = "cf_a" | "cf_b" | "cf_c" | "cf_d" | "cf_e";

export const CONFESSION_SCRIPTS: Record<ConfessionMomentKey, VoiceScript[]> = {
  cf_a: [
    {
      id: "cf_a_s1",
      text: "You came here to say something true.\nThis is a safe place for that.",
      durationHint: 8,
      audioPath: "/assets/voice/cf_a_s1.mp3",
    },
  ],
  cf_b: [
    {
      id: "cf_b_s1",
      text: "Say it.\nAll of it.\nVeil holds no judgment.",
      durationHint: 7,
      audioPath: "/assets/voice/cf_b_s1.mp3",
    },
  ],
  cf_c: [
    {
      id: "cf_c_s1",
      text: "You said it to the universe.\nThe universe received it.\nYou can let it go now.",
      durationHint: 9,
      audioPath: "/assets/voice/cf_c_s1.mp3",
    },
    {
      id: "cf_c_s2",
      text: "You let one person into this.\nNot to judge. Just to witness.\nThat is what courage looks like.",
      durationHint: 9,
      audioPath: "/assets/voice/cf_c_s2.mp3",
    },
  ],
  cf_d: [
    {
      id: "cf_d_s1",
      text: "Someone heard you.\nYou are not carrying this alone anymore.",
      durationHint: 7,
      audioPath: "/assets/voice/cf_d_s1.mp3",
    },
    {
      id: "cf_d_s2",
      text: "You were heard.\nThat is what you needed.\nThat is what you got.",
      durationHint: 7,
      audioPath: "/assets/voice/cf_d_s2.mp3",
    },
  ],
  cf_e: [
    {
      id: "cf_e_s1",
      text: "Someone who received what you shared\nsays you are still worthy.\nBelieve them.",
      durationHint: 8,
      audioPath: "/assets/voice/cf_e_s1.mp3",
    },
    {
      id: "cf_e_s2",
      text: "You are still worthy.\nWhatever this is — it does not define you.",
      durationHint: 7,
      audioPath: "/assets/voice/cf_e_s2.mp3",
    },
  ],
};

export function getConfessionScript(key: ConfessionMomentKey): VoiceScript {
  const scripts = CONFESSION_SCRIPTS[key];
  if (!scripts || scripts.length === 0) {
    return {
      id: "fallback",
      text: "Veil is here.",
      durationHint: 4,
      audioPath: "",
    };
  }
  if (scripts.length === 1) return scripts[0];
  const records = getRotationRecord();
  const rotKey = `cf_${key}`;
  const rec = records[rotKey];
  const currentWeek = getCurrentWeek();
  let candidates = scripts;
  if (rec && rec.lastPlayedWeek === currentWeek) {
    const filtered = scripts.filter((s) => s.id !== rec.lastScriptId);
    if (filtered.length > 0) candidates = filtered;
  }
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  records[rotKey] = { lastScriptId: chosen.id, lastPlayedWeek: currentWeek };
  saveRotationRecord(records);
  return chosen;
}

// ─── Journal Voice Moments D, E, F (v1.2) ──────────────────────────────────────────────────────────────────

/** Moment D — On Volume Closure */
export const JOURNAL_MOMENT_D: VoiceScript = {
  id: "jrn_d_s1",
  text: "You closed a chapter.\n\nEverything it held —\nevery page, every feeling —\nis preserved.\n\nYou can open it\nwhenever you need to\nremember who you were then.\n\nA new chapter is ready\nwhen you are.",
  durationHint: 18,
  audioPath: "/assets/voice/jrn_d_s1.mp3",
};

/** Moment E — On Turning Point Mark */
export const JOURNAL_MOMENT_E: VoiceScript = {
  id: "jrn_e_s1",
  text: "You recognized something.\n\nThat this moment\nwas one of the ones\nthat changed things.\n\nNot everyone notices\ntheir turning points.\n\nYou did.",
  durationHint: 14,
  audioPath: "/assets/voice/jrn_e_s1.mp3",
};

/** Moment F — On Dedication Written */
export const JOURNAL_MOMENT_F: VoiceScript = {
  id: "jrn_f_s1",
  text: "You dedicated your Journal.\n\nThat means something.\n\nEvery page that follows\nis written with\nthat intention.\n\nBegin.",
  durationHint: 13,
  audioPath: "/assets/voice/jrn_f_s1.mp3",
};
