/**
 * MessageAvatar Component
 * Displays user avatar with level badge and online status indicator
 */

import React from 'react';
import type { ChatColors } from '../types';

interface MessageAvatarProps {
    userAvatar?: string;
    userName: string;
    userLevel: number;
    isOnline: boolean;
    showAvatar: boolean;
    colors: ChatColors;
    isDarkMode: boolean;
}

export const MessageAvatar: React.FC<MessageAvatarProps> = ({
    userAvatar,
    userName,
    userLevel,
    isOnline,
    showAvatar,
    colors,
    isDarkMode,
}) => {
    return (
        <div
            style={{
                position: 'relative',
                flexShrink: 0,
                width: 36,
                height: 36,
                visibility: showAvatar ? 'visible' : 'hidden',
            }}
            title={`Level ${userLevel}`}
        >
            {/* Avatar Circle */}
            <div
                style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${colors.accent}30 0%, ${colors.accent}10 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: colors.accent,
                    overflow: 'hidden',
                    border: `2px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
                }}
            >
                {userAvatar ? (
                    <img
                        src={userAvatar}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                    />
                ) : (
                    userName.charAt(0).toUpperCase()
                )}
            </div>
            {/* Level Badge - Blue minimalistic */}
            <div style={{
                position: 'absolute',
                bottom: -5,
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#3b82f6',
                color: 'white',
                fontSize: '9px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '8px',
                border: `2px solid ${colors.cardBg}`,
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            }}>
                Lv.{userLevel}
            </div>
            {/* Online Status Dot */}
            <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: isOnline ? '#22c55e' : '#9ca3af',
                border: `2px solid ${colors.cardBg}`,
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            }} />
        </div>
    );
};
