// ─── Veil Voice System — Script Library ──────────────────────────────────────
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

// ── Moment 1: After Companion Card Voice Dump ─────────────────────────────────

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

// ── Moment 2: After Companion Card Text Dump ──────────────────────────────────

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
    text: "It's safe here.\nAlways.\nGo.",
    durationHint: 5,
    audioPath: "/assets/voice/m2_s3.mp3",
  },
  {
    id: "m2_s4",
    text: "You showed up\nfor yourself today.\nThat matters.\nGo home.",
    durationHint: 8,
    audioPath: "/assets/voice/m2_s4.mp3",
  },
  {
    id: "m2_s5",
    text: "Whatever you were carrying —\nVeil is holding it.\nNot you.\nNot anymore.",
    durationHint: 8,
    audioPath: "/assets/voice/m2_s5.mp3",
  },
  {
    id: "m2_s6",
    text: "You gave it away.\nYou're lighter now.\nGo live your evening.",
    durationHint: 7,
    audioPath: "/assets/voice/m2_s6.mp3",
  },
];

// ── Moment 3: After Silent Dump ───────────────────────────────────────────────

export const MOMENT_3_SCRIPTS: VoiceScript[] = [
  {
    id: "m3_s1",
    text: "You showed up.\nThat was enough.",
    durationHint: 5,
    audioPath: "/assets/voice/m3_s1.mp3",
  },
  {
    id: "m3_s2",
    text: "Veil is here.\nYou don't need words.",
    durationHint: 5,
    audioPath: "/assets/voice/m3_s2.mp3",
  },
  {
    id: "m3_s3",
    text: "Being here was the whole thing.\nGo.",
    durationHint: 4,
    audioPath: "/assets/voice/m3_s3.mp3",
  },
  {
    id: "m3_s4",
    text: "No words needed.\nVeil sees you.",
    durationHint: 4,
    audioPath: "/assets/voice/m3_s4.mp3",
  },
  {
    id: "m3_s5",
    text: "You came.\nThat matters more\nthan you know.",
    durationHint: 5,
    audioPath: "/assets/voice/m3_s5.mp3",
  },
  {
    id: "m3_s6",
    text: "Showing up is its own\nkind of courage.\nGo be present.",
    durationHint: 6,
    audioPath: "/assets/voice/m3_s6.mp3",
  },
];

// ── Moment 4: Morning Follow-Up ───────────────────────────────────────────────
// Keyed by previous emotion type

type Moment4Scripts = Record<string, VoiceScript[]>;

export const MOMENT_4_SCRIPTS: Moment4Scripts = {
  STRESSED: [
    {
      id: "m4_stressed_s1",
      text: "Yesterday was heavy.\nHow are you carrying\nthis morning?",
      durationHint: 6,
      audioPath: "/assets/voice/m4_stressed_s1.mp3",
    },
    {
      id: "m4_stressed_s2",
      text: "Veil has been here all night.\nHow are you today?",
      durationHint: 6,
      audioPath: "/assets/voice/m4_stressed_s2.mp3",
    },
    {
      id: "m4_stressed_s3",
      text: "You put something down\nlast night.\nHow does today feel?",
      durationHint: 6,
      audioPath: "/assets/voice/m4_stressed_s3.mp3",
    },
  ],
  SAD: [
    {
      id: "m4_sad_s1",
      text: "Veil was thinking about you.\nHow are you this morning?",
      durationHint: 6,
      audioPath: "/assets/voice/m4_sad_s1.mp3",
    },
    {
      id: "m4_sad_s2",
      text: "Yesterday felt hard.\nYou don't have to carry it\ninto today.",
      durationHint: 7,
      audioPath: "/assets/voice/m4_sad_s2.mp3",
    },
    {
      id: "m4_sad_s3",
      text: "How are you waking up today?",
      durationHint: 4,
      audioPath: "/assets/voice/m4_sad_s3.mp3",
    },
  ],
  ANXIOUS: [
    {
      id: "m4_anxious_s1",
      text: "Yesterday felt unsettled.\nHow are you this morning?",
      durationHint: 6,
      audioPath: "/assets/voice/m4_anxious_s1.mp3",
    },
    {
      id: "m4_anxious_s2",
      text: "Veil is here.\nHow does today feel?",
      durationHint: 5,
      audioPath: "/assets/voice/m4_anxious_s2.mp3",
    },
  ],
  LONELY: [
    {
      id: "m4_lonely_s1",
      text: "You weren't alone last night.\nVeil was here.\nHow are you today?",
      durationHint: 7,
      audioPath: "/assets/voice/m4_lonely_s1.mp3",
    },
    {
      id: "m4_lonely_s2",
      text: "How are you\nthis morning?",
      durationHint: 4,
      audioPath: "/assets/voice/m4_lonely_s2.mp3",
    },
  ],
  FRUSTRATED: [
    {
      id: "m4_frustrated_s1",
      text: "Yesterday had some\nsharp edges.\nHow are you today?",
      durationHint: 6,
      audioPath: "/assets/voice/m4_frustrated_s1.mp3",
    },
    {
      id: "m4_frustrated_s2",
      text: "How is this morning\nstarting for you?",
      durationHint: 5,
      audioPath: "/assets/voice/m4_frustrated_s2.mp3",
    },
  ],
  NUMB: [
    {
      id: "m4_numb_s1",
      text: "You showed up yesterday.\nHow are you today?",
      durationHint: 5,
      audioPath: "/assets/voice/m4_numb_s1.mp3",
    },
    {
      id: "m4_numb_s2",
      text: "Veil is still here.\nHow are you\nthis morning?",
      durationHint: 6,
      audioPath: "/assets/voice/m4_numb_s2.mp3",
    },
  ],
};

