import { motion } from 'motion/react';
import { useResponsive } from '../../hooks';

interface GradingFooterProps {
    hasNext: boolean;
    hasPrevious: boolean;
    onNext: () => void;
    onPrevious: () => void;
    onSaveAndNext: () => void;
}

const GradingFooter: React.FC<GradingFooterProps> = ({
    hasNext, hasPrevious, onNext, onPrevious, onSaveAndNext,
}) => {
    const { isMobile } = useResponsive();

    return (
        <div
            className={`flex items-center justify-between border-t border-[var(--border-subtle)] bg-[var(--bg-canvas)] ${isMobile ? 'p-[8px_12px] gap-2' : 'p-[12px_20px] gap-0'}`}
        >
            {/* Prev / Next */}
            <div className={`flex ${isMobile ? 'gap-1' : 'gap-1.5'}`}>
                {([
                    { label: 'Prev', icon: <polyline points="15 18 9 12 15 6" />, enabled: hasPrevious, onClick: onPrevious },
                    { label: 'Next', icon: <polyline points="9 18 15 12 9 6" />, enabled: hasNext, onClick: onNext, iconRight: true },
                ] as const).map(({ label, icon, enabled, onClick, iconRight }) => (
                    <motion.button
                        key={label}
                        whileHover={!isMobile && enabled ? { scale: 1.02 } : undefined}
                        whileTap={{ scale: 0.98 }}
                        onClick={onClick}
                        disabled={!enabled}
                        className="flex items-center"
                        style={{
                            gap: '4px',
                            padding: isMobile ? '6px 10px' : '8px 12px',
                            borderRadius: isMobile ? '6px' : '8px',
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-surface)',
                            color: enabled ? 'var(--text-primary)' : 'var(--text-secondary)',
                            fontSize: isMobile ? '11px' : '12px',
                            fontWeight: 500,
                            cursor: enabled ? 'pointer' : 'not-allowed',
                            opacity: enabled ? 1 : 0.5,
                        }}
                    >
                        {!iconRight && (
                            <svg width={isMobile ? '12' : '14'} height={isMobile ? '12' : '14'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{icon}</svg>
                        )}
                        {!isMobile && label}
                        {iconRight && (
                            <svg width={isMobile ? '12' : '14'} height={isMobile ? '12' : '14'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{icon}</svg>
                        )}
                    </motion.button>
                ))}
            </div>

            {/* Save & Next */}
            <motion.button
                layout
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                transition={{
                    layout: { type: 'spring', stiffness: 400, damping: 30 },
                    default: { duration: 0.15 },
                    opacity: { delay: 0.4, duration: 0.3 },
                    x: { delay: 0.4, duration: 0.3 },
                }}
                whileHover={{ scale: 1.02, boxShadow: '0 6px 20px rgba(16,185,129,0.25)' }}
                whileTap={{ scale: 0.98 }}
                onClick={onSaveAndNext}
                className="flex items-center gap-1.5 p-[8px_12px] bg-[var(--color-success-bg)] text-[var(--color-success)] border border-[rgba(16,185,129,0.2)] rounded-[10px] text-xs font-medium cursor-pointer"
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                {isMobile ? 'Save' : `Save ${hasNext ? '& Next' : ''}`}
            </motion.button>
        </div>
    );
};

export default GradingFooter;
