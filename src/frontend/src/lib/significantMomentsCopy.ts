// ─── Significant Moments Copy Templates ─────────────────────────────────────
// All 6 surface moment copy templates. Parameterized by signal data.
// Human language only — never metrics, never scores.

import type { StoredSignal } from "./significantMomentsEngine";

// ─── Date helpers ─────────────────────────────────────────────────────────────

export function relativeDate(timestampMs: number): string {
  const now = Date.now();
  const diffDays = Math.round((now - timestampMs) / 86400000);

  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return "a week ago";
  if (diffDays < 21) return "two weeks ago";
  if (diffDays < 35) return "a month ago";
  if (diffDays < 45) return "about a month ago";
  if (diffDays < 65) return "six weeks ago";
  if (diffDays < 100) return "two months ago";
  if (diffDays < 130) return "three months ago";
  if (diffDays < 200) return "four months ago";
  if (diffDays < 260) return "six months ago";
  if (diffDays < 400) return "about a year ago";
  return "over a year ago";
}

export function relativeDateWords(timestampMs: number): string {
  const now = Date.now();
  const diffDays = Math.round((now - timestampMs) / 86400000);

  if (diffDays === 7) return "seven days ago";
  if (diffDays <= 7) return `${diffDays} days ago`;
  if (diffDays <= 14) return "a week ago";
  if (diffDays <= 21) return "two weeks ago";
  if (diffDays <= 35) return "thirty days ago";
  if (diffDays <= 45) return "about a month ago";
  if (diffDays <= 65) return "six weeks ago";
  if (diffDays <= 100) return "two months ago";
  if (diffDays <= 130) return "three months ago";
  if (diffDays <= 200) return "four months ago";
  if (diffDays <= 260) return "six months ago";
  if (diffDays <= 370) return "one year ago";
  if (diffDays <= 400) return "one year ago today";
  return "over a year ago";
}

// ─── Surface 1: Significance Whisper ─────────────────────────────────────────

export function getWhisperCopy(signal: StoredSignal): string {
  const daysAgo = Math.round((Date.now() - signal.createdAt) / 86400000);

  switch (signal.signalType) {
    case "SIGNAL_FIRST_COMPLETE_DUMP":
      return "A week ago, you put something down here for the first time. Veil noticed.";

    case "SIGNAL_LETTER_SENT":
      return "Three days ago, you said something you had been carrying. That took something.";

    case "SIGNAL_ARC_FULL_COMPLETION":
      return "A month ago, you breathed through something difficult in here. It was harder than it looked.";

    case "SIGNAL_FIRST_INNER_CIRCLE_SHARE":
      return `The first time you let someone in — that was ${daysAgo} days ago. You came back since.`;

    case "SIGNAL_DEEP_JOURNAL_SESSION":
      return `Something you wrote ${daysAgo} days ago was one of the longest things you have ever put into words here. It is still here.`;

    case "SIGNAL_CRISIS_RESOLVED":
      return `Something shifted ${relativeDateWords(signal.createdAt)}. You came through it. Veil was watching.`;

    case "SIGNAL_TURNING_POINT_MARKED":
      return `${relativeDate(signal.createdAt).charAt(0).toUpperCase() + relativeDate(signal.createdAt).slice(1)}, you marked something as a turning point. You were right to.`;

    case "SIGNAL_POSITIVE_PEAK":
      return `Something you felt ${relativeDate(signal.createdAt)} is still alive in your journal. It is yours.`;

    default:
      return "Veil has been watching. Something you did matters.";
  }
}

// ─── Surface 2: Memory Mirror ─────────────────────────────────────────────────

export function getMemoryMirrorCopy(signal: StoredSignal): {
  label: string;
  body: string;
  date: string;
} {
  const label = "Veil noticed something";
  const ctx = signal.contextSnapshot;

  switch (signal.signalType) {
    case "SIGNAL_ARC_FULL_COMPLETION":
      return {
        label,
        body: "A month ago, you breathed through something that had been sitting on you. You completed all four phases. You went home lighter that day.",
        date: "— thirty days ago",
      };

    case "SIGNAL_POSITIVE_PEAK":
      return {
        label,
        body: "Ninety days ago, something significant happened — and you came here to hold it. You gave it the space it deserved.",
        date: "— three months ago",
      };

    case "SIGNAL_TURNING_POINT_MARKED":
      return {
        label,
        body: "One year ago today, you marked something as a Turning Point. You knew, in that moment, that it mattered. You were right.",
        date: "— one year ago today",
      };

    case "SIGNAL_CRISIS_RESOLVED": {
      const carryDays = (ctx.carryDays as number) ?? 7;
      return {
        label,
        body: `There was a period — you carried something for ${carryDays} days. And then you put it down. And you kept going. That was not nothing.`,
        date: `— ${relativeDate(signal.createdAt)}`,
      };
    }

    default:
      return {
        label,
        body: `Something you did ${relativeDate(signal.createdAt)} was significant. You showed up. You kept going.`,
        date: `— ${relativeDateWords(signal.createdAt)}`,
      };
  }
}

// ─── Surface 3: Return Letter ─────────────────────────────────────────────────

export function getReturnLetterCopy(signal: StoredSignal): {
  label: string;
  body: string;
  date: string;
} {
  const label = "From a moment you have already survived";
  const ctx = signal.contextSnapshot;

  switch (signal.signalType) {
    case "SIGNAL_CRISIS_RESOLVED": {
      const carryDays = (ctx.carryDays as number) ?? 7;
      const monthsAgo = Math.round(
        (Date.now() - signal.createdAt) / (30 * 86400000),
      );
      const timeStr =
        monthsAgo >= 2
          ? `${monthsAgo} months ago`
          : relativeDate(signal.createdAt);
      return {
        label,
        body: `${timeStr.charAt(0).toUpperCase() + timeStr.slice(1)}, you carried something for ${carryDays} days. It felt like it would not end. It ended. You were there when it did. You are here now. That is the same person.`,
        date: `— ${relativeDate(signal.createdAt)}`,
      };
    }

    case "SIGNAL_ARC_FULL_COMPLETION": {
      const daysAgo = Math.round((Date.now() - signal.createdAt) / 86400000);
      return {
        label,
        body: `You have breathed through something difficult in here before. ${daysAgo} days ago, you went through all four phases. You went home lighter. What you did then — you can do again.`,
        date: `— ${relativeDate(signal.createdAt)}`,
      };
    }

    case "SIGNAL_LONG_CARRY_BROKEN": {
      const carryDays = (ctx.carryDays as number) ?? 5;
      return {
        label,
        body: `There was a time you carried this exact weight — or something close — for ${carryDays} days. And then it shifted. Not because the situation changed. Because you put it down. Here. In this place.`,
        date: `— ${relativeDate(signal.createdAt)}`,
      };
    }

    default:
      return {
        label,
        body: `${relativeDate(signal.createdAt).charAt(0).toUpperCase() + relativeDate(signal.createdAt).slice(1)}, you came through something. You are still here. That matters.`,
        date: `— ${relativeDateWords(signal.createdAt)}`,
      };
  }
}
