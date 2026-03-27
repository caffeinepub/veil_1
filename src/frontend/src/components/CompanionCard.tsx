import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, MicIcon, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useVeilVoice } from "../contexts/VeilVoiceContext";
import { useActor } from "../hooks/useActor";

// ── Constants ─────────────────────────────────────────────────────────────────

const HEADLINES = [
  "Carrying something today?",
  "What's weighing on you right now?",
  "You don't have to carry this alone.",
  "Whatever today brought — Veil is here.",
  "Before you go home — how are you carrying today?",
  "You can put it down here.",
  "Give it to Veil. Go home lighter.",
  "Today was a lot, wasn't it?",
  "You don't have to walk through that door still carrying this.",
  "Veil is listening. Always.",
  "Say it out loud. Veil can hold it.",
  "Speak it. Shout it. Whatever you need. Veil is ready.",
];

const EXHALE_MESSAGES = [
  "Veil has it now. You can breathe.",
  "You put it down. It lives here now — not with you.",
  "It's safe here. Go be present.",
  "You showed up for yourself today. That matters.",
  "Whatever you were carrying — Veil is holding it. Not you.",
  "You don't have to carry this into your evening. Leave it here.",
  "Go home. Be present. Veil has the rest.",
  "You gave it away. You're lighter now.",
  "It's here with Veil. Not in your chest anymore.",
  "The people you love get the real you tonight. Veil took the rest.",
  "You spoke it out loud. That took courage. Veil heard every word.",
  "It's gone now. Like it was always meant to be.",
  "You spoke to Veil. Veil held all of it. Now go be free.",
];

const POST_VOICE_MESSAGES = [
  "Veil heard all of it. Every word. Every breath. All of it.",
  "You said everything that needed to be said.",
  "Veil received it all. Is there anything left?",
  "That took courage. Is there more?",
];

const RESTING_COPY = [
  "You put it down today. That took courage.",
  "You showed up for yourself. Now go show up for the people you love.",
  "Veil is holding it. You're not.",
  "You're lighter now. Go live your evening.",
  "It's here. Safe. Not going anywhere.",
  "You spoke it out loud today. Veil heard everything. Now it's gone.",
];

const CRISIS_KEYWORDS = [
  "suicide",
  "kill myself",
  "end it all",
  "don't want to live",
  "cant go on",
  "can't go on",
  "harm myself",
  "hurt myself",
];

const DRAFT_KEY = "veil-companion-draft";

// ── Types ─────────────────────────────────────────────────────────────────────

type CardState = "DEFAULT" | "ACTIVE" | "RELEASED" | "RESTING";
type ActiveSubState =
  | "entry"
  | "recording"
  | "postVoice"
  | "textAddendum"
  | "textDump"
  | "crisis";

