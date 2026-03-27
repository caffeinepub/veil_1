import { Globe } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EmotionCardProps {
  emotion_id: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  is_own_post: boolean;
  is_anonymous: boolean;
  relationship_type:
    | "INNER_CIRCLE"
    | "COUSINS"
    | "CLOSEST_FRIENDS"
    | "FRIENDS"
    | "GLOBAL";
  emotion_type: string;
  emotion_label: string;
  emotion_emoji: string;
  emotion_text: string | null;
  has_voice_note: boolean;
  visibility: "ONLY_ME" | "INNER_CIRCLE" | "FRIENDS" | "GLOBAL";
  created_at: string; // ISO8601
  current_user_reaction:
    | "SUPPORT"
    | "IM_HERE"
    | "THINKING_OF_YOU"
    | "TALK_IF_YOU_WANT"
    | null;
  reactions_exist: boolean;
  is_unanswered: boolean;
  index?: number;
  onReact?: (emotion_id: string, reaction: string) => void;
  onDelete?: (emotion_id: string) => void;
  onVisibilityChange?: (emotion_id: string, visibility: string) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const REACTIONS: {
  key: string;
  emoji: string;
  label: string;
  ariaBase: string;
}[] = [
  {
    key: "SUPPORT",
    emoji: "❤️",
    label: "Support",
    ariaBase: "Send Support reaction to",
  },
  {
    key: "IM_HERE",
    emoji: "🌿",
    label: "I'm here",
    ariaBase: "Send I'm here reaction to",
  },
  {
    key: "THINKING_OF_YOU",
    emoji: "🤍",
    label: "Thinking of you",
    ariaBase: "Send Thinking of you reaction to",
  },
  {
    key: "TALK_IF_YOU_WANT",
    emoji: "💬",
    label: "Talk if you want",
    ariaBase: "Open Talk if you want with",
  },
];

const VISIBILITY_OPTIONS: { value: string; label: string; icon: string }[] = [
  { value: "ONLY_ME", label: "Only Me", icon: "🔒" },
  { value: "INNER_CIRCLE", label: "Inner Circle", icon: "👥" },
  { value: "FRIENDS", label: "Friends", icon: "🤝" },
  { value: "GLOBAL", label: "Global (Anonymous)", icon: "🌍" },
];

const AVATAR_GRADIENT = "linear-gradient(135deg, #C9B8E8 0%, #9B7FC0 100%)";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function emotionTint(emotionType: string): string {
  const t = emotionType.toLowerCase();
  if (["grateful", "calm", "hopeful"].includes(t))
    return "rgba(168,197,160,0.12)";
  if (["stressed", "anxious", "frustrated", "numb"].includes(t))
    return "rgba(176,192,210,0.15)";
  if (["sad", "lonely"].includes(t)) return "rgba(201,184,232,0.15)";
  if (t === "reflective") return "rgba(220,215,225,0.15)";
  return "rgba(240,238,245,0.2)";
}

function relationshipLabel(
  rel: EmotionCardProps["relationship_type"],
): { text: string; bg: string; color: string } | null {
  switch (rel) {
    case "INNER_CIRCLE":
      return {
        text: "Inner Circle",
        bg: "rgba(201,184,232,0.3)",
        color: "#6B5B8E",
      };
    case "COUSINS":
      return { text: "Cousins", bg: "rgba(201,184,232,0.2)", color: "#6B5B8E" };
    case "CLOSEST_FRIENDS":
      return {
        text: "Closest Friend",
        bg: "rgba(168,197,160,0.3)",
        color: "#5A8C5A",
      };
    case "FRIENDS":
      return { text: "Friend", bg: "rgba(168,197,160,0.3)", color: "#5A8C5A" };
    default:
      return null;
  }
}

function formatTime(iso: string, isAnonymous: boolean): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (isAnonymous) {
    return diffMs < 12 * 3600000 ? "Recently" : "Today";
  }

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatExactTime(iso: string): string {
  const date = new Date(iso);
  const datePart = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timePart = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${datePart} · ${timePart}`;
}

// ─── TalkFlow (inline) ────────────────────────────────────────────────────────

function TalkFlow({ name, onClose }: { name: string; onClose: () => void }) {
  const [step, setStep] = useState<"prompt" | "accepted" | "declined">(
    "prompt",
  );
  return (
    <div
      className="mt-3 rounded-2xl p-4"
      style={{
        background:
          "linear-gradient(135deg, rgba(201,184,232,0.15) 0%, rgba(168,197,160,0.15) 100%)",
        border: "1px solid rgba(201,184,232,0.3)",
      }}
    >
      {step === "prompt" && (
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <span className="text-lg">🌿</span>
            <p className="text-sm" style={{ color: "#2D2540" }}>
              <span className="font-medium">{name}</span> wants to be there for
              you.
              <br />
              <span style={{ color: "#8B8097" }}>Would you like to talk?</span>
            </p>
          </div>
          <div className="space-y-2">
            <button
              type="button"
              data-ocid="emotion_card.confirm_button"
              onClick={() => setStep("accepted")}
              className="w-full py-2.5 rounded-2xl text-sm font-medium text-white transition-all active:scale-95"
              style={{
                background: "linear-gradient(135deg, #6B5B8E 0%, #9B7FC0 100%)",
              }}
            >
              Open a private conversation
            </button>
            <button
              type="button"
              data-ocid="emotion_card.cancel_button"
              onClick={() => setStep("declined")}
              className="w-full py-2.5 rounded-2xl text-xs transition-all active:scale-95"
              style={{
                backgroundColor: "rgba(201,184,232,0.2)",
                color: "#8B8097",
              }}
            >
              Just knowing you care is enough — thank you
            </button>
          </div>
        </div>
      )}
      {step === "accepted" && (
        <div className="text-center py-2 space-y-2">
          <span className="text-2xl">🌿</span>
          <p className="text-sm font-medium" style={{ color: "#2D2540" }}>
            A quiet space has been opened for you both.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="text-xs"
            style={{ color: "#8B8097" }}
          >
            Close
          </button>
        </div>
      )}
      {step === "declined" && (
        <div className="text-center py-2 space-y-2">
          <span className="text-2xl">🤍</span>
          <p className="text-sm" style={{ color: "#8B8097" }}>
            They appreciated your support. Thank you for showing up for them.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="text-xs"
            style={{ color: "#8B8097" }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Emotion Detail Screen ────────────────────────────────────────────────────

function EmotionDetailScreen({
  props,
  onClose,
  onReact,
}: {
  props: EmotionCardProps;
  onClose: () => void;
  onReact: (reaction: string) => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [talkOpen, setTalkOpen] = useState(false);
  const displayName = props.is_anonymous
    ? "anonymous community member"
    : props.is_own_post
      ? "You"
      : props.user_name;

  return (
    <motion.div
      data-ocid="emotion_card.modal"
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      initial={shouldReduceMotion ? {} : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={shouldReduceMotion ? {} : { opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundColor: "rgba(45,37,64,0.45)",
          backdropFilter: "blur(4px)",
        }}
        onClick={onClose}
        aria-label="Close emotion detail"
      />

      {/* Panel */}
      <motion.div
        className="relative w-full sm:max-w-lg mx-auto rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{
          background: "#FAF7F2",
          maxHeight: "calc(100dvh - 88px)",
          boxShadow: "0 8px 40px rgba(45,37,64,0.25)",
        }}
        initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.97, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={shouldReduceMotion ? {} : { opacity: 0, scale: 0.97, y: 16 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <div
          className="overflow-y-auto"
          style={{ maxHeight: "calc(100dvh - 88px)" }}
        >
          {/* Back button */}
          <div className="flex items-center px-5 pt-5 pb-3">
            <button
              type="button"
              data-ocid="emotion_card.close_button"
              onClick={onClose}
              aria-label="Close emotion detail"
              className="flex items-center gap-1.5 text-sm font-medium rounded-xl px-3 py-1.5 transition-all active:scale-95"
              style={{
                backgroundColor: "rgba(201,184,232,0.2)",
                color: "#6B5B8E",
              }}
            >
              ← Back
            </button>
          </div>

          <div className="px-5 pb-8 space-y-5">
            {/* User Header */}
            <div className="flex items-center gap-3">
              {props.is_anonymous ? (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "rgba(201,184,232,0.2)" }}
                >
                  <Globe size={18} style={{ color: "#8B8097" }} />
                </div>
              ) : (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0 overflow-hidden"
                  style={{
                    background: props.user_avatar ? undefined : AVATAR_GRADIENT,
                  }}
                >
                  {props.user_avatar ? (
                    <img
                      src={props.user_avatar}
                      alt={props.user_name}
                      className="w-full h-full object-cover"
                    />
                  ) : props.is_own_post ? (
                    "Y"
                  ) : (
                    props.user_name.charAt(0).toUpperCase()
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "#2D2540" }}
                  >
                    {props.is_anonymous
                      ? "Someone in the Veil community"
                      : props.is_own_post
                        ? "You"
                        : props.user_name}
                  </p>
                  {!props.is_anonymous &&
                    !props.is_own_post &&
                    (() => {
                      const rel = relationshipLabel(props.relationship_type);
                      return rel ? (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: rel.bg, color: rel.color }}
                          aria-label={`${rel.text} member`}
                        >
                          {rel.text}
                        </span>
                      ) : null;
                    })()}
                  {props.is_own_post && (
                    <span className="text-xs" style={{ color: "#8B8097" }}>
                      You shared this
                    </span>
                  )}
                </div>
                <p className="text-xs mt-0.5" style={{ color: "#8B8097" }}>
                  {formatExactTime(props.created_at)}
                </p>
              </div>
            </div>

            {/* Emotion Display */}
            <div
              className="rounded-2xl py-6 px-4 flex flex-col items-center gap-2"
              style={{ backgroundColor: emotionTint(props.emotion_type) }}
            >
              <span
                className="text-5xl leading-none"
                role="img"
                aria-label={props.emotion_label}
              >
                {props.emotion_emoji}
              </span>
              <span
                className="text-xl font-medium"
                style={{ color: "#4A4260" }}
              >
                {props.emotion_label}
              </span>
            </div>

            {/* Full emotion text — no truncation */}
            {props.emotion_text && (
              <p
                className="text-base leading-relaxed"
                style={{ color: "#4A4260", lineHeight: 1.7 }}
              >
                {props.emotion_text}
              </p>
            )}

            {/* Reactions */}
            {!props.is_own_post && (
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  {REACTIONS.map(({ key, emoji, label, ariaBase }) => {
                    const active = props.current_user_reaction === key;
                    const isTalk = key === "TALK_IF_YOU_WANT";
                    return (
                      <motion.button
                        key={key}
                        type="button"
                        data-ocid={`emotion_card.${key.toLowerCase()}.button`}
                        aria-label={`${ariaBase} ${displayName}`}
                        aria-pressed={active}
                        whileTap={shouldReduceMotion ? {} : { scale: 1.12 }}
                        transition={{ duration: 0.18, ease: "easeInOut" }}
                        onClick={() => {
                          if (isTalk) setTalkOpen((o) => !o);
                          onReact(key);
                        }}
                        className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm transition-all duration-200"
                        style={{
                          minHeight: 48,
                          minWidth: 48,
                          backgroundColor: active
                            ? "rgba(201,184,232,0.5)"
                            : isTalk && talkOpen
                              ? "rgba(168,197,160,0.35)"
                              : "rgba(240,238,245,0.8)",
                          border: active
                            ? "1px solid rgba(107,91,142,0.3)"
                            : "1px solid transparent",
                          opacity:
                            props.current_user_reaction && !active ? 0.45 : 1,
                        }}
                      >
                        <span>{emoji}</span>
                        <span
                          className="text-xs font-medium"
                          style={{ color: "#4A4260" }}
                        >
                          {label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Reaction indicator */}
                {props.current_user_reaction && (
                  <p className="mt-2 text-xs" style={{ color: "#8B8097" }}>
                    You showed up for them.
                  </p>
                )}
                {!props.current_user_reaction && props.reactions_exist && (
                  <p className="mt-2 text-xs" style={{ color: "#8B8097" }}>
                    Friends sent support
                  </p>
                )}

                {/* Talk flow */}
                {talkOpen && (
                  <TalkFlow
                    name={props.is_anonymous ? "Someone" : props.user_name}
                    onClose={() => setTalkOpen(false)}
                  />
                )}
              </div>
            )}

            {/* Own post reactions */}
            {props.is_own_post && (
              <p className="text-sm" style={{ color: "#8B8097" }}>
                {props.reactions_exist
                  ? "Friends sent support"
                  : "No reactions yet — your feelings are still valid."}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── EmotionCard ──────────────────────────────────────────────────────────────

export function EmotionCard(props: EmotionCardProps) {
  // Voice note guard — must be before any hooks
  if (props.has_voice_note) {
    console.error(
      "[EmotionCard] Voice note entry reached feed — data integrity error. emotion_id:",
      props.emotion_id,
    );
    return null;
  }
  return <EmotionCardInner {...props} index={props.index ?? 0} />;
}

// Inner component holds all state (avoids conditional hook issue with early return above)
function EmotionCardInner(props: EmotionCardProps & { index: number }) {
  const {
    emotion_id,
    user_name,
    user_avatar,
    is_own_post,
    is_anonymous,
    relationship_type,
    emotion_type,
    emotion_label,
    emotion_emoji,
    emotion_text,
    visibility,
    created_at,
    current_user_reaction,
    reactions_exist,
    is_unanswered,
    index,
    onReact,
    onDelete,
    onVisibilityChange,
  } = props;

  const shouldReduceMotion = useReducedMotion();
  const [detailOpen, setDetailOpen] = useState(false);
  const [talkOpen, setTalkOpen] = useState(false);
  const [visibilityOpen, setVisibilityOpen] = useState(false);
  const [currentVisibility, setCurrentVisibility] = useState(visibility);
  const [deleting, setDeleting] = useState(false);

  // Lock body AND main scroll container when detail modal is open
  useEffect(() => {
    const mainEl = document.querySelector("main") as HTMLElement | null;
    if (detailOpen) {
      document.body.style.overflow = "hidden";
      if (mainEl) mainEl.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      if (mainEl) mainEl.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      if (mainEl) mainEl.style.overflow = "";
    };
  }, [detailOpen]);
  const [deleted, setDeleted] = useState(false);
  const [localReaction, setLocalReaction] = useState<string | null>(
    current_user_reaction ?? null,
  );

  if (deleted) return null;

  const tint = emotionTint(emotion_type);
  const displayName = is_anonymous
    ? "anonymous community member"
    : is_own_post
      ? "You"
      : user_name;

  const cardShadow = is_unanswered
    ? "0 0 0 2px rgba(212,160,80,0.35), 0 2px 12px rgba(107,91,142,0.08)"
    : "0 2px 12px rgba(107,91,142,0.08)";

  const isLongText = (emotion_text?.length ?? 0) > 180;

  function handleReact(key: string) {
    if (key === localReaction) return;
    setLocalReaction(key);
    if (key === "TALK_IF_YOU_WANT") setTalkOpen((o) => !o);
    onReact?.(emotion_id, key);
  }

  function handleCardClick(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("[data-no-detail]")) return;
    setDetailOpen(true);
  }

  const rel =
    !is_anonymous && !is_own_post ? relationshipLabel(relationship_type) : null;

  let reactionIndicator: string | null = null;
  if (is_own_post) {
    reactionIndicator = reactions_exist
      ? "Friends sent support"
      : "No reactions yet — your feelings are still valid.";
  } else if (localReaction) {
    reactionIndicator = "You showed up for them.";
  } else if (reactions_exist) {
    reactionIndicator = "Friends sent support";
  }

  return (
    <>
      <motion.article
        data-ocid={`emotion_card.item.${index + 1}`}
        aria-label={
          is_anonymous ? "Post from anonymous community member" : undefined
        }
        className="bg-white rounded-3xl p-5 cursor-pointer relative"
        style={{ boxShadow: cardShadow }}
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          shouldReduceMotion
            ? {}
            : { duration: 0.25, ease: "easeOut", delay: index * 0.05 }
        }
        onClick={handleCardClick}
      >
        {is_unanswered && (
          <span className="sr-only">This person may still need support</span>
        )}

        {/* Section 1: User Header */}
        <div className="flex items-center gap-3 mb-4">
          {is_anonymous ? (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: "rgba(201,184,232,0.2)" }}
              aria-hidden="true"
            >
              <Globe size={18} style={{ color: "#8B8097" }} />
            </div>
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0 overflow-hidden"
              style={{ background: user_avatar ? undefined : AVATAR_GRADIENT }}
              aria-hidden="true"
            >
              {user_avatar ? (
                <img
                  src={user_avatar}
                  alt={user_name}
                  className="w-full h-full object-cover"
                />
              ) : is_own_post ? (
                "Y"
              ) : (
                user_name.charAt(0).toUpperCase()
              )}
            </div>
          )}

          <div className="flex-1 min-w-0">
            {is_anonymous ? (
              <>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "#2D2540" }}
                >
                  Someone in the Veil community
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#8B8097" }}>
                  {formatTime(created_at, true)}
                </p>
              </>
            ) : is_own_post ? (
              <>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "#2D2540" }}
                >
                  You
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#8B8097" }}>
                  You shared this · {formatTime(created_at, false)}
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "#2D2540" }}
                  >
                    {user_name}
                  </p>
                  {rel && (
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: rel.bg, color: rel.color }}
                      aria-label={`${rel.text} member`}
                    >
                      {rel.text}
                    </span>
                  )}
                </div>
                <p className="text-xs mt-0.5" style={{ color: "#8B8097" }}>
                  {formatTime(created_at, false)}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Section 2: Emotion Display */}
        <div
          className="rounded-2xl py-5 px-4 flex flex-col items-center gap-2 mb-4"
          style={{ backgroundColor: tint }}
        >
          <span
            className="text-5xl leading-none"
            role="img"
            aria-label={emotion_label}
            style={{ fontSize: 48 }}
          >
            {emotion_emoji}
          </span>
          <span
            className="text-xl font-medium"
            style={{ color: "#4A4260", fontSize: 20 }}
          >
            {emotion_label}
          </span>
        </div>

        {/* Section 3: Emotion Text */}
        {emotion_text && (
          <div className="mb-4">
            <p
              className="text-base leading-relaxed"
              style={{
                color: "#4A4260",
                lineHeight: 1.65,
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {emotion_text}
            </p>
            {isLongText && (
              <button
                type="button"
                data-no-detail="true"
                aria-label={`Expand full emotion text from ${displayName}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setDetailOpen(true);
                }}
                className="mt-1 text-sm font-medium transition-opacity hover:opacity-70"
                style={{ color: "#6B5B8E" }}
              >
                Read more →
              </button>
            )}
          </div>
        )}

        {/* Section 4 & 5: Reactions / Own Post Controls */}
        {is_own_post ? (
          <div data-no-detail="true">
            {reactionIndicator && (
              <p className="text-xs mb-3" style={{ color: "#8B8097" }}>
                {reactionIndicator}
              </p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <button
                  type="button"
                  data-ocid="emotion_card.edit_button"
                  aria-label="Edit visibility of your emotion post"
                  onClick={(e) => {
                    e.stopPropagation();
                    setVisibilityOpen((o) => !o);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200"
                  style={{
                    backgroundColor: "rgba(201,184,232,0.2)",
                    color: "#6B5B8E",
                  }}
                >
                  {
                    VISIBILITY_OPTIONS.find(
                      (v) => v.value === currentVisibility,
                    )?.icon
                  }{" "}
                  Edit visibility
                </button>
                <AnimatePresence>
                  {visibilityOpen && (
                    <motion.div
                      data-ocid="emotion_card.dropdown_menu"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 bottom-full mb-1 bg-white rounded-2xl overflow-hidden z-10"
                      style={{
                        boxShadow: "0 4px 20px rgba(107,91,142,0.15)",
                        minWidth: 180,
                      }}
                    >
                      {VISIBILITY_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentVisibility(
                              opt.value as EmotionCardProps["visibility"],
                            );
                            setVisibilityOpen(false);
                            onVisibilityChange?.(emotion_id, opt.value);
                          }}
                          className="w-full px-4 py-2.5 text-left text-xs flex items-center gap-2 transition-colors hover:bg-gray-50"
                          style={{
                            color:
                              currentVisibility === opt.value
                                ? "#6B5B8E"
                                : "#2D2540",
                          }}
                        >
                          {opt.icon} {opt.label}
                          {currentVisibility === opt.value && (
                            <span
                              className="ml-auto"
                              style={{ color: "#6B5B8E" }}
                            >
                              ✓
                            </span>
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {deleting ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    data-ocid="emotion_card.confirm_button"
                    aria-label="Confirm delete your emotion post"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.(emotion_id);
                      setDeleted(true);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                    style={{
                      backgroundColor: "rgba(255,100,100,0.1)",
                      color: "#C47B7B",
                    }}
                  >
                    Confirm delete
                  </button>
                  <button
                    type="button"
                    data-ocid="emotion_card.cancel_button"
                    aria-label="Cancel delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleting(false);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                    style={{
                      backgroundColor: "rgba(201,184,232,0.15)",
                      color: "#8B8097",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  data-ocid="emotion_card.delete_button"
                  aria-label="Delete your emotion post"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleting(true);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200"
                  style={{
                    backgroundColor: "rgba(255,100,100,0.08)",
                    color: "#C47B7B",
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ) : (
          <div data-no-detail="true">
            <div className="flex items-center gap-1.5 flex-wrap">
              {REACTIONS.map(({ key, emoji, label, ariaBase }) => {
                const active = localReaction === key;
                const isTalk = key === "TALK_IF_YOU_WANT";
                return (
                  <motion.button
                    key={key}
                    type="button"
                    data-ocid={`emotion_card.${key.toLowerCase()}.button`}
                    aria-label={`${ariaBase} ${displayName}`}
                    aria-pressed={active}
                    whileTap={shouldReduceMotion ? {} : { scale: 1.12 }}
                    transition={{ duration: 0.18, ease: "easeInOut" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReact(key);
                    }}
                    className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-all duration-200"
                    style={{
                      minHeight: 48,
                      minWidth: 48,
                      backgroundColor: active
                        ? "rgba(201,184,232,0.5)"
                        : isTalk && talkOpen
                          ? "rgba(168,197,160,0.35)"
                          : "rgba(240,238,245,0.8)",
                      border: active
                        ? "1px solid rgba(107,91,142,0.3)"
                        : "1px solid transparent",
                      opacity: localReaction && !active ? 0.45 : 1,
                      color: "#4A4260",
                    }}
                  >
                    <span>{emoji}</span>
                    <span>{label}</span>
                  </motion.button>
                );
              })}
            </div>

            {talkOpen && (
              <TalkFlow
                name={is_anonymous ? "Someone" : user_name}
                onClose={() => setTalkOpen(false)}
              />
            )}

            {reactionIndicator && (
              <p className="mt-2 text-xs" style={{ color: "#8B8097" }}>
                {reactionIndicator}
              </p>
            )}
          </div>
        )}
      </motion.article>

      <AnimatePresence>
        {detailOpen && (
          <EmotionDetailScreen
            props={{
              ...props,
              current_user_reaction:
                localReaction as EmotionCardProps["current_user_reaction"],
            }}
            onClose={() => setDetailOpen(false)}
            onReact={(key) => handleReact(key)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
