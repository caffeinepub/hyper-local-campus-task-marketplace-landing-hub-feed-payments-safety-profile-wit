# Specification

## Summary
**Goal:** Gate the profile view behind an account creation flow and add a user stats dashboard to the ProfileView.

**Planned changes:**
- Clicking the profile icon in HubTopBar when no profile exists launches an onboarding flow: Internet Identity authentication → optional Google Sign-In for Gmail linking → profile details form
- Clicking the profile icon when a profile already exists goes directly to the dashboard
- Add a dashboard section inside ProfileView with four stat cards: Tasks Completed, User Rating (average stars), Total Ratings, and Tasks Posted
- Stat cards use the existing PROXIIS neon/dark theme with green-to-purple gradient accents and show a loading skeleton while fetching
- Update the backend Profile type in `backend/main.mo` to include `tasksCompleted`, `averageRating`, `totalRatingsReceived`, and `tasksPosted` fields, initialized to zero defaults
- Update `getCallerProfile` (or equivalent) to return these fields; ensure task completion and rating mutations update them correctly

**User-visible outcome:** Users are guided through account creation before accessing their profile, and once inside the profile view they can see a live dashboard showing their task and rating statistics.
