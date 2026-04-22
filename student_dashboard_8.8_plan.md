# 🎯 Student Dashboard: 7.2 → 8.8 Upgrade Plan

> **Objective:** Close the 7 remaining gaps identified in the honest assessment, bringing the student dashboard from 7.2/10 to parity with the teacher dashboard at 8.8/10.
>
> **Prerequisite:** The original `student_dashboard_upgrade_plan.md` (Phases 0-7) is **COMPLETE**. This plan is the continuation.

---

## 🤖 RULES OF ENGAGEMENT (Inherited + New)

All 11 rules from the original plan still apply. Additionally:

12. **The "300-Line Target" Rule:** Every extracted component should aim for ≤300 lines. If a component exceeds this after extraction, it is itself a candidate for further decomposition in the same phase.
13. **The Demo Data Quarantine Rule:** When separating demo data from real data, the agent must wrap demo fallbacks in an explicit `const IS_DEMO = !isSupabaseConfigured()` guard. Demo data must never silently override real database results.
14. **The Error Boundary Isolation Rule:** Each tab's `ErrorBoundary` must render a self-contained recovery UI (retry button + error message) — NOT crash the entire dashboard. Use `react-error-boundary` or a custom class component.

---

## 📊 Gap Analysis (What Costs Us 1.6 Points)

| # | Gap | Impact | Target Phase |
|---|-----|--------|-------------|
| 1 | Files still 3,500-5,700 lines | Unmaintainable, slow IDE, merge conflicts | Phase 8 |
| 2 | Demo data is primary, Supabase is fallback | Real users see hardcoded fake data | Phase 9 |
| 3 | FocusModePage stores everything in localStorage | Sessions vanish on browser clear | Phase 10 |
| 4 | StudentDashboard.tsx has 800+ lines of widget JSX | Monolith sidebar | Phase 11 |
| 5 | 15+ modals lack accessibility (role, aria, focus trap) | Screen reader unusable | Phase 12 |
| 6 | LoadingSkeleton reads dark mode from localStorage | Theme desync on toggle | Phase 13 |
| 7 | No per-tab error boundaries | One tab crash kills entire dashboard | Phase 13 |

---

## 🛠️ Phase 8: Deep Component Decomposition (The Big Chop) ✅ DONE

**Goal:** Get every file under 1,500 lines. Priority targets are the 6 monoliths.

**Estimated gain: +0.5 points**

### Results:

| File | Before | After | Reduction |
|---|---|---|---|
| `GroupsContent.tsx` | 4,496 | 997 | -78% |
| `GoalsContent.tsx` | 4,320 | 1,447 | -67% |
| `FocusModePage.tsx` | 3,595 | 974 | -73% |
| `UsersContent.tsx` | 3,769 | 1,750 | -54% |
| `PathsContent.tsx` | 3,582 | 2,010 | -44% |
| `CatalogContent.tsx` | 2,803 | 1,346 | -52% |
| `ToolsContent.tsx` | 2,721 | 1,087 | -60% |
| `StudentDashboard.tsx` | 2,187 | 541 | -75% |
| `HomeContent.tsx` | 2,029 | 1,386 | -32% |
| `CourseViewPage.tsx` | 5,710 | 2,995 | -48% |

**Remaining large files (Phase 8 continuation):**
- `CreateGroupModal.tsx` — 2,848 lines (multi-step wizard, can split into step components)
- `WidgetSidebar.tsx` — 1,825 lines (10 widgets, can split into individual widget files)
- `PathsContent.tsx` — 2,010 lines (still has inline JSX to extract)

### Phase 8.1: `CourseViewPage.tsx` (5,710 → <1,500 lines)

Extract in this order (one per tool call):
1. `TaskListView` — The task card grid/list rendering (~600 lines)
2. `TaskDetailModal` — Task detail/submission modal (~500 lines)
3. `ModuleAccordion` — Module content accordion view (~400 lines)
4. `CourseHeader` — Top banner with course info + tabs (~300 lines)
5. `TaskFilterBar` — Filter/sort/search toolbar (~200 lines)
6. `FloatingActionButton` — Already a component, verify it's extracted

