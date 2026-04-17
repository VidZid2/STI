/**
 * SubmitModal
 * Extracted from CourseViewPage.tsx during Phase 1.1
 * Handles assignment submission with text + file attachments.
 * Rendered via createPortal to escape stacking context.
 */
import * as React from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { createSubmission } from '../../../../../services/submissionService';
import { getCurrentUser } from '../../../../../services/authService';
import { FileUpload } from '../../../../../components/ui/file-upload';

interface SubmitModalTask {
    id: string | number;
    title: string;
    due: string;
    points?: number;
    maxAttempts?: number;
    submissionCount?: number;
    [key: string]: any;
}

interface SubmitModalProps {
    task: SubmitModalTask | null;
    onClose: () => void;
    onSubmitSuccess: () => void; // callback to refresh task list
}

const SubmitModal: React.FC<SubmitModalProps> = ({ task, onClose, onSubmitSuccess }) => {
    const [submissionText, setSubmissionText] = useState('');
    const [submissionFiles, setSubmissionFiles] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const isDark = document.documentElement.classList.contains('dark');

    const handleClose = () => {
        if (!isSubmitting) {
            onClose();
            setSubmissionText('');
            setSubmissionFiles([]);
            setSubmitSuccess(false);
        }
    };

    const handleDone = () => {
        onClose();
        setSubmitSuccess(false);
        setSubmissionText('');
        setSubmissionFiles([]);
        onSubmitSuccess();
    };

    return createPortal(
        <AnimatePresence>
            {task && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={handleClose}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 99999,
                        background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '24px',
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: '100%', maxWidth: '520px',
                            background: isDark ? '#1e293b' : '#ffffff',
                            borderRadius: '20px',
                            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255,255,255,0.05)',
                            overflow: 'hidden',
                            display: 'flex', flexDirection: 'column' as const,
                        }}
                    >
                        {/* Success State */}
                        {submitSuccess ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{ padding: '48px 32px', textAlign: 'center' as const }}
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
                                    style={{
                                        width: '90px', height: '90px', borderRadius: '50%',
                                        background: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        margin: '0 auto 24px',
                                        boxShadow: isDark ? 'inset 0 0 20px rgba(16, 185, 129, 0.05)' : 'inset 0 0 20px rgba(16, 185, 129, 0.1)',
                                    }}
                                >
                                    {/* @ts-ignore */}
                                    <lord-icon
                                        src="https://cdn.lordicon.com/uvofdfal.json"
                                        trigger="hover"
                                        colors="primary:#10b981,secondary:#059669"
                                        style={{ width: '64px', height: '64px' }}
                                    ></lord-icon>
                                </motion.div>
                                <h3 style={{
                                    fontSize: '22px', fontWeight: 800, marginBottom: '10px',
                                    color: isDark ? '#f1f5f9' : '#0f172a',
                                }}>Submission Successful!</h3>
                                <p style={{
                                    fontSize: '14px', marginBottom: '36px', lineHeight: 1.6,
                                    color: isDark ? '#94a3b8' : '#64748b',
                                    maxWidth: '90%', margin: '0 auto 36px'
                                }}>
                                    Your assignment has been submitted to your teacher for grading. You'll be notified once it's graded.
                                </p>
                                <motion.button
                                    whileHover={{ scale: 1.02, boxShadow: '0 6px 20px rgba(16, 185, 129, 0.25)' }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleDone}
                                    style={{
                                        margin: '0 auto',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        gap: '6px', padding: '10px 32px',
                                        background: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.08)',
                                        color: '#10b981',
                                        border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)'}`,
                                        borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                                    }}
                                >
                                    Done
                                </motion.button>
                            </motion.div>
                        ) : (
                            <>
                                {/* Header */}
                                <div style={{
                                    padding: '24px 28px 0',
                                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                                        <div style={{
                                            width: '48px', height: '48px', borderRadius: '14px',
                                            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)', flexShrink: 0,
                                        }}>
                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M22 2L11 13" />
                                                <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 style={{
                                                fontSize: '17px', fontWeight: 700, margin: 0, lineHeight: 1.3,
                                                color: isDark ? '#f1f5f9' : '#0f172a',
                                            }}>Submit Assignment</h2>
                                            <p style={{
                                                fontSize: '12px', margin: 0, marginTop: '2px',
                                                color: isDark ? '#94a3b8' : '#64748b',
                                            }}>{task.title}</p>
                                        </div>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.1, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={handleClose}
                                        style={{
                                            width: '32px', height: '32px', borderRadius: '10px',
                                            border: 'none', background: 'transparent',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer', flexShrink: 0,
                                            color: isDark ? '#94a3b8' : '#94a3b8',
                                        }}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                            <line x1="18" y1="6" x2="6" y2="18" />
                                            <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                    </motion.button>
                                </div>

                                {/* Task Info Badges */}
                                <div style={{ padding: '16px 28px', display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                                        padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
                                        background: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)',
                                        color: '#3b82f6',
                                    }}>
                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                                        </svg>
                                        {task.due}
                                    </span>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                                        padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
                                        background: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.08)',
                                        color: '#10b981',
                                    }}>
                                        {task.points || 100} pts
                                    </span>
                                    {(task.maxAttempts || 1) > 1 && (
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                                            padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
                                            background: isDark ? 'rgba(0, 61, 165, 0.15)' : 'rgba(0, 61, 165, 0.08)',
                                            color: '#003DA5',
                                        }}>
                                            {(task.maxAttempts || 1) - (task.submissionCount || 0)} attempt{(task.maxAttempts || 1) - (task.submissionCount || 0) !== 1 ? 's' : ''} left
                                        </span>
                                    )}
                                </div>

                                {/* Divider */}
                                <div style={{
                                    height: '1px', margin: '0 28px',
                                    background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                }} />

                                {/* Submission Content */}
                                <div style={{ padding: '20px 28px', flex: 1 }}>
                                    <label style={{
                                        display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '8px',
                                        color: isDark ? '#94a3b8' : '#64748b',
                                        textTransform: 'uppercase' as const, letterSpacing: '0.5px',
                                    }}>
                                        Your Answer / Comments
                                    </label>
                                    <textarea
                                        value={submissionText}
                                        onChange={(e) => setSubmissionText(e.target.value)}
                                        placeholder="Type your answer, solution, or any comments here..."
                                        style={{
                                            width: '100%', minHeight: '120px', padding: '14px 16px',
                                            borderRadius: '14px',
                                            border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                                            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(248, 250, 252, 1)',
                                            color: isDark ? '#e2e8f0' : '#1e293b',
                                            fontSize: '14px', lineHeight: 1.6, resize: 'vertical' as const,
                                            outline: 'none', fontFamily: 'inherit',
                                            transition: 'border-color 0.2s, box-shadow 0.2s',
                                        }}
                                        onFocus={(e) => {
                                            e.currentTarget.style.borderColor = '#3b82f6';
                                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    />

                                    {/* File Attachments */}
                                    <div style={{ marginTop: '16px' }}>
                                        <label style={{
                                            display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '8px',
                                            color: isDark ? '#94a3b8' : '#64748b',
                                            textTransform: 'uppercase' as const, letterSpacing: '0.5px',
                                        }}>
                                            Attachments
                                        </label>
                                        <FileUpload
                                            files={submissionFiles}
                                            onChange={setSubmissionFiles}
                                        />
                                    </div>
                                </div>

                                {/* Footer */}
                                <div style={{
                                    padding: '16px 28px 24px',
                                    display: 'flex', gap: '10px', justifyContent: 'flex-end',
                                    borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                                }}>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleClose}
                                        disabled={isSubmitting}
                                        style={{
                                            padding: '10px 22px', borderRadius: '12px', fontSize: '13px', fontWeight: 600,
                                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
                                            background: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                                            color: isDark ? '#94a3b8' : '#64748b',
                                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                            opacity: isSubmitting ? 0.5 : 1,
                                        }}
                                    >
                                        Cancel
                                    </motion.button>

                                    <motion.button
                                        whileHover={!isSubmitting && (submissionText.trim() || submissionFiles.length > 0)
                                            ? { scale: 1.02, boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)' } : {}}
                                        whileTap={!isSubmitting && (submissionText.trim() || submissionFiles.length > 0)
                                            ? { scale: 0.98 } : {}}
                                        disabled={isSubmitting || (!submissionText.trim() && submissionFiles.length === 0)}
                                        onClick={async () => {
                                            const currentUser = getCurrentUser();
                                            if (!currentUser) return;
                                            setIsSubmitting(true);
                                            try {
                                                const result = await createSubmission({
                                                    taskId: task.id,
                                                    studentId: currentUser.student_id || currentUser.id,
                                                    studentName: currentUser.full_name,
                                                    section: currentUser.section || 'BSIT101A',
                                                    textContent: submissionText,
                                                    files: submissionFiles.length > 0 ? submissionFiles : undefined
                                                });
                                                if (result) {
                                                    setSubmitSuccess(true);
                                                }
                                            } catch (err) {
                                                console.error('Failed to submit:', err);
                                            } finally {
                                                setIsSubmitting(false);
                                            }
                                        }}
                                        style={{
                                            padding: '10px 28px', borderRadius: '12px', fontSize: '13px', fontWeight: 700,
                                            border: 'none',
                                            background: isSubmitting || (!submissionText.trim() && submissionFiles.length === 0)
                                                ? (isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.4)')
                                                : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                            color: '#fff',
                                            cursor: isSubmitting || (!submissionText.trim() && submissionFiles.length === 0) ? 'not-allowed' : 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            boxShadow: isSubmitting || (!submissionText.trim() && submissionFiles.length === 0)
                                                ? 'none' : '0 4px 14px rgba(59, 130, 246, 0.25)',
                                        }}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <motion.svg
                                                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                >
                                                    <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                                                </motion.svg>
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M22 2L11 13" />
                                                    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                                                </svg>
                                                Submit Assignment
                                            </>
                                        )}
                                    </motion.button>
                                </div>
                            </>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default SubmitModal;
