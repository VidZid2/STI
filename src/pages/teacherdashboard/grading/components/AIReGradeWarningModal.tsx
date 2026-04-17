import { motion, AnimatePresence } from 'motion/react';

interface AIReGradeWarningModalProps {
    show: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const AIReGradeWarningModal: React.FC<AIReGradeWarningModalProps> = ({ show, onConfirm, onCancel }) => (
    <AnimatePresence>
        {show && (
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 flex items-center justify-center z-[999999] p-5 backdrop-blur-sm"
                style={{ background: 'rgba(15,23,42,0.6)' }}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 10 }}
                    className="w-full max-w-[400px] rounded-2xl overflow-hidden"
                    style={{ background: 'var(--bg-surface)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
                >
                    <div className="p-6" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center"
                                style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                            </div>
                            <h3 className="m-0 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Overwrite Grade?</h3>
                        </div>
                        <p className="m-0 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            This student's submission has already been graded or has a score assigned.
                            <br /><br />
                            Are you sure you want to run the AI Grader again? This will use another API request and overwrite the current suggestion.
                        </p>
                    </div>
                    <div className="flex justify-center gap-3 px-6 py-4" style={{ background: 'var(--bg-canvas)' }}>
                        <motion.button
                            whileHover={{ scale: 1.02, boxShadow: '0 6px 20px rgba(100,116,139,0.15)' }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onCancel}
                            className="flex items-center justify-center px-4 py-2 rounded-[10px] text-[13px] font-semibold cursor-pointer"
                            style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
                        >
                            Cancel
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02, boxShadow: '0 6px 20px rgba(59,130,246,0.4)' }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onConfirm}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-semibold cursor-pointer text-white"
                            style={{ background: 'var(--accent-primary)', border: '1px solid var(--accent-primary)' }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Re-grade
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);

export default AIReGradeWarningModal;
