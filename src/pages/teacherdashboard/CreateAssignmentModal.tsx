/**
 * Create Assignment Modal - Detailed form for teachers to create assignments
 * Professional minimalistic design matching the app's design system
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { supabase } from '../../lib/supabase';
import { useResponsive } from './hooks';

// Types
interface RubricCriterion {
    id: string;
    name: string;
    description: string;
    points: number;
    levels: { label: string; points: number; description: string }[];
}

interface AssignmentFormData {
    title: string;
    description: string;
    course: string;
    section: string;
    sections: string[]; // Multiple sections for batch create
    type: 'assignment' | 'quiz' | 'project' | 'exam';
    dueDate: string;
    dueTime: string;
    points: number;
    instructions: string;
    attachments: File[];
    allowLateSubmission: boolean;
    latePenalty: number;
    maxAttempts: number;
    rubricEnabled: boolean;
    rubricCriteria: RubricCriterion[];
    notifyStudents: boolean;
    // New practical features
    schedulePublish: boolean;
    publishDate: string;
    publishTime: string;
    copyToOtherCourses: string[]; // Course IDs to copy to
    prerequisiteEnabled: boolean;
    prerequisiteAssignment: string; // Assignment ID
    saveAsTemplate: boolean;
    templateName: string;
}

interface CreateAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: AssignmentFormData) => void;
}

// Quick Templates for fast assignment creation
const QUICK_TEMPLATES = [
    {
        id: 'lab-exercise',
        name: 'Lab Exercise',
        icon: 'lab',
        color: '#3b82f6',
        description: 'Hands-on coding or practical activity',
        defaults: {
            title: 'Lab Exercise - [Topic]',
            assignmentDescription: 'Complete the hands-on laboratory exercise to practice and apply the concepts discussed in class.',
            type: 'assignment' as const,
            points: 50,
            maxAttempts: 3,
            allowLateSubmission: true,
            latePenalty: 5,
            instructions: '<p><strong>Objectives:</strong></p><ul><li>Complete the hands-on exercise</li><li>Submit your source code</li><li>Include screenshots of output</li></ul><p><strong>Submission Requirements:</strong></p><ul><li>Source code files (.java, .py, .cpp, etc.)</li><li>Screenshot of program output</li><li>Brief explanation of your approach</li></ul>',
        },
    },
    {
        id: 'written-report',
        name: 'Written Report',
        icon: 'document',
        color: '#8b5cf6',
        description: 'Essay, research paper, or documentation',
        defaults: {
            title: 'Written Report - [Topic]',
            assignmentDescription: 'Write a comprehensive report demonstrating your understanding and analysis of the assigned topic.',
            type: 'assignment' as const,
            points: 100,
            maxAttempts: 1,
            allowLateSubmission: true,
            latePenalty: 10,
            instructions: '<p><strong>Format Requirements:</strong></p><ul><li>Font: Times New Roman, 12pt</li><li>Spacing: Double-spaced</li><li>Margins: 1 inch on all sides</li><li>Include cover page with your name and section</li></ul><p><strong>Content Guidelines:</strong></p><ul><li>Introduction with thesis statement</li><li>Body paragraphs with supporting evidence</li><li>Conclusion summarizing key points</li><li>References in APA format</li></ul>',
        },
    },
    {
        id: 'coding-activity',
        name: 'Coding Activity',
        icon: 'code',
        color: '#10b981',
        description: 'Programming problem or algorithm challenge',
        defaults: {
            title: 'Coding Activity - [Topic]',
            assignmentDescription: 'Solve the programming problem by implementing an efficient algorithm following best coding practices.',
            type: 'assignment' as const,
            points: 75,
            maxAttempts: 5,
            allowLateSubmission: false,
            latePenalty: 0,
            instructions: '<p><strong>Problem Statement:</strong></p><p>[Describe the programming problem here]</p><p><strong>Requirements:</strong></p><ul><li>Your code must compile without errors</li><li>Include comments explaining your logic</li><li>Handle edge cases appropriately</li><li>Follow proper naming conventions</li></ul><p><strong>Sample Input/Output:</strong></p><pre>Input: [example]\nOutput: [expected result]</pre>',
        },
    },
    {
        id: 'quiz-template',
        name: 'Quiz',
        icon: 'quiz',
        color: '#f59e0b',
        description: 'Timed assessment or knowledge check',
        defaults: {
            title: 'Quiz - [Topic]',
            assignmentDescription: 'A timed assessment to evaluate your understanding of the covered topics.',
            type: 'quiz' as const,
            points: 30,
            maxAttempts: 1,
            allowLateSubmission: false,
            latePenalty: 0,
            instructions: '<p><strong>Quiz Instructions:</strong></p><ul><li>Read each question carefully before answering</li><li>You have <strong>30 minutes</strong> to complete this quiz</li><li>No going back to previous questions</li><li>Academic integrity policy applies</li></ul><p><strong>Coverage:</strong></p><ul><li>[Topic 1]</li><li>[Topic 2]</li><li>[Topic 3]</li></ul>',
        },
    },
    {
        id: 'group-project',
        name: 'Group Project',
        icon: 'users',
        color: '#ef4444',
        description: 'Collaborative team assignment',
        defaults: {
            title: 'Group Project - [Topic]',
            assignmentDescription: 'A collaborative project where teams work together to design, develop, and present a comprehensive solution.',
            type: 'project' as const,
            points: 150,
            maxAttempts: 2,
            allowLateSubmission: true,
            latePenalty: 15,
            instructions: '<p><strong>Project Overview:</strong></p><p>[Describe the project goals and scope]</p><p><strong>Team Requirements:</strong></p><ul><li>Form groups of 3-5 members</li><li>Assign roles: Leader, Developer, Tester, Documenter</li><li>Submit team composition by [date]</li></ul><p><strong>Deliverables:</strong></p><ul><li>Project proposal (Week 1)</li><li>Progress report (Week 2)</li><li>Final submission with documentation</li><li>Presentation slides</li></ul>',
        },
    },
    {
        id: 'presentation',
        name: 'Presentation',
        icon: 'presentation',
        color: '#06b6d4',
        description: 'Oral presentation or demo',
        defaults: {
            title: 'Presentation - [Topic]',
            assignmentDescription: 'Prepare and deliver an oral presentation demonstrating your knowledge and communication skills.',
            type: 'assignment' as const,
            points: 100,
            maxAttempts: 1,
            allowLateSubmission: false,
            latePenalty: 0,
            instructions: '<p><strong>Presentation Guidelines:</strong></p><ul><li>Duration: 10-15 minutes per group/individual</li><li>Include visual aids (slides, demos)</li><li>Q&A session: 5 minutes</li></ul><p><strong>Grading Criteria:</strong></p><ul><li>Content accuracy and depth (40%)</li><li>Presentation skills (30%)</li><li>Visual aids quality (20%)</li><li>Time management (10%)</li></ul>',
        },
    },
];

// Template icon renderer
const getTemplateIcon = (iconType: string, color: string) => {
    const icons: Record<string, React.ReactNode> = {
        lab: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 3h6v2H9z" />
                <path d="M8 5v3.764a2 2 0 0 1-.211.894L4.105 17.21A2 2 0 0 0 5.882 20h12.236a2 2 0 0 0 1.777-2.79L16.21 9.658A2 2 0 0 1 16 8.764V5" />
                <path d="M9 8h6" />
                <circle cx="12" cy="15" r="2" />
            </svg>
        ),
        document: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
        ),
        code: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
                <line x1="14" y1="4" x2="10" y2="20" />
            </svg>
        ),
        quiz: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
        ),
        users: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        ),
        presentation: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h20" />
                <path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3" />
                <path d="M12 16v5" />
                <path d="M8 21h8" />
                <path d="M12 7v4" />
                <path d="M8 9h8" />
            </svg>
        ),
    };
    return icons[iconType] || icons.document;
};

// Type for recent assignments from database
interface RecentAssignment {
    id: string;
    title: string;
    course: string;
    courseName: string;
    date: string;
    type: string;
    description: string;
    instructions: string;
    points: number;
}

const ASSIGNMENT_TYPES = [
    { id: 'assignment', label: 'Assignment', icon: 'assignment', color: '#3b82f6' },
    { id: 'quiz', label: 'Quiz', icon: 'quiz', color: '#f59e0b' },
    { id: 'project', label: 'Project', icon: 'project', color: '#10b981' },
    { id: 'exam', label: 'Exam', icon: 'exam', color: '#ef4444' },
];

// Assignment Type Icon Renderer - Professional SVG icons
const getAssignmentTypeIcon = (iconType: string, color: string, isSelected: boolean) => {
    const iconColor = isSelected ? color : '#94a3b8';
    const bgColor = isSelected ? `${color}15` : 'rgba(148, 163, 184, 0.1)';
    
    const icons: Record<string, React.ReactNode> = {
        assignment: (
            <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: bgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
            }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                </svg>
            </div>
        ),
        quiz: (
            <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: bgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
            }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
            </div>
        ),
        project: (
            <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: bgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
            }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                </svg>
            </div>
        ),
        exam: (
            <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: bgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
            }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
            </div>
        ),
    };
    
    return icons[iconType] || icons.assignment;
};

// Preview Icon with Tooltip Component - Matches CourseViewPage design
const PreviewIconWithTooltip: React.FC<{
    label: string;
    subtitle: string;
    color: string;
    bgColor: string;
    borderColor: string;
    children: React.ReactNode;
}> = ({ label, subtitle, color, bgColor, borderColor, children }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div style={{ position: 'relative', display: 'inline-flex' }}>
            <motion.div 
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: bgColor,
                    border: `1px solid ${borderColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                }}
            >
                {children}
            </motion.div>
            
            {/* Tooltip - White with colored border and arrow */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.15 }}
                        style={{
                            position: 'absolute',
                            bottom: 'calc(100% + 12px)',
                            left: '50%',
                            zIndex: 100,
                            pointerEvents: 'none',
                        }}
                    >
                        <div style={{
                            position: 'relative',
                            background: '#fff',
                            border: `1px solid ${color}30`,
                            borderRadius: '10px',
                            padding: '8px 12px',
                            boxShadow: `0 4px 16px ${color}15`,
                            whiteSpace: 'nowrap',
                            transform: 'translateX(-50%)',
                        }}>
                            <p style={{ 
                                margin: 0, 
                                fontSize: '12px', 
                                fontWeight: 600, 
                                color: color,
                                textAlign: 'center',
                            }}>
                                {label}
                            </p>
                            <p style={{ 
                                margin: '2px 0 0 0', 
                                fontSize: '10px', 
                                color: `${color}cc`,
                                maxWidth: '140px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                textAlign: 'center',
                            }}>
                                {subtitle}
                            </p>
                            {/* Arrow pointing down */}
                            <div style={{
                                position: 'absolute',
                                width: '10px',
                                height: '10px',
                                background: '#fff',
                                borderRight: `1px solid ${color}30`,
                                borderBottom: `1px solid ${color}30`,
                                bottom: '-6px',
                                left: '50%',
                                transform: 'translateX(-50%) rotate(45deg)',
                            }} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};


// Form Input Component
const FormInput: React.FC<{
    label: string;
    value: string | number;
    onChange: (value: string) => void;
    type?: string;
    placeholder?: string;
    required?: boolean;
    icon?: React.ReactNode;
    helpText?: string;
}> = ({ label, value, onChange, type = 'text', placeholder, required, icon, helpText }) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <div style={{ marginBottom: '16px' }}>
            <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 500,
                color: '#334155',
                marginBottom: '6px',
            }}>
                {icon && <span style={{ color: '#3b82f6' }}>{icon}</span>}
                {label}
                {required && <span style={{ color: '#ef4444' }}>*</span>}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: `1px solid ${isFocused ? '#3b82f6' : 'rgba(0,0,0,0.08)'}`,
                    background: '#ffffff',
                    fontSize: '13px',
                    color: '#1e293b',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxShadow: isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.08)' : 'none',
                    height: '40px',
                    boxSizing: 'border-box',
                }}
            />
            {helpText && (
                <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', margin: '4px 0 0 0' }}>
                    {helpText}
                </p>
            )}
        </div>
    );
};

