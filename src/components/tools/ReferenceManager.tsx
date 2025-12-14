/**
 * Reference Manager Component
 * Save, organize, and export research citations
 */

import * as React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";

interface ReferenceManagerProps {
    onBack: () => void;
}

type CitationStyle = 'APA' | 'MLA' | 'Chicago';
type SourceType = 'book' | 'website' | 'journal';

interface Reference {
    id: string;
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
    tags: string[];
    dateAdded: number;
}

const ReferenceManager: React.FC<ReferenceManagerProps> = ({ onBack }) => {
    const [references, setReferences] = useState<Reference[]>([]);
    const [citationStyle, setCitationStyle] = useState<CitationStyle>('APA');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isTitleHovered, setIsTitleHovered] = useState(false);
    
    // Form state
    const [formSourceType, setFormSourceType] = useState<SourceType>('book');
    const [formData, setFormData] = useState({
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
        tags: ''
    });
    const [isLoading, setIsLoading] = useState(true);
    
    // Auto-save draft state
    const [draftSaveStatus, setDraftSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [hasDraft, setHasDraft] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkModeEnabled');
        return saved === 'true' || document.body.classList.contains('dark-mode');
    });

    // Load references from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('references');
        if (saved) {
            setReferences(JSON.parse(saved));
        }
        setTimeout(() => setIsLoading(false), 800);
    }, []);

    // Save references to localStorage
    useEffect(() => {
        if (references.length > 0) {
            localStorage.setItem('references', JSON.stringify(references));
        }
    }, [references]);

    // Dark mode sync
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

    // Search debounce effect
    useEffect(() => {
        if (!searchQuery) {
            setIsSearching(false);
            return;
        }
        
        setIsSearching(true);
        const debounceTimer = setTimeout(() => {
            setIsSearching(false);
        }, 400);

        return () => clearTimeout(debounceTimer);
    }, [searchQuery]);

    // Load draft on mount
    useEffect(() => {
        const savedDraft = localStorage.getItem('referenceDraft');
        if (savedDraft) {
            try {
                const draft = JSON.parse(savedDraft);
                if (draft.formData && (draft.formData.authors || draft.formData.title)) {
                    setHasDraft(true);
                }
            } catch {
                // Invalid draft, ignore
            }
        }
    }, []);

    // Auto-save draft when form data changes
    useEffect(() => {
        if (!showAddForm) return;
        
        const hasContent = formData.authors || formData.title || formData.publicationYear;
        if (!hasContent) return;

        setDraftSaveStatus('saving');
        
        const saveTimeout = setTimeout(() => {
            const draft = {
                formSourceType,
                formData,
                editingId,
                savedAt: Date.now()
            };
            localStorage.setItem('referenceDraft', JSON.stringify(draft));
            setDraftSaveStatus('saved');
            
            // Reset to idle after showing "saved"
            setTimeout(() => setDraftSaveStatus('idle'), 2000);
        }, 500);

        return () => clearTimeout(saveTimeout);
    }, [formData, formSourceType, showAddForm, editingId]);

    // Load draft when opening form (if not editing)
    const loadDraft = () => {
        const savedDraft = localStorage.getItem('referenceDraft');
        if (savedDraft) {
            try {
                const draft = JSON.parse(savedDraft);
                if (draft.formData) {
                    setFormSourceType(draft.formSourceType || 'book');
                    setFormData(draft.formData);
                    setEditingId(draft.editingId || null);
                }
            } catch {
                // Invalid draft, ignore
            }
        }
        setHasDraft(false);
        setShowAddForm(true);
    };

    // Clear draft
    const clearDraft = () => {
        localStorage.removeItem('referenceDraft');
        setHasDraft(false);
    };

    const generateCitation = (ref: Reference, style: CitationStyle): string => {
        const { authors, title, publicationYear, publisher, url, accessDate, journalName, volume, issue, pages } = ref;

        switch (style) {
            case 'APA':
                if (ref.sourceType === 'book') {
                    return `${authors} (${publicationYear}). *${title}*${publisher ? `. ${publisher}` : ''}.`;
                } else if (ref.sourceType === 'website') {
                    return `${authors} (${publicationYear}). *${title}*. Retrieved ${accessDate || 'Date'}, from ${url || 'URL'}`;
                } else {
                    return `${authors} (${publicationYear}). ${title}. *${journalName}*, *${volume}*(${issue}), ${pages}.`;
                }
            case 'MLA':
                if (ref.sourceType === 'book') {
                    return `${authors}. *${title}*${publisher ? `. ${publisher}` : ''}, ${publicationYear}.`;
                } else if (ref.sourceType === 'website') {
                    return `${authors}. "${title}." ${publicationYear}. Web. ${accessDate || 'Date'}. <${url || 'URL'}>.`;
                } else {
                    return `${authors}. "${title}." *${journalName}* ${volume}.${issue} (${publicationYear}): ${pages}. Print.`;
                }
            case 'Chicago':
                if (ref.sourceType === 'book') {
                    return `${authors}. *${title}*${publisher ? `. ${publisher}` : ''}, ${publicationYear}.`;
                } else if (ref.sourceType === 'website') {
                    return `${authors}. "${title}." Accessed ${accessDate || 'Date'}. ${url || 'URL'}.`;
                } else {
                    return `${authors}. "${title}." *${journalName}* ${volume}, no. ${issue} (${publicationYear}): ${pages}.`;
                }
        }
    };

    const exportBibliography = () => {
        const bibliography = filteredReferences
            .map(ref => generateCitation(ref, citationStyle))
            .join('\n\n');

        const blob = new Blob([bibliography], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bibliography-${citationStyle}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const deleteReference = (id: string) => {
        setReferences(refs => refs.filter(r => r.id !== id));
    };

    const resetForm = () => {
        setFormData({
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
            tags: ''
        });
        setFormSourceType('book');
        setEditingId(null);
        setDraftSaveStatus('idle');
        clearDraft();
    };

    const handleAddReference = () => {
        if (!formData.authors || !formData.title || !formData.publicationYear) return;

        const newRef: Reference = {
            id: editingId || Date.now().toString(),
            sourceType: formSourceType,
            authors: formData.authors,
            title: formData.title,
            publicationYear: formData.publicationYear,
            publisher: formData.publisher || undefined,
            url: formData.url || undefined,
            accessDate: formData.accessDate || undefined,
            journalName: formData.journalName || undefined,
            volume: formData.volume || undefined,
            issue: formData.issue || undefined,
            pages: formData.pages || undefined,
            tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : [],
            dateAdded: editingId ? references.find(r => r.id === editingId)?.dateAdded || Date.now() : Date.now()
        };

        if (editingId) {
            setReferences(refs => refs.map(r => r.id === editingId ? newRef : r));
        } else {
            setReferences(refs => [...refs, newRef]);
        }

        resetForm();
        setShowAddForm(false);
    };

    const handleEditReference = (ref: Reference) => {
        setFormSourceType(ref.sourceType);
        setFormData({
            authors: ref.authors,
            title: ref.title,
            publicationYear: ref.publicationYear,
            publisher: ref.publisher || '',
            url: ref.url || '',
            accessDate: ref.accessDate || '',
            journalName: ref.journalName || '',
            volume: ref.volume || '',
            issue: ref.issue || '',
            pages: ref.pages || '',
            tags: ref.tags.join(', ')
        });
        setEditingId(ref.id);
        setShowAddForm(true);
    };

    const allTags = Array.from(new Set(references.flatMap(r => r.tags)));

    const filteredReferences = references.filter(ref => {
        const matchesSearch = ref.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ref.authors.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => ref.tags.includes(tag));
        return matchesSearch && matchesTags;
    });

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rm-container">
            {/* Header */}
            <div className="rm-header-area">
                <motion.div
                    className="rm-title-card"
                    onHoverStart={() => setIsTitleHovered(true)}
                    onHoverEnd={() => setIsTitleHovered(false)}
                    animate={{
                        y: isTitleHovered ? -4 : 0,
                        boxShadow: isTitleHovered ? '0 20px 40px rgba(59, 130, 246, 0.15)' : '0 4px 20px rgba(0, 0, 0, 0.04)',
                        borderColor: isTitleHovered ? '#3b82f6' : (isDarkMode ? '#334155' : 'rgba(226, 232, 240, 0.8)')
                    }}
                >
                    <motion.div className="rm-title-gradient" animate={{ opacity: isTitleHovered ? 1 : 0 }} />
                    {isLoading ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
                            <div className="rm-skeleton" style={{ width: '52px', height: '52px', borderRadius: '14px' }} />
                            <div>
                                <div className="rm-skeleton" style={{ width: '180px', height: '24px', marginBottom: '8px' }} />
                                <div className="rm-skeleton" style={{ width: '120px', height: '18px' }} />
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
                            <motion.div
                                className="rm-title-icon-wrapper"
                                animate={{
                                    background: isTitleHovered ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : (isDarkMode ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff'),
                                    color: isTitleHovered ? '#ffffff' : (isDarkMode ? '#60a5fa' : '#3b82f6'),
                                    scale: isTitleHovered ? 1.05 : 1
                                }}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                                </svg>
                            </motion.div>
                            <div className="rm-title-content">
                                <motion.h1 animate={{ color: isTitleHovered ? '#3b82f6' : (isDarkMode ? '#f1f5f9' : '#1e293b') }}>
                                    Reference Manager
                                </motion.h1>
                                <div className="rm-badges">
                                    <motion.span className="rm-badge" animate={{
                                        backgroundColor: isTitleHovered ? 'rgba(59, 130, 246, 0.1)' : (isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'),
                                        color: isTitleHovered ? '#3b82f6' : (isDarkMode ? '#94a3b8' : '#64748b')
                                    }}>
                                        {references.length} References
                                    </motion.span>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="rm-actions-bar"
                >
                    {/* Navigation Group */}
                    <motion.button
                        onClick={onBack}
                        className="rm-btn rm-btn-ghost"
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

                    <div className="rm-actions-divider"></div>

                    {/* Tool Actions Group */}
                    <LayoutGroup>
                        <div className="rm-actions">
                            <motion.button
                                layout
                                layoutId="clear-btn"
                                onClick={() => setShowAddForm(true)}
                                className="rm-btn rm-btn-secondary"
                                whileHover={{
                                    scale: 1.02,
                                    backgroundColor: '#f1f5f9',
                                    transition: { duration: 0.15 }
                                }}
                                whileTap={{ scale: 0.97 }}
                                transition={{
                                    layout: {
                                        type: 'spring',
                                        stiffness: 400,
                                        damping: 30
                                    }
                                }}
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                Add Reference
                            </motion.button>

                            <motion.button
                                layout
                                layoutId="export-btn"
                                onClick={exportBibliography}
                                disabled={references.length === 0}
                                className="rm-btn rm-btn-primary"
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
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                Export
                            </motion.button>
                        </div>
                    </LayoutGroup>
                </motion.div>
            </div>

            {/* Main Content */}
            {isLoading ? (
                <div className="rm-content">
                    {/* Sidebar Skeleton */}
                    <aside className="rm-sidebar">
                        <div className="rm-filter-card">
                            <div className="rm-skeleton" style={{ width: '60px', height: '13px', marginBottom: '12px' }} />
                            <div className="rm-skeleton" style={{ width: '100%', height: '40px' }} />
                        </div>
                        <div className="rm-filter-card">
                            <div className="rm-skeleton" style={{ width: '100px', height: '13px', marginBottom: '12px' }} />
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                                <div className="rm-skeleton" style={{ height: '36px' }} />
                                <div className="rm-skeleton" style={{ height: '36px' }} />
                                <div className="rm-skeleton" style={{ height: '36px' }} />
                            </div>
                        </div>
                    </aside>

                    {/* Main Content Skeleton */}
                    <div className="rm-main">
                        {/* Reference Card Skeleton 1 */}
                        <div className="rm-skeleton-card">
                            <div className="rm-skeleton-card-header">
                                <div className="rm-skeleton" style={{ width: '60px', height: '22px', borderRadius: '6px' }} />
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <div className="rm-skeleton" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
                                    <div className="rm-skeleton" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
                                </div>
                            </div>
                            <div className="rm-skeleton" style={{ width: '70%', height: '18px', marginBottom: '8px' }} />
                            <div className="rm-skeleton" style={{ width: '40%', height: '14px', marginBottom: '12px' }} />
                            <div className="rm-skeleton-citation">
                                <div className="rm-skeleton" style={{ width: '100%', height: '14px', marginBottom: '6px' }} />
                                <div className="rm-skeleton" style={{ width: '60%', height: '14px' }} />
                            </div>
                        </div>
                        {/* Reference Card Skeleton 2 */}
                        <div className="rm-skeleton-card">
                            <div className="rm-skeleton-card-header">
                                <div className="rm-skeleton" style={{ width: '70px', height: '22px', borderRadius: '6px' }} />
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <div className="rm-skeleton" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
                                    <div className="rm-skeleton" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
                                </div>
                            </div>
                            <div className="rm-skeleton" style={{ width: '85%', height: '18px', marginBottom: '8px' }} />
                            <div className="rm-skeleton" style={{ width: '35%', height: '14px', marginBottom: '12px' }} />
                            <div className="rm-skeleton-citation">
                                <div className="rm-skeleton" style={{ width: '100%', height: '14px', marginBottom: '6px' }} />
                                <div className="rm-skeleton" style={{ width: '75%', height: '14px' }} />
                            </div>
                        </div>
                        {/* Reference Card Skeleton 3 */}
                        <div className="rm-skeleton-card">
                            <div className="rm-skeleton-card-header">
                                <div className="rm-skeleton" style={{ width: '55px', height: '22px', borderRadius: '6px' }} />
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <div className="rm-skeleton" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
                                    <div className="rm-skeleton" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
                                </div>
                            </div>
                            <div className="rm-skeleton" style={{ width: '60%', height: '18px', marginBottom: '8px' }} />
                            <div className="rm-skeleton" style={{ width: '45%', height: '14px', marginBottom: '12px' }} />
                            <div className="rm-skeleton-citation">
                                <div className="rm-skeleton" style={{ width: '100%', height: '14px', marginBottom: '6px' }} />
                                <div className="rm-skeleton" style={{ width: '50%', height: '14px' }} />
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="rm-content">
                    {/* Sidebar - Filters */}
                    <aside className="rm-sidebar">
                        <motion.div 
                            className="rm-filter-card-v2"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                        >
                            <div className="rm-card-header-v2">
                                <div className="rm-card-icon-v2 rm-card-icon-blue">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8" />
                                        <path d="M21 21l-4.35-4.35" />
                                    </svg>
                                </div>
                                <span className="rm-card-title-v2">Search</span>
                            </div>
                            <div className="rm-search-wrapper">
                                <AnimatePresence mode="wait">
                                    {isSearching ? (
                                        <motion.div
                                            key="spinner"
                                            className="rm-search-icon-circle rm-search-spinner-circle"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            transition={{ duration: 0.15 }}
                                        >
                                            <svg className="rm-search-spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M21 12a9 9 0 11-6.219-8.56" />
                                            </svg>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="search"
                                            className="rm-search-icon-circle"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            transition={{ duration: 0.15 }}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="11" cy="11" r="8" />
                                                <path d="M21 21l-4.35-4.35" />
                                            </svg>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <input
                                    type="text"
                                    placeholder="Search references..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="rm-search-input-v2"
                                />
                                {searchQuery && (
                                    <motion.button
                                        className="rm-search-clear"
                                        onClick={() => setSearchQuery('')}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="18" y1="6" x2="6" y2="18" />
                                            <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                    </motion.button>
                                )}
                            </div>
                        </motion.div>

                        <motion.div 
                            className="rm-filter-card-v2"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                        >
                            <div className="rm-card-header-v2">
                                <div className="rm-card-icon-v2 rm-card-icon-purple">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <line x1="16" y1="13" x2="8" y2="13" />
                                        <line x1="16" y1="17" x2="8" y2="17" />
                                    </svg>
                                </div>
                                <span className="rm-card-title-v2">Citation Style</span>
                            </div>
                            <div className="rm-style-tabs-v2">
                                <motion.div
                                    className="rm-style-indicator"
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
                                />
                                {(['APA', 'MLA', 'Chicago'] as CitationStyle[]).map(style => (
                                    <motion.button
                                        key={style}
                                        className={`rm-style-btn-v2 ${citationStyle === style ? 'active' : ''}`}
                                        onClick={() => setCitationStyle(style)}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {style}
                                    </motion.button>
                                ))}
                            </div>
                            
                            {/* Style Description & Example */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={citationStyle}
                                    className="rm-style-info"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {citationStyle === 'APA' && (
                                        <>
                                            <div className="rm-style-desc">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <line x1="12" y1="16" x2="12" y2="12" />
                                                    <line x1="12" y1="8" x2="12.01" y2="8" />
                                                </svg>
                                                <span>American Psychological Association - Used in social sciences</span>
                                            </div>
                                            <div className="rm-style-example">
                                                <span className="rm-example-label">Example:</span>
                                                <span className="rm-example-text">Smith, J. (2023). <em>Book Title</em>. Publisher.</span>
                                            </div>
                                        </>
                                    )}
                                    {citationStyle === 'MLA' && (
                                        <>
                                            <div className="rm-style-desc">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <line x1="12" y1="16" x2="12" y2="12" />
                                                    <line x1="12" y1="8" x2="12.01" y2="8" />
                                                </svg>
                                                <span>Modern Language Association - Used in humanities</span>
                                            </div>
                                            <div className="rm-style-example">
                                                <span className="rm-example-label">Example:</span>
                                                <span className="rm-example-text">Smith, John. <em>Book Title</em>. Publisher, 2023.</span>
                                            </div>
                                        </>
                                    )}
                                    {citationStyle === 'Chicago' && (
                                        <>
                                            <div className="rm-style-desc">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <line x1="12" y1="16" x2="12" y2="12" />
                                                    <line x1="12" y1="8" x2="12.01" y2="8" />
                                                </svg>
                                                <span>Chicago Manual of Style - Used in history & publishing</span>
                                            </div>
                                            <div className="rm-style-example">
                                                <span className="rm-example-label">Example:</span>
                                                <span className="rm-example-text">Smith, John. <em>Book Title</em>. Publisher, 2023.</span>
                                            </div>
                                        </>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </motion.div>

                        {allTags.length > 0 && (
                            <div className="rm-filter-card">
                                <h3>Tags</h3>
                                <div className="rm-tags">
                                    {allTags.map(tag => (
                                        <button
                                            key={tag}
                                            className={`rm-tag ${selectedTags.includes(tag) ? 'active' : ''}`}
                                            onClick={() => setSelectedTags(prev =>
                                                prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                                            )}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </aside>

                    {/* References List */}
                    <motion.div 
                        className="rm-main"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                    >
                        {/* Resume Draft Banner */}
                        <AnimatePresence>
                            {hasDraft && !showAddForm && (
                                <motion.div
                                    className="rm-draft-banner"
                                    initial={{ opacity: 0, y: -10, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                                    exit={{ opacity: 0, y: -10, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="rm-draft-banner-content">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                            <polyline points="14 2 14 8 20 8" />
                                            <line x1="12" y1="18" x2="12" y2="12" />
                                            <line x1="9" y1="15" x2="15" y2="15" />
                                        </svg>
                                        <span>You have an unsaved draft</span>
                                    </div>
                                    <div className="rm-draft-banner-actions">
                                        <motion.button
                                            className="rm-draft-btn rm-draft-btn-secondary"
                                            onClick={clearDraft}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            Discard
                                        </motion.button>
                                        <motion.button
                                            className="rm-draft-btn rm-draft-btn-primary"
                                            onClick={loadDraft}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="1 4 1 10 7 10" />
                                                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                                            </svg>
                                            Resume
                                        </motion.button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Search Loading Skeleton */}
                        <AnimatePresence mode="wait">
                            {isSearching && searchQuery ? (
                                <motion.div
                                    key="search-skeleton"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="rm-skeleton-card">
                                        <div className="rm-skeleton-card-header">
                                            <div className="rm-skeleton" style={{ width: '60px', height: '22px', borderRadius: '6px' }} />
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <div className="rm-skeleton" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
                                                <div className="rm-skeleton" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
                                            </div>
                                        </div>
                                        <div className="rm-skeleton" style={{ width: '70%', height: '18px', marginBottom: '8px' }} />
                                        <div className="rm-skeleton" style={{ width: '40%', height: '14px', marginBottom: '12px' }} />
                                        <div className="rm-skeleton-citation">
                                            <div className="rm-skeleton" style={{ width: '100%', height: '14px', marginBottom: '6px' }} />
                                            <div className="rm-skeleton" style={{ width: '60%', height: '14px' }} />
                                        </div>
                                    </div>
                                    <div className="rm-skeleton-card">
                                        <div className="rm-skeleton-card-header">
                                            <div className="rm-skeleton" style={{ width: '70px', height: '22px', borderRadius: '6px' }} />
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <div className="rm-skeleton" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
                                                <div className="rm-skeleton" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
                                            </div>
                                        </div>
                                        <div className="rm-skeleton" style={{ width: '85%', height: '18px', marginBottom: '8px' }} />
                                        <div className="rm-skeleton" style={{ width: '35%', height: '14px', marginBottom: '12px' }} />
                                        <div className="rm-skeleton-citation">
                                            <div className="rm-skeleton" style={{ width: '100%', height: '14px', marginBottom: '6px' }} />
                                            <div className="rm-skeleton" style={{ width: '75%', height: '14px' }} />
                                        </div>
                                    </div>
                                </motion.div>
                            ) : filteredReferences.length === 0 ? (
                                <motion.div 
                                    key="empty"
                                    className="rm-empty-v2"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.4, delay: 0.4 }}
                                >
                                    <div className="rm-empty-icon-wrapper">
                                        <div className="rm-empty-icon-bg">
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                                <line x1="12" y1="6" x2="12" y2="12" opacity="0.5" />
                                                <line x1="9" y1="9" x2="15" y2="9" opacity="0.5" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="rm-empty-content">
                                        <h3>No references yet</h3>
                                        <p>Add your first reference to start building your bibliography</p>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="references"
                                    className="rm-references"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {filteredReferences.map((ref, idx) => (
                                        <motion.div
                                            key={ref.id}
                                            className="rm-reference-card-v2"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                        >
                                            <div className="rm-ref-header-v2">
                                                <div className="rm-ref-type-badge">
                                                    {ref.sourceType === 'book' && (
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                                        </svg>
                                                    )}
                                                    {ref.sourceType === 'website' && (
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <circle cx="12" cy="12" r="10" />
                                                            <line x1="2" y1="12" x2="22" y2="12" />
                                                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                                        </svg>
                                                    )}
                                                    {ref.sourceType === 'journal' && (
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                            <polyline points="14 2 14 8 20 8" />
                                                            <line x1="16" y1="13" x2="8" y2="13" />
                                                            <line x1="16" y1="17" x2="8" y2="17" />
                                                        </svg>
                                                    )}
                                                    <span>{ref.sourceType}</span>
                                                </div>
                                                <div className="rm-ref-actions-v2">
                                                    <div className="rm-tooltip-wrapper">
                                                        <motion.button 
                                                            onClick={() => handleEditReference(ref)} 
                                                            className="rm-icon-btn-v2 rm-icon-btn-edit"
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.95 }}
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                            </svg>
                                                        </motion.button>
                                                        <span className="rm-tooltip">Edit reference</span>
                                                    </div>
                                                    <div className="rm-tooltip-wrapper">
                                                        <motion.button 
                                                            onClick={() => deleteReference(ref.id)} 
                                                            className="rm-icon-btn-v2 rm-icon-btn-delete"
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.95 }}
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="3 6 5 6 21 6" />
                                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                            </svg>
                                                        </motion.button>
                                                        <span className="rm-tooltip rm-tooltip-danger">Delete reference</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="rm-ref-content-v2">
                                                <h4 className="rm-ref-title-v2">{ref.title}</h4>
                                                
                                                <div className="rm-ref-meta-grid">
                                                    <div className="rm-ref-meta-item">
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                            <circle cx="12" cy="7" r="4" />
                                                        </svg>
                                                        <span>{ref.authors}</span>
                                                    </div>
                                                    <div className="rm-ref-meta-item">
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                            <line x1="16" y1="2" x2="16" y2="6" />
                                                            <line x1="8" y1="2" x2="8" y2="6" />
                                                            <line x1="3" y1="10" x2="21" y2="10" />
                                                        </svg>
                                                        <span>{ref.publicationYear}</span>
                                                    </div>
                                                    {ref.publisher && (
                                                        <div className="rm-ref-meta-item">
                                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                                                <polyline points="9 22 9 12 15 12 15 22" />
                                                            </svg>
                                                            <span>{ref.publisher}</span>
                                                        </div>
                                                    )}
                                                    {ref.journalName && (
                                                        <div className="rm-ref-meta-item">
                                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                                                                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                                                            </svg>
                                                            <span>{ref.journalName}{ref.volume && `, Vol. ${ref.volume}`}{ref.issue && `(${ref.issue})`}{ref.pages && `, pp. ${ref.pages}`}</span>
                                                        </div>
                                                    )}
                                                    {ref.url && (
                                                        <div className="rm-ref-meta-item rm-ref-meta-link">
                                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                                            </svg>
                                                            <a href={ref.url} target="_blank" rel="noopener noreferrer">{ref.url.length > 40 ? ref.url.substring(0, 40) + '...' : ref.url}</a>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <div className="rm-ref-citation-v2">
                                                    <div className="rm-citation-header">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21c0 1 0 1 1 1z" />
                                                            <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
                                                        </svg>
                                                        <span>{citationStyle} Format</span>
                                                    </div>
                                                    <p>{generateCitation(ref, citationStyle)}</p>
                                                </div>
                                                
                                                {ref.tags.length > 0 && (
                                                    <div className="rm-ref-tags-v2">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                                                            <line x1="7" y1="7" x2="7.01" y2="7" />
                                                        </svg>
                                                        {ref.tags.map(tag => (
                                                            <span key={tag} className="rm-ref-tag-v2">{tag}</span>
                                                        ))}
                                                    </div>
                                                )}
                                                
                                                <div className="rm-ref-footer">
                                                    <div className="rm-ref-added">
                                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <circle cx="12" cy="12" r="10" />
                                                            <polyline points="12 6 12 12 16 14" />
                                                        </svg>
                                                        <span>Added {new Date(ref.dateAdded).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            )}

            {/* Add/Edit Reference Modal */}
            <AnimatePresence>
                {showAddForm && (
                    <motion.div
                        className="rm-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => { setShowAddForm(false); resetForm(); }}
                    >
                        <motion.div
                            className="rm-modal"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="rm-modal-header">
                                <div className="rm-modal-title">
                                    <div className="rm-modal-icon">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                            <line x1="12" y1="6" x2="12" y2="12" />
                                            <line x1="9" y1="9" x2="15" y2="9" />
                                        </svg>
                                    </div>
                                    <div className="rm-modal-title-content">
                                        <span>{editingId ? 'Edit Reference' : 'Add Reference'}</span>
                                        <AnimatePresence mode="wait">
                                            {draftSaveStatus !== 'idle' && (
                                                <motion.div
                                                    className="rm-draft-indicator"
                                                    initial={{ opacity: 0, y: -5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -5 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    {draftSaveStatus === 'saving' && (
                                                        <>
                                                            <svg className="rm-draft-spinner" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                <path d="M21 12a9 9 0 11-6.219-8.56" />
                                                            </svg>
                                                            <span>Saving draft...</span>
                                                        </>
                                                    )}
                                                    {draftSaveStatus === 'saved' && (
                                                        <>
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="20 6 9 17 4 12" />
                                                            </svg>
                                                            <span>Draft saved</span>
                                                        </>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                                <motion.button
                                    className="rm-modal-close"
                                    onClick={() => { setShowAddForm(false); resetForm(); }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </motion.button>
                            </div>

                            {/* Source Type Selector */}
                            <div className="rm-modal-section">
                                <label className="rm-modal-label">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="7" height="7" />
                                        <rect x="14" y="3" width="7" height="7" />
                                        <rect x="14" y="14" width="7" height="7" />
                                        <rect x="3" y="14" width="7" height="7" />
                                    </svg>
                                    Source Type
                                </label>
                                <div className="rm-source-selector">
                                    {(['book', 'website', 'journal'] as SourceType[]).map(type => (
                                        <motion.button
                                            key={type}
                                            className={`rm-source-btn ${formSourceType === type ? 'active' : ''}`}
                                            onClick={() => setFormSourceType(type)}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            {type === 'book' && (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                                </svg>
                                            )}
                                            {type === 'website' && (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <line x1="2" y1="12" x2="22" y2="12" />
                                                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                                </svg>
                                            )}
                                            {type === 'journal' && (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                    <polyline points="14 2 14 8 20 8" />
                                                    <line x1="16" y1="13" x2="8" y2="13" />
                                                    <line x1="16" y1="17" x2="8" y2="17" />
                                                </svg>
                                            )}
                                            <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="rm-modal-form">
                                <div className="rm-form-row">
                                    <div className="rm-form-group">
                                        <label>Author(s) *</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., Smith, J. & Doe, A."
                                            value={formData.authors}
                                            onChange={(e) => setFormData({ ...formData, authors: e.target.value })}
                                        />
                                    </div>
                                    <div className="rm-form-group">
                                        <label>Year *</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., 2023"
                                            value={formData.publicationYear}
                                            onChange={(e) => setFormData({ ...formData, publicationYear: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="rm-form-group rm-form-full">
                                    <label>Title *</label>
                                    <input
                                        type="text"
                                        placeholder="Enter the title of the work"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>

                                {formSourceType === 'book' && (
                                    <div className="rm-form-group rm-form-full">
                                        <label>Publisher</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., Oxford University Press"
                                            value={formData.publisher}
                                            onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                                        />
                                    </div>
                                )}

                                {formSourceType === 'website' && (
                                    <div className="rm-form-row">
                                        <div className="rm-form-group">
                                            <label>URL</label>
                                            <input
                                                type="text"
                                                placeholder="https://..."
                                                value={formData.url}
                                                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                            />
                                        </div>
                                        <div className="rm-form-group">
                                            <label>Access Date</label>
                                            <input
                                                type="text"
                                                placeholder="e.g., December 9, 2025"
                                                value={formData.accessDate}
                                                onChange={(e) => setFormData({ ...formData, accessDate: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}

                                {formSourceType === 'journal' && (
                                    <>
                                        <div className="rm-form-group rm-form-full">
                                            <label>Journal Name</label>
                                            <input
                                                type="text"
                                                placeholder="e.g., Nature"
                                                value={formData.journalName}
                                                onChange={(e) => setFormData({ ...formData, journalName: e.target.value })}
                                            />
                                        </div>
                                        <div className="rm-form-row rm-form-row-3">
                                            <div className="rm-form-group">
                                                <label>Volume</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g., 12"
                                                    value={formData.volume}
                                                    onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                                                />
                                            </div>
                                            <div className="rm-form-group">
                                                <label>Issue</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g., 3"
                                                    value={formData.issue}
                                                    onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
                                                />
                                            </div>
                                            <div className="rm-form-group">
                                                <label>Pages</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g., 45-67"
                                                    value={formData.pages}
                                                    onChange={(e) => setFormData({ ...formData, pages: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="rm-form-group rm-form-full">
                                    <label>Tags (comma separated)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., research, psychology, 2023"
                                        value={formData.tags}
                                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Modal Actions */}
                            <div className="rm-modal-actions">
                                <motion.button
                                    className="rm-modal-btn rm-modal-btn-secondary"
                                    onClick={() => { setShowAddForm(false); resetForm(); }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    className="rm-modal-btn rm-modal-btn-primary"
                                    onClick={handleAddReference}
                                    disabled={!formData.authors || !formData.title || !formData.publicationYear}
                                    whileHover={{ scale: 1.02, boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)' }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    {editingId ? 'Save Changes' : 'Add Reference'}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .rm-container { min-height: 100%; padding: 24px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); }
                body.dark-mode .rm-container { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); }
                .rm-header-area { display: flex; justify-content: space-between; align- items: flex-end; gap: 24px; margin-bottom: 32px; flex-wrap: wrap; }
                body.dark-mode .rm-header-area { background: transparent; }
                .rm-title-card { padding: 20px 24px; background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); border-radius: 20px; border: 1px solid rgba(226, 232, 240, 0.8); position: relative; overflow: hidden; cursor: pointer; min-width: 320px; }
                body.dark-mode .rm-title-card { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-color: #334155; }
                .rm-title-gradient { position: absolute; top: 0; right: 0; width: 160px; height: 160px; background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%); border-radius: 50%; transform: translate(30%, -30%); pointer-events: none; }
                .rm-title-icon-wrapper { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; position: relative; }
                .rm-title-content { display: flex; flex-direction: column; justify-content: center; gap: 4px; }
                .rm-title-content h1 { font-size: 22px; font-weight: 700; margin: 0; line-height: 1.2; }
                .rm-badges { display: flex; gap: 8px; }
                .rm-badge { display: inline-flex; align-items: center; gap: 5px; padding: 5px 10px; font-size: 11px; font-weight: 600; border-radius: 20px; }
                .rm-actions-bar { display: flex; gap: 12px; align-items: center; }
                .rm-actions-divider { width: 1px; height: 24px; background: #e2e8f0; margin: 0 4px; }
                body.dark-mode .rm-actions-divider { background: #334155; }
                .rm-actions { display: flex; gap: 8px; align-items: center; }
                .rm-btn { display: flex; align-items: center; gap: 6px; padding: 10px 16px; border-radius: 12px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid transparent; background: transparent; white-space: nowrap; }
                .rm-btn:disabled { opacity: 0.4; cursor: not-allowed; pointer-events: none; }
                .rm-btn-ghost { background: white; border: 1px solid #e2e8f0; color: #64748b; }
                .rm-btn-secondary { background: white; border: 1px solid #e2e8f0; color: #64748b; }
                .rm-btn-primary { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); }
                body.dark-mode .rm-btn-ghost, body.dark-mode .rm-btn-secondary { background: #1e293b; border-color: #334155; color: #94a3b8; }
                body.dark-mode .rm-btn-ghost:hover, body.dark-mode .rm-btn-secondary:hover { background: #334155 !important; color: #f1f5f9 !important; }
                .rm-content { display: grid; grid-template-columns: 280px 1fr; gap: 24px; }
                @media (max-width: 900px) { .rm-content { grid-template-columns: 1fr; } }
                .rm-sidebar { display: flex; flex-direction: column; gap: 16px; }
                
                /* New V2 Filter Cards */
                .rm-filter-card-v2 { background: white; border: 1px solid rgba(226, 232, 240, 0.8); border-radius: 16px; padding: 18px; transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
                .rm-filter-card-v2:hover { border-color: rgba(59, 130, 246, 0.3); box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04); }
                body.dark-mode .rm-filter-card-v2 { background: rgba(30, 41, 59, 0.9); border-color: rgba(51, 65, 85, 0.6); }
                body.dark-mode .rm-filter-card-v2:hover { border-color: rgba(96, 165, 250, 0.3); }
                
                .rm-card-header-v2 { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
                .rm-card-icon-v2 { width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .rm-card-icon-blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
                .rm-card-icon-purple { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
                body.dark-mode .rm-card-icon-blue { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
                body.dark-mode .rm-card-icon-purple { background: rgba(139, 92, 246, 0.15); color: #a78bfa; }
                .rm-card-title-v2 { font-size: 13px; font-weight: 700; color: #1e293b; letter-spacing: 0.3px; }
                body.dark-mode .rm-card-title-v2 { color: #f1f5f9; }
                
                /* Search Input V2 */
                .rm-search-wrapper { position: relative; display: flex; align-items: center; }
                .rm-search-icon-circle { position: absolute; left: 8px; width: 28px; height: 28px; border-radius: 50%; background: rgba(59, 130, 246, 0.08); display: flex; align-items: center; justify-content: center; color: #3b82f6; pointer-events: none; }
                body.dark-mode .rm-search-icon-circle { background: rgba(96, 165, 250, 0.12); color: #60a5fa; }
                .rm-search-input-v2 { width: 100%; padding: 10px 36px 10px 44px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 13px; background: #f8fafc; transition: all 0.2s; }
                .rm-search-input-v2:focus { outline: none; border-color: #3b82f6; background: white; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08); }
                .rm-search-input-v2::placeholder { color: #94a3b8; }
                body.dark-mode .rm-search-input-v2 { background: rgba(15, 23, 42, 0.6); border-color: #334155; color: #e2e8f0; }
                body.dark-mode .rm-search-input-v2:focus { border-color: #60a5fa; background: #0f172a; box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.08); }
                body.dark-mode .rm-search-input-v2::placeholder { color: #64748b; }
                .rm-search-clear { position: absolute; right: 10px; width: 20px; height: 20px; border-radius: 50%; background: #e2e8f0; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748b; }
                .rm-search-clear:hover { background: #cbd5e1; color: #475569; }
                body.dark-mode .rm-search-clear { background: #334155; color: #94a3b8; }
                body.dark-mode .rm-search-clear:hover { background: #475569; color: #e2e8f0; }
                
                /* Search Spinner */
                .rm-search-spinner-circle { background: rgba(59, 130, 246, 0.12); }
                body.dark-mode .rm-search-spinner-circle { background: rgba(96, 165, 250, 0.15); }
                .rm-search-spinner { animation: rm-search-spin 0.8s linear infinite; }
                @keyframes rm-search-spin { to { transform: rotate(360deg); } }
                
                /* Citation Style Tabs V2 */
                .rm-style-tabs-v2 { position: relative; display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; background: #f1f5f9; border-radius: 10px; padding: 4px; }
                body.dark-mode .rm-style-tabs-v2 { background: rgba(15, 23, 42, 0.6); }
                .rm-style-indicator { position: absolute; top: 4px; left: 4px; width: calc(33.333% - 5.33px); height: calc(100% - 8px); border-radius: 8px; background: white; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); z-index: 0; }
                body.dark-mode .rm-style-indicator { background: #334155; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3); }
                .rm-style-btn-v2 { position: relative; z-index: 1; padding: 8px 12px; background: transparent; border: none; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; color: #64748b; transition: color 0.2s; }
                .rm-style-btn-v2.active { color: #3b82f6; }
                body.dark-mode .rm-style-btn-v2 { color: #94a3b8; }
                body.dark-mode .rm-style-btn-v2.active { color: #60a5fa; }
                
                /* Style Info Section */
                .rm-style-info { margin-top: 14px; padding-top: 14px; border-top: 1px solid rgba(226, 232, 240, 0.6); }
                body.dark-mode .rm-style-info { border-top-color: rgba(51, 65, 85, 0.6); }
                .rm-style-desc { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 10px; }
                .rm-style-desc svg { flex-shrink: 0; color: #8b5cf6; margin-top: 1px; }
                body.dark-mode .rm-style-desc svg { color: #a78bfa; }
                .rm-style-desc span { font-size: 11px; color: #64748b; line-height: 1.4; }
                body.dark-mode .rm-style-desc span { color: #94a3b8; }
                .rm-style-example { background: rgba(139, 92, 246, 0.06); border-radius: 8px; padding: 10px 12px; }
                body.dark-mode .rm-style-example { background: rgba(139, 92, 246, 0.1); }
                .rm-example-label { display: block; font-size: 10px; font-weight: 600; color: #8b5cf6; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
                body.dark-mode .rm-example-label { color: #a78bfa; }
                .rm-example-text { font-size: 11px; color: #475569; line-height: 1.5; font-family: 'Georgia', serif; }
                .rm-example-text em { font-style: italic; }
                body.dark-mode .rm-example-text { color: #cbd5e1; }
                
                /* Legacy styles for compatibility */
                .rm-filter-card { background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; }
                body.dark-mode .rm-filter-card { background: #1e293b; border-color: #334155; }
                .rm-filter-card h3 { font-size: 13px; font-weight: 700; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px; color: #1e293b; }
                body.dark-mode .rm-filter-card h3 { color: #f1f5f9; }
                .rm-tags { display: flex; flex-wrap: wrap; gap: 6px; }
                .rm-tag { padding: 6px 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
                .rm-tag.active { background: #eff6ff; border-color: #3b82f6; color: #3b82f6; }
                body.dark-mode .rm-tag { background: #0f172a; border-color: #334155; color: #94a3b8; }
                body.dark-mode .rm-tag.active { background: #334155; border-color: #60a5fa; color: #60a5fa; }
                .rm-main { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; min-height: 400px; }
                body.dark-mode .rm-main { background: #1e293b; border-color: #334155; }
                
                /* Empty State V2 */
                .rm-empty-v2 { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 24px; text-align: center; min-height: 350px; }
                .rm-empty-icon-wrapper { margin-bottom: 24px; }
                .rm-empty-icon-bg { width: 100px; height: 100px; border-radius: 24px; background: rgba(148, 163, 184, 0.1); display: flex; align-items: center; justify-content: center; color: #94a3b8; }
                body.dark-mode .rm-empty-icon-bg { background: rgba(100, 116, 139, 0.15); color: #64748b; }
                .rm-empty-content { }
                .rm-empty-content h3 { font-size: 18px; font-weight: 700; color: #1e293b; margin: 0 0 8px 0; }
                body.dark-mode .rm-empty-content h3 { color: #f1f5f9; }
                .rm-empty-content p { font-size: 14px; color: #64748b; margin: 0; max-width: 280px; line-height: 1.5; }
                body.dark-mode .rm-empty-content p { color: #94a3b8; }
                
                /* Modal Styles */
                .rm-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
                body.dark-mode .rm-modal-overlay { background: rgba(0, 0, 0, 0.7); }
                .rm-modal { background: white; border-radius: 20px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
                body.dark-mode .rm-modal { background: #1e293b; }
                .rm-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid #e2e8f0; }
                body.dark-mode .rm-modal-header { border-bottom-color: #334155; }
                .rm-modal-title { display: flex; align-items: center; gap: 12px; font-size: 18px; font-weight: 700; color: #1e293b; }
                body.dark-mode .rm-modal-title { color: #f1f5f9; }
                .rm-modal-icon { width: 40px; height: 40px; border-radius: 12px; background: rgba(59, 130, 246, 0.1); display: flex; align-items: center; justify-content: center; color: #3b82f6; }
                body.dark-mode .rm-modal-icon { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
                .rm-modal-close { width: 36px; height: 36px; border-radius: 10px; border: none; background: #f1f5f9; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; }
                .rm-modal-close:hover { background: #e2e8f0; color: #475569; }
                body.dark-mode .rm-modal-close { background: #334155; color: #94a3b8; }
                body.dark-mode .rm-modal-close:hover { background: #475569; color: #e2e8f0; }
                .rm-modal-section { padding: 20px 24px 0; }
                .rm-modal-label { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
                body.dark-mode .rm-modal-label { color: #94a3b8; }
                .rm-source-selector { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
                .rm-source-btn { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 16px 12px; background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; cursor: pointer; transition: all 0.2s; color: #64748b; }
                .rm-source-btn:hover { border-color: #cbd5e1; background: #f1f5f9; }
                .rm-source-btn.active { border-color: #3b82f6; background: rgba(59, 130, 246, 0.08); color: #3b82f6; }
                .rm-source-btn span { font-size: 12px; font-weight: 600; }
                body.dark-mode .rm-source-btn { background: #0f172a; border-color: #334155; color: #94a3b8; }
                body.dark-mode .rm-source-btn:hover { border-color: #475569; background: #1e293b; }
                body.dark-mode .rm-source-btn.active { border-color: #60a5fa; background: rgba(96, 165, 250, 0.1); color: #60a5fa; }
                .rm-modal-form { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }
                .rm-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                .rm-form-row-3 { grid-template-columns: 1fr 1fr 1fr; }
                .rm-form-group { display: flex; flex-direction: column; gap: 6px; }
                .rm-form-full { width: 100%; }
                .rm-form-group label { font-size: 13px; font-weight: 600; color: #475569; }
                body.dark-mode .rm-form-group label { color: #94a3b8; }
                .rm-form-group input { padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; transition: all 0.2s; background: white; }
                .rm-form-group input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
                .rm-form-group input::placeholder { color: #94a3b8; }
                body.dark-mode .rm-form-group input { background: #0f172a; border-color: #334155; color: #e2e8f0; }
                body.dark-mode .rm-form-group input:focus { border-color: #60a5fa; box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1); }
                body.dark-mode .rm-form-group input::placeholder { color: #64748b; }
                .rm-modal-actions { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 24px; border-top: 1px solid #e2e8f0; }
                body.dark-mode .rm-modal-actions { border-top-color: #334155; }
                .rm-modal-btn { display: flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; }
                .rm-modal-btn-secondary { background: #f1f5f9; color: #475569; }
                .rm-modal-btn-secondary:hover { background: #e2e8f0; }
                body.dark-mode .rm-modal-btn-secondary { background: #334155; color: #94a3b8; }
                body.dark-mode .rm-modal-btn-secondary:hover { background: #475569; }
                .rm-modal-btn-primary { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25); }
                .rm-modal-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
                
                /* Draft Indicator in Modal */
                .rm-modal-title-content { display: flex; flex-direction: column; gap: 4px; }
                .rm-draft-indicator { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 500; color: #10b981; }
                .rm-draft-indicator svg { flex-shrink: 0; }
                .rm-draft-spinner { animation: rm-spin 1s linear infinite; }
                @keyframes rm-spin { to { transform: rotate(360deg); } }
                body.dark-mode .rm-draft-indicator { color: #34d399; }
                
                /* Draft Banner */
                .rm-draft-banner { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 18px; background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 12px; margin-bottom: 20px; }
                body.dark-mode .rm-draft-banner { background: linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%); border-color: rgba(96, 165, 250, 0.3); }
                .rm-draft-banner-content { display: flex; align-items: center; gap: 12px; font-size: 13px; font-weight: 600; color: #3b82f6; }
                body.dark-mode .rm-draft-banner-content { color: #60a5fa; }
                .rm-draft-banner-actions { display: flex; gap: 8px; }
                .rm-draft-btn { padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; border: none; display: flex; align-items: center; gap: 6px; transition: all 0.2s; }
                .rm-draft-btn-secondary { background: white; color: #64748b; border: 1px solid #e2e8f0; }
                .rm-draft-btn-secondary:hover { background: #f8fafc; border-color: #cbd5e1; }
                body.dark-mode .rm-draft-btn-secondary { background: #1e293b; color: #94a3b8; border-color: #334155; }
                body.dark-mode .rm-draft-btn-secondary:hover { background: #334155; }
                .rm-draft-btn-primary { background: #3b82f6; color: white; }
                .rm-draft-btn-primary:hover { background: #2563eb; }
                
                /* Legacy empty state */
                .rm-empty { text-align: center; padding: 60px 20px; color: #94a3b8; }
                .rm-empty svg { margin-bottom: 16px; opacity: 0.5; }
                .rm-references { display: flex; flex-direction: column; gap: 16px; }
                .rm-reference-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; transition: all 0.2s; }
                .rm-reference-card:hover { border-color: #3b82f6; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1); }
                body.dark-mode .rm-reference-card { background: #0f172a; border-color: #334155; }
                .rm-ref-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
                .rm-ref-type { padding: 4px 8px; background: #eff6ff; color: #3b82f6; border-radius: 6px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
                body.dark-mode .rm-ref-type { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
                .rm-ref-actions { display: flex; gap: 6px; }
                .rm-icon-btn { padding: 6px; background: transparent; border: none; color: #64748b; cursor: pointer; border-radius: 6px; transition: all 0.2s; }
                .rm-icon-btn-edit:hover { background: #eff6ff; color: #3b82f6; }
                .rm-icon-btn-delete:hover { background: #fee2e2; color: #dc2626; }
                body.dark-mode .rm-icon-btn-edit:hover { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
                body.dark-mode .rm-icon-btn-delete:hover { background: rgba(220, 38, 38, 0.15); color: #f87171; }
                .rm-ref-content h4 { font-size: 16px; font-weight: 700; margin: 0 0 6px 0; color: #1e293b; }
                body.dark-mode .rm-ref-content h4 { color: #f1f5f9; }
                .rm-ref-authors { font-size: 13px; color: #64748b; margin: 0 0 10px 0; }
                body.dark-mode .rm-ref-authors { color: #94a3b8; }
                .rm-ref-citation { font-size: 13px; line-height: 1.7; color: #475569; padding: 10px; background: white; border-left: 3px solid #8b5cf6; border-radius: 6px; margin-bottom: 10px; }
                body.dark-mode .rm-ref-citation { background: #1e293b; color: #cbd5e1; }
                .rm-ref-tags { display: flex; flex-wrap: wrap; gap: 6px; }
                .rm-ref-tag { padding: 4px 8px; background: #f0fdf4; color: #16a34a; border-radius: 6px; font-size: 11px; font-weight: 600; }
                body.dark-mode .rm-ref-tag { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
                
                /* Reference Card V2 - Enhanced */
                .rm-reference-card-v2 { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 0; overflow: visible; transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94); position: relative; }
                .rm-reference-card-v2:hover { border-color: #3b82f6; box-shadow: 0 8px 24px rgba(59, 130, 246, 0.12); transform: translateY(-2px); }
                body.dark-mode .rm-reference-card-v2 { background: rgba(30, 41, 59, 0.9); border-color: #334155; }
                body.dark-mode .rm-reference-card-v2:hover { border-color: #60a5fa; box-shadow: 0 8px 24px rgba(96, 165, 250, 0.15); }
                
                .rm-ref-header-v2 { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-bottom: 1px solid #e2e8f0; border-radius: 16px 16px 0 0; position: relative; overflow: visible; }
                body.dark-mode .rm-ref-header-v2 { background: linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(30, 41, 59, 0.6) 100%); border-bottom-color: #334155; }
                
                .rm-ref-type-badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px; background: rgba(59, 130, 246, 0.1); color: #3b82f6; border-radius: 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; }
                body.dark-mode .rm-ref-type-badge { background: rgba(96, 165, 250, 0.15); color: #60a5fa; }
                
                .rm-ref-actions-v2 { display: flex; gap: 6px; }
                .rm-tooltip-wrapper { position: relative; }
                .rm-icon-btn-v2 { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: white; border: 1px solid #e2e8f0; border-radius: 8px; color: #64748b; cursor: pointer; transition: all 0.2s; }
                body.dark-mode .rm-icon-btn-v2 { background: #1e293b; border-color: #334155; color: #94a3b8; }
                .rm-icon-btn-v2.rm-icon-btn-edit:hover { background: #eff6ff; border-color: #3b82f6; color: #3b82f6; }
                .rm-icon-btn-v2.rm-icon-btn-delete:hover { background: #fef2f2; border-color: #ef4444; color: #ef4444; }
                body.dark-mode .rm-icon-btn-v2.rm-icon-btn-edit:hover { background: rgba(59, 130, 246, 0.15); border-color: #60a5fa; color: #60a5fa; }
                body.dark-mode .rm-icon-btn-v2.rm-icon-btn-delete:hover { background: rgba(239, 68, 68, 0.15); border-color: #f87171; color: #f87171; }
                
                /* Tooltips */
                .rm-ref-header-v2 { overflow: visible; }
                .rm-ref-actions-v2 { position: relative; z-index: 20; }
                .rm-tooltip-wrapper { position: relative; }
                .rm-tooltip { position: absolute; bottom: calc(100% + 10px); left: 50%; transform: translateX(-50%); padding: 6px 12px; background: white; color: #3b82f6; font-size: 11px; font-weight: 600; border-radius: 6px; white-space: nowrap; opacity: 0; visibility: hidden; transition: all 0.2s; pointer-events: none; z-index: 100; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2); border: 1px solid rgba(59, 130, 246, 0.2); }
                .rm-tooltip::after { content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%); border: 5px solid transparent; border-top-color: white; }
                .rm-tooltip-danger { background: #fef2f2; color: #ef4444; border-color: rgba(239, 68, 68, 0.2); box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15); }
                .rm-tooltip-danger::after { border-top-color: #fef2f2; }
                .rm-tooltip-wrapper:hover .rm-tooltip { opacity: 1; visibility: visible; }
                body.dark-mode .rm-tooltip { background: #1e293b; color: #60a5fa; border-color: rgba(96, 165, 250, 0.3); }
                body.dark-mode .rm-tooltip::after { border-top-color: #1e293b; }
                body.dark-mode .rm-tooltip-danger { background: #1e293b; color: #f87171; border-color: rgba(248, 113, 113, 0.3); }
                body.dark-mode .rm-tooltip-danger::after { border-top-color: #1e293b; }
                
                .rm-ref-content-v2 { padding: 18px; }
                .rm-ref-title-v2 { font-size: 17px; font-weight: 700; color: #1e293b; margin: 0 0 14px 0; line-height: 1.4; }
                body.dark-mode .rm-ref-title-v2 { color: #f1f5f9; }
                
                .rm-ref-meta-grid { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
                .rm-ref-meta-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #64748b; }
                .rm-ref-meta-item svg { flex-shrink: 0; color: #94a3b8; }
                body.dark-mode .rm-ref-meta-item { color: #94a3b8; }
                body.dark-mode .rm-ref-meta-item svg { color: #64748b; }
                .rm-ref-meta-link a { color: #3b82f6; text-decoration: none; transition: color 0.2s; }
                .rm-ref-meta-link a:hover { color: #2563eb; text-decoration: underline; }
                body.dark-mode .rm-ref-meta-link a { color: #60a5fa; }
                body.dark-mode .rm-ref-meta-link a:hover { color: #93c5fd; }
                
                .rm-ref-citation-v2 { background: linear-gradient(135deg, rgba(139, 92, 246, 0.06) 0%, rgba(59, 130, 246, 0.06) 100%); border-left: 3px solid #8b5cf6; border-radius: 0 10px 10px 0; padding: 14px 16px; margin-bottom: 14px; }
                body.dark-mode .rm-ref-citation-v2 { background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%); }
                .rm-citation-header { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
                .rm-citation-header svg { color: #8b5cf6; }
                .rm-citation-header span { font-size: 10px; font-weight: 700; color: #8b5cf6; text-transform: uppercase; letter-spacing: 0.5px; }
                body.dark-mode .rm-citation-header svg, body.dark-mode .rm-citation-header span { color: #a78bfa; }
                .rm-ref-citation-v2 p { font-size: 13px; line-height: 1.7; color: #475569; margin: 0; font-family: 'Georgia', serif; }
                body.dark-mode .rm-ref-citation-v2 p { color: #cbd5e1; }
                
                .rm-ref-tags-v2 { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 14px; }
                .rm-ref-tags-v2 > svg { color: #94a3b8; flex-shrink: 0; }
                body.dark-mode .rm-ref-tags-v2 > svg { color: #64748b; }
                .rm-ref-tag-v2 { padding: 4px 10px; background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); color: #16a34a; border-radius: 20px; font-size: 11px; font-weight: 600; }
                body.dark-mode .rm-ref-tag-v2 { background: linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%); color: #4ade80; }
                
                .rm-ref-footer { display: flex; align-items: center; justify-content: flex-end; padding-top: 12px; border-top: 1px solid #f1f5f9; }
                body.dark-mode .rm-ref-footer { border-top-color: #334155; }
                .rm-ref-added { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #94a3b8; }
                .rm-ref-added svg { color: #cbd5e1; }
                body.dark-mode .rm-ref-added { color: #64748b; }
                body.dark-mode .rm-ref-added svg { color: #475569; }
                
                .rm-skeleton { background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%); background-size: 200% 100%; animation: rm-loading 1.5s infinite; border-radius: 8px; }
                body.dark-mode .rm-skeleton { background: linear-gradient(90deg, #334155 25%, #475569 50%, #334155 75%); background-size: 200% 100%; }
                @keyframes rm-loading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
                .rm-skeleton-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
                body.dark-mode .rm-skeleton-card { background: #0f172a; border-color: #334155; }
                .rm-skeleton-card:last-child { margin-bottom: 0; }
                .rm-skeleton-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
                .rm-skeleton-citation { padding: 12px; background: rgba(59, 130, 246, 0.04); border-left: 3px solid #e2e8f0; border-radius: 0 8px 8px 0; }
                body.dark-mode .rm-skeleton-citation { background: rgba(59, 130, 246, 0.06); border-left-color: #334155; }
            `}</style>
        </motion.div>
    );
};

export default ReferenceManager;
