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
- ✅ UI Refinements: Absolute-positioned "gelled" task action bars, improved Board layout, and high-contrast dark mode.
- ✅ PWA Install Nudge: Logic to handle `beforeinstallprompt` and a dedicated sidebar button.
- ✅ Firebase Hosting: Live deployment on `checkmate-list.web.app` with custom rewrite rules.
- ✅ Task Links: Auto-detection and rendering of URLs as clickable icons in task text.
- ✅ Command Palette: `Ctrl+K` interface for global project switching and task search.
- ✅ Onboarding Experience: Visual welcome tour for new users with a Chess-themed sample project ("Grandmaster Path").
- ✅ Settings Panel: Centralized hub for profile management, onboarding reset, data export, and full account wiping.
- ✅ Data Portability: JSON export tool and bulk task list importer for seamless project creation.
- ✅ Accessibility: Comprehensive `aria-label` coverage, keyboard focus states, and SR-compliant dialogs.

## 🛠️ Next Steps / Roadmap

### 🔴 High Priority (Immediate)
1. **Auto-clear Workflow:** Option to automatically move or archive completed tasks after a configurable time window.

### 🔵 Low Priority (Analytics & Scale)
2. **Custom Subdomain Deployment:** Transition hosting from default `.web.app` to a dedicated subdomain.
3. **Project Stats:** Add detailed analytics (velocity tracking, completion trends).

---
*Last Updated: April 12, 2026*
