import { Toaster } from "@/components/ui/sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookHeart,
  BookOpen,
  Check,
  Flame,
  Home,
  Loader2,
  PenLine,
  Pencil,
  Sparkles,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { JournalEntry, Reflection, Stats, UserProfile } from "./backend";
import type { ApologyEntry, ApologySchedule } from "./backend";
import { ApologyCreationFlow } from "./components/ApologyCreationFlow";
import { CompanionCard } from "./components/CompanionCard";
import { EmotionCheckIn } from "./components/EmotionCheckIn";
import { EmotionFeed } from "./components/EmotionFeed";
import { LoveLetterFlow } from "./components/LoveLetterFlow";
import { QuietMomentScreen } from "./components/QuietMomentScreen";
import { ReceiverApologyView } from "./components/ReceiverApologyView";
import { VeilVoiceOverlay } from "./components/VeilVoiceOverlay";
import { VoiceOnboarding } from "./components/VoiceOnboarding";
import { VoiceSettingsPanel } from "./components/VoiceSettingsPanel";
import { VeilVoiceProvider } from "./contexts/VeilVoiceContext";
import { useActor } from "./hooks/useActor";

// ─── Constants ────────────────────────────────────────────────────────────────

const QUOTES = [
  {
    text: "You are allowed to be both a masterpiece and a work in progress simultaneously.",
    author: "Sophia Bush",
  },
  {
    text: "Healing is not linear. Be patient with yourself.",
    author: "Unknown",
  },
  {
    text: "Your feelings are valid. Every single one of them.",
    author: "Unknown",
  },
  {
    text: "The act of writing is the act of discovering what you believe.",
    author: "David Hare",
  },
  {
    text: "In the middle of difficulty lies opportunity for growth.",
    author: "Adapted",
  },
  {
    text: "You deserve the same compassion you give to others.",
    author: "Unknown",
  },
  {
    text: "Breathing in, I calm my body. Breathing out, I smile.",
    author: "Thich Nhat Hanh",
  },
];

const MOODS = [
  { key: "calm", emoji: "😌", label: "Calm", color: "#A8C5A0" },
  { key: "anxious", emoji: "😰", label: "Anxious", color: "#F2B5C5" },
  { key: "happy", emoji: "😊", label: "Happy", color: "#F7E6A0" },
  { key: "sad", emoji: "😢", label: "Sad", color: "#B5C8E8" },
  { key: "grateful", emoji: "🙏", label: "Grateful", color: "#C9B8E8" },
  { key: "hopeful", emoji: "🌟", label: "Hopeful", color: "#F5C5A0" },
  { key: "tired", emoji: "😴", label: "Tired", color: "#D4C5B5" },
  { key: "angry", emoji: "😤", label: "Angry", color: "#E8A5A5" },
];

const PROMPTS = [
  "What made you smile today?",
  "What are you grateful for right now?",
  "What's weighing on your mind?",
  "Describe a moment of peace you experienced recently.",
  "What would you tell your past self today?",
  "What emotion is most present for you right now, and why?",
  "What small act of kindness can you do for yourself?",
  "What are you looking forward to?",
  "What does your body need from you today?",
  "If today had a color, what would it be and why?",
];

type Tab = "home" | "write" | "journal" | "reflections" | "profile";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMoodInfo(key: string) {
  return (
    MOODS.find((m) => m.key === key) ?? {
      emoji: "💭",
      label: key,
      color: "#C9B8E8",
    }
  );
}

