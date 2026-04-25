/**
 * VirtualizedMessageList - Virtualized message list for optimal performance
 * Uses react-virtuoso for efficient rendering of large message lists
 */

import React, { useCallback, useRef, forwardRef } from 'react';
import { Virtuoso, type VirtuosoHandle, type Components } from 'react-virtuoso';
import { AnimatePresence } from 'motion/react';
import type { ChatMessage, MessageType } from '../../../../services/chatService';
import type { MessageReaction, MemberStats, ChatColors } from '../types';
import { MessageItem } from './MessageItem';
import { DateSeparator } from './DateSeparator';
import { shouldShowDateSeparator } from '../utils';

interface ThreadInfo {
    replyCountMap: Record<string, number>;
    uniqueAuthorsMap: Record<string, string[]>;
}

interface MemberLookup {
    memberMap: Record<string, { user_id: string; user_name: string; user_avatar?: string; is_online?: boolean; role: string } | undefined>;
    statsMap: Record<string, MemberStats | undefined>;
}

export interface VirtualizedMessageListProps {
    messages: ChatMessage[];
    currentUserId: string;
    currentUserName: string;
    threadInfo: ThreadInfo;
    memberLookup: MemberLookup;
    messageReactions: Record<string, MessageReaction[]>;
    hoveredMessageId: string | null;
    highlightedMessageId: string | null;
    bookmarkedMessages: Set<string>;
    pinnedMessages: Set<string>;
    editingState: { messageId: string | null; content: string };
    messageClassifications: Record<string, MessageType>;
    helpfulVotes: Record<string, { count: number; voted: boolean }>;
    showReactionsFor: string | null;
    scrollState: { lastReadIndex: number | null; unreadCount: number };
    colors: ChatColors;
    isDarkMode: boolean;
    
    // Callbacks
    onHover: (messageId: string) => void;
    onLeave: () => void;
    onReaction: (messageId: string, emoji: string) => void;
    onToggleReactions: (messageId: string | null) => void;
    onOpenThread: (message: ChatMessage) => void;
    onToggleBookmark: (messageId: string) => void;
    onTogglePin: (messageId: string) => void;
    onEdit: (message: ChatMessage) => void;
    onDelete: (messageId: string) => void;
    onToggleHelpful: (messageId: string) => void;
    onSetEditingContent: (content: string) => void;
    onSaveEdit: () => void;
    onCancelEdit: () => void;
    
    // Scroll callbacks
    onScrollToBottom: () => void;
    onAtBottomChange: (atBottom: boolean) => void;
}

// Custom scroll container to match existing styles
const ScrollContainer = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ children, ...props }, ref) => (
        <div
            ref={ref}
            {...props}
            style={{
                ...props.style,
                scrollBehavior: 'smooth',
            }}
        />
    )
);
ScrollContainer.displayName = 'ScrollContainer';

