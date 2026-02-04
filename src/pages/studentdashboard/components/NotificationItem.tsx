/**
 * NotificationItem Component
 * Minimalistic notification item with smooth animations
 */

import React from 'react';
import { motion } from 'motion/react';
import { NotificationIcon } from './NotificationIcon';
import type { NotificationItemProps } from '../types';

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClose }) => {
    const [isHovered, setIsHovered] = React.useState(false);
    const [progress, setProgress] = React.useState(100);

    React.useEffect(() => {
        if (isHovered) return;

        const duration = 5000;
        const intervalTime = 50;
        const decrement = (100 / duration) * intervalTime;

        const timer = setInterval(() => {
            setProgress((prev) => {
                const newProgress = prev - decrement;
                if (newProgress <= 0) {
                    clearInterval(timer);
                    onClose(notification.id);
                    return 0;
                }
                return newProgress;
            });
        }, intervalTime);

        return () => clearInterval(timer);
    }, [notification.id, onClose, isHovered]);

    const getAccentColor = () => {
        switch (notification.type) {
            case 'assignment': return '#3b82f6';
            case 'grade': return '#f59e0b';
            case 'announcement': return '#8b5cf6';
            case 'warning': return '#f59e0b';
            default: return '#71717a';
        }
    };

    const accentColor = getAccentColor();

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20, transition: { duration: 0.15 } }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className="relative bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden cursor-pointer border border-zinc-200/60 dark:border-slate-600/60"
            style={{ transition: 'box-shadow 0.15s ease' }}
        >
            {/* Accent bar on left */}
            <div
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ backgroundColor: accentColor }}
            />

            {/* Content */}
            <div className="flex items-center gap-2.5 pl-4 pr-2.5 py-2.5">
                <NotificationIcon type={notification.type} title={notification.title} />

                <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-100 leading-tight">
                        {notification.title}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug line-clamp-1">
                        {notification.message}
                    </p>
                </div>

                {/* Unread indicator dot */}
                <div
                    className="flex-shrink-0 w-2 h-2 rounded-full"
                    style={{ backgroundColor: notification.type === 'warning' ? '#f59e0b' : '#3b82f6' }}
                />

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose(notification.id);
                    }}
                    className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-slate-700 dark:hover:text-zinc-300 transition-colors"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Progress bar */}
            <div className="h-[2px] bg-zinc-100 dark:bg-slate-700">
                <div
                    className="h-full origin-left"
                    style={{
                        backgroundColor: accentColor,
                        transform: `scaleX(${progress / 100})`,
                        transition: 'transform 0.05s linear'
                    }}
                />
            </div>
        </motion.div>
    );
};

export default NotificationItem;
