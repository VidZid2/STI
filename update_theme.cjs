const fs = require('fs');
let content = fs.readFileSync('src/components/tools/Paraphraser.tsx', 'utf8');

const themeColorsStr = `    const getThemeColors = (modeId: string) => {
        const themes: Record<string, any> = {
            standard: {
                gradient1: 'bg-emerald-500/5 dark:bg-emerald-500/[0.03]',
                gradient2: 'bg-green-500/5 dark:bg-green-500/[0.03]',
                hoverBorder: 'hover:border-emerald-200/80',
                cardHoverBorder: 'hover:border-emerald-300 dark:hover:border-emerald-700',
                iconContainer: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50',
                iconContainerAlt: 'bg-emerald-50/80 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/60 shadow-sm ring-4 ring-white/50 dark:ring-zinc-900/50 text-emerald-600 dark:text-emerald-400',
                button: 'bg-emerald-600 hover:bg-emerald-700',
                buttonShadow: 'rgba(16, 185, 129, 0.35)',
                hoverBg: 'group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20',
                hoverText: 'group-hover:text-emerald-500 dark:group-hover:text-emerald-400',
                textStatus: 'text-emerald-500'
            },
            fluency: {
                gradient1: 'bg-blue-500/5 dark:bg-blue-500/[0.03]',
                gradient2: 'bg-cyan-500/5 dark:bg-cyan-500/[0.03]',
                hoverBorder: 'hover:border-blue-200/80',
                cardHoverBorder: 'hover:border-blue-300 dark:hover:border-blue-700',
                iconContainer: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50',
                iconContainerAlt: 'bg-blue-50/80 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/60 shadow-sm ring-4 ring-white/50 dark:ring-zinc-900/50 text-blue-600 dark:text-blue-400',
                button: 'bg-blue-600 hover:bg-blue-700',
                buttonShadow: 'rgba(59, 130, 246, 0.35)',
                hoverBg: 'group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20',
                hoverText: 'group-hover:text-blue-500 dark:group-hover:text-blue-400',
                textStatus: 'text-blue-500'
            },
            formal: {
                gradient1: 'bg-violet-500/5 dark:bg-violet-500/[0.03]',
                gradient2: 'bg-fuchsia-500/5 dark:bg-fuchsia-500/[0.03]',
                hoverBorder: 'hover:border-violet-200/80',
                cardHoverBorder: 'hover:border-violet-300 dark:hover:border-violet-700',
                iconContainer: 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-800/50',
                iconContainerAlt: 'bg-violet-50/80 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800/60 shadow-sm ring-4 ring-white/50 dark:ring-zinc-900/50 text-violet-600 dark:text-violet-400',
                button: 'bg-violet-600 hover:bg-violet-700',
                buttonShadow: 'rgba(139, 92, 246, 0.35)',
                hoverBg: 'group-hover:bg-violet-50 dark:group-hover:bg-violet-900/20',
                hoverText: 'group-hover:text-violet-500 dark:group-hover:text-violet-400',
                textStatus: 'text-violet-500'
            },
            creative: {
                gradient1: 'bg-amber-500/5 dark:bg-amber-500/[0.03]',
                gradient2: 'bg-orange-500/5 dark:bg-orange-500/[0.03]',
                hoverBorder: 'hover:border-amber-200/80',
                cardHoverBorder: 'hover:border-amber-300 dark:hover:border-amber-700',
                iconContainer: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50',
                iconContainerAlt: 'bg-amber-50/80 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/60 shadow-sm ring-4 ring-white/50 dark:ring-zinc-900/50 text-amber-600 dark:text-amber-400',
                button: 'bg-amber-600 hover:bg-amber-700',
                buttonShadow: 'rgba(245, 158, 11, 0.35)',
                hoverBg: 'group-hover:bg-amber-50 dark:group-hover:bg-amber-900/20',
                hoverText: 'group-hover:text-amber-500 dark:group-hover:text-amber-400',
                textStatus: 'text-amber-500'
            },
            shorter: {
                gradient1: 'bg-rose-500/5 dark:bg-rose-500/[0.03]',
                gradient2: 'bg-pink-500/5 dark:bg-pink-500/[0.03]',
                hoverBorder: 'hover:border-rose-200/80',
                cardHoverBorder: 'hover:border-rose-300 dark:hover:border-rose-700',
                iconContainer: 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/50',
                iconContainerAlt: 'bg-rose-50/80 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800/60 shadow-sm ring-4 ring-white/50 dark:ring-zinc-900/50 text-rose-600 dark:text-rose-400',
                button: 'bg-rose-600 hover:bg-rose-700',
                buttonShadow: 'rgba(244, 63, 94, 0.35)',
                hoverBg: 'group-hover:bg-rose-50 dark:group-hover:bg-rose-900/20',
                hoverText: 'group-hover:text-rose-500 dark:group-hover:text-rose-400',
                textStatus: 'text-rose-500'
            },
            expand: {
                gradient1: 'bg-cyan-500/5 dark:bg-cyan-500/[0.03]',
                gradient2: 'bg-blue-500/5 dark:bg-blue-500/[0.03]',
                hoverBorder: 'hover:border-cyan-200/80',
                cardHoverBorder: 'hover:border-cyan-300 dark:hover:border-cyan-700',
                iconContainer: 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 border border-cyan-100 dark:border-cyan-800/50',
                iconContainerAlt: 'bg-cyan-50/80 dark:bg-cyan-900/30 border border-cyan-200 dark:border-cyan-800/60 shadow-sm ring-4 ring-white/50 dark:ring-zinc-900/50 text-cyan-600 dark:text-cyan-400',
                button: 'bg-cyan-600 hover:bg-cyan-700',
                buttonShadow: 'rgba(6, 182, 212, 0.35)',
                hoverBg: 'group-hover:bg-cyan-50 dark:group-hover:bg-cyan-900/20',
                hoverText: 'group-hover:text-cyan-500 dark:group-hover:text-cyan-400',
                textStatus: 'text-cyan-500'
            }
        };
        return themes[modeId] || themes.standard;
    };`;

