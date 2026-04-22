/**
 * check-return-structure.cjs
 * Finds components where return ( is followed by a JSX comment or non-element
 * instead of a proper JSX element. This causes Babel parse errors.
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
                else if (f.endsWith('.tsx') && !f.endsWith('.d.ts')) results.push(full);
            } catch (e) {}
        });
    } catch (e) {}
    return results;
}

const files = walk('src/pages/studentdashboard');
const issues = [];

files.forEach(f => {
    let c;
    try { c = fs.readFileSync(f, 'utf8'); } catch (e) { return; }
    const lines = c.split('\n');

    lines.forEach((l, i) => {
        // Find "return (" lines
        if (l.trim() === 'return (') {
            // Check the next non-empty line
            let nextLineIdx = i + 1;
            while (nextLineIdx < lines.length && lines[nextLineIdx].trim() === '') nextLineIdx++;
            const nextLine = lines[nextLineIdx]?.trim() || '';

            // Bad patterns: starts with {/* (JSX comment), or is a switch case, or is a variable declaration
            const isBad = nextLine.startsWith('{/*') ||
                          nextLine.startsWith('case ') ||
                          nextLine.startsWith('const ') ||
                          nextLine.startsWith('let ') ||
                          nextLine.startsWith('var ') ||
                          nextLine.startsWith('if (');

            if (isBad) {
                issues.push({
                    file: f.replace(/\\/g, '/').replace('src/pages/studentdashboard/', ''),
                    line: i + 1,
                    nextLine,
                });
            }
        }
    });
});

if (issues.length === 0) {
    console.log('✅ No bad return structures found!');
} else {
    console.log(`❌ Found ${issues.length} bad return structure(s):\n`);
    issues.forEach(issue => {
        console.log(`  ${issue.file}:${issue.line}`);
        console.log(`    return ( followed by: "${issue.nextLine.substring(0, 60)}"`);
    });
}
