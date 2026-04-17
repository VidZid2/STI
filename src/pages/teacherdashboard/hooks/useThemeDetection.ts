/**
 * useThemeDetection Hook
 * Phase 4 (original) / Phase 9 (expanded): Single MutationObserver for all theme detection.
 * Watches both documentElement.dark and body.dark-mode for dark mode,
 * and documentElement.pink-theme for pink theme.
 */

import { useState, useEffect } from 'react';

interface ThemeState {
    isDarkMode: boolean;
    isPinkTheme: boolean;
}

export const useThemeDetection = (): ThemeState => {
    const [isDarkMode, setIsDarkMode] = useState(() =>
        typeof document !== 'undefined' && (
            document.documentElement.classList.contains('dark') ||
            document.body.classList.contains('dark-mode')
        )
    );
    const [isPinkTheme, setIsPinkTheme] = useState(() =>
        typeof document !== 'undefined' && document.documentElement.classList.contains('pink-theme')
    );

    useEffect(() => {
        const check = () => {
            setIsDarkMode(
                document.documentElement.classList.contains('dark') ||
                document.body.classList.contains('dark-mode')
            );
            setIsPinkTheme(document.documentElement.classList.contains('pink-theme'));
        };
        check();
        const observer = new MutationObserver(check);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    return { isDarkMode, isPinkTheme };
};
