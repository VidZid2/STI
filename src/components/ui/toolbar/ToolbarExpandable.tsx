'use client';

import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '../../../lib/utils';
import { useNotifications, type Notification as SharedNotification, type NotificationCategory } from '../../../contexts/NotificationContext';
import { ExpandableTabs, type ExpandableTabsItem } from '../../motion/expandable-tabs';

import GettingStartedModal from '../modals/GettingStartedModal';
import VideoTutorialsModal from '../modals/VideoTutorialsModal';
import FAQsModal from '../modals/FAQsModal';
import KeyboardShortcutsModal from '../modals/KeyboardShortcutsModal';
import ContactSupportModal from '../modals/ContactSupportModal';
import { BookOpen, PlaySquare, HelpCircle, Keyboard, MessageCircle } from 'lucide-react';
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip-motion';

function useDarkMode() {
    const [isDark, setIsDark] = useState(() => 
        typeof document !== 'undefined' && document.body.classList.contains('dark-mode')
    );
    
    useEffect(() => {
        const checkDarkMode = () => {
            setIsDark(document.body.classList.contains('dark-mode'));
        };
        checkDarkMode();
        
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        
        return () => observer.disconnect();
    }, []);
    
    return isDark;
}

function Skeleton({ className, isDark }: { className?: string; isDark?: boolean }) {
    return (
        <motion.div
            className={cn(isDark ? 'bg-slate-600' : 'bg-zinc-200', 'rounded', className)}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
    );
}

function NotificationSkeleton() {
    return (
        <div className='space-y-2'>
            {[1, 2, 3].map((i) => (
                <div key={i} className='flex gap-2 items-start p-1.5'>
                    <Skeleton className='w-7 h-7 rounded-full flex-shrink-0' />
                    <div className='flex-1 space-y-1.5'>
                        <Skeleton className='h-3 w-3/4' />
                        <Skeleton className='h-2.5 w-full' />
                        <Skeleton className='h-2 w-16' />
                    </div>
                </div>
            ))}
        </div>
    );
}

function MailSkeleton() {
    return (
        <div className='space-y-2'>
            {[1, 2, 3].map((i) => (
                <div key={i} className='flex gap-2 items-start p-2 bg-zinc-50 rounded-lg'>
                    <Skeleton className='w-7 h-7 rounded-full flex-shrink-0' />
                    <div className='flex-1 space-y-1.5'>
                        <div className='flex justify-between'>
                            <Skeleton className='h-3 w-24' />
                            <Skeleton className='h-2.5 w-12' />
                        </div>
                        <Skeleton className='h-2.5 w-3/4' />
                        <Skeleton className='h-2 w-full' />
                    </div>
                </div>
            ))}
        </div>
    );
}

