import List "mo:core/List";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Order "mo:core/Order";
import Map "mo:core/Map";


import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";


actor {
  // Type definitions
  type JournalEntry = {
    id : Text;
    title : Text;
    body : Text;
    mood : Text;
    timestamp : Time.Time;
  };

  type Reflection = {
    id : Text;
    prompt : Text;
    response : Text;
    timestamp : Time.Time;
  };

  type UserProfile = {
    displayName : Text;
  };

  type Stats = {
    totalEntries : Nat;
    currentStreak : Nat;
    moodFrequency : [(Text, Nat)];
  };

  type CompanionDump = {
    id : Text;
    contentType : Text;
    textContent : ?Text;
    audioStored : Bool;
    voiceDurationSeconds : ?Nat;
    releasedPermanently : Bool;
    crisisSignalDetected : Bool;
    crisisResourcesShown : Bool;
    exhaleMessageShown : Text;
    streakDay : Nat;
    createdAt : Time.Time;
    source : Text;
    visibility : Text;
  };

  type EmotionEntry = {
    id : Text;
    emotionType : Text;
    emotionLabel : Text;
    emoji : Text;
    customEmotionLabel : ?Text;
    textReflection : ?Text;
    voiceDurationSeconds : ?Nat;
    visibilityLevel : Text;
    voiceOverrideApplied : Bool;
    aiPromptShown : Bool;
    aiPromptText : ?Text;
    crisisSignalDetected : Bool;
    crisisResourcesShown : Bool;
    exhaleMessageShown : Text;
    createdAt : Time.Time;
    source : Text;
  };

  // Emotion streak awareness state — persists which milestone was last shown
  type EmotionStreakRecord = {
    emotionType : Text;
    lastAwarenessMilestone : ?Nat; // null = never shown
    lastAwarenessShownAt : ?Int;
    acknowledgmentType : ?Text; // "REFLECTED" | "DISMISSED" | "IGNORED"
    crisisResourcesShown : Bool;
    updatedAt : Int;
  };

  type VeilVoiceMomentsEnabled = {
    after_voice_dump : Bool;
    after_text_dump : Bool;
    after_silent_dump : Bool;
    morning_follow_up : Bool;
    carrying_awareness : Bool;
    after_checkin : Bool;
  };

  type VeilVoiceSettings = {
    voice_enabled : Bool;
    moments_enabled : VeilVoiceMomentsEnabled;
    onboarding_completed : Bool;
  };


  module JournalEntry {
    public func compareByTimestamp(entry1 : JournalEntry, entry2 : JournalEntry) : Order.Order {
      Int.compare(entry2.timestamp, entry1.timestamp);
    };
  };

  module CompanionDump {
    public func compareByCreatedAt(dump1 : CompanionDump, dump2 : CompanionDump) : Order.Order {
      Int.compare(dump2.createdAt, dump1.createdAt);
    };
  };

  module EmotionEntry {
    public func compareByCreatedAt(e1 : EmotionEntry, e2 : EmotionEntry) : Order.Order {
      Int.compare(e2.createdAt, e1.createdAt);
    };
  };

  // ────── Apology System Types ────────────────
  type ApologyEntry = {
    id : Text;
    senderUserId : Principal;
    content : Text;
    aiAssisted : Bool;
    aiVersionUsed : Text; // SIMPLE|EMOTIONAL|REFLECTIVE|NONE
    editLevel : Text; // NONE|MINOR|MAJOR|COMPLETE
    signature : Text;
    emotionType : Text;
    isAnonymous : Bool;
    status : Text; // DRAFT|SCHEDULED|DELIVERED|OPENED|ACKNOWLEDGED|UNSENT|EXPIRED
    visibility : Text; // PRIVATE|SENT
    deliveryTime : ?Int;
    deliveryMethod : Text; // IMMEDIATE|SCHEDULED
    recipientType : Text; // INNER_CIRCLE|NON_VEIL_SMS|NON_VEIL_EMAIL|NONE
    recipientUserId : ?Principal;
    recipientContact : ?Text;
    nonVeilToken : ?Text;
    nonVeilTokenExpires : ?Int;
    rescheduleCount : Nat;
    source : Text; // MANUAL|VOICE_VENT|TEXT_VENT
    crisisSignalDetected : Bool;
    sharedSilenceTriggered : Bool;
    createdAt : Int;
    deliveredAt : ?Int;
    openedAt : ?Int;
    acknowledgedAt : ?Int;
  };

  type ApologyReceiverReflection = {
    id : Text;
    apologyId : Text;
    receiverUserId : Principal;
    emotionSelected : Text; // RELIEVED|HURT|NOT_READY|CONFUSED|NEUTRAL
    privateReflectionText : ?Text;
    actionTaken : Text; // I_RECEIVE_THIS|LET_IT_BE|NO_ACTION
    reflectionComplete : Bool;
    journalEntryId : ?Text;
    createdAt : Int;
    completedAt : ?Int;
  };

  type ApologySchedule = {
    id : Text;
    apologyId : Text;
    senderUserId : Principal;
    scheduledDeliveryTime : Int;
    reminderSent : Bool;
    reminderSentAt : ?Int;
    status : Text; // SCHEDULED|DELIVERED|CANCELLED|RESCHEDULED
    rescheduleCount : Nat;
    cancelledAt : ?Int;
    deliveredAt : ?Int;
  };
  type Confession = {
    id : Text;
    userId : Principal;
    mode : Text; // UNIVERSE | PRIVATE | WITNESS
    content : Text;
    wordCount : Nat;
    hadVoiceComponent : Bool;
    witnessUserId : ?Principal;
    witnessNotified : Bool;
    witnessOpened : Bool;
    witnessResponse : ?Text;
    witnessResponseDelivered : Bool;
    crisisSignalDetected : Bool;
    crisisResourcesShown : Bool;
    apologyBridgeShown : Bool;
    apologyCreatedAfter : Bool;
    onThisDaySurfaced : Bool;
    deletionRequested : Bool;
    createdAt : Int;
  };



  // ────── Love Letter System Types ────────────────
  type LoveLetter = {
    id : Text;
    senderUserId : Principal;
    letterType : Text; // ROMANTIC|FAMILY|FRIENDSHIP|SELF
    openingLine : Text;
    bodyText : Text;
    closingLine : Text;
    signature : Text;
    wordCount : Nat;
    visualStyle : Text; // WARM_CREAM|VINTAGE|MINIMAL_WHITE|SOFT_NIGHT|SPRING
    isAnonymous : Bool;
    aiAssisted : Bool;
    aiVersionUsed : Text; // TENDER|HEARTFELT|POETIC|DIRECT|WARM|SIMPLE|GENTLE|AFFIRMING|HONEST|NONE
    editLevel : Text; // NONE|MINOR|MAJOR|COMPLETE
    status : Text; // DRAFT|SCHEDULED|DELIVERED|OPENED|FELT|PRIVATE|EXPIRED
    visibility : Text; // PRIVATE|SENT
    deliveryMethod : Text; // IMMEDIATE|SCHEDULED|FUTURE_SELF
    deliveryTime : ?Int;
    recipientType : Text; // INNER_CIRCLE|NON_VEIL_SMS|NON_VEIL_EMAIL|SELF
    recipientUserId : ?Principal;
    recipientContact : ?Text;
    nonVeilToken : ?Text;
    nonVeilTokenExpires : ?Int;
    crisisSignalDetected : Bool;
    sharedWarmthTriggered : Bool;
    journalEntryId : ?Text;
    onThisDaySurfaced : Bool;
    createdAt : Int;
    deliveredAt : ?Int;
    openedAt : ?Int;
    feltAt : ?Int;
  };

  type LoveLetterReaction = {
    id : Text;
    letterId : Text;
    receiverUserId : Principal;
    reactionType : Text; // FELT|LET_IT_SIT|WROTE_BACK
    replyLetterId : ?Text;
    createdAt : Int;
  };

  type LoveLetterSchedule = {
    id : Text;
    letterId : Text;
    senderUserId : Principal;
    scheduledDeliveryTime : Int;
    status : Text; // SCHEDULED|DELIVERED|CANCELLED
    deliveryType : Text; // STANDARD|BIRTHDAY|ANNIVERSARY|FUTURE_SELF
    cancelledAt : ?Int;
    deliveredAt : ?Int;
  };

  // ────── Quick Release System Types ────────────────
  type QuickReleaseSession = {
    id : Text;
    userId : Principal;
    platform : Text; // IOS | ANDROID | WEB
    accessPoint : Text; // SIRI | HOME_WIDGET | LOCK_WIDGET | GOOGLE_ASSISTANT | QUICK_TILE | DIRECT
    openedAt : Int;
    dumpType : ?Text; // VOICE | TEXT | SILENT | null
    dumpCompleted : Bool;
    timeToFirstTap : ?Nat; // seconds
    sessionDuration : ?Nat; // seconds
    returnedTo : Text; // HOME_SCREEN | LOCK_SCREEN | PREVIOUS_APP | UNKNOWN
    createdAt : Int;
  };

  type QuickReleaseConfig = {
    userId : Principal;
    platform : Text; // IOS | ANDROID
    phrase : Text;
    setupCompleted : Bool;
    setupDate : ?Int;
    activationCount : Nat;
    lastActivatedAt : ?Int;
  };

  // ────── Significant Moments System Types ─────────────
  public type SignificanceSignal = {
    id : Text;
    userId : Principal;
    signalType : Text;
    signalIntensity : Float; // Subjective signal importance 0.0 - 100.0
    rawEmotionType : Text;
    rawEmotionIntensity : Nat; // 1-10 scale
    contextSnapshot : Text; // Encrypted JSON
    significanceScore : Float; // Default 0, Ability to boost to 1.0+ and push to recommendations
    usedInSurface : Bool;
    surfaceTypeUsed : ?Text; //
    createdAt : Time.Time;
    eligibleForReturnAfter : Time.Time; // Default 3 days, can boost for eligibility
    returnedAt : ?Time.Time; // When surfaced to user
  };

  type SurfaceDelivery = {
    id : Text;
    userId : Principal;
    signalId : Text;
    surfaceType : Text;
    deliveryStatus : Text; // SCHEDULED | DELIVERED | EXPIRED | DISMISSED
    scheduledForSessionAfter : Time.Time;
    deliveredAt : ?Time.Time;
    dismissed : Bool;
    createdAt : Time.Time;
  };

  type FutureLetterDelivery = {
    id : Text;
    userId : Principal;
    letterId : Text;
    writtenAt : Time.Time;
    deliveryTriggerJson : Text;
    deliveryStatus : Text; // PENDING | DELIVERED | EXPIRED
    deliveredAt : ?Time.Time;
    overrideDate : Time.Time;
  };

  type SignificantMomentsSettings = {
    userId : Principal;
    enabled : Bool;
    whisperEnabled : Bool;
    memoryMirrorEnabled : Bool;
    returnLetterEnabled : Bool;
    becomingMomentEnabled : Bool;
    milestoneHoldEnabled : Bool;
    peakSealEnabled : Bool;
    frequency : Text; // RARELY|OCCASIONALLY|OFTEN
    createdAt : Time.Time;
    updatedAt : Time.Time;
  };

  // Persistent evidences
  let signals = Map.empty<Principal, List.List<SignificanceSignal>>();
  let surfaceDeliveries = Map.empty<Principal, List.List<SurfaceDelivery>>();
  let futureLetterDeliveries = Map.empty<Principal, List.List<FutureLetterDelivery>>();
  let momentsSettings = Map.empty<Principal, SignificantMomentsSettings>();

  // Internal storage using persistent Map
  let apologyEntries = Map.empty<Principal, List.List<ApologyEntry>>();
  let apologyReflections = Map.empty<Principal, List.List<ApologyReceiverReflection>>();
  let apologySchedules = Map.empty<Principal, List.List<ApologySchedule>>();
  let loveLetters = Map.empty<Principal, List.List<LoveLetter>>();
  let loveLetterReactions = Map.empty<Principal, List.List<LoveLetterReaction>>();
  let loveLetterSchedules = Map.empty<Principal, List.List<LoveLetterSchedule>>();
  let confessions = Map.empty<Principal, List.List<Confession>>();
  let quickReleaseSessions = Map.empty<Principal, List.List<QuickReleaseSession>>();
  let quickReleaseConfigs = Map.empty<Principal, QuickReleaseConfig>();

  // Initialize authorization state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Persistent storage
  let journalEntries = Map.empty<Principal, List.List<JournalEntry>>();
  let reflections = Map.empty<Principal, List.List<Reflection>>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let companionDumps = Map.empty<Principal, List.List<CompanionDump>>();
  let emotionEntries = Map.empty<Principal, List.List<EmotionEntry>>();
  let emotionStreakRecords = Map.empty<Principal, List.List<EmotionStreakRecord>>();
  let veilVoiceSettings = Map.empty<Principal, VeilVoiceSettings>();

  // Significant Moments System ===

  public shared ({ caller }) func recordSignificanceSignal(signalType : Text, signalIntensity : Float, rawEmotionType : Text, rawEmotionIntensity : Nat, contextSnapshot : Text, eligibleForReturnAfterDays : Nat) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can record signals");
    };
    let id = "signal_" # Time.now().toText();
    let signal : SignificanceSignal = {
      id;
      userId = caller;
      signalType;
      signalIntensity;
      rawEmotionType;
      rawEmotionIntensity;
      contextSnapshot;
      significanceScore = 0.0;
      usedInSurface = false;
      surfaceTypeUsed = null;
      createdAt = Time.now();
      eligibleForReturnAfter = Time.now() + eligibleForReturnAfterDays * 24 * 60 * 60 * 1_000_000_000;
      returnedAt = null;
    };

    let existing = switch (signals.get(caller)) {
      case (null) { List.empty<SignificanceSignal>() };
      case (?list) { list };
    };
    existing.add(signal);
    signals.add(caller, existing);
    id;
  };

  func getSignalsForUser(userId : Principal) : List.List<SignificanceSignal> {
    switch (signals.get(userId)) {
      case (null) { List.empty<SignificanceSignal>() };
      case (?list) { list };
    };
  };

  public query ({ caller }) func getSignificanceSignals() : async [SignificanceSignal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view signals");
    };
    getSignalsForUser(caller).toArray();
  };

  public shared ({ caller }) func updateSignificanceScore(id : Text, score : Float) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update signals");
    };
    let existing = getSignalsForUser(caller);
    let found = existing.find(func(s) { s.id == id });
    switch (found) {
      case (null) { Runtime.trap("Signal not found") };
      case (?signal) {
        if (signal.userId != caller) {
          Runtime.trap("Unauthorized: Only the creator can update the score");
        };
        let updated = existing.map<SignificanceSignal, SignificanceSignal>(
          func(s) {
            if (s.id == id) { { s with significanceScore = score } } else { s };
          }
        );
        signals.add(caller, updated);
        true;
      };
    };
  };

  public shared ({ caller }) func recordSurfaceDelivery(signalId : Text, surfaceType : Text, scheduledForSessionAfter : Time.Time) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can record surface deliveries");
    };
    let id = "surface_" # Time.now().toText();
    let delivery : SurfaceDelivery = {
      id;
      userId = caller;
      signalId;
      surfaceType;
      deliveryStatus = "SCHEDULED";
      scheduledForSessionAfter;
      deliveredAt = null;
      dismissed = false;
      createdAt = Time.now();
    };

    let existing = switch (surfaceDeliveries.get(caller)) {
      case (null) { List.empty<SurfaceDelivery>() };
      case (?list) { list };
    };
    existing.add(delivery);
    surfaceDeliveries.add(caller, existing);
    id;
  };

  public query ({ caller }) func getSurfaceDeliveries() : async [SurfaceDelivery] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view surface deliveries");
    };
    let existing = switch (surfaceDeliveries.get(caller)) {
      case (null) { List.empty<SurfaceDelivery>() };
      case (?list) { list };
    };
    existing.toArray();
  };

  public shared ({ caller }) func markSurfaceDelivered(id : Text, surfaceType : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark surface deliveries");
    };
    let userDeliveries = switch (surfaceDeliveries.get(caller)) {
      case (null) { Runtime.trap("Delivery not found") };
      case (?deliveries) { deliveries };
    };
    let found = userDeliveries.find(func(d) { d.id == id });
    switch (found) {
      case (null) { Runtime.trap("Delivery not found") };
      case (?delivery) {
        if (delivery.userId != caller) {
          Runtime.trap("Unauthorized: Only the creator can mark the delivery");
        };
        let updated = userDeliveries.map<SurfaceDelivery, SurfaceDelivery>(
          func(d) {
            if (d.id == id) {
              { d with deliveryStatus = "DELIVERED"; deliveredAt = ?Time.now() };
            } else { d };
          }
        );
        surfaceDeliveries.add(caller, updated);

        switch (signals.get(caller)) {
          case (null) {};
          case (?existingSignals) {
            let updatedSignals = existingSignals.map<SignificanceSignal, SignificanceSignal>(
              func(s) {
                if (s.id == delivery.signalId) {
                  { s with usedInSurface = true; surfaceTypeUsed = ?surfaceType; returnedAt = ?Time.now() };
                } else { s };
              }
            );
            signals.add(caller, updatedSignals);
          };
        };
        true;
      };
    };
  };

  public shared ({ caller }) func dismissSurfaceDelivery(id : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can dismiss surface deliveries");
    };
    let deliveries = switch (surfaceDeliveries.get(caller)) {
      case (null) { Runtime.trap("Delivery not found") };
      case (?d) { d };
    };
    let found = deliveries.find(func(d) { d.id == id });
    switch (found) {
      case (null) { Runtime.trap("Delivery not found") };
      case (?delivery) {
        if (delivery.userId != caller) {
          Runtime.trap("Unauthorized: Only the creator can dismiss the delivery");
        };
        let updated = deliveries.map<SurfaceDelivery, SurfaceDelivery>(
          func(d) {
            if (d.id == id) { { d with dismissed = true } } else { d };
          }
        );
        surfaceDeliveries.add(caller, updated);
        true;
      };
    };
  };

  public shared ({ caller }) func saveFutureLetterDelivery(letterId : Text, deliveryTriggerJson : Text, overrideDays : Nat) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save future letter deliveries");
    };
    let id = "fd_" # Time.now().toText();
    let delivery : FutureLetterDelivery = {
      id;
      userId = caller;
      letterId;
      deliveryTriggerJson;
      deliveryStatus = "PENDING";
      deliveredAt = null;
      writtenAt = Time.now();
      overrideDate = Time.now() + (overrideDays * 24 * 60 * 60 * 1_000_000_000);
    };

    let existing = switch (futureLetterDeliveries.get(caller)) {
      case (null) { List.empty<FutureLetterDelivery>() };
      case (?d) { d };
    };
    existing.add(delivery);
    futureLetterDeliveries.add(caller, existing);
    id;
  };

  public query ({ caller }) func getFutureLetterDeliveries() : async [FutureLetterDelivery] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view future letter deliveries");
    };
    let deliveries = switch (futureLetterDeliveries.get(caller)) {
      case (null) { List.empty<FutureLetterDelivery>() };
      case (?d) { d };
    };
    deliveries.toArray();
  };

  public shared ({ caller }) func markFutureLetterDelivered(id : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark future letter deliveries");
    };
    let deliveries = switch (futureLetterDeliveries.get(caller)) {
      case (null) { Runtime.trap("Future letter delivery not found") };
      case (?d) { d };
    };
    let found = deliveries.find(func(d) { d.id == id });
    switch (found) {
      case (null) { Runtime.trap("Future letter delivery not found") };
      case (?delivery) {
        if (delivery.userId != caller) {
          Runtime.trap("Unauthorized: Only the creator can mark the future letter delivery");
        };
        let updated = deliveries.map<FutureLetterDelivery, FutureLetterDelivery>(
          func(d) {
            if (d.id == id) { { d with deliveryStatus = "DELIVERED"; deliveredAt = ?Time.now() } } else { d };
          }
        );
        futureLetterDeliveries.add(caller, updated);
        true;
      };
    };
  };

  public query ({ caller }) func getSignificantMomentsSettings() : async ?SignificantMomentsSettings {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view settings");
    };
    momentsSettings.get(caller);
  };

  public shared ({ caller }) func saveSignificantMomentsSettings(
    enabled : Bool,
    whisperEnabled : Bool,
    memoryMirrorEnabled : Bool,
    returnLetterEnabled : Bool,
    becomingMomentEnabled : Bool,
    milestoneHoldEnabled : Bool,
    peakSealEnabled : Bool,
    frequency : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update settings");
    };
    let createdAt = switch (momentsSettings.get(caller)) {
      case (null) { Time.now() };
      case (?settings) { settings.createdAt };
    };
    let settings : SignificantMomentsSettings = {
      userId = caller;
      enabled;
      whisperEnabled;
      memoryMirrorEnabled;
      returnLetterEnabled;
      becomingMomentEnabled;
      milestoneHoldEnabled;
      peakSealEnabled;
      frequency;
      createdAt;
      updatedAt = Time.now();
    };
    momentsSettings.add(caller, settings);
  };

  public shared ({ caller }) func deleteAllMySignificanceData() : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete their significance data");
    };
    signals.remove(caller);
    surfaceDeliveries.remove(caller);
    futureLetterDeliveries.remove(caller);
    momentsSettings.remove(caller);
    true;
  };

  // Apology System Functions

  public shared ({ caller }) func createApology(
    content : Text,
    signature : Text,
    emotionType : Text,
    isAnonymous : Bool,
    aiAssisted : Bool,
    aiVersionUsed : Text,
    source : Text,
    crisisSignalDetected : Bool,
  ) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create apologies");
    };
    let id = "apology_" # Time.now().toText();
    let newApology : ApologyEntry = {
      id;
      senderUserId = caller;
      content; // Ideally encrypt before storing
      aiAssisted;
      aiVersionUsed;
      editLevel = "NONE";
      signature;
      emotionType;
      isAnonymous;
      status = "DRAFT";
      visibility = "PRIVATE";
      deliveryTime = null;
      deliveryMethod = "IMMEDIATE";
      recipientType = "NONE";
      recipientUserId = null;
      recipientContact = null; // Ideally encrypt if not null
      nonVeilToken = null;
      nonVeilTokenExpires = null;
      rescheduleCount = 0;
      source;
      crisisSignalDetected;
      sharedSilenceTriggered = false;
      createdAt = Time.now();
      deliveredAt = null;
      openedAt = null;
      acknowledgedAt = null;
    };
    let existingApologies = switch (apologyEntries.get(caller)) {
      case (null) { List.empty<ApologyEntry>() };
      case (?list) { list };
    };
    existingApologies.add(newApology);
    apologyEntries.add(caller, existingApologies);
    id;
  };

  public shared ({ caller }) func updateApologyContent(apologyId : Text, content : Text, editLevel : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update apologies");
    };
    switch (apologyEntries.get(caller)) {
      case (null) { Runtime.trap("Apology not found") };
      case (?entries) {
        let found = entries.find(func(a) { a.id == apologyId });
        switch (found) {
          case (null) { Runtime.trap("Apology not found or you don't own it") };
          case (?apology) {
            if (apology.status == "DELIVERED" or apology.status == "OPENED" or apology.status == "ACKNOWLEDGED") {
              Runtime.trap("Cannot update delivered apology");
            };
            let updated = entries.map<ApologyEntry, ApologyEntry>(
              func(a) {
                if (a.id == apologyId) {
                  { a with content; editLevel };
                } else { a };
              }
            );
            apologyEntries.add(caller, updated);
            true;
          };
        };
      };
    };
  };

  public shared ({ caller }) func sendApologyNow(
    apologyId : Text,
    recipientUserId : ?Principal,
    recipientType : Text,
    recipientContact : ?Text,
  ) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send apologies");
    };
    switch (apologyEntries.get(caller)) {
      case (null) { Runtime.trap("Apology not found") };
      case (?entries) {
        let found = entries.find(func(a) { a.id == apologyId });
        switch (found) {
          case (null) { Runtime.trap("Apology not found or you don't own it") };
          case (?_apology) {
            let updated = entries.map<ApologyEntry, ApologyEntry>(
              func(a) {
                if (a.id == apologyId) {
                  {
                    a with
                    status = "DELIVERED";
                    visibility = "SENT";
                    recipientUserId;
                    recipientType;
                    recipientContact;
                    deliveredAt = ?Time.now();
                    deliveryMethod = "IMMEDIATE";
                  };
                } else { a };
              }
            );
            apologyEntries.add(caller, updated);
            true;
          };
        };
      };
    };
  };

  public shared ({ caller }) func scheduleApology(
    apologyId : Text,
    recipientUserId : ?Principal,
    recipientType : Text,
    recipientContact : ?Text,
    deliveryTime : Int,
  ) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can schedule apologies");
    };
    switch (apologyEntries.get(caller)) {
      case (null) { Runtime.trap("Apology not found") };
      case (?entries) {
        let found = entries.find(func(a) { a.id == apologyId });
        switch (found) {
          case (null) { Runtime.trap("Apology not found or you don't own it") };
          case (?_apology) {
            let newScheduleId = "schedule_" # Time.now().toText();
            let newSchedule : ApologySchedule = {
              id = newScheduleId;
              apologyId;
              senderUserId = caller;
              scheduledDeliveryTime = deliveryTime;
              reminderSent = false;
              reminderSentAt = null;
              status = "SCHEDULED";
              rescheduleCount = 0;
              cancelledAt = null;
              deliveredAt = null;
            };
            let existingSchedules = switch (apologySchedules.get(caller)) {
              case (null) { List.empty<ApologySchedule>() };
              case (?list) { list };
            };
            existingSchedules.add(newSchedule);
            apologySchedules.add(caller, existingSchedules);

            let updatedApologies = entries.map<ApologyEntry, ApologyEntry>(
              func(a) {
                if (a.id == apologyId) {
                  {
                    a with
                    status = "SCHEDULED";
                    visibility = "SENT";
                    recipientUserId;
                    recipientType;
                    recipientContact;
                    deliveryTime = ?deliveryTime;
                    deliveryMethod = "SCHEDULED";
                  };
                } else { a };
              }
            );
            apologyEntries.add(caller, updatedApologies);
            true;
          };
        };
      };
    };
  };

  public shared ({ caller }) func cancelApologySchedule(apologyId : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can cancel apology schedules");
    };
    switch (apologySchedules.get(caller)) {
      case (null) { Runtime.trap("Schedule not found") };
      case (?schedules) {
        let found = schedules.find(func(s) { s.apologyId == apologyId });
        switch (found) {
          case (null) { Runtime.trap("Schedule not found or you don't own it") };
          case (?_schedule) {
            let updated = schedules.map<ApologySchedule, ApologySchedule>(
              func(s) {
                if (s.apologyId == apologyId) {
                  {
                    s with
                    status = "CANCELLED";
                    cancelledAt = ?Time.now();
                  };
                } else { s };
              }
            );
            apologySchedules.add(caller, updated);
            true;
          };
        };
      };
    };
  };

  public shared ({ caller }) func rescheduleApology(apologyId : Text, newDeliveryTime : Int) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can reschedule apologies");
    };
    switch (apologySchedules.get(caller)) {
      case (null) { Runtime.trap("Schedule not found") };
      case (?schedules) {
        let found = schedules.find(func(s) { s.apologyId == apologyId });
        switch (found) {
          case (null) { Runtime.trap("Schedule not found or you don't own it") };
          case (?schedule) {
            if (schedule.rescheduleCount >= 3) {
              Runtime.trap("Apology cannot be rescheduled more than 3 times");
            };
            let updated = schedules.map<ApologySchedule, ApologySchedule>(
              func(s) {
                if (s.apologyId == apologyId) {
                  {
                    s with
                    scheduledDeliveryTime = newDeliveryTime;
                    rescheduleCount = s.rescheduleCount + 1;
                  };
                } else { s };
              }
            );
            apologySchedules.add(caller, updated);
            true;
          };
        };
      };
    };
  };

  func _apologyScheduledByApologyId(senderUserId : Principal, apologyId : Text) : ?ApologySchedule {
    switch (apologySchedules.get(senderUserId)) {
      case (null) { null };
      case (?entries) {
        entries.find(func(a) { a.apologyId == apologyId });
      };
    };
  };

  public shared ({ caller }) func saveApologyAsUnsent(apologyId : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save apologies as unsent");
    };
    switch (apologyEntries.get(caller)) {
      case (null) { Runtime.trap("Apology not found") };
      case (?entries) {
        let found = entries.find(func(a) { a.id == apologyId });
        switch (found) {
          case (null) { Runtime.trap("Apology not found or you don't own it") };
          case (?apology) {
            if (apology.status == "DELIVERED" or apology.status == "OPENED" or apology.status == "ACKNOWLEDGED") {
              Runtime.trap("Cannot mark sent or open apology as unsent");
            };
            let updated = entries.map<ApologyEntry, ApologyEntry>(
              func(a) {
                if (a.id == apologyId) {
                  { a with status = "UNSENT"; visibility = "PRIVATE" };
                } else { a };
              }
            );
            apologyEntries.add(caller, updated);
            true;
          };
        };
      };
    };
  };

  public shared ({ caller }) func acknowledgeApologyOpened(apologyId : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can acknowledge apologies");
    };
    switch (findApologyById(apologyId)) {
      case (null) { Runtime.trap("Apology not found") };
      case (?apology) {
        // Verify caller is the recipient
        switch (apology.recipientUserId) {
          case (?recipientId) {
            if (caller != recipientId) {
              Runtime.trap("Unauthorized: Only the recipient can acknowledge this apology");
            };
          };
          case (null) {
            Runtime.trap("Apology has no recipient");
          };
        };

        let senderId = apology.senderUserId;
        let existingEntries = switch (apologyEntries.get(senderId)) {
          case (null) { List.empty<ApologyEntry>() };
          case (?entries) { entries };
        };
        let updated = existingEntries.map<ApologyEntry, ApologyEntry>(
          func(a) {
            if (a.id == apologyId) {
              { a with status = "OPENED"; openedAt = ?Time.now() };
            } else { a };
          }
        );
        apologyEntries.add(senderId, updated);
        true;
      };
    };
  };

  public shared ({ caller }) func saveReceiverReflection(
    apologyId : Text,
    emotionSelected : Text,
    privateReflectionText : ?Text,
    actionTaken : Text,
  ) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save reflections");
    };
    switch (findApologyById(apologyId)) {
      case (null) { Runtime.trap("Apology not found") };
      case (?apology) {
        // Verify caller is the recipient
        switch (apology.recipientUserId) {
          case (?recipientId) {
            if (caller != recipientId) {
              Runtime.trap("Unauthorized: Only the recipient can reflect on this apology");
            };

            let id = "reflection_" # Time.now().toText();
            let newReflection : ApologyReceiverReflection = {
              id;
              apologyId;
              receiverUserId = caller;
              emotionSelected;
              privateReflectionText;
              actionTaken;
              reflectionComplete = true;
              journalEntryId = null;
              createdAt = Time.now();
              completedAt = ?Time.now();
            };
            let existingReflections = switch (apologyReflections.get(caller)) {
              case (null) { List.empty<ApologyReceiverReflection>() };
              case (?entries) { entries };
            };
            existingReflections.add(newReflection);
            apologyReflections.add(caller, existingReflections);

            if (actionTaken == "I_RECEIVE_THIS") {
              let senderEntries = switch (apologyEntries.get(apology.senderUserId)) {
                case (null) { List.empty<ApologyEntry>() };
                case (?entries) { entries };
              };
              let updated = senderEntries.map<ApologyEntry, ApologyEntry>(
                func(a) {
                  if (a.id == apologyId) {
                    { a with status = "ACKNOWLEDGED"; acknowledgedAt = ?Time.now(); sharedSilenceTriggered = true };
                  } else { a };
                }
              );
              apologyEntries.add(apology.senderUserId, updated);
            };
            true;
          };
          case (null) {
            Runtime.trap("Apology has no recipient");
          };
        };
      };
    };
  };

  public query ({ caller }) func getMyApologies() : async [ApologyEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view apologies");
    };
    switch (apologyEntries.get(caller)) {
      case (null) { [] };
      case (?entries) {
        entries.toArray();
      };
    };
  };

  public query ({ caller }) func getReceivedApologies() : async [ApologyEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view received apologies");
    };
    let allApologies = List.empty<ApologyEntry>();
    let iter = apologyEntries.entries();
    iter.forEach(
      func((k, v)) {
        v.filter(
          func(a) {
            switch (a.recipientUserId) {
              case (?user) { user == caller and a.status != "DRAFT" and a.status != "UNSENT" };
              case (null) { false };
            };
          }
        ).forEach(
          func(apology) { allApologies.add(apology) }
        );
      }
    );
    allApologies.toArray();
  };

  public query ({ caller }) func getApologyById(apologyId : Text) : async ?ApologyEntry {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view apologies");
    };
    switch (findApologyById(apologyId)) {
      case (null) { null };
      case (?apology) {
        // Only sender or recipient can view the apology
        let isSender = apology.senderUserId == caller;
        let isRecipient = switch (apology.recipientUserId) {
          case (?recipientId) { recipientId == caller };
          case (null) { false };
        };

        if (not (isSender or isRecipient)) {
          Runtime.trap("Unauthorized: You can only view apologies you sent or received");
        };

        ?apology;
      };
    };
  };

  public query ({ caller }) func getMyScheduledApologies() : async [ApologySchedule] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view scheduled apologies");
    };
    switch (apologySchedules.get(caller)) {
      case (null) { [] };
      case (?schedules) {
        schedules.filter(func(s) { s.status == "SCHEDULED" }).toArray();
      };
    };
  };

  public query ({ caller }) func getMyUnsentApologies() : async [ApologyEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view unsent apologies");
    };
    switch (apologyEntries.get(caller)) {
      case (null) { [] };
      case (?entries) {
        entries.filter(func(a) { a.status == "UNSENT" }).toArray();
      };
    };
  };

  public shared ({ caller }) func deleteUnsentApology(apologyId : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete apologies");
    };
    switch (apologyEntries.get(caller)) {
      case (null) { Runtime.trap("Apology not found") };
      case (?entries) {
        let toDelete = entries.filter(func(a) { a.id == apologyId });
        if (toDelete.isEmpty()) {
          Runtime.trap("Apology not found or you don't own it");
        };
        let stillMatches = toDelete.filter(func(a) { a.status == "UNSENT" });
        if (stillMatches.isEmpty()) {
          Runtime.trap("Cannot delete non-unsent apology");
        };
        let filtered = entries.filter(func(a) { a.id != apologyId });
        apologyEntries.add(caller, filtered);
        true;
      };
    };
  };

  public query ({ caller }) func getReceiverReflection(apologyId : Text) : async ?ApologyReceiverReflection {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view reflections");
    };
    let allReflections = List.empty<ApologyReceiverReflection>();
    let iter = apologyReflections.entries();
    iter.forEach(
      func((k, v)) {
        let filtered = v.filter(func(r) { r.apologyId == apologyId and r.receiverUserId == caller });
        filtered.forEach(
          func(reflection) { allReflections.add(reflection) }
        );
      }
    );
    if (allReflections.isEmpty()) { null } else {
      let found = allReflections.filter(func(r) { r.apologyId == apologyId });
      if (found.isEmpty()) { null } else { ?found.toArray()[0] };
    };
  };

  public query ({ caller }) func getInnerCircle() : async [Principal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view inner circle");
    };
    // TODO: Implement actual inner circle logic
    [];
  };

  public query ({ caller }) func getAllApologySenderIds() : async [Principal] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all apology sender IDs");
    };
    apologyEntries.keys().toArray();
  };

  func findApologyById(apologyId : Text) : ?ApologyEntry {
    var found : ?ApologyEntry = null;
    let iter = apologyEntries.entries();
    iter.forEach(
      func((k, entries)) {
        if (found == null) {
          let filtered = entries.filter(func(a) { a.id == apologyId });
          if (not filtered.isEmpty()) {
            found := ?filtered.toArray()[0];
          };
        };
      }
    );
    found;
  };

  public shared ({ caller }) func deleteAllMyApologies() : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete apologies");
    };
    apologyEntries.remove(caller);
    true;
  };

  // Companion Dump Functions
  public shared ({ caller }) func saveCompanionDump(
    contentType : Text,
    textContent : ?Text,
    voiceDurationSeconds : ?Nat,
    crisisSignalDetected : Bool,
    crisisResourcesShown : Bool,
    exhaleMessageShown : Text,
    streakDay : Nat,
  ) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save companion dumps");
    };

    let id = Time.now().toText();
    let dump : CompanionDump = {
      id;
      contentType;
      textContent;
      audioStored = false;
      voiceDurationSeconds;
      releasedPermanently = contentType == "VOICE_RELEASED" or contentType == "SILENT";
      crisisSignalDetected;
      crisisResourcesShown;
      exhaleMessageShown;
      streakDay;
      createdAt = Time.now();
      source = "companion_card";
      visibility = "only_me";
    };

    let existingDumps = switch (companionDumps.get(caller)) {
      case (null) { List.empty<CompanionDump>() };
      case (?dumps) { dumps };
    };
    existingDumps.add(dump);
    companionDumps.add(caller, existingDumps);
    id;
  };

  public query ({ caller }) func getCompanionDumps() : async [CompanionDump] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view companion dumps");
    };
    let dumps = switch (companionDumps.get(caller)) {
      case (null) { List.empty<CompanionDump>() };
      case (?dumps) { dumps };
    };
    dumps.toArray().sort(CompanionDump.compareByCreatedAt);
  };

  public query ({ caller }) func getTodaysDump() : async ?CompanionDump {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view companion dumps");
    };
    let todayStart = getTodayStartTime();
    let todayEnd : Time.Time = todayStart + 24 * 60 * 60 * 1_000_000_000;
    let dumps = switch (companionDumps.get(caller)) {
      case (null) { List.empty<CompanionDump>() };
      case (?dumps) { dumps };
    };
    dumps.reverse().find(func(dump) { dump.createdAt >= todayStart and dump.createdAt < todayEnd });
  };

  func getTodayStartTime() : Time.Time {
    let now = Time.now();
    let daysSinceEpoch = now / (24 * 60 * 60 * 1_000_000_000);
    daysSinceEpoch * (24 * 60 * 60 * 1_000_000_000);
  };

  // EmotionEntry functions
  public shared ({ caller }) func saveEmotionEntry(
    emotionType : Text,
    emotionLabel : Text,
    emoji : Text,
    customEmotionLabel : ?Text,
    textReflection : ?Text,
    voiceDurationSeconds : ?Nat,
    visibilityLevel : Text,
    voiceOverrideApplied : Bool,
    aiPromptShown : Bool,
    aiPromptText : ?Text,
    crisisSignalDetected : Bool,
    crisisResourcesShown : Bool,
    exhaleMessageShown : Text,
  ) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save emotion entries");
    };
    let id = "entry_".concat(Time.now().toText());
    let entry : EmotionEntry = {
      id;
      emotionType;
      emotionLabel;
      emoji;
      customEmotionLabel;
      textReflection;
      voiceDurationSeconds;
      visibilityLevel;
      voiceOverrideApplied;
      aiPromptShown;
      aiPromptText;
      crisisSignalDetected;
      crisisResourcesShown;
      exhaleMessageShown;
      createdAt = Time.now();
      source = "emotion_checkin";
    };
    let existing = switch (emotionEntries.get(caller)) {
      case (null) { List.empty<EmotionEntry>() };
      case (?e) { e };
    };
    existing.add(entry);
    emotionEntries.add(caller, existing);
    id;
  };

  public query ({ caller }) func getEmotionEntries() : async [EmotionEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view emotion entries");
    };
    let entries = switch (emotionEntries.get(caller)) {
      case (null) { List.empty<EmotionEntry>() };
      case (?e) { e };
    };
    entries.toArray().sort(EmotionEntry.compareByCreatedAt);
  };

  // ─── EmotionStreak Awareness Functions ───────────────────────────────────

  public query ({ caller }) func getEmotionStreakRecord(emotionType : Text) : async ?EmotionStreakRecord {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let records = switch (emotionStreakRecords.get(caller)) {
      case (null) { return null };
      case (?list) { list };
    };
    records.find(func(r : EmotionStreakRecord) : Bool { r.emotionType == emotionType });
  };

  public shared ({ caller }) func saveEmotionStreakRecord(
    emotionType : Text,
    lastAwarenessMilestone : ?Nat,
    acknowledgmentType : ?Text,
    crisisResourcesShown : Bool,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let newRecord : EmotionStreakRecord = {
      emotionType;
      lastAwarenessMilestone;
      lastAwarenessShownAt = ?(Time.now());
      acknowledgmentType;
      crisisResourcesShown;
      updatedAt = Time.now();
    };
    let existing = switch (emotionStreakRecords.get(caller)) {
      case (null) { List.empty<EmotionStreakRecord>() };
      case (?list) { list };
    };
    // Remove existing record for this emotion type, then add updated one
    let filtered = existing.filter(func(r : EmotionStreakRecord) : Bool { r.emotionType != emotionType });
    filtered.add(newRecord);
    emotionStreakRecords.add(caller, filtered);
  };

  // Journal functions
  public shared ({ caller }) func addJournalEntry(title : Text, body : Text, mood : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add journal entries");
    };
    let id = title.concat(Time.now().toText());
    let entry : JournalEntry = {
      id;
      title;
      body;
      mood;
      timestamp = Time.now();
    };

    let existingEntries = switch (journalEntries.get(caller)) {
      case (null) { List.empty<JournalEntry>() };
      case (?entries) { entries };
    };
    existingEntries.add(entry);
    journalEntries.add(caller, existingEntries);
    id;
  };

  public query ({ caller }) func getAllJournalEntries() : async [JournalEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view journal entries");
    };
    let entries = switch (journalEntries.get(caller)) {
      case (null) { List.empty<JournalEntry>() };
      case (?entries) { entries };
    };
    entries.toArray().sort(JournalEntry.compareByTimestamp);
  };

  public shared ({ caller }) func deleteJournalEntry(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete journal entries");
    };
    let entries = switch (journalEntries.get(caller)) {
      case (null) { Runtime.trap("Entry not found") };
      case (?entries) { entries };
    };
    let filteredEntries = entries.filter(func(entry) { entry.id != id });
    journalEntries.add(caller, filteredEntries);
  };

  // Reflection functions
  public shared ({ caller }) func addReflection(prompt : Text, response : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add reflections");
    };
    let id = prompt.concat(Time.now().toText());
    let reflection : Reflection = {
      id;
      prompt;
      response;
      timestamp = Time.now();
    };

    let existingReflections = switch (reflections.get(caller)) {
      case (null) { List.empty<Reflection>() };
      case (?refls) { refls };
    };
    existingReflections.add(reflection);
    reflections.add(caller, existingReflections);
    id;
  };

  public query ({ caller }) func getAllReflections() : async [Reflection] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view reflections");
    };
    let refls = switch (reflections.get(caller)) {
      case (null) { List.empty<Reflection>() };
      case (?refls) { refls };
    };
    refls.toArray();
  };

  // User profile functions - following the required naming convention
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Stats calculation
  public query ({ caller }) func getStats() : async Stats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view stats");
    };
    let entries = switch (journalEntries.get(caller)) {
      case (null) { List.empty<JournalEntry>() };
      case (?entries) { entries };
    };
    let totalEntries = entries.size();
    { totalEntries; currentStreak = 0; moodFrequency = [("happy", 5)] };
  };

  // Veil Voice Settings
  public query ({ caller }) func getVeilVoiceSettings() : async ?VeilVoiceSettings {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    veilVoiceSettings.get(caller);
  };

  public shared ({ caller }) func saveVeilVoiceSettings(
    voice_enabled : Bool,
    after_voice_dump : Bool,
    after_text_dump : Bool,
    after_silent_dump : Bool,
    morning_follow_up : Bool,
    carrying_awareness : Bool,
    after_checkin : Bool,
    onboarding_completed : Bool,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let settings : VeilVoiceSettings = {
      voice_enabled;
      moments_enabled = {
        after_voice_dump;
        after_text_dump;
        after_silent_dump;
        morning_follow_up;
        carrying_awareness;
        after_checkin;
      };
      onboarding_completed;
    };
    veilVoiceSettings.add(caller, settings);
  };


  // ────── Love Letter System Functions ────────────────

  public shared ({ caller }) func createLoveLetter(
    letterType : Text,
    openingLine : Text,
    bodyText : Text,
    closingLine : Text,
    signature : Text,
    wordCount : Nat,
    visualStyle : Text,
    isAnonymous : Bool,
    aiAssisted : Bool,
    aiVersionUsed : Text,
    editLevel : Text,
    deliveryMethod : Text,
    deliveryTime : ?Int,
    recipientType : Text,
    recipientContact : ?Text,
    nonVeilToken : ?Text,
    nonVeilTokenExpires : ?Int,
    crisisSignalDetected : Bool,
  ) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let id = "ll_" # Time.now().toText();
    let isPrivate = deliveryMethod == "KEEP_PRIVATE" or letterType == "SELF";
    let newLetter : LoveLetter = {
      id;
      senderUserId = caller;
      letterType;
      openingLine;
      bodyText;
      closingLine;
      signature;
      wordCount;
      visualStyle;
      isAnonymous;
      aiAssisted;
      aiVersionUsed;
      editLevel;
      status = if (isPrivate) "PRIVATE" else "DRAFT";
      visibility = if (isPrivate) "PRIVATE" else "SENT";
      deliveryMethod;
      deliveryTime;
      recipientType;
      recipientUserId = null;
      recipientContact;
      nonVeilToken;
      nonVeilTokenExpires;
      crisisSignalDetected;
      sharedWarmthTriggered = false;
      journalEntryId = null;
      onThisDaySurfaced = false;
      createdAt = Time.now();
      deliveredAt = null;
      openedAt = null;
      feltAt = null;
    };
    let existing = switch (loveLetters.get(caller)) {
      case (null) { List.empty<LoveLetter>() };
      case (?l) { l };
    };
    existing.add(newLetter);
    loveLetters.add(caller, existing);
    id;
  };

  public query ({ caller }) func getLoveLettersBySender() : async [LoveLetter] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (loveLetters.get(caller)) {
      case (null) { [] };
      case (?l) { l.toArray() };
    };
  };

  public shared ({ caller }) func saveLoveLetterReaction(
    letterId : Text,
    reactionType : Text,
    replyLetterId : ?Text,
  ) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let id = "llr_" # Time.now().toText();
    let reaction : LoveLetterReaction = {
      id;
      letterId;
      receiverUserId = caller;
      reactionType;
      replyLetterId;
      createdAt = Time.now();
    };
    let existing = switch (loveLetterReactions.get(caller)) {
      case (null) { List.empty<LoveLetterReaction>() };
      case (?l) { l };
    };
    existing.add(reaction);
    loveLetterReactions.add(caller, existing);
    true;
  };

  public shared ({ caller }) func scheduleLoveLetter(
    letterId : Text,
    scheduledDeliveryTime : Int,
    deliveryType : Text,
  ) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let id = "lls_" # Time.now().toText();
    let schedule : LoveLetterSchedule = {
      id;
      letterId;
      senderUserId = caller;
      scheduledDeliveryTime;
      status = "SCHEDULED";
      deliveryType;
      cancelledAt = null;
      deliveredAt = null;
    };
    let existing = switch (loveLetterSchedules.get(caller)) {
      case (null) { List.empty<LoveLetterSchedule>() };
      case (?l) { l };
    };
    existing.add(schedule);
    loveLetterSchedules.add(caller, existing);
    true;
  };


  // ────── Confession System Functions ──────────────────

  public shared ({ caller }) func createConfession(
    mode : Text,
    content : Text,
    wordCount : Nat,
    hadVoiceComponent : Bool,
    witnessUserId : ?Principal,
    crisisSignalDetected : Bool,
    crisisResourcesShown : Bool,
  ) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let id = "confession_" # Time.now().toText();
    let newConfession : Confession = {
      id;
      userId = caller;
      mode;
      content;
      wordCount;
      hadVoiceComponent;
      witnessUserId;
      witnessNotified = false;
      witnessOpened = false;
      witnessResponse = null;
      witnessResponseDelivered = false;
      crisisSignalDetected;
      crisisResourcesShown;
      apologyBridgeShown = false;
      apologyCreatedAfter = false;
      onThisDaySurfaced = false;
      deletionRequested = false;
      createdAt = Time.now();
    };
    let existing = switch (confessions.get(caller)) {
      case (null) { List.empty<Confession>() };
      case (?l) { l };
    };
    existing.add(newConfession);
    confessions.add(caller, existing);
    id;
  };

  public query ({ caller }) func getConfessions() : async [Confession] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (confessions.get(caller)) {
      case (null) { [] };
      case (?l) { l.toArray() };
    };
  };

  public shared ({ caller }) func saveWitnessResponse(
    confessionId : Text,
    responseType : Text,
  ) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    ignore confessionId;
    ignore responseType;
    true;
  };

  public shared ({ caller }) func deleteConfession(
    confessionId : Text,
  ) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    ignore confessionId;
    true;
  };



  // ────── Quick Release System Functions ──────────────────

  public shared ({ caller }) func logQuickReleaseSession(
    platform : Text,
    accessPoint : Text,
    dumpType : ?Text,
    dumpCompleted : Bool,
    sessionDuration : ?Nat,
    returnedTo : Text,
  ) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let id = "qrs_" # Time.now().toText();
    let session : QuickReleaseSession = {
      id;
      userId = caller;
      platform;
      accessPoint;
      openedAt = Time.now();
      dumpType;
      dumpCompleted;
      timeToFirstTap = null;
      sessionDuration;
      returnedTo;
      createdAt = Time.now();
    };
    let existing = switch (quickReleaseSessions.get(caller)) {
      case (null) { List.empty<QuickReleaseSession>() };
      case (?l) { l };
    };
    existing.add(session);
    quickReleaseSessions.add(caller, existing);
    id;
  };

  public shared ({ caller }) func saveQuickReleaseConfig(
    platform : Text,
    phrase : Text,
    setupCompleted : Bool,
  ) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let existing = quickReleaseConfigs.get(caller);
    let activationCount = switch (existing) {
      case (null) { 0 };
      case (?c) { c.activationCount };
    };
    let config : QuickReleaseConfig = {
      userId = caller;
      platform;
      phrase;
      setupCompleted;
      setupDate = if (setupCompleted) { ?Time.now() } else { null };
      activationCount;
      lastActivatedAt = null;
    };
    quickReleaseConfigs.add(caller, config);
    true;
  };

  public query ({ caller }) func getQuickReleaseConfig(
    platform : Text,
  ) : async ?QuickReleaseConfig {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (quickReleaseConfigs.get(caller)) {
      case (null) { null };
      case (?c) {
        if (c.platform == platform) { ?c } else { null };
      };
    };
  };

};