function formatDate(ts: bigint): string {
  const d = new Date(Number(ts) / 1_000_000);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function todayQuote(): { text: string; author: string } {
  const day = new Date().getDay();
  return QUOTES[day % QUOTES.length];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MoodChip({
  mood,
  selected,
  onClick,
}: {
  mood: (typeof MOODS)[0];
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-medium transition-all duration-200 select-none"
      style={{
        backgroundColor: selected ? mood.color : `${mood.color}40`,
        color: "#2D2540",
        border: selected ? `2px solid ${mood.color}` : "2px solid transparent",
        boxShadow: selected ? `0 2px 8px ${mood.color}60` : "none",
        transform: selected ? "scale(1.04)" : "scale(1)",
      }}
    >
      <span>{mood.emoji}</span>
      <span>{mood.label}</span>
    </button>
  );
}

function JournalCard({
  entry,
  onDelete,
  index,
}: {
  entry: JournalEntry;
  onDelete: (id: string) => void;
  index: number;
}) {
  const [confirming, setConfirming] = useState(false);
  const mood = getMoodInfo(entry.mood);

  return (
    <article
      data-ocid={`journal.item.${index}`}
      className="bg-white rounded-3xl p-5 shadow-card animate-fade-in"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: `${mood.color}50`, color: "#2D2540" }}
          >
            {mood.emoji} {mood.label}
          </span>
          <span className="text-xs text-veil-muted">
            {formatDate(entry.timestamp)}
          </span>
        </div>
        {confirming ? (
          <div className="flex items-center gap-1 shrink-0">
            <button
              data-ocid={`journal.confirm_button.${index}`}
              type="button"
              onClick={() => {
                onDelete(entry.id);
                setConfirming(false);
              }}
              className="w-7 h-7 rounded-full bg-red-100 text-red-500 flex items-center justify-center hover:bg-red-200 transition-colors"
            >
              <Check size={13} />
            </button>
            <button
              data-ocid={`journal.cancel_button.${index}`}
              type="button"
              onClick={() => setConfirming(false)}
              className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          <button
            data-ocid={`journal.delete_button.${index}`}
            type="button"
            onClick={() => setConfirming(true)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-veil-muted hover:bg-red-50 hover:text-red-400 transition-all duration-200 shrink-0"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
      {entry.title && (
        <h3 className="font-serif font-semibold text-veil-text text-base mb-1.5 leading-snug">
          {entry.title}
        </h3>
      )}
      <p className="text-sm text-veil-muted leading-relaxed line-clamp-2">
        {entry.body}
      </p>
    </article>
  );
}

// ─── Tab: Home ────────────────────────────────────────────────────────────────

function HomeTab({
  onNavigate,
  profile,
  entries,
  onPostSuccess,
}: {
  onNavigate: (tab: Tab) => void;
  profile: UserProfile | null | undefined;
  entries: JournalEntry[] | undefined;
  onPostSuccess?: (data: {
    emotion_type: string;
    emotion_label: string;
    emotion_emoji: string;
    visibility: string;
    source: "emotion_checkin";
    crisis_signal_detected: boolean;
  }) => void;
}) {
  const quote = todayQuote();
  const name = profile?.displayName;
  const recent = (entries ?? [])
    .slice()
    .sort((a, b) => Number(b.timestamp - a.timestamp))
    .slice(0, 3);

  return (
    <div className="animate-fade-in pb-6">
      {/* Header gradient */}
      <div
        className="rounded-b-3xl px-6 pt-12 pb-8 mb-6"
        style={{
          background: "linear-gradient(135deg, #C9B8E8 0%, #F2B5C5 100%)",
        }}
      >
        <p className="text-sm font-medium text-veil-purple/70 mb-1">
          Good {getTimeOfDay()}
        </p>
        <h1 className="font-serif text-2xl font-semibold text-veil-text">
          {name ? `Hello, ${name} 🌿` : "Welcome back 🌿"}
        </h1>
        <p className="text-sm text-veil-text/70 mt-1">
          How are you feeling today?
        </p>
      </div>

      {/* Companion Card — emotional release feature */}
      <CompanionCard />

      {/* Emotion Check-In — Component 2 */}
      <EmotionCheckIn onPostSuccess={onPostSuccess} />

      {/* Emotion Feed — Component 3 */}
      <EmotionFeed onCheckIn={() => onNavigate("write")} />

      <div className="px-5 space-y-5">
        {/* Mood check-in */}
        <section
          data-ocid="home.section"
          className="bg-white rounded-3xl p-5 shadow-soft"
        >
          <h2 className="font-serif text-base font-semibold text-veil-text mb-4">
            Quick Mood Check-in
          </h2>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((mood) => (
              <button
                key={mood.key}
                type="button"
                onClick={() => onNavigate("write")}
                className="flex flex-col items-center gap-1 p-3 rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95"
                style={{ backgroundColor: `${mood.color}40` }}
              >
                <span className="text-xl">{mood.emoji}</span>
                <span className="text-xs font-medium text-veil-muted">
                  {mood.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Quote */}
        <section
          className="rounded-3xl p-5"
          style={{
            background: "linear-gradient(135deg, #A8C5A020 0%, #C9B8E830 100%)",
          }}
        >
          <p className="text-xs font-medium uppercase tracking-widest text-veil-purple/60 mb-2">
            Today&apos;s Reflection
          </p>
          <blockquote className="font-serif text-base italic text-veil-text leading-relaxed">
            &ldquo;{quote.text}&rdquo;
          </blockquote>
          <p className="text-xs text-veil-muted mt-2">&mdash; {quote.author}</p>
        </section>

        {/* Recent entries */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-base font-semibold text-veil-text">
              Recent Entries
            </h2>
            <button
              type="button"
              onClick={() => onNavigate("journal")}
              className="text-xs text-veil-purple font-medium hover:underline"
            >
              See all
            </button>
          </div>
          {recent.length === 0 ? (
            <div
              data-ocid="home.empty_state"
              className="bg-white rounded-3xl p-6 shadow-soft text-center"
            >
              <BookHeart
                className="mx-auto mb-2 text-veil-lavender"
                size={32}
              />
              <p className="text-sm text-veil-muted">
                No entries yet. Start your first one.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recent.map((entry, i) => {
                const mood = getMoodInfo(entry.mood);
                return (
                  <div
                    key={entry.id}
                    data-ocid={`home.item.${i + 1}`}
                    className="bg-white rounded-2xl p-4 shadow-soft"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: `${mood.color}50`,
                          color: "#2D2540",
                        }}
                      >
                        {mood.emoji} {mood.label}
                      </span>
                      <span className="text-xs text-veil-muted">
                        {formatDate(entry.timestamp)}
                      </span>
                    </div>
                    {entry.title && (
                      <p className="font-serif text-sm font-semibold text-veil-text line-clamp-1">
                        {entry.title}
                      </p>
                    )}
                    <p className="text-xs text-veil-muted line-clamp-1 mt-0.5">
                      {entry.body}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* CTA */}
        <button
          data-ocid="home.primary_button"
          type="button"
          onClick={() => onNavigate("write")}
          className="w-full py-4 rounded-3xl font-semibold text-white text-sm transition-all duration-200 hover:opacity-90 active:scale-95 shadow-soft"
          style={{
            background: "linear-gradient(135deg, #6B5B8E 0%, #9B7FC0 100%)",
          }}
        >
          ✍️ Start Writing
        </button>
      </div>
    </div>
  );
}

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

// ─── Tab: Write ───────────────────────────────────────────────────────────────

function WriteTab({ onSaved }: { onSaved: () => void }) {
  const { actor } = useActor();
  const qc = useQueryClient();
  const [selectedMood, setSelectedMood] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [showApologyFlow, setShowApologyFlow] = useState(false);
  const [showLoveLetterFlow, setShowLoveLetterFlow] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      await actor.addJournalEntry(title.trim(), body.trim(), selectedMood);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entries"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Entry saved 🌿");
      setTitle("");
      setBody("");
      setSelectedMood("");
      onSaved();
    },
    onError: () => toast.error("Failed to save entry"),
  });

  const canSave = body.trim().length > 0 && selectedMood !== "";

  return (
    <div className="animate-fade-in pb-6">
      <div
        className="rounded-b-3xl px-6 pt-12 pb-8 mb-6"
        style={{
          background: "linear-gradient(135deg, #A8C5A0 0%, #C9B8E8 100%)",
        }}
      >
        <p className="text-xs font-medium uppercase tracking-widest text-veil-purple/70 mb-1">
          New Entry
        </p>
        <h1 className="font-serif text-2xl font-semibold text-veil-text">
          Write Freely ✍️
        </h1>
        <p className="text-sm text-veil-text/70 mt-1">
          This is your safe space.
        </p>
      </div>

      {/* Express Love Card */}
      <div className="px-5 mb-3">
        <button
          type="button"
          data-ocid="write.express_love.button"
          onClick={() => setShowLoveLetterFlow(true)}
          className="w-full bg-white rounded-3xl p-6 shadow-soft text-left transition-all duration-200 hover:shadow-glow active:scale-[0.98] flex items-start gap-4"
        >
          <div className="text-3xl mt-0.5">💌</div>
          <div>
            <div className="font-serif text-base font-semibold text-veil-text mb-1">
              Express Love
            </div>
            <p className="text-veil-muted text-sm">
              Write something that matters.
            </p>
          </div>
        </button>
      </div>
      {showLoveLetterFlow && (
        <LoveLetterFlow
          onClose={() => setShowLoveLetterFlow(false)}
          onSaved={() => setShowLoveLetterFlow(false)}
        />
      )}
      {/* Apology Card */}
      <div className="px-5 mb-5">
        <button
          data-ocid="write.apology.button"
          type="button"
          onClick={() => setShowApologyFlow(true)}
          className="w-full bg-white rounded-3xl p-6 shadow-soft text-left transition-all duration-200 hover:shadow-glow active:scale-[0.98] flex items-start gap-4"
        >
          <div className="text-3xl mt-0.5">🕊</div>
          <div>
            <div className="font-serif text-base font-semibold text-veil-text mb-1">
              Write an Apology
            </div>
            <p className="text-veil-muted text-sm">
              Say what you’ve been carrying.
            </p>
          </div>
        </button>
      </div>

      {showApologyFlow && (
        <ApologyCreationFlow
          onClose={() => setShowApologyFlow(false)}
          onSaved={() => setShowApologyFlow(false)}
        />
      )}

      <div className="px-5 space-y-5">
        {/* Mood selector */}
        <section className="bg-white rounded-3xl p-5 shadow-soft">
          <h2 className="font-serif text-sm font-semibold text-veil-text mb-3">
            How are you feeling?
          </h2>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((mood) => (
              <MoodChip
                key={mood.key}
                mood={mood}
                selected={selectedMood === mood.key}
                onClick={() => setSelectedMood(mood.key)}
              />
            ))}
          </div>
        </section>

        {/* Title */}
        <input
          data-ocid="write.input"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give your entry a title..."
          className="w-full bg-white rounded-2xl px-5 py-4 text-veil-text placeholder:text-veil-muted shadow-soft outline-none font-serif text-base focus:shadow-glow transition-shadow duration-200"
          style={{ border: "none" }}
        />

        {/* Body */}
        <textarea
          data-ocid="write.textarea"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Begin writing here... this is your safe space 🌿"
          rows={8}
          className="w-full bg-white rounded-3xl px-5 py-4 text-veil-text placeholder:text-veil-muted shadow-soft outline-none text-sm leading-relaxed resize-none focus:shadow-glow transition-shadow duration-200"
          style={{ border: "none", minHeight: "200px" }}
        />

        {/* Save */}
        <button
          data-ocid="write.submit_button"
          type="button"
          disabled={!canSave || saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
          className="w-full py-4 rounded-3xl font-semibold text-white text-sm transition-all duration-200 disabled:opacity-50 active:scale-95 shadow-soft flex items-center justify-center gap-2"
          style={{
            background: canSave
              ? "linear-gradient(135deg, #6B5B8E 0%, #9B7FC0 100%)"
              : undefined,
            backgroundColor: canSave ? undefined : "#C9B8E8",
          }}
        >
          {saveMutation.isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Saving...
            </>
          ) : (
            "💾 Save Entry"
          )}
        </button>

        {saveMutation.isPending && (
          <div
            data-ocid="write.loading_state"
            className="text-center text-xs text-veil-muted"
          >
            Saving your thoughts...
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: My Journal ──────────────────────────────────────────────────────────

function JournalTab() {
  const { actor, isFetching } = useActor();
  const qc = useQueryClient();

  const { data: entries, isLoading } = useQuery<JournalEntry[]>({
    queryKey: ["entries"],
    queryFn: async () => {
      if (!actor) return [];
      const result = await actor.getAllJournalEntries();
      return result.slice().sort((a, b) => Number(b.timestamp - a.timestamp));
    },
    enabled: !!actor && !isFetching,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not connected");
      await actor.deleteJournalEntry(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entries"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Entry removed");
    },
    onError: () => toast.error("Could not delete entry"),
  });

  return (
    <div className="animate-fade-in pb-6">
      <div
        className="rounded-b-3xl px-6 pt-12 pb-8 mb-6"
        style={{
          background: "linear-gradient(135deg, #F2B5C5 0%, #C9B8E8 100%)",
        }}
      >
        <p className="text-xs font-medium uppercase tracking-widest text-veil-purple/70 mb-1">
          Archive
        </p>
        <h1 className="font-serif text-2xl font-semibold text-veil-text">
          My Journal
        </h1>
        <p className="text-sm text-veil-text/70 mt-1">
          {entries
            ? `${entries.length} ${entries.length === 1 ? "entry" : "entries"}`
            : ""}
        </p>
      </div>

      <div className="px-5 space-y-4">
        {isLoading && (
          <div
            data-ocid="journal.loading_state"
            className="flex justify-center py-12"
          >
            <Loader2 className="animate-spin text-veil-lavender" size={28} />
          </div>
        )}

        {!isLoading && entries?.length === 0 && (
          <div
            data-ocid="journal.empty_state"
            className="bg-white rounded-3xl p-10 shadow-soft text-center animate-fade-in"
          >
            <BookHeart className="mx-auto mb-3 text-veil-lavender" size={40} />
            <h3 className="font-serif text-base font-semibold text-veil-text mb-1">
              No entries yet
            </h3>
            <p className="text-sm text-veil-muted">
              Your journal is waiting. Begin by writing your first entry.
            </p>
          </div>
        )}

        {entries?.map((entry, i) => (
          <JournalCard
            key={entry.id}
            entry={entry}
            index={i + 1}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Reflections ─────────────────────────────────────────────────────────

function ReflectionsTab() {
  const { actor, isFetching } = useActor();
  const qc = useQueryClient();
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const { data: reflections } = useQuery<Reflection[]>({
    queryKey: ["reflections"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllReflections();
    },
    enabled: !!actor && !isFetching,
  });

  const savedByPrompt: Record<string, Reflection[]> = {};
  for (const r of reflections ?? []) {
    if (!savedByPrompt[r.prompt]) savedByPrompt[r.prompt] = [];
    savedByPrompt[r.prompt].push(r);
  }

  async function saveReflection(prompt: string) {
    const text = responses[prompt]?.trim();
    if (!text || !actor) return;
    setSaving((s) => ({ ...s, [prompt]: true }));
    try {
      await actor.addReflection(prompt, text);
      qc.invalidateQueries({ queryKey: ["reflections"] });
      setResponses((r) => ({ ...r, [prompt]: "" }));
      toast.success("Reflection saved 🌿");
    } catch {
      toast.error("Could not save reflection");
    } finally {
      setSaving((s) => ({ ...s, [prompt]: false }));
    }
  }

  return (
    <div className="animate-fade-in pb-6">
      <div
        className="rounded-b-3xl px-6 pt-12 pb-8 mb-6"
        style={{
          background: "linear-gradient(135deg, #C9B8E8 0%, #A8C5A0 100%)",
        }}
      >
        <p className="text-xs font-medium uppercase tracking-widest text-veil-purple/70 mb-1">
          Guided
        </p>
        <h1 className="font-serif text-2xl font-semibold text-veil-text">
          Reflections ✨
        </h1>
        <p className="text-sm text-veil-text/70 mt-1">
          Gentle prompts to explore your inner world.
        </p>
      </div>

      <div className="px-5 space-y-5">
        {PROMPTS.map((prompt, i) => {
          const past = (savedByPrompt[prompt] ?? [])
            .slice()
            .sort((a, b) => Number(b.timestamp - a.timestamp));
          return (
            <section
              key={prompt}
              data-ocid={`reflections.item.${i + 1}`}
              className="bg-white rounded-3xl p-5 shadow-soft"
            >
              <h3 className="font-serif text-sm font-semibold text-veil-text mb-3 leading-snug">
                {prompt}
              </h3>
              {past.length > 0 && (
                <div className="mb-3 space-y-2">
                  {past.slice(0, 2).map((r) => (
                    <div
                      key={r.id}
                      className="text-xs text-veil-muted bg-background rounded-2xl px-3 py-2 leading-relaxed"
                    >
                      <span className="font-medium text-veil-purple/60 mr-1">
                        {formatDate(r.timestamp)}:
                      </span>
                      {r.response}
                    </div>
                  ))}
                </div>
              )}
              <textarea
                data-ocid="reflections.textarea"
                value={responses[prompt] ?? ""}
                onChange={(e) =>
                  setResponses((r) => ({ ...r, [prompt]: e.target.value }))
                }
                placeholder="Write your thoughts here..."
                rows={3}
                className="w-full bg-background rounded-2xl px-4 py-3 text-veil-text placeholder:text-veil-muted text-sm leading-relaxed resize-none outline-none focus:shadow-glow transition-shadow duration-200"
                style={{ border: "none" }}
              />
              <button
                data-ocid="reflections.save_button"
                type="button"
                disabled={!responses[prompt]?.trim() || saving[prompt]}
                onClick={() => saveReflection(prompt)}
                className="mt-3 w-full py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 disabled:opacity-40"
                style={{
                  background: responses[prompt]?.trim()
                    ? "linear-gradient(135deg, #6B5B8E 0%, #9B7FC0 100%)"
                    : undefined,
                  backgroundColor: responses[prompt]?.trim()
                    ? undefined
                    : "#C9B8E840",
                  color: responses[prompt]?.trim() ? "white" : "#8B8097",
                }}
              >
                {saving[prompt] ? (
                  <span className="flex items-center justify-center gap-1">
                    <Loader2 size={12} className="animate-spin" /> Saving...
                  </span>
                ) : (
                  "Save Reflection"
                )}
              </button>
            </section>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tab: Profile ─────────────────────────────────────────────────────────────

function ProfileTab() {
  const { actor, isFetching } = useActor();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [saving, setSaving] = useState(false);

  const [selectedApology, setSelectedApology] = useState<ApologyEntry | null>(
    null,
  );
  const [expandedApologyId, setExpandedApologyId] = useState<string | null>(
    null,
  );
  const { data: profile } = useQuery<UserProfile | null>({
    queryKey: ["profile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: stats } = useQuery<Stats>({
    queryKey: ["stats"],
    queryFn: async () => {
      if (!actor)
        return {
          totalEntries: 0n,
          currentStreak: 0n,
          moodFrequency: [],
        } as Stats;
      return actor.getStats();
    },
    enabled: !!actor && !isFetching,
  });
  const { data: sentApologies } = useQuery<ApologyEntry[]>({
    queryKey: ["sentApologies"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyApologies();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: receivedApologies } = useQuery<ApologyEntry[]>({
    queryKey: ["receivedApologies"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getReceivedApologies();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: unsentApologies } = useQuery<ApologyEntry[]>({
    queryKey: ["unsentApologies"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyUnsentApologies();
    },
    enabled: !!actor && !isFetching,
  });

  const displayName = profile?.displayName ?? "";
  const initial = displayName ? displayName[0].toUpperCase() : "✦";

  function startEdit() {
    setNameInput(displayName);
    setEditing(true);
  }

  async function saveName() {
    if (!actor) return;
    setSaving(true);
    try {
      await actor.saveCallerUserProfile({ displayName: nameInput.trim() });
      qc.invalidateQueries({ queryKey: ["profile"] });
      setEditing(false);
      toast.success("Profile updated");
    } catch {
      toast.error("Could not update profile");
    } finally {
      setSaving(false);
    }
  }

  const moodFreq = stats?.moodFrequency ?? [];
  const topMood =
    moodFreq.length > 0
      ? moodFreq.reduce((a, b) => (b[1] > a[1] ? b : a))
      : null;
  const totalMoodCount = moodFreq.reduce((s, [, c]) => s + Number(c), 0);

  return (
    <div className="animate-fade-in pb-6">
      <div
        className="rounded-b-3xl px-6 pt-12 pb-10 mb-6 flex flex-col items-center text-center"
        style={{
          background:
            "linear-gradient(135deg, #F2B5C5 0%, #C9B8E8 50%, #A8C5A0 100%)",
        }}
      >
        {/* Avatar */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-serif font-bold text-white mb-4 shadow-card"
          style={{
            background: "linear-gradient(135deg, #6B5B8E 0%, #9B7FC0 100%)",
          }}
        >
          {initial}
        </div>

        {editing ? (
          <div className="flex items-center gap-2">
            <input
              data-ocid="profile.input"
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveName()}
              className="bg-white/80 rounded-xl px-3 py-2 text-veil-text text-sm font-medium outline-none text-center"
            />
            <button
              data-ocid="profile.save_button"
              type="button"
              onClick={saveName}
              disabled={saving}
              className="w-8 h-8 rounded-full bg-white/80 text-veil-purple flex items-center justify-center hover:bg-white transition-colors"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Check size={14} />
              )}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="w-8 h-8 rounded-full bg-white/60 text-veil-muted flex items-center justify-center"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-xl font-semibold text-veil-text">
              {displayName || "Your Name"}
            </h1>
            <button
              data-ocid="profile.edit_button"
              type="button"
              onClick={startEdit}
              className="w-7 h-7 rounded-full bg-white/60 text-veil-purple flex items-center justify-center hover:bg-white transition-colors"
            >
              <Pencil size={12} />
            </button>
          </div>
        )}
        <p className="text-xs text-veil-text/60 mt-1">
          Your emotional sanctuary
        </p>
      </div>

      <div className="px-5 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div
            data-ocid="profile.card"
            className="bg-white rounded-3xl p-4 shadow-soft text-center"
          >
            <p className="text-2xl font-serif font-bold text-veil-purple">
              {stats ? String(stats.totalEntries) : "—"}
            </p>
            <p className="text-xs text-veil-muted mt-1">Entries</p>
          </div>
          <div className="bg-white rounded-3xl p-4 shadow-soft text-center">
            <p className="text-2xl font-serif font-bold text-veil-purple">
              {stats ? String(stats.currentStreak) : "—"}
            </p>
            <p className="text-xs text-veil-muted mt-1">🔥 Streak</p>
          </div>
          <div className="bg-white rounded-3xl p-4 shadow-soft text-center">
            <p className="text-xl font-serif font-bold text-veil-purple">
              {topMood ? getMoodInfo(topMood[0]).emoji : "—"}
            </p>
            <p className="text-xs text-veil-muted mt-1">
              {topMood ? getMoodInfo(topMood[0]).label : "No data"}
            </p>
          </div>
        </div>

        {/* Mood history */}
        {moodFreq.length > 0 && (
          <section className="bg-white rounded-3xl p-5 shadow-soft">
            <h2 className="font-serif text-sm font-semibold text-veil-text mb-4">
              Mood History
            </h2>
            <div className="space-y-2.5">
              {moodFreq
                .slice()
                .sort((a, b) => Number(b[1] - a[1]))
                .map(([moodKey, count]) => {
                  const mood = getMoodInfo(moodKey);
                  const pct =
                    totalMoodCount > 0
                      ? (Number(count) / totalMoodCount) * 100
                      : 0;
                  return (
                    <div key={moodKey} className="flex items-center gap-3">
                      <span className="text-sm w-5">{mood.emoji}</span>
                      <span className="text-xs text-veil-muted w-16 shrink-0">
                        {mood.label}
                      </span>
                      <div className="flex-1 bg-background rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: mood.color,
                          }}
                        />
                      </div>
                      <span className="text-xs text-veil-muted w-5 text-right">
                        {String(count)}
                      </span>
                    </div>
                  );
                })}
            </div>
          </section>
        )}

        {moodFreq.length === 0 && (
          <div
            data-ocid="profile.empty_state"
            className="bg-white rounded-3xl p-8 shadow-soft text-center"
          >
            <Flame className="mx-auto mb-2 text-veil-lavender" size={32} />
            <p className="text-sm text-veil-muted">
              Start journaling to see your mood history here.
            </p>
          </div>
        )}

        {/* Apologies */}
        <section className="bg-white rounded-3xl shadow-soft overflow-hidden">
          <div className="px-5 pt-5 pb-3 border-b border-gray-50">
            <h2 className="font-serif text-sm font-semibold text-veil-text">
              🕊 Apologies
            </h2>
          </div>
          {/* Sent */}
          {(sentApologies ?? []).filter(
            (a) => a.status !== "UNSENT" && a.status !== "DRAFT",
          ).length > 0 && (
            <div className="px-5 py-3 border-b border-gray-50">
              <p className="text-xs font-semibold text-veil-muted uppercase tracking-wide mb-2">
                Sent
              </p>
              {(sentApologies ?? [])
                .filter((a) => a.status !== "UNSENT" && a.status !== "DRAFT")
                .map((a, i) => (
                  <button
                    data-ocid={`profile.sent_apology.item.${i + 1}`}
                    key={a.id}
                    type="button"
                    onClick={() =>
                      setExpandedApologyId(
                        expandedApologyId === a.id ? null : a.id,
                      )
                    }
                    className="w-full text-left py-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-veil-text font-serif italic">
                        {a.signature}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          a.status === "ACKNOWLEDGED"
                            ? "bg-green-50 text-green-600"
                            : a.status === "OPENED"
                              ? "bg-blue-50 text-blue-600"
                              : "bg-purple-50 text-veil-purple"
                        }`}
                      >
                        {a.status === "ACKNOWLEDGED"
                          ? "Received"
                          : a.status === "OPENED"
                            ? "Opened"
                            : "Delivered"}
                      </span>
                    </div>
                    {expandedApologyId === a.id && (
                      <p className="text-xs text-veil-muted mt-2 leading-relaxed">
                        {a.content}
                      </p>
                    )}
                  </button>
                ))}
            </div>
          )}
          {/* Received */}
          {(receivedApologies ?? []).length > 0 && (
            <div className="px-5 py-3 border-b border-gray-50">
              <p className="text-xs font-semibold text-veil-muted uppercase tracking-wide mb-2">
                Received
              </p>
              {(receivedApologies ?? []).map((a, i) => (
                <button
                  data-ocid={`profile.received_apology.item.${i + 1}`}
                  key={a.id}
                  type="button"
                  onClick={() => setSelectedApology(a)}
                  className="w-full text-left py-2 flex items-center justify-between"
                >
                  <span className="text-sm text-veil-text">
                    Someone apologized to you
                  </span>
                  <span className="text-xs text-veil-muted">
                    {new Date(
                      Number(a.createdAt) / 1_000_000,
                    ).toLocaleDateString()}
                  </span>
                </button>
              ))}
            </div>
          )}
          {/* Unsent */}
          {(unsentApologies ?? []).length > 0 && (
            <div className="px-5 py-3">
              <p className="text-xs font-semibold text-veil-muted uppercase tracking-wide mb-2">
                Private Reflections
              </p>
              {(unsentApologies ?? []).map((a, i) => (
                <div
                  data-ocid={`profile.unsent_apology.item.${i + 1}`}
                  key={a.id}
                  className="flex items-center justify-between py-2"
                >
                  <span className="text-sm text-veil-text font-serif italic">
                    {a.signature || "Unsent apology"}
                  </span>
                  <span className="text-xs text-veil-muted">
                    {new Date(
                      Number(a.createdAt) / 1_000_000,
                    ).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
          {(sentApologies ?? []).length === 0 &&
            (receivedApologies ?? []).length === 0 &&
            (unsentApologies ?? []).length === 0 && (
              <div
                data-ocid="profile.apologies.empty_state"
                className="px-5 py-8 text-center"
              >
                <p className="text-sm text-veil-muted">
                  Your apology history will appear here.
                </p>
              </div>
            )}
        </section>

        {selectedApology && (
          <ReceiverApologyView
            apology={selectedApology}
            onClose={() => setSelectedApology(null)}
          />
        )}

        <section className="mx-5 mb-5">
          <h2 className="font-serif text-base font-semibold text-veil-text mb-3 px-1">
            💌 Letters
          </h2>
          <div className="bg-white rounded-3xl p-5 shadow-soft mb-3">
            <h3 className="text-sm font-semibold text-veil-text mb-3">
              Letters Sent
            </h3>
            <div className="space-y-2">
              {[
                {
                  icon: "💌",
                  to: "Alex",
                  date: "Delivered",
                  status: "They felt it",
                },
                {
                  icon: "🌸",
                  to: "Mum",
                  date: "Arriving Jun",
                  status: "Scheduled",
                },
              ].map((item) => (
                <div
                  key={item.to ?? item.icon}
                  className="flex items-center gap-3 py-2 border-b border-veil-purple/10 last:border-0"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-veil-text">
                      To {item.to}
                    </p>
                    <p className="text-xs text-veil-muted">{item.date}</p>
                  </div>
                  <span className="text-xs text-veil-purple font-medium bg-veil-purple/10 px-2.5 py-1 rounded-full">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-3xl p-5 shadow-soft mb-3">
            <h3 className="text-sm font-semibold text-veil-text mb-2">
              Letters Received
            </h3>
            <div className="flex items-center gap-3 py-2">
              <span className="text-2xl">🤝</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-veil-text">
                  Someone wrote you something
                </p>
                <p className="text-xs text-veil-muted">Received today</p>
              </div>
              <span className="text-xs text-veil-purple font-medium bg-veil-purple/10 px-2.5 py-1 rounded-full">
                Unread
              </span>
            </div>
          </div>
          <div className="bg-white rounded-3xl p-5 shadow-soft">
            <h3 className="text-sm font-semibold text-veil-text mb-1">
              Letters I Never Sent
            </h3>
            <p className="text-xs text-veil-muted mb-3">
              Not failures — a complete act of emotional expression.
            </p>
            <div className="flex items-center gap-3 py-2">
              <span className="text-2xl">🪞</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-veil-text">To myself</p>
                <p className="text-xs text-veil-muted">Written 3 days ago</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="text-xs text-veil-purple bg-veil-purple/10 px-2.5 py-1 rounded-full"
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="text-xs text-veil-muted bg-veil-bg px-2.5 py-1 rounded-full"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Veil Voice Settings */}
        <VoiceSettingsPanel />
      </div>
    </div>
  );
}

// ─── Bottom Nav ───────────────────────────────────────────────────────────────

const NAV_ITEMS: { key: Tab; icon: React.ReactNode; label: string }[] = [
  { key: "home", icon: <Home size={20} />, label: "Home" },
  { key: "write", icon: <PenLine size={20} />, label: "Write" },
  { key: "journal", icon: <BookOpen size={20} />, label: "Journal" },
  { key: "reflections", icon: <Sparkles size={20} />, label: "Reflect" },
  { key: "profile", icon: <User size={20} />, label: "Profile" },
];

function BottomNav({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
}) {
  return (
    <nav
      data-ocid="nav.panel"
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-border/60 px-2 pb-safe"
      style={{ boxShadow: "0 -4px 20px rgba(107,91,142,0.08)" }}
    >
      <div className="flex items-stretch">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              data-ocid={`nav.${item.key}.tab`}
              type="button"
              onClick={() => onChange(item.key)}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all duration-200"
            >
              <span
                className="transition-all duration-200"
                style={{ color: isActive ? "#6B5B8E" : "#8B8097" }}
              >
                {item.icon}
              </span>
              <span
                className="text-[10px] font-medium transition-all duration-200"
                style={{ color: isActive ? "#6B5B8E" : "#8B8097" }}
              >
                {item.label}
              </span>
              {isActive && (
                <span
                  className="absolute bottom-1 w-4 h-0.5 rounded-full"
                  style={{ backgroundColor: "#6B5B8E" }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [quietMoment, setQuietMoment] = useState<{
    emotion_type: string;
    emotion_label: string;
    emotion_emoji: string;
    visibility: "ONLY_ME" | "INNER_CIRCLE" | "FRIENDS" | "GLOBAL";
  } | null>(null);
  const reduceMotion =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  const handlePostSuccess = (data: {
    emotion_type: string;
    emotion_label: string;
    emotion_emoji: string;
    visibility: string;
    source: "emotion_checkin";
    crisis_signal_detected: boolean;
  }) => {
    setActiveTab("home");
    if (data.crisis_signal_detected) {
      return;
    }
    const visMap: Record<
      string,
      "ONLY_ME" | "INNER_CIRCLE" | "FRIENDS" | "GLOBAL"
    > = {
      only_me: "ONLY_ME",
      inner_circle: "INNER_CIRCLE",
      friends: "FRIENDS",
      global_anonymous: "GLOBAL",
      global: "GLOBAL",
    };
    setQuietMoment({
      emotion_type: data.emotion_type,
      emotion_label: data.emotion_label,
      emotion_emoji: data.emotion_emoji,
      visibility: visMap[data.visibility.toLowerCase()] ?? "ONLY_ME",
    });
  };
  const { actor, isFetching } = useActor();

  const { data: profile } = useQuery<UserProfile | null>({
    queryKey: ["profile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: entries } = useQuery<JournalEntry[]>({
    queryKey: ["entries"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllJournalEntries();
    },
    enabled: !!actor && !isFetching,
  });

  return (
    <VeilVoiceProvider>
      <div
        className="min-h-screen bg-background"
        style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
      >
        {/* Mobile shell */}
        <div className="max-w-[430px] mx-auto min-h-screen relative overflow-x-hidden">
          {/* Scrollable content area */}
          <main className="overflow-y-auto" style={{ paddingBottom: "5rem" }}>
            {activeTab === "home" && (
              <HomeTab
                onNavigate={setActiveTab}
                profile={profile}
                entries={entries}
                onPostSuccess={handlePostSuccess}
              />
            )}
            {activeTab === "write" && (
              <WriteTab onSaved={() => setActiveTab("journal")} />
            )}
            {activeTab === "journal" && <JournalTab />}
            {activeTab === "reflections" && <ReflectionsTab />}
            {activeTab === "profile" && <ProfileTab />}
          </main>

          <BottomNav active={activeTab} onChange={setActiveTab} />
          {quietMoment && (
            <QuietMomentScreen
              emotion_type={quietMoment.emotion_type}
              emotion_label={quietMoment.emotion_label}
              emotion_emoji={quietMoment.emotion_emoji}
              visibility={quietMoment.visibility}
              onDismiss={() => setQuietMoment(null)}
              reduceMotion={reduceMotion}
            />
          )}
        </div>

        <Toaster position="top-center" richColors />

        {/* Footer */}
        <footer className="hidden">
          <p>
            © {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              caffeine.ai
            </a>
          </p>
        </footer>
      </div>
      {/* Veil Voice System — global audio layer */}
      <VeilVoiceOverlay />
      <VoiceOnboarding />
    </VeilVoiceProvider>
  );
}
