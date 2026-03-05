# PROXIIS - Campus Marketplace

## Current State
The app is a full-stack campus task marketplace. The frontend has:
- LandingView, HubView, ProfileView pages
- TaskCard, TaskDetailsSheet components
- HubTopBar with Search, Bell, Trophy, and Profile icons
- TaskDetailsSheet includes a "Discuss on Telegram" button (opens external Telegram link) and a creator-only toggle to enable/disable chat
- The backend (main.mo) handles tasks, profiles, and a toggleTelegramDiscussion flag
- App.tsx uses a simple `View` type with 'landing' | 'hub' | 'profile'

## Requested Changes (Diff)

### Add
- A new `chat` view type in App.tsx's View union
- A new `DMView` (or `ChatView`) component that shows a DM inbox — list of all conversations the logged-in user has had, ordered by most recent message (Instagram-like)
- Each conversation is tied to a specific task (task title shown as context)
- Within a conversation, users can send and receive messages in real time
- A chat message icon (MessageSquare) in HubTopBar that navigates to the chat/DM view — visible alongside the existing Search, Bell, Trophy, Profile icons
- A new `sendMessage` and `getMessages` backend API to store and retrieve chat messages between two principals for a specific task
- Chat messages stored in backend: `{ id, taskId, sender, recipient, text, timestamp }`
- A `getConversations` backend API that returns all conversations for the caller (grouped by taskId + other user)

### Modify
- In `TaskDetailsSheet`: replace "Discuss on Telegram" button text and action with "Discuss on Chat" — clicking it navigates to the DM view pre-loaded with the conversation between the task creator and the current viewer (not opening external Telegram link)
- The existing toggle still works — when chat is disabled, the "Discuss on Chat" button is greyed out/non-functional (same behavior as before)
- `App.tsx`: Add `chat` to the View type; render the new ChatView/DMView when `currentView === 'chat'`
- `HubView.tsx`: Pass `onNavigate` correctly so navigation to 'chat' works; receive `selectedTaskId` context for opening a specific DM thread
- `HubTopBar.tsx`: Add a MessageSquare icon button that navigates to the chat view

### Remove
- The external `buildTelegramLink` usage inside the "Discuss" button handler in TaskDetailsSheet (replaced with in-app navigation)

## Implementation Plan
1. Backend: Add `ChatMessage` type, `sendMessage(taskId, recipientPrincipal, text)`, `getMessages(taskId, otherUser)`, and `getConversations()` APIs to main.mo
2. Frontend hooks: Create `useChat` hooks (useSendMessage, useGetMessages, useGetConversations) consuming the new backend APIs
3. New `DMView` component: Full-screen chat view with left sidebar showing conversation list (task title, other user name, last message preview) and right panel showing the message thread with input box
4. Modify `TaskDetailsSheet`: Replace `handleDiscuss` to navigate to chat view with taskId + recipientPrincipal context instead of opening Telegram
5. Modify `HubTopBar`: Add MessageSquare icon button navigating to 'chat'
6. Modify `App.tsx`: Add 'chat' to View type; add state for `chatContext` (taskId + recipientPrincipal); pass context to DMView; render DMView when currentView === 'chat'
7. Modify `HubView`: Forward chat navigation with context from TaskDetailsSheet
