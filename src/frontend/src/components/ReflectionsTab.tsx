import { Switch } from "@/components/ui/switch";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Reflection } from "../backend";
import { useActor } from "../hooks/useActor";
import {
  type ActivePrompt,
  type CompassDirection,
  type CompassState,
  type ConnectionObservation,
  type ReflectionsSettings,
  type StoredReflection,
  type Theme,
  buildCompassState,
  buildConnectionMirror,
  detectCrisisSignal,
  detectThemes,
  generateActivePrompt,
  generateFollowUp,
  generateGrowthNarrative,
  getCompletionMessage,
  loadLocalReflections,
  loadReflectionsSettings,
  saveLocalReflection,
  saveReflectionsSettings,
} from "../lib/reflectionsEngine";
import { getVisualEntries } from "../lib/visualExpressionState";
import { AlgorithmInsightsPanel } from "./AlgorithmInsightsPanel";
import { EmotionalCompass } from "./EmotionalCompass";
import { VisualStoryGallery } from "./VisualStoryGallery";

// ─── Design tokens ────────────────────────────────────────────────────────────

const SP_BG = "#1A2030";
const SP_CARD = "#1E2840";
const SP_CARD2 = "#232E4A";
const CREAM = "#F5F0E8";
const GOLD = "#D4AF6A";
const MUTED = "rgba(245,240,232,0.42)";

// ─── Compass SVG ─────────────────────────────────────────────────────────────

const ZONE_COLORS: Record<string, string> = {
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

function CompassRose({
  direction,
  size = 180,
  mini = false,
}: { direction: CompassDirection; size?: number; mini?: boolean }) {
  const angle = dirAngle(direction);
  const needleColor = ZONE_COLORS[direction] ?? GOLD;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - (mini ? 2 : 6);

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
        stroke="rgba(245,240,232,0.12)"
        strokeWidth={mini ? 0.8 : 1.2}
        strokeDasharray="3,5"
      />
      {[0, 90, 180, 270].map((a, idx) => {
        const colors = ["#F9E4A0", "#F4C28A", "#C3B8D8", "#B8C4D4"];
        const rad = (a * Math.PI) / 180;
        return (
          <line
            key={`zone-${a}`}
            x1={cx + r * 0.5 * Math.cos(rad - Math.PI / 2)}
            y1={cy + r * 0.5 * Math.sin(rad - Math.PI / 2)}
            x2={cx + r * Math.cos(rad - Math.PI / 2)}
            y2={cy + r * Math.sin(rad - Math.PI / 2)}
            stroke={colors[idx]}
            strokeWidth={mini ? 0.8 : 1.5}
            opacity={0.35}
          />
        );
      })}
      {!mini &&
        [
          { label: "N", a: -90, c: "#F9E4A0" },
          { label: "S", a: 90, c: "#C3B8D8" },
          { label: "E", a: 0, c: "#F4C28A" },
          { label: "W", a: 180, c: "#B8C4D4" },
        ].map(({ label, a, c }) => {
          const rad = (a * Math.PI) / 180;
          return (
            <text
              key={label}
              x={cx + (r + 10) * Math.cos(rad)}
              y={cy + (r + 10) * Math.sin(rad)}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={9}
              fill={c}
              fontFamily="serif"
              opacity={0.65}
            >
              {label}
            </text>
          );
        })}
      <circle cx={cx} cy={cy} r={mini ? 1.5 : 3} fill={GOLD} opacity={0.8} />
      <g transform={`rotate(${angle}, ${cx}, ${cy})`}>
        <polygon
          points={`${cx},${cy - r * 0.65} ${cx - (mini ? 1.5 : 3)},${cy} ${cx},${cy + r * 0.22} ${cx + (mini ? 1.5 : 3)},${cy}`}
          fill={needleColor}
          opacity={0.9}
        />
      </g>
    </svg>
  );
}

// ─── Crisis Card ─────────────────────────────────────────────────────────────

function CrisisCard({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      className="rounded-2xl p-5 mb-4"
      style={{
        background: "rgba(210,80,70,0.1)",
        border: "1px solid rgba(210,80,70,0.35)",
      }}
    >
      <p
        className="font-serif text-sm leading-relaxed mb-3"
        style={{ color: CREAM }}
      >
        What you wrote suggests you might be going through something very hard.
        You don't have to carry this alone.
      </p>
      <div
        className="space-y-1.5 text-xs"
        style={{ color: CREAM, opacity: 0.8 }}
      >
        <div>
          📞 iCall India: <strong>9152987821</strong>
        </div>
        <div>
          📞 Vandrevala Foundation: <strong>1860-2662-345</strong>
        </div>
        <div>
          💬 Crisis Text Line (US): Text <strong>HOME to 741741</strong>
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="mt-3 text-xs opacity-50 underline"
        style={{ color: CREAM }}
      >
        I'm safe, continue
      </button>
    </div>
  );
}

// ─── Still Pool Header ────────────────────────────────────────────────────────

