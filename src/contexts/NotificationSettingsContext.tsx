/**
 * Notification Settings Context
 * Provides shared notification settings across the app
 * Settings are persisted to localStorage
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

// ============================================
// TYPES
// ============================================
export interface NotificationSettings {
    emailSubmissions: boolean;
    emailDeadlines: boolean;
    pushNotifications: boolean;
    weeklySummary: boolean;
}

interface NotificationSettingsContextType {
    settings: NotificationSettings;
    updateSetting: <K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) => void;
    resetToDefaults: () => void;
    // Helper to check if push notifications are enabled and supported
    isPushEnabled: boolean;
    requestPushPermission: () => Promise<boolean>;
}

// ============================================
// DEFAULTS
// ============================================
const DEFAULT_SETTINGS: NotificationSettings = {
    emailSubmissions: true,
    emailDeadlines: true,
    pushNotifications: false,
    weeklySummary: true,
};

const STORAGE_KEY = 'app_notification_settings';

// ============================================
// CONTEXT
// ============================================
const NotificationSettingsContext = createContext<NotificationSettingsContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================
export const NotificationSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<NotificationSettings>(() => {
        // Load from localStorage on init
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
            }
        } catch (e) {
            console.error('Failed to load notification settings:', e);
        }
        return DEFAULT_SETTINGS;
    });

    // Persist to localStorage when settings change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error('Failed to save notification settings:', e);
        }
    }, [settings]);

    // Handle push notification permission when enabled
    useEffect(() => {
        if (settings.pushNotifications && 'Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }
    }, [settings.pushNotifications]);

    const updateSetting = useCallback(<K extends keyof NotificationSettings>(
        key: K, 
        value: NotificationSettings[K]
    ) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    }, []);

    const resetToDefaults = useCallback(() => {
        setSettings(DEFAULT_SETTINGS);
    }, []);

    // Request push notification permission
    const requestPushPermission = useCallback(async (): Promise<boolean> => {
        if (!('Notification' in window)) {
            console.warn('Push notifications not supported');
            return false;
        }
        
        try {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        } catch (e) {
            console.error('Failed to request push permission:', e);
            return false;
        }
    }, []);

    // Check if push is actually enabled (setting + permission)
    const isPushEnabled = useMemo(() => {
        if (!settings.pushNotifications) return false;
        if (!('Notification' in window)) return false;
        return Notification.permission === 'granted';
    }, [settings.pushNotifications]);

    const contextValue = useMemo(() => ({
        settings,
        updateSetting,
        resetToDefaults,
        isPushEnabled,
        requestPushPermission,
    }), [settings, updateSetting, resetToDefaults, isPushEnabled, requestPushPermission]);

    return (
        <NotificationSettingsContext.Provider value={contextValue}>
            {children}
        </NotificationSettingsContext.Provider>
    );
};

// ============================================
// HOOK
// ============================================
export const useNotificationSettings = (): NotificationSettingsContextType => {
    const context = useContext(NotificationSettingsContext);
    if (!context) {
        throw new Error('useNotificationSettings must be used within a NotificationSettingsProvider');
    }
    return context;
};

// ============================================
// UTILITY: Send push notification
// ============================================
export const sendPushNotification = (title: string, options?: NotificationOptions): void => {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    
    try {
        new Notification(title, {
            icon: '/images/owl-logo.png',
            badge: '/images/owl-logo.png',
            ...options,
        });
    } catch (e) {
        console.error('Failed to send push notification:', e);
    }
};

export default NotificationSettingsContext;
