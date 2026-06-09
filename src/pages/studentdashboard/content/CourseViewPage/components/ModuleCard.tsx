/**
 * ModuleCard
 * Individual module card in the Modules tab of CourseViewPage.
 * Refactored in Phase 8.4 to use squircle image placeholders and topic descriptions.
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { ContentType } from '../data/demoCourses';

// Content type icon config — kept local to avoid circular imports
const CONTENT_TYPE_CONFIG: Record<ContentType, { label: string; icon: React.ReactNode; color: string }> = {
    'handout-a': {
        label: 'Handout A',
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
            </svg>
        ),
        color: 'blue'
    },
    'handout-b': {
        label: 'Handout B',
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
            </svg>
        ),
        color: 'indigo'
    },
    'slideshow': {
        label: 'Slideshow',
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
            </svg>
        ),
        color: 'amber'
    },
    'video': {
        label: 'Video',
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
        ),
        color: 'rose'
    }
};

const COLOR_CLASSES: Record<string, { base: string; hover: string }> = {
    blue: { 
        base: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30', 
        hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/40' 
    },
    indigo: { 
        base: 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/30', 
        hover: 'hover:bg-indigo-100 dark:hover:bg-indigo-900/40' 
    },
    amber: { 
        base: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30', 
        hover: 'hover:bg-amber-100 dark:hover:bg-amber-900/40' 
    },
    rose: { 
        base: 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/30', 
        hover: 'hover:bg-rose-100 dark:hover:bg-rose-900/40' 
    } 
};

const MUTED_COLOR_CLASSES: Record<string, { base: string; hover: string }> = {
    blue: { 
        base: 'bg-zinc-50/50 text-zinc-400 border-zinc-100 dark:bg-zinc-900/40 dark:text-zinc-500 dark:border-zinc-800/60', 
        hover: 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60' 
    },
    indigo: { 
        base: 'bg-zinc-50/50 text-zinc-400 border-zinc-100 dark:bg-zinc-900/40 dark:text-zinc-500 dark:border-zinc-800/60', 
        hover: 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60' 
    },
    amber: { 
        base: 'bg-zinc-50/50 text-zinc-400 border-zinc-100 dark:bg-zinc-900/40 dark:text-zinc-500 dark:border-zinc-800/60', 
        hover: 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60' 
    },
    rose: { 
        base: 'bg-zinc-50/50 text-zinc-400 border-zinc-100 dark:bg-zinc-900/40 dark:text-zinc-500 dark:border-zinc-800/60', 
        hover: 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60' 
    } 
};

export interface ModuleData {
    id: number;
    title: string;
    status: string;
    contents: { type: ContentType; title: string; completed: boolean }[];
    term?: 'prelims' | 'midterm' | 'prefinals' | 'finals';
    semester?: 'first' | 'second';
}

interface ModuleCardProps {
    module: ModuleData;
    index: number;
    onUpdate?: (updatedModule: ModuleData) => void;
}

export const getLockedReason = (module: ModuleData) => {
    if (module.semester === 'second') {
        return {
            title: "Your first semester is still active",
            description: "The admin will activate this once the 1st semester is done.",
            short: "First semester is still active."
        };
    }
    
    switch (module.term) {
        case 'midterm':
            return {
                title: "Preliminaries is not yet done",
                description: "Please wait until the preliminary period concludes. The admin will activate these materials once midterms begin.",
                short: "Preliminaries is not yet done."
            };
        case 'prefinals':
            return {
                title: "Midterms is not yet done",
                description: "Please wait until the midterm period concludes. The admin will activate these materials once pre-finals begin.",
                short: "Midterms is not yet done."
            };
        case 'finals':
            return {
                title: "Pre-finals is not yet done",
                description: "Please wait until the pre-finals period concludes. The admin will activate these materials once finals begin.",
                short: "Pre-finals is not yet done."
            };
        default:
            return {
                title: "This module is locked",
                description: "Please complete the previous modules and requirements before accessing these learning materials.",
                short: "Complete previous to unlock."
            };
    }
};

// Topic descriptions helper mapping to visually populate empty card layout
const getModuleDescription = (title: string): string => {
    const t = title.toLowerCase();
    if (t.includes('programming')) {
        return 'Explore the fundamental building blocks of software design, syntax structures, variables, control flow, and basic problem-solving algorithms.';
    }
    if (t.includes('euthenics')) {
        return 'Understand the core principles of euthenics, behavioral development, and personal efficiency for academic success.';
    }
    if (t.includes('fundamentals') || t.includes('computer')) {
        return 'Delve into computer architecture, hardware components, peripheral systems, and the history of modern information technology.';
    }
    if (t.includes('nstp')) {
        return 'An overview of the National Service Training Program (NSTP) law, national security guidelines, and community service frameworks.';
    }
    if (t.includes('fitness') || t.includes('assessment')) {
        return 'Analyze personal fitness metrics, learn proper exercise forms, safety protocols, and health assessment indicators.';
    }
    if (t.includes('culture') || t.includes('understanding')) {
        return 'Examine the sociological aspects of culture, community behaviors, cultural integration, and identity development.';
    }
    if (t.includes('communication') || t.includes('purcom')) {
        return 'Enhance verbal and written communication competencies, understanding process elements, and active audience listening styles.';
    }
    if (t.includes('globalization')) {
        return 'Investigate the modern globalized economy, cultural connections, international relations, and global developments.';
    }
    if (t.includes('self')) {
        return 'Analyze the philosophical, sociological, and psychological perspectives of self-understanding and emotional intelligence.';
    }
    return 'Access learning materials, handouts, slide decks, and lecture recordings for this topic to review at your own pace.';
};

const getContentDescription = (type: ContentType): string => {
    switch (type) {
        case 'handout-a':
            return 'Read handout guidelines.';
        case 'handout-b':
            return 'Read supplementary reading.';
        case 'slideshow':
            return 'Review presentation slides.';
        case 'video':
            return 'Watch video lecture.';
        default:
            return 'Access learning resource.';
    }
};

export const ModuleCard: React.FC<ModuleCardProps> = ({ module, index, onUpdate }) => {
    const [contents, setContents] = useState(module.contents);
    const [downloadingIdx, setDownloadingIdx] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(0);

    const itemsPerPage = 2;
    const totalPages = Math.ceil(contents.length / itemsPerPage);
    const paginatedContents = contents.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

    // Keep state in sync if data changes
    useEffect(() => {
        setContents(module.contents);
        setCurrentPage(0);
    }, [module.contents]);

    const completedContents = contents.filter(c => c.completed).length;
    const progressPercent = contents.length > 0
        ? Math.round((completedContents / contents.length) * 100)
        : 0;


    
    // Dynamic status determination based on completion state
    const currentStatus = contents.length > 0 && completedContents === contents.length 
        ? 'completed' 
        : module.status === 'locked' 
            ? 'locked' 
            : 'in-progress';

    const lockedReason = currentStatus === 'locked' ? getLockedReason(module) : null;

    const toggleContentCompleted = (cIndex: number) => {
        if (currentStatus === 'locked') return;
        setContents(prev => {
            const next = prev.map((item, idx) => 
                idx === cIndex ? { ...item, completed: !item.completed } : item
            );
            if (onUpdate) onUpdate({ ...module, contents: next });
            return next;
        });
    };

    const handleDownloadContent = (e: React.MouseEvent, cIndex: number) => {
        e.stopPropagation();
        if (currentStatus === 'locked' || downloadingIdx !== null) return;
        
        setDownloadingIdx(cIndex);
        
        // Simulates realistic network download delay
        setTimeout(() => {
            setContents(prev => {
                const next = prev.map((item, idx) => 
                    idx === cIndex ? { ...item, completed: true } : item
                );
                if (onUpdate) onUpdate({ ...module, contents: next });
                return next;
            });
            setDownloadingIdx(null);
        }, 1000);
    };

    const handleMainAction = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentStatus === 'locked') return;

        if (currentStatus === 'completed') {
            // Reset checklist to demo review experience
            setContents(prev => {
                const next = prev.map(item => ({ ...item, completed: false }));
                if (onUpdate) onUpdate({ ...module, contents: next });
                return next;
            });
            return;
        }

        // Auto download the next incomplete material in the queue
        const firstIncompleteIdx = contents.findIndex(item => !item.completed);
        if (firstIncompleteIdx !== -1) {
            handleDownloadContent(e, firstIncompleteIdx);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={currentStatus !== 'locked' ? {
                y: -2,
            } : undefined}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`group relative overflow-hidden rounded-[24px] border p-5 text-left transition-colors duration-200 sm:p-6 lg:p-7 ${
                currentStatus === 'locked' 
                    ? 'bg-zinc-50/80 border-zinc-200/70 dark:bg-zinc-900/60 dark:border-zinc-800/70 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]' 
                    : 'bg-white border-zinc-200/80 dark:bg-zinc-900 dark:border-zinc-800/80 shadow-sm hover:shadow-md hover:border-blue-200/80 dark:hover:border-blue-800/50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950 hover:z-10'
            }`}
        >

            {/* Locked Overlay with Premium White Pill Container imitating Study Tools */}
            {currentStatus === 'locked' && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-[6px] rounded-[24px]">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-[24px] p-5 sm:p-6 lg:p-7 w-full flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 group/locked transition-all duration-300 hover:shadow-2xl hover:border-blue-200/80 dark:hover:border-blue-800/50 relative overflow-hidden">
                        
                        {/* SaaS Background Accents */}
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-blue-500/5 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover/locked:scale-150" aria-hidden="true" />
                        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-blue-400/5 dark:bg-blue-400/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover/locked:scale-150" aria-hidden="true" />

                        {/* Left: Icon & Text */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6 relative z-10 w-full xl:w-auto">
                            <motion.div 
                                whileHover={{ scale: 1.05, rotate: -5 }}
                                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                className="w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 flex items-center justify-center flex-shrink-0 shadow-sm relative transition-transform duration-300"
                            >
                                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            </motion.div>
                            <div>
                                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight mb-1 sm:mb-1.5 transition-colors">
                                    {lockedReason?.title}
                                </h2>
                                <p className="text-xs sm:text-sm md:text-base font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg">
                                    {lockedReason?.description}
                                </p>
                            </div>
                        </div>

                        {/* Right: Tag Badge (imitating 'Available 11 Tools' layout) */}
                        <div className="flex items-center gap-3 w-full sm:w-auto sm:justify-end relative z-10">
                            <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50 rounded-[14px] sm:rounded-[16px] border border-slate-200 dark:border-slate-700/50 hover:border-blue-200 dark:hover:border-blue-800/50 transition-colors shadow-sm">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-[10px] sm:rounded-[12px] bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="10"/>
                                        <line x1="12" y1="8" x2="12" y2="12"/>
                                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                                    </svg>
                                </div>
                                <div className="flex flex-col justify-center">
                                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-0.5 sm:mb-1">STATUS</span>
                                    <span className="text-[13px] sm:text-[15px] font-extrabold text-slate-700 dark:text-slate-200 leading-none tracking-wide">Locked</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Inner Content Wrapper (Blurred if locked) */}
            <div className={`flex w-full flex-col lg:flex-row items-stretch gap-6 lg:gap-8 ${currentStatus === 'locked' ? 'blur-[8px] opacity-40 pointer-events-none select-none transition-all duration-500' : ''}`}>

            {/* Left Section: Module details & Main Action Button (~40% width on desktop) */}
            <div className="flex flex-col lg:w-[40%] shrink-0 justify-start gap-6 border-b lg:border-b-0 lg:border-r border-zinc-150 dark:border-zinc-800/60 pb-6 lg:pb-0 lg:pr-6">
                <div className="flex flex-col gap-4">
                    <div className="text-left">
                        <h3 className="text-[18px] sm:text-[20px] font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug">
                            {module.title}
                        </h3>
                    </div>

                    {/* Module Overview Card */}
                    <motion.div 
                        whileHover={currentStatus !== 'locked' ? { y: -1 } : {}}
                        className={`relative overflow-hidden border rounded-[14px] p-4 flex flex-col sm:flex-row items-start gap-3 group/overview transition-all duration-300 ${
                            currentStatus === 'locked'
                                ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/40 opacity-70'
                                : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700/60 shadow-sm hover:shadow-md hover:border-blue-200/80 dark:hover:border-blue-800/40'
                        }`}
                    >
                        <div
                            className={`w-10 h-10 transition-all duration-300 rounded-[12px] flex items-center justify-center flex-shrink-0 group-hover/overview:scale-105 ${
                                currentStatus === 'completed'
                                    ? 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 border border-emerald-100/80 dark:border-emerald-800/30'
                                    : currentStatus === 'locked'
                                        ? 'bg-slate-100 dark:bg-slate-700/50 border border-slate-200/60 dark:border-slate-600/30'
                                        : 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-100/80 dark:border-blue-800/30'
                            }`}
                        >
                            {currentStatus === 'completed' ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-emerald-600 dark:text-emerald-400" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                            ) : currentStatus === 'locked' ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-slate-400 dark:text-slate-500" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-blue-600 dark:text-blue-400" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="16" x2="12" y2="12" />
                                    <line x1="12" y1="8" x2="12.01" y2="8" />
                                </svg>
                            )}
                        </div>

                        <div className="flex-1 relative z-10 text-left min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Module Overview</p>
                            <p className="text-[13px] sm:text-[13.5px] text-slate-600 dark:text-slate-300 leading-relaxed">
                                {getModuleDescription(module.title)}
                            </p>
                        </div>
                    </motion.div>

                </div>

                {/* Progress bar & Continue learning button grouped together */}
                <div className="flex flex-col gap-3 sm:gap-4">
                    {/* Progress Bar */}
                    <div className="w-full">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Progress</span>
                            <span className={`text-[13px] font-extrabold ${currentStatus === 'completed' ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                {progressPercent}%
                            </span>
                        </div>
                        <div className="w-full h-3 rounded-full bg-slate-200/80 dark:bg-slate-700 overflow-hidden shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.15)] border border-black/5 dark:border-white/5">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                transition={{ duration: 0.8, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                                className={`h-full rounded-full transition-all duration-1000 ease-out relative ${
                                    currentStatus === 'completed' 
                                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' 
                                        : 'bg-gradient-to-r from-blue-500 to-blue-400'
                                }`}
                            />
                        </div>
                    </div>

                    {/* Continue learning CTA button */}
                    <motion.button
                        whileHover={currentStatus !== 'locked' ? { scale: 1.02 } : {}}
                        whileTap={currentStatus !== 'locked' ? { scale: 0.98 } : {}}
                        className={`w-full py-2 sm:py-2.5 px-3 sm:px-4 text-[12px] sm:text-[13px] font-bold rounded-[14px] transition-colors shadow-sm flex items-center justify-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                            currentStatus === 'locked'
                                ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed dark:bg-zinc-800/40 dark:text-zinc-600'
                                : currentStatus === 'completed'
                                    ? 'bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/50 dark:hover:bg-emerald-900/70 text-emerald-700 dark:text-emerald-300 focus-visible:ring-emerald-500'
                                    : 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900/70 text-blue-700 dark:text-blue-300 focus-visible:ring-blue-500'
                        }`}
                        disabled={currentStatus === 'locked'}
                        onClick={handleMainAction}
                    >
                        {currentStatus === 'completed' ? (
                            <>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                Reset & Review Module
                            </>
                        ) : currentStatus === 'in-progress' ? (
                            <>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                Continue Learning
                            </>
                        ) : (
                            <>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                Locked
                            </>
                        )}
                    </motion.button>
                </div>
            </div>

            {/* Right Column: Learning Materials Checklist (~56% width on desktop) */}
            <div className="flex flex-col lg:flex-1 gap-2.5 justify-center lg:justify-start mt-5 lg:mt-0">

                <div className="flex items-center justify-between mb-2.5 gap-2">
                    {/* Learning Materials Badge */}
                    <motion.div 
                        
                        className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 text-zinc-500 dark:text-zinc-400 shadow-sm cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-150"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                            <path d="M2 17l10 5 10-5" />
                            <path d="M2 12l10 5 10-5" />
                        </svg>
                        <span>Learning Materials</span>
                    </motion.div>

                    {/* Progress Badge */}
                    <motion.div 
                        
                        className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-[12px] font-bold bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 text-slate-700 dark:text-slate-300 shadow-sm cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-150"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        <span>{completedContents} of {contents.length} Completed</span>
                    </motion.div>
                </div>
                <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[22px] p-3.5 shadow-sm flex flex-col lg:flex-1 lg:justify-between gap-3">
                    <div className="flex flex-col gap-2.5 flex-1 justify-start">
                        {paginatedContents.map((content, pageIndex) => {
                            const cIndex = currentPage * itemsPerPage + pageIndex;
                            const config = CONTENT_TYPE_CONFIG[content.type];
                            const isCompleted = content.completed;
                            const isDownloading = downloadingIdx === cIndex;
                            const itemColor = config.color;
                            const colorClasses = isCompleted ? COLOR_CLASSES : MUTED_COLOR_CLASSES;
                            return (
                                <motion.div
                                    key={cIndex}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: pageIndex * 0.05, duration: 0.2 }}
                                    
                                    
                                    className={`relative flex items-center justify-between p-4 rounded-2xl border transition-colors duration-200 ${
                                        currentStatus === 'locked' 
                                            ? 'bg-zinc-50/50 border-zinc-200/50 opacity-60 dark:bg-zinc-900/40 dark:border-zinc-800/50' 
                                            : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer group/row'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">

                                        {/* Custom File Type Icon Container */}
                                        <motion.div
                                            whileHover={currentStatus !== 'locked' ? { scale: 1.05, rotate: -5 } : {}}
                                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                            className={`w-9 h-9 sm:w-11 sm:h-11 rounded-[12px] flex items-center justify-center border shrink-0 shadow-sm relative transition-colors duration-200 ${
                                                currentStatus === 'locked'
                                                    ? 'border-zinc-200/40 dark:border-zinc-800/40 bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-400 dark:text-zinc-500'
                                                    : isCompleted
                                                        ? `${colorClasses[itemColor].base} group-hover/row:border-blue-300 dark:group-hover/row:border-blue-700`
                                                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 group-hover/row:bg-blue-50 dark:group-hover/row:bg-blue-950/20 group-hover/row:border-blue-200 dark:group-hover/row:border-blue-800/50 group-hover/row:text-blue-500 dark:group-hover/row:text-blue-400'
                                            }`}
                                        >
                                            {config.icon}
                                        </motion.div>

                                        {/* Title text & Material description */}
                                        <div className="min-w-0 flex-1 text-left flex flex-col items-start justify-center">
                                            <p className="text-[14px] font-bold text-slate-800 dark:text-slate-200 leading-snug tracking-tight transition-colors group-hover/row:text-blue-700 dark:group-hover/row:text-blue-400 line-clamp-2 sm:line-clamp-none pr-1 w-full" title={content.title}>
                                                {content.title}
                                            </p>
                                            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-normal mt-0.5 mb-2 line-clamp-1 sm:truncate w-full">
                                                {getContentDescription(content.type)}
                                            </p>
                                            <motion.div 
                                                whileHover={{ scale: 1.03 }}
                                                whileTap={{ scale: 0.97 }}
                                                className="inline-flex items-center gap-1.5 px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold uppercase tracking-wide bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 text-zinc-500 dark:text-zinc-400 shadow-sm cursor-pointer group-hover/row:border-blue-200/80 dark:group-hover/row:border-blue-800/50 group-hover/row:text-blue-600 dark:group-hover/row:text-blue-400 transition-colors duration-150"
                                            >
                                                <span className="text-zinc-400 dark:text-zinc-500 group-hover/row:text-blue-500 dark:group-hover/row:text-blue-400 shrink-0 flex items-center justify-center w-3.5 h-3.5 [&>svg]:w-full [&>svg]:h-full transition-colors">
                                                    {config.icon}
                                                </span>
                                                <span>{config.label}</span>
                                            </motion.div>
                                        </div>
                                    </div>

                                    {/* Download/View Action Button */}
                                    <motion.button
                                        type="button"
                                        disabled={currentStatus === 'locked' || isDownloading}
                                        onClick={(e) => handleDownloadContent(e, cIndex)}
                                        whileHover={currentStatus !== 'locked' && !isDownloading ? { scale: 1.15 } : {}}
                                        whileTap={currentStatus !== 'locked' && !isDownloading ? { scale: 0.9 } : {}}
                                        className="relative min-w-[36px] min-h-[36px] flex items-center justify-center shrink-0 rounded-full focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                        aria-label={`Download ${content.title}`}
                                    >
                                        {/* Background circle — only shows when downloading or completed */}
                                        <AnimatePresence>
                                            {(isDownloading || isCompleted) && (
                                                <motion.div
                                                    initial={{ scale: 0, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    exit={{ scale: 0, opacity: 0 }}
                                                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                                    className={`absolute inset-0 rounded-full ${
                                                        isDownloading
                                                            ? 'bg-blue-100 dark:bg-blue-900/40'
                                                            : 'bg-emerald-100 dark:bg-emerald-900/40'
                                                    }`}
                                                />
                                            )}
                                        </AnimatePresence>

                                        {/* Icon layer */}
                                        <div className="relative z-10">
                                            {isDownloading ? (
                                                <svg
                                                    className="h-4 w-4 text-blue-500 dark:text-blue-400 animate-spin"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                >
                                                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3.5" className="opacity-20" />
                                                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="56" strokeDashoffset="16" />
                                                </svg>
                                            ) : isCompleted ? (
                                                <motion.svg
                                                    initial={{ scale: 0, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                                                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 dark:text-emerald-400"
                                                >
                                                    <polyline points="20 6 9 17 4 12" />
                                                </motion.svg>
                                            ) : (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400 dark:text-zinc-500 group-hover/row:text-blue-500 dark:group-hover/row:text-blue-400 transition-colors">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                    <polyline points="7 10 12 15 17 10" />
                                                    <line x1="12" y1="15" x2="12" y2="3" />
                                                </svg>
                                            )}
                                        </div>
                                    </motion.button>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="w-full pt-2.5 mt-2.5 border-t border-zinc-150 dark:border-zinc-800/80">
                            <div className="flex items-center justify-between w-full gap-2 bg-white dark:bg-zinc-900 p-1.5 rounded-[14px] border border-zinc-200/60 dark:border-zinc-700/50 shadow-sm transition-all duration-300 hover:shadow-md">
                                <button 
                                    type="button"
                                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))} 
                                    disabled={currentPage === 0}
                                    className={`w-9 h-9 rounded-[10px] flex items-center justify-center transition-all shadow-sm cursor-pointer border ${
                                        currentPage === 0
                                            ? 'bg-zinc-50/50 dark:bg-zinc-900/20 border-zinc-100 dark:border-zinc-800/40 text-zinc-300 dark:text-zinc-700 cursor-not-allowed'
                                            : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600 text-zinc-500 hover:text-blue-600 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 hover:border-blue-300 dark:hover:border-blue-500'
                                    }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <span className="text-[13px] font-bold text-zinc-700 dark:text-zinc-300 text-center tracking-wide flex-1">
                                    Page {currentPage + 1} <span className="text-zinc-400 dark:text-zinc-500 font-medium mx-0.5">/</span> {totalPages}
                                </span>
                                <button 
                                    type="button"
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))} 
                                    disabled={currentPage === totalPages - 1}
                                    className={`w-9 h-9 rounded-[10px] flex items-center justify-center transition-all shadow-sm cursor-pointer border ${
                                        currentPage === totalPages - 1
                                            ? 'bg-zinc-50/50 dark:bg-zinc-900/20 border-zinc-100 dark:border-zinc-800/40 text-zinc-300 dark:text-zinc-700 cursor-not-allowed'
                                            : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600 text-zinc-500 hover:text-blue-600 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 hover:border-blue-300 dark:hover:border-blue-500'
                                    }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            </div>
        </motion.div>
    );
};

export default ModuleCard;
