# Veil — Quick Release System

## Current State
Veil is a production app with Home, Write, Journal, Reflections, and Profile tabs. The Profile tab has stats, mood history, apology history, and Voice Settings. The Companion Card (CompanionCard.tsx) handles emotional dumps with voice recording and text. No Quick Release system exists yet.

## Requested Changes (Diff)

### Add
- `QuickReleaseScreen.tsx` — full-screen, distraction-free Companion Card dump experience triggered by deep links (Siri/widget/Google Assistant). Starts with Veil's voice, large mic button, no navigation chrome, exhale/done flow that returns user to previous context.
- `QuickReleaseSettings.tsx` — Settings → Quick Release section with iOS (Siri Shortcut + Home Widget + Lock Widget) and Android (Google Assistant + Quick Settings Tile + Home Widget) setup cards. Each card shows: current phrase/status, animated setup guide with step-by-step instructions, and phrase customization UI.
- `QuickReleaseOnboarding.tsx` — 3-step onboarding flow shown after first successful dump. Step 1: voice assistant setup (Siri/Google). Step 2: home screen widget guide. Step 3: lock screen widget (iOS) or Quick Settings tile (Android). Each step optional with clear skip.
- Widget visual previews — interactive display of the 3 widget states (default 🫧 Put it down, checked-in 🌿 You showed up, resting 🌿 Veil has it) in the settings and onboarding UI.
- URL deep link handling — `?quick=1` query param causes app to open directly to QuickReleaseScreen on load.
- Backend: `logQuickReleaseSession` and `saveQuickReleaseConfig` methods in main.mo.

### Modify
- `App.tsx` — add Quick Release section to ProfileTab, handle `?quick=1` URL param, trigger QuickReleaseOnboarding state after first dump.
- `main.mo` — add QuickReleaseSession and QuickReleaseConfig data structures and query methods.

### Remove
- Nothing removed.

## Implementation Plan
1. Add backend types and functions to main.mo for QuickReleaseSession logging and config storage.
2. Create QuickReleaseScreen.tsx — stripped-down dump screen with immediate mic-ready state, Veil voice greeting, exhale, done.
3. Create QuickReleaseSettings.tsx — tabbed iOS/Android setup guides with widget preview cards, phrase customization, animated how-to steps.
4. Create QuickReleaseOnboarding.tsx — multi-step modal onboarding wizard.
5. Update App.tsx — add URL param handling, integrate Settings section into ProfileTab, add onboarding trigger, add Quick Release tab/section.
