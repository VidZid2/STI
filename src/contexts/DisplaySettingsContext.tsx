/**
 * Display Settings Context
 * Provides shared display settings across the app
 * Settings are persisted to localStorage
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

// ============================================
// TYPES
// ============================================
export interface DisplaySettings {
    compactView: boolean;
    showAvatars: boolean;
    animations: boolean;
    hideCustomCursor: boolean;
}

interface DisplaySettingsContextType {
    settings: DisplaySettings;
    updateSetting: <K extends keyof DisplaySettings>(key: K, value: DisplaySettings[K]) => void;
    resetToDefaults: () => void;
    // Animation helpers
    getMotionProps: (props: MotionAnimationProps) => MotionAnimationProps | Record<string, never>;
    shouldAnimate: boolean;
    // Compact view helpers
    getSpacing: (normal: number | string, compact: number | string) => number | string;
    // Avatar helpers
    shouldShowAvatar: boolean;
}

// Motion animation props type
interface MotionAnimationProps {
    initial?: Record<string, unknown>;
    animate?: Record<string, unknown>;
    exit?: Record<string, unknown>;
    whileHover?: Record<string, unknown>;
    whileTap?: Record<string, unknown>;
    transition?: Record<string, unknown>;
    [key: string]: unknown;
}

// ============================================
// DEFAULTS
// ============================================
const DEFAULT_SETTINGS: DisplaySettings = {
    compactView: false,
    showAvatars: true,
    animations: true,
    hideCustomCursor: true,
};

const STORAGE_KEY = 'app_display_settings';

// ============================================
// CONTEXT
// ============================================
const DisplaySettingsContext = createContext<DisplaySettingsContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================
export const DisplaySettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<DisplaySettings>(() => {
        // Load from localStorage on init
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
            }
        } catch (e) {
            console.error('Failed to load display settings:', e);
        }
        return DEFAULT_SETTINGS;
    });

    // Persist to localStorage when settings change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error('Failed to save display settings:', e);
        }
    }, [settings]);

    // Apply global CSS classes based on settings
    useEffect(() => {
        const root = document.documentElement;
        
        // Animations class
        if (settings.animations) {
            root.classList.remove('reduce-motion');
        } else {
            root.classList.add('reduce-motion');
        }
        
        // Compact view class
        if (settings.compactView) {
            root.classList.add('compact-view');
        } else {
            root.classList.remove('compact-view');
        }
        
        // Hide avatars class
        if (settings.showAvatars) {
            root.classList.remove('hide-avatars');
        } else {
            root.classList.add('hide-avatars');
        }
    }, [settings.animations, settings.compactView, settings.showAvatars]);

    const updateSetting = useCallback(<K extends keyof DisplaySettings>(
        key: K, 
        value: DisplaySettings[K]
    ) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    }, []);

    const resetToDefaults = useCallback(() => {
        setSettings(DEFAULT_SETTINGS);
    }, []);

    // Helper to conditionally return motion props
    const getMotionProps = useCallback((props: MotionAnimationProps): MotionAnimationProps | Record<string, never> => {
        if (!settings.animations) {
            return {};
        }
        return props;
    }, [settings.animations]);

    // Helper for compact spacing
    const getSpacing = useCallback((normal: number | string, compact: number | string): number | string => {
        return settings.compactView ? compact : normal;
    }, [settings.compactView]);

    const contextValue = useMemo(() => ({
        settings,
        updateSetting,
        resetToDefaults,
        getMotionProps,
        shouldAnimate: settings.animations,
        getSpacing,
        shouldShowAvatar: settings.showAvatars,
    }), [settings, updateSetting, resetToDefaults, getMotionProps, getSpacing]);

    return (
        <DisplaySettingsContext.Provider value={contextValue}>
            {children}
        </DisplaySettingsContext.Provider>
    );
};

// ============================================
// HOOK
// ============================================
export const useDisplaySettings = (): DisplaySettingsContextType => {
    const context = useContext(DisplaySettingsContext);
    if (!context) {
        throw new Error('useDisplaySettings must be used within a DisplaySettingsProvider');
    }
    return context;
};

export default DisplaySettingsContext;
