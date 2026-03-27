/**
 * QuickReleaseSettings.tsx
 *
 * Settings → Quick Release section.
 * iOS: Siri Shortcut + Home Screen Widget + Lock Screen Widget
 * Android: Google Assistant + Quick Settings Tile + Home Screen Widget
 */

import { Check, ChevronRight, Layers, Mic, Smartphone } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";

// ── Widget Preview ────────────────────────────────────────────────────────────

type WidgetState = "default" | "checked_in" | "resting";

function WidgetPreview({
  state,
  size = "home",
}: { state: WidgetState; size?: "home" | "lock" }) {
  const config = {
    default: { icon: "🫧", label: "Put it down" },
    checked_in: { icon: "🌿", label: "You showed up" },
    resting: { icon: "🌿", label: "Veil has it" },
  }[state];

  if (size === "lock") {
    return (
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{
          background: "rgba(255,255,255,0.15)",
          backdropFilter: "blur(10px)",
        }}
      >
        <span className="text-sm">{config.icon}</span>
        <span className="text-white text-xs font-medium">{config.label}</span>
      </div>
    );
  }

  return (
    <div
      className="w-24 h-24 rounded-2xl flex flex-col items-center justify-center gap-2"
      style={{
        background: "linear-gradient(135deg, #1A1230 0%, #2a1f4a 100%)",
        border: "1px solid rgba(107,79,187,0.3)",
      }}
    >
      <span className="text-2xl">{config.icon}</span>
      <span className="text-xs font-medium" style={{ color: "#C8C0F0" }}>
        {config.label}
      </span>
    </div>
  );
}

// ── Step Guide ────────────────────────────────────────────────────────────────

