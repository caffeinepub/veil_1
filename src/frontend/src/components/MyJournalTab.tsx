// ─── My Journal Tab ──────────────────────────────────────────────────────────────
// The crown jewel of Veil — a full-screen private emotional diary
// designed to feel like holding a real leather-bound book.

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import {
  AlignLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Heart,
  Play,
  Search,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type {
  ApologyEntry,
  CompanionDump,
  EmotionEntry,
  JournalEntry,
  UserProfile,
} from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  type AllJournalData,
  EMOTION_AURA_COLORS,
  type JournalPage,
  buildJournalPages,
  checkMilestones,
  generateMonthlyLetter,
} from "../lib/journalData";
import {
  type SignatureResult,
  generateSignature,
} from "../lib/signatureGenerator";
import SeasonalNavigator from "./SeasonalNavigator";

// ─── Types ─────────────────────────────────────────────────────────────────────

type JournalView =
  | "cover"
  | "signature_reveal"
  | "pages"
  | "settings"
  | "empty"
  | "seasonal_navigator";

interface JournalSettings {
  font: "playfair" | "garamond" | "eb-garamond" | "baskerville";
  fontSize: number;
  pageTurnSound: boolean;
  emotionColors: boolean;
  journalLock: boolean;
  journalPin: string;
  screenshotWarning: boolean;
  onThisDay: boolean;
  monthlyLetter: boolean;
  milestonePages: boolean;
  hemisphere: "NORTHERN" | "SOUTHERN" | "AUTO";
}

const DEFAULT_SETTINGS: JournalSettings = {
  font: "playfair",
  fontSize: 17,
  pageTurnSound: false,
  emotionColors: true,
  journalLock: false,
  journalPin: "",
  screenshotWarning: true,
  onThisDay: true,
  monthlyLetter: true,
  milestonePages: true,
  hemisphere: "AUTO",
};

const SETTINGS_KEY = "veil-journal-settings";
const SIG_SEEN_KEY = "veil-journal-signature-seen";

function loadSettings(): JournalSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    /* */
  }
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(s: JournalSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* */
  }
}

const FONT_MAP: Record<JournalSettings["font"], string> = {
  playfair: '"Playfair Display", Georgia, serif',
  garamond: '"Cormorant Garamond", Garamond, Georgia, serif',
  "eb-garamond": '"EB Garamond", Garamond, Georgia, serif',
  baskerville: '"Libre Baskerville", Baskerville, Georgia, serif',
};

// ─── Ornamental SVG Elements ─────────────────────────────────────────────────

function OrnamentalDivider({
  color = "#A08060",
  opacity = 0.5,
}: { color?: string; opacity?: number }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 200 12"
      className="w-full"
      style={{ maxWidth: 280, opacity }}
    >
      <line x1="0" y1="6" x2="80" y2="6" stroke={color} strokeWidth="0.5" />
      <path
        d="M90,6 Q95,2 100,6 Q105,10 110,6"
        stroke={color}
        strokeWidth="0.8"
        fill="none"
      />
      <line x1="120" y1="6" x2="200" y2="6" stroke={color} strokeWidth="0.5" />
      <circle cx="100" cy="6" r="1.5" fill={color} />
      <circle cx="88" cy="6" r="1" fill={color} />
      <circle cx="112" cy="6" r="1" fill={color} />
    </svg>
  );
}

function MilestoneBorder({ color = "#E8C880" }: { color?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 320 480"
      className="absolute inset-0 w-full h-full pointer-events-none"
      preserveAspectRatio="none"
    >
      <rect
        x="8"
        y="8"
        width="304"
        height="464"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeDasharray="6 3"
        opacity="0.6"
      />
      <rect
        x="16"
        y="16"
        width="288"
        height="448"
        fill="none"
        stroke={color}
        strokeWidth="0.5"
        opacity="0.3"
      />
      {/* Corner flourishes */}
      <path
        d="M8,28 Q8,8 28,8"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        opacity="0.8"
      />
      <path
        d="M292,8 Q312,8 312,28"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        opacity="0.8"
      />
      <path
        d="M8,452 Q8,472 28,472"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        opacity="0.8"
      />
      <path
        d="M292,472 Q312,472 312,452"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        opacity="0.8"
      />
    </svg>
  );
}

// ─── Signature SVG Component ───────────────────────────────────────────────

interface SignatureSvgProps {
  sig: SignatureResult;
  color?: string;
  width?: number;
  animate?: boolean;
}

function SignatureSvg({
  sig,
  color = "#E8C880",
  width = 180,
  animate = false,
}: SignatureSvgProps) {
  const scale = width / sig.width;
  const h = sig.height * scale;
  const ref = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (!animate || !ref.current) return;
    const path = ref.current;
    const len = path.getTotalLength?.() ?? sig.pathLength;
    path.style.strokeDasharray = `${len}`;
    path.style.strokeDashoffset = `${len}`;
    path.style.transition = "none";
    // Force reflow
    void path.getBoundingClientRect();
    path.style.transition = "stroke-dashoffset 2.5s ease-in-out";
    path.style.strokeDashoffset = "0";
  }, [animate, sig.pathLength]);

  return (
    <svg
      role="img"
      aria-label="Personal signature"
      viewBox={sig.viewBox}
      width={width}
      height={h}
      style={{ overflow: "visible" }}
    >
      <path
        ref={ref}
        d={sig.svgPath}
        fill="none"
        stroke={color}
        strokeWidth={1.8 / scale}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={
          animate
            ? {
                strokeDasharray: sig.pathLength,
                strokeDashoffset: sig.pathLength,
              }
            : undefined
        }
      />
    </svg>
  );
}

// ─── Page Content Renderer ───────────────────────────────────────────────────

interface PageContentProps {
  page: JournalPage;
  sig: SignatureResult;
  fontFamily: string;
  fontSize: number;
}

