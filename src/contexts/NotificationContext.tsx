import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { getSettings } from '../services/profileService';

// Shared notification types
export type NotificationCategory = 'all' | 'assignment' | 'quiz' | 'announcement';

export interface Notification {
    id: number;
    teacher?: string;
    title: string;
    message: string;
    isRead: boolean;
    timestamp: Date;
    category: NotificationCategory;
    type?: 'assignment' | 'grade' | 'announcement' | 'system'; // For toast compatibility
}

// Storage keys
const STORAGE_KEYS = {
    READ_IDS: 'notification_read_ids',
    DISMISSED_TOAST_IDS: 'notification_dismissed_toast_ids',
    DELETED_IDS: 'notification_deleted_ids'
};

// Helper to get stored IDs from localStorage
const getStoredIds = (key: string): Set<number> => {
    try {
        const stored = localStorage.getItem(key);
        if (stored) {
            return new Set(JSON.parse(stored));
        }
    } catch (e) {
        console.error('Error reading from localStorage:', e);
    }
    return new Set();
};

// Helper to save IDs to localStorage
const saveStoredIds = (key: string, ids: Set<number>) => {
    try {
        localStorage.setItem(key, JSON.stringify([...ids]));
    } catch (e) {
        console.error('Error saving to localStorage:', e);
    }
};

// Initial notifications data - single source of truth
const BASE_NOTIFICATIONS: Notification[] = [
    { id: 1, title: 'Assignment Pending', message: 'Complete your Mathematics assignment before the deadline', isRead: false, timestamp: new Date(Date.now() - 5 * 60000), category: 'assignment', type: 'assignment' },
    { id: 2, title: 'Quiz Pending', message: 'Computer Science quiz available - complete before Friday', isRead: false, timestamp: new Date(Date.now() - 30 * 60000), category: 'quiz', type: 'assignment' },
    { id: 3, title: 'Performance Task Pending', message: 'Submit your English presentation by next week', isRead: false, timestamp: new Date(Date.now() - 2 * 3600000), category: 'assignment', type: 'assignment' },
    { id: 4, teacher: 'Prof. Johnson', title: 'New Assignment Added', message: 'Added "Chapter 5 Review" assignment', isRead: true, timestamp: new Date(Date.now() - 24 * 3600000), category: 'assignment', type: 'assignment' },
    { id: 5, teacher: 'Prof. Smith', title: 'New Quiz Added', message: 'Created "Physics Fundamentals" quiz', isRead: true, timestamp: new Date(Date.now() - 2 * 24 * 3600000), category: 'quiz', type: 'assignment' },
    { id: 6, teacher: 'Prof. Williams', title: 'Campus Event Tomorrow', message: 'Don\'t forget the tech symposium at 2PM', isRead: true, timestamp: new Date(Date.now() - 5 * 24 * 3600000), category: 'announcement', type: 'announcement' },
];

// Get initial notifications with persisted read state
const getInitialNotifications = (): Notification[] => {
    const readIds = getStoredIds(STORAGE_KEYS.READ_IDS);
    const deletedIds = getStoredIds(STORAGE_KEYS.DELETED_IDS);
    
    return BASE_NOTIFICATIONS
        .filter(n => !deletedIds.has(n.id))
        .map(n => ({
            ...n,
            isRead: n.isRead || readIds.has(n.id)
        }));
};

// Export for compatibility
export const INITIAL_NOTIFICATIONS = BASE_NOTIFICATIONS;

interface NotificationContextType {
    // All notifications (for toolbar)
    notifications: Notification[];
    setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
    
    // Toast notifications (unread ones shown as popups)
    toastNotifications: Notification[];
    
    // Actions
    dismissNotification: (id: number) => void;
    dismissToast: (id: number) => void;
    markAsRead: (id: number) => void;
    markAllAsRead: () => void;
    clearAllNotifications: () => void;
    clearAllToasts: () => void;
    addNotification: (title: string, message: string, type: 'assignment' | 'grade' | 'announcement' | 'system') => void;
    
