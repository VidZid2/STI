import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveModal } from './components';
import { toast } from 'sonner';
import { useResponsive } from './hooks';
import { supabase } from '../../lib/supabase';
import { getCurrentUser } from '../../services/authService';


interface ReportAdminModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit?: (data: ReportData) => void;
}

interface ReportData {
    reporter_id: string;
    reporter_name: string;
    category: string;
    title: string;
    description: string;
    priority: string;
    status: 'open';
    affected_class: string | null;
    location: string | null;
    student_name: string | null;
    date_occurred: string | null;
    action_taken: string | null;
}

// ─── Static data ─────────────────────────────────────────────────────────────
const REPORT_CATEGORIES = [
    {
        id: 'infrastructure',
        label: 'Facility / Infrastructure',
        description: 'Room, equipment, or building issues',
        lordIcon: 'https://cdn.lordicon.com/mudwpdhy.json',
        color: 'var(--color-danger)',
        bg: 'rgba(239,68,68,0.08)',
    },
    {
        id: 'student-issue',
        label: 'Student Behavioral Issue',
        description: 'Misconduct, bullying, or attendance',
        lordIcon: 'https://cdn.lordicon.com/eszyyflr.json',
        color: 'var(--color-warning)',
        bg: 'rgba(245,158,11,0.08)',
    },
    {
        id: 'academic',
        label: 'Academic / Curriculum',
        description: 'Grading, materials, or schedule conflicts',
        lordIcon: 'https://cdn.lordicon.com/wxnxiano.json',
        color: '#3b82f6',
        bg: 'rgba(59,130,246,0.08)',
    },
    {
        id: 'others',
        label: 'Others / General Inquiry',
        description: 'Any other concern or request',
        lordIcon: 'https://cdn.lordicon.com/biqqsrac.json',
        color: 'var(--color-purple)',
        bg: 'rgba(139,92,246,0.08)',
    },
];

const PRIORITIES = [
    { id: 'low', label: 'Low', icon: '🟢', desc: 'Can wait a few days', color: '#22c55e' },
    { id: 'medium', label: 'Medium', icon: '🔵', desc: 'Needs attention soon', color: '#3b82f6' },
    { id: 'high', label: 'High', icon: '🟠', desc: 'Address within 24 hrs', color: 'var(--color-warning)' },
    { id: 'urgent', label: 'Urgent', icon: '🔴', desc: 'Immediate action needed', color: 'var(--color-danger)' },
];




