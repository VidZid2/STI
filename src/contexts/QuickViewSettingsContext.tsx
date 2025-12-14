import * as React from 'react';
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

interface QuickViewSettings {
    showStreak: boolean;
    showUpcoming: boolean;
    compactMode: boolean;
    autoRefresh: boolean;
}

interface QuickViewSettingsContextType {
    settings: QuickViewSettings;
    toggleShowStreak: () => void;
    toggleShowUpcoming: () => void;
    toggleCompactMode: () => void;
    toggleAutoRefresh: () => void;
    refreshTrigger: number; // Increments to trigger refresh
}

const defaultSettings: QuickViewSettings = {
    showStreak: true,
    showUpcoming: true,
    compactMode: false,
    autoRefresh: true,
};

const QuickViewSettingsContext = createContext<QuickViewSettingsContextType | undefined>(undefined);

export const useQuickViewSettings = () => {
    const context = useContext(QuickViewSettingsContext);
    if (!context) {
        throw new Error('useQuickViewSettings must be used within a QuickViewSettingsProvider');
    }
    return context;
};

export const QuickViewSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<QuickViewSettings>(() => {
        // Load from localStorage on init
        const saved = localStorage.getItem('quickview-settings');
        if (saved) {
            try {
                return { ...defaultSettings, ...JSON.parse(saved) };
            } catch {
                return defaultSettings;
            }
        }
        return defaultSettings;
    });

    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const autoRefreshIntervalRef = useRef<number | null>(null);

    // Save to localStorage whenever settings change
    useEffect(() => {
        localStorage.setItem('quickview-settings', JSON.stringify(settings));
    }, [settings]);

    // Auto refresh logic
    useEffect(() => {
        if (settings.autoRefresh) {
            // Refresh every 30 seconds when auto refresh is enabled
            autoRefreshIntervalRef.current = window.setInterval(() => {
                setRefreshTrigger(prev => prev + 1);
            }, 30000);
        } else {
            if (autoRefreshIntervalRef.current) {
                clearInterval(autoRefreshIntervalRef.current);
                autoRefreshIntervalRef.current = null;
            }
        }

        return () => {
            if (autoRefreshIntervalRef.current) {
                clearInterval(autoRefreshIntervalRef.current);
            }
        };
    }, [settings.autoRefresh]);

    const toggleShowStreak = useCallback(() => {
        setSettings(prev => ({ ...prev, showStreak: !prev.showStreak }));
    }, []);

    const toggleShowUpcoming = useCallback(() => {
        setSettings(prev => ({ ...prev, showUpcoming: !prev.showUpcoming }));
    }, []);

    const toggleCompactMode = useCallback(() => {
        setSettings(prev => ({ ...prev, compactMode: !prev.compactMode }));
    }, []);

    const toggleAutoRefresh = useCallback(() => {
        setSettings(prev => ({ ...prev, autoRefresh: !prev.autoRefresh }));
    }, []);

    return (
        <QuickViewSettingsContext.Provider
            value={{
                settings,
                toggleShowStreak,
                toggleShowUpcoming,
                toggleCompactMode,
                toggleAutoRefresh,
                refreshTrigger,
            }}
        >
            {children}
        </QuickViewSettingsContext.Provider>
    );
};

export default QuickViewSettingsContext;
