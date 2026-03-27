import { AnimatePresence, motion } from "motion/react";

interface EIConsentModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function EIConsentModal({
  isOpen,
  onAccept,
  onDecline,
}: EIConsentModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="ei-consent-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
          />

          {/* Bottom Sheet */}
          <motion.div
            key="ei-consent-sheet"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[81] flex justify-center"
          >
            <div
              className="w-full max-w-[430px] rounded-t-3xl px-7 pt-8 pb-10"
              style={{
                background: "linear-gradient(160deg, #1A1230 0%, #221540 100%)",
                border: "1px solid rgba(201,184,232,0.15)",
                borderBottom: "none",
              }}
            >
              {/* Handle bar */}
              <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-8" />

              {/* Icon */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(201,184,232,0.2) 0%, rgba(168,197,160,0.2) 100%)",
                  border: "1px solid rgba(201,184,232,0.3)",
                }}
              >
                <span className="text-2xl">🫧</span>
              </div>

              {/* Copy */}
              <div className="space-y-4 mb-8 text-center">
                <p
                  className="font-serif text-lg leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.92)" }}
                >
                  Veil can gently understand what you were carrying — and
                  respond to it personally.
                </p>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.65)" }}
                >
                  If you were stressed — Veil will help bring it down.
                </p>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.65)" }}
                >
                  If something wonderful happened — Veil will celebrate with
                  you.
                </p>
                <p
                  className="text-xs leading-relaxed pt-2"
                  style={{
                    color: "rgba(255,255,255,0.45)",
                    borderTop: "1px solid rgba(255,255,255,0.1)",
                    paddingTop: "1rem",
                    marginTop: "1rem",
                  }}
                >
                  Your voice is still deleted. Veil only learns the feeling —
                  never the words.
                </p>
              </div>

              {/* Buttons */}
              <div className="space-y-3">
                <motion.button
                  data-ocid="ei.consent.primary_button"
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={onAccept}
                  className="w-full py-4 rounded-2xl text-sm font-semibold"
                  style={{
                    background:
                      "linear-gradient(135deg, #8B6FD4 0%, #6B4FBB 100%)",
                    color: "#fff",
                    minHeight: "48px",
                  }}
                >
                  Yes — understand what I carry
                </motion.button>
                <motion.button
                  data-ocid="ei.consent.secondary_button"
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={onDecline}
                  className="w-full py-4 rounded-2xl text-sm font-medium"
                  style={{
                    background: "transparent",
                    color: "rgba(255,255,255,0.45)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    minHeight: "48px",
                  }}
                >
                  No — just release it
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
