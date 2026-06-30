import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { getXPProgress } from '../../services/studyTimeService';
// @ts-ignore
import { AnimatedCircularProgressBar } from '../../components/ui/animated-circular-progress-bar';
import { BottomSheet } from '../../components/ui/bottom-sheet';
import { 
    GraduationCap, 
    TrendingUp, 
    BookOpen, 
    Award, 
    Sparkles, 
    Zap, 
    Trophy, 
    Crown, 
    Compass, 
    Brain, 
    Bookmark, 
    Shield, 
    Target, 
    Medal, 
// @ts-ignore
    Star, 
    Gem,
    User,
    Users,
    Layers,
    MessageSquare,
    Clock,
    Flame,
// @ts-ignore
    Download,
// @ts-ignore
    Link,
// @ts-ignore
    ShoppingBag,
    Image,
    Bell,
// @ts-ignore
    FolderPlus,
    Calendar,
// @ts-ignore
    Ticket,
// @ts-ignore
    Heart,
    Lock
} from 'lucide-react';

interface LevelJourneyModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentLevel: number;
}

const cn = (...classes: (string | undefined | null | boolean)[]) => classes.filter(Boolean).join(' ');

// Detailed level tiers with formatted and highlighted ReactNode descriptions for rewards
const levelTiers = [
    {
        name: 'Scholar Initiation',
        levelRange: 'Level 1',
        description: 'Welcome to STI eLMS! Start your learning journey by tracking course progress and organizing your tasks.',
        icon: GraduationCap,
        rewards: [

            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-bold">To-Do List Widget:</strong> Manage study tasks and set school goals directly on the sidebar.
                    </span>
                ), 
                icon: Bookmark,
                type: 'feature' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-bold">Course Progress Tracker:</strong> Monitor module completion percentages for all active subjects.
                    </span>
                ), 
                icon: BookOpen,
                type: 'feature' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-bold">Default Profile Avatars:</strong> Access a set of starter avatars to customize your student identity.
                    </span>
                ), 
                icon: User,
                type: 'cosmetic' as const
            }
        ],
        gradient: 'from-zinc-500 to-zinc-650 dark:from-zinc-600 dark:to-zinc-800'
    },
    {
        name: 'Curious Explorer',
        levelRange: 'Level 2',
        description: 'Building momentum! Unlock calendar scheduling and announcements.',
        icon: Sparkles,
        rewards: [
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-bold">Productivity Tools:</strong> Unlocks essential tools like the <strong className="text-blue-600 dark:text-blue-400 font-bold">Grammar Checker</strong>, <strong className="text-blue-600 dark:text-blue-400 font-bold">Text Summarizer</strong>, and <strong className="text-blue-600 dark:text-blue-400 font-bold">Word Counter</strong> to assist your studies.
                    </span>
                ), 
                icon: Sparkles,
                type: 'feature' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-bold">Calendar Widget:</strong> View upcoming class events, deadlines, and schedule entries.
                    </span>
                ), 
                icon: Calendar,
                type: 'feature' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-bold">Class Announcements:</strong> Access critical bulletins posted by course instructors.
                    </span>
                ), 
                icon: Bell,
                type: 'social' as const
            }
        ],
        gradient: 'from-zinc-550 to-zinc-700 dark:from-zinc-650 dark:to-zinc-850'
    },
    {
        name: 'Focus Apprentice',
        levelRange: 'Level 3',
        description: 'Mastering focus and concentration. Unlock the Pomodoro Study Timer.',
        icon: BookOpen,
        rewards: [
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-bold">Focus Mode Timer:</strong> Use the full-screen Pomodoro tool to structure study intervals.
                    </span>
                ), 
                icon: Clock,
                type: 'feature' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-bold">Ambient Alarms:</strong> Custom notification sounds and focus soundscapes.
                    </span>
                ), 
                icon: Sparkles,
                type: 'cosmetic' as const
            }
        ],
        gradient: 'from-teal-500 to-emerald-600 dark:from-teal-600 dark:to-emerald-800'
    },
    {
        name: 'Consistent Learner',
        levelRange: 'Level 4',
        description: 'Consistency is key. Unlock activity tracking and grade predictions.',
        icon: Compass,
        rewards: [
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-bold">Activity Tracker Widget:</strong> Log your daily study durations and review historic study trends.
                    </span>
                ), 
                icon: TrendingUp,
                type: 'feature' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-bold">Grade Predictor Widget:</strong> Project your semester GPA using tentative grade inputs.
                    </span>
                ), 
                icon: Target,
                type: 'feature' as const
            }
        ],
        gradient: 'from-emerald-500 to-cyan-600 dark:from-emerald-650 dark:to-cyan-800'
    },
    {
        name: 'Collaborative Student',
        levelRange: 'Level 5',
        description: 'Learning is better together. Unlock peer study groups.',
        icon: TrendingUp,
        rewards: [
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-bold">Study Groups Lobby:</strong> Join virtual group rooms, coordinate study meets, and view member progress.
                    </span>
                ), 
                icon: Users,
                type: 'social' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-bold">Peer Chat Room:</strong> Talk with classmates and study partners in dedicated group chats.
                    </span>
                ), 
                icon: MessageSquare,
                type: 'social' as const
            }
        ],
        gradient: 'from-cyan-500 to-blue-600 dark:from-cyan-650 dark:to-blue-800'
    },
    {
        name: 'Knowledge Seeker',
        levelRange: 'Level 6',
        description: 'Diving deeper into study content. Continue building your daily streak.',
        icon: BookOpen,
        rewards: [
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-bold">Daily Streak Bonus (+1.10x XP):</strong> Increases active study session XP rewards by 10%.
                    </span>
                ), 
                icon: Flame,
                type: 'boost' as const
            }
        ],
        gradient: 'from-cyan-555 to-blue-655 dark:from-cyan-700 dark:to-blue-850'
    },
    {
        name: 'Dedicated Scholar',
        levelRange: 'Level 7',
        description: 'Consistent academic progress. Unlock study metrics and reports.',
        icon: Award,
        rewards: [
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-bold">Study Insights Widget:</strong> Review detailed analytics and charts of your study distribution.
                    </span>
                ), 
                icon: Brain,
                type: 'feature' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-bold">Daily Motivation Cards:</strong> Inspirational quote cards right on your overview tab.
                    </span>
                ), 
                icon: Image,
                type: 'cosmetic' as const
            }
        ],
        gradient: 'from-blue-500 to-indigo-650 dark:from-blue-600 dark:to-indigo-850'
    },
    {
        name: 'Persistent Builder',
        levelRange: 'Level 8',
        description: 'Approaching intermediate ranks. Prepare yourself for advanced interface tools.',
        icon: BookOpen,
        rewards: [
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-bold">Weather Forecast Widget:</strong> Stay updated on local campus weather during study sessions.
                    </span>
                ), 
                icon: Sparkles,
                type: 'feature' as const
            }
        ],
        gradient: 'from-indigo-500 to-purple-650 dark:from-indigo-600 dark:to-purple-850'
    },
    {
        name: 'Strategic Mind',
        levelRange: 'Level 9',
        description: 'Refining study methods and routines. Higher experience bonus.',
        icon: Brain,
        rewards: [
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-bold">Study Streak multiplier (+1.15x XP):</strong> Permanent upgrade to your streak XP multiplier.
                    </span>
                ), 
                icon: Flame,
                type: 'boost' as const
            }
        ],
        gradient: 'from-indigo-555 to-purple-700 dark:from-indigo-700 dark:to-purple-900'
    },
    {
        name: 'Advanced Pathfinder',
        levelRange: 'Level 10',
        description: 'Halfway to the peak! Unlocks dashboard customizations.',
        icon: Bookmark,
        rewards: [
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-105 font-bold">Dashboard Layout Editor:</strong> Rearrange, hide, or resize sidebar widgets to fit your needs.
                    </span>
                ), 
                icon: Layers,
                type: 'feature' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-105 font-bold">Silver Level Ring:</strong> Unlocks the metallic silver progress ring around your profile avatar.
                    </span>
                ), 
                icon: Gem,
                type: 'cosmetic' as const
            }
        ],
        gradient: 'from-purple-500 to-fuchsia-600 dark:from-purple-600 dark:to-fuchsia-800'
    },
    {
        name: 'Future Leader',
        levelRange: 'Level 11',
        description: 'Continuing your ascent. Earn more experience through study streaks.',
        icon: TrendingUp,
        rewards: [
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-bold">Study Streak multiplier (+1.20x XP):</strong> Permanent upgrade to your streak XP multiplier.
                    </span>
                ), 
                icon: Flame,
                type: 'boost' as const
            }
        ],
        gradient: 'from-fuchsia-500 to-pink-655 dark:from-fuchsia-600 dark:to-pink-850'
    },
    {
        name: 'Honor Candidate',
        levelRange: 'Level 12',
        description: 'Approaching elite eLMS status. Unlocks advanced study timer styles.',
        icon: Trophy,
        rewards: [
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-105 font-bold">Group Focus sessions:</strong> Join shared focus rooms with a synchronized study clock.
                    </span>
                ), 
                icon: Users,
                type: 'social' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-105 font-bold">Compact Mode View:</strong> A tighter, dense dashboard layout option in your settings.
                    </span>
                ), 
                icon: Layers,
                type: 'feature' as const
            }
        ],
        gradient: 'from-fuchsia-555 to-pink-700 dark:from-fuchsia-650 dark:to-pink-900'
    },
    {
        name: 'Persistent Achiever',
        levelRange: 'Level 13',
        description: 'Your efforts are making waves. Keep pushing toward the summit.',
        icon: Target,
        rewards: [
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-bold">Premium Soundscapes:</strong> Unlocks exclusive white noise tracks (Rain, Forest, Cafe).
                    </span>
                ), 
                icon: Sparkles,
                type: 'cosmetic' as const
            }
        ],
        gradient: 'from-pink-500 to-rose-600 dark:from-pink-600 dark:to-rose-800'
    },
    {
        name: 'Distinguished Scholar',
        levelRange: 'Level 14',
        description: 'Major academic milestone. Unlock animated avatar cards.',
        icon: Zap,
        rewards: [
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-105 font-bold">Animated Profile Border:</strong> A glowing neon animated border for your profile display card.
                    </span>
                ), 
                icon: Zap,
                type: 'cosmetic' as const
            }
        ],
        gradient: 'from-pink-550 to-rose-655 dark:from-pink-655 dark:to-rose-850'
    },
    {
        name: 'Apex Pathfinder',
        levelRange: 'Level 15',
        description: 'Getting closer to the top. Unlock custom accent colors.',
        icon: Brain,
        rewards: [
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-105 font-bold">Gold Level Ring:</strong> Unlocks the metallic gold progress ring around your avatar.
                    </span>
                ), 
                icon: Gem,
                type: 'cosmetic' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-105 font-bold">Theme Accent Selection:</strong> Customize the dashboard primary color in display settings.
                    </span>
                ), 
                icon: Image,
                type: 'feature' as const
            }
        ],
        gradient: 'from-sky-500 to-indigo-650 dark:from-sky-600 dark:to-indigo-850'
    },
    {
        name: 'Master Student',
        levelRange: 'Level 16',
        description: 'Showing stellar leadership. Unlock peer tutor tags.',
        icon: Shield,
        rewards: [
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-105 font-bold">Peer tutor badge:</strong> Mark yourself as available to help other students on the peer list.
                    </span>
                ), 
                icon: User,
                type: 'social' as const
            }
        ],
        gradient: 'from-sky-555 to-indigo-700 dark:from-sky-655 dark:to-indigo-900'
    },
    {
        name: 'Strategic Thinker',
        levelRange: 'Level 17',
        description: 'Deep conceptual understanding. Unlock group creation.',
        icon: Compass,
        rewards: [
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-105 font-bold">Create Custom Groups:</strong> Invite peers by sharing dynamic join codes.
                    </span>
                ), 
                icon: Users,
                type: 'social' as const
            }
        ],
        gradient: 'from-green-500 to-teal-600 dark:from-green-600 dark:to-teal-800'
    },
    {
        name: 'Elite Scholar',
        levelRange: 'Level 18',
        description: 'Just a couple steps from the summit. Peak efficiency.',
        icon: Target,
        rewards: [
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-100 font-bold">Study Streak multiplier (+1.25x XP):</strong> Permanent upgrade to your streak XP multiplier.
                    </span>
                ), 
                icon: Flame,
                type: 'boost' as const
            }
        ],
        gradient: 'from-green-555 to-teal-655 dark:from-green-655 dark:to-teal-850'
    },
    {
        name: 'Grandmaster Learner',
        levelRange: 'Level 19',
        description: 'On the threshold of absolute mastery. Prepare yourself for the legendary status.',
        icon: Medal,
        rewards: [
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-105 font-bold">Premium Theme Pack:</strong> Unlock dark mode theme variations (Slate, Charcoal, Deep Ocean).
                    </span>
                ), 
                icon: Image,
                type: 'cosmetic' as const
            }
        ],
        gradient: 'from-amber-500 to-orange-600 dark:from-amber-600 dark:to-orange-800'
    },
    {
        name: 'Apex Legend',
        levelRange: 'Level 20',
        description: 'The highest educational achievement on the STI eLMS platform. The peak of scholastic excellence.',
        icon: Crown,
        rewards: [
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-105 font-bold">Legendary Crown Icon:</strong> The ultimate golden crown badge next to your profile.
                    </span>
                ), 
                icon: Crown,
                type: 'cosmetic' as const
            },
            { 
                text: (
                    <span>
                        <strong className="text-zinc-900 dark:text-zinc-105 font-bold">Peer Mentor Badge:</strong> Marks you as a mentor in study groups so peers can seek guidance.
                    </span>
                ), 
                icon: Shield,
                type: 'social' as const
            }
        ],
        gradient: 'from-rose-500 to-pink-700 dark:from-rose-600 dark:to-pink-900'
    }
];

