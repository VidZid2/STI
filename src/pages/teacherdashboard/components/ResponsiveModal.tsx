/**
 * ResponsiveModal - Shared responsive modal wrapper for Teacher Dashboard
 * Provides consistent mobile-friendly modal behavior across all modals
 */

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { useResponsive } from '../hooks';
import { COLORS } from '../constants';

export interface ResponsiveModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    maxWidth?: string;
    fullScreenOnMobile?: boolean;
    title?: string;
    subtitle?: string;
    icon?: React.ReactNode;
    iconColor?: string;
    showHeader?: boolean;
    headerContent?: React.ReactNode;
    footerContent?: React.ReactNode;
    noPadding?: boolean;
}

export const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
    isOpen,
    onClose,
    children,
    maxWidth = '600px',
    fullScreenOnMobile = true,
    title,
    subtitle,
    icon,
    iconColor = '#3b82f6',
    showHeader = true,
    headerContent,
    footerContent,
    noPadding = false,
}) => {
    const { isMobile, isSmallMobile } = useResponsive();
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    // Focus management
    useEffect(() => {
        if (isOpen && closeButtonRef.current) {
            closeButtonRef.current.focus();
        }
    }, [isOpen]);

    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const isFullScreen = isMobile && fullScreenOnMobile;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(15, 23, 42, 0.7)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: isFullScreen ? 'stretch' : 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: isFullScreen ? 0 : (isMobile ? '12px' : '20px'),
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: isFullScreen ? 1 : 0.95, y: isFullScreen ? '100%' : 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: isFullScreen ? 1 : 0.95, y: isFullScreen ? '100%' : 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: '100%',
                            maxWidth: isFullScreen ? '100%' : maxWidth,
                            height: isFullScreen ? '100%' : 'auto',
                            maxHeight: isFullScreen ? '100%' : '90vh',
                            background: COLORS.background,
                            borderRadius: isFullScreen ? 0 : '20px',
                            boxShadow: isFullScreen ? 'none' : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Header */}
                        {showHeader && (
                            <div style={{
                                padding: isMobile ? '16px' : '20px 24px',
                                borderBottom: `1px solid ${COLORS.border}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: COLORS.surface,
                                flexShrink: 0,
                            }}>
                                {headerContent || (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '14px', flex: 1, minWidth: 0 }}>
                                        {icon && (
                                            <div style={{
                                                width: isMobile ? '36px' : '44px',
                                                height: isMobile ? '36px' : '44px',
                                                borderRadius: isMobile ? '10px' : '12px',
                                                background: `linear-gradient(135deg, ${iconColor}15 0%, ${iconColor}08 100%)`,
                                                border: `1px solid ${iconColor}20`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: iconColor,
                                                flexShrink: 0,
                                            }}>
                                                {icon}
                                            </div>
                                        )}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            {title && (
                                                <h2 style={{
                                                    margin: 0,
                                                    fontSize: isMobile ? '16px' : '18px',
                                                    fontWeight: 700,
                                                    color: COLORS.textPrimary,
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}>
                                                    {title}
                                                </h2>
                                            )}
                                            {subtitle && (
                                                <p style={{
                                                    margin: '2px 0 0 0',
                                                    fontSize: isMobile ? '12px' : '13px',
                                                    color: COLORS.textSecondary,
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}>
                                                    {subtitle}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                                <motion.button
                                    ref={closeButtonRef}
                                    whileHover={{ scale: 1.05, background: 'rgba(0,0,0,0.08)' }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={onClose}
                                    aria-label="Close modal"
                                    style={{
                                        width: isMobile ? '32px' : '36px',
                                        height: isMobile ? '32px' : '36px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: 'rgba(0,0,0,0.04)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: COLORS.textMuted,
                                        flexShrink: 0,
                                        marginLeft: '12px',
                                    }}
                                >
                                    <svg width={isMobile ? "16" : "18"} height={isMobile ? "16" : "18"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </motion.button>
                            </div>
                        )}

                        {/* Content */}
                        <div style={{
                            flex: 1,
                            overflow: 'auto',
                            padding: noPadding ? 0 : (isMobile ? '16px' : '24px'),
                            WebkitOverflowScrolling: 'touch',
                        }}>
                            {children}
                        </div>

                        {/* Footer */}
                        {footerContent && (
                            <div style={{
                                padding: isMobile ? '12px 16px' : '16px 24px',
                                borderTop: `1px solid ${COLORS.border}`,
                                background: COLORS.surface,
                                flexShrink: 0,
                            }}>
                                {footerContent}
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

// Hook for responsive modal styles
export const useResponsiveModalStyles = () => {
    const { isMobile, isSmallMobile, isTablet } = useResponsive();

    return {
        isMobile,
        isSmallMobile,
        isTablet,
        // Common responsive values
        padding: isMobile ? '12px' : '16px',
        gap: isMobile ? '12px' : '16px',
        fontSize: {
            title: isMobile ? '14px' : '16px',
            body: isMobile ? '13px' : '14px',
            small: isMobile ? '11px' : '12px',
        },
        iconSize: {
            sm: isMobile ? 14 : 16,
            md: isMobile ? 18 : 20,
            lg: isMobile ? 22 : 24,
        },
        buttonHeight: isMobile ? '40px' : '44px',
        inputHeight: isMobile ? '40px' : '44px',
        avatarSize: isMobile ? '36px' : '44px',
        // Grid columns for different layouts
        gridColumns: {
            cards: isMobile ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))',
            twoCol: isMobile ? '1fr' : '1fr 1fr',
            threeCol: isMobile ? '1fr' : isTablet ? '1fr 1fr' : '1fr 1fr 1fr',
        },
    };
};

export default ResponsiveModal;