interface DumpPayload {
  contentType: "VOICE_RELEASED" | "TEXT" | "SILENT";
  textContent: string | null;
  voiceDurationSeconds: number | null;
  crisisDetected: boolean;
  crisisShown: boolean;
  exhaleMessage: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function detectCrisis(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some((k) => lower.includes(k));
}

function pickExhaleMessage(lastIndex: number): [string, number] {
  let idx = Math.floor(Math.random() * EXHALE_MESSAGES.length);
  if (idx === lastIndex) {
    idx = (idx + 1) % EXHALE_MESSAGES.length;
  }
  return [EXHALE_MESSAGES[idx], idx];
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function drawWaveframe(
  analyser: AnalyserNode,
  canvas: HTMLCanvasElement,
  smoothed: React.MutableRefObject<number[]>,
): number {
  const buf = analyser.frequencyBinCount;
  const data = new Uint8Array(buf);
  analyser.getByteTimeDomainData(data);

  const ctx = canvas.getContext("2d");
  if (!ctx) return 0;

  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const barW = 3;
  const gap = 2;
  const numBars = Math.max(1, Math.floor(W / (barW + gap)));
  const step = Math.max(1, Math.floor(buf / numBars));

  if (smoothed.current.length !== numBars) {
    smoothed.current = new Array(numBars).fill(0);
  }

  let maxAmp = 0;
  for (let i = 0; i < numBars; i++) {
    const raw = data[Math.min(i * step, buf - 1)];
    const amp = Math.abs(raw - 128) / 128;
    smoothed.current[i] = smoothed.current[i] * 0.8 + amp * 0.2;
    if (smoothed.current[i] > maxAmp) maxAmp = smoothed.current[i];
  }

  for (let i = 0; i < numBars; i++) {
    const s = smoothed.current[i];
    const barH = Math.max(2, s * H * 0.92);
    const x = i * (barW + gap);
    const y = (H - barH) / 2;

    // Blend lavender (#C9B8E8) → sage (#A8C5A0) by amplitude
    const t = Math.min(1, s * 3);
    const r = Math.round(201 + (168 - 201) * t);
    const g = Math.round(184 + (197 - 184) * t);
    const b = Math.round(232 + (160 - 232) * t);
    const alpha = 0.5 + t * 0.5;

    ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
    ctx.fillRect(x, y, barW, barH);
  }

  return maxAmp;
}

// ── Component ───────────────────────────────────────────────────────────────

export function CompanionCard({
  onDumpComplete,
  onExpressVisually,
}: {
  onDumpComplete?: (
    textContent: string | null,
    dumpType: "voice" | "text",
  ) => void;
  onExpressVisually?: () => void;
} = {}) {
  const { actor, isFetching } = useActor();
  const qc = useQueryClient();
  const { triggerMoment } = useVeilVoice();

  // ── Card state ──
  const [cardState, setCardState] = useState<CardState>("DEFAULT");
  const [activeSubState, setActiveSubState] = useState<ActiveSubState>("entry");
  const hasInitialized = useRef(false);

  // ── Dump accumulation ──
  const pendingPayload = useRef<Partial<DumpPayload>>({});
  const [exhaleMsg, setExhaleMsg] = useState("");
  const lastExhaleIdx = useRef(-1);

  // ── Voice recording ──
  const [duration, setDuration] = useState(0);
  const [showSilencePrompt, setShowSilencePrompt] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const durationRef = useRef(0);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const lastSoundRef = useRef<number>(Date.now());
  const silenceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const smoothedBarsRef = useRef<number[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ── Text ──
  const [textInput, setTextInput] = useState("");
  const [addendumText, setAddendumText] = useState("");
  const autosaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Post-voice message ──
  const [postVoiceMsg] = useState(
    () =>
      POST_VOICE_MESSAGES[
        Math.floor(Math.random() * POST_VOICE_MESSAGES.length)
      ],
  );

  // ── Headlines / resting copy ──
  const day = new Date().getDate();
  const headline = HEADLINES[day % HEADLINES.length];
  const restingCopy = RESTING_COPY[day % RESTING_COPY.length];

  // ── Query: today's dump ──
  const todaysDumpQuery = useQuery({
    queryKey: ["todaysDump"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getTodaysDump();
    },
    enabled: !!actor && !isFetching,
    staleTime: Number.POSITIVE_INFINITY,
  });

  // Initialize resting state from backend on first load
  useEffect(() => {
    if (todaysDumpQuery.data != null && !hasInitialized.current) {
      setCardState("RESTING");
    }
    if (todaysDumpQuery.data !== undefined) {
      hasInitialized.current = true;
    }
  }, [todaysDumpQuery.data]);

  // ── Mutation: save dump ──
  const saveMutation = useMutation({
    mutationFn: async (payload: DumpPayload) => {
      if (!actor) return;
      await actor.saveCompanionDump(
        payload.contentType,
        payload.textContent,
        payload.voiceDurationSeconds != null
          ? BigInt(Math.round(payload.voiceDurationSeconds))
          : null,
        payload.crisisDetected,
        payload.crisisShown,
        payload.exhaleMessage,
        0n,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["todaysDump"] });
    },
  });

  // ── Auto-transition RELEASED → RESTING ──
  useEffect(() => {
    if (cardState !== "RELEASED") return;
    const t = setTimeout(() => setCardState("RESTING"), 6000);
    return () => clearTimeout(t);
  }, [cardState]);

  // ── Autosave draft for text dump ──
  useEffect(() => {
    if (activeSubState !== "textDump") {
      if (autosaveRef.current) clearInterval(autosaveRef.current);
      return;
    }
    autosaveRef.current = setInterval(() => {
      localStorage.setItem(DRAFT_KEY, textInput);
    }, 30000);
    // Load draft on mount
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) setTextInput(draft);
    return () => {
      if (autosaveRef.current) clearInterval(autosaveRef.current);
    };
  }, [activeSubState, textInput]);

  // ── Cleanup on unmount ──
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    return () => stopRecordingCleanup();
    // stopRecordingCleanup only uses stable refs — safe to omit
  }, []); // stopRecordingCleanup only uses stable refs

  // ── Stable ref-based cleanup (no re-creation needed) ──
  function stopRecordingCleanup() {
    cancelAnimationFrame(animFrameRef.current);
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    if (silenceIntervalRef.current) clearInterval(silenceIntervalRef.current);
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    smoothedBarsRef.current = [];
  }

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.6;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Start RAF loop
      const draw = () => {
        if (!analyserRef.current || !canvasRef.current) return;
        const amp = drawWaveframe(
          analyserRef.current,
          canvasRef.current,
          smoothedBarsRef,
        );
        if (amp > 0.05) {
          lastSoundRef.current = Date.now();
          setShowSilencePrompt(false);
        }
        animFrameRef.current = requestAnimationFrame(draw);
      };
      animFrameRef.current = requestAnimationFrame(draw);

      // Duration counter
      durationRef.current = 0;
      setDuration(0);
      durationIntervalRef.current = setInterval(() => {
        durationRef.current += 1;
        setDuration((d) => d + 1);
      }, 1000);

      // Silence detector
      lastSoundRef.current = Date.now();
      silenceIntervalRef.current = setInterval(() => {
        if (Date.now() - lastSoundRef.current > 60000) {
          setShowSilencePrompt(true);
        }
      }, 5000);

      setActiveSubState("recording");
    } catch {
      // Microphone permission denied — fall through to text
      setActiveSubState("textDump");
    }
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: stopRecordingCleanup uses stable refs
  const stopRecording = useCallback(() => {
    const finalDuration = durationRef.current;
    stopRecordingCleanup();
    setShowSilencePrompt(false);
    pendingPayload.current = {
      contentType: "VOICE_RELEASED",
      voiceDurationSeconds: finalDuration,
      textContent: null,
    };
    setActiveSubState("postVoice");
    // Voice System: Moment 1 — after voice dump
    setTimeout(() => triggerMoment(1), 400);
  }, [triggerMoment]);

  function goToExhale(
    contentType: "VOICE_RELEASED" | "TEXT" | "SILENT",
    textContent: string | null,
    voiceDurationSeconds: number | null,
    crisisDetected: boolean,
    crisisShown: boolean,
  ) {
    const [msg, idx] = pickExhaleMessage(lastExhaleIdx.current);
    lastExhaleIdx.current = idx;
    setExhaleMsg(msg);

    const payload: DumpPayload = {
      contentType,
      textContent,
      voiceDurationSeconds,
      crisisDetected,
      crisisShown,
      exhaleMessage: msg,
    };
    saveMutation.mutate(payload);
    setCardState("RELEASED");
    // EI Engine callback
    onDumpComplete?.(textContent, contentType === "TEXT" ? "text" : "voice");
    // Voice System: Moment 2 (text dump) or Moment 3 (silent dump)
    if (contentType === "TEXT") {
      setTimeout(() => triggerMoment(2), 600);
    } else if (contentType === "SILENT") {
      setTimeout(() => triggerMoment(3), 600);
    }
  }

  function completeDump(
    contentType: "VOICE_RELEASED" | "TEXT" | "SILENT",
    textContent: string | null,
    voiceDurationSeconds: number | null,
  ) {
    const crisis =
      contentType === "TEXT" && textContent ? detectCrisis(textContent) : false;
    if (crisis) {
      pendingPayload.current = {
        contentType,
        textContent,
        voiceDurationSeconds,
        crisisDetected: true,
      };
      setActiveSubState("crisis");
    } else {
      goToExhale(contentType, textContent, voiceDurationSeconds, false, false);
    }
  }

  function handleSilent() {
    completeDump("SILENT", null, null);
  }

  function handlePostVoiceMore() {
    setActiveSubState("textAddendum");
  }

  function handlePostVoiceDone() {
    const pd = pendingPayload.current;
    completeDump(
      pd.contentType ?? "VOICE_RELEASED",
      null,
      pd.voiceDurationSeconds ?? null,
    );
  }

  function handleAddendumSubmit() {
    const pd = pendingPayload.current;
    const text = addendumText.trim() || null;
    completeDump(
      text ? "TEXT" : (pd.contentType ?? "VOICE_RELEASED"),
      text,
      pd.voiceDurationSeconds ?? null,
    );
  }

  function handleTextDumpSubmit() {
    const text = textInput.trim();
    localStorage.removeItem(DRAFT_KEY);
    completeDump(text ? "TEXT" : "SILENT", text || null, null);
  }

  function handleCrisisShown() {
    const pd = pendingPayload.current;
    goToExhale(
      pd.contentType ?? "TEXT",
      pd.textContent ?? null,
      pd.voiceDurationSeconds ?? null,
      true,
      true,
    );
  }

  function closeActive() {
    stopRecordingCleanup();
    setCardState("DEFAULT");
    setActiveSubState("entry");
    setTextInput("");
    setAddendumText("");
    setDuration(0);
    setShowSilencePrompt(false);
    pendingPayload.current = {};
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* Card (DEFAULT / RESTING) */}
      <AnimatePresence mode="wait">
        {(cardState === "DEFAULT" || cardState === "RESTING") && (
          <motion.div
            key={cardState}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
            className="mb-5 px-5"
          >
            {cardState === "DEFAULT" && (
              <DefaultCard
                headline={headline}
                onStart={() => {
                  setCardState("ACTIVE");
                  setActiveSubState("entry");
                }}
              />
            )}
            {cardState === "RESTING" && (
              <RestingCard
                copy={restingCopy}
                onReleaseAgain={() => {
                  setCardState("ACTIVE");
                  setActiveSubState("entry");
                  pendingPayload.current = {};
                }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active overlay — full screen emotional release space */}
      <AnimatePresence>
        {cardState === "ACTIVE" && (
          <motion.div
            key="active-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-50"
            style={{
              background:
                "linear-gradient(160deg, #F7F2FC 0%, #FAF7F2 40%, #F2FAF4 100%)",
            }}
            aria-label="Veil emotional release"
          >
            <div className="max-w-[430px] mx-auto min-h-screen flex flex-col">
              <AnimatePresence mode="wait">
                {activeSubState === "entry" && (
                  <EntryScreen
                    key="entry"
                    onClose={closeActive}
                    onStartRecording={startRecording}
                    onWriteInstead={() => setActiveSubState("textDump")}
                    onSilent={handleSilent}
                  />
                )}
                {activeSubState === "recording" && (
                  <RecordingScreen
                    key="recording"
                    duration={duration}
                    canvasRef={canvasRef}
                    showSilencePrompt={showSilencePrompt}
                    onStop={stopRecording}
                  />
                )}
                {activeSubState === "postVoice" && (
                  <PostVoiceScreen
                    key="postVoice"
                    message={postVoiceMsg}
                    voiceDuration={
                      pendingPayload.current.voiceDurationSeconds ?? 0
                    }
                    onWriteMore={handlePostVoiceMore}
                    onDone={handlePostVoiceDone}
                  />
                )}
                {activeSubState === "textAddendum" && (
                  <TextAddendumScreen
                    key="textAddendum"
                    value={addendumText}
                    onChange={setAddendumText}
                    onSubmit={handleAddendumSubmit}
                    onSkip={handlePostVoiceDone}
                  />
                )}
                {activeSubState === "textDump" && (
                  <TextDumpScreen
                    key="textDump"
                    value={textInput}
                    onChange={setTextInput}
                    onClose={closeActive}
                    onSubmit={handleTextDumpSubmit}
                    onSwitchToVoice={() => setActiveSubState("entry")}
                  />
                )}
                {activeSubState === "crisis" && (
                  <CrisisScreen key="crisis" onContinue={handleCrisisShown} />
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exhale / Released screen */}
      <AnimatePresence>
        {cardState === "RELEASED" && (
          <motion.div
            key="released"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center"
            style={{
              background:
                "linear-gradient(160deg, #F0EAF8 0%, #FAF7F2 50%, #EAF3EA 100%)",
            }}
          >
            <div className="max-w-[430px] w-full px-8 flex flex-col items-center text-center">
              {/* Breathing circle */}
              <div
                className="veil-exhale-circle w-32 h-32 rounded-full mb-8"
                style={{
                  background:
                    "radial-gradient(circle, rgba(201,184,232,0.6) 0%, rgba(168,197,160,0.3) 60%, transparent 100%)",
                  boxShadow:
                    "0 0 40px rgba(201,184,232,0.4), 0 0 80px rgba(168,197,160,0.2)",
                }}
              />
              <p
                className="font-serif text-xl text-veil-text leading-relaxed mb-10"
                style={{ textAlign: "center" }}
              >
                {exhaleMsg}
              </p>
              <motion.button
                data-ocid="companion.released.button"
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3.5, duration: 0.5 }}
                onClick={() => setCardState("RESTING")}
                className="px-8 py-4 rounded-3xl text-sm font-semibold text-veil-purple transition-all active:scale-95"
                style={{
                  background: "rgba(201,184,232,0.3)",
                  border: "1px solid rgba(201,184,232,0.5)",
                }}
              >
                I'm ready to go
              </motion.button>
              {onExpressVisually && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 5, duration: 0.6 }}
                  onClick={onExpressVisually}
                  style={{
                    marginTop: 16,
                    background: "none",
                    border: "none",
                    color: "rgba(140,120,170,0.55)",
                    fontSize: 13,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    letterSpacing: "0.04em",
                    padding: "8px",
                  }}
                >
                  Express this visually →
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Sub-screens ───────────────────────────────────────────────────────────────

function DefaultCard({
  headline,
  onStart,
}: {
  headline: string;
  onStart: () => void;
}) {
  return (
    <div
      data-ocid="companion.card"
      className="veil-card-breathe rounded-3xl p-6 shadow-soft"
      style={{
        background:
          "linear-gradient(135deg, rgba(201,184,232,0.18) 0%, rgba(242,181,197,0.14) 50%, rgba(168,197,160,0.12) 100%)",
        border: "1px solid rgba(201,184,232,0.3)",
      }}
    >
      <div className="text-2xl mb-4">🫧</div>
      <h2 className="font-serif text-lg font-semibold text-veil-text leading-snug mb-2">
        {headline}
      </h2>
      <p className="text-sm text-veil-muted mb-5 leading-relaxed">
        Veil will hold it for you.
      </p>
      <button
        data-ocid="companion.primary_button"
        type="button"
        onClick={onStart}
        className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95"
        style={{
          background: "linear-gradient(135deg, #6B5B8E 0%, #9B7FC0 100%)",
        }}
      >
        Put it down
      </button>
    </div>
  );
}

function RestingCard({
  copy,
  onReleaseAgain,
}: {
  copy: string;
  onReleaseAgain: () => void;
}) {
  return (
    <div
      data-ocid="companion.resting.card"
      className="veil-card-breathe-slow rounded-3xl p-6 shadow-soft"
      style={{
        opacity: 0.88,
        background:
          "linear-gradient(135deg, rgba(168,197,160,0.18) 0%, rgba(201,184,232,0.12) 100%)",
        border: "1px solid rgba(168,197,160,0.3)",
      }}
    >
      <div className="text-2xl mb-4">🌿</div>
      <p className="font-serif text-base font-semibold text-veil-text leading-snug mb-1">
        {copy}
      </p>
      <p className="text-sm text-veil-muted mb-5">Go be present.</p>
      <button
        data-ocid="companion.resting.button"
        type="button"
        onClick={onReleaseAgain}
        className="w-full py-3 rounded-2xl text-xs font-medium text-veil-muted transition-all duration-200 hover:text-veil-purple"
        style={{
          background: "rgba(201,184,232,0.15)",
          border: "1px solid rgba(201,184,232,0.25)",
        }}
      >
        I need to release something else
      </button>
    </div>
  );
}

function EntryScreen({
  onClose,
  onStartRecording,
  onWriteInstead,
  onSilent,
}: {
  onClose: () => void;
  onStartRecording: () => Promise<void>;
  onWriteInstead: () => void;
  onSilent: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col px-6 pt-12 pb-8"
    >
      {/* Close */}
      <button
        data-ocid="companion.entry.close_button"
        type="button"
        onClick={onClose}
        className="self-start w-9 h-9 rounded-full flex items-center justify-center text-veil-muted hover:text-veil-text transition-colors mb-8"
        style={{ background: "rgba(201,184,232,0.2)" }}
        aria-label="Close"
      >
        <X size={18} />
      </button>

      <h1 className="font-serif text-2xl font-semibold text-veil-text mb-4">
        Veil is listening.
      </h1>

      <div
        className="rounded-2xl px-4 py-3 mb-8"
        style={{ background: "rgba(201,184,232,0.12)" }}
      >
        <p className="text-base text-veil-muted leading-relaxed">
          Speak it out. Say everything. Shout if you need to. Veil can hold all
          of it.
        </p>
      </div>

      {/* Mic button */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <button
          data-ocid="companion.entry.mic_button"
          type="button"
          onClick={onStartRecording}
          className="veil-mic-pulse flex flex-col items-center justify-center gap-2 rounded-3xl text-white transition-all duration-200 active:scale-95"
          style={{
            width: 140,
            height: 140,
            background: "linear-gradient(135deg, #8B7AAE 0%, #A8C5A0 100%)",
            boxShadow:
              "0 8px 32px rgba(139,122,174,0.35), 0 2px 8px rgba(139,122,174,0.2)",
          }}
          aria-label="Tap to speak"
        >
          <MicIcon size={36} />
          <span className="text-xs font-medium opacity-90">Tap to speak</span>
        </button>
      </div>

      {/* Secondary options */}
      <div className="flex flex-col gap-3 mt-8">
        <div
          className="w-full h-px"
          style={{ background: "rgba(201,184,232,0.25)" }}
        />
        <button
          data-ocid="companion.entry.write_button"
          type="button"
          onClick={onWriteInstead}
          className="w-full py-3 text-sm text-veil-muted hover:text-veil-purple transition-colors font-medium"
        >
          [ Write it instead ]
        </button>
        <button
          data-ocid="companion.entry.silent_button"
          type="button"
          onClick={onSilent}
          className="w-full py-3 text-sm text-veil-muted hover:text-veil-purple transition-colors font-medium leading-snug"
        >
          [ I just need to show up — that's enough ]
        </button>
      </div>
    </motion.div>
  );
}

function RecordingScreen({
  duration,
  canvasRef,
  showSilencePrompt,
  onStop,
}: {
  duration: number;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  showSilencePrompt: boolean;
  onStop: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex-1 flex flex-col px-6 pt-10 pb-8"
      aria-label="Veil is listening. Tap the microphone again to finish."
    >
      <h1 className="font-serif text-xl font-semibold text-veil-text mb-5 text-center">
        Veil is holding every word.
      </h1>

      {/* Waveform canvas */}
      <div
        className="w-full rounded-2xl overflow-hidden mb-4"
        style={{
          background: "rgba(201,184,232,0.08)",
          height: 120,
        }}
      >
        <canvas
          ref={canvasRef}
          width={390}
          height={120}
          className="w-full h-full"
          aria-label="Recording waveform — recording in progress"
          role="img"
        />
      </div>

      {/* Duration */}
      <div
        data-ocid="companion.recording.panel"
        className="text-center mb-6"
        aria-live="polite"
      >
        <span className="font-mono text-2xl text-veil-purple font-medium">
          {formatDuration(duration)}
        </span>
      </div>

      {/* Silence prompt */}
      <AnimatePresence>
        {showSilencePrompt && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center text-sm text-veil-muted italic mb-4"
          >
            Still here whenever you're ready.
          </motion.p>
        )}
      </AnimatePresence>

      {/* Stop mic button */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <button
          data-ocid="companion.recording.stop_button"
          type="button"
          onClick={onStop}
          className="flex flex-col items-center justify-center gap-2 rounded-3xl text-white transition-all duration-200 active:scale-95"
          style={{
            width: 140,
            height: 140,
            background: "linear-gradient(135deg, #C97A7A 0%, #E8A5A5 100%)",
            boxShadow:
              "0 8px 32px rgba(201,122,122,0.3), 0 2px 8px rgba(201,122,122,0.2)",
          }}
          aria-label="Tap to finish recording"
        >
          <span className="text-2xl">🔴</span>
          <span className="text-xs font-medium opacity-90">Tap to finish</span>
        </button>
      </div>

      {/* Privacy notice */}
      <div
        className="flex items-start gap-2 mt-6 rounded-2xl px-4 py-3"
        style={{ background: "rgba(168,197,160,0.12)" }}
      >
        <Lock size={14} className="text-veil-sage mt-0.5 shrink-0" />
        <p className="text-xs text-veil-muted leading-relaxed">
          Only Veil hears this. It will be gone after you finish.
        </p>
      </div>
    </motion.div>
  );
}

function PostVoiceScreen({
  message,
  voiceDuration,
  onWriteMore,
  onDone,
}: {
  message: string;
  voiceDuration: number;
  onWriteMore: () => void;
  onDone: () => void;
}) {
  const mins = Math.floor(voiceDuration / 60);
  const secs = voiceDuration % 60;
  const durationText =
    voiceDuration > 0
      ? mins > 0
        ? `You spoke to Veil for ${mins} minute${mins !== 1 ? "s" : ""} and ${secs} second${secs !== 1 ? "s" : ""}. It was released.`
        : `You spoke to Veil for ${secs} second${secs !== 1 ? "s" : ""}. It was released.`
      : "";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center"
    >
      <div className="text-3xl mb-6">🫧</div>
      <h2 className="font-serif text-xl font-semibold text-veil-text leading-snug mb-3">
        {message}
      </h2>
      {durationText && (
        <p className="text-sm text-veil-muted mb-2 italic">{durationText}</p>
      )}
      <div
        className="w-16 h-px my-6"
        style={{ background: "rgba(201,184,232,0.4)" }}
      />
      <p className="text-base text-veil-muted mb-6">
        Is there anything else you want to add?
      </p>
      <div className="flex flex-col gap-3 w-full">
        <button
          data-ocid="companion.postvoice.write_button"
          type="button"
          onClick={onWriteMore}
          className="w-full py-3.5 rounded-2xl text-sm font-medium text-veil-purple transition-all active:scale-95"
          style={{
            background: "rgba(201,184,232,0.2)",
            border: "1px solid rgba(201,184,232,0.4)",
          }}
        >
          Write a little more
        </button>
        <button
          data-ocid="companion.postvoice.done_button"
          type="button"
          onClick={onDone}
          className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white transition-all active:scale-95"
          style={{
            background: "linear-gradient(135deg, #6B5B8E 0%, #9B7FC0 100%)",
          }}
        >
          No — Veil has everything
        </button>
      </div>
    </motion.div>
  );
}

function TextAddendumScreen({
  value,
  onChange,
  onSubmit,
  onSkip,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onSkip: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col px-6 pt-10 pb-8"
    >
      <h2 className="font-serif text-xl font-semibold text-veil-text mb-6">
        A few more words?
      </h2>
      <textarea
        data-ocid="companion.addendum.textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="A few more words..."
        rows={5}
        className="flex-1 w-full bg-white rounded-2xl px-4 py-3 text-base text-veil-text placeholder:text-veil-muted resize-none outline-none transition-shadow duration-200 focus:shadow-glow"
        style={{ border: "none", minHeight: 120 }}
      />
      <div className="flex flex-col gap-3 mt-5">
        <button
          data-ocid="companion.addendum.submit_button"
          type="button"
          onClick={onSubmit}
          className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white transition-all active:scale-95"
          style={{
            background: "linear-gradient(135deg, #6B5B8E 0%, #9B7FC0 100%)",
          }}
        >
          Veil, take this from me
        </button>
        <button
          data-ocid="companion.addendum.skip_button"
          type="button"
          onClick={onSkip}
          className="w-full py-3 text-sm text-veil-muted hover:text-veil-purple transition-colors"
        >
          No — Veil has everything
        </button>
      </div>
    </motion.div>
  );
}

function TextDumpScreen({
  value,
  onChange,
  onClose,
  onSubmit,
  onSwitchToVoice,
}: {
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  onSwitchToVoice: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col px-6 pt-10 pb-8"
    >
      {/* Close */}
      <button
        data-ocid="companion.textdump.close_button"
        type="button"
        onClick={onClose}
        className="self-start w-9 h-9 rounded-full flex items-center justify-center text-veil-muted hover:text-veil-text transition-colors mb-6"
        style={{ background: "rgba(201,184,232,0.2)" }}
        aria-label="Close"
      >
        <X size={18} />
      </button>

      <h1 className="font-serif text-xl font-semibold text-veil-text mb-2">
        Veil is reading every word.
      </h1>

      <div
        className="rounded-2xl px-4 py-3 mb-5"
        style={{ background: "rgba(201,184,232,0.1)" }}
      >
        <p className="text-sm text-veil-muted leading-relaxed">
          Say whatever you need to say. There is no audience here. This is just
          you and Veil. Write as much or as little as you need. Or say nothing
          at all. Just being here is enough.
        </p>
      </div>

      <textarea
        data-ocid="companion.textdump.textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Start writing..."
        className="flex-1 w-full bg-white rounded-2xl px-4 py-3 text-base text-veil-text placeholder:text-veil-muted resize-none outline-none transition-shadow duration-200 focus:shadow-glow"
        style={{ border: "none", minHeight: 160 }}
      />

      <div className="flex flex-col gap-3 mt-5">
        <button
          data-ocid="companion.textdump.voice_button"
          type="button"
          onClick={onSwitchToVoice}
          className="flex items-center justify-center gap-1.5 w-full py-2.5 text-sm text-veil-muted hover:text-veil-purple transition-colors"
        >
          <MicIcon size={14} />
          Changed your mind? Speak it instead
        </button>

        <div
          className="w-full h-px"
          style={{ background: "rgba(201,184,232,0.25)" }}
        />

        <button
          data-ocid="companion.textdump.submit_button"
          type="button"
          onClick={onSubmit}
          className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white transition-all active:scale-95"
          style={{
            background: "linear-gradient(135deg, #6B5B8E 0%, #9B7FC0 100%)",
          }}
        >
          Veil, take this from me
        </button>

        <div
          className="flex items-start gap-2 rounded-2xl px-4 py-3"
          style={{ background: "rgba(168,197,160,0.12)" }}
        >
          <Lock size={13} className="text-veil-sage mt-0.5 shrink-0" />
          <p className="text-xs text-veil-muted leading-relaxed">
            Only you and Veil. Always private. Never shared.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function CrisisScreen({ onContinue }: { onContinue: () => void }) {
  const [showResources, setShowResources] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex-1 flex flex-col items-center px-6 pt-12 pb-8"
    >
      <div className="text-3xl mb-6">🌿</div>
      <h2 className="font-serif text-xl font-semibold text-veil-text text-center mb-4">
        Veil hears you.
      </h2>
      <p className="text-base text-veil-muted text-center leading-relaxed mb-8">
        What you're carrying sounds very heavy right now. You don't have to face
        this alone.
      </p>

      <div className="flex flex-col gap-3 w-full">
        <button
          data-ocid="companion.crisis.resources_button"
          type="button"
          onClick={() => setShowResources((v) => !v)}
          className="w-full py-3.5 rounded-2xl text-sm font-medium transition-all active:scale-95"
          style={{
            background: "rgba(201,184,232,0.2)",
            border: "1px solid rgba(201,184,232,0.4)",
            color: "#6B5B8E",
          }}
        >
          See support options
        </button>

        <AnimatePresence>
          {showResources && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-2xl overflow-hidden"
              style={{ background: "rgba(168,197,160,0.12)" }}
            >
              <div className="px-5 py-4 space-y-3">
                {[
                  { label: "iCall India", detail: "9152987821" },
                  {
                    label: "Vandrevala Foundation",
                    detail: "1860-2662-345",
                  },
                  {
                    label: "Crisis Text Line (US)",
                    detail: "Text HOME to 741741",
                  },
                  {
                    label: "International Resources",
                    detail: "iasp.info/resources/Crisis_Centres",
                  },
                ].map((r) => (
                  <div key={r.label}>
                    <p className="text-sm font-medium text-veil-text">
                      {r.label}
                    </p>
                    <p className="text-sm text-veil-muted">{r.detail}</p>
                  </div>
                ))}
                <p className="text-xs text-veil-muted pt-1 italic">
                  You can also keep talking to Veil. Veil is still here.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          data-ocid="companion.crisis.continue_button"
          type="button"
          onClick={onContinue}
          className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white transition-all active:scale-95"
          style={{
            background: "linear-gradient(135deg, #6B5B8E 0%, #9B7FC0 100%)",
          }}
        >
          Continue to Veil →
        </button>
      </div>
    </motion.div>
  );
}