content = content.replace(/(const getModeColor = [\s\S]*?};\n        return .*?;\n    };\n)/, `$1\n${themeColorsStr}\n\n    const theme = getThemeColors(mode);\n`);

// Main header
content = content.replace(/hover:border-emerald-200\/80/g, '${theme.hoverBorder}');
content = content.replace(/bg-emerald-500\/5 dark:bg-emerald-500\/\[0\.03\]/g, '${theme.gradient1}');
content = content.replace(/bg-green-500\/5 dark:bg-green-500\/\[0\.03\]/g, '${theme.gradient2}');
content = content.replace(/bg-emerald-50 dark:bg-emerald-900\/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800\/50/g, '${theme.iconContainer}');

// Paraphrase button
content = content.replace(/bg-emerald-600 hover:bg-emerald-700/g, '${theme.button}');
content = content.replace(/'0 8px 20px rgba\(16, 185, 129, 0\.35\)'/g, '`0 8px 20px ${theme.buttonShadow}`');

// Insights card
content = content.replace(/hover:border-emerald-300 dark:hover:border-emerald-700/g, '${theme.cardHoverBorder}');

// Mode selector icons container alt
content = content.replace(/bg-emerald-50\/80 border border-emerald-200 dark:bg-emerald-900\/30 dark:border-emerald-800\/60 flex items-center justify-center flex-shrink-0 shadow-sm ring-4 ring-white\/50 dark:ring-zinc-900\/50/g, '${theme.iconContainerAlt} flex items-center justify-center flex-shrink-0');

content = content.replace(/bg-emerald-50\/80 border border-emerald-200 dark:bg-emerald-900\/30 dark:border-emerald-800\/60 shadow-sm ring-4 ring-white\/50 dark:ring-zinc-900\/50 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400/g, '${theme.iconContainerAlt} flex items-center justify-center shrink-0');
content = content.replace(/bg-emerald-50 border border-emerald-200 dark:bg-emerald-900\/30 dark:border-emerald-800\/60 shadow-sm ring-4 ring-white\/50 dark:ring-zinc-900\/50 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400/g, '${theme.iconContainerAlt} flex items-center justify-center shrink-0');

content = content.replace(/bg-emerald-50 border border-emerald-100 dark:bg-emerald-900\/20 dark:border-emerald-800\/50 flex items-center justify-center flex-shrink-0 shadow-sm/g, '${theme.iconContainerAlt} flex items-center justify-center flex-shrink-0');
content = content.replace(/className="text-emerald-600 dark:text-emerald-400 sm:w-7 sm:h-7"/g, 'className="sm:w-7 sm:h-7"');

