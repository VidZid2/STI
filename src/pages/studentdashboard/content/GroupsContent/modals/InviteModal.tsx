import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import type { GroupWithMembers } from '../../../../../services/groupsService';

// Invite Modal Component
const InviteModal: React.FC<{
    group: GroupWithMembers | null;
    isOpen: boolean;
    onClose: () => void;
}> = ({ group, isOpen, onClose }) => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    const [inviteLink, setInviteLink] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [expiresIn, setExpiresIn] = useState<string>('7');
    const [maxUses, setMaxUses] = useState<string>('');
    const [showExpiresDropdown, setShowExpiresDropdown] = useState(false);
    const [showMaxUsesDropdown, setShowMaxUsesDropdown] = useState(false);
    const expiresButtonRef = useRef<HTMLButtonElement>(null);
    const maxUsesButtonRef = useRef<HTMLButtonElement>(null);
    const [expiresDropdownPos, setExpiresDropdownPos] = useState({ bottom: 0, left: 0, width: 0 });
    const [maxUsesDropdownPos, setMaxUsesDropdownPos] = useState({ bottom: 0, left: 0, width: 0 });
    const [hoveredExpiresId, setHoveredExpiresId] = useState<string | null>(null);
    const [hoveredMaxUsesId, setHoveredMaxUsesId] = useState<string | null>(null);

    // Update dropdown positions when opened
    useEffect(() => {
        if (showExpiresDropdown && expiresButtonRef.current) {
            const rect = expiresButtonRef.current.getBoundingClientRect();
            setExpiresDropdownPos({ bottom: window.innerHeight - rect.top + 6, left: rect.left, width: rect.width });
        }
    }, [showExpiresDropdown]);

    useEffect(() => {
        if (showMaxUsesDropdown && maxUsesButtonRef.current) {
            const rect = maxUsesButtonRef.current.getBoundingClientRect();
            setMaxUsesDropdownPos({ bottom: window.innerHeight - rect.top + 6, left: rect.left, width: rect.width });
        }
    }, [showMaxUsesDropdown]);

    const expiresOptions = [
        { value: '1', label: '1 day' },
        { value: '7', label: '7 days' },
        { value: '30', label: '30 days' },
        { value: 'never', label: 'Never' },
    ];

    const maxUsesOptions = [
        { value: '', label: 'No limit' },
        { value: '1', label: '1 use' },
        { value: '5', label: '5 uses' },
        { value: '10', label: '10 uses' },
        { value: '25', label: '25 uses' },
    ];



    useEffect(() => {
        if (!isOpen) {
            setInviteLink('');
            setCopied(false);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleGenerateLink = async () => {
        if (!group) return;
        setIsGenerating(true);
        try {
            const { createInviteLink } = await import('../../../../../services/groupsService');
            const days = expiresIn === 'never' ? undefined : parseInt(expiresIn);
            const uses = maxUses ? parseInt(maxUses) : undefined;
            const invite = await createInviteLink(group.id, days, uses);
            if (invite) {
                const baseUrl = window.location.origin;
                setInviteLink(`${baseUrl}/join/${invite.invite_code}`);
            }
        } catch (err) {
        }
        setIsGenerating(false);
    };

    const handleCopy = async () => {
        if (!inviteLink) return;
        try {
            await navigator.clipboard.writeText(inviteLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
        }
    };

    if (!group) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }} onClick={onClose}
                        style={{
                            position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)',
                            backdropFilter: 'blur(4px)', zIndex: 10000,
                        }}
                    />
                    <div style={{
                        position: 'fixed', inset: 0, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', zIndex: 10001, pointerEvents: 'none', padding: '20px',
                    }}>
                        <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ 
                                duration: 0.25, ease: [0.4, 0, 0.2, 1],
                                layout: { type: 'spring', damping: 25, stiffness: 200 }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className={`w-full max-w-[420px] rounded-[24px] overflow-hidden relative shadow-2xl border pointer-events-auto ${
                                isDarkMode ? 'bg-zinc-950 border-zinc-800/80 shadow-zinc-900/50' : 'bg-white border-zinc-200/80'
                            }`}
                        >
                            {/* SaaS Background Accents */}
                            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-32 h-32 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

                            {/* Header */}
                            <div className="p-6 pb-4 relative z-10">
                                <motion.button
                                    onClick={onClose}
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`absolute right-5 top-5 z-20 flex items-center justify-center rounded-xl border p-2 shadow-sm transition-colors ${
                                        isDarkMode 
                                            ? 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700' 
                                            : 'border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50'
                                    }`}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </motion.button>
                                
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="flex gap-4 pr-14"
                                >
                                    {/* Bouncy Icon Container */}
                                    <motion.div
                                        whileHover={{ scale: 1.05, rotate: -5 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                        className={`w-[52px] h-[52px] rounded-[16px] flex items-center justify-center flex-shrink-0 shadow-sm border ${
                                            isDarkMode ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-100'
                                        }`}
                                    >
                                        <svg className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                            <line x1="19" y1="8" x2="19" y2="14" />
                                            <line x1="22" y1="11" x2="16" y2="11" />
                                        </svg>
                                    </motion.div>

                                    {/* Text Info */}
                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h2 className={`text-[20px] font-bold tracking-tight leading-none truncate ${
                                                isDarkMode ? 'text-zinc-100' : 'text-zinc-900'
                                            }`}>
                                                Invite to {group.name}
                                            </h2>
                                        </div>
                                        <p className={`text-[12.5px] font-medium leading-[1.4] truncate ${
                                            isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
                                        }`}>
                                            Share a link to invite members
                                        </p>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Content */}
                            <div className="p-4 flex flex-col gap-3 relative z-10 pb-6" style={{ perspective: 1000 }}>
                                <AnimatePresence mode="wait">
                                    {!inviteLink ? (
                                        <motion.div
                                            key="state-no-link"
                                            initial={{ opacity: 0, rotateX: 20, scale: 0.95, y: 8, filter: 'blur(4px)' }}
                                            animate={{ opacity: 1, rotateX: 0, scale: 1, y: 0, filter: 'blur(0px)' }}
                                            exit={{ opacity: 0, rotateX: -20, scale: 0.95, y: -8, filter: 'blur(4px)' }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                            className="flex flex-col gap-3 w-full"
                                        >
                                            {/* Shareable Link Section */}
                                            <div className={`p-4 rounded-[16px] border shadow-sm transition-colors ${
                                                isDarkMode ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200/80'
                                            }`}>
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className={`flex items-center gap-2 text-[11.5px] font-bold tracking-wider uppercase ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                                        </svg>
                                                        Shareable Invite Link
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded-[6px] text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-500'}`}>
                                                        Optional
                                                    </span>
                                                </div>

                                                <motion.button
                                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                                    onClick={handleGenerateLink}
                                                    disabled={isGenerating}
                                                    className={`w-full py-3.5 px-4 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 text-[14px] font-semibold transition-colors ${
                                                        isDarkMode 
                                                            ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20' 
                                                            : 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'
                                                    } ${isGenerating ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
                                                >
                                                    {isGenerating ? (
                                                        <>
                                                            <motion.div
                                                                animate={{ rotate: 360 }}
                                                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                            >
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                                                </svg>
                                                            </motion.div>
                                                            Generating...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <circle cx="12" cy="12" r="10" />
                                                                <line x1="12" y1="8" x2="12" y2="16" />
                                                                <line x1="8" y1="12" x2="16" y2="12" />
                                                            </svg>
                                                            Generate Invite Link
                                                        </>
                                                    )}
                                                </motion.button>

                                                <p className={`mt-3 text-[12.5px] leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                                    Share this link with classmates to let them join your group.
                                                </p>
                                            </div>

                                            {/* Options */}
                                            <div className={`grid grid-cols-2 gap-3 p-4 rounded-[16px] border shadow-sm transition-colors ${
                                                isDarkMode ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200/80'
                                            }`}>
                                                <div className="relative">
                                                    <label className={`block text-[11px] font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
                                                        Expires After
                                                    </label>
                                                    <div className="bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200/50 dark:border-zinc-800/80 rounded-[1.25rem] p-1.5 shadow-inner w-full">
                                                        <motion.button
                                                            ref={expiresButtonRef}
                                                            onClick={() => { setShowExpiresDropdown(!showExpiresDropdown); setShowMaxUsesDropdown(false); }}
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            className={`w-full py-2.5 px-3 rounded-xl border flex items-center justify-between text-[13px] font-medium transition-colors ${
                                                                showExpiresDropdown 
                                                                    ? (isDarkMode ? 'border-blue-500/50 bg-blue-500/10' : 'border-blue-300 bg-blue-50')
                                                                    : (isDarkMode ? 'border-zinc-800 bg-zinc-950 hover:border-zinc-700' : 'border-zinc-200 bg-white hover:border-zinc-300')
                                                            } ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}
                                                        >
                                                            {expiresOptions.find(o => o.value === expiresIn)?.label}
                                                            <svg 
                                                                width="14" height="14" viewBox="0 0 24 24" fill="none" 
                                                                stroke={showExpiresDropdown ? (isDarkMode ? '#60a5fa' : '#2563eb') : 'currentColor'} 
                                                                strokeWidth="2"
                                                                className={`transition-transform duration-200 ${showExpiresDropdown ? 'rotate-180' : ''}`}
                                                            >
                                                                <polyline points="6 15 12 9 18 15" />
                                                            </svg>
                                                        </motion.button>
                                                    </div>
                                                    {createPortal(
                                                        <AnimatePresence>
                                                            {showExpiresDropdown && (
                                                                <>
                                                                    <motion.div 
                                                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                                                                        onClick={() => setShowExpiresDropdown(false)} 
                                                                        className="fixed inset-0 z-[10010]" 
                                                                    />
                                                                    <motion.div
                                                                        initial={{ opacity: 0, scale: 0.985, y: 5 }}
                                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                        exit={{ opacity: 0, scale: 0.985, y: 5 }}
                                                                        transition={{ type: 'spring', stiffness: 260, damping: 32, mass: 0.95 }}
                                                                        className={`fixed p-1.5 rounded-xl border z-[10011] overflow-hidden ${
                                                                            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
                                                                        }`}
                                                                        style={{
                                                                            bottom: expiresDropdownPos.bottom,
                                                                            left: expiresDropdownPos.left,
                                                                            width: expiresDropdownPos.width,
                                                                            transformOrigin: 'bottom center'
                                                                        }}
                                                                        onMouseLeave={() => setHoveredExpiresId(null)}
                                                                    >
                                                                        <div className="flex flex-col gap-1 relative w-full">
                                                                            {expiresOptions.map((option) => {
                                                                                const isSelected = expiresIn === option.value;
                                                                                const isHighlighted = hoveredExpiresId !== null ? hoveredExpiresId === option.value : isSelected;
                                                                                return (
                                                                                <button
                                                                                    type="button"
                                                                                    key={option.value}
                                                                                    onMouseEnter={() => setHoveredExpiresId(option.value)}
                                                                                    onClick={() => { setExpiresIn(option.value); setShowExpiresDropdown(false); }}
                                                                                    className={`w-full px-3 h-[40px] rounded-lg text-left flex items-center justify-between text-[13px] font-medium transition-colors relative ${
                                                                                        isHighlighted 
                                                                                            ? (isDarkMode ? 'text-blue-400' : 'text-blue-600')
                                                                                            : (isDarkMode ? 'text-zinc-300 hover:text-zinc-50' : 'text-zinc-700 hover:text-zinc-950')
                                                                                    }`}
                                                                                >
                                                                                    {isHighlighted && (
                                                                                        <motion.div
                                                                                            layoutId="expiresHighlight"
                                                                                            className={`absolute inset-0 rounded-lg pointer-events-none z-0 ${
                                                                                                isDarkMode ? 'bg-blue-500/20' : 'bg-blue-50'
                                                                                            }`}
                                                                                            transition={{ type: 'spring', stiffness: 600, damping: 38 }}
                                                                                        />
                                                                                    )}
                                                                                    <span className="relative z-10">{option.label}</span>
                                                                                    <AnimatePresence>
                                                                                        {isSelected && (
                                                                                            <motion.div
                                                                                                className="relative z-10"
                                                                                                initial={{ scale: 0, rotate: -90 }}
                                                                                                animate={{ scale: 1, rotate: 0 }}
                                                                                                exit={{ scale: 0, rotate: 90 }}
                                                                                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                                                                            >
                                                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={isDarkMode ? 'text-blue-400' : 'text-blue-600'}>
                                                                                                    <polyline points="20 6 9 17 4 12" />
                                                                                                </svg>
                                                                                            </motion.div>
                                                                                        )}
                                                                                    </AnimatePresence>
                                                                                </button>
                                                                            )})}
                                                                        </div>
                                                                    </motion.div>
                                                                </>
                                                            )}
                                                        </AnimatePresence>,
                                                        document.body
                                                    )}
                                                </div>

                                                <div className="relative">
                                                    <label className={`block text-[11px] font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
                                                        Max Uses
                                                    </label>
                                                    <div className="bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200/50 dark:border-zinc-800/80 rounded-[1.25rem] p-1.5 shadow-inner w-full">
                                                        <motion.button
                                                            ref={maxUsesButtonRef}
                                                            onClick={() => { setShowMaxUsesDropdown(!showMaxUsesDropdown); setShowExpiresDropdown(false); }}
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            className={`w-full py-2.5 px-3 rounded-xl border flex items-center justify-between text-[13px] font-medium transition-colors ${
                                                                showMaxUsesDropdown 
                                                                    ? (isDarkMode ? 'border-blue-500/50 bg-blue-500/10' : 'border-blue-300 bg-blue-50')
                                                                    : (isDarkMode ? 'border-zinc-800 bg-zinc-950 hover:border-zinc-700' : 'border-zinc-200 bg-white hover:border-zinc-300')
                                                            } ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}
                                                        >
                                                            {maxUsesOptions.find(o => o.value === maxUses)?.label}
                                                            <svg 
                                                                width="14" height="14" viewBox="0 0 24 24" fill="none" 
                                                                stroke={showMaxUsesDropdown ? (isDarkMode ? '#60a5fa' : '#2563eb') : 'currentColor'} 
                                                                strokeWidth="2"
                                                                className={`transition-transform duration-200 ${showMaxUsesDropdown ? 'rotate-180' : ''}`}
                                                            >
                                                                <polyline points="6 15 12 9 18 15" />
                                                            </svg>
                                                        </motion.button>
                                                    </div>
                                                    {createPortal(
                                                        <AnimatePresence>
                                                            {showMaxUsesDropdown && (
                                                                <>
                                                                    <motion.div 
                                                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                                                                        onClick={() => setShowMaxUsesDropdown(false)} 
                                                                        className="fixed inset-0 z-[10010]" 
                                                                    />
                                                                    <motion.div
                                                                        initial={{ opacity: 0, scale: 0.985, y: 5 }}
                                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                        exit={{ opacity: 0, scale: 0.985, y: 5 }}
                                                                        transition={{ type: 'spring', stiffness: 260, damping: 32, mass: 0.95 }}
                                                                        className={`fixed p-1.5 rounded-xl border z-[10011] overflow-hidden ${
                                                                            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
                                                                        }`}
                                                                        style={{
                                                                            bottom: maxUsesDropdownPos.bottom,
                                                                            left: maxUsesDropdownPos.left,
                                                                            width: maxUsesDropdownPos.width,
                                                                            transformOrigin: 'bottom center'
                                                                        }}
                                                                        onMouseLeave={() => setHoveredMaxUsesId(null)}
                                                                    >
                                                                        <div className="flex flex-col gap-1 relative w-full">
                                                                            {maxUsesOptions.map((option) => {
                                                                                const isSelected = maxUses === option.value;
                                                                                const isHighlighted = hoveredMaxUsesId !== null ? hoveredMaxUsesId === option.value : isSelected;
                                                                                return (
                                                                                <button
                                                                                    type="button"
                                                                                    key={option.value}
                                                                                    onMouseEnter={() => setHoveredMaxUsesId(option.value)}
                                                                                    onClick={() => { setMaxUses(option.value); setShowMaxUsesDropdown(false); }}
                                                                                    className={`w-full px-3 h-[40px] rounded-lg text-left flex items-center justify-between text-[13px] font-medium transition-colors relative ${
                                                                                        isHighlighted 
                                                                                            ? (isDarkMode ? 'text-blue-400' : 'text-blue-600')
                                                                                            : (isDarkMode ? 'text-zinc-300 hover:text-zinc-50' : 'text-zinc-700 hover:text-zinc-950')
                                                                                    }`}
                                                                                >
                                                                                    {isHighlighted && (
                                                                                        <motion.div
                                                                                            layoutId="maxUsesHighlight"
                                                                                            className={`absolute inset-0 rounded-lg pointer-events-none z-0 ${
                                                                                                isDarkMode ? 'bg-blue-500/20' : 'bg-blue-50'
                                                                                            }`}
                                                                                            transition={{ type: 'spring', stiffness: 600, damping: 38 }}
                                                                                        />
                                                                                    )}
                                                                                    <span className="relative z-10">{option.label}</span>
                                                                                    <AnimatePresence>
                                                                                        {isSelected && (
                                                                                            <motion.div
                                                                                                className="relative z-10"
                                                                                                initial={{ scale: 0, rotate: -90 }}
                                                                                                animate={{ scale: 1, rotate: 0 }}
                                                                                                exit={{ scale: 0, rotate: 90 }}
                                                                                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                                                                            >
                                                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={isDarkMode ? 'text-blue-400' : 'text-blue-600'}>
                                                                                                    <polyline points="20 6 9 17 4 12" />
                                                                                                </svg>
                                                                                            </motion.div>
                                                                                        )}
                                                                                    </AnimatePresence>
                                                                                </button>
                                                                            )})}
                                                                        </div>
                                                                    </motion.div>
                                                                </>
                                                            )}
                                                        </AnimatePresence>,
                                                        document.body
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="state-with-link"
                                            initial={{ opacity: 0, rotateX: 20, scale: 0.95, y: 8, filter: 'blur(4px)' }}
                                            animate={{ opacity: 1, rotateX: 0, scale: 1, y: 0, filter: 'blur(0px)' }}
                                            exit={{ opacity: 0, rotateX: -20, scale: 0.95, y: -8, filter: 'blur(4px)' }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                            className="flex flex-col gap-3 w-full"
                                        >
                                            {/* Shareable Link Section */}
                                            <div className={`p-4 rounded-[16px] border shadow-sm transition-colors ${
                                                isDarkMode ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200/80'
                                            }`}>
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className={`flex items-center gap-2 text-[11.5px] font-bold tracking-wider uppercase ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                                        </svg>
                                                        Shareable Invite Link
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded-[6px] text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-500'}`}>
                                                        Optional
                                                    </span>
                                                </div>

                                                <div className="flex flex-col gap-4 items-center">
                                                    {/* QR Code */}
                                                    <div className="p-3 bg-white rounded-2xl border border-zinc-200 shadow-sm">
                                                        <QRCodeSVG 
                                                            value={inviteLink} 
                                                            size={140} 
                                                            level="M" 
                                                            fgColor="#000000" 
                                                            bgColor="#ffffff" 
                                                        />
                                                    </div>

                                                    <div className="flex gap-2 items-stretch w-full">
                                                        <div className={`flex-1 p-3 rounded-[10px] border text-[13px] overflow-hidden text-ellipsis whitespace-nowrap ${
                                                            isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-700'
                                                        }`}>
                                                            {inviteLink}
                                                        </div>
                                                        <motion.button
                                                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                                            onClick={handleCopy}
                                                            className={`px-4 py-3 rounded-[10px] border text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors ${
                                                                copied 
                                                                    ? (isDarkMode ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600')
                                                                    : (isDarkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200')
                                                            }`}
                                                        >
                                                            {copied ? (
                                                                <>
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                        <polyline points="20 6 9 17 4 12" />
                                                                    </svg>
                                                                    Copied!
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                                                    </svg>
                                                                    Copy
                                                                </>
                                                            )}
                                                        </motion.button>
                                                    </div>
                                                </div>

                                                <p className={`mt-3 text-[12.5px] leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                                    Share this link with classmates to let them join your group.
                                                </p>
                                            </div>

                                            {/* Generate New Link */}
                                            <div className={`rounded-[16px] transition-colors`}>
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => { setInviteLink(''); setCopied(false); }}
                                                    className="w-full py-3 px-4 text-[13px] font-bold rounded-[14px] transition-colors flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 border shadow-sm"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                                        <path d="M3 3v5h5" />
                                                    </svg>
                                                    Generate New Link
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default InviteModal;
