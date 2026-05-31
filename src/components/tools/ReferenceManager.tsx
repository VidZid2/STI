/**
 * Reference Manager Component
 * Save, organize, and export research citations
 */

import * as React from "react";
import { useState, useEffect } from "react";
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

    // Load references from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('references');
        if (saved) {
            setReferences(JSON.parse(saved));
        }
        setTimeout(() => {
            setIsLoading(false);
            setIsPageLoading(false);
        }, 400);
    }, []);

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
                className="relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-5 mb-6 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[24px] w-full group transition-all duration-300 hover:shadow-md hover:border-purple-200/80 dark:hover:border-purple-800/50"
            >
                {/* SaaS Background Accents (matches ToolsHeader) */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />

                
                <div className="flex items-center gap-4 relative z-10 min-w-0">
                    <motion.div
                        className="flex items-center justify-center w-12 h-12 rounded-[16px] bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800/50 flex-shrink-0 shadow-sm"
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
                            <ToolHeaderBadge icon={Library} label={`${references.length} References`} tone="blue" />
                            <ToolHeaderBadge
                                icon={Save}
                                label={draftSaveStatus === 'saving' ? 'Saving Draft' : draftSaveStatus === 'saved' || hasDraft ? 'Draft Saved' : 'Auto-save ready'}
                                tone="emerald"
                                hideOnSmall
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:flex-wrap sm:items-center sm:w-auto relative z-10">
                    <motion.button
                        onClick={onBack}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-bold text-zinc-700 bg-zinc-100 dark:text-zinc-300 dark:bg-zinc-800/50 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
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
                            className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-bold text-zinc-700 bg-zinc-100 dark:text-zinc-300 dark:bg-zinc-800/50 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shadow-sm"
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
                            className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            whileHover={{ y: -1, boxShadow: '0 8px 20px rgba(37, 99, 235, 0.35)' }}
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
                            className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 px-5 py-2 text-sm font-bold text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-950/30 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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
                >
                    {/* Search Card */}
                    <motion.div 
                        className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[24px] p-5 sm:p-6 group transition-all duration-300 hover:shadow-md hover:border-purple-200/80 dark:hover:border-purple-800/50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                    >
                        {/* SaaS Background Accents */}
                        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
        
                        
                        <div className="flex items-center gap-5 mb-6 relative z-10">
                            <motion.div
                                className="flex items-center justify-center w-16 h-16 rounded-[20px] bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800/50 shrink-0 shadow-sm"
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
                                    <svg className="animate-spin w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
                                className="w-full bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 text-[15px] font-semibold rounded-2xl py-3.5 pl-12 pr-12 text-zinc-700 dark:text-zinc-300 placeholder-zinc-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
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
                        className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[24px] p-5 sm:p-6 group transition-all duration-300 hover:shadow-md hover:border-purple-200/80 dark:hover:border-purple-800/50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                    >
                        {/* SaaS Background Accents */}
                        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
        
                        
                        <div className="flex items-center gap-5 mb-6 relative z-10">
                            <motion.div
                                className="flex items-center justify-center w-16 h-16 rounded-[20px] bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800/50 shrink-0 shadow-sm"
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
                                    className={`relative z-10 flex-1 rounded-xl py-3 text-center text-[15px] font-black transition-colors ${
                                        citationStyle === style ? 'text-purple-700 dark:text-purple-300' : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
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
                                    <svg className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                                <div className="bg-purple-50/50 dark:bg-purple-900/10 rounded-[16px] p-4 border border-purple-100/50 dark:border-purple-800/30">
                                    <p className="text-[11px] font-black tracking-wider text-purple-500 uppercase mb-2">Example</p>
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
                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-[24px] p-4 shadow-sm overflow-hidden"
                            >
                                <div className="flex items-center gap-3 text-amber-700 dark:text-amber-400">
                                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <line x1="12" y1="18" x2="12" y2="12" />
                                        <line x1="9" y1="15" x2="15" y2="15" />
                                    </svg>
                                    <span className="text-sm font-bold">You have an unsaved reference draft</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={clearDraft} className="px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/40 rounded-lg transition-colors">
                                        Discard
                                    </button>
                                    <button onClick={loadDraft} className="px-3 py-1.5 text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 rounded-lg shadow-sm transition-colors flex items-center gap-1.5">
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
                            className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[24px] p-5 sm:p-6 group transition-all duration-300 hover:shadow-md hover:border-purple-200/80 dark:hover:border-purple-800/50"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* SaaS Background Accents */}
                            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
            
                            
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
                                <div className="flex items-center gap-5">
                                    <motion.div
                                        className="flex items-center justify-center w-16 h-16 rounded-[20px] bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800/50 shrink-0 shadow-sm"
                                        whileHover={{ scale: 1.05, rotate: -5 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                                            <line x1="7" y1="7" x2="7.01" y2="7" />
                                        </svg>
                                    </motion.div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Filter by Tags</h3>
                                        <p className="text-[15px] text-zinc-500 dark:text-zinc-400 mt-1">Organize and find your references.</p>
                                    </div>
                                </div>
                                {selectedTags.length > 0 && (
                                    <button 
                                        onClick={() => setSelectedTags([])}
                                        className="text-sm font-bold text-zinc-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors self-start sm:self-center bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-xl"
                                    >
                                        Clear Filters
                                    </button>
                                )}
                            </div>

                            <div className="relative flex flex-wrap gap-2.5 z-10">
                                {allTags.map(tag => (
                                    <button
                                        key={tag}
                                        className={`px-4 py-2.5 text-[14px] font-bold rounded-xl transition-colors border shadow-sm flex items-center gap-2 ${
                                            selectedTags.includes(tag) 
                                                ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800/50' 
                                                : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100 hover:text-zinc-900 dark:bg-zinc-950/50 dark:text-zinc-400 dark:border-zinc-800/80'
                                        }`}
                                        onClick={() => setSelectedTags(prev =>
                                            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                                        )}
                                    >
                                        <svg className={`w-3.5 h-3.5 ${selectedTags.includes(tag) ? 'text-purple-500' : 'text-zinc-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                                        {tag}
                                    </button>
                                ))}
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
                            className="relative overflow-hidden flex flex-col items-center justify-center py-24 px-4 text-center bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[24px] group transition-all duration-300 hover:shadow-md hover:border-purple-200/80 dark:hover:border-purple-800/50"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            {/* SaaS Background Accents */}
                            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
            
                            
                            <motion.div 
                                className="w-16 h-16 bg-purple-50 dark:bg-purple-900/30 rounded-[20px] border border-purple-100 dark:border-purple-800/50 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6 shrink-0 relative z-10 shadow-sm"
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
                                        className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[24px] p-6 sm:p-8 group min-w-0 transition-all duration-300 hover:shadow-md hover:border-purple-200/80 dark:hover:border-purple-800/50"
                                    >
                                        {/* SaaS Background Accents */}
                                        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
                        
                                        
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6 relative z-10 mb-6">
                                            {/* Massive Icon */}
                                            <motion.div
                                                className="flex items-center justify-center w-16 h-16 rounded-[20px] bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800/50 shrink-0 shadow-sm"
                                                whileHover={{ scale: 1.05, rotate: -5 }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                            >
                                                {ref.sourceType === 'book' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>}
                                                {ref.sourceType === 'website' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>}
                                                {ref.sourceType === 'journal' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>}
                                            </motion.div>

                                            {/* Title and metadata */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug break-words">
                                                    {ref.title}
                                                </h4>
                                                
                                                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-2 text-[15px] font-medium text-zinc-500 dark:text-zinc-400">
                                                    <div className="flex items-center gap-1.5">
                                                        <svg className="w-4 h-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                                        <span>{ref.authors}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <svg className="w-4 h-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                                        <span>{ref.publicationYear}</span>
                                                    </div>
                                                    {ref.publisher && (
                                                        <div className="flex items-center gap-1.5">
                                                            <svg className="w-4 h-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2-2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                                                            <span>{ref.publisher}</span>
                                                        </div>
                                                    )}
                                                    {ref.journalName && (
                                                        <div className="flex items-center gap-1.5">
                                                            <svg className="w-4 h-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                                                            <span>{ref.journalName}{ref.volume && `, Vol. ${ref.volume}`}{ref.issue && `(${ref.issue})`}{ref.pages && `, pp. ${ref.pages}`}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-2 mt-4 sm:mt-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity self-start sm:self-center shrink-0">
                                                <button onClick={() => handleEditReference(ref)} className="flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-700/80 transition-colors shadow-sm" title="Edit" aria-label={`Edit ${ref.title}`}>
                                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                </button>
                                                <button onClick={() => deleteReference(ref.id)} className="flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-zinc-700/80 transition-colors shadow-sm" title="Delete" aria-label={`Delete ${ref.title}`}>
                                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Formatted Citation block */}
                                        <div className="relative z-10 bg-zinc-50 dark:bg-zinc-950/40 rounded-[20px] p-5 sm:p-6 border-l-4 border-purple-500 mb-5 transition-colors hover:border-purple-400">
                                            <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-purple-500 mb-3">
                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>
                                                {citationStyle} Format
                                            </div>
                                            <p className="text-[16px] font-serif leading-relaxed text-zinc-800 dark:text-zinc-200 break-words">
                                                {generateCitation(ref, citationStyle).split('*').map((part, index) => index % 2 === 1 ? <em key={index} className="not-italic italic">{part}</em> : part)}
                                            </p>
                                        </div>
                                        
                                        <div className="relative z-10 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                                            <div className="flex gap-2 flex-wrap">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-purple-50 text-purple-700 text-[12px] font-bold dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200/50 dark:border-purple-800/50 uppercase tracking-wider">
                                                    {ref.sourceType === 'book' && <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>}
                                                    {ref.sourceType === 'website' && <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>}
                                                    {ref.sourceType === 'journal' && <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>}
                                                    {ref.sourceType}
                                                </span>
                                                {ref.tags.map(tag => (
                                                    <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-zinc-100 text-zinc-600 text-[12px] font-bold dark:bg-zinc-800/80 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700">
                                                        <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="text-[12px] font-bold text-zinc-400 flex items-center gap-1.5 shrink-0">
                                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                                Added {new Date(ref.dateAdded).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <motion.div 
                                    className="relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[24px] p-5 sm:p-6 group transition-all duration-300 hover:shadow-md hover:border-purple-200/80 dark:hover:border-purple-800/50"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    {/* SaaS Background Accents */}
                                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
                    
                                    
                                    <div className="flex items-center gap-5 relative z-10">
                                        <motion.div
                                            className="flex items-center justify-center w-16 h-16 rounded-[20px] bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800/50 shrink-0 shadow-sm"
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
                                            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-[14px] bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50 hover:bg-purple-100 dark:hover:bg-purple-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                            <div className="absolute top-0 right-0 -mr-24 -mt-24 w-72 h-72 bg-blue-500/5 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-110" aria-hidden="true" />
                            
                            {/* Modal Header */}
                            <div className="flex items-start justify-between px-6 sm:px-8 pt-8 pb-6 relative z-10 shrink-0">
                                <div className="flex items-center gap-5">
                                    <motion.div
                                        className="flex items-center justify-center w-16 h-16 rounded-[20px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50 shrink-0"
                                        whileHover={{ scale: 1.05, rotate: -5 }}
                                    >
                                        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="12" y1="6" x2="12" y2="12"/><line x1="9" y1="9" x2="15" y2="9"/></svg>
                                    </motion.div>
                                    <div className="flex flex-col">
                                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-none">
                                            {editingId ? 'Edit Reference' : 'Add Reference'}
                                        </h2>
                                        <p className="text-[15px] text-zinc-500 dark:text-zinc-400 mt-2">
                                            {editingId ? 'Update the details for this citation.' : 'Add a new citation to your reference library.'}
                                        </p>
                                        <div className="h-4 flex items-center mt-1">
                                            <AnimatePresence mode="wait">
                                                {draftSaveStatus !== 'idle' && (
                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0, y: -5 }}
                                                        className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider"
                                                    >
                                                        {draftSaveStatus === 'saving' && (
                                                            <>
                                                                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                                                                Saving draft...
                                                            </>
                                                        )}
                                                        {draftSaveStatus === 'saved' && (
                                                            <>
                                                                <svg className="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                                                <span className="text-emerald-600 dark:text-emerald-400">Draft saved</span>
                                                            </>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setShowAddForm(false); resetForm(); }}
                                    aria-label="Close reference form"
                                    className="w-10 h-10 flex items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                </button>
                            </div>

                            {/* Scrollable Form Body */}
                            <div className="flex-1 overflow-y-auto px-6 sm:px-8 pb-8 custom-scrollbar relative z-10">
                                
                                {/* Source Type Toggle */}
                                <div className="mb-8">
                                    <label className="flex items-center gap-2 text-[12px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3 ml-1">
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
                                                        ? 'border-blue-500 bg-blue-50/50 text-blue-700 dark:border-blue-500 dark:bg-blue-900/20 dark:text-blue-400 shadow-[0_4px_14px_rgba(59,130,246,0.12)]' 
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
                                            <label className="text-[12px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 ml-1">Author(s) <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                placeholder="e.g., Smith, J. & Doe, A."
                                                value={formData.authors}
                                                onChange={(e) => setFormData({ ...formData, authors: e.target.value })}
                                                className="w-full bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800/80 text-[15px] font-bold rounded-2xl px-5 py-4 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <label className="text-[12px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 ml-1">Year <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                placeholder="e.g., 2023"
                                                value={formData.publicationYear}
                                                onChange={(e) => setFormData({ ...formData, publicationYear: e.target.value })}
                                                className="w-full bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800/80 text-[15px] font-bold rounded-2xl px-5 py-4 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col">
                                        <label className="text-[12px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 ml-1">Title <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            placeholder="Enter the title of the work"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800/80 text-[15px] font-bold rounded-2xl px-5 py-4 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                        />
                                    </div>

                                    {formSourceType === 'book' && (
                                        <div className="flex flex-col">
                                            <label className="text-[12px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 ml-1">Publisher</label>
                                            <input
                                                type="text"
                                                placeholder="e.g., Oxford University Press"
                                                value={formData.publisher}
                                                onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                                                className="w-full bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800/80 text-[15px] font-bold rounded-2xl px-5 py-4 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                            />
                                        </div>
                                    )}

                                    {formSourceType === 'website' && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <div className="flex flex-col">
                                                <label className="text-[12px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 ml-1">URL</label>
                                                <input
                                                    type="text"
                                                    placeholder="https://..."
                                                    value={formData.url}
                                                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                                    className="w-full bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800/80 text-[15px] font-bold rounded-2xl px-5 py-4 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                                />
                                            </div>
                                            <div className="flex flex-col">
                                                <label className="text-[12px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 ml-1">Access Date</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g., December 9, 2025"
                                                    value={formData.accessDate}
                                                    onChange={(e) => setFormData({ ...formData, accessDate: e.target.value })}
                                                    className="w-full bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800/80 text-[15px] font-bold rounded-2xl px-5 py-4 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {formSourceType === 'journal' && (
                                        <>
                                            <div className="flex flex-col">
                                                <label className="text-[12px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 ml-1">Journal Name</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g., Nature"
                                                    value={formData.journalName}
                                                    onChange={(e) => setFormData({ ...formData, journalName: e.target.value })}
                                                    className="w-full bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800/80 text-[15px] font-bold rounded-2xl px-5 py-4 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                                <div className="flex flex-col">
                                                    <label className="text-[12px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 ml-1">Volume</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g., 12"
                                                        value={formData.volume}
                                                        onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                                                        className="w-full bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800/80 text-[15px] font-bold rounded-2xl px-5 py-4 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                                    />
                                                </div>
                                                <div className="flex flex-col">
                                                    <label className="text-[12px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 ml-1">Issue</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g., 3"
                                                        value={formData.issue}
                                                        onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
                                                        className="w-full bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800/80 text-[15px] font-bold rounded-2xl px-5 py-4 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                                    />
                                                </div>
                                                <div className="flex flex-col">
                                                    <label className="text-[12px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 ml-1">Pages</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g., 45-67"
                                                        value={formData.pages}
                                                        onChange={(e) => setFormData({ ...formData, pages: e.target.value })}
                                                        className="w-full bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800/80 text-[15px] font-bold rounded-2xl px-5 py-4 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <div className="flex flex-col">
                                        <label className="text-[12px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 ml-1">Tags (comma separated)</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., research, psychology, 2023"
                                            value={formData.tags}
                                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                            className="w-full bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800/80 text-[15px] font-bold rounded-2xl px-5 py-4 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 px-6 sm:px-8 py-5 shrink-0 relative z-10 mt-2">
                                <motion.button
                                    onClick={() => { setShowAddForm(false); resetForm(); }}
                                    className="flex items-center justify-center gap-1.5 w-full sm:w-auto px-4 py-2 text-[14px] font-bold text-zinc-700 bg-zinc-100 dark:text-zinc-300 dark:bg-zinc-800/50 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                    whileHover={{ y: -1 }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    onClick={handleAddReference}
                                    disabled={!formData.authors || !formData.title || !formData.publicationYear}
                                    className="flex items-center justify-center gap-1.5 w-full sm:w-auto px-5 py-2 text-[14px] font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                    whileHover={{ y: -1, boxShadow: '0 8px 20px rgba(37, 99, 235, 0.35)' }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                    {editingId ? 'Save Changes' : 'Add Reference'}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ReferenceManager;
