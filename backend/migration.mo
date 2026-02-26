import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  type OldProfile = {
    tasksCompleted : Nat;
    earnings : Nat;
    ratingSum : Nat;
    ratingCount : Nat;
  };

  type OldActor = {
    profiles : Map.Map<Principal, OldProfile>;
  };

  type NewProfile = {
    tasksCompleted : Nat;
    earnings : Nat;
    ratingSum : Nat;
    ratingCount : Nat;
    tasksPosted : Nat;
  };

  type NewActor = {
    profiles : Map.Map<Principal, NewProfile>;
  };

  public func run(old : OldActor) : NewActor {
    let updatedProfiles = old.profiles.map<Principal, OldProfile, NewProfile>(
      func(_user, oldProfile) {
        { oldProfile with tasksPosted = 0 };
      }
    );
    { profiles = updatedProfiles };
  };
};
