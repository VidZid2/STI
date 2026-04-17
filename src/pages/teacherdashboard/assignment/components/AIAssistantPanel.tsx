import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AISuggestionButtons, AILoadingSteps } from '../components';
import { PlaceholdersAndVanishInput } from '../../../../components/ui/aceternity/placeholders-and-vanish-input';
import { getSuggestionsForCourse } from '../constants';
import type { AssignmentFormData } from '../types';

interface AIAssistantPanelProps {
    isMobile: boolean;
    aiChatOpen: boolean;
    setAiChatOpen: (open: boolean) => void;
    aiMessages: { role: 'user' | 'assistant'; content: string }[];
    aiInput: string;
    setAiInput: (v: string) => void;
    aiLoading: boolean;
    aiApplied: boolean;
    aiChatEndRef: React.RefObject<HTMLDivElement | null>;
    aiInputRef: React.RefObject<HTMLTextAreaElement | null>;
    handleAISend: (msg?: string) => void;
    formData: Pick<AssignmentFormData, 'course'>;
    courses: { id: string; name: string }[];
}

const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
    isMobile,
    aiChatOpen, setAiChatOpen,
    aiMessages, aiInput, setAiInput,
    aiLoading, aiApplied,
    aiChatEndRef, aiInputRef,
    handleAISend,
    formData, courses,
}) => (
    <AnimatePresence>
        {aiChatOpen && !isMobile && (
            <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '380px', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                className="flex flex-col shrink-0 overflow-hidden self-stretch"
                style={{ borderRight: '1px solid var(--border-subtle)', background: 'var(--bg-canvas)' }}
            >
                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4 shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                        style={{ background: 'var(--accent-primary)', boxShadow: '0 2px 8px rgba(0,61,165,0.3)' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFC107" stroke="#FFC107" strokeWidth="2">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold" style={{ color: 'var(--accent-primary)' }}>AI Assistant</div>
                        <div className="text-[11px] mt-px" style={{ color: 'var(--text-secondary)' }}>Describe your assignment</div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.1, background: 'var(--accent-bg)' }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setAiChatOpen(false)}
                        aria-label="Close AI assistant"
                        className="w-[30px] h-[30px] rounded-lg border-none flex items-center justify-center cursor-pointer shrink-0"
                        style={{ background: 'var(--bg-surface-alt)', color: 'var(--text-secondary)' }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </motion.button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                    {aiMessages.length === 0 && (
                        <div className="text-center py-10 px-4">
                            <div className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center mx-auto mb-4"
                                style={{ background: 'var(--accent-primary)', boxShadow: '0 6px 16px rgba(0,61,165,0.3)' }}>
                                <svg width="26" height="26" viewBox="0 0 24 24" fill="#FFC107" stroke="#FFC107" strokeWidth="2">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                            </div>
                            <p className="text-[15px] font-semibold m-0 mb-1.5" style={{ color: 'var(--accent-primary)' }}>
                                Hi! I'm your AI Assistant 👋
                            </p>
                            <p className="text-xs m-0 mb-5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                Tell me what kind of assignment you want to create and I'll fill in all the details for you.
                            </p>
                            <AISuggestionButtons
                                onSelect={(text) => { setAiInput(text); setTimeout(() => aiInputRef.current?.focus(), 50); }}
                                courseName={courses.find(c => c.id === formData.course)?.name || ''}
                            />
                        </div>
                    )}

                    {aiMessages.map((msg, idx) => (
                        <motion.div key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'assistant' && (
                                <div className="w-[26px] h-[26px] rounded-lg flex items-center justify-center shrink-0 mr-2 mt-0.5"
                                    style={{ background: 'var(--accent-primary)' }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                </div>
                            )}
                            <div
                                className="max-w-[85%] px-3.5 py-2.5 text-[13px] leading-[1.5] break-words whitespace-pre-wrap"
                                style={{
                                    borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                                    background: msg.role === 'user' ? 'var(--accent-primary)' : 'var(--bg-surface)',
                                    color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                                    boxShadow: msg.role === 'user' ? '0 2px 8px rgba(0,61,165,0.25)' : '0 1px 4px rgba(0,0,0,0.06)',
                                    border: msg.role === 'user' ? 'none' : '1px solid var(--border-subtle)',
                                }}
                            >
                                {msg.content}
                            </div>
                        </motion.div>
                    ))}

                    {(aiLoading || aiApplied) && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                            className="flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all"
                            style={{
                                background: aiApplied ? 'rgba(16,185,129,0.05)' : 'var(--bg-surface)',
                                border: aiApplied ? '1px solid rgba(16,185,129,0.2)' : '1px solid var(--border-subtle)',
                            }}
                        >
                            {/* Spinner / checkmark */}
                            <div className="w-8 h-8 shrink-0 relative flex items-center justify-center">
                                {aiApplied ? (
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                                        className="flex items-center justify-center">
                                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                            <circle cx="16" cy="16" r="15" stroke="rgba(16,185,129,0.2)" strokeWidth="1.5" />
                                            <circle cx="16" cy="16" r="15" stroke="#10b981" strokeWidth="1.5" />
                                            <polyline points="10,16.5 14,20.5 22,12.5" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </motion.div>
                                ) : (
                                    <>
                                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                                            className="absolute inset-0 flex items-center justify-center">
                                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                                <circle cx="16" cy="16" r="14" stroke="var(--border-subtle)" strokeWidth="2" />
                                                <path d="M16 2 A14 14 0 0 1 30 16" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" />
                                            </svg>
                                        </motion.div>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="relative z-[1]">
                                            <path d="M12 3v2M12 19v2M5.64 5.64l1.41 1.41M16.95 16.95l1.41 1.41M3 12h2M19 12h2M5.64 18.36l1.41-1.41M16.95 7.05l1.41-1.41" />
                                            <circle cx="12" cy="12" r="1.5" fill="var(--accent-primary)" stroke="none" />
                                        </svg>
                                    </>
                                )}
                            </div>

                            {/* Text */}
                            <div className="flex-1 min-w-0">
                                {aiApplied ? (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35, delay: 0.1 }}>
                                        <div className="text-[13px] font-semibold" style={{ color: '#059669' }}>Assignment generated</div>
                                        <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>Review the form and adjust as needed</div>
                                    </motion.div>
                                ) : (
                                    <>
                                        <div className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                                            Generating
                                            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                                                className="ml-px" style={{ color: 'var(--text-muted)' }}>...</motion.span>
                                        </div>
                                        <AILoadingSteps userPrompt={aiMessages.filter(m => m.role === 'user').pop()?.content || ''} />
                                    </>
                                )}
                            </div>

                            {aiApplied && (
                                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
                                    className="text-[10px] font-semibold px-2 py-[3px] rounded-md shrink-0 tracking-[0.02em]"
                                    style={{ color: '#059669', background: 'rgba(16,185,129,0.1)' }}>
                                    ✓ Done
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    <div ref={aiChatEndRef} />
                </div>

                {/* Input */}
                <div className="px-3 py-2.5 shrink-0" style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', backdropFilter: 'blur(8px)' }}>
                    <PlaceholdersAndVanishInput
                        placeholders={(() => {
                            const selectedCourse = courses.find(c => c.id === formData.course)?.name || '';
                            const courseSuggestions = getSuggestionsForCourse(selectedCourse);
                            return aiApplied
                                ? ['Need changes? Tell me...', 'Adjust the points or deadline...', 'Add more details to the instructions...', 'Change the assignment type...']
                                : courseSuggestions.map(s => `${s.emoji} ${s.text}`);
                        })()}
                        externalValue={aiInput}
                        onValueChange={setAiInput}
                        onSubmit={(capturedValue) => { handleAISend(capturedValue); }}
                        disabled={aiLoading}
                    />
                </div>
            </motion.div>
        )}
    </AnimatePresence>
);

export default AIAssistantPanel;
