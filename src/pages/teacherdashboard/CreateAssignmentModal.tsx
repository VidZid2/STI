/**
 * Create Assignment Modal - Detailed form for teachers to create assignments
 * Professional minimalistic design matching the app's design system
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { useResponsive } from './hooks';
import { useFocusTrap } from './hooks';

import { AIAssistantPanel } from './assignment/components';
import { DetailsTab, SettingsTab, AttachmentsTab, RubricTab, PreviewTab } from './assignment/components/tabs';
import { useSystemConfig } from '../../contexts/SystemConfigContext';
import type { CreateAssignmentModalProps } from './assignment/types';
import { useAssignmentForm } from './assignment/useAssignmentForm';
import { AssignmentFormProvider } from './assignment/AssignmentFormContext';

const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({ isOpen, onClose, onSubmit, onReopen }) => {
    // Responsive state for mobile compatibility
    const { isMobile, isSmallMobile } = useResponsive();
    const { systemConfig } = useSystemConfig();
    const focusTrapRef = useFocusTrap(isOpen);

    const {
        activeTab, setActiveTab,
        scrollContainerRef, scrollPositionsRef,
        formData, updateFormData,
        isSubmitting, handleSubmit,
        courses, loadingCourses,
        recentAssignments, loadingRecentAssignments,
        availableSections, availablePrerequisites, otherCourses,
        aiChatOpen, setAiChatOpen,
        aiMessages, aiInput, setAiInput,
        aiLoading, aiApplied, aiInstructionsLoading, setAiInstructionsLoading,
        aiChatEndRef, aiInputRef, aiConfigured,
        handleAISend, resetAIChat,
    } = useAssignmentForm(isOpen, onClose, onSubmit);

    const tabs = [
        {
            id: 'details', label: 'Details', icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
            )
        },
        {
            id: 'rubric', label: 'Rubric', icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="3" y1="15" x2="21" y2="15" />
                    <line x1="9" y1="3" x2="9" y2="21" />
                </svg>
            )
        },
        {
            id: 'settings', label: 'Settings', icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
            )
        },
        {
            id: 'attachments', label: 'Attachments', icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
            )
        },
        {
            id: 'preview', label: 'Preview', icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                </svg>
            )
        },
    ];


    return createPortal(
        <AssignmentFormProvider value={{
            formData, updateFormData,
            isSubmitting, handleSubmit,
            isMobile, isSmallMobile,
            courses, loadingCourses,
            recentAssignments, loadingRecentAssignments,
            availableSections, availablePrerequisites, otherCourses,
            activeTab, setActiveTab,
            aiInstructionsLoading, setAiInstructionsLoading,
            handleAISend,
        }}>
        <>
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-[4px] z-[9998]"
                        />

                        {/* Modal Container */}
                        <div style={{
                            position: 'fixed',
                            inset: 0,
                            display: 'flex',
                            alignItems: isMobile ? 'stretch' : 'center',
                            justifyContent: 'center',
                            zIndex: 9999,
                            pointerEvents: 'none',
                            padding: isMobile ? 0 : '20px',
                        }}>
                            <motion.div
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="create-assignment-modal-title"
                                ref={focusTrapRef}
                                initial={{ opacity: 0, scale: isMobile ? 1 : 0.95, y: isMobile ? '100%' : 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: isMobile ? 1 : 0.95, y: isMobile ? '100%' : 20 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                style={{
                                    width: '100%',
                                    maxWidth: isMobile ? '100%' : (aiChatOpen ? '1300px' : '900px'),
                                    height: isMobile ? '100%' : 'auto',
                                    maxHeight: isMobile ? '100%' : '90vh',
                                    background: 'var(--bg-surface)',
                                    borderRadius: isMobile ? 0 : '20px',
                                    boxShadow: isMobile ? 'none' : '0 24px 48px rgba(0, 0, 0, 0.15)',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'row',
                                    pointerEvents: 'auto',
                                    position: 'relative',
                                    transition: 'max-width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                }}
                            >
                                {/* AI Side Panel */}
                                {systemConfig.ai_enabled && (
                                    <AIAssistantPanel
                                    isMobile={isMobile}
                                    aiChatOpen={aiChatOpen}
                                    setAiChatOpen={setAiChatOpen}
                                    aiMessages={aiMessages}
                                    aiInput={aiInput}
                                    setAiInput={setAiInput}
                                    aiLoading={aiLoading}
                                    aiApplied={aiApplied}
                                    aiChatEndRef={aiChatEndRef}
                                    aiInputRef={aiInputRef}
                                    handleAISend={handleAISend}
                                    formData={formData}
                                    courses={courses}
                                />
                                )}

                                {/* Right Side - Main Form */}
                                <div className={`flex-1 flex flex-col min-w-0 relative ${isMobile ? 'max-h-full' : 'max-h-[90vh]'}`}>
                                    {/* AI Generating Overlay hoisted to Right Side form level */}
                                    <AnimatePresence>
                                        {aiLoading && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.5, ease: 'easeInOut' }}
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    zIndex: 100, // Very high! Covers form content, header, and tabs
                                                    background: 'var(--bg-surface)',
                                                    backdropFilter: 'blur(6px)',
                                                    WebkitBackdropFilter: 'blur(6px)',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '20px',
                                                    borderRadius: isMobile ? 0 : (aiChatOpen ? '0 20px 20px 0' : '20px'),
                                                }}
                                            >
                                                {/* Skeleton lines to simulate form being built */}
                                                <div className="w-4/5 max-w-[360px] flex flex-col gap-3.5">
                                                    {[100, 75, 90, 60, 85, 70, 55].map((w, i) => (
                                                        <motion.div
                                                            key={i}
                                                            animate={{ opacity: [0.3, 0.6, 0.3] }}
                                                            transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.15 }}
                                                            style={{
                                                                height: i === 0 ? '14px' : '10px',
                                                                width: `${w}%`,
                                                                borderRadius: '6px',
                                                                background: i === 0 ? 'linear-gradient(90deg, var(--border-strong), var(--text-secondary), var(--border-strong))' : 'linear-gradient(90deg, var(--bg-surface-alt), var(--border-subtle), var(--bg-surface-alt))',
                                                                backgroundSize: '200% 100%',
                                                                animation: 'shimmer 2s ease-in-out infinite',
                                                            }}
                                                        />
                                                    ))}
                                                </div>

                                                {/* Spinning icon + text */}
                                                <div className="flex items-center gap-2.5 mt-1">
                                                    <motion.div
                                                        animate={{ rotate: 360 }}
                                                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                                                    >
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke='var(--text-secondary)' strokeWidth="2">
                                                            <circle cx="12" cy="12" r="3" />
                                                            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                                                        </svg>
                                                    </motion.div>
                                                    <motion.span
                                                        animate={{ opacity: [0.5, 1, 0.5] }}
                                                        transition={{ duration: 2, repeat: Infinity }}
                                                        className="text-[13px] font-medium text-[var(--text-secondary)] tracking-[0.01em]"
                                                    >
                                                        AI is generating your assignment...
                                                    </motion.span>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Header */}
                                    <div className={`flex items-center border-[rgba(0,0,0,0.06)] border-b ${isMobile ? 'p-4 gap-3' : 'p-[20px_24px] gap-4'}`}>
                                        <div className={`flex items-center justify-center shrink-0 bg-[var(--accent-bg)] border border-[var(--border-subtle)] text-[var(--accent-primary)] ${isMobile ? 'w-10 h-10 rounded-[10px]' : 'w-12 h-12 rounded-[14px]'}`}>
                                            <svg width={isMobile ? "20" : "24"} height={isMobile ? "20" : "24"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                <polyline points="14 2 14 8 20 8" />
                                                <line x1="12" y1="18" x2="12" y2="12" />
                                                <line x1="9" y1="15" x2="15" y2="15" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h2 id="create-assignment-modal-title" className={`m-0 font-semibold text-[var(--text-primary)] ${isMobile ? 'text-base' : 'text-lg'}`}>
                                                Create New Assignment
                                            </h2>
                                            {!isSmallMobile && (
                                                <p className="m-0 mt-1 text-[13px] text-[var(--text-secondary)] whitespace-nowrap overflow-hidden text-ellipsis">
                                                    Fill in the details to create a new assignment for your students
                                                </p>
                                            )}
                                        </div>
                                        {/* AI Button in Header */}
                                        {aiConfigured && !isMobile && systemConfig.ai_enabled && (
                                            <motion.button
                                                whileHover={{
                                                    scale: 1.03,
                                                    boxShadow: '0 2px 16px var(--ring-focus)',
                                                    color: 'var(--accent-primary)',
                                                }}
                                                whileTap={{ scale: 0.97 }}
                                                onClick={() => { setAiChatOpen(!aiChatOpen); if (!aiChatOpen) resetAIChat(); }}
                                                style={{
                                                    padding: '7px 14px',
                                                    borderRadius: '10px',
                                                    border: aiChatOpen ? '1.5px solid var(--ring-focus)' : '1px solid var(--border-subtle)',
                                                    background: aiChatOpen ? 'var(--accent-bg)' : 'transparent',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    color: 'var(--accent-primary)',
                                                    flexShrink: 0,
                                                    transition: 'color 0.2s ease',
                                                }}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                </svg>
                                                {aiChatOpen ? 'Close AI' : 'Create with AI'}
                                            </motion.button>
                                        )}
                                        <motion.button
                                            whileHover={{ scale: 1.1, background: 'rgba(0,0,0,0.08)' }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={onClose}
                                            style={{
                                                width: isMobile ? '32px' : '36px',
                                                height: isMobile ? '32px' : '36px',
                                                borderRadius: '10px',
                                                border: 'none',
                                                background: 'rgba(0,0,0,0.04)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'var(--text-secondary)',
                                                flexShrink: 0,
                                            }}
                                        >
                                            <svg width={isMobile ? "16" : "18"} height={isMobile ? "16" : "18"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="18" y1="6" x2="6" y2="18" />
                                                <line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                        </motion.button>
                                    </div>


                                    {/* Tabs */}
                                    <div className={`flex gap-1 border-b border-[rgba(0,0,0,0.06)] [scrollbar-width:none] [-ms-overflow-style:none] ${isMobile ? 'px-3 justify-start overflow-x-auto [webkit-overflow-scrolling:touch]' : 'px-6 justify-center overflow-x-visible'}`}>
                                        {tabs.map((tab) => {
                                            const tabAccent = 'var(--accent-primary)';
                                            return (
                                                <motion.button
                                                    key={tab.id}
                                                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                                    whileHover={{ background: activeTab === tab.id ? 'var(--accent-bg)' : 'var(--bg-surface-alt)' }}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: isMobile ? '6px' : '8px',
                                                        padding: isMobile ? '12px 10px' : '14px 16px',
                                                        border: 'none',
                                                        background: 'transparent',
                                                        cursor: 'pointer',
                                                        fontSize: isMobile ? '12px' : '13px',
                                                        fontWeight: 500,
                                                        color: activeTab === tab.id ? tabAccent : 'var(--text-secondary)',
                                                        borderBottom: `2px solid ${activeTab === tab.id ? tabAccent : 'transparent'}`,
                                                        marginBottom: '-1px',
                                                        transition: 'all 0.2s ease',
                                                        whiteSpace: 'nowrap',
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {tab.icon}
                                                    {!isSmallMobile && tab.label}
                                                    {tab.id === 'attachments' && formData.attachments.length > 0 && (
                                                        <span style={{
                                                            fontSize: '10px',
                                                            fontWeight: 600,
                                                            padding: '2px 6px',
                                                            borderRadius: '10px',
                                                            background: tabAccent,
                                                            color: '#fff',
                                                        }}>
                                                            {formData.attachments.length}
                                                        </span>
                                                    )}
                                                    {tab.id === 'rubric' && formData.rubricCriteria.length > 0 && (
                                                        <motion.span
                                                            initial={{ scale: 0.8, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            style={{
                                                                fontSize: '10px',
                                                                fontWeight: 600,
                                                                padding: '3px 8px',
                                                                borderRadius: '8px',
                                                                background: 'var(--accent-bg)',
                                                                color: tabAccent,
                                                                border: '1px solid var(--ring-focus)',
                                                            }}>
                                                            {formData.rubricCriteria.length}
                                                        </motion.span>
                                                    )}
                                                    {tab.id === 'rubric' && formData.rubricEnabled && formData.rubricCriteria.length === 0 && (
                                                        <motion.span
                                                            initial={{ scale: 0, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            style={{
                                                                width: '8px',
                                                                height: '8px',
                                                                borderRadius: '50%',
                                                                background: 'var(--accent-primary)',
                                                                boxShadow: '0 0 6px var(--ring-focus)',
                                                            }}
                                                        />
                                                    )}
                                                </motion.button>
                                            );
                                        })}
                                    </div>

                                    {/* Content */}
                                    <div
                                        ref={scrollContainerRef}
                                        onScroll={(e) => {
                                            scrollPositionsRef.current[activeTab] = (e.currentTarget as HTMLDivElement).scrollTop;
                                        }}
                                        className="flex-1 overflow-auto p-6 relative">
                                        <AnimatePresence mode="wait">
                                            {activeTab === 'details' && (
                                                <DetailsTab />
                                            )}

                                            {activeTab === 'settings' && (
                                                <SettingsTab />
                                            )}

                                            {activeTab === 'attachments' && (
                                                <AttachmentsTab />
                                            )}

                                            {activeTab === 'rubric' && (
                                                <RubricTab />
                                            )}

                                            {activeTab === 'preview' && (
                                                <PreviewTab />
                                            )}

                                        </AnimatePresence>
                                    </div>

                                            {/* Footer */}
                                    <div className="p-[16px_24px] border-t border-[rgba(0,0,0,0.06)] flex items-center justify-between bg-[rgba(0,0,0,0.02)]">
                                        <div className="text-xs text-[var(--text-muted)]">
                                            {formData.title && formData.course && formData.dueDate ? (
                                                <span className="text-[var(--accent-primary)]">✓ Ready to publish</span>
                                            ) : (
                                                <span>Fill in required fields to publish</span>
                                            )}
                                        </div>
                                        <div className="flex gap-3">
                                            {/* Cancel */}
                                            <motion.button
                                                className="dashboard-btn"
                                                whileHover={{
                                                    scale: 1.02,
                                                    boxShadow: '0 0 12px var(--ring-focus), 0 8px 20px var(--accent-bg)',
                                                    borderColor: 'var(--accent-primary)',
                                                }}
                                                whileTap={{ scale: 0.98 }}
                                                transition={{ duration: 0.15, ease: 'easeOut' }}
                                                onClick={onClose}
                                                style={{
                                                    padding: '10px 24px',
                                                    borderRadius: '12px',
                                                    border: '1.5px solid var(--border-strong)',
                                                    background: 'var(--accent-bg)',
                                                    cursor: 'pointer',
                                                    fontSize: '13px',
                                                    fontWeight: 600,
                                                    color: 'var(--accent-primary)',
                                                    letterSpacing: '0.02em',
                                                    transition: 'all 0.15s ease-out',
                                                }}
                                            >
                                                Cancel
                                            </motion.button>

                                            {/* Create Assignment */}
                                            <motion.button
                                                className="dashboard-btn"
                                                whileHover={(!formData.title || !formData.course || !formData.dueDate || isSubmitting || aiLoading) ? {} : {
                                                    scale: 1.02,
                                                    boxShadow: '0 0 14px var(--ring-focus), 0 8px 24px var(--accent-bg)',
                                                    borderColor: 'var(--accent-primary)',
                                                }}
                                                whileTap={{ scale: 0.98 }}
                                                transition={{ duration: 0.15, ease: 'easeOut' }}
                                                onClick={handleSubmit}
                                                disabled={!formData.title || !formData.course || !formData.dueDate || isSubmitting || aiLoading}
                                                style={{
                                                    padding: '10px 28px',
                                                    borderRadius: '12px',
                                                    border: `1.5px solid ${(!formData.title || !formData.course || !formData.dueDate || isSubmitting || aiLoading) ? 'var(--border-subtle)' : 'var(--border-strong)'}`,
                                                    background: 'var(--accent-bg)',
                                                    cursor: (!formData.title || !formData.course || !formData.dueDate || isSubmitting || aiLoading) ? 'not-allowed' : 'pointer',
                                                    fontSize: '13px',
                                                    fontWeight: 600,
                                                    color: (!formData.title || !formData.course || !formData.dueDate || isSubmitting || aiLoading)
                                                        ? 'var(--text-secondary)'
                                                        : 'var(--accent-primary)',
                                                    letterSpacing: '0.02em',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    opacity: (!formData.title || !formData.course || !formData.dueDate || isSubmitting || aiLoading) ? 0.5 : 1,
                                                    transition: 'all 0.15s ease-out',
                                                }}
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <motion.div
                                                            animate={{ rotate: 360 }}
                                                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                            style={{
                                                                width: '14px',
                                                                height: '14px',
                                                                border: '2px solid rgba(236, 72, 153, 0.3)',
                                                                borderTopColor: '#ec4899',
                                                                borderRadius: '50%',
                                                            }}
                                                        />
                                                        Creating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                        Create Assignment
                                                    </>
                                                )}
                                            </motion.button>
                                        </div>
                                    </div>
                                </div>{/* End Right Side */}
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>

            {/* Floating Draft Indicator */}
            <AnimatePresence>
                {!isOpen && (formData.title.trim() !== '' || formData.description.trim() !== '' || formData.instructions.trim() !== '') && (
                    <motion.div
                        key="draft-indicator"
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onReopen}
                        style={{
                            position: 'fixed',
                            bottom: '24px',
                            right: '24px',
                            zIndex: 9999,
                            background: 'var(--bg-surface)',
                            borderRadius: '16px',
                            padding: '12px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                            border: '1px solid var(--border-subtle)',
                            cursor: onReopen ? 'pointer' : 'default',
                        }}
                    >
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: 'var(--accent-bg)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--accent-primary)',
                        }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                <polyline points="17 21 17 13 7 13 7 21" />
                                <polyline points="7 3 7 8 15 8" />
                            </svg>
                        </div>
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Draft Saved</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Click to continue editing</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>,
        </AssignmentFormProvider>,
        document.body
    );
};

export default CreateAssignmentModal;