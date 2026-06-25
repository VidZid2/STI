/**
 * NotificationItem Component
 * Minimalistic notification item with smooth animations
 */

import React from 'react';
import { motion } from 'motion/react';
import { NotificationIcon } from './NotificationIcon';
import { Note, type TNoteType } from '../../../components/ui/Note';

export interface NotificationItemProps {
    notification: any;
    onClose: (id: string) => void;
}

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

    const getNoteType = (): TNoteType => {
        switch (notification.type) {
            case 'assignment': return 'default';
            case 'grade': return 'success';
            case 'announcement': return 'violet';
            case 'warning': return 'warning';
            case 'urgent': return 'error';
            case 'danger': return 'alert';
            default: return 'secondary';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20, transition: { duration: 0.15 } }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className="w-full relative shadow-sm mb-2"
        >
            <Note
                type={getNoteType()}
                size="medium"
                className="overflow-hidden relative shadow-none"
                action={
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose(notification.id);
                        }}
                        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-current opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                }
            >
                <div className="flex items-center gap-2.5">
                    <NotificationIcon type={notification.type} title={notification.title} />
                    <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold leading-tight">
                            {notification.title}
                        </p>
                        <p className="text-[11px] mt-0.5 leading-snug line-clamp-1 opacity-80">
                            {notification.message}
                        </p>
                    </div>
                </div>

                {/* Progress bar inside the note at the bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black/5 dark:bg-white/5">
                    <div
                        className="h-full origin-left bg-current opacity-50"
                        style={{
                            transform: `scaleX(${progress / 100})`,
                            transition: 'transform 0.05s linear'
                        }}
                    />
                </div>
            </Note>
        </motion.div>
    );
};

export default NotificationItem;
