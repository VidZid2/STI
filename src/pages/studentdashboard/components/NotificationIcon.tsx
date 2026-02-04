/**
 * NotificationIcon Component
 * Displays type-specific icons for notifications
 */

import React from 'react';

interface NotificationIconProps {
    type: string;
    title: string;
}

export const NotificationIcon: React.FC<NotificationIconProps> = ({ type, title }) => {
    const iconColor = type === 'warning' ? '#f59e0b' : '#71717a';

    const getIcon = () => {
        // Warning icon - exclamation triangle (yellow)
        if (type === 'warning') {
            return (
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                    <path
                        d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                        stroke={iconColor}
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            );
        }

        // Assignment icon - clipboard with lines
        if (title.includes('Assignment')) {
            return (
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                    <path
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
                        stroke={iconColor}
                        strokeWidth={1.5}
                        strokeLinecap="round"
                    />
                    <rect x="9" y="3" width="6" height="4" rx="1" stroke={iconColor} strokeWidth={1.5} />
                    <path d="M9 12h6M9 16h4" stroke={iconColor} strokeWidth={1.5} strokeLinecap="round" />
                </svg>
            );
        }

        // Quiz icon - clipboard with checkmark
        if (title.includes('Quiz')) {
            return (
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                    <path
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
                        stroke={iconColor}
                        strokeWidth={1.5}
                        strokeLinecap="round"
                    />
                    <rect x="9" y="3" width="6" height="4" rx="1" stroke={iconColor} strokeWidth={1.5} />
                    <path d="M9 14l2 2 4-4" stroke={iconColor} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            );
        }

        // Performance Task icon - bar chart
        if (title.includes('Performance')) {
            return (
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                    <rect x="4" y="13" width="4" height="7" rx="1" stroke={iconColor} strokeWidth={1.5} />
                    <rect x="10" y="9" width="4" height="11" rx="1" stroke={iconColor} strokeWidth={1.5} />
                    <rect x="16" y="4" width="4" height="16" rx="1" stroke={iconColor} strokeWidth={1.5} />
                </svg>
            );
        }

        // Default - bell icon for announcements
        return (
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                <path
                    d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"
                    stroke={iconColor}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path d="M13.73 21a2 2 0 01-3.46 0" stroke={iconColor} strokeWidth={1.5} strokeLinecap="round" />
            </svg>
        );
    };

    return (
        <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center">
            {getIcon()}
        </div>
    );
};

export default NotificationIcon;
