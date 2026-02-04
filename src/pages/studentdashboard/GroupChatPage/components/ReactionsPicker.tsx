/**
 * ReactionsPicker Component
 * Popup that shows study reaction emojis when hovering over a message
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { STUDY_REACTIONS } from '../constants';
import { Tooltip } from './Tooltip';
import type { ChatColors } from '../types';

interface ReactionsPickerProps {
    messageId: string;
    isVisible: boolean;
    isOwn: boolean;
    colors: ChatColors;
    onReactionSelect: (messageId: string, emoji: string) => void;
}

export const ReactionsPicker: React.FC<ReactionsPickerProps> = ({
    messageId,
    isVisible,
    isOwn,
    colors,
    onReactionSelect,
}) => {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    style={{
                        position: 'absolute',
                        top: -44,
                        [isOwn ? 'right' : 'left']: 0,
                        display: 'flex',
                        gap: '4px',
                        background: colors.cardBg,
                        borderRadius: '12px',
                        padding: '6px 8px',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                        border: `1px solid ${colors.border}`,
                        zIndex: 10,
                    }}
                >
                    {STUDY_REACTIONS.map((reaction) => (
                        <Tooltip key={reaction.emoji} text={reaction.label} placement="above">
                            <motion.button
                                whileHover={{ scale: 1.2, y: -2 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => onReactionSelect(messageId, reaction.emoji)}
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    fontSize: '18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                {reaction.emoji}
                            </motion.button>
                        </Tooltip>
                    ))}
                </motion.div>
            )}
        </AnimatePresence>
    );
};
