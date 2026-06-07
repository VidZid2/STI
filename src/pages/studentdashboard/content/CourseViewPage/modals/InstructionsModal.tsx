import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface InstructionsModalProps {
    task: {
        title: string;
        description?: string;
        instructions?: string;
        allowLateSubmission?: boolean;
        latePenalty?: number;
        maxAttempts?: number;
        rubricEnabled?: boolean;
        rubricCriteria?: { id?: string; name: string; points: number; description?: string }[];
        submissionCount?: number;
        [key: string]: unknown;
    } | null;
    onClose: () => void;
}

const BLUE = '#3b82f6';

const TaskIcon = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
);

const InstructionsModal: React.FC<InstructionsModalProps> = ({ task, onClose }) => {
    const [isDarkMode, setIsDarkMode] = useState(() => document.body.classList.contains('dark-mode'));
    
    // Auto-minimizing header state
    const [isMinimized, setIsMinimized] = useState(false);
    const lastScrollY = useRef(0);
    const scrollDirection = useRef<'up' | 'down' | null>(null);
    const anchorScrollY = useRef(0);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const currentScrollY = e.currentTarget.scrollTop;
        const scrollHeight = e.currentTarget.scrollHeight;
        const clientHeight = e.currentTarget.clientHeight;
        
        // Handle iOS rubber banding / top of scroll
        if (currentScrollY <= 10) {
            setIsMinimized(false);
            lastScrollY.current = currentScrollY;
            scrollDirection.current = null;
            anchorScrollY.current = currentScrollY;
            return;
        }

        // Determine current scrolling direction
        const delta = currentScrollY - lastScrollY.current;
        const isNearBottom = scrollHeight - currentScrollY - clientHeight < 50;
        
        if (delta > 0) {
            if (scrollDirection.current !== 'down') {
                scrollDirection.current = 'down';
                anchorScrollY.current = lastScrollY.current;
            }
            if (currentScrollY - anchorScrollY.current > 30) {
                setIsMinimized(true);
            }
        } else if (delta < 0) {
            if (scrollDirection.current !== 'up') {
                scrollDirection.current = 'up';
                anchorScrollY.current = lastScrollY.current;
            }
            // Do not expand just by scrolling up. Only expand at the very top.
        }

        lastScrollY.current = currentScrollY;
    }, []);

    useEffect(() => {
        const checkDarkMode = () => setIsDarkMode(document.body.classList.contains('dark-mode'));
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (task) document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [task, onClose]);

    useEffect(() => {
        if (task) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [task]);

    return (
        <AnimatePresence>
            {task && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 99998,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                }}>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: isDarkMode ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.6)',
                            backdropFilter: 'blur(12px)',
                        }}
                    />

                    {/* Modal */}
                    <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ 
                            type: 'spring', 
                            damping: 28, 
                            stiffness: 350,
                            layout: { type: 'spring', damping: 25, stiffness: 200 }
                        }}
                        style={{
                            position: 'relative',
                            width: '100%',
                            maxWidth: '640px',
                            height: '85vh',
                            maxHeight: '800px',
                            background: isDarkMode ? '#0f172a' : '#f8fafc',
                            borderRadius: '20px',
                            boxShadow: isDarkMode 
                                ? '0 25px 80px rgba(0, 0, 0, 0.6)' 
                                : '0 25px 80px rgba(0, 0, 0, 0.2)',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <motion.div 
                            animate={{
                                padding: isMinimized ? '12px 16px' : '24px 24px 8px 24px'
                            }}
                            className="relative border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-t-[20px]"
                        >
                            <motion.div 
                                animate={{ marginBottom: isMinimized ? '0px' : '24px' }}
                                className="flex items-start gap-3 sm:gap-4"
                            >
                                {/* Header Card */}
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ 
                                        opacity: 1, 
                                        y: 0,
                                        padding: isMinimized ? '12px 16px' : '24px',
                                        gap: isMinimized ? '16px' : '24px'
                                    }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 24, delay: 0.1 }}
                                    className="flex-1 relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[20px] sm:rounded-[24px] flex items-center group transition-all duration-300 hover:shadow-md hover:border-blue-200/80 dark:hover:border-blue-800/50 text-left"
                                >
                                    {/* SaaS Background Accents */}
                                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
                                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-blue-400/10 dark:bg-blue-400/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />

                                    <motion.div
                                        animate={{
                                            width: isMinimized ? 40 : 64,
                                            height: isMinimized ? 40 : 64,
                                            borderRadius: isMinimized ? 12 : 20
                                        }}
                                        whileHover={{ scale: 1.05, rotate: -5 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                        className="bg-blue-50 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 flex items-center justify-center flex-shrink-0 shadow-sm text-blue-600 dark:text-blue-400 relative z-10"
                                    >
                                        <div className="hidden sm:flex">
                                            <TaskIcon size={32} />
                                        </div>
                                        <div className="flex sm:hidden">
                                            <TaskIcon size={24} />
                                        </div>
                                    </motion.div>
                                    
                                    <div className="relative z-10 flex-1 min-w-0 pr-2 sm:pr-4">
                                        <motion.h2 
                                            animate={{ fontSize: isMinimized ? '16px' : '26px' }}
                                            className="font-bold text-zinc-900 dark:text-zinc-100 tracking-tight m-0 mb-0.5 sm:mb-1 truncate"
                                        >
                                            {task.title}
                                        </motion.h2>
                                        <motion.p 
                                            animate={{ fontSize: isMinimized ? '12px' : '14.5px' }}
                                            className="text-zinc-600 dark:text-zinc-400 leading-relaxed m-0"
                                        >
                                            Task Instructions & Details
                                        </motion.p>
                                    </div>
                                    <div className="relative z-20 self-start">
                                        <motion.button
                                            onClick={onClose}
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="flex-shrink-0 flex items-center justify-center rounded-lg sm:rounded-xl border border-zinc-200/80 bg-white/80 backdrop-blur-md p-2 text-zinc-500 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-700/80 dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:bg-zinc-700"
                                            aria-label="Close modal"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sm:w-5 sm:h-5">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        </motion.button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        </motion.div>

                        {/* Content Scroll Area */}
                        <div 
                            onScroll={handleScroll} 
                            className="flex-1 overflow-y-auto px-4 sm:px-6 pb-8 pt-4 custom-scrollbar"
                            style={{ 
                                scrollBehavior: 'smooth',
                                // @ts-ignore
                                WebkitOverflowScrolling: 'touch'
                            }}
                        >
                            <div className="space-y-4">
                                {task.description && (
                                    <div className="space-y-3">
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginBottom: '16px',
                                            marginTop: '12px',
                                            width: '100%',
                                            padding: '0 4px',
                                        }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <h3 style={{
                                                    margin: '0 0 3px',
                                                    fontSize: '17px',
                                                    fontWeight: 800,
                                                    color: isDarkMode ? '#f8fafc' : '#0f172a',
                                                    letterSpacing: '-0.02em',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}>
                                                    <div style={{
                                                        width: '6px',
                                                        height: '16px',
                                                        borderRadius: '3px',
                                                        backgroundColor: '#3b82f6',
                                                    }} />
                                                    Description
                                                </h3>
                                                <p style={{
                                                    margin: 0,
                                                    fontSize: '12.5px',
                                                    color: isDarkMode ? '#94a3b8' : '#64748b',
                                                    fontWeight: 400,
                                                    paddingLeft: '14px',
                                                }}>
                                                    Overview of this activity
                                                </p>
                                            </div>
                                        </div>
                                        <motion.div 
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                            className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[20px] transition-all duration-300 hover:shadow-md hover:border-blue-200/80 dark:hover:border-blue-800/50 p-5 sm:p-6"
                                        >
                                            <div className="text-[14px] sm:text-[15px] text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap font-medium">
                                                {task.description}
                                            </div>
                                        </motion.div>
                                    </div>
                                )}

                                {task.instructions && (
                                    <div className="space-y-3">
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginBottom: '16px',
                                            marginTop: '12px',
                                            width: '100%',
                                            padding: '0 4px',
                                        }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <h3 style={{
                                                    margin: '0 0 3px',
                                                    fontSize: '17px',
                                                    fontWeight: 800,
                                                    color: isDarkMode ? '#f8fafc' : '#0f172a',
                                                    letterSpacing: '-0.02em',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}>
                                                    <div style={{
                                                        width: '6px',
                                                        height: '16px',
                                                        borderRadius: '3px',
                                                        backgroundColor: '#3b82f6',
                                                    }} />
                                                    Detailed Instructions
                                                </h3>
                                                <p style={{
                                                    margin: 0,
                                                    fontSize: '12.5px',
                                                    color: isDarkMode ? '#94a3b8' : '#64748b',
                                                    fontWeight: 400,
                                                    paddingLeft: '14px',
                                                }}>
                                                    Step-by-step guide to complete this task
                                                </p>
                                            </div>
                                        </div>
                                        <motion.div 
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[20px] transition-all duration-300 hover:shadow-md hover:border-blue-200/80 dark:hover:border-blue-800/50 p-5 sm:p-6"
                                        >
                                            <div
                                                className="text-[14px] sm:text-[15px] text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap prose prose-zinc dark:prose-invert prose-sm max-w-none font-medium"
                                                dangerouslySetInnerHTML={{ __html: task.instructions }}
                                            />
                                        </motion.div>
                                    </div>
                                )}
                                
                                {!task.description && !task.instructions && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="flex flex-col items-center justify-center py-16 text-center text-zinc-400 dark:text-zinc-500"
                                    >
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-50">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                            <line x1="9" y1="3" x2="9" y2="21" />
                                        </svg>
                                        <p className="text-[15px] font-medium">No additional details provided.</p>
                                    </motion.div>
                                )}

                                {/* Assignment Rules */}
                                {(task.allowLateSubmission !== undefined ||
                                    (task.maxAttempts ?? 0) > 1 ||
                                    task.rubricEnabled) && (
                                    <div className="space-y-3">
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginBottom: '16px',
                                            marginTop: '12px',
                                            width: '100%',
                                            padding: '0 4px',
                                        }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <h3 style={{
                                                    margin: '0 0 3px',
                                                    fontSize: '17px',
                                                    fontWeight: 800,
                                                    color: isDarkMode ? '#f8fafc' : '#0f172a',
                                                    letterSpacing: '-0.02em',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}>
                                                    <div style={{
                                                        width: '6px',
                                                        height: '16px',
                                                        borderRadius: '3px',
                                                        backgroundColor: '#3b82f6',
                                                    }} />
                                                    Assignment Rules
                                                </h3>
                                                <p style={{
                                                    margin: 0,
                                                    fontSize: '12.5px',
                                                    color: isDarkMode ? '#94a3b8' : '#64748b',
                                                    fontWeight: 400,
                                                    paddingLeft: '14px',
                                                }}>
                                                    Policies and grading criteria for this activity
                                                </p>
                                            </div>
                                        </div>
                                            <motion.div 
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 }}
                                        >
                                            <div className="flex flex-col sm:flex-row gap-3">
                                                {/* Late Submission Policy */}
                                                <div className={`flex flex-1 w-full items-center gap-3.5 px-4 py-3.5 bg-white dark:bg-slate-800 rounded-[16px] border shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-default group/latecard ${task.allowLateSubmission ? 'border-amber-200/60 dark:border-amber-700/30 hover:border-amber-300 dark:hover:border-amber-600/50' : 'border-red-200/60 dark:border-red-700/30 hover:border-red-300 dark:hover:border-red-600/50'}`}>
                                                    <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 group-hover/latecard:scale-110 transition-transform duration-300 ${task.allowLateSubmission ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                                            <circle cx="12" cy="12" r="10" />
                                                            <polyline points="12 6 12 12 16 14" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex flex-col text-left justify-center min-w-0">
                                                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1.5">LATE POLICY</span>
                                                        <span className="text-[14px] font-extrabold text-slate-900 dark:text-slate-100 leading-none truncate">
                                                            {task.allowLateSubmission ? 'Allowed' : 'No late submissions'}
                                                        </span>
                                                        {task.allowLateSubmission && (task.latePenalty ?? 0) > 0 && (
                                                            <span className="text-[11.5px] font-medium text-amber-600 dark:text-amber-400 leading-none mt-1.5 truncate">
                                                                -{task.latePenalty}% penalty/day
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Max Attempts */}
                                                {(task.maxAttempts ?? 0) > 1 && (
                                                    <div className="flex flex-1 w-full items-center gap-3.5 px-4 py-3.5 bg-white dark:bg-slate-800 rounded-[16px] border border-blue-200/60 dark:border-blue-700/30 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-blue-300 dark:hover:border-blue-600/50 cursor-default group/attemptcard">
                                                        <div className="w-10 h-10 rounded-[12px] bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 group-hover/attemptcard:scale-110 transition-transform duration-300">
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                                                <polyline points="1 4 1 10 7 10" />
                                                                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                                                            </svg>
                                                        </div>
                                                        <div className="flex flex-col text-left justify-center min-w-0">
                                                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1.5">ATTEMPTS</span>
                                                            <span className="text-[14px] font-extrabold text-slate-900 dark:text-slate-100 leading-none truncate">
                                                                {task.maxAttempts} allowed
                                                            </span>
                                                            <span className="text-[11.5px] font-medium text-blue-600 dark:text-blue-400 leading-none mt-1.5 truncate">
                                                                {(() => {
                                                                    const used = task.submissionCount || 0;
                                                                    const max = task.maxAttempts || 1;
                                                                    const remaining = Math.max(0, max - used);
                                                                    if (used === 0) return `${max} left`;
                                                                    if (remaining === 0) return 'None left';
                                                                    return `${used} used · ${remaining} left`;
                                                                })()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Rubric Criteria Display */}
                                            {task.rubricEnabled && (task.rubricCriteria?.length ?? 0) > 0 && (
                                                <div className="flex flex-col gap-3 mt-4">
                                                    {(task.rubricCriteria ?? []).map((criterion, idx) => (
                                                        <div key={criterion.id || idx} className="group relative bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[14px] p-4 sm:p-5 transition-all duration-300 hover:border-emerald-500/50 hover:shadow-md dark:hover:border-emerald-500/40">
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: criterion.description ? '8px' : '0' }}>
                                                                <span className="text-[14.5px] font-bold text-zinc-900 dark:text-zinc-100 transition-colors duration-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                                                                    {criterion.name}
                                                                </span>
                                                                <span className="text-[12px] font-bold px-2.5 py-1 rounded-[8px] bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 whitespace-nowrap ml-3">
                                                                    {criterion.points} pts
                                                                </span>
                                                            </div>
                                                            {criterion.description && (
                                                                <p className="text-[13px] text-zinc-500 dark:text-zinc-400 m-0 leading-relaxed font-medium">
                                                                    {criterion.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </motion.div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ 
                                opacity: 1,
                                padding: isMinimized ? '8px' : '16px',
                                paddingTop: isMinimized ? '4px' : '4px'
                            }}
                            transition={{ delay: 0.3 }}
                            className="border-t border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-b-[20px]"
                        >
                            <motion.div
                                animate={{
                                    padding: isMinimized ? '8px 12px' : '16px',
                                    gap: isMinimized ? '10px' : '16px'
                                }}
                                whileHover={{ scale: 1.01 }}
                                className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[20px] flex items-center group transition-all duration-300 hover:shadow-md hover:border-blue-200/80 dark:hover:border-blue-800/50 text-left"
                            >
                                {/* SaaS Background Accents */}
                                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
                                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-24 h-24 bg-blue-400/10 dark:bg-blue-400/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />

                                {/* Icon Container */}
                                <motion.div
                                    animate={{
                                        width: isMinimized ? 36 : 44,
                                        height: isMinimized ? 36 : 44,
                                        borderRadius: isMinimized ? 12 : 14
                                    }}
                                    whileHover={{ scale: 1.05, rotate: -5 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                    className="bg-blue-50 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 flex items-center justify-center flex-shrink-0 shadow-sm text-blue-600 dark:text-blue-400 relative z-10"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                        <polyline points="22,6 12,13 2,6" />
                                    </svg>
                                </motion.div>

                                {/* Text Area */}
                                <div className="relative z-10 flex-1">
                                    <motion.h3 
                                        animate={{ fontSize: isMinimized ? '14.5px' : '16px' }}
                                        className="font-bold text-zinc-900 dark:text-zinc-100 tracking-tight m-0"
                                        style={{ marginBottom: isMinimized ? '0px' : '2px' }}
                                    >
                                        Still need help?
                                    </motion.h3>
                                    <AnimatePresence>
                                        {!isMinimized && (
                                            <motion.p 
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed m-0 pr-2"
                                            >
                                                Have questions about this task? Contact your proctor.
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Action Button */}
                                <div className="relative z-10 flex-shrink-0">
                                    <motion.button
                                        animate={{
                                            padding: isMinimized ? '8px 16px' : '10px 20px',
                                            fontSize: isMinimized ? '13px' : '14px'
                                        }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="flex items-center justify-center gap-1.5 font-bold rounded-[14px] transition-colors shadow-sm bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900/70 text-blue-700 dark:text-blue-300 focus:outline-none border-none cursor-pointer"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                        Contact Proctor
                                    </motion.button>
                                </div>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default InstructionsModal;