    // Counts
    unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    // Initialize with persisted state
    const [notifications, setNotifications] = useState<Notification[]>(() => getInitialNotifications());
    const [dismissedToastIds, setDismissedToastIds] = useState<Set<number>>(() => getStoredIds(STORAGE_KEYS.DISMISSED_TOAST_IDS));
    const nextIdRef = useRef(100);

    // Persist read IDs whenever notifications change
    useEffect(() => {
        const readIds = new Set(notifications.filter(n => n.isRead).map(n => n.id));
        saveStoredIds(STORAGE_KEYS.READ_IDS, readIds);
    }, [notifications]);

    // Persist dismissed toast IDs
    useEffect(() => {
        saveStoredIds(STORAGE_KEYS.DISMISSED_TOAST_IDS, dismissedToastIds);
    }, [dismissedToastIds]);

    // Toast notifications are unread notifications that haven't been dismissed as toasts
    const toastNotifications = notifications.filter(n => !n.isRead && !dismissedToastIds.has(n.id));

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const dismissNotification = useCallback((id: number) => {
        // Also persist deleted IDs
        const deletedIds = getStoredIds(STORAGE_KEYS.DELETED_IDS);
        deletedIds.add(id);
        saveStoredIds(STORAGE_KEYS.DELETED_IDS, deletedIds);
        
        setNotifications(prev => prev.filter(n => n.id !== id));
        setDismissedToastIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    }, []);

    const dismissToast = useCallback((id: number) => {
        // Only dismiss from toast view, keep in notification list
        // Also mark as read so it won't show again on refresh
        setDismissedToastIds(prev => new Set(prev).add(id));
        // Mark as read when dismissing toast
        setNotifications(prev => prev.map(n => 
            n.id === id ? { ...n, isRead: true } : n
        ));
    }, []);

    const markAsRead = useCallback((id: number) => {
        setNotifications(prev => prev.map(n => 
            n.id === id ? { ...n, isRead: true } : n
        ));
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }, []);

    const clearAllNotifications = useCallback(() => {
        // Persist all current IDs as deleted
        const deletedIds = getStoredIds(STORAGE_KEYS.DELETED_IDS);
        notifications.forEach(n => deletedIds.add(n.id));
        saveStoredIds(STORAGE_KEYS.DELETED_IDS, deletedIds);
        
        setNotifications([]);
        setDismissedToastIds(new Set());
    }, [notifications]);

    const clearAllToasts = useCallback(() => {
        // Mark all current toast notifications as read (so they won't show on refresh)
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        // Also dismiss them from current view
        const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
        setDismissedToastIds(prev => new Set([...prev, ...unreadIds]));
    }, [notifications]);

    const addNotification = useCallback((title: string, message: string, type: 'assignment' | 'grade' | 'announcement' | 'system') => {
        const settings = getSettings();
        
        // Check if this type of notification is enabled
        if (type === 'assignment' && !settings.assignmentAlerts) return;
        if (type === 'grade' && !settings.gradeUpdates) return;
        if (type === 'announcement' && !settings.courseReminders) return;

        const categoryMap: Record<string, NotificationCategory> = {
            'assignment': 'assignment',
            'grade': 'assignment',
            'announcement': 'announcement',
            'system': 'announcement'
        };

        const newNotification: Notification = {
            id: nextIdRef.current++,
            title,
            message,
            isRead: false,
            timestamp: new Date(),
            category: categoryMap[type] || 'announcement',
            type
        };

        setNotifications(prev => [...prev, newNotification]);

        // Browser notification if enabled
        if (settings.pushNotifications && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body: message, icon: '/vite.svg' });
        }
    }, []);

    return (
        <NotificationContext.Provider value={{
            notifications,
            setNotifications,
            toastNotifications,
            dismissNotification,
            dismissToast,
            markAsRead,
            markAllAsRead,
            clearAllNotifications,
            clearAllToasts,
            addNotification,
            unreadCount
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
