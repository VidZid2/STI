/**
 * CourseCard + CourseListItem
 * Course display components for CatalogContent.
 * Extracted from CatalogContent.tsx during Phase 8.7
 */
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { categoryInfo, type CatalogCourse } from '../../../../../services/catalogService';
import { CategoryIcon } from './CatalogShared';

// Course Card Component - Minimalistic Blue Design inspired by Home CourseCard
const CourseCard: React.FC<{
    course: CatalogCourse;
    index: number;
    
    onClick: (course: CatalogCourse) => void;
    isBookmarked: boolean;
    onToggleBookmark: (courseId: string) => void;
}> = ({ course, index,  onClick, isBookmarked, onToggleBookmark }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [instructorHovered, setInstructorHovered] = useState(false);
    const [bookmarkHovered, setBookmarkHovered] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [previewPosition, setPreviewPosition] = useState({ top: 0, left: 0 });
    const cardRef = useRef<HTMLDivElement>(null);
    const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    // Blue color scheme
    const blueAccent = '#3b82f6';
    const blueBg = 'rgba(59, 130, 246, 0.1)';
    const blueBorder = 'rgba(59, 130, 246, 0.1)';

    // Show preview after a delay on hover
    useEffect(() => {
        if (isHovered && !instructorHovered && !bookmarkHovered) {
            previewTimeoutRef.current = setTimeout(() => {
                if (cardRef.current) {
                    const rect = cardRef.current.getBoundingClientRect();
                    setPreviewPosition({
                        top: rect.bottom + window.scrollY + 8,
                        left: rect.left + rect.width / 2 + window.scrollX });
                }
                setShowPreview(true);
            }, 600);
        } else {
            if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
            setShowPreview(false);
        }
        return () => { if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current); };
    }, [isHovered, instructorHovered, bookmarkHovered]);
    
    return (
        <motion.div
            ref={cardRef}
            layout
            layoutId={`catalog-course-${course.id}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ 
                layout: { type: 'spring', stiffness: 350, damping: 30 },
                opacity: { duration: 0.2 },
                scale: { duration: 0.2 }
            }}
            whileHover={{ y: -4, transition: { duration: 0.15, ease: 'easeOut' } }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            onClick={() => onClick(course)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(course); } }}
            role="article"
            aria-label={`${course.title} - ${course.subtitle}. ${course.modules} modules, ${course.enrolledCount} students enrolled. ${course.enrolled ? 'You are enrolled.' : ''} Instructor: ${course.instructor}`}
            tabIndex={0}
            style={{
                position: 'relative',
                background: 'var(--dashboard-surface)',
                borderRadius: '16px',
                border: `1px solid ${isHovered ? blueBorder : 'var(--border-color)'}`,
                overflow: 'visible',
                cursor: 'pointer',
                boxShadow: isHovered 
                    ? ('0 8px 30px rgba(59, 130, 246, 0.1)')
                    : ('0 2px 8px rgba(0,0,0,0.06)'),
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                outline: 'none' }}
            onFocus={() => setIsHovered(true)}
            onBlur={() => setIsHovered(false)}
        >
            {/* Course Image */}
            <div style={{ position: 'relative', height: '140px', overflow: 'hidden' }}>
                <div style={{
                    transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                    transition: 'transform 0.2s ease-out',
                    width: '100%',
                    height: '100%' }}>
                    <img 
                        src={course.image} 
                        alt={course.title} 
                        style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover',
                            opacity: imageLoaded ? 1 : 0,
                            transition: 'opacity 0.2s ease-out' }}
                        onLoad={() => setImageLoaded(true)}
                    />
                    {!imageLoaded && (
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'var(--text-muted)' }} />
                    )}
                </div>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)' }} />
                
                {/* Instructor Avatar */}
                <div
                    style={{ position: 'absolute', bottom: '10px', left: '10px' }}
                    onMouseEnter={() => setInstructorHovered(true)}
                    onMouseLeave={() => setInstructorHovered(false)}
                >
                    <motion.div
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid rgba(255,255,255,0.9)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
                        whileHover={{ scale: 1.05 }}
                    >
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>
                            {course.instructor.charAt(0).toUpperCase()}
                        </span>
                    </motion.div>
                    
                    {/* Instructor Tooltip */}
                    <div style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '0',
                        marginBottom: '8px',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        background: 'var(--bg-secondary)',
                        border: `1px solid var(--border-color)`,
                        boxShadow: 'var(--shadow-lg)',
                        opacity: instructorHovered ? 1 : 0,
                        transform: instructorHovered ? 'translateY(0)' : 'translateY(4px)',
                        transition: 'opacity 0.15s ease, transform 0.15s ease',
                        pointerEvents: instructorHovered ? 'auto' : 'none',
                        whiteSpace: 'nowrap',
                        zIndex: 10 }}>
                        <div style={{ fontSize: '9px', fontWeight: 500, color: blueAccent, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Instructor</div>
                        <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>{course.instructor}</div>
                    </div>
                </div>
                
                {/* Category Badge - Blue themed */}
                <motion.div 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: Math.min(index * 0.03, 0.15) + 0.1 }}
                    style={{ 
                        position: 'absolute', 
                        top: '10px', 
                        right: '10px', 
                        padding: '5px 10px', 
                        borderRadius: '8px', 
                        background: 'rgba(255,255,255,0.95)', 
                        backdropFilter: 'blur(8px)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '5px',
                        border: `1px solid ${blueBorder}` }}
                >
                    <div style={{ color: blueAccent }}><CategoryIcon category={course.category} size={11} /></div>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: blueAccent }}>{categoryInfo[course.category].label}</span>
                </motion.div>

                {/* Bookmark Button */}
                <div
                    style={{ position: 'absolute', top: '10px', left: '10px' }}
                    onMouseEnter={() => setBookmarkHovered(true)}
                    onMouseLeave={() => setBookmarkHovered(false)}
                >
                    <motion.button
                        onClick={(e) => { e.stopPropagation(); onToggleBookmark(course.id); }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        aria-label={isBookmarked ? 'Remove from favorites' : 'Add to favorites'}
                        style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'rgba(255,255,255,0.95)',
                            backdropFilter: 'blur(8px)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                    >
                        <svg 
                            width="14" 
                            height="14" 
                            viewBox="0 0 24 24" 
                            fill={isBookmarked ? blueAccent : 'none'} 
                            stroke={blueAccent} 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                        >
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                        </svg>
                    </motion.button>
                    
                    {/* Bookmark Tooltip */}
                    <AnimatePresence>
                        {bookmarkHovered && (
                            <motion.div
                                initial={{ opacity: 0, y: 4, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 4, scale: 0.95 }}
                                transition={{ duration: 0.15, ease: 'easeOut' }}
                                style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: '0',
                                    marginTop: '6px',
                                    padding: '6px 10px',
                                    borderRadius: '8px',
                                    background: 'white',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    whiteSpace: 'nowrap',
                                    zIndex: 20,
                                    fontSize: '11px',
                                    fontWeight: 500,
                                    color: blueAccent }}
                            >
                                {isBookmarked ? 'Remove from favorites' : 'Add to favorites'}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Card Body */}
            <div style={{ padding: '14px 16px' }}>
                {/* Title Section */}
                <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                        <h3 style={{ 
                            margin: 0, 
                            fontSize: '14px', 
                            fontWeight: 600, 
                            color: 'var(--text-primary)', 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap',
                            flex: 1 }}>
                            {course.title}
                        </h3>
                        {course.enrolled && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.8 }} 
                                animate={{ opacity: 1, scale: 1 }} 
                                transition={{ delay: Math.min(index * 0.03, 0.15) + 0.15, type: 'spring', stiffness: 400 }}
                                style={{ 
                                    padding: '3px 8px', 
                                    borderRadius: '6px', 
                                    background: blueBg,
                                    border: `1px solid ${blueBorder}`,
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '4px',
                                    flexShrink: 0 }}
                            >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={blueAccent} strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                <span style={{ fontSize: '9px', fontWeight: 600, color: blueAccent }}>Enrolled</span>
                            </motion.div>
                        )}
                    </div>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>{course.subtitle}</p>
                </div>

                {/* Stats Section - Blue themed */}
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: blueBg,
                    marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={blueAccent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{course.modules}</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>modules</span>
                    </div>
                    <div style={{ width: '1px', height: '16px', background: 'var(--border-color)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={blueAccent} strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                        </svg>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{course.enrolledCount}</span>
                    </div>
                </div>

                {/* Action Button */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                        width: '100%',
                        padding: '10px 16px',
                        borderRadius: '10px',
                        border: 'none',
                        background: isHovered ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : blueBg,
                        color: isHovered ? 'white' : blueAccent,
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease' }}
                    onClick={(e) => { e.stopPropagation(); onClick(course); }}
                >
                    <span>{course.enrolled ? 'Continue' : 'View Course'}</span>
                    <motion.svg 
                        width="14" 
                        height="14" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                        animate={{ x: isHovered ? 2 : 0 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                    >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                    </motion.svg>
                </motion.button>
            </div>

            {/* Quick Preview Tooltip - Rendered via Portal */}
            {createPortal(
                <AnimatePresence>
                    {showPreview && (
                        <motion.div
                            initial={{ opacity: 0, y: 12, scale: 0.92 }}
                            animate={{ 
                                opacity: 1, 
                                y: 0, 
                                scale: 1,
                                transition: {
                                    type: 'spring',
                                    stiffness: 400,
                                    damping: 25,
                                    mass: 0.8,
                                    opacity: { duration: 0.2, ease: 'easeOut' }
                                }
                            }}
                            exit={{ 
                                opacity: 0, 
                                y: 8, 
                                scale: 0.95,
                                transition: {
                                    duration: 0.15,
                                    ease: [0.4, 0, 1, 1]
                                }
                            }}
                            style={{
                                position: 'absolute',
                                top: previewPosition.top,
                                left: previewPosition.left,
                                transform: 'translateX(-50%)',
                                width: '280px',
                                padding: '14px',
                                borderRadius: '14px',
                                background: 'var(--bg-secondary)',
                                border: `1px solid ${blueBorder}`,
                                boxShadow: 'var(--shadow-lg)',
                                zIndex: 9999,
                                pointerEvents: 'none' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Preview Header */}
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '6px', 
                                marginBottom: '10px',
                                paddingBottom: '10px',
                                borderBottom: `1px solid var(--border-color)` }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={blueAccent} strokeWidth="2" aria-hidden="true">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 16v-4M12 8h.01" />
                                </svg>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: blueAccent, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Quick Preview
                                </span>
                            </div>

                            {/* Description */}
                            <p style={{ 
                                margin: 0, 
                                fontSize: '12px', 
                                color: 'var(--text-secondary)', 
                                lineHeight: 1.5,
                                marginBottom: '12px',
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden' }}>
                                {course.description}
                            </p>

                            {/* Learning Outcomes Preview */}
                            {course.learningOutcomes.length > 0 && (
                                <div style={{ marginBottom: '12px' }}>
                                    <div style={{ fontSize: '10px', fontWeight: 600, color: blueAccent, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                        What you'll learn
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {course.learningOutcomes.slice(0, 2).map((outcome, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={blueAccent} strokeWidth="2.5" style={{ marginTop: '3px', flexShrink: 0 }}>
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>{outcome}</span>
                                            </div>
                                        ))}
                                        {course.learningOutcomes.length > 2 && (
                                            <span style={{ fontSize: '10px', color: blueAccent, fontWeight: 500 }}>
                                                +{course.learningOutcomes.length - 2} more...
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Tags */}
                            {course.tags.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                    {course.tags.slice(0, 3).map((tag) => (
                                        <span 
                                            key={tag}
                                            style={{ 
                                                padding: '3px 8px', 
                                                borderRadius: '6px', 
                                                background: blueBg,
                                                fontSize: '10px', 
                                                fontWeight: 500,
                                                color: blueAccent }}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Click hint */}
                            <div style={{ 
                                marginTop: '10px', 
                                paddingTop: '10px', 
                                borderTop: `1px solid var(--border-color)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={'var(--text-muted)'} strokeWidth="2">
                                    <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                                </svg>
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Click to view full details</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </motion.div>
    );
};



