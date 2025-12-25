/**
 * useGamification Hook
 * Handles XP, streaks, and gamification notifications
 */

import { useState, useCallback, useMemo } from 'react';
import type { ChatMessage } from '../../../services/chatService';
import type { GroupWithMembers } from '../../../services/groupsService';
import type { UserBadge, MemberStats } from '../types';
import { BADGES } from '../constants';
import { calculateLevel } from '../utils';

export interface UseGamificationOptions {
    groupInfo: GroupWithMembers | null;
    messages: ChatMessage[];
    profileId?: string;
}

export interface UseGamificationReturn {
    userXP: number;
    userStreak: number;
    xpNotification: { amount: number; reason: string } | null;
    setXpNotification: React.Dispatch<React.SetStateAction<{ amount: number; reason: string } | null>>;
    showLeaderboard: boolean;
    setShowLeaderboard: React.Dispatch<React.SetStateAction<boolean>>;
    memberStats: MemberStats[];
    awardXP: (amount: number, reason: string) => void;
}

export function useGamification({
    groupInfo,
    messages,
    profileId,
}: UseGamificationOptions): UseGamificationReturn {
    const [userXP, setUserXP] = useState(245);
    const [userStreak] = useState(5);
    const [xpNotification, setXpNotification] = useState<{ amount: number; reason: string } | null>(null);
    const [showLeaderboard, setShowLeaderboard] = useState(false);

    const awardXP = useCallback((amount: number, reason: string) => {
        setUserXP(prev => prev + amount);
        setXpNotification({ amount, reason });
    }, []);

    const memberStats = useMemo<MemberStats[]>(() => {
        if (!groupInfo?.members) return [];
        
        const messageCountByUser: Record<string, number> = {};
        messages.forEach(msg => {
            messageCountByUser[msg.user_id] = (messageCountByUser[msg.user_id] || 0) + 1;
        });
        
        return groupInfo.members.map((member, index) => {
            const msgCount = messageCountByUser[member.user_id] || 0;
            const isCurrentUser = member.user_id === profileId;
            const xp = msgCount * 10;
            const level = calculateLevel(xp);
            
            const badges: UserBadge[] = [];
            if (msgCount >= 50) badges.push(BADGES.contributor);
            if (msgCount >= 20) badges.push(BADGES.helper);
            if (index === 0) badges.push(BADGES.earlyBird);
            
            return {
                odId: member.user_id,
                odName: isCurrentUser ? 'You' : member.user_name,
                streak: Math.floor(msgCount / 5),
                xp,
                level,
                badges,
                messagesCount: msgCount,
                helpfulCount: Math.floor(msgCount / 4),
            };
        }).sort((a, b) => b.xp - a.xp);
    }, [groupInfo?.members, messages, profileId]);

    return {
        userXP,
        userStreak,
        xpNotification,
        setXpNotification,
        showLeaderboard,
        setShowLeaderboard,
        memberStats,
        awardXP,
    };
}
