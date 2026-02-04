/**
 * useKeyboardNavigation Hook
 * Phase 3B: Keyboard navigation support for accessibility
 * 
 * Provides:
 * - Arrow key navigation between items
 * - Enter/Space to activate items
 * - Escape to close modals
 * - Tab focus management
 */

import { useCallback, useEffect, useRef, useState } from 'react';

// ============================================
// TYPES
// ============================================
interface UseKeyboardNavigationOptions {
    itemCount: number;
    onSelect?: (index: number) => void;
    onEscape?: () => void;
    enabled?: boolean;
    loop?: boolean;
    orientation?: 'vertical' | 'horizontal' | 'both';
}

interface UseKeyboardNavigationReturn {
    focusedIndex: number;
    setFocusedIndex: (index: number) => void;
    handleKeyDown: (event: React.KeyboardEvent) => void;
    getItemProps: (index: number) => {
        tabIndex: number;
        'aria-selected': boolean;
        onFocus: () => void;
        onKeyDown: (event: React.KeyboardEvent) => void;
    };
    containerRef: React.RefObject<HTMLDivElement | null>;
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================
export const useKeyboardNavigation = ({
    itemCount,
    onSelect,
    onEscape,
    enabled = true,
    loop = true,
    orientation = 'vertical',
}: UseKeyboardNavigationOptions): UseKeyboardNavigationReturn => {
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);

    // ============================================
    // NAVIGATION HANDLERS
    // ============================================
    const navigateUp = useCallback(() => {
        setFocusedIndex(prev => {
            if (prev <= 0) {
                return loop ? itemCount - 1 : 0;
            }
            return prev - 1;
        });
    }, [itemCount, loop]);

    const navigateDown = useCallback(() => {
        setFocusedIndex(prev => {
            if (prev >= itemCount - 1) {
                return loop ? 0 : itemCount - 1;
            }
            return prev + 1;
        });
    }, [itemCount, loop]);

    const navigateLeft = useCallback(() => {
        if (orientation === 'horizontal' || orientation === 'both') {
            navigateUp();
        }
    }, [orientation, navigateUp]);

    const navigateRight = useCallback(() => {
        if (orientation === 'horizontal' || orientation === 'both') {
            navigateDown();
        }
    }, [orientation, navigateDown]);

    // ============================================
    // KEY HANDLER
    // ============================================
    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
        if (!enabled) return;

        switch (event.key) {
            case 'ArrowUp':
                if (orientation === 'vertical' || orientation === 'both') {
                    event.preventDefault();
                    navigateUp();
                }
                break;
            case 'ArrowDown':
                if (orientation === 'vertical' || orientation === 'both') {
                    event.preventDefault();
                    navigateDown();
                }
                break;
            case 'ArrowLeft':
                event.preventDefault();
                navigateLeft();
                break;
            case 'ArrowRight':
                event.preventDefault();
                navigateRight();
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                if (focusedIndex >= 0 && onSelect) {
                    onSelect(focusedIndex);
                }
                break;
            case 'Escape':
                event.preventDefault();
                if (onEscape) {
                    onEscape();
                }
                break;
            case 'Home':
                event.preventDefault();
                setFocusedIndex(0);
                break;
            case 'End':
                event.preventDefault();
                setFocusedIndex(itemCount - 1);
                break;
        }
    }, [enabled, orientation, focusedIndex, itemCount, navigateUp, navigateDown, navigateLeft, navigateRight, onSelect, onEscape]);

    // ============================================
    // FOCUS MANAGEMENT
    // ============================================
    useEffect(() => {
        if (!enabled || focusedIndex < 0) return;

        const container = containerRef.current;
        if (!container) return;

        const items = container.querySelectorAll('[data-keyboard-nav-item]');
        const targetItem = items[focusedIndex] as HTMLElement;

        if (targetItem) {
            targetItem.focus();
        }
    }, [focusedIndex, enabled]);

    // ============================================
    // ITEM PROPS GENERATOR
    // ============================================
    const getItemProps = useCallback((index: number) => ({
        tabIndex: focusedIndex === index ? 0 : -1,
        'aria-selected': focusedIndex === index,
        'data-keyboard-nav-item': true,
        onFocus: () => setFocusedIndex(index),
        onKeyDown: handleKeyDown,
    }), [focusedIndex, handleKeyDown]);

    return {
        focusedIndex,
        setFocusedIndex,
        handleKeyDown,
        getItemProps,
        containerRef,
    };
};

// ============================================
// MODAL KEYBOARD HOOK
// ============================================
interface UseModalKeyboardOptions {
    isOpen: boolean;
    onClose: () => void;
    onConfirm?: () => void;
}

export const useModalKeyboard = ({
    isOpen,
    onClose,
    onConfirm,
}: UseModalKeyboardOptions) => {
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            switch (event.key) {
                case 'Escape':
                    event.preventDefault();
                    onClose();
                    break;
                case 'Enter':
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        if (onConfirm) {
                            onConfirm();
                        }
                    }
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, onConfirm]);
};

// ============================================
// FOCUS TRAP HOOK
// ============================================
export const useFocusTrap = (isActive: boolean) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!isActive) return;

        // Store the previously focused element
        previousActiveElement.current = document.activeElement as HTMLElement;

        const container = containerRef.current;
        if (!container) return;

        // Focus the first focusable element
        const focusableElements = container.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Tab') return;

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (event.shiftKey) {
                if (document.activeElement === firstElement) {
                    event.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    event.preventDefault();
                    firstElement.focus();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            // Restore focus to the previously focused element
            if (previousActiveElement.current) {
                previousActiveElement.current.focus();
            }
        };
    }, [isActive]);

    return containerRef;
};

export default useKeyboardNavigation;
