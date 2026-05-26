/**
 * MessageItem - Memoized message component for optimal performance
 * This component is wrapped with React.memo to prevent unnecessary re-renders
 */

import React, { memo, useCallback } from 'react';
import { motion } from 'motion/react';
import type { ChatMessage, MessageType } from '../../../../services/chatService';
import type { MessageReaction, MemberStats } from '../types';
import { formatTime, shouldShowDateSeparator } from '../utils';
import {
    MessageAvatar,
    MessageUserBadges,
    MessageTypeIndicator,
    MessageEditForm,
    MessageContent,
    GifDisplay,
    MessageAttachments,
    MessageHoverActions,
    ReactionsDisplay,
    ThreadIndicator,
    ReactionsPicker,
    DateSeparator,
    UnreadIndicator } from './index';

export interface MessageItemProps {
    // Message data
    message: ChatMessage;
    
    // Adjacent messages for grouping
    prevMessage: ChatMessage | undefined;
    nextMessage: ChatMessage | undefined;
    
    // User context
    currentUserId: string;
    currentUserName: string;
    
    // Member info
    memberIsOnline: boolean;
    memberRole: 'owner' | 'admin' | 'member' | undefined;
    memberLevel: number;
    memberStreak: number;
    memberStats: MemberStats | undefined;
    
    // Message state
    reactions: MessageReaction[];
    isHovered: boolean;
    isHighlighted: boolean;
    isBookmarked: boolean;
    isPinned: boolean;
    isEditing: boolean;
    editingContent: string;
    messageType: MessageType | undefined;
    helpfulVote: { count: number; voted: boolean } | undefined;
    showReactionsFor: boolean;
    
    // Thread info
    replyCount: number;
    uniqueAuthors: string[];
    
    // Unread indicator
    showUnreadIndicator: boolean;
    unreadCount: number;
    
    // Theme
    
    
    
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
}

