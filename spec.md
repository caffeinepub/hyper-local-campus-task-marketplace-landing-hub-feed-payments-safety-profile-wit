# PROXIIS Campus Marketplace

## Current State
The app has a full authentication flow with Google Sign-In and Email/Password options via SheetDB. A `CompleteProfileView` screen already exists and asks for Full Name, Phone Number, Student ID, and UPI ID. The `saveProfileDetails` function patches these fields to the SheetDB users sheet. The Profile page dashboard already renders these fields from the session.

However, there is a bug: `loginWithEmail` in `useSheetAuth.ts` hardcodes `profile_complete: true` for all returning email users, regardless of whether they actually completed their profile (i.e., have `full_name`, `phone_number`, `student_id`, `upi_id` in the sheet). This means returning email users who skipped profile completion are never redirected to the Complete Profile screen.

Additionally, the `AuthModal` (used in HubView and ProfileView) correctly calls `onNeedsProfileCompletion` for Google sign-up and email sign-up, but for email **login** of returning users who haven't completed their profile, it calls `handleSuccess()` unconditionally without checking profile completeness.

## Requested Changes (Diff)

### Add
- Logic in `loginWithEmail` to detect incomplete profiles (missing `full_name` or `phone_number`) and set `profile_complete: false` in the session, so returning incomplete users are also redirected to Complete Profile.

### Modify
- `useSheetAuth.ts` → `loginWithEmail`: change `profile_complete: true` to dynamically compute it based on whether `full_name` and `phone_number` exist in the fetched user record.
- `AuthModal.tsx` → `handleEmailSignIn`: after a successful login, call `checkNeedsProfileCompletion()` and route to profile completion if needed (same as sign-up does).

### Remove
- Nothing removed.

## Implementation Plan
1. Fix `loginWithEmail` in `useSheetAuth.ts` to set `profile_complete` based on actual data: `!!(user.full_name && user.phone_number)`.
2. Fix `handleEmailSignIn` in `AuthModal.tsx` to check `checkNeedsProfileCompletion()` after success and call `onNeedsProfileCompletion?.()` if needed (instead of always calling `handleSuccess()`).
3. Validate and deploy.
