/**
 * GroupCard + supporting UI components (TooltipPortal, ActionButtonWithTooltip,
 * PinnedBadgeWithTooltip, MemberAvatarStack)
 * Extracted from GroupsContent.tsx during Phase 8.2
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    groupCategoryConfig,
    getRoleInfo,
    formatLastActive,
    type GroupWithMembers,
} from '../../../../../services/groupsService';
import GroupIcon from './GroupIcon';
import { Tooltip, RTooltipProvider } from '../../../../../components/ui/r-tooltip';
import { getProfile, getImages } from '../../../../../services/profileService';
import { getCurrentLevel, getXPProgress } from '../../../../../services/studyTimeService';
import { AnimatedCircularProgressBar } from '../../../../../components/ui/animated-circular-progress-bar';




// Action Button with Tooltip Component
const ActionButtonWithTooltip: React.FC<{
    tooltip: string;
    label: string;
    onClick: (e: React.MouseEvent) => void;
    bgColor: string;
    iconColor: string;
    children: React.ReactNode;
}> = ({ tooltip, label, onClick, bgColor, iconColor, children }) => {
    return (
        <Tooltip
            content={tooltip}
            side="top"
            className="[--tt-surface:#ffffff] dark:[--tt-surface:#1e293b] border border-slate-200 dark:border-slate-700/50 shadow-sm"
            style={{ '--tt-foreground': iconColor } as React.CSSProperties}
        >
            <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClick}
                style={{
                    borderRadius: '14px',
                    background: bgColor, border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: iconColor,
                    transition: 'background 0.2s ease',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                }}
                className="h-[32px] sm:h-[34px] lg:h-[38px] w-auto px-2.5 sm:px-3 gap-1.5 lg:w-[38px] lg:px-0 lg:gap-0 [&>svg]:w-4 [&>svg]:h-4 lg:[&>svg]:w-[18px] lg:[&>svg]:h-[18px]"
            >
                {children}
                <span className="text-[10px] sm:text-[11px] font-bold lg:hidden whitespace-nowrap uppercase tracking-wide">{label}</span>
            </motion.button>
        </Tooltip>
    );
};




// Member Avatar Stack Component
const MemberAvatarStack: React.FC<{
    members: { user_id: string; user_email?: string; role?: string; user_name: string; user_avatar?: string; is_online?: boolean }[];
    maxShow?: number;
    size?: number;
    color?: string;
}> = ({ members, maxShow = 4, size = 28, color = '#3b82f6' }) => {
    // Deduplicate members by user_id
    const uniqueMembers = Array.from(new Map(members.map(m => [m.user_id, m])).values());
    const visibleMembers = uniqueMembers.slice(0, maxShow);
    const remaining = uniqueMembers.length - maxShow;

    const myProfile = getProfile();
    const myImages = getImages();
    const myLevel = getCurrentLevel();
    const myProgress = getXPProgress();

    // Generate consistent color from name
    const getAvatarColor = (name: string, baseColor: string) => {
        const colors = [baseColor, '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
        const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center' }}>
            {visibleMembers.map((member, index) => {
                const isMe = member.user_email === myProfile.email || member.user_name.toLowerCase().includes('deasis');
                const userAvatar = isMe && myImages.profileImage ? myImages.profileImage : member.user_avatar;
                const avatarColor = getAvatarColor(member.user_name, color);
                
                const nameSum = member.user_name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
                const userLevel = isMe ? myLevel : ((nameSum % 10) + 1);
                const userProgress = isMe ? myProgress : ((nameSum % 80) + 10);
                const isOwner = member.role === 'owner';
                const ringColor = userLevel >= 20 ? '#eab308' : (isOwner ? '#f59e0b' : '#3b82f6');
                const badgeBg = userLevel >= 20 ? 'bg-yellow-400 text-blue-800' : (isOwner ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white');
                const badgeBorder = member.is_online ? 'border-emerald-500 dark:border-emerald-400' : (isOwner ? 'border-amber-400 dark:border-amber-600' : 'border-white dark:border-slate-800');

                return (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        style={{
                            position: 'relative',
                            marginLeft: index > 0 ? -12 : 0,
                            zIndex: maxShow - index,
                        }}
                        className="group/avatar transition-transform hover:scale-110 hover:z-50 mb-1.5"
                    >
                        <div style={{ width: size, height: size }} className="relative shrink-0 flex items-center justify-center rounded-full bg-white dark:bg-slate-900 shadow-sm">
                            <AnimatedCircularProgressBar
                                max={100}
                                min={0}
                                value={userProgress}
                                gaugePrimaryColor={ringColor}
                                gaugeSecondaryColor={`${ringColor}20`}
                                className="w-full h-full shrink-0"
                            >
                                <div className="absolute inset-[2.5px] rounded-full flex items-center justify-center overflow-hidden z-10" style={{ background: userAvatar ? 'transparent' : `linear-gradient(135deg, ${avatarColor} 0%, ${avatarColor}dd 100%)`, border: '1.5px solid white' }}>
                                    {userAvatar ? (
                                        <img src={userAvatar} alt={member.user_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span style={{ fontSize: size * 0.4, fontWeight: 600, color: 'white' }}>{member.user_name.charAt(0).toUpperCase()}</span>
                                    )}
                                </div>
                                <div className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 min-w-[26px] h-[14px] px-1 rounded-full flex items-center justify-center text-[7.5px] font-bold tracking-wider shadow-sm border-[2px] transition-colors duration-300 ${badgeBg} ${badgeBorder} z-20`}>
                                    <span className="ml-[0.05em]">{userLevel >= 20 ? 'MAX' : `LV.${userLevel}`}</span>
                                </div>
                            </AnimatedCircularProgressBar>
                        </div>
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
    isDarkMode: boolean;
    onClick: (group: GroupWithMembers) => void;
    onJoin: (groupId: string) => void;
    onLeave: (groupId: string) => void;
    onPin: (groupId: string, isPinned: boolean) => void;
    onInvite: (group: GroupWithMembers) => void;
    reducedMotion: boolean;
    isLoading?: boolean;
}> = ({ group, index, isDarkMode, onClick, onJoin, onLeave, onPin, onInvite, reducedMotion, isLoading }) => {
    const [isHovered, setIsHovered] = useState(false);
    const categoryConfig = groupCategoryConfig[group.category];

    return (
        <motion.div
            layout
            layoutId={`group-${group.id}`}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 15 }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30, delay: index * 0.05 }}
            onHoverStart={() => !isLoading && setIsHovered(true)}
            onHoverEnd={() => !isLoading && setIsHovered(false)}
            onClick={() => !isLoading && onClick(group)}
            className={`group relative flex flex-col overflow-hidden rounded-[24px] border p-5 sm:p-6 lg:p-7 text-left transition-all duration-300 bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800/80 shadow-sm ${isLoading ? 'pointer-events-none' : 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 focus-visible:ring-2'}`}
        >
            {isLoading ? (
                <div className="w-full h-full animate-pulse flex flex-col">
                    <div className="flex items-start gap-3 sm:gap-4 mb-4">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-[12px] sm:rounded-[14px] bg-slate-200/60 dark:bg-slate-700/50" />
                        <div className="flex-1 flex flex-col gap-2 pt-1">
                            <div className="w-3/4 h-3.5 sm:h-4 rounded-md bg-slate-200/60 dark:bg-slate-700/50" />
                            <div className="w-1/2 h-2.5 sm:h-3 rounded-md bg-slate-200/60 dark:bg-slate-700/50" />
                        </div>
                    </div>
                    <div className="w-full h-10 sm:h-12 rounded-xl bg-slate-200/60 dark:bg-slate-700/50 mb-4 mt-2" />
                    <div className="flex items-center gap-2 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/80">
                        <div className="w-16 h-6 rounded-full bg-slate-200/60 dark:bg-slate-700/50" />
                        <div className="w-20 h-6 rounded-full bg-slate-200/60 dark:bg-slate-700/50" />
                    </div>
                </div>
            ) : (
                <>
                    {/* Quick Action Buttons (Always visible on mobile/tablet, hover on desktop) */}
                    <div
                        className={`absolute top-5 right-5 sm:top-6 sm:right-6 flex gap-2.5 z-20 transition-all duration-200 ${
                            isHovered ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-100 translate-y-0 pointer-events-auto lg:opacity-0 lg:-translate-y-1 lg:pointer-events-none'
                        }`}
                    >
                        <RTooltipProvider delayDuration={150}>
                            {/* Workspace Button */}
                            <ActionButtonWithTooltip
                                tooltip="Project Workspace"
                                label="Open"
                                onClick={(e) => { e.stopPropagation(); onClick(group); }}
                                bgColor={isDarkMode ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff'}
                                iconColor="#3b82f6"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                                    <line x1="8" y1="21" x2="16" y2="21" />
                                    <line x1="12" y1="17" x2="12" y2="21" />
                                </svg>
                            </ActionButtonWithTooltip>
                            
                            {/* Invite Button */}
                            {group.is_member && (
                                <ActionButtonWithTooltip
                                    tooltip="Invite Members"
                                    label="Invite"
                                    onClick={(e) => { e.stopPropagation(); onInvite(group); }}
                                    bgColor={isDarkMode ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff'}
                                    iconColor="#3b82f6"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <line x1="19" y1="8" x2="19" y2="14" />
                                        <line x1="22" y1="11" x2="16" y2="11" />
                                    </svg>
                                </ActionButtonWithTooltip>
                            )}

                            {/* Pin/Unpin Button (Stays at Top Right) */}
                            <ActionButtonWithTooltip
                                tooltip={group.is_pinned ? 'Unpin Group' : 'Pin Group'}
                                label={group.is_pinned ? 'Unpin' : 'Pin'}
                                onClick={(e) => { e.stopPropagation(); onPin(group.id, !group.is_pinned); }}
                                bgColor={group.is_pinned 
                                    ? (isDarkMode ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb')
                                    : (isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc')}
                                iconColor={group.is_pinned ? '#f59e0b' : (isDarkMode ? '#94a3b8' : '#64748b')}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill={group.is_pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                            </ActionButtonWithTooltip>
                        </RTooltipProvider>
                    </div>

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5 mb-5 relative z-10">
                <motion.div
                    whileHover={reducedMotion ? {} : { scale: 1.05, rotate: -5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] flex items-center justify-center flex-shrink-0 relative transition-all duration-300 ${
                        group.is_pinned 
                            ? 'ring-[2.5px] ring-amber-400 dark:ring-amber-500' 
                            : 'shadow-sm'
                    }`}
                    style={{
                        background: group.avatar ? 'transparent' : `linear-gradient(135deg, ${group.color}15 0%, ${group.color}05 100%)`,
                        border: group.is_pinned ? 'none' : `1px solid ${group.color}30`
                    }}
                >
                    {/* Floating Pinned Star on Avatar */}
                    {group.is_pinned && (
                        <div className="absolute -top-2 -right-2 w-[22px] h-[22px] bg-amber-100 dark:bg-amber-900 rounded-full border border-amber-200 dark:border-amber-700 flex items-center justify-center shadow-md z-10 text-amber-500 dark:text-amber-400">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                        </div>
                    )}

                    {group.avatar ? (
                        <img 
                            src={group.avatar} 
                            alt={group.name} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                            className="rounded-[20px]"
                        />
                    ) : (
                        <GroupIcon icon={group.icon} color={group.color} size={30} />
                    )}
                </motion.div>
                <div className="flex-1 min-w-0 flex flex-col justify-center pt-1 sm:pt-2">
                    <div className="flex items-center gap-2 mb-2 sm:mb-2.5">
                        <h3 className="text-lg sm:text-[20px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight truncate pr-16 sm:pr-0">
                            {group.name}
                        </h3>
                        {group.is_private && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" className="flex-shrink-0">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Role Badge (Styled like ADVANCED badge) */}
                        {group.is_member && group.user_role && (
                            <span 
                                className="inline-flex h-[24px] items-center gap-1.5 rounded-full border px-2.5 text-[10.5px] font-bold uppercase leading-none tracking-wide shadow-sm"
                                style={{ 
                                    background: `${getRoleInfo(group.user_role).color}15`, 
                                    color: getRoleInfo(group.user_role).color,
                                    borderColor: `${getRoleInfo(group.user_role).color}40`
                                }}
                            >
                                {getRoleInfo(group.user_role).label}
                            </span>
                        )}
                        
                        {/* Category Badge */}
                        <span 
                            className="inline-flex h-[24px] items-center gap-1.5 rounded-md border px-2.5 text-[10.5px] font-bold uppercase leading-none tracking-wide shadow-sm" 
                            style={{ 
                                background: `${categoryConfig.color}15`, 
                                color: categoryConfig.color,
                                borderColor: `${categoryConfig.color}40`
                            }}
                        >
                            {categoryConfig.label}
                        </span>

                        {/* Course Name */}
                        {group.course_name && (
                            <span className="inline-flex h-[24px] items-center gap-1.5 rounded-md border px-2 text-[10.5px] font-bold uppercase leading-none tracking-wide shadow-sm bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200/50 dark:border-purple-800/50">
                                <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                </svg>
                                <span className="truncate max-w-[120px] sm:max-w-[150px]">{group.course_name}</span>
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Description */}
            <p className="text-[13.5px] sm:text-[14.5px] text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2 mb-5">
                {group.description}
            </p>

            {/* Activity Status Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
                {group.unread_messages !== undefined && group.unread_messages > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[11px] sm:text-[12px] font-bold">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        {group.unread_messages} new
                    </span>
                )}

                {group.last_activity && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 text-[11px] sm:text-[12px] font-bold">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                        {formatLastActive(group.last_activity)}
                    </span>
                )}
            </div>

            {/* Footer */}
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 mt-auto pt-5 border-t border-zinc-100 dark:border-zinc-800/60">
                <div className="flex flex-wrap items-center gap-2">
                    {group.members.length > 0 && (
                        <MemberAvatarStack members={group.members} maxShow={4} size={32} color={group.color} />
                    )}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 text-[12px] font-bold shadow-sm border border-slate-200/50 dark:border-slate-700/50 ml-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => { e.stopPropagation(); onLeave(group.id); }}
                            className="flex items-center justify-center gap-1.5 w-full sm:w-auto px-4 py-2 sm:py-2.5 rounded-[12px] bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-[12px] sm:text-[13px] font-bold transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                            Joined
                        </motion.button>
                    ) : (
                        <motion.button
                            key="public"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => { e.stopPropagation(); onJoin(group.id); }}
                            className="flex items-center justify-center gap-1.5 w-full sm:w-auto px-4 py-2 sm:py-2.5 rounded-[12px] bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[12px] sm:text-[13px] font-bold transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="16" />
                                <line x1="8" y1="12" x2="16" y2="12" />
                            </svg>
                            Join
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
            </>
            )}
        </motion.div>
    );
};


// Group Detail Modal - Extracted to modals/GroupDetailModal.tsx
// GroupDetailModal is imported from './modals/GroupDetailModal'



export { GroupCard, MemberAvatarStack };