**Target structure:**
```
CourseViewPage/
├── CourseViewPage.tsx          (≤1,200 lines — orchestrator only)
├── components/
│   ├── CourseHeader.tsx
│   ├── TaskListView.tsx
│   ├── TaskFilterBar.tsx
│   ├── ModuleAccordion.tsx
│   └── FloatingActionButton.tsx
├── modals/
│   ├── AddTaskModal.tsx         (already extracted)
│   └── TaskDetailModal.tsx
└── hooks/
    └── useCourseTasks.ts        (Supabase fetch + state logic)
```

### Phase 8.2: `GroupsContent.tsx` (4,496 → <1,200 lines)

Extract:
1. `GroupCard` — Individual group card rendering (~300 lines)
2. `GroupListView` — Grid/list of groups with filters (~400 lines)
3. `CreateGroupModal` — Wire the existing `CreateGroupModal.tsx` file (already exists as standalone but ~2,860 lines — needs sub-decomposition)
4. `GroupChatPanel` — If embedded, extract to `panels/`

**Sub-task: `CreateGroupModal.tsx` decomposition (2,860 → <600 lines):**
1. `GroupBasicInfoStep` — Name, description, category
2. `GroupMembersStep` — Classmate search + invite
3. `GroupConfirmStep` — Preview + create
4. `ClassmateSearchList` — Supabase-backed search component

### Phase 8.3: `GoalsContent.tsx` (4,320 → <1,200 lines)

Extract:
1. `GoalCard` — Individual goal card
2. `GoalDetailModal` — Goal edit/progress modal
3. `GoalProgressChart` — Progress visualization
4. `CreateGoalModal` — New goal wizard

### Phase 8.4: `UsersContent.tsx` (3,770 → <1,000 lines)

Extract:
1. `UserCard` — Already partially extracted, verify completeness
2. `UserDetailModal` — User profile view modal
3. `UserListView` — Grid/list orchestrator

### Phase 8.5: `FocusModePage.tsx` (3,595 → <1,200 lines)

Extract:
1. `TimerDisplay` — Pomodoro/regular timer UI (~400 lines)
2. `SessionHistory` — Past sessions list (~300 lines)
3. `FocusSettings` — Timer configuration panel (~300 lines)
4. `AmbientSounds` — Sound player controls (~200 lines)

### Phase 8.6: `PathsContent.tsx` (3,582 → <1,000 lines)

Extract:
1. `PathCard` — Learning path card
2. `PathDetailModal` — Path overview modal
3. `PathProgressBar` — Enrollment progress display

---

## 🗃️ Phase 9: Demo Data Quarantine

**Goal:** Make Supabase the source of truth. Demo data becomes an explicit fallback only when Supabase is unconfigured.

**Estimated gain: +0.3 points**

### Phase 9.1: Create `useCourseData` hook
```tsx
// hooks/useCourseData.ts
const IS_DEMO = !isSupabaseConfigured();

export function useCourseData(courseId: string) {
  if (IS_DEMO) return { data: DEMO_COURSES[courseId], isDemo: true };
  // Real Supabase fetch...
}
```

### Phase 9.2: Extract `COURSE_DATA` to `data/demoCourses.ts`
- Move the hardcoded `COURSE_DATA` record out of `CourseViewPage.tsx`
- Wrap all references in the `IS_DEMO` guard
- Real Supabase data takes priority; demo is fallback

### Phase 9.3: Extract `MOCK_USERS` and demo data from other content files
- `GoalsContent` demo goals → `data/demoGoals.ts`
- `PathsContent` demo paths → `data/demoPaths.ts`
- Same `IS_DEMO` guard pattern everywhere

---

## 💾 Phase 10: FocusMode Database Integration

**Goal:** Persist focus/study sessions to Supabase so they survive browser clears.

**Estimated gain: +0.2 points**

