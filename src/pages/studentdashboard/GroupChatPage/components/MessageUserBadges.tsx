/**
 * MessageUserBadges Component
 * Displays username with all associated badges (streak, year level, course, role, helper, achievements)
 */

import React from 'react';
import type { UserBadge, MemberStats } from '../types';

interface MessageUserBadgesProps {
    userName: string;
    userStreak: number;
    memberRole?: 'owner' | 'admin' | 'member';
    memberStats?: MemberStats;
    
    
}

export const MessageUserBadges: React.FC<MessageUserBadgesProps> = ({
    userName,
    userStreak,
    memberRole,
    memberStats }) => {
    // Badge icons mapping for achievements
    const badgeIcons: Record<string, { icon: string; label: string }> = {
        'streak-3': { icon: '*', label: '3 Day Streak' },
        'streak-7': { icon: '**', label: '7 Day Streak' },
        'helper': { icon: '💪', label: 'Helper' },
        'super-helper': { icon: '🦸', label: 'Super Helper' },
        'contributor': { icon: '🏆', label: 'Top Contributor' },
        'early-bird': { icon: '🌅', label: 'Early Bird' } };

    const userBadges = memberStats?.badges || [];
    const userAchievements = userBadges
        .filter((badge: UserBadge) => badgeIcons[badge.id])
        .map((badge: UserBadge) => ({
            id: badge.id,
            icon: badgeIcons[badge.id]?.icon || badge.icon,
            label: badgeIcons[badge.id]?.label || badge.label }));

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '5px',
            margin: '0 0 4px 0' }}>
            {/* Username */}
            <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--accent-color)' }}>
                {userName}
            </span>

            {/* Study Streak Badge - only show if user has streak */}
            {userStreak > 0 && (
                <span
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontSize: '9px',
                        color: '#f97316',
                        padding: '2px 5px',
                        borderRadius: '4px',
                        background: 'rgba(249, 115, 22, 0.15)',
                        fontWeight: 500 }}
                    title={`${userStreak} day study streak!`}
                >
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                        <path d="M12 23c-3.866 0-7-3.134-7-7 0-2.5 1.5-4.5 3-6.5s3-4.5 3-7.5c0 3 1.5 5.5 3 7.5s3 4 3 6.5c0 3.866-3.134 7-7 7z" />
                        <path d="M12 23c-1.657 0-3-1.343-3-3 0-1.5 1-2.5 2-3.5s2-2 2-3.5c0 1.5 1 2.5 2 3.5s2 2 2 3.5c0 1.657-1.343 3-3 3z" fill="#fbbf24" />
                    </svg>
                    {userStreak}d
                </span>
            )}

            {/* Year Level Badge */}
            <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '9px',
                color: '#8b5cf6',
                padding: '2px 5px',
                borderRadius: '4px',
                background: 'rgba(139, 92, 246, 0.15)',
                fontWeight: 500 }}>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
                1st Year
            </span>

            {/* Course/Major Badge */}
            <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '9px',
                color: '#059669',
                padding: '2px 5px',
                borderRadius: '4px',
                background: 'rgba(5, 150, 105, 0.15)',
                fontWeight: 500 }}>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                BSIT
            </span>

            {/* Role Badge - show for owners and admins */}
            {(memberRole === 'owner' || memberRole === 'admin') && (
                <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    fontSize: '9px',
                    color: memberRole === 'owner' ? '#f59e0b' : '#8b5cf6',
                    padding: '2px 5px',
                    borderRadius: '4px',
                    background: memberRole === 'owner'
                        ? 'rgba(245, 158, 11, 0.15)'
                        : 'rgba(139, 92, 246, 0.15)',
                    fontWeight: 500 }}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    {memberRole === 'owner' ? 'Owner' : 'Admin'}
                </span>
            )}

            {/* Helper Badge - for students who frequently help others (5+ helpful votes) */}
            {(memberStats?.helpfulCount || 0) >= 5 && (
                <span
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontSize: '9px',
                        color: '#ec4899',
                        padding: '2px 5px',
                        borderRadius: '4px',
                        background: 'rgba(236, 72, 153, 0.15)',
                        fontWeight: 500 }}
                    title={`Helped ${memberStats?.helpfulCount} times`}
                >
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    Helper
                </span>
            )}

            {/* Achievement Badges */}
            {userAchievements.length > 0 && (
                <div style={{ display: 'inline-flex', gap: '2px', marginLeft: '2px' }}>
                    {userAchievements.map((achievement) => (
                        <span
                            key={achievement.id}
                            title={achievement.label}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 16,
                                height: 16,
                                fontSize: '10px',
                                borderRadius: '4px',
                                background: 'rgba(255,255,255,0.08)',
                                cursor: 'default' }}
                        >
                            {achievement.icon}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};
