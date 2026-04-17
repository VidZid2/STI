import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { RubricCriterion } from '../types';
const RubricBuilder: React.FC<{
    criteria: RubricCriterion[];
    onChange: (criteria: RubricCriterion[]) => void;
    totalPoints: number;
}> = ({ criteria, onChange, totalPoints }) => {
    const [expandedCriterion, setExpandedCriterion] = useState<string | null>(null);

    const addCriterion = () => {
        const newCriterion: RubricCriterion = {
            id: `criterion-${Date.now()}`,
            name: '',
            description: '',
            points: Math.floor(totalPoints / (criteria.length + 1)),
            levels: [
                { label: 'Excellent', points: 100, description: 'Exceeds expectations' },
                { label: 'Good', points: 75, description: 'Meets expectations' },
                { label: 'Fair', points: 50, description: 'Partially meets expectations' },
                { label: 'Poor', points: 25, description: 'Below expectations' },
            ],
        };
        onChange([...criteria, newCriterion]);
        setExpandedCriterion(newCriterion.id);
    };

    const updateCriterion = (id: string, updates: Partial<RubricCriterion>) => {
        onChange(criteria.map(c => c.id === id ? { ...c, ...updates } : c));
    };

    const removeCriterion = (id: string) => {
        onChange(criteria.filter(c => c.id !== id));
    };

    const updateLevel = (criterionId: string, levelIndex: number, updates: Partial<RubricCriterion['levels'][0]>) => {
        onChange(criteria.map(c => {
            if (c.id === criterionId) {
                const newLevels = [...c.levels];
                newLevels[levelIndex] = { ...newLevels[levelIndex], ...updates };
                return { ...c, levels: newLevels };
            }
            return c;
        }));
    };

    const totalRubricPoints = criteria.reduce((sum, c) => sum + c.points, 0);
    const pointsMismatch = totalRubricPoints !== totalPoints;

    return (
        <div style={{ marginTop: '16px' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-[10px] bg-[linear-gradient(135deg,var(--accent-bg)_0%,var(--accent-bg)_100%)] flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                            <rect x="9" y="3" width="6" height="4" rx="1" />
                            <path d="M9 12h6" />
                            <path d="M9 16h6" />
                        </svg>
                    </div>
                    <div>
                        <div className="text-[14px] font-semibold text-[var(--text-primary)]">
                            Grading Rubric
                        </div>
                        <div className="text-[12px] text-[var(--text-secondary)] mt-[2px]">
                            Total: {totalRubricPoints}/{totalPoints} points
                        </div>
                    </div>
                    {pointsMismatch && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, x: -8 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            whileHover={{ scale: 1.02 }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '5px 10px',
                                borderRadius: '8px',
                                background: 'rgba(245, 158, 11, 0.08)',
                                border: '1px solid rgba(245, 158, 11, 0.2)',
                                cursor: 'default',
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <span style={{
                                fontSize: '11px',
                                fontWeight: 500,
                                color: 'var(--color-warning)',
                            }}>
                                Points don't match
                            </span>
                        </motion.div>
                    )}
                </div>
                <motion.button
                    whileHover={{
                        scale: 1.02,
                        boxShadow: '0 6px 20px rgba(59, 130, 246, 0.25)',
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={addCriterion}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--accent-bg)',
                        color: 'var(--accent-primary)',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                    }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Criterion
                </motion.button>
            </div>

            {/* Criteria List */}
            {criteria.length === 0 ? (
                <div className="p-8 rounded-xl border-2 border-dashed border-[var(--border-subtle)] text-center text-[var(--text-muted)]">
                    <div className="w-12 h-12 rounded-xl bg-[linear-gradient(135deg,var(--accent-bg)_0%,var(--accent-bg)_100%)] flex items-center justify-center mx-auto mb-3">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                            <rect x="9" y="3" width="6" height="4" rx="1" />
                            <path d="M9 12h6" />
                            <path d="M9 16h6" />
                        </svg>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>No criteria added yet</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>Click "Add Criterion" to start building your rubric</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {criteria.map((criterion, index) => (
                        <motion.div
                            key={criterion.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                borderRadius: '12px',
                                border: '1px solid var(--border-subtle)',
                                background: 'var(--bg-surface)',
                                overflow: 'hidden',
                            }}
                        >
                            {/* Criterion Header */}
                            <div
                                onClick={() => setExpandedCriterion(expandedCriterion === criterion.id ? null : criterion.id)}
                                className={`flex items-center gap-3 p-[14px_16px] cursor-pointer ${expandedCriterion === criterion.id ? 'bg-[var(--accent-bg)]' : 'bg-transparent'}`}
                            >
                                <div className="w-7 h-7 rounded-lg bg-[linear-gradient(135deg,var(--accent-bg)_0%,var(--accent-bg)_100%)] flex items-center justify-center text-[var(--accent-primary)] text-[12px] font-bold">
                                    {index + 1}
                                </div>
                                <input
                                    type="text"
                                    value={criterion.name}
                                    onChange={(e) => updateCriterion(criterion.id, { name: e.target.value })}
                                    onClick={(e) => e.stopPropagation()}
                                    placeholder="Criterion name (e.g., Code Quality)"
                                    style={{
                                        flex: 1,
                                        border: '1px solid var(--border-subtle)',
                                        backgroundColor: 'var(--bg-surface)',
                                        fontSize: '15px',
                                        fontWeight: 600,
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        boxShadow: 'none',
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        opacity: 0.9,
                                        transition: 'all 0.2s',
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.opacity = '1';
                                        e.target.style.border = '1px solid var(--border-strong)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.opacity = '0.9';
                                        e.target.style.border = '1px solid var(--border-subtle)';
                                    }}
                                />
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center px-2.5 py-1 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
                                        <input
                                            type="number"
                                            value={criterion.points}
                                            onChange={(e) => updateCriterion(criterion.id, { points: parseInt(e.target.value) || 0 })}
                                            onClick={(e) => e.stopPropagation()}
                                            className="no-spinners"
                                            style={{
                                                width: '72px',
                                                boxSizing: 'border-box',
                                                border: '1px solid var(--border-subtle)',
                                                backgroundColor: 'var(--bg-surface)',
                                                color: 'var(--text-primary)',
                                                fontSize: '14px',
                                                fontWeight: 600,
                                                textAlign: 'right',
                                                outline: 'none',
                                                boxShadow: 'none',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                opacity: 0.9,
                                                transition: 'all 0.2s',
                                                MozAppearance: 'textfield',
                                                WebkitAppearance: 'none',
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.opacity = '1';
                                                e.target.style.border = '1px solid var(--border-strong)';
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.opacity = '0.9';
                                                e.target.style.border = '1px solid var(--border-subtle)';
                                            }}
                                        />
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '6px', fontWeight: 500 }}>pts</span>
                                    </div>
                                    <motion.button
                                        whileHover={{ background: 'rgba(239, 68, 68, 0.1)' }}
                                        onClick={(e) => { e.stopPropagation(); removeCriterion(criterion.id); }}
                                        style={{
                                            width: '28px',
                                            height: '28px',
                                            borderRadius: '6px',
                                            border: 'none',
                                            background: 'transparent',
                                            color: 'var(--text-muted)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                    </motion.button>
                                    <motion.div
                                        animate={{ rotate: expandedCriterion === criterion.id ? 180 : 0 }}
                                        style={{ color: 'var(--text-muted)' }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                    </motion.div>
                                </div>
                            </div>

                            {/* Expanded Content */}
                            <AnimatePresence>
                                {expandedCriterion === criterion.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        style={{ overflow: 'hidden' }}
                                    >
                                        <div className="px-4 pb-4 border-t border-[var(--border-subtle)]">
                                            <textarea
                                                value={criterion.description}
                                                onChange={(e) => updateCriterion(criterion.id, { description: e.target.value })}
                                                placeholder="Describe what this criterion evaluates..."
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 14px',
                                                    borderRadius: '8px',
                                                    border: '1px solid transparent',
                                                    backgroundColor: 'var(--bg-surface-alt)',
                                                    color: 'var(--text-secondary)',
                                                    fontSize: '13px',
                                                    lineHeight: '1.5',
                                                    resize: 'none',
                                                    marginTop: '12px',
                                                    outline: 'none',
                                                    boxShadow: 'none',
                                                    transition: 'all 0.2s',
                                                }}
                                                onFocus={(e) => {
                                                    e.target.style.backgroundColor = 'var(--bg-canvas)';
                                                    e.target.style.border = '1px solid var(--border-subtle)';
                                                }}
                                                onBlur={(e) => {
                                                    e.target.style.backgroundColor = 'var(--bg-surface-alt)';
                                                    e.target.style.border = '1px solid transparent';
                                                }}
                                                rows={2}
                                            />

                                            {/* Performance Levels */}
                                            <div className="mt-5">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-7 h-7 rounded-lg bg-[var(--accent-bg)] flex items-center justify-center">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M12 20V10" />
                                                            <path d="M18 20V4" />
                                                            <path d="M6 20v-4" />
                                                        </svg>
                                                    </div>
                                                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                        Performance Levels
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {criterion.levels.map((level, levelIndex) => {
                                                        const levelColors = [
                                                            { bg: 'rgba(16, 185, 129, 0.08)', accent: 'var(--color-success)' },
                                                            { bg: 'var(--accent-bg)', accent: 'var(--accent-primary)' },
                                                            { bg: 'rgba(245, 158, 11, 0.08)', accent: 'var(--color-warning)' },
                                                            { bg: 'rgba(239, 68, 68, 0.08)', accent: 'var(--color-danger)' },
                                                        ];
                                                        const colorScheme = levelColors[levelIndex] || levelColors[0];

                                                        return (
                                                            <motion.div
                                                                key={levelIndex}
                                                                whileHover={{ x: 2 }}
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'flex-start',
                                                                    gap: '16px',
                                                                    padding: '12px 16px',
                                                                    borderRadius: '8px',
                                                                    backgroundColor: 'var(--bg-canvas)',
                                                                    border: '1px solid var(--border-subtle)',
                                                                    borderLeft: `4px solid ${colorScheme.accent}`,
                                                                }}
                                                            >
                                                                <div style={{
                                                                    display: 'flex',
                                                                    flexDirection: 'row',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    minWidth: '96px',
                                                                    padding: '8px 12px',
                                                                    borderRadius: '8px',
                                                                    backgroundColor: colorScheme.bg,
                                                                    border: `1px solid ${colorScheme.accent}80`,
                                                                    marginTop: '2px',
                                                                }}>
                                                                    <input
                                                                        type="number"
                                                                        min={0}
                                                                        max={100}
                                                                        value={level.points}
                                                                        onChange={(e) => {
                                                                            const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                                                            updateLevel(criterion.id, levelIndex, { points: val });
                                                                        }}
                                                                        className="no-spinners"
                                                                        style={{
                                                                            width: '56px',
                                                                            boxSizing: 'border-box',
                                                                            border: `1px solid ${colorScheme.accent}40`,
                                                                            backgroundColor: 'var(--bg-surface)',
                                                                            fontSize: '16px',
                                                                            fontWeight: 700,
                                                                            color: colorScheme.accent,
                                                                            textAlign: 'center',
                                                                            outline: 'none',
                                                                            boxShadow: 'none',
                                                                            padding: '2px 4px',
                                                                            margin: 0,
                                                                            borderRadius: '6px',
                                                                            MozAppearance: 'textfield',
                                                                            WebkitAppearance: 'none',
                                                                            transition: 'all 0.2s',
                                                                        }}
                                                                        onFocus={(e) => {
                                                                            e.target.style.border = `1px solid ${colorScheme.accent}80`;
                                                                        }}
                                                                        onBlur={(e) => {
                                                                            e.target.style.border = `1px solid ${colorScheme.accent}40`;
                                                                        }}
                                                                    />
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colorScheme.accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.9, marginLeft: '4px' }}>
                                                                        <line x1="19" y1="5" x2="5" y2="19"></line>
                                                                        <circle cx="6.5" cy="6.5" r="2.5"></circle>
                                                                        <circle cx="17.5" cy="17.5" r="2.5"></circle>
                                                                    </svg>
                                                                </div>

                                                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                    <input
                                                                        type="text"
                                                                        value={level.label}
                                                                        onChange={(e) => updateLevel(criterion.id, levelIndex, { label: e.target.value })}
                                                                        placeholder="Level Title"
                                                                        style={{
                                                                            width: '100%',
                                                                            border: `1px solid ${colorScheme.accent}40`,
                                                                            backgroundColor: 'var(--bg-surface)',
                                                                            fontSize: '14px',
                                                                            fontWeight: 600,
                                                                            color: 'var(--text-primary)',
                                                                            outline: 'none',
                                                                            boxShadow: 'none',
                                                                            padding: '4px 6px',
                                                                            margin: 0,
                                                                            marginBottom: '4px',
                                                                            borderRadius: '6px',
                                                                            opacity: 0.9,
                                                                            transition: 'all 0.2s',
                                                                        }}
                                                                        onFocus={(e) => {
                                                                            e.target.style.opacity = '1';
                                                                            e.target.style.border = `1px solid ${colorScheme.accent}80`;
                                                                        }}
                                                                        onBlur={(e) => {
                                                                            e.target.style.opacity = '0.9';
                                                                            e.target.style.border = `1px solid ${colorScheme.accent}40`;
                                                                        }}
                                                                    />
                                                                    <textarea
                                                                        value={level.description}
                                                                        onChange={(e) => updateLevel(criterion.id, levelIndex, { description: e.target.value })}
                                                                        placeholder="Describe expectations..."
                                                                        style={{
                                                                            width: '100%',
                                                                            border: `1px solid ${colorScheme.accent}40`,
                                                                            backgroundColor: 'var(--bg-surface)',
                                                                            fontSize: '12.5px',
                                                                            color: 'var(--text-secondary)',
                                                                            resize: 'none',
                                                                            outline: 'none',
                                                                            boxShadow: 'none',
                                                                            padding: '4px 6px',
                                                                            margin: 0,
                                                                            borderRadius: '6px',
                                                                            lineHeight: '1.4',
                                                                            opacity: 0.85,
                                                                            transition: 'all 0.2s',
                                                                        }}
                                                                        onFocus={(e) => {
                                                                            e.target.style.opacity = '1';
                                                                            e.target.style.border = `1px solid ${colorScheme.accent}80`;
                                                                        }}
                                                                        onBlur={(e) => {
                                                                            e.target.style.opacity = '0.85';
                                                                            e.target.style.border = `1px solid ${colorScheme.accent}40`;
                                                                        }}
                                                                        rows={2}
                                                                    />
                                                                </div>
                                                            </motion.div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};


// Main Modal Component

export default RubricBuilder;
