import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import '../dashboard.css';
import '../intro.css';
import '../settings-modal.css';
import '../responsive-optimization.css';
import '../home-content.css';
// notification-toast.css removed - using new minimalistic design
import WelcomeModal from '../components/WelcomeModal';
import DashboardTutorial from '../components/DashboardTutorial';
import Confetti from '../components/Confetti';
import SettingsModal from '../components/SettingsModal';
// AnimatedList removed - using AnimatePresence for notifications
import DashboardIntro from '../components/DashboardIntro';
import { Dock, DockIcon } from '../components/ui/dock';
import ToolbarExpandable from '../components/ui/ToolbarExpandable';
import UserProfileDropdown from '../components/ui/UserProfileDropdown';
import ToolsContent from '../components/ToolsContent';
import HomeContent from '../components/HomeContent';
import { useNotifications } from '../contexts/NotificationContext';
import { ContainerTextFlip } from '../components/ui/container-text-flip';
import SidebarCoursesDropdown from '../components/ui/SidebarCoursesDropdown';
import WidgetsToggleButton from '../components/ui/WidgetsToggleButton';
import CourseViewPage from '../components/CourseViewPage';

// Notification type icons - simplified static SVGs for performance
const NotificationIcon: React.FC<{ type: string; title: string }> = ({ title }) => {
    const iconColor = '#71717a'; // zinc-500

    // Determine icon based on title content (matching toolbar icons)
    const getIcon = () => {
        // Assignment icon - clipboard with lines
        if (title.includes('Assignment')) {
            return (
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                    <path
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
                        stroke={iconColor}
                        strokeWidth={1.5}
                        strokeLinecap="round"
                    />
                    <rect x="9" y="3" width="6" height="4" rx="1" stroke={iconColor} strokeWidth={1.5} />
                    <path d="M9 12h6M9 16h4" stroke={iconColor} strokeWidth={1.5} strokeLinecap="round" />
                </svg>
            );
        }
        
        // Quiz icon - clipboard with checkmark
        if (title.includes('Quiz')) {
            return (
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                    <path
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
                        stroke={iconColor}
                        strokeWidth={1.5}
                        strokeLinecap="round"
                    />
                    <rect x="9" y="3" width="6" height="4" rx="1" stroke={iconColor} strokeWidth={1.5} />
                    <path d="M9 14l2 2 4-4" stroke={iconColor} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            );
        }
        
        // Performance Task icon - bar chart
        if (title.includes('Performance')) {
            return (
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                    <rect x="4" y="13" width="4" height="7" rx="1" stroke={iconColor} strokeWidth={1.5} />
                    <rect x="10" y="9" width="4" height="11" rx="1" stroke={iconColor} strokeWidth={1.5} />
                    <rect x="16" y="4" width="4" height="16" rx="1" stroke={iconColor} strokeWidth={1.5} />
                </svg>
            );
        }

        // Default - bell icon for announcements
        return (
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                <path
                    d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"
                    stroke={iconColor}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path d="M13.73 21a2 2 0 01-3.46 0" stroke={iconColor} strokeWidth={1.5} strokeLinecap="round" />
            </svg>
        );
    };

    return (
        <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center">
            {getIcon()}
        </div>
    );
};

// Minimalistic Notification Item Component with smooth animations
interface NotificationItemProps {
    notification: {
        id: number;
        title: string;
        message: string;
        type: 'assignment' | 'grade' | 'announcement' | 'system';
    };
    onClose: (id: number) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClose }) => {
    const [isHovered, setIsHovered] = React.useState(false);
    const [progress, setProgress] = React.useState(100);

    React.useEffect(() => {
        if (isHovered) return;
        
        const duration = 5000;
        const intervalTime = 50; // Increased from 30ms for better performance
        const decrement = (100 / duration) * intervalTime;

        const timer = setInterval(() => {
            setProgress((prev) => {
                const newProgress = prev - decrement;
                if (newProgress <= 0) {
                    clearInterval(timer);
                    onClose(notification.id);
                    return 0;
                }
                return newProgress;
            });
        }, intervalTime);

        return () => clearInterval(timer);
    }, [notification.id, onClose, isHovered]);

    const getAccentColor = () => {
        switch (notification.type) {
            case 'assignment': return '#3b82f6';
            case 'grade': return '#f59e0b';
            case 'announcement': return '#8b5cf6';
            default: return '#71717a';
        }
    };

    const accentColor = getAccentColor();

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20, transition: { duration: 0.15 } }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className="relative bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer border border-zinc-200/60"
            style={{ transition: 'box-shadow 0.15s ease' }}
        >
            {/* Accent bar on left */}
            <div 
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ backgroundColor: accentColor }}
            />
            
            {/* Content */}
            <div className="flex items-center gap-2.5 pl-4 pr-2.5 py-2.5">
                <NotificationIcon type={notification.type} title={notification.title} />
                
                <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-zinc-800 leading-tight">
                        {notification.title}
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug line-clamp-1">
                        {notification.message}
                    </p>
                </div>
                
                {/* Blue unread indicator dot */}
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500" />
                
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose(notification.id);
                    }}
                    className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            
            {/* Progress bar - CSS transition instead of motion */}
            <div className="h-[2px] bg-zinc-100">
                <div
                    className="h-full origin-left"
                    style={{ 
                        backgroundColor: accentColor,
                        transform: `scaleX(${progress / 100})`,
                        transition: 'transform 0.05s linear'
                    }}
                />
            </div>
        </motion.div>
    );
};

