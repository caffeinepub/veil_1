// ─── Veil Profile Tab v2.0 ────────────────────────────────────────────────────
// Complete Personal Identity & Life Archive
// Sections: Header · Stats · Becoming · Compass Preview · Life Chapters ·
//           Timeline · Support Given · Inner Circle · Settings

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowRight,
  Bell,
  BookOpen,
  ChevronRight,
  Download,
  Eye,
  Heart,
  HelpCircle,
  Lock,
  Mic,
  Play,
  Settings,
  Share2,
  Shield,
  Sparkles,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { loadVolumes } from "../lib/journalExtensions";
import type { JournalVolume } from "../lib/journalExtensions";
import { buildCompassState } from "../lib/reflectionsEngine";
import type { CompassDirection } from "../lib/reflectionsEngine";
import { generateSignature } from "../lib/signatureGenerator";
import {
  collectSignal,
  getPendingDelivery,
  markDelivered,
} from "../lib/significantMomentsEngine";
import type { ScheduledDelivery } from "../lib/significantMomentsEngine";
import { AURA_COLOR_MAP } from "../utils/auraColors";
import { BecomingMoment } from "./BecomingMoment";
import { SignificantMomentsSettings } from "./SignificantMomentsSettings";

// ─── Constants ────────────────────────────────────────────────────────────────
const GOLD = "#E8C060";
const WARM_DARK = "#2A1A0A";
const PROFILE_KEY = "veil-profile-data";
const SETTINGS_KEY = "veil-settings";
const INNER_CIRCLE_KEY = "veil-inner-circle";
const TIMELINE_KEY = "veil-emotional-timeline";

const ZONE_COLORS: Record<CompassDirection, string> = {
  NORTH: "#F9E4A0",
  SOUTH: "#C3B8D8",
  EAST: "#F4C28A",
  WEST: "#B8C4D4",
  NORTH_EAST: "#F4D490",
  NORTH_WEST: "#D4CCBC",
  SOUTH_EAST: "#D8B8A8",
  SOUTH_WEST: "#C4BCD0",
};