const LevelJourneyModal: React.FC<LevelJourneyModalProps> = ({ isOpen, onClose, currentLevel }) => {
    const [mounted, setMounted] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [selectedTierIndex, setSelectedTierIndex] = useState<number>(0);
    const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [xpProgress, setXpProgress] = useState(() => getXPProgress());

    useEffect(() => {
        setMounted(true);
        if (typeof document !== 'undefined' && document.body) {
            setIsDarkMode(document.body.classList.contains('dark-mode'));
        }
    }, []);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (typeof document === 'undefined' || !document.body) return;
        const checkDarkMode = () => setIsDarkMode(document.body.classList.contains('dark-mode'));
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, [mounted]);

    useEffect(() => {
        const checkXP = () => setXpProgress(getXPProgress());
        checkXP();
        const interval = setInterval(checkXP, 5000);
        return () => clearInterval(interval);
    }, []);

    const checkIfReached = (tier: typeof levelTiers[0], level: number) => {
        if (tier.levelRange.startsWith('Level ')) {
            const levelVal = parseInt(tier.levelRange.replace('Level ', ''));
            return level >= levelVal;
        } else {
            const minLevel = parseInt(tier.levelRange.match(/\d+/)?.[0] || '0');
            return level >= minLevel;
        }
    };

    // Auto-select current level tier on mount or level change
    useEffect(() => {
        const idx = levelTiers.findIndex((tier, i) => {
            const isReached = checkIfReached(tier, currentLevel);
            const isNextReached = i < levelTiers.length - 1 ? checkIfReached(levelTiers[i + 1], currentLevel) : false;
            return isReached && !isNextReached;
        });
        if (idx !== -1) {
            setSelectedTierIndex(idx);
        }
    }, [currentLevel]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Path geometry constants
    const rowHeight = 130;
    const startY = 75;
    const amplitude = 75; // how far left/right from center the path swings
    const centerX = 150;

    // Generate node positions along a smooth sine wave
    const getCoords = (index: number) => {
        const y = startY + index * rowHeight;
        // Sine wave: nodes snake left-right-left smoothly
        const x = centerX + Math.sin((index / 2.5) * Math.PI) * amplitude;
        return { x, y };
    };

    const pathHeight = startY + (levelTiers.length - 1) * rowHeight + 90;

    // Build smooth S-curve path using cubic beziers
    const buildPath = (count: number) => {
        return levelTiers.slice(0, count).map((_, i) => {
            const { x, y } = getCoords(i);
            if (i === 0) return `M ${x} ${y}`;
            const prev = getCoords(i - 1);
            // Control points extend horizontally from each node to create rounded arcs
            const tension = rowHeight * 0.7;
            return `C ${prev.x} ${prev.y + tension}, ${x} ${y - tension}, ${x} ${y}`;
        }).join(' ');
    };

    const pathD = buildPath(levelTiers.length);

    let reachedCount = 0;
    levelTiers.forEach((tier) => {
        if (checkIfReached(tier, currentLevel)) reachedCount++;
    });

    const progressPathD = buildPath(reachedCount);

// @ts-ignore
    const renderCardMedia = (title: string, subtitle: string, Icon: React.ComponentType<{ className?: string }>, gradient: string) => {
        return (
            <div className={`w-full h-44 md:h-48 bg-gradient-to-br ${gradient} flex flex-col items-center justify-center relative overflow-hidden shadow-inner`}>
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-black/20 rounded-full blur-2xl pointer-events-none" />
                
                <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg relative z-10">
                    <Icon className="w-8 h-8 text-white drop-shadow-md" />
                </div>
                <span className="text-white/80 text-[9px] font-bold uppercase tracking-widest mt-3 relative z-10 leading-none">{subtitle}</span>
                <span className="text-white text-base font-bold tracking-tight mt-1 relative z-10 leading-none">{title}</span>
            </div>
        );
    };

    const renderTierDetails = (idx: number) => {
        const tier = levelTiers[idx];
        if (!tier) return null;
        
        const isReached = checkIfReached(tier, currentLevel);
        const isNextReached = idx < levelTiers.length - 1 ? checkIfReached(levelTiers[idx + 1], currentLevel) : false;
        const isCurrent = isReached && !isNextReached;
        
        let statusBadge = null;
        if (isCurrent) {
            statusBadge = (
                <span className="px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-md">
                    In Progress
                </span>
            );
        } else if (isReached) {
            statusBadge = (
                <span className="px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-md">
                    Completed
                </span>
            );
        } else {
            statusBadge = (
                <span className="px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 rounded-md flex items-center gap-1 border border-zinc-200/50 dark:border-zinc-700">
                    <Lock className="w-2.5 h-2.5" /> Locked
                </span>
            );
        }

        const containerVariants = {
            hidden: { opacity: 0 },
            show: {
                opacity: 1,
                transition: { staggerChildren: 0.1 }
            },
            exit: { opacity: 0, transition: { duration: 0.15 } }
        };

        const itemVariants = {
            hidden: { opacity: 0, y: 15 },
            show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
        };

        return (
            <AnimatePresence mode="wait">
                <motion.div 
                    key={tier.levelRange}
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    className="flex flex-col gap-5 w-full text-left"
                >
                    {/* Tier Overview Card Container */}
                    <motion.div variants={itemVariants} className="p-5 rounded-[20px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col gap-4">
                        {/* Tier Title Header */}
                        <div className="flex items-center justify-between gap-4">
                            <h3 className="text-[22px] leading-tight font-bold text-slate-900 dark:text-slate-100 tracking-tight">{tier.name}</h3>
                            <span className="px-2.5 py-1 text-[11px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 rounded-lg shrink-0">
                                {tier.levelRange}
                            </span>
                        </div>

                        {/* Separator between Header and Status */}
                        <hr className="border-t border-slate-200/80 dark:border-slate-700/50" />

                        {/* Status Section */}
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Tier Status</span>
                            {statusBadge}
                        </div>

                        {/* Separator between Status and Description */}
                        <hr className="border-t border-slate-200/80 dark:border-slate-700/50" />

                        {/* Description Section */}
                        <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-400 font-medium">
                            {tier.description}
                        </p>
                    </motion.div>

                    {/* Rewards list */}
                    <motion.div variants={itemVariants} className="flex flex-col gap-3.5 mt-2">
                        <div className="flex flex-col items-center gap-2 mb-1">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 flex items-center justify-center shadow-[0_1.5px_4px_rgba(59,130,246,0.08)] shrink-0">
                                <Award className="w-4.5 h-4.5" />
                            </div>
                            <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Unlocked Rewards</h4>
                        </div>
                        <div className="flex flex-col gap-2.5">
                            {tier.rewards.map((reward, rIdx) => {
                                const RewardIcon = reward.icon;
                                return (
                                    <motion.div 
                                        variants={itemVariants}
                                        key={rIdx} 
                                        className={`relative flex items-center gap-3.5 p-4 rounded-[16px] bg-white dark:bg-slate-800 border transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-default w-full ${
                                            isReached 
                                                ? "border-blue-500 dark:border-blue-400 shadow-[0_2px_12px_rgba(59,130,246,0.06)]" 
                                                : "border-slate-200 dark:border-slate-700/50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]"
                                        }`}
                                    >
                                        {/* Unlocked / Locked Badge in Top Right */}
                                        {isReached ? (
                                            <span className="absolute top-2.5 right-2.5 px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 rounded-md border border-blue-100 dark:border-blue-900/30">
                                                Unlocked!
                                            </span>
                                        ) : (
                                            <span className="absolute top-2.5 right-2.5 px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 dark:bg-slate-800/80 dark:text-slate-450 rounded-md flex items-center gap-1 border border-slate-200/50 dark:border-slate-700/30">
                                                <Lock className="w-2.5 h-2.5" /> Locked
                                            </span>
                                        )}

                                        <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 shadow-sm border ${
                                            isReached 
                                                ? "bg-blue-50 text-blue-600 border-blue-100/80 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30" 
                                                : "bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-800/40 dark:text-slate-500 dark:border-slate-700"
                                        }`}>
                                            <RewardIcon className="w-4.5 h-4.5" />
                                        </div>
                                        
                                        <div className="flex-grow min-w-0 pr-16">
                                            <p className="text-[12.5px] text-slate-700 dark:text-slate-350 leading-snug font-semibold">
                                                {reward.text}
                                            </p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        );
    };

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div key="journey-page-modal" style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 99998,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px',
                }}
                data-level-journey-modal="true"
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: isDarkMode ? 'rgba(15, 23, 42, 0.45)' : 'rgba(15, 23, 42, 0.35)',
                            backdropFilter: 'blur(16px)',
                        }}
                    />

                    {/* Modal Content */}
                    <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.96, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 20 }}
                        transition={{ 
                            type: 'spring', 
                            damping: 30, 
                            stiffness: 300
                        }}
                        className="relative w-full max-w-[680px] md:max-w-[760px] h-[85vh] max-h-[780px] bg-zinc-50 dark:bg-zinc-900 rounded-[28px] shadow-3xl flex flex-col overflow-hidden border border-zinc-200/50 dark:border-zinc-800/60"
                    >
                        {/* Header */}
                        <div className="relative p-4 border-b border-zinc-250/20 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 shrink-0 z-10 flex items-center justify-between">
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 flex items-center justify-center shadow-sm text-blue-600 dark:text-blue-400">
                                    <Trophy size={20} />
                                </div>
                                <div className="text-left">
                                    <h2 className="font-bold text-zinc-900 dark:text-zinc-100 tracking-tight text-[17px] leading-tight">
                                        Level Journey
                                    </h2>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-450 leading-none mt-0.5">
                                        Discover rewards up to max level 100
                                    </p>
                                </div>
                            </div>
                            
                            <motion.button
                                onClick={onClose}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex-shrink-0 flex items-center justify-center rounded-xl border border-zinc-200 bg-white p-2 text-zinc-550 shadow-sm transition-colors hover:bg-zinc-55 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-750"
                                aria-label="Close modal"
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </motion.button>
                        </div>

                        {/* Split Content Area */}
                        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 bg-zinc-50 dark:bg-zinc-900">
                            {/* Left Side: Path Winding (Scrollable) */}
                            <div className="w-full md:w-[48%] h-full overflow-y-auto p-4 sm:p-5 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent flex flex-col items-center border-r border-zinc-200/40 dark:border-zinc-800/50">
                                {/* Current Status Box (SaaS Style) */}
                                <div className="w-full mb-5 relative overflow-hidden bg-white dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/80 shadow-sm rounded-2xl p-4 flex flex-col gap-3 shrink-0">
                                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 bg-blue-550/10 dark:bg-blue-500/5 rounded-full blur-2xl pointer-events-none" aria-hidden="true" />
                                    <div className="flex items-center gap-3.5 relative z-10">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 flex items-center justify-center flex-shrink-0 shadow-sm">
                                            <Trophy className="w-5 h-5 text-blue-600 dark:text-blue-400" strokeWidth={2} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none mb-1">Your Status</p>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-none">Level {currentLevel}</span>
                                                <span className="text-[10.5px] font-medium text-zinc-550 dark:text-zinc-400">/ Max 20</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Duolingo-style Path Container */}
                                <div className="relative w-[300px] select-none shrink-0" style={{ height: `${pathHeight}px` }}>
                                    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ height: `${pathHeight}px` }}>
                                        {/* Background Path (Dashed) */}
                                        <path
                                            d={pathD}
                                            fill="none"
                                            stroke={isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}
                                            strokeWidth="8"
                                            strokeLinecap="round"
                                            strokeDasharray="12 8"
                                        />
                                        {/* Active Progress Path */}
                                        {progressPathD && (
                                            <path
                                                d={progressPathD}
                                                fill="none"
                                                stroke="#3b82f6"
                                                strokeWidth="8"
                                                strokeLinecap="round"
                                            />
                                        )}
                                    </svg>

                                    {/* Level Nodes */}
                                    {levelTiers.map((tier, idx) => {
                                        const { x, y } = getCoords(idx);
                                        const isReached = checkIfReached(tier, currentLevel);
                                        const isNextReached = idx < levelTiers.length - 1 ? checkIfReached(levelTiers[idx + 1], currentLevel) : false;
                                        const isCurrent = isReached && !isNextReached;
                                        const isLocked = !isReached;
// @ts-ignore
                                        const isSelected = idx === selectedTierIndex;
                                        const Icon = tier.icon;
                                        
                                        return (
                                            <div
                                                key={idx}
                                                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                                                style={{ left: `${x}px`, top: `${y}px` }}
                                            >
                                                <div className="relative flex items-center justify-center">
                                                    {/* 3D Isometric Progress Donut */}
                                                    {isCurrent && tier.levelRange !== 'Level 20' && (
                                                        <div className="absolute w-[108px] h-[108px] scale-y-[0.82] z-0 pointer-events-none">
                                                            {/* Grey 3D Track (Base + Lip) */}
                                                            <svg className="absolute inset-0 w-full h-full overflow-visible drop-shadow-[0_10px_0_#d4d4d8] dark:drop-shadow-[0_10px_0_#18181b]" viewBox="0 0 100 100">
                                                                <circle cx="50" cy="50" r="45" fill="none" className="stroke-zinc-200 dark:stroke-zinc-800" strokeWidth="10" />
                                                            </svg>

                                                            {/* Blue Progress (Painted on Top Face) */}
                                                            <svg className="absolute inset-0 w-full h-full overflow-visible -rotate-90" viewBox="0 0 100 100">
                                                                <motion.circle 
                                                                    cx="50" cy="50" r="45" fill="none" 
                                                                    stroke="rgb(59, 130, 246)" strokeWidth="10" 
                                                                    strokeLinecap="round"
                                                                    strokeDasharray={2 * Math.PI * 45}
                                                                    initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                                                                    animate={{ strokeDashoffset: 2 * Math.PI * 45 * (1 - xpProgress / 100) }}
                                                                    transition={{ duration: 1.2, ease: "easeOut" }}
                                                                />
                                                            </svg>
                                                        </div>
                                                    )}

                                                    {/* 3D Circular Button */}
                                                    <button
                                                        onClick={() => {
                                                            setSelectedTierIndex(idx);
                                                            if (isMobile) setIsDrawerOpen(true);
                                                        }}
                                                        className={cn(
                                                            "relative z-10 w-[68px] h-[68px] rounded-full flex items-center justify-center transition-all duration-150 outline-none active:translate-y-[6px] cursor-pointer overflow-hidden",
                                                            isLocked
                                                                ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-650 shadow-[0_6px_0_0_#d4d4d8,inset_0_2px_0_0_rgba(255,255,255,0.5)] dark:shadow-[0_6px_0_0_#18181b,inset_0_2px_0_0_rgba(255,255,255,0.05)] active:shadow-[0_0px_0_0_#d4d4d8,inset_0_2px_0_0_rgba(255,255,255,0.5)] dark:active:shadow-[0_0px_0_0_#18181b,inset_0_2px_0_0_rgba(255,255,255,0.05)] hover:bg-zinc-250 dark:hover:bg-zinc-750"
                                                                : isCurrent
                                                                    ? "bg-[#fbbf24] bg-[linear-gradient(140deg,rgba(255,255,255,0.4)_0%,rgba(255,255,255,0.15)_35%,transparent_50%,rgba(0,0,0,0.06)_80%,rgba(0,0,0,0.1)_100%)] text-blue-600 shadow-[0_6px_0_0_#d97706,inset_0_-2px_0_0_rgba(0,0,0,0.12),inset_0_2px_0_0_rgba(255,255,255,0.45)] active:shadow-[0_0px_0_0_#d97706,inset_0_-2px_0_0_rgba(0,0,0,0.12),inset_0_2px_0_0_rgba(255,255,255,0.45)] hover:bg-[#f5b020]"
                                                                    : "bg-[#facc15] bg-[linear-gradient(140deg,rgba(255,255,255,0.4)_0%,rgba(255,255,255,0.15)_35%,transparent_50%,rgba(0,0,0,0.06)_80%,rgba(0,0,0,0.1)_100%)] text-blue-600 shadow-[0_6px_0_0_#ca8a04,inset_0_-2px_0_0_rgba(0,0,0,0.12),inset_0_2px_0_0_rgba(255,255,255,0.45)] active:shadow-[0_0px_0_0_#ca8a04,inset_0_-2px_0_0_rgba(0,0,0,0.12),inset_0_2px_0_0_rgba(255,255,255,0.45)] hover:bg-[#efc00e]"
                                                        )}
                                                        style={{
                                                            transition: 'transform 0.1s, box-shadow 0.1s',
                                                        }}
                                                    >
                                                        <div className="relative z-10 flex items-center justify-center">
                                                            {isLocked ? (
                                                                <Lock className="w-5 h-5" />
                                                            ) : tier.levelRange === 'Level 20' ? (
                                                                <svg width="42" height="42" viewBox="0 0 42 42" fill="none" className="drop-shadow-md">
                                                                    <mask id="path-1-outside-1" maskUnits="userSpaceOnUse" x="-0.0861816" y="2.30005" width="42" height="35" fill="black">
                                                                        <rect fill="white" x="-0.0861816" y="2.30005" width="42" height="35"/>
                                                                        <path fillRule="evenodd" clipRule="evenodd" d="M21 9.70702C19.48 9.70702 18.2477 8.49663 18.2477 7.00354C18.2477 5.51044 19.48 4.30005 21 4.30005C22.5201 4.30005 23.7523 5.51044 23.7523 7.00354C23.7523 8.49663 22.5201 9.70702 21 9.70702ZM38.9641 21.2716C39.5316 19.5255 37.9858 17.9979 36.3942 18.2662C37.0683 14.4344 34.1224 10.7884 30.0969 10.7884H11.9031C7.87998 10.7884 4.93511 14.4301 5.60466 18.2596C4.01254 17.9903 2.46611 19.5185 3.03367 21.2647L7.01859 33.5253C7.36256 34.5836 8.34881 35.3001 9.46161 35.3001H32.5384C33.6512 35.3001 34.6375 34.5836 34.9814 33.5253L38.9641 21.2716Z"/>
                                                                    </mask>
                                                                    <path fillRule="evenodd" clipRule="evenodd" d="M21 9.70702C19.48 9.70702 18.2477 8.49663 18.2477 7.00354C18.2477 5.51044 19.48 4.30005 21 4.30005C22.5201 4.30005 23.7523 5.51044 23.7523 7.00354C23.7523 8.49663 22.5201 9.70702 21 9.70702ZM38.9641 21.2716C39.5316 19.5255 37.9858 17.9979 36.3942 18.2662C37.0683 14.4344 34.1224 10.7884 30.0969 10.7884H11.9031C7.87998 10.7884 4.93511 14.4301 5.60466 18.2596C4.01254 17.9903 2.46611 19.5185 3.03367 21.2647L7.01859 33.5253C7.36256 34.5836 8.34881 35.3001 9.46161 35.3001H32.5384C33.6512 35.3001 34.6375 34.5836 34.9814 33.5253L38.9641 21.2716Z" fill="#FEF08A"/>
                                                                    <path d="M36.3942 18.2662L34.4244 17.9197L33.9337 20.7093L36.7267 20.2384L36.3942 18.2662ZM38.9641 21.2716L37.0621 20.6534L37.0621 20.6534L38.9641 21.2716ZM5.60466 18.2596L5.27113 20.2316L8.06233 20.7037L7.57478 17.9151L5.60466 18.2596ZM3.03367 21.2647L1.13162 21.8829H1.13162L3.03367 21.2647ZM7.01859 33.5253L8.92065 32.9071L7.01859 33.5253ZM34.9814 33.5253L36.8835 34.1435L34.9814 33.5253ZM16.2477 7.00354C16.2477 9.63478 18.4093 11.707 21 11.707V7.70702C20.5507 7.70702 20.2477 7.35848 20.2477 7.00354H16.2477ZM21 2.30005C18.4093 2.30005 16.2477 4.37229 16.2477 7.00354H20.2477C20.2477 6.6486 20.5507 6.30005 21 6.30005V2.30005ZM25.7523 7.00354C25.7523 4.37229 23.5908 2.30005 21 2.30005V6.30005C21.4494 6.30005 21.7523 6.6486 21.7523 7.00354H25.7523ZM21 11.707C23.5908 11.707 25.7523 9.63478 25.7523 7.00354H21.7523C21.7523 7.35848 21.4494 7.70702 21 7.70702V11.707ZM36.7267 20.2384C36.7914 20.2275 36.9097 20.2496 37.0081 20.3579C37.0501 20.4042 37.0703 20.4487 37.0784 20.4833C37.0848 20.5107 37.0917 20.5622 37.0621 20.6534L40.8662 21.8898C41.9381 18.5918 39.0047 15.7978 36.0617 16.2941L36.7267 20.2384ZM30.0969 12.7884C32.8585 12.7884 34.8868 15.2917 34.4244 17.9197L38.364 18.6128C39.2499 13.577 35.3862 8.78844 30.0969 8.78844V12.7884ZM11.9031 12.7884H30.0969V8.78844H11.9031V12.7884ZM7.57478 17.9151C7.11559 15.2888 9.14314 12.7884 11.9031 12.7884V8.78844C6.61682 8.78844 2.75464 13.5715 3.63455 18.6041L7.57478 17.9151ZM4.93573 20.6465C4.90613 20.5554 4.91299 20.5039 4.91941 20.4765C4.92752 20.4418 4.94774 20.3973 4.98978 20.351C5.08816 20.2427 5.20647 20.2207 5.27113 20.2316L5.93819 16.2876C2.9939 15.7896 0.0596135 18.5847 1.13162 21.8829L4.93573 20.6465ZM8.92065 32.9071L4.93573 20.6465L1.13162 21.8829L5.11653 34.1435L8.92065 32.9071ZM9.46161 33.3001C9.2152 33.3001 8.99681 33.1414 8.92065 32.9071L5.11653 34.1435C5.7283 36.0257 7.48243 37.3 9.46161 37.3V33.3001ZM32.5384 33.3001H9.46161V37.3H32.5384V33.3001ZM33.0794 32.9071C33.0032 33.1414 32.7848 33.3001 32.5384 33.3001V37.3C34.5176 37.3 36.2717 36.0257 36.8835 34.1435L33.0794 32.9071ZM37.0621 20.6534L33.0794 32.9071L36.8835 34.1435L40.8662 21.8898L37.0621 20.6534Z" fill="black" fillOpacity="0.2" mask="url(#path-1-outside-1)"/>
                                                                    <path d="M36.193 19.0905C37.4845 14.9749 34.4105 10.7885 30.097 10.7885H11.9031C7.58961 10.7885 4.51562 14.9749 5.80715 19.0905L7.0302 22.988C7.86607 25.6516 10.3345 27.4641 13.1262 27.4641H28.8739C31.6656 27.4641 34.134 25.6516 34.9699 22.988L36.193 19.0905Z" fill="#3B82F6"/>
                                                                    <path d="M3.03367 21.2648C2.35854 19.1876 4.67463 17.4189 6.50074 18.6172L11.2595 21.7398L19.2069 13.9809C20.2043 13.0072 21.7963 13.0065 22.7945 13.9795L30.7557 21.7398L35.4957 18.6249C37.3217 17.425 39.6395 19.1937 38.9641 21.2716L34.9814 33.5253C34.6375 34.5836 33.6512 35.3001 32.5384 35.3001H9.4616C8.3488 35.3001 7.36255 34.5836 7.01858 33.5253L3.03367 21.2648Z" fill="#FBBF24"/>
                                                                    <ellipse rx="2.75229" ry="2.70349" transform="matrix(-1 0 0 1 21 7.00354)" fill="#3B82F6"/>
                                                                    <path d="M11.3975 24.5462L15.5599 20.7783C16.3244 20.0863 17.5438 20.6658 17.49 21.6956L16.9402 32.2266C16.9189 32.636 16.5806 32.9571 16.1706 32.9571H11.1253C10.7799 32.9571 10.4767 32.7273 10.3833 32.3948L8.34174 25.1252C8.06591 24.1431 9.10473 23.3112 10.0028 23.795L11.3975 24.5462Z" fill="#FCD34D"/>
                                                                    <path d="M32.2491 24.9696C32.5251 24.0481 33.1715 23.2827 34.0337 22.8563L35.4324 22.1645C36.0413 21.8634 36.7138 22.4402 36.5088 23.0878L33.5556 32.4189C33.4542 32.7393 33.1569 32.957 32.8208 32.957H30.8916C30.3755 32.957 30.0052 32.4596 30.1533 31.9652L32.2491 24.9696Z" fill="#F59E0B"/>
                                                                    <rect width="7.08787" height="7.08787" rx="1.28441" transform="matrix(-0.713404 0.700753 0.713404 0.700753 21.0106 21.4672)" fill="#3B82F6"/>
                                                                    <path d="M20.1215 23.6277C20.4465 23.3085 20.9953 23.5387 20.9953 23.9942V26.0405C20.9953 26.3243 20.7653 26.5543 20.4815 26.5543H18.3983C17.9384 26.5543 17.7101 25.9963 18.0383 25.674L20.1215 23.6277Z" fill="#FEF08A"/>
                                                                </svg>
                                                            ) : (
                                                                <Icon className="w-6.5 h-6.5" />
                                                            )}
                                                        </div>
                                                        {tier.levelRange === 'Level 20' && (
                                                            <div className="absolute inset-0 z-0 pointer-events-none rounded-full overflow-hidden">
                                                                <div 
                                                                    className="absolute top-0 w-[60px] h-full bg-gradient-to-r from-transparent via-white/60 to-transparent skew-x-[-25deg]"
                                                                    style={{ animation: 'shine 2.5s ease-out infinite' }}
                                                                />
                                                            </div>
                                                        )}
                                                    </button>

                                                    {/* Crown Level Label */}
                                                    <div className="absolute -bottom-1 -right-2 z-20 translate-x-1 translate-y-1">
                                                        <svg width="32" height="26" viewBox="0 0 32 26" className="w-8 h-auto">
                                                            <g transform="translate(1, 1)">
                                                                <path d="M7.756,6.993 L12.632,1.882 C13.2378543,1.2469304 14.0729018,0.881084131 14.9504851,0.866238503 C15.8280684,0.851392876 16.6750122,1.18878575 17.302,1.803 L22.594,6.989 L25.437,4.728 C26.2761293,4.06050369 27.4491145,4.00759997 28.3449252,4.59684738 C29.2407359,5.1860948 29.656646,6.28414389 29.376,7.319 L25.67,20.971 C25.3391114,22.1908879 24.2319674,23.0380001 22.968,23.0380001 L6.908,23.0380001 C5.64366103,23.0382922 4.53598585,22.1912465 4.205,20.971 L0.555,7.518 C0.260731262,6.43355938 0.685695545,5.28174032 1.61378175,4.64828824 C2.54186795,4.01483615 3.76934805,4.03880272 4.672,4.708 L7.755,6.993 L7.756,6.993 Z" stroke="#FFFFFF" strokeWidth="2" fill="#FFC800" />
                                                                <path d="M6.16,9.002 L7.259,9.944 C7.44099992,10.1000604 7.6777443,10.1770545 7.91672577,10.157906 C8.15570725,10.1387574 8.37717145,10.025049 8.532,9.842 L11.249,6.63 C11.5471503,6.27645891 12.0293501,6.13807859 12.4696049,6.27971432 C12.9098596,6.42135006 13.22092,6.81493261 13.257,7.276 L14.193,19.063 C14.218112,19.3800921 14.1096022,19.6932559 13.893686,19.9268329 C13.6777697,20.1604098 13.3740849,20.2931557 13.056,20.2930001 L8.576,20.2930001 C8.05674812,20.2927533 7.60326841,19.9416457 7.473,19.439 L4.965,9.747 C4.88514303,9.43484923 5.016732,9.10693867 5.29021683,8.93658232 C5.56370166,8.76622597 5.91603726,8.79269522 6.161,9.002 L6.16,9.002 Z" fill="#FFDE00" />
                                                                <text x="15" y="17.5" textAnchor="middle" fill="#b45309" fontSize="11" fontWeight="900" fontFamily="sans-serif">
                                                                    {tier.levelRange.replace('Level ', '')}
                                                                </text>
                                                            </g>
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Right Side: Level Details (Desktop only) */}
                            <div className="hidden md:flex md:w-[52%] h-full overflow-y-auto p-6 md:p-7 flex-col gap-6 bg-zinc-50/50 dark:bg-zinc-950/20 border-l border-zinc-200/40 dark:border-zinc-800/50 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                                {renderTierDetails(selectedTierIndex)}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Mobile Drawer Details */}
            {isOpen && isMobile && (
                <BottomSheet
                    open={isDrawerOpen}
                    onOpenChange={setIsDrawerOpen}
                >
                    {renderTierDetails(selectedTierIndex)}
                </BottomSheet>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default LevelJourneyModal;
