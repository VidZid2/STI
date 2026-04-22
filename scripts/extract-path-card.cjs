/**
 * extract-path-card.cjs
 * Extracts the PathCard inline JSX from PathsContent.tsx.
 */
const fs = require('fs');
const path = require('path');

const srcFile = 'src/pages/studentdashboard/content/PathsContent/PathsContent.tsx';
const content = fs.readFileSync(srcFile, 'utf8');
const lines = content.split('\n');

const compDir = 'src/pages/studentdashboard/content/PathsContent/components';

// The map is: filteredPaths.map((path, index) => { ... return ( ... ); })
// Line 1326 (idx 1325): filteredPaths.map((path, index) => {
// Line 1950 (idx 1949): })

const mapStart = 1325; // 0-indexed
const mapEnd   = 1949; // 0-indexed

console.log('Map start:', lines[mapStart].trim());
console.log('Map end:', lines[mapEnd].trim());
console.log('Lines:', mapEnd - mapStart + 1);

// The card JSX is inside the map callback
// Find the return ( inside the map
const returnIdx = lines.findIndex((l, i) => i > mapStart && i < mapEnd && l.trim() === 'return (');
const returnEndIdx = lines.findIndex((l, i) => i > returnIdx && i < mapEnd && l.trim() === ');');

console.log('return( at line:', returnIdx + 1);
console.log('); at line:', returnEndIdx + 1);
console.log('Card JSX lines:', returnEndIdx - returnIdx - 1);

// Extract the card JSX (between return ( and );)
const cardJSX = lines.slice(returnIdx + 1, returnEndIdx).join('\n');

// Extract the variables defined before return (
const preReturnCode = lines.slice(mapStart + 1, returnIdx).join('\n');
console.log('\nPre-return code lines:', preReturnCode.split('\n').length);
console.log('Pre-return code (first 5 lines):');
preReturnCode.split('\n').slice(0, 5).forEach(l => console.log(' ', l));

// Build PathCard.tsx
const pathCardFile = `/**
 * PathCard
 * Individual learning path card with enrollment, progress, and actions.
 * Extracted from PathsContent.tsx during Phase 8.6 continuation.
 */
import * as React from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    enrollInPath,
    getDifficultyInfo,
    getPathCourses,
    isCourseUnlocked,
    type PathWithProgress,
} from '../../../../../services/pathsService';
import { PathIcon } from './PathIcon';
import { ProgressRingWithTooltip } from './PathProgressRing';
import { PathDetailModal } from '../modals/PathDetailModal';
import { PathCertificateModal } from '../modals/PathCertificateModal';

interface PathCardProps {
    path: PathWithProgress;
    index: number;
    isDarkMode: boolean;
    colors: {
        bg: string;
        cardBg: string;
        border: string;
        textPrimary: string;
        textSecondary: string;
        textMuted: string;
        accent: string;
    };
    onPathSelect?: (pathId: string) => void;
}

export const PathCard: React.FC<PathCardProps> = ({ path, index, isDarkMode, colors, onPathSelect }) => {
${preReturnCode}
    return (
${cardJSX}
    );
};

export default PathCard;
`;

fs.writeFileSync(path.join(compDir, 'PathCard.tsx'), pathCardFile, 'utf8');
console.log('\nPathCard.tsx written:', pathCardFile.split('\n').length, 'lines');

// Replace the map in PathsContent.tsx with <PathCard ... />
const replacement = [
    '                filteredPaths.map((path, index) => (',
    '                    <PathCard',
    '                        key={path.id}',
    '                        path={path}',
    '                        index={index}',
    '                        isDarkMode={isDarkMode}',
    '                        colors={colors}',
    '                        onPathSelect={onPathSelect}',
    '                    />',
    '                ))',
];

const newLines = [
    ...lines.slice(0, mapStart),
    ...replacement,
    ...lines.slice(mapEnd + 1),
];

fs.writeFileSync(srcFile, newLines.join('\n'), 'utf8');
console.log('PathsContent.tsx new line count:', newLines.length);
console.log('Done.');
