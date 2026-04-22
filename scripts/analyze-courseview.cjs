const fs = require('fs');
const content = fs.readFileSync('src/pages/studentdashboard/content/CourseViewPage/CourseViewPage.tsx', 'utf8');
const lines = content.split('\n');

const renderStart = lines.findIndex(l => l.trim() === 'const renderContent = () => {');
console.log('renderContent starts at line:', renderStart + 1);

// Find cases
["case 'modules':", "case 'assignments':", "case 'news':", "case 'students':", "case 'teachers':"].forEach(c => {
    const idx = lines.findIndex((l, i) => i > renderStart && l.trim().startsWith(c));
    console.log(c, '-> line', idx + 1);
});

// Find teacher mode section
const teacherModeIdx = lines.findIndex(l => l.includes('isTeacherMode') && l.includes('renderTeacher'));
const teacherSectionIdx = lines.findIndex(l => l.trim().includes('Teacher Mode') && l.trim().startsWith('//'));
console.log('Teacher mode section comment:', teacherSectionIdx + 1);

// Find the return statement of CourseViewPage
const returnIdx = lines.findIndex((l, i) => i > 1000 && l.trim() === 'return (');
console.log('Main return( at line:', returnIdx + 1);

// Find teacher mode JSX block
const teacherJSXIdx = lines.findIndex((l, i) => i > returnIdx && l.includes('isTeacherMode') && l.includes('{'));
console.log('Teacher mode JSX condition at line:', teacherJSXIdx + 1);

console.log('\nTotal file lines:', lines.length);
