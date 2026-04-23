/**
 * check-hook-imports.cjs
 * Finds files that use React hooks (useState, useEffect, useRef, useMemo, useCallback)
 * without importing them.
 */
const fs = require('fs');
const path = require('path');

function walk(dir) {
    const results = [];
    try {
        fs.readdirSync(dir).forEach(f => {
            const full = path.join(dir, f);
            try {
                const stat = fs.statSync(full);
                if (stat.isDirectory()) results.push(...walk(full));
                else if (f.endsWith('.tsx') || f.endsWith('.ts')) results.push(full);
            } catch (e) {}
        });
    } catch (e) {}
    return results;
}

const hooks = ['useState', 'useEffect', 'useRef', 'useMemo', 'useCallback', 'useContext', 'useReducer', 'useLayoutEffect', 'useImperativeHandle', 'useDebugValue'];

const files = walk('src/pages/studentdashboard');
const issues = [];

files.forEach(f => {
    let c;
    try { c = fs.readFileSync(f, 'utf8'); } catch (e) { return; }

    hooks.forEach(hook => {
        // Check if hook is used
        const usedRegex = new RegExp(`\\b${hook}\\s*\\(`);
        if (!usedRegex.test(c)) return;

        // Check if hook is imported (from react or destructured from React)
        const importedFromReact = new RegExp(`import.*\\b${hook}\\b.*from ['"]react['"]`);
        const importedFromMotion = new RegExp(`import.*\\b${hook}\\b.*from ['"]motion`);
        const destructuredFromReact = new RegExp(`React\\.${hook}\\s*\\(`);

        if (!importedFromReact.test(c) && !importedFromMotion.test(c) && !destructuredFromReact.test(c)) {
            issues.push({
                file: f.replace(/\\/g, '/').replace('src/pages/studentdashboard/', ''),
                hook,
            });
        }
    });
});

if (issues.length === 0) {
    console.log('✅ All hooks are properly imported!');
} else {
    console.log(`❌ Found ${issues.length} missing hook import(s):\n`);
    issues.forEach(issue => {
        console.log(`  ${issue.file} — missing import: ${issue.hook}`);
    });
}
