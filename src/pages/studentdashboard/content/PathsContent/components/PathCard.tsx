/**
 * PathCard
 * Individual learning path card with enrollment, progress, and actions.
 * Extracted from PathsContent.tsx during Phase 8.6 continuation.
 */
import * as React from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    enrollInPath,
    getDifficultyInfo,
    getPathCourses,
    isCourseUnlocked,
    type PathWithProgress,
} from '../../../../../services/pathsService';
import { PathIcon } from './PathIcon';
import { ProgressRingWithTooltip } from './PathProgressRing';
import { PathDetailModal } from '../modals/PathDetailModal';
import { PathCertificateModal } from '../modals/PathCertificateModal';

interface PathCardProps {
    path: PathWithProgress;
    index: number;
    isDarkMode: boolean;
    colors: {
        bg: string;
        cardBg: string;
        border: string;
        textPrimary: string;
        textSecondary: string;
        textMuted: string;
        accent: string;
    };
    onPathSelect?: (pathId: string) => void;
}

export const PathCard: React.FC<PathCardProps> = ({ path, index, isDarkMode, colors, onPathSelect }) => {
                                const difficultyInfo = getDifficultyInfo(path.difficulty);
                                const progress = path.progress?.progress_percentage || 0;
                                const isEnrolled = !!path.progress;

    return (
                                    <motion.div
                                        key={path.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ 
                                            delay: index * 0.05,
                                            type: 'spring',
                                            stiffness: 400,
                                            damping: 25,
                                        }}
                                        whileHover={{ 
                                            y: -6,
                                            transition: { 
                                                type: 'spring', 
                                                stiffness: 400, 
                                                damping: 20,
                                                mass: 0.8,
                                            }
                                        }}
                                        className="path-card"
                                        style={{
                                            padding: '20px',
                                            borderRadius: '16px',
                                            background: colors.cardBg,
                                            border: `1px solid ${isEnrolled ? `${path.color}30` : colors.border}`,
                                            cursor: 'pointer',
                                            boxShadow: isDarkMode 
                                                ? '0 2px 8px rgba(0,0,0,0.2)' 
                                                : '0 2px 8px rgba(0,0,0,0.04)',
                                        }}
                                        onClick={() => handlePathClick(path)}
                                    >
                                        {/* Header */}
                                        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                                            <motion.div
                                                className="path-icon-container"
                                                whileHover={{ scale: 1.08 }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                                style={{
                                                    width: '48px',
                                                    height: '48px',
                                                    borderRadius: '12px',
                                                    background: `${path.color}15`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <PathIcon icon={path.icon} color={path.color} size={24} />
                                            </motion.div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <h3 style={{
                                                    margin: 0,
                                                    fontSize: '15px',
                                                    fontWeight: 600,
                                                    color: colors.textPrimary,
                                                    lineHeight: 1.3,
                                                }}>
                                                    {path.title}
                                                </h3>
                                                <div style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: '8px', 
                                                    marginTop: '4px',
                                                    flexWrap: 'wrap',
                                                }}>
                                                    <span style={{
                                                        fontSize: '10px',
                                                        fontWeight: 600,
                                                        color: difficultyInfo.color,
                                                        padding: '3px 8px',
                                                        borderRadius: '4px',
                                                        background: `${difficultyInfo.color}15`,
                                                    }}>
                                                        {difficultyInfo.label}
                                                    </span>
                                                    <span style={{ 
                                                        fontSize: '11px', 
                                                        color: colors.textMuted,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                    }}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <circle cx="12" cy="12" r="10" />
                                                            <polyline points="12 6 12 12 16 14" />
                                                        </svg>
                                                        {formatEstimatedTime(getPathEstimatedHours(path))}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <p style={{
                                            margin: '0 0 14px',
                                            fontSize: '13px',
                                            color: colors.textSecondary,
                                            lineHeight: 1.5,
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                        }}>
                                            {path.description}
                                        </p>

                                        {/* Quick Stats Row */}
                                        <motion.div 
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 + 0.1, duration: 0.3 }}
                                            style={{
                                                display: 'flex',
                                                gap: '8px',
                                                marginBottom: '14px',
                                                padding: '12px',
                                                borderRadius: '10px',
                                                background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                            }}
                                        >
                                            <div style={{ flex: 1, textAlign: 'center' }}>
                                                <div style={{ 
                                                    fontSize: '18px', 
                                                    fontWeight: 700, 
                                                    color: path.color,
                                                    lineHeight: 1,
                                                }}>
                                                    {path.courses.length}
                                                </div>
                                                <div style={{ fontSize: '9px', color: colors.textMuted, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    Courses
                                                </div>
                                            </div>
                                            <div style={{ width: '1px', background: colors.border, margin: '4px 0' }} />
                                            <div style={{ flex: 1, textAlign: 'center' }}>
                                                <div style={{ 
                                                    fontSize: '18px', 
                                                    fontWeight: 700, 
                                                    color: path.color,
                                                    lineHeight: 1,
                                                }}>
                                                    {getPathTotalModules(path)}
                                                </div>
                                                <div style={{ fontSize: '9px', color: colors.textMuted, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    Modules
                                                </div>
                                            </div>
                                            <div style={{ width: '1px', background: colors.border, margin: '4px 0' }} />
                                            <div style={{ flex: 1, textAlign: 'center' }}>
                                                <div style={{ 
                                                    fontSize: '18px', 
                                                    fontWeight: 700, 
                                                    color: '#10b981',
                                                    lineHeight: 1,
                                                }}>
                                                    {path.enrolled_count}
                                                </div>
                                                <div style={{ fontSize: '9px', color: colors.textMuted, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    Enrolled
                                                </div>
                                            </div>
                                        </motion.div>

                                        {/* Courses included */}
                                        <div style={{
                                            marginBottom: '16px',
                                            padding: '10px',
                                            borderRadius: '8px',
                                            background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                        }}>
                                            <div style={{ 
                                                fontSize: '10px', 
                                                fontWeight: 600, 
                                                color: colors.textPrimary, 
                                                marginBottom: '8px',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                            }}>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                                </svg>
                                                Courses Included
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {getPathCourses(path).slice(0, 4).map((course) => (
                                                    <motion.div
                                                        key={course.id}
                                                        className="course-chip"
                                                        whileHover={{ scale: 1.02 }}
                                                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            padding: '5px 10px',
                                                            borderRadius: '6px',
                                                            background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                                            fontSize: '11px',
                                                            color: colors.textPrimary,
                                                        }}
                                                    >
                                                        <img 
                                                            src={course.image} 
                                                            alt="" 
                                                            style={{ 
                                                                width: '20px', 
                                                                height: '20px', 
                                                                borderRadius: '4px',
                                                                objectFit: 'cover',
                                                            }} 
                                                        />
                                                        <span style={{ fontWeight: 500 }}>{course.shortTitle}</span>
                                                        <span style={{ 
                                                            fontSize: '9px', 
                                                            color: colors.textMuted,
                                                            padding: '1px 4px',
                                                            borderRadius: '3px',
                                                            background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                                                        }}>
                                                            {course.modules}m
                                                        </span>
                                                    </motion.div>
                                                ))}
                                                {path.courses.length > 4 && (
                                                    <motion.div 
                                                        className="course-chip"
                                                        whileHover={{ scale: 1.05 }}
                                                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                                        style={{
                                                            padding: '5px 10px',
                                                            borderRadius: '6px',
                                                            background: `${path.color}15`,
                                                            fontSize: '11px',
                                                            fontWeight: 500,
                                                            color: path.color,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                        }}
                                                    >
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <circle cx="12" cy="12" r="10" />
                                                            <path d="M12 8v8M8 12h8" />
                                                        </svg>
                                                        {path.courses.length - 4} more
                                                    </motion.div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Progress Visualization or Enroll */}
                                        {isEnrolled ? (
                                            <div>
                                                {/* Progress Header with Circular Ring */}
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '14px',
                                                    marginBottom: '12px',
                                                }}>
                                                    {/* Circular Progress Ring with Hover Tooltip */}
                                                    <ProgressRingWithTooltip
                                                        progress={progress}
                                                        pathColor={path.color}
                                                        isDarkMode={isDarkMode}
                                                        index={index}
                                                    />

                                                    {/* Progress Info */}
                                                    <div 
                                                        style={{ flex: 1 }}
                                                        title={`Progress: ${progress}% - ${path.completed_courses_count} of ${path.total_courses} courses completed`}
                                                    >
                                                        <div style={{ 
                                                            fontSize: '13px', 
                                                            fontWeight: 600, 
                                                            color: colors.textPrimary,
                                                            marginBottom: '4px',
                                                        }}>
                                                            {progress === 100 ? 'Completed!' : progress === 0 ? 'Not Started' : 'In Progress'}
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: colors.textPrimary, fontWeight: 500 }}>
                                                            {path.completed_courses_count} of {path.total_courses} courses done
                                                        </div>
                                                    </div>

                                                    {/* Status Icon / Certificate Badge */}
                                                    {progress === 100 ? (
                                                        <motion.div
                                                            initial={{ scale: 0, rotate: -180 }}
                                                            animate={{ scale: 1, rotate: 0 }}
                                                            transition={{ delay: index * 0.05 + 0.4, type: 'spring', stiffness: 300 }}
                                                            whileHover={{ scale: 1.1, rotate: 5 }}
                                                            style={{
                                                                width: '36px',
                                                                height: '36px',
                                                                borderRadius: '10px',
                                                                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                                                                cursor: 'pointer',
                                                            }}
                                                            title="Certificate Earned! Click to view"
                                                        >
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <circle cx="12" cy="8" r="6" />
                                                                <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                                                            </svg>
                                                        </motion.div>
                                                    ) : (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        transition={{ delay: index * 0.05 + 0.4, type: 'spring', stiffness: 400 }}
                                                        style={{
                                                            width: '28px',
                                                            height: '28px',
                                                            borderRadius: '8px',
                                                            background: progress > 0 
                                                                    ? `${path.color}15` 
                                                                    : isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                        }}
                                                    >
                                                        {progress > 0 ? (
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={path.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <circle cx="12" cy="12" r="10" />
                                                                <polyline points="12 6 12 12 16 14" />
                                                            </svg>
                                                        ) : (
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <circle cx="12" cy="12" r="10" />
                                                                <path d="M12 8v4M12 16h.01" />
                                                            </svg>
                                                        )}
                                                    </motion.div>
                                                    )}
                                                </div>

                                                {/* Estimated Time Remaining */}
                                                {progress < 100 && (
                                                    <motion.div
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.05 + 0.25, duration: 0.3 }}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            padding: '8px 12px',
                                                            borderRadius: '8px',
                                                            background: isDarkMode ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.05)',
                                                            border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)'}`,
                                                            marginBottom: '12px',
                                                        }}
                                                    >
                                                        {/* Clock Icon */}
                                                        <motion.div
                                                            animate={{ rotate: [0, 10, -10, 0] }}
                                                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                                            style={{
                                                                width: '28px',
                                                                height: '28px',
                                                                borderRadius: '8px',
                                                                background: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                flexShrink: 0,
                                                            }}
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <circle cx="12" cy="12" r="10" />
                                                                <polyline points="12 6 12 12 16 14" />
                                                            </svg>
                                                        </motion.div>
                                                        
                                                        {/* Time Info */}
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ 
                                                                fontSize: '10px', 
                                                                color: colors.textMuted, 
                                                                marginBottom: '2px',
                                                                textTransform: 'uppercase',
                                                                letterSpacing: '0.3px',
                                                            }}>
                                                                Est. Time Remaining
                                                            </div>
                                                            <motion.div 
                                                                key={progress}
                                                                initial={{ opacity: 0, y: 5 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                style={{ 
                                                                    fontSize: '14px', 
                                                                    fontWeight: 600, 
                                                                    color: '#3b82f6',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '6px',
                                                                }}
                                                            >
                                                                {formatEstimatedTime(Math.round(getPathEstimatedHours(path) * (1 - progress / 100)))}
                                                                <span style={{ 
                                                                    fontSize: '10px', 
                                                                    fontWeight: 400, 
                                                                    color: colors.textMuted,
                                                                }}>
                                                                    ({path.total_courses - path.completed_courses_count} courses left)
                                                                </span>
                                                            </motion.div>
                                                        </div>

                                                        {/* Progress Mini Bar */}
                                                        <div style={{
                                                            width: '40px',
                                                            height: '40px',
                                                            position: 'relative',
                                                        }}>
                                                            <svg width="40" height="40" viewBox="0 0 40 40" style={{ transform: 'rotate(-90deg)' }}>
                                                                <circle
                                                                    cx="20"
                                                                    cy="20"
                                                                    r="16"
                                                                    fill="none"
                                                                    stroke={isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)'}
                                                                    strokeWidth="3"
                                                                />
                                                                <motion.circle
                                                                    cx="20"
                                                                    cy="20"
                                                                    r="16"
                                                                    fill="none"
                                                                    stroke="#3b82f6"
                                                                    strokeWidth="3"
                                                                    strokeLinecap="round"
                                                                    strokeDasharray={2 * Math.PI * 16}
                                                                    initial={{ strokeDashoffset: 2 * Math.PI * 16 }}
                                                                    animate={{ strokeDashoffset: 2 * Math.PI * 16 * (1 - progress / 100) }}
                                                                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                                                />
                                                            </svg>
                                                            <div style={{
                                                                position: 'absolute',
                                                                top: '50%',
                                                                left: '50%',
                                                                transform: 'translate(-50%, -50%)',
                                                                fontSize: '9px',
                                                                fontWeight: 700,
                                                                color: '#3b82f6',
                                                            }}>
                                                                {progress}%
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}

                                                {/* Course Milestone Tracker */}
                                                <motion.div
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 + 0.3, duration: 0.4 }}
                                                    style={{
                                                        padding: '10px',
                                                        borderRadius: '10px',
                                                        background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                                    }}
                                                >
                                                    <div 
                                                        style={{ 
                                                            fontSize: '10px', 
                                                            fontWeight: 600, 
                                                            color: colors.textPrimary, 
                                                            marginBottom: '10px',
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.5px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                        }}
                                                        title="Track your progress through each course in this learning path"
                                                    >
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                            <path d="m9 11 3 3L22 4" />
                                                        </svg>
                                                        Course Progress
                                                    </div>
                                                    
                                                    {/* Milestone dots */}
                                                    <div style={{ 
                                                        display: 'flex', 
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        position: 'relative',
                                                    }}>
                                                        {getPathCourses(path).map((course, courseIndex) => {
                                                            const isCompleted = path.progress?.completed_courses?.includes(course.id) || false;
                                                            const isCurrent = path.progress?.current_course_id === course.id;
                                                            
                                                            return (
                                                                <React.Fragment key={course.id}>
                                                                    <motion.div
                                                                        initial={{ scale: 0 }}
                                                                        animate={{ scale: 1 }}
                                                                        transition={{ delay: index * 0.05 + 0.4 + courseIndex * 0.05, type: 'spring', stiffness: 400 }}
                                                                        title={`${course.shortTitle}: ${isCompleted ? 'Completed' : isCurrent ? 'In Progress' : 'Not Started'}`}
                                                                        style={{
                                                                            width: isCurrent ? '24px' : '18px',
                                                                            height: isCurrent ? '24px' : '18px',
                                                                            borderRadius: '50%',
                                                                            background: isCompleted 
                                                                                ? '#10b981' 
                                                                                : isCurrent 
                                                                                    ? path.color 
                                                                                    : isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            flexShrink: 0,
                                                                            border: isCurrent ? `2px solid ${path.color}40` : 'none',
                                                                            boxShadow: isCurrent ? `0 0 0 3px ${path.color}20` : 'none',
                                                                        }}
                                                                    >
                                                                        {isCompleted ? (
                                                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                                                <polyline points="20 6 9 17 4 12" />
                                                                            </svg>
                                                                        ) : isCurrent ? (
                                                                            <motion.div
                                                                                animate={{ scale: [1, 1.2, 1] }}
                                                                                transition={{ duration: 1.5, repeat: Infinity }}
                                                                                style={{
                                                                                    width: '6px',
                                                                                    height: '6px',
                                                                                    borderRadius: '50%',
                                                                                    background: 'white',
                                                                                }}
                                                                            />
                                                                        ) : null}
                                                                    </motion.div>
                                                                    {/* Connector line */}
                                                                    {courseIndex < path.courses.length - 1 && (
                                                                        <div style={{
                                                                            flex: 1,
                                                                            height: '2px',
                                                                            background: isCompleted 
                                                                                ? '#10b981' 
                                                                                : isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                                                                            minWidth: '8px',
                                                                        }} />
                                                                    )}
                                                                </React.Fragment>
    );
};

export default PathCard;