// Custom Date Picker Component - Minimalistic design matching GoalsContent
const CustomDatePicker: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
    icon?: React.ReactNode;
    minDate?: string;
}> = ({ label, value, onChange, required, icon, minDate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
    const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
    const containerRef = useRef<HTMLDivElement>(null);
    const calendarRef = useRef<HTMLDivElement>(null);

    // Initialize calendar to selected date or current date
    useEffect(() => {
        if (value) {
            const date = new Date(value);
            setCalendarMonth(date.getMonth());
            setCalendarYear(date.getFullYear());
        }
    }, [value]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (calendarRef.current && !calendarRef.current.contains(e.target as Node) &&
                containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const formatDisplayDate = (dateStr: string) => {
        if (!dateStr) return 'Select date';
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const minDateObj = minDate ? new Date(minDate) : today;

    return (
        <div ref={containerRef} style={{ marginBottom: '16px', position: 'relative' }}>
            <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 500,
                color: '#334155',
                marginBottom: '6px',
            }}>
                {icon && <span style={{ color: '#3b82f6' }}>{icon}</span>}
                {label}
                {required && <span style={{ color: '#ef4444' }}>*</span>}
            </label>
            
            {/* Date Display Button */}
            <motion.button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ borderColor: '#3b82f6' }}
                style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: `1px solid ${isOpen ? '#3b82f6' : 'rgba(0,0,0,0.08)'}`,
                    background: '#ffffff',
                    fontSize: '13px',
                    color: value ? '#1e293b' : '#94a3b8',
                    outline: 'none',
                    cursor: 'pointer',
                    height: '40px',
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease',
                    boxShadow: isOpen ? '0 0 0 3px rgba(59, 130, 246, 0.08)' : 'none',
                }}
            >
                <span>{formatDisplayDate(value)}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
            </motion.button>

            {/* Calendar Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        ref={calendarRef}
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            marginTop: '4px',
                            width: '260px',
                            background: '#ffffff',
                            border: '1px solid rgba(0,0,0,0.08)',
                            borderRadius: '12px',
                            padding: '12px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                            zIndex: 1000,
                        }}
                    >
                        {/* Month/Year Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <motion.button
                                type="button"
                                onClick={() => {
                                    if (calendarMonth === 0) {
                                        setCalendarMonth(11);
                                        setCalendarYear(calendarYear - 1);
                                    } else {
                                        setCalendarMonth(calendarMonth - 1);
                                    }
                                }}
                                whileHover={{ scale: 1.1, background: 'rgba(59, 130, 246, 0.1)' }}
                                whileTap={{ scale: 0.9 }}
                                style={{
                                    width: '28px',
                                    height: '28px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    background: 'transparent',
                                    color: '#64748b',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="15 18 9 12 15 6" />
                                </svg>
                            </motion.button>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                                {new Date(calendarYear, calendarMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </span>
                            <motion.button
                                type="button"
                                onClick={() => {
                                    if (calendarMonth === 11) {
                                        setCalendarMonth(0);
                                        setCalendarYear(calendarYear + 1);
                                    } else {
                                        setCalendarMonth(calendarMonth + 1);
                                    }
                                }}
                                whileHover={{ scale: 1.1, background: 'rgba(59, 130, 246, 0.1)' }}
                                whileTap={{ scale: 0.9 }}
                                style={{
                                    width: '28px',
                                    height: '28px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    background: 'transparent',
                                    color: '#64748b',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </motion.button>
                        </div>

                        {/* Day Headers */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, i) => (
                                <div key={i} style={{ textAlign: 'center', fontSize: '10px', fontWeight: 600, color: '#94a3b8', padding: '4px' }}>
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Days */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                            {(() => {
                                const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
                                const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
                                const days = [];

                                // Empty cells for days before first of month
                                for (let i = 0; i < firstDay; i++) {
                                    days.push(<div key={`empty-${i}`} style={{ width: '32px', height: '32px' }} />);
                                }

                                // Days of the month
                                for (let day = 1; day <= daysInMonth; day++) {
                                    const date = new Date(calendarYear, calendarMonth, day);
                                    const dateStr = date.toISOString().split('T')[0];
                                    const isSelected = value === dateStr;
                                    const isPast = date < minDateObj;
                                    const isToday = date.toDateString() === today.toDateString();

                                    days.push(
                                        <motion.button
                                            key={day}
                                            type="button"
                                            onClick={() => {
                                                if (!isPast) {
                                                    onChange(dateStr);
                                                    setIsOpen(false);
                                                }
                                            }}
                                            whileHover={!isPast ? { scale: 1.1, background: isSelected ? '#3b82f6' : 'rgba(59, 130, 246, 0.1)' } : {}}
                                            whileTap={!isPast ? { scale: 0.95 } : {}}
                                            style={{
                                                width: '32px',
                                                height: '32px',
                                                border: isToday && !isSelected ? '1.5px solid #3b82f6' : 'none',
                                                borderRadius: '8px',
                                                background: isSelected ? '#3b82f6' : 'transparent',
                                                color: isSelected ? '#fff' : isPast ? '#cbd5e1' : '#1e293b',
                                                cursor: isPast ? 'not-allowed' : 'pointer',
                                                fontSize: '12px',
                                                fontWeight: isSelected || isToday ? 600 : 400,
                                                opacity: isPast ? 0.5 : 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'background 0.15s ease',
                                            }}
                                        >
                                            {day}
                                        </motion.button>
                                    );
                                }

                                return days;
                            })()}
                        </div>

                        {/* Footer Buttons */}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                            <motion.button
                                type="button"
                                onClick={() => {
                                    onChange('');
                                    setIsOpen(false);
                                }}
                                whileHover={{ scale: 1.02, background: 'rgba(0,0,0,0.04)' }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    flex: 1,
                                    padding: '8px',
                                    border: '1px solid rgba(0,0,0,0.08)',
                                    borderRadius: '8px',
                                    background: 'transparent',
                                    color: '#64748b',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                }}
                            >
                                Clear
                            </motion.button>
                            <motion.button
                                type="button"
                                onClick={() => {
                                    const todayStr = today.toISOString().split('T')[0];
                                    onChange(todayStr);
                                    setIsOpen(false);
                                }}
                                whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)' }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    flex: 1,
                                    padding: '8px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    background: '#3b82f6',
                                    color: '#fff',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                }}
                            >
                                Today
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Custom Time Picker Component - Minimalistic design
const CustomTimePicker: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
    icon?: React.ReactNode;
}> = ({ label, value, onChange, required, icon }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Generate time options (every 30 minutes)
    const timeOptions = useMemo(() => {
        const options = [];
        for (let h = 0; h < 24; h++) {
            for (let m = 0; m < 60; m += 30) {
                const hour = h.toString().padStart(2, '0');
                const minute = m.toString().padStart(2, '0');
                const time24 = `${hour}:${minute}`;
                const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
                const ampm = h < 12 ? 'AM' : 'PM';
                const display = `${hour12}:${minute.padStart(2, '0')} ${ampm}`;
                options.push({ value: time24, display });
            }
        }
        return options;
    }, []);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
                containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const formatDisplayTime = (time24: string) => {
        if (!time24) return 'Select time';
        const [h, m] = time24.split(':').map(Number);
        const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
        const ampm = h < 12 ? 'AM' : 'PM';
        return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
    };

    return (
        <div ref={containerRef} style={{ marginBottom: '16px', position: 'relative' }}>
            <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 500,
                color: '#334155',
                marginBottom: '6px',
            }}>
                {icon && <span style={{ color: '#3b82f6' }}>{icon}</span>}
                {label}
                {required && <span style={{ color: '#ef4444' }}>*</span>}
            </label>

            {/* Time Display Button */}
            <motion.button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ borderColor: '#3b82f6' }}
                style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: `1px solid ${isOpen ? '#3b82f6' : 'rgba(0,0,0,0.08)'}`,
                    background: '#ffffff',
                    fontSize: '13px',
                    color: value ? '#1e293b' : '#94a3b8',
                    outline: 'none',
                    cursor: 'pointer',
                    height: '40px',
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease',
                    boxShadow: isOpen ? '0 0 0 3px rgba(59, 130, 246, 0.08)' : 'none',
                }}
            >
                <span>{formatDisplayTime(value)}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                </svg>
            </motion.button>

            {/* Time Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        ref={dropdownRef}
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            marginTop: '4px',
                            width: '100%',
                            maxHeight: '200px',
                            overflowY: 'auto',
                            background: '#ffffff',
                            border: '1px solid rgba(0,0,0,0.08)',
                            borderRadius: '10px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                            zIndex: 1000,
                        }}
                    >
                        {timeOptions.map((option) => (
                            <motion.button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                whileHover={{ background: 'rgba(59, 130, 246, 0.08)' }}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: 'none',
                                    background: value === option.value ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                    color: value === option.value ? '#3b82f6' : '#1e293b',
                                    fontSize: '13px',
                                    fontWeight: value === option.value ? 600 : 400,
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}
                            >
                                {option.display}
                                {value === option.value && (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                )}
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Form Textarea Component
const FormTextarea: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    rows?: number;
    required?: boolean;
    icon?: React.ReactNode;
}> = ({ label, value, onChange, placeholder, rows = 4, required, icon }) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <div style={{ marginBottom: '16px' }}>
            <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 500,
                color: '#334155',
                marginBottom: '6px',
            }}>
                {icon && <span style={{ color: '#3b82f6' }}>{icon}</span>}
                {label}
                {required && <span style={{ color: '#ef4444' }}>*</span>}
            </label>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: `1px solid ${isFocused ? '#3b82f6' : 'rgba(0,0,0,0.08)'}`,
                    background: '#ffffff',
                    fontSize: '13px',
                    color: '#1e293b',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxShadow: isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.08)' : 'none',
                    resize: 'vertical',
                    minHeight: '80px',
                    lineHeight: 1.5,
                }}
            />
        </div>
    );
};


// Form Select Component - Custom dropdown matching GradeSubmissionsModal design
const FormSelect: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    required?: boolean;
    icon?: React.ReactNode;
    placeholder?: string;
}> = ({ label, value, onChange, options, required, icon, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Get display label for selected value
    const selectedOption = options.find(opt => opt.value === value);
    const displayLabel = selectedOption?.label || placeholder || 'Select...';
    const accentColor = '#3b82f6';

    return (
        <div ref={containerRef} style={{ marginBottom: '16px', position: 'relative' }}>
            <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 500,
                color: '#334155',
                marginBottom: '6px',
            }}>
                {icon && <span style={{ color: '#3b82f6' }}>{icon}</span>}
                {label}
                {required && <span style={{ color: '#ef4444' }}>*</span>}
            </label>

            {/* Trigger Button */}
            <motion.button
                type="button"
                whileTap={{ scale: 0.99 }}
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: isOpen 
                        ? `1px solid ${accentColor}40` 
                        : '1px solid rgba(0,0,0,0.08)',
                    background: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    height: '40px',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease',
                    boxShadow: isOpen ? `0 0 0 3px ${accentColor}10` : 'none',
                }}
            >
                <span style={{ 
                    flex: 1,
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap',
                    textAlign: 'left',
                    color: value ? '#0f172a' : '#94a3b8',
                }}>
                    {displayLabel}
                </span>
                <motion.svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ flexShrink: 0 }}
                >
                    <polyline points="6 9 12 15 18 9" />
                </motion.svg>
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                            position: 'absolute',
                            top: 'calc(100% + 6px)',
                            left: 0,
                            right: 0,
                            minWidth: '100%',
                            background: '#ffffff',
                            borderRadius: '12px',
                            border: '1px solid rgba(0,0,0,0.08)',
                            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.12), 0 2px 10px rgba(0, 0, 0, 0.06)',
                            padding: '6px',
                            zIndex: 1000,
                            maxHeight: '280px',
                            overflowY: 'auto',
                        }}
                    >
                        {placeholder && (
                            <motion.button
                                type="button"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                onMouseEnter={() => setHoveredId('__placeholder__')}
                                onMouseLeave={() => setHoveredId(null)}
                                onClick={() => {
                                    onChange('');
                                    setIsOpen(false);
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: !value 
                                        ? `${accentColor}10` 
                                        : hoveredId === '__placeholder__' 
                                            ? 'rgba(0,0,0,0.03)' 
                                            : 'transparent',
                                    color: !value ? accentColor : '#94a3b8',
                                    fontSize: '13px',
                                    fontWeight: !value ? 600 : 500,
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'background 0.15s ease',
                                }}
                            >
                                <span style={{ flex: 1 }}>{placeholder}</span>
                                {!value && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        style={{
                                            width: '18px',
                                            height: '18px',
                                            borderRadius: '50%',
                                            background: accentColor,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </motion.div>
                                )}
                            </motion.button>
                        )}
                        {options.map((option, index) => {
                            const isSelected = value === option.value;
                            const isHovered = hoveredId === option.value;
                            
                            return (
                                <motion.button
                                    key={option.value}
                                    type="button"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.02 }}
                                    onMouseEnter={() => setHoveredId(option.value)}
                                    onMouseLeave={() => setHoveredId(null)}
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: isSelected 
                                            ? `${accentColor}10` 
                                            : isHovered 
                                                ? 'rgba(0,0,0,0.03)' 
                                                : 'transparent',
                                        color: isSelected ? accentColor : '#334155',
                                        fontSize: '13px',
                                        fontWeight: isSelected ? 600 : 500,
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'background 0.15s ease',
                                    }}
                                >
                                    <span style={{ 
                                        flex: 1, 
                                        overflow: 'hidden', 
                                        textOverflow: 'ellipsis', 
                                        whiteSpace: 'nowrap' 
                                    }}>
                                        {option.label}
                                    </span>
                                    {isSelected && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            style={{
                                                width: '18px',
                                                height: '18px',
                                                borderRadius: '50%',
                                                background: accentColor,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}
                                        >
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        </motion.div>
                                    )}
                                </motion.button>
                            );
                        })}
                        {options.length === 0 && (
                            <div style={{
                                padding: '16px 12px',
                                textAlign: 'center',
                                color: '#94a3b8',
                                fontSize: '12px',
                            }}>
                                No options available
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};


// Toggle Switch Component - CSS-based switch from Uiverse.io
const ToggleSwitch: React.FC<{
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    description?: string;
}> = ({ label, checked, onChange, description }) => {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 0',
            borderBottom: '1px solid rgba(0,0,0,0.04)',
        }}>
            <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#334155' }}>{label}</div>
                {description && (
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{description}</div>
                )}
            </div>
            <label style={{
                fontSize: '10px',
                position: 'relative',
                display: 'inline-block',
                width: '3.5em',
                height: '2em',
            }}>
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    style={{
                        opacity: 0,
                        width: 0,
                        height: 0,
                    }}
                />
                <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: checked ? '#007bff' : '#fff',
                    border: checked ? '1px solid #007bff' : '1px solid #adb5bd',
                    transition: '.4s',
                    borderRadius: '30px',
                }}>
                    <span style={{
                        position: 'absolute',
                        content: '""',
                        height: '1.4em',
                        width: '1.4em',
                        borderRadius: '20px',
                        left: '0.27em',
                        bottom: '0.25em',
                        backgroundColor: checked ? '#fff' : '#adb5bd',
                        transition: '.4s',
                        transform: checked ? 'translateX(1.4em)' : 'translateX(0)',
                    }} />
                </span>
            </label>
        </div>
    );
};


// File Upload Component
const FileUpload: React.FC<{
    files: File[];
    onChange: (files: File[]) => void;
}> = ({ files, onChange }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        onChange([...files, ...droppedFiles]);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files);
            onChange([...files, ...selectedFiles]);
        }
    };

    const removeFile = (index: number) => {
        onChange(files.filter((_, i) => i !== index));
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div style={{ marginBottom: '16px' }}>
            <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '8px',
            }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
                Attachments
            </label>
            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                style={{
                    padding: '24px',
                    borderRadius: '12px',
                    border: `2px dashed ${isDragging ? '#3b82f6' : 'rgba(0,0,0,0.1)'}`,
                    background: isDragging ? 'rgba(59, 130, 246, 0.05)' : 'rgba(0,0,0,0.02)',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                }}
            >
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                    color: '#3b82f6',
                }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                    <span style={{ color: '#3b82f6', fontWeight: 600 }}>Click to upload</span> or drag and drop
                </p>
                <p style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 0 0' }}>
                    PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, Images (Max 25MB each)
                </p>
            </div>

            {files.length > 0 && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {files.map((file, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px 12px',
                                borderRadius: '8px',
                                background: 'rgba(0,0,0,0.02)',
                                border: '1px solid rgba(0,0,0,0.06)',
                            }}
                        >
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#3b82f6',
                            }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                </svg>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '12px', fontWeight: 500, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {file.name}
                                </div>
                                <div style={{ fontSize: '11px', color: '#94a3b8' }}>{formatFileSize(file.size)}</div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1, background: 'rgba(239, 68, 68, 0.1)' }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                                style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#94a3b8',
                                }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </motion.button>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};