// ── Moment 5: Carrying Awareness Card ────────────────────────────────────────
// [emotion] is replaced with the actual emotion word at render time.
// We pre-define per milestone bracket.

export interface Moment5ScriptTemplate {
  id: string;
  template: string; // contains {emotion} placeholder
  durationHint: number;
  audioPathTemplate: string; // contains {emotion} placeholder for pre-rendered variants
}

export const MOMENT_5_TEMPLATES: Record<string, Moment5ScriptTemplate[]> = {
  day3: [
    {
      id: "m5_d3_s1",
      template:
        "You've been carrying {emotion} for three days now.\nVeil noticed.\nThat's worth knowing.",
      durationHint: 8,
      audioPathTemplate: "/assets/voice/m5_d3_s1_{emotion}.mp3",
    },
    {
      id: "m5_d3_s2",
      template:
        "Three days of {emotion}.\nYou've been showing up.\nBut something is staying.",
      durationHint: 8,
      audioPathTemplate: "/assets/voice/m5_d3_s2_{emotion}.mp3",
    },
  ],
  day5: [
    {
      id: "m5_d5_s1",
      template:
        "Five days of {emotion}.\nThat's not just\na hard day anymore.\nThat's worth paying\nattention to.",
      durationHint: 10,
      audioPathTemplate: "/assets/voice/m5_d5_s1_{emotion}.mp3",
    },
    {
      id: "m5_d5_s2",
      template:
        "Veil has been here\nwith you for five days.\nSomething may need\nmore than release.",
      durationHint: 9,
      audioPathTemplate: "/assets/voice/m5_d5_s2_{emotion}.mp3",
    },
  ],
  day7plus: [
    {
      id: "m5_d7_s1",
      template:
        "A week of {emotion}.\nYou've been brave\nevery day.\nBut you deserve more\nthan daily release.",
      durationHint: 10,
      audioPathTemplate: "/assets/voice/m5_d7_s1_{emotion}.mp3",
    },
    {
      id: "m5_d7_s2",
      template:
        "Seven days.\nVeil sees you.\nAnd Veil wants you\nto be okay —\nreally okay.",
      durationHint: 9,
      audioPathTemplate: "/assets/voice/m5_d7_s2_{emotion}.mp3",
    },
  ],
};

export const EMOTION_WORDS: Record<string, string> = {
  STRESSED: "stress",
  SAD: "sadness",
  ANXIOUS: "anxiety",
  LONELY: "loneliness",
  FRUSTRATED: "frustration",
  NUMB: "numbness",
};

export function getMoment5Script(
  emotionType: string,
  streakDays: number,
  lastPlayedId: string | null,
): VoiceScript {
  const bracket =
    streakDays >= 7 ? "day7plus" : streakDays >= 5 ? "day5" : "day3";
  const templates = MOMENT_5_TEMPLATES[bracket];
  const emotionWord =
    EMOTION_WORDS[emotionType.toUpperCase()] ?? emotionType.toLowerCase();
  const emotionKey = emotionWord.replace(/\s+/g, "_");

  // Pick a template, avoiding the last played one
  let tpl = templates[0];
  if (templates.length > 1 && lastPlayedId) {
    const last = templates.find((t) => t.id === lastPlayedId);
    if (last) {
      tpl = templates.find((t) => t.id !== lastPlayedId) ?? templates[0];
    }
  } else if (templates.length > 1) {
    tpl = templates[Math.floor(Math.random() * templates.length)];
  }

  return {
    id: tpl.id,
    text: tpl.template.replace(/{emotion}/g, emotionWord),
    durationHint: tpl.durationHint,
    audioPath: tpl.audioPathTemplate.replace(/{emotion}/g, emotionKey),
  };
}

