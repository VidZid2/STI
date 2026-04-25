/**
 * GroupDetailModal
 * Extracted from GroupsContent.tsx during Phase 1.2
 * Shows group details, member list, and join/leave/chat actions.
 * Rendered via createPortal to escape stacking context.
 */
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { useModalAccessibility } from '../../../hooks/useModalAccessibility';
import {
    groupCategoryConfig,
    getRoleInfo,
    formatLastActive,
    type GroupWithMembers } from '../../../../../services/groupsService';
import GroupIcon from '../components/GroupIcon';

interface GroupDetailModalProps {
    group: GroupWithMembers | null;
    isOpen: boolean;
    onClose: () => void;
    onJoin: (groupId: string) => void;
    onLeave: (groupId: string) => void;
    onOpenChat: (groupId: string) => void;
}

const GroupDetailModal: React.FC<GroupDetailModalProps> = ({
    group, isOpen, onClose, onJoin, onLeave, onOpenChat
}) => {
    const { modalRef, modalProps } = useModalAccessibility(isOpen, onClose, 'group-detail-title');

    const = {
        bg: 'var(--bg-primary)',
        cardBg: 'var(--bg-secondary)',
        border: 'var(--border-light)',
        textPrimary: 'var(--text-primary)',
        textSecondary: 'var(--text-secondary)',
        textMuted: 'var(--text-muted)' };

    if (!group) return null;

    const categoryConfig = groupCategoryConfig[group.category];

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }} onClick={onClose}
                        style={{
                            position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)',
                            backdropFilter: 'blur(4px)', zIndex: 9998 }}
                    />
                    <div
                        ref={modalRef}
                        {...modalProps}
                        style={{
                            position: 'fixed', inset: 0, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', zIndex: 9999, pointerEvents: 'none', padding: '20px' }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            style={{
                                width: '100%', maxWidth: '520px', maxHeight: '85vh',
                                background: 'var(--bg-primary)', borderRadius: '20px',
                                boxShadow: 'var(--shadow-lg)',
                                overflow: 'hidden', display: 'flex', flexDirection: 'column', pointerEvents: 'auto' }}
                        >
                            {/* Header */}
                            <div style={{
                                padding: '20px 24px',
                                borderBottom: `1px solid var(--border-color)`,
                                background: `linear-gradient(135deg, ${group.color}12 0%, ${group.color}06 50%, transparent 100%)`,
                                borderTop: `3px solid ${group.color}`,
                                borderRadius: '20px 20px 0 0' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '16px' }}>
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                        style={{
                                            width: '52px', height: '52px', borderRadius: '14px',
                                            background: group.avatar ? 'transparent' : `linear-gradient(135deg, ${group.color}20 0%, ${group.color}10 100%)`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0, cursor: 'pointer', boxShadow: `0 4px 12px ${group.color}20`,
                                            overflow: 'hidden' }}
                                    >
                                        {group.avatar ? (
                                            <img src={group.avatar} alt={group.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <GroupIcon icon={group.icon} color={group.color} size={26} />
                                        )}
                                    </motion.div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                {group.name}
                                            </h2>
                                            {group.is_pinned && (
                                                <div style={{
                                                    display: 'flex', alignItems: 'center', gap: '4px',
                                                    padding: '2px 6px', borderRadius: '4px',
                                                    background: 'rgba(245, 158, 11, 0.15)' }}>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="2">
                                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                    </svg>
                                                    <span style={{ fontSize: '10px', fontWeight: 600, color: '#f59e0b' }}>Pinned</span>
                                                </div>
                                            )}
                                            {group.is_private && (
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                </svg>
                                            )}
                                        </div>
                                        <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                            {group.description}
                                        </p>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            <span style={{
                                                padding: '3px 8px', borderRadius: '6px',
                                                background: `${categoryConfig.color}15`, fontSize: '11px',
                                                fontWeight: 500, color: categoryConfig.color }}>
                                                {categoryConfig.label}
                                            </span>
                                            {group.course_name && (
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                    padding: '3px 10px', borderRadius: '6px',
                                                    background: 'rgba(139, 92, 246, 0.1)',
                                                    fontSize: '11px', fontWeight: 500, color: '#8b5cf6' }}>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                                    </svg>
                                                    {group.course_name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={onClose}
                                        style={{
                                            width: '36px', height: '36px', borderRadius: '10px', border: 'none',
                                            background: 'var(--bg-hover)',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', color: 'var(--text-secondary)' }}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                    </motion.button>
                                </div>

                                {/* Stats Row */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                                    style={{
                                        display: 'flex', gap: '12px', padding: '12px 16px', borderRadius: '12px',
                                        background: 'var(--bg-hover)' }}
                                >
                                    <div style={{ flex: 1, textAlign: 'center' }}>
                                        <div style={{ fontSize: '18px', fontWeight: 700, color: '#3b82f6' }}>{group.member_count}</div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Members</div>
                                    </div>
                                    <div style={{ width: '1px', background: 'var(--border-color)' }} />
                                    <div style={{ flex: 1, textAlign: 'center' }}>
                                        <div style={{ fontSize: '18px', fontWeight: 700, color: '#10b981' }}>{group.online_count}</div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Online</div>
                                    </div>
                                    <div style={{ width: '1px', background: 'var(--border-color)' }} />
                                    <div style={{ flex: 1, textAlign: 'center' }}>
                                        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{group.max_members}</div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Max</div>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Members List */}
                            <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px' }}>
                                <h3 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                    Members ({group.member_count})
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {group.members.map((member, index) => (
                                        <motion.div
                                            key={member.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '12px',
                                                padding: '10px 12px', borderRadius: '10px',
                                                background: 'var(--bg-hover)' }}
                                        >
                                            <div style={{ position: 'relative' }}>
                                                <div style={{
                                                    width: 36, height: 36, borderRadius: '10px',
                                                    background: `linear-gradient(135deg, ${getRoleInfo(member.role).color}20 0%, ${getRoleInfo(member.role).color}10 100%)`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '14px', fontWeight: 600, color: getRoleInfo(member.role).color }}>
                                                    {member.user_name.charAt(0).toUpperCase()}
                                                </div>
                                                {member.is_online && (
                                                    <div style={{
                                                        position: 'absolute', bottom: -2, right: -2, width: 10, height: 10,
                                                        borderRadius: '50%', background: '#22c55e',
                                                        border: `2px solid ${'var(--bg-primary)'}`,
                                                        boxShadow: '0 0 6px rgba(34, 197, 94, 0.5)' }} />
                                                )}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                                                    {member.user_name}
                                                </div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                    {member.is_online ? 'Online' : formatLastActive(member.last_active)}
                                                </div>
                                            </div>
                                            <span style={{
                                                padding: '3px 8px', borderRadius: '6px',
                                                background: `${getRoleInfo(member.role).color}15`,
                                                fontSize: '10px', fontWeight: 600, color: getRoleInfo(member.role).color }}>
                                                {getRoleInfo(member.role).label}
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div style={{
                                padding: '16px 24px', borderTop: `1px solid var(--border-color)`,
                                display: 'flex', gap: '12px' }}>
                                {group.is_member ? (
                                    <>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                            onClick={() => { onLeave(group.id); onClose(); }}
                                            style={{
                                                flex: 1, padding: '12px', borderRadius: '10px',
                                                border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.1)',
                                                color: '#ef4444', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                                        >
                                            Leave Group
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.02, boxShadow: '0 6px 20px rgba(59, 130, 246, 0.25)' }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => { onOpenChat(group.id); onClose(); }}
                                            style={{
                                                flex: 2, padding: '12px', borderRadius: '10px',
                                                background: 'rgba(59, 130, 246, 0.1)',
                                                border: `1px solid ${'rgba(59, 130, 246, 0.1)'}`,
                                                color: '#3b82f6', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                            </svg>
                                            Open Chat
                                        </motion.button>
                                    </>
                                ) : (
                                    <motion.button
                                        whileHover={{ scale: 1.02, boxShadow: '0 6px 20px rgba(16, 185, 129, 0.25)' }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => { onJoin(group.id); onClose(); }}
                                        style={{
                                            flex: 1, padding: '12px', borderRadius: '10px',
                                            background: 'rgba(16, 185, 129, 0.1)',
                                            border: `1px solid ${'rgba(16, 185, 129, 0.1)'}`,
                                            color: '#10b981', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                            <line x1="19" y1="8" x2="19" y2="14" />
                                            <line x1="22" y1="11" x2="16" y2="11" />
                                        </svg>
                                        Join Group
                                    </motion.button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default GroupDetailModal;