function SearchSkeleton({ isDark }: { isDark?: boolean }) {
    return (
        <div className={cn(
            'w-full rounded-xl overflow-hidden border',
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-zinc-50 border-zinc-200'
        )}>
            <div className={cn(
                'px-3 py-2 border-b',
                isDark ? 'border-slate-700 bg-slate-700' : 'border-zinc-200 bg-white'
            )}>
                <Skeleton className='h-3 w-24' isDark={isDark} />
            </div>
            <div className='p-1 space-y-1'>
                {[1, 2, 3].map((i) => (
                    <div key={i} className='flex items-center gap-3 px-3 py-2'>
                        <Skeleton className='w-8 h-8 rounded-lg flex-shrink-0' isDark={isDark} />
                        <div className='flex-1 space-y-1.5'>
                            <Skeleton className='h-3.5 w-3/4' isDark={isDark} />
                            <Skeleton className='h-2.5 w-16' isDark={isDark} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

const ENROLLED_COURSES = [
    { id: 'cp1', title: "Computer Programming 1", subtitle: "CITE1003 · BSIT101A", image: "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=300&h=200&fit=crop&crop=center", progress: 0 },
    { id: 'euth1', title: "Euthenics 1", subtitle: "STIC1002 · BSIT101A", image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=300&h=200&fit=crop&crop=center", progress: 0 },
    { id: 'itc', title: "Introduction to Computing", subtitle: "CITE1004 · BSIT101A", image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&h=200&fit=crop&crop=center", progress: 0 },
    { id: 'nstp1', title: "National Service Training Program 1", subtitle: "NSTP1008 · BSIT101A", image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=300&h=200&fit=crop&crop=center", progress: 0 },
    { id: 'pe1', title: "P.E./PATHFIT 1: Movement Competency Training", subtitle: "PHED1005 · BSIT101A", image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=300&h=200&fit=crop&crop=center", progress: 0 },
    { id: 'ppc', title: "Philippine Popular Culture", subtitle: "GEDC1041 · BSIT101A", image: "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=300&h=200&fit=crop&crop=center", progress: 0 },
    { id: 'purcom', title: "Purposive Communication", subtitle: "GEDC1016 · BSIT101A", image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=300&h=200&fit=crop&crop=center", progress: 0 },
    { id: 'tcw', title: "The Contemporary World", subtitle: "GEDC1002 · BSIT101A", image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&h=200&fit=crop&crop=center", progress: 0 },
    { id: 'uts', title: "Understanding the Self", subtitle: "GEDC1008 · BSIT101A", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop&crop=center", progress: 0 },
];

const SEARCHABLE_ITEMS = ENROLLED_COURSES.map((course, index) => ({
    id: index + 1,
    title: course.title,
    type: 'Course' as const,
    icon: '📚',
    subtitle: course.subtitle,
    image: course.image,
    progress: course.progress,
    courseId: course.id,
}));

type Notification = SharedNotification;

const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const NOTIFICATION_CATEGORIES: { id: NotificationCategory; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'assignment', label: 'Tasks' },
    { id: 'quiz', label: 'Quiz' },
    { id: 'announcement', label: 'News' },
];

interface Mail {
    id: number;
    from: string;
    subject: string;
    preview: string;
    time: string;
    isRead: boolean;
}

const INITIAL_MAILS: Mail[] = [
    { id: 999, from: 'deasis', subject: 'Testing UI Components', preview: 'Just checking to see if everything is perfectly fitted inside this newly scaled inbox container...', time: 'Just now', isRead: false },
    { id: 1, from: 'David Clarence Del Mundo', subject: 'Programming Assignment 3 Reminder', preview: 'This is a reminder that your Programming Assignment 3 is due tomorrow. Please make sure to submit...', time: '10:30 AM', isRead: false },
    { id: 2, from: 'Claire Maurillo', subject: 'Euthenics 1 - Module 4 Available', preview: 'Good day! Module 4: Home Management is now available. Please review the materials before our next...', time: '9:15 AM', isRead: false },
    { id: 3, from: 'Psalmmiracle Mariano', subject: 'Quiz Results - Introduction to Computing', preview: 'Your quiz results for Chapter 5: Computer Networks are now available. You can view your score...', time: 'Yesterday', isRead: true },
    { id: 4, from: 'John Denielle San Martin', subject: 'Performance Task Guidelines', preview: 'Please find attached the guidelines for your upcoming Performance Task in Purposive Communication...', time: 'Yesterday', isRead: true },
    { id: 5, from: 'Mark Joseph Danoy', subject: 'P.E. Activity Reminder', preview: 'Reminder: Please wear appropriate attire for our flexibility training session this Friday...', time: '2 days ago', isRead: true },
];

function NotificationContent({ 
    notifications, 
    isLoading = false
}: { 
    notifications: Notification[], 
    isLoading?: boolean
}) {
    const [isClearing, setIsClearing] = useState(false);
    const [activeCategory, setActiveCategory] = useState<NotificationCategory>('all');
    const isDarkMode = useDarkMode();
    
    const { dismissNotification: contextDismiss, markAllAsRead: contextMarkAllAsRead, clearAllNotifications: contextClearAll } = useNotifications();

    const filteredNotifications = activeCategory === 'all' 
        ? notifications 
        : notifications.filter(n => n.category === activeCategory);

    const dismissNotification = (id: number | string) => {
        contextDismiss(id);
    };

    const markAllAsRead = () => {
        contextMarkAllAsRead();
    };

    const clearAllNotifications = () => {
        setIsClearing(true);
        setTimeout(() => {
            contextClearAll();
            setIsClearing(false);
        }, 300);
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    return (
        <div className='flex flex-col gap-3 sm:gap-3.5 w-full min-w-[340px]'>
            <div className='flex items-center justify-between px-1'>
                <div className={cn("text-[11px] sm:text-[12px] font-bold uppercase tracking-widest", isDarkMode ? "text-slate-400" : "text-slate-500")}>
                    Notifications
                </div>
                {notifications.some(n => !n.isRead) && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={markAllAsRead}
                        className='text-[11px] text-blue-600 hover:text-blue-700 font-bold'
                    >
                        Mark all as read
                    </motion.button>
                )}
            </div>

            <div className={cn('flex gap-1 p-1 rounded-xl shadow-sm border', isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200')}>
                {NOTIFICATION_CATEGORIES.map((cat) => {
                    const count = cat.id === 'all' 
                        ? notifications.length 
                        : notifications.filter(n => n.category === cat.id).length;
                    const isActive = activeCategory === cat.id;
                    
                    return (
                        <motion.button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={cn(
                                'relative flex-1 flex items-center justify-center px-1.5 py-1.5 sm:py-2 text-[10px] sm:text-[11px] font-bold rounded-lg transition-colors',
                                isActive 
                                    ? (isDarkMode ? 'text-slate-100' : 'text-blue-600') 
                                    : (isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')
                            )}
                            whileTap={{ scale: 0.97 }}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className={cn('absolute inset-0 rounded-lg shadow-sm border', isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200')}
                                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                />
                            )}
                            <span className='relative z-10'>{cat.label}</span>
                            {count > 0 && (
                                <span className={cn(
                                    'relative z-10 ml-1.5 text-[10px]',
                                    isActive ? (isDarkMode ? 'text-blue-400' : 'text-blue-500') : (isDarkMode ? 'text-slate-500' : 'text-slate-400')
                                )}>
                                    {count}
                                </span>
                            )}
                        </motion.button>
                    );
                })}
            </div>

            <div className='flex flex-col gap-3 sm:gap-4 max-h-[60vh] overflow-y-auto px-1 pb-1' style={{ scrollbarWidth: 'none' }}>
                {isLoading ? (
                    <NotificationSkeleton />
                ) : (
                <AnimatePresence mode='popLayout'>
                    {filteredNotifications.length === 0 ? (
                        <motion.div
                            key="empty-filter"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                                'flex gap-3 items-center w-full text-left p-3 rounded-[14px] border shadow-sm', 
                                isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50/50 border-slate-200'
                            )}
                        >
                            <div className={cn("relative w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0 shadow-sm border", isDarkMode ? "bg-slate-700 border-slate-600 text-blue-400" : "bg-white border-blue-100 text-blue-500")}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </div>
                            <div className='flex-1 flex flex-col justify-center'>
                                <h4 className={cn('text-[12px] sm:text-[13px] font-bold leading-tight capitalize', isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                                    {activeCategory === 'all' ? 'No notifications' : `No ${activeCategory}s`}
                                </h4>
                                <p className={cn('text-[11px] font-medium leading-relaxed mt-0.5', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                                    You're all caught up!
                                </p>
                            </div>
                        </motion.div>
                    ) : filteredNotifications.map((notif, index) => (
                        <motion.div
                            key={notif.id}
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ 
                                opacity: isClearing ? 0 : 1, 
                                x: isClearing ? 50 : 0,
                                scale: isClearing ? 0.8 : 1
                            }}
                            exit={{ 
                                opacity: 0, 
                                x: 50, 
                                scale: 0.8,
                                transition: { duration: 0.2, delay: index * 0.05 }
                            }}
                            transition={{ 
                                duration: 0.25,
                                delay: isClearing ? index * 0.03 : 0
                            }}
                            className={cn(
                                'flex gap-2.5 sm:gap-3 items-start p-2 sm:p-2.5 rounded-[14px] transition-all duration-300 border hover:shadow-md cursor-pointer group', 
                                notif.isRead 
                                    ? (isDarkMode ? 'bg-slate-800/40 border-slate-700/40 hover:border-slate-600' : 'bg-slate-50/50 border-slate-200/50 hover:bg-white hover:border-slate-300') 
                                    : (isDarkMode ? 'bg-slate-800/80 border-slate-600 shadow-sm' : 'bg-white border-blue-200 shadow-sm')
                            )}
                        >
                            {notif.teacher ? (
                                <motion.div
                                    whileHover={{ scale: 1.05, rotate: -5 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                    className={cn("w-8 h-8 sm:w-9 sm:h-9 rounded-[10px] sm:rounded-[12px] flex items-center justify-center flex-shrink-0 shadow-sm border", isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}
                                >
                                    <span className={cn('text-[11px] sm:text-[12px] font-bold', isDarkMode ? 'text-blue-400' : 'text-blue-600')}>
                                        {getInitials(notif.teacher)}
                                    </span>
                                </motion.div>
                            ) : (
                                <motion.div
                                    whileHover={{ scale: 1.05, rotate: -5 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                    className={cn("w-8 h-8 sm:w-9 sm:h-9 rounded-[10px] sm:rounded-[12px] flex items-center justify-center flex-shrink-0 shadow-sm border", isDarkMode ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-white border-slate-200 text-slate-500")}
                                >
                                    <svg className='w-4 h-4 sm:w-5 sm:h-5 text-current' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        {notif.title.includes('Assignment') && (
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                                        )}
                                        {notif.title.includes('Quiz') && (
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' />
                                        )}
                                        {notif.title.includes('Performance') && (
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' />
                                        )}
                                    </svg>
                                </motion.div>
                            )}

                            <div className='flex-1 min-w-0 flex flex-col justify-center h-full'>
                                <div className='flex items-start gap-2'>
                                    <h4 className={cn('text-[12px] sm:text-[13px] font-bold leading-tight flex-1', isDarkMode ? 'text-slate-100' : 'text-slate-900')}>{notif.title}</h4>
                                    {!notif.isRead && (
                                        <span className='flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500 mt-0.5 shadow-[0_0_8px_rgba(59,130,246,0.5)]'></span>
                                    )}
                                </div>
                                <p className={cn('text-[11px] font-medium leading-relaxed mt-1', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{notif.message}</p>
                                <span className={cn('text-[9px] font-bold mt-1 block', isDarkMode ? 'text-slate-500' : 'text-slate-400')}>{formatRelativeTime(notif.timestamp)}</span>
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    dismissNotification(notif.id);
                                }}
                                className='flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-zinc-200 rounded'
                            >
                                <svg className='w-3 h-3 text-zinc-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                                </svg>
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
                )}
            </div>

            <AnimatePresence mode='wait'>
                {notifications.length > 0 ? (
                    <motion.div
                        key="buttons"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className='flex gap-2'
                    >
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={cn('flex-1 py-1.5 px-2 text-[11px] sm:text-[12px] font-bold rounded-lg transition-all duration-300 border', isDarkMode ? 'text-blue-400 bg-blue-900/20 border-blue-800/30 hover:bg-blue-900/40' : 'text-blue-600 bg-blue-50/50 border-blue-100 hover:bg-blue-100')}
                            type='button'
                        >
                            View All
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={clearAllNotifications}
                            disabled={isClearing}
                            className={cn('flex-1 py-1.5 px-2 text-[11px] sm:text-[12px] font-bold rounded-lg transition-all duration-300 border disabled:opacity-50', isDarkMode ? 'text-red-400 bg-red-900/20 border-red-800/30 hover:bg-red-900/40' : 'text-red-500 bg-red-50/50 border-red-100 hover:bg-red-100')}
                            type='button'
                        >
                            {isClearing ? 'Clearing...' : 'Clear All'}
                        </motion.button>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
}

function MailContent({ mails, markMailAsRead, markAllMailsAsRead, deleteMail, clearAllMails, isLoading = false }: { 
    mails: Mail[], 
    markMailAsRead: (id: number) => void,
    markAllMailsAsRead: () => void,
    deleteMail: (id: number) => void,
    clearAllMails: () => void,
    isLoading?: boolean
}) {
    const isDarkMode = useDarkMode();
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setDebouncedQuery('');
            setIsSearching(false);
            return;
        }
        
        setIsSearching(true);
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
            setIsSearching(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const filteredMails = debouncedQuery.trim()
        ? mails.filter(mail => 
            mail.from.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
            mail.subject.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
            mail.preview.toLowerCase().includes(debouncedQuery.toLowerCase())
        )
        : mails;

    const hasUnreadMails = mails.some(m => !m.isRead);
    const showSearchResults = searchQuery.trim().length > 0;

    return (
        <div className='flex flex-col gap-3 sm:gap-3.5 w-full min-w-[340px]'>
            <div className='flex items-center justify-between px-1'>
                <div className='flex items-center gap-2'>
                    <div className={cn(
                        'text-[11px] sm:text-[12px] font-bold uppercase tracking-widest',
                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    )}>
                        Inbox
                    </div>
                    <span className={cn('text-[10px] font-bold', isDarkMode ? 'text-slate-500' : 'text-slate-400')}>
                        ({mails.length})
                    </span>
                </div>
                <div className='flex items-center gap-2'>
                    {hasUnreadMails && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={markAllMailsAsRead}
                            className={cn('text-[10px] sm:text-[11px] font-bold transition-colors', isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-600')}
                        >
                            Mark all read
                        </motion.button>
                    )}
                    {mails.length > 0 && (
                        <button
                            onClick={clearAllMails}
                            className={cn('text-[10px] sm:text-[11px] font-bold transition-colors hover:text-red-500', isDarkMode ? 'text-slate-500' : 'text-slate-400')}
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            <div className='relative w-full'>
                <svg className='absolute left-3 top-0 bottom-0 my-auto w-4 h-4 text-slate-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                </svg>
                <input
                    type='text'
                    placeholder='Search messages...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={cn(
                        'h-10 w-full rounded-[14px] border pl-9 pr-8 py-2 text-[12px] sm:text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all',
                        isDarkMode 
                            ? 'border-slate-600 bg-slate-800 text-slate-100 placeholder-slate-400 focus:bg-slate-700/50' 
                            : 'border-blue-200/60 bg-white text-slate-900 placeholder-slate-400 focus:border-blue-400'
                    )}
                />
                <AnimatePresence>
                    {isSearching && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className='absolute right-2.5 top-0 bottom-0 flex items-center'
                        >
                            <svg className='w-3.5 h-3.5 animate-spin text-blue-500' fill='none' viewBox='0 0 24 24'>
                                <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                                <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                            </svg>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className='space-y-2 max-h-56 overflow-y-auto'>
                {isLoading || isSearching ? (
                    <MailSkeleton />
                ) : (
                <AnimatePresence mode='popLayout'>
                    {filteredMails.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                                'flex gap-3 items-center w-full text-left p-3 rounded-[14px] border shadow-sm', 
                                isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50/50 border-slate-200'
                            )}
                        >
                            <div className={cn("relative w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0 shadow-sm border", isDarkMode ? "bg-slate-700 border-slate-600 text-blue-400" : "bg-white border-blue-100 text-blue-500")}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div className='flex-1 flex flex-col justify-center'>
                                <h4 className={cn('text-[12px] sm:text-[13px] font-bold leading-tight', isDarkMode ? 'text-slate-100' : 'text-slate-900')}>{showSearchResults ? 'No Results' : 'Inbox Empty'}</h4>
                                <p className={cn('text-[11px] font-medium leading-relaxed mt-0.5', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{showSearchResults ? 'No messages match your search' : 'You have no new messages'}</p>
                            </div>
                        </motion.div>
                    ) : (
                        filteredMails.map((mail, index) => (
                            <motion.div
                                key={mail.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 50, scale: 0.8 }}
                                transition={{ duration: 0.25, delay: index * 0.03 }}
                                className={cn(
                                    'flex gap-2.5 sm:gap-3 items-center w-full text-left p-2 sm:p-2.5 rounded-[14px] transition-all duration-300 border hover:shadow-md cursor-pointer group', 
                                    mail.isRead 
                                        ? (isDarkMode ? 'bg-slate-800/80 border-slate-600 shadow-sm hover:border-slate-500' : 'bg-white border-blue-200 shadow-sm hover:bg-slate-50/50 hover:border-blue-300')
                                        : (isDarkMode ? 'bg-blue-900/20 border-blue-500/50 shadow-sm' : 'bg-blue-50/50 border-blue-300 shadow-sm')
                                )}
                            >
                                <div className='flex items-start gap-2.5 sm:gap-3 w-full'>
                                    <motion.div 
                                        whileHover={{ scale: 1.05, rotate: -5 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                        className={cn(
                                            'relative flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] sm:rounded-[12px] flex items-center justify-center border shadow-sm font-bold text-[11px] sm:text-[12px] transition-colors',
                                            mail.isRead ? (isDarkMode ? 'bg-slate-700 border-slate-600 text-slate-400 group-hover:text-blue-400 group-hover:border-blue-500/50' : 'bg-slate-50 border-slate-200 text-slate-500 group-hover:text-blue-500 group-hover:border-blue-300') : (isDarkMode ? 'bg-blue-900/40 border-blue-700 text-blue-400' : 'bg-white border-blue-200 text-blue-600')
                                        )}
                                        onClick={() => markMailAsRead(mail.id)}
                                    >
                                        {mail.from.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </motion.div>
                                    <div className='flex-1 min-w-0 flex flex-col' onClick={() => markMailAsRead(mail.id)}>
                                        <div className='flex items-center justify-between gap-2 mb-0.5'>
                                            <h4 className={cn('text-[12px] sm:text-[13px] font-bold truncate', mail.isRead ? (isDarkMode ? 'text-slate-300' : 'text-slate-700') : (isDarkMode ? 'text-slate-100' : 'text-slate-900'))}>{mail.from}</h4>
                                            <span className={cn('text-[9.5px] font-bold uppercase tracking-wider', isDarkMode ? 'text-slate-500' : 'text-slate-400')}>{mail.time}</span>
                                        </div>
                                        <p className={cn('text-[11px] font-bold truncate', mail.isRead ? (isDarkMode ? 'text-slate-400' : 'text-slate-500') : (isDarkMode ? 'text-blue-300' : 'text-blue-700'))}>{mail.subject}</p>
                                        <p className={cn('text-[10px] sm:text-[11px] font-medium truncate mt-0.5', isDarkMode ? 'text-slate-500' : 'text-slate-500')}>{mail.preview}</p>
                                    </div>
                                    <div className='flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity justify-center items-center h-full'>
                                        {!mail.isRead && (
                                            <div className='w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] flex-shrink-0'></div>
                                        )}
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={(e) => { e.stopPropagation(); deleteMail(mail.id); }}
                                            className='p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-md transition-colors'
                                            title='Delete'
                                        >
                                            <svg className='w-3.5 h-3.5 sm:w-4 sm:h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                                            </svg>
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
                )}
            </div>

            {mails.length > 0 && (
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                        'w-full py-1.5 px-2 text-[11px] sm:text-[12px] font-bold rounded-lg transition-all duration-300 border',
                        isDarkMode ? 'text-blue-400 bg-blue-900/20 border-blue-800/30 hover:bg-blue-900/40' : 'text-blue-600 bg-blue-50/50 border-blue-100 hover:bg-blue-100'
                    )}
                    type='button'
                >
                    View All Messages
                </motion.button>
            )}
        </div>
    );
}

type SearchFilter = 'all' | 'inProgress' | 'completed';

const SEARCH_FILTERS: { id: SearchFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'inProgress', label: 'In Progress' },
    { id: 'completed', label: 'Completed' },
];

function SearchContent({ onSearchChange }: { onSearchChange: (query: string) => void }) {
    const isDarkMode = useDarkMode();
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeFilter, setActiveFilter] = useState<SearchFilter>('all');
    const [recentSearches, setRecentSearches] = useState<string[]>(() => {
        const saved = localStorage.getItem('recentSearches');
        if (saved !== null) {
            const parsed = JSON.parse(saved);
            return Array.isArray(parsed) ? parsed : [];
        }
        return [];
    });

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            inputRef.current?.focus({ preventScroll: true });
        }, 50);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!query.trim()) {
            setDebouncedQuery('');
            setIsLoading(false);
            return;
        }
        
        setIsLoading(true);
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
            setIsLoading(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const filteredItems = debouncedQuery.trim()
        ? SEARCHABLE_ITEMS.filter(item => {
            const matchesQuery = item.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
                item.subtitle.toLowerCase().includes(debouncedQuery.toLowerCase());
            const matchesFilter = activeFilter === 'all' || 
                (activeFilter === 'completed' && item.progress === 100) ||
                (activeFilter === 'inProgress' && item.progress < 100);
            return matchesQuery && matchesFilter;
        })
        : [];

    const showSuggestions = query.trim().length > 0;

    const addToRecentSearches = (searchTerm: string) => {
        const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
    };

    const removeFromRecent = (searchTerm: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = recentSearches.filter(s => s !== searchTerm);
        setRecentSearches(updated);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
    };

    const clearAllRecent = () => {
        setRecentSearches([]);
        localStorage.setItem('recentSearches', JSON.stringify([]));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        onSearchChange(value);
    };

    const handleSelectItem = (item: typeof SEARCHABLE_ITEMS[0]) => {
        setQuery(item.title);
        addToRecentSearches(item.title);
    };

    const handleRecentClick = (searchTerm: string) => {
        setQuery(searchTerm);
        onSearchChange(searchTerm);
    };

    return (
        <div className='flex flex-col gap-3 sm:gap-3.5 w-full min-w-[340px]'>
            <div className='relative w-full'>
                <svg className='absolute left-3 top-0 bottom-0 my-auto w-4 h-4 text-slate-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                </svg>
                <input
                    className={cn(
                        'h-10 w-full rounded-[14px] border pl-9 pr-8 py-2 text-[12px] sm:text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all',
                        isDarkMode 
                            ? 'border-slate-600 bg-slate-800 text-slate-100 placeholder-slate-400 focus:bg-slate-700/50' 
                            : 'border-blue-200/60 bg-white text-slate-900 placeholder-slate-400 focus:border-blue-400'
                    )}
                    ref={inputRef}
                    placeholder='Search courses, modules, assignments...'
                    value={query}
                    onChange={handleInputChange}
                />
                <AnimatePresence>
                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className='absolute right-2.5 top-0 bottom-0 flex items-center'
                        >
                            <svg className='w-4 h-4 animate-spin text-blue-500' fill='none' viewBox='0 0 24 24'>
                                <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                                <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                            </svg>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {showSuggestions && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                            'flex gap-1 p-1 rounded-[12px] shadow-sm border',
                            isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                        )}
                    >
                        {SEARCH_FILTERS.map((filter) => {
                            const isActive = activeFilter === filter.id;
                            return (
                                <motion.button
                                    key={filter.id}
                                    onClick={() => setActiveFilter(filter.id)}
                                    className={cn(
                                        'relative flex-1 flex items-center justify-center px-1.5 py-1.5 sm:py-2 text-[10px] sm:text-[11px] font-bold rounded-lg transition-colors',
                                        isActive 
                                            ? (isDarkMode ? 'text-slate-100' : 'text-blue-600') 
                                            : (isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')
                                    )}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="searchFilterTab"
                                            className={cn(
                                                'absolute inset-0 rounded-lg shadow-sm border',
                                                isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'
                                            )}
                                            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                        />
                                    )}
                                    <span className='relative z-10'>{filter.label}</span>
                                </motion.button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode='wait'>
                {!query.trim() && recentSearches.length > 0 ? (
                    <motion.div
                        key="recent-searches"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className='w-full px-1'
                    >
                        <div className='flex items-center justify-between mb-2.5'>
                            <span className={cn(
                                'text-[11px] sm:text-[12px] font-bold uppercase tracking-widest',
                                isDarkMode ? 'text-slate-400' : 'text-slate-500'
                            )}>Recent Searches</span>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={clearAllRecent}
                                className={cn(
                                    'text-[10px] sm:text-[11px] font-bold hover:text-red-500 transition-colors',
                                    isDarkMode ? 'text-slate-500' : 'text-slate-400'
                                )}
                            >
                                Clear all
                            </motion.button>
                        </div>
                        <div className='flex flex-wrap gap-2'>
                            {recentSearches.map((term, index) => (
                                <motion.button
                                    key={term}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ delay: index * 0.05, type: 'spring', stiffness: 400, damping: 25 }}
                                    onClick={() => handleRecentClick(term)}
                                    className={cn(
                                        'group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] sm:text-[12px] font-bold transition-all border shadow-sm',
                                        isDarkMode 
                                            ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-blue-400' 
                                            : 'bg-white border-slate-200 hover:bg-blue-50 hover:border-blue-200 text-slate-600 hover:text-blue-600'
                                    )}
                                >
                                    <svg className={cn(
                                        'w-3.5 h-3.5 group-hover:text-blue-500 transition-colors',
                                        isDarkMode ? 'text-slate-500' : 'text-slate-400'
                                    )} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                                    </svg>
                                    <span>{term}</span>
                                    <motion.span
                                        whileHover={{ scale: 1.2 }}
                                        onClick={(e) => removeFromRecent(term, e)}
                                        className={cn(
                                            'ml-0.5 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity',
                                            isDarkMode ? 'text-slate-500' : 'text-slate-400'
                                        )}
                                    >
                                        ×
                                    </motion.span>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                ) : !query.trim() ? (
                    <motion.div
                        key="helper-text"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                            'flex gap-3 items-center w-full text-left p-3 rounded-[14px] border shadow-sm', 
                            isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50/50 border-slate-200'
                        )}
                    >
                        <div className={cn("relative w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0 shadow-sm border", isDarkMode ? "bg-slate-700 border-slate-600 text-blue-400" : "bg-white border-blue-100 text-blue-500")}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <div className='flex-1 flex flex-col justify-center'>
                            <h4 className={cn('text-[12px] sm:text-[13px] font-bold leading-tight', isDarkMode ? 'text-slate-100' : 'text-slate-900')}>Find Courses</h4>
                            <p className={cn('text-[11px] font-medium leading-relaxed mt-0.5', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>Search your enrolled courses by name or code...</p>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            <AnimatePresence mode='wait'>
                {showSuggestions && isLoading && (
                    <motion.div
                        key="search-skeleton"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                    >
                        <SearchSkeleton isDark={isDarkMode} />
                    </motion.div>
                )}

                {showSuggestions && !isLoading && filteredItems.length > 0 && (
                    <motion.div
                        key="results"
                        initial={{ opacity: 0, height: 0, scale: 0.95 }}
                        animate={{ opacity: 1, height: 'auto', scale: 1 }}
                        exit={{ opacity: 0, height: 0, scale: 0.95 }}
                        transition={{ 
                            duration: 0.25, 
                            ease: [0.4, 0, 0.2, 1],
                            height: { duration: 0.3 }
                        }}
                        className='flex flex-col'
                    >
                        <div className='flex items-center justify-between px-1 mb-2'>
                            <p className={cn(
                                'text-[11px] sm:text-[12px] font-bold uppercase tracking-widest',
                                isDarkMode ? 'text-slate-400' : 'text-slate-500'
                            )}>
                                Your Courses
                            </p>
                            <span className={cn('text-[10px] font-bold', isDarkMode ? 'text-slate-500' : 'text-slate-400')}>
                                {filteredItems.length} {filteredItems.length === 1 ? 'course' : 'courses'} found
                            </span>
                        </div>
                        <div className='max-h-56 overflow-y-auto p-1 -mx-1 flex flex-col gap-2'>
                            {filteredItems.map((item, index) => (
                                <motion.button
                                    key={item.id}
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ 
                                        delay: index * 0.04, 
                                        duration: 0.2,
                                        ease: 'easeOut'
                                    }}
                                    onClick={() => handleSelectItem(item)}
                                    className={cn(
                                        'flex gap-2.5 sm:gap-3 items-center w-full text-left p-2 sm:p-2.5 rounded-[14px] transition-all duration-300 border hover:shadow-md cursor-pointer group', 
                                        isDarkMode ? 'bg-slate-800/80 border-slate-600 shadow-sm hover:border-slate-500' : 'bg-white border-blue-200 shadow-sm hover:bg-slate-50/50 hover:border-blue-300'
                                    )}
                                >
                                    <motion.div 
                                        whileHover={{ scale: 1.05, rotate: -5 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                        className={cn(
                                            'relative flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] sm:rounded-[12px] overflow-hidden border shadow-sm',
                                            isDarkMode ? 'border-slate-700' : 'border-slate-200'
                                        )}
                                    >
                                        <img 
                                            src={item.image} 
                                            alt={item.title}
                                            className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-300'
                                        />
                                        <div className='absolute bottom-0 left-0 right-0 h-1 bg-black/40'>
                                            <motion.div 
                                                className='h-full shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                                                style={{ 
                                                    backgroundColor: item.progress === 100 ? '#10b981' : '#3b82f6',
                                                    width: `${item.progress}%`
                                                }}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${item.progress}%` }}
                                                transition={{ duration: 0.5, delay: index * 0.05 }}
                                            />
                                        </div>
                                    </motion.div>
                                    <div className='flex-1 min-w-0 flex flex-col justify-center'>
                                        <div className={cn(
                                            'text-[12px] sm:text-[13px] font-bold leading-tight truncate',
                                            isDarkMode ? 'text-slate-100' : 'text-slate-900'
                                        )}>{item.title}</div>
                                        <div className={cn(
                                            'text-[11px] font-medium mt-0.5 truncate',
                                            isDarkMode ? 'text-slate-400' : 'text-slate-500'
                                        )}>{item.subtitle}</div>
                                    </div>
                                    <div className='flex-shrink-0 flex items-center gap-1.5'>
                                        {item.progress === 100 ? (
                                            <span className={cn(
                                                'text-[10px] font-bold px-1.5 py-0.5 rounded-md border',
                                                isDarkMode ? 'text-emerald-400 bg-emerald-900/20 border-emerald-800/30' : 'text-emerald-600 bg-emerald-50 border-emerald-200'
                                            )}>
                                                ✓ Done
                                            </span>
                                        ) : (
                                            <span className={cn(
                                                'text-[10px] font-bold px-1.5 py-0.5 rounded-md border',
                                                isDarkMode ? 'text-blue-400 bg-blue-900/20 border-blue-800/30' : 'text-blue-600 bg-blue-50 border-blue-200'
                                            )}>
                                                {item.progress}%
                                            </span>
                                        )}
                                    </div>
                                    <motion.svg
                                        initial={{ opacity: 0, x: -5 }}
                                        className='w-3.5 h-3.5 text-blue-500 opacity-0 group-hover:opacity-100 group-hover:x-0 transition-all duration-300 -ml-1'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                                    </motion.svg>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {showSuggestions && !isLoading && filteredItems.length === 0 && debouncedQuery.trim() && (
                    <motion.div
                        key="no-results"
                        initial={{ opacity: 0, height: 0, scale: 0.95 }}
                        animate={{ opacity: 1, height: 'auto', scale: 1 }}
                        exit={{ opacity: 0, height: 0, scale: 0.95 }}
                        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                        className={cn(
                            'w-full rounded-xl p-4 overflow-hidden border',
                            isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-zinc-50 border-zinc-200'
                        )}
                    >
                        <div className='text-center'>
                            <motion.div 
                                className='text-2xl mb-2'
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                            >
                                🔍
                            </motion.div>
                            <div className={cn(
                                'text-sm font-medium',
                                isDarkMode ? 'text-slate-200' : 'text-zinc-700'
                            )}>No courses found</div>
                            <div className={cn(
                                'text-xs mt-1',
                                isDarkMode ? 'text-slate-400' : 'text-zinc-500'
                            )}>
                                {activeFilter === 'completed' ? 'No completed courses match your search' : 
                                 activeFilter === 'inProgress' ? 'No in-progress courses match your search' : 
                                 'Try searching by course name or code'}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}



export default function ToolbarExpandable({ className, isMobile = false, barHeight }: { className?: string; isMobile?: boolean; barHeight?: number }) {
    const isDarkMode = useDarkMode();

    const [showGettingStarted, setShowGettingStarted] = useState(false);
    const [showVideoTutorials, setShowVideoTutorials] = useState(false);
    const [showFAQs, setShowFAQs] = useState(false);
    const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
    const [showContactSupport, setShowContactSupport] = useState(false);

    // Disable keyboard shortcuts for search since it's now handled natively by the tab component or needs to be adapted

    // Loading states for skeleton display
    const [isNotificationsLoading, setIsNotificationsLoading] = useState(true);
    const [isMailsLoading, setIsMailsLoading] = useState(true);

    // Simulate initial data loading
    useEffect(() => {
        const notifTimer = setTimeout(() => setIsNotificationsLoading(false), 800);
        const mailTimer = setTimeout(() => setIsMailsLoading(false), 1000);
        return () => {
            clearTimeout(notifTimer);
            clearTimeout(mailTimer);
        };
    }, []);

    // Notification state - using shared context for sync with toast notifications
    const { notifications, unreadCount: unreadNotificationCount } = useNotifications();

    // Mail state - persisted to localStorage with version check
    const MAIL_VERSION = 'v2'; // Increment this to reset mails to new defaults
    const [mails, setMails] = useState<Mail[]>(() => {
        const savedVersion = localStorage.getItem('inbox-mails-version');
        // If version changed, reset to new defaults
        if (savedVersion !== MAIL_VERSION) {
            localStorage.setItem('inbox-mails-version', MAIL_VERSION);
            localStorage.removeItem('inbox-mails');
            return INITIAL_MAILS;
        }
        const saved = localStorage.getItem('inbox-mails');
        if (saved !== null) {
            try {
                const parsed = JSON.parse(saved);
                return Array.isArray(parsed) ? parsed : INITIAL_MAILS;
            } catch {
                return INITIAL_MAILS;
            }
        }
        return INITIAL_MAILS;
    });

    // Save mails to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('inbox-mails', JSON.stringify(mails));
    }, [mails]);

    const markMailAsRead = (id: number) => {
        setMails(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));
    };

    const deleteMail = (id: number) => {
        setMails(prev => prev.filter(m => m.id !== id));
    };

    const markAllMailsAsRead = () => {
        setMails(prev => prev.map(m => ({ ...m, isRead: true })));
    };

    const clearAllMails = () => {
        setMails([]);
        // Explicitly save empty array to localStorage
        localStorage.setItem('inbox-mails', JSON.stringify([]));
    };

    const unreadMailCount = mails.filter(m => !m.isRead).length;

    const ITEMS: ExpandableTabsItem[] = [
        {
            id: 'getting-started',
            label: 'Getting Started',
            onClick: () => setShowGettingStarted(true),
            icon: isMobile ? (
                <div className='relative flex items-center justify-center text-blue-500'>
                    <BookOpen className="w-5 h-5" />
                </div>
            ) : (
                <Tooltip content="Getting Started" side="bottom">
                    <div className='relative flex items-center justify-center text-blue-500'>
                        <BookOpen className="w-5 h-5" />
                    </div>
                </Tooltip>
            )
        },
        {
            id: 'video-tutorials',
            label: 'Video Tutorials',
            onClick: () => setShowVideoTutorials(true),
            icon: isMobile ? (
                <div className='relative flex items-center justify-center text-blue-500'>
                    <PlaySquare className="w-5 h-5" />
                </div>
            ) : (
                <Tooltip content="Video Tutorials" side="bottom">
                    <div className='relative flex items-center justify-center text-blue-500'>
                        <PlaySquare className="w-5 h-5" />
                    </div>
                </Tooltip>
            )
        },
        {
            id: 'faqs',
            label: 'FAQs',
            onClick: () => setShowFAQs(true),
            icon: isMobile ? (
                <div className='relative flex items-center justify-center text-blue-500'>
                    <HelpCircle className="w-5 h-5" />
                </div>
            ) : (
                <Tooltip content="FAQs" side="bottom">
                    <div className='relative flex items-center justify-center text-blue-500'>
                        <HelpCircle className="w-5 h-5" />
                    </div>
                </Tooltip>
            )
        },
        ...(!isMobile ? [{
            id: 'keyboard-shortcuts',
            label: 'Keyboard Shortcuts',
            onClick: () => setShowKeyboardShortcuts(true),
            icon: isMobile ? (
                <div className='relative flex items-center justify-center text-blue-500'>
                    <Keyboard className="w-5 h-5" />
                </div>
            ) : (
                <Tooltip content="Keyboard Shortcuts" side="bottom">
                    <div className='relative flex items-center justify-center text-blue-500'>
                        <Keyboard className="w-5 h-5" />
                    </div>
                </Tooltip>
            )
        }] : []),
        {
            id: 'contact-support',
            label: 'Contact Support',
            onClick: () => setShowContactSupport(true),
            icon: isMobile ? (
                <div className='relative flex items-center justify-center text-blue-500'>
                    <MessageCircle className="w-5 h-5" />
                </div>
            ) : (
                <Tooltip content="Contact Support" side="bottom">
                    <div className='relative flex items-center justify-center text-blue-500'>
                        <MessageCircle className="w-5 h-5" />
                    </div>
                </Tooltip>
            )
        },
        {
            id: 'divider-main',
            label: '',
            icon: null,
            isDivider: true,
        },
        {
            id: 'search',
            label: 'Search',
            icon: (
                <div className='relative flex items-center justify-center'>
                    <lord-icon
                        src="https://cdn.lordicon.com/xaekjsls.json"
                        trigger="hover"
                        colors={`primary:currentColor`}
                        style={{ width: '20px', height: '20px', transition: 'all 0.3s ease' }}
                    />
                </div>
            ),
            content: <SearchContent onSearchChange={(query) => console.log('Searching:', query)} />,
        },
        {
            id: 'notification',
            label: 'Notifications',
            icon: (
                <div className='relative flex items-center justify-center'>
                    <lord-icon
                        src="https://cdn.lordicon.com/ahxaipjb.json"
                        trigger="hover"
                        colors={`primary:currentColor`}
                        style={{ width: '20px', height: '20px', transition: 'all 0.3s ease' }}
                    />
                    <AnimatePresence mode='wait'>
                        {unreadNotificationCount > 0 && (
                            <motion.span
                                key="notification-badge"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ 
                                    type: 'spring', 
                                    stiffness: 500, 
                                    damping: 25 
                                }}
                                className={cn(
                                    'absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 flex items-center justify-center min-w-[15px] h-[15px] sm:min-w-[18px] sm:h-[18px] px-0.5 sm:px-1 text-[8px] sm:text-[10px] font-semibold rounded-full',
                                    isDarkMode 
                                        ? 'bg-red-400 text-red-950' 
                                        : 'bg-red-500 text-white'
                                )}
                            >
                                <motion.span
                                    key={unreadNotificationCount}
                                    initial={{ y: -8, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                >
                                    {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                                </motion.span>
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
            ),
            content: <NotificationContent notifications={notifications} isLoading={isNotificationsLoading} />,
        },
        {
            id: 'inbox',
            label: 'Inbox',
            icon: (
                <div className='relative flex items-center justify-center'>
                    <lord-icon
                        src="https://cdn.lordicon.com/bimokqfw.json"
                        trigger="hover"
                        colors={`primary:currentColor`}
                        style={{ width: '20px', height: '20px', transition: 'all 0.3s ease' }}
                    />
                    <AnimatePresence mode='wait'>
                        {unreadMailCount > 0 && (
                            <motion.span
                                key="mail-badge"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ 
                                    type: 'spring', 
                                    stiffness: 500, 
                                    damping: 25 
                                }}
                                className={cn(
                                    'absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 flex items-center justify-center min-w-[15px] h-[15px] sm:min-w-[18px] sm:h-[18px] px-0.5 sm:px-1 text-[8px] sm:text-[10px] font-semibold rounded-full',
                                    isDarkMode 
                                        ? 'bg-blue-400 text-blue-950' 
                                        : 'bg-blue-500 text-white'
                                )}
                            >
                                <motion.span
                                    key={unreadMailCount}
                                    initial={{ y: -8, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                >
                                    {unreadMailCount > 9 ? '9+' : unreadMailCount}
                                </motion.span>
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
            ),
            content: <MailContent mails={mails} markMailAsRead={markMailAsRead} markAllMailsAsRead={markAllMailsAsRead} deleteMail={deleteMail} clearAllMails={clearAllMails} isLoading={isMailsLoading} />,
        },
        {
            id: 'divider-settings',
            label: '',
            icon: null,
            isDivider: true,
        },
        {
            id: 'settings',
            label: 'Settings',
            icon: (
                <div className='relative flex items-center justify-center text-blue-500'>
                    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                </div>
            ),
            onClick: () => {
                document.dispatchEvent(new CustomEvent('open:settings'));
            }
        },
    ];

    if (isMobile) {
        // Help item removed because its contents were moved into the main tabs
    }

    return (
        <TooltipProvider delayDuration={0} skipDelayDuration={0}>
            <div className="flex items-center relative z-50">
                <ExpandableTabs items={ITEMS} expandDirection="down" className={className} fullWidth={isMobile} barHeight={barHeight} />

                <GettingStartedModal isOpen={showGettingStarted} onClose={() => setShowGettingStarted(false)} />
                <VideoTutorialsModal isOpen={showVideoTutorials} onClose={() => setShowVideoTutorials(false)} />
                <FAQsModal isOpen={showFAQs} onClose={() => setShowFAQs(false)} />
                <KeyboardShortcutsModal isOpen={showKeyboardShortcuts} onClose={() => setShowKeyboardShortcuts(false)} />
                <ContactSupportModal isOpen={showContactSupport} onClose={() => setShowContactSupport(false)} />
            </div>
        </TooltipProvider>
    );
}
