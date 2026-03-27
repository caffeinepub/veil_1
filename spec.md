# Veil — Express Love / Love Letter System

## Current State

Veil is a production app with:
- Home tab: Companion Card, Emotion Check-In, Feed, Emotion Aura, Quiet Moment, Voice System
- Write tab: Journal entry writer + Apology System (full 10-step wizard, receiver flow, closure moments, Shared Silence)
- Profile tab: Sent/Received/Private apologies, journal stats
- Voice system: VeilVoiceContext, VeilVoiceOverlay, voiceScripts.ts with 12+ moments
- Backend: main.mo with JournalEntry, EmotionEntry, ApologyEntry, ApologyReceiverReflection, ApologySchedule

## Requested Changes (Diff)

### Add
- `LoveLetter` backend type: id, senderUserId, letterType (ROMANTIC|FAMILY|FRIENDSHIP|SELF), openingLine, bodyText, closingLine, signature, wordCount, visualStyle (WARM_CREAM|VINTAGE|MINIMAL_WHITE|SOFT_NIGHT|SPRING), isAnonymous, aiAssisted, aiVersionUsed, editLevel, status (DRAFT|SCHEDULED|DELIVERED|OPENED|FELT|PRIVATE|EXPIRED), visibility (PRIVATE|SENT), deliveryMethod (IMMEDIATE|SCHEDULED|FUTURE_SELF), deliveryTime, recipientType (INNER_CIRCLE|NON_VEIL_SMS|NON_VEIL_EMAIL|SELF), recipientUserId, recipientContact, nonVeilToken, nonVeilTokenExpires, crisisSignalDetected, sharedWarmthTriggered, journalEntryId, onThisDaySurfaced, createdAt, deliveredAt, openedAt, feltAt
- `LoveLetterReaction` backend type: id, letterId, receiverUserId, reactionType (FELT|LET_IT_SIT|WROTE_BACK), replyLetterId, createdAt
- `LoveLetterSchedule` backend type: id, letterId, senderUserId, scheduledDeliveryTime, status (SCHEDULED|DELIVERED|CANCELLED), deliveryType (STANDARD|BIRTHDAY|ANNIVERSARY|FUTURE_SELF), cancelledAt, deliveredAt
- Backend CRUD: createLoveLetter, updateLoveLetter, getLoveLettersBySender, getLoveLettersByReceiver, saveLoveLetterReaction, scheduleLoveLetter
- `LoveLetterFlow.tsx` — Full-screen overlay wizard:
  - Step 1: Letter type selection (ROMANTIC/FAMILY/FRIENDSHIP/SELF)
  - Step 2: Path choice (Write to send / Write to keep)
  - Step 3: Writing screen — opening line, body textarea, closing line, signature with per-type placeholders; word counter (invisible <500, neutral 500-569, amber 570-599, blocked at 600); collapsible writing prompts per type; crisis detection inline card; "Help me find the words" (active 15+ words) + "Continue →"
  - Step 4: AI assist — 3 tonal versions per letter type, disclosure card, "None of these feel right" back link
  - Step 5: Visual style selection (5 styles)
  - Step 6: Recipient selection (Inner Circle list for non-SELF types; skipped for SELF)
  - Step 7: Delivery options (per-type options; sleep hour protection; SELF gets future-delivery options)
  - Step 8: Review screen — full letter preview with visual style applied, Edit/Change style, Send / Keep private
  - Step 9: Sender closure moment (full screen, rotating message, voice moment A)
- `LetterRevealExperience.tsx` — Receiver experience:
  - Pre-read moment (3s, visual style bg, type icon, one-line copy per type)
  - Line-by-line reveal animation (0.8s after opening, 0.3s per line, Reduce Motion: instant)
  - Voice moment C before reveal
  - 5s stillness after reveal, then response options fade in
  - Response options per letter type (❤️ felt / write back / let it sit; SELF: close + carry it)
  - Receiver closure screen (per response, voice moment)
  - Shared Warmth on ❤️ (sender + receiver simultaneously, voice moment D)
- 6 new voice moments in voiceScripts.ts: ll_a through ll_f
- Express Love card (💌) in WriteTab above Apology card
- Letters section in ProfileTab: Letters Sent, Letters Received, Letters I Never Sent

### Modify
- `App.tsx` WriteTab: add Express Love card button + `showLoveLetterFlow` state + `LoveLetterFlow` overlay
- `App.tsx` ProfileTab: add Letters sub-section (Sent, Received, Never Sent)
- `voiceScripts.ts`: add 6 new love letter moment scripts (ll_a through ll_f)

### Remove
- Nothing removed

## Implementation Plan

1. Add LoveLetter types + CRUD to main.mo (backend)
2. Build LoveLetterFlow.tsx (full wizard, 9 steps/screens, all letter types, AI versions, visual styles, crisis detection)
3. Build LetterRevealExperience.tsx (pre-read, line-by-line reveal, response options, closure screen, Shared Warmth)
4. Add 6 voice moments to voiceScripts.ts
5. Wire Express Love card into WriteTab in App.tsx
6. Add Letters section to ProfileTab in App.tsx
7. Validate (lint, typecheck, build)
