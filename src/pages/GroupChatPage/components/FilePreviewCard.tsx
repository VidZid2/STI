/**
 * File/Image Preview Component for chat messages
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import type { FileAttachment } from '../../../services/chatService';
import { formatFileSize } from '../utils';

interface FilePreviewCardProps {
    attachment: FileAttachment;
    isOwn: boolean;
    isDarkMode: boolean;
    colors: { cardBg: string; textPrimary: string; textSecondary: string; textMuted: string; accent: string; border: string };
}

export const FilePreviewCard: React.FC<FilePreviewCardProps> = ({ attachment, isOwn, isDarkMode, colors }) => {
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [showFullImage, setShowFullImage] = useState(false);
    
    const isImage = attachment.type.startsWith('image/');
    const isVideo = attachment.type.startsWith('video/');
    const isPDF = attachment.type === 'application/pdf';
    const isDocument = attachment.type.includes('document') || attachment.type.includes('word') || attachment.type.includes('text');
    const isSpreadsheet = attachment.type.includes('spreadsheet') || attachment.type.includes('excel');
    const isPresentation = attachment.type.includes('presentation') || attachment.type.includes('powerpoint');
    
    const getFileIcon = () => {
        if (isImage) return (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
            </svg>
        );
        if (isVideo) return (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
        );
        if (isPDF) return (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
            </svg>
        );
        if (isDocument) return (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
        );
        if (isSpreadsheet) return (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="3" y1="15" x2="21" y2="15" />
                <line x1="9" y1="3" x2="9" y2="21" />
                <line x1="15" y1="3" x2="15" y2="21" />
            </svg>
        );
        if (isPresentation) return (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
        );
        return (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                <polyline points="13 2 13 9 20 9" />
            </svg>
        );
    };
    
    const getFileColor = () => {
        if (isImage) return '#22c55e';
        if (isVideo) return '#ef4444';
        if (isPDF) return '#ef4444';
        if (isDocument) return '#3b82f6';
        if (isSpreadsheet) return '#22c55e';
        if (isPresentation) return '#f59e0b';
        return '#64748b';
    };

    // Image preview
    if (isImage && attachment.url) {
        return (
            <>
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setShowFullImage(true)}
                    style={{
                        borderRadius: '12px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        maxWidth: '280px',
                        background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                        position: 'relative',
                    }}
                >
                    {!isImageLoaded && (
                        <div style={{
                            width: '100%',
                            height: '150px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: colors.textMuted,
                        }}>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                </svg>
                            </motion.div>
                        </div>
                    )}
                    <img
                        src={attachment.url}
                        alt={attachment.name}
                        onLoad={() => setIsImageLoaded(true)}
                        style={{
                            width: '100%',
                            maxHeight: '300px',
                            objectFit: 'cover',
                            display: isImageLoaded ? 'block' : 'none',
                        }}
                    />
                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '8px 10px',
                        background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
                        color: '#fff',
                        fontSize: '11px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                            {attachment.name}
                        </span>
                        <span>{formatFileSize(attachment.size)}</span>
                    </div>
                </motion.div>
                
                {/* Full Image Modal */}
                <AnimatePresence>
                    {showFullImage && (
                        createPortal(
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowFullImage(false)}
                                style={{
                                    position: 'fixed',
                                    inset: 0,
                                    background: 'rgba(0,0,0,0.9)',
                                    zIndex: 2000,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '20px',
                                    cursor: 'zoom-out',
                                }}
                            >
                                <motion.img
                                    initial={{ scale: 0.9 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0.9 }}
                                    src={attachment.url}
                                    alt={attachment.name}
                                    style={{
                                        maxWidth: '90vw',
                                        maxHeight: '90vh',
                                        objectFit: 'contain',
                                        borderRadius: '8px',
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setShowFullImage(false)}
                                    style={{
                                        position: 'absolute',
                                        top: '20px',
                                        right: '20px',
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        border: 'none',
                                        background: 'rgba(255,255,255,0.1)',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </motion.button>
                            </motion.div>,
                            document.body
                        )
                    )}
                </AnimatePresence>
            </>
        );
    }
    
    // Generic file preview
    return (
        <motion.a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.02 }}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '10px',
                background: isOwn 
                    ? 'rgba(255,255,255,0.1)' 
                    : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
                border: `1px solid ${isOwn ? 'rgba(255,255,255,0.15)' : colors.border}`,
                textDecoration: 'none',
                maxWidth: '280px',
            }}
        >
            <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: `${getFileColor()}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: getFileColor(),
                flexShrink: 0,
            }}>
                {getFileIcon()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                    margin: 0,
                    fontSize: '13px',
                    fontWeight: 500,
                    color: isOwn ? '#fff' : colors.textPrimary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}>
                    {attachment.name}
                </p>
                <p style={{
                    margin: '2px 0 0',
                    fontSize: '11px',
                    color: isOwn ? 'rgba(255,255,255,0.7)' : colors.textMuted,
                }}>
                    {formatFileSize(attachment.size)}
                </p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isOwn ? 'rgba(255,255,255,0.6)' : colors.textMuted} strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
        </motion.a>
    );
};
