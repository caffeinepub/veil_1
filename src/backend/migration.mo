import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Principal "mo:core/Principal";

module {
  // Old Types
  type OldJournalEntry = {
    id : Text;
    title : Text;
    body : Text;
    mood : Text;
    timestamp : Time.Time;
  };

  type OldReflection = {
    id : Text;
    prompt : Text;
    response : Text;
    timestamp : Time.Time;
  };

  type OldUserProfile = {
    displayName : Text;
  };

  type OldStats = {
    totalEntries : Nat;
    currentStreak : Nat;
    moodFrequency : [(Text, Nat)];
  };

  type OldActor = {
    journalEntries : Map.Map<Principal, List.List<OldJournalEntry>>;
    reflections : Map.Map<Principal, List.List<OldReflection>>;
    userProfiles : Map.Map<Principal, OldUserProfile>;
  };

  // New Types
  type NewJournalEntry = {
    id : Text;
    title : Text;
    body : Text;
    mood : Text;
    timestamp : Time.Time;
  };

  type NewReflection = {
    id : Text;
    prompt : Text;
    response : Text;
    timestamp : Time.Time;
  };

  type NewUserProfile = {
    displayName : Text;
  };

  type NewStats = {
    totalEntries : Nat;
    currentStreak : Nat;
    moodFrequency : [(Text, Nat)];
  };

  type NewCompanionDump = {
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

  type NewActor = {
    journalEntries : Map.Map<Principal, List.List<NewJournalEntry>>;
    reflections : Map.Map<Principal, List.List<NewReflection>>;
    userProfiles : Map.Map<Principal, NewUserProfile>;
    companionDumps : Map.Map<Principal, List.List<NewCompanionDump>>;
  };

  // Migration Function
  public func run(old : OldActor) : NewActor {
    {
      journalEntries = old.journalEntries;
      reflections = old.reflections;
      userProfiles = old.userProfiles;
      companionDumps = Map.empty<Principal, List.List<NewCompanionDump>>();
    };
  };
};
