/**
 * Pin Resource Modal Component
 * Minimalistic professional design matching GroupsContent/CatalogContent/GoalsContent
 * Blue accent color scheme with smooth hover effects
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import type { ModalColors } from './types';

interface PinResourceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (title: string, url: string, description: string) => void;
    colors: ModalColors;
}

export const PinResourceModal: React.FC<PinResourceModalProps> = ({ isOpen, onClose, onSend, colors }) => {
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [description, setDescription] = useState('');
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const titleInputRef = useRef<HTMLInputElement>(null);

    // Blue accent colors
    const blueAccent = '#3b82f6';
    const isDarkMode = colors.cardBg === '#1e293b' || colors.cardBg.includes('30, 41, 59');
    const blueBg = isDarkMode ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.08)';
    const blueBorder = isDarkMode ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.15)';
    const subtleBg = isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
    const borderColor = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => titleInputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleSubmit = () => {
        if (title.trim()) {
            onSend(title.trim(), url.trim(), description.trim());
            setTitle('');
            setUrl('');
            setDescription('');
            onClose();
        }
    };

    const isValid = title.trim().length > 0;
    const isValidUrl = !url || url.startsWith('http://') || url.startsWith('https://');

    if (!isOpen) return null;


    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                    style={{
                        position: 'fixed', inset: 0,
                        background: isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(8px)', zIndex: 1001,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: colors.cardBg, borderRadius: '20px',
                            width: '100%', maxWidth: '440px',
                            boxShadow: isDarkMode
                                ? '0 24px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)'
                                : '0 24px 48px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04)',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '20px 24px', borderBottom: `1px solid ${borderColor}`,
                            display: 'flex', alignItems: 'center', gap: '14px',
                        }}>
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 25 }}
                                style={{
                                    width: 44, height: 44, borderRadius: '12px',
                                    background: blueBg, border: `1px solid ${blueBorder}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                }}
                            >
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={blueAccent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 17v5" />
                                    <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
                                </svg>
                            </motion.div>
                            <div style={{ flex: 1 }}>
                                <motion.h3 initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
                                    style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: colors.textPrimary, letterSpacing: '-0.01em' }}>
                                    Pin Resource
                                </motion.h3>
                                <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                                    style={{ margin: '4px 0 0', fontSize: '12px', color: colors.textSecondary }}>
                                    Save important resources for your group
                                </motion.p>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1, background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onClose}
                                style={{
                                    width: 32, height: 32, borderRadius: '10px', border: 'none',
                                    background: subtleBg, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textSecondary,
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </motion.button>
                        </div>


                        {/* Content */}
                        <div style={{ padding: '20px 24px' }}>
                            {/* Preview Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                                style={{
                                    background: isDarkMode ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                                    border: `1px solid ${borderColor}`,
                                    borderRadius: '14px', padding: '14px 16px', marginBottom: '20px',
                                    display: 'flex', alignItems: 'flex-start', gap: '12px',
                                }}
                            >
                                <div style={{
                                    width: 36, height: 36, borderRadius: '10px',
                                    background: blueBg, border: `1px solid ${blueBorder}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill={blueAccent} stroke="none">
                                        <path d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
                                    </svg>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: colors.textPrimary, marginBottom: '2px' }}>
                                        {title || 'Resource Title'}
                                    </div>
                                    {url && (
                                        <div style={{
                                            fontSize: '11px', color: blueAccent, marginBottom: '4px',
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        }}>
                                            {url}
                                        </div>
                                    )}
                                    <div style={{
                                        fontSize: '12px', color: colors.textSecondary,
                                        overflow: 'hidden', textOverflow: 'ellipsis',
                                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                                    }}>
                                        {description || 'Add a description...'}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Title Input */}
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ marginBottom: '16px' }}>
                                <label style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    fontSize: '11px', fontWeight: 600, marginBottom: '8px',
                                    color: focusedField === 'title' ? blueAccent : colors.textSecondary,
                                    textTransform: 'uppercase', letterSpacing: '0.5px',
                                }}>
                                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: focusedField === 'title' ? blueAccent : colors.textMuted }} />
                                    Title
                                    <span style={{ color: '#ef4444', marginLeft: '2px' }}>*</span>
                                </label>
                                <input
                                    ref={titleInputRef}
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    onFocus={() => setFocusedField('title')}
                                    onBlur={() => setFocusedField(null)}
                                    placeholder="Lecture Notes - Week 5"
                                    style={{
                                        width: '100%', padding: '12px 14px', borderRadius: '12px',
                                        border: `1px solid ${focusedField === 'title' ? blueBorder : borderColor}`,
                                        background: focusedField === 'title' ? blueBg : subtleBg,
                                        fontSize: '14px', outline: 'none', color: colors.textPrimary, fontFamily: 'inherit',
                                        transition: 'all 0.2s ease',
                                        boxShadow: focusedField === 'title' ? `0 0 0 3px ${blueBg}` : 'none',
                                    }}
                                />
                            </motion.div>


                            {/* URL Input */}
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} style={{ marginBottom: '16px' }}>
                                <label style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    fontSize: '11px', fontWeight: 600, marginBottom: '8px',
                                    color: focusedField === 'url' ? blueAccent : colors.textSecondary,
                                    textTransform: 'uppercase', letterSpacing: '0.5px',
                                }}>
                                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: focusedField === 'url' ? blueAccent : colors.textMuted }} />
                                    URL
                                    <span style={{ fontSize: '9px', fontWeight: 500, color: colors.textMuted, textTransform: 'none', letterSpacing: 'normal', marginLeft: '4px' }}>
                                        (optional)
                                    </span>
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        onFocus={() => setFocusedField('url')}
                                        onBlur={() => setFocusedField(null)}
                                        placeholder="https://example.com/resource"
                                        style={{
                                            width: '100%', padding: '12px 14px', paddingLeft: '38px', borderRadius: '12px',
                                            border: `1px solid ${!isValidUrl ? 'rgba(239,68,68,0.5)' : focusedField === 'url' ? blueBorder : borderColor}`,
                                            background: focusedField === 'url' ? blueBg : subtleBg,
                                            fontSize: '14px', outline: 'none', color: colors.textPrimary, fontFamily: 'inherit',
                                            transition: 'all 0.2s ease',
                                            boxShadow: focusedField === 'url' ? `0 0 0 3px ${blueBg}` : 'none',
                                        }}
                                    />
                                    <div style={{
                                        position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                                        color: focusedField === 'url' ? blueAccent : colors.textMuted,
                                    }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                        </svg>
                                    </div>
                                </div>
                                {url && !isValidUrl && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        style={{ fontSize: '11px', color: '#ef4444', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="12" y1="8" x2="12" y2="12" />
                                            <line x1="12" y1="16" x2="12.01" y2="16" />
                                        </svg>
                                        URL must start with http:// or https://
                                    </motion.div>
                                )}
                            </motion.div>

                            {/* Description Input */}
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                                <label style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    fontSize: '11px', fontWeight: 600, marginBottom: '8px',
                                    color: focusedField === 'description' ? blueAccent : colors.textSecondary,
                                    textTransform: 'uppercase', letterSpacing: '0.5px',
                                }}>
                                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: focusedField === 'description' ? blueAccent : colors.textMuted }} />
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    onFocus={() => setFocusedField('description')}
                                    onBlur={() => setFocusedField(null)}
                                    placeholder="Important notes for the exam..."
                                    style={{
                                        width: '100%', padding: '12px 14px', borderRadius: '12px',
                                        border: `1px solid ${focusedField === 'description' ? blueBorder : borderColor}`,
                                        background: focusedField === 'description' ? blueBg : subtleBg,
                                        fontSize: '14px', outline: 'none', color: colors.textPrimary, fontFamily: 'inherit',
                                        resize: 'none', minHeight: '80px',
                                        transition: 'all 0.2s ease',
                                        boxShadow: focusedField === 'description' ? `0 0 0 3px ${blueBg}` : 'none',
                                    }}
                                />
                            </motion.div>
                        </div>


                        {/* Footer */}
                        <div style={{
                            padding: '16px 24px 20px', borderTop: `1px solid ${borderColor}`,
                            display: 'flex', gap: '10px', justifyContent: 'flex-end', background: subtleBg,
                        }}>
                            <motion.button
                                whileHover={{ scale: 1.02, background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onClose}
                                style={{
                                    padding: '10px 18px', borderRadius: '10px',
                                    border: `1px solid ${borderColor}`, background: 'transparent',
                                    cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: colors.textSecondary,
                                }}
                            >
                                Cancel
                            </motion.button>
                            <motion.button
                                whileHover={isValid && isValidUrl ? { scale: 1.02, boxShadow: '0 4px 16px rgba(59, 130, 246, 0.35)' } : {}}
                                whileTap={isValid && isValidUrl ? { scale: 0.98 } : {}}
                                onClick={handleSubmit}
                                disabled={!isValid || !isValidUrl}
                                style={{
                                    padding: '10px 20px', borderRadius: '10px', border: 'none',
                                    background: isValid && isValidUrl
                                        ? `linear-gradient(135deg, ${blueAccent} 0%, #2563eb 100%)`
                                        : isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                                    cursor: isValid && isValidUrl ? 'pointer' : 'not-allowed',
                                    fontSize: '13px', fontWeight: 600,
                                    color: isValid && isValidUrl ? '#fff' : colors.textMuted,
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    boxShadow: isValid && isValidUrl ? '0 2px 8px rgba(59, 130, 246, 0.25)' : 'none',
                                }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 17v5" />
                                    <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
                                </svg>
                                Pin Resource
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};
