/**
 * Grading Settings Context
 * Provides shared grading settings across the Teacher Dashboard
 * Settings are persisted to localStorage
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ============================================
// TYPES
// ============================================
export interface GradingSettings {
    autoSave: boolean;           // Auto-save grades as you enter scores
    confirmSubmit: boolean;      // Show confirmation dialog when finalizing grades
    showAnalytics: boolean;      // Display statistics when grading
    latePenalty: boolean;        // Automatically deduct points for late submissions
    latePenaltyPercent: number;  // Percentage to deduct for late submissions (default 10%)
}

interface GradingSettingsContextType {
    settings: GradingSettings;
    updateSetting: <K extends keyof GradingSettings>(key: K, value: GradingSettings[K]) => void;
    resetToDefaults: () => void;
}

// ============================================
// DEFAULTS
// ============================================
const DEFAULT_SETTINGS: GradingSettings = {
    autoSave: true,
    confirmSubmit: true,
    showAnalytics: true,
    latePenalty: false,
    latePenaltyPercent: 10,
};

const STORAGE_KEY = 'teacher_grading_settings';

// ============================================
// CONTEXT
// ============================================
const GradingSettingsContext = createContext<GradingSettingsContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================
export const GradingSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<GradingSettings>(() => {
        // Load from localStorage on init
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
            }
        } catch (e) {
            console.error('Failed to load grading settings:', e);
        }
        return DEFAULT_SETTINGS;
    });

    // Persist to localStorage when settings change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error('Failed to save grading settings:', e);
        }
    }, [settings]);

    const updateSetting = useCallback(<K extends keyof GradingSettings>(
        key: K, 
        value: GradingSettings[K]
    ) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    }, []);

    const resetToDefaults = useCallback(() => {
        setSettings(DEFAULT_SETTINGS);
    }, []);

    return (
        <GradingSettingsContext.Provider value={{ settings, updateSetting, resetToDefaults }}>
            {children}
        </GradingSettingsContext.Provider>
    );
};

// ============================================
// HOOK
// ============================================
export const useGradingSettings = (): GradingSettingsContextType => {
    const context = useContext(GradingSettingsContext);
    if (!context) {
        throw new Error('useGradingSettings must be used within a GradingSettingsProvider');
    }
    return context;
};

export default GradingSettingsContext;
