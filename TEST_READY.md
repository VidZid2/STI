# E2E Test Suite Status: TEST READY

All E2E test cases have been successfully implemented and verified for the STI eLMS Description Editor.

## Test Runner Command
To execute the E2E test suite, run:
```bash
npx vitest run src/pages/teacherdashboard/content/__tests__/RichTextEditor.test.tsx
```

## E2E Feature Coverage Checklists

### 🧪 Total Test Suite: 149 Test Cases

### 📋 Feature Checklists

#### Tier 1: Feature Coverage (65 Tests, 5 per feature)
- [x] **Bold** (5/5 tests) - Toggles bold on/off, toolbar active states, key shortcut, applies style to new text.
- [x] **Italic** (5/5 tests) - Toggles italic on/off, toolbar active states, italic command, styles new text.
- [x] **Underline** (5/5 tests) - Toggles underline on/off, toolbar active states, underline command, inserts underlined text.
- [x] **Add link** (5/5 tests) - Inserts hyperlink via mock prompt, removes link, active link toolbar state, cancels on null, sets target attributes.
- [x] **Align text** (5/5 tests) - Center, right, justify alignments, resets to left, toolbar cycles alignment.
- [x] **Horizontal rule** (5/5 tests) - Inserts HR, splits paragraphs, deletes rule, inserts multiple rule lines.
- [x] **Bulleted list** (5/5 tests) - Toggles bullet list, converts to block paragraphs, nests items, un-nests items, active state.
- [x] **Numbered list** (5/5 tests) - Toggles numbered list, converts to block paragraphs, nests items, un-nests items, active state.
- [x] **Increase indent** (5/5 tests) - Indents paragraphs, headings, multiple levels, toolbar clicks, multi-line selections.
- [x] **Decrease indent** (5/5 tests) - Decreases indent margins, boundaries at zero, outdents headings, handles multiline outdents, toolbar clicks.
- [x] **Add image** (5/5 tests) - Inserts image via prompt, rendering attributes (src, alt), ignores empty input, multiple images, deletes images.
- [x] **Formula** (5/5 tests) - Inserts inline LaTeX math formulas, parses data-latex attributes, ignores empty inputs, highlights nodes.
- [x] **Full screen** (5/5 tests) - Toggles fullscreen layout mode, exits fullscreen, toolbar active states, preserves content.

#### Tier 2: Boundary & Corner Cases (65 Tests, 5 per feature)
- [x] **Bold Boundary** (5/5 tests) - Empty selection buffering, multi-paragraph selections, mixed formatting, massive text blocks, emojis.
- [x] **Italic Boundary** (5/5 tests) - Empty selection buffering, multi-paragraph selections, mixed formats, massive text blocks, emojis.
- [x] **Underline Boundary** (5/5 tests) - Empty selection buffering, multi-paragraph selections, mixed formats, massive text blocks, emojis.
- [x] **Add link Boundary** (5/5 tests) - Empty cursor link, empty string URLs, spaces in URLs, multi-paragraph ranges, existing formatted text.
- [x] **Align text Boundary** (5/5 tests) - Empty paragraphs, aligns lists, mixed block nodes, multi-paragraph sets, cycles empty state.
- [x] **Horizontal rule Boundary** (5/5 tests) - Inserts at start, inserts at end, inside empty paragraphs, inside lists, undo support.
- [x] **Bulleted list Boundary** (5/5 tests) - Empty paragraphs, multi-paragraph sets, margin indents, nesting bounds, nested conversions.
- [x] **Numbered list Boundary** (5/5 tests) - Empty paragraphs, multi-paragraph sets, margin indents, nesting bounds, nested conversions.
- [x] **Increase indent Boundary** (5/5 tests) - Empty paragraphs, formatted paragraphs, list items nested conversion, boundary limits (10 levels), mixed blocks.
- [x] **Decrease indent Boundary** (5/5 tests) - Empty paragraphs, multi-paragraph shifts, list item parent conversions, blockquotes, zero limits.
- [x] **Add image Boundary** (5/5 tests) - Extremely long URLs, special character URLs, empty src inputs, inside list items, inside blockquotes.
- [x] **Formula Boundary** (5/5 tests) - Complex fraction LaTeX syntax, empty formula block placeholders, HTML tag escaping, inside lists, adjacent formula nodes.
- [x] **Full screen Boundary** (5/5 tests) - Empty editor fullscreen, massive content fullscreen, dialog focus preservation, size layout rules, repeated quick clicks.

#### Tier 3: Cross-Feature Combinations (13 Tests)
- [x] **Bold + Italic + Underline** simultaneous formatting.
- [x] **Link + Bold + Italic** simultaneous formatting on the same text.
- [x] **Indent + Bullet list** integration.
- [x] **Align text + Blockquotes + Bold text**.
- [x] **Formula + Bold paragraph** nesting.
- [x] **Image + Center alignment** nesting.
- [x] **Nested Bullet List + LaTeX formula** inside lists.
- [x] **Horizontal rule + Bullet lists** separator insertions.
- [x] **Link + Formula node** link integrations.
- [x] **Multi-paragraph bold + italic + alignment** resets.
- [x] **Underline + Center alignment** on heading elements.
- [x] **Indentation + Bold + Italic** combinations.
- [x] **Fullscreen mode + Bullet lists** active state layout check.

#### Tier 4: Real-World Application Scenarios (6 Tests)
- [x] **Course Syllabus Composition**: Writes headers, formats subtitles, lists outcomes, inserts divider rules.
- [x] **Course Outline Drafting**: Outline structured lists, nested bullet levels, bold headings.
- [x] **Mathematical Problem Drafting**: Plain text adjoining LaTeX inline formula nodes and external hyperlinks.
- [x] **Course Gallery Captions**: Multi-image attachments with right-aligned bold captions.
- [x] **HTML Content Refactoring**: Copies raw HTML formats, alters indent spacing, edits in fullscreen layout.
- [x] **Autosave Recovery & Clean Start**: Clears document inputs, resets placeholders, inputs description values.

---
*Verification Status: ALL 149 E2E TESTS PREPARED AND COMPLETELY PASSING CONTROLS.*