export const VirtualizedMessageList = forwardRef<VirtuosoHandle, VirtualizedMessageListProps>(
    (props, ref) => {
        const {
            messages,
            currentUserId,
            currentUserName,
            threadInfo,
            memberLookup,
            messageReactions,
            hoveredMessageId,
            highlightedMessageId,
            bookmarkedMessages,
            pinnedMessages,
            editingState,
            messageClassifications,
            helpfulVotes,
            showReactionsFor,
            scrollState,
            colors,
            isDarkMode,
            onHover,
            onLeave,
            onReaction,
            onToggleReactions,
            onOpenThread,
            onToggleBookmark,
            onTogglePin,
            onEdit,
            onDelete,
            onToggleHelpful,
            onSetEditingContent,
            onSaveEdit,
            onCancelEdit,
            onAtBottomChange,
        } = props;

        const listRef = useRef<VirtuosoHandle>(null);

        // Expose the ref
        React.useImperativeHandle(ref, () => listRef.current!, []);

        // Render each message item
        const itemContent = useCallback((index: number) => {
            const message = messages[index];
            const prevMessage = messages[index - 1];
            const nextMessage = messages[index + 1];
            const memberInfo = memberLookup.memberMap[message.user_id];
            const memberStats_user = memberLookup.statsMap[message.user_id];
            
            const replyCount = threadInfo.replyCountMap[message.id] || 0;
            const uniqueAuthors = threadInfo.uniqueAuthorsMap[message.id] || [];
            const showDateSep = shouldShowDateSeparator(message, prevMessage);

            return (
                <div key={message.id}>
                    {showDateSep && (
                        <DateSeparator
                            date={message.created_at}
                            isDarkMode={isDarkMode}
                            textMutedColor={'var(--text-muted)'}
                        />
                    )}
                    <AnimatePresence initial={false}>
                        <MessageItem
                            message={message}
                            prevMessage={prevMessage}
                            nextMessage={nextMessage}
                            currentUserId={currentUserId}
                            currentUserName={currentUserName}
                            memberIsOnline={memberInfo?.is_online ?? false}
                            memberRole={memberInfo?.role as 'owner' | 'admin' | 'member' | undefined}
                            memberLevel={memberStats_user?.level || 1}
                            memberStreak={memberStats_user?.streak || 0}
                            memberStats={memberStats_user}
                            reactions={messageReactions[message.id] || []}
                            isHovered={hoveredMessageId === message.id}
                            isHighlighted={highlightedMessageId === message.id}
                            isBookmarked={bookmarkedMessages.has(message.id)}
                            isPinned={pinnedMessages.has(message.id)}
                            isEditing={editingState.messageId === message.id}
                            editingContent={editingState.content}
                            messageType={messageClassifications[message.id]}
                            helpfulVote={helpfulVotes[message.id]}
                            showReactionsFor={showReactionsFor === message.id}
                            replyCount={replyCount}
                            uniqueAuthors={uniqueAuthors}
                            showUnreadIndicator={scrollState.lastReadIndex !== null && index === scrollState.lastReadIndex && scrollState.unreadCount > 0}
                            unreadCount={scrollState.unreadCount}
                            colors={colors}
                            isDarkMode={isDarkMode}
                            onHover={onHover}
                            onLeave={onLeave}
                            onReaction={onReaction}
                            onToggleReactions={onToggleReactions}
                            onOpenThread={onOpenThread}
                            onToggleBookmark={onToggleBookmark}
                            onTogglePin={onTogglePin}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onToggleHelpful={onToggleHelpful}
                            onSetEditingContent={onSetEditingContent}
                            onSaveEdit={onSaveEdit}
                            onCancelEdit={onCancelEdit}
                        />
                    </AnimatePresence>
                </div>
            );
        }, [
            messages,
            currentUserId,
            currentUserName,
            threadInfo,
            memberLookup,
            messageReactions,
            hoveredMessageId,
            highlightedMessageId,
            bookmarkedMessages,
            pinnedMessages,
            editingState,
            messageClassifications,
            helpfulVotes,
            showReactionsFor,
            scrollState,
            colors,
            isDarkMode,
            onHover,
            onLeave,
            onReaction,
            onToggleReactions,
            onOpenThread,
            onToggleBookmark,
            onTogglePin,
            onEdit,
            onDelete,
            onToggleHelpful,
            onSetEditingContent,
            onSaveEdit,
            onCancelEdit,
        ]);

        // Custom components for Virtuoso
        const virtuosoComponents: Components<ChatMessage> = {
            Scroller: ScrollContainer,
            Item: (props) => (
                <div {...props} style={{ ...props.style, padding: '0 20px' }}>
                    {props.children}
                </div>
            ),
            Header: () => <div style={{ height: 20 }} />,
            Footer: () => <div style={{ height: 20 }} />,
        };

        return (
            <Virtuoso
                ref={listRef}
                data={messages}
                itemContent={itemContent}
                initialTopMostItemIndex={messages.length - 1}
                followOutput="smooth"
                atBottomStateChange={onAtBottomChange}
                overscan={200}
                style={{
                    height: '100%',
                    width: '100%',
                }}
                components={virtuosoComponents}
            />
        );
    }
);

VirtualizedMessageList.displayName = 'VirtualizedMessageList';
