<div align="center">

<br/>

<img src="https://img.shields.io/badge/STI-eLMS-0066FF?style=for-the-badge&labelColor=000000&fontSize=24" alt="STI eLMS" height="42"/>

<br/><br/>

# ✦ STI eLMS — Enhanced Learning Management System

**A Premium, Full-Stack Redesign & Case Study of the STI College Learning Management System**

*Case Study Project by* ***Josiah De Asis*** *| 1st Year, STI College*

<br/>

[![React 19](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=000)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=fff)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=fff)](https://vitejs.dev)
<br/>
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=fff)](https://tailwindcss.com)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=fff)](https://www.framer.com/motion/)
[![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=fff)](https://supabase.com)
[![Dexie](https://img.shields.io/badge/Dexie.js-007ACC?style=for-the-badge&logo=sqlite&logoColor=fff)](https://dexie.org/)

<br/>

> **⭐ If you find this project impressive or inspiring, drop a star — it means the world to me!**

<br/>

---

</div>

## 🎯 Project Overview

**STI eLMS** is an ambitious, ground-up redesign of the official STI College Learning Management System, reimagined to meet modern SaaS-grade standards and premium UX paradigms. 

Rather than a simple visual reskin, this project serves as a comprehensive case study on how educational platforms can integrate **real-time backend systems**, **offline-first local databases**, **AI-assisted study companion tools**, and **fluid, physics-based micro-interactions** to drastically improve student engagement and productivity.

> [!NOTE]  
> **Disclaimer:** This is **not** the official STI eLMS. This is a personal academic case study developed independently for educational purposes.

---

## 🚀 Key Architectural Highlights & Engineering Patterns

This codebase implements several advanced full-stack and frontend development patterns:

### 1. Offline-First Synchronization Architecture
*   **Dual-Database Sync:** Combines **Dexie.js (IndexedDB)** for local state caching with **Supabase (PostgreSQL)** for persistence.
*   **Zero-Latency Interactions:** Student goals, streaks, tasks, and settings are written instantly to Dexie.js for a lag-free UI experience.
*   **Background Sync Engine:** Mutated local data is automatically queued and synced to Supabase when network connectivity is available, providing seamless offline capability.

### 2. Enterprise-Quotas for Free: Multi-Account API Key Rotation System
To enable advanced features (like AI paraphrasing, plagiarism checking, PDF generation, and AI grading) without incurring usage fees, this project features a custom client-side API Key Rotation System.
*   **How it works:** Keys are stored in an array within the environment file. The application tracks active usage and limits. If an API key encounters a `429 Too Many Requests` or quota exhaustion error, the engine automatically switches to the next account's key.
*   **Enabled Quotas:**
    *   **Google Gemini (AI Grading):** 5 rotated keys providing up to **7,500 free requests/day** and **75 requests/minute**.
    *   **Groq API (AI Paraphraser):** 5 rotated keys providing **72,000 free requests/day**.
    *   **iLovePDF API (PDF Tools):** 5 rotated keys providing **1,250 document conversions/month**.
    *   **Adobe PDF Services (PDF Conversion):** 5 rotated keys providing **2,500 document actions/month**.

### 3. Highly Fluid & Responsive Design System
*   **12-Column Bento Grid Layout:** The student dashboard utilizes a flexible CSS Grid that scales seamlessly across ultra-wide monitors, laptops, and tablets.
*   **Collapsible Quick-View Widget Sidebar:** Collapses into a clean compact mode, housing streak summaries, XP progress, calendar agendas, weather widgets, and developer utilities.
*   **Mobile iOS-Style Dock Navigation:** A floating bottom navigation menu with spring-based hide/show transitions triggered by page scroll direction.
*   **Smooth High-Performance Charts:** Custom reactive charts powered by `@visx` scales and `framer-motion` svg paths, optimized for stagger-animated load rendering without layout thrashing.

---

## ✨ Feature Breakdown

<table>
  <tr>
    <td width="50%" valign="top">
      <h3>🏠 Student Dashboard</h3>
      <ul>
        <li><strong>Study Streak Gamification:</strong> Visual streak tracking calendar, multiplier calculations, and XP points leveling engine.</li>
        <li><strong>Adaptive Weather Widget:</strong> Dynamic weather card displaying time-based greetings and weather-specific styling.</li>
        <li><strong>Daily Inspiration Banner:</strong> Rotates motivational quotes and displays desktop notifications.</li>
        <li><strong>Agenda Widget:</strong> Collapsible daily schedule listing deadlines, classes, and exams.</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h3>📚 Course Management</h3>
      <ul>
        <li><strong>Interactive Course Cards:</strong> Features overall progress rings, next assignment countdowns, and quick-access syllabus.</li>
        <li><strong>Resource Viewer:</strong> Full-screen document viewer supporting dynamic PDF-to-Word conversions.</li>
        <li><strong>Activity Timelines:</strong> Beautiful chronological lines displaying grading release dates and submission feedback.</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>🛠️ Built-in AI Study Tools</h3>
      <ul>
        <li><strong>Grammar Checker:</strong> Highlights grammatical errors and suggests improvements in real-time.</li>
        <li><strong>Paraphraser & Summarizer:</strong> Powered by Gemini/Groq, allowing customizable tone and length settings.</li>
        <li><strong>Citation Generator:</strong> Instant formatters for APA, MLA, and Chicago styles.</li>
        <li><strong>Plagiarism Checker:</strong> Multi-engine checker utilizing academic web search APIs.</li>
        <li><strong>GPA Calculator:</strong> Interactive simulator to predict and track semester grade-point averages.</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h3>📊 Goals & Learning Paths</h3>
      <ul>
        <li><strong>Personal Goal Hub:</strong> Interface to set daily/weekly study hour targets and assignment completion goals.</li>
        <li><strong>Staggered 90-Day Analytics Chart:</strong> A custom visx bar chart visualising progress, designed with safe animation timers and responsive axes.</li>
        <li><strong>Recommended Paths:</strong> Curated steps recommending courses based on user interests.</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>👥 Social & Communication</h3>
      <ul>
        <li><strong>Real-Time Group Chat:</strong> Supabase realtime channels powered channel feeds supporting emoji reactions and thread replies.</li>
        <li><strong>Inbox Messaging:</strong> Peer-to-peer student mailbox with online presence indicators.</li>
        <li><strong>Smart Notifications:</strong> Priority indicators (Critical, High, Normal) grouping similar alerts.</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h3>👨‍🏫 Teacher & Admin Dashboards</h3>
      <ul>
        <li><strong>Grade Book Panel:</strong> Student submissions lists, rubrics calculators, and automated AI grading helpers.</li>
        <li><strong>Course Builder:</strong> Dynamic syllabus editor with files attachments management.</li>
        <li><strong>Database Monitor:</strong> Admin tools to check syncing statuses, API keys rotation logs, and cache controls.</li>
      </ul>
    </td>
  </tr>
</table>

---

## 🏗️ Technical Stack & Dependencies

| Layer | Technology | Purpose & Description |
| :---: | :--- | :--- |
| **⚛️** | **React 19** | Modern UI framework implementing state-of-the-art hooks, concurrent features, and suspense boundaries. |
| **🔷** | **TypeScript** | Strict compile-time type-safety across all components, services, database models, and helper methods. |
| **⚡** | **Vite** | Build tool and dev server featuring lightning-fast Hot Module Replacement (HMR) and optimized Rollup bundles. |
| **🎨** | **Tailwind CSS** | Styling foundation leveraging customizable design tokens, grid layout systems, and custom theme utility variables. |
| **🎬** | **Framer Motion** | Physics-based animation library driving page transitions, dock menus, sidebar snaps, and micro-hover states. |
| **🗄️** | **Supabase** | PostgreSQL database service hosting auth tables, real-time channels, file storage, and relational schemas. |
| **💾** | **Dexie.js** | IndexedDB wrapper implementing offline-first client storage, reactive live queries, and background sync logic. |
| **📈** | **Visx & Recharts** | D3-based React visualization primitives for custom, lightweight rendering of data analytics. |

---

## 📂 Codebase Architecture

```
elms-react/
├── src/
│   ├── components/
│   │   ├── shared/          # App-wide UI wrappers (e.g. ErrorBoundary, LoadingSuspense)
│   │   └── ui/              # Atom-level primitive design system components
│   │       ├── dropdowns/   # Popup elements (QuickSettings, ThemeSwitchers, Streaks)
│   │       ├── modals/      # Dialog interfaces (GettingStarted, FAQ, ProfileEdit)
│   │       ├── effects/     # Dynamic visual feedback (PixelBlast, VariableProximity)
│   │       └── misc/        # Utility UI toggles, indicators, and buttons
│   ├── pages/
│   │   └── studentdashboard/
│   │       ├── components/  # Main layout nodes (Header, Collapsible Sidebar, Mobile Dock)
│   │       ├── content/     # Tab components (Home, Courses, Goals, Paths, Study Tools)
│   │       └── widgets/     # Bento grid modules (Weather, Agenda Calendar, XP progress)
│   ├── services/            # Supabase API handlers and Dexie sync manager engines
│   ├── hooks/               # Custom hooks (useTheme, useSupabaseAuth, useLiveQuery)
│   ├── styles/              # Global variables, scrollbars, and keyframe animations
│   ├── App.tsx              # Root router configuration and global context providers
│   └── main.tsx             # Application entrypoint
├── public/                  # Static assets and images
├── tailwind.config.js       # Core theme overrides and bento grid configs
└── tsconfig.json            # Strict TypeScript configuration
```

---

## 🚀 Local Installation & Set Up

Follow these steps to run the project locally on your machine:

### Prerequisites
*   [Node.js](https://nodejs.org) (v18 or higher recommended)
*   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
*   A [Supabase](https://supabase.com) account (free tier works perfectly)

### Step 1: Clone the Repository
```bash
git clone https://github.com/VidZid2/STI.git
cd STI
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
1. Duplicate the `.env.example` file and rename it to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Open `.env.local` and input your project credentials:
   *   **Supabase URL/Key:** Retrieve these from your Supabase Dashboard under **Project Settings > API**.
   *   **Third-party APIs:** To enable AI grading, summarization, grammar check, or PDF conversion, add keys for **Gemini, Groq, Adobe, iLovePDF, Copyleaks, or Google Search** (you can use your own key, or multiple keys separated for rotation).

### Step 4: Run the Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your web browser.

### Step 5: Build for Production
To build the application for hosting:
```bash
npm run build
```
The optimized bundle will be compiled into the `dist/` directory, configured for zero-configuration deployments on Vercel.

---

## ⚠️ Copyright, Academic Integrity & License

<div align="center">

> **© 2025-2026 Josiah De Asis. All Rights Reserved.**

</div>

> [!CAUTION]  
> **This project is a personal academic case study and is NOT open-source software.**
>
> **You are strictly prohibited from:**
> *   Cloning, copying, or downloading this codebase to submit as your own work.
> *   Reusing design patterns, source code blocks, or custom assets in other academic submissions.
> *   Redistributing or hosting modified copies of this project under your own name.
>
> This repository is public **exclusively for deployment hosting, portfolio review, and demonstration purposes**. 
> 
> **Plagiarism is a serious academic offense.** If you submit this code as your own coursework or case study, you risk severe academic sanctions, including failing grades, suspension, or expulsion from your educational institution.

---

## 📬 Contact & Support

<div align="center">

| | |
| :---: | :--- |
| 👤 | **Josiah De Asis** |
| 🏫 | STI College (1st Year Case Study) |
| 🐙 | [@VidZid2](https://github.com/VidZid2) |

<br/>

```
Created with passion, intensive design iterations, and a massive amount of coffee.
```

<sub>© 2025-2026 Josiah De Asis · STI College · Case Study Portfolio</sub>

</div>
