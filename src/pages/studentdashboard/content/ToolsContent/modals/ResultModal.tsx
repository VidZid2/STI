/**
 * ResultModal
 * Analysis result display modal.
 * Extracted from ToolsContent.tsx during Phase 8.7
 */
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { useModalAccessibility } from '../../../hooks/useModalAccessibility';

export interface AnalysisResult {
    type: 'count' | 'grammar' | 'compress';
    data: any;
}

const ResultModal: React.FC<{ result: AnalysisResult | null; onClose: () => void }> = ({ result, onClose }) => {
    const { modalRef, modalProps } = useModalAccessibility(!!result, onClose, 'result-modal-title');
    if (!result) return null;

    const getTitle = () => {
        switch (result.type) {
            case 'count': return 'Text Analysis Results';
            case 'grammar': return 'Grammar Check Results';
            case 'compress': return 'Compression Results';
            default: return 'Results';
        }
    };

    return (
        createPortal(
            <AnimatePresence>
                <motion.div
                    ref={modalRef}
                    {...modalProps}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.4)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 10000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'white',
                            padding: '32px',
                            borderRadius: '24px',
                            width: '90%',
                            maxWidth: '550px',
                            maxHeight: '80vh',
                            overflowY: 'auto',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        }}
                    >
                        <h3 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '20px', color: '#111827' }}>
                            {getTitle()}
                        </h3>

                        {result.type === 'count' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div style={{ background: '#f3f4f6', padding: '16px', borderRadius: '12px' }}>
                                    <div style={{ fontSize: '28px', fontWeight: 700, color: '#2563eb' }}>{result.data.words}</div>
                                    <div style={{ fontSize: '13px', color: '#6b7280' }}>Words</div>
                                </div>
                                <div style={{ background: '#f3f4f6', padding: '16px', borderRadius: '12px' }}>
                                    <div style={{ fontSize: '28px', fontWeight: 700, color: '#2563eb' }}>{result.data.chars}</div>
                                    <div style={{ fontSize: '13px', color: '#6b7280' }}>Characters</div>
                                </div>
                                {result.data.textStats && (
                                    <>
                                        <div style={{ background: '#f3f4f6', padding: '16px', borderRadius: '12px' }}>
                                            <div style={{ fontSize: '28px', fontWeight: 700, color: '#7c3aed' }}>{result.data.textStats.sentences}</div>
                                            <div style={{ fontSize: '13px', color: '#6b7280' }}>Sentences</div>
                                        </div>
                                        <div style={{ background: '#f3f4f6', padding: '16px', borderRadius: '12px' }}>
                                            <div style={{ fontSize: '28px', fontWeight: 700, color: '#7c3aed' }}>{result.data.textStats.paragraphs}</div>
                                            <div style={{ fontSize: '13px', color: '#6b7280' }}>Paragraphs</div>
                                        </div>
                                    </>
                                )}
                                <div style={{ background: '#dbeafe', padding: '16px', borderRadius: '12px' }}>
                                    <div style={{ fontSize: '18px', fontWeight: 600, color: '#1e40af' }}>{result.data.readingTime}</div>
                                    <div style={{ fontSize: '13px', color: '#3b82f6' }}>Reading Time</div>
                                </div>
                                {result.data.textStats && (
                                    <div style={{ background: '#dbeafe', padding: '16px', borderRadius: '12px' }}>
                                        <div style={{ fontSize: '18px', fontWeight: 600, color: '#1e40af' }}>{result.data.textStats.speakingTime}</div>
                                        <div style={{ fontSize: '13px', color: '#3b82f6' }}>Speaking Time</div>
                                    </div>
                                )}
                                {result.data.textStats && result.data.textStats.topWords.length > 0 && (
                                    <div style={{ gridColumn: 'span 2', background: '#f0fdf4', padding: '16px', borderRadius: '12px' }}>
                                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#166534', marginBottom: '8px' }}>Top Keywords</div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {result.data.textStats.topWords.map((item: any, idx: number) => (
                                                <span key={idx} style={{
                                                    background: '#dcfce7',
                                                    padding: '4px 10px',
                                                    borderRadius: '16px',
                                                    fontSize: '13px',
                                                    color: '#15803d'
                                                }}>
                                                    {item.word} ({item.count})
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {result.type === 'compress' && (
                            <div style={{ display: 'grid', gap: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f3f4f6', padding: '20px', borderRadius: '12px' }}>
                                    <div>
                                        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Original Size</div>
                                        <div style={{ fontSize: '24px', fontWeight: 700, color: '#374151' }}>{result.data.originalSize}</div>
                                    </div>
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Compressed Size</div>
                                        <div style={{ fontSize: '24px', fontWeight: 700, color: '#059669' }}>{result.data.compressedSize}</div>
                                    </div>
                                </div>
                                <div style={{
                                    background: result.data.savingsPercent && result.data.savingsPercent > 0 ? '#ecfdf5' : '#fef3c7',
                                    padding: '20px',
                                    borderRadius: '12px',
                                    textAlign: 'center'
                                }}>
                                    <div style={{
                                        fontSize: '48px',
                                        fontWeight: 700,
                                        color: result.data.savingsPercent && result.data.savingsPercent > 0 ? '#059669' : '#d97706'
                                    }}>
                                        {result.data.savingsPercent}%
                                    </div>
                                    <div style={{ fontSize: '14px', color: result.data.savingsPercent && result.data.savingsPercent > 0 ? '#047857' : '#b45309' }}>
                                        {result.data.savingsPercent && result.data.savingsPercent > 0
                                            ? `Saved ${result.data.savings}`
                                            : 'File is already optimized'}
                                    </div>
                                </div>
                                <p style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center', margin: 0 }}>
                                    Your compressed file has been downloaded automatically.
                                </p>
                            </div>
                        )}

                        {result.type === 'grammar' && (
                            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                {result.data.issues && result.data.issues.length > 0 ? (
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                        {result.data.issues.map((issue: any, idx: number) => (
                                            <li key={idx} style={{ padding: '12px', background: '#fef2f2', borderRadius: '8px', marginBottom: '8px', borderLeft: '4px solid #ef4444', color: '#991b1b' }}>
                                                {issue}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '20px', color: '#059669', background: '#ecfdf5', borderRadius: '12px' }}>
                                        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <p style={{ fontWeight: 600 }}>No issues found!</p>
                                        <p style={{ fontSize: '14px' }}>Your text looks great.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            onClick={onClose}
                            style={{
                                marginTop: '24px',
                                width: '100%',
                                padding: '12px',
                                background: '#2563eb',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            Close
                        </button>
                    </motion.div>
                </motion.div>
            </AnimatePresence>,
            document.body
        )
    );
};


export { ResultModal };
