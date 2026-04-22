/**
 * extract-focus-components.cjs
 * Extracts inline components from FocusModePage.tsx into separate files.
 */
const fs = require('fs');
const path = require('path');

const srcFile = 'src/pages/studentdashboard/FocusModePage/FocusModePage.tsx';
const content = fs.readFileSync(srcFile, 'utf8');
const lines = content.split('\n');

// Ensure components directory exists
const compDir = 'src/pages/studentdashboard/FocusModePage/components';
if (!fs.existsSync(compDir)) fs.mkdirSync(compDir, { recursive: true });

function extract(startMarker, endMarker) {
    const s = lines.findIndex(l => l.trim().startsWith(startMarker));
    const e = lines.findIndex(l => l.trim().startsWith(endMarker));
    if (s === -1 || e === -1) {
        console.error(`Marker not found: "${startMarker}" (${s}) or "${endMarker}" (${e})`);
        process.exit(1);
    }
    return { start: s, end: e, code: lines.slice(s, e).join('\n') };
}

const focusSkeleton     = extract('// Skeleton Loading Component', '// Resource Icon Component');
const resourceIcon      = extract('// Resource Icon Component', '// Filter Tabs Component');
const filterTabs        = extract('// Filter Tabs Component', '// Pomodoro Timer Component');
const pomodoroTimer     = extract('// Pomodoro Timer Component', '// Session Stats Component');
const sessionStats      = extract('// Session Stats Component', '// Motivational Quote Component');
const motivationalQuote = extract('// Motivational Quote Component', '// Sound Icon Component');
const soundIcon         = extract('// Sound Icon Component', '// Ambient Sounds Component');
const ambientSounds     = extract('// Ambient Sounds Component', '// Session Goal Component');
const sessionGoal       = extract('// Session Goal Component', '// Session History Component');
const sessionHistory    = extract('// Session History Component', '// Break Suggestions Component');
const breakSuggestions  = extract('// Break Suggestions Component', '// Keyboard Shortcuts Display Component');
const keyboardShortcuts = extract('// Keyboard Shortcuts Display Component', '// Distraction Blocker Overlay Component');
const distractionBlocker= extract('// Distraction Blocker Overlay Component', '// Resource Card Component');
const resourceCard      = extract('// Resource Card Component', '// Main Component');

console.log('FocusSkeleton:', focusSkeleton.end - focusSkeleton.start, 'lines');
console.log('ResourceIcon + FilterTabs:', filterTabs.end - resourceIcon.start, 'lines');
console.log('PomodoroTimer:', pomodoroTimer.end - pomodoroTimer.start, 'lines');
console.log('SessionStats:', sessionStats.end - sessionStats.start, 'lines');
console.log('MotivationalQuote:', motivationalQuote.end - motivationalQuote.start, 'lines');
console.log('SoundIcon + AmbientSounds:', ambientSounds.end - soundIcon.start, 'lines');
console.log('SessionGoal:', sessionGoal.end - sessionGoal.start, 'lines');
console.log('SessionHistory:', sessionHistory.end - sessionHistory.start, 'lines');
console.log('BreakSuggestions:', breakSuggestions.end - breakSuggestions.start, 'lines');
console.log('KeyboardShortcuts:', keyboardShortcuts.end - keyboardShortcuts.start, 'lines');
console.log('DistractionBlocker:', distractionBlocker.end - distractionBlocker.start, 'lines');
console.log('ResourceCard:', resourceCard.end - resourceCard.start, 'lines');

const sharedImports = `import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { FocusModeColors } from '../FocusModePage';`;

// ── PomodoroTimer.tsx ─────────────────────────────────────────────────────────
const pomodoroFile = `/**
 * PomodoroTimer
 * Compact professional Pomodoro/focus timer.
 * Extracted from FocusModePage.tsx during Phase 8.5
 */
${sharedImports}

${pomodoroTimer.code}

export { PomodoroTimer };
`;

// ── SessionStats.tsx ──────────────────────────────────────────────────────────
const sessionStatsFile = `/**
 * SessionStats
 * Shows today's focus progress stats.
 * Extracted from FocusModePage.tsx during Phase 8.5
 */
${sharedImports}

${sessionStats.code}

export { SessionStats };
`;

// ── AmbientSounds.tsx ─────────────────────────────────────────────────────────
const ambientSoundsFile = `/**
 * AmbientSounds + SoundIcon
 * Ambient sound player controls.
 * Extracted from FocusModePage.tsx during Phase 8.5
 */
${sharedImports}

${soundIcon.code}

${ambientSounds.code}

export { AmbientSounds };
`;

// ── SessionGoal.tsx ───────────────────────────────────────────────────────────
const sessionGoalFile = `/**
 * SessionGoal
 * Session goal setter component.
 * Extracted from FocusModePage.tsx during Phase 8.5
 */
${sharedImports}

${sessionGoal.code}

export { SessionGoal };
`;