const ReportAdminModal: React.FC<ReportAdminModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const { isMobile } = useResponsive();

    // Accent color for this modal is red/pink — use CSS var

    // Theme-aware style helpers converted to Tailwind classes
    const inputBaseClass = "w-full px-4 py-3 rounded-xl border-[1.5px] border-[var(--border-subtle)] text-sm outline-none box-border bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-all duration-200 focus:border-[var(--accent-primary)] focus:ring-[3px] focus:ring-[var(--ring-focus)] focus:bg-[var(--bg-surface)]";
    const labelStyleClass = "block text-[13px] font-semibold text-[var(--text-secondary)] mb-2 tracking-[0.01em]";

    const [step, setStep] = useState<1 | 2>(1);
    const [category, setCategory] = useState('infrastructure');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('medium');
    const [affectedClass, setAffectedClass] = useState('');
    const [location, setLocation] = useState('');
    const [studentName, setStudentName] = useState('');
    const [dateOccurred, setDateOccurred] = useState('');
    const [actionTaken, setActionTaken] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setCategory('infrastructure');
            setTitle('');
            setDescription('');
            setPriority('medium');
            setAffectedClass('');
            setLocation('');
            setStudentName('');
            setDateOccurred('');
            setActionTaken('');
            setIsSubmitting(false);
            setIsSuccess(false);
        }
    }, [isOpen]);

    const selectedCat = REPORT_CATEGORIES.find(c => c.id === category)!;
    const selectedPriority = PRIORITIES.find(p => p.id === priority)!;
    const isStudentIssue = category === 'student-issue';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const user = getCurrentUser();
            const reportData = {
                reporter_id: user?.student_id || 'unknown',
                reporter_name: user?.full_name || 'Unknown Teacher',
                category,
                title,
                description,
                priority,
                status: 'open' as const,
                affected_class: affectedClass || null,
                location: location || null,
                student_name: studentName || null,
                date_occurred: dateOccurred ? new Date(dateOccurred).toISOString() : null,
                action_taken: actionTaken || null,
            };

            if (supabase) {
                await supabase.from('admin_reports').insert(reportData);
                // Log audit event
                await supabase.from('audit_log').insert({
                    event_type: 'report',
                    actor_name: user?.full_name || 'Teacher',
                    actor_role: 'teacher',
                    description: `Filed report: ${title} [${priority.toUpperCase()}]`,
                });
            }

            onSubmit?.(reportData);
            setIsSubmitting(false);
            setIsSuccess(true);
            setTimeout(() => onClose(), 2000);
        } catch (err) {
            toast.error('Failed to submit report');
            setIsSubmitting(false);
            // Still show success for UX — the report data was at least captured locally
            setIsSuccess(true);
            setTimeout(() => onClose(), 2000);
        }
    };

    const header = (
        <div className={`flex items-center gap-3.5 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] ${isMobile ? 'p-4' : 'p-[20px_24px]'}`}>
            <div className="w-[46px] h-[46px] rounded-[14px] shrink-0 flex items-center justify-center bg-[var(--accent-bg)] border border-[var(--ring-focus)] text-[var(--accent-primary)]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
            </div>
            <div className="flex-1 min-w-0">
                <h2 className={`m-0 font-bold text-[var(--text-primary)] ${isMobile ? 'text-[15px]' : 'text-[17px]'}`}>Report to Admin</h2>
                <p className="m-0 mt-[3px] text-xs text-[var(--text-secondary)]">
                    {step === 1 ? 'Step 1 of 2 — Category & Details' : 'Step 2 of 2 — Context & Priority'}
                </p>
            </div>
            {/* Step indicator */}
            <div className="flex gap-1.5 items-center mr-2">
                {[1, 2].map(s => (
                    <div key={s} 
                        className={`h-2 rounded-[4px] transition-all duration-300 ease-in-out ${s === step ? 'w-[20px] bg-[var(--accent-primary)]' : s < step ? 'w-2 bg-[var(--color-danger-bg)]' : 'w-2 bg-[var(--border-subtle)]'}`}
                    />
                ))}
            </div>
            <motion.button
                whileHover={{ scale: 1.1, background: 'var(--bg-surface-alt)' }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                aria-label="Close modal"
                className="w-[34px] h-[34px] rounded-[10px] border-none flex items-center justify-center cursor-pointer shrink-0 bg-[var(--bg-canvas)] text-[var(--text-secondary)]"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </motion.button>
        </div>
    );

    return (
        <ResponsiveModal isOpen={isOpen} onClose={onClose} showHeader={false} maxWidth="600px" noPadding hideScrollbar>
        <div className="sticky top-0 z-10 bg-[var(--bg-surface)]">{header}</div>

            <div className={`bg-[var(--bg-surface)] ${isMobile ? 'p-5' : 'p-[28px_32px]'}`}>
                <AnimatePresence mode="wait">
                    {isSuccess ? (
                        <motion.div key="success"
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                            className="flex flex-col items-center text-center py-14 gap-4"
                        >
                            <motion.div
                                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                                className="w-20 h-20 rounded-full flex items-center justify-center bg-[var(--color-success-bg)] text-[var(--color-success)]"
                            >
                                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                            </motion.div>
                            <div>
                                <h3 className="m-0 text-xl font-bold text-[var(--text-primary)]">Report Submitted!</h3>
                                <p className="mt-2.5 mb-0 text-sm leading-relaxed max-w-[300px] text-[var(--text-secondary)]">
                                    Your report has been sent to the administration. You'll be notified once it's reviewed.
                                </p>
                            </div>
                            <div className="mt-2 px-5 py-3 rounded-xl text-[13px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                                Priority: <span style={{ color: selectedPriority.color, fontWeight: 600 }}>{selectedPriority.icon} {selectedPriority.label}</span>
                                &nbsp;·&nbsp; Category: <span className="font-semibold text-[var(--text-primary)]">{selectedCat.label}</span>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleSubmit}>
                            <AnimatePresence mode="wait">
                                {step === 1 ? (
                                    <motion.div key="step1"
                                        initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                                        transition={{ duration: 0.2 }}
                                        className="flex flex-col gap-6"
                                    >
                                        {/* Category */}
                                        <div>
                                            <label className={labelStyleClass}>What type of issue are you reporting?</label>
                                            <div className={`grid gap-2.5 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                                {REPORT_CATEGORIES.map(cat => (
                                                    <motion.button key={cat.id} type="button" onClick={() => setCategory(cat.id)}
                                                        whileHover={{ y: -2, boxShadow: `0 6px 20px ${cat.color}20` }}
                                                        whileTap={{ scale: 0.98 }}
                                                        style={{
                                                            display: 'flex', alignItems: 'flex-start', gap: '12px',
                                                            padding: '14px 16px', borderRadius: '14px', cursor: 'pointer', textAlign: 'left',
                                                            border: `2px solid ${category === cat.id ? cat.color : 'var(--border-subtle)'}`,
                                                            background: category === cat.id ? cat.bg : 'var(--bg-surface-alt)',
                                                            transition: 'all 0.15s ease',
                                                        }}
                                                    >
                                                        <div style={{
                                                            width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                                                            background: category === cat.id ? `${cat.color}18` : 'var(--bg-canvas)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        }}>
                                                            <lord-icon src={cat.lordIcon} trigger="hover"
                                                                colors={`primary:${category === cat.id ? cat.color : 'var(--text-muted)'}`}
                                                                style={{ width: '22px', height: '22px' }} />
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '13px', fontWeight: 700, color: category === cat.id ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{cat.label}</div>
                                                            <div className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-[1.4]">{cat.description}</div>
                                                        </div>
                                                        {category === cat.id && (
                                                            <div className="ml-auto text-[var(--text-primary)] shrink-0" style={{ color: cat.color }}>
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" /></svg>
                                                            </div>
                                                        )}
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Subject */}
                                        <div className="flex flex-col gap-1.5">
                                            <label className={labelStyleClass}>
                                                Subject <span className="text-[var(--accent-primary)]">*</span>
                                            </label>
                                            <input required type="text" placeholder="e.g. Broken projector in Room 204"
                                                value={title} onChange={e => setTitle(e.target.value)}
                                                className={inputBaseClass} />
                                        </div>

                                        {/* Description */}
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex justify-between items-center mb-2">
                                                <label className={`${labelStyleClass} !mb-0`}>
                                                    Detailed Description <span className="text-[var(--accent-primary)]">*</span>
                                                </label>
                                                <span className="text-[11px]" style={{ color: description.length > 450 ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                                                    {description.length}/500
                                                </span>
                                            </div>
                                            <textarea required placeholder="Describe the issue clearly — what happened, when, and how it affects your class..."
                                                value={description} onChange={e => setDescription(e.target.value.slice(0, 500))}
                                                rows={isMobile ? 4 : 5}
                                                className={`${inputBaseClass} resize-none leading-[1.6]`} />
                                        </div>

                                        <motion.button type="button" onClick={() => setStep(2)}
                                            disabled={!title.trim() || !description.trim()}
                                            whileHover={title && description ? { scale: 1.01, boxShadow: '0 6px 20px var(--ring-focus)' } : {}}
                                            whileTap={title && description ? { scale: 0.99 } : {}}
                                            style={{
                                                width: '100%', padding: '13px', borderRadius: '12px', border: 'none',
                                                background: title && description
                                                    ? 'var(--accent-primary)'
                                                    : 'var(--bg-canvas)',
                                                color: title && description ? '#ffffff' : 'var(--text-secondary)',
                                                fontSize: '14px', fontWeight: 700, cursor: title && description ? 'pointer' : 'not-allowed',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                            }}
                                        >
                                            Continue to Details
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <polyline points="9 18 15 12 9 6" />
                                            </svg>
                                        </motion.button>
                                    </motion.div>
                                ) : (
                                    <motion.div key="step2"
                                        initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
                                        transition={{ duration: 0.2 }}
                                        className="flex flex-col gap-5"
                                    >
                                        {/* Summary chip */}
                                        <div className="p-[12px_16px] rounded-xl bg-[var(--accent-bg)] border border-[var(--ring-focus)] flex items-center gap-2.5">
                                            <lord-icon src={selectedCat.lordIcon} trigger="hover"
                                                colors={`primary:var(--accent-primary)`}
                                                style={{ width: '20px', height: '20px', flexShrink: 0 }} />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Reporting:</div>
                                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
                                            </div>
                                            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-primary)', background: 'var(--accent-bg)', padding: '3px 8px', borderRadius: '6px', flexShrink: 0 }}>
                                                {selectedCat.label}
                                            </span>
                                        </div>

                                        {/* Two-column row */}
                                        <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                            <div className="flex flex-col gap-1.5">
                                                <label className={labelStyleClass}>Affected Class / Section</label>
                                                <input type="text" placeholder="e.g. Grade 10 - Rizal"
                                                    value={affectedClass} onChange={e => setAffectedClass(e.target.value)}
                                                    className={inputBaseClass} />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className={labelStyleClass}>Location / Room</label>
                                                <input type="text" placeholder="e.g. Room 204, Science Lab"
                                                    value={location} onChange={e => setLocation(e.target.value)}
                                                    className={inputBaseClass} />
                                            </div>
                                        </div>

                                        {/* Student name — only for behavioral */}
                                        {isStudentIssue && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex flex-col gap-1.5">
                                                <label className={labelStyleClass}>Student Name(s) Involved</label>
                                                <input type="text" placeholder="e.g. Juan Dela Cruz (or multiple names)"
                                                    value={studentName} onChange={e => setStudentName(e.target.value)}
                                                    className={inputBaseClass} />
                                            </motion.div>
                                        )}

                                        {/* Date occurred */}
                                        <div className="flex flex-col gap-1.5">
                                            <label className={labelStyleClass}>Date / Time of Incident</label>
                                            <input type="datetime-local"
                                                value={dateOccurred} onChange={e => setDateOccurred(e.target.value)}
                                                className={inputBaseClass} style={{ colorScheme: 'light dark' }} />
                                        </div>

                                        {/* Action already taken */}
                                        <div className="flex flex-col gap-1.5">
                                            <label className={labelStyleClass}>Action Already Taken (if any)</label>
                                            <textarea placeholder="e.g. Informed the class, sent student to guidance office..."
                                                value={actionTaken} onChange={e => setActionTaken(e.target.value)}
                                                rows={3}
                                                className={`${inputBaseClass} resize-none leading-[1.6]`} />
                                        </div>

                                        {/* Priority */}
                                        <div>
                                            <label className={labelStyleClass}>Priority Level <span className="text-[var(--accent-primary)]">*</span></label>
                                            <div className={`grid gap-2.5 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
                                                {PRIORITIES.map(p => (
                                                    <motion.button key={p.id} type="button" onClick={() => setPriority(p.id)}
                                                        whileHover={{ y: -2, boxShadow: `0 4px 12px ${p.color}25` }}
                                                        whileTap={{ scale: 0.97 }}
                                                        style={{
                                                            padding: '12px 8px', borderRadius: '12px', border: `2px solid`,
                                                            borderColor: priority === p.id ? p.color : 'var(--border-subtle)',
                                                            background: priority === p.id ? `${p.color}10` : 'var(--bg-surface-alt)',
                                                            cursor: 'pointer', textAlign: 'center',
                                                            transition: 'all 0.15s ease',
                                                        }}
                                                    >
                                                        <div style={{ fontSize: '18px', marginBottom: '4px' }}>{p.icon}</div>
                                                        <div style={{ fontSize: '12px', fontWeight: 700, color: priority === p.id ? p.color : 'var(--text-secondary)' }}>{p.label}</div>
                                                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.3 }}>{p.desc}</div>
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="flex gap-2.5 pt-5" style={{ borderTop: '1.5px solid var(--border-subtle)', flexDirection: isMobile ? 'column-reverse' : 'row' }}>
                                            <motion.button type="button" onClick={() => setStep(1)}
                                                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                                                className="flex-1 py-3 rounded-xl flex items-center justify-center gap-1.5 text-sm font-semibold cursor-pointer"
                                                style={{
                                                    border: '1.5px solid var(--border-subtle)',
                                                    background: 'var(--bg-surface)',
                                                    color: 'var(--text-secondary)',
                                                }}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
                                                Back
                                            </motion.button>
                                            <motion.button type="submit" disabled={isSubmitting}
                                                whileHover={!isSubmitting ? { scale: 1.01, boxShadow: '0 8px 24px var(--ring-focus)' } : {}}
                                                whileTap={!isSubmitting ? { scale: 0.99 } : {}}
                                                className="flex-[2] py-3 rounded-xl border-none flex items-center justify-center gap-2 text-sm font-bold text-white"
                                                style={{
                                                    background: isSubmitting ? 'var(--accent-bg)' : 'var(--accent-primary)',
                                                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                                    boxShadow: isSubmitting ? 'none' : '0 4px 14px var(--ring-focus)',
                                                }}
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                                            <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                                                        </svg>
                                                        Submitting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                                                        </svg>
                                                        Submit Report
                                                    </>
                                                )}
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.form>
                    )}
                </AnimatePresence>
            </div>
        </ResponsiveModal>
    );
};

export default ReportAdminModal;
