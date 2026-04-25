/**
 * CourseDetailModal
 * Detailed course information modal.
 * Extracted from CatalogContent.tsx during Phase 8.7
 */
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { useModalAccessibility } from '../../../hooks/useModalAccessibility';
import { categoryInfo, type CatalogCourse } from '../../../../../services/catalogService';
import { CategoryIcon } from '../components/CatalogShared';

// Course Detail Modal - Minimalistic Blue Design (matching Users/Goals modals)
const CourseDetailModal: React.FC<{
    course: CatalogCourse | null;
    isOpen: boolean;
    onClose: () => void;
    onEnroll: (courseId: string) => void;
}> = ({ course, isOpen, onClose, onEnroll }) => {
    const { modalRef, modalProps } = useModalAccessibility(isOpen, onClose, 'course-modal-title');
    const blueAccent = '#3b82f6';
    const blueBg = 'rgba(59, 130, 246, 0.1)';
    const blueBorder = 'rgba(59, 130, 246, 0.1)';
    
    const = {
        bg: 'var(--bg-primary)',
        cardbg: 'var(--bg-primary)',
        border: 'var(--border-light)',
        textPrimary: 'var(--text-primary)',
        textSecondary: 'var(--text-secondary)',
        textMuted: 'var(--text-muted)',
        accent: blueAccent };

    // Escape key, focus trap, body scroll lock handled by useModalAccessibility hook

    if (!course) return null;

    return createPortal(
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
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)', zIndex: 9998 }} 
                    />
                    
                    {/* Modal Container */}
                    <div 
                        ref={modalRef}
                        {...modalProps}
                        style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, pointerEvents: 'none', padding: '20px' }}
                    >
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                            animate={{ opacity: 1, scale: 1, y: 0 }} 
                            exit={{ opacity: 0, scale: 0.95, y: 20 }} 
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            style={{ 
                                width: '100%', 
                                maxWidth: '480px', 
                                maxHeight: '85vh', 
                                background: 'var(--bg-primary)', 
                                borderRadius: '20px', 
                                boxShadow: 'var(--shadow-lg)', 
                                overflow: 'hidden', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                pointerEvents: 'auto' 
                            }}
                        >
                            {/* Course Image */}
                            <div style={{ position: 'relative', height: '140px', overflow: 'hidden', flexShrink: 0 }}>
                                <img 
                                    src={course.image} 
                                    alt={course.title} 
                                    style={{ 
                                        width: '100%', 
                                        height: '100%', 
                                        objectFit: 'cover' }} 
                                />
                                <div style={{ 
                                    position: 'absolute', 
                                    inset: 0, 
                                    background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)' 
                                }} />
                                
                                {/* Close Button on Image */}
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={onClose}
                                    aria-label="Close course details"
                                    style={{
                                        position: 'absolute',
                                        top: '12px',
                                        right: '12px',
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: 'rgba(255,255,255,0.9)',
                                        backdropFilter: 'blur(8px)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#64748b' }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </motion.button>

                                {/* Category Badge on Image */}
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.15 }}
                                    style={{
                                        position: 'absolute',
                                        bottom: '12px',
                                        left: '16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: '5px 10px',
                                        borderRadius: '8px',
                                        background: 'rgba(255,255,255,0.95)',
                                        backdropFilter: 'blur(8px)',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: blueAccent }}
                                >
                                    <CategoryIcon category={course.category} size={12} />
                                    {categoryInfo[course.category].label}
                                </motion.div>

                                {/* Enrolled Badge on Image */}
                                {course.enrolled && (
                                    <motion.div
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 }}
                                        style={{
                                            position: 'absolute',
                                            bottom: '12px',
                                            right: '16px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            padding: '5px 10px',
                                            borderRadius: '8px',
                                            background: 'rgba(255,255,255,0.95)',
                                            backdropFilter: 'blur(8px)',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            color: blueAccent }}
                                    >
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                        Enrolled
                                    </motion.div>
                                )}
                            </div>

                            {/* Header */}
                            <div style={{ padding: '16px 24px', borderBottom: `1px solid var(--border-color)` }}>
                                <h2 id="course-modal-title" style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                                    {course.title}
                                </h2>
                                <p id="course-modal-description" style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                                    {course.subtitle}
                                </p>
                            </div>

                            {/* Content */}
                            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
                                {/* Stats Row - Blue themed */}
                                <div style={{ 
                                    display: 'flex', 
                                    gap: '8px', 
                                    marginBottom: '20px' 
                                }}>
                                    {[
                                        { value: course.modules, label: 'Modules', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={blueAccent} strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg> },
                                        { value: course.enrolledCount, label: 'Students', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={blueAccent} strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg> },
                                        { value: `~${course.modules * 2}h`, label: 'Duration', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={blueAccent} strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg> },
                                    ].map((stat, i) => (
                                        <motion.div
                                            key={stat.label}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.15 + i * 0.05 }}
                                            style={{
                                                flex: 1,
                                                padding: '12px',
                                                borderRadius: '12px',
                                                background: blueBg,
                                                border: `1px solid ${blueBorder}`,
                                                textAlign: 'center' }}
                                        >
                                            <div style={{ marginBottom: '4px', display: 'flex', justifyContent: 'center' }}>{stat.icon}</div>
                                            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{stat.value}</div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{stat.label}</div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Instructor - Blue themed */}
                                <motion.div 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 }}
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '12px', 
                                        padding: '12px 14px',
                                        borderRadius: '12px',
                                        background: 'var(--bg-hover)',
                                        marginBottom: '20px' }}
                                >
                                    <div style={{ 
                                        width: '40px', 
                                        height: '40px', 
                                        borderRadius: '12px', 
                                        background: `linear-gradient(135deg, ${blueAccent} 0%, #2563eb 100%)`,
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: '14px',
                                        fontWeight: 600 }}>
                                        {course.instructor.charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{course.instructor}</div>
                                        <div style={{ fontSize: '11px', color: blueAccent }}>Instructor</div>
                                    </div>
                                </motion.div>

                                {/* Description */}
                                <div style={{ marginBottom: '20px' }}>
                                    <h4 style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: blueAccent, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        About this course
                                    </h4>
                                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                        {course.description}
                                    </p>
                                </div>

                                {/* Learning Outcomes - Blue checkmarks */}
                                <div style={{ marginBottom: '20px' }}>
                                    <h4 style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: blueAccent, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        What you'll learn
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {course.learningOutcomes.map((outcome, i) => (
                                            <motion.div 
                                                key={i} 
                                                initial={{ opacity: 0, x: -10 }} 
                                                animate={{ opacity: 1, x: 0 }} 
                                                transition={{ delay: 0.35 + i * 0.05 }} 
                                                style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}
                                            >
                                                <div style={{
                                                    width: '18px',
                                                    height: '18px',
                                                    borderRadius: '6px',
                                                    background: blueBg,
                                                    border: `1px solid ${blueBorder}`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                    marginTop: '1px' }}>
                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={blueAccent} strokeWidth="3">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                </div>
                                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{outcome}</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                {/* Tags - Blue themed */}
                                {course.tags.length > 0 && (
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: blueAccent, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Topics
                                        </h4>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            {course.tags.map((tag, i) => (
                                                <motion.span 
                                                    key={tag} 
                                                    initial={{ opacity: 0, scale: 0.8 }} 
                                                    animate={{ opacity: 1, scale: 1 }} 
                                                    transition={{ delay: 0.4 + i * 0.03 }}
                                                    style={{ 
                                                        padding: '5px 10px', 
                                                        borderRadius: '8px', 
                                                        background: blueBg,
                                                        border: `1px solid ${blueBorder}`,
                                                        fontSize: '11px', 
                                                        fontWeight: 500,
                                                        color: blueAccent }}
                                                >
                                                    {tag}
                                                </motion.span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer - Blue button */}
                            <div style={{ padding: '16px 24px', borderTop: `1px solid var(--border-color)` }}>
                                <motion.button 
                                    whileHover={{ scale: 1.02 }} 
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => course.enrolled ? onClose() : onEnroll(course.id)}
                                    style={{ 
                                        width: '100%',
                                        padding: '12px', 
                                        borderRadius: '12px', 
                                        border: 'none', 
                                        background: `linear-gradient(135deg, ${blueAccent} 0%, #2563eb 100%)`,
                                        color: 'white', 
                                        fontSize: '14px', 
                                        fontWeight: 600, 
                                        cursor: 'pointer', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        gap: '8px',
                                        boxShadow: `0 4px 12px ${blueAccent}30` }}
                                >
                                    {course.enrolled ? (
                                        <>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                                            Continue Learning
                                        </>
                                    ) : (
                                        <>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                            Enroll Now
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};



export { CourseDetailModal };
export default CourseDetailModal;