// Small inline SVG icon for grouped list items
const SmallTypeIcon: React.FC<{ title: string }> = ({ title }) => {
    const iconColor = '#71717a';

    // Assignment icon - clipboard with lines
    if (title.includes('Assignment')) {
        return (
            <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke={iconColor} strokeWidth={1.5} strokeLinecap="round" />
                <rect x="9" y="3" width="6" height="4" rx="1" stroke={iconColor} strokeWidth={1.5} />
                <path d="M9 12h6M9 16h4" stroke={iconColor} strokeWidth={1.5} strokeLinecap="round" />
            </svg>
        );
    }
    
    // Quiz icon - clipboard with checkmark
    if (title.includes('Quiz')) {
        return (
            <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke={iconColor} strokeWidth={1.5} strokeLinecap="round" />
                <rect x="9" y="3" width="6" height="4" rx="1" stroke={iconColor} strokeWidth={1.5} />
                <path d="M9 14l2 2 4-4" stroke={iconColor} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        );
    }
    
    // Performance Task icon - bar chart
    if (title.includes('Performance')) {
        return (
            <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
                <rect x="4" y="13" width="4" height="7" rx="1" stroke={iconColor} strokeWidth={1.5} />
                <rect x="10" y="9" width="4" height="11" rx="1" stroke={iconColor} strokeWidth={1.5} />
                <rect x="16" y="4" width="4" height="16" rx="1" stroke={iconColor} strokeWidth={1.5} />
            </svg>
        );
    }

    // Default - bell icon
    return (
        <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={iconColor} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M13.73 21a2 2 0 01-3.46 0" stroke={iconColor} strokeWidth={1.5} strokeLinecap="round" />
        </svg>
    );
};

// Grouped Notification Component - shows when 3+ notifications
interface GroupedNotificationProps {
    notifications: {
        id: number;
        title: string;
        message: string;
        type: 'assignment' | 'grade' | 'announcement' | 'system';
    }[];
    onClearAll: () => void;
    onViewAll: () => void;
}

