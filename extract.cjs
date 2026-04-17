const fs = require('fs');
const path = require('path');

const srcPath = path.resolve('src/pages/studentdashboard/content/GroupsContent/GroupsContent.tsx');
const destPath = path.resolve('src/pages/studentdashboard/content/GroupsContent/modals/InviteModal.tsx');

let content = fs.readFileSync(srcPath, 'utf-8');
const lines = content.split('\n');

const startIdx = lines.findIndex(line => line.includes('// Invite Modal Component'));
const endIdx = lines.findIndex((line, i) => i > startIdx && line.includes('// Create Group Modal Component'));

if (startIdx === -1 || endIdx === -1) {
    console.error('Could not find bounds of InviteModal. startIdx:', startIdx, 'endIdx:', endIdx);
    process.exit(1);
}

const modalLines = lines.slice(startIdx, endIdx);
while(modalLines[modalLines.length - 1].trim() === '') {
    modalLines.pop();
}
let modalCode = modalLines.join('\n');

modalCode = modalCode.replace(/import\('\.\.\/\.\.\/\.\.\/\.\.\/services\/groupsService'\)/g, "import('../../../../../services/groupsService')");

const fileHeader = `import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import type { GroupWithMembers } from '../../../../../services/groupsService';

`;

fs.writeFileSync(destPath, fileHeader + modalCode + '\n\nexport default InviteModal;\n');
console.log('Created InviteModal.tsx');

let newLines = [
    ...lines.slice(0, startIdx),
    ...lines.slice(endIdx)
];

const lastGroupImportIdx = newLines.findIndex(line => line.includes(`import GroupDetailModal`));
if (lastGroupImportIdx !== -1) {
    newLines.splice(lastGroupImportIdx + 1, 0, `import InviteModal from './modals/InviteModal';`);
} else {
    newLines.splice(0, 0, `import InviteModal from './modals/InviteModal';`);
}

fs.writeFileSync(srcPath, newLines.join('\n'));
console.log('Updated GroupsContent.tsx');
