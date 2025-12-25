/**
 * GroupChatPage Custom Hooks
 * Re-exports for custom hooks
 */

export { useGroupChat } from './useGroupChat';
export type { UseGroupChatOptions, UseGroupChatReturn } from './useGroupChat';

export { useMessageEditing } from './useMessageEditing';
export type { UseMessageEditingOptions, UseMessageEditingReturn } from './useMessageEditing';

export { useGamification } from './useGamification';
export type { UseGamificationOptions, UseGamificationReturn } from './useGamification';

export { useMessageSearch } from './useMessageSearch';
export type { UseMessageSearchReturn } from './useMessageSearch';

export { useScrollBehavior } from './useScrollBehavior';
export type { UseScrollBehaviorOptions, UseScrollBehaviorReturn } from './useScrollBehavior';

export { useMessageReactions } from './useMessageReactions';
export type { UseMessageReactionsOptions, UseMessageReactionsReturn } from './useMessageReactions';

export { useMentions } from './useMentions';
export type { UseMentionsOptions, UseMentionsReturn } from './useMentions';

// Note: useMentions is in .tsx file due to JSX in formatMessageWithMentions
