import Array "mo:core/Array";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";


import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import AccessControl "authorization/access-control";

// Apply migration

actor {
  // Types
  type TaskId = Nat;

  public type Stars = {
    #one;
    #two;
    #three;
    #four;
    #five;
  };

  public type VerificationData = {
    performer : Principal;
    taskId : TaskId;
    rating : Stars;
  };

  // Only public types need manual text conversion
  module Stars {
    public func toText(stars : Stars) : Text {
      switch (stars) {
        case (#one) { "1" };
        case (#two) { "2" };
        case (#three) { "3" };
        case (#four) { "4" };
        case (#five) { "5" };
      };
    };
  };

  // User Profiles (for user metadata)
  public type UserProfile = {
    name : Text;
    gmailAddress : ?Text;
    postHistory : [TaskId];
  };

  // Task Profiles (for task performance metrics)
  public type Profile = {
    tasksCompleted : Nat;
    earnings : Nat;
    ratingSum : Nat;
    ratingCount : Nat;
  };

  module Profile {
    public func compare(p1 : Profile, p2 : Profile) : Order.Order {
      Nat.compare(p2.earnings, p1.earnings);
    };
  };

  // Tasks
  public type Task = {
    id : TaskId;
    creator : Principal;
    title : Text;
    category : Text;
    price : Nat;
    location : Text;
    safeSpot : Text;
    telegramHandle : Text;
    taskPhoto : Storage.ExternalBlob;
    isCompleted : Bool;
    performer : ?Principal;
    verificationPhoto : ?Storage.ExternalBlob;
    isVerified : Bool;
    deadline : ?Time.Time;
    telegramDiscussionEnabled : Bool;
  };

  var nextTaskId = 0;

  let tasks = Map.empty<TaskId, Task>();
  let profiles = Map.empty<Principal, Profile>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Mixins
  include MixinStorage();
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  func generateTaskId() : TaskId {
    let current = nextTaskId;
    nextTaskId += 1;
    current;
  };

  func calcRatingValue(stars : Stars) : Nat {
    switch (stars) {
      case (#one) { 1 };
      case (#two) { 2 };
      case (#three) { 3 };
      case (#four) { 4 };
      case (#five) { 5 };
    };
  };

  // User Profile API (needed for catalog)
  public shared ({ caller }) func createUserProfileWithGoogle(name : Text, gmailAddress : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create profiles");
    };
    let profile : UserProfile = {
      name;
      gmailAddress = ?gmailAddress;
      postHistory = [];
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    // Personal information (gmailAddress) is only accessible by the profile owner or admins
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      // Return profile without personal information for other users
      switch (userProfiles.get(user)) {
        case (?profile) {
          ?{
            name = profile.name;
            gmailAddress = null;
            postHistory = profile.postHistory;
          };
        };
        case (null) { null };
      };
    } else {
      // Return full profile for the owner or admins
      userProfiles.get(user);
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func updateUserProfile(name : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };

    let existingProfile = switch (userProfiles.get(caller)) {
      case (null) {
        Runtime.trap("Profile does not exist. Please create a profile first.");
      };
      case (?profile) { profile };
    };

    let updatedProfile = { existingProfile with name };
    userProfiles.add(caller, updatedProfile);
  };

  // Task APIs with Telegram Flag Management
  func processFilteredTasks(task : Task) : Bool {
    not task.isCompleted;
  };

  public shared ({ caller }) func createTask(
    title : Text,
    category : Text,
    price : Nat,
    location : Text,
    safeSpot : Text,
    telegramHandle : Text,
    photo : Storage.ExternalBlob,
    deadline : ?Time.Time,
  ) : async TaskId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can create tasks");
    };

    let id = generateTaskId();
    let task : Task = {
      id;
      creator = caller;
      title;
      category;
      price;
      location;
      safeSpot;
      telegramHandle;
      taskPhoto = photo;
      isCompleted = false;
      performer = null;
      verificationPhoto = null;
      isVerified = false;
      deadline;
      telegramDiscussionEnabled = true; // Default enabled
    };

    tasks.add(id, task);

    // Update user's post history
    let updatedProfile = switch (userProfiles.get(caller)) {
      case (null) {
        Runtime.trap("Profile does not exist. Please create a profile first.");
      };
      case (?profile) {
        { profile with postHistory = profile.postHistory.concat([id]) };
      };
    };
    userProfiles.add(caller, updatedProfile);

    id;
  };

  public shared ({ caller }) func deleteTask(taskId : TaskId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can delete tasks");
    };

    switch (tasks.get(taskId)) {
      case (?task) {
        if (task.creator != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only the task creator or admins can delete this task");
        };
        tasks.remove(taskId);
      };
      case (null) {
        Runtime.trap("Task not found");
      };
    };
  };

  public query ({ caller }) func getTasks() : async [Task] {
    // Public endpoint - no authorization required (guests can view tasks)
    tasks.values().toArray().filter(processFilteredTasks);
  };

  func taskMatchesSearch(task : Task, search : Text) : Bool {
    task.title.contains(#text search) or task.category.contains(#text search) or task.location.contains(#text search);
  };

  public query ({ caller }) func searchTasks(search : Text) : async [Task] {
    // Public endpoint - no authorization required (guests can search tasks)
    let filtered = tasks.entries().toArray().filter(func((_, task)) { taskMatchesSearch(task, search) });
    filtered.map(func((_, task)) { task });
  };

  public shared ({ caller }) func toggleTelegramDiscussion(taskId : Nat, enabled : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can toggle telegram discussion");
    };

    switch (tasks.get(taskId)) {
      case (?task) {
        if (task.creator != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only the task creator or admins can change this setting");
        };
        let updatedTask = { task with telegramDiscussionEnabled = enabled };
        tasks.add(taskId, updatedTask);
      };
      case (null) {
        Runtime.trap("Task not found");
      };
    };
  };

  public shared ({ caller }) func assignPerformer(taskId : TaskId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can assign themselves to tasks");
    };

    switch (tasks.get(taskId)) {
      case (?task) {
        if (task.isCompleted or task.performer != null) {
          Runtime.trap("Task already claimed or completed");
        };
        let updated = {
          task with performer = ?caller;
        };
        tasks.add(taskId, updated);
      };
      case (null) { Runtime.trap("Task not found") };
    };
  };

  public shared ({ caller }) func completeTask(
    taskId : TaskId,
    photo : Storage.ExternalBlob,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can complete tasks");
    };

    switch (tasks.get(taskId)) {
      case (?task) {
        if (task.performer != ?caller) {
          Runtime.trap("Unauthorized: You can only complete tasks assigned to you");
        };
        if (task.isCompleted) {
          Runtime.trap("Task already marked as completed");
        };
        let updated = {
          task with 
          verificationPhoto = ?photo;
          isCompleted = true;
        };
        tasks.add(taskId, updated);
      };
      case (null) { Runtime.trap("Task not found") };
    };
  };

  public shared ({ caller }) func verifyTask(
    taskId : TaskId,
    rating : Stars,
    performer : Principal,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can verify tasks");
    };

    switch (tasks.get(taskId)) {
      case (?task) {
        if (task.creator != caller) {
          Runtime.trap("Unauthorized: Only the task creator can verify and rate completion");
        };

        if (task.isVerified) {
          Runtime.trap("Task verification already completed");
        };

        if (not task.isCompleted) {
          Runtime.trap("Task must be marked as completed before verification");
        };

        if (task.performer != ?performer) {
          Runtime.trap("Performer mismatch: provided performer does not match task assignment");
        };

        let updatedTask = { task with isVerified = true };
        tasks.add(taskId, updatedTask);

        let currentProfile = switch (profiles.get(performer)) {
          case (null) {
            { tasksCompleted = 0; earnings = 0; ratingSum = 0; ratingCount = 0 };
          };
          case (?profile) { profile };
        };

        let updatedProfile = {
          currentProfile with
          tasksCompleted = currentProfile.tasksCompleted + 1;
          earnings = currentProfile.earnings + task.price;
          ratingSum = currentProfile.ratingSum + calcRatingValue(rating);
          ratingCount = currentProfile.ratingCount + 1;
        };

        profiles.add(performer, updatedProfile);
      };
      case (null) { Runtime.trap("Task not found") };
    };
  };

  public query ({ caller }) func getProfile(user : Principal) : async Profile {
    // Public endpoint - no authorization required (anyone can view task performance profiles)
    switch (profiles.get(user)) {
      case (?profile) { profile };
      case (null) {
        {
          tasksCompleted = 0;
          earnings = 0;
          ratingSum = 0;
          ratingCount = 0;
        };
      };
    };
  };

  public query ({ caller }) func getLeaderboard() : async [Profile] {
    // Public endpoint - no authorization required (anyone can view leaderboard)
    profiles.values().toArray().sort();
  };

  public query ({ caller }) func getCommentsForTask(_taskId : Nat) : async [(Text, Text, Text)] {
    // Public endpoint - no authorization required (anyone can view comments)
    [];
  };

  public query ({ caller }) func getTasksByUser(user : Principal) : async [Task] {
    // Post history is part of user profile data and should follow similar privacy rules
    // Only the user themselves or admins can view the complete task history
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own task history");
    };

    let userProfile = switch (userProfiles.get(user)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) { profile };
    };

    userProfile.postHistory.map(
      func(taskId) {
        tasks.get(taskId);
      }
    ).filter(
      func(task) {
        task != null;
      }
    ).map(
      func(task) {
        switch (task) {
          case (?t) { t };
          case (null) { Runtime.trap("Task not found") };
        };
      }
    );
  };
};
