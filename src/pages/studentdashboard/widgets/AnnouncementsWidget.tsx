import * as React from 'react';
import { motion } from 'motion/react';

interface AnnouncementsWidgetProps {
    compactMode: boolean;
    onClose: () => void;
}

export const AnnouncementsWidget = React.memo<AnnouncementsWidgetProps>(({
    compactMode,
    onClose,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
            className={`bg-white rounded-xl border border-zinc-100/80 overflow-hidden ${compactMode ? 'shadow-none' : 'shadow-sm'}`}
            id="announcements-widget"
        >
            <div className={`flex items-center justify-between ${compactMode ? 'px-3 py-2' : 'px-4 py-3'}`}>
                <div className="flex items-center gap-2">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className={`rounded-lg bg-gradient-to-br from-rose-50 to-rose-100/50 flex items-center justify-center ${compactMode ? 'w-6 h-6' : 'w-8 h-8'}`}
                    >
                        <svg className={`text-rose-500 ${compactMode ? 'w-3 h-3' : 'w-4 h-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                        </svg>
                    </motion.div>
                    <span className={`font-medium text-zinc-700 ${compactMode ? 'text-xs' : 'text-sm'}`}>Announcements</span>
                    <span className={`px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-500 ${compactMode ? 'text-[9px]' : 'text-[10px]'}`}>New</span>
                </div>
                <motion.button
                    whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onClose()}
                    className={`flex items-center justify-center rounded-md text-zinc-300 hover:text-red-400 transition-${compactMode ? 'w-5 h-5' : 'w-6 h-6'}`}
                >
                    <svg className={compactMode ? 'w-3 h-3' : 'w-3.5 h-3.5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </motion.button>
            </div>

            {/* Announcement Content */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="px-3 pb-3"
            >
                {/* Featured Image */}
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: 'tween', duration: 0.2 }}
                    className="relative rounded-lg overflow-hidden mb-3"
                >
                    <img
                        src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=200&fit=crop&crop=center"
                        alt="Revamped eLMS"
                        className={`w-full object-cover ${compactMode ? 'h-20' : 'h-24'}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                        <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white text-[9px] font-medium">
                            Featured
                        </span>
                    </div>
                </motion.div>

                {/* Title & Description */}
                <div className="space-y-1.5">
                    <h4 className={`font-semibold text-zinc-800 leading-tight ${compactMode ? 'text-[11px]' : 'text-xs'}`}>
                        Revamped eLMS for STI
                    </h4>
                    <p className={`text-zinc-500 leading-relaxed ${compactMode ? 'text-[9px]' : 'text-[10px]'}`}>
                        Experience the new and improved learning management system with enhanced features, modern design, and better performance.
                    </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-100">
                    <span className={`text-zinc-400 ${compactMode ? 'text-[8px]' : 'text-[9px]'}`}>
                        Dec 2, 2025
                    </span>
                    <motion.button
                        whileHover={{ scale: 1.02, x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        className={`flex items-center gap-1 text-blue-500 hover:text-blue-600 font-medium transition-${compactMode ? 'text-[9px]' : 'text-[10px]'}`}
                    >
                        Read more
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    );
});

AnnouncementsWidget.displayName = 'AnnouncementsWidget';

export default AnnouncementsWidget;
