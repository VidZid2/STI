/**
 * extract-tools-components.cjs
 * Extracts inline components from ToolsContent.tsx into separate files.
 */
const fs = require('fs');
const path = require('path');

const srcFile = 'src/pages/studentdashboard/content/ToolsContent/ToolsContent.tsx';
const content = fs.readFileSync(srcFile, 'utf8');
const lines = content.split('\n');

const compDir = 'src/pages/studentdashboard/content/ToolsContent/components';
const modDir  = 'src/pages/studentdashboard/content/ToolsContent/modals';
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

const successConfetti = extract('// Minimalistic Success Confetti Component', 'const ToolItem');
const toolItem        = extract('const ToolItem', 'const ResultModal');
const resultModal     = extract('const ResultModal', '// Premium Category Tabs Component');
const categoryTabs    = extract('// Premium Category Tabs Component', '// Premium Skeleton Loading Component');
const toolsSkeleton   = extract('// Premium Skeleton Loading Component', 'const ToolsContent');

console.log('SuccessConfetti:', successConfetti.end - successConfetti.start, 'lines');
console.log('ToolItem:', toolItem.end - toolItem.start, 'lines');
console.log('ResultModal:', resultModal.end - resultModal.start, 'lines');
console.log('CategoryTabs:', categoryTabs.end - categoryTabs.start, 'lines');
console.log('ToolsSkeleton:', toolsSkeleton.end - toolsSkeleton.start, 'lines');

// ── ToolItem.tsx ──────────────────────────────────────────────────────────────
const toolItemFile = `/**
 * ToolItem + SuccessConfetti
 * Individual tool card with file processing.
 * Extracted from ToolsContent.tsx during Phase 8.7
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

${successConfetti.code}

${toolItem.code}

export { ToolItem, SuccessConfetti };
`;

// ── ResultModal.tsx ───────────────────────────────────────────────────────────
const resultModalFile = `/**
 * ResultModal
 * Analysis result display modal.
 * Extracted from ToolsContent.tsx during Phase 8.7
 */
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';

${resultModal.code}

export { ResultModal };
`;

// ── ToolsShared.tsx ───────────────────────────────────────────────────────────
const toolsSharedFile = `/**
 * ToolsShared - CategoryTabs + ToolsSkeleton
 * Shared UI components for ToolsContent.
 * Extracted from ToolsContent.tsx during Phase 8.7
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';

${categoryTabs.code}

${toolsSkeleton.code}

export { CategoryTabs, ToolsSkeleton };
`;

// Write files
fs.writeFileSync(path.join(compDir, 'ToolItem.tsx'), toolItemFile, 'utf8');
console.log('\nToolItem.tsx:', toolItemFile.split('\n').length, 'lines');

fs.writeFileSync(path.join(modDir, 'ResultModal.tsx'), resultModalFile, 'utf8');
console.log('ResultModal.tsx:', resultModalFile.split('\n').length, 'lines');

fs.writeFileSync(path.join(compDir, 'ToolsShared.tsx'), toolsSharedFile, 'utf8');
console.log('ToolsShared.tsx:', toolsSharedFile.split('\n').length, 'lines');

// ── Remove inline definitions ─────────────────────────────────────────────────
const removeStart = successConfetti.start;
const removeEnd   = toolsSkeleton.end;

const newLines = [
    ...lines.slice(0, removeStart),
    '// SuccessConfetti + ToolItem — moved to ./components/ToolItem.tsx',
    '// ResultModal — moved to ./modals/ResultModal.tsx',
    '// CategoryTabs + ToolsSkeleton — moved to ./components/ToolsShared.tsx',
    '',
    ...lines.slice(removeEnd),
];

fs.writeFileSync(srcFile, newLines.join('\n'), 'utf8');
console.log('\nToolsContent.tsx new line count:', newLines.length);
console.log('Done.');
