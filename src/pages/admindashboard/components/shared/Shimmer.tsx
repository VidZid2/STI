/**
 * Shimmer — smooth wave skeleton for admin dashboard loading states.
 * Uses a CSS gradient sweep instead of Tailwind's abrupt animate-pulse.
 */

import React from 'react';

// Inject the keyframe once
const STYLE_ID = 'admin-shimmer-keyframes';
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
        @keyframes shimmer-sweep {
            0%   { background-position: -400px 0; }
            100% { background-position: 400px 0; }
        }
        .shimmer-block {
            background: linear-gradient(
                90deg,
                var(--shimmer-base, #f1f5f9) 25%,
                var(--shimmer-highlight, #e2e8f0) 50%,
                var(--shimmer-base, #f1f5f9) 75%
            );
            background-size: 800px 100%;
            animation: shimmer-sweep 1.6s ease-in-out infinite;
            border-radius: 8px;
        }
        .dark .shimmer-block {
            --shimmer-base: #1e293b;
            --shimmer-highlight: #334155;
        }
    `;
    document.head.appendChild(style);
}

interface ShimmerProps {
    className?: string;
    style?: React.CSSProperties;
}

/** A single shimmer block. Pass width/height via className or style. */
export const Shimmer: React.FC<ShimmerProps> = ({ className = '', style }) => (
    <div className={`shimmer-block ${className}`} style={style} />
);

/** Convenience: a shimmer circle */
export const ShimmerCircle: React.FC<{ size?: number; className?: string }> = ({ size = 36, className = '' }) => (
    <div
        className={`shimmer-block shrink-0 ${className}`}
        style={{ width: size, height: size, borderRadius: '50%' }}
    />
);

export default Shimmer;
