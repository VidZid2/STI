import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getStreakData } from '../../../services/studyTimeService';
import { TextAnimate } from '../../../components/ui/text-animate';

interface DailyInspirationToastProps {
    quote: { text: string; author: string } | null;
}

export const DailyInspirationToast: React.FC<DailyInspirationToastProps> = ({ quote }) => {
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : true);
    
    // Manage multiple toasts
    const [toasts, setToasts] = useState<Array<{ id: string, type: 'quote' | 'streak' }>>([]);
    const exitDirsRef = useRef<Record<string, string>>({});

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        // Build the initial stack
        const initialToasts: Array<{ id: string, type: 'quote' | 'streak' }> = [];
        
        // Add streak (goes in back)
        const streakData = getStreakData();
        if (streakData && streakData.currentStreak > 0) {
            initialToasts.push({ id: 'streak', type: 'streak' });
        }
        
        // Add quote (goes in front) only once a day
        if (quote) {
            const todayStr = new Date().toDateString();
            const lastSeenQuote = localStorage.getItem('lastSeenDailyQuote');
            if (lastSeenQuote !== todayStr) {
                initialToasts.push({ id: 'quote', type: 'quote' });
                localStorage.setItem('lastSeenDailyQuote', todayStr);
            }
        }
        
        if (initialToasts.length > 0) {
            const timer = setTimeout(() => {
                setToasts(initialToasts);
                
                // Auto dismiss the front toast (quote) after 10 seconds
                setTimeout(() => {
                    dismissToast('quote', 'default');
                    // Then auto dismiss streak 5s later
                    setTimeout(() => dismissToast('streak', 'default'), 5000);
                }, 10000);
            }, 1500);

            return () => clearTimeout(timer);
        }
    }, [quote]);

    const dismissToast = (id: string, direction: string) => {
        exitDirsRef.current[id] = direction;
        setToasts(prev => prev.filter(t => t.id !== id));
    };

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
        initial: ({ isMobile }: { isMobile: boolean }) => isMobile 
            ? { opacity: 0, y: 50, scale: 0.7 }
            : { opacity: 1, y: "150%", scale: 1 },
        animate: ({ isMobile, offset }: { isMobile: boolean, offset: number }) => {
            const yOffset = isMobile ? offset * 12 : -offset * 12;
            const scale = 1 - (offset * 0.05);
            return { 
                opacity: 1, 
                y: yOffset, 
                scale: scale,
                transition: { type: 'tween', ease: [0.16, 1, 0.3, 1], duration: 0.8 }
            };
        },
        exit: ({ isMobile, id }: { isMobile: boolean, id: string }) => {
            const direction = exitDirsRef.current[id] || 'left';
            if (!isMobile) {
                return { 
                    opacity: 1, 
                    y: "150%", 
                    transition: { type: 'tween', ease: [0.16, 1, 0.3, 1], duration: 0.8 } 
                };
            }
            const transition = { type: 'tween', ease: [0.16, 1, 0.3, 1], duration: 0.8 };
            switch (direction) {
                case 'left': return { x: '-100vw', transition };
                case 'right': return { x: '100vw', transition };
                case 'up': return { y: '-100vh', transition };
                case 'down': return { y: '100vh', transition };
                default: return { x: '100vw', transition };
            }
        }
    };

    const streakData = getStreakData();
    const getTooltipMessage = () => {
        if (!streakData) return '';
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
                                    className={`relative flex items-center gap-3 overflow-hidden rounded-xl shadow-sm p-3.5 
                                        ${isFront && !isMobile ? 'pr-4' : ''} 
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
                                                <h4 className="text-[9px] font-bold uppercase tracking-wider text-yellow-400 mb-0.5">
                                                    Daily Inspiration
                                                </h4>
                                                <p className="text-white text-xs sm:text-sm font-normal leading-snug">
                                                    "<TextAnimate animation="blurInUp" by="character" once as="span" className="inline">{quote?.text || ""}</TextAnimate>" <span className="text-blue-200 text-[10px] sm:text-xs font-medium whitespace-nowrap ml-1">— {quote?.author}</span>
                                                </p>
                                            </div>
                                        </>
                                    ) : (
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
