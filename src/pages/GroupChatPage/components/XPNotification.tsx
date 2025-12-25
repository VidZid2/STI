/**
 * XP Notification Component
 * Compact, flat rectangular design - clean and minimalistic
 */

import React from 'react';
import { motion } from 'motion/react';

interface XPNotificationProps {
    amount: number;
    reason: string;
    onComplete: () => void;
}

export const XPNotification: React.FC<XPNotificationProps> = ({ amount, reason, onComplete }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            onAnimationComplete={() => {
                setTimeout(onComplete, 2000);
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{
                position: 'fixed',
                bottom: '90px',
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'center',
                pointerEvents: 'none',
                zIndex: 1000,
            }}
        >
            <div
                style={{
                    background: '#ffffff',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    border: '1px solid rgba(59, 130, 246, 0.12)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    pointerEvents: 'auto',
                }}
            >
                {/* Small Star Icon */}
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
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>

                {/* Text - inline */}
                <span style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#3b82f6',
                }}>
                    +{amount} XP
                </span>

                {/* Separator */}
                <span style={{
                    width: '1px',
                    height: '12px',
                    background: 'rgba(148, 163, 184, 0.3)',
                }} />

                {/* Reason */}
                <span style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#64748b',
                }}>
                    {reason}
                </span>
            </div>
        </motion.div>
    );
};
