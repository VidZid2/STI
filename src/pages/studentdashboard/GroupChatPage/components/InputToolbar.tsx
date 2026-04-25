/**
 * InputToolbar Component
 * Action buttons for the chat input area (Study Tools, Attach, Emoji, GIF, Voice, Send)
 */

import React from 'react';
import { motion } from 'motion/react';
import { Tooltip } from './Tooltip';

// Left side buttons (before textarea)
export const InputToolbarLeft: React.FC<{
    onStudyToolsClick: () => void;
    onAttachClick?: () => void;
}> = ({ onStudyToolsClick, onAttachClick }) => {
    return (
        <>
            <Tooltip text="Study Tools" placement="above">
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onStudyToolsClick}
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: '8px',
                        border: '1.5px solid #3b82f6',
                        background: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#3b82f6',
                        flexShrink: 0,
                        boxShadow: '0 1px 3px rgba(59, 130, 246, 0.15)' }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                </motion.button>
            </Tooltip>

            <Tooltip text="Attach File" placement="above">
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onAttachClick}
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: '8px',
                        border: '1.5px solid #22c55e',
                        background: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#22c55e',
                        flexShrink: 0,
                        boxShadow: '0 1px 3px rgba(34, 197, 94, 0.15)' }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                </motion.button>
            </Tooltip>
        </>
    );
};

// Right side buttons (after textarea)
export const InputToolbarRight: React.FC<{
    showEmojiPicker: boolean;
    showGifPicker: boolean;
    isSending: boolean;
    hasMessage: boolean;
    hasAttachments?: boolean;
    gifButtonRef: React.RefObject<HTMLButtonElement | null>;
    onEmojiToggle: () => void;
    onGifToggle: () => void;
    onVoiceNoteClick: () => void;
    onSend: () => void;
}> = ({
    isSending,
    hasMessage,
    hasAttachments = false,
    gifButtonRef,
    onEmojiToggle,
    onGifToggle,
    onVoiceNoteClick,
    onSend }) => {
    const canSend = hasMessage || hasAttachments;
    return (
        <>
            <Tooltip text="Add Emoji" placement="above">
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onEmojiToggle}
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: '8px',
                        border: '1.5px solid #3b82f6',
                        background: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 1px 3px rgba(59, 130, 246, 0.15)' }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                        <line x1="9" y1="9" x2="9.01" y2="9" />
                        <line x1="15" y1="9" x2="15.01" y2="9" />
                    </svg>
                </motion.button>
            </Tooltip>

            <Tooltip text="Add GIF" placement="above">
                <motion.button
                    ref={gifButtonRef}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onGifToggle}
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: '8px',
                        border: '1.5px solid #f59e0b',
                        background: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 1px 3px rgba(245, 158, 11, 0.15)' }}
                >
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#f59e0b' }}>GIF</span>
                </motion.button>
            </Tooltip>

            <Tooltip text="Voice Note" placement="above">
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onVoiceNoteClick}
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: '8px',
                        border: '1.5px solid #8b5cf6',
                        background: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 1px 3px rgba(139, 92, 246, 0.15)' }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="23" />
                        <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                </motion.button>
            </Tooltip>

            <Tooltip text={canSend ? 'Send Message' : 'Type a message first'} placement="above">
                <motion.button
                    data-send-button
                    whileHover={canSend ? { scale: 1.05, boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' } : {}}
                    whileTap={canSend ? { scale: 0.95 } : {}}
                    onClick={onSend}
                    disabled={!canSend || isSending}
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: '8px',
                        border: canSend ? '1.5px solid #3b82f6' : '1.5px solid #d1d5db',
                        background: canSend
                            ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                            : 'white',
                        cursor: canSend ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: canSend ? '#fff' : '#9ca3af',
                        flexShrink: 0,
                        transition: 'all 0.2s ease',
                        boxShadow: canSend ? '0 1px 3px rgba(59, 130, 246, 0.3)' : '0 1px 3px rgba(0,0,0,0.08)' }}
                >
                    {isSending ? (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            style={{
                                width: 14,
                                height: 14,
                                border: '2px solid rgba(255,255,255,0.3)',
                                borderTopColor: '#fff',
                                borderRadius: '50%' }}
                        />
                    ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                    )}
                </motion.button>
            </Tooltip>
        </>
    );
};
