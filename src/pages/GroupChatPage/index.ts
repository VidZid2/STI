/**
 * GroupChatPage Module
 * Re-exports for cleaner imports
 */

// Main component - default export
import GroupChatPage from './GroupChatPage';
export default GroupChatPage;

// Re-export types (named exports only, avoid circular dependencies)
export type {
    MessageReaction,
    ReplyInfo,
    UserBadge,
    MemberStats,
    ThreadReply,
    StudyReaction,
    ToolColorConfig,
    ChatColors,
} from './types';
