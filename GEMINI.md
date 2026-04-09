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
- **Auto-routing:** Bypasses selection if only one checklist exists.

### Project & Task Migration
- **Project Deletion:** Sidebar supports project removal with a safety confirmation dialog.
- **Task Migration:** Root tasks can be moved between projects and sections via a portaled menu.

### Done Workflow
- **Strategic Separation:** Horizontal divider between "Active Checklists" and "Mission Accomplished".
- **Robustness:** Orphaned tasks (whose checklists were deleted) are automatically grouped under "Uncategorized".
- **Achievement States:** Projects at 100% progress display a "Checkmate" (Crown) badge.

## 🚀 Current Status

- ✅ Firebase Auth & Firestore Persistence: Real-time cloud sync secured by user UID with robust timestamp handling.
- ✅ System-Level Inbox: Automatic initialization and top-level Command Center placement.
- ✅ Sidebar project management (Create/Switch/Delete/Duplicate).
- ✅ Collapsible Sidebar: Toggleable minimized state with centered icons and tooltips.
- ✅ Task & Checklist management: Recursive editing, reordering, and themed deletion logic.
- ✅ Task Enrichment: Added support for due dates (with overdue warnings), priority levels (Green/Orange/Red), and strategic sorting on The Board.
- ✅ UI Refinements: Simplified task action bar with a consolidated "More" menu, stable layout transitions, and improved contrast for dark mode.
- ✅ Performance & SEO: Manual chunking, sourcemaps, meta tags, and robots.txt.
- ✅ Accessibility: Comprehensive `aria-label` coverage and keyboard focus states.

## 🛠️ Next Steps / Roadmap

1. **Project Stats:** Add detailed analytics (velocity tracking, completion trends).
2. **Smart Notifications:** Browser push notifications for upcoming deadlines.
3. **Global Search:** Command palette (`Ctrl+K`) for instant project/task jumping.

---
*Last Updated: April 8, 2026*
