# 📁 StudyBuddyPro - Project Structure Guide

> **Quick Reference:** This document explains what each folder contains and where to find things.
> Perfect for new developers or anyone exploring the codebase!

---

## 🏠 Root Folders Overview

```
📦 StudyBuddyPro
├── 🎯 src/           → Main website code (React components, pages, logic)
├── 🌐 public/        → Static files (images, icons, sounds)
├── 📚 docs/          → Documentation & database setup files
├── 🔧 server/        → Backend server code
├── ⚙️  backend/       → Python backend services
├── 📦 dist/          → Built website (auto-generated, don't edit!)
├── 📁 node_modules/  → Installed packages (auto-generated)
└── 🛠️  Config files   → Settings for build tools
```

---

## 🎯 src/ — The Heart of the Website

This is where all the main code lives. Here's what's inside:

```
src/
├── 📄 App.tsx              → Main app component (routes & layout)
├── 📄 main.tsx             → Entry point (starts the app)
│
├── 📱 pages/               → Full page views (what users see)
├── 🧩 components/          → Reusable UI pieces
├── 🔌 services/            → Database & API connections
├── 📚 lib/                 → Helper functions & utilities
├── 🎨 styles/              → CSS stylesheets
├── 🔄 contexts/            → Shared state (React Context)
├── 🪝 hooks/               → Custom React hooks
├── 📝 types/               → TypeScript type definitions
└── 🖼️  assets/              → Images & media used in code
```

---

## 📱 Pages — What Users See

Each folder = one page or section of the website:

| Folder | What It Shows |
|--------|---------------|
| `DashboardPage/` | Main dashboard with widgets, stats, calendar |
| `HomeContent/` | Home tab content with courses overview |
| `CatalogContent/` | Course catalog & browsing |
| `GroupsContent/` | Study groups list & management |
| `GroupChatPage/` | Real-time group chat with study tools |
| `ToolsContent/` | Academic tools (grammar, citations, etc.) |
| `GoalsContent/` | Personal goals & progress tracking |
| `PathsContent/` | Learning paths & course sequences |
| `UsersContent/` | User management (for teachers/admin) |
| `CourseViewPage/` | Individual course details |
| `StudentLogin/` | Login page for students |
| `JoinGroupPage/` | Join study group via invite link |

### 📂 Page Folder Structure (Example: DashboardPage)
```
DashboardPage/
├── DashboardPage.tsx    → Main page component
├── index.ts             → Export file
├── types.ts             → TypeScript types for this page
├── constants.ts         → Fixed values (colors, labels)
├── utils.ts             → Helper functions
├── components/          → Small pieces used only here
├── hooks/               → Custom hooks for this page
└── widgets/             → Dashboard widget components
```

---

## 🧩 Components — Reusable Building Blocks

```
components/
├── 🎨 ui/                  → Basic UI elements
│   ├── primitives/         → Buttons, inputs, cards
│   ├── dropdowns/          → Dropdown menus
│   ├── modals/             → Popup dialogs
│   ├── toolbar/            → Toolbar components
│   └── misc/               → Other small UI pieces
│
├── 🛠️  tools/               → Academic tool components
│   ├── grammar/            → Grammar checker parts
│   ├── CitationGenerator   → Citation tool
│   ├── Paraphraser         → Text paraphrasing
│   ├── PlagiarismChecker   → Plagiarism detection
│   ├── TextSummarizer      → Text summarization
│   └── WordCounter         → Word/character counter
│
├── 📊 dashboard/           → Dashboard-specific components
├── 🏠 landing/             → Landing page components
├── 💬 modals/              → App-wide modal dialogs
├── 🔄 shared/              → Components used everywhere
└── ✨ motion-primitives/   → Animation components
```

---

## 🔌 Services — Talking to the Database

Each service handles one type of data:

| Service | What It Does |
|---------|--------------|
| `authService` | Login, logout, user sessions |
| `databaseService` | Core database operations |
| `studyTimeService` | Track study hours & streaks |
| `goalsService` | Manage student goals |
| `achievementsService` | Badges & achievements |
| `activityService` | Recent activity feed |
| `deadlinesService` | Assignment due dates |
| `gradePredictorService` | Grade predictions |
| `catalogService` | Course catalog data |
| `pathsService` | Learning paths |
| `groupsService` | Study groups |
| `chatService` | Group chat messages |
| `taskService` | Assignments & tasks |
| `usersService` | User management |
| `profileService` | User profiles |

---

## 📚 lib/ — Helper Functions & Utilities

```
lib/
├── 🔧 utils.ts             → General helper functions
├── 📄 pdfUtils.ts          → PDF file handling
├── 🗄️  supabase.ts          → Database connection
│
├── 📝 grammar/             → Grammar checking logic
├── 💬 chat/                → Chat message processing
├── 🔄 converters/          → File format converters
├── ✍️  paraphrase/          → Text paraphrasing logic
└── 🔍 plagiarism/          → Plagiarism detection logic
```

---

## 🎨 styles/ — CSS Stylesheets

| File | What It Styles |
|------|----------------|
| `index.css` | Global styles & Tailwind imports |
| `dashboard.css` | Dashboard page styles |
| `home-content.css` | Home tab styles |
| `intro.css` | Welcome/intro animations |
| `settings-modal.css` | Settings popup styles |
| `notification-toast.css` | Toast notification styles |
| `responsive-optimization.css` | Mobile/tablet adjustments |

---

## 🌐 public/ — Static Files

Files here are served directly to users:

```
public/
├── 🖼️  images/              → App images & backgrounds
├── 🔊 sounds/              → Notification sounds
├── 📄 file.svg             → File icon
├── 📄 vite.svg             → Vite logo
└── 📄 pdf.worker.min.mjs   → PDF processing worker
```

---

## 📚 docs/ — Documentation

```
docs/
└── supabase-setup.sql      → Database setup script
```

---

## ⚙️ Config Files (Root)

| File | Purpose |
|------|---------|
| `package.json` | Project info & dependencies |
| `vite.config.ts` | Build tool settings |
| `tailwind.config.js` | Tailwind CSS settings |
| `tsconfig.json` | TypeScript settings |
| `eslint.config.js` | Code style rules |
| `postcss.config.js` | CSS processing |
| `components.json` | shadcn/ui component settings |
| `.env.local` | Secret keys (never commit!) |
| `index.html` | Main HTML template |

---

## 🚀 Quick Tips

### Finding Things Fast

- **"Where's the login page?"** → `src/pages/StudentLogin/`
- **"Where are the buttons?"** → `src/components/ui/primitives/`
- **"How do we save to database?"** → `src/services/`
- **"Where's the chat logic?"** → `src/pages/GroupChatPage/` + `src/services/chatService.ts`
- **"Where are the styles?"** → `src/styles/`

### Adding New Features

1. **New page?** → Create folder in `src/pages/`
2. **New reusable component?** → Add to `src/components/`
3. **New database operation?** → Add to `src/services/`
4. **New helper function?** → Add to `src/lib/`

---

## 📊 Project Stats

- **Framework:** React 18 + TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Build Tool:** Vite
- **UI Components:** shadcn/ui

---

*Last updated: December 2025*
