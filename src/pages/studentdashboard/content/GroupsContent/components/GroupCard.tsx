/**
 * GroupCard + supporting UI components (TooltipPortal, ActionButtonWithTooltip,
 * PinnedBadgeWithTooltip, MemberAvatarStack)
 * Extracted from GroupsContent.tsx during Phase 8.2
 */
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import {
    groupCategoryConfig,
    getRoleInfo,
    formatLastActive,
    type GroupWithMembers,
} from '../../../../../services/groupsService';
import GroupIcon from './GroupIcon';

// Simple Tooltip Portal Component
const TooltipPortal: React.FC<{
    text: string;
    buttonRect: DOMRect | null;
    iconColor: string;
    }> = ({ text, buttonRect, iconColor }) => {
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

    useEffect(() => {
        // Reset position when buttonRect changes
        setPosition(null);
        
        if (buttonRect) {
            // Use requestAnimationFrame to ensure the tooltip is rendered before measuring
            requestAnimationFrame(() => {
                if (tooltipRef.current) {
                    const tooltipRect = tooltipRef.current.getBoundingClientRect();
                    const buttonCenterX = buttonRect.left + buttonRect.width / 2;
                    setPosition({
                        top: buttonRect.top - tooltipRect.height - 8,
                        left: buttonCenterX - tooltipRect.width / 2,
                    });
                }
            });
        }
    }, [buttonRect]);

    if (!buttonRect) return null;

    return createPortal(
        <div
            ref={tooltipRef}
            style={{
                position: 'fixed',
                top: position?.top ?? -9999,
                left: position?.left ?? -9999,
                padding: '4px 8px',
                borderRadius: '5px',
                background: 'var(--bg-secondary)',
                color: iconColor,
                fontSize: '10px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                zIndex: 99999,
                boxShadow: 'var(--shadow-lg)',
                pointerEvents: 'none',
                opacity: position ? 1 : 0,
                transition: 'opacity 0.1s ease',
            }}
        >
            {text}
            <div style={{
                position: 'absolute',
                bottom: -4,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderTop: `4px solid ${'var(--bg-secondary)'}`,
            }} />
        </div>,
        document.body
    );
};


// Action Button with Tooltip Component
const ActionButtonWithTooltip: React.FC<{
    tooltip: string;
    onClick: (e: React.MouseEvent) => void;
    bgColor: string;
    iconColor: string;
    children: React.ReactNode;
}> = ({ tooltip, onClick, bgColor, iconColor, children }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
        setButtonRect(e.currentTarget.getBoundingClientRect());
        setShowTooltip(true);
    };

    return (
        <>
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={() => { setShowTooltip(false); setButtonRect(null); }}
                onClick={onClick}
                style={{
                    width: 28, height: 28, borderRadius: '8px',
                    background: bgColor, border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: iconColor,
                    transition: 'background 0.2s ease',
                }}
            >
                {children}
            </motion.button>
            {showTooltip && (
                <TooltipPortal
                    text={tooltip}
                    buttonRect={buttonRect}
                    iconColor={iconColor} />
            )}
        </>
    );
};


// Pinned Badge with Tooltip Component
const PinnedBadgeWithTooltip: React.FC<{
    group: GroupWithMembers;
    isHovered: boolean;
    }> = ({ group, isHovered }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const [badgeRect, setBadgeRect] = useState<DOMRect | null>(null);

    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
        setBadgeRect(e.currentTarget.getBoundingClientRect());
        setShowTooltip(true);
    };

    if (!group.is_pinned || isHovered) return null;

    return (
        <>
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={() => { setShowTooltip(false); setBadgeRect(null); }}
                style={{
                    position: 'absolute', top: '10px', right: '10px',
                    padding: '4px 8px', borderRadius: '6px',
                    background: 'rgba(245, 158, 11, 0.1)',
                    display: 'flex', alignItems: 'center', gap: '4px',
                    cursor: 'default',
                }}
            >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span style={{ fontSize: '10px', fontWeight: 600, color: '#f59e0b' }}>Pinned</span>
            </motion.div>
            {showTooltip && (
                <TooltipPortal
                    text="Pinned to top"
                    buttonRect={badgeRect}
                    iconColor="#f59e0b" />
            )}
        </>
    );
};


