import { motion } from "motion/react";
import { useEffect } from "react";
import { useVeilVoice } from "../contexts/VeilVoiceContext";

export function ClosureMomentScreen({ onClose }: { onClose: () => void }) {
  const { triggerMoment } = useVeilVoice();
  const reduceMotion =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  useEffect(() => {
    setTimeout(() => triggerMoment("apology_closure_sender" as any), 500);
  }, [triggerMoment]);

  return (
    <div
      data-ocid="closure.modal"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center px-8"
      style={{
        background:
          "linear-gradient(135deg, #EDE3F5 0%, #D8C8EE 40%, #C9B8E8 100%)",
      }}
    >
      {/* Breathing circle */}
      {!reduceMotion ? (
        <motion.div
          className="w-32 h-32 rounded-full mb-10"
          style={{
            background:
              "radial-gradient(circle, rgba(201,184,232,0.6) 0%, rgba(155,127,192,0.3) 60%, transparent 100%)",
          }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
          transition={{
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          aria-hidden="true"
        />
      ) : (
        <div className="w-32 h-32 rounded-full mb-10 bg-white/30" />
      )}

      <h2 className="font-serif text-2xl font-semibold text-veil-text mb-5">
        Your apology was received.
      </h2>

      <p className="text-veil-text/80 text-sm leading-relaxed max-w-xs mb-12">
        You did something brave today.
        <br />
        The rest is theirs to carry now.
        <br />
        You've done your part.
      </p>

      <button
        data-ocid="closure.close_button"
        type="button"
        onClick={onClose}
        className="px-10 py-3.5 rounded-full text-sm font-semibold text-veil-purple bg-white/80 shadow-soft hover:bg-white transition-all duration-200 active:scale-[0.97]"
      >
        Close
      </button>
    </div>
  );
}
