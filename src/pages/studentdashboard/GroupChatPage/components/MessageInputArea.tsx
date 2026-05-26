/**
 * MessageInputArea Component
 * The main chat input area with textarea, mentions, and toolbar buttons
 */

import React from 'react';
import { motion } from 'motion/react';
import { MentionAutocomplete, type MentionUser } from './MentionAutocomplete';
import { InputToolbarLeft, InputToolbarRight } from './InputToolbar';
import type { ReplyInfo } from '../types';

interface MessageInputAreaProps {
    // Message state
    newMessage: string;
    replyingTo: ReplyInfo | null;
    hasMentionedUsers: boolean;
    hasAttachments?: boolean;
    
    // Mentions
    mentionUsers: MentionUser[];
    mentionQuery: string;
    isMentionsOpen: boolean;
    
    // UI state
    showEmojiPicker: boolean;
    showGifPicker: boolean;
    isSending: boolean;
    
    
    
    // Refs
    inputRef: React.RefObject<HTMLTextAreaElement | null>;
    gifButtonRef: React.RefObject<HTMLButtonElement | null>;
    
    // Callbacks
    onMessageChange: (value: string) => void;
    onMentionInputChange: (value: string, cursorPosition: number) => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    onMentionSelect: (user: MentionUser) => { newValue: string; newCursorPosition: number };
    onCloseMentions: () => void;
    onStudyToolsClick: () => void;
    onAttachClick: () => void;
    onEmojiToggle: () => void;
    onGifToggle: () => void;
    onVoiceNoteClick: () => void;
    onSend: () => void;
}

export const MessageInputArea: React.FC<MessageInputAreaProps> = ({
    newMessage,
    replyingTo,
    hasMentionedUsers,
    hasAttachments = false,
    mentionUsers,
    mentionQuery,
    isMentionsOpen,
    showEmojiPicker,
    showGifPicker,
    isSending,
    
    
    inputRef,
    gifButtonRef,
    onMessageChange,
    onMentionInputChange,
    onKeyDown,
    onMentionSelect,
    onCloseMentions,
    onStudyToolsClick,
    onAttachClick,
    onEmojiToggle,
    onGifToggle,
    onVoiceNoteClick,
    onSend }) => {
    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            style={{
                background: 'var(--dashboard-surface)',
                borderTop: replyingTo || hasMentionedUsers ? 'none' : `1px solid var(--border-color)`,
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'flex-end',
                gap: '12px' }}
        >
            <div
                style={{
                    flex: 1,
                    background: 'var(--dashboard-surface)',
                    borderRadius: '16px',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    border: `1px solid ${'var(--bg-hover)'}` }}
            >
                <InputToolbarLeft onStudyToolsClick={onStudyToolsClick} onAttachClick={onAttachClick} />

                {/* Divider */}
                <div
                    style={{
                        width: '1px',
                        height: '20px',
                        background: 'var(--bg-hover)',
                        flexShrink: 0 }}
                />

                <div style={{ flex: 1, position: 'relative' }}>
                    <textarea
                        ref={inputRef}
                        value={newMessage}
                        onChange={(e) => {
                            const value = e.target.value;
                            const cursorPosition = e.target.selectionStart || 0;
                            onMessageChange(value);
                            onMentionInputChange(value, cursorPosition);
                        }}
                        onKeyDown={onKeyDown}
                        placeholder="Type a message... Use @ to mention"
                        rows={1}
                        style={{
                            width: '100%',
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--text-primary)',
                            fontSize: '14px',
                            resize: 'none',
                            outline: 'none',
                            fontFamily: 'inherit',
                            maxHeight: '120px' }}
                    />

                    {/* Smart Mentions Autocomplete */}
                    <MentionAutocomplete
                        users={mentionUsers}
                        query={mentionQuery}
                        isOpen={isMentionsOpen}
                        onSelect={(user) => {
                            const { newValue, newCursorPosition } = onMentionSelect(user);
                            onMessageChange(newValue);
                            // Set cursor position after React updates
                            setTimeout(() => {
                                if (inputRef.current) {
                                    inputRef.current.focus();
                                    inputRef.current.setSelectionRange(
                                        newCursorPosition,
                                        newCursorPosition
                                    );
                                }
                            }, 0);
                        }}
                        onClose={onCloseMentions}
                        inputRef={inputRef}
                        
                        messageContext={newMessage}
                    />
                </div>

                <InputToolbarRight
                    showEmojiPicker={showEmojiPicker}
                    showGifPicker={showGifPicker}
                    isSending={isSending}
                    hasMessage={!!newMessage.trim()}
                    hasAttachments={hasAttachments}
                    gifButtonRef={gifButtonRef}
                    onEmojiToggle={onEmojiToggle}
                    onGifToggle={onGifToggle}
                    onVoiceNoteClick={onVoiceNoteClick}
                    onSend={onSend}
                />
            </div>
        </motion.div>
    );
};
