# Specification

## Summary
**Goal:** Add a floating action button (FAB) in the bottom-right corner of the HubView that opens the existing PostTaskModal.

**Planned changes:**
- Add a fixed circular FAB with a '+' icon to the bottom-right corner of the HubView (bottom-6 right-6, high z-index)
- Style the FAB using the app's green-to-purple gradient consistent with other primary controls
- Wire the FAB's click handler to open the existing PostTaskModal component
- Ensure the FAB is visible on both mobile and desktop layouts

**User-visible outcome:** Users on the HubView can click the bottom-right '+' button at any time to open the task creation modal and post a new task.
