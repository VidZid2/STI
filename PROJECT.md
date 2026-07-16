# Project: Rich Text Editor for Teacher Dashboard

## Architecture
- **Component Layer**:
  - `NewCoursePage.tsx`: The container component containing the course creation form, the editing toolbar, and the description editor wrapper.
  - `SpringCaretRichEditor.tsx` (new): A custom rich text editor component wrapping TipTap, exposing an editor instance or command dispatch interface, and implementing DOM-based Selection API caret tracking.
- **Styling Layer**:
  - `SpringCaretInput.css`: Bouncing caret and placeholder styling.
  - `NewCoursePage.css`: Fullscreen styles, custom layouts, list and alignment rendering overrides for the rich text editor.
- **Testing Track**:
  - E2E test suite running under Vitest/React Testing Library, verifying all 13 toolbar operations, caret updates, and layout properties.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | E2E Test Suite | Design and build comprehensive opaque-box E2E test suite (Tiers 1-4) and publish `TEST_READY.md` | None | DONE |
| M2 | SpringCaretRichEditor Component | Create custom TipTap-based editor component with Selection-based caret tracking | None | PLANNED |
| M3 | Toolbar Action & Style Integration | Bind all 13 toolbar buttons to editor commands, configure fullscreen layout, and style lists/alignments | M2 | PLANNED |
| M4 | Validation and Hardening (Final) | Pass 100% of E2E tests (Phase 1) and run adversarial coverage hardening (Phase 2) | M1, M3 | PLANNED |

## Interface Contracts
### `NewCoursePage.tsx` ↔ `SpringCaretRichEditor.tsx`
- **Props**:
  - `value: string` (HTML content)
  - `onChange: (value: string) => void`
  - `placeholder: string`
  - `id: string`
  - `className?: string`
  - `onFocus?: () => void`
  - `onBlur?: () => void`
  - `editorRef: React.MutableRefObject<any>` (to expose TipTap editor commands to parent toolbar)

## Code Layout
- `src/pages/teacherdashboard/content/NewCoursePage.tsx` — Main Page
- `src/pages/teacherdashboard/content/SpringCaretRichEditor.tsx` — New Editor Component
- `src/pages/teacherdashboard/content/SpringCaretInput.tsx` — Input/Textarea standard components
- `src/pages/teacherdashboard/content/NewCoursePage.css` — Styling overrides
- `src/pages/teacherdashboard/content/__tests__/RichTextEditor.test.tsx` — Test suite