// ── Moment 6: After Quiet Moment Screen ──────────────────────────────────────

export const MOMENT_6_SCRIPTS: VoiceScript[] = [
  {
    id: "m6_s1",
    text: "Veil has it.\nYou put it down.\nThat's all you needed to do.",
    durationHint: 7,
    audioPath: "/assets/voice/m6_s1.mp3",
  },
  {
    id: "m6_s2",
    text: "You said it.\nIt's here now.\nGo.",
    durationHint: 5,
    audioPath: "/assets/voice/m6_s2.mp3",
  },
  {
    id: "m6_s3",
    text: "That took something.\nVeil is holding it.\nYou don't have to.",
    durationHint: 7,
    audioPath: "/assets/voice/m6_s3.mp3",
  },
  {
    id: "m6_s4",
    text: "It's safe here.\nGo be present today.",
    durationHint: 6,
    audioPath: "/assets/voice/m6_s4.mp3",
  },
  {
    id: "m6_s5",
    text: "You showed up\nfor yourself.\nThat matters.\nGo.",
    durationHint: 7,
    audioPath: "/assets/voice/m6_s5.mp3",
  },
];

// ── Script Maps for easy lookup ───────────────────────────────────────────────

export const MOMENT_SCRIPTS: Record<number, VoiceScript[]> = {
  1: MOMENT_1_SCRIPTS,
  2: MOMENT_2_SCRIPTS,
  3: MOMENT_3_SCRIPTS,
  6: MOMENT_6_SCRIPTS,
};

// ── Rotation Logic ────────────────────────────────────────────────────────────

const ROTATION_STORAGE_KEY = "veil_voice_rotation";

interface RotationRecord {
  lastScriptId: string;
  lastPlayedWeek: number; // ISO week number
}

