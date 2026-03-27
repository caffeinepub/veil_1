# Veil — Reflections Tab v2.0

## Current State

The Reflections tab (4th tab) exists as a basic implementation:
- A list of hardcoded PROMPTS shown as cards
- Users can write a text response to each prompt and save it
- Saved reflections fetched from backend via `getAllReflections()` / `addReflection()`
- A `JoyThisMonthCard` showing captured joy count from localStorage
- No Emotional Compass, no Connection Mirror, no Growth Narrative, no archive

Backend has: `addReflection(prompt, response)` and `getAllReflections()` returning `Reflection[]`

## Requested Changes (Diff)

### Add
- **ReflectionsTab v2.0** component extracted to `src/frontend/src/components/ReflectionsTab.tsx`
- **Emotional Intelligence Engine (prompt generation)** — priority-based system (8 levels) generating contextual prompts from localStorage event data; uses `reflectionsEngine.ts` lib
- **Still Pool visual identity** — deep blue-grey (#1A2030) background, ripple texture, serif typography
- **Single active prompt screen** — one prompt at a time, Write / Speak options, "Not ready" dismiss
- **Text reflection writing experience** — full screen, prompt visible at top, auto-save draft, no distractions
- **Voice reflection** — recording stored as blob in localStorage, waveform visualization, playback
- **Follow-up question** — single optional deeper question after main response
- **Completion screen** — warm non-metric acknowledgment, Veil voice moment
- **Reflection archive** — seasonal navigation (Year→Season→Month), page design with prompt italic + response
- **Emotional Compass** — compass rose visual (4 zones: N/S/E/W), hand-drawn aesthetic, needle direction, 12-month history strip, narrative sentence
- **Connection Mirror ("People in Your Story")** — warm observations from journal person tags and letter recipients, no rankings
- **Growth Narrative** — monthly/quarterly/annual generated narrative paragraphs
- **Thematic Clustering** — AI-style theme detection across 10+ reflections (pattern matching on keywords)
- **Memory Resurfacing** — anniversary, emotional mirror, growth proof triggers
- **First-time empty state** with onboarding message and first prompt
- **4 voice moments** (A–D) integrated with VeilVoiceContext
- **Settings panel** for prompt frequency, compass, connections, growth narrative toggles

### Modify
- `App.tsx`: replace inline `ReflectionsTab()` function with import of new component; keep `addReflection`/`getAllReflections` backend calls passed as props

### Remove
- Old inline `ReflectionsTab` function and `JoyThisMonthCard` from App.tsx (moved to new component file)
- Hardcoded `PROMPTS` array (replaced by engine-generated prompts)

## Implementation Plan

1. Create `src/frontend/src/lib/reflectionsEngine.ts` — prompt generation logic (priority 1–8), compass direction calculation from localStorage emotion events, connection mirror observation builder, growth narrative generator, thematic clustering
2. Create `src/frontend/src/components/ReflectionsTab.tsx` — full v2.0 implementation:
   - Main screen with Still Pool aesthetic
   - Active prompt card with Write/Speak/Not Ready
   - Writing experience (full screen)
   - Voice reflection (Web Audio API + localStorage blob)
   - Follow-up flow
   - Completion screen
   - Archive (seasonal navigation)
   - Emotional Compass section
   - Connection Mirror section
   - Growth Narrative section
   - First-time empty state
   - Settings panel
3. Update `App.tsx` to import and use `ReflectionsTab` component, remove old inline implementation