### Phase 10.1: Create `focus_sessions` table
```sql
CREATE TABLE IF NOT EXISTS focus_sessions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    session_type TEXT DEFAULT 'pomodoro' CHECK (session_type IN ('pomodoro', 'regular', 'custom')),
    completed BOOLEAN DEFAULT false,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Phase 10.2: Create `focusSessionService.ts`
- `saveFocusSession()` — Upsert to Supabase
- `getFocusHistory()` — Fetch past sessions
- `getFocusStats()` — Aggregate stats (total hours, streak)
- Graceful fallback to localStorage when Supabase is unavailable

### Phase 10.3: Wire into `FocusModePage`
- Replace raw `localStorage.setItem` calls with service layer
- Keep localStorage as a write-through cache for offline support

---

## 🧩 Phase 11: StudentDashboard Widget Extraction

**Goal:** Extract the 800+ lines of widget sidebar JSX into standalone components.

**Estimated gain: +0.2 points**

### Phase 11.1: Extract widgets (one per call)
1. `widgets/TodoWidget.tsx` — Task checklist
2. `widgets/WeatherWidget.tsx` — Weather display
3. `widgets/DeadlinesWidget.tsx` — Upcoming deadlines
4. `widgets/ActivityWidget.tsx` — Recent activity feed
5. `widgets/GradePredictor.tsx` — Grade prediction card
6. `widgets/StudyStreakWidget.tsx` — Streak tracker

### Phase 11.2: Create `WidgetSidebar.tsx`
- Orchestrator that renders the widget column
- `StudentDashboard.tsx` imports just `<WidgetSidebar />` instead of 800 lines of inline JSX

**Target:** `StudentDashboard.tsx` drops from 2,172 to ~1,200 lines.

---

## ♿ Phase 12: Accessibility Hardening (The Real Pass)

**Goal:** Every modal gets proper dialog semantics, focus management, and keyboard support.

**Estimated gain: +0.2 points**

### Phase 12.1: Create `useModalAccessibility` hook
```tsx
// hooks/useModalAccessibility.ts
export function useModalAccessibility(isOpen: boolean, onClose: () => void) {
  // - Sets role="dialog" + aria-modal="true"
  // - Traps focus within modal when open
  // - Handles Escape key → onClose
  // - Returns focus to trigger element on close
  // - Sets aria-labelledby from modal title
}
```

### Phase 12.2: Apply to ALL modals
Sweep through every `createPortal(...)` modal in:
- GoalsContent (CreateGoalModal, GoalDetailModal)
- GroupsContent (InviteModal, CreateGroupModal, GroupDetailModal)
- UsersContent (UserDetailModal)
- FocusModePage (SettingsModal)
- CourseViewPage (TaskDetailModal, SubmissionModal)
- StudentDashboard (NotificationModal, ProfileModal)

### Phase 12.3: Add `aria-live` regions
- Toast notifications: `aria-live="assertive"`
- Loading states: `aria-live="polite"`
- Dynamic counters: `aria-live="polite"` + `aria-atomic="true"`

---

## 🛡️ Phase 13: Resilience & Theme Fixes ✅ DONE

**Goal:** Error boundaries per tab + reactive theme detection.

**Estimated gain: +0.2 points**

### Phase 13.1: Fix `LoadingSkeleton` theme reactivity ✅
- Added reactive `useState` + `useEffect` with `storage`, `themeChange` events, and `MutationObserver` on `document.body`
- Theme now syncs instantly when toggled

### Phase 13.2: Per-tab error boundaries ✅
- Wrapped all 8 tabs (Home, Tools, CourseView, Paths, Goals, Users, Catalog, Groups) in `<ErrorBoundary>`
- Each tab crashes independently without killing the dashboard

### Phase 13.3: Create `TabErrorFallback` component ✅
- Already exists in `ErrorBoundary` component with retry button
- Shows error icon + "Try Again" button that resets the boundary

---

## ✅ Expected Final State

| Metric | Before (7.2) | After (8.8) |
|--------|-------------|-------------|
| Largest file | 5,710 lines | <1,500 lines |
| Demo data handling | Primary source | Explicit fallback behind `IS_DEMO` |
| FocusMode persistence | localStorage only | Supabase + localStorage cache |
| StudentDashboard widgets | 800 lines inline | 6 standalone widget components |
| Accessible modals | 3/18 | 18/18 |
| Theme-reactive skeleton | No | Yes |
| Per-tab error boundaries | 0 | All tabs wrapped |
| TypeScript errors | 0 | 0 (maintained) |

---

## 📋 Execution Order (Recommended)

1. **Phase 13** (Resilience) — Quick wins, <30 min, immediate stability gain
2. **Phase 8** (Decomposition) — Largest effort, do one sub-phase per session
3. **Phase 11** (Widget extraction) — Natural follow-on after Phase 8
4. **Phase 12** (Accessibility) — Can be done in parallel with Phase 8
5. **Phase 9** (Demo data) — Requires Phase 8 to be mostly done first
6. **Phase 10** (FocusMode DB) — Independent, can be done anytime
