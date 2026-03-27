/**
 * QuickReleaseOnboarding.tsx
 *
 * 3-step onboarding shown after first successful Companion Card dump.
 * Step 1: Voice assistant (Siri / Google)
 * Step 2: Home screen widget
 * Step 3: Lock screen widget (iOS) / Quick Settings tile (Android)
 *
 * Each step optional. Each with clear skip.
 * Never all three at once.
 */

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

type Platform = "ios" | "android" | "unknown";
type OnboardingStep = 1 | 2 | 3;

function detectPlatform(): Platform {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "unknown";
}

const ONBOARDING_DONE_KEY = "veil_qr_onboarding_done";
const ONBOARDING_SHOWN_KEY = "veil_qr_onboarding_shown";

export function shouldShowQROnboarding(): boolean {
  const done = localStorage.getItem(ONBOARDING_DONE_KEY);
  if (done) return false;
  const shown = localStorage.getItem(ONBOARDING_SHOWN_KEY);
  if (shown) {
    const shownAt = Number.parseInt(shown, 10);
    const daysSince = (Date.now() - shownAt) / (1000 * 60 * 60 * 24);
    // Show again on day 3 if not yet done
    if (daysSince < 3) return false;
    if (daysSince >= 3) {
      localStorage.setItem(ONBOARDING_DONE_KEY, "1"); // give up after day 3
      return false;
    }
  }
  return true;
}

export function markQROnboardingShown() {
  localStorage.setItem(ONBOARDING_SHOWN_KEY, String(Date.now()));
}

export function markQROnboardingDone() {
  localStorage.setItem(ONBOARDING_DONE_KEY, "1");
}

interface QROnboardingProps {
  onClose: () => void;
}

