import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ChevronUp, PanelBottomOpen, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

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
    const titleId = useId();
    const summaryId = useId();
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const previousActiveElementRef = useRef<HTMLElement | null>(null);

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

            <div className="fixed inset-x-0 bottom-0 z-[1100] px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] lg:hidden pointer-events-none">
                <motion.button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className="pointer-events-auto mx-auto flex w-full max-w-md items-center justify-between gap-3 rounded-[22px] border border-zinc-200/80 bg-white/95 px-4 py-3 text-left shadow-2xl shadow-zinc-900/15 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/95 dark:shadow-black/30"
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
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby={titleId}
                            aria-describedby={summary ? summaryId : undefined}
                            tabIndex={-1}
                            className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-hidden rounded-t-[28px] border border-zinc-200/80 bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-2xl shadow-zinc-950/20 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-black/50"
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", stiffness: 360, damping: 34 }}
                        >
                            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                            <div className="flex items-start justify-between gap-4 px-1">
                                <div className="min-w-0">
                                    <p className="text-[11px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Tool Panel</p>
                                    <h2 id={titleId} className="truncate text-lg font-black text-zinc-950 dark:text-zinc-50">{title}</h2>
                                    {summary && (
                                        <p id={summaryId} className="mt-0.5 text-sm font-semibold text-zinc-500 dark:text-zinc-400">{summary}</p>
                                    )}
                                </div>
                                <button
                                    ref={closeButtonRef}
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600 transition-colors hover:bg-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:focus-visible:ring-offset-zinc-950"
                                    aria-label="Close tool panel"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="tool-mobile-sheet-content mt-4 flex max-h-[70vh] min-w-0 flex-col gap-3 overflow-x-hidden overflow-y-auto overscroll-contain px-1 pb-2 pr-2 [scrollbar-width:thin]">
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
