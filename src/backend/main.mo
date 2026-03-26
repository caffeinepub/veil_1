import List "mo:core/List";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Nat64 "mo:core/Nat64";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Order "mo:core/Order";
import Map "mo:core/Map";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Migration "migration";

(with migration = Migration.run)
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

  // Initialize authorization state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Persistent storage
  let journalEntries = Map.empty<Principal, List.List<JournalEntry>>();
  let reflections = Map.empty<Principal, List.List<Reflection>>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let companionDumps = Map.empty<Principal, List.List<CompanionDump>>();

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

  // Legacy profile functions for backward compatibility
  public shared ({ caller }) func updateProfile(displayName : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update profile");
    };
    let profile : UserProfile = { displayName };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
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
};
