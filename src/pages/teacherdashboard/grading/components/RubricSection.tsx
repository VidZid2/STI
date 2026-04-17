import { motion, AnimatePresence } from 'motion/react';
import { useResponsive } from '../../hooks';
import type { RubricCriteria } from '../types';

interface RubricSectionProps {
    show: boolean;
    rubric?: RubricCriteria[];       // real rubric from the task — undefined = no rubric set
    rubricScores: Record<string, number>;
    rubricTotal: number;
    onScoreChange: (id: string, value: number) => void;
}

const RubricSection: React.FC<RubricSectionProps> = ({ show, rubric, rubricScores, rubricTotal, onScoreChange }) => {
    const { isMobile } = useResponsive();

    // Guard: never fall back to demo data. No rubric = show empty state.
    const hasRubric = rubric && rubric.length > 0;
    const maxPoints = hasRubric ? rubric.reduce((sum, c) => sum + (c.max_points || 0), 0) : 0;

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    style={{ marginBottom: '16px', overflow: 'hidden' }}
                >
                    {!hasRubric ? (
                        /* Empty state — no rubric has been defined for this task */
                        <div style={{
                            padding: isMobile ? '16px' : '20px',
                            borderRadius: '12px',
                            background: 'var(--bg-surface)',
                            border: '1px dashed var(--border-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            color: 'var(--text-muted)',
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <span style={{ fontSize: '13px' }}>No rubric has been defined for this task. Add one in the assignment settings.</span>
                        </div>
                    ) : (
                        <div style={{ padding: isMobile ? '16px' : '20px', borderRadius: '12px', background: '#faf5ff', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
                            <style>{`
                                .rubric-range-slider { -webkit-appearance: none; width: 100%; height: 6px; border-radius: 4px; outline: none; transition: filter 0.2s ease; }
                                .rubric-range-slider:hover { filter: brightness(0.95); }
                                .rubric-range-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #ffffff; border: 4px solid #8b5cf6; cursor: pointer; box-shadow: 0 2px 6px rgba(139,92,246,0.3); transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease; }
                                .rubric-range-slider::-webkit-slider-thumb:hover { transform: scale(1.3); box-shadow: 0 4px 10px rgba(139,92,246,0.4); }
                                .rubric-range-slider::-webkit-slider-thumb:active { transform: scale(0.9); border-width: 6px; }
                                .rubric-range-slider::-moz-range-thumb { width: 18px; height: 18px; box-sizing: border-box; border-radius: 50%; background: #ffffff; border: 4px solid #8b5cf6; cursor: pointer; box-shadow: 0 2px 6px rgba(139,92,246,0.3); }
                            `}</style>
                            {rubric.map((criteria, index) => {
                                const currentValue = rubricScores[criteria.id] || 0;
                                const maxPts = criteria.max_points || 0;
                                const pct = maxPts > 0 ? (currentValue / maxPts) * 100 : 0;
                                return (
                                    <div key={criteria.id} style={{ marginBottom: index === rubric.length - 1 ? '16px' : '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.1px' }}>{criteria.name}</span>
                                            <span style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: 600, color: 'var(--color-purple)' }}>{currentValue}/{maxPts}</span>
                                        </div>
                                        <div style={{ padding: '6px 0', position: 'relative' }}>
                                            <input
                                                type="range" min="0" max={maxPts} value={currentValue}
                                                onChange={e => onScoreChange(criteria.id, parseInt(e.target.value))}
                                                className="rubric-range-slider"
                                                aria-label={`${criteria.name} score out of ${maxPts}`}
                                                style={{ background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${pct}%, #e2e8f0 ${pct}%, #e2e8f0 100%)`, border: '1px solid rgba(0,0,0,0.05)' }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid rgba(139,92,246,0.15)' }}>
                                <span style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Total</span>
                                <span style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 700, color: 'var(--color-purple)' }}>{rubricTotal}/{maxPoints}</span>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default RubricSection;