function PageContent({ page, sig, fontFamily, fontSize }: PageContentProps) {
  const bodyStyle: React.CSSProperties = {
    fontFamily,
    fontSize,
    lineHeight: 1.85,
    color: "#2A1A0A",
  };
  const italicMuted: React.CSSProperties = {
    ...bodyStyle,
    fontStyle: "italic",
    opacity: 0.65,
    fontSize: fontSize * 0.88,
  };

  switch (page.pageType) {
    case "EMOTION_CHECKIN": {
      return (
        <div className="flex flex-col items-center pt-8 px-6 gap-4">
          {page.emoji && (
            <span style={{ fontSize: 52, lineHeight: 1 }}>{page.emoji}</span>
          )}
          <p
            style={{
              ...bodyStyle,
              fontSize: fontSize * 1.4,
              textAlign: "center",
              fontWeight: 600,
            }}
          >
            {page.emotionType.charAt(0).toUpperCase() +
              page.emotionType.slice(1).replace(/_/g, " ")}
          </p>
          {page.content && (
            <p style={{ ...bodyStyle, textAlign: "center", marginTop: 8 }}>
              {page.content}
            </p>
          )}
        </div>
      );
    }

    case "COMPANION_DUMP_VOICE": {
      const mins = page.voiceDurationSeconds
        ? Math.ceil(page.voiceDurationSeconds / 60)
        : 1;
      return (
        <div className="flex flex-col items-center justify-center h-full gap-6 px-8">
          <p
            style={{
              ...bodyStyle,
              textAlign: "center",
              fontSize: fontSize * 1.1,
            }}
          >
            You spoke to Veil for {mins} {mins === 1 ? "minute" : "minutes"}.
          </p>
          <p style={italicMuted}>
            Your words were released.
            <br />
            What you carried that day is no longer yours to hold.
          </p>
        </div>
      );
    }

    case "COMPANION_DUMP_SILENT": {
      return (
        <div className="flex items-center justify-center h-full">
          <p
            style={{
              ...bodyStyle,
              fontSize: fontSize * 1.8,
              textAlign: "center",
              fontWeight: 600,
            }}
          >
            You showed up.
          </p>
        </div>
      );
    }

    case "COMPANION_DUMP_TEXT": {
      return (
        <div className="px-6 pt-4">
          <p style={bodyStyle} className="whitespace-pre-wrap">
            {page.content}
          </p>
        </div>
      );
    }

    case "JOURNAL_ENTRY": {
      const parts = page.content.split("\n\n");
      const title = parts.length > 1 ? parts[0] : null;
      const body = title ? parts.slice(1).join("\n\n") : page.content;
      return (
        <div className="px-6 pt-4">
          {title && (
            <p
              style={{
                ...bodyStyle,
                fontSize: fontSize * 1.2,
                fontWeight: 600,
                marginBottom: 16,
              }}
            >
              {title}
            </p>
          )}
          <p style={bodyStyle} className="whitespace-pre-wrap">
            {body}
          </p>
        </div>
      );
    }

    case "LOVE_LETTER":
    case "CAPTURED_JOY_WRITTEN": {
      const isJoy = page.pageType === "CAPTURED_JOY_WRITTEN";
      return (
        <div className="px-6 pt-4 pb-16 flex flex-col h-full">
          <p style={{ ...italicMuted, textAlign: "center", marginBottom: 20 }}>
            {isJoy
              ? "To my future self"
              : page.letterType
                ? "A letter of love"
                : "A love letter"}
          </p>
          <p style={bodyStyle} className="whitespace-pre-wrap flex-1">
            {page.content}
          </p>
          <div className="mt-auto pt-4 flex justify-end">
            <SignatureSvg sig={sig} color="#2C3E6B" width={120} />
          </div>
        </div>
      );
    }

    case "APOLOGY": {
      const statusMap: Record<string, string> = {
        sent: "Sent",
        unsent: "Kept private",
        SENT: "Sent",
        UNSENT: "Kept private",
        ACKNOWLEDGED: "Received",
      };
      const statusLabel =
        statusMap[page.deliveryStatus ?? ""] ?? "Kept private";
      return (
        <div className="px-6 pt-4 pb-16 flex flex-col h-full">
          <p style={{ ...italicMuted, textAlign: "center", marginBottom: 20 }}>
            From someone who regrets
          </p>
          <p style={bodyStyle} className="whitespace-pre-wrap flex-1">
            {page.content}
          </p>
          <p
            style={{ ...italicMuted, fontSize: fontSize * 0.78, marginTop: 16 }}
          >
            {statusLabel}
          </p>
        </div>
      );
    }

    case "CONFESSION": {
      const modeMap: Record<string, string> = {
        UNIVERSE: "Said to the universe",
        PRIVATE: "Kept between me and Veil",
        WITNESS: "One person held this",
      };
      const modeLabel =
        modeMap[page.confessionMode ?? "PRIVATE"] ?? "Kept between me and Veil";
      return (
        <div className="px-6 pt-4">
          <p style={{ ...italicMuted, textAlign: "center", marginBottom: 20 }}>
            {modeLabel}
          </p>
          <p style={bodyStyle} className="whitespace-pre-wrap">
            {page.content}
          </p>
        </div>
      );
    }

    case "CAPTURED_JOY_VOICE": {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-5 px-8">
          <p
            style={{
              ...bodyStyle,
              textAlign: "center",
              fontSize: fontSize * 1.05,
            }}
          >
            You spoke your joy into existence on this day.
          </p>
          <p style={italicMuted}>
            {page.dateFormatted} · {page.emotionType.replace(/_/g, " ")}
          </p>
          <p style={italicMuted}>
            The voice note is yours — to hear when you need it.
          </p>
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(232,200,128,0.2)",
              border: "1.5px solid rgba(232,200,128,0.5)",
            }}
          >
            <Play size={18} style={{ color: "#A08060" }} />
          </div>
        </div>
      );
    }

    case "ONE_TRUE_THING": {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 px-8">
          <p style={italicMuted}>Something true about me</p>
          <p
            style={{
              ...bodyStyle,
              fontSize: fontSize * 1.25,
              textAlign: "center",
              fontWeight: 600,
            }}
          >
            {page.content}
          </p>
          <p style={italicMuted}>
            Written on {page.dateFormatted}
            <br />
            during a hard moment.
          </p>
        </div>
      );
    }

    case "AGENCY_ANCHOR": {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 px-8">
          <p style={italicMuted}>What I chose</p>
          <p
            style={{
              ...bodyStyle,
              fontSize: fontSize * 1.25,
              textAlign: "center",
              fontWeight: 600,
            }}
          >
            {page.content}
          </p>
        </div>
      );
    }

    case "MILESTONE_PAGE": {
      return (
        <div className="relative flex items-center justify-center h-full">
          <MilestoneBorder />
          <div className="px-10 flex flex-col items-center gap-6 z-10">
            <p
              style={{
                fontFamily,
                fontSize: fontSize * 1.2,
                color: "#E8C880",
                textAlign: "center",
                lineHeight: 1.9,
                fontWeight: 600,
                whiteSpace: "pre-line",
              }}
            >
              {page.content}
            </p>
            <SignatureSvg sig={sig} color="#E8C880" width={160} />
          </div>
        </div>
      );
    }

    case "MONTHLY_LETTER": {
      return (
        <div className="px-6 pt-4 pb-16 flex flex-col h-full">
          <p
            style={{
              fontFamily,
              fontSize: fontSize * 0.82,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#A08060",
              textAlign: "center",
              marginBottom: 24,
            }}
          >
            Veil
          </p>
          <p style={{ ...bodyStyle, whiteSpace: "pre-line", flex: 1 }}>
            {page.content}
          </p>
        </div>
      );
    }

    default:
      return (
        <div className="px-6 pt-4">
          <p style={bodyStyle} className="whitespace-pre-wrap">
            {page.content}
          </p>
        </div>
      );
  }
}

// ─── Journal Book Pages View ──────────────────────────────────────────────────

interface JournalBookProps {
  pages: JournalPage[];
  currentIndex: number;
  onNavigate: (idx: number) => void;
  direction: number;
  settings: JournalSettings;
  sig: SignatureResult;
  reduceMotion: boolean;
  onOpenTOC: () => void;
  onOpenSearch: () => void;
  onBack: () => void;
}