// Course List Item Component - For List View
const CourseListItem: React.FC<{
    course: CatalogCourse;
    index: number;
    
    onClick: (course: CatalogCourse) => void;
    isBookmarked: boolean;
    onToggleBookmark: (courseId: string) => void;
}> = ({ course, index,  onClick, isBookmarked, onToggleBookmark }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [previewPosition, setPreviewPosition] = useState({ top: 0, left: 0 });
    const listItemRef = useRef<HTMLDivElement>(null);
    const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const blueAccent = '#3b82f6';
    const blueBg = 'rgba(59, 130, 246, 0.1)';
    const blueBorder = 'rgba(59, 130, 246, 0.1)';

    // Show preview after a delay on hover
    useEffect(() => {
        if (isHovered) {
            previewTimeoutRef.current = setTimeout(() => {
                if (listItemRef.current) {
                    const rect = listItemRef.current.getBoundingClientRect();
                    setPreviewPosition({
                        top: rect.bottom + window.scrollY + 8,
                        left: rect.left + 80 + window.scrollX });
                }
                setShowPreview(true);
            }, 600);
        } else {
            if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
            setShowPreview(false);
        }
        return () => { if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current); };
    }, [isHovered]);

    return (
        <motion.div
            ref={listItemRef}
            layout
            layoutId={`catalog-list-${course.id}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ delay: Math.min(index * 0.03, 0.15), duration: 0.2 }}
            whileHover={{ x: 4, transition: { duration: 0.15 } }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            onClick={() => onClick(course)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(course); } }}
            role="article"
            aria-label={`${course.title} - ${course.subtitle}. ${course.modules} modules, ${course.enrolledCount} students.`}
            tabIndex={0}
            style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '14px 18px',
                borderRadius: '14px',
                background: 'var(--dashboard-surface)',
                border: `1px solid ${isHovered ? blueBorder : 'var(--border-color)'}`,
                cursor: 'pointer',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                boxShadow: isHovered 
                    ? ('0 4px 16px rgba(59, 130, 246, 0.08)')
                    : 'none' }}
        >
            {/* Course Image */}
            <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '12px',
                overflow: 'hidden',
                flexShrink: 0,
                position: 'relative' }}>
                <img 
                    src={course.image} 
                    alt={course.title} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                {/* Bookmark Button */}
                <motion.button
                    onClick={(e) => { e.stopPropagation(); onToggleBookmark(course.id); }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label={isBookmarked ? 'Remove from favorites' : 'Add to favorites'}
                    style={{
                        position: 'absolute',
                        top: '4px',
                        left: '4px',
                        width: '22px',
                        height: '22px',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'rgba(255,255,255,0.95)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center' }}
                >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill={isBookmarked ? blueAccent : 'none'} stroke={blueAccent} strokeWidth="2">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                </motion.button>
            </div>

            {/* Course Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h3 style={{ 
                        margin: 0, 
                        fontSize: '14px', 
                        fontWeight: 600, 
                        color: 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap' }}>
                        {course.title}
                    </h3>
                    {course.enrolled && (
                        <span style={{
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: blueBg,
                            border: `1px solid ${blueBorder}`,
                            fontSize: '9px',
                            fontWeight: 600,
                            color: blueAccent,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px' }}>
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                            Enrolled
                        </span>
                    )}
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>{course.subtitle}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '11px', color: blueAccent, fontWeight: 500 }}>{categoryInfo[course.category].label}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>•</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{course.instructor}</span>
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={blueAccent} strokeWidth="2">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>{course.modules}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>modules</span>
                </div>
                <div style={{ width: '1px', height: '20px', background: 'var(--border-color)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={blueAccent} strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    </svg>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>{course.enrolledCount}</span>
                </div>
            </div>

            {/* Action Button */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => { e.stopPropagation(); onClick(course); }}
                style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    border: 'none',
                    background: isHovered ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : blueBg,
                    color: isHovered ? 'white' : blueAccent,
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                    flexShrink: 0 }}
            >
                {course.enrolled ? 'Continue' : 'View'}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
            </motion.button>

            {/* Quick Preview Tooltip for List View - Rendered via Portal */}
            {createPortal(
                <AnimatePresence>
                    {showPreview && (
                        <motion.div
                            initial={{ opacity: 0, y: 12, scale: 0.92 }}
                            animate={{ 
                                opacity: 1, 
                                y: 0, 
                                scale: 1,
                                transition: {
                                    type: 'spring',
                                    stiffness: 400,
                                    damping: 25,
                                    mass: 0.8,
                                    opacity: { duration: 0.2, ease: 'easeOut' }
                                }
                            }}
                            exit={{ 
                                opacity: 0, 
                                y: 8, 
                                scale: 0.95,
                                transition: {
                                    duration: 0.15,
                                    ease: [0.4, 0, 1, 1]
                                }
                            }}
                            style={{
                                position: 'absolute',
                                top: previewPosition.top,
                                left: previewPosition.left,
                                width: '320px',
                                padding: '14px',
                                borderRadius: '14px',
                                background: 'var(--bg-secondary)',
                                border: `1px solid ${blueBorder}`,
                                boxShadow: 'var(--shadow-lg)',
                                zIndex: 9999,
                                pointerEvents: 'none' }}
                        >
                            {/* Preview Header */}
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '6px', 
                                marginBottom: '10px',
                                paddingBottom: '10px',
                                borderBottom: `1px solid var(--border-color)` }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={blueAccent} strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 16v-4M12 8h.01" />
                                </svg>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: blueAccent, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Quick Preview
                                </span>
                            </div>

                            {/* Description */}
                            <p style={{ 
                                margin: 0, 
                                fontSize: '12px', 
                                color: 'var(--text-secondary)', 
                                lineHeight: 1.5,
                                marginBottom: '12px' }}>
                                {course.description}
                            </p>

                            {/* Tags */}
                            {course.tags.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                    {course.tags.map((tag) => (
                                        <span 
                                            key={tag}
                                            style={{ 
                                                padding: '3px 8px', 
                                                borderRadius: '6px', 
                                                background: blueBg,
                                                fontSize: '10px', 
                                                fontWeight: 500,
                                                color: blueAccent }}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </motion.div>
    );
};



export { CourseCard, CourseListItem };
