// ═══════════════════════════════════════════════════════════
// VEIL — MILESTONE TOAST
// Full-screen soft overlay for emotional courage milestones.
// No streak. No score. No count. Just witnessing.
// ═══════════════════════════════════════════════════════════

import { AnimatePresence, motion } from "motion/react";
import { MILESTONE_COPY, type MilestoneType } from "./dailyPresence";

const MILESTONE_ICONS: Record<MilestoneType, string> = {
  FIRST_EXPRESSION: "✦",
  FIRST_LETTER: "🌿",
  FIRST_CONFESSION: "🕯️",
  FIRST_VOLUME: "📖",
  FIRST_YEAR: "🌱",
  FIRST_TURNING_POINT: "✦",
};

interface MilestoneToastProps {
  milestone: MilestoneType;
  onDismiss: () => void;
  visible?: boolean;
}

export function MilestoneToast({
  milestone,
  onDismiss,
  visible = true,
}: MilestoneToastProps) {
  const copy = MILESTONE_COPY[milestone];
  const icon = MILESTONE_ICONS[milestone];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          data-ocid="milestone.modal"
          key="milestone-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(8px)",
          }}
          // biome-ignore lint/a11y/useSemanticElements: motion.div needs role for overlay
          role="dialog"
          aria-modal="true"
          aria-label="Milestone moment"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-sm rounded-3xl px-10 py-12 text-center"
            style={{
              background: "linear-gradient(160deg, #FFFDF9 0%, #FDF6E3 100%)",
              boxShadow: "0 24px 64px rgba(45,37,64,0.22)",
            }}
          >
            {/* Icon */}
            <div
              className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-7"
              style={{ background: "rgba(195,184,216,0.2)" }}
              aria-hidden="true"
            >
              <span className="text-xl">{icon}</span>
            </div>

            {/* Milestone copy — italic serif, max 3 lines, no "Congratulations" */}
            <p
              className="font-serif italic text-lg leading-relaxed whitespace-pre-line mb-6"
              style={{ color: "#2D2540" }}
            >
              {copy}
            </p>

            {/* Witness subtext */}
            <p className="text-xs mb-10" style={{ color: "#8B8097" }}>
              Veil sees you.
            </p>

            {/* Dismiss — soft, no harsh styling */}
            <button
              data-ocid="milestone.close_button"
              type="button"
              onClick={onDismiss}
              className="px-8 py-3 rounded-full text-sm font-medium transition-all duration-200 active:scale-95"
              style={{
                background: "rgba(195,184,216,0.25)",
                color: "#6B5B8E",
                border: "1px solid rgba(195,184,216,0.4)",
              }}
            >
              I see it too
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
