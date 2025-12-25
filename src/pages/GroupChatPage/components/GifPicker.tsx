/**
 * GIF Picker Component
 * Integrates with Tenor API for GIF search and selection
 * Clean, minimalistic design without tabs
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';

// Tenor API configuration
const TENOR_API_KEY = 'AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ';
const TENOR_CLIENT_KEY = 'studysync_chat';
const TENOR_LIMIT = 20;

export interface GifResult {
    id: string;
    title: string;
    url: string;
    preview: string;
    width: number;
    height: number;
}

interface GifPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (gif: GifResult) => void;
    anchorRef: React.RefObject<HTMLElement | null>;
    isDarkMode?: boolean;
}

// Skeleton loader component
const GifSkeleton: React.FC<{ isDarkMode: boolean; index: number }> = ({ isDarkMode, index }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.05 }}
        style={{
            aspectRatio: '1',
            borderRadius: '12px',
            background: isDarkMode 
                ? 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)'
                : 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
        }}
    />
);

export const GifPicker: React.FC<GifPickerProps> = ({
    isOpen,
    onClose,
    onSelect,
    anchorRef,
    isDarkMode = false,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [gifs, setGifs] = useState<GifResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [position, setPosition] = useState<{ bottom: number; right: number } | null>(null);
    const [hoveredGif, setHoveredGif] = useState<string | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

    const colors = {
        bg: isDarkMode ? '#1e293b' : '#ffffff',
        border: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
        textPrimary: isDarkMode ? '#f1f5f9' : '#1e293b',
        textSecondary: isDarkMode ? '#94a3b8' : '#64748b',
        textMuted: isDarkMode ? '#64748b' : '#94a3b8',
        accent: '#f59e0b',
        cardBg: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc',
    };

    // Fetch GIFs from Tenor API
    const fetchGifs = useCallback(async (query: string) => {
        setIsLoading(true);
        try {
            const endpoint = query 
                ? 'https://tenor.googleapis.com/v2/search'
                : 'https://tenor.googleapis.com/v2/featured';
            
            const params = new URLSearchParams({
                key: TENOR_API_KEY,
                client_key: TENOR_CLIENT_KEY,
                limit: TENOR_LIMIT.toString(),
                media_filter: 'gif,tinygif',
                ...(query && { q: query }),
            });

            const response = await fetch(`${endpoint}?${params}`);
            const data = await response.json();

            if (data.results) {
                const formattedGifs: GifResult[] = data.results.map((item: any) => ({
                    id: item.id,
                    title: item.title || 'GIF',
                    url: item.media_formats?.gif?.url || item.media_formats?.mediumgif?.url,
                    preview: item.media_formats?.tinygif?.url || item.media_formats?.nanogif?.url,
                    width: item.media_formats?.gif?.dims?.[0] || 200,
                    height: item.media_formats?.gif?.dims?.[1] || 200,
                }));
                setGifs(formattedGifs);
            }
        } catch (error) {
            console.error('Error fetching GIFs:', error);
            setGifs([]);
        } finally {
            setIsLoading(false);
            setIsSearching(false);
        }
    }, []);

    // Load trending GIFs on open
    useEffect(() => {
        if (isOpen) {
            fetchGifs('');
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }
    }, [isOpen, fetchGifs]);

    // Handle search with debounce
    useEffect(() => {
        if (searchDebounceRef.current) {
            clearTimeout(searchDebounceRef.current);
        }

        if (searchQuery) {
            setIsSearching(true);
            searchDebounceRef.current = setTimeout(() => {
                fetchGifs(searchQuery);
            }, 400);
        } else {
            fetchGifs('');
        }

        return () => {
            if (searchDebounceRef.current) {
                clearTimeout(searchDebounceRef.current);
            }
        };
    }, [searchQuery, fetchGifs]);

    // Calculate position
    useEffect(() => {
        if (!isOpen || !anchorRef.current) return;

        const rect = anchorRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const pickerWidth = 340;

        let rightPos = viewportWidth - rect.right;
        if (rect.right - pickerWidth < 10) {
            rightPos = viewportWidth - pickerWidth - 10;
        }

        setPosition({
            bottom: viewportHeight - rect.top + 8,
            right: Math.max(10, rightPos),
        });
    }, [isOpen, anchorRef]);

    // Close on click outside
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('[data-gif-picker]')) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    if (!isOpen || !position) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    data-gif-picker
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    style={{
                        position: 'fixed',
                        bottom: position.bottom,
                        right: position.right,
                        width: '340px',
                        maxHeight: '400px',
                        background: colors.bg,
                        borderRadius: '16px',
                        border: `1.5px solid ${colors.accent}40`,
                        boxShadow: 'none',
                        overflow: 'hidden',
                        zIndex: 9999,
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    {/* Shimmer animation style */}
                    <style>{`
                        @keyframes shimmer {
                            0% { background-position: -200% 0; }
                            100% { background-position: 200% 0; }
                        }
                    `}</style>

                    {/* Header with Search */}
                    <div style={{
                        padding: '14px 16px',
                        borderBottom: `1px solid ${colors.border}`,
                        background: isDarkMode ? 'rgba(245, 158, 11, 0.05)' : 'rgba(245, 158, 11, 0.03)',
                    }}>
                        {/* Title row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            {/* GIF Icon */}
                            <div style={{
                                width: 32,
                                height: 32,
                                borderRadius: '10px',
                                background: `linear-gradient(135deg, ${colors.accent}20 0%, ${colors.accent}10 100%)`,
                                border: `1.5px solid ${colors.accent}40`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                    <rect x="2" y="4" width="20" height="16" rx="3" stroke={colors.accent} strokeWidth="2"/>
                                    <path d="M7 10.5V14.5M7 12.5H9M9 10.5V14.5" stroke={colors.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M12 10.5V14.5" stroke={colors.accent} strokeWidth="1.5" strokeLinecap="round"/>
                                    <path d="M15 10.5V14.5M15 10.5H17.5M15 12.5H17" stroke={colors.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <div style={{ flex: 1, lineHeight: 1.3 }}>
                                <span style={{
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    color: colors.textPrimary,
                                    display: 'block',
                                    marginBottom: '1px',
                                }}>
                                    {searchQuery ? 'Search Results' : 'Trending GIFs'}
                                </span>
                                <span style={{ fontSize: '10px', color: colors.textMuted, lineHeight: 1 }}>
                                    Powered by Tenor
                                </span>
                            </div>
                            {/* Close button */}
                            <motion.button
                                whileHover={{ scale: 1.1, background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: colors.textMuted,
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <path d="M18 6L6 18M6 6l12 12"/>
                                </svg>
                            </motion.button>
                        </div>

                        {/* Search Input */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 14px',
                            borderRadius: '12px',
                            background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                            border: `1.5px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                        }}>
                            {isSearching ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                                    style={{ display: 'flex', flexShrink: 0 }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="9" stroke={colors.accent} strokeWidth="2.5" strokeLinecap="round" strokeDasharray="40 20" />
                                    </svg>
                                </motion.div>
                            ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="M21 21l-4.35-4.35" />
                                </svg>
                            )}
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search GIFs..."
                                style={{
                                    flex: 1,
                                    border: 'none',
                                    background: 'transparent',
                                    outline: 'none',
                                    fontSize: '14px',
                                    color: colors.textPrimary,
                                }}
                            />
                            {searchQuery && (
                                <motion.button
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setSearchQuery('')}
                                    style={{
                                        width: 20,
                                        height: 20,
                                        borderRadius: '50%',
                                        background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: colors.textMuted,
                                        flexShrink: 0,
                                    }}
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                        <path d="M18 6L6 18M6 6l12 12"/>
                                    </svg>
                                </motion.button>
                            )}
                        </div>
                    </div>

                    {/* GIF Grid */}
                    <div style={{
                        flex: 1,
                        overflow: 'auto',
                        padding: '12px',
                    }}>
                        {isLoading ? (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: '10px',
                            }}>
                                {Array.from({ length: 6 }).map((_, index) => (
                                    <GifSkeleton key={index} isDarkMode={isDarkMode} index={index} />
                                ))}
                            </div>
                        ) : gifs.length === 0 ? (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '150px',
                                color: colors.textMuted,
                            }}>
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '10px', opacity: 0.5 }}>
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="M21 21l-4.35-4.35" />
                                </svg>
                                <span style={{ fontSize: '13px', fontWeight: 500 }}>No GIFs found</span>
                                <span style={{ fontSize: '11px', marginTop: '4px' }}>Try a different search</span>
                            </div>
                        ) : (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: '10px',
                            }}>
                                {gifs.map((gif, index) => (
                                    <motion.button
                                        key={gif.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.02, type: 'spring', stiffness: 300 }}
                                        whileHover={{ scale: 1.05, zIndex: 10 }}
                                        whileTap={{ scale: 0.95 }}
                                        onMouseEnter={() => setHoveredGif(gif.id)}
                                        onMouseLeave={() => setHoveredGif(null)}
                                        onClick={() => {
                                            onSelect(gif);
                                            onClose();
                                        }}
                                        style={{
                                            border: hoveredGif === gif.id 
                                                ? `2px solid ${colors.accent}`
                                                : '2px solid transparent',
                                            padding: 0,
                                            borderRadius: '12px',
                                            overflow: 'hidden',
                                            cursor: 'pointer',
                                            background: colors.cardBg,
                                            aspectRatio: '1',
                                            position: 'relative',
                                            transition: 'border-color 0.15s ease',
                                            boxShadow: hoveredGif === gif.id 
                                                ? `0 4px 16px ${colors.accent}30`
                                                : '0 2px 8px rgba(0,0,0,0.06)',
                                        }}
                                    >
                                        <img
                                            src={gif.preview}
                                            alt={gif.title}
                                            loading="lazy"
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                            }}
                                        />
                                        {/* Hover overlay */}
                                        <AnimatePresence>
                                            {hoveredGif === gif.id && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    style={{
                                                        position: 'absolute',
                                                        inset: 0,
                                                        background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)',
                                                        display: 'flex',
                                                        alignItems: 'flex-end',
                                                        justifyContent: 'center',
                                                        padding: '8px',
                                                    }}
                                                >
                                                    <span style={{
                                                        fontSize: '10px',
                                                        fontWeight: 600,
                                                        color: '#fff',
                                                        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                                                    }}>
                                                        Click to send
                                                    </span>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.button>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default GifPicker;
