# Veil — Emotional Compass (Unified System) v2.0

## Current State

ReflectionsTab.tsx contains a compassEngine reference and a placeholder Compass section. ProfileTab.tsx contains an Emotional Compass Preview card. Neither has a full, implemented Emotional Compass with:
- A visual compass rose with animated needle
- Four directional zones (N/S/E/W) with zone colors
- 12-month history strip with tappable mini-compass icons
- Layer 2 four dimension cards (Reflection, Connection, Growth, Meaning)
- Direction-specific narratives for all 8 needle positions
- Empty state (< 14 days data) with pulsing needle
- Proper voice system integration moments

## Requested Changes (Diff)

### Add
- `EmotionalCompass.tsx` — full Compass screen component
  - SVG compass rose, hand-drawn aesthetic, animated needle
  - Four zone coloring (N: #F9E4A0, S: #C3B8D8, E: #F4C28A, W: #B8C4D4)
  - Needle sweeps to direction (8 positions) with reduced-motion support
  - Narrative text block (italic serif) for all 8 directions
  - 12-month history strip: 12 mini compass icons, tappable to expand month detail
  - "Reflect on your direction →" CTA
  - Layer 2: four dimension cards stacked vertically
    - Reflection (🌊), Connection (🌿), Growth (🌱), Meaning (✦)
    - Connection card split into Giving + Receiving sections
    - Each with directional observation (multiple states) and CTA
  - Empty state: pulsing compass rose, no needle, instructional text
  - Dimension cards appear progressively as data accumulates
  - Screen reader aria labels for needle direction + narrative
  - High contrast mode support
- `compassData.ts` — mock UEDL data layer and compass calculation logic
  - Emotion-to-zone mapping (N/S/E/W)
  - `calculateNeedleDirection()` from last 30 days UEDL
  - `calculateDimensionDirection()` for each of the 4 dimensions
  - Narrative lookup tables for all states
  - 12-month historical state mock data

### Modify
- `ReflectionsTab.tsx` — replace/wire existing compass section to open `EmotionalCompass.tsx` as a full-screen modal or nested view from "Your Direction" card
- `ProfileTab.tsx` — replace existing compass preview card with proper compact card showing needle direction + one narrative line + "See your full direction →" link that navigates to Reflections tab compass view

### Remove
- Any duplicate compass score/percentage UI that may exist in the current Compass section

## Implementation Plan

1. Create `compassData.ts` with zone mappings, narrative lookup, dimension calculation logic, and mock 12-month history data
2. Create `EmotionalCompass.tsx`:
   - SVG compass rose with hand-drawn style (slightly rough strokes, warm tones)
   - Animated needle via CSS transform rotate, respects `prefers-reduced-motion`
   - Zone arcs colored N/S/E/W with 15% opacity fill on active zone
   - Narrative block: italic serif (InstrumentSerif-Italic), warm dark #2A1A0A
   - 12-month history strip below compass — 12 small SVG compass icons in a horizontal scroll
   - Tapping a month icon shows an expanded popover with that month's narrative
   - "Reflect on your direction →" button (min 48×48px)
   - Four dimension cards with title, icon, observation text, CTA
   - Connection card: two sub-sections (Giving / Receiving) never combined
   - Empty state: needle absent, compass pulses softly, instructional copy
   - Progressive card reveal based on mock data flags
3. Wire `ReflectionsTab.tsx` — "Your Direction" card tap opens EmotionalCompass as full screen
4. Wire `ProfileTab.tsx` — compact preview card with mini needle illustration and single narrative line, tap navigates to Reflections/Compass
5. Validate (lint + typecheck + build)
