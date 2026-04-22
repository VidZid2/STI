/**
 * extract-groups-components.js
 * Safely extracts components from GroupsContent.tsx using Node.js file I/O.
 * Run with: node scripts/extract-groups-components.js
 */
const fs = require('fs');
const path = require('path');

const srcFile = 'src/pages/studentdashboard/content/GroupsContent/GroupsContent.tsx';
const compDir = 'src/pages/studentdashboard/content/GroupsContent/components';

const content = fs.readFileSync(srcFile, 'utf8');
const lines = content.split('\n');

function extract(startMarker, endMarker) {
    const s = lines.findIndex(l => l.trim() === startMarker);
    const e = lines.findIndex(l => l.trim().startsWith(endMarker));
    if (s === -1 || e === -1) {
        console.error(`Marker not found: "${startMarker}" or "${endMarker}"`);
        process.exit(1);
    }
    return lines.slice(s, e).join('\n');
}

const groupsSkeleton = extract('// Skeleton Loading Component', '// Group Icon Component');
const filterTabs     = extract('// Filter Tabs Component', '// Member Avatar Stack Component');
const memberStack    = extract('// Member Avatar Stack Component', '// Simple Tooltip Portal Component');
const tooltipPortal  = extract('// Simple Tooltip Portal Component', '// Action Button with Tooltip Component');
const actionButton   = extract('// Action Button with Tooltip Component', '// Pinned Badge with Tooltip Component');
const pinnedBadge    = extract('// Pinned Badge with Tooltip Component', '// Group Card Component');
const groupCard      = extract('// Group Card Component', '// CreateGroupModal');

// ── GroupCard.tsx ─────────────────────────────────────────────────────────────
const groupCardFile = `/**
 * GroupCard + supporting UI components (TooltipPortal, ActionButtonWithTooltip,
 * PinnedBadgeWithTooltip, MemberAvatarStack)
 * Extracted from GroupsContent.tsx during Phase 8.2
 */
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import {
    groupCategoryConfig,
    getRoleInfo,
    formatLastActive,
    type GroupWithMembers,
} from '../../../../services/groupsService';
import GroupIcon from './GroupIcon';

${tooltipPortal}

${actionButton}

${pinnedBadge}

${memberStack}

${groupCard}

export { GroupCard, MemberAvatarStack };
`;

// ── GroupsSkeleton.tsx ────────────────────────────────────────────────────────
const skeletonFile = `/**
 * GroupsSkeleton
 * Loading skeleton for GroupsContent.
 * Extracted from GroupsContent.tsx during Phase 8.2
 */
import React from 'react';
import { motion } from 'motion/react';

${groupsSkeleton}

export { GroupsSkeleton };
`;

// ── FilterTabs.tsx ────────────────────────────────────────────────────────────
const filterTabsFile = `/**
 * FilterTabs
 * Filter tabs for GroupsContent (All / My Groups / Public).
 * Extracted from GroupsContent.tsx during Phase 8.2
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import type { GroupFilter, GroupStats } from '../../../../services/groupsService';

${filterTabs}

export { FilterTabs };
`;

fs.writeFileSync(path.join(compDir, 'GroupCard.tsx'), groupCardFile, 'utf8');
console.log('GroupCard.tsx:', groupCardFile.split('\n').length, 'lines');

fs.writeFileSync(path.join(compDir, 'GroupsSkeleton.tsx'), skeletonFile, 'utf8');
console.log('GroupsSkeleton.tsx:', skeletonFile.split('\n').length, 'lines');

fs.writeFileSync(path.join(compDir, 'FilterTabs.tsx'), filterTabsFile, 'utf8');
console.log('FilterTabs.tsx:', filterTabsFile.split('\n').length, 'lines');

console.log('Done.');
