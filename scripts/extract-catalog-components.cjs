/**
 * extract-catalog-components.cjs
 * Extracts inline components from CatalogContent.tsx into separate files.
 */
const fs = require('fs');
const path = require('path');

const srcFile = 'src/pages/studentdashboard/content/CatalogContent/CatalogContent.tsx';
const content = fs.readFileSync(srcFile, 'utf8');
const lines = content.split('\n');

const compDir = 'src/pages/studentdashboard/content/CatalogContent/components';
const modDir  = 'src/pages/studentdashboard/content/CatalogContent/modals';
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

const animatedNumber  = extract('// Animated Number Component', '// Category Icon Component');
const categoryIcon    = extract('// Category Icon Component', '// Skeleton Loading Component');
const catalogSkeleton = extract('// Skeleton Loading Component', '// Filter Tabs Component');
const filterTabs      = extract('// Filter Tabs Component', '// Course Card Component');
const courseCard      = extract('// Course Card Component', '// Course List Item Component');
const courseListItem  = extract('// Course List Item Component', '// Course Detail Modal');
const courseDetailModal = extract('// Course Detail Modal', '// Main CatalogContent Component');

console.log('AnimatedNumber + CategoryIcon + Skeleton:', catalogSkeleton.end - animatedNumber.start, 'lines');
console.log('FilterTabs:', filterTabs.end - filterTabs.start, 'lines');
console.log('CourseCard:', courseCard.end - courseCard.start, 'lines');
console.log('CourseListItem:', courseListItem.end - courseListItem.start, 'lines');
console.log('CourseDetailModal:', courseDetailModal.end - courseDetailModal.start, 'lines');

// ── CatalogShared.tsx ─────────────────────────────────────────────────────────
const sharedFile = `/**
 * CatalogShared - AnimatedNumber, CategoryIcon, CatalogSkeleton
 * Extracted from CatalogContent.tsx during Phase 8.7
 */
import React, { useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { useMotionValue, useSpring, useTransform } from 'motion/react';

${animatedNumber.code}

${categoryIcon.code}

${catalogSkeleton.code}

export { AnimatedNumber, CategoryIcon, CatalogSkeleton };
`;

// ── CatalogFilterTabs.tsx ─────────────────────────────────────────────────────
const filterTabsFile = `/**
 * CatalogFilterTabs
 * Filter tabs for CatalogContent.
 * Extracted from CatalogContent.tsx during Phase 8.7
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import type { CourseCategory } from '../../../../../services/catalogService';

${filterTabs.code}

export { FilterTabs };
`;

// ── CourseCard.tsx ────────────────────────────────────────────────────────────
const courseCardFile = `/**
 * CourseCard + CourseListItem
 * Course display components for CatalogContent.
 * Extracted from CatalogContent.tsx during Phase 8.7
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { CatalogCourse } from '../../../../../services/catalogService';
import { CategoryIcon } from './CatalogShared';

${courseCard.code}

${courseListItem.code}

export { CourseCard, CourseListItem };
`;

// ── CourseDetailModal.tsx ─────────────────────────────────────────────────────
const courseDetailFile = `/**
 * CourseDetailModal
 * Detailed course information modal.
 * Extracted from CatalogContent.tsx during Phase 8.7
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import type { CatalogCourse } from '../../../../../services/catalogService';
import { CategoryIcon } from '../components/CatalogShared';

${courseDetailModal.code}

export { CourseDetailModal };
export default CourseDetailModal;
`;

// Write files
fs.writeFileSync(path.join(compDir, 'CatalogShared.tsx'), sharedFile, 'utf8');
console.log('\nCatalogShared.tsx:', sharedFile.split('\n').length, 'lines');

fs.writeFileSync(path.join(compDir, 'CatalogFilterTabs.tsx'), filterTabsFile, 'utf8');
console.log('CatalogFilterTabs.tsx:', filterTabsFile.split('\n').length, 'lines');

fs.writeFileSync(path.join(compDir, 'CourseCard.tsx'), courseCardFile, 'utf8');
console.log('CourseCard.tsx:', courseCardFile.split('\n').length, 'lines');

fs.writeFileSync(path.join(modDir, 'CourseDetailModal.tsx'), courseDetailFile, 'utf8');
console.log('CourseDetailModal.tsx:', courseDetailFile.split('\n').length, 'lines');

// ── Remove inline definitions ─────────────────────────────────────────────────
const removeStart = animatedNumber.start;
const removeEnd   = courseDetailModal.end;

const newLines = [
    ...lines.slice(0, removeStart),
    '// AnimatedNumber + CategoryIcon + CatalogSkeleton — moved to ./components/CatalogShared.tsx',
    '// FilterTabs — moved to ./components/CatalogFilterTabs.tsx',
    '// CourseCard + CourseListItem — moved to ./components/CourseCard.tsx',
    '// CourseDetailModal — moved to ./modals/CourseDetailModal.tsx',
    '',
    ...lines.slice(removeEnd),
];

fs.writeFileSync(srcFile, newLines.join('\n'), 'utf8');
console.log('\nCatalogContent.tsx new line count:', newLines.length);
console.log('Done.');
