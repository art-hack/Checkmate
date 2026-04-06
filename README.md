# ♟️ CheckMate

**CheckMate** is a modern, multi-project task management Progressive Web App (PWA) designed for strategic precision. It allows you to manage complex projects with hierarchical tasks, parallel checklists, and a unified dashboard for a "command center" view of your work.

---

## 🚀 Key Features

- **The Board (Unified Dashboard):** A master view that aggregates active tasks from all projects into a single "Up Next" perspective.
- **Smart Quick-Add:** Use the `@` symbol (e.g., `"Design logo @Marketing"`) to automatically route and save tasks to specific projects.
- **Parallel Checklists:** Organize projects with side-by-side lists (e.g., "Documentation", "Coding") to manage concurrent workflows.
- **Recursive Nested Tasks:** Support for multi-level nesting (Task -> Subtask -> Sub-subtask) to break down complex objectives.
- **Project Health Indicator:** A custom progress bar that fills as tasks are completed. Achieving 100% triggers a satisfying "King" chess piece animation.
- **PWA Ready:** Installable on mobile and desktop with offline caching support.
- **Modern UI:** Built with a Slate Gray/Off-White theme, featuring "Action Indigo" and "Victory Green" accents.

---

## 🛠️ Technical Stack

- **Frontend:** [React 19](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite 8](https://vitejs.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) (CSS-first configuration)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Backend/Auth:** [Firebase](https://firebase.google.com/) (Firestore & Authentication)
- **Icons:** [Lucide React](https://lucide.dev/)
- **PWA:** [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)

---

## ⚙️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Checkmate
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add your Firebase credentials (see `.env.example` for the required keys):
   ```bash
   cp .env.example .env
   ```
   Fill in your actual Firebase project details in the `.env` file.

4. **Start the development server:**
   ```bash
   npm run dev
   ```

---

## 🧪 Testing and Quality

To ensure the project maintains high standards:

- **Linting:** Run `npm run lint` to check for code style and potential errors.
- **Production Build:** Run `npm run build` to verify the TypeScript compilation and build process.
- **Preview:** After building, run `npm run preview` to test the production-ready application locally.

---

## 🤝 Contributing

We welcome contributions! To maintain consistency, please follow these guidelines:

1. **Code Style:** Use functional components and React hooks. Adhere to the Tailwind CSS v4 utility patterns.
2. **Branching:** Create a feature branch for your changes (`git checkout -b feature/amazing-feature`).
3. **Commits:** Use clear, descriptive commit messages.
4. **Pull Requests:** Ensure your code passes linting and builds successfully before submitting a PR.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