function dirAngle(dir: CompassDirection): number {
  const a: Record<CompassDirection, number> = {
    NORTH: 0,
    NORTH_EAST: 45,
    EAST: 90,
    SOUTH_EAST: 135,
    SOUTH: 180,
    SOUTH_WEST: 225,
    WEST: 270,
    NORTH_WEST: 315,
  };
  return a[dir] ?? 0;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface ProfileData {
  displayName: string;
  username: string;
  bio: string;
  taglineType: "DYNAMIC" | "STATIC";
  taglineStatic: string;
  taglineDynamic: string;
  identityTagsType: "GENERATED" | "CUSTOM";
  identityTags: [string, string, string];
  becomingText: string;
  dominantAuraColor: string;
  momentsCaptured: number;
  supportGivenCount: number;
  expressionsMade: number;
  loveLettersCount: number;
  apologiesMadeCount: number;
  witnessCount: number;
  avatarUrl?: string;
}

interface InnerCircleMember {
  id: string;
  name: string;
  category: "COUSINS" | "CLOSEST_FRIENDS";
  relationshipTag?: string;
  avatarColor?: string;
}

interface TimelineEntry {
  id: string;
  emotionType: string;
  auraColor: string;
  contentText?: string;
  visibility: "ONLY_ME" | "INNER_CIRCLE" | "FRIENDS" | "GLOBAL";
  supportReceived: boolean;
  hasVoiceNote?: boolean;
  createdAt: number;
}

interface VeilSettings {
  pushNotificationsEnabled: boolean;
  companionCardNotif: boolean;
  dailyCheckinReminder: boolean;
  checkinTime: string;
  innerCircleAlerts: boolean;
  supportReactionAlerts: boolean;
  apologyDeliveryNotif: boolean;
  loveLetterDeliveryNotif: boolean;
  reflectionPromptNotif: boolean;
  promptFrequency: string;
  journalOnThisDay: boolean;
  monthlyLetterNotif: boolean;
  emailNotif: string;
  defaultCheckinVisibility: string;
  activityStatus: string;
  readReceipts: boolean;
  profileVisibility: string;
  globalAnonymityGuard: boolean;
  emotionDetection: boolean;
  detectionAfterVoice: boolean;
  detectionAfterText: boolean;
  breathingGuide: boolean;
  grounding: boolean;
  rebuildWithMe: boolean;
  agencyActionReminder: boolean;
  positiveCelebration: boolean;
  timePatternAwareness: boolean;
  emotionalPatternMemory: boolean;
  recoveryAcknowledgment: boolean;
  quietCheckinAfterAbsence: boolean;
  milestoneMemories: boolean;
  apologyVoiceVentDetection: boolean;
  veilVoiceMaster: boolean;
  voiceAfterVoiceDump: boolean;
  voiceAfterTextDump: boolean;
  voiceAfterSilentDump: boolean;
  voiceMorningFollowUp: boolean;
  voiceCarryingAwareness: boolean;
  voiceAfterCheckin: boolean;
  voiceApologyMoments: boolean;
  voiceLoveLetterMoments: boolean;
  voiceConfessionMoments: boolean;
  voiceCelebrationMoments: boolean;
  voiceVolume: number;
  journalFont: string;
  journalFontSize: number;
  emotionColors: boolean;
  bookAging: boolean;
  spineGrowth: boolean;
  pageTurnSound: boolean;
  readingAmbient: boolean;
  ambientVolume: number;
  journalLock: string;
  screenshotWarning: boolean;
  seasonPreference: string;
  reflectionPromptFrequency: string;
  seasonalPrompts: boolean;
  anniversaryPrompts: boolean;
  showCompass: boolean;
  compassHistory: string;
  showConnectionMirror: boolean;
  aiPersonDetection: boolean;
  monthlyGrowthNarrative: boolean;
  quarterlyGrowthNarrative: boolean;
  annualGrowthNarrative: boolean;
  thematicClustering: boolean;
  emotionalPulse: boolean;
  innerCircleNotifFrequency: string;
  supportIdentityReveal: boolean;
  sharingDefault: string;
}

// ─── Default data ─────────────────────────────────────────────────────────────
const DEFAULT_PROFILE: ProfileData = {
  displayName: "Your Name",
  username: "@yourname",
  bio: "",
  taglineType: "DYNAMIC",
  taglineStatic: "Carrying less since March 2025.",
  taglineDynamic: "Carrying lighter since October.",
  identityTagsType: "GENERATED",
  identityTags: ["Gratitude", "Resilience", "Love"],
  becomingText: "You have been becoming someone who asks for help.",
  dominantAuraColor: "#C9B8E8",
  momentsCaptured: 24,
  supportGivenCount: 12,
  expressionsMade: 8,
  loveLettersCount: 3,
  apologiesMadeCount: 2,
  witnessCount: 1,
};

const DEFAULT_SETTINGS: VeilSettings = {
  pushNotificationsEnabled: true,
  companionCardNotif: true,
  dailyCheckinReminder: true,
  checkinTime: "08:00",
  innerCircleAlerts: true,
  supportReactionAlerts: true,
  apologyDeliveryNotif: true,
  loveLetterDeliveryNotif: true,
  reflectionPromptNotif: true,
  promptFrequency: "few-days",
  journalOnThisDay: true,
  monthlyLetterNotif: true,
  emailNotif: "off",
  defaultCheckinVisibility: "INNER_CIRCLE",
  activityStatus: "off",
  readReceipts: false,
  profileVisibility: "ANYONE",
  globalAnonymityGuard: true,
  emotionDetection: true,
  detectionAfterVoice: false,
  detectionAfterText: true,
  breathingGuide: true,
  grounding: true,
  rebuildWithMe: true,
  agencyActionReminder: true,
  positiveCelebration: true,
  timePatternAwareness: true,
  emotionalPatternMemory: true,
  recoveryAcknowledgment: true,
  quietCheckinAfterAbsence: true,
  milestoneMemories: true,
  apologyVoiceVentDetection: false,
  veilVoiceMaster: true,
  voiceAfterVoiceDump: true,
  voiceAfterTextDump: true,
  voiceAfterSilentDump: true,
  voiceMorningFollowUp: true,
  voiceCarryingAwareness: true,
  voiceAfterCheckin: true,
  voiceApologyMoments: true,
  voiceLoveLetterMoments: true,
  voiceConfessionMoments: true,
  voiceCelebrationMoments: true,
  voiceVolume: 55,
  journalFont: "Cormorant Garamond",
  journalFontSize: 16,
  emotionColors: true,
  bookAging: true,
  spineGrowth: true,
  pageTurnSound: false,
  readingAmbient: false,
  ambientVolume: 20,
  journalLock: "off",
  screenshotWarning: true,
  seasonPreference: "auto",
  reflectionPromptFrequency: "few-days",
  seasonalPrompts: true,
  anniversaryPrompts: true,
  showCompass: true,
  compassHistory: "12months",
  showConnectionMirror: true,
  aiPersonDetection: false,
  monthlyGrowthNarrative: true,
  quarterlyGrowthNarrative: true,
  annualGrowthNarrative: true,
  thematicClustering: true,
  emotionalPulse: false,
  innerCircleNotifFrequency: "once-per-day",
  supportIdentityReveal: true,
  sharingDefault: "both",
};

const MOCK_INNER_CIRCLE: InnerCircleMember[] = [
  {
    id: "1",
    name: "Priya",
    category: "COUSINS",
    relationshipTag: "Sister",
    avatarColor: "#F9E4A0",
  },
  {
    id: "2",
    name: "Rohan",
    category: "COUSINS",
    relationshipTag: "Brother",
    avatarColor: "#A8D8B8",
  },
  {
    id: "3",
    name: "Anika",
    category: "CLOSEST_FRIENDS",
    relationshipTag: "Best Friend",
    avatarColor: "#C3B8D8",
  },
  {
    id: "4",
    name: "Dev",
    category: "CLOSEST_FRIENDS",
    relationshipTag: "Childhood Friend",
    avatarColor: "#F4C28A",
  },
];

const MOCK_TIMELINE: TimelineEntry[] = [
  {
    id: "1",
    emotionType: "grateful",
    auraColor: "#F9E4A0",
    contentText:
      "Feeling thankful for the small things today. The morning light felt different somehow.",
    visibility: "INNER_CIRCLE",
    supportReceived: false,
    createdAt: Date.now() - 86400000,
  },
  {
    id: "2",
    emotionType: "stressed",
    auraColor: "#F4C28A",
    contentText:
      "Work pressure has been building. I needed to put this somewhere.",
    visibility: "ONLY_ME",
    supportReceived: true,
    createdAt: Date.now() - 172800000,
  },
  {
    id: "3",
    emotionType: "hopeful",
    auraColor: "#A8D8B8",
    contentText: "Something is shifting. I can feel it.",
    visibility: "INNER_CIRCLE",
    supportReceived: false,
    hasVoiceNote: true,
    createdAt: Date.now() - 259200000,
  },
  {
    id: "4",
    emotionType: "reflective",
    auraColor: "#B8C4D4",
    contentText: "Sitting with a question I have not answered yet.",
    visibility: "ONLY_ME",
    supportReceived: false,
    createdAt: Date.now() - 345600000,
  },
  {
    id: "5",
    emotionType: "calm",
    auraColor: "#A8D8EA",
    contentText: "A quiet morning. That is all. Just noting it.",
    visibility: "INNER_CIRCLE",
    supportReceived: false,
    createdAt: Date.now() - 432000000,
  },
  {
    id: "6",
    emotionType: "lonely",
    auraColor: "#B8C8D8",
    contentText: "Missing people I have not seen in a while.",
    visibility: "ONLY_ME",
    supportReceived: true,
    createdAt: Date.now() - 518400000,
  },
  {
    id: "7",
    emotionType: "hopeful",
    auraColor: "#A8D8B8",
    contentText: "Had a conversation that changed something.",
    visibility: "FRIENDS",
    supportReceived: false,
    createdAt: Date.now() - 604800000,
  },
];

const MOCK_SIGNALS = [
  {
    id: "s1",
    name: "Priya",
    emotion: "stressed",
    emotionType: "stressed",
    auraColor: "#F4C28A",
    text: "A difficult week. Not sure what I need right now.",
    sharedAgo: "2 hours ago",
  },
  {
    id: "s2",
    name: "Dev",
    emotion: "reflective",
    emotionType: "reflective",
    auraColor: "#B8C4D4",
    text: "Sitting with something heavy today.",
    sharedAgo: "5 hours ago",
  },
  {
    id: "s3",
    name: "Anika",
    emotion: "grateful",
    emotionType: "grateful",
    auraColor: "#F9E4A0",
    text: "Something beautiful happened.",
    sharedAgo: "Yesterday",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function loadProfileData(): ProfileData {
  try {
    const stored = localStorage.getItem(PROFILE_KEY);
    if (stored) return { ...DEFAULT_PROFILE, ...JSON.parse(stored) };
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_PROFILE };
}

function saveProfileData(data: ProfileData) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
}

function loadSettings(): VeilSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(settings: VeilSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function loadInnerCircle(): InnerCircleMember[] {
  try {
    const stored = localStorage.getItem(INNER_CIRCLE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* ignore */
  }
  return MOCK_INNER_CIRCLE;
}

function loadTimeline(): TimelineEntry[] {
  try {
    const stored = localStorage.getItem(TIMELINE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* ignore */
  }
  return MOCK_TIMELINE;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getVisibilityBadge(visibility: string): {
  icon: string;
  label: string;
} {
  switch (visibility) {
    case "ONLY_ME":
      return { icon: "🔒", label: "Only Me" };
    case "INNER_CIRCLE":
      return { icon: "👥", label: "Inner Circle" };
    case "FRIENDS":
      return { icon: "🤝", label: "Friends" };
    case "GLOBAL":
      return { icon: "🌐", label: "Global" };
    default:
      return { icon: "🔒", label: "Only Me" };
  }
}

// ─── Mini Compass ─────────────────────────────────────────────────────────────
function MiniCompassRose({
  direction,
  size = 60,
}: { direction: CompassDirection; size?: number }) {
  const angle = dirAngle(direction);
  const needleColor = ZONE_COLORS[direction] ?? GOLD;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 3;
  const rad = ((angle - 90) * Math.PI) / 180;
  const nx = cx + Math.cos(rad) * (r - 8);
  const ny = cy + Math.sin(rad) * (r - 8);
  const cardinalColors = ["#F9E4A0", "#F4C28A", "#C3B8D8", "#B8C4D4"];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`Compass: ${direction.replace(/_/g, " ")}`}
    >
      <title>{`Compass pointing ${direction.replace(/_/g, " ")}`}</title>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="rgba(42,26,10,0.1)"
        strokeWidth={1}
        strokeDasharray="2,4"
      />
      {[0, 90, 180, 270].map((a, idx) => {
        const ar = ((a - 90) * Math.PI) / 180;
        return (
          <line
            key={a}
            x1={cx + Math.cos(ar) * (r - 8)}
            y1={cy + Math.sin(ar) * (r - 8)}
            x2={cx + Math.cos(ar) * r}
            y2={cy + Math.sin(ar) * r}
            stroke={cardinalColors[idx]}
            strokeWidth={2}
            strokeLinecap="round"
          />
        );
      })}
      <line
        x1={cx}
        y1={cy}
        x2={nx}
        y2={ny}
        stroke={needleColor}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r={2.5} fill={needleColor} />
    </svg>
  );
}

// ─── Book Spine ───────────────────────────────────────────────────────────────
function BookSpine({
  volume,
  onTap,
}: { volume: JournalVolume; onTap: () => void }) {
  const spineWidth = Math.max(40, Math.min(80, 40 + volume.totalPages / 2));
  const spineHeight = volume.isCurrent ? 140 : 120;
  const color = AURA_COLOR_MAP[volume.dominantEmotion] ?? "#C9B8E8";
  const year = volume.dateStarted
    ? new Date(volume.dateStarted).getFullYear()
    : new Date().getFullYear();

  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={`Open volume: ${volume.name}`}
      style={{ width: spineWidth, height: spineHeight, backgroundColor: color }}
      className={`relative flex-shrink-0 flex items-center justify-center cursor-pointer
        border border-black/10 transition-all duration-200 hover:brightness-105 hover:-translate-y-1
        ${volume.isCurrent ? "rounded-lg shadow-lg border-2 border-white/30" : "rounded-t-sm rounded-b-sm"}`}
    >
      {volume.isCurrent && (
        <div
          className="absolute inset-0 rounded-lg opacity-20"
          style={{
            background: "linear-gradient(135deg, white 0%, transparent 60%)",
          }}
        />
      )}
      <span
        style={{
          writingMode: "vertical-rl",
          textOrientation: "mixed",
          transform: "rotate(180deg)",
          fontSize: "10px",
          color: "white",
          fontFamily: "'Playfair Display', serif",
          fontWeight: 600,
          textShadow: "0 1px 2px rgba(0,0,0,0.3)",
          padding: "4px 2px",
          lineHeight: 1.2,
          letterSpacing: "0.02em",
        }}
      >
        {volume.name}{" "}
        <span style={{ fontSize: "8px", fontWeight: 400, opacity: 0.85 }}>
          {year}
        </span>
      </span>
    </button>
  );
}

// ─── Timeline Card ────────────────────────────────────────────────────────────
function TimelineCard({
  entry,
  expanded,
  onToggleExpand,
}: {
  entry: TimelineEntry;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const vis = getVisibilityBadge(entry.visibility);
  const supportGlow = entry.supportReceived
    ? `0 0 0 1.5px ${entry.auraColor}88, 0 0 12px ${entry.auraColor}44`
    : undefined;

  return (
    <div className="flex gap-0 rounded-xl overflow-hidden bg-white/80 border border-black/5 shadow-sm">
      <div
        style={{
          width: 4,
          backgroundColor: entry.auraColor,
          flexShrink: 0,
          boxShadow: supportGlow,
        }}
      />
      <div className="flex-1 p-3 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span
            style={{
              fontFamily: "'Playfair Display', serif",
              color: WARM_DARK,
            }}
            className="text-sm font-semibold capitalize"
          >
            {entry.emotionType}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400">
              {formatDate(entry.createdAt)} · {formatTime(entry.createdAt)}
            </span>
            {entry.hasVoiceNote && (
              <button
                type="button"
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${entry.auraColor}44` }}
                onClick={() => toast("Playing voice note privately...")}
                aria-label="Play voice note"
              >
                <Play size={9} style={{ color: WARM_DARK }} />
              </button>
            )}
          </div>
        </div>
        {entry.contentText && (
          <button
            type="button"
            className="text-left w-full"
            onClick={onToggleExpand}
            aria-expanded={expanded}
          >
            <p
              className={`text-sm text-gray-600 leading-relaxed ${!expanded ? "line-clamp-2" : ""}`}
              style={{ fontFamily: "Georgia, serif" }}
            >
              {entry.contentText}
            </p>
          </button>
        )}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-gray-400">
            {vis.icon} {vis.label}
          </span>
        </div>
        {entry.supportReceived && (
          <p
            className="text-xs italic mt-1.5"
            style={{ color: entry.auraColor, filter: "brightness(0.65)" }}
          >
            Your circle showed up for you.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Inner Circle Dashboard ───────────────────────────────────────────────────
function InnerCircleDashboard({
  members,
  onClose,
  settings,
}: {
  members: InnerCircleMember[];
  onClose: () => void;
  settings: VeilSettings;
}) {
  const cousins = members.filter((m) => m.category === "COUSINS");
  const closestFriends = members.filter(
    (m) => m.category === "CLOSEST_FRIENDS",
  );

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: "#FAF7F2" }}
    >
      <div className="flex items-center justify-between px-5 pt-12 pb-4 border-b border-black/5">
        <h2
          style={{
            fontFamily: "'Playfair Display', serif",
            color: WARM_DARK,
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          Inner Circle
        </h2>
        <button
          type="button"
          data-ocid="inner_circle.close_button"
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-black/5"
          aria-label="Close inner circle"
        >
          <X size={18} />
        </button>
      </div>
      <Tabs
        defaultValue="members"
        className="flex-1 flex flex-col overflow-hidden"
      >
        <TabsList className="mx-5 mt-4 mb-2 rounded-xl bg-black/5">
          <TabsTrigger
            value="members"
            data-ocid="inner_circle.tab"
            className="flex-1 rounded-lg text-sm"
          >
            Members
          </TabsTrigger>
          <TabsTrigger
            value="signals"
            data-ocid="inner_circle.tab"
            className="flex-1 rounded-lg text-sm"
          >
            Signals
          </TabsTrigger>
          <TabsTrigger
            value="shared"
            data-ocid="inner_circle.tab"
            className="flex-1 rounded-lg text-sm"
          >
            Shared
          </TabsTrigger>
        </TabsList>
        <ScrollArea className="flex-1">
          <TabsContent value="members" className="px-5 pb-8 mt-0">
            <div className="mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                Cousins · Family
              </h3>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {cousins.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">
                    No family members added yet.
                  </p>
                ) : (
                  cousins.map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      data-ocid="inner_circle.item.1"
                      className="flex flex-col items-center gap-1.5 min-w-[64px]"
                      onClick={() => toast(`Opening ${m.name}'s profile...`)}
                      aria-label={`${m.name}, Family${m.relationshipTag ? `, ${m.relationshipTag}` : ""}`}
                    >
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold shadow-sm border-2 border-white"
                        style={{
                          backgroundColor: m.avatarColor ?? "#C9B8E8",
                          color: WARM_DARK,
                        }}
                      >
                        {m.name[0]}
                      </div>
                      <span
                        className="text-xs text-center"
                        style={{
                          color: WARM_DARK,
                          fontFamily: "'Playfair Display', serif",
                        }}
                      >
                        {m.name}
                      </span>
                      {m.relationshipTag && (
                        <span className="text-[10px] text-gray-400">
                          {m.relationshipTag}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
            <div className="mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                Closest Friends
              </h3>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {closestFriends.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">
                    No close friends added yet.
                  </p>
                ) : (
                  closestFriends.map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      data-ocid="inner_circle.item.1"
                      className="flex flex-col items-center gap-1.5 min-w-[64px]"
                      onClick={() => toast(`Opening ${m.name}'s profile...`)}
                      aria-label={`${m.name}, Closest Friend${m.relationshipTag ? `, ${m.relationshipTag}` : ""}`}
                    >
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold shadow-sm border-2 border-white"
                        style={{
                          backgroundColor: m.avatarColor ?? "#C9B8E8",
                          color: WARM_DARK,
                        }}
                      >
                        {m.name[0]}
                      </div>
                      <span
                        className="text-xs text-center"
                        style={{
                          color: WARM_DARK,
                          fontFamily: "'Playfair Display', serif",
                        }}
                      >
                        {m.name}
                      </span>
                      {m.relationshipTag && (
                        <span className="text-[10px] text-gray-400">
                          {m.relationshipTag}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
            <button
              type="button"
              data-ocid="inner_circle.button"
              onClick={() =>
                toast("Invite flow — find someone trusted to add.")
              }
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-gray-300 text-sm text-gray-400 hover:border-gray-400 transition-colors"
              aria-label="Add someone trusted to inner circle"
            >
              <UserPlus size={16} />
              <span>+ Add someone trusted</span>
            </button>
            <div
              className="mt-4 p-3 rounded-xl text-xs text-gray-400 text-center"
              style={{ backgroundColor: "#FAF7F0" }}
            >
              Maximum 10 people total. Suggested: up to 5 family · up to 5
              friends.
            </div>
          </TabsContent>

          <TabsContent value="signals" className="px-5 pb-8 mt-0">
            {settings.emotionalPulse && (
              <div
                className="mb-4 p-3 rounded-2xl text-center text-sm italic text-gray-500"
                style={{ backgroundColor: `${GOLD}22` }}
              >
                Someone in your circle may need support today.
              </div>
            )}
            <div className="space-y-3">
              {MOCK_SIGNALS.map((signal, i) => (
                <div
                  key={signal.id}
                  data-ocid={`inner_circle.item.${i + 1}`}
                  className="flex gap-0 rounded-2xl overflow-hidden bg-white shadow-sm border border-black/5"
                >
                  <div
                    style={{
                      width: 4,
                      backgroundColor: signal.auraColor,
                      flexShrink: 0,
                    }}
                  />
                  <div className="flex-1 p-4">
                    <p
                      className="text-sm font-medium mb-1"
                      style={{
                        color: WARM_DARK,
                        fontFamily: "'Playfair Display', serif",
                      }}
                    >
                      {signal.name} is carrying something {signal.emotionType}{" "}
                      today.
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                      {signal.text}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "❤️ Support",
                        "🌿 I'm here",
                        "🤍 Thinking of you",
                        "💬 Talk if you want",
                      ].map((btn) => (
                        <button
                          type="button"
                          key={btn}
                          data-ocid="inner_circle.button"
                          onClick={() =>
                            toast(`${signal.name} will feel your presence.`)
                          }
                          className="text-xs px-3 py-1.5 rounded-full border border-gray-200 hover:border-gray-400 transition-colors bg-white"
                          aria-label={`Send ${btn} to ${signal.name}`}
                        >
                          {btn}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Shared {signal.sharedAgo}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="shared" className="px-5 pb-8 mt-0">
            <div
              data-ocid="inner_circle.panel"
              className="rounded-3xl p-6 text-center space-y-4"
              style={{ backgroundColor: `${GOLD}18` }}
            >
              <div className="text-4xl">🌿</div>
              <p
                style={{
                  fontFamily: "'Playfair Display', serif",
                  color: WARM_DARK,
                  fontSize: 16,
                  lineHeight: 1.6,
                }}
              >
                2 things have been
                <br />
                shared with you privately.
              </p>
              <button
                type="button"
                data-ocid="inner_circle.button"
                onClick={() => toast("Opening your private message...")}
                className="w-full py-3 rounded-2xl text-sm font-medium transition-colors"
                style={{ backgroundColor: WARM_DARK, color: "white" }}
                aria-label="Open privately shared items"
              >
                Open each one
              </button>
            </div>
            <p className="text-xs text-center text-gray-400 mt-4">
              Each shared item opens in its own private moment.
            </p>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

// ─── Settings Panel ───────────────────────────────────────────────────────────
function SettingsPanel({
  profile,
  settings,
  onClose,
  onProfileChange,
  onSettingsChange,
  onOpenNotificationSettings,
}: {
  profile: ProfileData;
  settings: VeilSettings;
  onClose: () => void;
  onProfileChange: (data: Partial<ProfileData>) => void;
  onSettingsChange: (data: Partial<VeilSettings>) => void;
  onOpenNotificationSettings?: () => void;
}) {
  const [deleteStep, setDeleteStep] = useState(0);
  const [sigRegen, setSigRegen] = useState(0);

  function ToggleRow({
    label,
    description,
    checked,
    onChange,
    id,
  }: {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (v: boolean) => void;
    id: string;
  }) {
    return (
      <div className="flex items-center justify-between py-3 border-b border-black/5 last:border-0">
        <div className="flex-1 pr-4">
          <Label
            htmlFor={id}
            className="text-sm font-medium cursor-pointer"
            style={{ color: WARM_DARK }}
          >
            {label}
          </Label>
          {description && (
            <p className="text-xs text-gray-400 mt-0.5">{description}</p>
          )}
        </div>
        <Switch
          id={id}
          checked={checked}
          onCheckedChange={onChange}
          data-ocid="settings.switch"
          aria-label={label}
        />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: "#FAF7F2" }}
    >
      <div className="flex items-center justify-between px-5 pt-12 pb-4 border-b border-black/5 flex-shrink-0">
        <h2
          style={{
            fontFamily: "'Playfair Display', serif",
            color: WARM_DARK,
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          Settings
        </h2>
        <button
          type="button"
          data-ocid="settings.close_button"
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-black/5"
          aria-label="Close settings"
        >
          <X size={18} />
        </button>
      </div>
      <ScrollArea className="flex-1">
        <div className="px-5 pb-24">
          <Accordion type="multiple" className="space-y-1 mt-2">
            {/* 1. Profile */}
            <AccordionItem
              value="profile"
              className="border border-black/5 rounded-2xl overflow-hidden bg-white/60 px-4"
            >
              <AccordionTrigger className="py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${GOLD}33` }}
                  >
                    <Users size={15} style={{ color: WARM_DARK }} />
                  </div>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: WARM_DARK }}
                  >
                    Profile
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <div>
                  <Label className="text-xs text-gray-400 mb-1 block">
                    Display Name
                  </Label>
                  <Input
                    data-ocid="settings.input"
                    value={profile.displayName}
                    onChange={(e) =>
                      onProfileChange({ displayName: e.target.value })
                    }
                    className="rounded-xl"
                    aria-label="Display name"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-400 mb-1 block">
                    Username
                  </Label>
                  <Input
                    data-ocid="settings.input"
                    value={profile.username}
                    onChange={(e) =>
                      onProfileChange({ username: e.target.value })
                    }
                    className="rounded-xl"
                    aria-label="Username"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-400 mb-1 block">
                    Bio / Life Motto
                  </Label>
                  <Textarea
                    data-ocid="settings.textarea"
                    value={profile.bio}
                    onChange={(e) => onProfileChange({ bio: e.target.value })}
                    className="rounded-xl resize-none"
                    rows={2}
                    aria-label="Bio or life motto"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-400 mb-2 block">
                    Tagline Type
                  </Label>
                  <RadioGroup
                    value={profile.taglineType}
                    onValueChange={(v) =>
                      onProfileChange({
                        taglineType: v as "DYNAMIC" | "STATIC",
                      })
                    }
                    className="space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem
                        value="DYNAMIC"
                        id="tl-dynamic"
                        data-ocid="settings.radio"
                      />
                      <Label
                        htmlFor="tl-dynamic"
                        className="text-sm cursor-pointer"
                      >
                        Dynamic (generated)
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem
                        value="STATIC"
                        id="tl-static"
                        data-ocid="settings.radio"
                      />
                      <Label
                        htmlFor="tl-static"
                        className="text-sm cursor-pointer"
                      >
                        Static (write your own)
                      </Label>
                    </div>
                  </RadioGroup>
                  {profile.taglineType === "STATIC" && (
                    <Input
                      data-ocid="settings.input"
                      className="mt-2 rounded-xl text-sm"
                      maxLength={60}
                      placeholder="Max 60 characters"
                      value={profile.taglineStatic}
                      onChange={(e) =>
                        onProfileChange({ taglineStatic: e.target.value })
                      }
                      aria-label="Static tagline text"
                    />
                  )}
                </div>
                <div>
                  <Label className="text-xs text-gray-400 mb-2 block">
                    Identity Tags
                  </Label>
                  <RadioGroup
                    value={profile.identityTagsType}
                    onValueChange={(v) =>
                      onProfileChange({
                        identityTagsType: v as "GENERATED" | "CUSTOM",
                      })
                    }
                    className="space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem
                        value="GENERATED"
                        id="it-gen"
                        data-ocid="settings.radio"
                      />
                      <Label
                        htmlFor="it-gen"
                        className="text-sm cursor-pointer"
                      >
                        Generated by Veil
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem
                        value="CUSTOM"
                        id="it-custom"
                        data-ocid="settings.radio"
                      />
                      <Label
                        htmlFor="it-custom"
                        className="text-sm cursor-pointer"
                      >
                        Write your own
                      </Label>
                    </div>
                  </RadioGroup>
                  {profile.identityTagsType === "CUSTOM" && (
                    <div className="flex gap-2 mt-2">
                      {profile.identityTags.map((tag, i) => (
                        <Input
                          key={tag || `tag-pos-${i}`}
                          data-ocid="settings.input"
                          className="rounded-xl text-xs flex-1"
                          value={tag}
                          maxLength={20}
                          onChange={(e) => {
                            const tags = [...profile.identityTags] as [
                              string,
                              string,
                              string,
                            ];
                            tags[i] = e.target.value;
                            onProfileChange({ identityTags: tags });
                          }}
                          aria-label={`Identity tag ${i + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-gray-400 mb-2 block">
                    Royal Signature
                  </Label>
                  <button
                    type="button"
                    data-ocid="settings.button"
                    onClick={() => {
                      if (sigRegen === 0) {
                        setSigRegen(1);
                        return;
                      }
                      if (sigRegen === 1) {
                        setSigRegen(2);
                        return;
                      }
                      setSigRegen(0);
                      toast("Signature regenerated. This change is permanent.");
                    }}
                    className="w-full py-2.5 rounded-xl text-sm border border-dashed border-gray-300 text-gray-500 hover:border-gray-400 transition-colors"
                    aria-label="Regenerate royal signature"
                  >
                    {sigRegen === 0 && "↻ Regenerate Signature"}
                    {sigRegen === 1 && "⚠️ Are you sure? This is irreversible."}
                    {sigRegen === 2 && "🔴 Confirm — this cannot be undone"}
                  </button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 2. Account & Security */}
            <AccordionItem
              value="account"
              className="border border-black/5 rounded-2xl overflow-hidden bg-white/60 px-4"
            >
              <AccordionTrigger className="py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: "#C3B8D8" + "55" }}
                  >
                    <Shield size={15} style={{ color: WARM_DARK }} />
                  </div>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: WARM_DARK }}
                  >
                    Account & Security
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-3">
                <div className="py-2 border-b border-black/5">
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="text-sm" style={{ color: WARM_DARK }}>
                    yourname@example.com
                  </p>
                </div>
                <button
                  type="button"
                  data-ocid="settings.button"
                  className="w-full text-left py-3 text-sm border-b border-black/5"
                  style={{ color: WARM_DARK }}
                  onClick={() => toast("Password change flow...")}
                  aria-label="Change password"
                >
                  Change Password
                </button>
                <ToggleRow
                  id="2fa"
                  label="Two-Factor Authentication"
                  description="Extra layer of security"
                  checked={false}
                  onChange={() => toast("2FA setup flow...")}
                />
                <div className="py-2 border-b border-black/5">
                  <p className="text-xs text-gray-400 mb-2">Linked Accounts</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      data-ocid="settings.button"
                      className="flex-1 py-2 rounded-xl text-xs border border-gray-200"
                      style={{ color: WARM_DARK }}
                      onClick={() => toast("Linking Google account...")}
                      aria-label="Link Google"
                    >
                      Link Google
                    </button>
                    <button
                      type="button"
                      data-ocid="settings.button"
                      className="flex-1 py-2 rounded-xl text-xs border border-gray-200"
                      style={{ color: WARM_DARK }}
                      onClick={() => toast("Linking Apple account...")}
                      aria-label="Link Apple"
                    >
                      Link Apple
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  data-ocid="settings.button"
                  className="w-full text-left py-3 text-sm border-b border-black/5"
                  style={{ color: WARM_DARK }}
                  onClick={() => toast("Preparing your data export...")}
                  aria-label="Download my data"
                >
                  <span className="flex items-center gap-2">
                    <Download size={14} />
                    Download My Data
                  </span>
                </button>
                <button
                  type="button"
                  data-ocid="settings.button"
                  className="w-full text-left py-3 text-sm border-b border-black/5 text-amber-600"
                  onClick={() => toast("Account deactivation flow...")}
                  aria-label="Deactivate account"
                >
                  Deactivate Account
                </button>
                {deleteStep === 0 && (
                  <button
                    type="button"
                    data-ocid="settings.delete_button"
                    className="w-full text-left py-3 text-sm text-red-500"
                    onClick={() => setDeleteStep(1)}
                    aria-label="Delete account"
                  >
                    Delete Account
                  </button>
                )}
                {deleteStep === 1 && (
                  <div className="rounded-2xl p-4 border border-red-200 bg-red-50">
                    <p className="text-sm font-semibold text-red-700 mb-2">
                      Are you absolutely sure?
                    </p>
                    <p className="text-xs text-red-600 mb-3 leading-relaxed">
                      This cannot be undone. Every journal page. Every
                      reflection. Every letter. Gone.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        data-ocid="settings.cancel_button"
                        className="flex-1 py-2 rounded-xl text-xs border border-gray-300"
                        onClick={() => setDeleteStep(0)}
                        aria-label="Cancel deletion"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        data-ocid="settings.delete_button"
                        className="flex-1 py-2 rounded-xl text-xs bg-red-500 text-white"
                        onClick={() => setDeleteStep(2)}
                        aria-label="Confirm deletion step 2"
                      >
                        I understand
                      </button>
                    </div>
                  </div>
                )}
                {deleteStep === 2 && (
                  <div className="rounded-2xl p-4 border border-red-300 bg-red-50">
                    <p className="text-xs text-red-600 mb-3">
                      Final confirmation. Every page. Every letter. Gone
                      forever.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        data-ocid="settings.cancel_button"
                        className="flex-1 py-2 rounded-xl text-xs border border-gray-300"
                        onClick={() => setDeleteStep(0)}
                        aria-label="Cancel deletion"
                      >
                        No, keep it
                      </button>
                      <button
                        type="button"
                        data-ocid="settings.delete_button"
                        className="flex-1 py-2 rounded-xl text-xs bg-red-600 text-white"
                        onClick={() => {
                          setDeleteStep(0);
                          toast.error(
                            "Account deletion requested. You have 30 days to reconsider.",
                          );
                        }}
                        aria-label="Permanently delete account"
                      >
                        Delete everything
                      </button>
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* 3. Quick Release */}
            <AccordionItem
              value="quickrelease"
              className="border border-black/5 rounded-2xl overflow-hidden bg-white/60 px-4"
            >
              <AccordionTrigger className="py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: "#A8D8B8" + "55" }}
                  >
                    <Sparkles size={15} style={{ color: WARM_DARK }} />
                  </div>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: WARM_DARK }}
                  >
                    Quick Release
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-3">
                <div className="py-2 border-b border-black/5">
                  <p className="text-xs text-gray-400 mb-1">
                    iOS — Siri Shortcut
                  </p>
                  <p className="text-sm mb-2" style={{ color: WARM_DARK }}>
                    "Hey Siri, open Veil"
                  </p>
                  <button
                    type="button"
                    data-ocid="settings.button"
                    className="text-xs text-blue-500"
                    onClick={() => toast("Opening Siri shortcut settings...")}
                    aria-label="Change Siri shortcut"
                  >
                    Change phrase
                  </button>
                </div>
                <div className="py-2 border-b border-black/5">
                  <p className="text-xs text-gray-400 mb-1">
                    Android — Google Assistant
                  </p>
                  <p className="text-sm mb-2" style={{ color: WARM_DARK }}>
                    "Hey Google, talk to Veil"
                  </p>
                  <button
                    type="button"
                    data-ocid="settings.button"
                    className="text-xs text-blue-500"
                    onClick={() =>
                      toast("Opening Google Assistant settings...")
                    }
                    aria-label="Change Google Assistant phrase"
                  >
                    Change phrase
                  </button>
                </div>
                <div className="py-2 border-b border-black/5">
                  <p className="text-xs text-gray-400 mb-1">
                    Home Screen Widget
                  </p>
                  <button
                    type="button"
                    data-ocid="settings.button"
                    className="text-xs text-blue-500"
                    onClick={() => toast("Widget setup instructions...")}
                    aria-label="How to add widget"
                  >
                    How to add →
                  </button>
                </div>
                <div className="py-2">
                  <p className="text-xs text-gray-400 mb-1">
                    Lock Screen Widget (iOS 16+)
                  </p>
                  <button
                    type="button"
                    data-ocid="settings.button"
                    className="text-xs text-blue-500"
                    onClick={() => toast("Lock screen widget instructions...")}
                    aria-label="How to add lock screen widget"
                  >
                    How to add →
                  </button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 4. Notifications */}
            <AccordionItem
              value="notifications"
              className="border border-black/5 rounded-2xl overflow-hidden bg-white/60 px-4"
            >
              <AccordionTrigger className="py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: "#F4C28A" + "55" }}
                  >
                    <Bell size={15} style={{ color: WARM_DARK }} />
                  </div>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: WARM_DARK }}
                  >
                    Notifications
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                {onOpenNotificationSettings && (
                  <button
                    type="button"
                    data-ocid="settings.notification_settings.button"
                    onClick={() => {
                      onOpenNotificationSettings();
                    }}
                    className="w-full flex items-center justify-between py-3 px-4 rounded-xl mb-3 text-sm transition-all hover:opacity-80"
                    style={{
                      background: "rgba(244,194,138,0.12)",
                      border: "1px solid rgba(244,194,138,0.25)",
                      color: "#F4C28A",
                    }}
                  >
                    <span>Notification types and quiet mode</span>
                    <span style={{ opacity: 0.6 }}>→</span>
                  </button>
                )}
                <ToggleRow
                  id="push-master"
                  label="Push Notifications"
                  description="Master toggle"
                  checked={settings.pushNotificationsEnabled}
                  onChange={(v) =>
                    onSettingsChange({ pushNotificationsEnabled: v })
                  }
                />
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4 mb-2">
                  Companion Card
                </p>
                <ToggleRow
                  id="cc-notif"
                  label="Emotional reminders"
                  checked={settings.companionCardNotif}
                  onChange={(v) => onSettingsChange({ companionCardNotif: v })}
                />
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4 mb-2">
                  Check-In
                </p>
                <ToggleRow
                  id="ci-notif"
                  label="Daily Check-In reminder"
                  checked={settings.dailyCheckinReminder}
                  onChange={(v) =>
                    onSettingsChange({ dailyCheckinReminder: v })
                  }
                />
                {settings.dailyCheckinReminder && (
                  <div className="flex items-center gap-2 py-2 pl-2">
                    <Label className="text-xs text-gray-400">Time</Label>
                    <Input
                      data-ocid="settings.input"
                      type="time"
                      value={settings.checkinTime}
                      onChange={(e) =>
                        onSettingsChange({ checkinTime: e.target.value })
                      }
                      className="w-32 text-xs rounded-lg"
                      aria-label="Check-in time"
                    />
                  </div>
                )}
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4 mb-2">
                  Inner Circle
                </p>
                <ToggleRow
                  id="ic-notif"
                  label="Inner Circle activity alerts"
                  checked={settings.innerCircleAlerts}
                  onChange={(v) => onSettingsChange({ innerCircleAlerts: v })}
                />
                <ToggleRow
                  id="sr-notif"
                  label="Support reaction alerts"
                  checked={settings.supportReactionAlerts}
                  onChange={(v) =>
                    onSettingsChange({ supportReactionAlerts: v })
                  }
                />
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4 mb-2">
                  Write Tab
                </p>
                <ToggleRow
                  id="ap-notif"
                  label="Apology delivery notifications"
                  checked={settings.apologyDeliveryNotif}
                  onChange={(v) =>
                    onSettingsChange({ apologyDeliveryNotif: v })
                  }
                />
                <ToggleRow
                  id="ll-notif"
                  label="Love letter delivery notifications"
                  checked={settings.loveLetterDeliveryNotif}
                  onChange={(v) =>
                    onSettingsChange({ loveLetterDeliveryNotif: v })
                  }
                />
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4 mb-2">
                  Journal
                </p>
                <ToggleRow
                  id="otd-notif"
                  label="On This Day"
                  checked={settings.journalOnThisDay}
                  onChange={(v) => onSettingsChange({ journalOnThisDay: v })}
                />
                <ToggleRow
                  id="ml-notif"
                  label="Monthly Letter from Veil"
                  checked={settings.monthlyLetterNotif}
                  onChange={(v) => onSettingsChange({ monthlyLetterNotif: v })}
                />
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4 mb-2">
                  Email
                </p>
                <Select
                  value={settings.emailNotif}
                  onValueChange={(v) => onSettingsChange({ emailNotif: v })}
                >
                  <SelectTrigger
                    data-ocid="settings.select"
                    className="rounded-xl text-sm"
                    aria-label="Email notification frequency"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="off">Off (default)</SelectItem>
                    <SelectItem value="weekly">Weekly summary only</SelectItem>
                  </SelectContent>
                </Select>
              </AccordionContent>
            </AccordionItem>

            {/* 5. Privacy & Visibility */}
            <AccordionItem
              value="privacy"
              className="border border-black/5 rounded-2xl overflow-hidden bg-white/60 px-4"
            >
              <AccordionTrigger className="py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: "#B8C4D4" + "55" }}
                  >
                    <Lock size={15} style={{ color: WARM_DARK }} />
                  </div>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: WARM_DARK }}
                  >
                    Privacy & Visibility
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <div>
                  <Label className="text-xs text-gray-400 mb-2 block">
                    Default Check-In Visibility
                  </Label>
                  <RadioGroup
                    value={settings.defaultCheckinVisibility}
                    onValueChange={(v) =>
                      onSettingsChange({ defaultCheckinVisibility: v })
                    }
                    className="space-y-1"
                  >
                    {[
                      ["ONLY_ME", "Only Me"],
                      ["INNER_CIRCLE", "Inner Circle (default)"],
                      ["FRIENDS", "Friends"],
                      ["GLOBAL", "Global"],
                    ].map(([v, l]) => (
                      <div key={v} className="flex items-center gap-2">
                        <RadioGroupItem
                          value={v}
                          id={`vis-${v}`}
                          data-ocid="settings.radio"
                        />
                        <Label
                          htmlFor={`vis-${v}`}
                          className="text-sm cursor-pointer"
                        >
                          {l}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <ToggleRow
                  id="activity"
                  label="Show when online"
                  checked={settings.activityStatus !== "off"}
                  onChange={(v) =>
                    onSettingsChange({
                      activityStatus: v ? "inner_circle" : "off",
                    })
                  }
                />
                <ToggleRow
                  id="read-receipts"
                  label="Read Receipts"
                  description="Show when letters are opened"
                  checked={settings.readReceipts}
                  onChange={(v) => onSettingsChange({ readReceipts: v })}
                />
                <div>
                  <Label className="text-xs text-gray-400 mb-2 block">
                    Profile Visibility
                  </Label>
                  <Select
                    value={settings.profileVisibility}
                    onValueChange={(v) =>
                      onSettingsChange({ profileVisibility: v })
                    }
                  >
                    <SelectTrigger
                      data-ocid="settings.select"
                      className="rounded-xl text-sm"
                      aria-label="Profile visibility"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ANYONE">Anyone can view</SelectItem>
                      <SelectItem value="FRIENDS">Friends only</SelectItem>
                      <SelectItem value="INNER_CIRCLE">
                        Inner Circle only
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <ToggleRow
                  id="anon-guard"
                  label="Global Anonymity Guard"
                  description="One-time confirmation for Global posts"
                  checked={settings.globalAnonymityGuard}
                  onChange={(v) =>
                    onSettingsChange({ globalAnonymityGuard: v })
                  }
                />
                <button
                  type="button"
                  data-ocid="settings.button"
                  className="w-full py-2.5 rounded-xl text-sm border border-gray-200 text-gray-500"
                  onClick={() => toast("Manage blocked users...")}
                  aria-label="Manage block list"
                >
                  Manage Block List
                </button>
                <button
                  type="button"
                  data-ocid="settings.button"
                  className="w-full py-2.5 rounded-xl text-sm border border-gray-200 text-red-400"
                  onClick={() => toast("Report a user flow...")}
                  aria-label="Report a user"
                >
                  Report a User
                </button>
              </AccordionContent>
            </AccordionItem>

            {/* 6. Emotional Intelligence */}
            <AccordionItem
              value="ei"
              className="border border-black/5 rounded-2xl overflow-hidden bg-white/60 px-4"
            >
              <AccordionTrigger className="py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: "#A8D8B8" + "55" }}
                  >
                    <Sparkles size={15} style={{ color: WARM_DARK }} />
                  </div>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: WARM_DARK }}
                  >
                    Emotional Intelligence
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <ToggleRow
                  id="emotion-detect"
                  label="Emotion Detection"
                  description="Understand what you carry"
                  checked={settings.emotionDetection}
                  onChange={(v) => onSettingsChange({ emotionDetection: v })}
                />
                <p className="text-xs text-gray-400 mt-3 mb-2">
                  Detection Components
                </p>
                <ToggleRow
                  id="det-voice"
                  label="After voice dump (opt-in)"
                  checked={settings.detectionAfterVoice}
                  onChange={(v) => onSettingsChange({ detectionAfterVoice: v })}
                />
                <ToggleRow
                  id="det-text"
                  label="After text dump"
                  checked={settings.detectionAfterText}
                  onChange={(v) => onSettingsChange({ detectionAfterText: v })}
                />
                <p className="text-xs text-gray-400 mt-3 mb-2">
                  Transformation Arc
                </p>
                <ToggleRow
                  id="breathing"
                  label="Breathing guide"
                  checked={settings.breathingGuide}
                  onChange={(v) => onSettingsChange({ breathingGuide: v })}
                />
                <ToggleRow
                  id="grounding"
                  label="Grounding"
                  checked={settings.grounding}
                  onChange={(v) => onSettingsChange({ grounding: v })}
                />
                <ToggleRow
                  id="rebuild"
                  label="Rebuild with me"
                  checked={settings.rebuildWithMe}
                  onChange={(v) => onSettingsChange({ rebuildWithMe: v })}
                />
                <ToggleRow
                  id="agency"
                  label="Agency action reminder"
                  checked={settings.agencyActionReminder}
                  onChange={(v) =>
                    onSettingsChange({ agencyActionReminder: v })
                  }
                />
                <ToggleRow
                  id="pos-cel"
                  label="Positive Celebration Flow"
                  checked={settings.positiveCelebration}
                  onChange={(v) => onSettingsChange({ positiveCelebration: v })}
                />
                <p className="text-xs text-gray-400 mt-3 mb-2">
                  Passive Signal Layer
                </p>
                <ToggleRow
                  id="time-pattern"
                  label="Time pattern awareness"
                  checked={settings.timePatternAwareness}
                  onChange={(v) =>
                    onSettingsChange({ timePatternAwareness: v })
                  }
                />
                <ToggleRow
                  id="emotion-memory"
                  label="Emotional pattern memory"
                  checked={settings.emotionalPatternMemory}
                  onChange={(v) =>
                    onSettingsChange({ emotionalPatternMemory: v })
                  }
                />
                <ToggleRow
                  id="recovery"
                  label="Recovery acknowledgment"
                  checked={settings.recoveryAcknowledgment}
                  onChange={(v) =>
                    onSettingsChange({ recoveryAcknowledgment: v })
                  }
                />
                <ToggleRow
                  id="quiet-checkin"
                  label="Quiet check-in after absence"
                  checked={settings.quietCheckinAfterAbsence}
                  onChange={(v) =>
                    onSettingsChange({ quietCheckinAfterAbsence: v })
                  }
                />
                <ToggleRow
                  id="milestone-mem"
                  label="Milestone memories"
                  checked={settings.milestoneMemories}
                  onChange={(v) => onSettingsChange({ milestoneMemories: v })}
                />
                <ToggleRow
                  id="apology-vent"
                  label="Apology Voice Vent Detection"
                  checked={settings.apologyVoiceVentDetection}
                  onChange={(v) =>
                    onSettingsChange({ apologyVoiceVentDetection: v })
                  }
                />
                <p className="text-xs text-gray-400 mt-4 mb-2">
                  Significant Moments
                </p>
                <SignificantMomentsSettings />
              </AccordionContent>
            </AccordionItem>

            {/* 7. Veil Voice */}
            <AccordionItem
              value="voice"
              className="border border-black/5 rounded-2xl overflow-hidden bg-white/60 px-4"
            >
              <AccordionTrigger className="py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: "#C3B8D8" + "55" }}
                  >
                    <Mic size={15} style={{ color: WARM_DARK }} />
                  </div>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: WARM_DARK }}
                  >
                    Veil Voice
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <ToggleRow
                  id="voice-master"
                  label="Veil Voice (master)"
                  description="Soft spoken moments throughout Veil"
                  checked={settings.veilVoiceMaster}
                  onChange={(v) => onSettingsChange({ veilVoiceMaster: v })}
                />
                <p className="text-xs text-gray-400 mt-3 mb-2">
                  Individual Moments
                </p>
                {(
                  [
                    ["voiceAfterVoiceDump", "After voice dump"],
                    ["voiceAfterTextDump", "After text dump"],
                    ["voiceAfterSilentDump", "After silent dump"],
                    ["voiceMorningFollowUp", "Morning Follow-Up"],
                    ["voiceCarryingAwareness", "Carrying Awareness"],
                    ["voiceAfterCheckin", "After Check-In"],
                    ["voiceApologyMoments", "Apology moments"],
                    ["voiceLoveLetterMoments", "Love letter moments"],
                    ["voiceConfessionMoments", "Confession moments"],
                    ["voiceCelebrationMoments", "Celebration moments"],
                  ] as [keyof VeilSettings, string][]
                ).map(([key, label]) => (
                  <ToggleRow
                    key={key}
                    id={`v-${key}`}
                    label={label}
                    checked={settings[key] as boolean}
                    onChange={(v) => onSettingsChange({ [key]: v })}
                  />
                ))}
                <div className="mt-4">
                  <div className="flex justify-between mb-2">
                    <Label className="text-xs text-gray-400">Volume</Label>
                    <span className="text-xs text-gray-400">
                      Softer ← {settings.voiceVolume}% → Fuller
                    </span>
                  </div>
                  <Slider
                    data-ocid="settings.input"
                    min={40}
                    max={70}
                    step={1}
                    value={[settings.voiceVolume]}
                    onValueChange={([v]) =>
                      onSettingsChange({ voiceVolume: v })
                    }
                    aria-label="Veil Voice volume"
                    className="w-full"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 8. Journal */}
            <AccordionItem
              value="journal"
              className="border border-black/5 rounded-2xl overflow-hidden bg-white/60 px-4"
            >
              <AccordionTrigger className="py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${GOLD}33` }}
                  >
                    <BookOpen size={15} style={{ color: WARM_DARK }} />
                  </div>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: WARM_DARK }}
                  >
                    Journal
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <div>
                  <Label className="text-xs text-gray-400 mb-2 block">
                    Font
                  </Label>
                  <Select
                    value={settings.journalFont}
                    onValueChange={(v) => onSettingsChange({ journalFont: v })}
                  >
                    <SelectTrigger
                      data-ocid="settings.select"
                      className="rounded-xl text-sm"
                      aria-label="Journal font"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cormorant Garamond">
                        Cormorant Garamond (default)
                      </SelectItem>
                      <SelectItem value="Playfair Display">
                        Playfair Display
                      </SelectItem>
                      <SelectItem value="EB Garamond">EB Garamond</SelectItem>
                      <SelectItem value="Libre Baskerville">
                        Libre Baskerville
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <Label className="text-xs text-gray-400">Font Size</Label>
                    <span className="text-xs text-gray-400">
                      {settings.journalFontSize}px
                    </span>
                  </div>
                  <Slider
                    data-ocid="settings.input"
                    min={12}
                    max={24}
                    step={1}
                    value={[settings.journalFontSize]}
                    onValueChange={([v]) =>
                      onSettingsChange({ journalFontSize: v })
                    }
                    aria-label="Journal font size"
                  />
                </div>
                <ToggleRow
                  id="emotion-colors"
                  label="Emotion Colors"
                  checked={settings.emotionColors}
                  onChange={(v) => onSettingsChange({ emotionColors: v })}
                />
                <ToggleRow
                  id="book-aging"
                  label="Book Aging"
                  description="Cover ages with pages"
                  checked={settings.bookAging}
                  onChange={(v) => onSettingsChange({ bookAging: v })}
                />
                <ToggleRow
                  id="spine-growth"
                  label="Spine Growth"
                  checked={settings.spineGrowth}
                  onChange={(v) => onSettingsChange({ spineGrowth: v })}
                />
                <ToggleRow
                  id="page-turn-sound"
                  label="Page Turn Sound"
                  checked={settings.pageTurnSound}
                  onChange={(v) => onSettingsChange({ pageTurnSound: v })}
                />
                <ToggleRow
                  id="reading-ambient"
                  label="Reading Ambient Sound"
                  checked={settings.readingAmbient}
                  onChange={(v) => onSettingsChange({ readingAmbient: v })}
                />
                {settings.readingAmbient && (
                  <div>
                    <div className="flex justify-between mb-1">
                      <Label className="text-xs text-gray-400">
                        Ambient Volume
                      </Label>
                      <span className="text-xs text-gray-400">
                        {settings.ambientVolume}%
                      </span>
                    </div>
                    <Slider
                      data-ocid="settings.input"
                      min={5}
                      max={30}
                      step={1}
                      value={[settings.ambientVolume]}
                      onValueChange={([v]) =>
                        onSettingsChange({ ambientVolume: v })
                      }
                      aria-label="Ambient volume"
                    />
                  </div>
                )}
                <div>
                  <Label className="text-xs text-gray-400 mb-2 block">
                    Journal Lock
                  </Label>
                  <Select
                    value={settings.journalLock}
                    onValueChange={(v) => onSettingsChange({ journalLock: v })}
                  >
                    <SelectTrigger
                      data-ocid="settings.select"
                      className="rounded-xl text-sm"
                      aria-label="Journal lock"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="off">Off (default)</SelectItem>
                      <SelectItem value="biometric">
                        Face ID / Touch ID
                      </SelectItem>
                      <SelectItem value="pin">Separate PIN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <ToggleRow
                  id="screenshot-warn"
                  label="Screenshot Warning"
                  checked={settings.screenshotWarning}
                  onChange={(v) => onSettingsChange({ screenshotWarning: v })}
                />
                <div>
                  <Label className="text-xs text-gray-400 mb-2 block">
                    Season Preference
                  </Label>
                  <Select
                    value={settings.seasonPreference}
                    onValueChange={(v) =>
                      onSettingsChange({ seasonPreference: v })
                    }
                  >
                    <SelectTrigger
                      data-ocid="settings.select"
                      className="rounded-xl text-sm"
                      aria-label="Season preference"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Automatic</SelectItem>
                      <SelectItem value="northern">
                        Northern Hemisphere
                      </SelectItem>
                      <SelectItem value="southern">
                        Southern Hemisphere
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <button
                  type="button"
                  data-ocid="settings.button"
                  className="w-full py-2.5 rounded-xl text-sm border border-gray-200 text-gray-500"
                  onClick={() => toast("Exporting journal as PDF...")}
                  aria-label="Export journal"
                >
                  Export Journal as PDF
                </button>
                <button
                  type="button"
                  data-ocid="settings.delete_button"
                  className="w-full py-2.5 rounded-xl text-sm border border-red-200 text-red-400"
                  onClick={() =>
                    toast.error(
                      "Journal deletion requires 3-step confirmation.",
                    )
                  }
                  aria-label="Delete journal"
                >
                  Delete Journal
                </button>
              </AccordionContent>
            </AccordionItem>

            {/* 9. Reflections */}
            <AccordionItem
              value="reflections"
              className="border border-black/5 rounded-2xl overflow-hidden bg-white/60 px-4"
            >
              <AccordionTrigger className="py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: "#B8C4D4" + "55" }}
                  >
                    <Eye size={15} style={{ color: WARM_DARK }} />
                  </div>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: WARM_DARK }}
                  >
                    Reflections
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-3">
                <div>
                  <Label className="text-xs text-gray-400 mb-2 block">
                    Prompt Frequency
                  </Label>
                  <Select
                    value={settings.reflectionPromptFrequency}
                    onValueChange={(v) =>
                      onSettingsChange({ reflectionPromptFrequency: v })
                    }
                  >
                    <SelectTrigger
                      data-ocid="settings.select"
                      className="rounded-xl text-sm"
                      aria-label="Reflection prompt frequency"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">
                        Daily when triggered
                      </SelectItem>
                      <SelectItem value="few-days">
                        Every few days (default)
                      </SelectItem>
                      <SelectItem value="weekly">Weekly only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <ToggleRow
                  id="seasonal-prompts"
                  label="Seasonal Prompts"
                  checked={settings.seasonalPrompts}
                  onChange={(v) => onSettingsChange({ seasonalPrompts: v })}
                />
                <ToggleRow
                  id="anniversary-prompts"
                  label="Anniversary Prompts"
                  checked={settings.anniversaryPrompts}
                  onChange={(v) => onSettingsChange({ anniversaryPrompts: v })}
                />
                <ToggleRow
                  id="show-compass"
                  label="Show Emotional Compass"
                  checked={settings.showCompass}
                  onChange={(v) => onSettingsChange({ showCompass: v })}
                />
                <ToggleRow
                  id="compass-history"
                  label="12-month compass history"
                  checked={settings.compassHistory === "12months"}
                  onChange={(v) =>
                    onSettingsChange({
                      compassHistory: v ? "12months" : "current",
                    })
                  }
                />
                <ToggleRow
                  id="show-mirror"
                  label="Show People in My Story"
                  checked={settings.showConnectionMirror}
                  onChange={(v) =>
                    onSettingsChange({ showConnectionMirror: v })
                  }
                />
                <ToggleRow
                  id="ai-person"
                  label="AI Person Detection"
                  description="Off by default"
                  checked={settings.aiPersonDetection}
                  onChange={(v) => onSettingsChange({ aiPersonDetection: v })}
                />
                <ToggleRow
                  id="monthly-growth"
                  label="Monthly Growth Narrative"
                  checked={settings.monthlyGrowthNarrative}
                  onChange={(v) =>
                    onSettingsChange({ monthlyGrowthNarrative: v })
                  }
                />
                <ToggleRow
                  id="quarterly-growth"
                  label="Quarterly Growth Narrative"
                  checked={settings.quarterlyGrowthNarrative}
                  onChange={(v) =>
                    onSettingsChange({ quarterlyGrowthNarrative: v })
                  }
                />
                <ToggleRow
                  id="annual-growth"
                  label="Annual Growth Narrative"
                  checked={settings.annualGrowthNarrative}
                  onChange={(v) =>
                    onSettingsChange({ annualGrowthNarrative: v })
                  }
                />
                <ToggleRow
                  id="thematic"
                  label="Thematic Clustering"
                  description="After 10 reflections"
                  checked={settings.thematicClustering}
                  onChange={(v) => onSettingsChange({ thematicClustering: v })}
                />
                <Separator />
                <button
                  type="button"
                  data-ocid="settings.button"
                  className="w-full py-2.5 rounded-xl text-sm border border-gray-200 text-gray-500"
                  onClick={() => toast("Exporting reflections...")}
                  aria-label="Export reflections"
                >
                  Export Reflections as PDF
                </button>
                <button
                  type="button"
                  data-ocid="settings.delete_button"
                  className="w-full py-2.5 rounded-xl text-sm border border-red-200 text-red-400"
                  onClick={() =>
                    toast.error("Deletion requires 3-step confirmation.")
                  }
                  aria-label="Delete reflections"
                >
                  Delete All Reflections
                </button>
              </AccordionContent>
            </AccordionItem>

            {/* 10. Inner Circle */}
            <AccordionItem
              value="innercircle"
              className="border border-black/5 rounded-2xl overflow-hidden bg-white/60 px-4"
            >
              <AccordionTrigger className="py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: "#F9E4A0" + "55" }}
                  >
                    <Heart size={15} style={{ color: WARM_DARK }} />
                  </div>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: WARM_DARK }}
                  >
                    Inner Circle
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-3">
                <button
                  type="button"
                  data-ocid="settings.button"
                  className="w-full py-2.5 rounded-xl text-sm border border-gray-200 text-gray-500"
                  onClick={() => toast("Managing inner circle members...")}
                  aria-label="View all members"
                >
                  View All Members
                </button>
                <div>
                  <Label className="text-xs text-gray-400 mb-2 block">
                    Sharing Default
                  </Label>
                  <Select
                    value={settings.sharingDefault}
                    onValueChange={(v) =>
                      onSettingsChange({ sharingDefault: v })
                    }
                  >
                    <SelectTrigger
                      data-ocid="settings.select"
                      className="rounded-xl text-sm"
                      aria-label="Sharing default"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cousins">Cousins only</SelectItem>
                      <SelectItem value="friends">
                        Closest Friends only
                      </SelectItem>
                      <SelectItem value="both">
                        Both groups (default)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <ToggleRow
                  id="emotional-pulse"
                  label="Emotional Pulse"
                  description="Soft signal when someone may need support"
                  checked={settings.emotionalPulse}
                  onChange={(v) => onSettingsChange({ emotionalPulse: v })}
                />
                <div>
                  <Label className="text-xs text-gray-400 mb-2 block">
                    Alert Frequency
                  </Label>
                  <Select
                    value={settings.innerCircleNotifFrequency}
                    onValueChange={(v) =>
                      onSettingsChange({ innerCircleNotifFrequency: v })
                    }
                  >
                    <SelectTrigger
                      data-ocid="settings.select"
                      className="rounded-xl text-sm"
                      aria-label="Alert frequency"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="once-per-day">
                        Max once per day (default)
                      </SelectItem>
                      <SelectItem value="off">Off</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <ToggleRow
                  id="support-identity"
                  label="Reveal my name when I send support"
                  description="If off, you remain warm-anonymous"
                  checked={settings.supportIdentityReveal}
                  onChange={(v) =>
                    onSettingsChange({ supportIdentityReveal: v })
                  }
                />
              </AccordionContent>
            </AccordionItem>

            {/* 11. Support & Legal */}
            <AccordionItem
              value="support"
              className="border border-black/5 rounded-2xl overflow-hidden bg-white/60 px-4"
            >
              <AccordionTrigger className="py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: "#A8D8B8" + "55" }}
                  >
                    <HelpCircle size={15} style={{ color: WARM_DARK }} />
                  </div>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: WARM_DARK }}
                  >
                    Support & Legal
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-1">
                {["Help & FAQ", "Contact Support", "Report a Problem"].map(
                  (label) => (
                    <button
                      type="button"
                      key={label}
                      data-ocid="settings.button"
                      className="w-full text-left py-3 text-sm border-b border-black/5"
                      style={{ color: WARM_DARK }}
                      onClick={() => toast(`Opening ${label}...`)}
                      aria-label={label}
                    >
                      {label}
                    </button>
                  ),
                )}
                <div className="py-3 border-b border-black/5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Safety Resources
                  </p>
                  <div
                    className="space-y-2 rounded-2xl p-3"
                    style={{ backgroundColor: "#A8D8B8" + "22" }}
                  >
                    <p className="text-xs text-gray-500">
                      If you are in distress, help is available.
                    </p>
                    <p
                      className="text-sm font-medium"
                      style={{ color: WARM_DARK }}
                    >
                      iCall India: 9152987821
                    </p>
                    <p
                      className="text-sm font-medium"
                      style={{ color: WARM_DARK }}
                    >
                      Vandrevala: 1860-2662-345
                    </p>
                    <p
                      className="text-sm font-medium"
                      style={{ color: WARM_DARK }}
                    >
                      Crisis Text Line (US): Text HOME to 741741
                    </p>
                    <a
                      href="https://www.iasp.info/resources/Crisis_Centres/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 block"
                    >
                      International resources →
                    </a>
                  </div>
                </div>
                {[
                  "Terms of Service",
                  "Privacy Policy",
                  "Safety Guidelines",
                  "Cookie Policy",
                ].map((label) => (
                  <button
                    type="button"
                    key={label}
                    data-ocid="settings.link"
                    className="w-full text-left py-3 text-sm border-b border-black/5 text-blue-500"
                    onClick={() => toast(`Opening ${label}...`)}
                    aria-label={label}
                  >
                    {label}
                  </button>
                ))}
                <div className="pt-3 text-xs text-gray-400 space-y-1">
                  <p>Version 2.0.0 (Build 20)</p>
                  <button
                    type="button"
                    data-ocid="settings.button"
                    className="text-blue-400"
                    onClick={() => toast("Opening licenses...")}
                    aria-label="Licenses"
                  >
                    Licenses & Open Source
                  </button>
                  <br />
                  <button
                    type="button"
                    data-ocid="settings.button"
                    className="text-blue-400"
                    onClick={() => toast("Opening accessibility statement...")}
                    aria-label="Accessibility"
                  >
                    Accessibility Statement
                  </button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── Main ProfileTab ──────────────────────────────────────────────────────────
export interface ProfileTabProps {
  onNavigate: (
    tab: "home" | "write" | "journal" | "reflections" | "profile",
  ) => void;
  onOpenNotificationSettings?: () => void;
}

export function ProfileTab({
  onNavigate,
  onOpenNotificationSettings,
}: ProfileTabProps) {
  const [profile, setProfile] = useState<ProfileData>(loadProfileData);
  const [settings, setSettings] = useState<VeilSettings>(loadSettings);
  const [innerCircle] = useState<InnerCircleMember[]>(loadInnerCircle);
  const [timeline] = useState<TimelineEntry[]>(loadTimeline);
  const [showSettings, setShowSettings] = useState(false);
  const [showInnerCircle, setShowInnerCircle] = useState(false);
  const [showBecomingMoment, setShowBecomingMoment] = useState(false);
  const [becomingMomentDelivery, setBecomingMomentDelivery] =
    useState<ScheduledDelivery | null>(null);
  const [timelineView, setTimelineView] = useState<
    "daily" | "weekly" | "monthly"
  >("weekly");
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(
    new Set(),
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Significant Moments: check for Becoming Moment on Profile mount
  useEffect(() => {
    try {
      const pending = getPendingDelivery({
        surfaceTypeFilter: "BECOMING_MOMENT",
      });
      if (pending) {
        setBecomingMomentDelivery(pending.delivery);
        setShowBecomingMoment(true);
      }
    } catch {}
  }, []);

  const [compassState] = useState(() => {
    try {
      return buildCompassState();
    } catch {
      return {
        direction: "NORTH" as CompassDirection,
        narrative: "You have been living in an expansive place lately.",
        monthlyHistory: [],
      };
    }
  });

  const [volumes] = useState<JournalVolume[]>(() => {
    try {
      const vols = loadVolumes();
      if (vols.length > 0) return vols;
    } catch {
      /* ignore */
    }
    return [
      {
        id: "v1",
        name: "The First Year",
        dateStarted: "2024-01-01",
        dateClosed: "2024-12-31",
        isCurrent: false,
        dominantEmotion: "stressed",
        totalPages: 48,
      },
      {
        id: "v2",
        name: "What Shifted",
        dateStarted: "2025-01-01",
        isCurrent: true,
        dominantEmotion: "hopeful",
        totalPages: 22,
      },
    ] as JournalVolume[];
  });

  function updateProfile(data: Partial<ProfileData>) {
    setProfile((prev) => {
      const next = { ...prev, ...data };
      saveProfileData(next);
      return next;
    });
  }

  function updateSettings(data: Partial<VeilSettings>) {
    setSettings((prev) => {
      const next = { ...prev, ...data };
      saveSettings(next);
      return next;
    });
  }

  function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) =>
      updateProfile({ avatarUrl: ev.target?.result as string });
    reader.readAsDataURL(file);
  }

  function toggleExpand(id: string) {
    setExpandedEntries((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const tagline =
    profile.taglineType === "STATIC"
      ? profile.taglineStatic
      : profile.taglineDynamic;
  const sig = generateSignature(
    profile.displayName || "Veil",
    "veil-profile-seed",
  );
  const auraColor = profile.dominantAuraColor || "#C9B8E8";

  const weeklyDots = timeline
    .slice(0, 14)
    .map((e) => ({ color: e.auraColor, id: e.id }));

  const now = new Date();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();
  const firstDayOfWeek = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  ).getDay();
  const monthEntryMap: Record<number, string> = {};
  for (const e of timeline) {
    const d = new Date(e.createdAt);
    if (d.getMonth() === now.getMonth())
      monthEntryMap[d.getDate()] = e.auraColor;
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "#FAF7F2" }}>
      {/* Becoming Moment overlay */}
      {showBecomingMoment && (
        <BecomingMoment
          becomingLine={profile.becomingText}
          userSignature={profile.displayName}
          onComplete={(acknowledged) => {
            setShowBecomingMoment(false);
            if (becomingMomentDelivery)
              markDelivered(becomingMomentDelivery.id);
            if (acknowledged) {
              try {
                collectSignal("SIGNAL_BECOMING_ACKNOWLEDGED", "hopeful", 9, {});
              } catch {}
            }
          }}
        />
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarUpload}
        aria-label="Upload profile photo"
      />

      {/* ── Header ── */}
      <header
        className="relative pt-12 pb-6 px-5 text-center"
        style={{ backgroundColor: `${auraColor}26` }}
        aria-label={`${profile.displayName}'s profile header`}
      >
        <button
          type="button"
          data-ocid="profile.button"
          onClick={() => toast("Profile card copied — share your identity.")}
          className="absolute top-12 left-5 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(42,26,10,0.06)" }}
          aria-label="Share profile"
        >
          <Share2 size={16} style={{ color: WARM_DARK }} />
        </button>
        <button
          type="button"
          data-ocid="profile.open_modal_button"
          onClick={() => setShowSettings(true)}
          className="absolute top-12 right-5 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(42,26,10,0.06)" }}
          aria-label="Open settings"
        >
          <Settings size={16} style={{ color: WARM_DARK }} />
        </button>

        <button
          type="button"
          data-ocid="profile.button"
          onClick={() => fileInputRef.current?.click()}
          className="mx-auto mb-4 block"
          aria-label="Change profile photo"
        >
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold shadow-lg border-4 border-white overflow-hidden"
            style={{ backgroundColor: auraColor, color: WARM_DARK }}
          >
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={`${profile.displayName}'s avatar`}
                className="w-full h-full object-cover"
              />
            ) : (
              <span style={{ fontFamily: "'Playfair Display', serif" }}>
                {(profile.displayName || "V")[0].toUpperCase()}
              </span>
            )}
          </div>
        </button>

        <h1
          className="text-2xl font-bold mb-1"
          style={{
            fontFamily: "'Playfair Display', serif",
            color: WARM_DARK,
            letterSpacing: "-0.01em",
          }}
        >
          {profile.displayName || "Your Name"}
        </h1>

        <div
          className="flex justify-center mb-3"
          aria-label={`${sig.firstName}'s personal signature`}
        >
          <span
            style={{
              fontFamily: "'Dancing Script', cursive",
              fontWeight: 700,
              fontStyle: "italic",
              fontSize: 32,
              color: GOLD,
              letterSpacing: "0.01em",
              lineHeight: 1.2,
            }}
          >
            {sig.firstName}
          </span>
        </div>

        <p
          className="text-sm italic mb-2"
          style={{
            fontFamily: "'Playfair Display', serif",
            color: auraColor,
            filter: "brightness(0.65)",
          }}
        >
          {profile.identityTags.join(" · ")}
        </p>
        <p
          className="text-sm italic text-gray-500"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {tagline}
        </p>
      </header>

      <main className="px-4 space-y-4 mt-4">
        {/* ── Stats ── */}
        <section aria-label="Emotional stats">
          <div className="grid grid-cols-4 gap-2">
            {[
              {
                value: profile.momentsCaptured,
                label: "Moments\nCaptured",
                aria: `Moments Captured: ${profile.momentsCaptured}`,
              },
              {
                value: innerCircle.length,
                label: "Inner\nCircle",
                aria: `Inner Circle: ${innerCircle.length} people`,
              },
              {
                value: null,
                custom: (
                  <div className="text-center">
                    <p className="text-[10px] text-gray-500 leading-tight">
                      You have shown up
                    </p>
                    <p
                      className="text-xl font-bold"
                      style={{
                        color: WARM_DARK,
                        fontFamily: "'Playfair Display', serif",
                      }}
                    >
                      {profile.supportGivenCount}
                    </p>
                    <p className="text-[10px] text-gray-500">times</p>
                  </div>
                ),
                label: "Support\nGiven",
                aria: `Support Given: you have shown up ${profile.supportGivenCount} times`,
              },
              {
                value: profile.expressionsMade,
                label: "Expressions\nMade",
                aria: `Expressions Made: ${profile.expressionsMade}`,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                data-ocid="profile.card"
                className="bg-white rounded-2xl shadow-sm p-2 flex flex-col items-center justify-center text-center min-h-[80px]"
                aria-label={stat.aria}
              >
                {stat.custom ? (
                  stat.custom
                ) : (
                  <p
                    className="text-xl font-bold mb-0.5"
                    style={{
                      color: WARM_DARK,
                      fontFamily: "'Playfair Display', serif",
                    }}
                  >
                    {stat.value}
                  </p>
                )}
                <p className="text-[10px] text-gray-400 leading-tight whitespace-pre-line mt-0.5">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Becoming ── */}
        <section
          data-ocid="profile.card"
          className="rounded-3xl px-6 py-8 text-center"
          style={{ backgroundColor: `${auraColor}1F` }}
          aria-label="Becoming — private quarterly reflection"
        >
          <p
            className="text-lg italic leading-relaxed mb-3"
            style={{ fontFamily: "'Playfair Display', serif", color: GOLD }}
          >
            {profile.becomingText}
          </p>
          <p className="text-xs text-gray-400">
            Updated quarterly from your emotional journey.
          </p>
        </section>

        {/* ── Compass Preview ── */}
        <section
          data-ocid="profile.card"
          className="bg-white rounded-3xl shadow-sm px-5 py-4 flex items-center gap-4"
          aria-label={`Emotional compass: ${compassState.direction.replace(/_/g, " ")}. ${compassState.narrative}`}
        >
          <MiniCompassRose direction={compassState.direction} size={60} />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">
              Your Direction
            </p>
            <p
              className="text-sm leading-snug line-clamp-2"
              style={{ fontFamily: "Georgia, serif", color: WARM_DARK }}
            >
              {compassState.narrative}
            </p>
            <button
              type="button"
              data-ocid="profile.link"
              onClick={() => onNavigate("reflections")}
              className="flex items-center gap-1 mt-2 text-xs"
              style={{ color: GOLD, filter: "brightness(0.8)" }}
              aria-label="See full direction in Reflections"
            >
              See your full direction <ArrowRight size={11} />
            </button>
          </div>
        </section>

        {/* ── Life Chapters ── */}
        <section aria-label="Life chapters bookshelf">
          <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-3 px-1">
            Life Chapters
          </h2>
          {volumes.length === 0 ? (
            <div className="text-center py-6 px-4 rounded-3xl bg-white/60 border border-dashed border-gray-200">
              <div
                className="w-10 h-24 mx-auto rounded-t-sm mb-4 flex items-center justify-center"
                style={{ backgroundColor: auraColor }}
              >
                <span
                  className="text-white text-[9px] font-semibold"
                  style={{
                    writingMode: "vertical-rl",
                    transform: "rotate(180deg)",
                  }}
                >
                  {new Date().getFullYear()} — Being written
                </span>
              </div>
              <p
                className="text-sm leading-relaxed text-gray-500"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Your first chapter is being written.
                <br />
                Every emotion you bring to Veil is a page.
              </p>
            </div>
          ) : (
            <ul
              className="flex items-end gap-2 overflow-x-auto pb-3 px-1 list-none"
              style={{ scrollbarWidth: "none" }}
              aria-label="Journal volumes"
            >
              {volumes.map((vol, i) => (
                <li key={vol.id} data-ocid={`profile.item.${i + 1}`}>
                  <BookSpine
                    volume={vol}
                    onTap={() => {
                      toast(`Opening ${vol.name}...`);
                      onNavigate("journal");
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── Emotional Timeline ── */}
        <section aria-label="Emotional timeline">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-xs uppercase tracking-widest text-gray-400">
              Emotional Timeline
            </h2>
          </div>
          <div
            className="flex rounded-2xl bg-black/5 p-1 mb-4"
            role="tablist"
            aria-label="Timeline view"
          >
            {(["daily", "weekly", "monthly"] as const).map((v) => (
              <button
                type="button"
                key={v}
                data-ocid="profile.tab"
                role="tab"
                aria-selected={timelineView === v}
                onClick={() => setTimelineView(v)}
                className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all capitalize ${timelineView === v ? "bg-white shadow-sm" : "text-gray-400"}`}
                style={{ color: timelineView === v ? WARM_DARK : undefined }}
              >
                {v}
              </button>
            ))}
          </div>

          {timelineView === "weekly" && (
            <div className="mb-4">
              <ul
                className="flex gap-2 flex-wrap px-1 list-none"
                aria-label="Weekly emotion dots"
              >
                {weeklyDots.map((dot, i) => (
                  <li
                    key={dot.id}
                    className="w-5 h-5 rounded-full"
                    style={{ backgroundColor: dot.color }}
                    aria-label={`Entry ${i + 1}`}
                  />
                ))}
              </ul>
            </div>
          )}

          {timelineView === "monthly" && (
            <div className="mb-4">
              <div className="bg-white rounded-2xl p-4 shadow-sm mb-3">
                <p className="text-xs text-center text-gray-400 mb-3 font-medium">
                  {now.toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                    <span key={d} className="text-[10px] text-gray-300">
                      {d}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDayOfWeek }, (_, i) => i).map(
                    (n) => (
                      <div key={`empty-cell-${n}`} />
                    ),
                  )}
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                    (day) => {
                      const color = monthEntryMap[day];
                      return (
                        <div
                          key={day}
                          className="flex items-center justify-center h-7"
                        >
                          {color ? (
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: `${color}66` }}
                            >
                              <span
                                className="text-[10px]"
                                style={{ color: WARM_DARK }}
                              >
                                {day}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-300">
                              {day}
                            </span>
                          )}
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
              <div
                className="rounded-2xl px-4 py-3 text-sm italic text-gray-500 leading-relaxed"
                style={{
                  backgroundColor: `${auraColor}18`,
                  fontFamily: "Georgia, serif",
                }}
                aria-label="Monthly narrative"
              >
                This month carried some weight early on — something shifted by
                mid-month. The last week felt more open.
              </div>
            </div>
          )}

          <div data-ocid="profile.list" className="space-y-2">
            {timeline
              .slice(0, timelineView === "daily" ? 5 : 7)
              .map((entry, i) => (
                <div key={entry.id} data-ocid={`profile.item.${i + 1}`}>
                  <TimelineCard
                    entry={entry}
                    expanded={expandedEntries.has(entry.id)}
                    onToggleExpand={() => toggleExpand(entry.id)}
                  />
                </div>
              ))}
            {timeline.length === 0 && (
              <div
                data-ocid="profile.empty_state"
                className="text-center py-8 text-sm text-gray-400 italic"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Your emotional journey will appear here.
              </div>
            )}
          </div>
        </section>

        {/* ── Support Given ── */}
        <section
          data-ocid="profile.card"
          className="rounded-3xl px-6 py-6"
          style={{ backgroundColor: "#FEFBF4" }}
          aria-label="Support given — private record of care"
        >
          <p
            className="text-base font-semibold mb-4 leading-snug"
            style={{
              fontFamily: "'Playfair Display', serif",
              color: WARM_DARK,
            }}
          >
            You have shown up for the people in your circle.
          </p>
          <div className="space-y-2.5">
            {[
              `${profile.supportGivenCount || 3} times you sent support.`,
              `${profile.loveLettersCount || 2} love letters written.`,
              `${profile.apologiesMadeCount || 1} apologies made.`,
              `${profile.witnessCount || 1} times you were someone's witness.`,
            ].map((line) => (
              <p
                key={line}
                className="text-sm text-gray-600"
                style={{ fontFamily: "Georgia, serif" }}
              >
                {line}
              </p>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4 italic">
            Private — only you see this.
          </p>
        </section>

        {/* ── Inner Circle Entry ── */}
        <section aria-label="Inner circle">
          <button
            type="button"
            data-ocid="profile.open_modal_button"
            onClick={() => setShowInnerCircle(true)}
            className="w-full flex items-center justify-between bg-white rounded-3xl shadow-sm px-6 py-5"
            aria-label={`Inner Circle — ${innerCircle.length} people. Tap to open.`}
          >
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {innerCircle.slice(0, 3).map((m) => (
                  <div
                    key={m.id}
                    className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-semibold"
                    style={{
                      backgroundColor: m.avatarColor ?? "#C9B8E8",
                      color: WARM_DARK,
                    }}
                    aria-hidden="true"
                  >
                    {m.name[0]}
                  </div>
                ))}
              </div>
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{
                    color: WARM_DARK,
                    fontFamily: "'Playfair Display', serif",
                  }}
                >
                  Inner Circle
                </p>
                <p className="text-xs text-gray-400">
                  {innerCircle.length} trusted people
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-300" />
          </button>
        </section>
      </main>

      <footer className="px-4 pt-8 pb-4 text-center">
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()}. Built with{" "}
          <span aria-label="love">♥</span> using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            caffeine.ai
          </a>
        </p>
      </footer>

      {/* ── Overlays ── */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            data-ocid="profile.modal"
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-50"
          >
            <SettingsPanel
              profile={profile}
              settings={settings}
              onClose={() => setShowSettings(false)}
              onProfileChange={updateProfile}
              onSettingsChange={updateSettings}
              onOpenNotificationSettings={onOpenNotificationSettings}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showInnerCircle && (
          <motion.div
            data-ocid="inner_circle.modal"
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-50"
          >
            <InnerCircleDashboard
              members={innerCircle}
              onClose={() => setShowInnerCircle(false)}
              settings={settings}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ProfileTab;
