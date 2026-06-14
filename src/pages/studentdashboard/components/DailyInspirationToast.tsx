import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getStreakData } from '../../../services/studyTimeService';
import { TextAnimate } from '../../../components/ui/text-animate';
import { NotificationIcon } from './NotificationIcon';

export type GlobalToastType = 'quote' | 'streak' | 'goal_completed' | 'assignment' | 'grade' | 'warning' | 'announcement' | string;

export const triggerGlobalToast = (type: GlobalToastType, data?: any) => {
    window.dispatchEvent(new CustomEvent('global-toast', { detail: { type, data, id: Math.random().toString(36).substring(2, 9) } }));
};

interface DailyInspirationToastProps {
    quote: { text: string; author: string } | null;
    externalToasts?: any[];
    onExternalToastClose?: (id: any) => void;
}

export const DailyInspirationToast: React.FC<DailyInspirationToastProps> = ({ quote, externalToasts = [], onExternalToastClose }) => {
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : true);
    
    // Manage multiple internal toasts
    const [internalToasts, setInternalToasts] = useState<Array<{ id: string, type: GlobalToastType, data?: any, title?: string, message?: string }>>([]);
    const exitDirsRef = useRef<Record<string, string>>({});

    const dismissToast = (id: string, direction: string) => {
        exitDirsRef.current[id] = direction;
        
        setInternalToasts(prev => prev.filter(t => t.id !== id));
        
        if (onExternalToastClose) {
            onExternalToastClose(id);
        }
    };

    useEffect(() => {
        const handleGlobalToast = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            setInternalToasts(prev => [detail, ...prev]);
            
            setTimeout(() => {
                dismissToast(detail.id, 'down');
            }, 4000);
        };
        window.addEventListener('global-toast', handleGlobalToast);
        return () => window.removeEventListener('global-toast', handleGlobalToast);
    }, []);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        // Build the initial stack
        const initialToasts: Array<{ id: string, type: GlobalToastType, data?: any }> = [];
        
        // 1. Goal Completed
        initialToasts.push({ 
            id: 'goal_init', 
            type: 'goal_completed', 
            data: { title: 'Complete 5 Quizzes' } 
        });

        // 2. Add streak
        const streakData = getStreakData();
        if (streakData && streakData.currentStreak > 0) {
            initialToasts.push({ id: 'streak_init', type: 'streak' });
        } else {
            initialToasts.push({ id: 'streak_init', type: 'streak' }); // Fallback to always show for testing
        }
        
        // 3. Add quote
        if (quote) {
            initialToasts.push({ id: 'quote_init', type: 'quote' });
        }
        
        const timer = setTimeout(() => {
            setInternalToasts(initialToasts);
            
            initialToasts.forEach((toast, index) => {
                setTimeout(() => {
                    dismissToast(toast.id, 'down');
                }, 4000 + (index * 1500));
            });
        }, 1500);

        return () => clearTimeout(timer);
    }, [quote]);

    // Combine external and internal toasts
    const combinedExternalToasts = externalToasts.map(t => ({
        id: t.id.toString(),
        type: t.type || 'assignment',
        title: t.title,
        message: t.message,
        data: t
    }));

    const toasts = [...combinedExternalToasts, ...internalToasts];

    // Prevent blocking clicks when empty, but keep AnimatePresence mounted so the last exit animation runs!
    const containerPointerEvents = toasts.length === 0 ? 'pointer-events-none' : '';
    const handleDragEnd = (id: string, _: any, info: any) => {
        if (!isMobile) return;

        const threshold = 80;
        const velocityThreshold = 400;

        const isHorizontal = Math.abs(info.offset.x) > Math.abs(info.offset.y);

        if (isHorizontal) {
            if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
                dismissToast(id, 'right');
            } else if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
                dismissToast(id, 'left');
            }
        } else {
            if (info.offset.y > threshold || info.velocity.y > velocityThreshold) {
                dismissToast(id, 'down');
            } else if (info.offset.y < -threshold || info.velocity.y < -velocityThreshold) {
                dismissToast(id, 'up');
            }
        }
    };

    const variants: any = {
        initial: () => ({
            opacity: 0, 
            y: 50, 
            scale: 0.8
        }),
        animate: ({ isMobile, offset }: { isMobile: boolean, offset: number }) => {
            const yOffset = isMobile ? offset * 12 : -offset * 12;
            const scale = 1 - (offset * 0.05);
            return { 
                opacity: 1, 
                y: yOffset, 
                scale: scale,
                transition: { type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 1.2 }
            };
        },
        exit: ({ isMobile, id }: { isMobile: boolean, id: string }) => {
            const direction = exitDirsRef.current[id] || 'down';
            // Buttery smooth ease-out-quint with a long 1.6s duration
            const transition = { type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 1.6 };
            
            if (isMobile) {
                switch (direction) {
                    case 'left': return { x: -500, opacity: 0, scale: 0.9, transition };
                    case 'right': return { x: 500, opacity: 0, scale: 0.9, transition };
                    case 'up': return { y: -200, opacity: 0, scale: 0.9, transition };
                    case 'down': return { y: 200, opacity: 0, scale: 0.9, transition };
                    default: return { y: 200, opacity: 0, scale: 0.9, transition };
                }
            }
            
            // For Desktop, just go down normally off-screen
            return { 
                opacity: 0, 
                y: 150, 
                scale: 0.95,
                transition 
            };
        }
    };

    const streakData = getStreakData();
    const getTooltipMessage = () => {
        if (!streakData) return 'Start your learning journey today!';
        if (streakData.currentStreak === 0) return 'Start your learning journey today!';
        if (streakData.currentStreak === 1) return 'You started a streak! Keep it up tomorrow.';
        if (streakData.currentStreak < 7) return `${7 - streakData.currentStreak}d to weekly milestone`;
        if (streakData.currentStreak === 7) return 'Weekly milestone reached';
        if (streakData.currentStreak < 10) return `${10 - streakData.currentStreak}d to Silver tier`;
        if (streakData.currentStreak === 10) return 'Silver tier unlocked';
        if (streakData.currentStreak < 30) return `${30 - streakData.currentStreak}d to Gold tier`;
        return `${streakData.currentStreak} day streak! You're on fire! 🔥`;
    };

    return (
        <div className={`fixed top-20 left-4 right-4 mx-auto max-w-[450px] lg:top-auto lg:bottom-6 lg:left-6 lg:right-auto lg:mx-0 lg:w-[400px] ${isMobile ? 'z-[999]' : 'z-[10005]'} ${containerPointerEvents}`}>
            <div className="relative w-full h-full">
                <AnimatePresence mode="popLayout">
                    {toasts.map((t, index) => {
                        const isFront = index === toasts.length - 1;
                        const offset = toasts.length - 1 - index;
                        
                        return (
                            <motion.div
                                key={t.id}
                                layout="position"
                                custom={{ isMobile, id: t.id, offset }}
                                variants={variants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                drag={isMobile && isFront ? true : false}
                                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                                dragElastic={0.6}
                                onDragEnd={(e, info) => handleDragEnd(t.id, e, info)}
                                className={`w-full ${isFront ? 'relative' : 'absolute top-0 left-0'} ${isMobile && isFront ? 'touch-none cursor-grab active:cursor-grabbing' : ''}`}
                                style={{ zIndex: 100 - offset }}
                            >
                                <div 
                                    className={`relative flex items-center gap-3 w-full overflow-hidden rounded-xl shadow-sm p-3.5 
                                        ${isFront && !isMobile ? 'pr-8' : ''} 
                                        ${isMobile && isFront ? 'pointer-events-none' : ''}
                                        ${t.type === 'quote' 
                                            ? 'bg-blue-600 dark:bg-blue-900 border border-yellow-400' 
                                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                                        }`}
                                >
                                    
                                    {isFront && !isMobile && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                dismissToast(t.id, 'left');
                                            }}
                                            style={{ position: 'absolute', top: '4px', right: '4px', padding: '6px' }}
                                            className={`transition-colors z-10 pointer-events-auto ${t.type === 'quote' ? 'text-blue-200 hover:text-yellow-400' : 'text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300'}`}
                                            aria-label="Close"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}

                                    {t.type === 'quote' ? (
                                        <>
                                            {/* Icon on the left */}
                                            <div className="w-8 h-8 flex-shrink-0 rounded-full bg-yellow-400/20 flex items-center justify-center text-yellow-400">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                                                </svg>
                                            </div>
                                            
                                            {/* Text Content */}
                                            <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
                                                <h4 className="text-[13px] font-bold text-yellow-400 leading-tight">
                                                    Daily Inspiration
                                                </h4>
                                                <p className="text-white text-[10.5px] font-medium mt-0.5 leading-snug line-clamp-2">
                                                    "<TextAnimate animation="blurInUp" by="character" once as="span" className="inline">{quote?.text || ""}</TextAnimate>" <span className="text-blue-200 text-[9.5px] font-medium whitespace-nowrap ml-1">— {quote?.author}</span>
                                                </p>
                                            </div>
                                        </>
                                    ) : t.type === 'goal_completed' ? (
                                        <>
                                            <div className="w-8 h-8 flex-shrink-0 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                    <polyline points="22 4 12 14.01 9 11.01" />
                                                </svg>
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
                                                <h4 className="text-[12px] font-bold text-slate-800 dark:text-slate-200 leading-tight">
                                                    Goal Completed!
                                                </h4>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug truncate">
                                                    {t.data?.title || 'Goal'}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end justify-center pl-2 border-l border-slate-100 dark:border-slate-700">
                                                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 leading-none">
                                                    100%
                                                </span>
                                                <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-400 mt-0.5">
                                                    Complete
                                                </span>
                                            </div>
                                        </>
                                    ) : t.type === 'streak' ? (
                                        <>
                                            {/* Streak Icon */}
                                            <div className="w-8 h-8 flex-shrink-0 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-500">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 7 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                                                </svg>
                                            </div>
                                            
                                            {/* Streak Text */}
                                            <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
                                                <h4 className="text-[13px] font-bold text-slate-900 dark:text-slate-100 leading-tight">
                                                    Daily Streak
                                                </h4>
                                                <p className="text-slate-500 dark:text-slate-400 text-[10.5px] font-medium mt-0.5">
                                                    {getTooltipMessage()}
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <NotificationIcon type={t.type as any} title={t.title || ''} />
                                            <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
                                                <h4 className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                                                    {t.title}
                                                </h4>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug line-clamp-1">
                                                    {t.message}
                                                </p>
                                            </div>
                                            <div className="flex-shrink-0 w-2 h-2 rounded-full" style={{ backgroundColor: t.type === 'warning' ? '#f59e0b' : '#3b82f6' }} />
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
};
