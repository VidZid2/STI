/**
 * QuickStartSection — template grid + "Use Previous Assignment" panel.
 * Extracted from DetailsTab (Phase 20 decomposition).
 * Uses useAssignmentContext() — zero prop drilling.
 */
import React from 'react';
import { motion } from 'motion/react';
import { QUICK_TEMPLATES, getTemplateIcon } from '../../constants';
import { useAssignmentContext } from '../../AssignmentFormContext';

const QuickStartSection: React.FC = () => {
    const {
        updateFormData,
        isMobile, isSmallMobile,
        recentAssignments, loadingRecentAssignments,
    } = useAssignmentContext();

    return (
        <div style={{ marginBottom: isMobile ? '16px' : '24px' }}>
            {/* Section header */}
            <div className="flex items-center justify-between" style={{ marginBottom: isMobile ? '10px' : '12px' }}>
                <div className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    <span className="font-semibold" style={{ fontSize: isMobile ? '12px' : '13px', color: 'var(--text-primary)' }}>Quick Start</span>
                </div>
            </div>

            {/* Template grid */}
            <div style={{
                display: isMobile ? 'flex' : 'grid',
                gridTemplateColumns: isMobile ? undefined : 'repeat(3, 1fr)',
                gap: '10px',
                marginBottom: isMobile ? '12px' : '16px',
                overflowX: isMobile ? 'auto' : undefined,
                paddingBottom: isMobile ? '4px' : undefined,
                paddingLeft: isMobile ? '4px' : undefined,
                paddingRight: isMobile ? '4px' : undefined,
                marginLeft: isMobile ? '-4px' : undefined,
                marginRight: isMobile ? '-4px' : undefined,
            }}>
                {QUICK_TEMPLATES.map((template) => (
                    <motion.button
                        key={template.id}
                        whileHover={!isMobile ? { scale: 1.02, y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', background: 'var(--bg-surface)' } : undefined}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            updateFormData('title', template.defaults.title);
                            updateFormData('description', template.defaults.assignmentDescription);
                            updateFormData('type', template.defaults.type);
                            updateFormData('points', template.defaults.points);
                            updateFormData('maxAttempts', template.defaults.maxAttempts);
                            updateFormData('allowLateSubmission', template.defaults.allowLateSubmission);
                            updateFormData('latePenalty', template.defaults.latePenalty);
                            updateFormData('instructions', template.defaults.instructions);
                        }}
                        className="quick-template-btn cursor-pointer rounded-xl text-left flex"
                        style={{
                            padding: isMobile ? '12px 14px' : '14px 12px',
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-surface)',
                            flexDirection: isMobile ? 'row' : 'column',
                            alignItems: isMobile ? 'center' : undefined,
                            gap: isMobile ? '10px' : '6px',
                            minWidth: isMobile ? '160px' : undefined,
                            flexShrink: isMobile ? 0 : undefined,
                        }}
                    >
                        <div className="flex items-center gap-2 shrink-0">
                            {getTemplateIcon(template.icon, template.color)}
                            {!isMobile && <span className="text-xs font-semibold" style={{ color: template.color }}>{template.name}</span>}
                        </div>
                        {isMobile ? (
                            <div>
                                <span className="block text-xs font-semibold" style={{ color: template.color }}>{template.name}</span>
                                <span className="text-[10px] leading-[1.3]" style={{ color: 'var(--text-muted)' }}>{template.description}</span>
                            </div>
                        ) : (
                            <span className="text-[11px] leading-[1.3]" style={{ color: 'var(--text-muted)' }}>{template.description}</span>
                        )}
                    </motion.button>
                ))}
            </div>

            {/* Use Previous Assignment */}
            {!isSmallMobile && (
                <div className="rounded-xl" style={{
                    padding: isMobile ? '12px 14px' : '14px 16px',
                    background: 'var(--accent-bg)',
                    border: '1px solid var(--ring-focus)',
                }}>
                    <div className="flex items-center gap-2" style={{ marginBottom: isMobile ? '8px' : '10px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span className="previous-assignment-title text-xs font-semibold" style={{ color: 'var(--accent-primary)' }}>Use Previous Assignment</span>
                    </div>
                    <div className="flex flex-col gap-2">
                        {loadingRecentAssignments ? (
                            [1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-lg" style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
                                    <div className="flex-1">
                                        <div className="h-3 w-3/5 rounded animate-pulse" style={{ background: 'var(--border-subtle)' }} />
                                        <div className="h-2.5 w-2/5 rounded mt-1.5 animate-pulse" style={{ background: 'var(--bg-surface-alt)' }} />
                                    </div>
                                    <div className="h-5 w-[60px] rounded-md animate-pulse" style={{ background: 'var(--border-subtle)' }} />
                                </div>
                            ))
                        ) : recentAssignments.length === 0 ? (
                            <div className="py-5 text-center" style={{ color: 'var(--text-muted)' }}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--border-strong)" strokeWidth="1.5" className="mx-auto mb-2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                </svg>
                                <div className="text-xs font-medium">No previous assignments</div>
                                <div className="text-[11px] mt-1">Create your first assignment to see it here</div>
                            </div>
                        ) : (
                            recentAssignments.map((recent) => (
                                <motion.button key={recent.id} whileHover={{ background: 'var(--accent-bg)' }}
                                    onClick={() => {
                                        updateFormData('title', recent.title);
                                        updateFormData('description', recent.description);
                                        updateFormData('course', recent.course);
                                        updateFormData('type', recent.type as 'assignment' | 'quiz' | 'project' | 'journal');
                                        updateFormData('instructions', recent.instructions);
                                        updateFormData('points', recent.points);
                                    }}
                                    className="flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer text-left"
                                    style={{ border: '1px solid var(--ring-focus)', background: 'var(--bg-surface)' }}
                                >
                                    <div>
                                        <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{recent.title}</div>
                                        <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{recent.courseName} • {recent.date}</div>
                                    </div>
                                    <div className="previous-assignment-badge px-2 py-[3px] rounded-md text-[10px] font-semibold uppercase"
                                        style={{ background: 'var(--accent-bg)', color: 'var(--accent-primary)' }}>
                                        {recent.type}
                                    </div>
                                </motion.button>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3" style={{ margin: isMobile ? '14px 0' : '20px 0' }}>
                <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
                <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>or create from scratch</span>
                <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
            </div>
        </div>
    );
};

export default QuickStartSection;