export function QuickReleaseOnboarding({ onClose }: QROnboardingProps) {
  const [step, setStep] = useState<OnboardingStep>(1);
  const [platform] = useState<Platform>(() => detectPlatform());

  useEffect(() => {
    markQROnboardingShown();
  }, []);

  function nextStep() {
    if (step < 3) {
      setStep((step + 1) as OnboardingStep);
    } else {
      markQROnboardingDone();
      onClose();
    }
  }

  function dismiss() {
    markQROnboardingDone();
    onClose();
  }

  const isIOS = platform === "ios";

  const steps = [
    {
      // Step 1: Voice
      icon: "🧠",
      title: isIOS ? "That felt good, right?" : "That felt good, right?",
      body: isIOS
        ? "Next time stress hits \u2014 you won\u2019t even need to find the app.\n\nJust say:\n\u201cHey Siri, I need to vent\u201d\n\nVeil opens instantly."
        : "Next time stress hits \u2014 you won\u2019t even need to find the app.\n\nJust say:\n\u201cHey Google, I need to vent\u201d\n\nVeil opens instantly.",
      actionLabel: isIOS
        ? "Set up Siri shortcut \u2014 takes 10 seconds"
        : "Set up Google Assistant shortcut",
      skipLabel: "Maybe later",
    },
    {
      // Step 2: Home Widget
      icon: "📱",
      title: "One more thing.",
      body: "Add Veil to your home screen \u2014\none tap whenever you need it.\n\nThis takes 20 seconds.\nIt could save you minutes of friction when you need Veil most.",
      actionLabel: "Show me how",
      skipLabel: "Skip",
    },
    {
      // Step 3: Lock Screen / Quick Tile
      icon: isIOS ? "🔒" : "⚡",
      title: isIOS
        ? "For the moments you cannot wait."
        : "One more \u2014 Android-only.",
      body: isIOS
        ? "Add Veil to your lock screen.\nOne tap even from a locked phone.\nFace ID authenticates instantly.\n\nAvailable on iOS 16+."
        : "Add Veil to your Quick Settings panel.\n\nPull down from any screen \u2014 even while in another app \u2014 and Veil is one tap away.",
      actionLabel: "Show me how",
      skipLabel: "Skip",
    },
  ];

  const currentStep = steps[step - 1];

  const setupInstructions: Record<
    OnboardingStep,
    Record<Platform, string[]>
  > = {
    1: {
      ios: [
        "Open the Shortcuts app on your iPhone",
        "Tap + and create a new shortcut",
        "Search Veil — select \u2018Open Veil to release\u2019",
        "Tap \u2018Add to Siri\u2019 and speak your phrase",
        "Done — say it anywhere, anytime",
      ],
      android: [
        "Say \u201cHey Google, shortcuts\u201d to open Google Assistant",
        "Tap \u2018Add shortcut\u2019",
        "Type your phrase \u2014 e.g. \u2018I need to vent\u2019",
        "Choose Veil as the app to open",
        "Done — works from lock screen with Voice Match",
      ],
      unknown: [
        "Go to your device voice assistant settings",
        "Add a custom shortcut for Veil",
        "Use your chosen phrase to open Veil",
      ],
    },
    2: {
      ios: [
        "Long press on your home screen until it wiggles",
        "Tap the + button in the corner",
        "Search Veil in the widget list",
        "Select the small widget and tap Add",
        "Place it where you'll see it first",
      ],
      android: [
        "Long press on an empty space on home screen",
        "Tap Widgets in the menu",
        "Search for Veil",
        "Drag the widget to your home screen",
        "Place it where you'll see it first",
      ],
      unknown: [
        "Long press on your home screen",
        "Look for a widget or shortcut option",
        "Add the Veil widget",
      ],
    },
    3: {
      ios: [
        "Long press on your lock screen",
        "Tap Customize below the clock",
        "Select the widget area below the clock",
        "Find Veil and add the rectangular widget",
        "Done — always one tap from anywhere",
      ],
      android: [
        "Swipe down from the top twice to open Quick Settings",
        "Tap the pencil/edit icon",
        "Find Veil in the available tiles",
        "Drag Veil to your active tiles",
        "Done — one pull-down from any app",
      ],
      unknown: [
        "Access your notification panel",
        "Edit quick toggles",
        "Add Veil to quick access",
      ],
    },
  };

  const [showInstructions, setShowInstructions] = useState(false);
  const [instructionStep, setInstructionStep] = useState(0);
  const instructions =
    setupInstructions[step][platform] ?? setupInstructions[step].unknown;

  function handleAction() {
    setShowInstructions(true);
    setInstructionStep(0);
  }

  function handleInstructionTap(i: number) {
    if (i === instructionStep) {
      setInstructionStep(i + 1);
    }
  }

  const allInstructionsDone = instructionStep >= instructions.length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-end"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="w-full max-w-md rounded-t-3xl p-8 pb-safe"
        style={{
          background: "linear-gradient(160deg, #0d0a1a 0%, #1a1230 100%)",
          paddingBottom: "max(2rem, env(safe-area-inset-bottom, 2rem))",
        }}
      >
        {/* Close */}
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-white/60"
          aria-label="Dismiss onboarding"
        >
          <X size={16} />
        </button>

        {/* Step indicator */}
        <div className="flex gap-1.5 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className="h-1 rounded-full transition-all duration-300"
              style={{
                flex: s === step ? 2 : 1,
                background:
                  s <= step ? "rgba(107,79,187,0.8)" : "rgba(255,255,255,0.1)",
              }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${step}-${showInstructions}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {!showInstructions ? (
              // Step intro screen
              <div className="space-y-5">
                <div className="text-4xl">{currentStep.icon}</div>
                <div>
                  <h2 className="font-serif text-xl font-semibold text-white/90 mb-3">
                    {currentStep.title}
                  </h2>
                  <p className="text-white/60 text-sm leading-relaxed whitespace-pre-line">
                    {currentStep.body}
                  </p>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleAction}
                    className="w-full py-4 rounded-2xl text-white font-medium text-sm"
                    style={{
                      background:
                        "linear-gradient(135deg, #6B4FBB 0%, #3d2a7a 100%)",
                    }}
                  >
                    {currentStep.actionLabel}
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="w-full py-3 text-white/40 text-sm"
                  >
                    {currentStep.skipLabel}
                  </button>
                </div>
              </div>
            ) : (
              // Instructions screen
              <div className="space-y-5">
                <h3 className="font-serif text-base font-semibold text-white/80">
                  Step by step:
                </h3>

                <div className="space-y-3">
                  {instructions.map((instruction, i) => (
                    <motion.button
                      // biome-ignore lint/suspicious/noArrayIndexKey: stable step instructions
                      key={i}
                      type="button"
                      onClick={() => handleInstructionTap(i)}
                      className="flex items-start gap-3 w-full text-left"
                      initial={{ opacity: 0, x: -5 }}
                      animate={{
                        opacity: i <= instructionStep ? 1 : 0.3,
                        x: 0,
                      }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{
                          background:
                            i < instructionStep
                              ? "#6B4FBB"
                              : i === instructionStep
                                ? "rgba(107,79,187,0.3)"
                                : "rgba(255,255,255,0.05)",
                          border:
                            i === instructionStep
                              ? "1px solid rgba(107,79,187,0.6)"
                              : "none",
                        }}
                      >
                        {i < instructionStep ? (
                          <span className="text-white text-xs">✓</span>
                        ) : (
                          <span className="text-white/40 text-xs">{i + 1}</span>
                        )}
                      </div>
                      <p
                        className="text-sm"
                        style={{
                          color:
                            i <= instructionStep
                              ? "rgba(255,255,255,0.8)"
                              : "rgba(255,255,255,0.3)",
                        }}
                      >
                        {instruction}
                      </p>
                    </motion.button>
                  ))}
                </div>

                {allInstructionsDone ? (
                  <motion.button
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    type="button"
                    onClick={nextStep}
                    className="w-full py-4 rounded-2xl text-white font-medium text-sm"
                    style={{
                      background:
                        "linear-gradient(135deg, #6B4FBB 0%, #3d2a7a 100%)",
                    }}
                  >
                    {step < 3 ? "Next" : "Done"}
                  </motion.button>
                ) : (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="w-full py-3 text-white/30 text-xs"
                  >
                    Skip this step
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
