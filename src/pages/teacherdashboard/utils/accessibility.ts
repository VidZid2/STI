/**
 * Accessibility Utilities
 * Phase 4A: Full accessibility support for TeacherDashboard
 * 
 * Provides:
 * - Color contrast checking
 * - ARIA attribute helpers
 * - Screen reader announcements
 * - Focus management utilities
 */

// ============================================
// COLOR CONTRAST UTILITIES
// ============================================

/**
 * Calculate relative luminance of a color
 * Based on WCAG 2.1 formula
 */
export const getLuminance = (hexColor: string): number => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    const toLinear = (c: number) => 
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
};

/**
 * Calculate contrast ratio between two colors
 * WCAG 2.1 requires 4.5:1 for normal text, 3:1 for large text
 */
export const getContrastRatio = (color1: string, color2: string): number => {
    const l1 = getLuminance(color1);
    const l2 = getLuminance(color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Check if color combination meets WCAG AA standards
 */
export const meetsContrastAA = (
    foreground: string, 
    background: string, 
    isLargeText = false
): boolean => {
    const ratio = getContrastRatio(foreground, background);
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
};

/**
 * Check if color combination meets WCAG AAA standards
 */
export const meetsContrastAAA = (
    foreground: string, 
    background: string, 
    isLargeText = false
): boolean => {
    const ratio = getContrastRatio(foreground, background);
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
};

// ============================================
// ARIA ATTRIBUTE HELPERS
// ============================================

export interface AriaLiveRegionProps {
    'aria-live': 'polite' | 'assertive' | 'off';
    'aria-atomic'?: boolean;
    'aria-relevant'?: 'additions' | 'removals' | 'text' | 'all';
}

/**
 * Get ARIA attributes for a live region
 */
export const getLiveRegionProps = (
    priority: 'polite' | 'assertive' = 'polite'
): AriaLiveRegionProps => ({
    'aria-live': priority,
    'aria-atomic': true,
    'aria-relevant': 'additions text',
});

/**
 * Get ARIA attributes for a button
 */
export const getButtonAriaProps = (options: {
    label: string;
    expanded?: boolean;
    pressed?: boolean;
    disabled?: boolean;
    controls?: string;
    describedBy?: string;
}) => ({
    'aria-label': options.label,
    ...(options.expanded !== undefined && { 'aria-expanded': options.expanded }),
    ...(options.pressed !== undefined && { 'aria-pressed': options.pressed }),
    ...(options.disabled && { 'aria-disabled': true }),
    ...(options.controls && { 'aria-controls': options.controls }),
    ...(options.describedBy && { 'aria-describedby': options.describedBy }),
});

/**
 * Get ARIA attributes for a modal dialog
 */
export const getModalAriaProps = (options: {
    labelledBy: string;
    describedBy?: string;
}) => ({
    role: 'dialog' as const,
    'aria-modal': true,
    'aria-labelledby': options.labelledBy,
    ...(options.describedBy && { 'aria-describedby': options.describedBy }),
});

/**
 * Get ARIA attributes for a list
 */
export const getListAriaProps = (options: {
    label: string;
    orientation?: 'horizontal' | 'vertical';
    multiselectable?: boolean;
}) => ({
    role: 'listbox' as const,
    'aria-label': options.label,
    'aria-orientation': options.orientation || 'vertical',
    ...(options.multiselectable && { 'aria-multiselectable': true }),
});

/**
 * Get ARIA attributes for a list item
 */
export const getListItemAriaProps = (options: {
    selected?: boolean;
    disabled?: boolean;
    index: number;
    total: number;
}) => ({
    role: 'option' as const,
    'aria-selected': options.selected || false,
    'aria-disabled': options.disabled || false,
    'aria-posinset': options.index + 1,
    'aria-setsize': options.total,
});

// ============================================
// SCREEN READER ANNOUNCEMENTS
// ============================================

let announcer: HTMLDivElement | null = null;

/**
 * Initialize the screen reader announcer element
 */
export const initAnnouncer = (): void => {
    if (typeof document === 'undefined') return;
    
    if (!announcer) {
        announcer = document.createElement('div');
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        announcer.setAttribute('class', 'sr-only');
        announcer.style.cssText = `
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        `;
        document.body.appendChild(announcer);
    }
};

/**
 * Announce a message to screen readers
 */
export const announce = (
    message: string, 
    priority: 'polite' | 'assertive' = 'polite'
): void => {
    if (typeof document === 'undefined') return;
    
    initAnnouncer();
    
    if (announcer) {
        announcer.setAttribute('aria-live', priority);
        // Clear and set to trigger announcement
        announcer.textContent = '';
        setTimeout(() => {
            if (announcer) {
                announcer.textContent = message;
            }
        }, 100);
    }
};

/**
 * Announce loading state
 */
export const announceLoading = (isLoading: boolean, context = 'Content'): void => {
    if (isLoading) {
        announce(`${context} is loading`, 'polite');
    } else {
        announce(`${context} has loaded`, 'polite');
    }
};

/**
 * Announce error
 */
export const announceError = (message: string): void => {
    announce(`Error: ${message}`, 'assertive');
};

/**
 * Announce success
 */
export const announceSuccess = (message: string): void => {
    announce(message, 'polite');
};

// ============================================
// FOCUS MANAGEMENT
// ============================================

/**
 * Get all focusable elements within a container
 */
export const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
    const selector = [
        'button:not([disabled])',
        '[href]',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    return Array.from(container.querySelectorAll<HTMLElement>(selector));
};

/**
 * Focus the first focusable element in a container
 */
export const focusFirst = (container: HTMLElement): void => {
    const focusable = getFocusableElements(container);
    if (focusable.length > 0) {
        focusable[0].focus();
    }
};

/**
 * Focus the last focusable element in a container
 */
export const focusLast = (container: HTMLElement): void => {
    const focusable = getFocusableElements(container);
    if (focusable.length > 0) {
        focusable[focusable.length - 1].focus();
    }
};

/**
 * Store and restore focus for modal dialogs
 */
export const createFocusManager = () => {
    let previouslyFocused: HTMLElement | null = null;

    return {
        save: () => {
            previouslyFocused = document.activeElement as HTMLElement;
        },
        restore: () => {
            if (previouslyFocused && previouslyFocused.focus) {
                previouslyFocused.focus();
            }
        },
    };
};

// ============================================
// REDUCED MOTION SUPPORT
// ============================================

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get animation duration based on user preference
 */
export const getAnimationDuration = (defaultDuration: number): number => {
    return prefersReducedMotion() ? 0 : defaultDuration;
};

export default {
    getLuminance,
    getContrastRatio,
    meetsContrastAA,
    meetsContrastAAA,
    getLiveRegionProps,
    getButtonAriaProps,
    getModalAriaProps,
    getListAriaProps,
    getListItemAriaProps,
    initAnnouncer,
    announce,
    announceLoading,
    announceError,
    announceSuccess,
    getFocusableElements,
    focusFirst,
    focusLast,
    createFocusManager,
    prefersReducedMotion,
    getAnimationDuration,
};
