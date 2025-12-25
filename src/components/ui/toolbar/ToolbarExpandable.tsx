'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import useMeasure from 'react-use-measure';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { cn } from '@/lib/utils';
import useClickOutside from '@/hooks/useClickOutside';
import { useNotifications, type Notification as SharedNotification, type NotificationCategory } from '@/contexts/NotificationContext';
import { ViewerCounter } from '../misc/ViewerCounter';
// MorphingDialog removed - mail is now inside the toolbar

const transition = {
    type: 'spring' as const,
    bounce: 0.1,
    duration: 0.25,
};

// Hook to detect dark mode
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

// Skeleton Loading Component
function Skeleton({ className, isDark }: { className?: string; isDark?: boolean }) {
    return (
        <motion.div
            className={cn(isDark ? 'bg-slate-600' : 'bg-zinc-200', 'rounded', className)}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
    );
}

// Notification Skeleton
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

// Mail Skeleton
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

// Course Progress Skeleton
function CourseSkeleton({ isDark }: { isDark?: boolean }) {
    return (
        <div className='flex flex-col space-y-4'>
            <Skeleton className='h-4 w-32' isDark={isDark} />
            <div className='space-y-3'>
                {[1, 2, 3].map((i) => (
                    <div key={i} className='flex flex-col space-y-1.5'>
                        <Skeleton className='h-3.5 w-3/4' isDark={isDark} />
                        <Skeleton className='h-2 w-full rounded-full' isDark={isDark} />
                        <Skeleton className='h-2.5 w-20' isDark={isDark} />
                    </div>
                ))}
            </div>
            <Skeleton className='h-8 w-full rounded-lg' isDark={isDark} />
        </div>
    );
}

// Search Results Skeleton
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

// Enrolled courses data - synced with "Your Courses" section
// Progress starts at 0 and is loaded from studyTimeService/database
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

// Transform enrolled courses to searchable items format
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

// Using shared Notification type from context
type Notification = SharedNotification;

// Helper function to format relative time
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

