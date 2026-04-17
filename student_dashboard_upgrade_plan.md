# 🎓 Student Dashboard Master Plan: The 9.5+ Path (High Detail, Zero Risk)

> **Objective:** Systematically transform the technical-debt-ridden Student Dashboard into a production-grade, maintainable, and fully Supabase-integrated system *without* altering the current layout, UX/UI, colors, buttons, or workflows.

Because we have files like `CourseViewPage.tsx` sitting at **7,054 lines**, executing changes blindly is dangerous. This plan breaks the upgrade into **ultra-safe Micro-Phases**. Every phase is designed to be executable in isolation without breaking the app.

---

## 🤖 STRICT RULES OF ENGAGEMENT FOR AI (KIRO)
*Before executing any phase below, Kiro must adhere to these absolute constraints:*

1. **The "One File Per Call" Rule:** Kiro must **NEVER** attempt to extract multiple components from a 3k-7k line file in a single tool call. Massive file replacements lead to truncation and corruption. Extract exactly ONE modal/tab per tool action.
2. **The Dependency Dragnet:** When Kiro extracts a component, he must explicitly trace and extract **all required imports** (Lucide icons, Types, framer-motion, sub-components, and utility hooks). Extracting JSX without resolving the imports *will* break the app.
3. **The State Isolation Principle:** `CourseViewPage.tsx` has massive top-level `useState` hooks. When extracting a child tab/modal, Kiro must properly pass the state down via strict typed props. Pure prop-drilling is required for Phase 1 stability. Do not prematurely invent Contexts during Phase 1.
4. **The `useEffect` Infinite Loop Warning:** When swapping synchronous fake data for asynchronous Supabase calls in Phase 4, Kiro must ensure dependency arrays in `useEffect` hooks are strictly bounded to avoid DDoSing the Supabase backend.
5. **The Visual Freeze:** Unless explicitly instructed in Phase 6, Kiro is forbidden from "optimizing" layout CSS. All padding, flexbox logic, and hex colors must remain exactly as found.
6. **The Rollback Mandate:** Kiro must utilize `git add . && git commit -m "pre-extraction backup"` (or maintain a `.bak` copy) *before* attempting to hollow out a 7,000-line file. If `tsc` fails post-extraction and cannot be fixed in 1 attempt, revert the file immediately.
7. **No Hallucinated Tables:** Kiro must only use schemas verified in `docs/supabase-setup.sql`. Any required new tables (e.g., Focus Mode) must be explicitly vetted via `CREATE TABLE IF NOT EXISTS` scripts before code is written.
8. **The Theme/CSS Variable Trap:** The student dashboard likely uses global CSS variables (e.g., `var(--bg-surface)`). Kiro must double-check that extracted components don't accidentally drop crucial CSS class wrappers that connect them to the dark/light mode themes.
9. **The `AnimatePresence` Breakage Rule:** Be extremely careful traversing `<AnimatePresence>` boundaries from `framer-motion`. When extracting a conditionally rendered modal into a new file, do not leave `<motion.div>` pieces disconnected from their parent keys. Failure means exit animations (`exit={{ opacity: 0 }}`) will instantly vanish upon extraction.
10. **LocalStorage Storage Separation:** DO NOT reuse `elms_grading_drafts` or teacher-specific keys. When saving student state (e.g., last focused tab), use `elms_student_...` prefixes to prevent cross-contamination if a user role switches.
11. **The Environment Variable Blockade:** Before beginning Phase 3 (Supabase wiring), Kiro MUST explicitly read the user's `.env` or `.env.local` file. If `VITE_SUPABASE_URL` and `anon_key` are missing or set to placeholder strings like `your-project-url`, Kiro must permanently halt execution and ask the user to provide real keys. Do not attempt to debug network payloads if the keys are missing.

---

## 🛑 Phase 0: Baseline & Safety Verification
**Goal:** Establish a secure foundation before altering any code.

* **0.1 Baseline Type Check:** Run `npx tsc --noEmit`. Fix any existing dashboard errors.
* **0.2 Routing Integrity:** Document exactly how `StudentDashboard` navigates between tabs. Ensure all string literals (`"overview"`, `"grades"`) are bound to TypeScript enums/types so routing doesn't secretly break during extractions.
* **0.3 Visual Snapshotting:** Note exact HEX colors, margins, and animations. Our golden rule: **Absolutely zero visual or functional regression.** 

---

## 🛠️ Phase 1: Safe Component Decomposition (Pure Copy-Paste)
**Goal:** Break down the massive monoliths without modifying **a single line of logic or style**. 

