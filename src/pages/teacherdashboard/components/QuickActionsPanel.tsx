import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { QUICK_ACTIONS } from '../constants';
import { BoltIcon, getActionIcon } from '../icons';

interface QuickActionsPanelProps {
    isMobile: boolean;
    handleQuickAction: (id: string) => void;
}

function useIsPinkDark() {
    const [isPinkDark, setIsPinkDark] = useState(
        () => document.documentElement.classList.contains('pink-theme') &&
              document.documentElement.classList.contains('dark')
    );
    useEffect(() => {
        const el = document.documentElement;
        const observer = new MutationObserver(() => {
            setIsPinkDark(
                el.classList.contains('pink-theme') && el.classList.contains('dark')
            );
        });
        observer.observe(el, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);
    return isPinkDark;
}

export const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({ 
    isMobile, 
    handleQuickAction 
}) => {
    const isPinkDark = useIsPinkDark();
    // In pink+dark mode all cards glow pink, otherwise use their own color
    const getHoverColor = (original: string) => isPinkDark ? '#ec4899' : original;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="quick-actions-panel mb-8"
        >
            {/* Section Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500"
                         style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.04) 100%)' }}>
                        <BoltIcon size={20} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white m-0">
                            Quick Actions
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 m-0">
                            Common tasks at your fingertips
                        </p>
                    </div>
                </div>
            </div>

            {/* Big 4 Action Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3 md:gap-5">
                {QUICK_ACTIONS.map((action, index) => {
                    const cardColor = action.color;
                    const hoverColor = getHoverColor(cardColor);
                    return (
                        <motion.button
                            key={action.id}
                            className="quick-action-card flex flex-col items-center justify-center gap-3 md:gap-4 p-4 md:p-6 rounded-[16px] cursor-pointer relative overflow-hidden min-h-[120px] md:min-h-[180px]"
                            style={{
                                background: 'var(--bg-surface)',
                                border: '1px solid var(--border-subtle)',
                            }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0, transition: { delay: 0.2 + index * 0.05, duration: 0.3 } }}
                            whileHover={isMobile ? {} : {
                                y: -6,
                                scale: 1.02,
                                boxShadow: `0 20px 40px ${hoverColor}35`,
                                transition: { duration: 0.15, ease: 'easeOut' },
                            }}
                            whileTap={{ scale: 0.98, transition: { duration: 0.08 } }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            onClick={() => handleQuickAction(action.id)}
                            aria-label={`Open ${action.label}`}
                        >
                            <div className="quick-action-bg absolute inset-0 opacity-50" 
                                style={{ background: `linear-gradient(135deg, ${cardColor}08 0%, transparent 60%)` }} 
                            />

                            <motion.div
                                className="quick-action-icon-wrapper flex items-center justify-center relative z-10 w-12 h-12 md:w-16 md:h-16 rounded-[14px]"
                                whileHover={isMobile ? {} : { 
                                    scale: 1.1, 
                                    rotate: 5,
                                    transition: { duration: 0.15, ease: 'easeOut' },
                                }}
                                style={{
                                    background: `linear-gradient(135deg, ${cardColor}15 0%, ${cardColor}08 100%)`,
                                    border: `1px solid ${cardColor}25`,
                                    color: cardColor,
                                }}
                            >
                                {getActionIcon(action.iconType, isMobile ? 22 : 28)}
                            </motion.div>

                            <span 
                                className="text-xs md:text-[15px] font-semibold text-center relative z-10 leading-snug"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                {action.label}
                            </span>
                        </motion.button>
                    );
                })}
            </div>
        </motion.div>
    );
};
