import { useEffect, useId, useRef, useState, type ReactNode, useCallback } from "react";
import { ChevronUp, PanelBottomOpen, X } from "lucide-react";
import { AnimatePresence, motion, type PanInfo } from "motion/react";

interface ToolMobileSheetProps {
    title: string;
    summary?: string;
    actionLabel?: string;
    className: string;
    children: ReactNode;
}

const ToolMobileSheet: React.FC<ToolMobileSheetProps> = ({
    title,
    summary,
    actionLabel = "Open insights",
    className,
    children,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const titleId = useId();
    const summaryId = useId();
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const previousActiveElementRef = useRef<HTMLElement | null>(null);
    const sheetRef = useRef<HTMLElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    // Auto-minimize scroll tracking
    const lastScrollY = useRef(0);
    const scrollDirection = useRef<'up' | 'down' | null>(null);
    const anchorScrollY = useRef(0);


    useEffect(() => {
        if (!isOpen) return;

        previousActiveElementRef.current = document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            window.clearTimeout(focusTimer);
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = previousOverflow;
            previousActiveElementRef.current?.focus();
        };
    }, [isOpen]);

    // Notify dashboard dock to hide/show when sheet opens/closes
    useEffect(() => {
        if (isOpen) {
            document.dispatchEvent(new CustomEvent('toolpanel:open'));
        } else {
            document.dispatchEvent(new CustomEvent('toolpanel:close'));
        }
        return () => {
            document.dispatchEvent(new CustomEvent('toolpanel:close'));
        };
    }, [isOpen]);
    
    // Auto-minimize on content scroll
    const handleContentScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const currentScrollY = e.currentTarget.scrollTop;

        if (currentScrollY <= 10) {
            setIsMinimized(false);
            lastScrollY.current = currentScrollY;
            scrollDirection.current = null;
            anchorScrollY.current = currentScrollY;
            return;
        }

        const delta = currentScrollY - lastScrollY.current;

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
        }

        lastScrollY.current = currentScrollY;
    }, []);

    // Reset minimized state when sheet closes
    useEffect(() => {
        if (!isOpen) {
            setIsMinimized(false);
            lastScrollY.current = 0;
            scrollDirection.current = null;
            anchorScrollY.current = 0;
        }
    }, [isOpen]);

    const handleDragEnd = (_: unknown, info: PanInfo) => {
        if (info.offset.y > 100 || info.velocity.y > 500) {
            setIsOpen(false);
        }
    };

    return (
        <>
            <motion.aside
                className={`${className} hidden lg:flex`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
            >
                {children}
            </motion.aside>

            <div className="lg:hidden mt-2 mb-4">
                <motion.button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className="flex w-full items-center justify-between gap-3 rounded-[24px] border border-zinc-200/80 bg-white px-4 py-3.5 text-left shadow-sm hover:shadow-md hover:border-zinc-300 dark:border-zinc-800/80 dark:bg-zinc-900 dark:hover:border-zinc-700 transition-all duration-200"
                    whileTap={{ scale: 0.98 }}
                    aria-label={actionLabel}
                    aria-expanded={isOpen}
                    aria-controls={isOpen ? titleId : undefined}
                >
                    <span className="flex min-w-0 items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                            <PanelBottomOpen className="h-5 w-5" />
                        </span>
                        <span className="min-w-0">
                            <span className="block text-[11px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Tool Panel</span>
                            <span className="block truncate text-sm font-black text-zinc-900 dark:text-zinc-100">{title}</span>
                            {summary && (
                                <span className="block truncate text-xs font-semibold text-zinc-500 dark:text-zinc-400">{summary}</span>
                            )}
                        </span>
                    </span>
                    <ChevronUp className="h-5 w-5 shrink-0 text-zinc-400" />
                </motion.button>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="fixed inset-0 z-[1200] lg:hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <button
                            type="button"
                            className="absolute inset-0 h-full w-full bg-zinc-950/35 backdrop-blur-[2px] dark:bg-black/55"
                            onClick={() => setIsOpen(false)}
                            aria-label="Close tool panel"
                        />

                        <motion.section
                            ref={sheetRef}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby={titleId}
                            aria-describedby={summary ? summaryId : undefined}
                            tabIndex={-1}
                            className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-hidden rounded-t-[28px] border border-zinc-200/80 bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-2xl shadow-zinc-950/20 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-black/50"
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                            drag="y"
                            dragConstraints={{ top: 0, bottom: 0 }}
                            dragElastic={0.2}
                            onDragEnd={handleDragEnd}
                        >
                            {/* Swipe Handle Indicator */}
                            <div 
                                className="mx-auto h-1.5 w-12 rounded-full bg-zinc-300 dark:bg-zinc-700 cursor-grab active:cursor-grabbing"
                                style={{ marginBottom: isMinimized ? '6px' : '12px' }}
                            />
                            <div 
                                className="flex items-start w-full px-1"
                                style={{ marginBottom: isMinimized ? '4px' : '12px' }}
                            >
                                {/* Header Card */}
                                <motion.div 
                                    animate={{ 
                                        padding: isMinimized ? '10px 14px' : '14px 16px',
                                        gap: isMinimized ? '12px' : '14px'
                                    }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                                    className="flex-1 w-full relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-[20px] flex items-center group transition-all duration-300 text-left"
                                >
                                    {/* SaaS Background Accents */}
                                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
                                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-blue-400/10 dark:bg-blue-400/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />

                                    <motion.div
                                        animate={{
                                            width: isMinimized ? 36 : 42,
                                            height: isMinimized ? 36 : 42,
                                            borderRadius: isMinimized ? 10 : 12
                                        }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                        className="bg-blue-50 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 flex shrink-0 items-center justify-center shadow-sm text-blue-600 dark:text-blue-400 relative z-10"
                                    >
                                        <PanelBottomOpen className={isMinimized ? 'h-4 w-4' : 'h-5 w-5'} />
                                    </motion.div>
                                    
                                    <div className="relative z-10 flex-1 min-w-0 pr-2">
                                        <motion.p 
                                            animate={{ 
                                                fontSize: isMinimized ? '9px' : '10px',
                                                marginBottom: isMinimized ? '0px' : '2px'
                                            }}
                                            className="font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 m-0"
                                        >
                                            Tool Panel
                                        </motion.p>
                                        <motion.h2 
                                            id={titleId}
                                            animate={{ fontSize: isMinimized ? '16px' : '18px' }}
                                            className="font-black text-zinc-950 dark:text-zinc-50 tracking-tight m-0 truncate leading-none"
                                        >
                                            {title}
                                        </motion.h2>
                                        <AnimatePresence>
                                            {!isMinimized && summary && (
                                                <motion.p 
                                                    id={summaryId} 
                                                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                                    animate={{ height: 'auto', opacity: 1, marginTop: 4 }}
                                                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 overflow-hidden m-0 truncate"
                                                >
                                                    {summary}
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <div className="relative z-20 self-start mt-0.5">
                                        <button
                                            ref={closeButtonRef}
                                            type="button"
                                            onClick={() => setIsOpen(false)}
                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-zinc-200/80 bg-white/80 backdrop-blur-md text-zinc-500 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-700 dark:border-zinc-700/80 dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                                            aria-label="Close tool panel"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            </div>

                            <div
                                ref={contentRef}
                                onScroll={handleContentScroll}
                                className="tool-mobile-sheet-content flex min-w-0 flex-col gap-3 overflow-x-hidden overflow-y-auto overscroll-contain px-1 pb-2 pr-2 [scrollbar-width:thin] [&>*]:shrink-0"
                                style={{ marginTop: isMinimized ? '8px' : '12px', maxHeight: '70vh' }}
                            >
                                {children}
                            </div>
                        </motion.section>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ToolMobileSheet;
