/**
 * GroupChatPage Types
 * Shared type definitions for the group chat feature
 */

// Message Reactions type
export type MessageReaction = {
    emoji: string;
    users: string[];
};

// Reply info type
export type ReplyInfo = {
    messageId: string;
    userName: string;
    content: string;
};

// Gamification types
export type UserBadge = {
    id: string;
    icon: string;
    label: string;
    color: string;
};

export type MemberStats = {
    odId: string;
    odName: string;
    streak: number;
    xp: number;
    level: number;
    badges: UserBadge[];
    messagesCount: number;
    helpfulCount: number;
};

// Thread Reply Type
export interface ThreadReply {
    id: string;
    user_id: string;
    user_name: string;
    user_avatar?: string;
    content: string;
    created_at: string;
    reactions?: Record<string, string[]>;
}

// Study reaction type
export type StudyReaction = {
    emoji: string;
    label: string;
    color: string;
};

// Tool color config type
export type ToolColorConfig = {
    color: string;
    bg: string;
};

// Colors theme type (used across components)
export type ChatColors = {
    bg: string;
    cardBg: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    accent: string;
};
