/**
 * check-all-service-imports.cjs
 * Comprehensive scan of ALL student dashboard files for named imports
 * from service files that don't actually exist.
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

// Cache service exports
const serviceExports = {};
function getServiceExports(servicePath) {
    if (serviceExports[servicePath]) return serviceExports[servicePath];
    try {
        const content = fs.readFileSync(servicePath, 'utf8');
        const exports = new Set();
        // Match: export const/function/class/type/interface/enum Name
        const matches = content.matchAll(/^export\s+(?:async\s+)?(?:const|function|class|type|interface|enum)\s+(\w+)/gm);
        for (const m of matches) exports.add(m[1]);
        // Match: export { Name, Name2 }
        const namedMatches = content.matchAll(/^export\s*\{([^}]+)\}/gm);
        for (const m of namedMatches) {
            m[1].split(',').forEach(n => {
                const name = n.trim().replace(/\s+as\s+\w+/, '').trim();
                if (name) exports.add(name);
            });
        }
        serviceExports[servicePath] = exports;
        return exports;
    } catch (e) {
        return new Set();
    }
}

const files = walk('src/pages/studentdashboard');
const issues = [];

files.forEach(f => {
    let c;
    try { c = fs.readFileSync(f, 'utf8'); } catch (e) { return; }
    const lines = c.split('\n');

    lines.forEach((l, i) => {
        // Match named imports from services
        const m = l.match(/^import\s+\{([^}]+)\}\s+from\s+'([^']*services[^']+)'/);
        if (!m) return;

        const importedNames = m[1].split(',')
            .map(s => s.trim().replace(/^type\s+/, '').trim())
            .filter(n => n && /^[A-Za-z_]/.test(n));
        const servicePath = m[2];

        // Resolve the service file
        const dir = path.dirname(f);
        let resolved = path.resolve(dir, servicePath);
        if (!resolved.endsWith('.ts')) resolved += '.ts';

        if (!fs.existsSync(resolved)) return;

        const exports = getServiceExports(resolved);
        if (exports.size === 0) return;

        importedNames.forEach(name => {
            if (!exports.has(name)) {
                issues.push({
                    file: f.replace(/\\/g, '/').replace('src/pages/studentdashboard/', ''),
                    line: i + 1,
                    name,
                    service: servicePath.split('/').pop(),
                });
            }
        });
    });
});

if (issues.length === 0) {
    console.log('✅ No bad service imports found!');
} else {
    console.log(`❌ Found ${issues.length} bad service import(s):\n`);
    issues.forEach(i => {
        console.log(`  ${i.file}:${i.line} — '${i.name}' not in ${i.service}`);
    });
}