const MessageItemComponent: React.FC<MessageItemProps> = ({
    message,
    prevMessage,
    nextMessage,
    currentUserId,
    currentUserName,
    memberIsOnline,
    memberRole,
    memberLevel,
    memberStreak,
    memberStats,
    reactions,
    isHovered,
    isHighlighted,
    isBookmarked,
    isPinned,
    isEditing,
    editingContent,
    messageType,
    helpfulVote,
    showReactionsFor,
    replyCount,
    uniqueAuthors,
    showUnreadIndicator,
    unreadCount,
    
    
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
    onCancelEdit }) => {
    const isOwn = message.user_id === currentUserId;
    const showDateSeparator = shouldShowDateSeparator(message, prevMessage);
    const isFirstInGroup = !prevMessage || prevMessage.user_id !== message.user_id || showDateSeparator;
    const isLastInGroup = !nextMessage || nextMessage.user_id !== message.user_id || 
        (nextMessage && shouldShowDateSeparator(nextMessage, message));
    const showAvatar = isFirstInGroup;
    const showUserName = isFirstInGroup && !isOwn;
    const marginTop = isFirstInGroup ? 12 : 2;

    // Calculate border radius based on grouping
    const borderRadius = (() => {
        if (isOwn) {
            if (isFirstInGroup && isLastInGroup) return '16px 16px 4px 16px';
            if (isFirstInGroup) return '16px 16px 4px 16px';
            if (isLastInGroup) return '16px 4px 4px 16px';
            return '16px 4px 4px 16px';
        } else {
            if (isFirstInGroup && isLastInGroup) return '16px 16px 16px 4px';
            if (isFirstInGroup) return '16px 16px 16px 4px';
            if (isLastInGroup) return '4px 16px 16px 4px';
            return '4px 16px 16px 4px';
        }
    })();

    // Memoized handlers
    const handleMouseEnter = useCallback(() => onHover(message.id), [onHover, message.id]);
    const handleMouseLeave = useCallback(() => onLeave(), [onLeave]);
    const handleToggleReactions = useCallback(() => {
        onToggleReactions(showReactionsFor ? null : message.id);
    }, [onToggleReactions, showReactionsFor, message.id]);
    const handleOpenThread = useCallback(() => onOpenThread(message), [onOpenThread, message]);
    const handleToggleBookmark = useCallback(() => onToggleBookmark(message.id), [onToggleBookmark, message.id]);
    const handleTogglePin = useCallback(() => onTogglePin(message.id), [onTogglePin, message.id]);
    const handleEdit = useCallback(() => onEdit(message), [onEdit, message]);
    const handleDelete = useCallback(() => onDelete(message.id), [onDelete, message.id]);
    const handleToggleHelpful = useCallback(() => onToggleHelpful(message.id), [onToggleHelpful, message.id]);

    return (
        <React.Fragment>
            {/* Date Separator */}
            {showDateSeparator && (
                <DateSeparator
                    date={message.created_at}
                    
                    textMutedColor={'var(--text-muted)'}
                />
            )}
            
            {/* Unread Indicator */}
            {showUnreadIndicator && (
                <UnreadIndicator
                    unreadCount={unreadCount}
                    
                />
            )}
            
            {/* Message */}
            <motion.div
                id={`message-${message.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{
                    opacity: 1,
                    y: 0,
                    boxShadow: isHighlighted
                        ? `0 0 0 2px var(--accent-color), 0 4px 20px var(--accent-color)30`
                        : 'none' }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
                transition={{ 
                    type: 'spring', 
                    stiffness: 500, 
                    damping: 30,
                    mass: 0.8 }}
                layout="position"
                style={{
                    display: 'flex',
                    flexDirection: isOwn ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                    gap: '8px',
                    position: 'relative',
                    marginTop,
                    borderRadius: '12px',
                    padding: isHighlighted ? '4px' : '0',
                    margin: isHighlighted ? '-4px' : '0' }}
            >
                {/* Avatar */}
                {!isOwn && (
                    <MessageAvatar
                        userAvatar={message.user_avatar}
                        userName={message.user_name}
                        userLevel={memberLevel}
                        isOnline={memberIsOnline}
                        showAvatar={showAvatar}
                        
                        
                    />
                )}

                <div style={{ maxWidth: '70%', width: 'fit-content', position: 'relative' }}>
                    {/* Message Bubble */}
                    <div
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        style={{
                            padding: '10px 14px',
                            borderRadius,
                            background: isOwn
                                ? `linear-gradient(135deg, var(--accent-color) 0%, #2563eb 100%)`
                                : 'var(--dashboard-surface)',
                            color: isOwn ? '#fff' : 'var(--text-primary)',
                            boxShadow: isOwn
                                ? `0 2px 8px var(--accent-color)30`
                                : `0 1px 3px var(--border-color)`,
                            cursor: 'default',
                            position: 'relative',
                            border: isPinned
                                ? '2px solid #ef4444'
                                : (isBookmarked ? `2px solid var(--accent-color)` : 'none') }}
                    >
                        {/* Bookmark Indicator */}
                        {isBookmarked && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: -1,
                                    right: 8,
                                    color: 'var(--accent-color)' }}
                                title="Bookmarked"
                            >
                                <svg width="12" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
                                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                                </svg>
                            </div>
                        )}

                        {showUserName && (
                            <MessageUserBadges
                                userName={message.user_name}
                                userStreak={memberStreak}
                                memberRole={memberRole}
                                memberStats={memberStats}
                                
                                
                            />
                        )}

                        <MessageTypeIndicator
                            messageType={messageType}
                            isOwn={isOwn}
                        />

                        {isEditing ? (
                            <MessageEditForm
                                editingContent={editingContent}
                                setEditingContent={onSetEditingContent}
                                onSave={onSaveEdit}
                                onCancel={onCancelEdit}
                                isOwn={isOwn}
                                
                                
                            />
                        ) : (
                            !message.content.startsWith('[GIF]') && (
                                <MessageContent
                                    content={message.content}
                                    isOwn={isOwn}
                                    
                                    currentUserName={currentUserName}
                                />
                            )
                        )}

                        {message.content.startsWith('[GIF]') && (
                            <GifDisplay content={message.content} />
                        )}

                        <MessageAttachments
                            messageId={message.id}
                            content={message.content}
                            attachments={message.attachments}
                            isOwn={isOwn}
                            
                            
                        />

                        <MessageHoverActions
                            message={message}
                            isOwn={isOwn}
                            isHovered={isHovered}
                            
                            
                            formattedTime={formatTime(message.created_at)}
                            isBookmarked={isBookmarked}
                            isPinned={isPinned}
                            helpfulVote={helpfulVote}
                            showReactionsFor={showReactionsFor ? message.id : null}
                            onToggleReactions={handleToggleReactions}
                            onOpenThread={handleOpenThread}
                            onToggleBookmark={handleToggleBookmark}
                            onTogglePin={handleTogglePin}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onToggleHelpful={handleToggleHelpful}
                        />
                    </div>

                    <ReactionsDisplay
                        reactions={reactions}
                        messageId={message.id}
                        isOwn={isOwn}
                        currentUserId={currentUserId}
                        
                        onReactionClick={onReaction}
                    />

                    <ThreadIndicator
                        replyCount={replyCount}
                        uniqueAuthors={uniqueAuthors}
                        
                        
                        onClick={handleOpenThread}
                    />

                    <ReactionsPicker
                        messageId={message.id}
                        isVisible={showReactionsFor}
                        isOwn={isOwn}
                        
                        onReactionSelect={onReaction}
                    />
                </div>
            </motion.div>
        </React.Fragment>
    );
};