function JournalBook({
  pages,
  currentIndex,
  onNavigate,
  direction,
  settings,
  sig,
  reduceMotion,
  onOpenTOC,
  onOpenSearch,
  onBack,
}: JournalBookProps) {
  const page = pages[currentIndex];
  const touchStartX = useRef<number | null>(null);
  const [showSpine, setShowSpine] = useState(false);
  const spineRef = useRef<HTMLDivElement>(null);
  const [onThisDay, setOnThisDay] = useState<JournalPage | null>(null);
  const [onThisDayDismissed, setOnThisDayDismissed] = useState(false);

  const fontFamily = FONT_MAP[settings.font];
  const fontSize = settings.fontSize;

  // On-This-Day check
  useEffect(() => {
    if (!settings.onThisDay) return;
    const today = new Date();
    const match = pages.find((p) => {
      const pd = p.date;
      return (
        pd.getMonth() === today.getMonth() &&
        pd.getDate() === today.getDate() &&
        pd.getFullYear() < today.getFullYear()
      );
    });
    if (match) setOnThisDay(match);
  }, [pages, settings.onThisDay]);

  const goNext = useCallback(() => {
    if (currentIndex < pages.length - 1) onNavigate(currentIndex + 1);
  }, [currentIndex, pages.length, onNavigate]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) onNavigate(currentIndex - 1);
  }, [currentIndex, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev]);

  // Touch/swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) dx < 0 ? goNext() : goPrev();
    touchStartX.current = null;
  };

  const auraColor = settings.emotionColors
    ? (EMOTION_AURA_COLORS[page?.emotionType ?? "default"] ??
      EMOTION_AURA_COLORS.default)
    : "#E8E0D8";

  const pageVariants = {
    initial: (d: number) => ({
      x: reduceMotion ? 0 : d > 0 ? "100%" : "-100%",
      opacity: reduceMotion ? 0 : 1,
    }),
    animate: { x: 0, opacity: 1 },
    exit: (d: number) => ({
      x: reduceMotion ? 0 : d > 0 ? "-100%" : "100%",
      opacity: reduceMotion ? 0 : 1,
    }),
  };

  if (!page) return null;

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      data-ocid="journal.pages.panel"
    >
      {/* On This Day banner */}
      <AnimatePresence>
        {onThisDay && !onThisDayDismissed && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-2.5"
            style={{
              background: "rgba(232,200,128,0.18)",
              backdropFilter: "blur(8px)",
              borderBottom: "1px solid rgba(232,200,128,0.3)",
            }}
          >
            <div className="flex-1">
              <p
                className="text-xs"
                style={{ fontFamily, color: "#6B4C1A", fontStyle: "italic" }}
              >
                On this day last year —
              </p>
              <p
                className="text-xs mt-0.5 line-clamp-1"
                style={{ fontFamily, color: "#6B4C1A" }}
              >
                {onThisDay.contentPreview}
              </p>
            </div>
            <button
              type="button"
              className="ml-3 text-xs underline"
              style={{ color: "#A08060", fontFamily }}
              onClick={() => onNavigate(pages.indexOf(onThisDay))}
            >
              Read →
            </button>
            <button
              type="button"
              onClick={() => setOnThisDayDismissed(true)}
              className="ml-2 p-1"
              aria-label="Dismiss"
            >
              <X size={14} style={{ color: "#A08060" }} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The page itself */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={page.id}
          custom={direction}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.28, ease: "easeInOut" }}
          aria-label={`Journal page ${page.pageNumber}, ${page.dateFormatted}`}
          className="absolute inset-0 flex flex-col"
          style={{ background: "#FAF7F2" }}
        >
          {/* Emotion aura tint */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: auraColor, opacity: 0.08 }}
          />

          {/* Paper texture */}
          <svg
            aria-hidden="true"
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ opacity: 0.025 }}
          >
            <filter id="paper-j">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.65"
                numOctaves="3"
                stitchTiles="stitch"
              />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#paper-j)" />
          </svg>

          {/* Page header */}
          <div className="relative z-10 px-6 pt-12 flex items-center justify-between">
            <p
              style={{
                fontFamily,
                fontSize: 12,
                color: auraColor,
                opacity: 0.8,
              }}
            >
              {page.dateFormatted}
            </p>
            {/* TOC trigger — center of header */}
            <button
              type="button"
              onClick={onOpenTOC}
              className="absolute left-1/2 -translate-x-1/2 top-3 w-8 h-8 flex items-center justify-center"
              aria-label="Open table of contents"
              data-ocid="journal.toc.open_modal_button"
            >
              <div className="flex flex-col gap-1">
                <div
                  className="w-4 h-px"
                  style={{ background: auraColor, opacity: 0.5 }}
                />
                <div
                  className="w-3 h-px"
                  style={{ background: auraColor, opacity: 0.3 }}
                />
              </div>
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenSearch}
                className="w-8 h-8 flex items-center justify-center"
                aria-label="Search journal"
                data-ocid="journal.search.open_modal_button"
              >
                <Search size={14} style={{ color: auraColor, opacity: 0.7 }} />
              </button>
              <p
                style={{
                  fontFamily,
                  fontSize: 12,
                  color: auraColor,
                  opacity: 0.8,
                }}
              >
                {page.pageNumber}
              </p>
            </div>
          </div>

          {/* Ornamental header line */}
          <div className="px-6 mt-2 z-10 relative flex justify-center">
            <OrnamentalDivider color={auraColor} opacity={0.4} />
          </div>

          {/* Page type indicator */}
          <div className="px-6 mt-3 z-10 relative">
            <p
              style={{
                fontFamily,
                fontSize: 12,
                color: auraColor,
                opacity: 0.75,
                fontStyle: "italic",
              }}
            >
              {page.pageTypeEmoji} {page.pageTypeLabel}
            </p>
          </div>

          {/* Content area */}
          <div
            className="flex-1 overflow-y-auto relative z-10"
            style={{ paddingBottom: 96 }}
          >
            <PageContent
              page={page}
              sig={sig}
              fontFamily={fontFamily}
              fontSize={fontSize}
            />
          </div>

          {/* Page footer */}
          <div
            className="absolute bottom-0 left-0 right-0 z-10 px-6 py-4 flex items-center justify-between"
            style={{ borderTop: `1px solid ${auraColor}22` }}
          >
            <OrnamentalDivider color={auraColor} opacity={0.3} />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-3">
              <SignatureSvg sig={sig} color={auraColor} width={80} />
            </div>
            <span
              className="absolute right-6 bottom-4"
              style={{
                fontFamily,
                fontSize: 11,
                color: auraColor,
                opacity: 0.6,
              }}
            >
              {page.pageNumber}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Back to cover button */}
      <button
        type="button"
        onClick={onBack}
        className="absolute top-3 left-4 z-20 w-8 h-8 flex items-center justify-center"
        aria-label="Back to journal cover"
      >
        <BookOpen size={16} style={{ color: "#A08060" }} />
      </button>

      {/* Navigation arrows */}
      <button
        type="button"
        onClick={goPrev}
        disabled={currentIndex === 0}
        className="absolute left-2 bottom-1/2 translate-y-1/2 z-20 w-11 h-11 flex items-center justify-center disabled:opacity-20"
        aria-label="Previous page"
        data-ocid="journal.pagination_prev"
      >
        <ChevronLeft size={22} style={{ color: "#A08060" }} />
      </button>
      <button
        type="button"
        onClick={goNext}
        disabled={currentIndex === pages.length - 1}
        className="absolute right-2 bottom-1/2 translate-y-1/2 z-20 w-11 h-11 flex items-center justify-center disabled:opacity-20"
        aria-label="Next page"
        data-ocid="journal.pagination_next"
      >
        <ChevronRight size={22} style={{ color: "#A08060" }} />
      </button>

      {/* Spine handle */}
      <button
        type="button"
        className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-5 h-20 flex items-center justify-center"
        onClick={() => setShowSpine(true)}
        style={{
          background: "rgba(160,128,96,0.12)",
          borderRadius: "4px 0 0 4px",
        }}
        aria-label="Open timeline spine"
        data-ocid="journal.spine.toggle"
      >
        <div
          className="w-0.5 h-10 rounded-full"
          style={{ background: "#A08060", opacity: 0.5 }}
        />
      </button>

      {/* Timeline Spine */}
      <AnimatePresence>
        {showSpine && (
          <motion.div
            ref={spineRef}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-0 bottom-0 z-30 flex flex-col"
            style={{
              width: 52,
              background: "rgba(250,247,242,0.97)",
              borderLeft: "1px solid rgba(160,128,96,0.2)",
              boxShadow: "-4px 0 12px rgba(0,0,0,0.08)",
            }}
          >
            <div className="flex items-center justify-between px-2 pt-4 pb-2">
              <span
                style={{
                  fontFamily,
                  fontSize: 9,
                  color: "#A08060",
                  writingMode: "vertical-rl",
                  transform: "rotate(180deg)",
                }}
              >
                PAGES
              </span>
              <button
                type="button"
                onClick={() => setShowSpine(false)}
                className="p-1"
                aria-label="Close spine"
              >
                <X size={12} style={{ color: "#A08060" }} />
              </button>
            </div>
            <ScrollArea className="flex-1">
              <div className="flex flex-col items-center gap-1 py-2 px-2">
                {pages.map((p, i) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => {
                      onNavigate(i);
                      setShowSpine(false);
                    }}
                    className="flex flex-col items-center gap-0.5"
                    aria-label={`Go to page ${p.pageNumber}`}
                  >
                    <div
                      className="rounded-full transition-all"
                      style={{
                        width: i === currentIndex ? 10 : 6,
                        height: i === currentIndex ? 10 : 6,
                        background:
                          EMOTION_AURA_COLORS[p.emotionType] ??
                          EMOTION_AURA_COLORS.default,
                        opacity: i === currentIndex ? 1 : 0.6,
                        border:
                          i === currentIndex ? "1.5px solid #A08060" : "none",
                      }}
                    />
                    {i % 10 === 0 && (
                      <span
                        style={{
                          fontFamily,
                          fontSize: 7,
                          color: "#A08060",
                          opacity: 0.6,
                        }}
                      >
                        {p.date.getFullYear()}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Table of Contents Sheet ──────────────────────────────────────────────────

interface TOCSheetProps {
  open: boolean;
  onClose: () => void;
  pages: JournalPage[];
  onNavigate: (idx: number) => void;
  currentIndex: number;
  sig: SignatureResult;
  fontFamily: string;
  userName: string;
}

type TOCGroup = {
  label: string;
  pages: Array<{ page: JournalPage; index: number }>;
};

function TOCSheet({
  open,
  onClose,
  pages,
  onNavigate,
  currentIndex,
  sig,
  fontFamily,
  userName,
}: TOCSheetProps) {
  const [showHowFar, setShowHowFar] = useState(false);

  function groupByTime(): TOCGroup[] {
    const now = new Date();
    const groups: Record<
      string,
      Array<{ page: JournalPage; index: number }>
    > = {};
    for (let i = 0; i < pages.length; i++) {
      const p = pages[i];
      const diff = now.getTime() - p.date.getTime();
      const days = diff / (1000 * 60 * 60 * 24);
      let key: string;
      if (days < 7) key = "This week";
      else if (days < 30) key = "This month";
      else {
        const my = p.date.toLocaleString("en-US", {
          month: "long",
          year: "numeric",
        });
        key = my;
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push({ page: p, index: i });
    }
    return Object.entries(groups).map(([label, pgs]) => ({
      label,
      pages: pgs,
    }));
  }

  function groupByEmotion(): TOCGroup[] {
    const groups: Record<
      string,
      Array<{ page: JournalPage; index: number }>
    > = {};
    for (let i = 0; i < pages.length; i++) {
      const p = pages[i];
      const key =
        p.emotionType.charAt(0).toUpperCase() +
        p.emotionType.slice(1).replace(/_/g, " ");
      if (!groups[key]) groups[key] = [];
      groups[key].push({ page: p, index: i });
    }
    return Object.entries(groups)
      .sort((a, b) => b[1].length - a[1].length)
      .map(([label, pgs]) => ({ label, pages: pgs }));
  }

  function groupByType(): TOCGroup[] {
    const groups: Record<
      string,
      Array<{ page: JournalPage; index: number }>
    > = {};
    for (let i = 0; i < pages.length; i++) {
      const p = pages[i];
      const key = p.pageTypeLabel;
      if (!groups[key]) groups[key] = [];
      groups[key].push({ page: p, index: i });
    }
    return Object.entries(groups).map(([label, pgs]) => ({
      label,
      pages: pgs,
    }));
  }

  const visibilityEmoji: Record<string, string> = {
    ONLY_ME: "🔒",
    INNER_CIRCLE: "👥",
    FRIENDS: "🌿",
    GLOBAL: "🌐",
  };

  function renderGroup(group: TOCGroup, gIdx: number) {
    return (
      <div key={gIdx} className="mb-5">
        <p
          className="text-xs mb-2 px-1"
          style={{
            fontFamily,
            color: "#A08060",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {group.label}
        </p>
        {group.pages.map(({ page, index }) => (
          <button
            type="button"
            key={page.id}
            className="w-full flex items-center gap-3 py-2 px-3 rounded-lg text-left hover:bg-[#F5EFE4] transition-colors"
            onClick={() => {
              onNavigate(index);
              onClose();
            }}
            style={{
              background: index === currentIndex ? "#F5EFE4" : "transparent",
            }}
          >
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{
                background:
                  EMOTION_AURA_COLORS[page.emotionType] ??
                  EMOTION_AURA_COLORS.default,
              }}
            />
            <div className="flex-1 min-w-0">
              <p
                className="text-xs truncate"
                style={{ fontFamily, color: "#2A1A0A" }}
              >
                {page.contentPreview || page.pageTypeLabel}
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ fontFamily, color: "#A08060", fontSize: 10 }}
              >
                {page.date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <span className="text-xs flex-shrink-0" style={{ opacity: 0.5 }}>
              {visibilityEmoji[page.visibility ?? "ONLY_ME"] ?? "🔒"}
            </span>
          </button>
        ))}
      </div>
    );
  }

  // How Far I've Come overlay
  if (showHowFar) {
    const byMonth: Record<string, number> = {};
    for (const p of pages) {
      const k = `${p.date.getFullYear()}-${String(p.date.getMonth() + 1).padStart(2, "0")}`;
      byMonth[k] = (byMonth[k] ?? 0) + 1;
    }
    const monthKeys = Object.keys(byMonth).sort();
    const maxCount = Math.max(...Object.values(byMonth), 1);
    const positiveMonths = pages.filter((p) =>
      ["grateful", "hopeful", "calm", "captured_joy"].includes(p.emotionType),
    ).length;
    const dominantEmotion = (() => {
      const counts: Record<string, number> = {};
      for (const p of pages) {
        counts[p.emotionType] = (counts[p.emotionType] ?? 0) + 1;
      }
      return (
        Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ??
        "something"
      );
    })();

    return (
      <div
        className="fixed inset-0 z-50 flex flex-col"
        style={{ background: "#FAF7F2" }}
      >
        {/* Paper texture */}
        <svg
          aria-hidden="true"
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ opacity: 0.025 }}
        >
          <filter id="paper-hf">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65"
              numOctaves="3"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#paper-hf)" />
        </svg>

        <div className="relative z-10 px-6 pt-12 pb-4 flex items-center justify-between">
          <h2
            style={{
              fontFamily,
              fontSize: 22,
              color: "#2A1A0A",
              fontWeight: 600,
            }}
          >
            How Far You Have Come
          </h2>
          <button
            type="button"
            onClick={() => setShowHowFar(false)}
            className="w-10 h-10 flex items-center justify-center"
          >
            <X size={20} style={{ color: "#A08060" }} />
          </button>
        </div>
        <div className="flex justify-center px-6 mb-4 relative z-10">
          <OrnamentalDivider color="#A08060" opacity={0.4} />
        </div>

        <ScrollArea className="flex-1 relative z-10">
          <div className="px-6 pb-10">
            {/* Activity graph */}
            {monthKeys.length > 0 && (
              <div className="mb-8">
                <p
                  style={{
                    fontFamily,
                    fontSize: 12,
                    color: "#A08060",
                    fontStyle: "italic",
                    marginBottom: 12,
                  }}
                >
                  Your pages, month by month
                </p>
                <svg
                  aria-hidden="true"
                  viewBox={`0 0 ${monthKeys.length * 24} 60`}
                  className="w-full"
                  style={{ maxHeight: 80 }}
                >
                  {monthKeys.map((k, i) => {
                    const count = byMonth[k] ?? 0;
                    const barH = (count / maxCount) * 50;
                    return (
                      <rect
                        key={k}
                        x={i * 24}
                        y={60 - barH}
                        width={18}
                        height={barH}
                        rx="3"
                        fill="#E8C880"
                        opacity="0.6"
                      />
                    );
                  })}
                </svg>
              </div>
            )}

            {/* Observations */}
            <div className="space-y-6">
              <div
                className="pl-4"
                style={{ borderLeft: "2px solid rgba(232,200,128,0.4)" }}
              >
                <p
                  style={{
                    fontFamily,
                    fontSize: 14,
                    color: "#2A1A0A",
                    lineHeight: 1.9,
                    fontStyle: "italic",
                  }}
                >
                  “You have written about{" "}
                  <strong style={{ fontStyle: "normal" }}>
                    {dominantEmotion.replace(/_/g, " ")}
                  </strong>{" "}
                  more than anything else. That tells you something about what
                  matters to you.”
                </p>
              </div>
              {positiveMonths > 0 && (
                <div
                  className="pl-4"
                  style={{ borderLeft: "2px solid rgba(168,216,184,0.5)" }}
                >
                  <p
                    style={{
                      fontFamily,
                      fontSize: 14,
                      color: "#2A1A0A",
                      lineHeight: 1.9,
                      fontStyle: "italic",
                    }}
                  >
                    “You have captured{" "}
                    <strong style={{ fontStyle: "normal" }}>
                      {positiveMonths} moments of light
                    </strong>
                    . They are stored here, waiting for you.”
                  </p>
                </div>
              )}
              <div
                className="pl-4"
                style={{ borderLeft: "2px solid rgba(195,184,216,0.5)" }}
              >
                <p
                  style={{
                    fontFamily,
                    fontSize: 14,
                    color: "#2A1A0A",
                    lineHeight: 1.9,
                    fontStyle: "italic",
                  }}
                >
                  “You brought{" "}
                  <strong style={{ fontStyle: "normal" }}>
                    {pages.length} things
                  </strong>{" "}
                  to these pages. Every one of them was real. Every one of them
                  was yours.”
                </p>
              </div>
            </div>

            <div className="mt-10 flex flex-col items-center gap-3">
              <SignatureSvg sig={sig} color="#A08060" width={140} />
              <p
                style={{
                  fontFamily,
                  fontSize: 11,
                  color: "#A08060",
                  fontStyle: "italic",
                }}
              >
                {userName}
              </p>
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="h-[85vh] flex flex-col"
        style={{
          background: "#FAF7F2",
          borderTop: "1px solid rgba(160,128,96,0.3)",
        }}
        data-ocid="journal.toc.sheet"
      >
        <SheetHeader className="flex-shrink-0 pb-2">
          <div className="flex items-center justify-between">
            <SheetTitle style={{ fontFamily, color: "#2A1A0A", fontSize: 18 }}>
              Table of Contents
            </SheetTitle>
            <button
              type="button"
              onClick={() => setShowHowFar(true)}
              className="text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5"
              style={{
                background: "rgba(232,200,128,0.2)",
                color: "#6B4C1A",
                fontFamily,
              }}
              data-ocid="journal.how_far.button"
            >
              <Heart size={11} />
              How Far I’ve Come
            </button>
          </div>
          <div className="flex justify-center pt-1">
            <OrnamentalDivider color="#A08060" opacity={0.3} />
          </div>
        </SheetHeader>

        <Tabs defaultValue="time" className="flex flex-col flex-1 min-h-0">
          <TabsList
            className="flex-shrink-0 mb-3"
            style={{ background: "rgba(160,128,96,0.1)" }}
          >
            <TabsTrigger
              value="time"
              style={{ fontFamily, fontSize: 13 }}
              data-ocid="journal.toc.time.tab"
            >
              By Time
            </TabsTrigger>
            <TabsTrigger
              value="emotion"
              style={{ fontFamily, fontSize: 13 }}
              data-ocid="journal.toc.emotion.tab"
            >
              By Emotion
            </TabsTrigger>
            <TabsTrigger
              value="type"
              style={{ fontFamily, fontSize: 13 }}
              data-ocid="journal.toc.type.tab"
            >
              By Type
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <TabsContent value="time" className="mt-0 px-1">
              {groupByTime().map(renderGroup)}
            </TabsContent>
            <TabsContent value="emotion" className="mt-0 px-1">
              {groupByEmotion().map(renderGroup)}
            </TabsContent>
            <TabsContent value="type" className="mt-0 px-1">
              {groupByType().map(renderGroup)}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

// ─── Search Overlay ───────────────────────────────────────────────────────────

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
  pages: JournalPage[];
  onNavigate: (idx: number) => void;
  fontFamily: string;
}

function SearchOverlay({
  open,
  onClose,
  pages,
  onNavigate,
  fontFamily,
}: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [emotionFilter, setEmotionFilter] = useState<string>("");

  const results = useMemo(() => {
    if (!query && !emotionFilter) return [];
    return pages.filter((p) => {
      const matchQ =
        !query ||
        p.content.toLowerCase().includes(query.toLowerCase()) ||
        p.contentPreview.toLowerCase().includes(query.toLowerCase());
      const matchE = !emotionFilter || p.emotionType === emotionFilter;
      return matchQ && matchE;
    });
  }, [query, emotionFilter, pages]);

  const emotions = useMemo(() => {
    const set = new Set(pages.map((p) => p.emotionType));
    return Array.from(set).filter(Boolean).slice(0, 12);
  }, [pages]);

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "#FAF7F2" }}
      data-ocid="journal.search.modal"
    >
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <div className="flex-1 relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "#A08060" }}
          />
          <input
            data-autofocus="true"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your journal…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl outline-none"
            style={{
              fontFamily,
              fontSize: 15,
              background: "rgba(160,128,96,0.08)",
              border: "1px solid rgba(160,128,96,0.2)",
              color: "#2A1A0A",
            }}
            data-ocid="journal.search.input"
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center flex-shrink-0"
          aria-label="Close search"
          data-ocid="journal.search.close_button"
        >
          <X size={18} style={{ color: "#A08060" }} />
        </button>
      </div>

      {/* Emotion chips */}
      <div className="px-5 pb-3 flex gap-2 overflow-x-auto">
        {emotions.map((em) => (
          <button
            type="button"
            key={em}
            onClick={() => setEmotionFilter(emotionFilter === em ? "" : em)}
            className="flex-shrink-0 px-3 py-1 rounded-full text-xs"
            style={{
              fontFamily,
              background:
                emotionFilter === em
                  ? (EMOTION_AURA_COLORS[em] ?? "#E8E0D8")
                  : "rgba(160,128,96,0.1)",
              color: emotionFilter === em ? "#2A1A0A" : "#A08060",
              border: `1px solid ${emotionFilter === em ? (EMOTION_AURA_COLORS[em] ?? "#E8E0D8") : "transparent"}`,
            }}
          >
            {em.charAt(0).toUpperCase() + em.slice(1).replace(/_/g, " ")}
          </button>
        ))}
      </div>

      <ScrollArea className="flex-1 px-5">
        {results.length === 0 && (query || emotionFilter) && (
          <div className="flex flex-col items-center pt-16 gap-3">
            <Search size={28} style={{ color: "#A08060", opacity: 0.4 }} />
            <p
              style={{
                fontFamily,
                color: "#A08060",
                fontSize: 14,
                fontStyle: "italic",
              }}
            >
              No pages found
            </p>
          </div>
        )}
        {results.length === 0 && !query && !emotionFilter && (
          <div className="flex flex-col items-center pt-16 gap-3">
            <p
              style={{
                fontFamily,
                color: "#A08060",
                fontSize: 14,
                fontStyle: "italic",
                textAlign: "center",
              }}
            >
              Begin typing to search across your pages
            </p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 pb-8">
          {results.map((page, i) => (
            <button
              type="button"
              key={page.id}
              data-ocid={`journal.search.item.${i + 1}`}
              onClick={() => {
                onNavigate(pages.indexOf(page));
                onClose();
              }}
              className="rounded-xl p-3 text-left"
              style={{
                background: `${EMOTION_AURA_COLORS[page.emotionType]}22`,
                border: `1px solid ${EMOTION_AURA_COLORS[page.emotionType] ?? "#E8E0D8"}44`,
              }}
            >
              <p
                style={{
                  fontFamily,
                  fontSize: 10,
                  color: "#A08060",
                  marginBottom: 4,
                }}
              >
                {page.date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <p
                className="line-clamp-2"
                style={{
                  fontFamily,
                  fontSize: 12,
                  color: "#2A1A0A",
                  lineHeight: 1.6,
                }}
              >
                {page.contentPreview || page.pageTypeLabel}
              </p>
              <p
                style={{
                  fontFamily,
                  fontSize: 10,
                  color: "#A08060",
                  marginTop: 4,
                }}
              >
                {page.pageTypeEmoji} {page.pageTypeLabel}
              </p>
            </button>
          ))}
        </div>
      </ScrollArea>
    </motion.div>
  );
}

// ─── Settings Panel ───────────────────────────────────────────────────────────

interface JournalSettingsPanelProps {
  open: boolean;
  onClose: () => void;
  settings: JournalSettings;
  onChange: (s: JournalSettings) => void;
  pages: JournalPage[];
  fontFamily: string;
}

function JournalSettingsPanel({
  open,
  onClose,
  settings,
  onChange,
  pages,
  fontFamily,
}: JournalSettingsPanelProps) {
  const [deleteStep, setDeleteStep] = useState(0);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  function update(partial: Partial<JournalSettings>) {
    const next = { ...settings, ...partial };
    onChange(next);
    saveSettings(next);
  }

  function exportAsText() {
    const lines = pages.map(
      (p) => `--- ${p.dateFormatted} | ${p.pageTypeLabel} ---\n${p.content}\n`,
    );
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-journal-veil.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Journal exported");
  }

  const labelStyle: React.CSSProperties = {
    fontFamily,
    fontSize: 14,
    color: "#2A1A0A",
  };
  const sectionStyle: React.CSSProperties = {
    fontFamily,
    fontSize: 11,
    color: "#A08060",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginBottom: 12,
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="h-[90vh] flex flex-col"
        style={{ background: "#FAF7F2" }}
        data-ocid="journal.settings.sheet"
      >
        <SheetHeader className="flex-shrink-0 pb-3">
          <SheetTitle style={{ fontFamily, color: "#2A1A0A", fontSize: 18 }}>
            Journal Settings
          </SheetTitle>
          <div className="flex justify-center">
            <OrnamentalDivider color="#A08060" opacity={0.3} />
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="space-y-8 pb-10 px-1">
            {/* Display */}
            <section>
              <p style={sectionStyle}>Display</p>
              <div className="space-y-4">
                <div>
                  <p style={{ ...labelStyle, marginBottom: 8 }}>Font</p>
                  <div className="space-y-2">
                    {(
                      [
                        "playfair",
                        "garamond",
                        "eb-garamond",
                        "baskerville",
                      ] as const
                    ).map((f) => (
                      <button
                        type="button"
                        key={f}
                        onClick={() => update({ font: f })}
                        className="w-full flex items-center gap-3 p-3 rounded-xl"
                        style={{
                          background:
                            settings.font === f
                              ? "rgba(232,200,128,0.2)"
                              : "rgba(160,128,96,0.06)",
                          border: `1px solid ${settings.font === f ? "rgba(232,200,128,0.5)" : "transparent"}`,
                        }}
                        data-ocid={`journal.settings.font_${f}.button`}
                      >
                        <div
                          className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                          style={{
                            borderColor:
                              settings.font === f ? "#E8C880" : "#A08060",
                          }}
                        >
                          {settings.font === f && (
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ background: "#E8C880" }}
                            />
                          )}
                        </div>
                        <span
                          style={{
                            fontFamily: FONT_MAP[f],
                            fontSize: 15,
                            color: "#2A1A0A",
                          }}
                        >
                          {f === "playfair"
                            ? "Playfair Display"
                            : f === "garamond"
                              ? "Cormorant Garamond"
                              : f === "eb-garamond"
                                ? "EB Garamond"
                                : "Libre Baskerville"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p style={{ ...labelStyle, marginBottom: 8 }}>
                    Font Size: {settings.fontSize}px
                  </p>
                  <Slider
                    min={14}
                    max={22}
                    step={1}
                    value={[settings.fontSize]}
                    onValueChange={([v]) => update({ fontSize: v })}
                    data-ocid="journal.settings.font_size.select"
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <Label style={labelStyle}>Emotion Colors</Label>
                  <Switch
                    checked={settings.emotionColors}
                    onCheckedChange={(v) => update({ emotionColors: v })}
                    data-ocid="journal.settings.emotion_colors.switch"
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <Label style={labelStyle}>Page Turn Sound</Label>
                  <Switch
                    checked={settings.pageTurnSound}
                    onCheckedChange={(v) => update({ pageTurnSound: v })}
                    data-ocid="journal.settings.sound.switch"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <p style={{ ...labelStyle, marginBottom: 4 }}>Hemisphere</p>
                  <p
                    style={{
                      fontFamily,
                      fontSize: 12,
                      color: "#A08060",
                      marginBottom: 8,
                    }}
                  >
                    Determines which months belong to each season
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {(
                      [
                        { value: "AUTO", label: "Automatic (from locale)" },
                        { value: "NORTHERN", label: "Northern Hemisphere" },
                        { value: "SOUTHERN", label: "Southern Hemisphere" },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => update({ hemisphere: opt.value })}
                        style={{
                          textAlign: "left",
                          padding: "8px 12px",
                          borderRadius: 8,
                          background:
                            settings.hemisphere === opt.value
                              ? "rgba(232,200,128,0.15)"
                              : "transparent",
                          border:
                            settings.hemisphere === opt.value
                              ? "1px solid rgba(232,200,128,0.4)"
                              : "1px solid rgba(160,128,96,0.2)",
                          color:
                            settings.hemisphere === opt.value
                              ? "#E8C880"
                              : "#A08060",
                          fontFamily,
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                        data-ocid={`journal.settings.hemisphere_${opt.value.toLowerCase()}.button`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Privacy */}
            <section>
              <p style={sectionStyle}>Privacy</p>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <Label style={labelStyle}>Screenshot Warning</Label>
                  <Switch
                    checked={settings.screenshotWarning}
                    onCheckedChange={(v) => update({ screenshotWarning: v })}
                    data-ocid="journal.settings.screenshot.switch"
                  />
                </div>
                <div className="flex items-center justify-between py-2">
                  <Label style={labelStyle}>Journal Lock (PIN)</Label>
                  <Switch
                    checked={settings.journalLock}
                    onCheckedChange={(v) => update({ journalLock: v })}
                    data-ocid="journal.settings.lock.switch"
                  />
                </div>
                {settings.journalLock && (
                  <div>
                    <p
                      style={{
                        ...labelStyle,
                        fontSize: 12,
                        color: "#A08060",
                        marginBottom: 6,
                      }}
                    >
                      Set PIN (4 digits)
                    </p>
                    <Input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={settings.journalPin}
                      onChange={(e) =>
                        update({
                          journalPin: e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 4),
                        })
                      }
                      placeholder="••••"
                      className="text-center"
                      style={{
                        fontFamily,
                        background: "rgba(160,128,96,0.08)",
                        border: "1px solid rgba(160,128,96,0.2)",
                        letterSpacing: "0.3em",
                      }}
                      data-ocid="journal.settings.pin.input"
                    />
                  </div>
                )}
              </div>
            </section>

            {/* Notifications */}
            <section>
              <p style={sectionStyle}>Notifications</p>
              <div className="space-y-3">
                {[
                  { key: "onThisDay" as const, label: "On This Day" },
                  {
                    key: "monthlyLetter" as const,
                    label: "Monthly Letter from Veil",
                  },
                  { key: "milestonePages" as const, label: "Milestone Pages" },
                ].map(({ key, label }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between py-2"
                  >
                    <Label style={labelStyle}>{label}</Label>
                    <Switch
                      checked={settings[key] as boolean}
                      onCheckedChange={(v) => update({ [key]: v })}
                      data-ocid={`journal.settings.${key}.switch`}
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Data */}
            <section>
              <p style={sectionStyle}>Data</p>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full flex gap-2"
                  style={{
                    fontFamily,
                    borderColor: "rgba(160,128,96,0.3)",
                    color: "#6B4C1A",
                  }}
                  onClick={exportAsText}
                  data-ocid="journal.settings.export.button"
                >
                  <Download size={15} /> Export as Text
                </Button>

                {deleteStep === 0 && (
                  <Button
                    variant="outline"
                    className="w-full flex gap-2"
                    style={{
                      fontFamily,
                      borderColor: "rgba(239,68,68,0.3)",
                      color: "#DC2626",
                    }}
                    onClick={() => setDeleteStep(1)}
                    data-ocid="journal.settings.delete.button"
                  >
                    <Trash2 size={15} /> Delete Journal
                  </Button>
                )}

                {deleteStep === 1 && (
                  <div
                    className="rounded-xl p-4"
                    style={{
                      background: "rgba(239,68,68,0.06)",
                      border: "1px solid rgba(239,68,68,0.2)",
                    }}
                  >
                    <p
                      style={{
                        fontFamily,
                        fontSize: 14,
                        color: "#DC2626",
                        marginBottom: 12,
                      }}
                    >
                      Are you sure? This cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        style={{ fontFamily }}
                        onClick={() => setDeleteStep(0)}
                        data-ocid="journal.settings.delete_cancel.button"
                      >
                        Cancel
                      </Button>
                      <Button
                        className="flex-1"
                        style={{ background: "#DC2626", fontFamily }}
                        onClick={() => setDeleteStep(2)}
                        data-ocid="journal.settings.delete_confirm.button"
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                )}

                {deleteStep === 2 && (
                  <div
                    className="rounded-xl p-4"
                    style={{
                      background: "rgba(239,68,68,0.06)",
                      border: "1px solid rgba(239,68,68,0.2)",
                    }}
                  >
                    <p
                      style={{
                        fontFamily,
                        fontSize: 14,
                        color: "#DC2626",
                        marginBottom: 4,
                      }}
                    >
                      Every page. Every memory. Gone.
                    </p>
                    <p
                      style={{
                        fontFamily,
                        fontSize: 12,
                        color: "#A08060",
                        marginBottom: 12,
                      }}
                    >
                      Type DELETE to confirm.
                    </p>
                    <Input
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="DELETE"
                      style={{ fontFamily, marginBottom: 10 }}
                      data-ocid="journal.settings.delete_confirm.input"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        style={{ fontFamily }}
                        onClick={() => {
                          setDeleteStep(0);
                          setDeleteConfirmText("");
                        }}
                        data-ocid="journal.settings.delete_cancel2.button"
                      >
                        Cancel
                      </Button>
                      <Button
                        className="flex-1"
                        disabled={deleteConfirmText !== "DELETE"}
                        style={{ background: "#DC2626", fontFamily }}
                        onClick={() => {
                          // Clear localStorage journal data
                          const keysToRemove: string[] = [];
                          for (let i = 0; i < localStorage.length; i++) {
                            const k = localStorage.key(i);
                            if (
                              k &&
                              (k.startsWith("veil-captured-joy-") ||
                                k.startsWith("veil-milestone-") ||
                                k === SETTINGS_KEY ||
                                k === SIG_SEEN_KEY)
                            )
                              keysToRemove.push(k);
                          }
                          for (const k of keysToRemove) {
                            localStorage.removeItem(k);
                          }

                          setDeleteStep(0);
                          setDeleteConfirmText("");
                          onClose();
                          toast.success("Journal cleared");
                        }}
                        data-ocid="journal.settings.delete_final.button"
                      >
                        Delete Everything
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

// ─── PIN Lock Screen ─────────────────────────────────────────────────────────────

interface PinLockProps {
  onUnlock: () => void;
  correctPin: string;
  fontFamily: string;
  sig: SignatureResult;
}

function PinLockScreen({
  onUnlock,
  correctPin,
  fontFamily,
  sig,
}: PinLockProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const handleKey = (digit: string) => {
    if (pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    if (next.length === 4) {
      if (next === correctPin) {
        onUnlock();
      } else {
        setError(true);
        setTimeout(() => {
          setPin("");
          setError(false);
        }, 700);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: "#2C1810" }}
      data-ocid="journal.lock.modal"
    >
      <div className="mb-8">
        <SignatureSvg sig={sig} color="#E8C880" width={160} />
      </div>
      <p
        style={{
          fontFamily,
          color: "#D4B896",
          fontSize: 14,
          fontStyle: "italic",
          marginBottom: 32,
        }}
      >
        Enter your Journal PIN
      </p>
      <div className="flex gap-4 mb-10">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-4 h-4 rounded-full border-2 transition-all"
            style={{
              borderColor: error ? "#DC2626" : "#A08060",
              background:
                i < pin.length
                  ? error
                    ? "#DC2626"
                    : "#E8C880"
                  : "transparent",
            }}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {(
          ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"] as const
        ).map((digit) =>
          digit === "" ? (
            <div key="pin-spacer" />
          ) : (
            <button
              type="button"
              key={`pin-${digit}`}
              onClick={() =>
                digit === "⌫" ? setPin((p) => p.slice(0, -1)) : handleKey(digit)
              }
              className="w-16 h-16 rounded-full flex items-center justify-center text-lg"
              style={{
                background: "rgba(255,255,255,0.08)",
                color: "#F5E6C8",
                fontFamily,
                border: "1px solid rgba(160,128,96,0.3)",
              }}
              data-ocid={`journal.lock.key_${digit}.button`}
            >
              {digit}
            </button>
          ),
        )}
      </div>
    </div>
  );
}

// ─── Main MyJournalTab Component ──────────────────────────────────────────────────

export default function MyJournalTab() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  const [view, setView] = useState<JournalView>("cover");
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [pageDirection, setPageDirection] = useState(1);
  const [settings, setSettings] = useState<JournalSettings>(loadSettings);
  const [tocOpen, setTocOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [coverEntered, setCoverEntered] = useState(false);

  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Load all journal data in parallel
  const { data: allData, isLoading } = useQuery<AllJournalData>({
    queryKey: ["journal-all-data"],
    queryFn: async () => {
      if (!actor)
        return {
          journalEntries: [],
          emotionEntries: [],
          companionDumps: [],
          apologies: [],
          unsentApologies: [],
          confessions: [],
        };
      const [je, ee, cd, ap, ua, cf] = await Promise.all([
        actor.getAllJournalEntries() as Promise<JournalEntry[]>,
        actor.getEmotionEntries() as Promise<EmotionEntry[]>,
        actor.getCompanionDumps() as Promise<CompanionDump[]>,
        actor.getMyApologies() as Promise<ApologyEntry[]>,
        actor.getMyUnsentApologies() as Promise<ApologyEntry[]>,
        actor.getConfessions() as Promise<any[]>,
      ]);
      return {
        journalEntries: je,
        emotionEntries: ee,
        companionDumps: cd,
        apologies: ap,
        unsentApologies: ua,
        confessions: cf,
      };
    },
    enabled: !!actor && !isFetching,
  });

  // Profile for display name
  const { data: profile } = useQuery<UserProfile | null>({
    queryKey: ["profile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });

  const userName = profile?.displayName ?? "You";
  const userId = identity?.getPrincipal().toString() ?? "default-user";

  // Generate signature — deterministic, memoized
  const sig = useMemo(
    () => generateSignature(userName, userId),
    [userName, userId],
  );

  // Build journal pages
  const pages = useMemo(() => {
    if (!allData) return [];
    return buildJournalPages(allData);
  }, [allData]);

  // Milestones (add as virtual pages)
  const milestones = useMemo(() => checkMilestones(pages), [pages]);

  // Combined pages with milestones injected
  const allPages = useMemo((): JournalPage[] => {
    if (milestones.length === 0) return pages;
    const extras: JournalPage[] = milestones.map((m) => ({
      id: `milestone-${m.id}`,
      pageNumber: 0, // will be reassigned below
      pageType: "MILESTONE_PAGE",
      emotionType: "achievement",
      pageColor: EMOTION_AURA_COLORS.achievement,
      content: m.text,
      contentPreview: m.text.slice(0, 80),
      date: m.date,
      dateFormatted: m.date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      milestoneType: m.type,
      isMilestone: true,
      visibility: "ONLY_ME",
      pageTypeLabel: "Milestone",
      pageTypeEmoji: "✨",
    }));
    const merged = [...pages, ...extras].sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );
    return merged.map((p, i) => ({ ...p, pageNumber: i + 1 }));
  }, [pages, milestones]);

  // Start on most recent page
  useEffect(() => {
    if (allPages.length > 0) {
      setCurrentPageIndex(allPages.length - 1);
    }
  }, [allPages.length]);

  // Screenshot detection
  useEffect(() => {
    if (!settings.screenshotWarning || view !== "pages") return;
    let hiddenAt: number | null = null;
    const handler = () => {
      if (document.hidden) {
        hiddenAt = Date.now();
      } else if (hiddenAt !== null && Date.now() - hiddenAt < 1000) {
        toast("This Journal is private. Screenshots are for you alone.", {
          icon: "🔒",
          duration: 3000,
        });
      }
      if (!document.hidden) hiddenAt = null;
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [settings.screenshotWarning, view]);

  const navigate = useCallback(
    (idx: number) => {
      setPageDirection(idx > currentPageIndex ? 1 : -1);
      setCurrentPageIndex(idx);
    },
    [currentPageIndex],
  );

  const openBook = useCallback(() => {
    if (allPages.length === 0) {
      setView("empty");
      return;
    }
    const sigSeen = localStorage.getItem(SIG_SEEN_KEY);
    if (!sigSeen) {
      setView("signature_reveal");
    } else {
      setView("pages");
    }
  }, [allPages.length]);

  const fontFamily = FONT_MAP[settings.font];

  // Stats for cover
  const negativeCount = useMemo(
    () =>
      allPages.filter((p) =>
        ["stressed", "sad", "frustrated", "anxious", "lonely", "numb"].includes(
          p.emotionType,
        ),
      ).length,
    [allPages],
  );
  const positiveCount = useMemo(
    () =>
      allPages.filter((p) =>
        [
          "grateful",
          "calm",
          "hopeful",
          "captured_joy",
          "achievement",
          "captured_joy_letter",
          "captured_joy_voice",
        ].includes(p.emotionType),
      ).length,
    [allPages],
  );

  const firstEntryDate = useMemo(() => {
    if (allPages.length === 0) return null;
    const oldest = allPages.reduce((a, b) => (a.date < b.date ? a : b));
    return oldest.date.toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });
  }, [allPages]);

  // ── PIN lock gate ──────────────────────────────────────────────────────
  if (settings.journalLock && settings.journalPin.length === 4 && !isUnlocked) {
    return (
      <PinLockScreen
        onUnlock={() => setIsUnlocked(true)}
        correctPin={settings.journalPin}
        fontFamily={fontFamily}
        sig={sig}
      />
    );
  }

  // ── Signature Reveal ──────────────────────────────────────────────────────
  if (view === "signature_reveal") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center px-8"
        style={{ background: "#1A1A1A" }}
        data-ocid="journal.signature_reveal.panel"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <SignatureSvg sig={sig} color="#E8C880" width={300} animate />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.8 }}
          className="text-center"
        >
          <p
            style={{
              fontFamily,
              fontSize: 15,
              color: "#D4B896",
              lineHeight: 1.9,
              marginBottom: 32,
            }}
          >
            This is your signature.
            <br />
            It will appear on every page of your Journal.
            <br />
            <br />
            It is yours.
            <br />
            No one else has this.
          </p>
          <button
            type="button"
            onClick={() => {
              localStorage.setItem(SIG_SEEN_KEY, "1");
              setView("pages");
            }}
            className="px-8 py-3 rounded-full"
            style={{
              background: "rgba(232,200,128,0.15)",
              border: "1px solid rgba(232,200,128,0.4)",
              color: "#E8C880",
              fontFamily,
              fontSize: 15,
            }}
            data-ocid="journal.signature_reveal.begin.button"
          >
            Begin my Journal
          </button>
        </motion.div>
      </motion.div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (view === "empty") {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center px-8"
        style={{ background: "#FAF7F2" }}
        data-ocid="journal.empty_state"
      >
        <svg
          aria-hidden="true"
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ opacity: 0.025 }}
        >
          <filter id="paper-empty">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65"
              numOctaves="3"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#paper-empty)" />
        </svg>
        <div className="relative z-10 flex flex-col items-center text-center gap-4">
          <BookOpen size={40} style={{ color: "#A08060", opacity: 0.5 }} />
          <p
            style={{
              fontFamily,
              fontSize: 22,
              color: "#2A1A0A",
              fontWeight: 600,
            }}
          >
            Your Journal is waiting.
          </p>
          <p
            style={{
              fontFamily,
              fontSize: 15,
              color: "#A08060",
              lineHeight: 1.8,
            }}
          >
            Every emotion you bring to Veil will live here.
            <br />
            Begin by writing something in the Write tab,
            <br />
            or sharing how you feel on Home.
          </p>
          <button
            type="button"
            onClick={() => setView("cover")}
            className="mt-6 px-6 py-2.5 rounded-full"
            style={{
              background: "rgba(160,128,96,0.12)",
              border: "1px solid rgba(160,128,96,0.3)",
              color: "#6B4C1A",
              fontFamily,
              fontSize: 14,
            }}
            data-ocid="journal.empty.back.button"
          >
            Back to Cover
          </button>
        </div>
      </div>
    );
  }

  // ── Pages view ────────────────────────────────────────────────────────────
  if (view === "pages") {
    return (
      <div className="fixed inset-0 z-40" data-ocid="journal.book.panel">
        <JournalBook
          pages={allPages}
          currentIndex={currentPageIndex}
          onNavigate={navigate}
          direction={pageDirection}
          settings={settings}
          sig={sig}
          reduceMotion={reduceMotion}
          onOpenTOC={() => setTocOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
          onBack={() => setView("cover")}
        />

        <TOCSheet
          open={tocOpen}
          onClose={() => setTocOpen(false)}
          pages={allPages}
          onNavigate={(idx) => {
            navigate(idx);
            setTocOpen(false);
          }}
          currentIndex={currentPageIndex}
          sig={sig}
          fontFamily={fontFamily}
          userName={userName}
        />

        <AnimatePresence>
          {searchOpen && (
            <SearchOverlay
              open={searchOpen}
              onClose={() => setSearchOpen(false)}
              pages={allPages}
              onNavigate={(idx) => {
                navigate(idx);
                setSearchOpen(false);
              }}
              fontFamily={fontFamily}
            />
          )}
        </AnimatePresence>

        <JournalSettingsPanel
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          settings={settings}
          onChange={setSettings}
          pages={allPages}
          fontFamily={fontFamily}
        />
      </div>
    );
  }

  // ── Seasonal Navigator view ──────────────────────────────────────────
  if (view === "seasonal_navigator") {
    const effectiveHemisphere =
      settings.hemisphere === "AUTO" ? "NORTHERN" : settings.hemisphere;
    return (
      <SeasonalNavigator
        pages={allPages}
        userName={userName}
        hemisphere={effectiveHemisphere}
        onOpenPage={(pageIndex) => {
          setCurrentPageIndex(pageIndex);
          setView("pages");
        }}
        onClose={() => setView("cover")}
      />
    );
  }

  // ── Journal Cover (default view) ─────────────────────────────────────────────
  return (
    <>
      <motion.div
        initial={
          coverEntered
            ? false
            : { x: reduceMotion ? 0 : "100%", opacity: reduceMotion ? 0 : 1 }
        }
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        onAnimationComplete={() => setCoverEntered(true)}
        className="fixed inset-0 z-40 flex flex-col items-center justify-between overflow-hidden cursor-pointer"
        style={{ background: "#2C1810" }}
        onClick={openBook}
        data-ocid="journal.cover.panel"
      >
        {/* Leather grain texture */}
        <svg
          aria-hidden="true"
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ opacity: 0.035 }}
        >
          <filter id="leather-grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.85"
              numOctaves="4"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#leather-grain)" />
        </svg>

        {/* Settings gear — stop propagation so it doesn’t open the book */}
        <button
          type="button"
          className="absolute top-12 right-5 z-10 w-10 h-10 flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            setSettingsOpen(true);
          }}
          aria-label="Journal settings"
          data-ocid="journal.settings.open_modal_button"
        >
          <Settings size={18} style={{ color: "#A08060" }} />
        </button>

        {/* Top: Name + Signature */}
        <div className="flex flex-col items-center pt-24 px-8 gap-5 z-10 relative">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: 38,
              fontWeight: 700,
              color: "#F5E6C8",
              textAlign: "center",
              letterSpacing: "-0.01em",
            }}
          >
            {userName}
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <SignatureSvg sig={sig} color="#E8C880" width={200} />
          </motion.div>
        </div>

        {/* Center: Subtitle */}
        <div className="flex flex-col items-center gap-3 z-10 relative">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: 20,
              fontStyle: "italic",
              color: "#D4B896",
              textAlign: "center",
            }}
          >
            My Journal
          </motion.p>
          {firstEntryDate && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: 13,
                color: "#A08060",
                textAlign: "center",
              }}
            >
              Since {firstEntryDate}
            </motion.p>
          )}
        </div>

        {/* Bottom: Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="flex flex-col items-center gap-2 pb-16 z-10 relative"
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-24 h-3 rounded-full"
                style={{ background: "rgba(160,128,96,0.2)" }}
              />
              <div
                className="w-32 h-2.5 rounded-full"
                style={{ background: "rgba(160,128,96,0.15)" }}
              />
            </div>
          ) : (
            <>
              <p
                style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: 14,
                  color: "#A08060",
                }}
              >
                {allPages.length} Pages Written
              </p>
              <p
                style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: 12,
                  color: "#A08060",
                  opacity: 0.8,
                }}
              >
                {negativeCount} moments of weight released
              </p>
              <p
                style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: 12,
                  color: "#A08060",
                  opacity: 0.8,
                }}
              >
                {positiveCount} moments of joy captured
              </p>
            </>
          )}

          <button
            type="button"
            onClick={() => setView("seasonal_navigator")}
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: 13,
              color: "#E8C880",
              opacity: 0.85,
              fontStyle: "italic",
              background: "none",
              border: "none",
              cursor: "pointer",
              marginTop: 8,
              letterSpacing: "0.03em",
            }}
            data-ocid="journal.cover.browse_seasons.button"
          >
            Browse by season →
          </button>

          <div className="mt-4 flex justify-center" style={{ width: 200 }}>
            <OrnamentalDivider color="#A08060" opacity={0.4} />
          </div>

          <p
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: 11,
              color: "#A08060",
              opacity: 0.5,
              fontStyle: "italic",
              marginTop: 4,
            }}
          >
            Tap to open
          </p>
        </motion.div>
      </motion.div>

      {/* Settings panel available from cover too */}
      <JournalSettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onChange={setSettings}
        pages={allPages}
        fontFamily={fontFamily}
      />
    </>
  );
}
