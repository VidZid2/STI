/**
 * SmallTypeIcon Component
 * Small inline SVG icon for grouped list items
 */

import React from 'react';

interface SmallTypeIconProps {
    title: string;
}

export const SmallTypeIcon: React.FC<SmallTypeIconProps> = ({ title }) => {
    const iconColor = '#71717a';

    // Assignment icon - clipboard with lines
    if (title.includes('Assignment')) {
        return (
            <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke={iconColor} strokeWidth={1.5} strokeLinecap="round" />
                <rect x="9" y="3" width="6" height="4" rx="1" stroke={iconColor} strokeWidth={1.5} />
                <path d="M9 12h6M9 16h4" stroke={iconColor} strokeWidth={1.5} strokeLinecap="round" />
            </svg>
        );
    }

    // Quiz icon - clipboard with checkmark
    if (title.includes('Quiz')) {
        return (
            <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke={iconColor} strokeWidth={1.5} strokeLinecap="round" />
                <rect x="9" y="3" width="6" height="4" rx="1" stroke={iconColor} strokeWidth={1.5} />
                <path d="M9 14l2 2 4-4" stroke={iconColor} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        );
    }

    // Performance Task icon - bar chart
    if (title.includes('Performance')) {
        return (
            <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
                <rect x="4" y="13" width="4" height="7" rx="1" stroke={iconColor} strokeWidth={1.5} />
                <rect x="10" y="9" width="4" height="11" rx="1" stroke={iconColor} strokeWidth={1.5} />
                <rect x="16" y="4" width="4" height="16" rx="1" stroke={iconColor} strokeWidth={1.5} />
            </svg>
        );
    }

    // Default - bell icon
    return (
        <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={iconColor} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M13.73 21a2 2 0 01-3.46 0" stroke={iconColor} strokeWidth={1.5} strokeLinecap="round" />
        </svg>
    );
};

export default SmallTypeIcon;
