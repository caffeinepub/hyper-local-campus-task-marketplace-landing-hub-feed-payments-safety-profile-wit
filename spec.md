# Specification

## Summary
**Goal:** Fix the AuthPromptBar so it never incorrectly displays a "dismissed" state on load or when a new protected action is triggered.

**Planned changes:**
- Ensure the dismissed state is only set when the user explicitly closes the AuthPromptBar during the current session.
- Reset the dismissed state whenever a new protected action triggers the auth prompt.
- Clear the dismissed state on navigation away or page reload so no stale state persists across sessions.

**User-visible outcome:** The AuthPromptBar no longer shows a "Sign in was dismissed" message unexpectedly; it only shows that message after the user has actively dismissed it, and resets properly for new prompts.
