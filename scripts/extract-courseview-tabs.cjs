/**
 * extract-courseview-tabs.cjs
 * Extracts the tab content render functions from CourseViewPage.tsx.
 * Each tab case becomes a separate component.
 */
const fs = require('fs');
const path = require('path');

const srcFile = 'src/pages/studentdashboard/content/CourseViewPage/CourseViewPage.tsx';
const content = fs.readFileSync(srcFile, 'utf8');
const lines = content.split('\n');

const compDir = 'src/pages/studentdashboard/content/CourseViewPage/components';
const tabsDir = 'src/pages/studentdashboard/content/CourseViewPage/tabs';
if (!fs.existsSync(tabsDir)) fs.mkdirSync(tabsDir, { recursive: true });

// Find the renderContent function boundaries
const renderStart = lines.findIndex(l => l.trim() === 'const renderContent = () => {');

// Find each case start
const caseModules     = lines.findIndex((l, i) => i > renderStart && l.trim() === "case 'modules':");
const caseAssignments = lines.findIndex((l, i) => i > renderStart && l.trim() === "case 'assignments':");
const caseNews        = lines.findIndex((l, i) => i > renderStart && l.trim() === "case 'news':");
const caseStudents    = lines.findIndex((l, i) => i > renderStart && l.trim() === "case 'students':");
const caseTeachers    = lines.findIndex((l, i) => i > renderStart && l.trim() === "case 'teachers':");

// Find the end of renderContent (the closing }; after the switch)
// It's the line after the last case's closing
let renderEnd = -1;
let depth = 0;
let inRender = false;
for (let i = renderStart; i < lines.length; i++) {
    const t = lines[i];
    for (const ch of t) {
        if (ch === '{') depth++;
        if (ch === '}') {
            depth--;
            if (depth === 0 && i > renderStart) {
                renderEnd = i;
                break;
            }
        }
    }
    if (renderEnd !== -1) break;
}

console.log('renderContent:', renderStart+1, '-', renderEnd+1, '(', renderEnd-renderStart+1, 'lines)');
console.log('case modules:', caseModules+1);
console.log('case assignments:', caseAssignments+1);
console.log('case news:', caseNews+1);
console.log('case students:', caseStudents+1);
console.log('case teachers:', caseTeachers+1);
console.log('renderEnd:', renderEnd+1);

// Extract each case block (from case line to just before next case)
function extractCase(startLine, endLine) {
    return lines.slice(startLine, endLine).join('\n');
}

const modulesCase     = extractCase(caseModules, caseAssignments);
const assignmentsCase = extractCase(caseAssignments, caseNews);
const newsCase        = extractCase(caseNews, caseStudents);
const studentsCase    = extractCase(caseStudents, caseTeachers);
const teachersCase    = extractCase(caseTeachers, renderEnd);

console.log('\nCase sizes:');
console.log('modules:', modulesCase.split('\n').length, 'lines');
console.log('assignments:', assignmentsCase.split('\n').length, 'lines');
console.log('news:', newsCase.split('\n').length, 'lines');
console.log('students:', studentsCase.split('\n').length, 'lines');
console.log('teachers:', teachersCase.split('\n').length, 'lines');

// Read the imports from the top of CourseViewPage to understand what's needed
const topImports = lines.slice(0, 20).join('\n');
console.log('\nTop imports:\n', topImports);
