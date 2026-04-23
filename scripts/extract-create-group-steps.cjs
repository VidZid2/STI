/**
 * extract-create-group-steps.cjs
 * Extracts the 3 step components from CreateGroupModal.tsx.
 */
const fs = require('fs');
const path = require('path');

const srcFile = 'src/pages/studentdashboard/content/GroupsContent/modals/CreateGroupModal.tsx';
const content = fs.readFileSync(srcFile, 'utf8');
const lines = content.split('\n');

const stepsDir = 'src/pages/studentdashboard/content/GroupsContent/modals/steps';
if (!fs.existsSync(stepsDir)) fs.mkdirSync(stepsDir, { recursive: true });

// Find step boundaries
// Step 1 starts at: {step === 1 ? (
// Step 2 starts at: ) : step === 2 ? (
// Step 3 starts at: ) : step === 3 ? (
// End: ) : null}

const step1Start = lines.findIndex(l => l.trim() === '{step === 1 ? (');
const step2Start = lines.findIndex(l => l.trim() === ') : step === 2 ? (');
const step3Start = lines.findIndex(l => l.trim() === ') : step === 3 ? (');
// Find the end of step 3 - look for ") : null}" or similar
const step3End = lines.findIndex((l, i) => i > step3Start && (l.trim() === ') : null}' || l.trim() === ') : null }'));

console.log('Step 1 starts at line:', step1Start + 1);
console.log('Step 2 starts at line:', step2Start + 1);
console.log('Step 3 starts at line:', step3Start + 1);
console.log('Step 3 ends at line:', step3End + 1);

// Verify
console.log('\nStep 1 start context:', lines[step1Start].trim());
console.log('Step 2 start context:', lines[step2Start].trim());
console.log('Step 3 start context:', lines[step3Start].trim());
if (step3End !== -1) console.log('Step 3 end context:', lines[step3End].trim());

// Extract step JSX (the content between the ternary markers)
// Step 1: from step1Start+1 to step2Start-1
// Step 2: from step2Start+1 to step3Start-1
// Step 3: from step3Start+1 to step3End-1

const step1JSX = lines.slice(step1Start + 1, step2Start).join('\n');
const step2JSX = lines.slice(step2Start + 1, step3Start).join('\n');
const step3JSX = step3End !== -1 ? lines.slice(step3Start + 1, step3End).join('\n') : '';

console.log('\nStep 1 JSX lines:', step1JSX.split('\n').length);
console.log('Step 2 JSX lines:', step2JSX.split('\n').length);
console.log('Step 3 JSX lines:', step3JSX.split('\n').length);

// Read the top of CreateGroupModal to understand what state/props are used
const topSection = lines.slice(0, 50).join('\n');
console.log('\nTop section:\n', topSection.substring(0, 400));