// INITIAL_NOTIFICATIONS moved to NotificationContext

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
    
    // Use context functions for persistence
    const { dismissNotification: contextDismiss, markAllAsRead: contextMarkAllAsRead, clearAllNotifications: contextClearAll } = useNotifications();

    const filteredNotifications = activeCategory === 'all' 
        ? notifications 
        : notifications.filter(n => n.category === activeCategory);

    const dismissNotification = (id: number) => {
        contextDismiss(id);
    };

    const markAllAsRead = () => {
        contextMarkAllAsRead();
    };

    const clearAllNotifications = () => {
        setIsClearing(true);
        // Small delay to let exit animations play
        setTimeout(() => {
            contextClearAll();
            setIsClearing(false);
        }, 300);
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    return (
        <div className='flex flex-col space-y-3'>
            <div className='flex items-center justify-between'>
                <div className='text-xs font-semibold text-zinc-600 uppercase tracking-wide'>
                    Notifications
                </div>
                {notifications.some(n => !n.isRead) && (
                    <button
                        onClick={markAllAsRead}
                        className='text-[10px] text-blue-600 hover:text-blue-700 font-medium'
                    >
                        Mark all as read
                    </button>
                )}
            </div>

            {/* Category Filter Tabs */}
            <div className='flex gap-1 p-0.5 bg-zinc-100 rounded-lg'>
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
                                'relative flex-1 px-2 py-1 text-[10px] font-medium rounded-md transition-colors',
                                isActive ? 'text-blue-600' : 'text-zinc-500 hover:text-zinc-700'
                            )}
                            whileTap={{ scale: 0.97 }}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className='absolute inset-0 bg-white rounded-md shadow-sm'
                                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                />
                            )}
                            <span className='relative z-10'>{cat.label}</span>
                            {count > 0 && (
                                <span className={cn(
                                    'relative z-10 ml-1 text-[9px]',
                                    isActive ? 'text-blue-400' : 'text-zinc-400'
                                )}>
                                    {count}
                                </span>
                            )}
                        </motion.button>
                    );
                })}
            </div>

            <div className='space-y-2 max-h-64 overflow-y-auto'>
                {isLoading ? (
                    <NotificationSkeleton />
                ) : (
                <AnimatePresence mode='popLayout'>
                    {filteredNotifications.length === 0 ? (
                        <motion.div
                            key="empty-filter"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className='text-center py-6 text-zinc-400 text-xs'
                        >
                            No {activeCategory === 'all' ? '' : activeCategory} notifications
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
                            className='flex gap-2 items-start hover:bg-zinc-50 p-1.5 rounded-lg transition-colors cursor-pointer group'
                        >
                            {/* Avatar or Icon */}
                            {notif.teacher ? (
                                <div className='flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center'>
                                    <span className='text-[10px] font-semibold text-blue-700'>
                                        {getInitials(notif.teacher)}
                                    </span>
                                </div>
                            ) : (
                                <div className='flex-shrink-0 w-7 h-7 flex items-center justify-center'>
                                    <svg className='w-4 h-4 text-zinc-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
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
                                </div>
                            )}

                            {/* Content */}
                            <div className='flex-1 min-w-0'>
                                <div className='flex items-start gap-1'>
                                    <h4 className='text-xs font-medium text-zinc-800 flex-1'>{notif.title}</h4>
                                    {!notif.isRead && (
                                        <span className='flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500 mt-1'></span>
                                    )}
                                </div>
                                <p className='text-[11px] text-zinc-500 mt-0.5 leading-tight'>{notif.message}</p>
                                <span className='text-[10px] text-zinc-400 mt-1 block'>{formatRelativeTime(notif.timestamp)}</span>
                            </div>

                            {/* Dismiss X Button */}
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
                            className='flex-1 py-2 px-3 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors'
                            type='button'
                        >
                            View All Notifications
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={clearAllNotifications}
                            disabled={isClearing}
                            className='flex-1 py-2 px-3 text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50'
                            type='button'
                        >
                            {isClearing ? 'Clearing...' : 'Clear All'}
                        </motion.button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        className='text-center py-8 text-zinc-500 text-xs'
                    >
                        No notifications
                    </motion.div>
                )}
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
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Debounce search input
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
        <div className='flex flex-col space-y-3'>
            {/* Header */}
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                    <div className='text-xs font-semibold text-zinc-600 uppercase tracking-wide'>
                        Inbox
                    </div>
                    <span className='text-xs text-zinc-400'>({mails.length})</span>
                </div>
                <div className='flex items-center gap-2'>
                    {hasUnreadMails && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={markAllMailsAsRead}
                            className='text-[10px] font-medium text-blue-600 hover:text-blue-700'
                        >
                            Mark all read
                        </motion.button>
                    )}
                    {mails.length > 0 && (
                        <button
                            onClick={clearAllMails}
                            className='text-[10px] text-red-500 hover:text-red-600 font-medium'
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Search Input */}
            <div className='relative'>
                <svg className='absolute left-2.5 top-0 bottom-0 my-auto w-3.5 h-3.5 text-zinc-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                </svg>
                <input
                    type='text'
                    placeholder='Search messages...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='w-full h-7 pl-8 pr-8 text-xs rounded-md border border-zinc-200 bg-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500'
                />
                {/* Loading Spinner */}
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

            {/* Mail List */}
            <div className='space-y-2 max-h-56 overflow-y-auto'>
                {isLoading || isSearching ? (
                    <MailSkeleton />
                ) : (
                <AnimatePresence mode='popLayout'>
                    {filteredMails.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className='text-center py-6 text-zinc-500 text-xs'
                        >
                            {showSearchResults ? 'No messages match your search' : 'No messages'}
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
                                className={`group p-2 rounded-lg cursor-pointer transition-all duration-200 ${
                                    mail.isRead 
                                        ? 'bg-zinc-50 hover:bg-zinc-100' 
                                        : 'bg-blue-50 hover:bg-blue-100 border-l-2 border-blue-500'
                                }`}
                            >
                                <div className='flex items-start gap-2'>
                                    <div 
                                        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-semibold ${
                                            mail.isRead ? 'bg-zinc-200 text-zinc-600' : 'bg-blue-200 text-blue-700'
                                        }`}
                                        onClick={() => markMailAsRead(mail.id)}
                                    >
                                        {mail.from.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </div>
                                    <div className='flex-1 min-w-0' onClick={() => markMailAsRead(mail.id)}>
                                        <div className='flex items-center justify-between gap-2'>
                                            <h4 className={`text-xs font-semibold truncate ${
                                                mail.isRead ? 'text-zinc-600' : 'text-zinc-800'
                                            }`}>{mail.from}</h4>
                                            <span className='text-[10px] text-zinc-400 flex-shrink-0'>{mail.time}</span>
                                        </div>
                                        <p className={`text-[11px] mt-0.5 truncate ${mail.isRead ? 'text-zinc-500' : 'text-zinc-700 font-medium'}`}>{mail.subject}</p>
                                        <p className='text-[10px] text-zinc-400 mt-0.5 truncate'>{mail.preview}</p>
                                    </div>
                                    {/* Action Buttons */}
                                    <div className='flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                                        {!mail.isRead && (
                                            <div className='w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0'></div>
                                        )}
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={(e) => { e.stopPropagation(); deleteMail(mail.id); }}
                                            className='p-0.5 text-zinc-400 hover:text-red-500 transition-colors'
                                            title='Delete'
                                        >
                                            <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
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
                    className='w-full py-2 px-3 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors'
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
        // If key exists (even if empty array), use saved value; otherwise use defaults for first-time users
        if (saved !== null) {
            const parsed = JSON.parse(saved);
            return Array.isArray(parsed) ? parsed : [];
        }
        // First time user - no localStorage key exists yet
        return [];
    });

    // Debounce search input
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
        // Save empty array instead of removing - this persists the "cleared" state
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
        console.log('Selected:', item);
    };

    const handleRecentClick = (searchTerm: string) => {
        setQuery(searchTerm);
        onSearchChange(searchTerm);
    };

    return (
        <div className='flex flex-col space-y-3'>
            {/* Search Input with Loading Indicator */}
            <div className='relative w-full'>
                <input
                    className={cn(
                        'h-9 w-full rounded-lg border pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
                        isDarkMode 
                            ? 'border-slate-600 bg-slate-700 text-slate-100 placeholder-slate-400' 
                            : 'border-zinc-950/10 bg-transparent text-zinc-900 placeholder-zinc-500'
                    )}
                    autoFocus
                    placeholder='Search courses, modules, assignments...'
                    value={query}
                    onChange={handleInputChange}
                />
                {/* Loading Spinner */}
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

            {/* Search Filter Tabs - Show when typing */}
            <AnimatePresence>
                {showSuggestions && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                            'flex gap-1 p-0.5 rounded-lg overflow-hidden',
                            isDarkMode ? 'bg-slate-700' : 'bg-zinc-100'
                        )}
                    >
                        {SEARCH_FILTERS.map((filter) => {
                            const isActive = activeFilter === filter.id;
                            return (
                                <motion.button
                                    key={filter.id}
                                    onClick={() => setActiveFilter(filter.id)}
                                    className={cn(
                                        'relative flex-1 px-2 py-1 text-[10px] font-medium rounded-md transition-colors',
                                        isActive 
                                            ? 'text-blue-500' 
                                            : isDarkMode 
                                                ? 'text-slate-400 hover:text-slate-200' 
                                                : 'text-zinc-500 hover:text-zinc-700'
                                    )}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="searchFilterTab"
                                            className={cn(
                                                'absolute inset-0 rounded-md shadow-sm',
                                                isDarkMode ? 'bg-slate-600' : 'bg-white'
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

            {/* Recent Searches or Helper Text - Show when no query */}
            <AnimatePresence mode='wait'>
                {!query.trim() && recentSearches.length > 0 ? (
                    <motion.div
                        key="recent-searches"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className='w-full'
                    >
                        <div className='flex items-center justify-between mb-2'>
                            <span className={cn(
                                'text-[10px] font-semibold uppercase tracking-wide',
                                isDarkMode ? 'text-slate-400' : 'text-zinc-500'
                            )}>Recent Searches</span>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={clearAllRecent}
                                className={cn(
                                    'text-[10px] hover:text-red-500 transition-colors',
                                    isDarkMode ? 'text-slate-500' : 'text-zinc-400'
                                )}
                            >
                                Clear all
                            </motion.button>
                        </div>
                        <div className='flex flex-wrap gap-1.5'>
                            {recentSearches.map((term, index) => (
                                <motion.button
                                    key={term}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ delay: index * 0.05, type: 'spring', stiffness: 400, damping: 25 }}
                                    onClick={() => handleRecentClick(term)}
                                    className={cn(
                                        'group flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all',
                                        isDarkMode 
                                            ? 'bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-blue-400' 
                                            : 'bg-zinc-100 hover:bg-blue-50 text-zinc-600 hover:text-blue-600'
                                    )}
                                >
                                    <svg className={cn(
                                        'w-3 h-3 group-hover:text-blue-500',
                                        isDarkMode ? 'text-slate-500' : 'text-zinc-400'
                                    )} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                                    </svg>
                                    <span>{term}</span>
                                    <motion.span
                                        whileHover={{ scale: 1.2 }}
                                        onClick={(e) => removeFromRecent(term, e)}
                                        className={cn(
                                            'ml-0.5 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity',
                                            isDarkMode ? 'text-slate-500' : 'text-zinc-400'
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
                        className={cn('text-xs', isDarkMode ? 'text-slate-400' : 'text-zinc-500')}
                    >
                        Search your enrolled courses by name or code
                    </motion.div>
                ) : null}
            </AnimatePresence>

            {/* Search Results Dropdown - Inline below input */}
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
                        className={cn(
                            'w-full rounded-xl overflow-hidden border',
                            isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-zinc-50 border-zinc-200'
                        )}
                    >
                        <div className={cn(
                            'px-3 py-2 border-b flex items-center justify-between',
                            isDarkMode ? 'border-slate-700 bg-slate-700' : 'border-zinc-200 bg-white'
                        )}>
                            <p className={cn(
                                'text-xs font-semibold uppercase tracking-wide',
                                isDarkMode ? 'text-slate-300' : 'text-zinc-500'
                            )}>
                                Your Courses
                            </p>
                            <span className={cn('text-[10px]', isDarkMode ? 'text-slate-400' : 'text-zinc-400')}>
                                {filteredItems.length} {filteredItems.length === 1 ? 'course' : 'courses'} found
                            </span>
                        </div>
                        <div className='max-h-56 overflow-y-auto p-1'>
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
                                        'w-full text-left px-2.5 py-2 rounded-lg transition-all duration-150 flex items-center gap-3 group',
                                        isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-blue-50'
                                    )}
                                >
                                    {/* Course Image */}
                                    <div className='relative flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden'>
                                        <img 
                                            src={item.image} 
                                            alt={item.title}
                                            className='w-full h-full object-cover'
                                        />
                                        {/* Progress bar overlay */}
                                        <div className='absolute bottom-0 left-0 right-0 h-1 bg-black/20'>
                                            <motion.div 
                                                className='h-full'
                                                style={{ 
                                                    backgroundColor: item.progress === 100 ? '#10b981' : '#3b82f6',
                                                    width: `${item.progress}%`
                                                }}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${item.progress}%` }}
                                                transition={{ duration: 0.5, delay: index * 0.05 }}
                                            />
                                        </div>
                                    </div>
                                    <div className='flex-1 min-w-0'>
                                        <div className={cn(
                                            'text-sm font-medium truncate',
                                            isDarkMode ? 'text-slate-100' : 'text-zinc-900'
                                        )}>{item.title}</div>
                                        <div className={cn(
                                            'text-[10px]',
                                            isDarkMode ? 'text-slate-400' : 'text-zinc-500'
                                        )}>{item.subtitle}</div>
                                    </div>
                                    {/* Progress indicator */}
                                    <div className='flex-shrink-0 flex items-center gap-1.5'>
                                        {item.progress === 100 ? (
                                            <span className={cn(
                                                'text-[10px] font-medium px-1.5 py-0.5 rounded',
                                                isDarkMode ? 'text-emerald-400 bg-emerald-900/50' : 'text-emerald-600 bg-emerald-50'
                                            )}>
                                                ✓ Done
                                            </span>
                                        ) : (
                                            <span className={cn(
                                                'text-[10px] font-medium',
                                                isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                            )}>
                                                {item.progress}%
                                            </span>
                                        )}
                                    </div>
                                    <motion.svg
                                        initial={{ opacity: 0, x: -5 }}
                                        className='w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity'
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

// Course Progress Content with dark mode support
function CourseProgressContent({ isLoading }: { isLoading: boolean }) {
    const isDarkMode = useDarkMode();
    
    if (isLoading) {
        return <CourseSkeleton isDark={isDarkMode} />;
    }
    
    const continueCourse = ENROLLED_COURSES.find(c => c.progress > 0 && c.progress < 100);
    
    return (
        <div className='flex flex-col space-y-3'>
            {/* Continue Where You Left Off */}
            {continueCourse && (
                <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                        'rounded-lg p-3 border',
                        isDarkMode 
                            ? 'bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-blue-800/50' 
                            : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100'
                    )}
                >
                    <div className='flex items-center gap-2 mb-1'>
                        <svg className={cn('w-4 h-4', isDarkMode ? 'text-blue-400' : 'text-blue-500')} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z' />
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                        </svg>
                        <span className={cn(
                            'text-[10px] font-semibold uppercase tracking-wide',
                            isDarkMode ? 'text-blue-400' : 'text-blue-600'
                        )}>Continue Learning</span>
                    </div>
                    <div className={cn(
                        'text-sm font-medium',
                        isDarkMode ? 'text-slate-100' : 'text-zinc-800'
                    )}>{continueCourse.title}</div>
                    <div className={cn(
                        'text-[11px]',
                        isDarkMode ? 'text-slate-400' : 'text-zinc-500'
                    )}>{continueCourse.subtitle}</div>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className='mt-2 w-full py-1.5 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors flex items-center justify-center'
                    >
                        Resume
                    </motion.button>
                </motion.div>
            )}

            {/* Course List */}
            <div className='space-y-2 max-h-48 overflow-y-auto'>
                {ENROLLED_COURSES.filter(c => c.progress < 100).slice(0, 5).map((course, index) => (
                    <motion.div
                        key={course.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={cn(
                            'group p-2 rounded-lg transition-colors cursor-pointer',
                            isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-zinc-50'
                        )}
                    >
                        <div className='flex items-center justify-between mb-1'>
                            <span className={cn(
                                'text-sm font-medium truncate pr-2',
                                isDarkMode ? 'text-slate-100' : 'text-zinc-800'
                            )}>{course.title}</span>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className={cn(
                                    'opacity-0 group-hover:opacity-100 p-1 text-blue-500 rounded transition-all flex-shrink-0',
                                    isDarkMode ? 'hover:bg-blue-900/50' : 'hover:bg-blue-50'
                                )}
                                title='Go to course'
                            >
                                <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                                </svg>
                            </motion.button>
                        </div>
                        <div className={cn(
                            'w-full rounded-full h-1.5 mb-1',
                            isDarkMode ? 'bg-blue-950' : 'bg-gray-200'
                        )}>
                            <motion.div 
                                className={`h-1.5 rounded-full ${course.progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${course.progress}%` }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            />
                        </div>
                        <div className={cn(
                            'flex items-center justify-between text-[10px]',
                            isDarkMode ? 'text-slate-400' : 'text-zinc-500'
                        )}>
                            <span>{course.progress}% • {course.subtitle.split(' · ')[0]}</span>
                            <span className='flex items-center gap-0.5'>
                                <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                                </svg>
                                {Math.round((100 - course.progress) * 0.5)}h left
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>

            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                    'w-full py-2 text-xs font-medium rounded-lg transition-colors',
                    isDarkMode 
                        ? 'text-blue-400 hover:text-blue-300 hover:bg-slate-700' 
                        : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                )}
            >
                View All Courses
            </motion.button>
        </div>
    );
}

export default function ToolbarExpandable() {
    const [active, setActive] = useState<number | null>(null);
    const [contentRef, { height: heightContent }] = useMeasure();
    const [menuRef, { width: widthContainer }] = useMeasure();
    const ref = useRef<HTMLDivElement>(null!);
    const [isOpen, setIsOpen] = useState(false);
    const isDarkMode = useDarkMode();
    
    // Show hint only after 10 page visits, and only if not dismissed before
    const [showSearchHint, setShowSearchHint] = useState(() => {
        // Check if user has already dismissed the hint permanently
        if (localStorage.getItem('search-hint-dismissed') === 'true') {
            return false;
        }
        
        // Get current visit count and increment it
        const visitCount = parseInt(localStorage.getItem('search-hint-visits') || '0', 10) + 1;
        localStorage.setItem('search-hint-visits', visitCount.toString());
        
        // Show hint only on the 10th visit and beyond
        return visitCount >= 10;
    });

    useClickOutside(ref, () => {
        setIsOpen(false);
        setActive(null);
    });

    // Dismiss search hint permanently when user clicks search
    const dismissSearchHint = useCallback(() => {
        setShowSearchHint(false);
        localStorage.setItem('search-hint-dismissed', 'true');
    }, []);

    // Keyboard shortcuts: Ctrl+K or / to open search, ESC to close
    const openSearch = useCallback(() => {
        setIsOpen(true);
        setActive(2); // 2 is the Search item id
    }, []);

    const closePanel = useCallback(() => {
        setIsOpen(false);
        setActive(null);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+K or Cmd+K to open search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                openSearch();
            }
            // ESC to close panel
            if (e.key === 'Escape' && isOpen) {
                e.preventDefault();
                closePanel();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, openSearch, closePanel]);

    // Loading states for skeleton display
    const [isNotificationsLoading, setIsNotificationsLoading] = useState(true);
    const [isMailsLoading, setIsMailsLoading] = useState(true);
    const [isCoursesLoading, setIsCoursesLoading] = useState(true);

    // Simulate initial data loading
    useEffect(() => {
        const notifTimer = setTimeout(() => setIsNotificationsLoading(false), 800);
        const mailTimer = setTimeout(() => setIsMailsLoading(false), 1000);
        const courseTimer = setTimeout(() => setIsCoursesLoading(false), 900);
        return () => {
            clearTimeout(notifTimer);
            clearTimeout(mailTimer);
            clearTimeout(courseTimer);
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

    const getIconColor = (itemId: number) => {
        return active === itemId ? '#3b82f6' : '#71717a'; // blue-500 : zinc-500
    };

    const ITEMS = [
        {
            id: 1,
            label: 'Notifications',
            title: (
                <div className='relative flex items-center justify-center'>
                    <lord-icon
                        src="https://cdn.lordicon.com/ahxaipjb.json"
                        trigger="hover"
                        colors={`primary:${getIconColor(1)}`}
                        style={{ width: '24px', height: '24px', transition: 'all 0.3s ease' }}
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
                                    'absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-semibold rounded-full',
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
            id: 2,
            label: 'Search',
            title: (
                <div className='relative flex items-center justify-center'>
                    <lord-icon
                        src="https://cdn.lordicon.com/axroojxh.json"
                        trigger="hover"
                        colors={`primary:${getIconColor(2)}`}
                        style={{ width: '24px', height: '24px', transition: 'all 0.3s ease' }}
                    />
                    {/* Search Shortcut Hint Tooltip */}
                    <AnimatePresence>
                        {showSearchHint && (
                            <motion.div
                                initial={{ opacity: 0, y: 5, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 5, scale: 0.9 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                className='absolute top-full mt-3 px-3 py-2 rounded-lg shadow-lg whitespace-nowrap z-50 text-[11px] font-medium bg-white text-zinc-700 border border-zinc-200'
                                style={{ left: '-95px' }}
                            >
                                <div className='flex items-center gap-2'>
                                    <span>💡</span>
                                    <span>Press</span>
                                    <kbd className='px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-100 text-blue-600 border border-blue-200'>Ctrl+K</kbd>
                                    <span>for quick search</span>
                                </div>
                                {/* Arrow pointing up - positioned over search icon */}
                                <div className='absolute -top-1.5 w-3 h-3 rotate-45 bg-white border-l border-t border-zinc-200' style={{ left: '107px' }} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ),
            content: <SearchContent onSearchChange={(query) => console.log('Searching:', query)} />,
        },
        {
            id: 3,
            label: 'Course Progress',
            title: (
                <lord-icon
                    src="https://cdn.lordicon.com/hjrbjhnq.json"
                    trigger="hover"
                    colors={`primary:${getIconColor(3)}`}
                    style={{ width: '24px', height: '24px', transition: 'all 0.3s ease' }}
                />
            ),
            content: <CourseProgressContent isLoading={isCoursesLoading} />,
        },
        {
            id: 4,
            label: 'Mail',
            title: (
                <div className='relative flex items-center justify-center'>
                    <lord-icon
                        src="https://cdn.lordicon.com/bimokqfw.json"
                        trigger="hover"
                        colors={`primary:${getIconColor(4)}`}
                        style={{ width: '24px', height: '24px', transition: 'all 0.3s ease' }}
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
                                    'absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-semibold rounded-full',
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
    ];

    return (
        <MotionConfig transition={transition}>
            <div className='flex items-center gap-3'>
                {/* Viewer Counter */}
                <ViewerCounter />
                
                <div ref={ref} className='relative'>
                    <div className='h-full w-full rounded-xl border border-blue-500 bg-white'>
                        {/* Buttons at the top */}
                        <div className='flex space-x-2 p-2' ref={menuRef}>
                            {ITEMS.map((item) => (
                                <button
                                    key={item.id}
                                    aria-label={item.label}
                                    className={cn(
                                        'relative flex h-9 w-9 shrink-0 scale-100 select-none appearance-none items-center justify-center rounded-lg transition-colors hover:bg-blue-50 focus-visible:ring-2 active:scale-[0.98]',
                                        active === item.id
                                            ? 'bg-blue-50'
                                            : ''
                                    )}
                                    type='button'
                                    onClick={() => {
                                        if (!isOpen) setIsOpen(true);
                                        if (active === item.id) {
                                            setIsOpen(false);
                                            setActive(null);
                                            return;
                                        }

                                        // Dismiss search hint when clicking search button
                                        if (item.id === 2 && showSearchHint) {
                                            dismissSearchHint();
                                        }

                                        setActive(item.id);
                                    }}
                                >
                                    {item.title}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Dropdown content below - responsive positioning */}
                    <AnimatePresence initial={false} mode='sync'>
                        {isOpen ? (
                            <motion.div
                                key='dropdown'
                                initial={{ height: 0, width: widthContainer || 150 }}
                                animate={{
                                    height: heightContent || 0,
                                    width: Math.max(widthContainer || 150, 320)
                                }}
                                exit={{ height: 0, width: widthContainer || 150 }}
                                className='absolute top-full mt-2 right-0 sm:left-0 sm:right-auto overflow-hidden rounded-xl border border-blue-500 bg-white shadow-lg max-w-[calc(100vw-2rem)] sm:max-w-none'
                                style={{
                                    originY: 0,
                                }}
                            >
                                <div ref={contentRef} className='p-4'>
                                    {ITEMS.map((item) => {
                                        const isSelected = active === item.id;

                                        return (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: isSelected ? 1 : 0 }}
                                                exit={{ opacity: 0 }}
                                            >
                                                <div
                                                    className={cn(
                                                        'text-sm',
                                                        isSelected ? 'block' : 'hidden'
                                                    )}
                                                >
                                                    {item.content}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                </div>
            </div>
        </MotionConfig>
    );
}
