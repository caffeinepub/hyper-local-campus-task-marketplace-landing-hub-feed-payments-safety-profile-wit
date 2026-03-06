# PROXIIS — Complete Profile Flow

## Current State

The app has a SheetDB-based auth system (`useSheetAuth`, `sheetdb.ts`) where:
- Google Sign-In and Email/Password sign-up save `user_id`, `name`, `email`, and optionally `password_hash` to the SheetDB users sheet via `saveUserToSheet()`.
- After successful sign-up/sign-in, the user is immediately considered "logged in" and sees their profile dashboard.
- The `SheetUser` type only holds `user_id`, `name`, `email`.
- The SheetDB `users` sheet already exists at `https://sheetdb.io/api/v1/xslj9jybiwh8t`.
- The Profile dashboard shows Name and Email in "Personal Information" but does not show Phone Number, Student ID (SBU ID), or UPI ID.

## Requested Changes (Diff)

### Add
- A new `CompleteProfileView` (full-screen or modal-style) shown after initial authentication (both Google Sign-In and Email/Password) for **new users only** (i.e., users who were just created, not returning users).
- This screen asks for: Full Name, Phone Number, Student ID (SBU ID), UPI ID.
- On Submit, PATCH/update the user's row in the SheetDB users sheet with `full_name`, `phone_number`, `student_id`, `upi_id` columns.
- The session object and localStorage should store whether the user has completed profile setup (a `profile_complete` boolean flag) so returning users skip this screen.
- New utility function `updateUserProfile(user_id, profileData)` in `sheetdb.ts` that sends a PATCH request to SheetDB to update the row matching the user's `user_id`.
- New function `getUserById(user_id)` in `sheetdb.ts` to fetch a user's full row including the new columns.

### Modify
- `SheetUser` interface in `sheetdb.ts`: add optional fields `full_name`, `phone_number`, `student_id`, `upi_id`.
- `SheetSession` interface in `useSheetAuth.ts`: add optional `profile_complete: boolean` and the four new optional fields.
- `useSheetAuth.loginWithGoogle` and `useSheetAuth.signUpWithEmail`: after successful auth, detect if the user is **new** (just created) vs **returning** (existed). Return or expose a `isNewUser` flag.
- `AuthModal.tsx`: after a successful Google Sign-In or Email sign-up (new user only), instead of calling `handleSuccess()` which closes the modal, trigger showing the CompleteProfile screen. For returning users (login), call `handleSuccess()` as before.
- `ProfileView.tsx` (Dashboard step): add Phone Number, Student ID, and UPI ID rows in the "Personal Information" card, reading from the SheetDB session.
- `App.tsx`: add a `"complete-profile"` view type and render `CompleteProfileView` when active.

### Remove
- Nothing removed.

## Implementation Plan

1. **`sheetdb.ts`**: 
   - Extend `SheetUser` with `full_name?`, `phone_number?`, `student_id?`, `upi_id?`.
   - Add `updateUserProfile(user_id, data)` — PATCH to `https://sheetdb.io/api/v1/xslj9jybiwh8t/user_id/{user_id}?sheet=users` with the profile fields.
   - Add `getUserById(user_id)` — GET to search by user_id.

2. **`useSheetAuth.ts`**: 
   - Extend `SheetSession` with `profile_complete?`, `full_name?`, `phone_number?`, `student_id?`, `upi_id?`.
   - In `loginWithGoogle`: if user already exists, set `profile_complete: true` (or check if fields are filled). If new user, set `profile_complete: false`.
   - In `signUpWithEmail`: new user, always set `profile_complete: false`.
   - In `loginWithEmail`: returning user, set `profile_complete: true` (or check fields).
   - Expose `isNewUser` or derive `needsProfileCompletion` from session.
   - Add `saveProfileDetails(user_id, full_name, phone_number, student_id, upi_id)` function that calls `updateUserProfile`, then updates session with new data and `profile_complete: true`.

3. **`CompleteProfileView.tsx`** (new component/view):
   - Fullscreen page matching the dark neon PROXIIS theme (same glassmorphism dark card style as AuthModal and ProfileView).
   - Title: "Complete Your Profile"
   - Subheading: "Just a few more details to get you started on PROXIIS."
   - Four input fields: Full Name (pre-filled from auth name), Phone Number (tel input), Student ID / SBU ID (text), UPI ID (text, e.g. name@upi).
   - Submit button calls `saveProfileDetails`, then calls `onComplete()` which navigates to hub or profile.
   - Skip option ("Skip for now") that sets `profile_complete: true` without saving optional fields, to avoid trapping the user.

4. **`AuthModal.tsx`**:
   - After Google sign-up/sign-in (new user) and email sign-up success, instead of calling `handleSuccess()`, call a new `onNeedsProfileCompletion()` callback prop.
   - On login (returning user), keep existing `handleSuccess()` behavior.

5. **`App.tsx`**:
   - Add `"complete-profile"` to the `View` type.
   - Render `<CompleteProfileView>` when `currentView === "complete-profile"`.
   - Pass `onComplete` that navigates to `"hub"`.

6. **`ProfileView.tsx`** (dashboard step):
   - In the Personal Information card, add rows for Phone Number, Student ID, and UPI ID using `sheetUser.phone_number`, `sheetUser.student_id`, `sheetUser.upi_id`.
   - Show "Not provided" for unfilled fields.
