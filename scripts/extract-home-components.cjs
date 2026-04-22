/**
 * extract-home-components.cjs
 * Extracts inline components from HomeContent.tsx into separate files.
 */
const fs = require('fs');
const path = require('path');

const srcFile = 'src/pages/studentdashboard/content/HomeContent/HomeContent.tsx';
const content = fs.readFileSync(srcFile, 'utf8');
const lines = content.split('\n');

const compDir = 'src/pages/studentdashboard/content/HomeContent/components';
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

const progressRing    = extract('// Circular Progress Ring Component', '// Quick Stats Badge Component');
const whatsNewButton  = extract('// What\'s New Button with Portal Tooltip', '// Animated Flame Component');
const confettiBurst   = extract('// Confetti Burst Component', '// News Slideshow Component');
const newsSlideshow   = extract('// News Slideshow Component', '// Achievement Toast Component');
const achievementToast= extract('// Achievement Toast Component', '// Minimalistic Role Badges Component');
const roleBadge       = extract('// Minimalistic Role Badges Component', '// Skeleton Loading Component');
const homeSkeleton    = extract('// Skeleton Loading Component with dark mode support', 'const HomeContent');

console.log('ProgressRing:', progressRing.end - progressRing.start, 'lines');
console.log('WhatsNewButton:', whatsNewButton.end - whatsNewButton.start, 'lines');
console.log('ConfettiBurst:', confettiBurst.end - confettiBurst.start, 'lines');
console.log('NewsSlideshow:', newsSlideshow.end - newsSlideshow.start, 'lines');
console.log('AchievementToast:', achievementToast.end - achievementToast.start, 'lines');
console.log('RoleBadge:', roleBadge.end - roleBadge.start, 'lines');
console.log('HomeSkeleton:', homeSkeleton.end - homeSkeleton.start, 'lines');

// ── HomeShared.tsx ────────────────────────────────────────────────────────────
const homeSharedFile = `/**
 * HomeShared - ProgressRing, WhatsNewButton, ConfettiBurst, RoleBadge, HomeSkeleton
 * Shared UI components for HomeContent.
 * Extracted from HomeContent.tsx during Phase 8.8
 */
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';

${progressRing.code}

${whatsNewButton.code}

${confettiBurst.code}

${roleBadge.code}

${homeSkeleton.code}

export { ProgressRing, WhatsNewButton, ConfettiBurst, RoleBadge, HomeSkeleton };
`;

// ── NewsSlideshow.tsx ─────────────────────────────────────────────────────────
const newsSlideshowFile = `/**
 * NewsSlideshow
 * Rotating news/announcements slideshow for HomeContent.
 * Extracted from HomeContent.tsx during Phase 8.8
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

${newsSlideshow.code}

export { NewsSlideshow };
`;

// ── AchievementToast.tsx ──────────────────────────────────────────────────────
const achievementToastFile = `/**
 * AchievementToast
 * Bottom-left achievement notification toast.
 * Extracted from HomeContent.tsx during Phase 8.8
 */
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';

${achievementToast.code}

export { AchievementToast };
`;

// Write files
fs.writeFileSync(path.join(compDir, 'HomeShared.tsx'), homeSharedFile, 'utf8');
console.log('\nHomeShared.tsx:', homeSharedFile.split('\n').length, 'lines');

fs.writeFileSync(path.join(compDir, 'NewsSlideshow.tsx'), newsSlideshowFile, 'utf8');
console.log('NewsSlideshow.tsx:', newsSlideshowFile.split('\n').length, 'lines');

fs.writeFileSync(path.join(compDir, 'AchievementToast.tsx'), achievementToastFile, 'utf8');
console.log('AchievementToast.tsx:', achievementToastFile.split('\n').length, 'lines');

// ── Remove inline definitions from HomeContent.tsx ────────────────────────────
const removeStart = progressRing.start;
const removeEnd   = homeSkeleton.end;

const newLines = [
    ...lines.slice(0, removeStart),
    '// ProgressRing + WhatsNewButton + ConfettiBurst + RoleBadge + HomeSkeleton — moved to ./components/HomeShared.tsx',
    '// NewsSlideshow — moved to ./components/NewsSlideshow.tsx',
    '// AchievementToast — moved to ./components/AchievementToast.tsx',
    '',
    ...lines.slice(removeEnd),
];

fs.writeFileSync(srcFile, newLines.join('\n'), 'utf8');
console.log('\nHomeContent.tsx new line count:', newLines.length);
console.log('Done.');
