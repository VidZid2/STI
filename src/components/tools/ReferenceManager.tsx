/**
 * Reference Manager Component
 * Save, organize, and export research citations
 */

import * as React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { Download, Library, Save, Tags } from "lucide-react";
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

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-[1400px] mx-auto h-auto min-h-[calc(100vh-6rem)] flex flex-col min-w-0 overflow-x-hidden"
        >
            {/* Header Area */}
            <motion.div
                className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-5 mb-6 bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden shadow-sm w-full group"
                onHoverStart={() => setIsTitleHovered(true)}
                onHoverEnd={() => setIsTitleHovered(false)}
                animate={{
                    boxShadow: isTitleHovered ? '0 14px 34px rgba(59, 130, 246, 0.10)' : '0 4px 20px rgba(0, 0, 0, 0.04)',
                    borderColor: isTitleHovered ? 'rgba(59, 130, 246, 0.28)' : 'rgba(228, 228, 231, 0.82)'
                }}
            >
                <motion.div 
                    className="absolute top-1/2 left-0 -translate-y-1/2 w-32 h-32 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-700"
                    animate={{ opacity: isTitleHovered ? 1 : 0.8 }}
                />
                
                <div className="flex items-center gap-4 relative z-10 min-w-0">
                    <motion.div
                        className="flex items-center justify-center w-12 h-12 rounded-[16px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50"
                        whileHover={{ scale: 1.05, rotate: -5 }}
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
                            <ToolHeaderBadge icon={Tags} label="Tags" tone="violet" />
                            <ToolHeaderBadge icon={Download} label="Export" tone="zinc" />
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
                        className="bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-200/80 dark:border-zinc-800/80 p-5 shadow-sm"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <motion.div
                                className="flex items-center justify-center w-10 h-10 rounded-[14px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50"
                                whileHover={{ scale: 1.05, rotate: -5 }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="M21 21l-4.35-4.35" />
                                </svg>
                            </motion.div>
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Search</h3>
                        </div>
                        <div className="relative flex items-center">
                            <div className="absolute left-3 text-zinc-400">
                                {isSearching ? (
                                    <svg className="animate-spin w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M21 12a9 9 0 11-6.219-8.56" />
                                    </svg>
                                ) : (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                                className="w-full bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 text-sm rounded-xl py-2.5 pl-10 pr-10 text-zinc-700 dark:text-zinc-300 placeholder-zinc-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    aria-label="Clear search"
                                    className="absolute right-3 w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:bg-zinc-300 hover:text-zinc-700 transition-colors"
                                >
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </motion.div>

                    {/* Citation Style Card */}
                    <motion.div 
                        className="bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-200/80 dark:border-zinc-800/80 p-5 shadow-sm"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <motion.div
                                className="flex items-center justify-center w-10 h-10 rounded-[14px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50"
                                whileHover={{ scale: 1.05, rotate: -5 }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <line x1="16" y1="13" x2="8" y2="13" />
                                    <line x1="16" y1="17" x2="8" y2="17" />
                                </svg>
                            </motion.div>
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Citation Style</h3>
                        </div>
                        
                        <div className="relative flex p-1 bg-zinc-100 dark:bg-zinc-950/70 rounded-xl mb-4">
                            <motion.div
                                className="absolute top-1 bottom-1 w-1/3 bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-zinc-200/80 dark:border-zinc-700"
                                animate={{
                                    x: citationStyle === 'APA' ? '0%' : citationStyle === 'MLA' ? '100%' : '200%',
                                }}
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            />
                            {(['APA', 'MLA', 'Chicago'] as CitationStyle[]).map(style => (
                                <button
                                    key={style}
                                    className={`relative z-10 flex-1 py-1.5 text-xs font-bold transition-colors ${
                                        citationStyle === style ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                                    }`}
                                    onClick={() => setCitationStyle(style)}
                                >
                                    {style}
                                </button>
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={citationStyle}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="pt-3 border-t border-zinc-100 dark:border-zinc-800"
                            >
                                <div className="flex gap-2 items-start text-[11px] text-zinc-500 dark:text-zinc-400 mb-3 leading-snug">
                                    <svg className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                                <div className="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-lg p-3 border border-indigo-100/50 dark:border-indigo-800/30">
                                    <p className="text-[9px] font-black tracking-wider text-indigo-400 uppercase mb-1">Example</p>
                                    <p className="text-xs text-zinc-700 dark:text-zinc-300 font-serif">
                                        {citationStyle === 'APA' && <>Smith, J. (2023). <em>Book Title</em>. Publisher.</>}
                                        {citationStyle === 'MLA' && <>Smith, John. <em>Book Title</em>. Publisher, 2023.</>}
                                        {citationStyle === 'Chicago' && <>Smith, John. <em>Book Title</em>. Publisher, 2023.</>}
                                    </p>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </motion.div>

                    {/* Tags Card */}
                    {allTags.length > 0 && (
                        <motion.div 
                            className="bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-200/80 dark:border-zinc-800/80 p-5 shadow-sm"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.3 }}
                        >
                            <h3 className="text-xs font-black tracking-wider text-zinc-400 uppercase mb-4">Filter by Tags</h3>
                            <div className="flex flex-wrap gap-2">
                                {allTags.map(tag => (
                                    <button
                                        key={tag}
                                        className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors border ${
                                            selectedTags.includes(tag) 
                                                ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800/50' 
                                                : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
                                        }`}
                                        onClick={() => setSelectedTags(prev =>
                                            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                                        )}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
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
                            className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-[24px] shadow-sm"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-400 mb-4">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                    <line x1="12" y1="6" x2="12" y2="12" strokeDasharray="2 2" />
                                    <line x1="9" y1="9" x2="15" y2="9" strokeDasharray="2 2" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">No references found</h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">
                                {searchQuery || selectedTags.length > 0 ? "No citations match your current filters." : "Add your first reference to start building your academic bibliography."}
                            </p>
                        </motion.div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <AnimatePresence>
                                {filteredReferences.map((ref, idx) => (
                                    <motion.div
                                        key={ref.id}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-800 transition-all group min-w-0"
                                    >
                                        <div className="flex justify-between items-center gap-3 px-5 py-4 sm:px-6 bg-zinc-50/80 dark:bg-zinc-950/30 border-b border-zinc-100 dark:border-zinc-800/80">
                                            <div className="flex items-center gap-2 text-xs font-bold px-2.5 py-1 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 uppercase tracking-wider">
                                                {ref.sourceType === 'book' && <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>}
                                                {ref.sourceType === 'website' && <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>}
                                                {ref.sourceType === 'journal' && <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>}
                                                {ref.sourceType}
                                            </div>
                                            <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEditReference(ref)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-zinc-800 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 transition-colors shadow-sm" title="Edit" aria-label={`Edit ${ref.title}`}>
                                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                </button>
                                                <button onClick={() => deleteReference(ref.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-zinc-800 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 transition-colors shadow-sm" title="Delete" aria-label={`Delete ${ref.title}`}>
                                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="p-6 sm:p-7">
                                            <h4 className="text-[17px] font-bold text-zinc-900 dark:text-zinc-100 leading-snug mb-3 break-words">
                                                {ref.title}
                                            </h4>
                                            
                                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-600 dark:text-zinc-400 mb-5">
                                                <div className="flex items-center gap-1.5">
                                                    <svg className="w-4 h-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                                    <span>{ref.authors}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <svg className="w-4 h-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                                    <span>{ref.publicationYear}</span>
                                                </div>
                                                {ref.publisher && (
                                                    <div className="flex items-center gap-1.5">
                                                        <svg className="w-4 h-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2-2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                                                        <span>{ref.publisher}</span>
                                                    </div>
                                                )}
                                                {ref.journalName && (
                                                    <div className="flex items-center gap-1.5">
                                                        <svg className="w-4 h-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                                                        <span>{ref.journalName}{ref.volume && `, Vol. ${ref.volume}`}{ref.issue && `(${ref.issue})`}{ref.pages && `, pp. ${ref.pages}`}</span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="bg-zinc-50 dark:bg-zinc-950/40 rounded-2xl p-4 border-l-4 border-indigo-500 mb-4">
                                                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-indigo-500 mb-2">
                                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>
                                                    {citationStyle} Format
                                                </div>
                                                <p className="text-[15px] font-serif leading-relaxed text-zinc-800 dark:text-zinc-200 break-words">
                                                    {generateCitation(ref, citationStyle)}
                                                </p>
                                            </div>
                                            
                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mt-2">
                                                <div className="flex gap-2 flex-wrap">
                                                    {ref.tags.map(tag => (
                                                        <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-600 text-[11px] font-bold dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                                                            <svg className="w-3 h-3 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5 shrink-0">
                                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                                    Added {new Date(ref.dateAdded).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
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
                            className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-[24px] shadow-2xl border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden flex flex-col max-h-[90vh]"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-5 bg-zinc-50 dark:bg-zinc-950/30 border-b border-zinc-200/80 dark:border-zinc-800/80 shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="12" y1="6" x2="12" y2="12"/><line x1="9" y1="9" x2="15" y2="9"/></svg>
                                    </div>
                                    <div className="flex flex-col">
                                        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 m-0 leading-none">
                                            {editingId ? 'Edit Reference' : 'Add Reference'}
                                        </h2>
                                        <div className="h-4 flex items-center mt-1">
                                            <AnimatePresence mode="wait">
                                                {draftSaveStatus !== 'idle' && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -5 }}
                                                        className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500"
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
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                </button>
                            </div>

                            {/* Scrollable Form Body */}
                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                
                                {/* Source Type Toggle */}
                                <div className="mb-6">
                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                                        Source Type
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {(['book', 'website', 'journal'] as SourceType[]).map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setFormSourceType(type)}
                                                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                                                    formSourceType === type 
                                                        ? 'border-blue-500 bg-blue-50/50 text-blue-600 dark:border-blue-500 dark:bg-blue-900/20 dark:text-blue-400 shadow-sm' 
                                                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:border-zinc-600'
                                                }`}
                                            >
                                                {type === 'book' && <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>}
                                                {type === 'website' && <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>}
                                                {type === 'journal' && <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>}
                                                <span className="text-[13px] font-bold">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Form Fields Layout */}
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="flex flex-col">
                                            <label className="text-xs font-bold text-slate-500 mb-1.5 ml-1">Author(s) <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                placeholder="e.g., Smith, J. & Doe, A."
                                                value={formData.authors}
                                                onChange={(e) => setFormData({ ...formData, authors: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 text-[14px] rounded-xl px-4 py-3 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <label className="text-xs font-bold text-slate-500 mb-1.5 ml-1">Year <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                placeholder="e.g., 2023"
                                                value={formData.publicationYear}
                                                onChange={(e) => setFormData({ ...formData, publicationYear: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 text-[14px] rounded-xl px-4 py-3 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col">
                                        <label className="text-xs font-bold text-slate-500 mb-1.5 ml-1">Title <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            placeholder="Enter the title of the work"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 text-[14px] rounded-xl px-4 py-3 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        />
                                    </div>

                                    {formSourceType === 'book' && (
                                        <div className="flex flex-col">
                                            <label className="text-xs font-bold text-slate-500 mb-1.5 ml-1">Publisher</label>
                                            <input
                                                type="text"
                                                placeholder="e.g., Oxford University Press"
                                                value={formData.publisher}
                                                onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 text-[14px] rounded-xl px-4 py-3 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                            />
                                        </div>
                                    )}

                                    {formSourceType === 'website' && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="flex flex-col">
                                                <label className="text-xs font-bold text-slate-500 mb-1.5 ml-1">URL</label>
                                                <input
                                                    type="text"
                                                    placeholder="https://..."
                                                    value={formData.url}
                                                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                                    className="w-full bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 text-[14px] rounded-xl px-4 py-3 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                                />
                                            </div>
                                            <div className="flex flex-col">
                                                <label className="text-xs font-bold text-slate-500 mb-1.5 ml-1">Access Date</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g., December 9, 2025"
                                                    value={formData.accessDate}
                                                    onChange={(e) => setFormData({ ...formData, accessDate: e.target.value })}
                                                    className="w-full bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 text-[14px] rounded-xl px-4 py-3 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {formSourceType === 'journal' && (
                                        <>
                                            <div className="flex flex-col">
                                                <label className="text-xs font-bold text-slate-500 mb-1.5 ml-1">Journal Name</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g., Nature"
                                                    value={formData.journalName}
                                                    onChange={(e) => setFormData({ ...formData, journalName: e.target.value })}
                                                    className="w-full bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 text-[14px] rounded-xl px-4 py-3 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div className="flex flex-col">
                                                    <label className="text-xs font-bold text-slate-500 mb-1.5 ml-1">Volume</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g., 12"
                                                        value={formData.volume}
                                                        onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                                                        className="w-full bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 text-[14px] rounded-xl px-4 py-3 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                                    />
                                                </div>
                                                <div className="flex flex-col">
                                                    <label className="text-xs font-bold text-slate-500 mb-1.5 ml-1">Issue</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g., 3"
                                                        value={formData.issue}
                                                        onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
                                                        className="w-full bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 text-[14px] rounded-xl px-4 py-3 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                                    />
                                                </div>
                                                <div className="flex flex-col">
                                                    <label className="text-xs font-bold text-slate-500 mb-1.5 ml-1">Pages</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g., 45-67"
                                                        value={formData.pages}
                                                        onChange={(e) => setFormData({ ...formData, pages: e.target.value })}
                                                        className="w-full bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 text-[14px] rounded-xl px-4 py-3 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <div className="flex flex-col">
                                        <label className="text-xs font-bold text-slate-500 mb-1.5 ml-1">Tags (comma separated)</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., research, psychology, 2023"
                                            value={formData.tags}
                                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 text-[14px] rounded-xl px-4 py-3 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 px-6 py-4 bg-zinc-50 dark:bg-zinc-950/30 border-t border-zinc-200/80 dark:border-zinc-800/80 shrink-0">
                                <motion.button
                                    onClick={() => { setShowAddForm(false); resetForm(); }}
                                    className="flex items-center justify-center gap-1.5 w-full sm:w-auto px-4 py-2 text-sm font-bold text-zinc-700 bg-zinc-100 dark:text-zinc-300 dark:bg-zinc-800/50 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                    whileHover={{ y: -1 }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    onClick={handleAddReference}
                                    disabled={!formData.authors || !formData.title || !formData.publicationYear}
                                    className="flex items-center justify-center gap-1.5 w-full sm:w-auto px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
