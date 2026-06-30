import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { joinGroupByInvite } from '../../../../../services/groupsService';

const JoinGroupModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onJoinSuccess: (groupId: string) => void;
}> = ({ isOpen, onClose, onJoinSuccess }) => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    const [inviteInput, setInviteInput] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setInviteInput('');
            setError(null);
            setIsJoining(false);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleJoin = async () => {
        const codeOrLink = inviteInput.trim();
        if (!codeOrLink) {
            setError("Please enter an invite link or code.");
            return;
        }

        // Extract code from link if a full link was pasted
        let code = codeOrLink;
        if (code.includes('/join/')) {
            code = code.split('/join/')[1].split('/')[0].split('?')[0];
        }

        if (!code) {
            setError("Invalid invite link or code.");
            return;
        }

        setIsJoining(true);
        setError(null);

        try {
            const result = await joinGroupByInvite(code);
            if (result.success && result.groupId) {
                onJoinSuccess(result.groupId);
                onClose();
            } else {
                setError(result.error || "Failed to join group. The link might be invalid or expired.");
            }
        } catch (err) {
            setError("An error occurred while joining the group.");
        } finally {
            setIsJoining(false);
        }
    };

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
                                    aria-label="Close"
                                >
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </motion.button>

                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="flex gap-4 pr-8"
                                >
                                    {/* Bouncy Icon Container */}
                                    <motion.div
                                        whileHover={{ scale: 1.05, rotate: -5 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                        className={`w-[52px] h-[52px] rounded-[16px] flex items-center justify-center flex-shrink-0 shadow-sm border ${
                                            isDarkMode ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-100'
                                        }`}
                                    >
                                        <svg className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                        </svg>
                                    </motion.div>

                                    {/* Text Info */}
                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h2 className={`text-[20px] font-bold tracking-tight leading-none ${
                                                isDarkMode ? 'text-zinc-100' : 'text-zinc-900'
                                            }`}>
                                                Join Project
                                            </h2>
                                        </div>
                                        <p className={`text-[12.5px] font-medium leading-[1.4] ${
                                            isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
                                        }`}>
                                            Enter an invite link or code to join.
                                        </p>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Content */}
                            <div className="px-6 pb-6 pt-2 relative z-10 flex flex-col gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className={`text-[11px] font-bold uppercase tracking-wider ${
                                        isDarkMode ? 'text-zinc-500' : 'text-zinc-500'
                                    }`}>
                                        INVITE LINK OR CODE
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. http://localhost:5173/join/xyz123 or xyz123"
                                        value={inviteInput}
                                        onChange={(e) => {
                                            setInviteInput(e.target.value);
                                            if (error) setError(null);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleJoin();
                                        }}
                                        autoFocus
                                        className={`w-full px-4 h-[44px] rounded-[12px] text-[14px] font-medium transition-all focus:outline-none focus:ring-2 ${
                                            isDarkMode 
                                                ? 'bg-zinc-900 text-zinc-100 placeholder:text-zinc-600 border border-zinc-800 focus:border-blue-500/50 focus:ring-blue-500/20' 
                                                : 'bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 border border-zinc-200 focus:border-blue-500 focus:ring-blue-500/20'
                                        }`}
                                    />
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="text-red-500 text-[12.5px] font-medium mt-1"
                                        >
                                            {error}
                                        </motion.div>
                                    )}
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleJoin}
                                    disabled={!inviteInput.trim() || isJoining}
                                    className={`w-full h-[44px] rounded-[12px] flex items-center justify-center gap-2 font-bold text-[14px] transition-all shadow-sm ${
                                        !inviteInput.trim() || isJoining
                                            ? isDarkMode 
                                                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                                : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/25 hover:shadow-blue-500/40'
                                    }`}
                                >
                                    {isJoining ? (
                                        <>
                                            <svg className="w-4 h-4 animate-spin text-white/70" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Joining...
                                        </>
                                    ) : (
                                        'Join Project'
                                    )}
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default JoinGroupModal;
