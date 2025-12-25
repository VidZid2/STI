/**
 * Link Preview Component for chat messages
 * Shows website thumbnail, title, description, and favicon
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

export interface LinkPreviewData {
    url: string;
    title?: string;
    description?: string;
    image?: string;
    favicon?: string;
    siteName?: string;
}

interface LinkPreviewCardProps {
    url: string;
    isOwn: boolean;
    isDarkMode: boolean;
    colors: { cardBg: string; textPrimary: string; textSecondary: string; textMuted: string; accent: string; border: string };
}

// Extract domain from URL
const getDomain = (url: string): string => {
    try {
        const domain = new URL(url).hostname.replace('www.', '');
        return domain;
    } catch {
        return url;
    }
};

// Get favicon URL
const getFaviconUrl = (url: string): string => {
    try {
        const domain = new URL(url).origin;
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
        return '';
    }
};

// Detect platform for special styling
const getPlatformInfo = (url: string): { name: string; color: string; icon: React.ReactNode } | null => {
    const domain = getDomain(url).toLowerCase();
    
    if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
        return {
            name: 'YouTube',
            color: '#ff0000',
            icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
            ),
        };
    }
    if (domain.includes('github.com')) {
        return {
            name: 'GitHub',
            color: '#24292f',
            icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
            ),
        };
    }
    if (domain.includes('twitter.com') || domain.includes('x.com')) {
        return {
            name: 'X',
            color: '#000000',
            icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
            ),
        };
    }
    if (domain.includes('linkedin.com')) {
        return {
            name: 'LinkedIn',
            color: '#0a66c2',
            icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
            ),
        };
    }
    if (domain.includes('stackoverflow.com')) {
        return {
            name: 'Stack Overflow',
            color: '#f48024',
            icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.725 0l-1.72 1.277 6.39 8.588 1.72-1.277L15.725 0zm-3.94 3.418l-1.369 1.644 8.225 6.85 1.369-1.644-8.225-6.85zm-3.15 4.465l-.905 1.94 9.702 4.517.904-1.94-9.701-4.517zm-1.85 4.86l-.44 2.093 10.473 2.201.44-2.092-10.473-2.203zM1.89 15.47V24h19.19v-8.53h-2.133v6.397H4.021v-6.396H1.89zm4.265 2.133v2.13h10.66v-2.13H6.154z"/>
                </svg>
            ),
        };
    }
    
    return null;
};

export const LinkPreviewCard: React.FC<LinkPreviewCardProps> = ({ url, isOwn, isDarkMode, colors }) => {
    const [preview, setPreview] = useState<LinkPreviewData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    const domain = getDomain(url);
    const faviconUrl = getFaviconUrl(url);
    const platform = getPlatformInfo(url);

    useEffect(() => {
        // Simulate fetching link preview data
        // In production, you'd call an API like linkpreview.net or your own backend
        const fetchPreview = async () => {
            setIsLoading(true);
            setHasError(false);
            
            try {
                // Simulated preview data based on URL patterns
                await new Promise(resolve => setTimeout(resolve, 300));
                
                // Generate preview based on domain
                const mockPreview: LinkPreviewData = {
                    url,
                    title: `Content from ${domain}`,
                    description: 'Click to open this link in a new tab',
                    siteName: domain,
                    favicon: faviconUrl,
                };

                // Special handling for known platforms
                if (url.includes('youtube.com/watch') || url.includes('youtu.be')) {
                    mockPreview.title = 'YouTube Video';
                    mockPreview.description = 'Watch this video on YouTube';
                    mockPreview.image = `https://img.youtube.com/vi/${extractYouTubeId(url)}/mqdefault.jpg`;
                } else if (url.includes('github.com')) {
                    const parts = url.split('github.com/')[1]?.split('/');
                    if (parts && parts.length >= 2) {
                        mockPreview.title = `${parts[0]}/${parts[1]}`;
                        mockPreview.description = 'GitHub Repository';
                        mockPreview.image = `https://opengraph.githubassets.com/1/${parts[0]}/${parts[1]}`;
                    }
                }

                setPreview(mockPreview);
            } catch {
                setHasError(true);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPreview();
    }, [url, domain, faviconUrl]);

    // Extract YouTube video ID
    const extractYouTubeId = (videoUrl: string): string => {
        const match = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
        return match ? match[1] : '';
    };

    if (hasError) {
        return null; // Don't show preview if there's an error
    }

    return (
        <motion.a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01 }}
            transition={{ 
                duration: 0.2,
                scale: { type: 'spring', damping: 20, stiffness: 300 }
            }}
            style={{
                display: 'block',
                textDecoration: 'none',
                maxWidth: '320px',
                borderRadius: '12px',
                overflow: 'hidden',
                background: isOwn 
                    ? 'rgba(255,255,255,0.08)' 
                    : (isDarkMode ? 'rgba(255,255,255,0.04)' : '#ffffff'),
                border: `1px solid ${isOwn ? 'rgba(255,255,255,0.12)' : (isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')}`,
                marginTop: '8px',
                transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = isDarkMode 
                    ? '0 4px 12px rgba(0,0,0,0.3)' 
                    : '0 4px 12px rgba(0,0,0,0.1)';
                e.currentTarget.style.borderColor = colors.accent + '40';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = isOwn ? 'rgba(255,255,255,0.12)' : (isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)');
            }}
        >
            {/* Image/Thumbnail */}
            {preview?.image && (
                <div style={{
                    width: '100%',
                    height: '140px',
                    background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                    position: 'relative',
                    overflow: 'hidden',
                }}>
                    {!imageLoaded && (
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                style={{ color: colors.textMuted }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                </svg>
                            </motion.div>
                        </div>
                    )}
                    <img
                        src={preview.image}
                        alt=""
                        onLoad={() => setImageLoaded(true)}
                        onError={() => setImageLoaded(true)}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            opacity: imageLoaded ? 1 : 0,
                            transition: 'opacity 0.2s ease',
                        }}
                    />
                    {/* Platform badge */}
                    {platform && (
                        <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            background: 'rgba(0,0,0,0.7)',
                            backdropFilter: 'blur(4px)',
                            color: '#fff',
                            fontSize: '11px',
                            fontWeight: 600,
                        }}>
                            <span style={{ color: platform.color }}>{platform.icon}</span>
                            {platform.name}
                        </div>
                    )}
                </div>
            )}

            {/* Content */}
            <div style={{ padding: '12px' }}>
                {/* Loading state */}
                {isLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '4px',
                            background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                        }} />
                        <div style={{ flex: 1 }}>
                            <div style={{
                                height: '12px',
                                width: '70%',
                                borderRadius: '4px',
                                background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                                marginBottom: '6px',
                            }} />
                            <div style={{
                                height: '10px',
                                width: '50%',
                                borderRadius: '4px',
                                background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                            }} />
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Site info row */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: '6px',
                        }}>
                            {faviconUrl && (
                                <img
                                    src={faviconUrl}
                                    alt=""
                                    style={{
                                        width: '14px',
                                        height: '14px',
                                        borderRadius: '3px',
                                    }}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            )}
                            <span style={{
                                fontSize: '11px',
                                color: isOwn ? 'rgba(255,255,255,0.6)' : colors.textMuted,
                                textTransform: 'lowercase',
                            }}>
                                {domain}
                            </span>
                        </div>

                        {/* Title */}
                        {preview?.title && (
                            <h4 style={{
                                margin: '0 0 4px',
                                fontSize: '13px',
                                fontWeight: 600,
                                color: isOwn ? '#fff' : colors.textPrimary,
                                lineHeight: 1.3,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                            }}>
                                {preview.title}
                            </h4>
                        )}

                        {/* Description */}
                        {preview?.description && !preview.image && (
                            <p style={{
                                margin: 0,
                                fontSize: '12px',
                                color: isOwn ? 'rgba(255,255,255,0.7)' : colors.textSecondary,
                                lineHeight: 1.4,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                            }}>
                                {preview.description}
                            </p>
                        )}
                    </>
                )}
            </div>
        </motion.a>
    );
};

// Helper function to extract URLs from text
export const extractUrls = (text: string): string[] => {
    const urlRegex = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;
    return text.match(urlRegex) || [];
};

export default LinkPreviewCard;