* **Phase 1.1: `CourseViewPage.tsx` (7,054 lines)** -> Extract Modals to `modals/`, Tabs to `tabs/`.
* **Phase 1.2: `GroupsContent.tsx` (5,522 lines)** -> Extract List Views, Detail Views, Modals.
* **Phase 1.3: `GoalsContent.tsx` & `UsersContent.tsx`** -> Extract components.
* **Phase 1.4: `StudentDashboard.tsx` (2,640 lines)** -> Isolate Sidebar, Header.

---

## 🗄️ Phase 2: Database Schema & Migration Review
**Goal:** Ensure the backend is explicitly prepared for real data binding.

* **Phase 2.1: Reconcile Ground Truth SQL**
  * Honor `docs/supabase-setup.sql` as the primary blueprint.
  * Use `docs/supabase-auth-migration.sql` purely for Row-Level Security (RLS) enforcement.
* **Phase 2.2: Identify & Patch Database Gaps**
  * If Focus Mode or Group Chat tables are missing, draft *non-destructive* additions.
* **Phase 2.3: Realtime Publication Activation**
  * **Critical:** Supabase Realtime fails silently if the table isn't added to the publication. Ensure `alter publication supabase_realtime add table GroupChat;` (or equivalent) is executed in the SQL scripts.
* **Phase 2.4: Storage Bucket Verification (The 403 Trap):**
  * Assignment uploads and Chat file attachments WILL fail with a `403 Forbidden` error if the Supabase Storage buckets do not explicitly exist with configured RLS policies. Validate the creation of `task-attachments` and `chat-attachments` buckets in the SQL schema before writing upload code.

---

## 🌉 Phase 3: Service Layer Generation (The Anti-Fake Data Bridge)
**Goal:** Prepare all Supabase logic in isolated `.ts` files *before* touching the UI components.

* **Phase 3.1: Academic Services:** Build `studentCourseService.ts`.
* **Phase 3.2: Submission Services:** Build `studentTaskService.ts` for file uploads to Supabase storage.
* **Phase 3.3: Realtime Services:** Build `studentChatService.ts` using `supabase.channel()`.
* **Phase 3.4: Productivity Services:** Build `studentGoalService.ts`.

---

## 🔌 Phase 4: Component Integration (Swapping the Fake Data)
**Goal:** Wire the Phase 3 services into the Phase 1 components.

* **Phase 4.1: Profile & Home Stats (`HomeContent`)**
  * Hydrate from `supabase.auth.getSession()` and `student_stats`.
* **Phase 4.2: Course Population (`CourseViewPage`)**
  * Loop real DB courses. **Do not prematurely delete `MOCK_COURSES`**; keep both existing temporarily to compare rendering parity.
* **Phase 4.3: Interactive Actions**
  * Wire Submit Assignment and Group Chat buttons. Use native Toasts for error handling.

---

## ⚡ Phase 5: State & Prop Drilling Relief
**Goal:** Eliminate unmaintainable prop drilling caused by Component Splitting.

* **Phase 5.1: Context Providers**
  * Introduce `StudentCourseContext` and `StudentGroupContext` ONLY after the UI is perfectly stable.
* **Phase 5.2: Deep Memoization**
  * Use `React.memo` aggressively on long course/chat lists to prevent the new real-time hooks from lagging the browser.

---

## ♿ Phase 6: Core Polish & Maintenance Eradication
**Goal:** Hit the elite benchmark (9.0+) achieved by the Teacher dashboard.

* **Phase 6.1: Type Safety Enforcement**
  * Purge `type: any` inside the student dashboard. Lock components to `Database` schema types.
* **Phase 6.2: Accessibility Hardening**
  * Inject `useFocusTrap`, `aria-live="polite"`, and `role="dialog"` throughout.
* **Phase 6.3: Safe Inline Style Extraction**
  * Convert purely static `style={{ background: '#FF4433' }}` into strictly equivalent Tailwind classes (`bg-[#FF4433]`). **Ignore dynamic javascript styles.**

---

## 🚀 Phase 7: Performance & Lazy Loading (The Final Form)
**Goal:** Prevent initial page load from crashing due to bundle size.

* **Phase 7.1: Component Code Splitting (`React.lazy`)**
  * If we extract 30 Modals and Tabs out of `CourseViewPage.tsx` and instantly import them all at the top of the file, the Javascript payload will still crush low-end devices. Kiro must wrap non-critical Modals and hidden Tabs in `React.lazy()` loaded with a `<Suspense>` boundary to ensure instantaneous dashboard load times.
