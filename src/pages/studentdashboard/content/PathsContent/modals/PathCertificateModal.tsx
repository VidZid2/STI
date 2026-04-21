/**
 * PathCertificateModal
 * Certificate display modal for completed paths.
 * Extracted from PathsContent.tsx during Phase 8.6
 */
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import type { PathWithProgress } from '../../../../../services/pathsService';

const PathCertificateModal: React.FC<PathCertificateModalProps> = ({
    path,
    isOpen,
    onClose,
    isDarkMode,
    completedAt,
}) => {
    const colors = {
        bg: isDarkMode ? '#0f172a' : '#ffffff',
        cardBg: isDarkMode ? '#1e293b' : '#f8fafc',
        border: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        textPrimary: isDarkMode ? '#f1f5f9' : '#0f172a',
        textSecondary: isDarkMode ? '#94a3b8' : '#475569',
        textMuted: isDarkMode ? '#94a3b8' : '#334155',
        gold: '#f59e0b',
        goldLight: '#fef3c7',
    };

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!path) return null;

    const formattedDate = completedAt 
        ? new Date(completedAt).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })
        : new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0, 0, 0, 0.6)',
                            backdropFilter: 'blur(8px)',
                            zIndex: 9998,
                        }}
                    />

                    {/* Modal Container */}
                    <div
                        style={{
                            position: 'fixed',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 9999,
                            pointerEvents: 'none',
                            padding: '20px',
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            style={{
                                width: '100%',
                                maxWidth: '420px',
                                background: colors.bg,
                                borderRadius: '24px',
                                boxShadow: isDarkMode
                                    ? '0 32px 64px rgba(0, 0, 0, 0.5)'
                                    : '0 32px 64px rgba(0, 0, 0, 0.2)',
                                overflow: 'hidden',
                                pointerEvents: 'auto',
                                border: `1px solid ${colors.border}`,
                            }}
                        >
                            {/* Certificate Header with Confetti Effect */}
                            <div style={{
                                position: 'relative',
                                padding: '32px 24px 24px',
                                background: `linear-gradient(135deg, ${path.color}15 0%, ${colors.gold}10 100%)`,
                                borderBottom: `1px solid ${colors.border}`,
                                textAlign: 'center',
                                overflow: 'hidden',
                            }}>
                                {/* Decorative Elements */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 0.3, scale: 1 }}
                                    transition={{ delay: 0.2, duration: 0.5 }}
                                    style={{
                                        position: 'absolute',
                                        top: '-20px',
                                        left: '-20px',
                                        width: '100px',
                                        height: '100px',
                                        borderRadius: '50%',
                                        background: `radial-gradient(circle, ${colors.gold}30 0%, transparent 70%)`,
                                    }}
                                />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 0.2, scale: 1 }}
                                    transition={{ delay: 0.3, duration: 0.5 }}
                                    style={{
                                        position: 'absolute',
                                        bottom: '-30px',
                                        right: '-30px',
                                        width: '120px',
                                        height: '120px',
                                        borderRadius: '50%',
                                        background: `radial-gradient(circle, ${path.color}30 0%, transparent 70%)`,
                                    }}
                                />

                                {/* Trophy/Badge Icon */}
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                        margin: '0 auto 16px',
                                        borderRadius: '50%',
                                        background: `linear-gradient(135deg, ${colors.gold} 0%, #d97706 100%)`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: `0 8px 24px ${colors.gold}40`,
                                    }}
                                >
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                                        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                                        <path d="M4 22h16" />
                                        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                                        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                                        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                                    </svg>
                                </motion.div>

                                {/* Congratulations Text */}
                                <motion.h2
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    style={{
                                        margin: 0,
                                        fontSize: '22px',
                                        fontWeight: 700,
                                        color: colors.textPrimary,
                                        marginBottom: '8px',
                                    }}
                                >
                                    🎉 Congratulations!
                                </motion.h2>
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    style={{
                                        margin: 0,
                                        fontSize: '14px',
                                        color: colors.textSecondary,
                                    }}
                                >
                                    You've completed the learning path
                                </motion.p>
                            </div>

                            {/* Certificate Content */}
                            <div style={{ padding: '24px' }}>
                                {/* Path Title */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.35 }}
                                    style={{
                                        textAlign: 'center',
                                        marginBottom: '20px',
                                    }}
                                >
                                    <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '12px 20px',
                                        borderRadius: '12px',
                                        background: `${path.color}10`,
                                        border: `1px solid ${path.color}20`,
                                    }}>
                                        <PathIcon icon={path.icon} color={path.color} size={24} />
                                        <span style={{
                                            fontSize: '16px',
                                            fontWeight: 600,
                                            color: colors.textPrimary,
                                        }}>
                                            {path.title}
                                        </span>
                                    </div>
                                </motion.div>

                                {/* Achievement Stats */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(3, 1fr)',
                                        gap: '12px',
                                        marginBottom: '20px',
                                    }}
                                >
                                    {/* Courses Completed */}
                                    <div style={{
                                        padding: '12px',
                                        borderRadius: '10px',
                                        background: colors.cardBg,
                                        textAlign: 'center',
                                    }}>
                                        <div style={{
                                            fontSize: '20px',
                                            fontWeight: 700,
                                            color: path.color,
                                            marginBottom: '4px',
                                        }}>
                                            {path.total_courses}
                                        </div>
                                        <div style={{
                                            fontSize: '10px',
                                            color: colors.textMuted,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                        }}>
                                            Courses
                                        </div>
                                    </div>

                                    {/* Modules */}
                                    <div style={{
                                        padding: '12px',
                                        borderRadius: '10px',
                                        background: colors.cardBg,
                                        textAlign: 'center',
                                    }}>
                                        <div style={{
                                            fontSize: '20px',
                                            fontWeight: 700,
                                            color: '#8b5cf6',
                                            marginBottom: '4px',
                                        }}>
                                            {getPathTotalModules(path)}
                                        </div>
                                        <div style={{
                                            fontSize: '10px',
                                            color: colors.textMuted,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                        }}>
                                            Modules
                                        </div>
                                    </div>

                                    {/* Hours */}
                                    <div style={{
                                        padding: '12px',
                                        borderRadius: '10px',
                                        background: colors.cardBg,
                                        textAlign: 'center',
                                    }}>
                                        <div style={{
                                            fontSize: '20px',
                                            fontWeight: 700,
                                            color: '#10b981',
                                            marginBottom: '4px',
                                        }}>
                                            {formatEstimatedTime(getPathEstimatedHours(path))}
                                        </div>
                                        <div style={{
                                            fontSize: '10px',
                                            color: colors.textMuted,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                        }}>
                                            Completed
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Completion Date */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.45 }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        padding: '10px 16px',
                                        borderRadius: '8px',
                                        background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                        marginBottom: '20px',
                                    }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                        <line x1="16" y1="2" x2="16" y2="6" />
                                        <line x1="8" y1="2" x2="8" y2="6" />
                                        <line x1="3" y1="10" x2="21" y2="10" />
                                    </svg>
                                    <span style={{
                                        fontSize: '12px',
                                        color: colors.textSecondary,
                                    }}>
                                        Completed on {formattedDate}
                                    </span>
                                </motion.div>

                                {/* Badge Earned */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '14px 16px',
                                        borderRadius: '12px',
                                        background: `linear-gradient(135deg, ${colors.goldLight} 0%, ${colors.gold}15 100%)`,
                                        border: `1px solid ${colors.gold}30`,
                                    }}
                                >
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '10px',
                                        background: `linear-gradient(135deg, ${colors.gold} 0%, #d97706 100%)`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="8" r="6" />
                                            <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div style={{
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            color: '#92400e',
                                            marginBottom: '2px',
                                        }}>
                                            Badge Earned!
                                        </div>
                                        <div style={{
                                            fontSize: '11px',
                                            color: '#b45309',
                                        }}>
                                            {path.title} Completion Badge
                                        </div>
                                    </div>
                                    <motion.div
                                        animate={{ rotate: [0, 10, -10, 0] }}
                                        transition={{ duration: 0.5, repeat: 2, delay: 0.6 }}
                                        style={{ marginLeft: 'auto' }}
                                    >
                                        <span style={{ fontSize: '24px' }}>🏅</span>
                                    </motion.div>
                                </motion.div>
                            </div>

                            {/* Footer */}
                            <div style={{
                                padding: '16px 24px',
                                borderTop: `1px solid ${colors.border}`,
                                display: 'flex',
                                gap: '12px',
                            }}>
                                <motion.button
                                    whileHover={{ 
                                        scale: 1.02,
                                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                                    }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={onClose}
                                    style={{
                                        flex: 1,
                                        padding: '12px 20px',
                                        borderRadius: '10px',
                                        border: `1px solid ${colors.border}`,
                                        background: 'transparent',
                                        color: colors.textSecondary,
                                        fontSize: '14px',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Close
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02, boxShadow: `0 8px 24px ${colors.gold}40` }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        // Could implement share functionality here
                                        onClose();
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '12px 20px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: `linear-gradient(135deg, ${colors.gold} 0%, #d97706 100%)`,
                                        color: '#ffffff',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="18" cy="5" r="3" />
                                        <circle cx="6" cy="12" r="3" />
                                        <circle cx="18" cy="19" r="3" />
                                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                                    </svg>
                                    Share
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};


export { PathCertificateModal };
