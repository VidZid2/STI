/**
 * extract-paths-components.cjs
 * Extracts inline components from PathsContent.tsx into separate files.
 */
const fs = require('fs');
const path = require('path');

const srcFile = 'src/pages/studentdashboard/content/PathsContent/PathsContent.tsx';
const content = fs.readFileSync(srcFile, 'utf8');
const lines = content.split('\n');

// Ensure components directory exists
const compDir = 'src/pages/studentdashboard/content/PathsContent/components';
const modDir  = 'src/pages/studentdashboard/content/PathsContent/modals';
if (!fs.existsSync(compDir)) fs.mkdirSync(compDir, { recursive: true });
if (!fs.existsSync(modDir))  fs.mkdirSync(modDir,  { recursive: true });

function extract(startMarker, endMarker) {
    const s = lines.findIndex(l => l.trim().startsWith(startMarker));
    const e = lines.findIndex(l => l.trim().startsWith(endMarker));
    if (s === -1 || e === -1) {
        console.error(`Marker not found: "${startMarker}" (${s}) or "${endMarker}" (${e})`);
        process.exit(1);
    }
    return { start: s, end: e, code: lines.slice(s, e).join('\n') };
}

const pathIcon          = extract('// Path icon component', '// Progress Ring with Animated Hover Tooltip');
const progressRing      = extract('// Progress Ring with Animated Hover Tooltip', '// Hover Tooltip Component for Modal');
const modalTooltip      = extract('// Hover Tooltip Component for Modal', '// Filter Tabs Component');
const filterTabs        = extract('// Filter Tabs Component with proper sliding indicator', 'const PathsContent');
// PathDetailModal and PathCertificateModal are inside filterTabs range — split them
const pathDetailModal   = extract('// Path Detail Modal Component', 'const PathCertificateModal');
const pathCertModal     = extract('const PathCertificateModal', 'const PathsContent');

// Recalculate filterTabs to stop before PathDetailModal
const filterTabsOnly    = extract('// Filter Tabs Component with proper sliding indicator', '// Path Detail Modal Component');

console.log('PathIcon:', pathIcon.end - pathIcon.start, 'lines');
console.log('ProgressRing + ModalTooltip:', modalTooltip.end - progressRing.start, 'lines');
console.log('FilterTabs:', filterTabsOnly.end - filterTabsOnly.start, 'lines');
console.log('PathDetailModal:', pathDetailModal.end - pathDetailModal.start, 'lines');
console.log('PathCertificateModal:', pathCertModal.end - pathCertModal.start, 'lines');

// ── PathIcon.tsx ──────────────────────────────────────────────────────────────
const pathIconFile = `/**
 * PathIcon
 * Icon renderer for learning paths.
 * Extracted from PathsContent.tsx during Phase 8.6
 */
import React from 'react';

${pathIcon.code}

export { PathIcon };
`;

// ── PathProgressRing.tsx ──────────────────────────────────────────────────────
const progressRingFile = `/**
 * PathProgressRing + ModalTooltip
 * Animated progress ring with hover tooltip.
 * Extracted from PathsContent.tsx during Phase 8.6
 */
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';

${progressRing.code}

${modalTooltip.code}

export { ProgressRingWithTooltip, ModalTooltip };
`;

// ── PathFilterTabs.tsx ────────────────────────────────────────────────────────
const filterTabsFile = `/**
 * PathFilterTabs
 * Filter tabs for PathsContent (All / In Progress / Completed / Bookmarked).
 * Extracted from PathsContent.tsx during Phase 8.6
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

${filterTabsOnly.code}

export { FilterTabs };
`;

// ── PathDetailModal.tsx ───────────────────────────────────────────────────────
// Read the top of the file to get the imports we need
const topSection = lines.slice(0, 30).join('\n');

const pathDetailFile = `/**
 * PathDetailModal
 * Detailed path overview modal with enrollment and progress.
 * Extracted from PathsContent.tsx during Phase 8.6
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import {
    enrollInPath,
    unenrollFromPath,
    bookmarkPath,
    type PathWithProgress,
} from '../../../../../services/pathsService';
import PathIcon from '../components/PathIcon';
import { ProgressRingWithTooltip, ModalTooltip } from '../components/PathProgressRing';

${pathDetailModal.code}

export { PathDetailModal };
`;

// ── PathCertificateModal.tsx ──────────────────────────────────────────────────
const pathCertFile = `/**
 * PathCertificateModal
 * Certificate display modal for completed paths.
 * Extracted from PathsContent.tsx during Phase 8.6
 */
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import type { PathWithProgress } from '../../../../../services/pathsService';

${pathCertModal.code}

export { PathCertificateModal };
`;

// Write files
fs.writeFileSync(path.join(compDir, 'PathIcon.tsx'), pathIconFile, 'utf8');
console.log('\nPathIcon.tsx:', pathIconFile.split('\n').length, 'lines');

fs.writeFileSync(path.join(compDir, 'PathProgressRing.tsx'), progressRingFile, 'utf8');
console.log('PathProgressRing.tsx:', progressRingFile.split('\n').length, 'lines');

fs.writeFileSync(path.join(compDir, 'PathFilterTabs.tsx'), filterTabsFile, 'utf8');
console.log('PathFilterTabs.tsx:', filterTabsFile.split('\n').length, 'lines');

fs.writeFileSync(path.join(modDir, 'PathDetailModal.tsx'), pathDetailFile, 'utf8');
console.log('PathDetailModal.tsx:', pathDetailFile.split('\n').length, 'lines');

fs.writeFileSync(path.join(modDir, 'PathCertificateModal.tsx'), pathCertFile, 'utf8');
console.log('PathCertificateModal.tsx:', pathCertFile.split('\n').length, 'lines');

// ── Remove inline definitions from PathsContent.tsx ───────────────────────────
const removeStart = pathIcon.start;
const removeEnd   = pathCertModal.end;

const newLines = [
    ...lines.slice(0, removeStart),
    '// PathIcon — moved to ./components/PathIcon.tsx',
    '// ProgressRingWithTooltip + ModalTooltip — moved to ./components/PathProgressRing.tsx',
    '// FilterTabs — moved to ./components/PathFilterTabs.tsx',
    '// PathDetailModal — moved to ./modals/PathDetailModal.tsx',
    '// PathCertificateModal — moved to ./modals/PathCertificateModal.tsx',
    '',
    ...lines.slice(removeEnd),
];

fs.writeFileSync(srcFile, newLines.join('\n'), 'utf8');
console.log('\nPathsContent.tsx new line count:', newLines.length);
console.log('Done.');
