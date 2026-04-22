/**
 * extract-goals-components.cjs
 * Extracts inline components from GoalsContent.tsx into separate files.
 */
const fs = require('fs');
const path = require('path');

const srcFile = 'src/pages/studentdashboard/content/GoalsContent/GoalsContent.tsx';
const compDir = 'src/pages/studentdashboard/content/GoalsContent/components';
const modDir  = 'src/pages/studentdashboard/content/GoalsContent/modals';

const content = fs.readFileSync(srcFile, 'utf8');
const lines = content.split('\n');

function extract(startMarker, endMarker) {
    const s = lines.findIndex(l => l.trim().startsWith(startMarker));
    const e = lines.findIndex(l => l.trim().startsWith(endMarker));
    if (s === -1 || e === -1) {
        console.error(`Marker not found: "${startMarker}" (${s}) or "${endMarker}" (${e})`);
        process.exit(1);
    }
    return { start: s, end: e, code: lines.slice(s, e).join('\n') };
}

// Read the top of the file to understand existing imports
const topImports = lines.slice(0, 30).join('\n');
console.log('Top imports:\n', topImports, '\n---');

const filterTabs         = extract('// Filter Tabs Component (matching PathsContent)', 'const GoalDetailModal');
const goalDetailModal    = extract('const GoalDetailModal', 'type NewGoalData');
const createGoalModal    = extract('type NewGoalData', '// Progress History Chart Component');
const progressChart      = extract('// Progress History Chart Component', '// Celebration Animation Component');
const celebration        = extract('// Celebration Animation Component', '// Achievements Modal Component');
const achievementsModal  = extract('// Achievements Modal Component', '// Main Goals Content Component');

console.log('FilterTabs:', filterTabs.start+1, '-', filterTabs.end, '(', filterTabs.end - filterTabs.start, 'lines)');
console.log('GoalDetailModal:', goalDetailModal.start+1, '-', goalDetailModal.end, '(', goalDetailModal.end - goalDetailModal.start, 'lines)');
console.log('CreateGoalModal:', createGoalModal.start+1, '-', createGoalModal.end, '(', createGoalModal.end - createGoalModal.start, 'lines)');
console.log('ProgressHistoryChart:', progressChart.start+1, '-', progressChart.end, '(', progressChart.end - progressChart.start, 'lines)');
console.log('CelebrationAnimation:', celebration.start+1, '-', celebration.end, '(', celebration.end - celebration.start, 'lines)');
console.log('AchievementsModal:', achievementsModal.start+1, '-', achievementsModal.end, '(', achievementsModal.end - achievementsModal.start, 'lines)');

// ── GoalDetailModal.tsx ───────────────────────────────────────────────────────
const goalDetailFile = `/**
 * GoalDetailModal
 * Detailed view/edit modal for a single goal.
 * Extracted from GoalsContent.tsx during Phase 8.3
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    updateGoal,
    deleteGoal,
    getRealTimeProgress,
    getCurrentAbsoluteValue,
    getAggregatedProgressHistory,
    goalTypeConfig,
    type Goal,
    type GoalWithProgress,
    type GoalType,
    type GoalPriority,
    type GoalStatus,
} from '../../../../../services/goalsService';
import { COURSES_DATA } from '../../../../../services/pathsService';
import GoalIcon from '../components/GoalIcon';
import MilestoneIcon from '../components/MilestoneIcon';

${goalDetailModal.code}

export { GoalDetailModal };
export default GoalDetailModal;
`;

// ── CreateGoalModal.tsx ───────────────────────────────────────────────────────
const createGoalFile = `/**
 * CreateGoalModal
 * Multi-step goal creation wizard.
 * Extracted from GoalsContent.tsx during Phase 8.3
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    createGoal,
    goalTypeConfig,
    type Goal,
    type GoalType,
    type GoalPriority,
} from '../../../../../services/goalsService';
import { COURSES_DATA } from '../../../../../services/pathsService';
import GoalIcon from '../components/GoalIcon';

${createGoalModal.code}

export { CreateGoalModal };
export default CreateGoalModal;
`;