// ── SessionHistory.tsx ────────────────────────────────────────────────────────
const sessionHistoryFile = `/**
 * SessionHistory
 * Weekly focus trends chart.
 * Extracted from FocusModePage.tsx during Phase 8.5
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import type { FocusModeColors } from '../FocusModePage';
import type { StudyTimeData } from '../../../../../services/studyTimeService';

${sessionHistory.code}

export { SessionHistory };
`;

// ── BreakSuggestions.tsx ──────────────────────────────────────────────────────
const breakSuggestionsFile = `/**
 * BreakSuggestions
 * Break activity suggestions shown during break mode.
 * Extracted from FocusModePage.tsx during Phase 8.5
 */
${sharedImports}

${breakSuggestions.code}

export { BreakSuggestions };
`;

// ── KeyboardShortcuts.tsx ─────────────────────────────────────────────────────
const keyboardShortcutsFile = `/**
 * KeyboardShortcuts
 * Keyboard shortcuts reference panel.
 * Extracted from FocusModePage.tsx during Phase 8.5
 */
${sharedImports}

${keyboardShortcuts.code}

export { KeyboardShortcuts };
`;

// ── DistractionBlocker.tsx ────────────────────────────────────────────────────
const distractionBlockerFile = `/**
 * DistractionBlocker
 * Full-screen distraction blocker overlay.
 * Extracted from FocusModePage.tsx during Phase 8.5
 */
${sharedImports}

${distractionBlocker.code}

export { DistractionBlocker };
`;

// ── ResourceCard.tsx ──────────────────────────────────────────────────────────
const resourceCardFile = `/**
 * ResourceCard + ResourceIcon + FilterTabs + FocusSkeleton
 * Resource management components for FocusModePage.
 * Extracted from FocusModePage.tsx during Phase 8.5
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { FocusModeColors } from '../FocusModePage';
import type { Resource, FilterTab } from '../FocusModePage';

${focusSkeleton.code}

${resourceIcon.code}

${filterTabs.code}

${resourceCard.code}

export { FocusSkeleton, ResourceIcon, FilterTabs, ResourceCard };
`;

// ── MotivationalQuote.tsx ─────────────────────────────────────────────────────
const motivationalQuoteFile = `/**
 * MotivationalQuote
 * Rotating motivational quotes for focus/break mode.
 * Extracted from FocusModePage.tsx during Phase 8.5
 */
${sharedImports}

${motivationalQuote.code}

export { MotivationalQuote };
`;

// Write files
const files = [
    ['PomodoroTimer.tsx', pomodoroFile],
    ['SessionStats.tsx', sessionStatsFile],
    ['AmbientSounds.tsx', ambientSoundsFile],
    ['SessionGoal.tsx', sessionGoalFile],
    ['SessionHistory.tsx', sessionHistoryFile],
    ['BreakSuggestions.tsx', breakSuggestionsFile],
    ['KeyboardShortcuts.tsx', keyboardShortcutsFile],
    ['DistractionBlocker.tsx', distractionBlockerFile],
    ['ResourceCard.tsx', resourceCardFile],
    ['MotivationalQuote.tsx', motivationalQuoteFile],
];

files.forEach(([name, content]) => {
    fs.writeFileSync(path.join(compDir, name), content, 'utf8');
    console.log(`\n${name}: ${content.split('\n').length} lines`);
});

// ── Remove inline definitions from FocusModePage.tsx ─────────────────────────
const removeStart = focusSkeleton.start;
const removeEnd   = resourceCard.end;

const newLines = [
    ...lines.slice(0, removeStart),
    '// FocusSkeleton, ResourceIcon, FilterTabs, ResourceCard — moved to ./components/ResourceCard.tsx',
    '// PomodoroTimer — moved to ./components/PomodoroTimer.tsx',
    '// SessionStats — moved to ./components/SessionStats.tsx',
    '// MotivationalQuote — moved to ./components/MotivationalQuote.tsx',
    '// AmbientSounds + SoundIcon — moved to ./components/AmbientSounds.tsx',
    '// SessionGoal — moved to ./components/SessionGoal.tsx',
    '// SessionHistory — moved to ./components/SessionHistory.tsx',
    '// BreakSuggestions — moved to ./components/BreakSuggestions.tsx',
    '// KeyboardShortcuts — moved to ./components/KeyboardShortcuts.tsx',
    '// DistractionBlocker — moved to ./components/DistractionBlocker.tsx',
    '',
    ...lines.slice(removeEnd),
];

fs.writeFileSync(srcFile, newLines.join('\n'), 'utf8');
console.log('\nFocusModePage.tsx new line count:', newLines.length);
console.log('Done.');