const GroupedNotification: React.FC<GroupedNotificationProps> = ({ notifications, onClearAll, onViewAll }) => {
    const [isExpanded, setIsExpanded] = React.useState(false);

    const getTypeSummary = () => {
        const types: Record<string, number> = {};
        notifications.forEach(n => {
            types[n.type] = (types[n.type] || 0) + 1;
        });
        return Object.entries(types).map(([type, count]) => 
            `${count} ${type}${count > 1 ? 's' : ''}`
        ).join(', ');
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -100, scale: 0.9 }}
            animate={{ 
                opacity: 1, 
                x: 0, 
                scale: 1,
                transition: { type: 'spring', stiffness: 400, damping: 28 }
            }}
            exit={{ 
                opacity: 0, 
                x: -80, 
                scale: 0.9,
                transition: { duration: 0.2 }
            }}
            className="bg-white rounded-xl shadow-sm overflow-hidden border border-zinc-200/60"
        >
            {/* Header */}
            <motion.div 
                className="flex items-center gap-2.5 px-3.5 py-2.5 cursor-pointer hover:bg-zinc-50/50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
                whileHover={{ backgroundColor: 'rgba(244, 244, 245, 0.5)' }}
                whileTap={{ scale: 0.99 }}
            >
                <motion.div 
                    className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.05 }}
                >
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                        <path
                            d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"
                            stroke="#3b82f6"
                            strokeWidth={1.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <path
                            d="M13.73 21a2 2 0 01-3.46 0"
                            stroke="#3b82f6"
                            strokeWidth={1.5}
                            strokeLinecap="round"
                        />
                    </svg>
                </motion.div>
                <div className="flex-1 min-w-0">
                    <motion.p 
                        className="text-[13px] font-semibold text-zinc-800"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        {notifications.length} notifications
                    </motion.p>
                    <motion.p 
                        className="text-[11px] text-zinc-500"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.15 }}
                    >
                        {getTypeSummary()}
                    </motion.p>
                </div>
                <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="text-zinc-400"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </motion.div>
            </motion.div>

            {/* Expanded List */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="border-t border-zinc-100 max-h-40 overflow-y-auto">
                            {notifications.map((notif, index) => (
                                <motion.div
                                    key={notif.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.03, type: 'spring', stiffness: 300 }}
                                    className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-zinc-50/50 transition-colors border-b border-zinc-50 last:border-b-0"
                                >
                                    <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                                        <SmallTypeIcon title={notif.title} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[12px] font-medium text-zinc-700 leading-tight">{notif.title}</p>
                                        <p className="text-[10px] text-zinc-400 line-clamp-1">{notif.message}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        
                        {/* Actions */}
                        <div className="flex border-t border-zinc-100">
                            <motion.button
                                onClick={onViewAll}
                                whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.08)' }}
                                whileTap={{ scale: 0.98 }}
                                className="flex-1 py-2 text-[11px] font-medium text-blue-600 transition-colors flex items-center justify-center gap-1.5"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View All
                            </motion.button>
                            <div className="w-px bg-zinc-100" />
                            <motion.button
                                onClick={onClearAll}
                                whileHover={{ backgroundColor: 'rgba(244, 244, 245, 0.8)' }}
                                whileTap={{ scale: 0.98 }}
                                className="flex-1 py-2 text-[11px] font-medium text-zinc-500 hover:text-zinc-700 transition-colors flex items-center justify-center gap-1.5"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Clear All
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// Courses data - defined outside component to prevent recreation
const SIDEBAR_COURSES_DATA = [
    { id: 'cp1', title: "Computer Programming 1 - SY2526-1T", subtitle: "CITE1003 · BSIT101A", image: "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=300&h=200&fit=crop&crop=center", progress: 75 },
    { id: 'euth1', title: "Euthenics 1 - SY2526-1T", subtitle: "STIC1002 · BSIT101A", image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=300&h=200&fit=crop&crop=center", progress: 100 },
    { id: 'itc', title: "Introduction to Computing - SY2526-1T", subtitle: "CITE1004 · BSIT101A", image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&h=200&fit=crop&crop=center", progress: 45 },
    { id: 'nstp1', title: "National Service Training Program 1 - SY2526-1T", subtitle: "NSTP1008 · BSIT101A", image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=300&h=200&fit=crop&crop=center", progress: 30 },
    { id: 'pe1', title: "P.E./PATHFIT 1: Movement Competency Training - SY2526-1T", subtitle: "PHED1005 · BSIT101A", image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=300&h=200&fit=crop&crop=center", progress: 50 },
    { id: 'ppc', title: "Philippine Popular Culture - SY2526-1T", subtitle: "GEDC1041 · BSIT101A", image: "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=300&h=200&fit=crop&crop=center", progress: 40 },
    { id: 'purcom', title: "Purposive Communication - SY2526-1T", subtitle: "GEDC1016 · BSIT101A", image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=300&h=200&fit=crop&crop=center", progress: 65 },
    { id: 'tcw', title: "The Contemporary World - SY2526-1T", subtitle: "GEDC1002 · BSIT101A", image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&h=200&fit=crop&crop=center", progress: 35 },
    { id: 'uts', title: "Understanding the Self - SY2526-1T", subtitle: "GEDC1008 · BSIT101A", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop&crop=center", progress: 55 },
];

// Self-contained Courses Nav Item - manages its own state to prevent parent re-renders
const CoursesNavItem: React.FC<{ 
    onSidebarClose: () => void;
    onCourseSelect: (course: typeof SIDEBAR_COURSES_DATA[0]) => void;
}> = React.memo(({ onSidebarClose, onCourseSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const anchorRef = React.useRef<HTMLDivElement>(null);
    const closeTimeoutRef = React.useRef<number | null>(null);

    const handleMouseEnter = React.useCallback(() => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
        setIsOpen(true);
    }, []);

    const handleMouseLeave = React.useCallback(() => {
        closeTimeoutRef.current = window.setTimeout(() => {
            setIsOpen(false);
        }, 200);
    }, []);

    const handleClose = React.useCallback(() => {
        setIsOpen(false);
    }, []);

    const handleCourseClick = React.useCallback((courseId: string) => {
        const course = SIDEBAR_COURSES_DATA.find(c => c.id === courseId);
        if (course) {
            onCourseSelect(course);
        }
        setIsOpen(false);
        onSidebarClose();
    }, [onSidebarClose, onCourseSelect]);

    React.useEffect(() => {
        return () => {
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
            }
        };
    }, []);

    return (
        <div 
            ref={anchorRef}
            style={{ position: 'relative' }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <a href="#" className="nav-item" onClick={(e) => e.preventDefault()}>
                <div className="nav-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                        <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                    </svg>
                </div>
                <div className="nav-content">
                    <span className="nav-text">Courses</span>
                    <span className="nav-description">Your enrolled classes</span>
                </div>
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="14" 
                    height="14" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    style={{ 
                        marginLeft: 'auto', 
                        color: '#94a3b8',
                        transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.12s ease'
                    }}
                >
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </a>
            {/* Invisible bridge to connect anchor to dropdown - prevents gap hover issues */}
            {isOpen && (
                <div 
                    style={{
                        position: 'absolute',
                        top: 0,
                        right: -20,
                        width: '20px',
                        height: '100%',
                        zIndex: 9999,
                    }}
                    onMouseEnter={handleMouseEnter}
                />
            )}
            <SidebarCoursesDropdown
                isOpen={isOpen}
                onClose={handleClose}
                courses={SIDEBAR_COURSES_DATA}
                onCourseClick={handleCourseClick}
                anchorRef={anchorRef}
            />
        </div>
    );
});

const DashboardPage: React.FC = () => {
    // State for UI toggles
    const [sidebarActive, setSidebarActive] = useState(false);
    const [widgetsSidebarActive, setWidgetsSidebarActive] = useState(false);
    // AI Chat state removed
    const [settingsModalActive, setSettingsModalActive] = useState(false);
    const [welcomeModalActive, setWelcomeModalActive] = useState(false);
    const [tutorialActive, setTutorialActive] = useState(false);
    const [activeView, setActiveView] = useState<'home' | 'tools' | 'course'>('home');
    const [selectedCourse, setSelectedCourse] = useState<{
        id: string;
        title: string;
        subtitle: string;
        image: string;
        progress: number;
    } | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [showIntro, setShowIntro] = useState(() => {
        // Check if intro has already been shown in this session
        return sessionStorage.getItem('dashboardIntroShown') !== 'true';
    });

    // Setup confetti trigger for intro
    useEffect(() => {
        (window as any).triggerConfettiFromIntro = () => {
            setWelcomeModalActive(true);
            setShowConfetti(true);
        };

        return () => {
            delete (window as any).triggerConfettiFromIntro;
        };
    }, []);

    // Notification System - using shared context (synced with ToolbarExpandable)
    const { 
        toastNotifications, 
        dismissToast, 
        clearAllToasts,
        addNotification 
    } = useNotifications();

    // addNotification can be called to add new notifications dynamically
    // For example: addNotification('New Grade', 'You got an A!', 'grade');
    void addNotification; // Suppress unused warning - available for dynamic use

    const closeToast = (id: number) => {
        dismissToast(id);
    };

    // Handlers
    const toggleSidebar = () => setSidebarActive(!sidebarActive);

    const toggleWidgetsSidebar = () => setWidgetsSidebarActive(!widgetsSidebarActive);
    // toggleAIChat removed
    const openSettingsModal = () => setSettingsModalActive(true);
    const closeSettingsModal = () => setSettingsModalActive(false);
    const showWelcomeModal = () => {
        setWelcomeModalActive(true);
        setShowConfetti(false);
    };
    const closeWelcomeModal = () => {
        setWelcomeModalActive(false);
        // Start tutorial after closing welcome modal
        setTimeout(() => setTutorialActive(true), 300);
    };
    const closeTutorial = () => setTutorialActive(false);

    // Widget Logic
    const [widgetVisibility, setWidgetVisibility] = useState<{ [key: string]: boolean }>({
        'groups-widget': true,
        'mastery-widget': true,
        'calendar-widget': true,
        'todo-widget': true,
        'announcements-widget': true,
        'online-widget': true,
    });

    const toggleWidget = (id: string) => {
        setWidgetVisibility((prev: { [key: string]: boolean }) => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const restoreAllWidgets = () => {
        setWidgetVisibility({
            'groups-widget': true,
            'mastery-widget': true,
            'calendar-widget': true,
            'todo-widget': true,
            'announcements-widget': true,
            'online-widget': true,
        });
    };

    const hasHiddenWidgets = Object.values(widgetVisibility).some(visible => !visible);

    // To-do State
    interface TodoItem {
        id: string;
        text: string;
        completed: boolean;
        createdAt: Date;
    }
    const [todos, setTodos] = useState<TodoItem[]>([]);
    const [newTodoText, setNewTodoText] = useState('');
    const [isAddingTodo, setIsAddingTodo] = useState(false);
    const todoInputRef = useRef<HTMLInputElement>(null);

    const addTodo = () => {
        if (!newTodoText.trim()) return;
        const newTodo: TodoItem = {
            id: Date.now().toString(),
            text: newTodoText.trim(),
            completed: false,
            createdAt: new Date()
        };
        setTodos(prev => [newTodo, ...prev]);
        setNewTodoText('');
        setIsAddingTodo(false);
    };

    const toggleTodo = (id: string) => {
        setTodos(prev => prev.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        ));
    };

    const deleteTodo = (id: string) => {
        setTodos(prev => prev.filter(todo => todo.id !== id));
    };

    const completedCount = todos.filter(t => t.completed).length;

    // Focus input when adding todo
    useEffect(() => {
        if (isAddingTodo && todoInputRef.current) {
            todoInputRef.current.focus();
        }
    }, [isAddingTodo]);

    // Mouse proximity detection moved to isolated WidgetsToggleButton component
    // to prevent re-renders of the entire DashboardPage

    // AI Chat Logic - Removed

    return (
        <div className="dashboard-container">
            {/* Header */}
            <header className="header">
                <div className="header-content">
                    <div className="header-left">
                        <motion.button 
                            className="sidebar-toggle" 
                            onClick={toggleSidebar}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <motion.path
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    animate={sidebarActive 
                                        ? { d: "M 5 5 L 19 19" } 
                                        : { d: "M 4 6 L 20 6" }
                                    }
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                />
                                <motion.path
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    animate={sidebarActive 
                                        ? { opacity: 0 } 
                                        : { opacity: 1 }
                                    }
                                    d="M 4 12 L 20 12"
                                    transition={{ duration: 0.2, ease: "easeInOut" }}
                                />
                                <motion.path
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    animate={sidebarActive 
                                        ? { d: "M 5 19 L 19 5" } 
                                        : { d: "M 4 18 L 20 18" }
                                    }
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                />
                            </svg>
                        </motion.button>
                        <div className="logo">
                            {/* STI Logo Image */}
                            <div
                                className="logo-icon-wrapper"
                                style={{
                                    width: 36,
                                    height: 36,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: 8,
                                    overflow: 'hidden',
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                                }}
                            >
                                <img 
                                    src="/file.svg" 
                                    alt="STI Logo" 
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                    }}
                                />
                            </div>
                            
                            {/* Text Logo with ContainerTextFlip */}
                            <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 10, alignItems: 'flex-start' }}>
                                <ContainerTextFlip
                                    words={['eLMS', 'Learn', 'Grow', 'Excel']}
                                    interval={3000}
                                    animationDuration={500}
                                    className="!text-sm !py-1 !px-2 !rounded-md !font-bold"
                                    textClassName="!text-sm"
                                />
                                <span
                                    style={{
                                        fontSize: '0.6rem',
                                        fontWeight: 500,
                                        color: '#94a3b8',
                                        letterSpacing: '0.05em',
                                        textTransform: 'uppercase',
                                        marginTop: 4
                                    }}
                                >
                                    Learning Portal
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="header-center" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: '600px' }}>
                    </div>

                    <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <ToolbarExpandable />
                        <UserProfileDropdown />
                    </div>
                </div>
            </header>

            {/* Sidebar Overlay */}
            <AnimatePresence>
                {sidebarActive && (
                    <motion.div
                        className="sidebar-overlay active"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        onClick={() => setSidebarActive(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <AnimatePresence>
                {sidebarActive && (
                    <motion.aside
                        className="sidebar active"
                        initial={{ x: '-100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '-100%', opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                <nav className="sidebar-nav">
                        <a href="#" className={`nav-item ${activeView === 'home' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveView('home'); setSidebarActive(false); }}>
                            <div className="nav-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                </svg>
                            </div>
                            <div className="nav-content">
                                <span className="nav-text">Home</span>
                                <span className="nav-description">Dashboard overview</span>
                            </div>
                        </a>
                        <CoursesNavItem 
                            onSidebarClose={() => setSidebarActive(false)} 
                            onCourseSelect={(course) => {
                                setSelectedCourse(course);
                                setActiveView('course');
                            }}
                        />
                        <a href="#" className="nav-item">
                            <div className="nav-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 3v18h18"></path>
                                    <path d="m19 9-5 5-4-4-3 3"></path>
                                </svg>
                            </div>
                            <div className="nav-content">
                                <span className="nav-text">Paths</span>
                                <span className="nav-description">Learning journeys</span>
                            </div>
                        </a>
                        <a href="#" className="nav-item">
                            <div className="nav-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <circle cx="12" cy="12" r="6"></circle>
                                    <circle cx="12" cy="12" r="2"></circle>
                                </svg>
                            </div>
                            <div className="nav-content">
                                <span className="nav-text">Goals</span>
                                <span className="nav-description">Track progress</span>
                            </div>
                        </a>
                        <a href="#" className="nav-item">
                            <div className="nav-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="9" cy="7" r="4"></circle>
                                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                </svg>
                            </div>
                            <div className="nav-content">
                                <span className="nav-text">Groups</span>
                                <span className="nav-description">Collaborate together</span>
                            </div>
                        </a>
                        <a href="#" className="nav-item">
                            <div className="nav-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect width="7" height="7" x="3" y="3" rx="1"></rect>
                                    <rect width="7" height="7" x="14" y="3" rx="1"></rect>
                                    <rect width="7" height="7" x="14" y="14" rx="1"></rect>
                                    <rect width="7" height="7" x="3" y="14" rx="1"></rect>
                                </svg>
                            </div>
                            <div className="nav-content">
                                <span className="nav-text">Catalog</span>
                                <span className="nav-description">Browse all courses</span>
                            </div>
                        </a>
                        <a href="#" className="nav-item">
                            <div className="nav-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                            </div>
                            <div className="nav-content">
                                <span className="nav-text">Users</span>
                                <span className="nav-description">Manage accounts</span>
                            </div>
                        </a>
                        <a href="#" className={`nav-item ${activeView === 'tools' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveView('tools'); setSidebarActive(false); }}>
                            <div className="nav-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                                </svg>
                            </div>
                            <div className="nav-content">
                                <span className="nav-text">Tools</span>
                                <span className="nav-description">Productivity utilities</span>
                            </div>
                        </a>
                </nav>

                <div className="sidebar-bottom">
                        <a href="#" className="nav-item" id="settingsButton" onClick={openSettingsModal}>
                            <div className="nav-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path
                                        d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z">
                                    </path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                            </div>
                            <div className="nav-content">
                                <span className="nav-text">Settings</span>
                                <span className="nav-description">Preferences</span>
                            </div>
                        </a>
                        <a href="#" className="nav-item">
                            <div className="nav-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                                    <path d="M12 17h.01"></path>
                                </svg>
                            </div>
                            <div className="nav-content">
                                <span className="nav-text">Help</span>
                                <span className="nav-description">Support center</span>
                            </div>
                        </a>
                </div>
            </motion.aside>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="main-content">
                <AnimatePresence mode="wait">
                    {activeView === 'home' && (
                        <motion.div
                            key="home"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <HomeContent onShowWelcomeModal={showWelcomeModal} />
                        </motion.div>
                    )}
                    {activeView === 'tools' && (
                        <motion.div
                            key="tools"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <ToolsContent />
                        </motion.div>
                    )}
                    {activeView === 'course' && selectedCourse && (
                        <motion.div
                            key="course"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="h-full"
                        >
                            <CourseViewPage 
                                course={selectedCourse} 
                                onBack={() => {
                                    setActiveView('home');
                                    setSelectedCourse(null);
                                }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>





            {/* Widgets Sidebar */}
            <aside className={`widgets-sidebar ${widgetsSidebarActive ? 'active' : ''}`} id="widgets-sidebar">
                {/* Floating Widgets Toggle Button - Isolated component for performance */}
                <WidgetsToggleButton 
                    isWidgetsSidebarActive={widgetsSidebarActive}
                    onToggle={toggleWidgetsSidebar}
                />

                <div className="widgets-content" id="widgets-content-area">
                    <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-100">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                            </svg>
                            <h2 className="text-base font-semibold text-zinc-800">Dashboard</h2>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={toggleWidgetsSidebar}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </motion.button>
                    </div>

                    {/* Restore Widgets Button - Minimalistic */}
                    <AnimatePresence>
                        {hasHiddenWidgets && (
                            <motion.button
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                onClick={restoreAllWidgets}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-blue-500 hover:text-blue-600 hover:bg-blue-50/50 transition-colors border-b border-zinc-100"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Show Hidden Widgets
                            </motion.button>
                        )}
                    </AnimatePresence>

                    {/* Quick Stats Card - Student Overview */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="mx-3 mt-3 p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-blue-100">This Week</span>
                            <motion.div
                                whileHover={{ rotate: 180 }}
                                transition={{ duration: 0.3 }}
                                className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center cursor-pointer"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </motion.div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="text-center"
                            >
                                <div className="text-2xl font-bold">9</div>
                                <div className="text-[10px] text-blue-100">Courses</div>
                            </motion.div>
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="text-center border-x border-white/20"
                            >
                                <div className="text-2xl font-bold">0</div>
                                <div className="text-[10px] text-blue-100">Due Soon</div>
                            </motion.div>
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="text-center"
                            >
                                <div className="text-2xl font-bold">52%</div>
                                <div className="text-[10px] text-blue-100">Progress</div>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Study Streak - Gamification */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, ease: 'easeOut', delay: 0.03 }}
                        className="mx-3 mt-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100/50"
                    >
                        <div className="flex items-center gap-3">
                            <motion.div
                                animate={{ rotate: [0, -10, 10, -10, 0] }}
                                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                                className="text-2xl"
                            >
                                🔥
                            </motion.div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-amber-800">3 Day Streak!</span>
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', delay: 0.5 }}
                                        className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-200/50 text-amber-700"
                                    >
                                        +15 XP
                                    </motion.span>
                                </div>
                                <p className="text-[11px] text-amber-600/80">Keep it up! Log in tomorrow to continue.</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Upcoming Deadlines - Student Priority */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut', delay: 0.05 }}
                        className="mx-3 mt-3 bg-white rounded-xl border border-zinc-100 overflow-hidden"
                    >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-50">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <span className="text-sm font-medium text-zinc-800">Upcoming</span>
                            </div>
                            <span className="text-xs text-zinc-400">Next 7 days</span>
                        </div>
                        <div className="p-3 space-y-2">
                            <motion.div
                                whileHover={{ x: 4 }}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-50 cursor-pointer transition-colors"
                            >
                                <div className="w-2 h-2 rounded-full bg-red-400" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-zinc-700 truncate">Quiz: Programming Basics</p>
                                    <p className="text-[10px] text-zinc-400">Computer Programming 1</p>
                                </div>
                                <span className="text-[10px] font-medium text-red-500">Tomorrow</span>
                            </motion.div>
                            <motion.div
                                whileHover={{ x: 4 }}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-50 cursor-pointer transition-colors"
                            >
                                <div className="w-2 h-2 rounded-full bg-amber-400" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-zinc-700 truncate">Assignment: Essay Draft</p>
                                    <p className="text-[10px] text-zinc-400">Purposive Communication</p>
                                </div>
                                <span className="text-[10px] font-medium text-amber-500">3 days</span>
                            </motion.div>
                            <motion.div
                                whileHover={{ x: 4 }}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-50 cursor-pointer transition-colors"
                            >
                                <div className="w-2 h-2 rounded-full bg-blue-400" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-zinc-700 truncate">Performance Task</p>
                                    <p className="text-[10px] text-zinc-400">Philippine Popular Culture</p>
                                </div>
                                <span className="text-[10px] font-medium text-blue-500">5 days</span>
                            </motion.div>
                        </div>
                        <motion.a
                            href="#"
                            whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                            className="flex items-center justify-center gap-1.5 py-2.5 border-t border-zinc-50 text-xs text-blue-500 transition-colors"
                        >
                            View all deadlines
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </motion.a>
                    </motion.div>

                    {/* Section Divider */}
                    <div className="mx-3 mt-4 mb-2 flex items-center gap-2">
                        <div className="h-px flex-1 bg-zinc-100" />
                        <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Widgets</span>
                        <div className="h-px flex-1 bg-zinc-100" />
                    </div>

                    {/* Widget Container with staggered animations */}
                    <div className="px-3 space-y-3">
                        {/* Groups Widget - Minimalistic */}
                    <AnimatePresence>
                        {widgetVisibility['groups-widget'] && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10, transition: { duration: 0.15 } }}
                                transition={{ duration: 0.2, ease: 'easeOut' }}
                                className="bg-white rounded-xl border border-zinc-100 overflow-hidden"
                                id="groups-widget"
                            >
                                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-50">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        </div>
                                        <span className="text-sm font-medium text-zinc-800">Groups</span>
                                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-500">0</span>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => toggleWidget('groups-widget')}
                                        className="w-6 h-6 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </motion.button>
                                </div>
                                <div className="px-4 py-8 flex flex-col items-center justify-center">
                                    <div className="w-12 h-12 rounded-full bg-zinc-50 flex items-center justify-center mb-3">
                                        <svg className="w-6 h-6 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm text-zinc-400">No groups yet</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Mastery Widget - Minimalistic */}
                    <AnimatePresence>
                        {widgetVisibility['mastery-widget'] && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10, transition: { duration: 0.15 } }}
                                transition={{ duration: 0.2, ease: 'easeOut', delay: 0.05 }}
                                className="bg-white rounded-xl border border-zinc-100 overflow-hidden"
                                id="mastery-widget"
                            >
                                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-50">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                                            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                        </div>
                                        <span className="text-sm font-medium text-zinc-800">Mastery</span>
                                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-500">0</span>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => toggleWidget('mastery-widget')}
                                        className="w-6 h-6 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </motion.button>
                                </div>
                                <div className="px-4 py-8 flex flex-col items-center justify-center">
                                    <div className="w-12 h-12 rounded-full bg-zinc-50 flex items-center justify-center mb-3">
                                        <svg className="w-6 h-6 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm text-zinc-400">No mastery data</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Calendar Widget - Minimalistic */}
                    <AnimatePresence>
                        {widgetVisibility['calendar-widget'] && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10, transition: { duration: 0.15 } }}
                                transition={{ duration: 0.2, ease: 'easeOut', delay: 0.1 }}
                                className="bg-white rounded-xl border border-zinc-100 overflow-hidden"
                                id="calendar-widget"
                            >
                                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-50">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                                            <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <span className="text-sm font-medium text-zinc-800">Calendar</span>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => toggleWidget('calendar-widget')}
                                        className="w-6 h-6 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </motion.button>
                                </div>
                                <div className="p-3">
                                    <div className="flex items-center justify-between mb-3">
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </motion.button>
                                        <span className="text-sm font-medium text-zinc-700">Nov 2025</span>
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </motion.button>
                                    </div>
                                    <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
                                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                                            <div key={i} className="text-[10px] font-medium text-zinc-400 py-1">{day}</div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-7 gap-0.5 text-center">
                                        {[26, 27, 28, 29, 30, 31, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 1, 2, 3, 4, 5, 6].map((day, i) => {
                                            const isPrevMonth = i < 6;
                                            const isNextMonth = i > 35;
                                            const isToday = day === 30 && !isPrevMonth && !isNextMonth;
                                            return (
                                                <motion.div
                                                    key={i}
                                                    whileHover={{ scale: 1.15 }}
                                                    className={`text-xs py-1.5 rounded-md cursor-pointer transition-colors ${
                                                        isPrevMonth || isNextMonth
                                                            ? 'text-zinc-300'
                                                            : isToday
                                                            ? 'bg-blue-500 text-white font-medium'
                                                            : 'text-zinc-600 hover:bg-zinc-100'
                                                    }`}
                                                >
                                                    {day}
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-zinc-50">
                                        <motion.a
                                            href="#"
                                            whileHover={{ scale: 1.02 }}
                                            className="text-xs text-blue-500 hover:text-blue-600 transition-colors"
                                        >
                                            Full calendar
                                        </motion.a>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* To-do Widget - Functional Minimalistic */}
                    <AnimatePresence>
                        {widgetVisibility['todo-widget'] && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10, transition: { duration: 0.15 } }}
                                transition={{ duration: 0.2, ease: 'easeOut', delay: 0.15 }}
                                className="bg-white rounded-xl border border-zinc-100 overflow-hidden"
                                id="todo-widget"
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-50">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                                            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <span className="text-sm font-medium text-zinc-800">To-do</span>
                                        <motion.span
                                            key={todos.length}
                                            initial={{ scale: 1.2 }}
                                            animate={{ scale: 1 }}
                                            className="text-xs px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-500"
                                        >
                                            {todos.length}
                                        </motion.span>
                                        {completedCount > 0 && (
                                            <motion.span
                                                initial={{ opacity: 0, x: -5 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="text-[10px] text-emerald-500"
                                            >
                                                {completedCount} done
                                            </motion.span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setIsAddingTodo(true)}
                                            className="w-6 h-6 flex items-center justify-center rounded-md text-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => toggleWidget('todo-widget')}
                                            className="w-6 h-6 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </motion.button>
                                    </div>
                                </div>

                                {/* Add Todo Input */}
                                <AnimatePresence>
                                    {isAddingTodo && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden border-b border-zinc-50"
                                        >
                                            <div className="p-3 flex items-center gap-2">
                                                <input
                                                    ref={todoInputRef}
                                                    type="text"
                                                    value={newTodoText}
                                                    onChange={(e) => setNewTodoText(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') addTodo();
                                                        if (e.key === 'Escape') {
                                                            setIsAddingTodo(false);
                                                            setNewTodoText('');
                                                        }
                                                    }}
                                                    placeholder="What needs to be done?"
                                                    className="flex-1 text-sm bg-zinc-50 rounded-lg px-3 py-2 border-none outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-zinc-400"
                                                />
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={addTodo}
                                                    disabled={!newTodoText.trim()}
                                                    className="px-3 py-2 text-xs font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    Add
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => {
                                                        setIsAddingTodo(false);
                                                        setNewTodoText('');
                                                    }}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Todo List */}
                                <div className="max-h-64 overflow-y-auto">
                                    {todos.length === 0 ? (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="px-4 py-8 flex flex-col items-center justify-center"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-zinc-50 flex items-center justify-center mb-3">
                                                <svg className="w-6 h-6 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <p className="text-sm text-zinc-400 mb-2">No tasks yet</p>
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setIsAddingTodo(true)}
                                                className="text-xs text-blue-500 hover:text-blue-600 transition-colors"
                                            >
                                                + Add your first task
                                            </motion.button>
                                        </motion.div>
                                    ) : (
                                        <motion.ul layout className="p-2 space-y-1">
                                            <AnimatePresence mode="popLayout">
                                                {todos.map((todo) => (
                                                    <motion.li
                                                        key={todo.id}
                                                        layout
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: 20, transition: { duration: 0.15 } }}
                                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                        className="group flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-50 transition-colors"
                                                    >
                                                        {/* Checkbox */}
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={() => toggleTodo(todo.id)}
                                                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                                                todo.completed
                                                                    ? 'bg-emerald-500 border-emerald-500'
                                                                    : 'border-zinc-300 hover:border-emerald-400'
                                                            }`}
                                                        >
                                                            <AnimatePresence>
                                                                {todo.completed && (
                                                                    <motion.svg
                                                                        initial={{ scale: 0 }}
                                                                        animate={{ scale: 1 }}
                                                                        exit={{ scale: 0 }}
                                                                        className="w-3 h-3 text-white"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                    </motion.svg>
                                                                )}
                                                            </AnimatePresence>
                                                        </motion.button>

                                                        {/* Text */}
                                                        <span
                                                            className={`flex-1 text-sm transition-all ${
                                                                todo.completed
                                                                    ? 'text-zinc-400 line-through'
                                                                    : 'text-zinc-700'
                                                            }`}
                                                        >
                                                            {todo.text}
                                                        </span>

                                                        {/* Delete button */}
                                                        <motion.button
                                                            initial={{ opacity: 0 }}
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={() => deleteTodo(todo.id)}
                                                            className="w-6 h-6 flex items-center justify-center rounded-md text-zinc-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </motion.button>
                                                    </motion.li>
                                                ))}
                                            </AnimatePresence>
                                        </motion.ul>
                                    )}
                                </div>

                                {/* Progress Footer */}
                                {todos.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="px-3 py-2 border-t border-zinc-50 bg-zinc-50/50"
                                    >
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[10px] text-zinc-400">
                                                {completedCount} of {todos.length} completed
                                            </span>
                                            {completedCount === todos.length && todos.length > 0 && (
                                                <motion.span
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="text-[10px] text-emerald-500 font-medium"
                                                >
                                                    🎉 All done!
                                                </motion.span>
                                            )}
                                        </div>
                                        <div className="h-1 bg-zinc-200 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${todos.length > 0 ? (completedCount / todos.length) * 100 : 0}%` }}
                                                transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                                                className="h-full bg-emerald-500 rounded-full"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Announcements Widget - Minimalistic */}
                    <AnimatePresence>
                        {widgetVisibility['announcements-widget'] && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10, transition: { duration: 0.15 } }}
                                transition={{ duration: 0.2, ease: 'easeOut', delay: 0.2 }}
                                className="bg-white rounded-xl border border-zinc-100 overflow-hidden"
                                id="announcements-widget"
                            >
                                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-50">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                                            <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                            </svg>
                                        </div>
                                        <span className="text-sm font-medium text-zinc-800">Announcements</span>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => toggleWidget('announcements-widget')}
                                        className="w-6 h-6 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </motion.button>
                                </div>
                                <div className="px-4 py-4 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                                        </svg>
                                    </div>
                                    <span className="text-sm text-zinc-400">No announcements</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Online Widget - Minimalistic */}
                    <AnimatePresence>
                        {widgetVisibility['online-widget'] && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10, transition: { duration: 0.15 } }}
                                transition={{ duration: 0.2, ease: 'easeOut', delay: 0.25 }}
                                className="bg-white rounded-xl border border-zinc-100 overflow-hidden"
                                id="online-widget"
                            >
                                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-50">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                        </div>
                                        <span className="text-sm font-medium text-zinc-800">Online</span>
                                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-500">0</span>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => toggleWidget('online-widget')}
                                        className="w-6 h-6 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </motion.button>
                                </div>
                                <div className="px-4 py-8 flex flex-col items-center justify-center">
                                    <div className="w-12 h-12 rounded-full bg-zinc-50 flex items-center justify-center mb-3">
                                        <svg className="w-6 h-6 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                        </svg>
                                    </div>
                                    <p className="text-sm text-zinc-400">No users online</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    </div>

                    {/* Quick Actions Footer */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="mx-3 mt-4 mb-3"
                    >
                        <div className="flex items-center gap-2">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-zinc-600 text-xs font-medium transition-colors"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Settings
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-medium transition-colors"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Help
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            </aside>

            {/* AI Chatbot - Removed */}

            <SettingsModal isOpen={settingsModalActive} onClose={closeSettingsModal} />

            <WelcomeModal isOpen={welcomeModalActive} onClose={closeWelcomeModal} />
            <DashboardTutorial 
                isOpen={tutorialActive} 
                onClose={closeTutorial} 
                onToggleWidgetsSidebar={(open) => setWidgetsSidebarActive(open)}
            />
            <Confetti active={showConfetti} />

            {/* Dashboard Intro - shows only once per session */}
            {showIntro && <DashboardIntro onComplete={() => setShowIntro(false)} />}

            {/* Toast Notifications Container - Compact Design on Left Side */}
            <div className="fixed top-20 left-4 z-[10001] w-[300px] max-w-[calc(100vw-2rem)] flex flex-col gap-2.5">
                <AnimatePresence mode="popLayout">
                    {toastNotifications.length > 3 ? (
                        <GroupedNotification
                            key="grouped"
                            notifications={toastNotifications.map(n => ({
                                id: n.id,
                                title: n.title,
                                message: n.message,
                                type: n.type || 'assignment'
                            }))}
                            onClearAll={clearAllToasts}
                            onViewAll={() => {
                                // Could open a notification panel or navigate
                                console.log('View all notifications');
                            }}
                        />
                    ) : (
                        toastNotifications.map(notification => (
                            <NotificationItem
                                key={notification.id}
                                notification={{
                                    id: notification.id,
                                    title: notification.title,
                                    message: notification.message,
                                    type: notification.type || 'assignment'
                                }}
                                onClose={closeToast}
                            />
                        ))
                    )}
                </AnimatePresence>
            </div>



            {/* Floating Dock - Hidden when in course view */}
            <AnimatePresence>
                {activeView !== 'course' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="floating-dock-container fixed bottom-8 left-0 right-0 z-[900] flex justify-center pointer-events-none"
                    >
                        <div className="pointer-events-auto">
                        <Dock
                            direction="bottom"
                            iconSize={40}
                            iconMagnification={70}
                            iconDistance={150}
                            className="mt-0 bg-white border-blue-700 shadow-xl shadow-blue-900/20"
                        >
                            <DockIcon className="bg-white border border-blue-700" title="Continue Learning">
                                <a href="#" className="flex items-center justify-center w-full h-full">
                                    <lord-icon
                                        src="https://cdn.lordicon.com/rrbmabsx.json"
                                        trigger="hover"
                                        colors="primary:#1d4ed8,secondary:#eab308"
                                        style={{ width: '24px', height: '24px' }}
                                    />
                                </a>
                            </DockIcon>
                            <DockIcon className="bg-white border border-blue-700" title="Assignments">
                                <a href="#" className="flex items-center justify-center w-full h-full">
                                    <lord-icon
                                        src="https://cdn.lordicon.com/hmpomorl.json"
                                        trigger="hover"
                                        colors="primary:#1d4ed8,secondary:#eab308"
                                        style={{ width: '24px', height: '24px' }}
                                    />
                                </a>
                            </DockIcon>
                            <DockIcon className="bg-white border border-blue-700" title="Classes">
                                <a href="#" className="flex items-center justify-center w-full h-full">
                                    <lord-icon
                                        src="https://cdn.lordicon.com/psyssele.json"
                                        trigger="hover"
                                        state="hover-snooze"
                                        colors="primary:#1d4ed8,secondary:#eab308"
                                        style={{ width: '24px', height: '24px' }}
                                    />
                                </a>
                            </DockIcon>
                            <DockIcon className="bg-white border border-blue-700" title="Discussion">
                                <a href="#" className="flex items-center justify-center w-full h-full">
                                    <lord-icon
                                        src="https://cdn.lordicon.com/jdgfsfzr.json"
                                        trigger="hover"
                                        colors="primary:#1d4ed8,secondary:#eab308"
                                        style={{ width: '24px', height: '24px' }}
                                    />
                                </a>
                            </DockIcon>
                        </Dock>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>


        </div >
    );
};

export default DashboardPage;