function SetupGuide({
  steps,
  onDone,
}: { steps: string[]; onDone: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const done = currentStep >= steps.length;

  return (
    <div className="mt-4 space-y-4">
      {steps.map((step, i) => (
        <motion.div
          key={step.slice(0, 20)}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: i <= currentStep ? 1 : 0.3, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex items-start gap-3"
        >
          <button
            type="button"
            onClick={() => i === currentStep && setCurrentStep(i + 1)}
            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
            style={{
              background:
                i < currentStep
                  ? "#6B4FBB"
                  : i === currentStep
                    ? "rgba(107,79,187,0.3)"
                    : "rgba(255,255,255,0.05)",
              border:
                i === currentStep ? "1px solid rgba(107,79,187,0.6)" : "none",
            }}
            aria-label={
              i < currentStep ? `Step ${i + 1} done` : `Complete step ${i + 1}`
            }
          >
            {i < currentStep ? (
              <Check size={12} className="text-white" />
            ) : (
              <span className="text-white/50 text-xs">{i + 1}</span>
            )}
          </button>
          <p
            className="text-sm"
            style={{
              color: i <= currentStep ? "#e8e0f8" : "rgba(255,255,255,0.3)",
            }}
          >
            {step}
          </p>
        </motion.div>
      ))}

      {done && (
        <motion.button
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          type="button"
          onClick={onDone}
          className="w-full py-3 rounded-2xl text-white font-medium text-sm mt-2"
          style={{
            background: "linear-gradient(135deg, #6B4FBB 0%, #3d2a7a 100%)",
          }}
        >
          Done
        </motion.button>
      )}
    </div>
  );
}

// ── iOS Section ───────────────────────────────────────────────────────────────

function IOSQuickRelease() {
  const { actor } = useActor();
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [siriPhrase, setSiriPhrase] = useState("I need to vent");
  const [editingPhrase, setEditingPhrase] = useState(false);
  const [tempPhrase, setTempPhrase] = useState("");
  const [siriSetup, setSiriSetup] = useState(false);
  const [widgetState, setWidgetState] = useState<WidgetState>("default");

  const SIRI_SUGGESTIONS = [
    "I need to vent",
    "I need Veil",
    "Put it down",
    "I'm carrying something",
    "I need a moment",
  ];

  async function saveSiriPhrase() {
    const phrase = tempPhrase.trim() || siriPhrase;
    setSiriPhrase(phrase);
    setEditingPhrase(false);
    setSiriSetup(true);
    if (actor) {
      try {
        await actor.saveQuickReleaseConfig("IOS", phrase, true);
        toast.success("Siri phrase saved");
      } catch {
        toast.error("Could not save phrase");
      }
    }
  }

  return (
    <div className="space-y-3">
      {/* Siri Shortcut Card */}
      <div className="bg-white rounded-3xl p-5 shadow-soft">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #1a1230, #2a1f4a)",
              }}
            >
              <Mic size={18} className="text-purple-300" />
            </div>
            <div>
              <h3 className="font-serif text-sm font-semibold text-veil-text">
                Siri Shortcut
              </h3>
              <p className="text-xs text-veil-muted mt-0.5">
                {siriSetup ? (
                  <span className="text-green-600">
                    ✓ Active — "Hey Siri, {siriPhrase}"
                  </span>
                ) : (
                  "Say it — Veil opens instantly"
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              setExpandedCard(expandedCard === "siri" ? null : "siri")
            }
            className="text-veil-muted"
            aria-label="Expand Siri settings"
          >
            <ChevronRight
              size={18}
              className="transition-transform duration-200"
              style={{
                transform: expandedCard === "siri" ? "rotate(90deg)" : "none",
              }}
            />
          </button>
        </div>

        <AnimatePresence>
          {expandedCard === "siri" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 space-y-4">
                {/* Phrase */}
                <div>
                  <p className="text-xs text-veil-muted mb-2">
                    Your activation phrase:
                  </p>
                  {editingPhrase ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={tempPhrase}
                          onChange={(e) => setTempPhrase(e.target.value)}
                          placeholder={siriPhrase}
                          className="flex-1 bg-background rounded-xl px-3 py-2 text-sm text-veil-text outline-none"
                        />
                        <button
                          type="button"
                          onClick={saveSiriPhrase}
                          className="px-3 py-2 rounded-xl text-xs font-medium text-white"
                          style={{ background: "#6B4FBB" }}
                        >
                          Save
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {SIRI_SUGGESTIONS.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              setTempPhrase(s);
                            }}
                            className="px-3 py-1.5 rounded-xl text-xs text-veil-muted bg-background hover:bg-veil-purple/10 transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-background rounded-xl px-3 py-2">
                        <span className="text-sm text-veil-text">
                          "Hey Siri, {siriPhrase}"
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPhrase(true);
                          setTempPhrase(siriPhrase);
                        }}
                        className="px-3 py-2 rounded-xl text-xs text-veil-purple bg-veil-purple/10"
                      >
                        Change
                      </button>
                    </div>
                  )}
                </div>

                {/* Setup steps */}
                {!siriSetup && (
                  <div>
                    <p className="text-xs font-medium text-veil-text mb-1">
                      Set up in Shortcuts app:
                    </p>
                    <SetupGuide
                      steps={[
                        "Open the Shortcuts app on your iPhone",
                        "Tap the + button — create a new shortcut",
                        "Search for 'Veil' and select 'Open Veil to release'",
                        "Tap 'Add to Siri' and speak your phrase",
                        "Done — say it anywhere, anytime",
                      ]}
                      onDone={async () => {
                        setSiriSetup(true);
                        if (actor) {
                          await actor
                            .saveQuickReleaseConfig("IOS", siriPhrase, true)
                            .catch(() => {});
                        }
                        toast.success("Siri shortcut set up!");
                      }}
                    />
                  </div>
                )}

                {siriSetup && (
                  <div
                    className="flex items-center gap-2 p-3 rounded-2xl"
                    style={{ background: "rgba(107,79,187,0.08)" }}
                  >
                    <Check size={14} className="text-veil-purple" />
                    <p className="text-xs text-veil-purple">
                      Active. Say "Hey Siri, {siriPhrase}" from anywhere.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Home Screen Widget Card */}
      <div className="bg-white rounded-3xl p-5 shadow-soft">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #1a1230, #2a1f4a)",
              }}
            >
              <Smartphone size={18} className="text-purple-300" />
            </div>
            <div>
              <h3 className="font-serif text-sm font-semibold text-veil-text">
                Home Screen Widget
              </h3>
              <p className="text-xs text-veil-muted mt-0.5">
                One tap from home screen
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              setExpandedCard(
                expandedCard === "home_widget" ? null : "home_widget",
              )
            }
            className="text-veil-muted"
          >
            <ChevronRight
              size={18}
              className="transition-transform duration-200"
              style={{
                transform:
                  expandedCard === "home_widget" ? "rotate(90deg)" : "none",
              }}
            />
          </button>
        </div>

        <AnimatePresence>
          {expandedCard === "home_widget" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 space-y-4">
                {/* Widget previews */}
                <div>
                  <p className="text-xs text-veil-muted mb-3">
                    Widget states (preview):
                  </p>
                  <div className="flex gap-3">
                    {(
                      ["default", "checked_in", "resting"] as WidgetState[]
                    ).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setWidgetState(s)}
                        className="flex flex-col items-center gap-1"
                      >
                        <div
                          style={{
                            outline:
                              widgetState === s ? "2px solid #6B4FBB" : "none",
                            borderRadius: "16px",
                            padding: "2px",
                          }}
                        >
                          <WidgetPreview state={s} />
                        </div>
                        <span className="text-xs text-veil-muted capitalize">
                          {s.replace("_", " ")}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <SetupGuide
                  steps={[
                    "Long press on your home screen until it wiggles",
                    "Tap the \u201c+\u201d button in the top corner",
                    "Search \u201cVeil\u201d in the widget list",
                    "Select the small widget and tap Add",
                    "Place it where you'll see it instantly",
                  ]}
                  onDone={() => toast.success("Widget added to home screen!")}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Lock Screen Widget Card */}
      <div className="bg-white rounded-3xl p-5 shadow-soft">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #1a1230, #2a1f4a)",
              }}
            >
              <Layers size={18} className="text-purple-300" />
            </div>
            <div>
              <h3 className="font-serif text-sm font-semibold text-veil-text">
                Lock Screen Widget
              </h3>
              <p className="text-xs text-veil-muted mt-0.5">
                One tap even from locked phone • iOS 16+
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              setExpandedCard(
                expandedCard === "lock_widget" ? null : "lock_widget",
              )
            }
            className="text-veil-muted"
          >
            <ChevronRight
              size={18}
              className="transition-transform duration-200"
              style={{
                transform:
                  expandedCard === "lock_widget" ? "rotate(90deg)" : "none",
              }}
            />
          </button>
        </div>

        <AnimatePresence>
          {expandedCard === "lock_widget" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 space-y-4">
                {/* Lock widget preview */}
                <div
                  className="rounded-2xl p-4 flex flex-col items-center gap-3"
                  style={{
                    background:
                      "linear-gradient(180deg, #1a2a3a 0%, #0d1520 100%)",
                  }}
                >
                  <div className="text-white/60 text-xs font-light tracking-widest">
                    9:41
                  </div>
                  <div className="text-white/90 text-2xl font-thin">
                    Tuesday
                  </div>
                  <WidgetPreview state="default" size="lock" />
                </div>
                <p className="text-xs text-veil-muted">
                  The widget shows only "🫧 Put it down" — nothing personal,
                  nothing visible to others.
                </p>

                <SetupGuide
                  steps={[
                    "Long press on your lock screen to enter edit mode",
                    "Tap \u201cCustomize\u201d below the clock",
                    "Select the widget area below the clock",
                    "Find Veil in the list and add the rectangular widget",
                    "Done — Veil is always one tap away",
                  ]}
                  onDone={() => toast.success("Lock screen widget added!")}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Android Section ───────────────────────────────────────────────────────────

function AndroidQuickRelease() {
  const { actor } = useActor();
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [assistantPhrase, setAssistantPhrase] = useState("I need to vent");
  const [editingPhrase, setEditingPhrase] = useState(false);
  const [tempPhrase, setTempPhrase] = useState("");
  const [assistantSetup, setAssistantSetup] = useState(false);

  const SUGGESTIONS = [
    "I need to vent",
    "I need Veil",
    "Put it down",
    "I'm carrying something",
    "I need a moment",
  ];

  async function saveAssistantPhrase() {
    const phrase = tempPhrase.trim() || assistantPhrase;
    setAssistantPhrase(phrase);
    setEditingPhrase(false);
    setAssistantSetup(true);
    if (actor) {
      try {
        await actor.saveQuickReleaseConfig("ANDROID", phrase, true);
        toast.success("Assistant phrase saved");
      } catch {
        toast.error("Could not save phrase");
      }
    }
  }

  return (
    <div className="space-y-3">
      {/* Google Assistant Card */}
      <div className="bg-white rounded-3xl p-5 shadow-soft">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #1a1230, #2a1f4a)",
              }}
            >
              <Mic size={18} className="text-purple-300" />
            </div>
            <div>
              <h3 className="font-serif text-sm font-semibold text-veil-text">
                Google Assistant
              </h3>
              <p className="text-xs text-veil-muted mt-0.5">
                {assistantSetup ? (
                  <span className="text-green-600">
                    ✓ Active — "Hey Google, {assistantPhrase}"
                  </span>
                ) : (
                  "Voice activation from anywhere"
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              setExpandedCard(expandedCard === "assistant" ? null : "assistant")
            }
            className="text-veil-muted"
          >
            <ChevronRight
              size={18}
              className="transition-transform duration-200"
              style={{
                transform:
                  expandedCard === "assistant" ? "rotate(90deg)" : "none",
              }}
            />
          </button>
        </div>

        <AnimatePresence>
          {expandedCard === "assistant" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 space-y-4">
                <div>
                  <p className="text-xs text-veil-muted mb-2">
                    Your activation phrase:
                  </p>
                  {editingPhrase ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={tempPhrase}
                          onChange={(e) => setTempPhrase(e.target.value)}
                          placeholder={assistantPhrase}
                          className="flex-1 bg-background rounded-xl px-3 py-2 text-sm text-veil-text outline-none"
                        />
                        <button
                          type="button"
                          onClick={saveAssistantPhrase}
                          className="px-3 py-2 rounded-xl text-xs font-medium text-white"
                          style={{ background: "#6B4FBB" }}
                        >
                          Save
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {SUGGESTIONS.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setTempPhrase(s)}
                            className="px-3 py-1.5 rounded-xl text-xs text-veil-muted bg-background"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-background rounded-xl px-3 py-2">
                        <span className="text-sm text-veil-text">
                          "Hey Google, {assistantPhrase}"
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPhrase(true);
                          setTempPhrase(assistantPhrase);
                        }}
                        className="px-3 py-2 rounded-xl text-xs text-veil-purple bg-veil-purple/10"
                      >
                        Change
                      </button>
                    </div>
                  )}
                </div>

                {!assistantSetup && (
                  <SetupGuide
                    steps={[
                      'Say "Hey Google" and then "Shortcuts"\'',
                      "Tap 'Add shortcut' in Google Assistant",
                      "Type your phrase — e.g. 'I need to vent'",
                      "Choose Veil as the app to open",
                      "Done — works from lock screen with Voice Match",
                    ]}
                    onDone={async () => {
                      setAssistantSetup(true);
                      if (actor) {
                        await actor
                          .saveQuickReleaseConfig(
                            "ANDROID",
                            assistantPhrase,
                            true,
                          )
                          .catch(() => {});
                      }
                      toast.success("Google Assistant shortcut set up!");
                    }}
                  />
                )}

                {assistantSetup && (
                  <div
                    className="flex items-center gap-2 p-3 rounded-2xl"
                    style={{ background: "rgba(107,79,187,0.08)" }}
                  >
                    <Check size={14} className="text-veil-purple" />
                    <p className="text-xs text-veil-purple">
                      Active. Say "Hey Google, {assistantPhrase}" from anywhere.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Settings Tile Card */}
      <div className="bg-white rounded-3xl p-5 shadow-soft">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #1a1230, #2a1f4a)",
              }}
            >
              <Layers size={18} className="text-purple-300" />
            </div>
            <div>
              <h3 className="font-serif text-sm font-semibold text-veil-text">
                Quick Settings Tile
              </h3>
              <p className="text-xs text-veil-muted mt-0.5">
                One tap from any screen, any app • Android exclusive
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              setExpandedCard(
                expandedCard === "quick_tile" ? null : "quick_tile",
              )
            }
            className="text-veil-muted"
          >
            <ChevronRight
              size={18}
              className="transition-transform duration-200"
              style={{
                transform:
                  expandedCard === "quick_tile" ? "rotate(90deg)" : "none",
              }}
            />
          </button>
        </div>

        <AnimatePresence>
          {expandedCard === "quick_tile" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 space-y-4">
                {/* Tile preview */}
                <div
                  className="rounded-2xl p-4"
                  style={{
                    background:
                      "linear-gradient(180deg, #1a2030 0%, #0d1520 100%)",
                  }}
                >
                  <p className="text-white/40 text-xs mb-3">Quick Settings</p>
                  <div className="grid grid-cols-3 gap-2">
                    {["Wi-Fi", "Bluetooth", "Do Not Disturb"].map((label) => (
                      <div
                        key={label}
                        className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1"
                        style={{ background: "rgba(255,255,255,0.1)" }}
                      >
                        <span className="text-white/50 text-xs">{label}</span>
                      </div>
                    ))}
                    <div
                      className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1"
                      style={{
                        background: "rgba(107,79,187,0.5)",
                        border: "1px solid rgba(107,79,187,0.8)",
                      }}
                    >
                      <span className="text-lg">🫧</span>
                      <span className="text-white text-xs font-medium">
                        Veil
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-veil-muted">
                  Pull down from any screen — mid-email, mid-meeting,
                  mid-anything. Tap Veil. Done.
                </p>

                <SetupGuide
                  steps={[
                    "Swipe down from the top of your screen twice",
                    "Tap the pencil/edit icon to customize tiles",
                    "Find Veil in the available tiles list",
                    "Drag Veil into your active tiles area",
                    "Done — one pull-down away from anywhere",
                  ]}
                  onDone={() => toast.success("Quick Settings tile added!")}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Android Home Widget */}
      <div className="bg-white rounded-3xl p-5 shadow-soft">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #1a1230, #2a1f4a)",
              }}
            >
              <Smartphone size={18} className="text-purple-300" />
            </div>
            <div>
              <h3 className="font-serif text-sm font-semibold text-veil-text">
                Home Screen Widget
              </h3>
              <p className="text-xs text-veil-muted mt-0.5">
                One tap from home screen
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              setExpandedCard(
                expandedCard === "android_widget" ? null : "android_widget",
              )
            }
            className="text-veil-muted"
          >
            <ChevronRight
              size={18}
              className="transition-transform duration-200"
              style={{
                transform:
                  expandedCard === "android_widget" ? "rotate(90deg)" : "none",
              }}
            />
          </button>
        </div>

        <AnimatePresence>
          {expandedCard === "android_widget" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 space-y-4">
                <div className="flex gap-3">
                  {(["default", "checked_in", "resting"] as WidgetState[]).map(
                    (s) => (
                      <div key={s} className="flex flex-col items-center gap-1">
                        <WidgetPreview state={s} />
                        <span className="text-xs text-veil-muted capitalize">
                          {s.replace("_", " ")}
                        </span>
                      </div>
                    ),
                  )}
                </div>

                <SetupGuide
                  steps={[
                    "Long press on an empty space on your home screen",
                    "Tap \u201cWidgets\u201d in the menu that appears",
                    "Search for \u201cVeil\u201d in the widget list",
                    "Long press the Veil widget and drag to home screen",
                    "Place it where you'll see it first",
                  ]}
                  onDone={() => toast.success("Widget added to home screen!")}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────

export function QuickReleaseSettings() {
  const [platform, setPlatform] = useState<"ios" | "android">("ios");

  return (
    <section className="space-y-4">
      <div className="px-1">
        <h2 className="font-serif text-base font-semibold text-veil-text">
          Quick Release
        </h2>
        <p className="text-xs text-veil-muted mt-0.5">
          The faster you can reach Veil — the lighter you go home.
        </p>
      </div>

      {/* Platform toggle */}
      <div className="flex gap-2">
        {(["ios", "android"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPlatform(p)}
            className="flex-1 py-2.5 rounded-2xl text-sm font-medium transition-all"
            style={{
              background:
                platform === p
                  ? "linear-gradient(135deg, #6B4FBB 0%, #3d2a7a 100%)"
                  : "#f5f3fa",
              color: platform === p ? "white" : "#6B5B8E",
            }}
          >
            {p === "ios" ? "\uD83D\uDCF1 iPhone" : "\uD83E\uDD16 Android"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={platform}
          initial={{ opacity: 0, x: platform === "ios" ? -10 : 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
        >
          {platform === "ios" ? <IOSQuickRelease /> : <AndroidQuickRelease />}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
