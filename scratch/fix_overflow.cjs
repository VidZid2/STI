const fs = require('fs');
const file = 'src/pages/studentdashboard/content/HomeContent/HomeContent.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/className=\"([^\"]*?)bg-white dark:bg-slate-800([^\"]*?)overflow-hidden([^\"]*?)\"/g, 'className=\"$1bg-white dark:bg-slate-800$2$3\"');
content = content.replace(/className=\"([^\"]*?)bg-slate-50 dark:bg-slate-800\/80([^\"]*?)overflow-hidden([^\"]*?)\"/g, 'className=\"$1bg-slate-50 dark:bg-slate-800/80$2$3\"');
fs.writeFileSync(file, content);
console.log('Fixed overflow-hidden classes');
