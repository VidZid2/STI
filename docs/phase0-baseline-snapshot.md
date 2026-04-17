# Phase 0 Baseline Snapshot
> Generated: 2026-04-17 | Pre-extraction safety record for Student Dashboard upgrade

---

## 0.1 TypeScript Baseline
- **Result:** `npx tsc --noEmit` → **EXIT 0 — Zero errors**
- All dashboard files compile cleanly before any Phase 1 work begins.

---

## 0.2 Routing & Tab Type Inventory

### Top-Level Dashboard Navigation
**Type:** `DashboardView` (exported from `src/pages/studentdashboard/types.ts`)
```typescript
export type DashboardView = 'home' | 'tools' | 'course' | 'paths' | 'goals' | 'users' | 'catalog' | 'groups';
export type PreviousView = 'home' | 'tools' | 'paths' | 'goals' | 'users' | 'catalog';
```
**State managed by:** `useDashboardState` hook → `activeView` / `setActiveView`  
**Persisted to:** `sessionStorage` key `dashboard_active_view`  
**Course state persisted to:** `sessionStorage` key `dashboard_selected_course`

### CourseViewPage Tab Navigation
**Type:** `TabType` (inline in `CourseViewPage.tsx` — NOT imported from `types.ts`)
```typescript
type TabType = 'modules' | 'assignments' | 'news' | 'students' | 'teachers';
```
**State:** `activeTab` / `setActiveTab` — local `useState` inside `CourseViewPage`

### CourseViewPage Task Filter
**Type:** `TaskCategory` (inline in `CourseViewPage.tsx`)
```typescript
type TaskCategory = 'all' | 'assignment' | 'performance' | 'quiz' | 'practical' | 'journal' | 'overdue';
```
> ⚠️ **Fixed in Phase 0:** `types.ts` was missing `'overdue'` — now synced.

### Content Types
```typescript
type ContentType = 'handout-a' | 'handout-b' | 'slideshow' | 'video';
```

### LocalStorage / SessionStorage Keys (Student-Scoped)
| Key | Location | Purpose |
|-----|----------|---------|
| `dashboard_active_view` | sessionStorage | Persists active dashboard view |
| `dashboard_selected_course` | sessionStorage | Persists selected course object |
| `welcome-modal-completed` | localStorage | Tracks welcome modal dismissal |
| `tutorial-completed` | localStorage | Tracks tutorial completion |
| `demo-mode-active` | localStorage | Demo mode flag |
| `dashboardIntroShown` | sessionStorage | Intro animation shown flag |

> ✅ All keys use `elms_student_` or dashboard-specific prefixes — no collision with teacher keys.

---

## 0.3 Visual Snapshot (Freeze Reference)

### Key Files & Sizes
| File | Lines | Status |
|------|-------|--------|
| `CourseViewPage.tsx` | ~7,054 | 🔴 Monolith — Phase 1 target |
| `GroupsContent.tsx` | ~5,522 | 🔴 Monolith — Phase 1 target |
| `StudentDashboard.tsx` | ~2,640 | 🟡 Large — Phase 1.4 target |
| `GoalsContent.tsx` | unknown | Phase 1.3 target |
| `UsersContent.tsx` | unknown | Phase 1.3 target |

### CSS Architecture
- Global styles: `src/styles/dashboard.css`, `intro.css`, `settings-modal.css`, `responsive-optimization.css`, `home-content.css`
- Theme: CSS variables (dark/light mode) — **do not drop class wrappers on extraction**
- Animations: `framer-motion` / `motion/react` — `AnimatePresence` boundaries must stay intact

### Navigation Structure
```
StudentDashboard
├── Sidebar (nav-items: CoursesNavItem, HelpNavItem, PathsNavItem)
├── Header (UserProfileDropdown, NotificationBell, StreakDropdown, QuickSettingsDropdown, HelpDropdown)
├── Main Content (AnimatePresence mode="wait")
│   ├── activeView === 'home'     → HomeContent
│   ├── activeView === 'tools'    → ToolsContent
│   ├── activeView === 'course'   → CourseViewPage (selectedCourse prop)
│   ├── activeView === 'paths'    → PathsContent
│   ├── activeView === 'goals'    → GoalsContent
│   ├── activeView === 'users'    → UsersContent
│   ├── activeView === 'catalog'  → CatalogContent
│   └── activeView === 'groups'   → GroupsContent
└── Dock (DockAutoHide)
```

### Critical Constraints for Phase 1
1. `CourseViewPage.tsx` does NOT import from its own `types.ts` — all types are inline. Phase 1 must wire this up.
2. `AnimatePresence mode="wait"` wraps all view transitions — extracted components must not break this.
3. `selectedCourse` is passed as a prop to `CourseViewPage` — must remain prop-drilled (no Context until Phase 5).
4. `onBack` callback in `CourseViewPage` calls `setActiveView(previousView)` — must be preserved exactly.

---

## Phase 0 Status: ✅ COMPLETE
- [x] 0.1 Baseline type check passed (0 errors)
- [x] 0.2 All routing string literals documented and bound to types
- [x] 0.2 `TaskCategory` type drift fixed in `CourseViewPage/types.ts`
- [x] 0.3 Visual/structural snapshot recorded
