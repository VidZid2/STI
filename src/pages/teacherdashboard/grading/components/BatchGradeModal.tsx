import React, { useState } from 'react';
import { motion } from 'motion/react';

const BatchGradeModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    selectedCount: number;
    maxPoints: number;
    onApply: (score: number, feedback: string) => void;
}> = ({ isOpen, onClose, selectedCount, maxPoints, onApply }) => {
    const [score, setScore] = useState('');
    const [feedback, setFeedback] = useState('');

    if (!isOpen) return null;

    const handleApply = () => {
        onApply(parseInt(score) || 0, feedback);
        setScore('');
        setFeedback('');
        onClose();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-[100]"
            style={{ background: 'rgba(15, 23, 42, 0.5)' }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                className="w-[400px] rounded-2xl overflow-hidden"
                style={{ background: 'var(--bg-surface)', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
            >
                {/* Header */}
                <div className="px-5 py-5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <h3 className="text-base font-semibold m-0" style={{ color: 'var(--text-primary)' }}>Batch Grade</h3>
                    <p className="text-[13px] mt-1 m-0" style={{ color: 'var(--text-secondary)' }}>
                        Apply the same grade to {selectedCount} selected submissions
                    </p>
                </div>

                {/* Body */}
                <div className="p-5">
                    {/* Score input */}
                    <div className="mb-4">
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                            Score
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number" min="0" max={maxPoints}
                                value={score} onChange={(e) => setScore(e.target.value)}
                                placeholder="0"
                                className="flex-1 px-3 py-2.5 text-base font-semibold rounded-lg outline-none"
                                style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                            />
                            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>/ {maxPoints}</span>
                        </div>
                    </div>

                    {/* Feedback textarea */}
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                            Feedback (optional)
                        </label>
                        <textarea
                            value={feedback} onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Common feedback for all selected..."
                            className="w-full min-h-[80px] px-3 py-2.5 text-[13px] rounded-lg outline-none resize-y font-[inherit]"
                            style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 px-5 py-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={onClose}
                        className="px-4 py-2.5 rounded-lg text-[13px] font-medium cursor-pointer"
                        style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
                    >
                        Cancel
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={handleApply}
                        disabled={!score}
                        className="px-4 py-2.5 rounded-lg text-[13px] font-semibold"
                        style={{
                            border: 'none',
                            background: score ? 'linear-gradient(135deg, var(--accent-primary) 0%, #2563eb 100%)' : 'var(--bg-surface-alt)',
                            color: score ? '#ffffff' : 'var(--text-muted)',
                            cursor: score ? 'pointer' : 'not-allowed',
                        }}
                    >
                        Apply to {selectedCount}
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default BatchGradeModal;
