import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { PendingItemType } from "../lib/retentionState";

interface StillWithYouCardProps {
  pendingItemType: PendingItemType | null;
  onSeeIt: () => void;
  onNotYet: () => void;
  showPeaceMessage?: boolean;
}

const CARD_COPY: Record<PendingItemType, string> = {
  unsent_apology: "Something you wrote is still here.",
  scheduled_apology: "Something is on its way to someone.",
  cancelled_apology: "Something you wrote found its way here.",
  unread_received_apology: "Someone reached out to you.",
  apology_read_no_response:
    "You read something recently. You do not have to decide anything.",
  unsent_love_letter: "Something beautiful you wrote is here.",
  love_letter_sent_no_reaction: "Your letter was delivered.",
  unsent_confession: "Veil is here when you are ready.",
  future_self_letter_approaching:
    "Something you wrote for yourself is almost ready to arrive.",
};

const PEACE_MESSAGE =
  "You are carrying nothing unfinished right now. That is its own kind of peace.";

export function StillWithYouCard({
  pendingItemType,
  onSeeIt,
  onNotYet,
  showPeaceMessage = false,
}: StillWithYouCardProps) {
  const [visible, setVisible] = useState(true);

  // Peace message auto-fades after 3 seconds
  useEffect(() => {
    if (showPeaceMessage && !pendingItemType) {
      const t = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(t);
    }
    setVisible(true);
  }, [showPeaceMessage, pendingItemType]);

  const show =
    visible &&
    (pendingItemType !== null || (showPeaceMessage && !pendingItemType));

  if (!show) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="still-with-you"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          data-ocid="home.still_with_you.card"
          className="rounded-3xl px-5 py-4"
          style={{
            background: "linear-gradient(135deg, #f5f0fa 0%, #fdf0f5 100%)",
            boxShadow: "0 2px 16px rgba(107,91,142,0.08)",
          }}
        >
          {showPeaceMessage && !pendingItemType ? (
            // Peace message — no buttons, fades away
            <p
              className="font-serif text-sm italic text-center leading-relaxed"
              style={{ color: "#7a6a9a" }}
            >
              {PEACE_MESSAGE}
            </p>
          ) : (
            <>
              {/* Header row */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base" aria-hidden="true">
                  🌿
                </span>
                <h3
                  className="font-serif text-sm font-semibold"
                  style={{ color: "#4a3a6a" }}
                >
                  Still with you
                </h3>
              </div>

              {/* Copy */}
              {pendingItemType && (
                <p
                  className="text-sm italic leading-relaxed mb-4"
                  style={{ color: "#7a6a9a" }}
                >
                  {CARD_COPY[pendingItemType]}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  data-ocid="home.still_with_you.primary_button"
                  onClick={onSeeIt}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 hover:opacity-90 active:scale-95"
                  style={{
                    background:
                      "linear-gradient(135deg, #8b6bb1 0%, #b08ad5 100%)",
                    color: "#fff",
                  }}
                >
                  See it
                </button>
                <button
                  type="button"
                  data-ocid="home.still_with_you.secondary_button"
                  onClick={onNotYet}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 hover:bg-purple-50 active:scale-95"
                  style={{ color: "#7a6a9a" }}
                >
                  Not yet
                </button>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