// Custom comparison function for React.memo
// Only re-render when these specific props change
const arePropsEqual = (prevProps: MessageItemProps, nextProps: MessageItemProps): boolean => {
    // Always re-render if message content changed
    if (prevProps.message.id !== nextProps.message.id) return false;
    if (prevProps.message.content !== nextProps.message.content) return false;
    if (prevProps.message.is_edited !== nextProps.message.is_edited) return false;
    
    // Re-render if grouping might have changed
    if (prevProps.prevMessage?.id !== nextProps.prevMessage?.id) return false;
    if (prevProps.nextMessage?.id !== nextProps.nextMessage?.id) return false;
    
    // Re-render if visual state changed
    if (prevProps.isHovered !== nextProps.isHovered) return false;
    if (prevProps.isHighlighted !== nextProps.isHighlighted) return false;
    if (prevProps.isBookmarked !== nextProps.isBookmarked) return false;
    if (prevProps.isPinned !== nextProps.isPinned) return false;
    if (prevProps.isEditing !== nextProps.isEditing) return false;
    if (prevProps.showReactionsFor !== nextProps.showReactionsFor) return false;
    
    // Re-render if editing content changed (only when editing)
    if (prevProps.isEditing && prevProps.editingContent !== nextProps.editingContent) return false;
    
    // Re-render if reactions changed
    if (prevProps.reactions.length !== nextProps.reactions.length) return false;
    if (prevProps.reactions !== nextProps.reactions) {
        // Deep check reactions
        for (let i = 0; i < prevProps.reactions.length; i++) {
            if (prevProps.reactions[i].emoji !== nextProps.reactions[i].emoji) return false;
            if (prevProps.reactions[i].users.length !== nextProps.reactions[i].users.length) return false;
        }
    }
    
    // Re-render if thread info changed
    if (prevProps.replyCount !== nextProps.replyCount) return false;
    
    // Re-render if helpful vote changed
    if (prevProps.helpfulVote?.count !== nextProps.helpfulVote?.count) return false;
    if (prevProps.helpfulVote?.voted !== nextProps.helpfulVote?.voted) return false;
    
    // Re-render if unread indicator changed
    if (prevProps.showUnreadIndicator !== nextProps.showUnreadIndicator) return false;
    
    // Re-render if member online status changed
    if (prevProps.memberIsOnline !== nextProps.memberIsOnline) return false;
    
    // Theme changes (rare) - Handled via CSS variables now
    
    // Props are equal, don't re-render
    return true;
};

export const MessageItem = memo(MessageItemComponent, arePropsEqual);
MessageItem.displayName = 'MessageItem';
