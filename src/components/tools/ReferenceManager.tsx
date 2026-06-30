/**
 * Reference Manager Component
 * Save, organize, and export research citations
 */

import * as React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { Library, Save } from "lucide-react";
import { ToolHeaderBadge } from "./ToolHeaderBadges";
import ToolMobileSheet from "./ToolMobileSheet";
import { Document, Packer, Paragraph, TextRun, AlignmentType } from "docx";
import { saveAs } from "file-saver";

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

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
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
    const [isPageLoading, setIsPageLoading] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    
    // Auto-save draft state
    const [draftSaveStatus, setDraftSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [hasDraft, setHasDraft] = useState(false);

    // Modal scroll state
    const [isModalMinimized, setIsModalMinimized] = useState(false);
    const modalLastScrollY = useRef(0);
    const modalScrollDirection = useRef<'up' | 'down' | null>(null);
    const modalAnchorScrollY = useRef(0);

    const handleModalScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const currentScrollY = e.currentTarget.scrollTop;
        
        if (currentScrollY <= 10) {
            setIsModalMinimized(false);
            modalLastScrollY.current = currentScrollY;
            modalScrollDirection.current = null;
            modalAnchorScrollY.current = currentScrollY;
            return;
        }

        const delta = currentScrollY - modalLastScrollY.current;
        
        if (delta > 0) {
            if (modalScrollDirection.current !== 'down') {
                modalScrollDirection.current = 'down';
                modalAnchorScrollY.current = modalLastScrollY.current;
            }
            if (currentScrollY - modalAnchorScrollY.current > 30) {
                setIsModalMinimized(true);
            }
        } else if (delta < 0) {
            if (modalScrollDirection.current !== 'up') {
                modalScrollDirection.current = 'up';
                modalAnchorScrollY.current = modalLastScrollY.current;
            }
        }

        modalLastScrollY.current = currentScrollY;
    }, []);

    // Load references from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('references');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setReferences(parsed);
                } else {
                    seedDefaultReferences();
                }
            } catch {
                seedDefaultReferences();
            }
        } else {
            seedDefaultReferences();
        }
        setTimeout(() => {
            setIsLoading(false);
            setIsPageLoading(false);
        }, 400);
    }, []);

    const seedDefaultReferences = () => {
        const seedRefs: Reference[] = [
            {
                id: 'seed-1',
                sourceType: 'book',
                authors: 'Josiah de Jesus',
                title: 'The Work of Art',
                publicationYear: '2005',
                publisher: 'STI Academic Press',
                url: '',
                accessDate: '',
                journalName: '',
                volume: '',
                issue: '',
                pages: '',
                tags: ['research', 'design', 'case-study'],
                dateAdded: Date.now() - 1000 * 60 * 60 * 24 * 12 // 12 days ago
            },
            {
                id: 'seed-2',
                sourceType: 'website',
                authors: 'Jane Smith',
                title: 'Modern Web Design Principles',
                publicationYear: '2024',
                publisher: '',
                url: 'https://example.com/design',
                accessDate: new Date().toISOString().split('T')[0],
                journalName: '',
                volume: '',
                issue: '',
                pages: '',
                tags: ['ui-ux', 'web-dev'],
                dateAdded: Date.now() - 1000 * 60 * 60 * 24 * 5 // 5 days ago
            },
            {
                id: 'seed-3',
                sourceType: 'journal',
                authors: 'Robert C. Martin',
                title: 'Clean Architecture in Frontend Development',
                publicationYear: '2020',
                publisher: '',
                url: '',
                accessDate: '',
                journalName: 'International Journal of Software Engineering',
                volume: '14',
                issue: '2',
                pages: '45-58',
                tags: ['clean-code', 'refactoring'],
                dateAdded: Date.now() - 1000 * 60 * 60 * 2 // 2 hours ago
            }
        ];
        setReferences(seedRefs);
        localStorage.setItem('references', JSON.stringify(seedRefs));
    };

    // Save references to localStorage
    useEffect(() => {
        if (references.length > 0) {
            localStorage.setItem('references', JSON.stringify(references));
        }
    }, [references]);

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
            
            setTimeout(() => setDraftSaveStatus('idle'), 2000);
        }, 500);

        return () => clearTimeout(saveTimeout);
    }, [formData, formSourceType, showAddForm, editingId]);

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

    const exportBibliographyAsDocx = () => {
        if (filteredReferences.length === 0) return;

        // Helper to map asterisks in citations to italic docx runs
        const generateParagraphChildren = (citationText: string) => {
            const cleanText = citationText.replace(/\s+/g, ' ');
            const parts = cleanText.split('*');
            return parts.map((part, idx) => {
                const isItalic = idx % 2 === 1;
                return new TextRun({
                    text: part,
                    italics: isItalic,
                    font: "Times New Roman",
                    size: 24, // 12pt in docx
                });
            });
        };

        const doc = new Document({
            sections: [
                {
                    properties: {},
                    children: [
                        // Center-aligned title page heading based on citation style
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            spacing: {
                                before: 0,
                                after: 240, // 12pt space after title
                            },
                            children: [
                                new TextRun({
                                    text: citationStyle === 'APA' ? 'References' : citationStyle === 'MLA' ? 'Works Cited' : 'Bibliography',
                                    bold: true,
                                    font: "Times New Roman",
                                    size: 24, // 12pt
                                }),
                            ],
                        }),
                        // Hanging indents, Times New Roman, double-spaced academic paragraphs
                        ...filteredReferences.map(ref => {
                            const citationText = generateCitation(ref, citationStyle);
                            return new Paragraph({
                                indent: {
                                    left: 720, // 0.5 inch indent
                                    hanging: 720, // Hanging indent (first line flush, rest indented)
                                },
                                spacing: {
                                    before: 0,
                                    after: 120, // 6pt space between rows
                                    line: 360, // 1.5 line spacing
                                },
                                children: generateParagraphChildren(citationText),
                            });
                        }),
                    ],
                },
            ],
        });

        Packer.toBlob(doc).then(blob => {
            saveAs(blob, `bibliography-${citationStyle}.docx`);
        });
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

    const totalPages = Math.ceil(filteredReferences.length / itemsPerPage);
    const paginatedReferences = filteredReferences.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedTags, references.length]);

    // Loading Skeleton
    if (isPageLoading) {
        return (
            <div className="w-full max-w-[1400px] mx-auto h-auto min-h-[calc(100vh-6rem)] flex flex-col min-w-0 overflow-x-hidden p-0 sm:p-0" role="status" aria-busy="true" aria-label="Loading Reference Manager">
                {/* Header Skeleton */}
                <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-5 mb-6 bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden shadow-sm w-full">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="skeleton-bone w-12 h-12 rounded-[16px] bg-zinc-200 dark:bg-zinc-800" />
                        <div className="flex flex-col gap-2 skeleton-stagger">
                            <div className="skeleton-bone w-40 h-6 rounded-md bg-zinc-200 dark:bg-zinc-800" />
                            <div className="flex gap-2">
                                <div className="skeleton-bone w-24 h-5 rounded-md bg-zinc-100 dark:bg-zinc-800/50" />
                                <div className="skeleton-bone w-24 h-5 rounded-md bg-zinc-100 dark:bg-zinc-800/50 hidden sm:block" />
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:flex-wrap sm:items-center sm:w-auto">
                        <div className="skeleton-bone w-20 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 hidden sm:block" />
                        <div className="skeleton-bone w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-2 hidden sm:block" />
                        <div className="skeleton-bone col-span-2 sm:col-span-1 w-full sm:w-32 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800/50" />
                        <div className="skeleton-bone col-span-2 sm:col-span-1 w-full sm:w-32 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                        <div className="skeleton-bone col-span-2 sm:col-span-1 w-full sm:w-32 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800/50" />
                    </div>
                </div>

                {/* Main Content Split Layout Skeleton */}
                <div className="grid grid-cols-1 gap-6 pb-28 lg:grid-cols-[320px_minmax(0,1fr)] lg:pb-0">
                    {/* Left Sidebar */}
                    <div className="w-full flex flex-col gap-5 lg:sticky lg:top-8">
                        {/* Search Card */}
                        <div className="bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-200/80 dark:border-zinc-800/80 p-5 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="skeleton-bone w-10 h-10 rounded-[14px] bg-zinc-200 dark:bg-zinc-800" />
                                <div className="skeleton-bone w-20 h-4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                            </div>
                            <div className="skeleton-bone w-full h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800/50" />
                        </div>
                        {/* Citation Style Card */}
                        <div className="bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-200/80 dark:border-zinc-800/80 p-5 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="skeleton-bone w-10 h-10 rounded-[14px] bg-zinc-200 dark:bg-zinc-800" />
                                <div className="skeleton-bone w-24 h-4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                            </div>
                            <div className="skeleton-bone w-full h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 mb-4" />
                            <div className="skeleton-bone w-full h-16 rounded-lg bg-zinc-100 dark:bg-zinc-800/50" />
                        </div>
                    </div>

                    {/* Right Content */}
                    <div className="min-w-0 flex flex-col gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white dark:bg-zinc-900 rounded-[24px] p-6 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm h-40">
                                <div className="skeleton-bone w-20 h-5 bg-zinc-100 dark:bg-zinc-800/50 rounded mb-4" />
                                <div className="skeleton-bone w-3/4 h-6 bg-zinc-200 dark:bg-zinc-800 rounded mb-3" />
                                <div className="flex gap-4">
                                    <div className="skeleton-bone w-24 h-4 bg-zinc-100 dark:bg-zinc-800/50 rounded" />
                                    <div className="skeleton-bone w-24 h-4 bg-zinc-100 dark:bg-zinc-800/50 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-[1400px] mx-auto h-auto min-h-[calc(100vh-6rem)] flex flex-col min-w-0"
        >
            {/* Header Area */}
            <motion.div
                className="relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 sm:p-5 px-5 sm:px-6 mb-6 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[24px] w-full group transition-all duration-300 hover:shadow-md hover:border-violet-200/80 dark:hover:border-violet-800/50 mt-[72px] sm:mt-0"
            >
                {/* SaaS Background Accents (matches ToolsHeader) */}

                
                <div className="flex items-center gap-4 relative z-10 min-w-0">
                    <motion.div
                        className="flex items-center justify-center w-12 h-12 rounded-[16px] bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-800/50 flex-shrink-0 shadow-sm"
                        whileHover={{ scale: 1.05, rotate: -5 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                        </svg>
                    </motion.div>
                    
                    <div className="flex flex-col min-w-0">
                        <motion.h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 m-0 leading-tight tracking-tight">
                            Reference Manager
                        </motion.h1>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                            <ToolHeaderBadge icon={Library} label={`${references.length} References`} tone="violet" />
                            <ToolHeaderBadge
                                icon={Save}
                                label={draftSaveStatus === 'saving' ? 'Saving Draft' : draftSaveStatus === 'saved' || hasDraft ? 'Draft Saved' : 'Auto-save ready'}
                                tone="violet"
                                hideOnSmall
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:flex-wrap sm:items-center sm:w-auto relative z-10">
                    <motion.button
                        onClick={onBack}
                        className="flex items-center justify-center gap-1 sm:gap-1.5 px-3 py-2 sm:px-4 sm:py-2 text-[13px] sm:text-sm font-bold text-zinc-700 bg-zinc-100 dark:text-zinc-300 dark:bg-zinc-800/50 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.97 }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                        Back
                    </motion.button>
                    
                    <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-2 hidden sm:block"></div>

                    <LayoutGroup>
                        <motion.button
                            layout
                            layoutId="add-ref-btn"
                            onClick={() => setShowAddForm(true)}
                            className="flex items-center justify-center gap-1 sm:gap-1.5 px-3 py-2 sm:px-4 sm:py-2 text-[13px] sm:text-sm font-bold text-zinc-700 bg-zinc-100 dark:text-zinc-300 dark:bg-zinc-800/50 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shadow-sm"
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                            className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 px-4 py-2.5 sm:px-5 sm:py-2 text-[13px] sm:text-sm font-bold text-white bg-violet-600 rounded-xl hover:bg-violet-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            whileHover={{ y: -1, boxShadow: '0 8px 20px rgba(124, 58, 237, 0.35)' }}
                            whileTap={{ scale: 0.97 }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Export TXT
                        </motion.button>

                        <motion.button
                            layout
                            layoutId="export-docx-btn"
                            onClick={exportBibliographyAsDocx}
                            disabled={references.length === 0}
                            className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 px-4 py-2.5 sm:px-5 sm:py-2 text-[13px] sm:text-sm font-bold text-violet-700 bg-violet-50 dark:text-violet-300 dark:bg-violet-950/30 rounded-xl hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                            </svg>
                            Export DOCX
                        </motion.button>
                    </LayoutGroup>
                </div>
            </motion.div>

            {/* Main Content Split Layout */}
            <div className="grid grid-cols-1 gap-6 pb-28 lg:grid-cols-[320px_minmax(0,1fr)] lg:pb-0">
                
                {/* Reference Tools Panel */}
                <ToolMobileSheet
                    title="Reference Tools"
                    summary={`${references.length} references, ${citationStyle} style`}
                    actionLabel="Open reference tools"
                    className="w-full flex flex-col gap-5 lg:sticky lg:top-8"
                    tone="violet"
                >
                    {/* Search Card */}
                    <motion.div 
                        className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[24px] p-5 sm:p-6 group transition-all duration-300 hover:shadow-md hover:border-violet-200/80 dark:hover:border-violet-800/50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                    >
        
                        
                        <div className="flex items-center gap-5 mb-6 relative z-10">
                            <motion.div
                                className="flex items-center justify-center w-16 h-16 rounded-[20px] bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-800/50 shrink-0 shadow-sm"
                                whileHover={{ scale: 1.05, rotate: -5 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="M21 21l-4.35-4.35" />
                                </svg>
                            </motion.div>
                            <div>
                                <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Search</h3>
                                <p className="text-[15px] text-zinc-500 dark:text-zinc-400 mt-1">Find your saved citations instantly.</p>
                            </div>
                        </div>
                        <div className="relative flex items-center z-10">
                            <div className="absolute left-4 text-zinc-400">
                                {isSearching ? (
                                    <svg className="animate-spin w-5 h-5 text-violet-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M21 12a9 9 0 11-6.219-8.56" />
                                    </svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8" />
                                        <path d="M21 21l-4.35-4.35" />
                                    </svg>
                                )}
                            </div>
                            <input
                                type="text"
                                placeholder="Search references..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 text-[15px] font-semibold rounded-2xl py-3.5 pl-12 pr-12 text-zinc-700 dark:text-zinc-300 placeholder-zinc-400 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    aria-label="Clear search"
                                    className="absolute right-4 w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:bg-zinc-300 hover:text-zinc-700 transition-colors"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </motion.div>
 
                    {/* Citation Style Card */}
                    <motion.div 
                        className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[24px] p-5 sm:p-6 group transition-all duration-300 hover:shadow-md hover:border-violet-200/80 dark:hover:border-violet-800/50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                    >
        
                        
                        <div className="flex items-center gap-5 mb-6 relative z-10">
                            <motion.div
                                className="flex items-center justify-center w-16 h-16 rounded-[20px] bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-800/50 shrink-0 shadow-sm"
                                whileHover={{ scale: 1.05, rotate: -5 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <line x1="16" y1="13" x2="8" y2="13" />
                                    <line x1="16" y1="17" x2="8" y2="17" />
                                </svg>
                            </motion.div>
                            <div>
                                <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Citation Style</h3>
                                <p className="text-[15px] text-zinc-500 dark:text-zinc-400 mt-1">Select format for your bibliography.</p>
                            </div>
                        </div>
                        
                        <div className="relative flex w-full p-1.5 rounded-2xl bg-zinc-100 dark:bg-zinc-950/70 border border-zinc-200/80 dark:border-zinc-800 mb-5 z-10">
                            {(['APA', 'MLA', 'Chicago'] as CitationStyle[]).map(style => (
                                <button
                                    key={style}
                                    className={`relative z-10 flex-1 rounded-xl py-3 text-center text-[15px] font-bold transition-colors ${
                                        citationStyle === style ? 'text-violet-700 dark:text-violet-300' : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                                    }`}
                                    onClick={() => setCitationStyle(style)}
                                >
                                    {citationStyle === style && (
                                        <motion.div
                                            layoutId="refActiveStyleTab"
                                            className="absolute inset-0 rounded-xl bg-white shadow-sm border border-zinc-200/50 dark:bg-zinc-800 dark:border-zinc-700/50"
                                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                            style={{ zIndex: -1 }}
                                        />
                                    )}
                                    {style}
                                </button>
                            ))}
                        </div>
 
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={citationStyle}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="pt-4 border-t border-zinc-100 dark:border-zinc-800 relative z-10"
                            >
                                <div className="flex gap-2.5 items-start text-[13px] text-zinc-500 dark:text-zinc-400 mb-4 leading-snug">
                                    <svg className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="16" x2="12" y2="12" />
                                        <line x1="12" y1="8" x2="12.01" y2="8" />
                                    </svg>
                                    <span>
                                        {citationStyle === 'APA' && "American Psychological Association - Used in social sciences"}
                                        {citationStyle === 'MLA' && "Modern Language Association - Used in humanities"}
                                        {citationStyle === 'Chicago' && "Chicago Manual of Style - Used in history & publishing"}
                                    </span>
                                </div>
                                <div className="bg-violet-50/50 dark:bg-violet-900/10 rounded-[16px] p-4 border border-violet-100/50 dark:border-violet-800/30">
                                    <p className="text-[11px] font-bold tracking-wider text-violet-500 uppercase mb-2">Example</p>
                                    <p className="text-[14px] text-zinc-700 dark:text-zinc-300 font-serif leading-relaxed">
                                        {citationStyle === 'APA' && <>Smith, J. (2023). <em>Book Title</em>. Publisher.</>}
                                        {citationStyle === 'MLA' && <>Smith, John. <em>Book Title</em>. Publisher, 2023.</>}
                                        {citationStyle === 'Chicago' && <>Smith, John. <em>Book Title</em>. Publisher, 2023.</>}
                                    </p>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </motion.div>


                </ToolMobileSheet>

                {/* Reference Library */}
                <main className="min-w-0 flex flex-col gap-4">
                    
                    {/* Draft Banner */}
                    <AnimatePresence>
                        {hasDraft && !showAddForm && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, y: -10 }}
                                animate={{ opacity: 1, height: 'auto', y: 0 }}
                                exit={{ opacity: 0, height: 0, y: -10 }}
                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/30 rounded-[24px] p-4 shadow-sm overflow-hidden"
                            >
                                <div className="flex items-center gap-3 text-violet-700 dark:text-violet-400">
                                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <line x1="12" y1="18" x2="12" y2="12" />
                                        <line x1="9" y1="15" x2="15" y2="15" />
                                    </svg>
                                    <span className="text-sm font-bold">You have an unsaved reference draft</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={clearDraft} className="px-3 py-1.5 text-xs font-bold text-violet-700 hover:bg-violet-100 dark:text-violet-400 dark:hover:bg-violet-900/40 rounded-lg transition-colors">
                                        Discard
                                    </button>
                                    <button onClick={loadDraft} className="px-3 py-1.5 text-xs font-bold bg-violet-500 text-white hover:bg-violet-600 rounded-lg shadow-sm transition-colors flex items-center gap-1.5">
                                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="1 4 1 10 7 10" />
                                            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                                        </svg>
                                        Resume
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Tags Card (Moved to main view) */}
                    {allTags.length > 0 && (
                        <motion.div 
                            className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[24px] p-5 sm:p-6 group transition-all duration-300 hover:shadow-md hover:border-violet-200/80 dark:hover:border-violet-800/50"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
            
                            
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
                                <div className="flex items-center gap-3 sm:gap-5">
                                    <motion.div
                                        className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-[14px] sm:rounded-[20px] bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-800/50 shrink-0 shadow-sm"
                                        whileHover={{ scale: 1.05, rotate: -5 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                    >
                                        <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                                            <line x1="7" y1="7" x2="7.01" y2="7" />
                                        </svg>
                                    </motion.div>
                                    <div>
                                        <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Filter by Tags</h3>
                                        <p className="text-[14px] sm:text-[15px] text-zinc-500 dark:text-zinc-400 mt-0.5 sm:mt-1">Organize and find your references.</p>
                                    </div>
                                </div>
                                {selectedTags.length > 0 && (
                                    <button 
                                        onClick={() => setSelectedTags([])}
                                        className="text-sm font-bold text-zinc-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors self-start sm:self-center bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-xl"
                                    >
                                        Clear Filters
                                    </button>
                                )}
                            </div>
 
                            <div className="relative -mx-2 sm:mx-0">
                                <div className="flex overflow-x-auto sm:flex-wrap gap-2.5 z-10 pb-2 sm:pb-0 hide-scrollbar px-2 sm:px-0">
                                    {allTags.map(tag => (
                                        <button
                                            key={tag}
                                            className={`shrink-0 px-4 py-2.5 text-[14px] font-bold rounded-xl transition-colors border shadow-sm flex items-center gap-2 ${
                                                selectedTags.includes(tag) 
                                                    ? 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/40 dark:text-violet-300 dark:border-violet-800/50' 
                                                    : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100 hover:text-zinc-900 dark:bg-zinc-950/50 dark:text-zinc-400 dark:border-zinc-800/80'
                                            }`}
                                            onClick={() => setSelectedTags(prev =>
                                                prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                                            )}
                                        >
                                            <svg className={`w-3.5 h-3.5 shrink-0 ${selectedTags.includes(tag) ? 'text-violet-500' : 'text-zinc-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                                {/* Mobile Scroll Indicator Fade */}
                                <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-white dark:from-zinc-950 to-transparent pointer-events-none sm:hidden z-20 rounded-r-xl" aria-hidden="true"></div>
                            </div>
                        </motion.div>
                    )}

                    {/* Reference List */}
                    {isLoading || isSearching ? (
                        <div className="flex flex-col gap-4">
                            {[1, 2].map(i => (
                                <div key={i} className="bg-white dark:bg-zinc-900 rounded-[24px] p-6 border border-zinc-200/80 dark:border-zinc-800/80 animate-pulse">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="w-16 h-6 bg-slate-200 dark:bg-zinc-700 rounded-md"></div>
                                        <div className="flex gap-2">
                                            <div className="w-7 h-7 bg-slate-200 dark:bg-zinc-700 rounded-md"></div>
                                            <div className="w-7 h-7 bg-slate-200 dark:bg-zinc-700 rounded-md"></div>
                                        </div>
                                    </div>
                                    <div className="w-3/4 h-5 bg-slate-200 dark:bg-zinc-700 rounded mb-2"></div>
                                    <div className="w-1/2 h-4 bg-slate-200 dark:bg-zinc-700 rounded mb-4"></div>
                                    <div className="w-full h-16 bg-slate-100 dark:bg-zinc-800 rounded"></div>
                                </div>
                            ))}
                        </div>
                    ) : filteredReferences.length === 0 ? (
                        <motion.div 
                            className="relative overflow-hidden flex flex-col items-center justify-center py-24 px-4 text-center bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[24px] group transition-all duration-300 hover:shadow-md hover:border-violet-200/80 dark:hover:border-violet-800/50"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
            
                            
                            <motion.div 
                                className="w-16 h-16 bg-violet-50 dark:bg-violet-900/30 rounded-[20px] border border-violet-100 dark:border-violet-800/50 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-6 shrink-0 relative z-10 shadow-sm"
                                whileHover={{ scale: 1.05, rotate: -5 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                            >
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                    <line x1="12" y1="6" x2="12" y2="12" strokeDasharray="2 2" />
                                    <line x1="9" y1="9" x2="15" y2="9" strokeDasharray="2 2" />
                                </svg>
                            </motion.div>
                            <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mb-2 relative z-10">No references found</h3>
                            <p className="text-[15px] text-zinc-500 dark:text-zinc-400 max-w-sm relative z-10">
                                {searchQuery || selectedTags.length > 0 ? "No citations match your current filters." : "Add your first reference to start building your academic bibliography."}
                            </p>
                        </motion.div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <AnimatePresence>
                                {paginatedReferences.map((ref, idx) => (
                                    <motion.div
                                        key={ref.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[24px] p-5 sm:p-6 lg:p-8 group min-w-0 transition-all duration-300 hover:shadow-md hover:border-violet-200/80 dark:hover:border-violet-800/50"
                                    >
                                        <div className="flex justify-between items-start gap-4 relative z-10 mb-5">
                                            <div className="flex items-start gap-4 sm:gap-5 min-w-0">
                                                {/* Icon */}
                                                <motion.div
                                                    className="flex items-center justify-center w-11 h-11 sm:w-13 sm:h-13 rounded-[12px] sm:rounded-[16px] bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-800/50 shrink-0 shadow-sm"
                                                    whileHover={{ scale: 1.05, rotate: -5 }}
                                                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                                >
                                                    {ref.sourceType === 'book' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-5.5 sm:h-5.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>}
                                                    {ref.sourceType === 'website' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-5.5 sm:h-5.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>}
                                                    {ref.sourceType === 'journal' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-5.5 sm:h-5.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>}
                                                </motion.div>

                                                {/* Title & Date */}
                                                <div className="min-w-0 flex flex-col justify-center">
                                                    <h4 className="text-[17px] sm:text-[20px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug break-words">
                                                        {ref.title}
                                                    </h4>
                                                    <div className="text-[11px] mt-1.5 font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5 shrink-0 select-none">
                                                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                                        Added {new Date(ref.dateAdded).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 self-start shrink-0">
                                                <button onClick={() => handleEditReference(ref)} className="flex items-center justify-center w-9 h-9 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/60 text-zinc-500 hover:text-violet-600 dark:bg-zinc-800/40 dark:hover:bg-zinc-800 dark:border-zinc-800/60 dark:text-zinc-400 dark:hover:text-violet-400 transition-colors shadow-sm" title="Edit" aria-label={`Edit ${ref.title}`}>
                                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                </button>
                                                <button onClick={() => deleteReference(ref.id)} className="flex items-center justify-center w-9 h-9 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/60 text-zinc-500 hover:text-red-600 dark:bg-zinc-800/40 dark:hover:bg-zinc-800 dark:border-zinc-800/60 dark:text-zinc-400 dark:hover:text-red-400 transition-colors shadow-sm" title="Delete" aria-label={`Delete ${ref.title}`}>
                                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Formatted Citation block */}
                                        <div className="relative z-10 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[14px] p-4 sm:p-5 mb-5 group/citation transition-colors duration-250 hover:bg-zinc-50 dark:hover:bg-zinc-800/35">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-violet-50 text-violet-700 text-[10px] font-bold dark:bg-violet-950/40 dark:text-violet-400 border border-violet-100 dark:border-violet-900/50 uppercase tracking-wider shadow-sm">
                                                    <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>
                                                    {citationStyle} Format
                                                </span>
                                            </div>
                                            <p className="text-[15px] sm:text-[16px] font-serif leading-relaxed text-zinc-800 dark:text-zinc-200 break-words pl-0.5">
                                                {generateCitation(ref, citationStyle).split('*').map((part, index) => index % 2 === 1 ? <em key={index} className="not-italic italic">{part}</em> : part)}
                                            </p>
                                        </div>
                                        
                                        {/* Tags row */}
                                        <div className="relative z-10">
                                            <div className="flex gap-2 flex-wrap items-center">
                                                {/* Source Type Badge */}
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-violet-50 text-violet-700 text-[11px] font-bold dark:bg-violet-950/40 dark:text-violet-400 border border-violet-100 dark:border-violet-900/50 uppercase tracking-wider shadow-sm">
                                                    {ref.sourceType === 'book' && <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>}
                                                    {ref.sourceType === 'website' && <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>}
                                                    {ref.sourceType === 'journal' && <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>}
                                                    {ref.sourceType}
                                                </span>

                                                {/* Author Badge */}
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-50 text-zinc-600 text-[11px] font-bold dark:bg-zinc-800/40 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-800/60 shadow-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/60 shrink-0">
                                                    <svg className="w-3.5 h-3.5 shrink-0 text-violet-500 dark:text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                                    <span className="truncate max-w-[120px] sm:max-w-[180px]">{ref.authors}</span>
                                                </span>

                                                {/* Year Badge */}
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-50 text-zinc-600 text-[11px] font-bold dark:bg-zinc-800/40 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-800/60 shadow-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/60 shrink-0">
                                                    <svg className="w-3.5 h-3.5 shrink-0 text-violet-500 dark:text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                                    <span>{ref.publicationYear}</span>
                                                </span>

                                                {/* Publisher Badge */}
                                                {ref.publisher && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-50 text-zinc-600 text-[11px] font-bold dark:bg-zinc-800/40 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-800/60 shadow-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/60 shrink-0">
                                                        <svg className="w-3.5 h-3.5 shrink-0 text-violet-500 dark:text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2-2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                                                        <span className="truncate max-w-[120px] sm:max-w-[180px]">{ref.publisher}</span>
                                                    </span>
                                                )}

                                                {/* Journal Name Badge */}
                                                {ref.journalName && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-50 text-zinc-600 text-[11px] font-bold dark:bg-zinc-800/40 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-800/60 shadow-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/60 shrink-0">
                                                        <svg className="w-3.5 h-3.5 shrink-0 text-violet-500 dark:text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                                                        <span className="truncate max-w-[150px] sm:max-w-[220px]">{ref.journalName}{ref.volume && `, Vol. ${ref.volume}`}{ref.issue && `(${ref.issue})`}{ref.pages && `, pp. ${ref.pages}`}</span>
                                                    </span>
                                                )}

                                                {/* Custom Tags */}
                                                {ref.tags.map(tag => (
                                                    <span key={tag} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-50 text-zinc-600 text-[11px] font-bold dark:bg-zinc-800/40 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-800/60 shadow-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/60 shrink-0">
                                                        <svg className="w-3.5 h-3.5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
 
                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <motion.div 
                                    className="relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[24px] p-5 sm:p-6 group transition-all duration-300 hover:shadow-md hover:border-violet-200/80 dark:hover:border-violet-800/50"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                    
                                    
                                    <div className="flex items-center gap-5 relative z-10">
                                        <motion.div
                                            className="flex items-center justify-center w-16 h-16 rounded-[20px] bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-800/50 shrink-0 shadow-sm"
                                            whileHover={{ scale: 1.05, rotate: -5 }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                        >
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                                <line x1="9" y1="3" x2="9" y2="21"/>
                                            </svg>
                                        </motion.div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Pages</h3>
                                            <p className="text-[15px] text-zinc-500 dark:text-zinc-400 mt-1">Showing page {currentPage} of {totalPages}</p>
                                        </div>
                                    </div>
 
                                    <div className="flex items-center gap-3 relative z-10 self-start sm:self-center">
                                        <button
                                            onClick={() => {
                                                setCurrentPage(p => Math.max(1, p - 1));
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                            disabled={currentPage === 1}
                                            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-[14px] bg-zinc-50 dark:bg-zinc-950/40 text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                                            Previous
                                        </button>
                                        <button
                                            onClick={() => {
                                                setCurrentPage(p => Math.min(totalPages, p + 1));
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                            disabled={currentPage === totalPages}
                                            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-[14px] bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800/50 hover:bg-violet-100 dark:hover:bg-violet-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            Next
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* Add/Edit Modal */}
            <AnimatePresence>
                {showAddForm && (
                    <motion.div
                        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => { setShowAddForm(false); resetForm(); }}
                    >
                        <motion.div
                            className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-[28px] shadow-2xl border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden flex flex-col max-h-[90vh] relative group"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            
                            {/* Modal Header */}
                            <div className="px-4 sm:px-6 pt-4 pb-2 relative z-20 shrink-0">
                                <motion.div 
                                    animate={{ 
                                        padding: isModalMinimized ? '10px 14px' : '14px 16px',
                                        gap: isModalMinimized ? '12px' : '14px'
                                    }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                                    className="flex-1 w-full relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-[20px] flex items-center group transition-all duration-300 text-left"
                                >
                                    {/* SaaS Background Accents */}
                                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-violet-500/10 dark:bg-violet-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
                                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-violet-400/10 dark:bg-violet-400/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />

                                    <motion.div
                                        animate={{
                                            width: isModalMinimized ? 36 : 42,
                                            height: isModalMinimized ? 36 : 42,
                                            borderRadius: isModalMinimized ? 10 : 12
                                        }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                        className="bg-violet-50 border border-violet-100 dark:bg-violet-500/10 dark:border-violet-500/20 flex shrink-0 items-center justify-center shadow-sm text-violet-600 dark:text-violet-400 relative z-10"
                                    >
                                        <svg className={isModalMinimized ? "w-4 h-4" : "w-5 h-5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="12" y1="6" x2="12" y2="12"/><line x1="9" y1="9" x2="15" y2="9"/></svg>
                                    </motion.div>
                                    
                                    <div className="relative z-10 flex-1 min-w-0 pr-2">
                                        <motion.p 
                                            animate={{ 
                                                fontSize: isModalMinimized ? '9px' : '10px',
                                                marginBottom: isModalMinimized ? '0px' : '2px'
                                            }}
                                            className="font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 m-0"
                                        >
                                            REFERENCE EDITOR
                                        </motion.p>
                                        <motion.h2 
                                            animate={{ fontSize: isModalMinimized ? '16px' : '18px' }}
                                            className="font-bold text-zinc-950 dark:text-zinc-50 tracking-tight m-0 truncate leading-none"
                                        >
                                            {editingId ? 'Edit Reference' : 'Add Reference'}
                                        </motion.h2>
                                        <AnimatePresence>
                                            {!isModalMinimized && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                                    animate={{ height: 'auto', opacity: 1, marginTop: 4 }}
                                                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="overflow-hidden m-0"
                                                >
                                                    <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 truncate m-0">
                                                        {editingId ? 'Update the details for this citation.' : 'Add a new citation to your reference library.'}
                                                    </p>
                                                    
                                                    {draftSaveStatus !== 'idle' && (
                                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mt-1">
                                                            {draftSaveStatus === 'saving' && (
                                                                <>
                                                                    <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                                                                    Saving draft...
                                                                </>
                                                            )}
                                                            {draftSaveStatus === 'saved' && (
                                                                <>
                                                                    <svg className="w-3 h-3 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                                                    <span className="text-emerald-600 dark:text-emerald-400">Draft saved</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <div className="relative z-20 self-start mt-0.5">
                                        <button
                                            type="button"
                                            onClick={() => { setShowAddForm(false); resetForm(); }}
                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-zinc-200/80 bg-white/80 backdrop-blur-md text-zinc-500 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-700 dark:border-zinc-700/80 dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                                            aria-label="Close form"
                                        >
                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
 
                            {/* Scrollable Form Body */}
                            <div className="flex-1 overflow-y-auto px-6 sm:px-8 pb-8 custom-scrollbar relative z-10 pt-4" onScroll={handleModalScroll}>
                                
                                {/* Source Type Toggle */}
                                <div className="mb-8">
                                    <label className="flex items-center gap-2 text-[12px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3 ml-1">
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                                        Source Type
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {(['book', 'website', 'journal'] as SourceType[]).map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setFormSourceType(type)}
                                                className={`flex items-center justify-center sm:flex-col gap-3 p-4 sm:py-5 rounded-[20px] border-2 transition-all ${
                                                    formSourceType === type 
                                                        ? 'border-violet-500 bg-violet-50/50 text-violet-700 dark:border-violet-500 dark:bg-violet-900/20 dark:text-violet-400 shadow-[0_4px_14px_rgba(124, 58, 237, 0.12)]' 
                                                        : 'border-zinc-200/80 bg-zinc-50/50 text-zinc-500 hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800/80 dark:bg-zinc-950/40 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 hover:shadow-sm'
                                                }`}
                                            >
                                                {type === 'book' && <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>}
                                                {type === 'website' && <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>}
                                                {type === 'journal' && <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>}
                                                <span className="text-[14px] font-bold tracking-tight">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
 
                                {/* Form Fields Layout */}
                                <div className="space-y-5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div className="flex flex-col">
                                            <label className="text-[12px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 ml-1">Author(s) <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                placeholder="e.g., Smith, J. & Doe, A."
                                                value={formData.authors}
                                                onChange={(e) => setFormData({ ...formData, authors: e.target.value })}
                                                className="w-full bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800/80 text-[15px] font-bold rounded-2xl px-5 py-4 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all shadow-sm"
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <label className="text-[12px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 ml-1">Year <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                placeholder="e.g., 2023"
                                                value={formData.publicationYear}
                                                onChange={(e) => setFormData({ ...formData, publicationYear: e.target.value })}
                                                className="w-full bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800/80 text-[15px] font-bold rounded-2xl px-5 py-4 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all shadow-sm"
                                            />
                                        </div>
                                    </div>
 
                                    <div className="flex flex-col">
                                        <label className="text-[12px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 ml-1">Title <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            placeholder="Enter the title of the work"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800/80 text-[15px] font-bold rounded-2xl px-5 py-4 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all shadow-sm"
                                        />
                                    </div>
 
                                    {formSourceType === 'book' && (
                                        <div className="flex flex-col">
                                            <label className="text-[12px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 ml-1">Publisher</label>
                                            <input
                                                type="text"
                                                placeholder="e.g., Oxford University Press"
                                                value={formData.publisher}
                                                onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                                                className="w-full bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800/80 text-[15px] font-bold rounded-2xl px-5 py-4 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all shadow-sm"
                                            />
                                        </div>
                                    )}
 
                                    {formSourceType === 'website' && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <div className="flex flex-col">
                                                <label className="text-[12px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 ml-1">URL</label>
                                                <input
                                                    type="text"
                                                    placeholder="https://..."
                                                    value={formData.url}
                                                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                                    className="w-full bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800/80 text-[15px] font-bold rounded-2xl px-5 py-4 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all shadow-sm"
                                                />
                                            </div>
                                            <div className="flex flex-col">
                                                <label className="text-[12px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 ml-1">Access Date</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g., December 9, 2025"
                                                    value={formData.accessDate}
                                                    onChange={(e) => setFormData({ ...formData, accessDate: e.target.value })}
                                                    className="w-full bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800/80 text-[15px] font-bold rounded-2xl px-5 py-4 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all shadow-sm"
                                                />
                                            </div>
                                        </div>
                                    )}
 
                                    {formSourceType === 'journal' && (
                                        <>
                                            <div className="flex flex-col">
                                                <label className="text-[12px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 ml-1">Journal Name</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g., Nature"
                                                    value={formData.journalName}
                                                    onChange={(e) => setFormData({ ...formData, journalName: e.target.value })}
                                                    className="w-full bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800/80 text-[15px] font-bold rounded-2xl px-5 py-4 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all shadow-sm"
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                                <div className="flex flex-col">
                                                    <label className="text-[12px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 ml-1">Volume</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g., 12"
                                                        value={formData.volume}
                                                        onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                                                        className="w-full bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800/80 text-[15px] font-bold rounded-2xl px-5 py-4 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all shadow-sm"
                                                    />
                                                </div>
                                                <div className="flex flex-col">
                                                    <label className="text-[12px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 ml-1">Issue</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g., 3"
                                                        value={formData.issue}
                                                        onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
                                                        className="w-full bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800/80 text-[15px] font-bold rounded-2xl px-5 py-4 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all shadow-sm"
                                                    />
                                                </div>
                                                <div className="flex flex-col">
                                                    <label className="text-[12px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 ml-1">Pages</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g., 45-67"
                                                        value={formData.pages}
                                                        onChange={(e) => setFormData({ ...formData, pages: e.target.value })}
                                                        className="w-full bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800/80 text-[15px] font-bold rounded-2xl px-5 py-4 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}
 
                                    <div className="flex flex-col">
                                        <label className="text-[12px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 ml-1">Tags (comma separated)</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., research, psychology, 2023"
                                            value={formData.tags}
                                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                            className="w-full bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800/80 text-[15px] font-bold rounded-2xl px-5 py-4 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>
 
                            {/* Modal Footer */}
                            <motion.div 
                                className="relative z-20 shrink-0 border-t border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.02)]"
                                animate={{
                                    padding: isModalMinimized ? '12px 16px' : '20px 24px'
                                }}
                            >
                                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 w-full">
                                    <motion.button
                                        onClick={() => { setShowAddForm(false); resetForm(); }}
                                        className="flex items-center justify-center gap-1.5 w-full sm:w-auto text-[14px] font-bold text-zinc-700 bg-white dark:text-zinc-300 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-sm"
                                        animate={{
                                            padding: isModalMinimized ? '8px 16px' : '10px 20px',
                                        }}
                                        whileHover={{ y: -1 }}
                                        whileTap={{ scale: 0.97 }}
                                    >
                                        Cancel
                                    </motion.button>
                                    <motion.button
                                        onClick={handleAddReference}
                                        disabled={!formData.authors || !formData.title || !formData.publicationYear}
                                        className="flex items-center justify-center gap-1.5 w-full sm:w-auto text-[14px] font-bold text-white bg-violet-600 rounded-xl hover:bg-violet-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                        animate={{
                                            padding: isModalMinimized ? '8px 20px' : '10px 24px',
                                        }}
                                        whileHover={{ y: -1, boxShadow: '0 8px 20px rgba(124, 58, 237, 0.35)' }}
                                        whileTap={{ scale: 0.97 }}
                                    >
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                        {editingId ? 'Save Changes' : 'Add Reference'}
                                    </motion.button>
                                </div>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ReferenceManager;
