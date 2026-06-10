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

const SubmitIcon = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 2L11 13" />
        <path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
);

interface SubmitModalTask {
    id: string | number;
    title: string;
    due: string;
    points?: number;
    maxAttempts?: number;
    submissionCount?: number;
    [key: string]: unknown;
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

    // Screen size detection for responsive shrinking
    const [isMobile, setIsMobile] = useState(false);
    React.useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Auto-minimizing header state
    const [isMinimized, setIsMinimized] = useState(false);
    const lastScrollY = React.useRef(0);
    const scrollDirection = React.useRef<'up' | 'down' | null>(null);
    const anchorScrollY = React.useRef(0);

    const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const currentScrollY = e.currentTarget.scrollTop;
        
        // Handle top of scroll
        if (currentScrollY <= 10) {
            setIsMinimized(false);
            lastScrollY.current = currentScrollY;
            scrollDirection.current = null;
            anchorScrollY.current = currentScrollY;
            return;
        }

        const delta = currentScrollY - lastScrollY.current;
        
        if (delta > 0) {
            if (scrollDirection.current !== 'down') {
                scrollDirection.current = 'down';
                anchorScrollY.current = lastScrollY.current;
            }
            if (currentScrollY - anchorScrollY.current > 30) {
                setIsMinimized(true);
            }
        } else if (delta < 0) {
            if (scrollDirection.current !== 'up') {
                scrollDirection.current = 'up';
                anchorScrollY.current = lastScrollY.current;
            }
            // Do not expand just by scrolling up. Only expand at the very top.
        }

