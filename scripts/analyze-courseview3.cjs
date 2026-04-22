const fs = require('fs');
const c = fs.readFileSync('src/pages/studentdashboard/content/CourseViewPage/CourseViewPage.tsx', 'utf8');
const lines = c.split('\n');
console.log('Total lines:', lines.length);

const renderStart = lines.findIndex(l => l.trim() === 'const renderContent = () => {');
console.log('renderContent at line:', renderStart + 1);

const cases = ["case 'modules':", "case 'assignments':", "case 'news':", "case 'students':", "case 'teachers':"];
cases.forEach(caseStr => {
    const idx = lines.findIndex((l, i) => i > renderStart && l.trim() === caseStr);
    console.log(caseStr, '-> line', idx + 1);
});

// Find the return statement of the main component
const returnIdx = lines.findIndex((l, i) => i > 1000 && l.trim() === 'return (');
console.log('Main return( at line:', returnIdx + 1);

// Find the end of renderContent
let renderEnd = -1;
let depth = 0;
for (let i = renderStart; i < lines.length; i++) {
    for (const ch of lines[i]) {
        if (ch === '{') depth++;
        if (ch === '}') depth--;
    }
    if (depth === 0 && i > renderStart) {
        renderEnd = i;
        break;
    }
}
console.log('renderContent ends at line:', renderEnd + 1);
console.log('renderContent total lines:', renderEnd - renderStart + 1);
