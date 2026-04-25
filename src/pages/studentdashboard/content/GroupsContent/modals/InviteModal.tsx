import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { useModalAccessibility } from '../../../hooks/useModalAccessibility';
import type { GroupWithMembers } from '../../../../../services/groupsService';

// Invite Modal Component
const InviteModal: React.FC<{
    group: GroupWithMembers | null;
    isOpen: boolean;
    onClose: () => void;
    }> = ({ group, isOpen, onClose }) => {
    const { modalRef, modalProps } = useModalAccessibility(isOpen, onClose, 'invite-modal-title');
    const [inviteLink, setInviteLink] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [expiresIn, setExpiresIn] = useState<string>('7');
    const [maxUses, setMaxUses] = useState<string>('');
    const [showExpiresDropdown, setShowExpiresDropdown] = useState(false);
    const [showMaxUsesDropdown, setShowMaxUsesDropdown] = useState(false);
    const expiresButtonRef = useRef<HTMLButtonElement>(null);
    const maxUsesButtonRef = useRef<HTMLButtonElement>(null);
    const [expiresDropdownPos, setExpiresDropdownPos] = useState({ top: 0, left: 0, width: 0 });
    const [maxUsesDropdownPos, setMaxUsesDropdownPos] = useState({ top: 0, left: 0, width: 0 });

    // Update dropdown positions when opened
    useEffect(() => {
        if (showExpiresDropdown && expiresButtonRef.current) {
            const rect = expiresButtonRef.current.getBoundingClientRect();
            setExpiresDropdownPos({ top: rect.bottom + 6, left: rect.left, width: rect.width });
        }
    }, [showExpiresDropdown]);

    useEffect(() => {
        if (showMaxUsesDropdown && maxUsesButtonRef.current) {
            const rect = maxUsesButtonRef.current.getBoundingClientRect();
            setMaxUsesDropdownPos({ top: rect.bottom + 6, left: rect.left, width: rect.width });
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

    const = {
        bg: 'var(--bg-primary)',
        cardBg: 'var(--bg-primary)',
        border: 'var(--border-light)',
        textPrimary: 'var(--text-primary)',
        textSecondary: 'var(--text-secondary)',
        textMuted: 'var(--text-muted)',
        accent: '#10b981' };

    useEffect(() => {
        if (!isOpen) {
            setInviteLink('');
            setCopied(false);
        }
    }, [isOpen]);

    // Escape key + focus trap handled by useModalAccessibility hook

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
                            backdropFilter: 'blur(4px)', zIndex: 10000 }}
                    />
                    <div
                        ref={modalRef}
                        {...modalProps}
                        style={{
                            position: 'fixed', inset: 0, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', zIndex: 10001, pointerEvents: 'none', padding: '20px' }}>
                        <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ 
                                type: 'spring', 
                                stiffness: 400, 
                                damping: 30,
                                layout: { type: 'spring', damping: 25, stiffness: 200 }
                            }}
                            style={{
                                width: '100%', maxWidth: '420px',
                                background: 'var(--bg-primary)', borderRadius: '20px',
                                boxShadow: 'var(--shadow-lg)',
                                overflow: 'hidden', pointerEvents: 'auto' }}
                        >
                            {/* Header */}
                            <div style={{ 
                                padding: '20px 24px', borderBottom: `1px solid var(--border-color)`,
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '10px',
                                        background: `var(--accent-color)15`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={'var(--accent-color)'} strokeWidth="2">
                                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                            <line x1="19" y1="8" x2="19" y2="14" />
                                            <line x1="22" y1="11" x2="16" y2="11" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                            Invite to {group.name}
                                        </h3>
                                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                                            Share a link to invite members
                                        </p>
                                    </div>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                    onClick={onClose}
                                    style={{
                                        width: '32px', height: '32px', borderRadius: '8px', border: 'none',
                                        background: 'var(--bg-hover)',
                                        color: 'var(--text-secondary)', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </motion.button>
                            </div>

                            {/* Content */}
                            <motion.div layout style={{ padding: '20px 24px' }}>
                                {/* Shareable Link Section */}
                                <motion.div layout style={{ marginBottom: '20px' }}>
                                    <div style={{ 
                                        display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px',
                                        color: 'var(--accent-color)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                        </svg>
                                        Shareable Invite Link
                                    </div>

                                    <AnimatePresence mode="wait">
                                        {!inviteLink ? (
                                            <motion.button
                                                key="generate"
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                                onClick={handleGenerateLink}
                                                disabled={isGenerating}
                                                style={{
                                                    width: '100%', padding: '14px', borderRadius: '12px',
                                                    border: `2px dashed var(--accent-color)40`,
                                                    background: `var(--accent-color)08`,
                                                    color: 'var(--accent-color)', fontSize: '14px', fontWeight: 600,
                                                    cursor: isGenerating ? 'wait' : 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                                    opacity: isGenerating ? 0.7 : 1 }}
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
                                        ) : (
                                            <motion.div
                                                key="link"
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                                style={{
                                                    display: 'flex', gap: '8px', alignItems: 'stretch' }}
                                            >
                                                <div style={{
                                                    flex: 1, padding: '12px 14px', borderRadius: '10px',
                                                    background: 'var(--dashboard-surface)', border: `1px solid var(--border-color)`,
                                                    fontSize: '13px', color: 'var(--text-primary)',
                                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {inviteLink}
                                                </div>
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                                    onClick={handleCopy}
                                                    style={{
                                                        padding: '12px 16px', borderRadius: '10px',
                                                        background: copied 
                                                            ? ('rgba(16, 185, 129, 0.1)')
                                                            : ('rgba(16, 185, 129, 0.1)'),
                                                        border: `1px solid ${'rgba(16, 185, 129, 0.1)'}`,
                                                        color: 'var(--accent-color)', fontSize: '13px', fontWeight: 600,
                                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                                                        transition: 'all 0.2s ease' }}
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
                                        </motion.div>
                                    )}
                                    </AnimatePresence>

                                    <p style={{ 
                                        margin: '10px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                                        Share this link with classmates to let them join your group
                                    </p>
                                </motion.div>

                                {/* Options */}
                                <AnimatePresence>
                                    {!inviteLink && (
                                        <motion.div 
                                            layout
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                            style={{ 
                                                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px',
                                                padding: '16px', borderRadius: '12px',
                                                background: 'var(--dashboard-surface)', border: `1px solid var(--border-color)`,
                                                overflow: 'hidden' }}
                                        >
                                        {/* Expires After Dropdown */}
                                        <div style={{ position: 'relative' }}>
                                            <label style={{ 
                                                display: 'block', fontSize: '11px', fontWeight: 600, 
                                                color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>
                                                Expires After
                                            </label>
                                            <motion.button
                                                ref={expiresButtonRef}
                                                onClick={() => { setShowExpiresDropdown(!showExpiresDropdown); setShowMaxUsesDropdown(false); }}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                style={{
                                                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                                                    border: `1px solid ${showExpiresDropdown ? 'var(--accent-color)' : 'var(--border-color)'}`,
                                                    background: showExpiresDropdown ? `var(--accent-color)08` : 'var(--bg-primary)',
                                                    color: 'var(--text-primary)', fontSize: '13px', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                    transition: 'border-color 0.2s ease, background 0.2s ease' }}
                                            >
                                                {expiresOptions.find(o => o.value === expiresIn)?.label}
                                                <svg 
                                                    width="14" height="14" viewBox="0 0 24 24" fill="none" 
                                                    stroke={showExpiresDropdown ? 'var(--accent-color)' : 'var(--text-secondary)'} 
                                                    strokeWidth="2"
                                                    style={{ transform: showExpiresDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
                                                >
                                                    <polyline points="6 9 12 15 18 9" />
                                                </svg>
                                            </motion.button>
                                            {createPortal(
                                                <AnimatePresence>
                                                    {showExpiresDropdown && (
                                                        <>
                                                            <motion.div 
                                                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                                                                onClick={() => setShowExpiresDropdown(false)} 
                                                                style={{ position: 'fixed', inset: 0, zIndex: 10010 }} 
                                                            />
                                                            <motion.div
                                                                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                                style={{
                                                                    position: 'fixed',
                                                                    top: expiresDropdownPos.top,
                                                                    left: expiresDropdownPos.left,
                                                                    width: expiresDropdownPos.width,
                                                                    padding: '6px', borderRadius: '10px',
                                                                    background: 'var(--bg-primary)', border: `1px solid var(--border-color)`,
                                                                    boxShadow: 'var(--shadow-lg)',
                                                                    zIndex: 10011 }}
                                                            >
                                                                {expiresOptions.map((option) => (
                                                                    <motion.button
                                                                        key={option.value}
                                                                        onClick={() => { setExpiresIn(option.value); setShowExpiresDropdown(false); }}
                                                                        whileHover={{ backgroundColor: 'var(--bg-hover)' }}
                                                                        style={{
                                                                            width: '100%', padding: '10px 12px', borderRadius: '8px',
                                                                            border: 'none', cursor: 'pointer', textAlign: 'left',
                                                                            background: expiresIn === option.value ? `var(--accent-color)10` : 'transparent',
                                                                            color: expiresIn === option.value ? 'var(--accent-color)' : 'var(--text-secondary)',
                                                                            fontSize: '12px', fontWeight: 500,
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                                                                    >
                                                                        {option.label}
                                                                        {expiresIn === option.value && (
                                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={'var(--accent-color)'} strokeWidth="2">
                                                                                <polyline points="20 6 9 17 4 12" />
                                                                            </svg>
                                                                        )}
                                                                    </motion.button>
                                                                ))}
                                                            </motion.div>
                                                        </>
                                                    )}
                                                </AnimatePresence>,
                                                document.body
                                            )}
                                        </div>

                                        {/* Max Uses Dropdown */}
                                        <div style={{ position: 'relative' }}>
                                            <label style={{ 
                                                display: 'block', fontSize: '11px', fontWeight: 600, 
                                                color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>
                                                Max Uses
                                            </label>
                                            <motion.button
                                                ref={maxUsesButtonRef}
                                                onClick={() => { setShowMaxUsesDropdown(!showMaxUsesDropdown); setShowExpiresDropdown(false); }}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                style={{
                                                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                                                    border: `1px solid ${showMaxUsesDropdown ? 'var(--accent-color)' : 'var(--border-color)'}`,
                                                    background: showMaxUsesDropdown ? `var(--accent-color)08` : 'var(--bg-primary)',
                                                    color: 'var(--text-primary)', fontSize: '13px', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                    transition: 'border-color 0.2s ease, background 0.2s ease' }}
                                            >
                                                {maxUsesOptions.find(o => o.value === maxUses)?.label}
                                                <svg 
                                                    width="14" height="14" viewBox="0 0 24 24" fill="none" 
                                                    stroke={showMaxUsesDropdown ? 'var(--accent-color)' : 'var(--text-secondary)'} 
                                                    strokeWidth="2"
                                                    style={{ transform: showMaxUsesDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
                                                >
                                                    <polyline points="6 9 12 15 18 9" />
                                                </svg>
                                            </motion.button>
                                            {createPortal(
                                                <AnimatePresence>
                                                    {showMaxUsesDropdown && (
                                                        <>
                                                            <motion.div 
                                                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                                                                onClick={() => setShowMaxUsesDropdown(false)} 
                                                                style={{ position: 'fixed', inset: 0, zIndex: 10010 }} 
                                                            />
                                                            <motion.div
                                                                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                                style={{
                                                                    position: 'fixed',
                                                                    top: maxUsesDropdownPos.top,
                                                                    left: maxUsesDropdownPos.left,
                                                                    width: maxUsesDropdownPos.width,
                                                                    padding: '6px', borderRadius: '10px',
                                                                    background: 'var(--bg-primary)', border: `1px solid var(--border-color)`,
                                                                    boxShadow: 'var(--shadow-lg)',
                                                                    zIndex: 10011 }}
                                                            >
                                                                {maxUsesOptions.map((option) => (
                                                                    <motion.button
                                                                        key={option.value}
                                                                        onClick={() => { setMaxUses(option.value); setShowMaxUsesDropdown(false); }}
                                                                        whileHover={{ backgroundColor: 'var(--bg-hover)' }}
                                                                        style={{
                                                                            width: '100%', padding: '10px 12px', borderRadius: '8px',
                                                                            border: 'none', cursor: 'pointer', textAlign: 'left',
                                                                            background: maxUses === option.value ? `var(--accent-color)10` : 'transparent',
                                                                            color: maxUses === option.value ? 'var(--accent-color)' : 'var(--text-secondary)',
                                                                            fontSize: '12px', fontWeight: 500,
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                                                                    >
                                                                        {option.label}
                                                                        {maxUses === option.value && (
                                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={'var(--accent-color)'} strokeWidth="2">
                                                                                <polyline points="20 6 9 17 4 12" />
                                                                            </svg>
                                                                        )}
                                                                    </motion.button>
                                                                ))}
                                                            </motion.div>
                                                        </>
                                                    )}
                                                </AnimatePresence>,
                                                document.body
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                                </AnimatePresence>

                                {/* Generate New Link */}
                                <AnimatePresence>
                                    {inviteLink && (
                                        <motion.button
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                            onClick={() => setInviteLink('')}
                                            style={{
                                                width: '100%', padding: '12px', borderRadius: '10px',
                                                border: `1px solid var(--border-color)`,
                                                background: 'transparent',
                                                color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500,
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 2v6h-6" />
                                                <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                                                <path d="M3 22v-6h6" />
                                                <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                                            </svg>
                                            Generate New Link
                                        </motion.button>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default InviteModal;
