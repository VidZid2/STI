/**
 * check-service-imports.cjs
 * Scans extracted component files for named imports from services
 * that don't actually exist in those service files.
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

// Only check the extracted component/modal files (not the main service files)
const extractedDirs = [
    'src/pages/studentdashboard/content',
    'src/pages/studentdashboard/FocusModePage/components',
    'src/pages/studentdashboard/components',
];

const issues = [];

extractedDirs.forEach(baseDir => {
    const files = walk(baseDir);
    files.forEach(f => {
        let c;
        try { c = fs.readFileSync(f, 'utf8'); } catch (e) { return; }
        const lines = c.split('\n');

        lines.forEach((l, i) => {
            // Match named imports from services
            const m = l.match(/^import \{([^}]+)\} from '([^']*services[^']+)'/);
            if (!m) return;

            const importedNames = m[1].split(',').map(s => s.trim().replace(/^type /, '').trim()).filter(Boolean);
            const servicePath = m[2];

            // Resolve the service file
            const dir = path.dirname(f);
            let resolved = path.resolve(dir, servicePath);
            if (!resolved.endsWith('.ts')) resolved += '.ts';

            if (!fs.existsSync(resolved)) return;

            let serviceContent;
            try { serviceContent = fs.readFileSync(resolved, 'utf8'); } catch (e) { return; }

            // Check each imported name exists in the service
            importedNames.forEach(name => {
                if (!name || name.startsWith('//')) return;
                // Check if the name is exported from the service
                const exportPattern = new RegExp(`export[^;]*\\b${name}\\b`);
                if (!exportPattern.test(serviceContent)) {
                    issues.push({
                        file: f.replace(/\\/g, '/').replace('src/pages/studentdashboard/', ''),
                        line: i + 1,
                        name,
                        service: servicePath,
                    });
                }
            });
        });
    });
});

if (issues.length === 0) {
    console.log('✅ No bad service imports found!');
} else {
    console.log(`❌ Found ${issues.length} bad service import(s):\n`);
    issues.forEach(issue => {
        console.log(`  ${issue.file}:${issue.line} - '${issue.name}' not found in ${issue.service}`);
    });
}
