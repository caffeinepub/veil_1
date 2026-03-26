# Veil — Companion Card (Home Screen Component 1)

## Current State
The Home tab shows a mood check-in grid, a daily quote section, and a list of recent journal entries. It has no emotional release / voice dump functionality.

The backend has JournalEntry, Reflection, UserProfile, and Stats types. No CompanionDump type exists yet.

## Requested Changes (Diff)

### Add
- `CompanionDump` type to backend with fields: id, contentType (VOICE_RELEASED | TEXT | SILENT), textContent (optional), audioStored (always false), voiceDurationSeconds (optional), releasedPermanently, crisisSignalDetected, crisisResourcesShown, exhaleMessageShown, streakDay, createdAt, source, visibility (always "only_me")
- `saveCompanionDump` backend function
- `getCompanionDumps` backend query (returns all dumps for caller)
- `getTodaysDump` backend query (returns most recent dump if created today, for resting-state detection)
- Frontend: `CompanionCard.tsx` — full Companion Card component with 4 states:
  - **DEFAULT**: Card with daily-rotating headline, subline "Veil will hold it for you.", "Put it down" button, gentle breathing animation (4s expand/contract), respects prefers-reduced-motion
  - **ACTIVE**: Full-screen dump space with 3 sub-paths:
    1. Voice entry → recording (waveform canvas, duration counter, tap-to-start/stop) → post-voice acknowledgment → optional text addendum → exhale
    2. Text dump → full-screen textarea → "Veil, take this from me" submit → exhale
    3. Silent dump → immediate exhale
  - **RELEASED**: Full-screen exhale moment — breathing circle, rotating release messages, "I'm ready to go" button, 6-second auto-transition
  - **RESTING**: Soft reduced-opacity card with resting copy rotation, streak acknowledgment at 7/14/30 days, "I need to release something else" option
- Crisis detection: keyword scan on text content; if detected, show crisis resources screen before exhale
- CompanionCard placed as the FIRST section in HomeTab, above existing mood check-in and quote sections

### Modify
- `HomeTab` in App.tsx: insert `<CompanionCard />` as first section, keeping existing mood check-in, quote, and recent entries below
- Keep all existing HomeTab content intact below the Companion Card

### Remove
- Nothing removed

## Implementation Plan
1. Add CompanionDump type and three backend functions to `main.mo`
2. Regenerate `backend.d.ts` types to include new functions
3. Create `src/frontend/src/components/CompanionCard.tsx` with all states, animations, voice recording via Web Audio API (waveform-only, no storage), canvas waveform visualization
4. Wire CompanionCard into HomeTab in App.tsx as first component
5. Add CSS keyframes for breathing animation to index.css
6. Validate and fix any type errors
