import * as React from 'react';
import { motion } from 'motion/react';
import { Wrench, Zap, ShieldCheck } from 'lucide-react';

interface ToolsHeaderProps {
    totalTools: number;
}

export const ToolsHeader: React.FC<ToolsHeaderProps> = ({ totalTools }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring' as const, stiffness: 300, damping: 24 }}
            className="mb-8 relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8 group"
        >
            {/* SaaS Background Accents */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-48 h-48 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />

            {/* Left: Icon & Core Info */}
            <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
                <motion.div
                    whileHover={{ scale: 1.05, rotate: -5 }}
                    transition={{ type: 'spring' as const, stiffness: 400, damping: 15 }}
                    className="w-16 h-16 rounded-[20px] bg-blue-50 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 flex items-center justify-center flex-shrink-0 shadow-sm"
                >
                    <Wrench className="w-8 h-8 text-blue-600 dark:text-blue-400" strokeWidth={2} />
                </motion.div>

                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                            Student Tools
                        </h1>
                    </div>
                    <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-lg leading-relaxed">
                        Local-first academic utilities for files, drafts, and writing support. Connected AI tools run only when a service is configured.
                    </p>
                </div>
            </div>

            {/* Right: Modern Stat Cards */}
            <div className="flex flex-wrap items-center gap-4 relative z-10 w-full md:w-auto">
                {/* Available Tools Card */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 shadow-sm transition-colors hover:border-blue-300 dark:hover:border-blue-700">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" strokeWidth={2} />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-0.5">Available</p>
                        <p className="text-lg font-black text-zinc-900 dark:text-zinc-100 leading-none">{totalTools} Tools</p>
                    </div>
                </div>

                {/* Privacy Card */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 shadow-sm transition-colors hover:border-emerald-300 dark:hover:border-emerald-700">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-0.5">Data</p>
                        <p className="text-lg font-black text-zinc-900 dark:text-zinc-100 leading-none">Local-first</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ToolsHeader;