// Member Avatar Stack Component
const MemberAvatarStack: React.FC<{
    members: { user_name: string; user_avatar?: string; is_online?: boolean }[];
    maxShow?: number;
    size?: number;
    color?: string;
}> = ({ members, maxShow = 4, size = 28, color = '#3b82f6' }) => {
    const visibleMembers = members.slice(0, maxShow);
    const remaining = members.length - maxShow;

    // Generate consistent color from name
    const getAvatarColor = (name: string, baseColor: string) => {
        const colors = [baseColor, '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
        const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center' }}>
            {visibleMembers.map((member, index) => {
                const avatarColor = getAvatarColor(member.user_name, color);
                return (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        style={{
                            position: 'relative',
                            marginLeft: index > 0 ? -8 : 0,
                            zIndex: maxShow - index,
                        }}
                    >
                        <div style={{
                            width: size, height: size, borderRadius: '50%',
                            background: member.user_avatar ? 'transparent' : `linear-gradient(135deg, ${avatarColor} 0%, ${avatarColor}dd 100%)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: size * 0.4, fontWeight: 600, color: 'white',
                            border: '2px solid white',
                            overflow: 'hidden',
                        }}>
                            {member.user_avatar ? (
                                <img src={member.user_avatar} alt={member.user_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                member.user_name.charAt(0).toUpperCase()
                            )}
                        </div>
                        {member.is_online && (
                            <div style={{
                                position: 'absolute', bottom: -2, right: -2, width: 10, height: 10,
                                borderRadius: '50%', background: '#22c55e', border: '2px solid white',
                                boxShadow: '0 0 4px rgba(34, 197, 94, 0.5)',
                            }} />
                        )}
                    </motion.div>
                );
            })}
            {remaining > 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                        width: size, height: size, borderRadius: '50%',
                        background: `${color}15`, display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 600, color: color,
                        border: '2px solid white', marginLeft: -8,
                    }}
                >
                    +{remaining}
                </motion.div>
            )}
        </div>
    );
};


// Group Card Component
const GroupCard: React.FC<{
    group: GroupWithMembers;
    index: number;
    colors: { cardBg: string; border: string; textPrimary: string; textSecondary: string; textMuted: string };
    onClick: (group: GroupWithMembers) => void;
    onJoin: (groupId: string) => void;
    onLeave: (groupId: string) => void;
    onPin: (groupId: string, isPinned: boolean) => void;
    onInvite: (group: GroupWithMembers) => void;
    reducedMotion: boolean;
}> = ({ group, index, colors, onClick, onJoin, onLeave, onPin, onInvite, reducedMotion }) => {
    const [isHovered, setIsHovered] = useState(false);
    const categoryConfig = groupCategoryConfig[group.category];

    return (
        <motion.div
            layout
            layoutId={`group-${group.id}`}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.95 }}
            transition={{ delay: index * 0.03, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            whileHover={reducedMotion ? {} : { y: -3, scale: 1.01 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            onClick={() => onClick(group)}
            className="dashboard-interactive-card"
            tabIndex={0}
            role="button"
            aria-label={`${group.name} — ${group.member_count} members, ${categoryConfig.label}`}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(group); } }}
            style={{
                background: 'var(--dashboard-surface)', borderRadius: '16px',
                border: `1px solid ${isHovered ? `${group.color}40` : 'var(--border-color)'}`,
                padding: '16px', cursor: 'pointer', position: 'relative',
                outline: 'none',
                boxShadow: isHovered 
                    ? `0 12px 32px ${group.color}15`
                    : 'none',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            }}
        >
            {/* Quick Action Buttons on Hover */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                        style={{
                            position: 'absolute', top: '10px', right: '10px',
                            display: 'flex', gap: '6px', zIndex: 10,
                        }}
                    >
                        {/* Chat Button */}
                        <ActionButtonWithTooltip
                            tooltip="Open Chat"
                            onClick={(e) => { e.stopPropagation(); onClick(group); }}
                            bgColor={'rgba(59, 130, 246, 0.1)'}
                            iconColor="#3b82f6" >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                        </ActionButtonWithTooltip>
                        {/* Invite Button */}
                        {group.is_member && (
                            <ActionButtonWithTooltip
                                tooltip="Invite Members"
                                onClick={(e) => { e.stopPropagation(); onInvite(group); }}
                                bgColor={'rgba(16, 185, 129, 0.1)'}
                                iconColor="#10b981" >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <line x1="19" y1="8" x2="19" y2="14" />
                                    <line x1="22" y1="11" x2="16" y2="11" />
                                </svg>
                            </ActionButtonWithTooltip>
                        )}
                        {/* Pin/Unpin Button */}
                        <ActionButtonWithTooltip
                            tooltip={group.is_pinned ? 'Unpin Group' : 'Pin Group'}
                            onClick={(e) => { e.stopPropagation(); onPin(group.id, !group.is_pinned); }}
                            bgColor={group.is_pinned 
                                ? ('rgba(245, 158, 11, 0.1)')
                                : ('var(--bg-hover)')}
                            iconColor={group.is_pinned ? '#f59e0b' : 'var(--text-secondary)'} >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill={group.is_pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                        </ActionButtonWithTooltip>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Pinned Badge (shows when not hovered) */}
            <PinnedBadgeWithTooltip 
                group={group} 
                isHovered={isHovered} />

            {/* Role Badge (shows when not hovered) */}
            {group.is_member && group.user_role && !isHovered && !group.is_pinned && (
                <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{
                        position: 'absolute', top: '10px', right: '10px',
                        padding: '3px 8px', borderRadius: '6px',
                        background: `${getRoleInfo(group.user_role).color}15`,
                        fontSize: '9px', fontWeight: 600, color: getRoleInfo(group.user_role).color,
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                    }}
                >
                    {getRoleInfo(group.user_role).label}
                </motion.div>
            )}
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                <motion.div
                    whileHover={reducedMotion ? {} : { scale: 1.1, rotate: 5 }}
                    style={{
                        width: 44, height: 44, borderRadius: '12px',
                        background: group.avatar ? 'transparent' : `linear-gradient(135deg, ${group.color}20 0%, ${group.color}10 100%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        overflow: 'hidden',
                    }}
                >
                    {group.avatar ? (
                        <img 
                            src={group.avatar} 
                            alt={group.name} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                    ) : (
                        <GroupIcon icon={group.icon} color={group.color} size={22} />
                    )}
                </motion.div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <h3 style={{
                            margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                            {group.name}
                        </h3>
                        {group.is_private && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{
                            fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
                            background: `${categoryConfig.color}15`, color: categoryConfig.color, fontWeight: 500,
                        }}>
                            {categoryConfig.label}
                        </span>
                        {group.course_name && (
                            <span style={{ 
                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                fontSize: '10px', padding: '2px 8px', borderRadius: '4px',
                                background: 'rgba(139, 92, 246, 0.1)', 
                                color: '#8b5cf6', fontWeight: 500,
                            }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                </svg>
                                {group.course_name}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Description */}
            <p style={{
                margin: '0 0 8px 0', fontSize: '12px', color: 'var(--text-secondary)',
                lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
                {group.description}
            </p>

            {/* Activity Status Badges */}
            <div style={{ 
                display: 'flex', alignItems: 'center', gap: '6px', 
                marginBottom: '12px', flexWrap: 'wrap',
            }}>
                {group.unread_messages !== undefined && group.unread_messages > 0 && (
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '3px 8px', borderRadius: '6px',
                        background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', 
                        fontSize: '10px', fontWeight: 600,
                    }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        {group.unread_messages} new
                    </span>
                )}
                {group.online_count > 0 && (
                    <span style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '3px 8px', borderRadius: '6px',
                        background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e',
                        fontSize: '10px', fontWeight: 600,
                    }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                        {group.online_count} active
                    </span>
                )}
                {group.last_activity && (
                    <span style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '3px 8px', borderRadius: '6px',
                        background: 'var(--bg-hover)', 
                        color: 'var(--text-muted)',
                        fontSize: '10px', fontWeight: 500,
                    }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                        {formatLastActive(group.last_activity)}
                    </span>
                )}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {group.members.length > 0 && (
                        <MemberAvatarStack members={group.members} maxShow={4} size={26} color={group.color} />
                    )}
                    <span style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '3px 8px', borderRadius: '6px',
                        background: 'var(--bg-hover)',
                        fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)',
                    }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                        </svg>
                        {group.member_count}/{group.max_members}
                    </span>
                </div>

                {/* Action Button */}
                <AnimatePresence mode="wait">
                    {group.is_member ? (
                        <motion.button
                            key="member"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => { e.stopPropagation(); onLeave(group.id); }}
                            style={{
                                padding: '6px 12px', borderRadius: '8px', border: 'none',
                                background: 'rgba(16, 185, 129, 0.1)', color: '#10b981',
                                fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '4px',
                            }}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                            Joined
                        </motion.button>
                    ) : (
                        <motion.button
                            key="join"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => { e.stopPropagation(); onJoin(group.id); }}
                            style={{
                                padding: '6px 12px', borderRadius: '8px', border: 'none',
                                background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6',
                                fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '4px',
                            }}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="16" />
                                <line x1="8" y1="12" x2="16" y2="12" />
                            </svg>
                            Join
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};


// Group Detail Modal - Extracted to modals/GroupDetailModal.tsx
// GroupDetailModal is imported from './modals/GroupDetailModal'



export { GroupCard, MemberAvatarStack };
