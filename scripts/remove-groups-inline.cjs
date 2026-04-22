/**
 * remove-groups-inline.cjs
 * Removes the inline component definitions from GroupsContent.tsx
 * that have been moved to separate files.
 */
const fs = require('fs');

const srcFile = 'src/pages/studentdashboard/content/GroupsContent/GroupsContent.tsx';
const content = fs.readFileSync(srcFile, 'utf8');
const lines = content.split('\n');

// Remove everything from "// Skeleton Loading Component" to just before "// Main GroupsContent Component"
const startIdx = lines.findIndex(l => l.trim() === '// Skeleton Loading Component');
const endIdx   = lines.findIndex(l => l.trim() === '// Main GroupsContent Component');

if (startIdx === -1 || endIdx === -1) {
    console.error('Markers not found!');
    console.log('startIdx:', startIdx, 'endIdx:', endIdx);
    process.exit(1);
}

console.log(`Removing lines ${startIdx + 1} to ${endIdx} (${endIdx - startIdx - 1} lines)`);

const newLines = [
    ...lines.slice(0, startIdx),
    '// GroupsSkeleton — moved to ./components/GroupsSkeleton.tsx',
    '// FilterTabs — moved to ./components/FilterTabs.tsx',
    '// MemberAvatarStack, TooltipPortal, ActionButtonWithTooltip, PinnedBadgeWithTooltip, GroupCard — moved to ./components/GroupCard.tsx',
    '',
    ...lines.slice(endIdx),
];

fs.writeFileSync(srcFile, newLines.join('\n'), 'utf8');
console.log('Done. New line count:', newLines.length);