// Mode selector hover bg/text
content = content.replace(/'bg-zinc-100\/80 dark:bg-zinc-700\/50 group-hover:bg-blue-50 dark:group-hover:bg-blue-900\/20'/g, '`bg-zinc-100/80 dark:bg-zinc-700/50 ${theme.hoverBg}`');
content = content.replace(/'text-zinc-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors'/g, '`text-zinc-400 ${theme.hoverText} transition-colors`');

// Input/Output cards header icon container alt
content = content.replace(/bg-emerald-50\/80 dark:bg-emerald-900\/30 border border-emerald-200 shadow-sm ring-4 ring-white\/50 dark:border-emerald-800\/60 dark:ring-zinc-900\/50 text-emerald-600 dark:text-emerald-400/g, '${theme.iconContainerAlt}');
content = content.replace(/bg-emerald-50\/80 dark:bg-emerald-900\/30 border border-emerald-200 shadow-sm ring-4 ring-white\/50 dark:border-emerald-800\/60 dark:ring-zinc-900\/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400/g, '${theme.iconContainerAlt} flex items-center justify-center');

// Additional dynamic classes replacing hardcoded tailwind
content = content.replace(/className="([^"]*\$\{.*?\}[^"]*)"/g, (match, classes) => {
    return 'className={`' + classes + '`}';
});

// Fix syntax for already template-literalized classNames that are now double-templated
content = content.replace(/className="\{`([^"]+)`\}"/g, 'className={`$1`}');

// A few more exact replacements for hardcoded strings
content = content.replace(/className="w-12 h-12 sm:w-14 sm:h-14 rounded-\[16px\] sm:rounded-\[18px\] \$\{theme.iconContainerAlt\} flex items-center justify-center flex-shrink-0 shadow-sm"/g, 'className={`w-12 h-12 sm:w-14 sm:h-14 rounded-[16px] sm:rounded-[18px] ${theme.iconContainerAlt} flex items-center justify-center flex-shrink-0`}');

content = content.replace(/className="w-10 h-10 sm:w-12 sm:h-12 rounded-\[14px\] \$\{theme.iconContainerAlt\} flex items-center justify-center shrink-0"/g, 'className={`w-10 h-10 sm:w-12 sm:h-12 rounded-[14px] ${theme.iconContainerAlt} flex items-center justify-center shrink-0`}');

content = content.replace(/className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl \$\{theme.iconContainerAlt\}"/g, 'className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-xl ${theme.iconContainerAlt}`}');

content = content.replace(/className="w-14 h-14 rounded-2xl \$\{theme.iconContainerAlt\} flex items-center justify-center"/g, 'className={`w-14 h-14 rounded-2xl ${theme.iconContainerAlt} flex items-center justify-center`}');

// Other specific areas
content = content.replace(/className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 \$\{theme.gradient1\} rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150"/g, 'className={`absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 ${theme.gradient1} rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150`}');

content = content.replace(/className="absolute bottom-0 left-0 -ml-20 -mb-20 w-48 h-48 \$\{theme.gradient2\} rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150"/g, 'className={`absolute bottom-0 left-0 -ml-20 -mb-20 w-48 h-48 ${theme.gradient2} rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150`}');

content = content.replace(/className="flex items-center justify-center w-12 h-12 rounded-\[16px\] \$\{theme.iconContainer\}"/g, 'className={`flex items-center justify-center w-12 h-12 rounded-[16px] ${theme.iconContainer}`}');

// Replace standard hover:border-emerald... with theme in div wrappers
content = content.replace(/className="([^"]*)\$\{theme\.hoverBorder\}([^"]*)"/g, 'className={`$1${theme.hoverBorder}$2`}');
content = content.replace(/className="([^"]*)\$\{theme\.cardHoverBorder\}([^"]*)"/g, 'className={`$1${theme.cardHoverBorder}$2`}');

// Button with emerald-600 hardcoded
content = content.replace(/className="([^"]*)\$\{theme\.button\}([^"]*)"/g, 'className={`$1${theme.button}$2`}');

fs.writeFileSync('src/components/tools/Paraphraser.tsx', content);