// Rich Text Editor Component - Professional Teacher-Focused Design
const RichTextEditor: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    icon?: React.ReactNode;
}> = ({ label, value, onChange, placeholder, required, icon }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
    const [showFontSizeDropdown, setShowFontSizeDropdown] = useState(false);
    const [showHeadingDropdown, setShowHeadingDropdown] = useState(false);
    const [currentFontSize, setCurrentFontSize] = useState('3');
    const fontSizeRef = useRef<HTMLDivElement>(null);
    const headingRef = useRef<HTMLDivElement>(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (fontSizeRef.current && !fontSizeRef.current.contains(e.target as Node)) {
                setShowFontSizeDropdown(false);
            }
            if (headingRef.current && !headingRef.current.contains(e.target as Node)) {
                setShowHeadingDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Initialize editor content only once when component mounts or value changes externally
    const isInitializedRef = useRef(false);
    useEffect(() => {
        if (editorRef.current && !isInitializedRef.current && value) {
            editorRef.current.innerHTML = value;
            isInitializedRef.current = true;
        }
    }, [value]);

    // Reset initialization flag when value is cleared externally
    useEffect(() => {
        if (!value && editorRef.current) {
            editorRef.current.innerHTML = '';
            isInitializedRef.current = false;
        }
    }, [value]);

    const fontSizes = [
        { value: '1', label: 'Small', size: '10px' },
        { value: '2', label: 'Normal', size: '13px' },
        { value: '3', label: 'Medium', size: '16px' },
        { value: '4', label: 'Large', size: '18px' },
        { value: '5', label: 'X-Large', size: '24px' },
        { value: '6', label: 'XX-Large', size: '32px' },
    ];

    const headingOptions = [
        { value: 'p', label: 'Paragraph', tag: 'Normal text' },
        { value: 'h1', label: 'Heading 1', tag: 'Large title' },
        { value: 'h2', label: 'Heading 2', tag: 'Section title' },
        { value: 'h3', label: 'Heading 3', tag: 'Subsection' },
    ];

    const updateActiveFormats = () => {
        const formats = new Set<string>();
        if (document.queryCommandState('bold')) formats.add('bold');
        if (document.queryCommandState('italic')) formats.add('italic');
        if (document.queryCommandState('underline')) formats.add('underline');
        if (document.queryCommandState('strikeThrough')) formats.add('strikethrough');
        if (document.queryCommandState('insertUnorderedList')) formats.add('ul');
        if (document.queryCommandState('insertOrderedList')) formats.add('ol');
        if (document.queryCommandState('justifyLeft')) formats.add('alignLeft');
        if (document.queryCommandState('justifyCenter')) formats.add('alignCenter');
        if (document.queryCommandState('justifyRight')) formats.add('alignRight');
        setActiveFormats(formats);
        
        // Update current font size
        const fontSize = document.queryCommandValue('fontSize');
        if (fontSize) setCurrentFontSize(fontSize);
    };

    const execCommand = (command: string, value?: string) => {
        // Ensure editor has focus before executing command
        editorRef.current?.focus();
        document.execCommand(command, false, value);
        updateActiveFormats();
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    // Clear all formatting including lists
    const clearAllFormatting = () => {
        editorRef.current?.focus();
        // Remove inline formatting
        document.execCommand('removeFormat', false);
        // Remove lists if active
        if (document.queryCommandState('insertUnorderedList')) {
            document.execCommand('insertUnorderedList', false);
        }
        if (document.queryCommandState('insertOrderedList')) {
            document.execCommand('insertOrderedList', false);
        }
        // Reset to paragraph
        document.execCommand('formatBlock', false, 'p');
        updateActiveFormats();
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
        updateActiveFormats();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            execCommand('insertHTML', '&nbsp;&nbsp;&nbsp;&nbsp;');
        }
        // Keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'b': e.preventDefault(); execCommand('bold'); break;
                case 'i': e.preventDefault(); execCommand('italic'); break;
                case 'u': e.preventDefault(); execCommand('underline'); break;
                case 'l': e.preventDefault(); execCommand('justifyLeft'); break;
                case 'e': e.preventDefault(); execCommand('justifyCenter'); break;
                case 'r': e.preventDefault(); execCommand('justifyRight'); break;
            }
        }
    };

    // Toolbar button component with tooltip
    const ToolbarButton: React.FC<{
        title: string;
        isActive?: boolean;
        onClick: () => void;
        children: React.ReactNode;
    }> = ({ title, isActive, onClick, children }) => {
        const [isHovered, setIsHovered] = useState(false);
        
        return (
            <div 
                style={{ position: 'relative' }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <motion.button
                    type="button"
                    initial={false}
                    animate={{
                        background: isActive ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                        color: isActive ? '#3b82f6' : '#64748b',
                    }}
                    whileHover={{ 
                        background: 'rgba(59, 130, 246, 0.1)',
                        scale: 1.05,
                    }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={onClick}
                    style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {children}
                </motion.button>
                <AnimatePresence>
                    {isHovered && (
                        <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 2 }}
                            transition={{ duration: 0.15, ease: 'easeOut', delay: 0.1 }}
                            style={{
                                position: 'absolute',
                                top: 'calc(100% + 6px)',
                                left: 0,
                                right: 0,
                                display: 'flex',
                                justifyContent: 'center',
                                pointerEvents: 'none',
                                zIndex: 1000,
                            }}
                        >
                            <div style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                background: '#ffffff',
                                color: '#3b82f6',
                                border: '1px solid rgba(59, 130, 246, 0.2)',
                                fontSize: '11px',
                                fontWeight: 500,
                                whiteSpace: 'nowrap',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            }}>
                                {title}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    // SVG Icons for toolbar
    const icons = {
        bold: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>,
        italic: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>,
        underline: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>,
        strikethrough: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="12" x2="20" y2="12"/><path d="M17.5 7.5c-.7-1.5-2.5-2.5-5-2.5-3 0-5 1.5-5 4 0 1.5.5 2.5 2 3"/><path d="M9.5 16.5c.7 1.5 2.5 2.5 5 2.5 3 0 5-1.5 5-4 0-1-.5-2-1.5-2.5"/></svg>,
        ul: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor"/><circle cx="4" cy="12" r="1.5" fill="currentColor"/><circle cx="4" cy="18" r="1.5" fill="currentColor"/></svg>,
        ol: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><text x="3" y="7" fontSize="6" fill="currentColor" fontWeight="600">1</text><text x="3" y="13" fontSize="6" fill="currentColor" fontWeight="600">2</text><text x="3" y="19" fontSize="6" fill="currentColor" fontWeight="600">3</text></svg>,
        alignLeft: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>,
        alignCenter: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>,
        alignRight: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>,
        link: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
        code: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
        quote: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z"/></svg>,
        undo: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>,
        redo: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>,
        clear: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12"/><path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/></svg>,
        fontSize: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><text x="3" y="16" fontSize="14" fill="currentColor" fontWeight="700">A</text><text x="14" y="18" fontSize="10" fill="currentColor" fontWeight="600">a</text></svg>,
        heading: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M17 10v8"/><path d="M21 10v8"/><path d="M17 14h4"/></svg>,
    };

    return (
        <div style={{ marginBottom: '16px' }}>
            <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 500,
                color: '#334155',
                marginBottom: '8px',
            }}>
                {icon && <span style={{ color: '#3b82f6' }}>{icon}</span>}
                {label}
                {required && <span style={{ color: '#ef4444', marginLeft: '2px' }}>*</span>}
            </label>
            <motion.div 
                initial={false}
                animate={{
                    borderColor: isFocused ? '#3b82f6' : 'rgba(0,0,0,0.08)',
                    boxShadow: isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
                }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{
                    borderRadius: '12px',
                    border: '1px solid',
                    background: '#ffffff',
                    overflow: 'hidden',
                }}
            >
                {/* Professional Toolbar */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 14px',
                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                    background: 'linear-gradient(to bottom, rgba(248,250,252,1), rgba(241,245,249,0.5))',
                    flexWrap: 'wrap',
                    rowGap: '8px',
                }}>
                    {/* Heading Dropdown */}
                    <div ref={headingRef} style={{ position: 'relative' }}>
                        <motion.button
                            type="button"
                            whileHover={{ background: 'rgba(59, 130, 246, 0.08)' }}
                            whileTap={{ scale: 0.98 }}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => { setShowHeadingDropdown(!showHeadingDropdown); setShowFontSizeDropdown(false); }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 10px',
                                borderRadius: '8px',
                                border: '1px solid rgba(0,0,0,0.06)',
                                background: showHeadingDropdown ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255,255,255,0.8)',
                                color: '#475569',
                                fontSize: '12px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                minWidth: '100px',
                            }}
                        >
                            {icons.heading}
                            <span>Paragraph</span>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: 'auto' }}>
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </motion.button>
                        <AnimatePresence>
                            {showHeadingDropdown && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                                    transition={{ duration: 0.15, ease: 'easeOut' }}
                                    style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        marginTop: '4px',
                                        background: '#ffffff',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(0,0,0,0.08)',
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                        padding: '6px',
                                        zIndex: 100,
                                        minWidth: '160px',
                                    }}
                                >
                                    {headingOptions.map((opt, idx) => (
                                        <motion.button
                                            key={opt.value}
                                            type="button"
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.03, duration: 0.15 }}
                                            whileHover={{ background: 'rgba(59, 130, 246, 0.06)' }}
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => {
                                                execCommand('formatBlock', opt.value);
                                                setShowHeadingDropdown(false);
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '8px 12px',
                                                borderRadius: '6px',
                                                border: 'none',
                                                background: 'transparent',
                                                color: '#334155',
                                                fontSize: opt.value === 'h1' ? '16px' : opt.value === 'h2' ? '14px' : opt.value === 'h3' ? '13px' : '12px',
                                                fontWeight: opt.value === 'p' ? 400 : 600,
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                            }}
                                        >
                                            {opt.label}
                                            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 400 }}>{opt.tag}</span>
                                        </motion.button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Font Size Dropdown */}
                    <div ref={fontSizeRef} style={{ position: 'relative' }}>
                        <motion.button
                            type="button"
                            whileHover={{ background: 'rgba(59, 130, 246, 0.08)' }}
                            whileTap={{ scale: 0.98 }}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => { setShowFontSizeDropdown(!showFontSizeDropdown); setShowHeadingDropdown(false); }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 10px',
                                borderRadius: '8px',
                                border: '1px solid rgba(0,0,0,0.06)',
                                background: showFontSizeDropdown ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255,255,255,0.8)',
                                color: '#475569',
                                fontSize: '12px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                minWidth: '80px',
                            }}
                        >
                            {icons.fontSize}
                            <span>{fontSizes.find(f => f.value === currentFontSize)?.label || 'Medium'}</span>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: 'auto' }}>
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </motion.button>
                        <AnimatePresence>
                            {showFontSizeDropdown && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                                    transition={{ duration: 0.15, ease: 'easeOut' }}
                                    style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        marginTop: '4px',
                                        background: '#ffffff',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(0,0,0,0.08)',
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                        padding: '6px',
                                        zIndex: 100,
                                        minWidth: '140px',
                                    }}
                                >
                                    {fontSizes.map((size, idx) => (
                                        <motion.button
                                            key={size.value}
                                            type="button"
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.03, duration: 0.15 }}
                                            whileHover={{ background: 'rgba(59, 130, 246, 0.06)' }}
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => {
                                                execCommand('fontSize', size.value);
                                                setCurrentFontSize(size.value);
                                                setShowFontSizeDropdown(false);
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '8px 12px',
                                                borderRadius: '6px',
                                                border: 'none',
                                                background: currentFontSize === size.value ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                                                color: currentFontSize === size.value ? '#3b82f6' : '#334155',
                                                fontSize: '12px',
                                                fontWeight: currentFontSize === size.value ? 600 : 400,
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                            }}
                                        >
                                            <span style={{ fontSize: size.size }}>{size.label}</span>
                                            {currentFontSize === size.value && (
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            )}
                                        </motion.button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Divider */}
                    <div style={{ width: '1px', height: '24px', background: 'rgba(0,0,0,0.1)', margin: '0 4px' }} />

                    {/* Text Formatting Group */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', padding: '3px' }}>
                        <ToolbarButton title="Bold (Ctrl+B)" isActive={activeFormats.has('bold')} onClick={() => execCommand('bold')}>
                            {icons.bold}
                        </ToolbarButton>
                        <ToolbarButton title="Italic (Ctrl+I)" isActive={activeFormats.has('italic')} onClick={() => execCommand('italic')}>
                            {icons.italic}
                        </ToolbarButton>
                        <ToolbarButton title="Underline (Ctrl+U)" isActive={activeFormats.has('underline')} onClick={() => execCommand('underline')}>
                            {icons.underline}
                        </ToolbarButton>
                        <ToolbarButton title="Strikethrough" isActive={activeFormats.has('strikethrough')} onClick={() => execCommand('strikeThrough')}>
                            {icons.strikethrough}
                        </ToolbarButton>
                    </div>

                    {/* Divider */}
                    <div style={{ width: '1px', height: '24px', background: 'rgba(0,0,0,0.1)', margin: '0 4px' }} />

                    {/* Alignment Group */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', padding: '3px' }}>
                        <ToolbarButton title="Align Left (Ctrl+L)" isActive={activeFormats.has('alignLeft')} onClick={() => execCommand('justifyLeft')}>
                            {icons.alignLeft}
                        </ToolbarButton>
                        <ToolbarButton title="Align Center (Ctrl+E)" isActive={activeFormats.has('alignCenter')} onClick={() => execCommand('justifyCenter')}>
                            {icons.alignCenter}
                        </ToolbarButton>
                        <ToolbarButton title="Align Right (Ctrl+R)" isActive={activeFormats.has('alignRight')} onClick={() => execCommand('justifyRight')}>
                            {icons.alignRight}
                        </ToolbarButton>
                    </div>

                    {/* Divider */}
                    <div style={{ width: '1px', height: '24px', background: 'rgba(0,0,0,0.1)', margin: '0 4px' }} />

                    {/* Lists Group */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', padding: '3px' }}>
                        <ToolbarButton title="Bullet List" isActive={activeFormats.has('ul')} onClick={() => execCommand('insertUnorderedList')}>
                            {icons.ul}
                        </ToolbarButton>
                        <ToolbarButton title="Numbered List" isActive={activeFormats.has('ol')} onClick={() => execCommand('insertOrderedList')}>
                            {icons.ol}
                        </ToolbarButton>
                    </div>

                    {/* Divider */}
                    <div style={{ width: '1px', height: '24px', background: 'rgba(0,0,0,0.1)', margin: '0 4px' }} />

                    {/* Insert Group */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', padding: '3px' }}>
                        <ToolbarButton title="Insert Link" isActive={false} onClick={() => {
                            const url = prompt('Enter URL:');
                            if (url) execCommand('createLink', url);
                        }}>
                            {icons.link}
                        </ToolbarButton>
                        <ToolbarButton title="Block Quote" isActive={false} onClick={() => execCommand('formatBlock', 'blockquote')}>
                            {icons.quote}
                        </ToolbarButton>
                        <ToolbarButton title="Code Block" isActive={false} onClick={() => execCommand('formatBlock', 'pre')}>
                            {icons.code}
                        </ToolbarButton>
                    </div>

                    {/* Spacer */}
                    <div style={{ flex: 1, minWidth: '16px' }} />

                    {/* Undo/Redo Group */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', padding: '3px' }}>
                        <ToolbarButton title="Undo (Ctrl+Z)" isActive={false} onClick={() => execCommand('undo')}>
                            {icons.undo}
                        </ToolbarButton>
                        <ToolbarButton title="Redo (Ctrl+Y)" isActive={false} onClick={() => execCommand('redo')}>
                            {icons.redo}
                        </ToolbarButton>
                    </div>

                    {/* Divider */}
                    <div style={{ width: '1px', height: '24px', background: 'rgba(0,0,0,0.1)', margin: '0 4px' }} />

                    {/* Clear Formatting */}
                    <ToolbarButton title="Clear Formatting" isActive={false} onClick={clearAllFormatting}>
                        {icons.clear}
                    </ToolbarButton>
                </div>

                {/* Editor Area */}
                <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleInput}
                    onFocus={() => { setIsFocused(true); updateActiveFormats(); }}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={handleKeyDown}
                    onMouseUp={updateActiveFormats}
                    onKeyUp={updateActiveFormats}
                    data-placeholder={placeholder}
                    suppressContentEditableWarning
                    style={{
                        minHeight: '180px',
                        padding: '16px 18px',
                        fontSize: '14px',
                        color: '#1e293b',
                        outline: 'none',
                        lineHeight: 1.7,
                        background: '#ffffff',
                        direction: 'ltr',
                        textAlign: 'left',
                    }}
                />

                {/* Footer with shortcuts hint */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 14px',
                    borderTop: '1px solid rgba(0,0,0,0.04)',
                    background: 'rgba(248,250,252,0.5)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                            <kbd style={{ padding: '2px 5px', borderRadius: '4px', background: 'rgba(0,0,0,0.04)', fontSize: '9px', fontFamily: 'inherit' }}>Ctrl</kbd>
                            <span style={{ margin: '0 3px' }}>+</span>
                            <kbd style={{ padding: '2px 5px', borderRadius: '4px', background: 'rgba(0,0,0,0.04)', fontSize: '9px', fontFamily: 'inherit' }}>B</kbd>
                            <span style={{ marginLeft: '4px' }}>Bold</span>
                        </span>
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                            <kbd style={{ padding: '2px 5px', borderRadius: '4px', background: 'rgba(0,0,0,0.04)', fontSize: '9px', fontFamily: 'inherit' }}>Ctrl</kbd>
                            <span style={{ margin: '0 3px' }}>+</span>
                            <kbd style={{ padding: '2px 5px', borderRadius: '4px', background: 'rgba(0,0,0,0.04)', fontSize: '9px', fontFamily: 'inherit' }}>I</kbd>
                            <span style={{ marginLeft: '4px' }}>Italic</span>
                        </span>
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                            <kbd style={{ padding: '2px 5px', borderRadius: '4px', background: 'rgba(0,0,0,0.04)', fontSize: '9px', fontFamily: 'inherit' }}>Ctrl</kbd>
                            <span style={{ margin: '0 3px' }}>+</span>
                            <kbd style={{ padding: '2px 5px', borderRadius: '4px', background: 'rgba(0,0,0,0.04)', fontSize: '9px', fontFamily: 'inherit' }}>U</kbd>
                            <span style={{ marginLeft: '4px' }}>Underline</span>
                        </span>
                    </div>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                        Rich text editor for teachers
                    </span>
                </div>
            </motion.div>
        </div>
    );
};


// Rubric Builder Component
const RubricBuilder: React.FC<{
    criteria: RubricCriterion[];
    onChange: (criteria: RubricCriterion[]) => void;
    totalPoints: number;
}> = ({ criteria, onChange, totalPoints }) => {
    const [expandedCriterion, setExpandedCriterion] = useState<string | null>(null);

    const addCriterion = () => {
        const newCriterion: RubricCriterion = {
            id: `criterion-${Date.now()}`,
            name: '',
            description: '',
            points: Math.floor(totalPoints / (criteria.length + 1)),
            levels: [
                { label: 'Excellent', points: 100, description: 'Exceeds expectations' },
                { label: 'Good', points: 75, description: 'Meets expectations' },
                { label: 'Fair', points: 50, description: 'Partially meets expectations' },
                { label: 'Poor', points: 25, description: 'Below expectations' },
            ],
        };
        onChange([...criteria, newCriterion]);
        setExpandedCriterion(newCriterion.id);
    };

    const updateCriterion = (id: string, updates: Partial<RubricCriterion>) => {
        onChange(criteria.map(c => c.id === id ? { ...c, ...updates } : c));
    };

    const removeCriterion = (id: string) => {
        onChange(criteria.filter(c => c.id !== id));
    };

    const updateLevel = (criterionId: string, levelIndex: number, updates: Partial<RubricCriterion['levels'][0]>) => {
        onChange(criteria.map(c => {
            if (c.id === criterionId) {
                const newLevels = [...c.levels];
                newLevels[levelIndex] = { ...newLevels[levelIndex], ...updates };
                return { ...c, levels: newLevels };
            }
            return c;
        }));
    };

    const totalRubricPoints = criteria.reduce((sum, c) => sum + c.points, 0);
    const pointsMismatch = totalRubricPoints !== totalPoints;

    return (
        <div style={{ marginTop: '16px' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                            <rect x="9" y="3" width="6" height="4" rx="1" />
                            <path d="M9 12h6" />
                            <path d="M9 16h6" />
                        </svg>
                    </div>
                    <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>
                            Grading Rubric
                        </div>
                        <div style={{ 
                            fontSize: '12px', 
                            color: '#64748b', 
                            marginTop: '2px',
                        }}>
                            Total: {totalRubricPoints}/{totalPoints} points
                        </div>
                    </div>
                    {pointsMismatch && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, x: -8 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            whileHover={{ scale: 1.02 }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '5px 10px',
                                borderRadius: '8px',
                                background: 'rgba(245, 158, 11, 0.08)',
                                border: '1px solid rgba(245, 158, 11, 0.2)',
                                cursor: 'default',
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <span style={{ 
                                fontSize: '11px', 
                                fontWeight: 500, 
                                color: '#f59e0b',
                            }}>
                                Points don't match
                            </span>
                        </motion.div>
                    )}
                </div>
                <motion.button
                    whileHover={{ 
                        scale: 1.02, 
                        boxShadow: '0 6px 20px rgba(59, 130, 246, 0.25)',
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={addCriterion}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        background: 'rgba(59, 130, 246, 0.08)',
                        color: '#3b82f6',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                    }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Criterion
                </motion.button>
            </div>

            {/* Criteria List */}
            {criteria.length === 0 ? (
                <div style={{
                    padding: '32px',
                    borderRadius: '12px',
                    border: '2px dashed rgba(0,0,0,0.1)',
                    textAlign: 'center',
                    color: '#94a3b8',
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 12px auto',
                    }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                            <rect x="9" y="3" width="6" height="4" rx="1" />
                            <path d="M9 12h6" />
                            <path d="M9 16h6" />
                        </svg>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>No criteria added yet</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>Click "Add Criterion" to start building your rubric</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {criteria.map((criterion, index) => (
                        <motion.div
                            key={criterion.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                borderRadius: '12px',
                                border: '1px solid rgba(0,0,0,0.08)',
                                background: '#fff',
                                overflow: 'hidden',
                            }}
                        >
                            {/* Criterion Header */}
                            <div
                                onClick={() => setExpandedCriterion(expandedCriterion === criterion.id ? null : criterion.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '14px 16px',
                                    cursor: 'pointer',
                                    background: expandedCriterion === criterion.id ? 'rgba(59, 130, 246, 0.04)' : 'transparent',
                                }}
                            >
                                <div style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '8px',
                                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#3b82f6',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                }}>
                                    {index + 1}
                                </div>
                                <input
                                    type="text"
                                    value={criterion.name}
                                    onChange={(e) => updateCriterion(criterion.id, { name: e.target.value })}
                                    onClick={(e) => e.stopPropagation()}
                                    placeholder="Criterion name (e.g., Code Quality)"
                                    style={{
                                        flex: 1,
                                        border: 'none',
                                        background: 'transparent',
                                        fontSize: '14px',
                                        fontWeight: 500,
                                        color: '#1e293b',
                                        outline: 'none',
                                    }}
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input
                                        type="number"
                                        value={criterion.points}
                                        onChange={(e) => updateCriterion(criterion.id, { points: parseInt(e.target.value) || 0 })}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                            width: '60px',
                                            padding: '6px 10px',
                                            borderRadius: '6px',
                                            border: '1px solid rgba(0,0,0,0.1)',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            textAlign: 'center',
                                        }}
                                    />
                                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>pts</span>
                                    <motion.button
                                        whileHover={{ background: 'rgba(239, 68, 68, 0.1)' }}
                                        onClick={(e) => { e.stopPropagation(); removeCriterion(criterion.id); }}
                                        style={{
                                            width: '28px',
                                            height: '28px',
                                            borderRadius: '6px',
                                            border: 'none',
                                            background: 'transparent',
                                            color: '#94a3b8',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                    </motion.button>
                                    <motion.div
                                        animate={{ rotate: expandedCriterion === criterion.id ? 180 : 0 }}
                                        style={{ color: '#94a3b8' }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                    </motion.div>
                                </div>
                            </div>

                            {/* Expanded Content */}
                            <AnimatePresence>
                                {expandedCriterion === criterion.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        style={{ overflow: 'hidden' }}
                                    >
                                        <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                                            <textarea
                                                value={criterion.description}
                                                onChange={(e) => updateCriterion(criterion.id, { description: e.target.value })}
                                                placeholder="Describe what this criterion evaluates..."
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 12px',
                                                    borderRadius: '8px',
                                                    border: '1px solid rgba(0,0,0,0.1)',
                                                    fontSize: '13px',
                                                    resize: 'none',
                                                    marginTop: '12px',
                                                    outline: 'none',
                                                }}
                                                rows={2}
                                            />
                                            
                                            {/* Performance Levels */}
                                            <div style={{ marginTop: '20px' }}>
                                                <div style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: '8px',
                                                    marginBottom: '12px' 
                                                }}>
                                                    <div style={{
                                                        width: '28px',
                                                        height: '28px',
                                                        borderRadius: '8px',
                                                        background: 'rgba(59, 130, 246, 0.08)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M12 20V10" />
                                                            <path d="M18 20V4" />
                                                            <path d="M6 20v-4" />
                                                        </svg>
                                                    </div>
                                                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                                                        Performance Levels
                                                    </span>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                                    {criterion.levels.map((level, levelIndex) => {
                                                        const levelColors = [
                                                            { bg: 'rgba(16, 185, 129, 0.06)', border: 'rgba(16, 185, 129, 0.15)', accent: '#10b981' },
                                                            { bg: 'rgba(59, 130, 246, 0.06)', border: 'rgba(59, 130, 246, 0.15)', accent: '#3b82f6' },
                                                            { bg: 'rgba(245, 158, 11, 0.06)', border: 'rgba(245, 158, 11, 0.15)', accent: '#f59e0b' },
                                                            { bg: 'rgba(239, 68, 68, 0.06)', border: 'rgba(239, 68, 68, 0.15)', accent: '#ef4444' },
                                                        ];
                                                        const colorScheme = levelColors[levelIndex] || levelColors[0];
                                                        
                                                        return (
                                                            <motion.div
                                                                key={levelIndex}
                                                                whileHover={{ 
                                                                    y: -2,
                                                                    boxShadow: `0 6px 16px ${colorScheme.border}`,
                                                                    borderColor: colorScheme.accent,
                                                                }}
                                                                transition={{ duration: 0.2 }}
                                                                style={{
                                                                    padding: '10px 12px',
                                                                    borderRadius: '10px',
                                                                    border: `1px solid ${colorScheme.border}`,
                                                                    background: colorScheme.bg,
                                                                    cursor: 'default',
                                                                }}
                                                            >
                                                                <div style={{ 
                                                                    display: 'flex', 
                                                                    alignItems: 'center', 
                                                                    justifyContent: 'space-between',
                                                                    marginBottom: '6px',
                                                                }}>
                                                                    <input
                                                                        type="text"
                                                                        value={level.label}
                                                                        onChange={(e) => updateLevel(criterion.id, levelIndex, { label: e.target.value })}
                                                                        style={{
                                                                            flex: 1,
                                                                            border: 'none',
                                                                            background: 'transparent',
                                                                            fontSize: '11px',
                                                                            fontWeight: 600,
                                                                            color: colorScheme.accent,
                                                                            outline: 'none',
                                                                        }}
                                                                    />
                                                                    <div style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '2px',
                                                                        padding: '4px 10px',
                                                                        borderRadius: '6px',
                                                                        background: colorScheme.bg,
                                                                        border: `1px solid ${colorScheme.accent}`,
                                                                    }}>
                                                                        <input
                                                                            type="number"
                                                                            min={0}
                                                                            max={100}
                                                                            value={level.points}
                                                                            onChange={(e) => {
                                                                                const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                                                                updateLevel(criterion.id, levelIndex, { points: val });
                                                                            }}
                                                                            style={{
                                                                                width: '38px',
                                                                                border: 'none',
                                                                                background: 'transparent',
                                                                                fontSize: '12px',
                                                                                fontWeight: 700,
                                                                                color: colorScheme.accent,
                                                                                textAlign: 'center',
                                                                                outline: 'none',
                                                                            }}
                                                                        />
                                                                        <span style={{ fontSize: '11px', color: colorScheme.accent, fontWeight: 600 }}>%</span>
                                                                    </div>
                                                                </div>
                                                                <textarea
                                                                    value={level.description}
                                                                    onChange={(e) => updateLevel(criterion.id, levelIndex, { description: e.target.value })}
                                                                    placeholder="Description..."
                                                                    style={{
                                                                        width: '100%',
                                                                        border: 'none',
                                                                        background: 'transparent',
                                                                        fontSize: '10px',
                                                                        color: '#64748b',
                                                                        resize: 'none',
                                                                        outline: 'none',
                                                                        lineHeight: '1.4',
                                                                    }}
                                                                    rows={2}
                                                                />
                                                            </motion.div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};


// Main Modal Component
const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({ isOpen, onClose, onSubmit }) => {
    // Responsive state for mobile compatibility
    const { isMobile, isSmallMobile } = useResponsive();
    
    const [activeTab, setActiveTab] = useState<'details' | 'rubric' | 'settings' | 'attachments' | 'preview'>('details');
    const [formData, setFormData] = useState<AssignmentFormData>({
        title: '',
        description: '',
        course: '',
        section: '',
        sections: [], // Multiple sections for batch create
        type: 'assignment',
        dueDate: '',
        dueTime: '23:59',
        points: 100,
        instructions: '',
        attachments: [],
        allowLateSubmission: true,
        latePenalty: 10,
        maxAttempts: 1,
        rubricEnabled: false,
        rubricCriteria: [],
        notifyStudents: true,
        // New practical features
        schedulePublish: false,
        publishDate: '',
        publishTime: '08:00',
        copyToOtherCourses: [],
        prerequisiteEnabled: false,
        prerequisiteAssignment: '',
        saveAsTemplate: false,
        templateName: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [recentAssignments, setRecentAssignments] = useState<RecentAssignment[]>([]);
    const [loadingRecentAssignments, setLoadingRecentAssignments] = useState(false);
    const [courses, setCourses] = useState<{ id: string; name: string; sections: string[] }[]>([]);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [existingAssignments, setExistingAssignments] = useState<{ id: string; title: string; course: string; type: string }[]>([]);

    // Fetch courses from database
    useEffect(() => {
        const fetchCourses = async () => {
            if (!isOpen) return;
            
            setLoadingCourses(true);
            try {
                if (!supabase) {
                    // Fallback demo courses when Supabase is not configured
                    setCourses([
                        { id: 'demo-1', name: 'Introduction to Programming', sections: ['BSIT101A', 'BSIT101B', 'BSIT101C'] },
                        { id: 'demo-2', name: 'Data Structures', sections: ['BSIT101A', 'BSIT101B', 'BSIT101C'] },
                        { id: 'demo-3', name: 'Web Development', sections: ['BSIT101A', 'BSIT101B', 'BSIT101C'] },
                    ]);
                    return;
                }

                // Fetch all active courses from database
                const { data: coursesData, error } = await supabase
                    .from('courses')
                    .select('id, title, short_title, section')
                    .eq('is_active', true)
                    .order('title', { ascending: true });

                if (error) {
                    console.error('Error fetching courses:', error);
                    setCourses([]);
                    return;
                }

                if (coursesData && coursesData.length > 0) {
                    // Group sections by course and create course list
                    const courseMap = new Map<string, { id: string; name: string; sections: Set<string> }>();
                    
                    coursesData.forEach(course => {
                        if (!courseMap.has(course.id)) {
                            courseMap.set(course.id, {
                                id: course.id,
                                name: course.title,
                                sections: new Set<string>(),
                            });
                        }
                        if (course.section) {
                            courseMap.get(course.id)!.sections.add(course.section);
                        }
                    });

                    // Also fetch all unique sections from users table
                    const { data: sectionsData } = await supabase
                        .from('users')
                        .select('section')
                        .eq('role', 'student')
                        .eq('is_active', true);

                    const allSections = [...new Set(sectionsData?.map(s => s.section).filter(Boolean) || [])];
                    
                    // Add all sections to each course (since courses are shared across sections)
                    const formattedCourses = Array.from(courseMap.values()).map(course => ({
                        id: course.id,
                        name: course.name,
                        sections: allSections.length > 0 ? allSections : ['BSIT101A'], // Default section if none found
                    }));

                    setCourses(formattedCourses);
                } else {
                    // Fallback demo courses when database is empty
                    setCourses([
                        { id: 'demo-1', name: 'Introduction to Programming', sections: ['BSIT101A', 'BSIT101B', 'BSIT101C'] },
                        { id: 'demo-2', name: 'Data Structures', sections: ['BSIT101A', 'BSIT101B', 'BSIT101C'] },
                        { id: 'demo-3', name: 'Web Development', sections: ['BSIT101A', 'BSIT101B', 'BSIT101C'] },
                    ]);
                }
            } catch (err) {
                console.error('Failed to fetch courses:', err);
                // Fallback demo courses on error
                setCourses([
                    { id: 'demo-1', name: 'Introduction to Programming', sections: ['BSIT101A', 'BSIT101B', 'BSIT101C'] },
                    { id: 'demo-2', name: 'Data Structures', sections: ['BSIT101A', 'BSIT101B', 'BSIT101C'] },
                    { id: 'demo-3', name: 'Web Development', sections: ['BSIT101A', 'BSIT101B', 'BSIT101C'] },
                ]);
            } finally {
                setLoadingCourses(false);
            }
        };

        fetchCourses();
    }, [isOpen]);

    // Fetch existing assignments for prerequisites
    useEffect(() => {
        const fetchExistingAssignments = async () => {
            if (!isOpen || !formData.course) return;
            
            try {
                if (!supabase) {
                    // Fallback demo assignments when Supabase is not configured
                    setExistingAssignments([
                        { id: 'prereq-1', title: 'Introduction to Variables', course: formData.course, type: 'assignment' },
                        { id: 'prereq-2', title: 'Basic Data Types Quiz', course: formData.course, type: 'quiz' },
                        { id: 'prereq-3', title: 'Control Structures Lab', course: formData.course, type: 'assignment' },
                        { id: 'prereq-4', title: 'Midterm Exam', course: formData.course, type: 'exam' },
                    ]);
                    return;
                }

                const { data: tasks, error } = await supabase
                    .from('course_tasks')
                    .select('id, title, course_id, type')
                    .eq('course_id', formData.course)
                    .eq('status', 'published')
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Error fetching existing assignments:', error);
                    // Fallback demo assignments on error
                    setExistingAssignments([
                        { id: 'prereq-1', title: 'Introduction to Variables', course: formData.course, type: 'assignment' },
                        { id: 'prereq-2', title: 'Basic Data Types Quiz', course: formData.course, type: 'quiz' },
                        { id: 'prereq-3', title: 'Control Structures Lab', course: formData.course, type: 'assignment' },
                    ]);
                    return;
                }

                if (tasks && tasks.length > 0) {
                    setExistingAssignments(tasks.map(t => ({
                        id: t.id,
                        title: t.title,
                        course: t.course_id,
                        type: t.type,
                    })));
                } else {
                    // Fallback demo assignments when database is empty
                    setExistingAssignments([
                        { id: 'prereq-1', title: 'Introduction to Variables', course: formData.course, type: 'assignment' },
                        { id: 'prereq-2', title: 'Basic Data Types Quiz', course: formData.course, type: 'quiz' },
                        { id: 'prereq-3', title: 'Control Structures Lab', course: formData.course, type: 'assignment' },
                    ]);
                }
            } catch (err) {
                console.error('Failed to fetch existing assignments:', err);
                // Fallback demo assignments on error
                setExistingAssignments([
                    { id: 'prereq-1', title: 'Introduction to Variables', course: formData.course, type: 'assignment' },
                    { id: 'prereq-2', title: 'Basic Data Types Quiz', course: formData.course, type: 'quiz' },
                ]);
            }
        };

        fetchExistingAssignments();
    }, [isOpen, formData.course]);

    // Fetch recent assignments from database
    useEffect(() => {
        const fetchRecentAssignments = async () => {
            if (!isOpen) return;
            
            setLoadingRecentAssignments(true);
            try {
                if (!supabase) {
                    setRecentAssignments([]);
                    return;
                }

                // Fetch recent tasks from course_tasks table
                const { data: tasks, error } = await supabase
                    .from('course_tasks')
                    .select('id, title, course_id, type, description, instructions, points, created_at')
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (error) {
                    console.error('Error fetching recent assignments:', error);
                    setRecentAssignments([]);
                    return;
                }

                if (tasks && tasks.length > 0) {
                    // Get course names
                    const courseIds = [...new Set(tasks.map(t => t.course_id))];
                    const { data: courses } = await supabase
                        .from('courses')
                        .select('id, title')
                        .in('id', courseIds);

                    const courseMap = new Map(courses?.map(c => [c.id, c.title]) || []);

                    const formattedAssignments: RecentAssignment[] = tasks.map(task => ({
                        id: task.id,
                        title: task.title,
                        course: task.course_id,
                        courseName: courseMap.get(task.course_id) || task.course_id.toUpperCase(),
                        date: new Date(task.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                        }),
                        type: task.type || 'assignment',
                        description: task.description || '',
                        instructions: task.instructions || '',
                        points: task.points || 100,
                    }));

                    setRecentAssignments(formattedAssignments);
                } else {
                    setRecentAssignments([]);
                }
            } catch (err) {
                console.error('Failed to fetch recent assignments:', err);
                setRecentAssignments([]);
            } finally {
                setLoadingRecentAssignments(false);
            }
        };

        fetchRecentAssignments();
    }, [isOpen]);

    // Get sections for selected course
    const selectedCourse = courses.find(c => c.id === formData.course);
    const availableSections = selectedCourse?.sections || [];
    
    // Get available prerequisites (assignments from the same course)
    const availablePrerequisites = existingAssignments.filter(a => a.course === formData.course);
    
    // Get other courses for copy feature (exclude current course)
    const otherCourses = courses.filter(c => c.id !== formData.course);

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        onSubmit(formData);
        setIsSubmitting(false);
        onClose();
    };

    const updateFormData = <K extends keyof AssignmentFormData>(key: K, value: AssignmentFormData[K]) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const tabs = [
        { id: 'details', label: 'Details', icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
        )},
        { id: 'rubric', label: 'Rubric', icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="3" y1="15" x2="21" y2="15" />
                <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
        )},
        { id: 'settings', label: 'Settings', icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
        )},
        { id: 'attachments', label: 'Attachments', icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
        )},
        { id: 'preview', label: 'Preview', icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
            </svg>
        )},
    ];


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
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0, 0, 0, 0.5)',
                            backdropFilter: 'blur(4px)',
                            zIndex: 9998,
                        }}
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
                            initial={{ opacity: 0, scale: isMobile ? 1 : 0.95, y: isMobile ? '100%' : 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: isMobile ? 1 : 0.95, y: isMobile ? '100%' : 20 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            style={{
                                width: '100%',
                                maxWidth: isMobile ? '100%' : '900px',
                                height: isMobile ? '100%' : 'auto',
                                maxHeight: isMobile ? '100%' : '90vh',
                                background: '#ffffff',
                                borderRadius: isMobile ? 0 : '20px',
                                boxShadow: isMobile ? 'none' : '0 24px 48px rgba(0, 0, 0, 0.15)',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                pointerEvents: 'auto',
                            }}
                        >
                            {/* Header */}
                            <div style={{
                                padding: isMobile ? '16px' : '20px 24px',
                                borderBottom: '1px solid rgba(0,0,0,0.06)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: isMobile ? '12px' : '16px',
                            }}>
                                <div style={{
                                    width: isMobile ? '40px' : '48px',
                                    height: isMobile ? '40px' : '48px',
                                    borderRadius: isMobile ? '10px' : '14px',
                                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)',
                                    border: '1px solid rgba(59, 130, 246, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#3b82f6',
                                    flexShrink: 0,
                                }}>
                                    <svg width={isMobile ? "20" : "24"} height={isMobile ? "20" : "24"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <line x1="12" y1="18" x2="12" y2="12" />
                                        <line x1="9" y1="15" x2="15" y2="15" />
                                    </svg>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h2 style={{ margin: 0, fontSize: isMobile ? '16px' : '18px', fontWeight: 600, color: '#0f172a' }}>
                                        Create New Assignment
                                    </h2>
                                    {!isSmallMobile && (
                                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            Fill in the details to create a new assignment for your students
                                        </p>
                                    )}
                                </div>
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
                                        color: '#64748b',
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
                            <div style={{
                                padding: isMobile ? '0 12px' : '0 24px',
                                borderBottom: '1px solid rgba(0,0,0,0.06)',
                                display: 'flex',
                                justifyContent: isMobile ? 'flex-start' : 'center',
                                gap: '4px',
                                overflowX: isMobile ? 'auto' : 'visible',
                                WebkitOverflowScrolling: 'touch',
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none',
                            }}>
                                {tabs.map((tab) => (
                                    <motion.button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                        whileHover={{ background: activeTab === tab.id ? 'rgba(59, 130, 246, 0.1)' : 'rgba(0,0,0,0.04)' }}
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
                                            color: activeTab === tab.id ? '#3b82f6' : '#64748b',
                                            borderBottom: `2px solid ${activeTab === tab.id ? '#3b82f6' : 'transparent'}`,
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
                                                background: '#3b82f6',
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
                                                    background: 'rgba(59, 130, 246, 0.15)',
                                                    color: '#3b82f6',
                                                    border: '1px solid rgba(59, 130, 246, 0.2)',
                                                }}>
                                                {formData.rubricCriteria.length}
                                            </motion.span>
                                        )}
                                    </motion.button>
                                ))}
                            </div>

                            {/* Content */}
                            <div style={{
                                flex: 1,
                                overflow: 'auto',
                                padding: '24px',
                            }}>
                                <AnimatePresence mode="wait">
                                    {activeTab === 'details' && (
                                        <motion.div
                                            key="details"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            {/* Quick Start Templates Section */}
                                            <div style={{ marginBottom: isMobile ? '16px' : '24px' }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    marginBottom: isMobile ? '10px' : '12px',
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                                                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                                        </svg>
                                                        <span style={{ fontSize: isMobile ? '12px' : '13px', fontWeight: 600, color: '#334155' }}>Quick Start</span>
                                                        <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontWeight: 600 }}>NEW</span>
                                                    </div>
                                                </div>

                                                {/* Quick Templates Grid - Horizontal scroll on mobile */}
                                                <div style={{
                                                    display: isMobile ? 'flex' : 'grid',
                                                    gridTemplateColumns: isMobile ? undefined : 'repeat(3, 1fr)',
                                                    gap: '10px',
                                                    marginBottom: isMobile ? '12px' : '16px',
                                                    overflowX: isMobile ? 'auto' : undefined,
                                                    paddingBottom: isMobile ? '4px' : undefined,
                                                    marginLeft: isMobile ? '-4px' : undefined,
                                                    marginRight: isMobile ? '-4px' : undefined,
                                                    paddingLeft: isMobile ? '4px' : undefined,
                                                    paddingRight: isMobile ? '4px' : undefined,
                                                }}>
                                                    {QUICK_TEMPLATES.map((template) => (
                                                        <motion.button
                                                            key={template.id}
                                                            whileHover={!isMobile ? { scale: 1.02, y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } : undefined}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={() => {
                                                                updateFormData('title', template.defaults.title);
                                                                updateFormData('description', template.defaults.assignmentDescription);
                                                                updateFormData('type', template.defaults.type);
                                                                updateFormData('points', template.defaults.points);
                                                                updateFormData('maxAttempts', template.defaults.maxAttempts);
                                                                updateFormData('allowLateSubmission', template.defaults.allowLateSubmission);
                                                                updateFormData('latePenalty', template.defaults.latePenalty);
                                                                updateFormData('instructions', template.defaults.instructions);
                                                            }}
                                                            style={{
                                                                padding: isMobile ? '12px 14px' : '14px 12px',
                                                                borderRadius: '12px',
                                                                border: '1px solid rgba(0,0,0,0.08)',
                                                                background: '#fff',
                                                                cursor: 'pointer',
                                                                textAlign: 'left',
                                                                display: 'flex',
                                                                flexDirection: isMobile ? 'row' : 'column',
                                                                alignItems: isMobile ? 'center' : undefined,
                                                                gap: isMobile ? '10px' : '6px',
                                                                minWidth: isMobile ? '160px' : undefined,
                                                                flexShrink: isMobile ? 0 : undefined,
                                                            }}
                                                        >
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                                                {getTemplateIcon(template.icon, template.color)}
                                                                {!isMobile && (
                                                                <span style={{ fontSize: '12px', fontWeight: 600, color: template.color }}>
                                                                    {template.name}
                                                                </span>
                                                                )}
                                                            </div>
                                                            {isMobile ? (
                                                                <div>
                                                                    <span style={{ fontSize: '12px', fontWeight: 600, color: template.color, display: 'block' }}>
                                                                        {template.name}
                                                                    </span>
                                                                    <span style={{ fontSize: '10px', color: '#94a3b8', lineHeight: 1.3 }}>
                                                                        {template.description}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                            <span style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.3 }}>
                                                                {template.description}
                                                            </span>
                                                            )}
                                                        </motion.button>
                                                    ))}
                                                </div>

                                                {/* Use Previous Assignment as Template - Hide on small mobile */}
                                                {!isSmallMobile && (
                                                <div style={{
                                                    padding: isMobile ? '12px 14px' : '14px 16px',
                                                    borderRadius: '12px',
                                                    background: 'rgba(139, 92, 246, 0.05)',
                                                    border: '1px solid rgba(139, 92, 246, 0.1)',
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: isMobile ? '8px' : '10px' }}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                                                            <circle cx="12" cy="12" r="10" />
                                                            <polyline points="12 6 12 12 16 14" />
                                                        </svg>
                                                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#8b5cf6' }}>Use Previous Assignment</span>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        {loadingRecentAssignments ? (
                                                            // Loading skeleton
                                                            <>
                                                                {[1, 2, 3].map((i) => (
                                                                    <div
                                                                        key={i}
                                                                        style={{
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'space-between',
                                                                            padding: '10px 12px',
                                                                            borderRadius: '8px',
                                                                            border: '1px solid rgba(139, 92, 246, 0.15)',
                                                                            background: '#fff',
                                                                        }}
                                                                    >
                                                                        <div style={{ flex: 1 }}>
                                                                            <div style={{ 
                                                                                height: '12px', 
                                                                                width: '60%', 
                                                                                background: 'rgba(139, 92, 246, 0.1)', 
                                                                                borderRadius: '4px',
                                                                                animation: 'pulse 1.5s ease-in-out infinite',
                                                                            }} />
                                                                            <div style={{ 
                                                                                height: '10px', 
                                                                                width: '40%', 
                                                                                background: 'rgba(139, 92, 246, 0.08)', 
                                                                                borderRadius: '4px',
                                                                                marginTop: '6px',
                                                                                animation: 'pulse 1.5s ease-in-out infinite',
                                                                            }} />
                                                                        </div>
                                                                        <div style={{ 
                                                                            height: '20px', 
                                                                            width: '60px', 
                                                                            background: 'rgba(139, 92, 246, 0.1)', 
                                                                            borderRadius: '6px',
                                                                            animation: 'pulse 1.5s ease-in-out infinite',
                                                                        }} />
                                                                    </div>
                                                                ))}
                                                            </>
                                                        ) : recentAssignments.length === 0 ? (
                                                            // Empty state
                                                            <div style={{
                                                                padding: '20px',
                                                                textAlign: 'center',
                                                                color: '#94a3b8',
                                                            }}>
                                                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" style={{ margin: '0 auto 8px' }}>
                                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                                    <polyline points="14 2 14 8 20 8" />
                                                                </svg>
                                                                <div style={{ fontSize: '12px', fontWeight: 500 }}>No previous assignments</div>
                                                                <div style={{ fontSize: '11px', marginTop: '4px' }}>Create your first assignment to see it here</div>
                                                            </div>
                                                        ) : (
                                                            // Recent assignments list
                                                            recentAssignments.map((recent) => (
                                                                <motion.button
                                                                    key={recent.id}
                                                                    whileHover={{ background: 'rgba(139, 92, 246, 0.1)' }}
                                                                    onClick={() => {
                                                                        // Populate form with previous assignment data
                                                                        updateFormData('title', recent.title);
                                                                        updateFormData('description', recent.description);
                                                                        updateFormData('course', recent.course);
                                                                        updateFormData('type', recent.type as 'assignment' | 'quiz' | 'project' | 'exam');
                                                                        updateFormData('instructions', recent.instructions);
                                                                        updateFormData('points', recent.points);
                                                                    }}
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'space-between',
                                                                        padding: '10px 12px',
                                                                        borderRadius: '8px',
                                                                        border: '1px solid rgba(139, 92, 246, 0.15)',
                                                                        background: '#fff',
                                                                        cursor: 'pointer',
                                                                        textAlign: 'left',
                                                                    }}
                                                                >
                                                                    <div>
                                                                        <div style={{ fontSize: '12px', fontWeight: 500, color: '#334155' }}>
                                                                            {recent.title}
                                                                        </div>
                                                                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                                                                            {recent.courseName} • {recent.date}
                                                                        </div>
                                                                    </div>
                                                                    <div style={{
                                                                        padding: '3px 8px',
                                                                        borderRadius: '6px',
                                                                        background: 'rgba(139, 92, 246, 0.1)',
                                                                        color: '#8b5cf6',
                                                                        fontSize: '10px',
                                                                        fontWeight: 600,
                                                                        textTransform: 'uppercase',
                                                                    }}>
                                                                        {recent.type}
                                                                    </div>
                                                                </motion.button>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                                )}

                                                {/* Divider */}
                                                <div style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: '12px', 
                                                    margin: isMobile ? '14px 0' : '20px 0',
                                                }}>
                                                    <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.08)' }} />
                                                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>or create from scratch</span>
                                                    <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.08)' }} />
                                                </div>
                                            </div>

                                            <FormInput
                                                label="Assignment Title"
                                                value={formData.title}
                                                onChange={(v) => updateFormData('title', v)}
                                                placeholder="e.g., Week 5 Programming Exercise"
                                                required
                                                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>}
                                            />

                                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '12px' : '16px' }}>
                                                <FormSelect
                                                    label="Course"
                                                    value={formData.course}
                                                    onChange={(v) => { updateFormData('course', v); updateFormData('section', ''); updateFormData('sections', []); }}
                                                    options={courses.map(c => ({ value: c.id, label: c.name }))}
                                                    placeholder={loadingCourses ? "Loading courses..." : "Select course"}
                                                    required
                                                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>}
                                                />
                                                <FormSelect
                                                    label="Section"
                                                    value={formData.section}
                                                    onChange={(v) => updateFormData('section', v)}
                                                    options={availableSections.map(s => ({ value: s, label: s }))}
                                                    placeholder={formData.course ? 'Select section' : 'Select course first'}
                                                    required
                                                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>}
                                                />
                                            </div>

                                            {/* Assignment Type Selection */}
                                            <div style={{ marginBottom: isMobile ? '12px' : '16px' }}>
                                                <label style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    fontSize: isMobile ? '12px' : '13px',
                                                    fontWeight: 600,
                                                    color: '#334155',
                                                    marginBottom: isMobile ? '8px' : '10px',
                                                }}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                                                        <rect x="3" y="3" width="7" height="7" />
                                                        <rect x="14" y="3" width="7" height="7" />
                                                        <rect x="14" y="14" width="7" height="7" />
                                                        <rect x="3" y="14" width="7" height="7" />
                                                    </svg>
                                                    Assignment Type
                                                    <span style={{ color: '#ef4444' }}>*</span>
                                                </label>
                                                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? '8px' : '10px' }}>
                                                    {ASSIGNMENT_TYPES.map((type) => {
                                                        const isSelected = formData.type === type.id;
                                                        return (
                                                            <motion.button
                                                                key={type.id}
                                                                onClick={() => updateFormData('type', type.id as AssignmentFormData['type'])}
                                                                whileHover={!isMobile ? { 
                                                                    scale: 1.02,
                                                                    boxShadow: `0 6px 20px ${type.color}20`,
                                                                } : undefined}
                                                                whileTap={{ scale: 0.98 }}
                                                                transition={{ duration: 0.15, ease: 'easeOut' }}
                                                                style={{
                                                                    padding: isMobile ? '12px 10px' : '16px 12px',
                                                                    borderRadius: '12px',
                                                                    border: isSelected 
                                                                        ? `1.5px solid ${type.color}` 
                                                                        : '1px solid rgba(0,0,0,0.06)',
                                                                    background: isSelected ? `${type.color}08` : '#ffffff',
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    alignItems: 'center',
                                                                    gap: isMobile ? '6px' : '10px',
                                                                    transition: 'border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease',
                                                                    boxShadow: isSelected ? `0 4px 12px ${type.color}15` : 'none',
                                                                }}
                                                            >
                                                                {getAssignmentTypeIcon(type.icon, type.color, isSelected)}
                                                                <span style={{
                                                                    fontSize: isMobile ? '11px' : '12px',
                                                                    fontWeight: 600,
                                                                    color: isSelected ? type.color : '#64748b',
                                                                    transition: 'color 0.2s ease',
                                                                }}>
                                                                    {type.label}
                                                                </span>
                                                            </motion.button>
                                                        );
                                                    })}
                                                </div>
                                            </div>


                                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr', gap: isMobile ? '10px' : '16px' }}>
                                                <CustomDatePicker
                                                    label="Due Date"
                                                    value={formData.dueDate}
                                                    onChange={(v) => updateFormData('dueDate', v)}
                                                    required
                                                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>}
                                                />
                                                <CustomTimePicker
                                                    label="Due Time"
                                                    value={formData.dueTime}
                                                    onChange={(v) => updateFormData('dueTime', v)}
                                                    required
                                                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
                                                />
                                                <FormInput
                                                    label="Total Points"
                                                    value={formData.points}
                                                    onChange={(v) => updateFormData('points', parseInt(v) || 0)}
                                                    type="number"
                                                    required
                                                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>}
                                                />
                                            </div>

                                            <FormTextarea
                                                label="Description"
                                                value={formData.description}
                                                onChange={(v) => updateFormData('description', v)}
                                                placeholder="Brief description of the assignment..."
                                                rows={3}
                                                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="17" y1="10" x2="3" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="17" y1="18" x2="3" y2="18" /></svg>}
                                            />

                                            <RichTextEditor
                                                label="Instructions"
                                                value={formData.instructions}
                                                onChange={(v) => updateFormData('instructions', v)}
                                                placeholder="Detailed instructions for students... (supports formatting)"
                                                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>}
                                            />

                                            {/* Save as Template Option - Minimalistic Design - Hide on small mobile */}
                                            {!isSmallMobile && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.1, duration: 0.2 }}
                                                whileHover={!isMobile ? { 
                                                    boxShadow: '0 4px 16px rgba(59, 130, 246, 0.1)',
                                                    borderColor: 'rgba(59, 130, 246, 0.25)',
                                                } : undefined}
                                                style={{
                                                    padding: isMobile ? '12px 14px' : '14px 16px',
                                                    borderRadius: '12px',
                                                    background: 'rgba(59, 130, 246, 0.04)',
                                                    border: '1px solid rgba(59, 130, 246, 0.12)',
                                                    marginTop: isMobile ? '8px' : '12px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease',
                                                }}
                                                onClick={() => updateFormData('saveAsTemplate', !formData.saveAsTemplate)}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '12px' }}>
                                                        <div style={{
                                                            width: isMobile ? '32px' : '36px',
                                                            height: isMobile ? '32px' : '36px',
                                                            borderRadius: isMobile ? '8px' : '10px',
                                                            background: 'rgba(59, 130, 246, 0.1)',
                                                            border: '1px solid rgba(59, 130, 246, 0.15)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: '#3b82f6',
                                                            flexShrink: 0,
                                                        }}>
                                                            <svg width={isMobile ? "16" : "18"} height={isMobile ? "16" : "18"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                                                <polyline points="17 21 17 13 7 13 7 21" />
                                                                <polyline points="7 3 7 8 15 8" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: isMobile ? '12px' : '13px', fontWeight: 600, color: '#334155' }}>
                                                                Save as Template
                                                            </div>
                                                            {!isMobile && (
                                                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                                                Reuse this assignment structure later
                                                            </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {/* Custom Toggle Switch */}
                                                    <label style={{
                                                        fontSize: '10px',
                                                        position: 'relative',
                                                        display: 'inline-block',
                                                        width: '3.5em',
                                                        height: '2em',
                                                        flexShrink: 0,
                                                    }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.saveAsTemplate}
                                                            onChange={(e) => {
                                                                e.stopPropagation();
                                                                updateFormData('saveAsTemplate', e.target.checked);
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                            style={{
                                                                opacity: 0,
                                                                width: 0,
                                                                height: 0,
                                                            }}
                                                        />
                                                        <span style={{
                                                            position: 'absolute',
                                                            cursor: 'pointer',
                                                            top: 0,
                                                            left: 0,
                                                            right: 0,
                                                            bottom: 0,
                                                            backgroundColor: formData.saveAsTemplate ? '#007bff' : '#fff',
                                                            border: formData.saveAsTemplate ? '1px solid #007bff' : '1px solid #adb5bd',
                                                            transition: '.4s',
                                                            borderRadius: '30px',
                                                        }}>
                                                            <span style={{
                                                                position: 'absolute',
                                                                height: '1.4em',
                                                                width: '1.4em',
                                                                borderRadius: '20px',
                                                                left: '0.27em',
                                                                bottom: '0.25em',
                                                                backgroundColor: formData.saveAsTemplate ? '#fff' : '#adb5bd',
                                                                transition: '.4s',
                                                                transform: formData.saveAsTemplate ? 'translateX(1.4em)' : 'translateX(0)',
                                                            }} />
                                                        </span>
                                                    </label>
                                                </div>
                                                <AnimatePresence>
                                                    {formData.saveAsTemplate && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            transition={{ duration: 0.2, ease: 'easeOut' }}
                                                            style={{ marginTop: '14px', overflow: 'hidden' }}
                                                        >
                                                            <input
                                                                type="text"
                                                                value={formData.templateName}
                                                                onChange={(e) => updateFormData('templateName', e.target.value)}
                                                                onClick={(e) => e.stopPropagation()}
                                                                placeholder="Template name (e.g., 'My Lab Exercise Template')"
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '10px 14px',
                                                                    borderRadius: '10px',
                                                                    border: '1px solid rgba(59, 130, 246, 0.2)',
                                                                    background: '#ffffff',
                                                                    fontSize: '13px',
                                                                    color: '#334155',
                                                                    outline: 'none',
                                                                    transition: 'all 0.2s ease',
                                                                }}
                                                                onFocus={(e) => {
                                                                    e.target.style.borderColor = '#3b82f6';
                                                                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                                                                }}
                                                                onBlur={(e) => {
                                                                    e.target.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                                                                    e.target.style.boxShadow = 'none';
                                                                }}
                                                            />
                                                            <div style={{ 
                                                                display: 'flex', 
                                                                alignItems: 'center', 
                                                                gap: '6px', 
                                                                marginTop: '10px',
                                                                padding: '8px 10px',
                                                                borderRadius: '8px',
                                                                background: 'rgba(59, 130, 246, 0.06)',
                                                            }}>
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <circle cx="12" cy="12" r="10" />
                                                                    <line x1="12" y1="16" x2="12" y2="12" />
                                                                    <line x1="12" y1="8" x2="12.01" y2="8" />
                                                                </svg>
                                                                <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 500 }}>
                                                                    Your template will appear in "Use Previous Assignment" for future use
                                                                </span>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                            )}
                                        </motion.div>
                                    )}

                                    {activeTab === 'settings' && (
                                        <motion.div
                                            key="settings"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            {/* Batch Create - Multiple Sections */}
                                            <div style={{
                                                padding: '16px',
                                                borderRadius: '12px',
                                                background: 'rgba(139, 92, 246, 0.05)',
                                                border: '1px solid rgba(139, 92, 246, 0.1)',
                                                marginBottom: '20px',
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                                                        <rect x="3" y="3" width="7" height="7" />
                                                        <rect x="14" y="3" width="7" height="7" />
                                                        <rect x="14" y="14" width="7" height="7" />
                                                        <rect x="3" y="14" width="7" height="7" />
                                                    </svg>
                                                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#8b5cf6' }}>Batch Create</span>
                                                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', fontWeight: 600 }}>TIME SAVER</span>
                                                </div>
                                                <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px 0' }}>
                                                    Create this assignment for multiple sections at once instead of one by one.
                                                </p>
                                                {formData.course ? (
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                        {availableSections.map((section) => {
                                                            const isSelected = formData.sections.includes(section);
                                                            return (
                                                                <motion.button
                                                                    key={section}
                                                                    whileHover={{ scale: 1.02 }}
                                                                    whileTap={{ scale: 0.98 }}
                                                                    onClick={() => {
                                                                        if (isSelected) {
                                                                            updateFormData('sections', formData.sections.filter(s => s !== section));
                                                                        } else {
                                                                            updateFormData('sections', [...formData.sections, section]);
                                                                        }
                                                                    }}
                                                                    style={{
                                                                        padding: '8px 14px',
                                                                        borderRadius: '8px',
                                                                        border: `1.5px solid ${isSelected ? '#8b5cf6' : 'rgba(0,0,0,0.1)'}`,
                                                                        background: isSelected ? 'rgba(139, 92, 246, 0.1)' : '#fff',
                                                                        color: isSelected ? '#8b5cf6' : '#64748b',
                                                                        fontSize: '12px',
                                                                        fontWeight: 600,
                                                                        cursor: 'pointer',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '6px',
                                                                    }}
                                                                >
                                                                    {isSelected && (
                                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                                            <polyline points="20 6 9 17 4 12" />
                                                                        </svg>
                                                                    )}
                                                                    {section}
                                                                </motion.button>
                                                            );
                                                        })}
                                                        <motion.button
                                                            whileHover={{ background: 'rgba(139, 92, 246, 0.1)' }}
                                                            onClick={() => {
                                                                if (formData.sections.length === availableSections.length) {
                                                                    updateFormData('sections', []);
                                                                } else {
                                                                    updateFormData('sections', [...availableSections]);
                                                                }
                                                            }}
                                                            style={{
                                                                padding: '8px 14px',
                                                                borderRadius: '8px',
                                                                border: '1px dashed rgba(139, 92, 246, 0.3)',
                                                                background: 'transparent',
                                                                color: '#8b5cf6',
                                                                fontSize: '12px',
                                                                fontWeight: 500,
                                                                cursor: 'pointer',
                                                            }}
                                                        >
                                                            {formData.sections.length === availableSections.length ? 'Deselect All' : 'Select All'}
                                                        </motion.button>
                                                    </div>
                                                ) : (
                                                    <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                                                        Select a course first to see available sections
                                                    </div>
                                                )}
                                            </div>

                                            {/* Schedule Publish */}
                                            <div style={{
                                                padding: '16px',
                                                borderRadius: '12px',
                                                background: 'rgba(245, 158, 11, 0.05)',
                                                border: '1px solid rgba(245, 158, 11, 0.1)',
                                                marginBottom: '20px',
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                                                            <circle cx="12" cy="12" r="10" />
                                                            <polyline points="12 6 12 12 16 14" />
                                                        </svg>
                                                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#f59e0b' }}>Schedule Publish</span>
                                                    </div>
                                                    <label style={{
                                                        fontSize: '10px',
                                                        position: 'relative',
                                                        display: 'inline-block',
                                                        width: '3.5em',
                                                        height: '2em',
                                                    }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.schedulePublish}
                                                            onChange={(e) => updateFormData('schedulePublish', e.target.checked)}
                                                            style={{
                                                                opacity: 0,
                                                                width: 0,
                                                                height: 0,
                                                            }}
                                                        />
                                                        <span style={{
                                                            position: 'absolute',
                                                            cursor: 'pointer',
                                                            top: 0,
                                                            left: 0,
                                                            right: 0,
                                                            bottom: 0,
                                                            backgroundColor: formData.schedulePublish ? '#007bff' : '#fff',
                                                            border: formData.schedulePublish ? '1px solid #007bff' : '1px solid #adb5bd',
                                                            transition: '.4s',
                                                            borderRadius: '30px',
                                                        }}>
                                                            <span style={{
                                                                position: 'absolute',
                                                                height: '1.4em',
                                                                width: '1.4em',
                                                                borderRadius: '20px',
                                                                left: '0.27em',
                                                                bottom: '0.25em',
                                                                backgroundColor: formData.schedulePublish ? '#fff' : '#adb5bd',
                                                                transition: '.4s',
                                                                transform: formData.schedulePublish ? 'translateX(1.4em)' : 'translateX(0)',
                                                            }} />
                                                        </span>
                                                    </label>
                                                </div>
                                                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                                                    Set a future date and time to automatically publish this assignment.
                                                </p>
                                                <AnimatePresence>
                                                    {formData.schedulePublish && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            style={{ 
                                                                marginTop: '16px', 
                                                                padding: '16px',
                                                                background: 'rgba(245, 158, 11, 0.05)',
                                                                borderRadius: '10px',
                                                                border: '1px solid rgba(245, 158, 11, 0.15)',
                                                            }}
                                                        >
                                                            <div style={{ 
                                                                display: 'flex', 
                                                                alignItems: 'center', 
                                                                gap: '8px', 
                                                                marginBottom: '12px' 
                                                            }}>
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                                                                    <circle cx="12" cy="12" r="10" />
                                                                    <line x1="12" y1="8" x2="12" y2="12" />
                                                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                                                </svg>
                                                                <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 500 }}>
                                                                    Assignment will be hidden until the scheduled date
                                                                </span>
                                                            </div>
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                                <div style={{ marginBottom: 0 }}>
                                                                    <CustomDatePicker
                                                                        label="Publish Date"
                                                                        value={formData.publishDate}
                                                                        onChange={(v) => updateFormData('publishDate', v)}
                                                                        required
                                                                        icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>}
                                                                    />
                                                                </div>
                                                                <div style={{ marginBottom: 0 }}>
                                                                    <CustomTimePicker
                                                                        label="Publish Time"
                                                                        value={formData.publishTime}
                                                                        onChange={(v) => updateFormData('publishTime', v)}
                                                                        required
                                                                        icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
                                                                    />
                                                                </div>
                                                            </div>
                                                            {formData.publishDate && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, y: -5 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    style={{
                                                                        marginTop: '12px',
                                                                        padding: '10px 12px',
                                                                        background: 'rgba(245, 158, 11, 0.1)',
                                                                        borderRadius: '8px',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '8px',
                                                                    }}
                                                                >
                                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                                                                        <polyline points="20 6 9 17 4 12" />
                                                                    </svg>
                                                                    <span style={{ fontSize: '12px', color: '#92400e', fontWeight: 500 }}>
                                                                        Scheduled for {new Date(formData.publishDate + 'T' + formData.publishTime).toLocaleDateString('en-US', { 
                                                                            weekday: 'short', 
                                                                            month: 'short', 
                                                                            day: 'numeric',
                                                                            year: 'numeric'
                                                                        })} at {(() => {
                                                                            const [h, m] = formData.publishTime.split(':').map(Number);
                                                                            const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
                                                                            const ampm = h < 12 ? 'AM' : 'PM';
                                                                            return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
                                                                        })()}
                                                                    </span>
                                                                </motion.div>
                                                            )}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            {/* Copy to Other Courses */}
                                            <div style={{
                                                padding: '16px',
                                                borderRadius: '12px',
                                                background: 'rgba(16, 185, 129, 0.05)',
                                                border: '1px solid rgba(16, 185, 129, 0.1)',
                                                marginBottom: '20px',
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                                    </svg>
                                                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#10b981' }}>Copy to Other Courses</span>
                                                </div>
                                                <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px 0' }}>
                                                    Also create this assignment in other courses you teach.
                                                </p>
                                                {formData.course ? (
                                                    otherCourses.length > 0 ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            {otherCourses.map((course) => {
                                                                const isSelected = formData.copyToOtherCourses.includes(course.id);
                                                                return (
                                                                    <motion.button
                                                                        key={course.id}
                                                                        whileHover={{ background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0,0,0,0.04)' }}
                                                                        onClick={() => {
                                                                            if (isSelected) {
                                                                                updateFormData('copyToOtherCourses', formData.copyToOtherCourses.filter(c => c !== course.id));
                                                                            } else {
                                                                                updateFormData('copyToOtherCourses', [...formData.copyToOtherCourses, course.id]);
                                                                            }
                                                                        }}
                                                                        style={{
                                                                            padding: '12px 14px',
                                                                            borderRadius: '10px',
                                                                            border: `1.5px solid ${isSelected ? '#10b981' : 'rgba(0,0,0,0.08)'}`,
                                                                            background: isSelected ? 'rgba(16, 185, 129, 0.1)' : '#fff',
                                                                            cursor: 'pointer',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'space-between',
                                                                            textAlign: 'left',
                                                                        }}
                                                                    >
                                                                        <div>
                                                                            <div style={{ fontSize: '13px', fontWeight: 500, color: isSelected ? '#10b981' : '#334155' }}>
                                                                                {course.name}
                                                                            </div>
                                                                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                                                                                {course.sections.length} sections available
                                                                            </div>
                                                                        </div>
                                                                        <div style={{
                                                                            width: '22px',
                                                                            height: '22px',
                                                                            borderRadius: '6px',
                                                                            border: `2px solid ${isSelected ? '#10b981' : 'rgba(0,0,0,0.15)'}`,
                                                                            background: isSelected ? '#10b981' : 'transparent',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                        }}>
                                                                            {isSelected && (
                                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                                                                                    <polyline points="20 6 9 17 4 12" />
                                                                                </svg>
                                                                            )}
                                                                        </div>
                                                                    </motion.button>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                                                            No other courses available
                                                        </div>
                                                    )
                                                ) : (
                                                    <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                                                        Select a course first to see other courses
                                                    </div>
                                                )}
                                            </div>

                                            {/* Prerequisite Assignment */}
                                            <div style={{
                                                padding: '16px',
                                                borderRadius: '12px',
                                                background: 'rgba(239, 68, 68, 0.05)',
                                                border: '1px solid rgba(239, 68, 68, 0.1)',
                                                marginBottom: '20px',
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                                                            <path d="M9 11l3 3L22 4" />
                                                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                                        </svg>
                                                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#ef4444' }}>Prerequisite</span>
                                                    </div>
                                                    <label style={{
                                                        fontSize: '10px',
                                                        position: 'relative',
                                                        display: 'inline-block',
                                                        width: '3.5em',
                                                        height: '2em',
                                                    }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.prerequisiteEnabled}
                                                            onChange={(e) => updateFormData('prerequisiteEnabled', e.target.checked)}
                                                            style={{
                                                                opacity: 0,
                                                                width: 0,
                                                                height: 0,
                                                            }}
                                                        />
                                                        <span style={{
                                                            position: 'absolute',
                                                            cursor: 'pointer',
                                                            top: 0,
                                                            left: 0,
                                                            right: 0,
                                                            bottom: 0,
                                                            backgroundColor: formData.prerequisiteEnabled ? '#007bff' : '#fff',
                                                            border: formData.prerequisiteEnabled ? '1px solid #007bff' : '1px solid #adb5bd',
                                                            transition: '.4s',
                                                            borderRadius: '30px',
                                                        }}>
                                                            <span style={{
                                                                position: 'absolute',
                                                                height: '1.4em',
                                                                width: '1.4em',
                                                                borderRadius: '20px',
                                                                left: '0.27em',
                                                                bottom: '0.25em',
                                                                backgroundColor: formData.prerequisiteEnabled ? '#fff' : '#adb5bd',
                                                                transition: '.4s',
                                                                transform: formData.prerequisiteEnabled ? 'translateX(1.4em)' : 'translateX(0)',
                                                            }} />
                                                        </span>
                                                    </label>
                                                </div>
                                                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                                                    Students must complete another assignment before accessing this one.
                                                </p>
                                                <AnimatePresence>
                                                    {formData.prerequisiteEnabled && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            style={{ marginTop: '12px' }}
                                                        >
                                                            {formData.course ? (
                                                                availablePrerequisites.length > 0 ? (
                                                                    <div style={{ position: 'relative' }}>
                                                                        <select
                                                                            value={formData.prerequisiteAssignment}
                                                                            onChange={(e) => updateFormData('prerequisiteAssignment', e.target.value)}
                                                                            style={{
                                                                                width: '100%',
                                                                                padding: '12px 40px 12px 14px',
                                                                                borderRadius: '10px',
                                                                                border: formData.prerequisiteAssignment 
                                                                                    ? '1px solid rgba(59, 130, 246, 0.3)' 
                                                                                    : '1px solid rgba(0,0,0,0.1)',
                                                                                fontSize: '13px',
                                                                                color: formData.prerequisiteAssignment ? '#1e293b' : '#94a3b8',
                                                                                cursor: 'pointer',
                                                                                appearance: 'none',
                                                                                background: formData.prerequisiteAssignment 
                                                                                    ? 'rgba(59, 130, 246, 0.05)' 
                                                                                    : '#fff',
                                                                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%233b82f6' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                                                                                backgroundRepeat: 'no-repeat',
                                                                                backgroundPosition: 'right 12px center',
                                                                                transition: 'all 0.2s ease',
                                                                                outline: 'none',
                                                                            }}
                                                                        >
                                                                            <option value="">Select prerequisite assignment...</option>
                                                                            {availablePrerequisites.map((assign) => (
                                                                                <option key={assign.id} value={assign.id}>
                                                                                    [{assign.type.toUpperCase()}] {assign.title}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                        {formData.prerequisiteAssignment && (
                                                                            <motion.div
                                                                                initial={{ opacity: 0, scale: 0.8 }}
                                                                                animate={{ opacity: 1, scale: 1 }}
                                                                                style={{
                                                                                    position: 'absolute',
                                                                                    right: '40px',
                                                                                    top: '50%',
                                                                                    transform: 'translateY(-50%)',
                                                                                    width: '18px',
                                                                                    height: '18px',
                                                                                    borderRadius: '50%',
                                                                                    background: '#3b82f6',
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    justifyContent: 'center',
                                                                                }}
                                                                            >
                                                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                                                                                    <polyline points="20 6 9 17 4 12" />
                                                                                </svg>
                                                                            </motion.div>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div style={{ 
                                                                        fontSize: '12px', 
                                                                        color: '#94a3b8', 
                                                                        fontStyle: 'italic', 
                                                                        padding: '14px', 
                                                                        background: 'rgba(59, 130, 246, 0.05)', 
                                                                        borderRadius: '10px',
                                                                        border: '1px dashed rgba(59, 130, 246, 0.2)',
                                                                        textAlign: 'center',
                                                                    }}>
                                                                        No existing assignments in this course to use as prerequisite
                                                                    </div>
                                                                )
                                                            ) : (
                                                                <div style={{ 
                                                                    fontSize: '12px', 
                                                                    color: '#94a3b8', 
                                                                    fontStyle: 'italic', 
                                                                    padding: '14px', 
                                                                    background: 'rgba(59, 130, 246, 0.05)', 
                                                                    borderRadius: '10px',
                                                                    border: '1px dashed rgba(59, 130, 246, 0.2)',
                                                                    textAlign: 'center',
                                                                }}>
                                                                    Select a course first to see available prerequisites
                                                                </div>
                                                            )}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            {/* Divider */}
                                            <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)', margin: '24px 0' }} />

                                            {/* Original Submission Settings */}
                                            <div style={{
                                                padding: '16px',
                                                borderRadius: '12px',
                                                background: 'rgba(59, 130, 246, 0.05)',
                                                border: '1px solid rgba(59, 130, 246, 0.1)',
                                                marginBottom: '20px',
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                                                        <circle cx="12" cy="12" r="10" />
                                                        <line x1="12" y1="16" x2="12" y2="12" />
                                                        <line x1="12" y1="8" x2="12.01" y2="8" />
                                                    </svg>
                                                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#3b82f6' }}>Submission Settings</span>
                                                </div>
                                                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                                                    Configure how students can submit their work and any penalties for late submissions.
                                                </p>
                                            </div>

                                            <ToggleSwitch
                                                label="Allow Late Submissions"
                                                checked={formData.allowLateSubmission}
                                                onChange={(v) => updateFormData('allowLateSubmission', v)}
                                                description="Students can submit after the due date with a penalty"
                                            />

                                            {formData.allowLateSubmission && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    style={{ paddingLeft: '16px', marginTop: '8px' }}
                                                >
                                                    <FormInput
                                                        label="Late Penalty (%)"
                                                        value={formData.latePenalty}
                                                        onChange={(v) => updateFormData('latePenalty', parseInt(v) || 0)}
                                                        type="number"
                                                        helpText="Percentage deducted per day late"
                                                    />
                                                </motion.div>
                                            )}

                                            <FormInput
                                                label="Maximum Attempts"
                                                value={formData.maxAttempts}
                                                onChange={(v) => updateFormData('maxAttempts', parseInt(v) || 1)}
                                                type="number"
                                                helpText="Number of times a student can submit (1 = single submission)"
                                            />

                                            <ToggleSwitch
                                                label="Enable Rubric"
                                                checked={formData.rubricEnabled}
                                                onChange={(v) => updateFormData('rubricEnabled', v)}
                                                description="Use a grading rubric for this assignment"
                                            />

                                            <ToggleSwitch
                                                label="Notify Students"
                                                checked={formData.notifyStudents}
                                                onChange={(v) => updateFormData('notifyStudents', v)}
                                                description="Send email notification when assignment is published"
                                            />
                                        </motion.div>
                                    )}

                                    {activeTab === 'attachments' && (
                                        <motion.div
                                            key="attachments"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <FileUpload
                                                files={formData.attachments}
                                                onChange={(files) => updateFormData('attachments', files)}
                                            />
                                        </motion.div>
                                    )}

                                    {activeTab === 'rubric' && (
                                        <motion.div
                                            key="rubric"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <div style={{
                                                padding: '16px',
                                                borderRadius: '12px',
                                                background: 'rgba(16, 185, 129, 0.05)',
                                                border: '1px solid rgba(16, 185, 129, 0.1)',
                                                marginBottom: '20px',
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                                        <line x1="3" y1="9" x2="21" y2="9" />
                                                        <line x1="9" y1="21" x2="9" y2="9" />
                                                    </svg>
                                                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#10b981' }}>Grading Rubric</span>
                                                </div>
                                                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                                                    Create a detailed rubric to ensure consistent and transparent grading. Students will see this rubric when viewing the assignment.
                                                </p>
                                            </div>

                                            <RubricBuilder
                                                criteria={formData.rubricCriteria}
                                                onChange={(criteria) => updateFormData('rubricCriteria', criteria)}
                                                totalPoints={formData.points}
                                            />
                                        </motion.div>
                                    )}

                                    {activeTab === 'preview' && (
                                        <motion.div
                                            key="preview"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            {/* Preview Card - ModuleCard Style Design */}
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(59, 130, 246, 0.15)' }}
                                                transition={{ duration: 0.2 }}
                                                style={{
                                                    borderRadius: '20px',
                                                    border: '1px solid rgba(59, 130, 246, 0.12)',
                                                    background: '#fff',
                                                    overflow: 'hidden',
                                                    cursor: 'default',
                                                }}
                                            >
                                                {/* Card Content - Centered Layout */}
                                                <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                                                    {/* Large Icon at Top with Gradient */}
                                                    <motion.div 
                                                        whileHover={{ scale: 1.05, rotate: 3 }}
                                                        transition={{ duration: 0.1 }}
                                                        style={{
                                                            width: '56px',
                                                            height: '56px',
                                                            borderRadius: '14px',
                                                            background: formData.type === 'quiz' 
                                                                ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                                                                : formData.type === 'project'
                                                                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                                                : formData.type === 'exam'
                                                                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                                                                : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            marginBottom: '12px',
                                                            boxShadow: formData.type === 'quiz'
                                                                ? '0 8px 20px rgba(245, 158, 11, 0.25)'
                                                                : formData.type === 'project'
                                                                ? '0 8px 20px rgba(16, 185, 129, 0.25)'
                                                                : formData.type === 'exam'
                                                                ? '0 8px 20px rgba(239, 68, 68, 0.25)'
                                                                : '0 8px 20px rgba(59, 130, 246, 0.25)',
                                                        }}
                                                    >
                                                        {formData.type === 'quiz' ? (
                                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                                                                <circle cx="12" cy="12" r="10" />
                                                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                                                <line x1="12" y1="17" x2="12.01" y2="17" />
                                                            </svg>
                                                        ) : formData.type === 'project' ? (
                                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                                                                <circle cx="12" cy="12" r="10" />
                                                                <circle cx="12" cy="12" r="6" />
                                                                <circle cx="12" cy="12" r="2" />
                                                            </svg>
                                                        ) : formData.type === 'exam' ? (
                                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                                                                <path d="M9 11l3 3L22 4" />
                                                                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                                            </svg>
                                                        ) : (
                                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                                <polyline points="14 2 14 8 20 8" />
                                                                <line x1="16" y1="13" x2="8" y2="13" />
                                                                <line x1="16" y1="17" x2="8" y2="17" />
                                                            </svg>
                                                        )}
                                                    </motion.div>

                                                    {/* Type Badge */}
                                                    <motion.span 
                                                        whileHover={{ scale: 1.05 }}
                                                        style={{
                                                            padding: '5px 12px',
                                                            borderRadius: '8px',
                                                            background: formData.type === 'quiz'
                                                                ? 'rgba(245, 158, 11, 0.1)'
                                                                : formData.type === 'project'
                                                                ? 'rgba(16, 185, 129, 0.1)'
                                                                : formData.type === 'exam'
                                                                ? 'rgba(239, 68, 68, 0.1)'
                                                                : 'rgba(59, 130, 246, 0.1)',
                                                            border: `1px solid ${formData.type === 'quiz'
                                                                ? 'rgba(245, 158, 11, 0.2)'
                                                                : formData.type === 'project'
                                                                ? 'rgba(16, 185, 129, 0.2)'
                                                                : formData.type === 'exam'
                                                                ? 'rgba(239, 68, 68, 0.2)'
                                                                : 'rgba(59, 130, 246, 0.2)'}`,
                                                            color: formData.type === 'quiz'
                                                                ? '#d97706'
                                                                : formData.type === 'project'
                                                                ? '#059669'
                                                                : formData.type === 'exam'
                                                                ? '#dc2626'
                                                                : '#3b82f6',
                                                            fontSize: '10px',
                                                            fontWeight: 600,
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.5px',
                                                            marginBottom: '12px',
                                                        }}
                                                    >
                                                        {formData.type}
                                                    </motion.span>

                                                    {/* Title - Centered */}
                                                    <h3 style={{ 
                                                        margin: '0 0 6px 0', 
                                                        fontSize: '15px', 
                                                        fontWeight: 600, 
                                                        color: '#1e293b',
                                                        lineHeight: 1.4,
                                                        maxWidth: '100%',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                    }}>
                                                        {formData.title || 'Untitled Assignment'}
                                                    </h3>

                                                    {/* Course & Section Info */}
                                                    <p style={{ 
                                                        margin: '0 0 16px 0', 
                                                        fontSize: '12px', 
                                                        color: '#64748b',
                                                    }}>
                                                        {courses.find(c => c.id === formData.course)?.name || 'No course'} • {formData.section || formData.sections.join(', ') || 'No section'}
                                                    </p>

                                                    {/* Progress Section - Points & Due Date */}
                                                    <div style={{ width: '100%', marginBottom: '16px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                            <span style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Points</span>
                                                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#3b82f6' }}>{formData.points} pts</span>
                                                        </div>
                                                        <div style={{ height: '6px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '999px', overflow: 'hidden' }}>
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: '100%' }}
                                                                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                                                style={{
                                                                    height: '100%',
                                                                    borderRadius: '999px',
                                                                    background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
                                                                }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Content Type Icons Row - Centered */}
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
                                                        {/* Due Date Icon with Tooltip */}
                                                        <PreviewIconWithTooltip
                                                            label="Due Date"
                                                            subtitle={formData.dueDate ? new Date(formData.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set'}
                                                            color={formData.dueDate ? '#3b82f6' : '#94a3b8'}
                                                            bgColor={formData.dueDate ? 'rgba(59, 130, 246, 0.1)' : 'rgba(148, 163, 184, 0.1)'}
                                                            borderColor={formData.dueDate ? 'rgba(59, 130, 246, 0.15)' : 'rgba(148, 163, 184, 0.15)'}
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={formData.dueDate ? '#3b82f6' : '#94a3b8'} strokeWidth="2">
                                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                                <line x1="16" y1="2" x2="16" y2="6" />
                                                                <line x1="8" y1="2" x2="8" y2="6" />
                                                                <line x1="3" y1="10" x2="21" y2="10" />
                                                            </svg>
                                                        </PreviewIconWithTooltip>
                                                        {/* Attempts Icon with Tooltip */}
                                                        <PreviewIconWithTooltip
                                                            label="Attempts"
                                                            subtitle={`${formData.maxAttempts} attempt${formData.maxAttempts > 1 ? 's' : ''} allowed`}
                                                            color="#8b5cf6"
                                                            bgColor="rgba(139, 92, 246, 0.1)"
                                                            borderColor="rgba(139, 92, 246, 0.15)"
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                                                                <polyline points="1 4 1 10 7 10" />
                                                                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                                                            </svg>
                                                        </PreviewIconWithTooltip>
                                                        {/* Late Submission Icon with Tooltip */}
                                                        <PreviewIconWithTooltip
                                                            label="Late Submission"
                                                            subtitle={formData.allowLateSubmission ? 'Allowed' : 'Not allowed'}
                                                            color={formData.allowLateSubmission ? '#10b981' : '#ef4444'}
                                                            bgColor={formData.allowLateSubmission ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}
                                                            borderColor={formData.allowLateSubmission ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={formData.allowLateSubmission ? '#10b981' : '#ef4444'} strokeWidth="2">
                                                                {formData.allowLateSubmission ? (
                                                                    <polyline points="20 6 9 17 4 12" />
                                                                ) : (
                                                                    <>
                                                                        <line x1="18" y1="6" x2="6" y2="18" />
                                                                        <line x1="6" y1="6" x2="18" y2="18" />
                                                                    </>
                                                                )}
                                                            </svg>
                                                        </PreviewIconWithTooltip>
                                                        {/* Attachments Icon with Tooltip */}
                                                        {formData.attachments.length > 0 && (
                                                            <PreviewIconWithTooltip
                                                                label="Attachments"
                                                                subtitle={`${formData.attachments.length} file${formData.attachments.length > 1 ? 's' : ''}`}
                                                                color="#f59e0b"
                                                                bgColor="rgba(245, 158, 11, 0.1)"
                                                                borderColor="rgba(245, 158, 11, 0.15)"
                                                            >
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                                                                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                                                                </svg>
                                                            </PreviewIconWithTooltip>
                                                        )}
                                                        {/* Rubric Icon with Tooltip */}
                                                        {formData.rubricCriteria.length > 0 && (
                                                            <PreviewIconWithTooltip
                                                                label="Rubric"
                                                                subtitle={`${formData.rubricCriteria.length} criteria`}
                                                                color="#ec4899"
                                                                bgColor="rgba(236, 72, 153, 0.1)"
                                                                borderColor="rgba(236, 72, 153, 0.15)"
                                                            >
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2">
                                                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                                                    <line x1="3" y1="9" x2="21" y2="9" />
                                                                    <line x1="9" y1="21" x2="9" y2="9" />
                                                                </svg>
                                                            </PreviewIconWithTooltip>
                                                        )}
                                                    </div>

                                                    {/* Due Date & Time Display */}
                                                    <div style={{ 
                                                        fontSize: '11px', 
                                                        color: '#64748b', 
                                                        marginBottom: '16px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '4px',
                                                    }}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <circle cx="12" cy="12" r="10" />
                                                            <polyline points="12 6 12 12 16 14" />
                                                        </svg>
                                                        {formData.dueDate ? (
                                                            <>
                                                                Due {new Date(formData.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                {formData.dueTime && (() => {
                                                                    const [h, m] = formData.dueTime.split(':').map(Number);
                                                                    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
                                                                    const ampm = h < 12 ? 'AM' : 'PM';
                                                                    return ` at ${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
                                                                })()}
                                                            </>
                                                        ) : 'No due date set'}
                                                    </div>

                                                    {/* Action Button - Full Width */}
                                                    <motion.button
                                                        whileHover={{ scale: 1.02, boxShadow: '0 6px 20px rgba(59, 130, 246, 0.25)' }}
                                                        whileTap={{ scale: 0.98 }}
                                                        style={{
                                                            width: '100%',
                                                            padding: '12px 16px',
                                                            borderRadius: '12px',
                                                            border: 'none',
                                                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                                            color: '#fff',
                                                            fontSize: '13px',
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '8px',
                                                        }}
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                            <circle cx="12" cy="12" r="3" />
                                                        </svg>
                                                        View Assignment
                                                    </motion.button>
                                                </div>

                                            </motion.div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>


                            {/* Footer */}
                            <div style={{
                                padding: '16px 24px',
                                borderTop: '1px solid rgba(0,0,0,0.06)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: 'rgba(0,0,0,0.02)',
                            }}>
                                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                    {formData.title && formData.course && formData.dueDate ? (
                                        <span style={{ color: '#10b981' }}>✓ Ready to publish</span>
                                    ) : (
                                        <span>Fill in required fields to publish</span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <motion.button
                                        whileHover={{ scale: 1.02, background: 'rgba(0,0,0,0.08)' }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={onClose}
                                        style={{
                                            padding: '10px 20px',
                                            borderRadius: '10px',
                                            border: '1px solid rgba(0,0,0,0.1)',
                                            background: '#ffffff',
                                            cursor: 'pointer',
                                            fontSize: '13px',
                                            fontWeight: 500,
                                            color: '#64748b',
                                        }}
                                    >
                                        Cancel
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02, boxShadow: '0 6px 20px rgba(59, 130, 246, 0.3)' }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleSubmit}
                                        disabled={!formData.title || !formData.course || !formData.dueDate || isSubmitting}
                                        style={{
                                            padding: '10px 24px',
                                            borderRadius: '10px',
                                            border: 'none',
                                            background: (!formData.title || !formData.course || !formData.dueDate || isSubmitting)
                                                ? 'rgba(59, 130, 246, 0.5)'
                                                : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                            cursor: (!formData.title || !formData.course || !formData.dueDate || isSubmitting) ? 'not-allowed' : 'pointer',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            color: '#ffffff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
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
                                                        border: '2px solid rgba(255,255,255,0.3)',
                                                        borderTopColor: '#ffffff',
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
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default CreateAssignmentModal;