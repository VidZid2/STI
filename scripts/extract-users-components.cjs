/**
 * extract-users-components.cjs
 * Extracts inline components from UsersContent.tsx into separate files.
 */
const fs = require('fs');
const path = require('path');

const srcFile = 'src/pages/studentdashboard/content/UsersContent/UsersContent.tsx';
const compDir = 'src/pages/studentdashboard/content/UsersContent/components';
const modDir  = 'src/pages/studentdashboard/content/UsersContent/modals';

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

const filterTabs          = extract('const FilterTabs', '// Quick Action Button Component');
const quickActionButton   = extract('// Quick Action Button Component', 'const HeartIcon');
const heartIcon           = extract('const HeartIcon', '// User Card Component');
const userCard            = extract('// User Card Component', '// User List Item Component');
const userListItem        = extract('// User List Item Component', '// Empty State Component');
const emptyState          = extract('// Empty State Component', '// Skeleton Shimmer Animation Component');
const skeletonPulse       = extract('// Skeleton Shimmer Animation Component', '// User Card Skeleton Component');
const userCardSkeleton    = extract('// User Card Skeleton Component', '// Teacher Spotlight Skeleton');
const teacherSpotlightSkel= extract('// Teacher Spotlight Skeleton', 'const TeacherSpotlight');
const teacherSpotlight    = extract('const TeacherSpotlight', 'const UserDetailModal');
const userDetailModal     = extract('const UserDetailModal', '// Main UsersContent Component');

console.log('FilterTabs:', filterTabs.end - filterTabs.start, 'lines');
console.log('QuickActionButton + HeartIcon:', (heartIcon.end - quickActionButton.start), 'lines');
console.log('UserCard:', userCard.end - userCard.start, 'lines');
console.log('UserListItem:', userListItem.end - userListItem.start, 'lines');
console.log('EmptyState + Skeletons:', userCardSkeleton.end - emptyState.start, 'lines');
console.log('TeacherSpotlight:', teacherSpotlight.end - teacherSpotlightSkel.start, 'lines');
console.log('UserDetailModal:', userDetailModal.end - userDetailModal.start, 'lines');

// ── UserCard.tsx ──────────────────────────────────────────────────────────────
const userCardFile = `/**
 * UserCard + UserListItem + QuickActionButton + HeartIcon
 * Extracted from UsersContent.tsx during Phase 8.4
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { getRoleInfo, type UserAccount } from '../../../../../services/usersService';
import UserAvatar from './UserAvatar';
import RoleIcon from './RoleIcon';
import ActionTooltip from './ActionTooltip';

${quickActionButton.code}

${heartIcon.code}

${userCard.code}

${userListItem.code}

export { UserCard, UserListItem };
`;

// ── UsersSkeleton.tsx ─────────────────────────────────────────────────────────
const skeletonFile = `/**
 * UsersSkeleton components (SkeletonPulse, UserCardSkeleton)
 * Extracted from UsersContent.tsx during Phase 8.4
 */
import React from 'react';
import { motion } from 'motion/react';

${skeletonPulse.code}

${userCardSkeleton.code}

export { SkeletonPulse, UserCardSkeleton };
`;

// ── TeacherSpotlight.tsx ──────────────────────────────────────────────────────
const teacherSpotlightFile = `/**
 * TeacherSpotlight + TeacherSpotlightSkeleton
 * Extracted from UsersContent.tsx during Phase 8.4
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getRoleInfo } from '../../../../../services/usersService';
import UserAvatar from './UserAvatar';

${teacherSpotlightSkel.code}

${teacherSpotlight.code}

export { TeacherSpotlight, TeacherSpotlightSkeleton };
`;

// ── UsersEmptyState.tsx ───────────────────────────────────────────────────────
const emptyStateFile = `/**
 * UsersEmptyState
 * Empty state display for UsersContent.
 * Extracted from UsersContent.tsx during Phase 8.4
 */
import React from 'react';
import { motion } from 'motion/react';

${emptyState.code}

export { EmptyState };
`;

// ── FilterTabs.tsx ────────────────────────────────────────────────────────────
const filterTabsFile = `/**
 * FilterTabs
 * Filter tabs for UsersContent (All / Student / Teacher / Admin).
 * Extracted from UsersContent.tsx during Phase 8.4
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import type { UserFilter } from '../../../../../services/usersService';

${filterTabs.code}

export { FilterTabs };
`;

// ── UserDetailModal.tsx ───────────────────────────────────────────────────────
const userDetailFile = `/**
 * UserDetailModal
 * Detailed user profile modal.
 * Extracted from UsersContent.tsx during Phase 8.4
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getRoleInfo, type UserAccount } from '../../../../../services/usersService';
import UserAvatar from '../components/UserAvatar';

${userDetailModal.code}

export { UserDetailModal };
export default UserDetailModal;
`;

// Write files
fs.writeFileSync(path.join(compDir, 'UserCard.tsx'), userCardFile, 'utf8');
console.log('\nUserCard.tsx:', userCardFile.split('\n').length, 'lines');

fs.writeFileSync(path.join(compDir, 'UsersSkeleton.tsx'), skeletonFile, 'utf8');
console.log('UsersSkeleton.tsx:', skeletonFile.split('\n').length, 'lines');

fs.writeFileSync(path.join(compDir, 'TeacherSpotlight.tsx'), teacherSpotlightFile, 'utf8');
console.log('TeacherSpotlight.tsx:', teacherSpotlightFile.split('\n').length, 'lines');

fs.writeFileSync(path.join(compDir, 'UsersEmptyState.tsx'), emptyStateFile, 'utf8');
console.log('UsersEmptyState.tsx:', emptyStateFile.split('\n').length, 'lines');

fs.writeFileSync(path.join(compDir, 'FilterTabs.tsx'), filterTabsFile, 'utf8');
console.log('FilterTabs.tsx:', filterTabsFile.split('\n').length, 'lines');

fs.writeFileSync(path.join(modDir, 'UserDetailModal.tsx'), userDetailFile, 'utf8');
console.log('UserDetailModal.tsx:', userDetailFile.split('\n').length, 'lines');

// ── Remove inline definitions from UsersContent.tsx ───────────────────────────
const removeStart = filterTabs.start;
const removeEnd   = userDetailModal.end;

const newLines = [
    ...lines.slice(0, removeStart),
    '// FilterTabs — moved to ./components/FilterTabs.tsx',
    '// QuickActionButton + HeartIcon + UserCard + UserListItem — moved to ./components/UserCard.tsx',
    '// EmptyState — moved to ./components/UsersEmptyState.tsx',
    '// SkeletonPulse + UserCardSkeleton — moved to ./components/UsersSkeleton.tsx',
    '// TeacherSpotlightSkeleton + TeacherSpotlight — moved to ./components/TeacherSpotlight.tsx',
    '// UserDetailModal — moved to ./modals/UserDetailModal.tsx',
    '',
    ...lines.slice(removeEnd),
];

fs.writeFileSync(srcFile, newLines.join('\n'), 'utf8');
console.log('\nUsersContent.tsx new line count:', newLines.length);
console.log('Done.');
