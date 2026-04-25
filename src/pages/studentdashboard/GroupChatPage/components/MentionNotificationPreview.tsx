/**
 * MentionNotificationPreview Component
 * Shows who will be notified when sending a message with @mentions
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { MentionUser } from './MentionAutocomplete';

interface MentionNotificationPreviewProps {
    mentionedUsers: MentionUser[];
    isDarkMode: boolean;
}

export const MentionNotificationPreview: React.FC<MentionNotificationPreviewProps> = ({
    mentionedUsers,
    isDarkMode,
}) => {
    return (
        <AnimatePresence>
            {mentionedUsers.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    style={{
                        background: 'rgba(59, 130, 246, 0.08)',
                        borderTop: `1px solid ${'rgba(59, 130, 246, 0.2)'}`,
                        padding: '8px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        overflow: 'hidden',
                    }}
                >
                    {/* Bell Icon */}
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>

                    {/* Notification Text */}
                    <span style={{
                        fontSize: '12px',
                        color: 'var(--bg-hover)',
                        fontWeight: 500,
                    }}>
                        This will notify {mentionedUsers.length === 1
                            ? <strong>{mentionedUsers[0].name}</strong>
                            : <strong>{mentionedUsers.length} people</strong>
                        }
                    </span>

                    {/* User Avatars */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginLeft: 'auto',
                    }}>
                        {mentionedUsers.slice(0, 3).map((user, idx) => (
                            <div
                                key={user.id}
                                style={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: '50%',
                                    background: user.avatar ? 'transparent' : '#3b82f6',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '9px',
                                    fontWeight: 700,
                                    color: '#fff',
                                    border: `2px solid ${'var(--bg-hover)'}`,
                                    marginLeft: idx > 0 ? '-8px' : 0,
                                    overflow: 'hidden',
                                }}
                            >
                                {user.avatar ? (
                                    <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                                )}
                            </div>
                        ))}
                        {mentionedUsers.length > 3 && (
                            <div
                                style={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: '50%',
                                    background: 'var(--bg-hover)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '8px',
                                    fontWeight: 700,
                                    color: '#fff',
                                    border: `2px solid ${'var(--bg-hover)'}`,
                                    marginLeft: '-8px',
                                }}
                            >
                                +{mentionedUsers.length - 3}
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
