/**
 * Citation Generator Component
 * Generate properly formatted citations for academic papers
 * 
 * Features:
 * - Multiple citation styles (APA, MLA, Chicago)
 * - Various source types (Book, Website, Journal, etc.)
 * - Copy to clipboard
 * - Dark mode compatible
 */

import * as React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";

interface CitationGeneratorProps {
    onBack: () => void;
    initialText?: string;
}

type CitationStyle = 'APA' | 'MLA' | 'Chicago';
type SourceType = 'book' | 'website' | 'journal' | 'newspaper';

interface CitationData {
    sourceType: SourceType;
    authors: string;
    title: string;
    publicationYear: string;
    publisher?: string;
    url?: string;
    accessDate?: string;
    journalName?: string;
    volume?: string;
    issue?: string;
    pages?: string;
}

const CitationGenerator: React.FC<CitationGeneratorProps> = ({ onBack }) => {
    const [citationStyle, setCitationStyle] = useState<CitationStyle>('APA');
    const [sourceType, setSourceType] = useState<SourceType>('book');
    const [citationData, setCitationData] = useState<CitationData>({
        sourceType: 'book',
        authors: '',
        title: '',
        publicationYear: '',
    });
    const [generatedCitation, setGeneratedCitation] = useState<string>('');
    const [copied, setCopied] = useState(false);
    const [isTitleHovered, setIsTitleHovered] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Dark mode detection
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkModeEnabled');
        return saved === 'true' || document.body.classList.contains('dark-mode');
    });

    // Simulate initial page load
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    // Sync dark mode with settings
    useEffect(() => {
        const checkDarkMode = () => {
            const saved = localStorage.getItem('darkModeEnabled');
            setIsDarkMode(saved === 'true' || document.body.classList.contains('dark-mode'));
        };

        window.addEventListener('storage', checkDarkMode);
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

        return () => {
            window.removeEventListener('storage', checkDarkMode);
            observer.disconnect();
        };
    }, []);

    // Update source type when changed
    useEffect(() => {
        setCitationData(prev => ({ ...prev, sourceType }));
    }, [sourceType]);

    // Generate citation whenever data or style changes
    useEffect(() => {
        if (citationData.authors && citationData.title && citationData.publicationYear) {
            const citation = generateCitation(citationData, citationStyle);
            setGeneratedCitation(citation);
        } else {
            setGeneratedCitation('');
        }
    }, [citationData, citationStyle]);

    const generateCitation = (data: CitationData, style: CitationStyle): string => {
        const { authors, title, publicationYear, publisher, url, accessDate, journalName, volume, issue, pages } = data;

        switch (style) {
            case 'APA':
                if (data.sourceType === 'book') {
                    return `${authors} (${publicationYear}). *${title}*${publisher ? `. ${publisher}` : ''}.`;
                } else if (data.sourceType === 'website') {
                    return `${authors} (${publicationYear}). *${title}*. Retrieved ${accessDate || 'Month Day, Year'}, from ${url || 'URL'}`;
                } else if (data.sourceType === 'journal') {
                    return `${authors} (${publicationYear}). ${title}. *${journalName}*, *${volume}*(${issue}), ${pages}.`;
                }
                break;

            case 'MLA':
                if (data.sourceType === 'book') {
                    return `${authors}. *${title}*${publisher ? `. ${publisher}` : ''}, ${publicationYear}.`;
                } else if (data.sourceType === 'website') {
                    return `${authors}. "${title}." ${publicationYear}. Web. ${accessDate || 'Day Month Year'}. <${url || 'URL'}>.`;
                } else if (data.sourceType === 'journal') {
                    return `${authors}. "${title}." *${journalName}* ${volume}.${issue} (${publicationYear}): ${pages}. Print.`;
                }
                break;

            case 'Chicago':
                if (data.sourceType === 'book') {
                    return `${authors}. *${title}*${publisher ? `. ${publisher}` : ''}, ${publicationYear}.`;
                } else if (data.sourceType === 'website') {
                    return `${authors}. "${title}." Accessed ${accessDate || 'Month Day, Year'}. ${url || 'URL'}.`;
                } else if (data.sourceType === 'journal') {
                    return `${authors}. "${title}." *${journalName}* ${volume}, no. ${issue} (${publicationYear}): ${pages}.`;
                }
                break;
        }

        return '';
    };

    const handleCopy = async () => {
        if (generatedCitation) {
            await navigator.clipboard.writeText(generatedCitation);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleInputChange = (field: keyof CitationData, value: string) => {
        setCitationData(prev => ({ ...prev, [field]: value }));
    };

    const handleClear = () => {
        setCitationData({
            sourceType,
            authors: '',
            title: '',
            publicationYear: '',
            publisher: '',
            url: '',
            accessDate: '',
            journalName: '',
            volume: '',
            issue: '',
            pages: '',
        });
        setGeneratedCitation('');
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="cg-container"
        >
            {/* Header Area */}
            <div className="cg-header-area">
                {/* Title Card */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{
                        opacity: 1,
                        y: isTitleHovered ? -4 : 0,
                        boxShadow: isTitleHovered
                            ? '0 20px 40px rgba(59, 130, 246, 0.15)'
                            : '0 4px 20px rgba(0, 0, 0, 0.04)',
                        borderColor: isTitleHovered
                            ? '#3b82f6'
                            : (isDarkMode ? '#334155' : 'rgba(226, 232, 240, 0.8)')
                    }}
                    transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 25,
                        mass: 0.8
                    }}
                    className="cg-title-card"
                    onHoverStart={() => setIsTitleHovered(true)}
                    onHoverEnd={() => setIsTitleHovered(false)}
                >
                    <motion.div className="cg-title-gradient" animate={{ opacity: isTitleHovered ? 1 : 0 }} />

                    {isLoading ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
                            <div className="cg-skeleton" style={{ width: '52px', height: '52px', borderRadius: '14px' }} />
                            <div>
                                <div className="cg-skeleton" style={{ width: '180px', height: '24px', marginBottom: '8px' }} />
                                <div className="cg-skeleton" style={{ width: '150px', height: '16px' }} />
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
                            <motion.div
                                className="cg-title-icon-wrapper"
                                animate={{
                                    background: isTitleHovered
                                        ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                                        : (isDarkMode ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff'),
                                    color: isTitleHovered ? '#ffffff' : (isDarkMode ? '#60a5fa' : '#3b82f6'),
                                    scale: isTitleHovered ? 1.05 : 1,
                                    rotate: isTitleHovered ? 3 : 0,
                                }}
                                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                style={{ position: 'relative' }}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                    style={{ display: 'block', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                                >
                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                </svg>
                            </motion.div>
                            <div className="cg-title-content">
                                <motion.h1
                                    animate={{ color: isTitleHovered ? '#3b82f6' : (isDarkMode ? '#f1f5f9' : '#1e293b') }}
                                    transition={{ duration: 0.2 }}
                                >
                                    Citation Generator
                                </motion.h1>
                                <div className="cg-badges">
                                    <motion.span
                                        className="cg-badge"
                                        animate={{
                                            scale: isTitleHovered ? 1.02 : 1,
                                            backgroundColor: isTitleHovered
                                                ? 'rgba(59, 130, 246, 0.1)'
                                                : (isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'),
                                            color: isTitleHovered ? '#3b82f6' : (isDarkMode ? '#94a3b8' : '#64748b'),
                                        }}
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                        </svg>
                                        Free Forever
                                    </motion.span>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Main Actions Bar */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="cg-actions-bar"
                >
                    {/* Navigation Group */}
                    <motion.button
                        onClick={onBack}
                        className="cg-btn cg-btn-ghost"
                        whileHover={{
                            x: -2,
                            backgroundColor: 'rgba(59, 130, 246, 0.08)',
                            color: '#3b82f6',
                            transition: { duration: 0.15 }
                        }}
                        whileTap={{ scale: 0.97 }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                        Back
                    </motion.button>

                    <div className="cg-actions-divider"></div>

                    {/* Tool Actions Group */}
                    <LayoutGroup>
                        <div className="cg-actions">
                            <motion.button
                                layout
                                layoutId="clear-btn"
                                onClick={handleClear}
                                className="cg-btn cg-btn-secondary"
                                whileHover={{
                                    scale: 1.02,
                                    backgroundColor: '#f1f5f9',
                                    transition: { duration: 0.15 }
                                }}
                                whileTap={{ scale: 0.97 }}
                                disabled={!generatedCitation && !citationData.authors && !citationData.title}
                                transition={{
                                    layout: {
                                        type: 'spring',
                                        stiffness: 400,
                                        damping: 30
                                    }
                                }}
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                                    <line x1="18" y1="9" x2="12" y2="15" />
                                    <line x1="12" y1="9" x2="18" y2="15" />
                                </svg>
                                Clear
                            </motion.button>

                            <motion.button
                                layout
                                layoutId="generate-btn"
                                onClick={handleCopy}
                                disabled={!generatedCitation}
                                className={`cg-btn cg-btn-primary ${copied ? 'copied' : ''}`}
                                whileHover={{ scale: 1.02, boxShadow: '0 8px 20px rgba(59, 130, 246, 0.35)', transition: { duration: 0.15 } }}
                                whileTap={{ scale: 0.97 }}
                                transition={{
                                    layout: {
                                        type: 'spring',
                                        stiffness: 400,
                                        damping: 30
                                    }
                                }}
                            >
                                <AnimatePresence mode="wait">
                                    {copied ? (
                                        <motion.div
                                            key="copied"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                        >
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                            Copied!
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="copy"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                        >
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                            </svg>
                                            Copy Citation
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.button>
                        </div>
                    </LayoutGroup>
                </motion.div>
            </div>

            {/* Main Content */}
            {isLoading ? (
                <div className="cg-content">
                    {/* Editor Section Skeleton */}
                    <div className="cg-editor-section">
                        <div className="cg-skeleton" style={{ width: '120px', height: '14px', marginBottom: '12px' }} />
                        <div className="cg-skeleton" style={{ width: '100%', height: '40px', marginBottom: '24px' }} />

                        <div className="cg-skeleton" style={{ width: '120px', height: '14px', marginBottom: '12px' }} />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '24px' }}>
                            <div className="cg-skeleton" style={{ height: '80px' }} />
                            <div className="cg-skeleton" style={{ height: '80px' }} />
                            <div className="cg-skeleton" style={{ height: '80px' }} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="cg-skeleton" style={{ height: '60px' }} />
                            <div className="cg-skeleton" style={{ height: '60px' }} />
                            <div className="cg-skeleton" style={{ height: '60px' }} />
                            <div className="cg-skeleton" style={{ height: '60px' }} />
                        </div>
                    </div>

                    {/* Sidebar Skeleton */}
                    <aside className="cg-sidebar">
                        <div className="cg-citation-card">
                            <div className="cg-skeleton" style={{ width: '140px', height: '14px', marginBottom: '16px' }} />
                            <div className="cg-skeleton" style={{ width: '100%', height: '100px', marginBottom: '12px' }} />
                            <div className="cg-skeleton" style={{ width: '100%', height: '40px' }} />
                        </div>
                        <div className="cg-tips-card">
                            <div className="cg-skeleton" style={{ width: '100px', height: '14px', marginBottom: '16px' }} />
                            <div className="cg-skeleton" style={{ width: '100%', height: '40px', marginBottom: '10px' }} />
                            <div className="cg-skeleton" style={{ width: '100%', height: '40px', marginBottom: '10px' }} />
                            <div className="cg-skeleton" style={{ width: '100%', height: '40px' }} />
                        </div>
                    </aside>
                </div>
            ) : (
                <div className="cg-content">
                    {/* Editor Section */}
                    <motion.div
                        className="cg-editor-section-v2"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                        {/* Citation Style Selector */}
                        <div className="cg-style-selector-v2">
                            <div className="cg-section-header-v2">
                                <div className="cg-section-icon-v2" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <line x1="16" y1="13" x2="8" y2="13" />
                                        <line x1="16" y1="17" x2="8" y2="17" />
                                    </svg>
                                </div>
                                <span className="cg-section-label-v2">Citation Style</span>
                            </div>
                            <div className="cg-style-tabs-v2">
                                {/* Sliding indicator */}
                                <motion.div
                                    className="cg-style-indicator"
                                    layoutId="styleIndicator"
                                    initial={false}
                                    animate={{
                                        x: citationStyle === 'APA' ? '0%' : citationStyle === 'MLA' ? '100%' : '200%',
                                    }}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 500,
                                        damping: 35,
                                        mass: 1
                                    }}
                                    style={{
                                        position: 'absolute',
                                        top: 4,
                                        left: 4,
                                        width: 'calc(33.333% - 5.33px)',
                                        height: 'calc(100% - 8px)',
                                        borderRadius: 8,
                                        background: isDarkMode ? '#334155' : 'white',
                                        boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
                                        zIndex: 0
                                    }}
                                />
                                {(['APA', 'MLA', 'Chicago'] as CitationStyle[]).map((style) => (
                                    <motion.button
                                        key={style}
                                        className={`cg-style-tab-v2 ${citationStyle === style ? 'active' : ''}`}
                                        onClick={() => setCitationStyle(style)}
                                        whileTap={{ scale: 0.98 }}
                                        style={{ position: 'relative', zIndex: 1 }}
                                    >
                                        {style}
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {/* Source Type Selector */}
                        <div className="cg-source-selector-v2">
                            <div className="cg-section-header-v2">
                                <div className="cg-section-icon-v2" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="7" height="7" />
                                        <rect x="14" y="3" width="7" height="7" />
                                        <rect x="14" y="14" width="7" height="7" />
                                        <rect x="3" y="14" width="7" height="7" />
                                    </svg>
                                </div>
                                <span className="cg-section-label-v2">Source Type</span>
                            </div>
                            <div className="cg-source-tabs-v2">
                                <motion.button
                                    className={`cg-source-tab-v2 ${sourceType === 'book' ? 'active' : ''}`}
                                    onClick={() => setSourceType('book')}
                                    whileTap={{ scale: 0.98 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <div className={`cg-source-icon-wrapper-v2 ${sourceType === 'book' ? 'active' : ''}`}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                        </svg>
                                    </div>
                                    <span>Book</span>
                                </motion.button>

                                <motion.button
                                    className={`cg-source-tab-v2 ${sourceType === 'website' ? 'active' : ''}`}
                                    onClick={() => setSourceType('website')}
                                    whileTap={{ scale: 0.98 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <div className={`cg-source-icon-wrapper-v2 ${sourceType === 'website' ? 'active' : ''}`}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="2" y1="12" x2="22" y2="12" />
                                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                        </svg>
                                    </div>
                                    <span>Website</span>
                                </motion.button>

                                <motion.button
                                    className={`cg-source-tab-v2 ${sourceType === 'journal' ? 'active' : ''}`}
                                    onClick={() => setSourceType('journal')}
                                    whileTap={{ scale: 0.98 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <div className={`cg-source-icon-wrapper-v2 ${sourceType === 'journal' ? 'active' : ''}`}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                            <polyline points="14 2 14 8 20 8" />
                                            <line x1="16" y1="13" x2="8" y2="13" />
                                            <line x1="16" y1="17" x2="8" y2="17" />
                                        </svg>
                                    </div>
                                    <span>Journal</span>
                                </motion.button>
                            </div>
                        </div>

                        {/* Input Fields */}
                        <div className="cg-input-section-v2">
                            <div className="cg-section-header-v2">
                                <div className="cg-section-icon-v2" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                </div>
                                <span className="cg-section-label-v2">Source Details</span>
                            </div>
                        </div>
                        <div className="cg-input-grid-v2">
                            <motion.div 
                                className="cg-floating-input-group"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <input
                                    type="text"
                                    autoComplete="off"
                                    value={citationData.authors}
                                    onChange={(e) => handleInputChange('authors', e.target.value)}
                                    className={`cg-floating-input ${citationData.authors ? 'has-value' : ''}`}
                                />
                                <label className="cg-floating-label">Author(s)</label>
                            </motion.div>

                            <motion.div 
                                className="cg-floating-input-group"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: 0.05 }}
                            >
                                <input
                                    type="text"
                                    autoComplete="off"
                                    value={citationData.title}
                                    onChange={(e) => handleInputChange('title', e.target.value)}
                                    className={`cg-floating-input ${citationData.title ? 'has-value' : ''}`}
                                />
                                <label className="cg-floating-label">Title</label>
                            </motion.div>

                            <motion.div 
                                className="cg-floating-input-group"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: 0.1 }}
                            >
                                <input
                                    type="text"
                                    autoComplete="off"
                                    value={citationData.publicationYear}
                                    onChange={(e) => handleInputChange('publicationYear', e.target.value)}
                                    className={`cg-floating-input ${citationData.publicationYear ? 'has-value' : ''}`}
                                />
                                <label className="cg-floating-label">Year</label>
                            </motion.div>

                            {sourceType === 'book' && (
                                <motion.div 
                                    className="cg-floating-input-group"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <input
                                        type="text"
                                        autoComplete="off"
                                        value={citationData.publisher || ''}
                                        onChange={(e) => handleInputChange('publisher', e.target.value)}
                                        className={`cg-floating-input ${citationData.publisher ? 'has-value' : ''}`}
                                    />
                                    <label className="cg-floating-label">Publisher</label>
                                </motion.div>
                            )}

                            {sourceType === 'website' && (
                                <>
                                    <motion.div 
                                        className="cg-floating-input-group"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <input
                                            type="text"
                                            autoComplete="off"
                                            value={citationData.url || ''}
                                            onChange={(e) => handleInputChange('url', e.target.value)}
                                            className={`cg-floating-input ${citationData.url ? 'has-value' : ''}`}
                                        />
                                        <label className="cg-floating-label">URL</label>
                                    </motion.div>
                                    <motion.div 
                                        className="cg-floating-input-group"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2, delay: 0.05 }}
                                    >
                                        <input
                                            type="text"
                                            autoComplete="off"
                                            value={citationData.accessDate || ''}
                                            onChange={(e) => handleInputChange('accessDate', e.target.value)}
                                            className={`cg-floating-input ${citationData.accessDate ? 'has-value' : ''}`}
                                        />
                                        <label className="cg-floating-label">Access Date</label>
                                    </motion.div>
                                </>
                            )}

                            {sourceType === 'journal' && (
                                <>
                                    <motion.div 
                                        className="cg-floating-input-group"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <input
                                            type="text"
                                            autoComplete="off"
                                            value={citationData.journalName || ''}
                                            onChange={(e) => handleInputChange('journalName', e.target.value)}
                                            className={`cg-floating-input ${citationData.journalName ? 'has-value' : ''}`}
                                        />
                                        <label className="cg-floating-label">Journal Name</label>
                                    </motion.div>
                                    <motion.div 
                                        className="cg-floating-input-group"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2, delay: 0.05 }}
                                    >
                                        <input
                                            type="text"
                                            autoComplete="off"
                                            value={citationData.volume || ''}
                                            onChange={(e) => handleInputChange('volume', e.target.value)}
                                            className={`cg-floating-input ${citationData.volume ? 'has-value' : ''}`}
                                        />
                                        <label className="cg-floating-label">Volume</label>
                                    </motion.div>
                                    <motion.div 
                                        className="cg-floating-input-group"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2, delay: 0.1 }}
                                    >
                                        <input
                                            type="text"
                                            autoComplete="off"
                                            value={citationData.issue || ''}
                                            onChange={(e) => handleInputChange('issue', e.target.value)}
                                            className={`cg-floating-input ${citationData.issue ? 'has-value' : ''}`}
                                        />
                                        <label className="cg-floating-label">Issue</label>
                                    </motion.div>
                                    <motion.div 
                                        className="cg-floating-input-group"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2, delay: 0.15 }}
                                    >
                                        <input
                                            type="text"
                                            autoComplete="off"
                                            value={citationData.pages || ''}
                                            onChange={(e) => handleInputChange('pages', e.target.value)}
                                            className={`cg-floating-input ${citationData.pages ? 'has-value' : ''}`}
                                        />
                                        <label className="cg-floating-label">Pages</label>
                                    </motion.div>
                                </>
                            )}
                        </div>
                    </motion.div>

                    {/* Generated Citation Display */}
                    <motion.aside
                        className="cg-sidebar"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <motion.div 
                            className="cg-citation-card-v2"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                            whileHover={{ y: -2, boxShadow: isDarkMode ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(139, 92, 246, 0.12)' }}
                        >
                            <div className="cg-card-header-v2">
                                <motion.div 
                                    className="cg-card-icon-v2 cg-card-icon-purple"
                                    whileHover={{ scale: 1.05, rotate: 3 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                                    </svg>
                                </motion.div>
                                <span className="cg-card-title-v2">Generated Citation</span>
                            </div>

                            <AnimatePresence mode="wait">
                                {generatedCitation ? (
                                    <motion.div
                                        key="citation"
                                        initial={{ opacity: 0, scale: 0.96 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.96 }}
                                        transition={{ duration: 0.25, ease: 'easeOut' }}
                                        className="cg-citation-output-v2"
                                    >
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.1 }}
                                        >
                                            {generatedCitation}
                                        </motion.p>
                                        <motion.button
                                            className="cg-copy-btn-v2"
                                            onClick={handleCopy}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                        >
                                            <AnimatePresence mode="wait">
                                                {copied ? (
                                                    <motion.span
                                                        key="copied"
                                                        initial={{ opacity: 0, y: 8 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -8 }}
                                                        className="cg-copy-content"
                                                    >
                                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                        Copied
                                                    </motion.span>
                                                ) : (
                                                    <motion.span
                                                        key="copy"
                                                        initial={{ opacity: 0, y: 8 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -8 }}
                                                        className="cg-copy-content"
                                                    >
                                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                                        </svg>
                                                        Copy
                                                    </motion.span>
                                                )}
                                            </AnimatePresence>
                                        </motion.button>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="empty"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="cg-citation-empty-v2"
                                    >
                                        <motion.div 
                                            className="cg-empty-icon-v2"
                                            animate={{ 
                                                y: [0, -4, 0],
                                            }}
                                            transition={{ 
                                                duration: 3,
                                                repeat: Infinity,
                                                ease: 'easeInOut'
                                            }}
                                        >
                                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                                                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                                                <line x1="8" y1="12" x2="16" y2="12" opacity="0.4" />
                                                <line x1="8" y1="16" x2="12" y2="16" opacity="0.4" />
                                            </svg>
                                        </motion.div>
                                        <p>Fill in the fields to generate</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        {/* Quick Tips */}
                        <motion.div 
                            className="cg-tips-card-v2"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                            whileHover={{ y: -2, boxShadow: isDarkMode ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(59, 130, 246, 0.08)' }}
                        >
                            <div className="cg-card-header-v2">
                                <motion.div 
                                    className="cg-card-icon-v2 cg-card-icon-blue"
                                    whileHover={{ scale: 1.05, rotate: -3 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M12 16v-4" />
                                        <path d="M12 8h.01" />
                                    </svg>
                                </motion.div>
                                <span className="cg-card-title-v2">Quick Tips</span>
                            </div>
                            <div className="cg-tips-content-v2">
                                <motion.div
                                    className="cg-tip-item-v2"
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    whileHover={{ x: 4 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <div className="cg-tip-icon-v2" style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                        </svg>
                                    </div>
                                    <span>Separate multiple authors with commas</span>
                                </motion.div>
                                <motion.div
                                    className="cg-tip-item-v2"
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    whileHover={{ x: 4 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <div className="cg-tip-icon-v2" style={{ backgroundColor: 'rgba(139, 92, 246, 0.12)' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="19" y1="4" x2="10" y2="4" />
                                            <line x1="14" y1="20" x2="5" y2="20" />
                                            <line x1="15" y1="4" x2="9" y2="20" />
                                        </svg>
                                    </div>
                                    <span>Use italics for titles in most styles</span>
                                </motion.div>
                                <motion.div
                                    className="cg-tip-item-v2"
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    whileHover={{ x: 4 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <div className="cg-tip-icon-v2" style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                            <polyline points="22 4 12 14.01 9 11.01" />
                                        </svg>
                                    </div>
                                    <span>Double-check with your style guide</span>
                                </motion.div>
                            </div>
                        </motion.div>
                    </motion.aside>
                </div>
            )}

            <style>{`
                .cg-container {
                    min-height: 100%;
                    padding: 24px;
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                }

                body.dark-mode .cg-container {
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                }

                /* Header Area */
                .cg-header-area {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    gap: 24px;
                    margin-bottom: 32px;
                    flex-wrap: wrap;
                }

                .cg-title-card {
                    padding: 20px 24px;
                    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
                    border-radius: 20px;
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    position: relative;
                    overflow: hidden;
                    cursor: pointer;
                    min-width: 320px;
                }

                body.dark-mode .cg-title-card {
                    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                    border-color: #334155;
                }

                .cg-title-gradient {
                    position: absolute;
                    top: 0;
                    right: 0;
                    width: 160px;
                    height: 160px;
                    background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
                    border-radius: 50%;
                    transform: translate(30%, -30%);
                    pointer-events: none;
                }

                .cg-title-icon-wrapper {
                    width: 52px;
                    height: 52px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    position: relative;
                }

                .cg-title-content {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    gap: 4px;
                }

                .cg-title-content h1 {
                    font-size: 22px;
                    font-weight: 700;
                    margin: 0;
                    line-height: 1.2;
                }

                .cg-badges {
                    display: flex;
                    gap: 8px;
                }

                .cg-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    padding: 5px 10px;
                    font-size: 11px;
                    font-weight: 600;
                    border-radius: 20px;
                    transition: all 0.2s;
                }

                .cg-badge svg {
                    flex-shrink: 0;
                }

                /* Actions Bar */
                .cg-actions-bar {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                }

                .cg-actions-divider {
                    width: 1px;
                    height: 24px;
                    background: #e2e8f0;
                    margin: 0 4px;
                }

                body.dark-mode .cg-actions-divider {
                    background: #334155;
                }

                .cg-actions {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                }

                .cg-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 10px 16px;
                    border-radius: 12px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    border: 1px solid transparent;
                    background: transparent;
                    white-space: nowrap;
                }

                .cg-btn:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                    pointer-events: none;
                }

                .cg-btn-ghost {
                    background: white;
                    border: 1px solid #e2e8f0;
                    color: #64748b;
                }

                .cg-btn-secondary {
                    background: white;
                    border: 1px solid #e2e8f0;
                    color: #64748b;
                }

                .cg-btn-primary {
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    color: white;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                }

                .cg-btn-primary.copied {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                }

                body.dark-mode .cg-btn-ghost,
                body.dark-mode .cg-btn-secondary {
                    background: #1e293b;
                    border-color: #334155;
                    color: #94a3b8;
                }

                body.dark-mode .cg-btn-ghost:hover,
                body.dark-mode .cg-btn-secondary:hover {
                    background: #334155 !important;
                    color: #f1f5f9 !important;
                }

                /* Content Layout */
                .cg-content {
                    display: grid;
                    grid-template-columns: 1fr 300px;
                    gap: 24px;
                    min-height: calc(100vh - 200px);
                }

                @media (max-width: 900px) {
                    .cg-content {
                        grid-template-columns: 1fr;
                    }
                }

                /* Editor Section V2 */
                .cg-editor-section-v2 {
                    background: white;
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    border-radius: 20px;
                    padding: 28px;
                    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }

                body.dark-mode .cg-editor-section-v2 {
                    background: rgba(30, 41, 59, 0.9);
                    border-color: rgba(51, 65, 85, 0.6);
                }

                .cg-section-header-v2 {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 14px;
                }

                .cg-section-icon-v2 {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .cg-section-label-v2 {
                    font-size: 12px;
                    font-weight: 600;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                body.dark-mode .cg-section-label-v2 {
                    color: #94a3b8;
                }

                /* Style Selector V2 */
                .cg-style-selector-v2 {
                    margin-bottom: 28px;
                }

                .cg-style-tabs-v2 {
                    display: flex;
                    gap: 0;
                    background: rgba(241, 245, 249, 0.6);
                    padding: 4px;
                    border-radius: 12px;
                    position: relative;
                }

                body.dark-mode .cg-style-tabs-v2 {
                    background: rgba(15, 23, 42, 0.5);
                }

                .cg-style-tab-v2 {
                    flex: 1;
                    padding: 10px 16px;
                    background: transparent;
                    border: none;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: 600;
                    color: #64748b;
                    cursor: pointer;
                    transition: color 0.2s ease;
                }

                .cg-style-tab-v2:hover {
                    color: #3b82f6;
                }

                .cg-style-tab-v2.active {
                    color: #3b82f6;
                }

                body.dark-mode .cg-style-tab-v2 {
                    color: #94a3b8;
                }

                body.dark-mode .cg-style-tab-v2:hover {
                    color: #60a5fa;
                }

                body.dark-mode .cg-style-tab-v2.active {
                    color: #60a5fa;
                }

                /* Source Selector V2 */
                .cg-source-selector-v2 {
                    margin-bottom: 28px;
                }

                .cg-source-tabs-v2 {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 10px;
                }

                .cg-source-tab-v2 {
                    padding: 16px 12px;
                    background: rgba(248, 250, 252, 0.8);
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    border-radius: 12px;
                    font-size: 13px;
                    font-weight: 500;
                    color: #64748b;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                }

                .cg-source-tab-v2:hover {
                    border-color: #3b82f6;
                    background: rgba(59, 130, 246, 0.04);
                }

                .cg-source-tab-v2.active {
                    border-color: #3b82f6;
                    background: rgba(59, 130, 246, 0.06);
                    color: #3b82f6;
                }

                body.dark-mode .cg-source-tab-v2 {
                    background: rgba(15, 23, 42, 0.5);
                    border-color: rgba(51, 65, 85, 0.6);
                    color: #94a3b8;
                }

                body.dark-mode .cg-source-tab-v2:hover {
                    border-color: #60a5fa;
                    background: rgba(96, 165, 250, 0.08);
                }

                body.dark-mode .cg-source-tab-v2.active {
                    border-color: #60a5fa;
                    background: rgba(96, 165, 250, 0.12);
                    color: #60a5fa;
                }

                .cg-source-icon-wrapper-v2 {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(100, 116, 139, 0.08);
                    color: #64748b;
                    transition: all 0.2s ease;
                }

                .cg-source-icon-wrapper-v2.active {
                    background: rgba(59, 130, 246, 0.12);
                    color: #3b82f6;
                }

                body.dark-mode .cg-source-icon-wrapper-v2 {
                    background: rgba(148, 163, 184, 0.1);
                    color: #94a3b8;
                }

                body.dark-mode .cg-source-icon-wrapper-v2.active {
                    background: rgba(96, 165, 250, 0.15);
                    color: #60a5fa;
                }

                /* Input Section V2 */
                .cg-input-section-v2 {
                    margin-bottom: 16px;
                }

                .cg-input-grid-v2 {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }

                @media (max-width: 768px) {
                    .cg-input-grid-v2 {
                        grid-template-columns: 1fr;
                    }
                }

                /* Floating Label Input Style */
                .cg-floating-input-group {
                    position: relative;
                }

                .cg-floating-input {
                    width: 100%;
                    border: 1.5px solid #cbd5e1;
                    border-radius: 12px;
                    background: transparent;
                    padding: 14px 16px;
                    font-size: 14px;
                    color: #1e293b;
                    transition: border 150ms cubic-bezier(0.4, 0, 0.2, 1);
                    outline: none;
                }

                .cg-floating-input:focus,
                .cg-floating-input.has-value {
                    border: 1.5px solid #3b82f6;
                }

                .cg-floating-label {
                    position: absolute;
                    left: 14px;
                    top: 50%;
                    color: #94a3b8;
                    pointer-events: none;
                    transform: translateY(-50%);
                    transition: 150ms cubic-bezier(0.4, 0, 0.2, 1);
                    font-size: 14px;
                    font-weight: 500;
                    background: transparent;
                    padding: 0;
                }

                .cg-floating-input:focus ~ .cg-floating-label,
                .cg-floating-input.has-value ~ .cg-floating-label {
                    transform: translateY(-170%) scale(0.85);
                    background-color: white;
                    padding: 0 6px;
                    color: #3b82f6;
                    font-weight: 600;
                }

                body.dark-mode .cg-floating-input {
                    border-color: #475569;
                    color: #e2e8f0;
                    background: transparent;
                }

                body.dark-mode .cg-floating-input:focus,
                body.dark-mode .cg-floating-input.has-value {
                    border-color: #60a5fa;
                }

                body.dark-mode .cg-floating-label {
                    color: #64748b;
                }

                body.dark-mode .cg-floating-input:focus ~ .cg-floating-label,
                body.dark-mode .cg-floating-input.has-value ~ .cg-floating-label {
                    background-color: #1e293b;
                    color: #60a5fa;
                }

                /* Legacy input styles */
                .cg-input-group-v2 {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .cg-input-group-v2 label {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                    font-weight: 600;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }

                .cg-input-group-v2 label svg {
                    color: #94a3b8;
                }

                body.dark-mode .cg-input-group-v2 label {
                    color: #94a3b8;
                }

                body.dark-mode .cg-input-group-v2 label svg {
                    color: #64748b;
                }

                .cg-input-v2 {
                    padding: 12px 14px;
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    border-radius: 10px;
                    font-size: 14px;
                    color: #1e293b;
                    background: rgba(248, 250, 252, 0.5);
                    transition: all 0.2s ease;
                }

                .cg-input-v2::placeholder {
                    color: #94a3b8;
                }

                .cg-input-v2:hover {
                    border-color: #cbd5e1;
                }

                .cg-input-v2:focus {
                    outline: none;
                    border-color: #3b82f6;
                    background: white;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08);
                }

                body.dark-mode .cg-input-v2 {
                    background: rgba(15, 23, 42, 0.5);
                    border-color: rgba(51, 65, 85, 0.6);
                    color: #e2e8f0;
                }

                body.dark-mode .cg-input-v2::placeholder {
                    color: #64748b;
                }

                body.dark-mode .cg-input-v2:hover {
                    border-color: #475569;
                }

                body.dark-mode .cg-input-v2:focus {
                    border-color: #60a5fa;
                    background: rgba(30, 41, 59, 0.8);
                    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
                }

                /* Legacy Editor Section */
                .cg-editor-section {
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    padding: 24px;
                }

                body.dark-mode .cg-editor-section {
                    background: #1e293b;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                }

                .cg-section-label {
                    display: block;
                    font-size: 14px;
                    font-weight: 700;
                    color: #1e293b;
                    margin-bottom: 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                body.dark-mode .cg-section-label {
                    color: #f1f5f9;
                }

                /* Style Selector */
                .cg-style-selector {
                    margin-bottom: 24px;
                }

                .cg-style-tabs {
                    display: flex;
                    gap: 8px;
                }

                .cg-style-tab {
                    flex: 1;
                    padding: 10px;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    color: #64748b;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .cg-style-tab:hover {
                    background: #eff6ff;
                    border-color: #3b82f6;
                    color: #3b82f6;
                }

                .cg-style-tab.active {
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    border-color: #3b82f6;
                    color: white;
                }

                body.dark-mode .cg-style-tab {
                    background: #0f172a;
                    border-color: #334155;
                    color: #94a3b8;
                }

                body.dark-mode .cg-style-tab:hover {
                    background: #334155;
                    border-color: #60a5fa;
                    color: #60a5fa;
                }

                /* Source Selector */
                .cg-source-selector {
                    margin-bottom: 24px;
                }

                .cg-source-tabs {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 8px;
                }

                .cg-source-tab {
                    padding: 14px 12px;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: 600;
                    color: #64748b;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                }

                .cg-source-icon-svg {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: color 0.2s;
                }

                .cg-source-tab:hover {
                    background: #eff6ff;
                    border-color: #3b82f6;
                    color: #3b82f6;
                    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
                }

                .cg-source-tab.active {
                    background: #eff6ff;
                    border-color: #3b82f6;
                    color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                body.dark-mode .cg-source-tab {
                    background: #0f172a;
                    border-color: #334155;
                    color: #94a3b8;
                }

                body.dark-mode .cg-source-tab:hover,
                body.dark-mode .cg-source-tab.active {
                    background: #334155;
                    border-color: #60a5fa;
                    color: #60a5fa;
                    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
                }

                /* Input Grid */
                .cg-input-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }

                @media (max-width: 768px) {
                    .cg-input-grid {
                        grid-template-columns: 1fr;
                    }
                }

                .cg-input-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .cg-input-group label {
                    font-size: 13px;
                    font-weight: 600;
                    color: #475569;
                }

                body.dark-mode .cg-input-group label {
                    color: #cbd5e1;
                }

                .cg-input {
                    padding: 10px 12px;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    font-size: 14px;
                    color: #1e293b;
                    background: white;
                    transition: all 0.2s;
                }

                .cg-input:focus {
                    outline: none;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                body.dark-mode .cg-input {
                    background: #0f172a;
                    border-color: #334155;
                    color: #e2e8f0;
                }

                body.dark-mode .cg-input:focus {
                    border-color: #60a5fa;
                    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
                }

                /* Sidebar */
                .cg-sidebar {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                /* New Minimalistic Card Styles V2 */
                .cg-citation-card-v2,
                .cg-tips-card-v2 {
                    background: white;
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    border-radius: 16px;
                    padding: 20px;
                    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }

                body.dark-mode .cg-citation-card-v2,
                body.dark-mode .cg-tips-card-v2 {
                    background: rgba(30, 41, 59, 0.8);
                    border-color: rgba(51, 65, 85, 0.6);
                    backdrop-filter: blur(8px);
                }

                .cg-card-header-v2 {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 18px;
                }

                .cg-card-icon-v2 {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .cg-card-icon-purple {
                    background: linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(139, 92, 246, 0.06) 100%);
                    color: #8b5cf6;
                }

                body.dark-mode .cg-card-icon-purple {
                    background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%);
                    color: #a78bfa;
                }

                .cg-card-icon-blue {
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.06) 100%);
                    color: #3b82f6;
                }

                body.dark-mode .cg-card-icon-blue {
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%);
                    color: #60a5fa;
                }

                .cg-card-title-v2 {
                    font-size: 13px;
                    font-weight: 600;
                    color: #334155;
                    letter-spacing: 0.3px;
                    text-transform: uppercase;
                }

                body.dark-mode .cg-card-title-v2 {
                    color: #e2e8f0;
                }

                /* Citation Output V2 */
                .cg-citation-output-v2 {
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                }

                .cg-citation-output-v2 p {
                    font-size: 13.5px;
                    line-height: 1.7;
                    color: #475569;
                    margin: 0;
                    padding: 14px 16px;
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                    border-radius: 10px;
                    border-left: 3px solid #8b5cf6;
                    font-family: 'Georgia', serif;
                }

                body.dark-mode .cg-citation-output-v2 p {
                    background: linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(30, 41, 59, 0.4) 100%);
                    color: #cbd5e1;
                    border-left-color: #a78bfa;
                }

                .cg-copy-btn-v2 {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 10px 18px;
                    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    overflow: hidden;
                    position: relative;
                }

                .cg-copy-btn-v2::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 100%);
                    opacity: 0;
                    transition: opacity 0.2s;
                }

                .cg-copy-btn-v2:hover::before {
                    opacity: 1;
                }

                .cg-copy-content {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                /* Empty State V2 */
                .cg-citation-empty-v2 {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 32px 16px;
                    text-align: center;
                }

                .cg-empty-icon-v2 {
                    color: #cbd5e1;
                    margin-bottom: 12px;
                }

                body.dark-mode .cg-empty-icon-v2 {
                    color: #475569;
                }

                .cg-citation-empty-v2 p {
                    font-size: 13px;
                    color: #94a3b8;
                    margin: 0;
                    font-weight: 500;
                }

                body.dark-mode .cg-citation-empty-v2 p {
                    color: #64748b;
                }

                /* Tips Content V2 */
                .cg-tips-content-v2 {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .cg-tip-item-v2 {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 12px;
                    border-radius: 10px;
                    cursor: default;
                    transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }

                .cg-tip-icon-v2 {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .cg-tip-icon-v2 svg {
                    display: block;
                }

                .cg-tip-item-v2 span {
                    font-size: 13px;
                    color: #64748b;
                    line-height: 1.5;
                    font-weight: 450;
                }

                body.dark-mode .cg-tip-item-v2 span {
                    color: #94a3b8;
                }

                /* Legacy styles kept for compatibility */
                .cg-citation-card,
                .cg-tips-card {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 14px;
                    padding: 18px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }

                body.dark-mode .cg-citation-card,
                body.dark-mode .cg-tips-card {
                    background: #1e293b;
                    border-color: #334155;
                }

                .cg-card-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 16px;
                }

                .cg-card-header h3 {
                    font-size: 13px;
                    font-weight: 700;
                    color: #1e293b;
                    margin: 0;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                body.dark-mode .cg-card-header h3 {
                    color: #f1f5f9;
                }

                /* Skeleton Loading */
                .cg-skeleton {
                    background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
                    background-size: 200% 100%;
                    animation: loading 1.5s infinite;
                    border-radius: 8px;
                }

                body.dark-mode .cg-skeleton {
                    background: linear-gradient(90deg, #334155 25%, #475569 50%, #334155 75%);
                    background-size: 200% 100%;
                }

                @keyframes loading {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }

                /* Skeleton Loading */
                .cg-skeleton {
                    background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
                    background-size: 200% 100%;
                    animation: cg-loading 1.5s infinite;
                    border-radius: 8px;
                }

                body.dark-mode .cg-skeleton {
                    background: linear-gradient(90deg, #334155 25%, #475569 50%, #334155 75%);
                    background-size: 200% 100%;
                }

                @keyframes cg-loading {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </motion.div>
    );
};

export default CitationGenerator;
