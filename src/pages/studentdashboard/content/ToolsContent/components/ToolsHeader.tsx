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
            className="mt-[72px] md:mt-0 mb-8 relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-2xl md:rounded-[24px] p-4 lg:p-7 flex flex-col md:flex-row items-center justify-between gap-5 md:gap-8 group transition-all duration-300 hover:shadow-md hover:border-blue-200/80 dark:hover:border-blue-800/50"
        >
            {/* SaaS Background Accents */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-48 h-48 bg-blue-400/10 dark:bg-blue-400/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />

            {/* Left: Icon & Core Info */}
            <div className="flex items-center gap-4 md:gap-6 relative z-10 w-full md:w-auto">
                <motion.div
                    whileHover={{ scale: 1.05, rotate: -5 }}
                    transition={{ type: 'spring' as const, stiffness: 400, damping: 15 }}
                    className="w-12 h-12 rounded-2xl md:w-16 md:h-16 md:rounded-[20px] bg-blue-50 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 flex items-center justify-center flex-shrink-0 shadow-sm"
                >
                    <Wrench className="w-6 h-6 md:w-8 md:h-8 text-blue-600 dark:text-blue-400" strokeWidth={2} />
                </motion.div>

                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                            Student Tools
                        </h1>
                    </div>
                    <p className="hidden md:block text-base text-zinc-600 dark:text-zinc-400 max-w-lg leading-relaxed">
                        Local-first academic utilities for files, drafts, and writing support. Connected AI tools run only when a service is configured.
                    </p>
                </div>
            </div>

            {/* Right: Modern Stat Cards */}
            <div className="flex items-center gap-3 md:gap-4 relative z-10 w-full md:w-auto">
                {/* Available Tools Card */}
                <div className="flex-1 md:flex-none flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-colors hover:shadow-sm hover:border-blue-200 dark:hover:border-blue-800/50">
                    <div className="text-blue-500 bg-blue-100 dark:bg-blue-900/30 p-2 md:p-2.5 rounded-lg md:rounded-xl flex-shrink-0 border border-blue-200/60 dark:border-blue-800/50">
                        <Zap className="w-4 h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-400" strokeWidth={2} />
                    </div>
                    <div>
                        <p className="text-[10px] md:text-[12px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-0.5">Available</p>
                        <p className="text-base md:text-lg font-black text-zinc-900 dark:text-zinc-100 leading-none">{totalTools} Tools</p>
                    </div>
                </div>

                {/* Privacy Card */}
                <div className="flex-1 md:flex-none flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-colors hover:shadow-sm hover:border-emerald-200 dark:hover:border-emerald-800/50">
                    <div className="text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30 p-2 md:p-2.5 rounded-lg md:rounded-xl flex-shrink-0 border border-emerald-200/60 dark:border-emerald-800/50">
                        <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                    </div>
                    <div>
                        <p className="text-[10px] md:text-[12px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-0.5">Data</p>
                        <p className="text-base md:text-lg font-black text-zinc-900 dark:text-zinc-100 leading-none">Local-first</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ToolsHeader;
