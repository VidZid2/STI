/**
 * ReactionsDisplay Component
 * Displays emoji reactions below a message with counts
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { MessageReaction, ChatColors } from '../types';

interface ReactionsDisplayProps {
    reactions: MessageReaction[];
    messageId: string;
    isOwn: boolean;
    currentUserId?: string;
    colors: ChatColors;
    onReactionClick: (messageId: string, emoji: string) => void;
}

export const ReactionsDisplay: React.FC<ReactionsDisplayProps> = ({
    reactions,
    messageId,
    isOwn,
    currentUserId,
    colors,
    onReactionClick,
}) => {
    if (reactions.length === 0) return null;

    return (
        <AnimatePresence initial={false}>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                style={{
                    display: 'flex',
                    gap: '4px',
                    marginTop: '4px',
                    flexWrap: 'wrap',
                    justifyContent: isOwn ? 'flex-end' : 'flex-start',
                }}
            >
                {reactions.map((reaction) => (
                    <motion.button
                        key={reaction.emoji}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        onClick={() => onReactionClick(messageId, reaction.emoji)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            padding: '2px 6px',
                            borderRadius: '10px',
                            border: `1px solid ${colors.border}`,
                            background: currentUserId && reaction.users.includes(currentUserId)
                                ? `${colors.accent}15`
                                : colors.cardBg,
                            cursor: 'pointer',
                            fontSize: '12px',
                        }}
                    >
                        <span>{reaction.emoji}</span>
                        <span style={{ fontSize: '10px', color: colors.textSecondary }}>
                            {reaction.users.length}
                        </span>
                    </motion.button>
                ))}
            </motion.div>
        </AnimatePresence>
    );
};
