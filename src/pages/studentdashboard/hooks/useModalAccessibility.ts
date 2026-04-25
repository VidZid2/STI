/**
 * useModalAccessibility — Centralized accessibility hook for all modals.
 *
 * Provides:
 * - Focus trapping (Tab / Shift+Tab cycles within the modal)
 * - Escape key → onClose
 * - Restores focus to the trigger element on close
 * - Returns props to spread onto the modal container:
 *   role="dialog", aria-modal="true", aria-labelledby, ref
 *
 * Usage:
 *   const { modalRef, modalProps } = useModalAccessibility(isOpen, onClose, 'my-modal-title');
 *   <div ref={modalRef} {...modalProps}> ... </div>
 *
 * Phase 12: Accessibility Hardening
 */
import { useRef, useEffect, useCallback } from 'react';

const FOCUSABLE_SELECTORS = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable]',
].join(', ');

export function useModalAccessibility(
    isOpen: boolean,
    onClose: () => void,
    titleId?: string
) {
    const modalRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<Element | null>(null);

    // Capture the element that triggered the modal open
    useEffect(() => {
        if (isOpen) {
            triggerRef.current = document.activeElement;
        }
    }, [isOpen]);

    // Focus trap + Escape key handler
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (!isOpen || !modalRef.current) return;

            // Escape key → close
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                onClose();
                return;
            }

            // Tab key → focus trap
            if (e.key === 'Tab') {
                const focusableElements = Array.from(
                    modalRef.current.querySelectorAll(FOCUSABLE_SELECTORS)
                ) as HTMLElement[];

                if (focusableElements.length === 0) {
                    e.preventDefault();
                    return;
                }

                const firstFocusable = focusableElements[0];
                const lastFocusable = focusableElements[focusableElements.length - 1];

                if (e.shiftKey) {
                    // Shift+Tab: if focus is on first element, wrap to last
                    if (document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    }
                } else {
                    // Tab: if focus is on last element, wrap to first
                    if (document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            }
        },
        [isOpen, onClose]
    );

    // Attach/detach keydown listener
    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown, true);
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [isOpen, handleKeyDown]);

    // Auto-focus the modal when it opens
    useEffect(() => {
        if (isOpen && modalRef.current) {
            // Small delay to ensure the modal is rendered
            const timer = requestAnimationFrame(() => {
                if (!modalRef.current) return;

                // Try to focus the first focusable element inside the modal
                const firstFocusable = modalRef.current.querySelector(
                    FOCUSABLE_SELECTORS
                ) as HTMLElement | null;

                if (firstFocusable) {
                    firstFocusable.focus();
                } else {
                    // If no focusable elements, focus the container itself
                    modalRef.current.focus();
                }
            });
            return () => cancelAnimationFrame(timer);
        }
    }, [isOpen]);

    // Restore focus to trigger element when modal closes
    useEffect(() => {
        if (!isOpen && triggerRef.current) {
            const el = triggerRef.current as HTMLElement;
            if (el && typeof el.focus === 'function') {
                // Delay to allow exit animations to complete
                const timer = setTimeout(() => el.focus(), 100);
                return () => clearTimeout(timer);
            }
        }
    }, [isOpen]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [isOpen]);

    // Props to spread onto the modal container div
    const modalProps = {
        role: 'dialog' as const,
        'aria-modal': true as const,
        ...(titleId ? { 'aria-labelledby': titleId } : {}),
        tabIndex: -1 as const };

    return { modalRef, modalProps };
}

export default useModalAccessibility;
