# CheckMate Project Context

This file serves as the primary context for Gemini CLI sessions. It summarizes the current state of the CheckMate PWA, technical architecture, and pending roadmap.

## 🏗️ Technical Architecture

- **Framework:** React 19 (TS) + Vite 8.
- **Styling:** Tailwind CSS v4 (CSS-first config) with custom theme:
  - `action-indigo`: `#6366f1`
  - `victory-green`: `#10b981`
  - `strategy-black`: `#0f172a`
- **Backend:** Firebase (Firestore + Auth).
- **Authentication:** Google Auth Provider via `signInWithPopup`.
- **PWA:** Managed via `vite-plugin-pwa` with offline support.

## 📋 Core Implementation Details

### Data Schema
- **Projects:** Owners of multiple checklists.
- **Checklists:** Side-by-side columns (Parallel workflows).
- **Tasks:** Recursive objects supporting infinite nesting.

### Smart Quick-Add
- Uses a regex parser: `^(.*?)\s*@([^@]+)$`.
- **Two-Step Routing:** 
  1. Parse project name from `@Project` (supports spaces).
  2. Prompt user to select a specific section (checklist) from a dropdown.
- Autocomplete: Shows project suggestions when typing `@`.
- **Inbox Routing:** Tasks added without a project tag land in the system-level **"Inbox"** project.

### Project & Task Migration
- **Project Deletion:** Sidebar supports project removal with a safety confirmation dialog.
- **Task Migration:** Root tasks can be moved between projects and sections. Migrating a root task automatically moves all its nested subtasks to maintain hierarchy.

### Done Workflow
- **Strategic Separation:** Horizontal divider between "Active Checklists" and "Mission Accomplished".
- **Robustness:** Orphaned tasks (whose checklists were deleted) are automatically grouped under "Uncategorized".
- **Achievement States:** Projects at 100% progress display a "Checkmate" (Crown) badge in the sidebar with unique styling.

## 🚀 Current Status

- ✅ React/Vite/TS/PWA Boilerplate.
- ✅ Firebase Auth & Firestore setup (Environment variables secured).
- ✅ Sidebar project management (Create/Switch/Delete).
- ✅ Task & Checklist editing (Double-click/Icons).
- ✅ Responsive wide-screen layout.
- ✅ Recursive TaskItem components with Project Migration and corrected tree alignment.
- ✅ Inline Task Creation: Quick-add tasks directly within checklist columns.
- ✅ Drag-and-Drop Reordering: Rearrange tasks within checklists using intuitive drag handles.
- ✅ Custom Native Dialogs: Replaced browser confirm with a themed, glassmorphic ConfirmationDialog.
- ✅ Collapsible Sidebar: Sidebar can now be toggled to a minimized icon-only state with centered icons and tooltips.
- ✅ Strategic Sidebar Organization: "The Board" and "Inbox" are top-level items, followed by Active Projects and "Checkmated" (completed) sections.
- ✅ Project Templates: Ability to duplicate an entire project, with an option to include or exclude existing tasks.
- ✅ UI Refinements: Improved Smart Quick-Add flow (direct project-to-section routing) and Board usability.

## 🛠️ Next Steps / Roadmap

1. **Persistence Logic:** Replace local mock state in `App.tsx` with real-time Firestore listeners (`onSnapshot`).
2. **Task Reordering:** Implement drag-and-drop for tasks and checklist columns.
3. **Project Stats:** Add detailed analytics (e.g., velocity, completion trends).
4. **Notifications:** Push notifications for task deadlines.

---
*Last Updated: April 6, 2026*
