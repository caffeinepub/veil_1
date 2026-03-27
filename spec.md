# Veil — Apology System

## Current State

Veil is a production app with 5 tabs: Home, Write, MyJournal, Reflections, Profile. The Write tab has a simple mood+title+body journal entry form. The backend has journal entries, emotion entries, streaks, voice settings. No apology data structures exist.

## Requested Changes (Diff)

### Add
- Backend: ApologyEntry, ApologyReceiverReflection, ApologySchedule types and full CRUD API
- Write Tab: Apology card (dove icon) as entry point to the Apology Creation Flow
- ApologyCreationFlow: 7-screen wizard (Path Choice, Write, AI Suggestions, Signature, Recipient, Identity, Delivery, Confirmation)
- ReceiverApologyView: Landing page with pause layer, emotion chips, AI guidance, I receive this / Let it be, closure screen
- SharedSilenceScreen: Bilateral closure moment for both sender and receiver
- ApologyProfileSection: Sent, Scheduled, Received, Unsent sections in Profile
- VoiceVentApologySuggestion: Soft card on Companion Card resting state
- Crisis detection on writing screen: soft inline card after 3s pause
- 6 apology voice moments (A-F) in voiceScripts.ts and VeilVoiceContext

### Modify
- WriteTab: Add ApologyEntryCard launching ApologyCreationFlow overlay
- ProfileTab: Add Apology sections
- VeilVoiceContext: Add 6 apology voice moments
- voiceScripts.ts: Add apology script libraries

### Remove
- Nothing

## Implementation Plan

1. Backend: Add ApologyEntry, ApologyReceiverReflection, ApologySchedule. APIs: createApology, updateApology, sendApology, scheduleApology, cancelSchedule, acknowledgeApology, saveReceiverReflection, getMyApologies, getReceivedApologies, getScheduledApologies, getUnsentApologies, getApologyById, deleteUnsentApology.

2. ApologyCreationFlow: Multi-step modal. Word counter (250/280/300 rules). Writing prompts collapsible. Crisis detection + 3s debounce. AI suggestions (3 tonal versions Simple/Emotional/Reflective + tone slider 0-100 morphing text in real time, client-side). AI disclosure card. Signature (3 preset + custom). Recipient (Inner Circle list + non-Veil). Identity (Reveal/Anonymous). Delivery (5 options + sleep hours protection). Confirmation preview. Send / Keep private.

3. ReceiverApologyView: Full-screen overlay. Pause layer (5/8/10 seconds, no timer visible). 5 emotion chips. Private text input. AI guidance line per chip. I receive this / Let it be actions. Closure screen.

4. Profile Apology sections: Sent (status never negative), Scheduled (edit/send/keep private, no preview in list), Received (tap to enter reflection), Unsent (edit/send/delete).

5. Voice moments A-F wired at correct flow points.

6. WriteTab: ApologyEntryCard as soft card opening full-screen overlay.
