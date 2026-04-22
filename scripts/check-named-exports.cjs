/**
 * check-named-exports.cjs
 * Finds files that ONLY have named exports (no default export)
 * and checks if any other file imports them as a default.
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
                else if ((f.endsWith('.tsx') || f.endsWith('.ts')) && !f.endsWith('.d.ts')) results.push(full);
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
        // Match default import from a local path
        const m = l.match(/^import ([A-Z]\w+) from '(\.\.?\/[^']+)'/);
        if (!m) return;
        const importedName = m[1];
        const importPath = m[2];

        const dir = path.dirname(f);
        let resolved = path.resolve(dir, importPath);

        // Try extensions — skip index files (they re-export)
        let found = null;
        for (const ext of ['.tsx', '.ts']) {
            const candidate = resolved + ext;
            if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
                found = candidate;
                break;
            }
        }
        if (!found) return;

        let importedContent;
        try { importedContent = fs.readFileSync(found, 'utf8'); } catch (e) { return; }

        // Check if the file has NO default export
        const hasDefault = importedContent.includes('export default ') ||
                           /export \{[^}]*\bas default\b/.test(importedContent);
        if (!hasDefault) {
            issues.push({
                file: f.replace(/\\/g, '/').replace('src/pages/studentdashboard/', ''),
                line: i + 1,
                import: importedName,
                from: importPath,
                resolvedFile: found.replace(/\\/g, '/').replace('src/pages/studentdashboard/', ''),
            });
        }
    });
});

if (issues.length === 0) {
    console.log('✅ No default import mismatches found!');
} else {
    console.log(`❌ Found ${issues.length} issue(s):\n`);
    issues.forEach(issue => {
        console.log(`  ${issue.file}:${issue.line}`);
        console.log(`    import ${issue.import} from '${issue.from}'`);
        console.log(`    -> ${issue.resolvedFile} has no default export`);
        console.log();
    });
}
