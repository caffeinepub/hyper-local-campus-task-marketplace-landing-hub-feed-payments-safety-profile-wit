# Specification

## Summary
**Goal:** Wire the existing floating action button (FAB) on the HubView page so that clicking it opens the PostTaskModal, using the same auth/profile guard logic already in place.

**Planned changes:**
- Connect the FAB's `onClick` handler in HubView to open the existing PostTaskModal.
- Reuse the existing auth/profile guard logic (same as TaskCard clicks) to prompt unauthenticated users or users without a profile appropriately.
- After successful task submission via the modal, refresh the task list on HubView to include the new task.

**User-visible outcome:** Users can click the plus FAB on the Hub page to post a new task directly. Unauthenticated users or those without a profile are guided through the existing prompt flow, and authenticated users with a profile see the PostTaskModal open immediately.
