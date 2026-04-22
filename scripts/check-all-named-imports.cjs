/**
 * check-all-named-imports.cjs
 * Checks named imports from LOCAL files to ensure the exported names exist.
 * This catches the case where { SomeName } is imported but the file only exports { OtherName }.
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
        // Match named imports from local files: import { A, B } from './path'
        const m = l.match(/^import \{([^}]+)\} from '(\.\.?\/[^']+)'/);
        if (!m) return;

        const importedNames = m[1].split(',')
            .map(s => s.trim().replace(/^type /, '').trim())
            .filter(n => n && !n.startsWith('//') && /^[A-Za-z_]/.test(n));
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

        let targetContent;
        try { targetContent = fs.readFileSync(found, 'utf8'); } catch (e) { return; }

        importedNames.forEach(name => {
            // Check if name is exported from the target file
            // Patterns: export { Name }, export const Name, export function Name, export class Name, export type Name, export interface Name
            const patterns = [
                new RegExp(`export\\s*\\{[^}]*\\b${name}\\b`),
                new RegExp(`export\\s+(const|function|class|async function|type|interface|enum)\\s+${name}\\b`),
                new RegExp(`export\\s+default\\s+${name}\\b`),
            ];
            const found_export = patterns.some(p => p.test(targetContent));
            if (!found_export) {
                issues.push({
                    file: f.replace(/\\/g, '/').replace('src/pages/studentdashboard/', ''),
                    line: i + 1,
                    name,
                    from: importPath,
                    resolvedFile: found.replace(/\\/g, '/').replace('src/pages/studentdashboard/', ''),
                });
            }
        });
    });
});

if (issues.length === 0) {
    console.log('✅ No named import mismatches found!');
} else {
    console.log(`❌ Found ${issues.length} named import issue(s):\n`);
    issues.forEach(issue => {
        console.log(`  ${issue.file}:${issue.line}`);
        console.log(`    '${issue.name}' not found in ${issue.resolvedFile}`);
    });
}
