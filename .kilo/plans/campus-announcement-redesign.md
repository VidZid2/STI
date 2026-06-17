# Campus Announcement Redesign Plan

## Goal
Redesign the pinned campus announcement section in `src/pages/studentdashboard/content/HomeContent/HomeContent.tsx` so it matches the existing eLMS design language while preserving the current card height and responsive behavior.

## Design references studied
- `HomeContent.tsx`: profile card, expanded stats, course carousel, ambient glows, rounded white cards, hover shadows, mobile/desktop spacing.
- `ModuleCard.tsx`: icon containers, hover scale/rotate animations, progress bars, material rows, locked-state overlays.
- `GoalsContent.tsx` and `PathsContent.tsx`: metric cards, circular progress modules, search/filter style, typography scale, max-width page structure.
- `ToolsContent/`: modern search, recommended workflow cards, tool cards, empty states, trust banner.
- `UserProfileDropdown.tsx`: premium profile banner, avatar/level system, XP widget, segmented tabs, modal polish.
- `UsersContent/`: community cards, online status, filters, skeleton/empty states, responsive grids.
- `FAQsModal.tsx` and `InstructionsModal.tsx`: modal header cards, footer help cards, motion transitions, SVG icon containers.

## Current issue
The campus announcement card has a strong layout, but the large empty placeholder image makes it look unfinished. The copy is also too generic for a campus dashboard announcement.

## Proposed visual direction
Keep the same overall announcement structure and height, but replace the empty placeholder with a polished eLMS 2.0 dashboard preview made from SVG/Tailwind elements.

The redesigned announcement should feel like a real campus product update, not a generic placeholder.

## Copy changes
Use shorter, clearer, student-focused copy.

Current:
- Title: `eLMS 2.0`
- Subtitle: `Major updates to your learning experience`
- Description: long generic paragraph
- CTA: `Explore eLMS 2.0 Features`
- Right title: `Latest Updates`

Proposed:
- Title: `Welcome to eLMS 2.0`
- Subtitle: `A cleaner dashboard for courses, goals, tools, and campus updates`
- Description: `Track courses, deadlines, announcements, and study tools from one faster student workspace.`
- CTA: `See What’s New`
- Right title: `Campus Feed`

## Layout changes
Preserve the existing announcement section height by keeping the same image/media container height.

Current placeholder area:
- `h-48 sm:h-64`

Keep:
- `h-48 sm:h-64`

Replace the empty placeholder with a dashboard mockup:
- Soft yellow/blue gradient background.
- Left mini sidebar with 3 course chips.
- Main preview card with:
  - course progress ring or progress bar
  - assignment card
  - calendar chip
  - announcement chip
  - floating “New Dashboard” badge
- Use existing design language:
  - rounded-[16px] to rounded-[24px]
  - border-slate-200/80 dark:border-slate-700/80
  - bg-white dark:bg-slate-900
  - shadow-sm, hover:shadow-md
  - blue/yellow accent colors matching the pinned announcement theme

## Responsive requirements
Mobile:
- Keep announcement stacked.
- Keep image/mockup height at `h-48`.
- Keep CTA full-width.
- Keep icon around 48px to 56px.
- Keep right feed cards readable with small font sizes.

Tablet:
- Allow left/right split.
- Keep media height around `sm:h-64`.
- Keep feed column compact.

Desktop:
- Keep left announcement flexible.
- Keep right feed column around `lg:w-1/3 xl:w-[400px]`.
- Preserve the existing right-side `Latest Updates` list height and scroll behavior.

## Component/style requirements
Use only existing dependencies:
- `motion` / `AnimatePresence` from `framer-motion`
- Tailwind classes
- Inline SVGs

Do not add external image assets.

Match existing component patterns:
- White card containers:
  - `bg-white dark:bg-slate-800`
  - `border border-slate-200 dark:border-slate-700`
  - `rounded-[24px]`
  - `shadow-sm`
  - `hover:shadow-md`
- Hover animations:
  - `hover:-translate-y-0.5`
  - `hover:border-blue-200/80 dark:hover:border-blue-800/50`
  - `group-hover:scale-105`
- Icon containers:
  - `w-12 h-12` or `w-14 h-14`
  - `rounded-[16px]`
  - `bg-yellow-50 dark:bg-yellow-900/30`
  - `text-yellow-600 dark:text-yellow-400`
- Typography:
  - Heading: `text-xl sm:text-2xl`
  - Subtitle: `text-sm font-medium`
  - Body: `text-sm sm:text-base leading-relaxed`
  - Feed title: `text-sm font-bold`
  - Feed meta: `text-[10px]` to `text-[11px]`

## Implementation steps
1. In `HomeContent.tsx`, replace the current placeholder SVG block with a dashboard-preview mockup.
2. Update the announcement title, subtitle, description, and CTA text.
3. Rename `Latest Updates` to `Campus Feed`.
4. Add small category icons to the feed cards using existing SVG style.
5. Add hover effects to feed cards matching the rest of the app.
6. Remove or avoid unused state if `isFullscreenImageOpen` becomes unnecessary.
7. Keep the outer layout, right column, scroll area, and `View All Announcements` button intact.
8. Preserve existing event behavior for `onShowWelcomeModal`.

## Safety checks
- Do not change unrelated dashboard sections.
- Do not alter course carousel, profile card, goals, tools, users, paths, or modal files.
- Do not change the announcement card height.
- Avoid adding new dependencies.
- Avoid external image URLs.
- Keep dark mode consistent.

## Validation
After implementation:
1. Run `npm run build` to catch TypeScript/Vite issues.
2. If build fails, fix only the announcement-related errors.
3. If possible, run `npm run dev` and visually check:
   - mobile width
   - tablet width
   - desktop width
   - light mode
   - dark mode
   - hover states
   - right feed scroll area
