/**
 * PendingAttachmentsPreview Component
 * Shows files ready to be sent with preview and remove options
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface PendingAttachment {
    id: string;
    file: File;
    name: string;
    type: string;
    size: number;
    preview?: string;
}

interface PendingAttachmentsPreviewProps {
    attachments: PendingAttachment[];
    onClearAll: () => void;
    onRemove: (id: string) => void;
    formatFileSize: (bytes: number) => string;
    isDarkMode: boolean;
    colors: {
        textPrimary: string;
        textMuted: string;
    };
}

export const PendingAttachmentsPreview: React.FC<PendingAttachmentsPreviewProps> = ({
    attachments,
    onClearAll,
    onRemove,
    formatFileSize,
    isDarkMode,
    colors,
}) => {
    // Helper to get file icon color based on type
    const getFileIconStyle = (type: string) => {
        const t = type || '';
        if (t.includes('pdf')) return { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' };
        if (t.includes('word') || t.includes('doc')) return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' };
        if (t.includes('sheet') || t.includes('excel')) return { bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' };
        if (t.includes('video')) return { bg: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' };
        if (t.includes('audio')) return { bg: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' };
        return { bg: 'rgba(107, 114, 128, 0.1)', color: '#6b7280' };
    };

    return (
        <AnimatePresence>
            {attachments.length > 0 && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ 
                        height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
                        opacity: { duration: 0.2 }
                    }}
                    style={{
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            background: isDarkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.98)',
                            borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                            padding: '16px 20px',
                        }}
                    >
                    {/* Header */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '12px',
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}>
                            <div style={{
                                width: 28,
                                height: 28,
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                                </svg>
                            </div>
                            <span style={{
                                fontSize: '14px',
                                fontWeight: 600,
                                color: colors.textPrimary,
                            }}>
                                {attachments.length} {attachments.length === 1 ? 'file' : 'files'} ready to send
                            </span>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05, background: 'rgba(239, 68, 68, 0.15)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onClearAll}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                border: 'none',
                                background: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)',
                                color: '#ef4444',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                            }}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                            Clear all
                        </motion.button>
                    </div>

                    {/* Attachments Grid */}
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '12px',
                    }}>
                        {attachments.map((attachment) => {
                            const isImage = (attachment.type || '').startsWith('image/') || 
                                /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(attachment.name);
                            const iconStyle = getFileIconStyle(attachment.type);
                            
                            return (
                                <motion.div
                                    key={attachment.id}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    style={{
                                        position: 'relative',
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                                        ...(isImage && attachment.preview ? {
                                            width: '100px',
                                            height: '100px',
                                            background: 'transparent',
                                        } : {
                                            background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                                            padding: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            maxWidth: '220px',
                                        }),
                                    }}
                                >
                                    {/* Image Preview */}
                                    {isImage && attachment.preview ? (
                                        <>
                                            <img
                                                src={attachment.preview}
                                                alt={attachment.name}
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                }}
                                            />
                                            {/* Overlay with file info */}
                                            <div style={{
                                                position: 'absolute',
                                                bottom: 0,
                                                left: 0,
                                                right: 0,
                                                padding: '6px 8px',
                                                background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                                                color: '#fff',
                                            }}>
                                                <p style={{
                                                    margin: 0,
                                                    fontSize: '10px',
                                                    fontWeight: 500,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {attachment.name}
                                                </p>
                                                <p style={{
                                                    margin: 0,
                                                    fontSize: '9px',
                                                    opacity: 0.8,
                                                }}>
                                                    {formatFileSize(attachment.size)}
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {/* File Icon */}
                                            <div style={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: '10px',
                                                background: iconStyle.bg,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: iconStyle.color,
                                                flexShrink: 0,
                                            }}>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                    <polyline points="14 2 14 8 20 8" />
                                                </svg>
                                            </div>
                                            {/* File Info */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{
                                                    margin: 0,
                                                    fontSize: '13px',
                                                    fontWeight: 500,
                                                    color: colors.textPrimary,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {attachment.name}
                                                </p>
                                                <p style={{
                                                    margin: '2px 0 0',
                                                    fontSize: '11px',
                                                    color: colors.textMuted,
                                                }}>
                                                    {formatFileSize(attachment.size)}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                    
                                    {/* Remove Button */}
                                    <motion.button
                                        whileHover={{ scale: 1.1, background: 'rgba(239, 68, 68, 0.9)' }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => onRemove(attachment.id)}
                                        style={{
                                            position: 'absolute',
                                            top: '6px',
                                            right: '6px',
                                            width: 22,
                                            height: 22,
                                            borderRadius: '50%',
                                            border: 'none',
                                            background: 'rgba(0,0,0,0.5)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#fff',
                                            backdropFilter: 'blur(4px)',
                                        }}
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <line x1="18" y1="6" x2="6" y2="18" />
                                            <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                    </motion.button>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Tip */}
                    <p style={{
                        margin: '12px 0 0',
                        fontSize: '11px',
                        color: colors.textMuted,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                    }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="16" x2="12" y2="12" />
                            <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                        Press Enter or click Send to share these files
                    </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
