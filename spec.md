# Veil — Confess Feature

## Current State
The Write tab has two core features: Express Love (LoveLetterFlow.tsx) and Write an Apology (ApologyCreationFlow.tsx). The app has a voice system (voiceScripts.ts), journal integration, and crisis detection patterns established by prior features. The backend (main.mo) already stores love letters, apologies, and journal entries.

## Requested Changes (Diff)

### Add
- `ConfessFlow.tsx` — Full-screen overlay component implementing the Confess ritual across all three modes: Universe, Private, and Witness
- Backend data types: `Confession` and `ConfessionWitnessDelivery` with CRUD APIs in `main.mo`
- Confess card (🕊 icon) in Write tab, above the Express Love card
- 5 new voice moments (`cf_a` through `cf_e`) in `voiceScripts.ts`
- Profile section: "Private Confessions" with mode icons and statuses

### Modify
- `App.tsx` — Add ConfessFlow import, state, card, and Profile section
- `main.mo` — Add Confession and ConfessionWitnessDelivery types with createConfession, getConfessions, saveWitnessResponse, deleteConfession APIs
- `voiceScripts.ts` — Add confession voice moments

### Remove
- Nothing removed

## Implementation Plan
1. Add Confession + ConfessionWitnessDelivery types and APIs to main.mo
2. Add 5 voice moments to voiceScripts.ts
3. Create ConfessFlow.tsx with: entry moment screen, mode selection, writing screen (per-mode atmosphere), crisis detection, release moment (particle animation via CSS), voice moments, witness selection, witness view, sender response view, apology bridge, profile section integration
4. Update App.tsx WriteTab to include the Confess card and ConfessFlow overlay, and Profile tab for Private Confessions
