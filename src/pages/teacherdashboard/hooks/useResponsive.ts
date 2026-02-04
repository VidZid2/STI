/**
 * useResponsive Hook
 * Provides responsive breakpoint detection for mobile compatibility
 */

import { useState, useEffect, useCallback } from 'react';
import { BREAKPOINTS } from '../constants';

export interface ResponsiveState {
    isMobile: boolean;      // < 640px
    isTablet: boolean;      // 640px - 1024px
    isDesktop: boolean;     // > 1024px
    isSmallMobile: boolean; // < 480px
    width: number;
}

export const useResponsive = (): ResponsiveState => {
    const [state, setState] = useState<ResponsiveState>(() => {
        const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
        return {
            width,
            isSmallMobile: width < BREAKPOINTS.xs,
            isMobile: width < BREAKPOINTS.sm,
            isTablet: width >= BREAKPOINTS.sm && width < BREAKPOINTS.lg,
            isDesktop: width >= BREAKPOINTS.lg,
        };
    });

    const handleResize = useCallback(() => {
        const width = window.innerWidth;
        setState({
            width,
            isSmallMobile: width < BREAKPOINTS.xs,
            isMobile: width < BREAKPOINTS.sm,
            isTablet: width >= BREAKPOINTS.sm && width < BREAKPOINTS.lg,
            isDesktop: width >= BREAKPOINTS.lg,
        });
    }, []);

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        // Initial check
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, [handleResize]);

    return state;
};

export default useResponsive;