function StillPoolHeader({
  children,
  compact = false,
}: { children: React.ReactNode; compact?: boolean }) {
  return (
    <div
      className="relative px-6 pb-7"
      style={{
        paddingTop: compact ? "3.5rem" : "3.5rem",
        background: `radial-gradient(ellipse at 50% 0%, rgba(70,90,140,0.32) 0%, ${SP_BG} 70%)`,
      }}
    >
      {[0.28, 0.52, 0.76].map((scale) => (
        <div
          key={scale}
          className="absolute rounded-full pointer-events-none"
          style={{
            border: "1px solid rgba(180,205,235,0.05)",
            width: `${scale * 320}%`,
            height: `${scale * 320}%`,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
      <div className="relative">{children}</div>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type View =
  | "main"
  | "writing"
  | "voice-recording"
  | "followup"
  | "writing-followup"
  | "completion"
  | "archive"
  | "archive-page"
  | "compass"
  | "connection"
  | "growth"
  | "settings";

// ─── Main Component ───────────────────────────────────────────────────────────

export function ReflectionsTab() {
  const { actor, isFetching } = useActor();
  const qc = useQueryClient();

  const [view, setView] = useState<View>("main");
  const [activePrompt, setActivePrompt] = useState<ActivePrompt | null>(null);
  const [localReflections, setLocalReflections] = useState<StoredReflection[]>(
    [],
  );
  const [settings, setSettings] = useState<ReflectionsSettings>(
    loadReflectionsSettings,
  );
  const [isFirstTime, setIsFirstTime] = useState(false);

  // Writing
  const [writingText, setWritingText] = useState("");
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [followUpText, setFollowUpText] = useState("");
  const [completionMessage, setCompletionMessage] = useState("");
  const [crisisDetected, setCrisisDetected] = useState(false);
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const draftKey = "veil-reflection-draft";

  // Voice
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingDone, setRecordingDone] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Intelligence
  const [compassState, setCompassState] = useState<CompassState | null>(null);
  const [showCompassOverlay, setShowCompassOverlay] = useState(false);
  const [connections, setConnections] = useState<ConnectionObservation[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);

  // Archive
  const [selectedReflection, setSelectedReflection] =
    useState<StoredReflection | null>(null);
  const [archiveFilter, setArchiveFilter] = useState<
    "time" | "theme" | "emotion"
  >("time");

  const { data: backendReflections } = useQuery<Reflection[]>({
    queryKey: ["reflections"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllReflections();
    },
    enabled: !!actor && !isFetching,
  });

  useEffect(() => {
    const local = loadLocalReflections();
    setLocalReflections(local);
    const hasAny = local.length > 0 || (backendReflections?.length ?? 0) > 0;
    setIsFirstTime(!hasAny);
    const draft = localStorage.getItem(draftKey);
    if (draft) setWritingText(draft);
    setCompassState(buildCompassState());
    setConnections(buildConnectionMirror());
    setThemes(detectThemes(local));
  }, [backendReflections]);

  useEffect(() => {
    if (localReflections.length > 0 || (backendReflections?.length ?? 0) > 0) {
      setActivePrompt(generateActivePrompt(localReflections));
    }
  }, [localReflections, backendReflections]);

  // Auto-save draft
  useEffect(() => {
    if (view === "writing") {
      autoSaveRef.current = setInterval(() => {
        localStorage.setItem(draftKey, writingText);
      }, 30000);
    } else {
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    }
    return () => {
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
  }, [view, writingText]);

  function updateSettings(patch: Partial<ReflectionsSettings>) {
    setSettings((s) => {
      const updated = { ...s, ...patch };
      saveReflectionsSettings(updated);
      return updated;
    });
  }

  function handleFirstQuestion() {
    setActivePrompt({
      text: "You are here. That means something.\n\nWhat brought you to Veil? What are you hoping to understand?",
      type: "DEFAULT",
      priority: 8,
    });
    setIsFirstTime(false);
  }

  function handleDismissPrompt() {
    setActivePrompt(null);
    updateSettings({ lastDismissed: Date.now() });
    toast.success("A new reflection will be here tomorrow.", {
      duration: 3000,
    });
  }

  function handleDoneWriting() {
    if (detectCrisisSignal(writingText)) {
      setCrisisDetected(true);
      return;
    }
    const fq = generateFollowUp(writingText, activePrompt?.type ?? "DEFAULT");
    setFollowUpQuestion(fq);
    setView("followup");
  }

  async function handleSaveReflection(skipFollowUp = false) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const now = new Date();
    const SEASONS: Record<number, string> = {
      0: "WINTER",
      1: "WINTER",
      2: "SPRING",
      3: "SPRING",
      4: "SPRING",
      5: "SUMMER",
      6: "SUMMER",
      7: "SUMMER",
      8: "FALL",
      9: "FALL",
      10: "FALL",
      11: "WINTER",
    };
    const stored: StoredReflection = {
      id,
      prompt: activePrompt?.text ?? "",
      promptType: activePrompt?.type ?? "DEFAULT",
      response: writingText,
      followUpQuestion: skipFollowUp
        ? undefined
        : followUpQuestion || undefined,
      followUpResponse: skipFollowUp ? undefined : followUpText || undefined,
      timestamp: Date.now(),
      season: SEASONS[now.getMonth()],
    };
    saveLocalReflection(stored);

    if (actor) {
      try {
        await actor.addReflection(stored.prompt, stored.response);
        qc.invalidateQueries({ queryKey: ["reflections"] });
      } catch {
        // local is enough
      }
    }

    localStorage.removeItem(draftKey);
    const updated = [...localReflections, stored];
    setLocalReflections(updated);
    setThemes(detectThemes(updated));
    setCompletionMessage(getCompletionMessage(activePrompt?.type ?? "DEFAULT"));
    setView("completion");
    setWritingText("");
    setFollowUpText("");
  }

  function formatDur(s: number) {
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        for (const t of stream.getTracks()) {
          t.stop();
        }
      };
      mr.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(
        () => setRecordingSeconds((s) => s + 1),
        1000,
      );
    } catch {
      toast.error("Could not access microphone");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    setRecordingDone(true);
  }

  // ─── View: Writing ────────────────────────────────────────────────────────

  if (view === "writing" || view === "writing-followup") {
    const isFollowUp = view === "writing-followup";
    return (
      <div
        className="fixed inset-0 flex flex-col z-50"
        style={{ background: SP_BG }}
      >
        <div
          className="px-5 pt-14 pb-4"
          style={{ borderBottom: "1px solid rgba(245,240,232,0.07)" }}
        >
          <button
            type="button"
            onClick={() => setView(isFollowUp ? "followup" : "main")}
            className="text-xs mb-3 opacity-40"
            style={{ color: CREAM }}
          >
            ← Back
          </button>
          <p
            className="font-serif text-sm leading-relaxed italic"
            style={{ color: MUTED }}
          >
            {isFollowUp ? followUpQuestion : activePrompt?.text}
          </p>
        </div>
        {!isFollowUp && crisisDetected && (
          <div className="px-5 pt-4">
            <CrisisCard onDismiss={() => setCrisisDetected(false)} />
          </div>
        )}
        <div className="flex-1 px-5 pt-5 flex flex-col overflow-hidden">
          <textarea
            data-ocid={
              isFollowUp
                ? "reflections.followup_textarea"
                : "reflections.textarea"
            }
            value={isFollowUp ? followUpText : writingText}
            onChange={(e) =>
              isFollowUp
                ? setFollowUpText(e.target.value)
                : setWritingText(e.target.value)
            }
            placeholder="Write freely. There is no right answer."
            className="flex-1 w-full resize-none outline-none font-serif text-base"
            style={{
              background: "transparent",
              color: CREAM,
              caretColor: GOLD,
              lineHeight: "2",
              minHeight: 0,
            }}
          />
        </div>
        <div
          className="px-5 pb-10 pt-4"
          style={{ borderTop: "1px solid rgba(245,240,232,0.05)" }}
        >
          <button
            data-ocid={
              isFollowUp
                ? "reflections.followup_complete_button"
                : "reflections.done_writing_button"
            }
            type="button"
            onClick={
              isFollowUp ? () => handleSaveReflection(false) : handleDoneWriting
            }
            disabled={!(isFollowUp ? followUpText.trim() : writingText.trim())}
            className="w-full py-4 rounded-2xl font-serif text-sm transition-all duration-300"
            style={{
              background: (
                isFollowUp
                  ? followUpText.trim()
                  : writingText.trim()
              )
                ? "linear-gradient(135deg, #283250 0%, #3A4870 100%)"
                : "rgba(245,240,232,0.05)",
              color: (isFollowUp ? followUpText.trim() : writingText.trim())
                ? CREAM
                : "rgba(245,240,232,0.25)",
              border: `1px solid ${(isFollowUp ? followUpText.trim() : writingText.trim()) ? "rgba(212,175,106,0.28)" : "transparent"}`,
            }}
          >
            {isFollowUp ? "Complete this reflection →" : "Done writing →"}
          </button>
        </div>
      </div>
    );
  }

  // ─── View: Voice ──────────────────────────────────────────────────────────

  if (view === "voice-recording") {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center z-50"
        style={{ background: SP_BG }}
      >
        <div className="w-full px-5 pt-14">
          <button
            type="button"
            onClick={() => setView("main")}
            className="text-xs opacity-40 mb-5"
            style={{ color: CREAM }}
          >
            ← Back
          </button>
          {activePrompt && (
            <p
              className="font-serif text-sm leading-relaxed italic text-center mb-8"
              style={{ color: MUTED }}
            >
              {activePrompt.text}
            </p>
          )}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-8 w-full px-8">
          <button
            data-ocid="reflections.voice_toggle"
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className="relative flex items-center justify-center"
            style={{ width: 140, height: 140 }}
          >
            <motion.div
              animate={
                isRecording
                  ? {
                      scale: [1, 1.14, 0.97, 1.1, 1],
                      opacity: [0.6, 1, 0.75, 1, 0.6],
                    }
                  : { scale: 1, opacity: 0.35 }
              }
              transition={
                isRecording
                  ? {
                      duration: 2.8,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }
                  : {}
              }
              className="absolute rounded-full"
              style={{
                width: 110,
                height: 110,
                background:
                  "radial-gradient(circle, rgba(212,175,106,0.22) 0%, rgba(212,175,106,0.04) 70%)",
                border: "1px solid rgba(212,175,106,0.28)",
              }}
            />
            <div
              className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: isRecording
                  ? "rgba(212,175,106,0.18)"
                  : "rgba(245,240,232,0.07)",
                border: `1.5px solid ${isRecording ? "rgba(212,175,106,0.55)" : "rgba(245,240,232,0.18)"}`,
              }}
            >
              <span className="text-3xl">{isRecording ? "⬛" : "🎤"}</span>
            </div>
          </button>
          {isRecording && (
            <p className="font-serif text-sm" style={{ color: GOLD }}>
              {formatDur(recordingSeconds)}
            </p>
          )}
          {!isRecording && !recordingDone && (
            <p
              className="font-serif text-sm text-center"
              style={{ color: MUTED }}
            >
              Tap to begin speaking.
              <br />
              Tap again to stop.
            </p>
          )}
          {recordingDone && (
            <div className="flex flex-col items-center gap-3 w-full">
              <p className="font-serif text-sm" style={{ color: CREAM }}>
                Voice entry — {formatDur(recordingSeconds)}
              </p>
              <div className="flex gap-3 w-full">
                <button
                  data-ocid="reflections.voice_keep_button"
                  type="button"
                  onClick={() => {
                    setWritingText(
                      `[Voice reflection — ${formatDur(recordingSeconds)}]`,
                    );
                    const fq = generateFollowUp(
                      "voice reflection",
                      activePrompt?.type ?? "DEFAULT",
                    );
                    setFollowUpQuestion(fq);
                    setView("followup");
                  }}
                  className="flex-1 py-3 rounded-xl text-sm font-serif"
                  style={{
                    background: "rgba(212,175,106,0.13)",
                    border: "1px solid rgba(212,175,106,0.38)",
                    color: CREAM,
                  }}
                >
                  Keep this
                </button>
                <button
                  data-ocid="reflections.voice_discard_button"
                  type="button"
                  onClick={() => {
                    setRecordingDone(false);
                    setRecordingSeconds(0);
                  }}
                  className="flex-1 py-3 rounded-xl text-sm font-serif"
                  style={{
                    background: "rgba(245,240,232,0.05)",
                    border: "1px solid rgba(245,240,232,0.09)",
                    color: MUTED,
                  }}
                >
                  Discard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── View: Follow-up ──────────────────────────────────────────────────────

  if (view === "followup") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 flex flex-col z-50"
        style={{ background: SP_BG }}
      >
        <div className="flex-1 flex flex-col items-center justify-center px-8 gap-8">
          <p
            className="font-serif text-xs uppercase tracking-widest"
            style={{ color: GOLD, opacity: 0.65 }}
          >
            One more thing —
          </p>
          <p
            className="font-serif text-xl leading-relaxed text-center"
            style={{ color: CREAM }}
          >
            {followUpQuestion}
          </p>
          <div className="w-full space-y-3">
            <button
              data-ocid="reflections.followup_answer_button"
              type="button"
              onClick={() => setView("writing-followup")}
              className="w-full py-4 rounded-2xl font-serif text-sm"
              style={{
                background: "rgba(212,175,106,0.11)",
                border: "1px solid rgba(212,175,106,0.3)",
                color: CREAM,
              }}
            >
              Answer this
            </button>
            <button
              data-ocid="reflections.followup_skip_button"
              type="button"
              onClick={() => handleSaveReflection(true)}
              className="w-full py-4 rounded-2xl font-serif text-sm"
              style={{ background: "transparent", color: MUTED }}
            >
              That's enough for today
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // ─── View: Completion ────────────────────────────────────────────────────

  if (view === "completion") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 flex flex-col items-center justify-center z-50 px-8"
        style={{ background: SP_BG }}
      >
        <div
          className="w-20 h-px mb-10"
          style={{
            background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
          }}
        />
        <p
          className="font-serif text-xl leading-relaxed text-center mb-12"
          style={{ color: CREAM }}
        >
          {completionMessage}
        </p>
        <button
          data-ocid="reflections.completion_return_button"
          type="button"
          onClick={() => {
            setView("main");
            setActivePrompt(generateActivePrompt(localReflections));
          }}
          className="py-3 px-8 rounded-2xl font-serif text-sm"
          style={{
            background: "rgba(212,175,106,0.11)",
            border: "1px solid rgba(212,175,106,0.28)",
            color: CREAM,
          }}
        >
          Return to Reflections
        </button>
      </motion.div>
    );
  }

  // ─── View: Compass ────────────────────────────────────────────────────────

  if (view === "compass") {
    const cs = compassState ?? {
      direction: "WEST" as CompassDirection,
      narrative: "Sit with things. Not rushing to answers.",
      monthlyHistory: [],
    };
    return (
      <div className="min-h-screen pb-28" style={{ background: SP_BG }}>
        <StillPoolHeader>
          <button
            type="button"
            onClick={() => setView("main")}
            className="text-xs mb-4 opacity-40"
            style={{ color: CREAM }}
          >
            ← Reflections
          </button>
          <h1
            className="font-serif text-2xl font-medium"
            style={{ color: CREAM }}
          >
            Your Direction
          </h1>
        </StillPoolHeader>
        <div className="px-6 py-8 flex flex-col items-center gap-7">
          <CompassRose direction={cs.direction} size={200} />
          <p
            className="font-serif text-base leading-relaxed text-center italic max-w-xs"
            style={{ color: CREAM }}
          >
            {cs.narrative}
          </p>
          {cs.monthlyHistory.length > 0 && (
            <div className="w-full">
              <p
                className="text-xs text-center mb-4 uppercase tracking-widest"
                style={{ color: MUTED }}
              >
                12 months
              </p>
              <div className="flex gap-1.5 flex-wrap justify-center">
                {cs.monthlyHistory.map((m) => (
                  <div
                    key={m.month}
                    className="flex flex-col items-center gap-1"
                  >
                    <CompassRose direction={m.direction} size={34} mini />
                    <span style={{ color: MUTED, fontSize: 8 }}>{m.month}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <button
            data-ocid="reflections.compass_reflect_button"
            type="button"
            onClick={() => {
              setActivePrompt({
                text: `Your compass has been pointing ${cs.direction.replace(/_/g, " ").toLowerCase()} lately. What do you think is driving that?`,
                type: "COMPASS_REFLECTION",
                priority: 1,
              });
              setView("writing");
            }}
            className="w-full max-w-xs py-3 rounded-2xl font-serif text-sm"
            style={{
              background: "rgba(212,175,106,0.1)",
              border: "1px solid rgba(212,175,106,0.24)",
              color: CREAM,
            }}
          >
            Reflect on your direction →
          </button>
        </div>
      </div>
    );
  }

  // ─── View: Connection ─────────────────────────────────────────────────────

  if (view === "connection") {
    return (
      <div className="min-h-screen pb-28" style={{ background: SP_BG }}>
        <StillPoolHeader>
          <button
            type="button"
            onClick={() => setView("main")}
            className="text-xs mb-4 opacity-40"
            style={{ color: CREAM }}
          >
            ← Reflections
          </button>
          <h1
            className="font-serif text-2xl font-medium"
            style={{ color: CREAM }}
          >
            People in Your Story
          </h1>
        </StillPoolHeader>
        <div className="px-6 py-8 space-y-4">
          {connections.length === 0 ? (
            <p
              data-ocid="reflections.connection.empty_state"
              className="font-serif text-sm leading-relaxed text-center py-12"
              style={{ color: MUTED }}
            >
              The people in your story will appear here
              <br />
              as you write.
            </p>
          ) : (
            connections.map((c, i) => (
              <div
                key={c.personLabel}
                data-ocid={`reflections.connection.item.${i + 1}`}
                className="rounded-2xl p-5"
                style={{
                  background: SP_CARD,
                  border: "1px solid rgba(245,240,232,0.06)",
                }}
              >
                <h3
                  className="font-serif text-base mb-2"
                  style={{ color: CREAM }}
                >
                  {c.personLabel}
                </h3>
                <p
                  className="text-sm leading-relaxed mb-3"
                  style={{ color: MUTED }}
                >
                  {c.observation}
                </p>
                <button
                  data-ocid={`reflections.connection.reflect_button.${i + 1}`}
                  type="button"
                  onClick={() => {
                    setActivePrompt({
                      text: c.reflectionPrompt,
                      type: "CONNECTION_REFLECTION",
                      priority: 1,
                    });
                    setView("writing");
                  }}
                  className="text-xs font-serif"
                  style={{ color: GOLD, opacity: 0.75 }}
                >
                  Reflect on this connection →
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // ─── View: Growth ─────────────────────────────────────────────────────────

  if (view === "growth") {
    const narratives = [
      {
        label: "This month",
        text: generateGrowthNarrative(localReflections, "monthly"),
        show: settings.monthlyNarrative,
      },
      {
        label: "This quarter",
        text:
          localReflections.length >= 5
            ? generateGrowthNarrative(localReflections, "quarterly")
            : "",
        show: settings.quarterlyNarrative,
      },
      {
        label: "This year",
        text:
          localReflections.length >= 10
            ? generateGrowthNarrative(localReflections, "annual")
            : "",
        show: settings.annualNarrative,
      },
    ].filter((n) => n.show && n.text);

    return (
      <div className="min-h-screen pb-28" style={{ background: SP_BG }}>
        <StillPoolHeader>
          <button
            type="button"
            onClick={() => setView("main")}
            className="text-xs mb-4 opacity-40"
            style={{ color: CREAM }}
          >
            ← Reflections
          </button>
          <h1
            className="font-serif text-2xl font-medium"
            style={{ color: CREAM }}
          >
            How Far You Have Come
          </h1>
        </StillPoolHeader>
        <div className="px-6 py-8 space-y-6">
          {narratives.length === 0 ? (
            <p
              className="font-serif text-sm text-center py-12"
              style={{ color: MUTED }}
            >
              Your growth narrative will appear
              <br />
              after your first reflections.
            </p>
          ) : (
            narratives.map((n, i) => (
              <div
                key={n.label}
                data-ocid={`reflections.growth.item.${i + 1}`}
                className="rounded-2xl p-6"
                style={{
                  background: SP_CARD,
                  border: "1px solid rgba(245,240,232,0.06)",
                }}
              >
                <p
                  className="text-xs uppercase tracking-widest mb-4"
                  style={{ color: GOLD, opacity: 0.65 }}
                >
                  {n.label}
                </p>
                <p
                  className="font-serif text-sm leading-8 whitespace-pre-line"
                  style={{ color: CREAM }}
                >
                  {n.text}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // ─── View: Archive ────────────────────────────────────────────────────────

  if (view === "archive-page" && selectedReflection) {
    const d = new Date(selectedReflection.timestamp);
    return (
      <div className="min-h-screen pb-28" style={{ background: SP_BG }}>
        <div className="px-6 pt-14 pb-4">
          <button
            type="button"
            onClick={() => setView("archive")}
            className="text-xs mb-4 opacity-40"
            style={{ color: CREAM }}
          >
            ← Archive
          </button>
        </div>
        <div
          className="mx-5 rounded-2xl p-6"
          style={{
            background: SP_CARD,
            border: "1px solid rgba(212,175,106,0.14)",
          }}
        >
          <div className="flex justify-between items-start mb-5">
            <span className="text-xs" style={{ color: MUTED }}>
              {d.toLocaleDateString("en", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span className="text-xs" style={{ color: MUTED }}>
              Reflection
            </span>
          </div>
          <div
            className="h-px mb-5"
            style={{ background: "rgba(212,175,106,0.18)" }}
          />
          <p
            className="font-serif text-xs italic leading-relaxed mb-4"
            style={{ color: MUTED }}
          >
            {selectedReflection.prompt}
          </p>
          <p className="font-serif text-sm leading-8" style={{ color: CREAM }}>
            {selectedReflection.response}
          </p>
          {selectedReflection.followUpQuestion &&
            selectedReflection.followUpResponse && (
              <>
                <div
                  className="h-px my-5"
                  style={{ background: "rgba(245,240,232,0.07)" }}
                />
                <p
                  className="font-serif text-xs italic leading-relaxed mb-3"
                  style={{ color: MUTED }}
                >
                  {selectedReflection.followUpQuestion}
                </p>
                <p
                  className="font-serif text-sm leading-8"
                  style={{ color: CREAM }}
                >
                  {selectedReflection.followUpResponse}
                </p>
              </>
            )}
          <div
            className="h-px mt-5 mb-4"
            style={{ background: "rgba(212,175,106,0.18)" }}
          />
          <p className="text-xs text-center" style={{ color: MUTED }}>
            {selectedReflection.season} ·{" "}
            {selectedReflection.promptType.replace(/_/g, " ").toLowerCase()}
          </p>
        </div>
      </div>
    );
  }

  if (view === "archive") {
    const grouped: Record<string, StoredReflection[]> = {};
    for (const r of localReflections) {
      const key = new Date(r.timestamp).getFullYear().toString();
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(r);
    }

    return (
      <div className="min-h-screen pb-28" style={{ background: SP_BG }}>
        <StillPoolHeader>
          <button
            type="button"
            onClick={() => setView("main")}
            className="text-xs mb-4 opacity-40"
            style={{ color: CREAM }}
          >
            ← Reflections
          </button>
          <h1
            className="font-serif text-2xl font-medium"
            style={{ color: CREAM }}
          >
            Your Reflections
          </h1>
          <p className="text-xs mt-1" style={{ color: MUTED }}>
            {localReflections.length} written
          </p>
        </StillPoolHeader>
        <div className="px-6 pt-4 pb-2 flex gap-2">
          {(["time", "theme", "emotion"] as const).map((f) => (
            <button
              key={f}
              data-ocid={`reflections.archive.${f}_tab`}
              type="button"
              onClick={() => setArchiveFilter(f)}
              className="text-xs px-3 py-1.5 rounded-full capitalize"
              style={{
                background:
                  archiveFilter === f
                    ? "rgba(212,175,106,0.18)"
                    : "rgba(245,240,232,0.05)",
                border: `1px solid ${archiveFilter === f ? "rgba(212,175,106,0.45)" : "rgba(245,240,232,0.09)"}`,
                color: archiveFilter === f ? GOLD : MUTED,
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="px-6 py-4 space-y-6">
          {localReflections.length === 0 ? (
            <p
              data-ocid="reflections.archive.empty_state"
              className="font-serif text-sm text-center py-12"
              style={{ color: MUTED }}
            >
              Your reflections will appear here.
            </p>
          ) : archiveFilter === "theme" && themes.length > 0 ? (
            themes.map((theme, i) => (
              <div
                key={theme.title}
                data-ocid={`reflections.archive.theme.item.${i + 1}`}
                className="rounded-2xl p-5"
                style={{
                  background: SP_CARD,
                  border: "1px solid rgba(245,240,232,0.06)",
                }}
              >
                <h3
                  className="font-serif text-base mb-2"
                  style={{ color: CREAM }}
                >
                  {theme.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
                  {theme.description}
                </p>
              </div>
            ))
          ) : archiveFilter === "emotion" ? (
            (() => {
              const byEmotion: Record<string, StoredReflection[]> = {};
              for (const r of localReflections) {
                const e = r.emotionType ?? "reflective";
                if (!byEmotion[e]) byEmotion[e] = [];
                byEmotion[e].push(r);
              }
              return Object.entries(byEmotion).map(([emotion, refl]) => (
                <div key={emotion}>
                  <p
                    className="text-xs uppercase tracking-widest mb-3 capitalize"
                    style={{ color: GOLD, opacity: 0.6 }}
                  >
                    {emotion}
                  </p>
                  <div className="space-y-2">
                    {refl.slice(0, 3).map((r, i) => (
                      <button
                        key={r.id}
                        data-ocid={`reflections.archive.item.${i + 1}`}
                        type="button"
                        onClick={() => {
                          setSelectedReflection(r);
                          setView("archive-page");
                        }}
                        className="w-full text-left rounded-xl p-3"
                        style={{
                          background: SP_CARD,
                          border: "1px solid rgba(245,240,232,0.05)",
                        }}
                      >
                        <p
                          className="font-serif text-xs italic mb-1"
                          style={{ color: MUTED }}
                        >
                          {r.prompt.slice(0, 50)}...
                        </p>
                        <p
                          className="text-sm line-clamp-1"
                          style={{ color: CREAM, opacity: 0.8 }}
                        >
                          {r.response.slice(0, 80)}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ));
            })()
          ) : (
            Object.entries(grouped)
              .sort(([a], [b]) => Number(b) - Number(a))
              .map(([year, refl]) => (
                <div key={year}>
                  <p
                    className="text-xs uppercase tracking-widest mb-3"
                    style={{ color: GOLD, opacity: 0.55 }}
                  >
                    {year}
                  </p>
                  <div className="space-y-3">
                    {refl.map((r, i) => (
                      <button
                        key={r.id}
                        data-ocid={`reflections.archive.item.${i + 1}`}
                        type="button"
                        onClick={() => {
                          setSelectedReflection(r);
                          setView("archive-page");
                        }}
                        className="w-full text-left rounded-2xl p-4"
                        style={{
                          background: SP_CARD,
                          border: "1px solid rgba(245,240,232,0.06)",
                        }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span
                            className="text-xs"
                            style={{ color: GOLD, opacity: 0.55 }}
                          >
                            {new Date(r.timestamp).toLocaleDateString("en", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span className="text-xs" style={{ color: MUTED }}>
                            {r.season}
                          </span>
                        </div>
                        <p
                          className="font-serif text-xs italic leading-relaxed mb-1.5"
                          style={{ color: MUTED }}
                        >
                          {r.prompt.slice(0, 65)}
                          {r.prompt.length > 65 ? "..." : ""}
                        </p>
                        <p
                          className="text-sm line-clamp-2"
                          style={{ color: CREAM, opacity: 0.8 }}
                        >
                          {r.response.slice(0, 100)}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    );
  }

  // ─── View: Settings ───────────────────────────────────────────────────────

  if (view === "settings") {
    return (
      <div className="min-h-screen pb-28" style={{ background: SP_BG }}>
        <StillPoolHeader>
          <button
            type="button"
            onClick={() => setView("main")}
            className="text-xs mb-4 opacity-40"
            style={{ color: CREAM }}
          >
            ← Reflections
          </button>
          <h1
            className="font-serif text-2xl font-medium"
            style={{ color: CREAM }}
          >
            Settings
          </h1>
        </StillPoolHeader>
        <div className="px-6 py-6 space-y-8">
          <div>
            <p
              className="text-xs uppercase tracking-widest mb-4"
              style={{ color: GOLD, opacity: 0.65 }}
            >
              Prompt frequency
            </p>
            <div className="space-y-2">
              {(["daily", "every-few-days", "weekly"] as const).map((freq) => (
                <button
                  key={freq}
                  data-ocid={`reflections.settings.freq_${freq.replace(/-/g, "_")}_button`}
                  type="button"
                  onClick={() => updateSettings({ promptFrequency: freq })}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl"
                  style={{
                    background:
                      settings.promptFrequency === freq
                        ? "rgba(212,175,106,0.1)"
                        : "rgba(245,240,232,0.04)",
                    border: `1px solid ${settings.promptFrequency === freq ? "rgba(212,175,106,0.28)" : "rgba(245,240,232,0.07)"}`,
                  }}
                >
                  <span className="text-sm font-serif" style={{ color: CREAM }}>
                    {freq === "daily"
                      ? "Daily (when events trigger)"
                      : freq === "every-few-days"
                        ? "Every few days"
                        : "Weekly only"}
                  </span>
                  {settings.promptFrequency === freq && (
                    <span style={{ color: GOLD }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-5">
            <p
              className="text-xs uppercase tracking-widest"
              style={{ color: GOLD, opacity: 0.65 }}
            >
              Features
            </p>
            {[
              { key: "seasonalPrompts" as const, label: "Seasonal prompts" },
              {
                key: "anniversaryPrompts" as const,
                label: "Anniversary prompts",
              },
              { key: "showCompass" as const, label: "Emotional Compass" },
              { key: "showPeople" as const, label: "People in My Story" },
              {
                key: "monthlyNarrative" as const,
                label: "Monthly Growth Narrative",
              },
              {
                key: "quarterlyNarrative" as const,
                label: "Quarterly Growth Narrative",
              },
              {
                key: "annualNarrative" as const,
                label: "Annual Growth Narrative",
              },
              {
                key: "thematicClustering" as const,
                label: "Thematic Clustering",
              },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="font-serif text-sm" style={{ color: CREAM }}>
                  {label}
                </span>
                <Switch
                  data-ocid={`reflections.settings.${key}_switch`}
                  checked={settings[key] as boolean}
                  onCheckedChange={(v) => updateSettings({ [key]: v })}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Main View ────────────────────────────────────────────────────────────

  const cs = compassState;
  const hasReflections = localReflections.length > 0;

  return (
    <div
      className="min-h-screen pb-28 animate-fade-in"
      style={{ background: SP_BG }}
      data-ocid="reflections.page"
    >
      <StillPoolHeader>
        <div className="flex justify-between items-center">
          <h1
            className="font-serif text-2xl font-medium"
            style={{ color: CREAM }}
          >
            Reflections
          </h1>
          <button
            data-ocid="reflections.settings_button"
            type="button"
            onClick={() => setView("settings")}
            className="text-lg opacity-35"
            style={{ color: CREAM }}
          >
            ⚙
          </button>
        </div>
      </StillPoolHeader>

      <div className="px-5 py-5 space-y-4">
        {/* Prompt area */}
        <AnimatePresence mode="wait">
          {isFirstTime ? (
            <motion.div
              key="first-time"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              data-ocid="reflections.first_time.card"
              className="rounded-2xl p-7"
              style={{
                background: SP_CARD,
                border: "1px solid rgba(212,175,106,0.13)",
              }}
            >
              <p
                className="font-serif text-base leading-8 mb-7"
                style={{ color: CREAM }}
              >
                This is where understanding lives.
                <br />
                <br />
                Everything you feel, write, and carry in Veil — it all leads
                here.
                <br />
                <br />
                When you are ready — Veil will have a question. Not to challenge
                you. Just to help you understand yourself a little better.
              </p>
              <button
                data-ocid="reflections.first_question_button"
                type="button"
                onClick={handleFirstQuestion}
                className="w-full py-4 rounded-2xl font-serif text-sm"
                style={{
                  background: "rgba(212,175,106,0.11)",
                  border: "1px solid rgba(212,175,106,0.28)",
                  color: CREAM,
                }}
              >
                I'm ready for my first question
              </button>
            </motion.div>
          ) : activePrompt ? (
            <motion.div
              key="prompt"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              data-ocid="reflections.prompt.card"
              className="rounded-2xl p-6"
              style={{
                background: SP_CARD,
                border: "1px solid rgba(212,175,106,0.14)",
              }}
            >
              {activePrompt.sourceContext && (
                <p
                  className="text-xs mb-4 leading-relaxed"
                  style={{ color: GOLD, opacity: 0.65 }}
                >
                  {activePrompt.sourceContext}
                </p>
              )}
              <p
                className="font-serif text-lg leading-relaxed mb-8 whitespace-pre-line"
                style={{ color: CREAM, lineHeight: "1.9" }}
              >
                {activePrompt.text}
              </p>
              <div className="space-y-3 mb-5">
                <button
                  data-ocid="reflections.write_button"
                  type="button"
                  onClick={() => setView("writing")}
                  className="w-full py-4 rounded-2xl font-serif text-sm flex items-center justify-center gap-2"
                  style={{
                    background: "rgba(212,175,106,0.1)",
                    border: "1px solid rgba(212,175,106,0.28)",
                    color: CREAM,
                  }}
                >
                  <span>✍️</span> Write my reflection
                </button>
                <button
                  data-ocid="reflections.speak_button"
                  type="button"
                  onClick={() => setView("voice-recording")}
                  className="w-full py-4 rounded-2xl font-serif text-sm flex items-center justify-center gap-2"
                  style={{
                    background: "rgba(212,175,106,0.1)",
                    border: "1px solid rgba(212,175,106,0.28)",
                    color: CREAM,
                  }}
                >
                  <span>🎤</span> Speak my reflection
                </button>
              </div>
              <div className="text-center">
                <button
                  data-ocid="reflections.dismiss_prompt_button"
                  type="button"
                  onClick={handleDismissPrompt}
                  className="text-xs"
                  style={{ color: MUTED, textDecoration: "underline" }}
                >
                  Not ready for this one
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="listening"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              data-ocid="reflections.listening.card"
              className="rounded-2xl p-6 text-center"
              style={{
                background: SP_CARD,
                border: "1px solid rgba(245,240,232,0.05)",
              }}
            >
              <p
                className="font-serif text-base leading-8"
                style={{ color: MUTED }}
              >
                Veil is listening.
                <br />
                When you are ready — a question will be here.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation cards */}
        <div className="space-y-3 pt-2">
          {settings.showCompass && (
            <button
              data-ocid="reflections.compass.card"
              type="button"
              onClick={() => setShowCompassOverlay(true)}
              className="w-full rounded-2xl p-4 text-left flex items-center gap-4"
              style={{
                background: SP_CARD2,
                border: "1px solid rgba(245,240,232,0.055)",
              }}
            >
              <div className="shrink-0">
                {cs ? (
                  <CompassRose direction={cs.direction} size={48} mini />
                ) : (
                  <span className="text-2xl">🧭</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  className="font-serif text-sm font-medium mb-0.5"
                  style={{ color: CREAM }}
                >
                  Your Direction
                </h3>
                <p
                  className="text-xs leading-relaxed line-clamp-2"
                  style={{ color: MUTED }}
                >
                  {cs?.narrative ?? "Emotional Compass"}
                </p>
                <p
                  className="text-xs mt-1.5"
                  style={{ color: GOLD, opacity: 0.65 }}
                >
                  Reflect on this →
                </p>
              </div>
            </button>
          )}

          {settings.showPeople && (
            <button
              data-ocid="reflections.connection.card"
              type="button"
              onClick={() => setView("connection")}
              className="w-full rounded-2xl p-4 text-left flex items-center gap-4"
              style={{
                background: SP_CARD2,
                border: "1px solid rgba(245,240,232,0.055)",
              }}
            >
              <span className="text-2xl shrink-0">🪞</span>
              <div className="flex-1 min-w-0">
                <h3
                  className="font-serif text-sm font-medium mb-0.5"
                  style={{ color: CREAM }}
                >
                  People in Your Story
                </h3>
                <p className="text-xs" style={{ color: MUTED }}>
                  {connections.length > 0
                    ? `${connections.length} ${connections.length === 1 ? "person" : "people"} in your story`
                    : "Emotional Connection Mirror"}
                </p>
                <p
                  className="text-xs mt-1.5"
                  style={{ color: GOLD, opacity: 0.65 }}
                >
                  Explore →
                </p>
              </div>
            </button>
          )}

          <button
            data-ocid="reflections.archive.card"
            type="button"
            onClick={() => setView("archive")}
            className="w-full rounded-2xl p-4 text-left flex items-center gap-4"
            style={{
              background: SP_CARD2,
              border: "1px solid rgba(245,240,232,0.055)",
            }}
          >
            <span className="text-2xl shrink-0">📖</span>
            <div className="flex-1 min-w-0">
              <h3
                className="font-serif text-sm font-medium mb-0.5"
                style={{ color: CREAM }}
              >
                Your Reflections
              </h3>
              <p className="text-xs" style={{ color: MUTED }}>
                {hasReflections
                  ? `${localReflections.length} reflection${localReflections.length === 1 ? "" : "s"} written`
                  : "Archive"}
              </p>
              <p
                className="text-xs mt-1.5"
                style={{ color: GOLD, opacity: 0.65 }}
              >
                Browse by season →
              </p>
            </div>
          </button>

          <button
            data-ocid="reflections.growth.card"
            type="button"
            onClick={() => setView("growth")}
            className="w-full rounded-2xl p-4 text-left flex items-center gap-4"
            style={{
              background: SP_CARD2,
              border: "1px solid rgba(245,240,232,0.055)",
            }}
          >
            <span className="text-2xl shrink-0">🌱</span>
            <div className="flex-1 min-w-0">
              <h3
                className="font-serif text-sm font-medium mb-0.5"
                style={{ color: CREAM }}
              >
                How Far You Have Come
              </h3>
              <p className="text-xs line-clamp-2" style={{ color: MUTED }}>
                {hasReflections
                  ? `${generateGrowthNarrative(localReflections, "monthly").slice(0, 70)}...`
                  : "Growth Narrative"}
              </p>
              <p
                className="text-xs mt-1.5"
                style={{ color: GOLD, opacity: 0.65 }}
              >
                Read your story →
              </p>
            </div>
          </button>
        </div>

        {/* EIE Algorithm Insights Panel */}
        <AlgorithmInsightsPanel />

        {/* Footer */}
        <div className="pt-4 text-center">
          <p className="text-xs" style={{ color: MUTED, opacity: 0.45 }}>
            © {new Date().getFullYear()}. Built with ♥ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: GOLD, opacity: 0.65 }}
            >
              caffeine.ai
            </a>
          </p>
        </div>
        <AnimatePresence>
          {showCompassOverlay && (
            <EmotionalCompass
              onClose={() => setShowCompassOverlay(false)}
              onOpenReflection={() => {
                setShowCompassOverlay(false);
                if (compassState) {
                  setActivePrompt({
                    text: `Your compass has been pointing ${compassState.direction
                      .replace(/_/g, " ")
                      .toLowerCase()} lately. What do you think is driving that?`,
                    type: "COMPASS_REFLECTION",
                    priority: 1,
                  });
                  setView("writing");
                }
              }}
            />
          )}
        </AnimatePresence>

        {/* Visual Story Gallery */}
        <VisualStoryGallery entries={getVisualEntries()} />
      </div>
    </div>
  );
}
