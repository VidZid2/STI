/**
 * check-default-imports.cjs
 * Scans for default imports from files that only have named exports.
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

const files = walk('src/pages/studentdashboard');
const issues = [];

files.forEach(f => {
    let c;
    try { c = fs.readFileSync(f, 'utf8'); } catch (e) { return; }
    const lines = c.split('\n');

    lines.forEach((l, i) => {
        // Match: import SomeName from './some/path'  (default import, local file)
        const m = l.match(/^import ([A-Z]\w+) from '(\.\.?\/[^']+)'/);
        if (!m) return;
        const importedName = m[1];
        const importPath = m[2];

        const dir = path.dirname(f);
        let resolved = path.resolve(dir, importPath);

        // Try extensions
        let found = null;
        for (const ext of ['.tsx', '.ts', '/index.tsx', '/index.ts']) {
            const candidate = resolved + ext;
            if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
                found = candidate;
                break;
            }
        }
        if (!found) return;

        let importedContent;
        try { importedContent = fs.readFileSync(found, 'utf8'); } catch (e) { return; }

        const hasDefault = importedContent.includes('export default ') ||
                           importedContent.match(/export \{[^}]*\bas default\b/);
        if (!hasDefault) {
            issues.push({
                file: f.replace(/\\/g, '/').replace('src/pages/studentdashboard/', ''),
                line: i + 1,
                import: importedName,
                from: importPath,
            });
        }
    });
});

if (issues.length === 0) {
    console.log('✅ No default import mismatches found!');
} else {
    console.log(`❌ Found ${issues.length} default import mismatch(es):\n`);
    issues.forEach(issue => {
        console.log(`  ${issue.file}:${issue.line}`);
        console.log(`    import ${issue.import} from '${issue.from}'`);
    });
}
