# Veil — Visual Expression Layer v2.0

## Current State

Veil v25 has all core systems live: Home (Check-In, Companion Card, Emotion Feed), Write Tab (Love Letters, Apologies, Confessions, Journaling), My Journal (book metaphor, seasonal navigation, depth additions), Reflections Tab (Compass, Growth Narrative, Memory Resurfacing), Profile Tab, Unified Algorithm System, Retention Engine, Notification System, and Emotional Feedback System.

There is currently no visual/canvas-based emotional expression feature.

## Requested Changes (Diff)

### Add
- `VisualExpressionCanvas.tsx` — Full-screen SVG canvas with emotion-mapped shapes, tap/drag/long-press interactions, real-time energy mirroring, 50-shape cap with fade, Start Over + Save buttons
- `VisualExpressionFirstTime.tsx` — First-time overlay: full-screen emotion aura background, centered serif text, fades on tap or after 3s
- `AISnapshotOptIn.tsx` — Privacy opt-in modal before first AI snapshot generation
- `VisualSnapshotResult.tsx` — After save: shows "What you made" + "What Veil made" side-by-side with Veil voice line
- `VisualStoryGallery.tsx` — Reflections section showing grid of saved visuals after 5+ entries, Veil observation line
- `visualExpressionState.ts` — localStorage-backed state: has used before, AI snapshot consent, saved visuals list
- `emotionShapes.ts` — Emotion-to-shape/motion mapping for all 11 emotion types

### Modify
- `QuietMomentScreen.tsx` — Add "Express visually →" soft link below content (entry point from Check-In)
- `CompanionCard.tsx` — Add "Express this visually →" soft link in RELEASED state (only shown if user has used feature before)
- `App.tsx` — Add `showVisualCanvas` state, import and render `VisualExpressionCanvas` as a full-screen overlay layer; pass `onExpressVisually` through to entry point components
- `MyJournalTab.tsx` — Render visual journal pages for saved visual entries with full artwork layout
- `ReflectionsTab.tsx` — Add "Your Visual Story" section after 5+ visual entries
- `WriteTab` (in App.tsx) — Add "Add visual layer →" optional link in journal entry creation

### Remove
Nothing removed.

## Implementation Plan

1. **`emotionShapes.ts`** — Define EmotionShape config for all 11 emotions: color (aura hex), shapeFn (SVG path generator), motionType (pulse/drift/tremor/push/rotate/rise/wave/radiate/still), interactionMode (stressed=repel, calm=blend, sad=drift-separate)
2. **`visualExpressionState.ts`** — localStorage helpers: `hasUsedVisualCanvas()`, `getAISnapshotConsent()`, `setAISnapshotConsent()`, `saveVisualEntry()`, `getVisualEntries()`
3. **`VisualExpressionFirstTime.tsx`** — Emotion aura background fill, centered serif quote, 3s auto-fade or tap-to-proceed
4. **`VisualExpressionCanvas.tsx`** — Core canvas: SVG-based, pointer events for tap/drag/long-press, max 50 shapes with oldest-fade logic, per-emotion shape rendering, energy level state (tap frequency → intensity), "Start over" bottom-left ghost button, "Save" bottom-right button, accessibility aria-label
5. **`AISnapshotOptIn.tsx`** — Privacy-first modal: exact spec copy, Yes/No buttons, saves consent to localStorage
6. **`VisualSnapshotResult.tsx`** — Two-panel display: user canvas thumbnail + procedurally generated AI snapshot (CSS-based abstract art), Veil voice line
7. **Wire entry points** in `QuietMomentScreen`, `CompanionCard` (RELEASED state), and Write Tab journal flow
8. **`VisualStoryGallery.tsx`** — Grid of visual thumbnails, tap to open journal page, Veil observation line
9. **App.tsx** — Add visual canvas overlay state, connect all entry points
10. **Journal visual pages** — In `MyJournalTab.tsx`, detect `entry_type === 'VISUAL'` and render artwork layout
