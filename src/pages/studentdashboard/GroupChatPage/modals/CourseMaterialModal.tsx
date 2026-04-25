/**
 * Course Material Modal Component
 * Minimalistic professional design matching GroupsContent/CatalogContent/GoalsContent
 * Blue accent color scheme with smooth hover effects
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useModalAccessibility } from '../../hooks/useModalAccessibility';
import type { ModalColors } from './types';

interface CourseMaterialModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (title: string, url: string, type: string) => void;
    colors: ModalColors;
}

const materialTypes = [
    { id: 'lecture', label: 'Lecture', icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
    )},
    { id: 'notes', label: 'Notes', icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
        </svg>
    )},
    { id: 'slides', label: 'Slides', icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
    )},
    { id: 'textbook', label: 'Textbook', icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
    )},
    { id: 'assignment', label: 'Assignment', icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            <path d="M9 14l2 2 4-4" />
        </svg>
    )},
    { id: 'other', label: 'Other', icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
    )},
];

export const CourseMaterialModal: React.FC<CourseMaterialModalProps> = ({ isOpen, onClose, onSend, colors }) => {
    const { modalRef, modalProps } = useModalAccessibility(isOpen, onClose, 'course-material-modal-title');
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [type, setType] = useState('lecture');
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const titleInputRef = useRef<HTMLInputElement>(null);

    // Blue accent colors
    const blueAccent = '#3b82f6';
    const isDarkMode = 'var(--dashboard-surface)' === '#1e293b' || 'var(--dashboard-surface)'.includes('30, 41, 59');
    const blueBg = 'rgba(59, 130, 246, 0.1)';
    const blueBorder = 'rgba(59, 130, 246, 0.25)';
    const subtleBg = 'var(--dashboard-surface)';
    const borderColor = 'rgba(255,255,255,0.06)';

    // Focus first input on open
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => titleInputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const isValidUrl = (str: string) => {
        try {
            new URL(str);
            return true;
        } catch {
            return str.startsWith('http://') || str.startsWith('https://');
        }
    };

    const isValid = title.trim() && url.trim() && isValidUrl(url);
    const selectedType = materialTypes.find(m => m.id === type);

    const handleSubmit = () => {
        if (isValid) {
            onSend(title.trim(), url.trim(), type);
            setTitle('');
            setUrl('');
            setType('lecture');
            onClose();
        }
    };

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
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(8px)', zIndex: 1001,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        ref={modalRef}
                        {...modalProps}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'var(--dashboard-surface)', borderRadius: '20px',
                            width: '100%', maxWidth: '460px',
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
                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                </svg>
                            </motion.div>
                            <div style={{ flex: 1 }}>
                                <motion.h3 initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
                                    style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                                    Link Course Material
                                </motion.h3>
                                <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                                    style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                    Share resources with your study group
                                </motion.p>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.1)' }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onClose}
                                style={{
                                    width: 32, height: 32, borderRadius: '10px', border: 'none',
                                    background: subtleBg, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)',
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </motion.button>
                        </div>

                        {/* Content */}
                        <div style={{ padding: '20px 24px' }}>
                            {/* Material Type Selector */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                                style={{ marginBottom: '20px' }}
                            >
                                <label style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)',
                                    marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px',
                                }}>
                                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-muted)' }} />
                                    Material Type
                                </label>
                                <div style={{
                                    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px',
                                }}>
                                    {materialTypes.map((m, i) => (
                                        <motion.button
                                            key={m.id}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 + i * 0.03 }}
                                            whileHover={{ scale: 1.02, y: -1 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setType(m.id)}
                                            style={{
                                                padding: '10px 8px', borderRadius: '10px',
                                                border: type === m.id ? `1.5px solid ${blueBorder}` : `1px solid ${borderColor}`,
                                                background: type === m.id ? blueBg : subtleBg,
                                                cursor: 'pointer', display: 'flex', flexDirection: 'column',
                                                alignItems: 'center', gap: '6px',
                                                color: type === m.id ? blueAccent : 'var(--text-secondary)',
                                                transition: 'all 0.15s ease',
                                            }}
                                        >
                                            <div style={{ opacity: type === m.id ? 1 : 0.7 }}>{m.icon}</div>
                                            <span style={{ fontSize: '11px', fontWeight: 500 }}>{m.label}</span>
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Title Input */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35 }}
                                style={{ marginBottom: '16px' }}
                            >
                                <label style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    fontSize: '11px', fontWeight: 600,
                                    color: focusedField === 'title' ? blueAccent : 'var(--text-secondary)',
                                    marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px',
                                    transition: 'color 0.2s ease',
                                }}>
                                    <div style={{
                                        width: 4, height: 4, borderRadius: '50%',
                                        background: focusedField === 'title' ? blueAccent : 'var(--text-muted)',
                                        transition: 'background 0.2s ease',
                                    }} />
                                    Title
                                </label>
                                <input
                                    ref={titleInputRef}
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    onFocus={() => setFocusedField('title')}
                                    onBlur={() => setFocusedField(null)}
                                    placeholder="Week 5 Lecture - Data Structures"
                                    style={{
                                        width: '100%', padding: '12px 14px', borderRadius: '12px',
                                        border: `1px solid ${focusedField === 'title' ? blueBorder : borderColor}`,
                                        background: focusedField === 'title' ? blueBg : subtleBg,
                                        fontSize: '14px', outline: 'none', color: 'var(--text-primary)',
                                        fontFamily: 'inherit',
                                        transition: 'all 0.2s ease',
                                        boxShadow: focusedField === 'title' ? `0 0 0 3px ${blueBg}` : 'none',
                                    }}
                                />
                            </motion.div>

                            {/* URL Input */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                style={{ marginBottom: '20px' }}
                            >
                                <label style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    fontSize: '11px', fontWeight: 600,
                                    color: focusedField === 'url' ? blueAccent : 'var(--text-secondary)',
                                    marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px',
                                    transition: 'color 0.2s ease',
                                }}>
                                    <div style={{
                                        width: 4, height: 4, borderRadius: '50%',
                                        background: focusedField === 'url' ? blueAccent : 'var(--text-muted)',
                                        transition: 'background 0.2s ease',
                                    }} />
                                    URL
                                    {url && !isValidUrl(url) && (
                                        <span style={{ marginLeft: 'auto', color: '#ef4444', fontSize: '10px', textTransform: 'none', letterSpacing: 'normal' }}>
                                            Invalid URL
                                        </span>
                                    )}
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        onFocus={() => setFocusedField('url')}
                                        onBlur={() => setFocusedField(null)}
                                        placeholder="https://example.com/resource"
                                        style={{
                                            width: '100%', padding: '12px 14px', paddingLeft: '40px', borderRadius: '12px',
                                            border: `1px solid ${url && !isValidUrl(url) ? 'rgba(239,68,68,0.3)' : focusedField === 'url' ? blueBorder : borderColor}`,
                                            background: focusedField === 'url' ? blueBg : subtleBg,
                                            fontSize: '14px', outline: 'none', color: 'var(--text-primary)',
                                            fontFamily: 'inherit',
                                            transition: 'all 0.2s ease',
                                            boxShadow: focusedField === 'url' ? `0 0 0 3px ${blueBg}` : 'none',
                                        }}
                                    />
                                    <div style={{
                                        position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                                        color: url && isValidUrl(url) ? blueAccent : 'var(--text-muted)',
                                        transition: 'color 0.2s ease',
                                    }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                        </svg>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Preview Card */}
                            {(title || url) && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                    style={{
                                        padding: '14px', borderRadius: '12px',
                                        background: subtleBg, border: `1px solid ${borderColor}`,
                                    }}
                                >
                                    <div style={{
                                        fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)',
                                        marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px',
                                    }}>
                                        Preview
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                        <div style={{
                                            width: 40, height: 40, borderRadius: '10px',
                                            background: blueBg, border: `1px solid ${blueBorder}`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: blueAccent, flexShrink: 0,
                                        }}>
                                            {selectedType?.icon}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)',
                                                marginBottom: '4px',
                                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                            }}>
                                                {title || 'Untitled Material'}
                                            </div>
                                            <div style={{
                                                fontSize: '11px', color: blueAccent,
                                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                display: 'flex', alignItems: 'center', gap: '4px',
                                            }}>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                                    <polyline points="15 3 21 3 21 9" />
                                                    <line x1="10" y1="14" x2="21" y2="3" />
                                                </svg>
                                                {url || 'No URL'}
                                            </div>
                                            <div style={{
                                                marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                padding: '3px 8px', borderRadius: '6px',
                                                background: blueBg, fontSize: '10px', fontWeight: 500, color: blueAccent,
                                            }}>
                                                {selectedType?.label}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Footer */}
                        <div style={{
                            padding: '16px 24px 20px', borderTop: `1px solid ${borderColor}`,
                            display: 'flex', gap: '10px', justifyContent: 'space-between', alignItems: 'center',
                            background: subtleBg,
                        }}>
                            {/* Validation hint */}
                            <div style={{
                                fontSize: '11px',
                                color: isValid ? '#10b981' : 'var(--text-muted)',
                                display: 'flex', alignItems: 'center', gap: '6px',
                            }}>
                                {isValid ? (
                                    <>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                            <polyline points="22 4 12 14.01 9 11.01" />
                                        </svg>
                                        Ready to share
                                    </>
                                ) : (
                                    <>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="12" y1="8" x2="12" y2="12" />
                                            <line x1="12" y1="16" x2="12.01" y2="16" />
                                        </svg>
                                        Need title + valid URL
                                    </>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <motion.button
                                    whileHover={{ scale: 1.02, background: 'var(--bg-hover)' }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={onClose}
                                    style={{
                                        padding: '10px 18px', borderRadius: '10px',
                                        border: `1px solid ${borderColor}`, background: 'transparent',
                                        cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)',
                                    }}
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    whileHover={isValid ? { scale: 1.02, boxShadow: '0 4px 16px rgba(59, 130, 246, 0.35)' } : {}}
                                    whileTap={isValid ? { scale: 0.98 } : {}}
                                    onClick={handleSubmit}
                                    disabled={!isValid}
                                    style={{
                                        padding: '10px 20px', borderRadius: '10px', border: 'none',
                                        background: isValid
                                            ? `linear-gradient(135deg, ${blueAccent} 0%, #2563eb 100%)`
                                            : 'rgba(255,255,255,0.06)',
                                        cursor: isValid ? 'pointer' : 'not-allowed',
                                        fontSize: '13px', fontWeight: 600,
                                        color: isValid ? '#fff' : 'var(--text-muted)',
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        boxShadow: isValid ? '0 2px 8px rgba(59, 130, 246, 0.25)' : 'none',
                                    }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="22" y1="2" x2="11" y2="13" />
                                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                    </svg>
                                    Share Material
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};
