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

// Minimal shape of a Tenor API result item
interface TenorItem {
    id: string;
    title?: string;
    media_formats?: {
        gif?: { url: string; dims?: number[] };
        mediumgif?: { url: string };
        tinygif?: { url: string };
        nanogif?: { url: string };
    };
}

interface GifPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (gif: GifResult) => void;
    anchorRef?: React.RefObject<HTMLElement | null>;
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
    onSelect = () => {},
}) => {
    const isDarkMode = document.documentElement.classList.contains('dark');
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
        border: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        textPrimary: isDarkMode ? '#f1f5f9' : '#1e293b',
        textSecondary: isDarkMode ? '#94a3b8' : '#64748b',
        textMuted: isDarkMode ? '#64748b' : '#94a3b8',
        accent: '#3b82f6', // Blue to match emoji picker
        cardBg: isDarkMode ? 'rgba(255,255,255,0.04)' : '#f8fafc',
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
                const formattedGifs: GifResult[] = data.results.map((item: TenorItem) => ({
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

    // Calculate position - match emoji picker position
    useEffect(() => {
        if (!isOpen) return;
        // Use fixed position matching emoji picker (bottom: 90, right: 20)
        setPosition({
            bottom: 90,
            right: 20,
        });
    }, [isOpen]);

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
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    style={{
                        position: 'fixed',
                        bottom: position.bottom,
                        right: position.right,
                        width: '340px',
                        maxHeight: '460px', // Match emoji picker height
                        background: colors.bg,
                        borderRadius: '16px',
                        boxShadow: isDarkMode 
                            ? '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)'
                            : '0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
                        overflow: 'hidden',
                        zIndex: 1000,
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
                    }}>
                        {/* Search Input - matching emoji picker style */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 14px',
                            borderRadius: '12px',
                            background: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                            border: `1px solid ${colors.border}`,
                            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
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
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    color: colors.textPrimary,
                                }}
                            />
                            {searchQuery && (
                                <motion.button
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    whileHover={{ scale: 1.1, background: `${colors.accent}20` }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setSearchQuery('')}
                                    style={{
                                        width: 22,
                                        height: 22,
                                        borderRadius: '6px',
                                        background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: colors.textMuted,
                                        flexShrink: 0,
                                        transition: 'background 0.15s ease',
                                    }}
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </motion.button>
                            )}
                        </div>
                    </div>

                    {/* Category Label - matching emoji picker */}
                    <div style={{
                        padding: '12px 16px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: colors.accent,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        borderBottom: `1px solid ${colors.border}`,
                        background: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                    }}>
                        <div style={{
                            width: 4,
                            height: 4,
                            borderRadius: '50%',
                            background: colors.accent,
                        }} />
                        {searchQuery ? 'Search Results' : 'Trending GIFs'}
                        <span style={{ 
                            marginLeft: 'auto', 
                            fontSize: '9px', 
                            fontWeight: 500,
                            color: colors.textMuted,
                            textTransform: 'none',
                            letterSpacing: 'normal',
                        }}>
                            Powered by Tenor
                        </span>
                    </div>

                    {/* GIF Grid */}
                    <div style={{
                        flex: 1,
                        overflow: 'auto',
                        padding: '12px 16px',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                    }}
                    className="hide-scrollbar-gif"
                    >
                        <style>{`
                            .hide-scrollbar-gif::-webkit-scrollbar {
                                display: none;
                            }
                        `}</style>
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
                                height: '180px',
                                color: colors.textMuted,
                            }}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 8px', opacity: 0.5 }}>
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="M21 21l-4.35-4.35" />
                                    <path d="M8 11h6M11 8v6" strokeOpacity="0.5" />
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
                                        transition={{ delay: Math.min(index * 0.02, 0.2), type: 'spring', stiffness: 400, damping: 30 }}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        onMouseEnter={() => setHoveredGif(gif.id)}
                                        onMouseLeave={() => setHoveredGif(null)}
                                        onClick={() => {
                                            onSelect(gif);
                                            onClose();
                                        }}
                                        style={{
                                            border: hoveredGif === gif.id 
                                                ? `2px solid ${colors.accent}`
                                                : `1px solid ${colors.border}`,
                                            padding: 0,
                                            borderRadius: '12px',
                                            overflow: 'hidden',
                                            cursor: 'pointer',
                                            background: colors.cardBg,
                                            aspectRatio: '1',
                                            position: 'relative',
                                            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                                            boxShadow: hoveredGif === gif.id 
                                                ? `0 4px 16px ${colors.accent}25`
                                                : 'none',
                                        }}
                                    >
                                        <img
                                            src={gif.preview}
                                            alt={gif.title}
                                            loading="lazy"
                                            decoding="async"
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
                                                        background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)',
                                                        display: 'flex',
                                                        alignItems: 'flex-end',
                                                        justifyContent: 'center',
                                                        padding: '10px',
                                                    }}
                                                >
                                                    <span style={{
                                                        fontSize: '11px',
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
