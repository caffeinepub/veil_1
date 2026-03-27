/**
 * QuickReleaseScreen.tsx
 *
 * Full-screen, distraction-free Companion Card dump experience.
 * Opened when user arrives via Siri / widget / Google Assistant deep link.
 * No navigation chrome. No feed. Just the dump screen.
 *
 * URL entry: ?quick=1
 */

import { MicIcon, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useVeilVoice } from "../contexts/VeilVoiceContext";
import { useActor } from "../hooks/useActor";

type Phase = "greeting" | "recording" | "postVoice" | "exhale" | "done";

const EXHALE_MESSAGES = [
  "Veil has it now.\nYou can breathe.",
  "You put it down.\nIt lives here now — not with you.",
  "Whatever you were carrying — Veil is holding it. Not you.",
  "You gave it away. You're lighter now.",
  "Go home. Be present.\nVeil has the rest.",
];

interface QuickReleaseScreenProps {
  accessPoint?: string; // "SIRI" | "HOME_WIDGET" | "LOCK_WIDGET" | "GOOGLE_ASSISTANT" | "QUICK_TILE"
  onClose: () => void;
}

export function QuickReleaseScreen({
  accessPoint = "DIRECT",
  onClose,
}: QuickReleaseScreenProps) {
  const { actor } = useActor();
  const { triggerMoment, settings } = useVeilVoice();

  const [phase, setPhase] = useState<Phase>("greeting");
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [textInput, setTextInput] = useState("");
  const [showTextOption, setShowTextOption] = useState(false);
  const [exhaleMessage] = useState(
    () => EXHALE_MESSAGES[Math.floor(Math.random() * EXHALE_MESSAGES.length)],
  );
  const [sessionStart] = useState(() => Date.now());

  const recordInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-advance from greeting
  useEffect(() => {
    if (phase === "greeting") {
      const t = setTimeout(() => setPhase("recording"), 3000);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      recordInterval.current = setInterval(
        () => setRecordSeconds((s) => s + 1),
        1000,
      );
    } else {
      if (recordInterval.current) clearInterval(recordInterval.current);
    }
    return () => {
      if (recordInterval.current) clearInterval(recordInterval.current);
    };
  }, [isRecording]);

  const startRecording = useCallback(() => {
    setIsRecording(true);
    setRecordSeconds(0);
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    setPhase("postVoice");
  }, []);

  const handleMicTap = useCallback(() => {
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const handleFinish = useCallback(
    async (hasContent: boolean) => {
      setPhase("exhale");
      if (settings.voice_enabled) {
        triggerMoment(1);
      }
      // Log session
      if (actor) {
        const duration = Math.round((Date.now() - sessionStart) / 1000);
        try {
          await actor.logQuickReleaseSession(
            "WEB",
            accessPoint,
            hasContent ? ["VOICE"] : [null],
            hasContent,
            [duration],
            "HOME_SCREEN",
          );
        } catch {
          // silent
        }
      }
      setTimeout(() => setPhase("done"), 6000);
    },
    [actor, accessPoint, sessionStart, settings.voice_enabled, triggerMoment],
  );

  const handleDone = useCallback(() => {
    onClose();
  }, [onClose]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        background:
          "linear-gradient(160deg, #0d0a1a 0%, #1a1230 60%, #0f1a14 100%)",
      }}
      aria-label="Quick Release — emotional dump screen"
    >
      {/* Close button */}
      {phase !== "done" && phase !== "exhale" && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center text-white/40 hover:text-white/80 transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      )}

      <AnimatePresence mode="wait">
        {/* GREETING PHASE */}
        {phase === "greeting" && (
          <motion.div
            key="greeting"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center px-10"
            onClick={() => setPhase("recording")}
          >
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
              className="text-5xl mb-8"
              aria-hidden
            >
              🫧
            </motion.div>
            <p className="text-white/90 font-serif text-xl font-medium mb-3">
              Veil is here.
            </p>
            <p className="text-white/50 text-sm">
              Speak whenever you're ready.
            </p>
          </motion.div>
        )}

        {/* RECORDING PHASE */}
        {phase === "recording" && (
          <motion.div
            key="recording"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-10 w-full px-8"
          >
            {/* Mic button */}
            <motion.button
              type="button"
              onClick={handleMicTap}
              className="relative w-28 h-28 rounded-full flex items-center justify-center focus:outline-none"
              style={{
                background: isRecording
                  ? "radial-gradient(circle, #6B4FBB 0%, #3d2a7a 100%)"
                  : "radial-gradient(circle, #2a1f4a 0%, #1a1230 100%)",
                border: isRecording
                  ? "2px solid rgba(107,79,187,0.6)"
                  : "2px solid rgba(255,255,255,0.1)",
              }}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
              whileTap={{ scale: 0.95 }}
            >
              {isRecording && (
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ border: "2px solid rgba(107,79,187,0.4)" }}
                  animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                />
              )}
              <MicIcon size={36} className="text-white" />
            </motion.button>

            {/* Status */}
            <div className="text-center">
              {isRecording ? (
                <>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <motion.div
                      className="w-2 h-2 rounded-full bg-red-400"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{
                        duration: 1,
                        repeat: Number.POSITIVE_INFINITY,
                      }}
                    />
                    <span className="text-white/70 text-sm font-mono">
                      {formatTime(recordSeconds)}
                    </span>
                  </div>
                  <p className="text-white/40 text-xs">Tap to finish</p>
                </>
              ) : (
                <>
                  <p className="text-white/70 text-sm mb-1">
                    Tap to start speaking
                  </p>
                  <p className="text-white/30 text-xs">
                    No time limit — speak as long as you need
                  </p>
                </>
              )}
            </div>

            {/* Text option */}
            {!isRecording && (
              <div className="flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowTextOption(true)}
                  className="text-white/30 text-xs hover:text-white/60 transition-colors"
                >
                  {showTextOption ? null : "Prefer to write instead?"}
                </button>

                {showTextOption && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="w-full"
                  >
                    <textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Say everything."
                      rows={5}
                      className="w-full rounded-2xl px-4 py-3 text-white/80 placeholder:text-white/20 text-sm leading-relaxed resize-none outline-none"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        minHeight: "120px",
                      }}
                    />
                    {textInput.trim().length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleFinish(true)}
                        className="mt-3 w-full py-3 rounded-2xl text-white/80 text-sm font-medium transition-all"
                        style={{ background: "rgba(107,79,187,0.4)" }}
                      >
                        Put it down
                      </button>
                    )}
                  </motion.div>
                )}
              </div>
            )}

            {/* Skip — silent dump */}
            {!isRecording && !showTextOption && (
              <button
                type="button"
                onClick={() => handleFinish(false)}
                className="text-white/20 text-xs hover:text-white/40 transition-colors"
              >
                Just exhale — I don't need to say it
              </button>
            )}

            {/* After recording — finish */}
            {!isRecording && recordSeconds > 0 && (
              <button
                type="button"
                onClick={() => handleFinish(true)}
                className="px-8 py-3 rounded-2xl text-white/80 text-sm font-medium transition-all"
                style={{ background: "rgba(107,79,187,0.4)" }}
              >
                Veil has it — release
              </button>
            )}
          </motion.div>
        )}

        {/* POST-VOICE PHASE */}
        {phase === "postVoice" && (
          <motion.div
            key="postVoice"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center px-10 flex flex-col items-center gap-8"
          >
            <div className="text-4xl">🫧</div>
            <p className="text-white/80 font-serif text-lg">
              Veil heard all of it.
            </p>
            <p className="text-white/40 text-sm">Is there anything left?</p>
            <div className="flex flex-col gap-3 w-full">
              <button
                type="button"
                onClick={() => handleFinish(true)}
                className="w-full py-4 rounded-2xl text-white font-medium text-sm"
                style={{
                  background:
                    "linear-gradient(135deg, #6B4FBB 0%, #3d2a7a 100%)",
                }}
              >
                Veil has everything
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowTextOption(true);
                  setPhase("recording");
                }}
                className="w-full py-3 rounded-2xl text-white/50 text-sm"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                I want to add something
              </button>
            </div>
          </motion.div>
        )}

        {/* EXHALE PHASE */}
        {phase === "exhale" && (
          <motion.div
            key="exhale"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center px-10 flex flex-col items-center gap-10"
          >
            {/* Particle release animation */}
            <div className="relative w-32 h-32 flex items-center justify-center">
              {(["p0", "p1", "p2", "p3", "p4", "p5", "p6", "p7"] as const).map(
                (pid, i) => (
                  <motion.div
                    key={pid}
                    className="absolute w-2 h-2 rounded-full"
                    style={{ background: `hsl(${260 + i * 15}, 60%, 70%)` }}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                    animate={{
                      x: Math.cos((i / 8) * Math.PI * 2) * 60,
                      y: Math.sin((i / 8) * Math.PI * 2) * 60 - 20,
                      opacity: 0,
                      scale: 0.3,
                    }}
                    transition={{
                      duration: 2.5,
                      delay: i * 0.15,
                      ease: "easeOut",
                    }}
                  />
                ),
              )}
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                className="text-4xl"
              >
                🌿
              </motion.div>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="text-white/80 font-serif text-xl leading-relaxed whitespace-pre-line"
            >
              {exhaleMessage}
            </motion.p>
          </motion.div>
        )}

        {/* DONE PHASE */}
        {phase === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center px-10 flex flex-col items-center gap-8"
          >
            <p className="text-white/60 font-serif text-base">
              You're lighter now.
            </p>
            <button
              type="button"
              onClick={handleDone}
              className="px-10 py-4 rounded-2xl text-white font-medium text-sm"
              style={{
                background: "linear-gradient(135deg, #6B4FBB 0%, #3d2a7a 100%)",
              }}
            >
              I'm ready to go
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background star particles — subtle ambient effect */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        aria-hidden
      >
        {Array.from({ length: 20 }, (_, n) => `s${n}`).map((sid) => (
          <motion.div
            key={sid}
            className="absolute w-0.5 h-0.5 rounded-full bg-white"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.3 + 0.05,
            }}
            animate={{ opacity: [0.05, 0.3, 0.05] }}
            transition={{
              duration: Math.random() * 4 + 3,
              repeat: Number.POSITIVE_INFINITY,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
