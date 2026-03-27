// ─── Veil Emotional Feedback System v2.0 ─────────────────────────────────────
// Centralized copy library for all feedback moments.
// Never clinical. Never prescriptive. Never evaluative.
// Always warm. Always acknowledging. Always honest.

export const CHECK_IN_FEEDBACK: Record<string, string[]> = {
  stressed: ["That sounds like a lot", "to be carrying.", "Veil has it now."],
  sad: ["Sadness is real.", "It makes sense that", "you are feeling this."],
  anxious: [
    "Uncertainty is exhausting.",
    "You brought it here.",
    "That took something.",
  ],
  frustrated: [
    "That frustration is telling you",
    "something matters.",
    "Veil heard it.",
  ],
  lonely: ["You reached out.", "You are not alone", "with this anymore."],
  numb: [
    "Sometimes the absence of feeling",
    "is its own kind of weight.",
    "You showed up anyway.",
  ],
  grateful: [
    "Something good is alive",
    "in you right now.",
    "Let it be fully felt.",
  ],
  calm: ["This feeling is worth", "staying in.", "Veil is here with you."],
  hopeful: ["Something is possible", "for you right now.", "Hold onto that."],
  reflective: [
    "You are sitting with something.",
    "Not rushing to an answer.",
    "That is its own wisdom.",
  ],
  custom: ["Whatever this is —", "you named it.", "Naming things matters."],
};

export const COMPANION_FEEDBACK = {
  text_dump: ["Veil has it now.", "You can breathe."],
  silent_dump: ["You showed up.", "That was enough."],
  voice_dump: ["Veil heard every word.", "Every breath. All of it."],
};

export const WRITE_FEEDBACK = {
  apology_sent: [
    "You said something",
    "that took courage.",
    "Whatever comes next —",
    "you showed up.",
  ],
  apology_kept: [
    "You wrote it.",
    "Sometimes that is enough.",
    "It is safe here.",
  ],
  love_letter_sent: [
    "You chose someone —",
    "and you told them.",
    "Not everyone does that.",
  ],
  love_letter_kept: [
    "You wrote something beautiful.",
    "It is safe here —",
    "whenever you are ready.",
  ],
  self_love: [
    "You wrote to yourself today.",
    "That takes a kind of courage",
    "most people never find.",
  ],
  confession_universe: [
    "It is released.",
    "Into something greater",
    "than this moment.",
    "You carried it long enough.",
  ],
  confession_private: [
    "It is safe here.",
    "Named. Held. Yours.",
    "No one else will ever see this.",
  ],
  confession_witness: [
    "Someone will hold this",
    "with you.",
    "They will never know it is you.",
    "But they will know",
    "what you carried.",
  ],
  journal_positive: [
    "You captured something",
    "worth keeping.",
    "It lives here now.",
  ],
  journal_negative: [
    "You named something real.",
    "Naming things",
    "takes away some of their power.",
  ],
};

export const ARC_FEEDBACK = {
  one_true_thing: ["You said something true.", "Hold onto that."],
  agency_anchor: ["That is yours.", "You chose it.", "You can do it."],
};

export type FeedbackBackground =
  | "default"
  | "purple-aura"
  | "warm-gold"
  | "dark";
