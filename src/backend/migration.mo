import Map "mo:core/Map";
import Principal "mo:core/Principal";
import List "mo:core/List";
import Time "mo:core/Time";

module {
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

  type OldActor = {
    journalEntries : Map.Map<Principal, List.List<JournalEntry>>;
    reflections : Map.Map<Principal, List.List<Reflection>>;
    userProfiles : Map.Map<Principal, UserProfile>;
    companionDumps : Map.Map<Principal, List.List<CompanionDump>>;
    emotionEntries : Map.Map<Principal, List.List<EmotionEntry>>;
    emotionStreakRecords : Map.Map<Principal, List.List<EmotionStreakRecord>>;
    veilVoiceSettings : Map.Map<Principal, VeilVoiceSettings>;
  };

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

  type NewActor = {
    journalEntries : Map.Map<Principal, List.List<JournalEntry>>;
    reflections : Map.Map<Principal, List.List<Reflection>>;
    userProfiles : Map.Map<Principal, UserProfile>;
    companionDumps : Map.Map<Principal, List.List<CompanionDump>>;
    emotionEntries : Map.Map<Principal, List.List<EmotionEntry>>;
    emotionStreakRecords : Map.Map<Principal, List.List<EmotionStreakRecord>>;
    veilVoiceSettings : Map.Map<Principal, VeilVoiceSettings>;
    apologyEntries : Map.Map<Principal, List.List<ApologyEntry>>;
    apologyReflections : Map.Map<Principal, List.List<ApologyReceiverReflection>>;
    apologySchedules : Map.Map<Principal, List.List<ApologySchedule>>;
  };

  public func run(old : OldActor) : NewActor {
    {
      old with
      apologyEntries = Map.empty<Principal, List.List<ApologyEntry>>();
      apologyReflections = Map.empty<Principal, List.List<ApologyReceiverReflection>>();
      apologySchedules = Map.empty<Principal, List.List<ApologySchedule>>();
    };
  };
};
