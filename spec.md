# PROXIIS Campus Marketplace

## Current State

- Auth: Google Sign-In and Email/Password both work via SheetDB. Password is SHA-256 hashed and stored in `pasword_hash` column H.
- Profile Completion: `CompleteProfileView` collects `full_name`, `phone_number`, `student_id`, `upi_id`. `updateUserProfile` in `sheetdb.ts` PATCHes by `user_id` column — correct. However, edge cases exist where 404 errors can still occur if a session stores a UUID `user_id` that was later renamed to a handle.
- History: No `performer_history` or `poster_history` sheets are used anywhere. Task completion is handled only via ICP canister calls (CompleteTaskModal → useCompleteTask/useVerifyTask).
- Profile Dashboard: SheetDB users see a "Welcome to PROXIIS" placeholder card instead of their task history. ICP users see "My Posts" pulled from the canister. There are no "Tasks I've Done" or "Tasks I've Posted" sections pulling from the SheetDB history sheets.

## Requested Changes (Diff)

### Add

1. **`sheetdb.ts`** — Two new SheetDB utility functions:
   - `logPerformerHistory(user_id, task_id, amount, date)`: POST to `https://sheetdb.io/api/v1/xslj9jybiwh8t?sheet=performer_history` with fields `user_id`, `task_id`, `amount`, `date`.
   - `logPosterHistory(user_id, task_id, amount_paid, performer_name)`: POST to `https://sheetdb.io/api/v1/xslj9jybiwh8t?sheet=poster_history` with fields `user_id`, `task_id`, `amount_paid`, `performer_name`.
   - `getPerformerHistory(user_id)`: GET from `performer_history` sheet filtered by `user_id`. Returns array of `{task_id, amount, date}`.
   - `getPosterHistory(user_id)`: GET from `poster_history` sheet filtered by `user_id`. Returns array of `{task_id, amount_paid, performer_name}`.

2. **`useTaskHistory.ts`** (new hook) — Two React Query hooks:
   - `usePerformerHistory(user_id)`: calls `getPerformerHistory`.
   - `usePosterHistory(user_id)`: calls `getPosterHistory`.

3. **`ProfileView.tsx`** — "Tasks I've Done" and "Tasks I've Posted" sections for SheetDB users:
   - Replace the current "Welcome to PROXIIS" placeholder card with two list sections.
   - "Tasks I've Done" pulls from `performer_history` filtered by `currentUser.user_id`, showing `task_id`, `amount` (₹), and `date`.
   - "Tasks I've Posted" pulls from `poster_history` filtered by `currentUser.user_id`, showing `task_id`, `amount_paid` (₹), and `performer_name`.
   - Each list shows a loading skeleton and an empty state.

4. **Task completion flow** — When a task is marked complete (in `CompleteTaskModal` or wherever `useCompleteTask` succeeds), simultaneously log to both history sheets:
   - Log to `performer_history` for the performer: `user_id = performer.toString()`, `task_id`, `amount = task.price`, `date = today`.
   - Log to `poster_history` for the poster: `user_id = task.creator.toString()`, `task_id`, `amount_paid = task.price`, `performer_name = performer.toString()`.
   - Since SheetDB users may not have their ICP principal stored, do a best-effort POST; failures should not block task completion.

### Modify

1. **`sheetdb.ts` — `updateUserProfile`**: Already uses `user_id` as the lookup key (PATCH by `user_id/<value>`). Confirm no `username` column references remain. Add explicit error handling: if the PATCH returns 404, log a warning rather than throwing, to avoid blocking the profile-complete flow.

2. **`useSheetAuth.ts` — `saveProfileDetails`**: After a successful `updateUserProfile` call, the session must be updated with `profile_complete: true` and the new values. This already exists but should be confirmed to use the original `user_id` from the session (not a renamed handle).

3. **`CompleteProfileView.tsx`**: After calling `saveProfileDetails`, ensure it calls `onComplete()` even if the PATCH returned a non-throwing 404 (so the user is not stuck). The `updateUserProfile` change above (graceful 404) handles this.

### Remove

- Nothing to remove.

## Implementation Plan

1. **`src/frontend/src/utils/sheetdb.ts`**:
   - Add `PerformerHistoryRow` and `PosterHistoryRow` types.
   - Add `logPerformerHistory(user_id, task_id, amount, date)` — POST to `?sheet=performer_history`.
   - Add `logPosterHistory(user_id, task_id, amount_paid, performer_name)` — POST to `?sheet=poster_history`.
   - Add `getPerformerHistory(user_id)` — GET/search `performer_history` filtered by `user_id`.
   - Add `getPosterHistory(user_id)` — GET/search `poster_history` filtered by `user_id`.
   - In `updateUserProfile`: catch 404 responses and log a warning instead of throwing.

2. **`src/frontend/src/hooks/useTaskHistory.ts`** (new file):
   - `usePerformerHistory(user_id: string | undefined)` — React Query hook calling `getPerformerHistory`.
   - `usePosterHistory(user_id: string | undefined)` — React Query hook calling `getPosterHistory`.

3. **`src/frontend/src/components/CompleteTaskModal.tsx`**:
   - After `completeMutation.mutateAsync` succeeds AND the task is then verified via `verifyMutation.mutateAsync`, call both `logPerformerHistory` and `logPosterHistory` in a `Promise.allSettled` (fire-and-forget, don't block).
   - Alternatively, hook into `onSuccess` of `useVerifyTask` mutation to do the logging. Use today's date (ISO string) for the `date` field.

4. **`src/frontend/src/views/ProfileView.tsx`**:
   - Import `usePerformerHistory` and `usePosterHistory` from the new hook.
   - Call both hooks when `sheetUser` is present, passing `sheetUser.user_id`.
   - Replace the SheetDB-user "Welcome to PROXIIS" placeholder card with two new cards:
     - "Tasks I've Done" card: shows performer history rows in a list. Each row: task ID (short), amount (₹), date.
     - "Tasks I've Posted" card: shows poster history rows in a list. Each row: task ID (short), amount paid (₹), performer name.
     - Both include loading skeletons and empty states with descriptive messages.