        lastScrollY.current = currentScrollY;
    }, []);

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
                        padding: '24px' }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="submit-modal-title"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: '100%', maxWidth: '520px',
                            maxHeight: '85vh',
                            background: isDark ? '#1e293b' : '#ffffff',
                            borderRadius: '20px',
                            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255,255,255,0.05)',
                            overflow: 'hidden',
                            display: 'flex', flexDirection: 'column' as const }}
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
                                        boxShadow: isDark ? 'inset 0 0 20px rgba(16, 185, 129, 0.05)' : 'inset 0 0 20px rgba(16, 185, 129, 0.1)' }}
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
                                    color: isDark ? '#f1f5f9' : '#0f172a' }}>Submission Successful!</h3>
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
                                        borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                                >
                                    Done
                                </motion.button>
                            </motion.div>
                        ) : (
                            <>
                                {/* Header */}
                                <motion.div 
                                    animate={{
                                        padding: isMinimized 
                                            ? (isMobile ? '8px 12px' : '12px 16px') 
                                            : (isMobile ? '12px 12px 2px 12px' : '24px')
                                    }}
                                    className="relative border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-t-[20px]"
                                >
                                    <div className="flex items-start gap-3 sm:gap-4">
                                        {/* Header Card */}
                                        <motion.div 
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ 
                                                opacity: 1, 
                                                y: 0,
                                                padding: isMinimized 
                                                    ? (isMobile ? '8px 12px' : '12px 16px') 
                                                    : (isMobile ? '12px' : '24px'),
                                                gap: isMinimized 
                                                    ? (isMobile ? '12px' : '16px') 
                                                    : (isMobile ? '12px' : '24px')
                                            }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 24, delay: 0.1 }}
                                            className="flex-1 relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[20px] sm:rounded-[24px] flex items-center group transition-all duration-300 hover:shadow-md hover:border-blue-200/80 dark:hover:border-blue-800/50 text-left"
                                        >
                                            {/* SaaS Background Accents */}
                                            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
                                            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-blue-400/10 dark:bg-blue-400/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />

                                            <motion.div
                                                animate={{
                                                    width: isMinimized ? (isMobile ? 32 : 40) : (isMobile ? 40 : 64),
                                                    height: isMinimized ? (isMobile ? 32 : 40) : (isMobile ? 40 : 64),
                                                    borderRadius: isMinimized ? (isMobile ? 10 : 12) : (isMobile ? 12 : 20)
                                                }}
                                                whileHover={{ scale: 1.05, rotate: -5 }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                                className="bg-blue-50 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 flex items-center justify-center flex-shrink-0 shadow-sm text-blue-600 dark:text-blue-400 relative z-10"
                                            >
                                                <div className="hidden sm:flex">
                                                    <SubmitIcon size={32} />
                                                </div>
                                                <div className="flex sm:hidden">
                                                    <SubmitIcon size={24} />
                                                </div>
                                            </motion.div>
                                            
                                            <div className="relative z-10 flex-1 min-w-0 pr-2 sm:pr-4">
                                                <motion.h2 
                                                    id="submit-modal-title"
                                                    animate={{ fontSize: isMinimized ? (isMobile ? '15px' : '16px') : (isMobile ? '17px' : '26px') }}
                                                    className="font-bold text-zinc-900 dark:text-zinc-100 tracking-tight m-0 mb-0.5 sm:mb-1 truncate"
                                                >
                                                    Submit Assignment
                                                </motion.h2>
                                                <motion.p 
                                                    animate={{ fontSize: isMinimized ? (isMobile ? '11px' : '12px') : (isMobile ? '12px' : '14.5px') }}
                                                    className="text-zinc-600 dark:text-zinc-400 leading-relaxed m-0 truncate"
                                                >
                                                    {task.title}
                                                </motion.p>
                                            </div>
                                            <div className="relative z-20 self-start">
                                                <motion.button
                                                    onClick={handleClose}
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    className="flex-shrink-0 flex items-center justify-center rounded-lg sm:rounded-xl border border-zinc-200/80 bg-white/80 backdrop-blur-md p-2 text-zinc-500 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-700/80 dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:bg-zinc-700"
                                                    aria-label="Close modal"
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sm:w-5 sm:h-5">
                                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                                    </svg>
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                    </div>
                                </motion.div>

                                {/* Submission Content */}
                                <div 
                                    onScroll={handleScroll}
                                    style={{ padding: isMobile ? '16px' : '20px 24px', flex: 1, overflowY: 'auto' }}
                                >
                                    <div style={{ marginBottom: '16px', marginTop: '4px' }}>
                                        <h3 style={{
                                            margin: '0 0 3px',
                                            fontSize: '17px',
                                            fontWeight: 800,
                                            color: isDark ? '#f8fafc' : '#0f172a',
                                            letterSpacing: '-0.02em',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}>
                                            <div style={{
                                                width: '6px',
                                                height: '16px',
                                                borderRadius: '3px',
                                                backgroundColor: '#3b82f6',
                                            }} />
                                            Your Answer / Comments
                                        </h3>
                                        <p style={{
                                            margin: 0,
                                            fontSize: '12.5px',
                                            color: isDark ? '#94a3b8' : '#64748b',
                                            fontWeight: 400,
                                            paddingLeft: '14px',
                                        }}>
                                            Write your answer, solution, or any additional context
                                        </p>
                                    </div>
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
                                            transition: 'border-color 0.2s, box-shadow 0.2s' }}
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
                                    <div style={{ marginTop: '24px' }}>
                                        <div style={{ marginBottom: '16px' }}>
                                            <h3 style={{
                                                margin: '0 0 3px',
                                                fontSize: '17px',
                                                fontWeight: 800,
                                                color: isDark ? '#f8fafc' : '#0f172a',
                                                letterSpacing: '-0.02em',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}>
                                                <div style={{
                                                    width: '6px',
                                                    height: '16px',
                                                    borderRadius: '3px',
                                                    backgroundColor: '#10b981', // green for attachments accent
                                                }} />
                                                Attachments
                                            </h3>
                                            <p style={{
                                                margin: 0,
                                                fontSize: '12.5px',
                                                color: isDark ? '#94a3b8' : '#64748b',
                                                fontWeight: 400,
                                                paddingLeft: '14px',
                                            }}>
                                                Upload any required files or documents for this assignment
                                            </p>
                                        </div>
                                        <FileUpload
                                            files={submissionFiles}
                                            onChange={setSubmissionFiles}
                                        />
                                    </div>
                                </div>

                                {/* Footer */}
                                <motion.div 
                                    animate={{
                                        padding: isMinimized 
                                            ? (isMobile ? '8px 12px 12px' : '12px 16px 16px') 
                                            : (isMobile ? '8px 12px 12px' : '16px 24px 24px'),
                                        gap: isMinimized
                                            ? (isMobile ? '12px' : '16px')
                                            : (isMobile ? '10px' : '20px')
                                    }}
                                    style={{
                                    display: 'flex', width: '100%', gap: '16px',
                                    borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}` }}>
                                    <motion.button
                                        animate={{
                                            padding: isMinimized 
                                                ? (isMobile ? '8px 12px' : '10px 16px') 
                                                : (isMobile ? '8px 14px' : '12px 16px'),
                                            fontSize: isMinimized 
                                                ? (isMobile ? '12px' : '13px') 
                                                : (isMobile ? '12px' : '14px')
                                        }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleClose}
                                        disabled={isSubmitting}
                                        className="flex-1 flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-[14px] transition-colors shadow-sm"
                                        style={{
                                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                            opacity: isSubmitting ? 0.5 : 1 }}
                                    >
                                        Cancel
                                    </motion.button>

                                    <motion.button
                                        animate={{
                                            padding: isMinimized 
                                                ? (isMobile ? '8px 12px' : '10px 16px') 
                                                : (isMobile ? '8px 14px' : '12px 16px'),
                                            fontSize: isMinimized 
                                                ? (isMobile ? '12px' : '13px') 
                                                : (isMobile ? '12px' : '14px')
                                        }}
                                        whileHover={!isSubmitting && (submissionText.trim() || submissionFiles.length > 0)
                                            ? { scale: 1.02 } : {}}
                                        whileTap={!isSubmitting && (submissionText.trim() || submissionFiles.length > 0)
                                            ? { scale: 0.98 } : {}}
                                        disabled={isSubmitting || (!submissionText.trim() && submissionFiles.length === 0)}
                                        onClick={async () => {
                                            const currentUser = getCurrentUser();
                                            if (!currentUser) return;
                                            setIsSubmitting(true);
                                            try {
                                                const result = await createSubmission({
                                                    taskId: String(task.id),
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
                                            } finally {
                                                setIsSubmitting(false);
                                            }
                                        }}
                                        className={`flex-[1.5] sm:flex-1 flex items-center justify-center gap-2 font-bold rounded-[14px] transition-colors shadow-sm ${
                                            isSubmitting || (!submissionText.trim() && submissionFiles.length === 0)
                                                ? 'bg-blue-50 dark:bg-blue-900/10 text-blue-300 dark:text-blue-800 cursor-not-allowed'
                                                : 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900/70 text-blue-700 dark:text-blue-300 cursor-pointer'
                                        }`}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <motion.svg
                                                    width={isMinimized ? (isMobile ? "14" : "16") : "18"} height={isMinimized ? (isMobile ? "14" : "16") : "18"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                >
                                                    <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                                                </motion.svg>
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <motion.svg 
                                                    animate={{ 
                                                        width: isMinimized ? (isMobile ? 14 : 16) : 18, 
                                                        height: isMinimized ? (isMobile ? 14 : 16) : 18 
                                                    }} 
                                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                                >
                                                    <path d="M22 2L11 13" />
                                                    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                                                </motion.svg>
                                                Submit Assignment
                                            </>
                                        )}
                                    </motion.button>
                                </motion.div>
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