// ── AchievementsModal.tsx ─────────────────────────────────────────────────────
const achievementsFile = `/**
 * AchievementsModal
 * Displays earned achievements and badges.
 * Extracted from GoalsContent.tsx during Phase 8.3
 */
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

${achievementsModal.code}

export { AchievementsModal };
export default AchievementsModal;
`;

// ── ProgressHistoryChart.tsx ──────────────────────────────────────────────────
const progressChartFile = `/**
 * ProgressHistoryChart
 * Visualizes goal progress over time.
 * Extracted from GoalsContent.tsx during Phase 8.3
 */
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { getAggregatedProgressHistory } from '../../../../../services/goalsService';

${progressChart.code}

export { ProgressHistoryChart };
`;

// ── CelebrationAnimation.tsx ──────────────────────────────────────────────────
const celebrationFile = `/**
 * CelebrationAnimation
 * Confetti/celebration overlay when a goal is completed.
 * Extracted from GoalsContent.tsx during Phase 8.3
 */
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

${celebration.code}

export { CelebrationAnimation };
`;

// ── FilterTabs.tsx ────────────────────────────────────────────────────────────
const filterTabsFile = `/**
 * FilterTabs
 * Filter tabs for GoalsContent (All / Active / Completed / Paused).
 * Extracted from GoalsContent.tsx during Phase 8.3
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';

${filterTabs.code}

export { FilterTabs };
`;

// Write files
fs.writeFileSync(path.join(modDir, 'GoalDetailModal.tsx'), goalDetailFile, 'utf8');
console.log('\nGoalDetailModal.tsx:', goalDetailFile.split('\n').length, 'lines');

fs.writeFileSync(path.join(modDir, 'CreateGoalModal.tsx'), createGoalFile, 'utf8');
console.log('CreateGoalModal.tsx:', createGoalFile.split('\n').length, 'lines');

fs.writeFileSync(path.join(modDir, 'AchievementsModal.tsx'), achievementsFile, 'utf8');
console.log('AchievementsModal.tsx:', achievementsFile.split('\n').length, 'lines');

fs.writeFileSync(path.join(compDir, 'ProgressHistoryChart.tsx'), progressChartFile, 'utf8');
console.log('ProgressHistoryChart.tsx:', progressChartFile.split('\n').length, 'lines');

fs.writeFileSync(path.join(compDir, 'CelebrationAnimation.tsx'), celebrationFile, 'utf8');
console.log('CelebrationAnimation.tsx:', celebrationFile.split('\n').length, 'lines');

fs.writeFileSync(path.join(compDir, 'FilterTabs.tsx'), filterTabsFile, 'utf8');
console.log('FilterTabs.tsx:', filterTabsFile.split('\n').length, 'lines');

// ── Remove inline definitions from GoalsContent.tsx ───────────────────────────
// Remove from FilterTabs start to just before "// Main Goals Content Component"
const removeStart = filterTabs.start;
const removeEnd   = achievementsModal.end;

const newLines = [
    ...lines.slice(0, removeStart),
    '// FilterTabs — moved to ./components/FilterTabs.tsx',
    '// GoalDetailModal — moved to ./modals/GoalDetailModal.tsx',
    '// CreateGoalModal — moved to ./modals/CreateGoalModal.tsx',
    '// ProgressHistoryChart — moved to ./components/ProgressHistoryChart.tsx',
    '// CelebrationAnimation — moved to ./components/CelebrationAnimation.tsx',
    '// AchievementsModal — moved to ./modals/AchievementsModal.tsx',
    '',
    ...lines.slice(removeEnd),
];

fs.writeFileSync(srcFile, newLines.join('\n'), 'utf8');
console.log('\nGoalsContent.tsx new line count:', newLines.length);
console.log('Done.');
