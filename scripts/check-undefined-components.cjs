/**
 * check-undefined-components.cjs
 * Finds JSX component usages (<ComponentName) in extracted files
 * where the component is not imported.
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

// Only check extracted component files (not the main page files)
const extractedDirs = [
    'src/pages/studentdashboard/content/CourseViewPage/components',
    'src/pages/studentdashboard/content/CourseViewPage/tabs',
    'src/pages/studentdashboard/content/CourseViewPage/modals',
    'src/pages/studentdashboard/content/GroupsContent/components',
    'src/pages/studentdashboard/content/GroupsContent/modals',
    'src/pages/studentdashboard/content/GoalsContent/components',
    'src/pages/studentdashboard/content/GoalsContent/modals',
    'src/pages/studentdashboard/content/UsersContent/components',
    'src/pages/studentdashboard/content/UsersContent/modals',
    'src/pages/studentdashboard/content/CatalogContent/components',
    'src/pages/studentdashboard/content/CatalogContent/modals',
    'src/pages/studentdashboard/content/ToolsContent/components',
    'src/pages/studentdashboard/content/ToolsContent/modals',
    'src/pages/studentdashboard/content/PathsContent/components',
    'src/pages/studentdashboard/content/PathsContent/modals',
    'src/pages/studentdashboard/content/HomeContent/components',
    'src/pages/studentdashboard/FocusModePage/components',
    'src/pages/studentdashboard/components',
];

const issues = [];

// Built-in HTML/SVG elements and React components
const builtins = new Set(['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'img', 'button', 'input', 'textarea', 'form', 'label', 'select', 'option', 'ul', 'li', 'ol', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'section', 'article', 'header', 'footer', 'main', 'nav', 'aside', 'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'g', 'defs', 'use', 'symbol', 'clipPath', 'mask', 'filter', 'text', 'tspan', 'image', 'pattern', 'linearGradient', 'radialGradient', 'stop', 'animate', 'animateTransform', 'animateMotion', 'set', 'br', 'hr', 'pre', 'code', 'strong', 'em', 'i', 'b', 'u', 's', 'small', 'sup', 'sub', 'blockquote', 'cite', 'q', 'abbr', 'acronym', 'address', 'del', 'ins', 'dfn', 'kbd', 'samp', 'var', 'mark', 'ruby', 'rt', 'rp', 'bdi', 'bdo', 'wbr', 'details', 'summary', 'dialog', 'menu', 'menuitem', 'fieldset', 'legend', 'datalist', 'output', 'progress', 'meter', 'canvas', 'video', 'audio', 'source', 'track', 'embed', 'object', 'param', 'picture', 'iframe', 'frame', 'frameset', 'noframes', 'script', 'noscript', 'style', 'link', 'meta', 'title', 'head', 'body', 'html', 'React', 'Fragment', 'Suspense', 'StrictMode', 'Profiler', 'ErrorBoundary']);

extractedDirs.forEach(dir => {
    if (!fs.existsSync(dir)) return;
    const files = walk(dir);

    files.forEach(f => {
        let c;
        try { c = fs.readFileSync(f, 'utf8'); } catch (e) { return; }

        // Get all imported names
        const imported = new Set();
        const importMatches = c.matchAll(/^import\s+(?:(?:\*\s+as\s+(\w+))|(?:(\w+)(?:\s*,\s*\{([^}]+)\})?)|(?:\{([^}]+)\}))\s+from/gm);
        for (const m of importMatches) {
            if (m[1]) imported.add(m[1]); // * as Name
            if (m[2]) imported.add(m[2]); // default import
            if (m[3]) m[3].split(',').forEach(n => imported.add(n.trim().replace(/\s+as\s+\w+/, '').trim())); // { A, B }
            if (m[4]) m[4].split(',').forEach(n => imported.add(n.trim().replace(/\s+as\s+\w+/, '').trim())); // { A, B } only
        }

        // Add locally defined components/functions
        const localDefs = c.matchAll(/(?:const|function|class)\s+([A-Z]\w+)/g);
        for (const m of localDefs) imported.add(m[1]);

        // Find JSX component usages: <ComponentName or <ComponentName.SubName
        const jsxUsages = c.matchAll(/<([A-Z]\w+)(?:\.[A-Z]\w+)?[\s/>]/g);
        for (const m of jsxUsages) {
            const name = m[1];
            if (!imported.has(name) && !builtins.has(name)) {
                issues.push({
                    file: f.replace(/\\/g, '/').replace('src/pages/studentdashboard/', ''),
                    component: name,
                });
            }
        }
    });
});

// Deduplicate
const seen = new Set();
const unique = issues.filter(i => {
    const key = i.file + ':' + i.component;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
});

if (unique.length === 0) {
    console.log('✅ No undefined component usages found!');
} else {
    console.log(`❌ Found ${unique.length} potentially undefined component(s):\n`);
    unique.forEach(i => console.log(`  ${i.file} — <${i.component}>`));
}
