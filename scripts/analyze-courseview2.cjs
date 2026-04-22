const fs = require('fs');
const content = fs.readFileSync('src/pages/studentdashboard/content/CourseViewPage/CourseViewPage.tsx', 'utf8');
const lines = content.split('\n');

// Find the teacher mode content section in the JSX
// Look for the teacher mode tabs section
const teacherTabsIdx = lines.findIndex(l => l.includes('teacherTab') && l.includes('manage-tasks'));
console.log('Teacher tabs section around line:', teacherTabsIdx + 1);

// Find the teacher mode JSX block - the big one
const teacherModeJSXStart = lines.findIndex(l => l.trim() === '{/* Teacher Mode Content */}');
console.log('Teacher Mode Content comment:', teacherModeJSXStart + 1);

// Find all large comment blocks in the JSX return
lines.forEach((l, i) => {
    if (i > 2474 && l.trim().startsWith('{/*') && l.trim().endsWith('*/}')) {
        console.log('Comment at line', i+1, ':', l.trim().substring(0, 70));
    }
});

// Find the closing of the main return
const mainReturnClose = lines.findLastIndex(l => l.trim() === ');');
console.log('\nMain return closes at line:', mainReturnClose + 1);
console.log('Total JSX return lines:', mainReturnClose - 2476 + 1);
