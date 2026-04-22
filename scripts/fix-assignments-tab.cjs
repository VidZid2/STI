/**
 * fix-assignments-tab.cjs
 * Fixes the CourseAssignmentsTab.tsx structure.
 * The script added a return ( wrapper around the case block which is invalid.
 * The case block already has its own return statements.
 */
const fs = require('fs');

const srcFile = 'src/pages/studentdashboard/content/CourseViewPage/tabs/CourseAssignmentsTab.tsx';
const content = fs.readFileSync(srcFile, 'utf8');
const lines = content.split('\n');

// Find the outer return ( that wraps the case block (line 83, idx 82)
const outerReturnIdx = lines.findIndex((l, i) => i > 80 && i < 90 && l.trim() === 'return (');
console.log('Outer return( at line:', outerReturnIdx + 1, '|', lines[outerReturnIdx]);

// Find the case 'assignments': line right after
const caseIdx = lines.findIndex((l, i) => i > outerReturnIdx && l.trim() === "case 'assignments':");
console.log('case assignments: at line:', caseIdx + 1);

// Find the stray ); at the end (the one added by the script template)
// It's the last ); before the }; closing
const lastClosingIdx = lines.findLastIndex(l => l.trim() === ');');
console.log('Last ); at line:', lastClosingIdx + 1);
console.log('Line before:', lines[lastClosingIdx - 1].trim());
console.log('Line after:', lines[lastClosingIdx + 1].trim());

// The fix:
// 1. Remove the outer "return (" line (outerReturnIdx)
// 2. Remove the "case 'assignments':" line (caseIdx) - it's not needed in a component
// 3. Remove the stray ");" at the end (lastClosingIdx)
// 4. The component body should just have the if/return statements directly

// Build new lines
const newLines = [];
for (let i = 0; i < lines.length; i++) {
    // Skip the outer return (
    if (i === outerReturnIdx) continue;
    // Skip the case 'assignments': line
    if (i === caseIdx) continue;
    // Skip the stray ); at the end
    if (i === lastClosingIdx && lines[i - 1].trim() === ');') continue;
    newLines.push(lines[i]);
}

fs.writeFileSync(srcFile, newLines.join('\n'), 'utf8');
console.log('\nFixed. New line count:', newLines.length);

// Verify the structure
const fixed = fs.readFileSync(srcFile, 'utf8').split('\n');
const returnIdx = fixed.findIndex((l, i) => i > 80 && i < 90 && l.trim().startsWith('if (isLoading)'));
console.log('First statement after component body:', returnIdx + 1, '|', fixed[returnIdx]?.trim());