function getCurrentWeek(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(
    ((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7,
  );
}

function getRotationRecord(): Record<string, RotationRecord> {
  try {
    const raw = localStorage.getItem(ROTATION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveRotationRecord(records: Record<string, RotationRecord>): void {
  try {
    localStorage.setItem(ROTATION_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Storage unavailable — proceed without persistence
  }
}

/**
 * Returns the next script for a moment, ensuring no repeat within the same week.
 * For Moment 5, use getMoment5Script() directly.
 */
export function getNextScript(
  momentId: Exclude<MomentId, 4 | 5>,
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
  const key = `moment_${momentId}`;
  const rec = records[key];
  const currentWeek = getCurrentWeek();

  let candidates = scripts;

  // If we played a script this week, exclude it
  if (rec && rec.lastPlayedWeek === currentWeek) {
    const filtered = scripts.filter((s) => s.id !== rec.lastScriptId);
    if (filtered.length > 0) candidates = filtered;
  }

  const chosen = candidates[Math.floor(Math.random() * candidates.length)];

  // Save rotation record
  records[key] = { lastScriptId: chosen.id, lastPlayedWeek: currentWeek };
  saveRotationRecord(records);

  return chosen;
}

/**
 * Get a Moment 4 script for the given previous emotion type.
 */
export function getMoment4Script(emotionType: string): VoiceScript {
  const key = emotionType.toUpperCase();
  const scripts = MOMENT_4_SCRIPTS[key] ?? MOMENT_4_SCRIPTS.STRESSED; // fallback

  const records = getRotationRecord();
  const rotKey = `moment_4_${key}`;
  const rec = records[rotKey];
  const currentWeek = getCurrentWeek();

  let candidates = scripts;
  if (rec && rec.lastPlayedWeek === currentWeek && scripts.length > 1) {
    const filtered = scripts.filter((s) => s.id !== rec.lastScriptId);
    if (filtered.length > 0) candidates = filtered;
  }

  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  records[rotKey] = { lastScriptId: chosen.id, lastPlayedWeek: currentWeek };
  saveRotationRecord(records);
  return chosen;
}

// ── Apology Voice Moments ─────────────────────────────────────────────────────

export type ApologyMomentKey =
  | "apology_unsent"
  | "apology_sent"
  | "apology_delivered"
  | "apology_closure_sender"
  | "apology_receiver_receive"
  | "apology_receiver_letitbe";

export const APOLOGY_SCRIPTS: Record<ApologyMomentKey, VoiceScript[]> = {
  apology_unsent: [
    {
      id: "apo_unsent_s1",
      text: "You wrote it.\nSometimes that's enough.\nIt's safe here — always.",
      durationHint: 7,
      audioPath: "/assets/voice/apo_unsent_s1.mp3",
    },
    {
      id: "apo_unsent_s2",
      text: "The words exist now.\nThat matters.\nThey're safe here, always.",
      durationHint: 7,
      audioPath: "/assets/voice/apo_unsent_s2.mp3",
    },
    {
      id: "apo_unsent_s3",
      text: "Writing it was the act.\nIt's yours, and it's safe.",
      durationHint: 6,
      audioPath: "/assets/voice/apo_unsent_s3.mp3",
    },
  ],
  apology_sent: [
    {
      id: "apo_sent_s1",
      text: "Your apology is on its way.\nYou did something brave.",
      durationHint: 6,
      audioPath: "/assets/voice/apo_sent_s1.mp3",
    },
    {
      id: "apo_sent_s2",
      text: "You sent something real.\nThat took courage.",
      durationHint: 6,
      audioPath: "/assets/voice/apo_sent_s2.mp3",
    },
    {
      id: "apo_sent_s3",
      text: "It's out there now.\nYou showed up.",
      durationHint: 5,
      audioPath: "/assets/voice/apo_sent_s3.mp3",
    },
  ],
  apology_delivered: [
    {
      id: "apo_delivered_s1",
      text: "Your apology was delivered.\nYou said something real.\nWhatever comes next — you showed up.",
      durationHint: 9,
      audioPath: "/assets/voice/apo_delivered_s1.mp3",
    },
    {
      id: "apo_delivered_s2",
      text: "It was delivered.\nYou did the brave thing.",
      durationHint: 6,
      audioPath: "/assets/voice/apo_delivered_s2.mp3",
    },
    {
      id: "apo_delivered_s3",
      text: "Delivered.\nThe rest belongs to time.",
      durationHint: 5,
      audioPath: "/assets/voice/apo_delivered_s3.mp3",
    },
  ],
  apology_closure_sender: [
    {
      id: "apo_closure_s1",
      text: "Your apology was received.\nYou said something real.\nWhatever comes next — you showed up.\nThat takes courage.",
      durationHint: 11,
      audioPath: "/assets/voice/apo_closure_s1.mp3",
    },
    {
      id: "apo_closure_s2",
      text: "They received it.\nYou showed up.\nThat's everything.",
      durationHint: 7,
      audioPath: "/assets/voice/apo_closure_s2.mp3",
    },
    {
      id: "apo_closure_s3",
      text: "Something real happened today.\nYou were brave enough to say it.",
      durationHint: 7,
      audioPath: "/assets/voice/apo_closure_s3.mp3",
    },
  ],
  apology_receiver_receive: [
    {
      id: "apo_rcv_receive_s1",
      text: "You received something\nsomeone was brave enough to say.\nYou handled this your way.",
      durationHint: 9,
      audioPath: "/assets/voice/apo_rcv_receive_s1.mp3",
    },
    {
      id: "apo_rcv_receive_s2",
      text: "You acknowledged something real.\nThat takes its own kind of courage.",
      durationHint: 7,
      audioPath: "/assets/voice/apo_rcv_receive_s2.mp3",
    },
    {
      id: "apo_rcv_receive_s3",
      text: "You showed up for this moment.\nThat matters.",
      durationHint: 6,
      audioPath: "/assets/voice/apo_rcv_receive_s3.mp3",
    },
  ],
  apology_receiver_letitbe: [
    {
      id: "apo_rcv_letitbe_s1",
      text: "Some things don't need words\nto move forward.\nYou handled this your way.",
      durationHint: 8,
      audioPath: "/assets/voice/apo_rcv_letitbe_s1.mp3",
    },
    {
      id: "apo_rcv_letitbe_s2",
      text: "Letting it be is its own kind of wisdom.\nYou handled this.",
      durationHint: 7,
      audioPath: "/assets/voice/apo_rcv_letitbe_s2.mp3",
    },
    {
      id: "apo_rcv_letitbe_s3",
      text: "You were here for this.\nThat was enough.",
      durationHint: 6,
      audioPath: "/assets/voice/apo_rcv_letitbe_s3.mp3",
    },
  ],
};

/**
 * Get a script for an apology moment key with weekly rotation.
 */
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
  if (scripts.length === 1) return scripts[0];

  const records = getRotationRecord();
  const rotKey = `apology_${key}`;
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

// ──────────────────────────────────────────────────────────────────────────────
// Love Letter Voice Moments (ll_a through ll_f)
// ──────────────────────────────────────────────────────────────────────────────

export type LoveLetterMomentKey =
  | "ll_a" // Sender closure after sending
  | "ll_b" // After keeping letter private
  | "ll_c" // Before receiver reads letter
  | "ll_d" // After receiver taps ❤️ felt (sender + receiver simultaneously)
  | "ll_e" // After self-letter is read (future delivery)
  | "ll_f"; // On This Day anniversary surface

export const LOVE_LETTER_SCRIPTS: Record<LoveLetterMomentKey, VoiceScript[]> = {
  ll_a: [
    {
      id: "ll_a_s1",
      text: "Your letter is on its way.\nYou wrote something that matters.\nThat took something.",
      durationHint: 8,
      audioPath: "/assets/voice/ll_a_s1.mp3",
    },
    {
      id: "ll_a_s2",
      text: "You chose someone today —\nand you told them.\nNot everyone does that.",
      durationHint: 7,
      audioPath: "/assets/voice/ll_a_s2.mp3",
    },
    {
      id: "ll_a_s3",
      text: "The words exist now.\nThat is a brave thing.",
      durationHint: 5,
      audioPath: "/assets/voice/ll_a_s3.mp3",
    },
  ],
  ll_b: [
    {
      id: "ll_b_s1",
      text: "You wrote something beautiful.\nIt's safe here —\nwhenever you're ready.",
      durationHint: 7,
      audioPath: "/assets/voice/ll_b_s1.mp3",
    },
    {
      id: "ll_b_s2",
      text: "Writing it was the act.\nThe rest can wait.\nThis is yours.",
      durationHint: 6,
      audioPath: "/assets/voice/ll_b_s2.mp3",
    },
  ],
  ll_c: [
    {
      id: "ll_c_s1",
      text: "Someone wrote this just for you.\nTake your time.",
      durationHint: 6,
      audioPath: "/assets/voice/ll_c_s1.mp3",
    },
    {
      id: "ll_c_s2",
      text: "This was written slowly, with care.\nJust for you.\nThere's no rush.",
      durationHint: 7,
      audioPath: "/assets/voice/ll_c_s2.mp3",
    },
  ],
  ll_d: [
    {
      id: "ll_d_s1",
      text: "They felt it.\nSomeone read your words and felt something real.\nThat is rare.\nThat is you.",
      durationHint: 9,
      audioPath: "/assets/voice/ll_d_s1.mp3",
    },
    {
      id: "ll_d_s2",
      text: "They felt it.\nThat's everything.",
      durationHint: 5,
      audioPath: "/assets/voice/ll_d_s2.mp3",
    },
  ],
  ll_e: [
    {
      id: "ll_e_s1",
      text: "You wrote this.\nYou showed up for yourself.\nThat matters.",
      durationHint: 7,
      audioPath: "/assets/voice/ll_e_s1.mp3",
    },
    {
      id: "ll_e_s2",
      text: "You wrote to yourself when you needed it.\nYou were right —\nyou needed it today.",
      durationHint: 8,
      audioPath: "/assets/voice/ll_e_s2.mp3",
    },
    {
      id: "ll_e_s3",
      text: "You showed up for yourself.\nThat is the whole thing.",
      durationHint: 5,
      audioPath: "/assets/voice/ll_e_s3.mp3",
    },
  ],
  ll_f: [
    {
      id: "ll_f_s1",
      text: "A year ago you wrote something that needed to be said.\nIt found you again today.",
      durationHint: 8,
      audioPath: "/assets/voice/ll_f_s1.mp3",
    },
    {
      id: "ll_f_s2",
      text: "A year ago you wrote something.\nYou are not the same person who wrote it.\nBut you might still need to hear it.",
      durationHint: 9,
      audioPath: "/assets/voice/ll_f_s2.mp3",
    },
  ],
};

/**
 * Get a script for a love letter moment key with weekly rotation.
 */
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
  if (scripts.length === 1) return scripts[0];

  const records = getRotationRecord();
  const rotKey = `ll_${key}`;
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
