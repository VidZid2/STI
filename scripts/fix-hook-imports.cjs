/**
 * fix-hook-imports.cjs
 * Automatically fixes missing React hook imports in extracted component files.
 */
const fs = require('fs');
const path = require('path');

const filesToFix = [
    { file: 'src/pages/studentdashboard/content/CatalogContent/components/CourseCard.tsx', hooks: ['useEffect'] },
    { file: 'src/pages/studentdashboard/content/GoalsContent/components/CelebrationAnimation.tsx', hooks: ['useMemo'] },
    { file: 'src/pages/studentdashboard/content/GoalsContent/components/ProgressHistoryChart.tsx', hooks: ['useEffect', 'useRef', 'useMemo'] },
    { file: 'src/pages/studentdashboard/content/GoalsContent/modals/AchievementsModal.tsx', hooks: ['useMemo'] },
    { file: 'src/pages/studentdashboard/content/ToolsContent/components/ToolsShared.tsx', hooks: ['useCallback'] },
    { file: 'src/pages/studentdashboard/content/UsersContent/components/TeacherSpotlight.tsx', hooks: ['useEffect'] },
    { file: 'src/pages/studentdashboard/content/UsersContent/components/UserCard.tsx', hooks: ['useEffect'] },
    { file: 'src/pages/studentdashboard/content/UsersContent/modals/UserDetailModal.tsx', hooks: ['useCallback'] },
    { file: 'src/pages/studentdashboard/FocusModePage/components/MotivationalQuote.tsx', hooks: ['useCallback'] },
    { file: 'src/pages/studentdashboard/FocusModePage/components/PomodoroTimer.tsx', hooks: ['useCallback'] },
    { file: 'src/pages/studentdashboard/FocusModePage/components/ResourceCard.tsx', hooks: ['useCallback'] },
    { file: 'src/pages/studentdashboard/FocusModePage/components/SessionHistory.tsx', hooks: ['useMemo'] },
    { file: 'src/pages/studentdashboard/content/PathsContent/modals/PathCertificateModal.tsx', hooks: ['useEffect'] },
];

filesToFix.forEach(({ file, hooks }) => {
    let c = fs.readFileSync(file, 'utf8');

    // Find the existing React import line
    const reactImportMatch = c.match(/^import React.*from ['"]react['"];?/m);
    if (!reactImportMatch) {
        console.log(`SKIP (no React import): ${file}`);
        return;
    }

    const existingImport = reactImportMatch[0];

    // Extract already-imported hooks
    const alreadyImported = [];
    const destructureMatch = existingImport.match(/\{([^}]+)\}/);
    if (destructureMatch) {
        destructureMatch[1].split(',').forEach(h => alreadyImported.push(h.trim()));
    }

    // Add missing hooks
    const toAdd = hooks.filter(h => !alreadyImported.includes(h));
    if (toAdd.length === 0) {
        console.log(`OK (already imported): ${file}`);
        return;
    }

    // Build new import
    const allHooks = [...alreadyImported, ...toAdd].filter(Boolean);
    let newImport;
    if (allHooks.length > 0) {
        newImport = `import React, { ${allHooks.join(', ')} } from 'react';`;
    } else {
        newImport = `import React from 'react';`;
    }

    // Handle case where existing import has no destructuring
    if (!destructureMatch) {
        newImport = `import React, { ${toAdd.join(', ')} } from 'react';`;
    }

    c = c.replace(existingImport, newImport);
    fs.writeFileSync(file, c, 'utf8');
    console.log(`FIXED: ${path.basename(file)} — added: ${toAdd.join(', ')}`);
});

console.log('\nDone.');
