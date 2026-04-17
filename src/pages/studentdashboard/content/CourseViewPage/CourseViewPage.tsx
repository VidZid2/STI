import * as React from 'react';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { createTask, type CreateTaskInput } from '../../../../services/taskService';
import { createSubmission } from '../../../../services/submissionService';
import { getClassmates, type UserAccount } from '../../../../services/usersService';
import { supabase } from '../../../../lib/supabase';
import { getCurrentUser } from '../../../../services/authService';
import { FileUpload } from '../../../../components/ui/file-upload';
import { useSystemConfig } from '../../../../contexts/SystemConfigContext';

interface CourseViewPageProps {
    course: {
        id: string;
        title: string;
        subtitle: string;
        image: string;
        progress: number;
        instructor?: string;
    };
    onBack: () => void;
}

type TabType = 'modules' | 'assignments' | 'news' | 'students' | 'teachers';
type ContentType = 'handout-a' | 'handout-b' | 'slideshow' | 'video';
type TaskCategory = 'all' | 'assignment' | 'performance' | 'quiz' | 'practical' | 'journal' | 'overdue';

// Task category configuration for the Tasks tab filter
const TASK_CATEGORIES: { id: TaskCategory; label: string; icon: React.ReactNode; color: string }[] = [
    {
        id: 'all', label: 'All', icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
            </svg>
        ), color: 'zinc'
    },
    {
        id: 'assignment', label: 'Assignments', icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
            </svg>
        ), color: 'emerald'
    },
    {
        id: 'performance', label: 'Performance Tasks', icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
            </svg>
        ), color: 'purple'
    },
    {
        id: 'quiz', label: 'Quizzes', icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
        ), color: 'amber'
    },
    {
        id: 'practical', label: 'Practical Exams', icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
        ), color: 'rose'
    },
    {
        id: 'journal', label: 'Journals', icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
        ), color: 'cyan'
    },
    {
        id: 'overdue', label: 'Overdue', icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
        ), color: 'red'
    }
];

// Content type icons for modules
const CONTENT_TYPE_CONFIG: Record<ContentType, { label: string; icon: React.ReactNode; color: string }> = {
    'handout-a': {
        label: 'Handout A', icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
            </svg>
        ), color: 'blue'
    },
    'handout-b': {
        label: 'Handout B', icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
            </svg>
        ), color: 'indigo'
    },
    'slideshow': {
        label: 'Slideshow', icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
            </svg>
        ), color: 'amber'
    },
    'video': {
        label: 'Video', icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
        ), color: 'rose'
    },
};

// Course-specific data configuration
const COURSE_DATA: Record<string, {
    modules: { id: number; title: string; status: string; term?: 'prelims' | 'midterm' | 'prefinals' | 'finals'; semester?: 'first' | 'second'; contents: { type: ContentType; title: string; completed: boolean }[] }[];
    tasks: { id: number; title: string; due: string; status: string; score: string | null; category: TaskCategory }[];
    instructor: { name: string; title: string; email: string };
}> = {
    'cp1': {
        modules: [
            {
                id: 1, title: 'Module 1: Introduction to Programming', status: 'in-progress', term: 'prelims', semester: 'first', contents: [
                    { type: 'handout-a' as ContentType, title: 'Course Overview', completed: false },
                    { type: 'handout-b' as ContentType, title: 'Getting Started Guide', completed: false },
                    { type: 'slideshow' as ContentType, title: 'Introduction Slides', completed: false },
                    { type: 'video' as ContentType, title: 'Welcome Video', completed: false },
                ]
            },
        ],
        tasks: [],
        instructor: { name: 'David Clarence Del Mundo', title: 'Instructor', email: 'd.delmundo@university.edu' }
    },
    'euth1': {
        modules: [
            {
                id: 1, title: 'Chapter 1: Introduction to Euthenics', status: 'in-progress', term: 'prelims', semester: 'first', contents: [
                    { type: 'handout-a' as ContentType, title: 'What is Euthenics?', completed: false },
                    { type: 'slideshow' as ContentType, title: 'Course Introduction', completed: false },
                    { type: 'video' as ContentType, title: 'Welcome to Euthenics', completed: false },
                ]
            },
        ],
        tasks: [],
        instructor: { name: 'Claire Maurillo', title: 'Instructor', email: 'c.maurillo@university.edu' }
    },
    'itc': {
        modules: [
            {
                id: 1, title: 'Module 1: Computer Fundamentals', status: 'in-progress', term: 'prelims', semester: 'first', contents: [
                    { type: 'handout-a' as ContentType, title: 'History of Computing', completed: false },
                    { type: 'slideshow' as ContentType, title: 'Computer Components', completed: false },
                    { type: 'video' as ContentType, title: 'Inside a Computer', completed: false },
                ]
            },
        ],
        tasks: [],
        instructor: { name: 'Psalmmiracle Mariano', title: 'Instructor', email: 'p.mariano@university.edu' }
    },
    'nstp1': {
        modules: [
            {
                id: 1, title: 'Unit 1: NSTP Overview', status: 'in-progress', term: 'prelims', semester: 'first', contents: [
                    { type: 'handout-a' as ContentType, title: 'NSTP Law & Guidelines', completed: false },
                    { type: 'slideshow' as ContentType, title: 'Program Introduction', completed: false },
                ]
            },
        ],
        tasks: [],
        instructor: { name: 'Dan Risty Montojo', title: 'Instructor', email: 'd.montojo@university.edu' }
    },
    'pe1': {
        modules: [
            {
                id: 1, title: 'Week 1: Fitness Assessment', status: 'in-progress', term: 'prelims', semester: 'first', contents: [
                    { type: 'handout-a' as ContentType, title: 'Fitness Test Guide', completed: false },
                    { type: 'video' as ContentType, title: 'Proper Form Demo', completed: false },
                ]
            },
        ],
        tasks: [],
        instructor: { name: 'Mark Joseph Danoy', title: 'Instructor', email: 'm.danoy@university.edu' }
    },
    'ppc': {
        modules: [
            {
                id: 1, title: 'Topic 1: Understanding Culture', status: 'in-progress', term: 'prelims', semester: 'first', contents: [
                    { type: 'handout-a' as ContentType, title: 'What is Culture?', completed: false },
                    { type: 'slideshow' as ContentType, title: 'Cultural Elements', completed: false },
                ]
            },
        ],
        tasks: [],
        instructor: { name: 'Claire Maurillo', title: 'Instructor', email: 'c.maurillo@university.edu' }
    },
    'purcom': {
        modules: [
            {
                id: 1, title: 'Lesson 1: Communication Process', status: 'in-progress', term: 'prelims', semester: 'first', contents: [
                    { type: 'handout-a' as ContentType, title: 'Elements of Communication', completed: false },
                    { type: 'slideshow' as ContentType, title: 'Communication Models', completed: false },
                ]
            },
        ],
        tasks: [],
        instructor: { name: 'John Denielle San Martin', title: 'Instructor', email: 'j.sanmartin@university.edu' }
    },
    'tcw': {
        modules: [
            {
                id: 1, title: 'Chapter 1: Globalization', status: 'in-progress', term: 'prelims', semester: 'first', contents: [
                    { type: 'handout-a' as ContentType, title: 'What is Globalization?', completed: false },
                    { type: 'slideshow' as ContentType, title: 'Global Interconnectedness', completed: false },
                ]
            },
        ],
        tasks: [],
        instructor: { name: 'Claire Maurillo', title: 'Instructor', email: 'c.maurillo@university.edu' }
    },
    'uts': {
        modules: [
            {
                id: 1, title: 'Module 1: The Self from Various Perspectives', status: 'in-progress', term: 'prelims', semester: 'first', contents: [
                    { type: 'handout-a' as ContentType, title: 'Philosophical Self', completed: false },
                    { type: 'slideshow' as ContentType, title: 'Who Am I?', completed: false },
                ]
            },
        ],
        tasks: [],
        instructor: { name: 'Claire Maurillo', title: 'Instructor', email: 'c.maurillo@university.edu' }
    },
};

// Default fallback data
const DEFAULT_MODULES = COURSE_DATA['cp1'].modules;
const DEFAULT_TASKS = COURSE_DATA['cp1'].tasks;

// Type for course data
type CourseDataType = {
    modules: { id: number; title: string; status: string; term?: 'prelims' | 'midterm' | 'prefinals' | 'finals'; semester?: 'first' | 'second'; contents: { type: ContentType; title: string; completed: boolean }[] }[];
    tasks: { id: number; title: string; due: string; status: string; score: string | null; category: TaskCategory }[];
    instructor: { name: string; title: string; email: string };
};

// Helper function to get course-specific data (with demo mode support)
const getCourseData = (courseId: string): CourseDataType => {
    // Check if demo mode is active and demo modules exist
    const isDemoMode = localStorage.getItem('demo-mode-active') === 'true';
    if (isDemoMode) {
        try {
            const demoModulesData = localStorage.getItem('demo-course-modules');
            if (demoModulesData) {
                const demoModules = JSON.parse(demoModulesData) as Record<string, { modules: { id: number; title: string; status: string; contents: { type: string; title: string; completed: boolean }[] }[]; tasks?: { id: number; title: string; due: string; status: string; score: string | null; category: string }[] }>;
                if (demoModules[courseId]) {
                    const baseData = COURSE_DATA[courseId] || {
                        modules: DEFAULT_MODULES,
                        tasks: DEFAULT_TASKS,
                        instructor: { name: 'Instructor', title: 'Instructor', email: 'instructor@university.edu' }
                    };
                    // Cast the demo data to proper types
                    const typedModules = demoModules[courseId].modules.map(m => ({
                        ...m,
                        contents: m.contents.map(c => ({
                            ...c,
                            type: c.type as ContentType
                        }))
                    }));
                    const typedTasks = demoModules[courseId].tasks?.map(t => ({
                        ...t,
                        category: t.category as TaskCategory
                    })) || baseData.tasks;
                    return {
                        ...baseData,
                        modules: typedModules,
                        tasks: typedTasks,
                    };
                }
            }
        } catch (e) {
            console.error('Failed to load demo modules:', e);
        }
    }

    return COURSE_DATA[courseId] || {
        modules: DEFAULT_MODULES,
        tasks: DEFAULT_TASKS,
        instructor: { name: 'Instructor', title: 'Instructor', email: 'instructor@university.edu' }
    };
};

// Fresh start - no news announcements yet
const SAMPLE_NEWS: { id: number; title: string; date: string; preview: string; unread: boolean }[] = [];

// Default students data - only the current user (you)
const DEFAULT_STUDENTS = [
    { id: 1, name: 'Josiah P. De Asis', status: 'online', role: 'Student', email: 'deasis.462124@meycauayan.sti.edu.ph', grade: 0, attendance: 0, submissions: 0, aiGraded: false },
];

// Helper to get students data (with demo mode support)
const getStudentsData = () => {
    const isDemoMode = localStorage.getItem('demo-mode-active') === 'true';
    if (isDemoMode) {
        try {
            const demoStudents = localStorage.getItem('demo-students');
            if (demoStudents) {
                return JSON.parse(demoStudents);
            }
        } catch (e) {
            console.error('Failed to load demo students:', e);
        }
    }
    return DEFAULT_STUDENTS;
};

// Helper to get teachers data (with demo mode support)
const getTeachersData = (courseId: string) => {
    const isDemoMode = localStorage.getItem('demo-mode-active') === 'true';
    if (isDemoMode) {
        try {
            const demoTeachers = localStorage.getItem('demo-teachers');
            if (demoTeachers) {
                const teachers = JSON.parse(demoTeachers);
                return teachers.filter((t: { courses: string[] }) => t.courses.includes(courseId));
            }
        } catch (e) {
            console.error('Failed to load demo teachers:', e);
        }
    }
    return [];
};

// Helper to get AI grading data (with demo mode support)
const getAIGradingData = (courseId: string) => {
    const isDemoMode = localStorage.getItem('demo-mode-active') === 'true';
    if (isDemoMode) {
        try {
            const demoAIGrades = localStorage.getItem('demo-ai-grades');
            if (demoAIGrades) {
                const grades = JSON.parse(demoAIGrades);
                return grades[courseId] || null;
            }
        } catch (e) {
            console.error('Failed to load demo AI grades:', e);
        }
    }
    return null;
};

// Stat Card Component - Extracted to follow Rules of Hooks
const StatCard: React.FC<{
    stat: {
        label: string;
        value: string;
        subValue: string | null;
        description: string;
        color: string;
        bgColor: string;
        borderColor: string;
        iconColor: string;
        icon: React.ReactNode;
    };
    index: number;
}> = ({ stat, index }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{
                opacity: 1,
                y: isHovered ? -4 : 0,
                scale: isHovered ? 1.02 : 1,
            }}
            transition={{
                opacity: { delay: 0.25 + index * 0.08, duration: 0.4 },
                y: isHovered ? { duration: 0.1 } : { delay: 0.25 + index * 0.08, duration: 0.4 },
                scale: { duration: 0.1 },
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                background: stat.bgColor,
                borderColor: stat.borderColor,
                boxShadow: isHovered ? '0 8px 25px rgba(0,0,0,0.1)' : 'none',
            }}
            className="flex flex-col items-center p-5 rounded-2xl cursor-default border"
        >
            {/* Icon */}
            <div
                className="mb-3 p-3 rounded-xl transition-transform duration-100"
                style={{
                    background: `${stat.iconColor}15`,
                    color: stat.iconColor,
                    transform: isHovered ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0deg)',
                }}
            >
                {stat.icon}
            </div>

            {/* Value */}
            <div className="flex items-baseline gap-1.5 mb-1">
                <motion.span
                    className="text-3xl font-bold"
                    style={{ color: stat.color }}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 + index * 0.08, type: 'spring', stiffness: 300 }}
                >
                    {stat.value}
                </motion.span>
                {stat.subValue && (
                    <span className="text-sm font-medium text-zinc-600">{stat.subValue}</span>
                )}
            </div>

            {/* Label */}
            <span className="text-xs font-semibold text-zinc-800 mb-0.5">{stat.label}</span>

            {/* Description */}
            <span className="text-[10px] text-zinc-500 text-center">{stat.description}</span>
        </motion.div>
    );
};

// Quick Stats Component - Large cards at bottom with progress bar
const QuickStatsBar: React.FC<{ courseId: string; progress: number }> = ({ courseId: _courseId, progress }) => {
    void _courseId;

    // Fresh start - 0% grade (C) and 0% attendance
    const stats = {
        grade: 0,
        attendance: 0,
        nextDeadline: { title: 'No assignments yet', days: 0 },
        unreadNews: 0,
    };

    // Get grade letter based on percentage (0% = C grade)
    const getGradeLetter = (grade: number) => {
        if (grade >= 90) return 'A';
        if (grade >= 85) return 'B+';
        if (grade >= 80) return 'B';
        if (grade >= 75) return 'C+';
        if (grade >= 70) return 'C';
        return 'C'; // 0% or below 70% = C
    };

    const gradeLetter = getGradeLetter(stats.grade);

    // Stat cards configuration - Large cards design
    const statCards = [
        {
            label: 'Current Grade',
            value: gradeLetter,
            subValue: `${stats.grade}%`,
            description: 'Your current standing',
            color: stats.grade === 0 ? '#1e293b' : '#3b82f6',
            bgColor: stats.grade === 0 ? 'rgba(148, 163, 184, 0.06)' : 'rgba(59, 130, 246, 0.06)',
            borderColor: stats.grade === 0 ? 'rgba(148, 163, 184, 0.15)' : 'rgba(59, 130, 246, 0.15)',
            iconColor: stats.grade === 0 ? '#64748b' : '#3b82f6',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
            ),
        },
        {
            label: 'Attendance',
            value: `${stats.attendance}%`,
            subValue: null,
            description: 'Classes attended',
            color: stats.attendance === 0 ? '#1e293b' : '#8b5cf6',
            bgColor: stats.attendance === 0 ? 'rgba(148, 163, 184, 0.06)' : 'rgba(139, 92, 246, 0.06)',
            borderColor: stats.attendance === 0 ? 'rgba(148, 163, 184, 0.15)' : 'rgba(139, 92, 246, 0.15)',
            iconColor: stats.attendance === 0 ? '#64748b' : '#8b5cf6',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            ),
        },
        {
            label: 'Next Deadline',
            value: stats.nextDeadline.days === 0 ? '-' : `${stats.nextDeadline.days}`,
            subValue: stats.nextDeadline.days === 0 ? null : 'days left',
            description: stats.nextDeadline.days === 0 ? 'No upcoming deadlines' : stats.nextDeadline.title,
            color: stats.nextDeadline.days === 0 ? '#1e293b' : stats.nextDeadline.days <= 2 ? '#ef4444' : '#f59e0b',
            bgColor: stats.nextDeadline.days === 0 ? 'rgba(148, 163, 184, 0.06)' : stats.nextDeadline.days <= 2 ? 'rgba(239, 68, 68, 0.06)' : 'rgba(245, 158, 11, 0.06)',
            borderColor: stats.nextDeadline.days === 0 ? 'rgba(148, 163, 184, 0.15)' : stats.nextDeadline.days <= 2 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            iconColor: stats.nextDeadline.days === 0 ? '#64748b' : stats.nextDeadline.days <= 2 ? '#ef4444' : '#f59e0b',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                </svg>
            ),
        },
        {
            label: 'Course Progress',
            value: `${progress}%`,
            subValue: null,
            description: 'Modules completed',
            color: progress === 100 ? '#10b981' : '#3b82f6',
            bgColor: progress === 100 ? 'rgba(16, 185, 129, 0.06)' : 'rgba(59, 130, 246, 0.06)',
            borderColor: progress === 100 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
            iconColor: progress === 100 ? '#10b981' : '#3b82f6',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
            ),
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="px-6 py-4"
        >
            {/* Container matching header card style */}
            <div className="p-4 rounded-2xl bg-white border border-zinc-100 shadow-sm">
                {/* Progress Bar at top */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="mb-4"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-zinc-600">Overall Course Progress</span>
                        <span className="text-xs font-bold text-blue-600">{progress}% Complete</span>
                    </div>
                    <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            className={`h-full rounded-full ${progress === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-blue-400'}`}
                        />
                    </div>
                </motion.div>

                {/* Large Stats Cards Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {statCards.map((stat, i) => (
                        <StatCard key={stat.label} stat={stat} index={i} />
                    ))}
                </div>
            </div>
        </motion.div>
    );
};


// Search Bar Component - Enhanced with minimalistic design
const SearchBar: React.FC<{
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    resultCount?: number;
    totalCount?: number;
    isSearching?: boolean;
}> = ({ value, onChange, placeholder = 'Search...', resultCount: _resultCount, totalCount: _totalCount, isSearching = false }) => {
    // Suppress unused variable warnings - these props are kept for API compatibility
    void _resultCount;
    void _totalCount;

    const [isFocused, setIsFocused] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="relative"
        >
            <motion.div
                className={`relative flex items-center rounded-xl border bg-white transition-all duration-200 ${isFocused ? 'border-blue-300 shadow-sm ring-2 ring-blue-500/10' : 'border-zinc-200'
                    }`}
            >
                <motion.svg
                    className="absolute left-3.5 w-4 h-4 text-zinc-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    animate={{ scale: isFocused ? 1.05 : 1 }}
                    transition={{ duration: 0.15 }}
                >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" strokeLinecap="round" />
                </motion.svg>
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={placeholder}
                    className="w-full h-10 pl-10 pr-12 text-sm rounded-xl bg-transparent placeholder-zinc-400 focus:outline-none"
                />
                {/* Right side: Loading spinner or Close button */}
                <div className="absolute right-3 flex items-center gap-2">
                    <AnimatePresence mode="wait">
                        {isSearching && value ? (
                            <motion.div
                                key="spinner"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.15 }}
                                className="w-5 h-5 flex items-center justify-center"
                            >
                                <motion.div
                                    className="w-4 h-4 border-2 border-zinc-200 border-t-blue-500 rounded-full"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                                />
                            </motion.div>
                        ) : value ? (
                            <motion.button
                                key="close"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.15 }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => onChange('')}
                                className="w-5 h-5 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors"
                            >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-zinc-500">
                                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                                </svg>
                            </motion.button>
                        ) : null}
                    </AnimatePresence>
                </div>
            </motion.div>
        </motion.div>
    );
};

// Empty State Component with illustrations
const EmptyState: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    action?: { label: string; onClick: () => void };
}> = ({ icon, title, description, action }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="flex flex-col items-center justify-center py-16 px-6"
    >
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-zinc-50 to-zinc-100 border border-zinc-200 flex items-center justify-center mb-4"
        >
            <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="text-zinc-400"
            >
                {icon}
            </motion.div>
        </motion.div>
        <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-sm font-semibold text-zinc-700 mb-1"
        >
            {title}
        </motion.h3>
        <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xs text-zinc-500 text-center max-w-[200px] mb-4"
        >
            {description}
        </motion.p>
        {action && (
            <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={action.onClick}
                className="px-4 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
                {action.label}
            </motion.button>
        )}
    </motion.div>
);

// Student Card Component - Matching GroupCard design from GroupsContent
const StudentCard: React.FC<{
    student: { id: number; name: string; status: string; role: string; email: string; avatar?: string };
    index: number;
}> = ({ student, index }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [showTooltip, setShowTooltip] = useState<string | null>(null);
    const [tooltipRect, setTooltipRect] = useState<DOMRect | null>(null);

    // Generate consistent avatar color from name
    const getAvatarColor = (name: string) => {
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
        const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    };

    const avatarColor = getAvatarColor(student.name);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ delay: index * 0.02, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -3, scale: 1.01 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className={`relative p-4 rounded-xl bg-white border cursor-pointer transition-all duration-200 ${isHovered
                ? 'border-blue-200 shadow-lg shadow-blue-500/10'
                : 'border-zinc-100 hover:border-zinc-200'
                }`}
        >
            {/* Quick Action Buttons on Hover */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-2 right-2 flex gap-1 z-10"
                    >
                        {/* Chat Button */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onMouseEnter={(e) => {
                                setTooltipRect(e.currentTarget.getBoundingClientRect());
                                setShowTooltip('chat');
                            }}
                            onMouseLeave={() => { setShowTooltip(null); setTooltipRect(null); }}
                            onClick={(e) => { e.stopPropagation(); }}
                            className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center text-blue-600 transition-colors"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                        </motion.button>
                        {/* More Button */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onMouseEnter={(e) => {
                                setTooltipRect(e.currentTarget.getBoundingClientRect());
                                setShowTooltip('more');
                            }}
                            onMouseLeave={() => { setShowTooltip(null); setTooltipRect(null); }}
                            onClick={(e) => { e.stopPropagation(); }}
                            className="w-7 h-7 rounded-lg bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center text-zinc-500 transition-colors"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="19" cy="12" r="1" />
                                <circle cx="5" cy="12" r="1" />
                            </svg>
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tooltip Portal */}
            {showTooltip && tooltipRect && createPortal(
                <div
                    style={{
                        position: 'fixed',
                        top: tooltipRect.top - 28,
                        left: tooltipRect.left + tooltipRect.width / 2,
                        transform: 'translateX(-50%)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        background: '#1e293b',
                        color: 'white',
                        fontSize: '10px',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        zIndex: 99999,
                        pointerEvents: 'none',
                    }}
                >
                    {showTooltip === 'chat' ? 'Send Message' : 'More Options'}
                    <div style={{
                        position: 'absolute',
                        bottom: -4,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 0,
                        height: 0,
                        borderLeft: '4px solid transparent',
                        borderRight: '4px solid transparent',
                        borderTop: '4px solid #1e293b',
                    }} />
                </div>,
                document.body
            )}

            {/* Avatar */}
            <div className="flex flex-col items-center">
                <motion.div
                    className="relative mb-3"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                    <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-semibold shadow-md"
                        style={{
                            background: student.avatar
                                ? 'transparent'
                                : `linear-gradient(135deg, ${avatarColor} 0%, ${avatarColor}dd 100%)`,
                            boxShadow: `0 4px 12px ${avatarColor}30`,
                        }}
                    >
                        {student.avatar ? (
                            <img
                                src={student.avatar}
                                alt={student.name}
                                className="w-full h-full rounded-full object-cover"
                            />
                        ) : (
                            student.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                        )}
                    </div>
                    {/* Online Status Indicator */}
                    <motion.div
                        className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${student.status === 'online' ? 'bg-emerald-500' : 'bg-zinc-300'
                            }`}
                        animate={student.status === 'online' ? { scale: [1, 1.15, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                </motion.div>

                {/* Name */}
                <p className="text-xs font-semibold text-zinc-800 text-center truncate w-full">
                    {student.name}
                </p>

                {/* Email - truncated */}
                <p className="text-[10px] text-zinc-400 text-center truncate w-full mt-0.5">
                    {student.email.split('@')[0]}
                </p>

                {/* Status Badge */}
                <motion.span
                    className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 text-[9px] font-medium rounded-full ${student.status === 'online'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-zinc-50 text-zinc-500'
                        }`}
                    whileHover={{ scale: 1.05 }}
                >
                    <span className={`w-1.5 h-1.5 rounded-full ${student.status === 'online' ? 'bg-emerald-500' : 'bg-zinc-400'
                        }`} />
                    {student.status === 'online' ? 'Online' : 'Offline'}
                </motion.span>
            </div>
        </motion.div>
    );
};

// Content Icon with Tooltip Component
const ContentIconWithTooltip: React.FC<{
    content: { type: ContentType; title: string; completed: boolean };
    config: { label: string; icon: React.ReactNode; color: string };
    colorClasses: Record<string, { base: string; hover: string }>;
    isLocked: boolean;
    index: number;
    cIndex: number;
}> = ({ content, config, colorClasses, isLocked, index, cIndex }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div className="group relative">
            <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (index * 0.05) + (cIndex * 0.03), duration: 0.1 }}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onMouseEnter={() => !isLocked && setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={(e) => {
                    e.stopPropagation();
                    console.log(`Opening ${config.label}: ${content.title}`);
                }}
                disabled={isLocked}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${colorClasses[config.color].base} ${!isLocked ? colorClasses[config.color].hover : ''}`}
            >
                {config.icon}
            </motion.button>

            {/* Tooltip - CSS only approach for reliable positioning */}
            {!isLocked && (
                <div
                    className={`absolute z-50 pointer-events-none transition-all duration-150 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
                        }`}
                    style={{
                        bottom: 'calc(100% + 12px)',
                        left: '50%',
                        transform: 'translateX(-50%)'
                    }}
                >
                    <div className="relative bg-white border border-blue-200 rounded-lg px-3 py-2 shadow-lg shadow-blue-500/10 whitespace-nowrap">
                        <p className="text-xs font-semibold text-blue-600">{config.label}</p>
                        <p className="text-[10px] text-blue-500/80 mt-0.5 max-w-[140px] truncate">{content.title}</p>
                        {content.completed && (
                            <span className="inline-flex items-center gap-1 mt-1 text-[9px] text-emerald-600 font-medium">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Completed
                            </span>
                        )}
                        {/* Arrow pointing down */}
                        <div
                            className="absolute w-2.5 h-2.5 bg-white border-r border-b border-blue-200"
                            style={{
                                bottom: '-5px',
                                left: '50%',
                                marginLeft: '-5px',
                                transform: 'rotate(45deg)'
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

// Teacher Action Button Component - Professional style matching GroupsContent "+ New Group" button
const TeacherActionButton: React.FC<{
    variant: 'primary' | 'secondary' | 'icon';
    icon: React.ReactNode;
    label?: string;
    onClick?: () => void;
}> = ({ variant, icon, label, onClick }) => {
    const [isHovered, setIsHovered] = useState(false);

    if (variant === 'primary') {
        return (
            <button
                onClick={onClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer"
                style={{
                    background: 'rgba(59, 130, 246, 0.08)',
                    color: '#3b82f6',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: isHovered ? '0 6px 20px rgba(59, 130, 246, 0.2)' : 'none',
                }}
            >
                {icon}
                {label}
            </button>
        );
    }

    if (variant === 'secondary') {
        return (
            <button
                onClick={onClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer"
                style={{
                    background: isHovered ? 'rgba(0, 0, 0, 0.03)' : 'transparent',
                    color: '#71717a',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                }}
            >
                {icon}
                {label}
            </button>
        );
    }

    // icon variant
    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="flex items-center justify-center py-2.5 px-3 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer"
            style={{
                background: isHovered ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                color: '#71717a',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
            }}
        >
            {icon}
        </button>
    );
};

// Module Card Component - Extracted to follow Rules of Hooks
const ModuleCard: React.FC<{
    module: {
        id: number;
        title: string;
        status: string;
        contents: { type: ContentType; title: string; completed: boolean }[];
        term?: 'prelims' | 'midterm' | 'prefinals' | 'finals';
        semester?: 'first' | 'second';
    };
    index: number;
}> = ({ module, index }) => {
    const [isHovered, setIsHovered] = useState(false);
    const completedContents = module.contents.filter(c => c.completed).length;
    const progressPercent = module.contents.length > 0 ? Math.round((completedContents / module.contents.length) * 100) : 0;

    // Professional badge config - Minimalistic blue theme
    const termBadgeConfig: Record<string, { label: string; bg: string; border: string; text: string }> = {
        prelims: { label: 'Prelim', bg: 'rgba(59, 130, 246, 0.08)', border: 'rgba(59, 130, 246, 0.2)', text: '#3b82f6' },
        midterm: { label: 'Midterm', bg: 'rgba(6, 182, 212, 0.08)', border: 'rgba(6, 182, 212, 0.2)', text: '#06b6d4' },
        prefinals: { label: 'Pre-Finals', bg: 'rgba(249, 115, 22, 0.08)', border: 'rgba(249, 115, 22, 0.2)', text: '#f97316' },
        finals: { label: 'Finals', bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.2)', text: '#10b981' },
    };

    const semesterBadgeConfig: Record<string, { label: string; bg: string; border: string; text: string }> = {
        first: { label: '1st Sem', bg: 'rgba(139, 92, 246, 0.08)', border: 'rgba(139, 92, 246, 0.2)', text: '#8b5cf6' },
        second: { label: '2nd Sem', bg: 'rgba(99, 102, 241, 0.08)', border: 'rgba(99, 102, 241, 0.2)', text: '#6366f1' },
    };

    const moduleTerm = module.term || 'prelims';
    const moduleSemester = module.semester || 'first';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{
                opacity: 1,
                y: isHovered ? -4 : 0,
                scale: isHovered ? 1.01 : 1,
            }}
            transition={{
                opacity: { delay: index * 0.05, duration: 0.4 },
                y: isHovered ? { duration: 0.1 } : { delay: index * 0.05, duration: 0.4 },
                scale: { duration: 0.1 },
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`group rounded-2xl border cursor-pointer relative ${module.status === 'locked'
                ? 'bg-zinc-50/50 border-zinc-100 opacity-60'
                : 'bg-white border-zinc-100'
                }`}
            style={{
                boxShadow: isHovered && module.status !== 'locked'
                    ? '0 12px 32px rgba(59, 130, 246, 0.12)'
                    : 'none',
                borderColor: isHovered && module.status !== 'locked'
                    ? 'rgba(59, 130, 246, 0.3)'
                    : undefined,
            }}
        >
            {/* Professional Badges - Top Right */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                {/* Term Badge */}
                <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 + 0.15, duration: 0.3 }}
                    className="px-2 py-0.5 text-[10px] font-semibold rounded-md cursor-default transition-all duration-100"
                    style={{
                        background: termBadgeConfig[moduleTerm].bg,
                        border: `1px solid ${termBadgeConfig[moduleTerm].border}`,
                        color: termBadgeConfig[moduleTerm].text,
                    }}
                >
                    {termBadgeConfig[moduleTerm].label}
                </motion.div>

                {/* Semester Badge */}
                <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 + 0.2, duration: 0.3 }}
                    className="px-2 py-0.5 text-[10px] font-semibold rounded-md cursor-default transition-all duration-100"
                    style={{
                        background: semesterBadgeConfig[moduleSemester].bg,
                        border: `1px solid ${semesterBadgeConfig[moduleSemester].border}`,
                        color: semesterBadgeConfig[moduleSemester].text,
                    }}
                >
                    {semesterBadgeConfig[moduleSemester].label}
                </motion.div>
            </div>

            {/* Module Card Content */}
            <div className="p-5 pt-6 flex flex-col items-center text-center overflow-hidden rounded-2xl">
                {/* Icon - Centered */}
                <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center transition-transform duration-100 mb-3 ${module.status === 'completed'
                        ? 'bg-gradient-to-br from-emerald-400 to-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                        : module.status === 'in-progress'
                            ? 'bg-gradient-to-br from-blue-400 to-blue-500 text-white shadow-lg shadow-blue-500/20'
                            : 'bg-zinc-200 text-zinc-400'
                        }`}
                    style={{ transform: isHovered ? 'scale(1.05) rotate(3deg)' : 'scale(1) rotate(0deg)' }}
                >
                    {module.status === 'completed' ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                    ) : module.status === 'in-progress' ? (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                    ) : (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    )}
                </div>

                {/* Status Badge - Centered */}
                {module.status !== 'locked' && (
                    <span className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg mb-3 ${module.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        : 'bg-blue-50 text-blue-600 border border-blue-100'
                        }`}>
                        {module.status === 'completed' ? 'Completed' : 'In Progress'}
                    </span>
                )}

                {/* Title & Items Count - Centered */}
                <h3 className="text-sm font-semibold text-zinc-800 mb-1 line-clamp-2">{module.title}</h3>
                <p className="text-xs text-zinc-500 mb-4">{completedContents}/{module.contents.length} items completed</p>

                {/* Progress Section */}
                <div className="mb-4 w-full">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Progress</span>
                        <span className={`text-xs font-bold ${progressPercent === 100 ? 'text-emerald-600' : 'text-blue-600'}`}>
                            {progressPercent}%
                        </span>
                    </div>
                    <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.8, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                            className={`h-full rounded-full ${progressPercent === 100 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-blue-400 to-blue-500'}`}
                        />
                    </div>
                </div>

                {/* Content Type Icons - Centered */}
                <div className="flex items-center justify-center gap-2 mb-4">
                    {module.contents.slice(0, 4).map((content, cIndex) => {
                        const config = CONTENT_TYPE_CONFIG[content.type];
                        const colorClasses: Record<string, { base: string; hover: string }> = {
                            blue: {
                                base: content.completed ? 'bg-blue-50 text-blue-500 border-blue-100' : 'bg-zinc-50 text-zinc-400 border-zinc-100',
                                hover: content.completed ? 'hover:bg-blue-100' : 'hover:bg-zinc-100'
                            },
                            indigo: {
                                base: content.completed ? 'bg-indigo-50 text-indigo-500 border-indigo-100' : 'bg-zinc-50 text-zinc-400 border-zinc-100',
                                hover: content.completed ? 'hover:bg-indigo-100' : 'hover:bg-zinc-100'
                            },
                            amber: {
                                base: content.completed ? 'bg-amber-50 text-amber-500 border-amber-100' : 'bg-zinc-50 text-zinc-400 border-zinc-100',
                                hover: content.completed ? 'hover:bg-amber-100' : 'hover:bg-zinc-100'
                            },
                            rose: {
                                base: content.completed ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-zinc-50 text-zinc-400 border-zinc-100',
                                hover: content.completed ? 'hover:bg-rose-100' : 'hover:bg-zinc-100'
                            },
                        };

                        return (
                            <ContentIconWithTooltip
                                key={cIndex}
                                content={content}
                                config={config}
                                colorClasses={colorClasses}
                                isLocked={module.status === 'locked'}
                                index={index}
                                cIndex={cIndex}
                            />
                        );
                    })}
                    {module.contents.length > 4 && (
                        <span className="text-[10px] text-zinc-400 font-medium px-2 py-1 bg-zinc-50 rounded-lg border border-zinc-100">
                            +{module.contents.length - 4}
                        </span>
                    )}
                </div>

                {/* Action Button - Full width */}
                <button
                    className={`w-full py-2.5 text-xs font-semibold rounded-xl transition-all duration-100 ${module.status === 'locked'
                        ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                        : module.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100'
                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100'
                        }`}
                    disabled={module.status === 'locked'}
                    onClick={(e) => e.stopPropagation()}
                >
                    {module.status === 'locked' ? 'Locked' : module.status === 'completed' ? 'Review Module' : 'Continue Learning'}
                </button>
            </div>
        </motion.div>
    );
};

// Tab Actions Configuration
const TAB_ACTIONS: Record<TabType, { id: string; label: string; icon: React.ReactNode }[]> = {
    modules: [
        {
            id: 'continue',
            label: 'Continue Learning',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
            ),
        },
        {
            id: 'download',
            label: 'Download Materials',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3v12m0 0l-4-4m4 4l4-4" />
                    <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                </svg>
            ),
        },
        {
            id: 'syllabus',
            label: 'View Syllabus',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 12h6M9 16h6M13 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V8l-5-5z" />
                    <path d="M13 3v5h5" />
                </svg>
            ),
        },
    ],
    assignments: [
        {
            id: 'submit',
            label: 'Submit Assignment',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 19V5m0 0l-7 7m7-7l7 7" />
                </svg>
            ),
        },
        {
            id: 'grades',
            label: 'View All Grades',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3v18h18" />
                    <path d="M7 16l4-4 4 4 5-6" />
                </svg>
            ),
        },
        {
            id: 'calendar',
            label: 'View Calendar',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
            ),
        },
    ],
    news: [
        {
            id: 'mark-read',
            label: 'Mark All as Read',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 11 12 14 22 4" />
                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
            ),
        },
        {
            id: 'notifications',
            label: 'Notification Settings',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
            ),
        },
    ],
    students: [
        {
            id: 'message-all',
            label: 'Message Class',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
            ),
        },
        {
            id: 'export',
            label: 'Export List',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                </svg>
            ),
        },
        {
            id: 'groups',
            label: 'Create Groups',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            ),
        },
    ],
    teachers: [
        {
            id: 'schedule',
            label: 'Schedule Meeting',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
            ),
        },
        {
            id: 'email',
            label: 'Send Email',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M22 6l-10 7L2 6" />
                </svg>
            ),
        },
        {
            id: 'office-hours',
            label: 'View Office Hours',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                </svg>
            ),
        },
    ],
};

// Reusable Actions Dropdown Component - Minimalistic design matching other pages
const ActionsDropdown: React.FC<{ activeTab: TabType }> = ({ activeTab }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const actions = TAB_ACTIONS[activeTab];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Close dropdown when tab changes
    useEffect(() => {
        setIsOpen(false);
    }, [activeTab]);

    const handleAction = (actionId: string) => {
        console.log(`${activeTab} action: ${actionId}`);
        setIsOpen(false);
    };

    if (actions.length === 0) return null;

    return (
        <div
            ref={dropdownRef}
            style={{ position: 'relative', flexShrink: 0 }}
        >
            {/* Trigger Button - Clean minimalistic style */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    height: '40px',
                    padding: '0 14px',
                    borderRadius: '12px',
                    border: `1px solid ${isOpen ? '#3b82f6' : 'rgba(59, 130, 246, 0.2)'}`,
                    background: isOpen
                        ? 'rgba(59, 130, 246, 0.1)'
                        : isHovered
                            ? 'rgba(59, 130, 246, 0.08)'
                            : 'rgba(59, 130, 246, 0.05)',
                    color: '#3b82f6',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'background 0.1s ease, border-color 0.1s ease',
                }}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="19" cy="12" r="1" />
                    <circle cx="5" cy="12" r="1" />
                </svg>
                <span>Actions</span>
                <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.15s ease',
                    }}
                >
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </motion.button>

            {/* Dropdown Menu - Clean minimalistic design */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop to close on click outside */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.96 }}
                            transition={{ duration: 0.12, ease: 'easeOut' }}
                            style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: '4px',
                                padding: '4px',
                                borderRadius: '10px',
                                background: '#ffffff',
                                border: '1px solid rgba(0, 0, 0, 0.06)',
                                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                                zIndex: 50,
                                minWidth: '150px',
                            }}
                        >
                            {actions.map((action, index) => (
                                <ActionMenuItem
                                    key={action.id}
                                    action={action}
                                    index={index}
                                    onClick={() => handleAction(action.id)}
                                />
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

// Action Menu Item Component - Extracted for clean hover state management
const ActionMenuItem: React.FC<{
    action: { id: string; label: string; icon: React.ReactNode };
    index: number;
    onClick: () => void;
}> = ({ action, index, onClick }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.button
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.02, duration: 0.1 }}
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: '6px',
                border: 'none',
                background: isHovered ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                color: isHovered ? '#3b82f6' : '#64748b',
                fontSize: '11px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                textAlign: 'left',
                transition: 'background 0.1s ease, color 0.1s ease',
            }}
        >
            <div
                style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '6px',
                    background: isHovered ? 'rgba(59, 130, 246, 0.12)' : 'rgba(0, 0, 0, 0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.1s ease',
                }}
            >
                <div
                    style={{
                        width: '12px',
                        height: '12px',
                        color: isHovered ? '#3b82f6' : '#94a3b8',
                        transition: 'color 0.1s ease',
                    }}
                >
                    {action.icon}
                </div>
            </div>
            <span style={{ whiteSpace: 'nowrap' }}>{action.label}</span>
            <motion.svg
                initial={false}
                animate={{
                    opacity: isHovered ? 1 : 0,
                    x: isHovered ? 0 : -4
                }}
                transition={{ duration: 0.1 }}
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
                style={{ marginLeft: 'auto', flexShrink: 0 }}
            >
                <path d="M5 12h14M12 5l7 7-7 7" />
            </motion.svg>
        </motion.button>
    );
};

// Pagination Button Component - Minimalistic design
const PaginationButton: React.FC<{
    onClick: () => void;
    disabled: boolean;
    direction: 'prev' | 'next';
}> = ({ onClick, disabled, direction }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.button
            onClick={onClick}
            disabled={disabled}
            onMouseEnter={() => !disabled && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={!disabled ? { scale: 1.05 } : {}}
            whileTap={!disabled ? { scale: 0.95 } : {}}
            style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${disabled ? 'rgba(0, 0, 0, 0.06)' : isHovered ? '#3b82f6' : 'rgba(59, 130, 246, 0.2)'}`,
                background: disabled
                    ? 'transparent'
                    : isHovered
                        ? 'rgba(59, 130, 246, 0.1)'
                        : 'rgba(59, 130, 246, 0.05)',
                color: disabled ? '#cbd5e1' : '#3b82f6',
                fontSize: '12px',
                fontWeight: 500,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease',
            }}
        >
            {direction === 'prev' && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M15 18l-6-6 6-6" />
                </svg>
            )}
            {direction === 'prev' ? 'Prev' : 'Next'}
            {direction === 'next' && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 18l6-6-6-6" />
                </svg>
            )}
        </motion.button>
    );
};

// Page Number Button Component - Minimalistic design
const PageNumberButton: React.FC<{
    page: number;
    isActive: boolean;
    onClick: () => void;
}> = ({ page, isActive, onClick }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.button
            onClick={onClick}
            onMouseEnter={() => !isActive && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={!isActive ? { scale: 1.1 } : {}}
            whileTap={{ scale: 0.95 }}
            style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: isActive
                    ? '1px solid #3b82f6'
                    : `1px solid ${isHovered ? 'rgba(59, 130, 246, 0.3)' : 'transparent'}`,
                background: isActive
                    ? '#3b82f6'
                    : isHovered
                        ? 'rgba(59, 130, 246, 0.08)'
                        : 'transparent',
                color: isActive ? '#ffffff' : isHovered ? '#3b82f6' : '#64748b',
                fontSize: '12px',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
            }}
        >
            {page}
        </motion.button>
    );
};

// Floating Action Button Component - All actions moved to top dropdown
const FloatingActionButton: React.FC<{
    activeTab: TabType;
    onAction: (action: string) => void;
}> = ({ activeTab: _activeTab, onAction: _onAction }) => {
    // All actions have been moved to the top bar dropdown
    void _activeTab;
    void _onAction;
    return null;
};
// Preview Icon with Tooltip Component 
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
        <div style={{ position: 'relative', display: 'inline-flex' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}>
            <motion.div
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
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

const TABS: { id: TabType; label: string; icon: React.ReactNode }[] = [
    {
        id: 'modules',
        label: 'Modules',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
        ),
    },
    {
        id: 'assignments',
        label: 'Tasks',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
        ),
    },
    {
        id: 'news',
        label: 'News',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
        ),
    },
    {
        id: 'students',
        label: 'Students',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        ),
    },
    {
        id: 'teachers',
        label: 'Teachers',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
        ),
    },
];


// Teacher Mode Types
type TeacherTabType = 'manage-tasks' | 'grade-students' | 'analytics';
type YearLevel = 'all' | '1st' | '2nd' | '3rd' | '4th';
type Section = 'all' | 'A' | 'B' | 'C' | 'D';

// Submission type for grading
interface Submission {
    id: number;
    studentName: string;
    studentId: string;
    task: string;
    submitted: string;
    status: string;
    yearLevel: YearLevel;
    section: Section;
    aiScore: number | null;
}

// Fresh start - no student submissions yet (empty for realistic fresh database)
const SAMPLE_SUBMISSIONS: Submission[] = [];

const CourseViewPage: React.FC<CourseViewPageProps> = ({ course, onBack }) => {
    const { systemConfig } = useSystemConfig();
    const [activeTab, setActiveTab] = useState<TabType>('modules');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const modulesScrollRef = useRef<HTMLDivElement>(null);
    const tasksScrollRef = useRef<HTMLDivElement>(null);
    const studentsScrollRef = useRef<HTMLDivElement>(null);
    const submissionsScrollRef = useRef<HTMLDivElement>(null);
    const tabsContainerRef = useRef<HTMLDivElement>(null);

    const [taskFilter, setTaskFilter] = useState<TaskCategory>('all');
    const [termFilter, setTermFilter] = useState<'all' | 'prelims' | 'midterm' | 'prefinals' | 'finals'>('all');
    const [semesterFilter, setSemesterFilter] = useState<'first' | 'second'>('first');
    const [studentFilter, setStudentFilter] = useState<'all' | 'online' | 'offline'>('all');
    const [modulesPage, setModulesPage] = useState(1);
    const MODULES_PER_PAGE = 6;
    const [tabIndicatorStyle, setTabIndicatorStyle] = useState({ left: 4, width: 80 });

    // Supabase students data
    const [supabaseStudents, setSupabaseStudents] = useState<UserAccount[]>([]);
    const [isLoadingStudents, setIsLoadingStudents] = useState(true);

    // Supabase tasks data - fetch real assignments from database
    const [supabaseTasks, setSupabaseTasks] = useState<{ id: string | number; title: string; due: string; status: string; score: string | number | null; category: TaskCategory, points?: number, dueDate?: string, description?: string, instructions?: string, allowLateSubmission?: boolean, latePenalty?: number, maxAttempts?: number, rubricEnabled?: boolean, prerequisiteAssignmentId?: string | null, rubricCriteria?: any[], submissionCount?: number, attachments?: any[] }[]>([]);
    const [_isLoadingTasks, setIsLoadingTasks] = useState(true);

    // Fetch tasks from Supabase course_tasks table
    const fetchSupabaseTasks = useCallback(async () => {
        if (!supabase) {
            setIsLoadingTasks(false);
            return;
        }
        try {
            setIsLoadingTasks(true);

            // Get current student's section for filtering
            const currentUser = getCurrentUser();
            const studentSection = currentUser?.section || 'BSIT101A';

            const { data: tasks, error } = await supabase
                .from('course_tasks')
                .select('id, title, type, due_date, points, status, section, description, instructions, allow_late_submission, late_penalty, max_attempts, rubric_enabled, rubric_criteria, prerequisite_assignment_id, attachments')
                .eq('course_id', course.id)
                .eq('section', studentSection)
                .eq('status', 'published')
                .order('due_date', { ascending: true });

            if (error) {
                console.error('Failed to fetch tasks from Supabase:', error);
                setIsLoadingTasks(false);
                return;
            }

            // Fetch student submissions for these tasks (including count for max attempts)
            let submissionsMap: Record<string, { score: number | null, status: string, count: number }> = {};
            if (tasks && tasks.length > 0 && currentUser?.id) {
                const taskIds = tasks.map(t => t.id);
                // Use student_id field (the actual student ID) to match how submissions are stored
                const studentIdForQuery = currentUser.student_id || currentUser.id;
                const { data: subs } = await supabase
                    .from('student_submissions')
                    .select('task_id, score, status')
                    .eq('student_id', studentIdForQuery)
                    .in('task_id', taskIds);

                if (subs) {
                    subs.forEach(sub => {
                        const existing = submissionsMap[sub.task_id];
                        if (existing) {
                            // Count multiple submissions for max attempts tracking
                            existing.count += 1;
                            // Keep the latest submission's score/status
                            if (sub.score !== null) {
                                existing.score = sub.score;
                                existing.status = sub.status;
                            }
                        } else {
                            submissionsMap[sub.task_id] = { score: sub.score, status: sub.status, count: 1 };
                        }
                    });
                }
            }

            if (tasks && tasks.length > 0) {
                const mappedTasks = tasks.map((task) => {
                    // Get student submission
                    const submission = submissionsMap[task.id];
                    // Format due date for display
                    const dueDate = new Date(task.due_date);
                    const now = new Date();
                    const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    let dueLabel = '';
                    if (diffDays < 0) {
                        dueLabel = `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
                    } else if (diffDays === 0) {
                        dueLabel = 'Due Today';
                    } else if (diffDays === 1) {
                        dueLabel = 'Due Tomorrow';
                    } else if (diffDays <= 7) {
                        dueLabel = `Due in ${diffDays} days`;
                    } else {
                        dueLabel = `Due ${dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                    }

                    // Map DB type to TaskCategory
                    const categoryMap: Record<string, TaskCategory> = {
                        'assignment': 'assignment',
                        'quiz': 'quiz',
                        'performance': 'performance',
                        'practical': 'practical',
                        'journal': 'journal',
                    };

                    return {
                        id: task.id, // Use real UUID
                        title: task.title,
                        due: dueLabel,
                        status: submission?.status || (diffDays < 0 ? 'overdue' : 'pending'),
                        score: submission?.score ?? null,
                        category: categoryMap[task.type] || ('assignment' as TaskCategory),
                        points: task.points || 100,
                        dueDate: task.due_date,
                        description: task.description,
                        instructions: task.instructions,
                        allowLateSubmission: (task as any).allow_late_submission || false,
                        latePenalty: (task as any).late_penalty || 0,
                        maxAttempts: (task as any).max_attempts || 1,
                        rubricEnabled: (task as any).rubric_enabled || false,
                        rubricCriteria: (task as any).rubric_criteria || [],
                        prerequisiteAssignmentId: (task as any).prerequisite_assignment_id || null,
                        attachments: (task as any).attachments || [],
                        submissionCount: submission?.count || 0,
                        _diffDays: diffDays, // Internal use
                    };
                }).map((t: any) => {
                    // Feature Request (eLMS Unique Backend-safe auto-locking):
                    // If a task is past 15 days and never submitted, it gets explicitly locked forever instead of deleted.
                    if (t.status === 'overdue' && t._diffDays <= -15) {
                        return { ...t, status: 'locked' };
                    }
                    return t;
                });

                setSupabaseTasks(mappedTasks);
            } else {
                setSupabaseTasks([]);
            }
        } catch (err) {
            console.error('Error fetching tasks:', err);
        } finally {
            setIsLoadingTasks(false);
        }
    }, [course.id]);

    useEffect(() => {
        fetchSupabaseTasks();
    }, [fetchSupabaseTasks]);

    // Listen for realtime grading updates
    useEffect(() => {
        if (!supabase) return;
        const currentUser = getCurrentUser();
        if (!currentUser) return;

        const studentIdForSubscription = currentUser.student_id || currentUser.id;
        const channel = supabase
            .channel('student_grade_updates')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'student_submissions', filter: `student_id=eq.${studentIdForSubscription}` },
                (payload) => {
                    const updatedSub = payload.new;
                    setSupabaseTasks(prev => prev.map(t => {
                        if (t.id === updatedSub.task_id) {
                            return {
                                ...t,
                                score: updatedSub.score,
                                status: updatedSub.status
                            };
                        }
                        return t;
                    }));
                }
            )
            .subscribe();

        return () => {
            supabase?.removeChannel(channel);
        };
    }, []);

    // Teacher Mode State - persist across page refreshes
    const [isTeacherMode, _setIsTeacherMode] = useState(() => {
        return sessionStorage.getItem('teacher_mode_active') === 'true';
    });
    const [teacherTab, setTeacherTab] = useState<TeacherTabType>(() => {
        const saved = sessionStorage.getItem('teacher_mode_tab');
        return (saved as TeacherTabType) || 'manage-tasks';
    });
    const [isTeacherLoading, setIsTeacherLoading] = useState(false);
    const [yearLevelFilter, setYearLevelFilter] = useState<YearLevel>('all');
    const [sectionFilter, setSectionFilter] = useState<Section>('all');

    // One-time migration: Clear old ai-grading data for fresh start
    useEffect(() => {
        const migrationKey = 'ai-grading-reset-v2';
        if (!localStorage.getItem(migrationKey)) {
            // Clear all old ai-grading data
            const courseIds = ['cp1', 'euth1', 'itc', 'nstp1', 'pe1', 'ppc', 'purcom', 'tcw', 'uts'];
            courseIds.forEach(id => localStorage.removeItem(`ai-grading-${id}`));
            localStorage.setItem(migrationKey, 'true');
            console.log('[Migration] Cleared old ai-grading data for fresh start');
        }
    }, []);

    // Search debounce effect - show loading spinner briefly when typing
    useEffect(() => {
        if (searchQuery) {
            setIsSearching(true);
            const timer = setTimeout(() => {
                setIsSearching(false);
            }, 300); // Brief loading animation
            return () => clearTimeout(timer);
        } else {
            setIsSearching(false);
        }
    }, [searchQuery]);

    // Reset pagination when filters change
    useEffect(() => {
        setModulesPage(1);
    }, [termFilter, semesterFilter, searchQuery]);

    const [submissions, setSubmissions] = useState(() => {
        // Check if demo mode is active - only then load from localStorage
        const isDemoMode = localStorage.getItem('demo-mode-active') === 'true';
        if (isDemoMode) {
            const storageKey = `ai-grading-${course.id}`;
            try {
                const saved = localStorage.getItem(storageKey);
                if (saved) {
                    return JSON.parse(saved);
                }
            } catch (e) {
                console.error('Failed to load saved submissions:', e);
            }
        }
        // Fresh start - no submissions (empty array)
        return SAMPLE_SUBMISSIONS;
    });

    // Save submissions to localStorage when they change (only in demo mode)
    useEffect(() => {
        const isDemoMode = localStorage.getItem('demo-mode-active') === 'true';
        if (isDemoMode) {
            const storageKey = `ai-grading-${course.id}`;
            localStorage.setItem(storageKey, JSON.stringify(submissions));
        }
    }, [submissions, course.id]);

    // State for viewing task details in a modal
    const [instructionsModalTask, setInstructionsModalTask] = useState<any>(null);
    // State for the separate Submit Assignment modal
    const [submitModalTask, setSubmitModalTask] = useState<any>(null);
    const [submissionText, setSubmissionText] = useState('');
    const [submissionFiles, setSubmissionFiles] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const [showAddTaskModal, setShowAddTaskModal] = useState(false);
    const [selectedTaskType, setSelectedTaskType] = useState<TaskCategory>('assignment');

    // Add Task Form State
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDescription, setNewTaskDescription] = useState('');
    const [newTaskDueDate, setNewTaskDueDate] = useState('');
    const [newTaskPoints, setNewTaskPoints] = useState('100');
    const [newTaskInstructions, setNewTaskInstructions] = useState('');
    const [newTaskFiles, setNewTaskFiles] = useState<File[]>([]);
    const [isCreatingTask, setIsCreatingTask] = useState(false);
    const taskFileInputRef = useRef<HTMLInputElement>(null);

    const [isAiGrading, setIsAiGrading] = useState(false);
    const [aiGradingProgress, setAiGradingProgress] = useState(0);
    const [showAiWarning, setShowAiWarning] = useState(false);
    const [showYearDropdown, setShowYearDropdown] = useState(false);
    const [showSectionDropdown, setShowSectionDropdown] = useState(false);
    const [showTeacherTutorial, setShowTeacherTutorial] = useState(false);
    const [tutorialStep, setTutorialStep] = useState(0);
    const [contactTooltip, setContactTooltip] = useState<{ visible: boolean; x: number; y: number }>({ visible: false, x: 0, y: 0 });

    // Persist teacher mode state to sessionStorage
    useEffect(() => {
        sessionStorage.setItem('teacher_mode_active', isTeacherMode.toString());
    }, [isTeacherMode]);

    // Persist teacher tab to sessionStorage
    useEffect(() => {
        sessionStorage.setItem('teacher_mode_tab', teacherTab);
    }, [teacherTab]);

    // Calculate tab indicator position
    useEffect(() => {
        if (!tabsContainerRef.current) return;
        const currentTab = isTeacherMode ? teacherTab : activeTab;
        const buttons = tabsContainerRef.current.querySelectorAll<HTMLButtonElement>('button[data-tab-id]');
        const activeButton = Array.from(buttons).find(btn => btn.dataset.tabId === currentTab);

        if (activeButton) {
            const containerRect = tabsContainerRef.current.getBoundingClientRect();
            const buttonRect = activeButton.getBoundingClientRect();
            setTabIndicatorStyle({
                left: buttonRect.left - containerRect.left,
                width: buttonRect.width,
            });
        }
    }, [activeTab, teacherTab, isTeacherMode]);

    // Initial tab indicator calculation
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!tabsContainerRef.current) return;
            const currentTab = isTeacherMode ? teacherTab : activeTab;
            const buttons = tabsContainerRef.current.querySelectorAll<HTMLButtonElement>('button[data-tab-id]');
            const activeButton = Array.from(buttons).find(btn => btn.dataset.tabId === currentTab);

            if (activeButton) {
                const containerRect = tabsContainerRef.current.getBoundingClientRect();
                const buttonRect = activeButton.getBoundingClientRect();
                setTabIndicatorStyle({
                    left: buttonRect.left - containerRect.left,
                    width: buttonRect.width,
                });
            }
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    // Simulate loading for smooth transitions
    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => setIsLoading(false), 600);
        return () => clearTimeout(timer);
    }, [activeTab]);

    // Simulate loading for teacher mode tabs
    useEffect(() => {
        if (isTeacherMode) {
            setIsTeacherLoading(true);
            const timer = setTimeout(() => setIsTeacherLoading(false), 500);
            return () => clearTimeout(timer);
        }
    }, [teacherTab, isTeacherMode]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
            setShowYearDropdown(false);
            setShowSectionDropdown(false);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Show teacher tutorial only for first-time users
    useEffect(() => {
        if (isTeacherMode) {
            const hasSeenTutorial = localStorage.getItem('teacher_tutorial_completed');
            if (!hasSeenTutorial) {
                setTutorialStep(0); // Reset to first step
                const timer = setTimeout(() => {
                    setShowTeacherTutorial(true);
                }, 800);
                return () => clearTimeout(timer);
            }
        } else {
            setShowTeacherTutorial(false);
        }
    }, [isTeacherMode]);

    // Teacher Tutorial Steps with target selectors for highlighting
    const TEACHER_TUTORIAL_STEPS = [
        {
            title: 'Welcome to Teacher Mode! 👋',
            description: 'This powerful dashboard helps you manage your class efficiently. Let\'s walk through the key features.',
            icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
            ),
            color: 'blue',
            target: '.teacher-mode-header',
            modalPosition: 'bottom-left' as const,
            highlightOffset: { top: -60, left: 0, width: 0, height: 60 }
        },
        {
            title: 'Filter by Year & Section',
            description: 'Use the dropdown filters at the top to quickly filter students by year level and section. This helps you focus on specific groups.',
            icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
            ),
            color: 'blue',
            target: '.teacher-mode-header',
            modalPosition: 'bottom-left' as const,
            highlightOffset: { top: -60, left: 0, width: 0, height: 60 }
        },
        {
            title: 'Manage Tasks Tab',
            description: 'Create, edit, and organize assignments, quizzes, and activities. Use the task type filters to quickly find what you need.',
            icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" /><path d="M12 18v-6" /><path d="M9 15h6" />
                </svg>
            ),
            color: 'yellow',
            target: '.teacher-tabs',
            modalPosition: 'bottom-left' as const
        },
        {
            title: 'Grade Students Tab',
            description: 'Review and grade student submissions. Use AI-powered grading assistance to speed up your workflow and provide consistent feedback.',
            icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
            ),
            color: 'green',
            target: '.teacher-tabs',
            modalPosition: 'bottom-center' as const
        },
        {
            title: 'Analytics Dashboard',
            description: 'Get insights into class performance with detailed analytics. Track grades, submissions, completion rates, and identify students who need attention.',
            icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M3 3v18h18" /><path d="M7 16l4-4 4 4 5-6" />
                </svg>
            ),
            color: 'blue',
            target: '.teacher-tabs',
            modalPosition: 'bottom-right' as const
        },
        {
            title: 'Quick Stats Cards',
            description: 'Monitor key metrics at a glance - total students, average grades, pending submissions, and more. Hover over icons for animations!',
            icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                </svg>
            ),
            color: 'yellow',
            target: '.analytics-stats-grid',
            secondaryTarget: '.analytics-quick-stats',
            modalPosition: 'bottom-right' as const,
            highlightOffset: { top: -80, left: 0, width: 0, height: 0 },
            autoScroll: true
        },
        {
            title: 'You\'re Ready! 🎉',
            description: 'That\'s everything! Start managing your class with confidence. You can always toggle Teacher Mode on/off using the button in the header.\n\nNote: This is still in example phase po sir/ma\'am, so this is purely for visual demonstration but everything is working with functioning systems.',
            icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
            ),
            color: 'green',
            target: null as string | null,
            modalPosition: 'center' as 'bottom-left' | 'bottom-center' | 'bottom-right' | 'center',
            noHighlight: true,
            isLastStep: true
        },
    ];

    // State for highlight rectangle and modal position
    const [highlightRect, setHighlightRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
    const [modalPosition, setModalPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

    // Auto-switch tabs based on tutorial step
    useEffect(() => {
        if (!showTeacherTutorial) return;

        // Step 3 = Manage Tasks (index 2), Step 4 = Grade Students (index 3), Step 5 = Analytics (index 4), Step 6 = Stats (index 5)
        if (tutorialStep === 2) {
            setTeacherTab('manage-tasks');
        } else if (tutorialStep === 3) {
            setTeacherTab('grade-students');
        } else if (tutorialStep === 4 || tutorialStep === 5) {
            setTeacherTab('analytics');
        }
    }, [tutorialStep, showTeacherTutorial]);

    // Calculate highlight and modal position based on current step
    useEffect(() => {
        if (!showTeacherTutorial) {
            setHighlightRect(null);
            return;
        }

        const step = TEACHER_TUTORIAL_STEPS[tutorialStep];

        // Handle noHighlight steps (like step 7)
        if (step?.noHighlight || !step?.target) {
            setHighlightRect(null);
            // Center modal when no highlight
            setModalPosition({
                top: window.innerHeight / 2 - 200,
                left: window.innerWidth / 2 - 200
            });
            return;
        }

        const calculatePositions = () => {
            if (!step.target) {
                setHighlightRect(null);
                setModalPosition({
                    top: window.innerHeight / 2 - 200,
                    left: window.innerWidth / 2 - 200
                });
                return;
            }

            const element = document.querySelector(step.target);
            if (!element) {
                setHighlightRect(null);
                setModalPosition({
                    top: window.innerHeight / 2 - 200,
                    left: window.innerWidth / 2 - 200
                });
                return;
            }

            const rect = element.getBoundingClientRect();
            const padding = 8;

            // Apply offset if specified
            const offset = step.highlightOffset || { top: 0, left: 0, width: 0, height: 0 };

            // Check for secondary target to combine bounding boxes
            let combinedRect = {
                top: rect.top,
                left: rect.left,
                right: rect.right,
                bottom: rect.bottom
            };

            if (step.secondaryTarget) {
                const secondaryElement = document.querySelector(step.secondaryTarget);
                if (secondaryElement) {
                    const secondaryRect = secondaryElement.getBoundingClientRect();
                    combinedRect = {
                        top: Math.min(rect.top, secondaryRect.top),
                        left: Math.min(rect.left, secondaryRect.left),
                        right: Math.max(rect.right, secondaryRect.right),
                        bottom: Math.max(rect.bottom, secondaryRect.bottom)
                    };
                }
            }

            // Set highlight rect with offset (using combined rect)
            setHighlightRect({
                top: combinedRect.top - padding + offset.top,
                left: combinedRect.left - padding + offset.left,
                width: (combinedRect.right - combinedRect.left) + padding * 2 + offset.width,
                height: (combinedRect.bottom - combinedRect.top) + padding * 2 + offset.height,
            });

            // Calculate modal position based on step's modalPosition hint
            const modalWidth = 320;
            const modalHeight = 320;
            const gap = 16;
            let modalTop = 0;
            let modalLeft = 0;

            switch (step.modalPosition) {
                case 'bottom-left':
                    modalTop = combinedRect.bottom + gap;
                    modalLeft = 40;
                    break;
                case 'bottom-center':
                    modalTop = combinedRect.bottom + gap;
                    modalLeft = window.innerWidth / 2 - modalWidth / 2;
                    break;
                case 'bottom-right':
                    modalTop = combinedRect.bottom + gap;
                    modalLeft = window.innerWidth - modalWidth - 40;
                    break;
                case 'center':
                default:
                    modalTop = window.innerHeight / 2 - modalHeight / 2;
                    modalLeft = window.innerWidth / 2 - modalWidth / 2;
                    break;
            }

            // Keep modal within viewport
            modalTop = Math.max(20, Math.min(modalTop, window.innerHeight - modalHeight - 20));
            modalLeft = Math.max(20, Math.min(modalLeft, window.innerWidth - modalWidth - 20));

            setModalPosition({ top: modalTop, left: modalLeft });
        };

        // Auto-scroll if specified
        if (step.autoScroll && step.target) {
            const element = document.querySelector(step.target);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }

        // Initial calculation (with delay to allow scroll to complete)
        const timer = setTimeout(calculatePositions, step.autoScroll ? 400 : 100);

        // Recalculate on resize/scroll
        window.addEventListener('resize', calculatePositions);
        window.addEventListener('scroll', calculatePositions);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', calculatePositions);
            window.removeEventListener('scroll', calculatePositions);
        };
    }, [showTeacherTutorial, tutorialStep]);

    const handleTutorialNext = () => {
        if (tutorialStep < TEACHER_TUTORIAL_STEPS.length - 1) {
            setTutorialStep(tutorialStep + 1);
        } else {
            // Mark tutorial as completed so it won't show again
            localStorage.setItem('teacher_tutorial_completed', 'true');
            setShowTeacherTutorial(false);
            setTutorialStep(0);
        }
    };

    const handleTutorialPrev = () => {
        if (tutorialStep > 0) {
            setTutorialStep(tutorialStep - 1);
        }
    };

    const handleTutorialSkip = () => {
        // Mark tutorial as completed so it won't show again
        localStorage.setItem('teacher_tutorial_completed', 'true');
        setShowTeacherTutorial(false);
        setTutorialStep(0);
    };

    const displayTitle = course.title.replace(' - SY2526-1T', '');
    const courseCode = course.subtitle.split(' · ')[0];

    // Get instructor based on course
    const getInstructor = () => {
        const instructors: Record<string, { name: string; title: string; email: string }> = {
            'cp1': { name: 'David Clarence Del Mundo', title: 'Instructor', email: 'd.delmundo@university.edu' },
            'euth1': { name: 'Claire Maurillo', title: 'Instructor', email: 'c.maurillo@university.edu' },
            'itc': { name: 'Psalmmiracle Mariano', title: 'Instructor', email: 'p.mariano@university.edu' },
            'nstp1': { name: 'Dan Risty Montojo', title: 'Instructor', email: 'd.montojo@university.edu' },
            'pe1': { name: 'Mark Joseph Danoy', title: 'Instructor', email: 'm.danoy@university.edu' },
            'ppc': { name: 'Claire Maurillo', title: 'Instructor', email: 'c.maurillo@university.edu' },
            'purcom': { name: 'John Denielle San Martin', title: 'Instructor', email: 'j.sanmartin@university.edu' },
            'tcw': { name: 'Anne Jenell Lumintigar', title: 'Instructor', email: 'a.lumintigar@university.edu' },
            'uts': { name: 'Jocel Lazalita', title: 'Instructor', email: 'j.lazalita@university.edu' },
        };
        return instructors[course.id] || { name: 'Instructor', title: 'Instructor', email: 'instructor@university.edu' };
    };

    const instructor = getInstructor();

    // Get course-specific data
    const courseData = useMemo(() => getCourseData(course.id), [course.id]);
    const courseModules = courseData.modules;
    // Merge demo tasks with real Supabase tasks
    const courseTasks = useMemo(() => {
        const demoTasks = courseData.tasks || [];
        // Combine: demo tasks first, then Supabase tasks
        return [...demoTasks, ...supabaseTasks];
    }, [courseData.tasks, supabaseTasks]);

    // Filtered data based on search and filters
    const filteredModules = useMemo(() =>
        courseModules.filter(m => {
            const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesTerm = termFilter === 'all' || (m.term || 'prelims') === termFilter;
            const matchesSemester = (m.semester || 'first') === semesterFilter;
            return matchesSearch && matchesTerm && matchesSemester;
        }),
        [searchQuery, courseModules, termFilter, semesterFilter]
    );

    // Filtered tasks based on search and category
    const filteredTasks = useMemo(() =>
        courseTasks.filter(t => {
            const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
            let matchesCategory = false;

            if (taskFilter === 'all') {
                const taskAny = t as any;
                // Visual Clutter Rule: Do not show heavily overdue or locked tasks in the 'All' feed
                if ((t.status === 'overdue' && taskAny._diffDays < -7) || t.status === 'locked') {
                    matchesCategory = false;
                } else {
                    matchesCategory = true;
                }
            } else if (taskFilter === 'overdue') {
                const isOverdueDemo = t.due.toLowerCase().includes('overdue');
                let isRealtimeOverdue = false;
                // Determine if a supabase task is genuinely overdue by time
                const taskAny = t as any;
                if (taskAny.id && taskAny.due_date) {
                    const dueDate = new Date(taskAny.due_date);
                    if (new Date() > dueDate && t.status !== 'submitted') {
                        isRealtimeOverdue = true;
                    }
                }

                // If they specifically clicked the Overdue filter, SHOW everything overdue AND locked!
                matchesCategory = isOverdueDemo || isRealtimeOverdue || t.status === 'locked';
            } else {
                matchesCategory = t.category === taskFilter;
            }

            return matchesSearch && matchesCategory;
        }),
        [searchQuery, taskFilter, courseTasks]
    );

    const filteredNews = useMemo(() =>
        SAMPLE_NEWS.filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase())),
        [searchQuery]
    );

    // Fetch students from Supabase on mount
    useEffect(() => {
        const loadStudents = async () => {
            setIsLoadingStudents(true);
            try {
                const students = await getClassmates('BSIT101A');
                setSupabaseStudents(students);
            } catch (error) {
                console.error('[CourseViewPage] Failed to load students:', error);
            } finally {
                setIsLoadingStudents(false);
            }
        };
        loadStudents();
    }, []);

    // Get students data - prefer Supabase data, fallback to demo mode
    const studentsData = useMemo(() => {
        if (supabaseStudents.length > 0) {
            // Transform UserAccount to the expected format
            return supabaseStudents.map((s, index) => ({
                id: index + 1,
                name: s.full_name,
                status: s.is_online ? 'online' : 'offline',
                role: 'Student',
                email: s.email,
                avatar: s.profile_image,
                lastActive: s.last_active,
            }));
        }
        return getStudentsData();
    }, [supabaseStudents]);

    const filteredStudents = useMemo(() =>
        studentsData.filter((s: { name: string; email: string; status: string }) => {
            const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = studentFilter === 'all' || s.status === studentFilter;
            return matchesSearch && matchesFilter;
        }),
        [searchQuery, studentFilter, studentsData]
    );

    // Get teachers data for this course (with demo mode support)
    // @ts-ignore - Reserved for future use
    const _teachersData = useMemo(() => getTeachersData(course.id), [course.id]);

    // Get AI grading data for this course (with demo mode support)
    // @ts-ignore - Reserved for future use
    const _aiGradingData = useMemo(() => getAIGradingData(course.id), [course.id]);

    // Handle wheel scroll to horizontal scroll for modules - snap to cards
    useEffect(() => {
        const modulesContainer = modulesScrollRef.current;
        if (!modulesContainer || activeTab !== 'modules' || isLoading) return;

        let isHoveringContainer = false;

        const handleMouseEnter = () => { isHoveringContainer = true; };
        const handleMouseLeave = () => { isHoveringContainer = false; };

        const handleWheel = (e: WheelEvent) => {
            // Only intercept scroll when hovering over the container
            if (!isHoveringContainer) return;

            // Check if there's horizontal scroll available
            const hasHorizontalScroll = modulesContainer.scrollWidth > modulesContainer.clientWidth;
            if (!hasHorizontalScroll) return;

            // Prevent default vertical scroll behavior
            e.preventDefault();

            // Card width (w-80 = 320px) + gap (gap-4 = 16px) = 336px per card
            const cardWidth = 336;
            const currentScroll = modulesContainer.scrollLeft;
            const maxScroll = modulesContainer.scrollWidth - modulesContainer.clientWidth;

            // Determine scroll direction and calculate target
            if (e.deltaY > 0) {
                // Scroll down = scroll right by one card
                const targetScroll = Math.min(currentScroll + cardWidth, maxScroll);
                modulesContainer.scrollTo({ left: targetScroll, behavior: 'smooth' });
            } else {
                // Scroll up = scroll left by one card
                const targetScroll = Math.max(currentScroll - cardWidth, 0);
                modulesContainer.scrollTo({ left: targetScroll, behavior: 'smooth' });
            }
        };

        modulesContainer.addEventListener('mouseenter', handleMouseEnter);
        modulesContainer.addEventListener('mouseleave', handleMouseLeave);
        // Use passive: false to allow preventDefault
        modulesContainer.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            modulesContainer.removeEventListener('mouseenter', handleMouseEnter);
            modulesContainer.removeEventListener('mouseleave', handleMouseLeave);
            modulesContainer.removeEventListener('wheel', handleWheel);
        };
    }, [activeTab, isLoading, filteredModules.length]);

    // Handle wheel scroll to horizontal scroll for tasks - snap to cards
    useEffect(() => {
        const tasksContainer = tasksScrollRef.current;
        if (!tasksContainer || activeTab !== 'assignments' || isLoading) return;

        let isHoveringContainer = false;

        const handleMouseEnter = () => { isHoveringContainer = true; };
        const handleMouseLeave = () => { isHoveringContainer = false; };

        const handleWheel = (e: WheelEvent) => {
            // Only intercept scroll when hovering over the container
            if (!isHoveringContainer) return;

            // Check if there's horizontal scroll available
            const hasHorizontalScroll = tasksContainer.scrollWidth > tasksContainer.clientWidth;
            if (!hasHorizontalScroll) return;

            // Prevent default vertical scroll behavior
            e.preventDefault();

            // Card width (w-56 = 224px) + gap (gap-3 = 12px) = 236px per card
            const cardWidth = 236;
            const currentScroll = tasksContainer.scrollLeft;
            const maxScroll = tasksContainer.scrollWidth - tasksContainer.clientWidth;

            // Determine scroll direction and calculate target
            if (e.deltaY > 0) {
                // Scroll down = scroll right by one card
                const targetScroll = Math.min(currentScroll + cardWidth, maxScroll);
                tasksContainer.scrollTo({ left: targetScroll, behavior: 'smooth' });
            } else {
                // Scroll up = scroll left by one card
                const targetScroll = Math.max(currentScroll - cardWidth, 0);
                tasksContainer.scrollTo({ left: targetScroll, behavior: 'smooth' });
            }
        };

        tasksContainer.addEventListener('mouseenter', handleMouseEnter);
        tasksContainer.addEventListener('mouseleave', handleMouseLeave);
        // Use passive: false to allow preventDefault
        tasksContainer.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            tasksContainer.removeEventListener('mouseenter', handleMouseEnter);
            tasksContainer.removeEventListener('mouseleave', handleMouseLeave);
            tasksContainer.removeEventListener('wheel', handleWheel);
        };
    }, [activeTab, isLoading, filteredTasks.length]);

    // Handle wheel scroll to horizontal scroll for students - snap to cards
    useEffect(() => {
        const studentsContainer = studentsScrollRef.current;
        if (!studentsContainer || activeTab !== 'students' || isLoading) return;

        let isHoveringContainer = false;

        const handleMouseEnter = () => { isHoveringContainer = true; };
        const handleMouseLeave = () => { isHoveringContainer = false; };

        const handleWheel = (e: WheelEvent) => {
            // Only intercept scroll when hovering over the container
            if (!isHoveringContainer) return;

            // Check if there's horizontal scroll available
            const hasHorizontalScroll = studentsContainer.scrollWidth > studentsContainer.clientWidth;
            if (!hasHorizontalScroll) return;

            // Prevent default vertical scroll behavior
            e.preventDefault();

            // Card width (w-40 = 160px) + gap (gap-3 = 12px) = 172px per card
            const cardWidth = 172;
            const currentScroll = studentsContainer.scrollLeft;
            const maxScroll = studentsContainer.scrollWidth - studentsContainer.clientWidth;

            // Determine scroll direction and calculate target
            if (e.deltaY > 0) {
                // Scroll down = scroll right by one card
                const targetScroll = Math.min(currentScroll + cardWidth, maxScroll);
                studentsContainer.scrollTo({ left: targetScroll, behavior: 'smooth' });
            } else {
                // Scroll up = scroll left by one card
                const targetScroll = Math.max(currentScroll - cardWidth, 0);
                studentsContainer.scrollTo({ left: targetScroll, behavior: 'smooth' });
            }
        };

        studentsContainer.addEventListener('mouseenter', handleMouseEnter);
        studentsContainer.addEventListener('mouseleave', handleMouseLeave);
        // Use passive: false to allow preventDefault
        studentsContainer.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            studentsContainer.removeEventListener('mouseenter', handleMouseEnter);
            studentsContainer.removeEventListener('mouseleave', handleMouseLeave);
            studentsContainer.removeEventListener('wheel', handleWheel);
        };
    }, [activeTab, isLoading, filteredStudents.length]);

    // Handle wheel scroll to horizontal scroll for submissions in teacher mode - snap to cards
    useEffect(() => {
        const submissionsContainer = submissionsScrollRef.current;
        if (!submissionsContainer || !isTeacherMode || teacherTab !== 'grade-students') return;

        let isHoveringContainer = false;

        const handleMouseEnter = () => { isHoveringContainer = true; };
        const handleMouseLeave = () => { isHoveringContainer = false; };

        const handleWheel = (e: WheelEvent) => {
            // Only intercept scroll when hovering over the container
            if (!isHoveringContainer) return;

            // Check if there's horizontal scroll available
            const hasHorizontalScroll = submissionsContainer.scrollWidth > submissionsContainer.clientWidth;
            if (!hasHorizontalScroll) return;

            e.preventDefault();

            // Card width (w-72 = 288px) + gap (gap-4 = 16px) = 304px per card
            const cardWidth = 304;
            const currentScroll = submissionsContainer.scrollLeft;
            const maxScroll = submissionsContainer.scrollWidth - submissionsContainer.clientWidth;

            if (e.deltaY > 0) {
                const targetScroll = Math.min(currentScroll + cardWidth, maxScroll);
                submissionsContainer.scrollTo({ left: targetScroll, behavior: 'smooth' });
            } else {
                const targetScroll = Math.max(currentScroll - cardWidth, 0);
                submissionsContainer.scrollTo({ left: targetScroll, behavior: 'smooth' });
            }
        };

        submissionsContainer.addEventListener('mouseenter', handleMouseEnter);
        submissionsContainer.addEventListener('mouseleave', handleMouseLeave);
        submissionsContainer.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            submissionsContainer.removeEventListener('mouseenter', handleMouseEnter);
            submissionsContainer.removeEventListener('mouseleave', handleMouseLeave);
            submissionsContainer.removeEventListener('wheel', handleWheel);
        };
    }, [isTeacherMode, teacherTab, submissions.length, yearLevelFilter, sectionFilter]);

    // Handle wheel scroll for teacher manage-tasks cards
    useEffect(() => {
        const tasksContainer = tasksScrollRef.current;
        if (!tasksContainer || !isTeacherMode || teacherTab !== 'manage-tasks') return;

        let isHoveringContainer = false;

        const handleMouseEnter = () => { isHoveringContainer = true; };
        const handleMouseLeave = () => { isHoveringContainer = false; };

        const handleWheel = (e: WheelEvent) => {
            // Only intercept scroll when hovering over the container
            if (!isHoveringContainer) return;

            // Check if there's horizontal scroll available
            const hasHorizontalScroll = tasksContainer.scrollWidth > tasksContainer.clientWidth;
            if (!hasHorizontalScroll) return;

            e.preventDefault();

            // Card width (w-64 = 256px) + gap (gap-4 = 16px) = 272px per card
            const cardWidth = 272;
            const currentScroll = tasksContainer.scrollLeft;
            const maxScroll = tasksContainer.scrollWidth - tasksContainer.clientWidth;

            if (e.deltaY > 0) {
                const targetScroll = Math.min(currentScroll + cardWidth, maxScroll);
                tasksContainer.scrollTo({ left: targetScroll, behavior: 'smooth' });
            } else {
                const targetScroll = Math.max(currentScroll - cardWidth, 0);
                tasksContainer.scrollTo({ left: targetScroll, behavior: 'smooth' });
            }
        };

        tasksContainer.addEventListener('mouseenter', handleMouseEnter);
        tasksContainer.addEventListener('mouseleave', handleMouseLeave);
        tasksContainer.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            tasksContainer.removeEventListener('mouseenter', handleMouseEnter);
            tasksContainer.removeEventListener('mouseleave', handleMouseLeave);
            tasksContainer.removeEventListener('wheel', handleWheel);
        };
    }, [isTeacherMode, teacherTab, selectedTaskType]);

    // Get search placeholder based on active tab
    const getSearchPlaceholder = () => {
        switch (activeTab) {
            case 'modules': return 'Search modules...';
            case 'assignments': return 'Search assignments...';
            case 'news': return 'Search announcements...';
            case 'students': return 'Search students...';
            default: return 'Search...';
        }
    };


    const renderContent = () => {
        switch (activeTab) {
            case 'modules':
                if (isLoading) {
                    return (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1">
                                {[0, 1, 2, 3].map((i) => (
                                    <motion.div
                                        key={i}
                                        className="flex-shrink-0 w-80 h-64 bg-zinc-100 rounded-xl"
                                        animate={{ opacity: [0.5, 0.8, 0.5] }}
                                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    );
                }

                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                        {/* Container with Semester Switch on left and Term Filter on right */}
                        <div className="p-4 rounded-2xl bg-white border border-zinc-100 shadow-sm">
                            <div className="flex items-center justify-between">
                                {/* Semester Switch - Far Left */}
                                <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-zinc-50 border border-zinc-100">
                                    <motion.button
                                        onClick={() => setSemesterFilter('first')}
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${semesterFilter === 'first'
                                            ? 'bg-white text-blue-600 shadow-sm border border-blue-100'
                                            : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100'
                                            }`}
                                        whileTap={{ scale: 0.97 }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={semesterFilter === 'first' ? 'text-blue-500' : 'text-zinc-400'}>
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                            <text x="12" y="17" textAnchor="middle" fontSize="6" fill="currentColor" stroke="none">1</text>
                                        </svg>
                                        1st Semester
                                    </motion.button>
                                    <motion.button
                                        onClick={() => setSemesterFilter('second')}
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${semesterFilter === 'second'
                                            ? 'bg-white text-blue-600 shadow-sm border border-blue-100'
                                            : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100'
                                            }`}
                                        whileTap={{ scale: 0.97 }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={semesterFilter === 'second' ? 'text-blue-500' : 'text-zinc-400'}>
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                            <text x="12" y="17" textAnchor="middle" fontSize="6" fill="currentColor" stroke="none">2</text>
                                        </svg>
                                        2nd Semester
                                    </motion.button>
                                </div>

                                {/* Term Filter - Far Right */}
                                <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-zinc-50 border border-zinc-100">
                                    {[
                                        {
                                            id: 'all' as const, label: 'All', icon: (
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                                                    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                                                </svg>
                                            )
                                        },
                                        {
                                            id: 'prelims' as const, label: 'Preliminaries', icon: (
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                    <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" />
                                                </svg>
                                            )
                                        },
                                        {
                                            id: 'midterm' as const, label: 'Midterm', icon: (
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                    <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                                                </svg>
                                            )
                                        },
                                        {
                                            id: 'prefinals' as const, label: 'Pre-Finals', icon: (
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                                                </svg>
                                            )
                                        },
                                        {
                                            id: 'finals' as const, label: 'Finals', icon: (
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                                </svg>
                                            )
                                        },
                                    ].map((term) => (
                                        <motion.button
                                            key={term.id}
                                            onClick={() => setTermFilter(term.id)}
                                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${termFilter === term.id
                                                ? 'bg-white text-blue-600 shadow-sm border border-blue-100'
                                                : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100'
                                                }`}
                                            whileTap={{ scale: 0.97 }}
                                        >
                                            <span className={termFilter === term.id ? 'text-blue-500' : 'text-zinc-400'}>{term.icon}</span>
                                            {term.label}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {filteredModules.length === 0 ? (
                            <EmptyState
                                icon={
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                        <path d="M8 7h8M8 11h6M8 15h4" />
                                    </svg>
                                }
                                title="No modules found"
                                description={searchQuery ? `No modules match "${searchQuery}"` : termFilter !== 'all' ? `No modules in ${termFilter === 'prelims' ? 'Preliminaries' : termFilter === 'midterm' ? 'Midterm' : termFilter === 'prefinals' ? 'Pre-Finals' : 'Finals'}` : "This course doesn't have any modules yet"}
                                action={(searchQuery || termFilter !== 'all') ? { label: searchQuery ? 'Clear search' : 'Show all', onClick: () => { setSearchQuery(''); setTermFilter('all'); } } : undefined}
                            />
                        ) : (
                            <>
                                {/* Pagination calculation */}
                                {(() => {
                                    const totalPages = Math.ceil(filteredModules.length / MODULES_PER_PAGE);
                                    const startIndex = (modulesPage - 1) * MODULES_PER_PAGE;
                                    const paginatedModules = filteredModules.slice(startIndex, startIndex + MODULES_PER_PAGE);

                                    return (
                                        <>
                                            <div
                                                ref={modulesScrollRef}
                                                className="flex flex-wrap justify-center gap-4"
                                            >
                                                {paginatedModules.map((module, index) => (
                                                    <div key={module.id} className="w-full max-w-[320px]">
                                                        <ModuleCard module={module} index={index} />
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Pagination Controls - Minimalistic Design */}
                                            {totalPages > 1 && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.15 }}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '8px',
                                                        marginTop: '24px',
                                                        paddingTop: '20px',
                                                        borderTop: '1px solid rgba(0, 0, 0, 0.06)',
                                                    }}
                                                >
                                                    {/* Previous Button */}
                                                    <PaginationButton
                                                        onClick={() => setModulesPage(Math.max(1, modulesPage - 1))}
                                                        disabled={modulesPage === 1}
                                                        direction="prev"
                                                    />

                                                    {/* Page Numbers */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                                            // Show first, last, current, and adjacent pages
                                                            const showPage = page === 1 ||
                                                                page === totalPages ||
                                                                Math.abs(page - modulesPage) <= 1;
                                                            const showEllipsis = (page === 2 && modulesPage > 3) ||
                                                                (page === totalPages - 1 && modulesPage < totalPages - 2);

                                                            if (!showPage && !showEllipsis) return null;
                                                            if (showEllipsis && !showPage) {
                                                                return (
                                                                    <span
                                                                        key={`ellipsis-${page}`}
                                                                        style={{
                                                                            padding: '0 4px',
                                                                            color: '#94a3b8',
                                                                            fontSize: '12px',
                                                                        }}
                                                                    >
                                                                        ...
                                                                    </span>
                                                                );
                                                            }

                                                            return (
                                                                <PageNumberButton
                                                                    key={page}
                                                                    page={page}
                                                                    isActive={modulesPage === page}
                                                                    onClick={() => setModulesPage(page)}
                                                                />
                                                            );
                                                        })}
                                                    </div>

                                                    {/* Next Button */}
                                                    <PaginationButton
                                                        onClick={() => setModulesPage(Math.min(totalPages, modulesPage + 1))}
                                                        disabled={modulesPage === totalPages}
                                                        direction="next"
                                                    />
                                                </motion.div>
                                            )}

                                            {/* Results Info */}
                                            {filteredModules.length > MODULES_PER_PAGE && (
                                                <motion.p
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    style={{
                                                        textAlign: 'center',
                                                        marginTop: '12px',
                                                        fontSize: '11px',
                                                        color: '#94a3b8',
                                                    }}
                                                >
                                                    Showing {startIndex + 1}-{Math.min(startIndex + MODULES_PER_PAGE, filteredModules.length)} of {filteredModules.length} modules
                                                </motion.p>
                                            )}
                                        </>
                                    );
                                })()}
                            </>
                        )}
                    </motion.div>
                );

            case 'assignments':
                if (isLoading) {
                    return (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                            {/* Filter skeleton */}
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {[0, 1, 2, 3, 4, 5].map((i) => (
                                    <motion.div
                                        key={i}
                                        className="h-8 w-28 bg-zinc-100 rounded-lg flex-shrink-0"
                                        animate={{ opacity: [0.5, 0.8, 0.5] }}
                                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                                    />
                                ))}
                            </div>
                            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                                {[0, 1, 2, 3].map((i) => (
                                    <motion.div
                                        key={i}
                                        className="flex-shrink-0 w-56 h-44 bg-zinc-100 rounded-xl"
                                        animate={{ opacity: [0.5, 0.8, 0.5] }}
                                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    );
                }

                // Get counts for each task category
                const getTaskCategoryCount = (cat: TaskCategory) => {
                    if (cat === 'all') {
                        return courseTasks.filter((t: any) => {
                            if ((t.status === 'overdue' && t._diffDays < -7) || t.status === 'locked') return false;
                            return true;
                        }).length;
                    }
                    if (cat === 'overdue') {
                        return courseTasks.filter((t: any) => {
                            const isOverdueDemo = t.due?.toLowerCase().includes('overdue');
                            let isRealtimeOverdue = false;
                            if (t.id && t.due_date) {
                                const dueDate = new Date(t.due_date);
                                if (new Date() > dueDate && t.status !== 'submitted') {
                                    isRealtimeOverdue = true;
                                }
                            }
                            return isOverdueDemo || isRealtimeOverdue || t.status === 'locked';
                        }).length;
                    }
                    return courseTasks.filter((t: { category: TaskCategory }) => t.category === cat).length;
                };

                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                        {/* Container matching modules section design */}
                        <div className="p-4 rounded-2xl bg-white border border-zinc-100 shadow-sm">
                            {/* Task Category Filter - Centered */}
                            <div className="flex justify-center">
                                <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-zinc-50 border border-zinc-100">
                                    {TASK_CATEGORIES.map((cat) => {
                                        const count = getTaskCategoryCount(cat.id);
                                        const isActive = taskFilter === cat.id;

                                        return (
                                            <motion.button
                                                key={cat.id}
                                                onClick={() => setTaskFilter(cat.id)}
                                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${isActive
                                                    ? 'bg-white text-blue-600 shadow-sm border border-blue-100'
                                                    : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100'
                                                    }`}
                                                whileTap={{ scale: 0.97 }}
                                            >
                                                <span className={isActive ? 'text-blue-500' : 'text-zinc-400'}>{cat.icon}</span>
                                                {cat.label}
                                                {count > 0 && (
                                                    <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${isActive ? 'bg-blue-50 text-blue-600' : 'bg-zinc-100 text-zinc-500'
                                                        }`}>
                                                        {count}
                                                    </span>
                                                )}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Task List */}
                        {filteredTasks.length === 0 ? (
                            <EmptyState
                                icon={
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                                        <path d="M9 11l3 3L22 4" />
                                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                    </svg>
                                }
                                title={taskFilter !== 'all' ? `No ${TASK_CATEGORIES.find(c => c.id === taskFilter)?.label.toLowerCase()} found` : "No tasks found"}
                                description={searchQuery ? `No tasks match "${searchQuery}"` : taskFilter !== 'all' ? `No ${TASK_CATEGORIES.find(c => c.id === taskFilter)?.label.toLowerCase()} yet` : "You're all caught up!"}
                                action={(searchQuery || taskFilter !== 'all') ? {
                                    label: searchQuery ? 'Clear search' : 'Show all',
                                    onClick: () => { setSearchQuery(''); setTaskFilter('all'); }
                                } : undefined}
                            />
                        ) : (
                            <div
                                ref={tasksScrollRef}
                                className="flex gap-4 overflow-x-auto pt-4 pb-12 -mx-6 px-6 snap-x snap-mandatory scroll-smooth"
                                style={{ scrollPaddingLeft: '24px' }}
                            >
                                {filteredTasks.map((task, index) => {
                                    const categoryConfig = TASK_CATEGORIES.find(c => c.id === task.category);

                                    // Color configs matching teacher preview
                                    const typeColors: Record<string, { bg: string; text: string; border: string }> = {
                                        assignment: { bg: 'rgba(16, 185, 129, 0.1)', text: '#059669', border: 'rgba(16, 185, 129, 0.2)' },
                                        performance: { bg: 'rgba(139, 92, 246, 0.1)', text: '#7c3aed', border: 'rgba(139, 92, 246, 0.2)' },
                                        quiz: { bg: 'rgba(245, 158, 11, 0.1)', text: '#d97706', border: 'rgba(245, 158, 11, 0.2)' },
                                        practical: { bg: 'rgba(244, 63, 94, 0.1)', text: '#e11d48', border: 'rgba(244, 63, 94, 0.2)' },
                                        journal: { bg: 'rgba(6, 182, 212, 0.1)', text: '#0891b2', border: 'rgba(6, 182, 212, 0.2)' },
                                    };

                                    const typeColor = typeColors[task.category] || typeColors.assignment;

                                    let isOverdue = task.due.toLowerCase().includes('overdue');
                                    const taskAny = task as any;
                                    if (taskAny.id && taskAny.due_date) {
                                        const dueDate = new Date(taskAny.due_date);
                                        if (new Date() > dueDate && task.status !== 'submitted') {
                                            isOverdue = true;
                                        }
                                    }
                                    const studentSection = getCurrentUser()?.section || 'BSIT101A';

                                    return (
                                        <motion.div
                                            key={task.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
                                            whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(59, 130, 246, 0.15)' }}
                                            style={{
                                                flexShrink: 0,
                                                width: '320px',
                                                borderRadius: '20px',
                                                border: '1px solid rgba(59, 130, 246, 0.12)',
                                                background: '#fff',
                                                cursor: 'pointer',
                                                position: 'relative',
                                                scrollSnapAlign: 'start',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                overflow: 'hidden'
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                console.log("Card clicked", task.id);
                                            }}
                                        >
                                            {/* Completed Badge */}
                                            {(task.status === 'submitted' || task.status === 'resubmitted' || task.status === 'graded' || (task.score !== null && task.score !== undefined && Number(task.score) > 0)) && (
                                                <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 2 }}>
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        whileHover={{ scale: 1.05, boxShadow: task.status === 'resubmitted' ? '0 4px 12px rgba(168, 85, 247, 0.25)' : '0 4px 12px rgba(16, 185, 129, 0.25)' }}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            padding: '4px 10px',
                                                            background: 'rgba(255, 255, 255, 0.9)',
                                                            backdropFilter: 'blur(8px)',
                                                            border: task.status === 'resubmitted' ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                                                            borderRadius: '20px',
                                                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                                                            cursor: 'default'
                                                        }}
                                                    >
                                                        {task.status === 'resubmitted' ? (
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="1 4 1 10 7 10"></polyline>
                                                                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                                                            </svg>
                                                        ) : (
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M20 6L9 17l-5-5" />
                                                            </svg>
                                                        )}
                                                        <span style={{ fontSize: '10px', fontWeight: 700, color: task.status === 'resubmitted' ? '#a855f7' : '#10b981', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                                                            {task.status === 'resubmitted' ? 'Resubmitted' : 'Completed'}
                                                        </span>
                                                    </motion.div>
                                                </div>
                                            )}

                                            {/* Contact Teacher icon – top right corner for overdue tasks */}
                                            {isOverdue && (
                                                <div
                                                    style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 2 }}
                                                    onMouseEnter={(e) => {
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        setContactTooltip({
                                                            visible: true,
                                                            x: rect.left + rect.width / 2,
                                                            y: rect.bottom + 10,
                                                        });
                                                    }}
                                                    onMouseLeave={() => {
                                                        setContactTooltip(prev => ({ ...prev, visible: false }));
                                                    }}
                                                >
                                                    <motion.button
                                                        whileHover={{ scale: 1.12, boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)' }}
                                                        whileTap={{ scale: 0.92 }}
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            try {
                                                                const client = supabase;
                                                                if (!client) {
                                                                    window.location.href = `mailto:Testing@testing?subject=Regarding Overdue Task: ${task.title}`;
                                                                    return;
                                                                }
                                                                const { data } = await client
                                                                    .from('users')
                                                                    .select('email')
                                                                    .eq('email', 'Testing@testing')
                                                                    .single();
                                                                if (data && data.email) {
                                                                    window.location.href = `mailto:${data.email}?subject=Regarding Overdue Task: ${task.title}`;
                                                                } else {
                                                                    window.location.href = `mailto:Testing@testing?subject=Regarding Overdue Task: ${task.title}`;
                                                                }
                                                            } catch (err) {
                                                                window.location.href = `mailto:Testing@testing?subject=Regarding Overdue Task: ${task.title}`;
                                                            }
                                                        }}
                                                        style={{
                                                            width: '34px',
                                                            height: '34px',
                                                            borderRadius: '10px',
                                                            background: 'rgba(239, 68, 68, 0.08)',
                                                            border: '1px solid rgba(239, 68, 68, 0.18)',
                                                            color: '#dc2626',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            cursor: 'pointer',
                                                            padding: 0
                                                        }}
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                                            <polyline points="22,6 12,13 2,6" />
                                                        </svg>
                                                    </motion.button>
                                                </div>
                                            )}
                                            <div style={{ padding: '24px 20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: 1 }}>
                                                {/* Large Icon at Top with Gradient */}
                                                <div style={{
                                                    width: '56px', height: '56px', borderRadius: '14px',
                                                    background: task.category === 'quiz' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : task.category === 'performance' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : task.category === 'journal' || task.category === 'practical' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    marginBottom: '12px',
                                                    boxShadow: task.category === 'quiz' ? '0 8px 20px rgba(245, 158, 11, 0.25)' : task.category === 'performance' ? '0 8px 20px rgba(16, 185, 129, 0.25)' : task.category === 'journal' || task.category === 'practical' ? '0 8px 20px rgba(239, 68, 68, 0.25)' : '0 8px 20px rgba(59, 130, 246, 0.25)'
                                                }}>
                                                    {task.category === 'quiz' ? (
                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                                                            <circle cx="12" cy="12" r="10" />
                                                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                                            <line x1="12" y1="17" x2="12.01" y2="17" />
                                                        </svg>
                                                    ) : task.category === 'performance' ? (
                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                                                            <circle cx="12" cy="12" r="10" />
                                                            <circle cx="12" cy="12" r="6" />
                                                            <circle cx="12" cy="12" r="2" />
                                                        </svg>
                                                    ) : task.category === 'journal' || task.category === 'practical' ? (
                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                                                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                                            <line x1="9" y1="7" x2="17" y2="7" />
                                                            <line x1="9" y1="11" x2="15" y2="11" />
                                                        </svg>
                                                    ) : (
                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                            <polyline points="14 2 14 8 20 8" />
                                                            <line x1="16" y1="13" x2="8" y2="13" />
                                                            <line x1="16" y1="17" x2="8" y2="17" />
                                                        </svg>
                                                    )}
                                                </div>

                                                {/* Type Badge */}
                                                <span style={{
                                                    padding: '5px 12px', borderRadius: '8px',
                                                    background: typeColor.bg, border: `1px solid ${typeColor.border}`,
                                                    color: typeColor.text, fontSize: '10px', fontWeight: 600,
                                                    textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px'
                                                }}>
                                                    {categoryConfig?.label || 'Assignment'}
                                                </span>

                                                {/* Title */}
                                                <h3 style={{
                                                    margin: '0 0 6px 0', fontSize: '15px', fontWeight: 600, color: '#1e293b',
                                                    lineHeight: 1.4, minHeight: '42px', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis',
                                                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                                                }}>
                                                    {task.title}
                                                </h3>

                                                {/* Course & Section Subtitle Redesign */}
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginBottom: '16px', minHeight: '26px' }}>
                                                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '4px 8px', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '6px', color: '#64748b', fontSize: '11px', fontWeight: 500, maxWidth: '100%' }}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                                                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                                                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                                                        </svg>
                                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px' }} title={course.title}>
                                                            {course.title.split('-')[0].trim()}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '4px 8px', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '6px', color: '#64748b', fontSize: '11px', fontWeight: 500 }}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                                                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                                            <circle cx="11" cy="7" r="4" />
                                                        </svg>
                                                        {studentSection}
                                                    </div>
                                                </div>

                                                <div style={{ flexGrow: 1 }} />

                                                {/* Points & Progress */}
                                                <div style={{ width: '100%', marginBottom: '16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                        <span style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Points</span>
                                                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#3b82f6' }}>{task.score ?? 0} / {(task as any).points || 100} pts</span>
                                                    </div>
                                                    <div style={{ height: '6px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '999px', overflow: 'hidden' }}>
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${Math.min((Number(task.score ?? 0) / ((task as any).points || 100)) * 100, 100)}%` }}
                                                            transition={{ duration: 0.8 }}
                                                            style={{ height: '100%', borderRadius: '999px', background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)' }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Icons Row */}
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
                                                    {/* Due Date Icon */}
                                                    <PreviewIconWithTooltip
                                                        label="Due Date"
                                                        subtitle={(task as any).dueDate ? new Date((task as any).dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set'}
                                                        color={(task as any).dueDate ? '#3b82f6' : '#94a3b8'}
                                                        bgColor={(task as any).dueDate ? 'rgba(59, 130, 246, 0.1)' : 'rgba(148, 163, 184, 0.1)'}
                                                        borderColor={(task as any).dueDate ? 'rgba(59, 130, 246, 0.15)' : 'rgba(148, 163, 184, 0.15)'}
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={(task as any).dueDate ? '#3b82f6' : '#94a3b8'} strokeWidth="2">
                                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                            <line x1="16" y1="2" x2="16" y2="6" />
                                                            <line x1="8" y1="2" x2="8" y2="6" />
                                                            <line x1="3" y1="10" x2="21" y2="10" />
                                                        </svg>
                                                    </PreviewIconWithTooltip>

                                                    {/* Attempts Icon with Tooltip */}
                                                    <PreviewIconWithTooltip
                                                        label="Attempts"
                                                        subtitle={`${(task as any).maxAttempts || 1} attempt${((task as any).maxAttempts || 1) > 1 ? 's' : ''} allowed`}
                                                        color="#003DA5"
                                                        bgColor="rgba(0, 61, 165, 0.1)"
                                                        borderColor="rgba(0, 61, 165, 0.15)"
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#003DA5" strokeWidth="2">
                                                            <polyline points="1 4 1 10 7 10" />
                                                            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                                                        </svg>
                                                    </PreviewIconWithTooltip>

                                                    {/* Late Submission Icon with Tooltip */}
                                                    <PreviewIconWithTooltip
                                                        label="Late Submission"
                                                        subtitle={(task as any).allowLateSubmission ? 'Allowed' : 'Not allowed'}
                                                        color={(task as any).allowLateSubmission ? '#10b981' : '#ef4444'}
                                                        bgColor={(task as any).allowLateSubmission ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}
                                                        borderColor={(task as any).allowLateSubmission ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={(task as any).allowLateSubmission ? '#10b981' : '#ef4444'} strokeWidth="2">
                                                            {(task as any).allowLateSubmission ? (
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
                                                    {((task as any).attachments?.length > 0) && (
                                                        <PreviewIconWithTooltip
                                                            label="Attachments"
                                                            subtitle={`${(task as any).attachments.length} file${(task as any).attachments.length > 1 ? 's' : ''}`}
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
                                                    {((task as any).rubricCriteria?.length > 0) && (
                                                        <PreviewIconWithTooltip
                                                            label="Rubric"
                                                            subtitle={`${(task as any).rubricCriteria.length} criteria`}
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

                                                {/* Styled Due Date Badge */}
                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                                    <div style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                        padding: '4px 10px', borderRadius: '12px',
                                                        background: isOverdue ? 'rgba(239, 68, 68, 0.1)' : 'rgba(241, 245, 249, 1)',
                                                        border: `1px solid ${isOverdue ? 'rgba(239, 68, 68, 0.2)' : 'rgba(226, 232, 240, 1)'}`,
                                                        color: isOverdue ? '#dc2626' : '#64748b',
                                                        fontSize: '11px', fontWeight: 600
                                                    }}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                            <circle cx="12" cy="12" r="10" />
                                                            <path d="M12 6v6l4 2" />
                                                        </svg>
                                                        {task.due}
                                                    </div>

                                                    {(task as any).dueDate && (
                                                        <div style={{
                                                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                            padding: '4px 10px', borderRadius: '12px',
                                                            background: 'rgba(241, 245, 249, 1)',
                                                            border: '1px solid rgba(226, 232, 240, 1)',
                                                            color: '#475569',
                                                            fontSize: '11px', fontWeight: 600
                                                        }}>
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                                <line x1="16" y1="2" x2="16" y2="6" />
                                                                <line x1="8" y1="2" x2="8" y2="6" />
                                                                <line x1="3" y1="10" x2="21" y2="10" />
                                                            </svg>
                                                            Date to submit: {new Date((task as any).dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Bottom Button Area */}
                                            <div style={{ padding: '0 20px 24px 20px', marginTop: 'auto' }}>
                                                {(task.score !== null && task.score !== undefined) ? (
                                                    <div style={{
                                                        width: '100%', padding: '12px', borderRadius: '12px',
                                                        background: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.12)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                                    }}>
                                                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#3b82f6' }}>Score: {task.score} / {(task as any).points || 100} pts</span>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        {(() => {
                                                            const maxAttempts = (task as any).maxAttempts || 1;
                                                            const submissionCount = (task as any).submissionCount || 0;
                                                            const attemptsExhausted = maxAttempts > 1 && submissionCount >= maxAttempts;
                                                            const allowLate = (task as any).allowLateSubmission || false;
                                                            const latePenalty = (task as any).latePenalty || 0;
                                                            const isOverdue = task.status === 'overdue' || (task.due && task.due.toLowerCase().includes('overdue'));

                                                            // Calculate days late for penalty display
                                                            let daysLate = 0;
                                                            if (isOverdue && (task as any).dueDate) {
                                                                const dueDate = new Date((task as any).dueDate);
                                                                const now = new Date();
                                                                daysLate = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                                                            }
                                                            const totalPenalty = Math.min(100, daysLate * latePenalty);

                                                            // Case 1: All attempts used up
                                                            if (attemptsExhausted) {
                                                                return (
                                                                    <div style={{
                                                                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                        gap: '6px', padding: '8px 14px',
                                                                        background: 'rgba(239, 68, 68, 0.06)', color: '#ef4444',
                                                                        border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '10px',
                                                                        fontSize: '12px', fontWeight: 600,
                                                                    }}>
                                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                                        </svg>
                                                                        No attempts remaining ({submissionCount}/{maxAttempts} used)
                                                                    </div>
                                                                );
                                                            }

                                                            // Case 2: Overdue and late submissions NOT allowed
                                                            if (isOverdue && !allowLate) {
                                                                return (
                                                                    <div style={{
                                                                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                        gap: '6px', padding: '8px 14px',
                                                                        background: 'rgba(239, 68, 68, 0.06)', color: '#ef4444',
                                                                        border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '10px',
                                                                        fontSize: '12px', fontWeight: 600,
                                                                    }}>
                                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                                        </svg>
                                                                        Submission closed — past due date
                                                                    </div>
                                                                );
                                                            }

                                                            // Case 3: Overdue but late submissions ARE allowed
                                                            if (isOverdue && allowLate) {
                                                                return (
                                                                    <>
                                                                        {/* Late penalty warning */}
                                                                        {latePenalty > 0 && (
                                                                            <div style={{
                                                                                width: '100%', display: 'flex', alignItems: 'center', gap: '6px',
                                                                                padding: '6px 12px',
                                                                                background: 'rgba(245, 158, 11, 0.08)',
                                                                                border: '1px solid rgba(245, 158, 11, 0.15)',
                                                                                borderRadius: '8px',
                                                                                fontSize: '11px', fontWeight: 500, color: '#92400e',
                                                                            }}>
                                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                                                                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                                                                    <line x1="12" y1="9" x2="12" y2="13" />
                                                                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                                                                </svg>
                                                                                {daysLate} day{daysLate !== 1 ? 's' : ''} late · -{totalPenalty}% penalty applied
                                                                            </div>
                                                                        )}
                                                                        {!systemConfig.submissions_enabled ? (
                                                                            <div style={{
                                                                                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                                gap: '6px', padding: '8px 14px',
                                                                                background: 'rgba(100, 116, 139, 0.08)', color: '#64748b',
                                                                                border: '1px solid rgba(100, 116, 139, 0.2)', borderRadius: '10px',
                                                                                fontSize: '13px', fontWeight: 600, cursor: 'not-allowed'
                                                                            }}>
                                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                                                </svg>
                                                                                Submissions Locked
                                                                            </div>
                                                                        ) : (
                                                                            <motion.button
                                                                                initial={{ opacity: 0, x: 10 }}
                                                                                animate={{ opacity: 1, x: 0 }}
                                                                            transition={{
                                                                                default: { duration: 0.15, ease: 'easeOut' },
                                                                                opacity: { delay: 0.35, duration: 0.3 },
                                                                                x: { delay: 0.35, duration: 0.3 }
                                                                            }}
                                                                            whileHover={{ scale: 1.02, boxShadow: '0 6px 20px rgba(245, 158, 11, 0.25)' }}
                                                                            whileTap={{ scale: 0.98 }}
                                                                            onClick={(e) => { e.stopPropagation(); setSubmitModalTask(task); }}
                                                                            style={{
                                                                                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                                gap: '6px', padding: '8px 14px',
                                                                                background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b',
                                                                                border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '10px',
                                                                                fontSize: '13px', fontWeight: 600, cursor: 'pointer'
                                                                            }}
                                                                        >
                                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                                <circle cx="12" cy="12" r="10" />
                                                                                <polyline points="12 6 12 12 16 14" />
                                                                            </svg>
                                                                            Submit Late
                                                                            {maxAttempts > 1 && (
                                                                                <span style={{
                                                                                    fontSize: '10px', padding: '1px 6px', borderRadius: '6px',
                                                                                    background: 'rgba(245, 158, 11, 0.12)', marginLeft: '2px',
                                                                                }}>
                                                                                    {maxAttempts - submissionCount} left
                                                                                </span>
                                                                            )}
                                                                        </motion.button>
                                                                        )}
                                                                    </>
                                                                );
                                                            }

                                                            // Case 4: Normal — on time, can submit
                                                            if (!systemConfig.submissions_enabled) {
                                                                return (
                                                                    <div style={{
                                                                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                        gap: '6px', padding: '8px 14px',
                                                                        background: 'rgba(100, 116, 139, 0.08)', color: '#64748b',
                                                                        border: '1px solid rgba(100, 116, 139, 0.2)', borderRadius: '10px',
                                                                        fontSize: '13px', fontWeight: 600, cursor: 'not-allowed'
                                                                    }}>
                                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                                        </svg>
                                                                        Submissions Locked
                                                                    </div>
                                                                );
                                                            }

                                                            return (
                                                                <motion.button
                                                                    initial={{ opacity: 0, x: 10 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                    transition={{
                                                                        default: { duration: 0.15, ease: 'easeOut' },
                                                                        opacity: { delay: 0.35, duration: 0.3 },
                                                                        x: { delay: 0.35, duration: 0.3 }
                                                                    }}
                                                                    whileHover={{ scale: 1.02, boxShadow: '0 6px 20px rgba(59, 130, 246, 0.25)' }}
                                                                    whileTap={{ scale: 0.98 }}
                                                                    onClick={(e) => { e.stopPropagation(); setSubmitModalTask(task); }}
                                                                    style={{
                                                                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                        gap: '6px', padding: '8px 14px',
                                                                        background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6',
                                                                        border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '10px',
                                                                        fontSize: '13px', fontWeight: 600, cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                                        <circle cx="12" cy="12" r="3" />
                                                                    </svg>
                                                                    Submit Task
                                                                    {maxAttempts > 1 && (
                                                                        <span style={{
                                                                            fontSize: '10px', padding: '1px 6px', borderRadius: '6px',
                                                                            background: 'rgba(59, 130, 246, 0.12)', marginLeft: '2px',
                                                                        }}>
                                                                            {maxAttempts - submissionCount} left
                                                                        </span>
                                                                    )}
                                                                </motion.button>
                                                            );
                                                        })()}

                                                    </div>
                                                )}

                                                <motion.button
                                                    initial={{ opacity: 0, x: 10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{
                                                        default: { duration: 0.15, ease: 'easeOut' },
                                                        opacity: { delay: 0.35, duration: 0.3 },
                                                        x: { delay: 0.35, duration: 0.3 }
                                                    }}
                                                    whileHover={{
                                                        scale: 1.02,
                                                        boxShadow: '0 6px 20px rgba(236, 72, 153, 0.25)',
                                                        borderColor: 'rgba(236, 72, 153, 0.5)',
                                                    }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setInstructionsModalTask(task);
                                                    }}
                                                    style={{
                                                        width: '100%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '6px',
                                                        padding: '8px 14px',
                                                        background: document.documentElement.classList.contains('dark') ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.5), rgba(71, 85, 105, 0.6) 50%, rgba(236, 72, 153, 0.15))' : 'linear-gradient(135deg, #f8fafc, #f1f5f9 50%, #fdf2f8)',
                                                        color: document.documentElement.classList.contains('dark') ? '#e2e8f0' : '#475569',
                                                        border: `1px solid ${document.documentElement.classList.contains('dark') ? 'rgba(236, 72, 153, 0.25)' : 'rgba(236, 72, 153, 0.2)'}`,
                                                        borderRadius: '10px',
                                                        fontSize: '13px',
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        marginTop: '12px',
                                                        flexShrink: 0,
                                                        position: 'relative',
                                                        overflow: 'hidden',
                                                        transition: 'border-color 0.2s ease',
                                                    }}
                                                >
                                                    <div style={{
                                                        position: 'absolute', inset: 0,
                                                        background: 'linear-gradient(135deg, transparent, rgba(236, 72, 153, 0.08), transparent)',
                                                        opacity: 0.8, pointerEvents: 'none',
                                                    }} />
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginRight: '2px' }}>
                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                        <polyline points="14 2 14 8 20 8" />
                                                        <line x1="16" y1="13" x2="8" y2="13" />
                                                        <line x1="16" y1="17" x2="8" y2="17" />
                                                        <polyline points="10 9 9 9 8 9" />
                                                    </svg>
                                                    <span style={{ color: document.documentElement.classList.contains('dark') ? '#cbd5e1' : '#475569' }}>View Instructions</span>
                                                    <span style={{ margin: '0 2px', color: '#ec4899', fontWeight: 800 }}>&amp;</span>
                                                    <span style={{ color: document.documentElement.classList.contains('dark') ? '#f472b6' : '#db2777' }}>Rubrics</span>
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                );


            case 'news':
                if (isLoading) {
                    return (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        className="flex-shrink-0 w-64 h-44 bg-zinc-100 rounded-xl"
                                        animate={{ opacity: [0.5, 0.8, 0.5] }}
                                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    );
                }
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        {filteredNews.length === 0 ? (
                            <EmptyState
                                icon={
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                        <line x1="12" y1="2" x2="12" y2="4" />
                                    </svg>
                                }
                                title="No announcements"
                                description={searchQuery ? `No news match "${searchQuery}"` : "No announcements from your instructor yet"}
                                action={searchQuery ? { label: 'Clear search', onClick: () => setSearchQuery('') } : undefined}
                            />
                        ) : (
                            <div className="flex gap-3 overflow-x-auto pt-1 pb-4 -mx-1 px-1 snap-x snap-mandatory">
                                {filteredNews.map((news, index) => (
                                    <motion.div
                                        key={news.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
                                        whileHover={{ y: -4, transition: { duration: 0.15 } }}
                                        className={`group flex-shrink-0 w-64 p-4 rounded-xl border bg-white hover:shadow-lg cursor-pointer transition-all snap-start ${news.unread ? 'border-blue-200 bg-gradient-to-br from-blue-50/50 to-white' : 'border-zinc-100 hover:border-blue-200'
                                            }`}
                                    >
                                        <div className="flex flex-col h-full">
                                            {/* Header with unread indicator */}
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${news.unread ? 'bg-blue-100 text-blue-600' : 'bg-zinc-100 text-zinc-500'
                                                        }`}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                                        </svg>
                                                    </div>
                                                    <span className="text-[10px] text-zinc-500">{news.date}</span>
                                                </div>
                                                {news.unread && (
                                                    <motion.div
                                                        className="w-2 h-2 rounded-full bg-blue-500"
                                                        animate={{ scale: [1, 1.2, 1] }}
                                                        transition={{ duration: 2, repeat: Infinity }}
                                                    />
                                                )}
                                            </div>

                                            {/* Title */}
                                            <p className={`text-sm font-semibold line-clamp-2 mb-2 ${news.unread ? 'text-zinc-900' : 'text-zinc-700'}`}>
                                                {news.title}
                                            </p>

                                            {/* Preview */}
                                            <p className="text-xs text-zinc-500 line-clamp-3 leading-relaxed flex-1">
                                                {news.preview}
                                            </p>

                                            {/* Read More */}
                                            <motion.button
                                                whileHover={{ x: 3 }}
                                                className="mt-3 flex items-center gap-1 text-[10px] font-medium text-blue-600"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                Read more
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                    <polyline points="9 18 15 12 9 6" />
                                                </svg>
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                );

            case 'students':
                if (isLoading || isLoadingStudents) {
                    return (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            {/* Header Skeleton */}
                            <div className="mb-4 p-4 bg-white rounded-xl border border-zinc-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-zinc-100 animate-pulse" />
                                        <div>
                                            <div className="h-4 bg-zinc-200 rounded w-32 mb-2 animate-pulse" />
                                            <div className="h-3 bg-zinc-100 rounded w-24 animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="h-8 w-20 bg-zinc-100 rounded-lg animate-pulse" />
                                        <div className="h-8 w-20 bg-zinc-100 rounded-lg animate-pulse" />
                                    </div>
                                </div>
                            </div>
                            {/* Cards Skeleton */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                                    <motion.div
                                        key={i}
                                        className="p-4 bg-white rounded-xl border border-zinc-100"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                    >
                                        <div className="flex flex-col items-center">
                                            <div className="w-14 h-14 rounded-full bg-zinc-100 mb-3 animate-pulse" />
                                            <div className="h-3 bg-zinc-200 rounded w-20 mb-2 animate-pulse" />
                                            <div className="h-2 bg-zinc-100 rounded w-16 animate-pulse" />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    );
                }

                const onlineCount = studentsData.filter((s: { status: string }) => s.status === 'online').length;
                const offlineCount = studentsData.filter((s: { status: string }) => s.status === 'offline').length;
                const totalStudents = studentsData.length;

                // Student filter tabs config
                const studentFilterTabs: { id: 'all' | 'online' | 'offline'; label: string; count: number; icon: React.ReactNode }[] = [
                    {
                        id: 'all', label: 'All', count: totalStudents, icon: (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        )
                    },
                    {
                        id: 'online', label: 'Online', count: onlineCount, icon: (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M8 12l2 2 4-4" />
                            </svg>
                        )
                    },
                    {
                        id: 'offline', label: 'Offline', count: offlineCount, icon: (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                            </svg>
                        )
                    },
                ];

                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        {/* Container matching modules/tasks section design */}
                        <div className="mb-4 p-4 rounded-2xl bg-white border border-zinc-100 shadow-sm">
                            <div className="flex items-center justify-between">
                                {/* Section Info - Left */}
                                <div className="flex items-center gap-3">
                                    <motion.div
                                        className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20"
                                        whileHover={{ scale: 1.05, rotate: 3 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                        </svg>
                                    </motion.div>
                                    <div>
                                        <p className="text-sm font-semibold text-zinc-800">Section BSIT101-A</p>
                                        <p className="text-xs text-zinc-500">
                                            {filteredStudents.length} {filteredStudents.length === 1 ? 'student' : 'students'} {searchQuery || studentFilter !== 'all' ? 'found' : 'enrolled'}
                                        </p>
                                    </div>
                                </div>

                                {/* Filter Tabs - Right - Matching modules/tasks design */}
                                <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-zinc-50 border border-zinc-100">
                                    {studentFilterTabs.map((tab) => (
                                        <motion.button
                                            key={tab.id}
                                            onClick={() => setStudentFilter(tab.id)}
                                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${studentFilter === tab.id
                                                ? 'bg-white text-blue-600 shadow-sm border border-blue-100'
                                                : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100'
                                                }`}
                                            whileTap={{ scale: 0.97 }}
                                        >
                                            <span className={studentFilter === tab.id ? 'text-blue-500' : 'text-zinc-400'}>{tab.icon}</span>
                                            {tab.label}
                                            <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${studentFilter === tab.id ? 'bg-blue-50 text-blue-600' : 'bg-zinc-100 text-zinc-500'
                                                }`}>
                                                {tab.count}
                                            </span>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {filteredStudents.length === 0 && !isSearching ? (
                            <EmptyState
                                icon={
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                }
                                title="No students found"
                                description={searchQuery ? `No students match "${searchQuery}"` : studentFilter !== 'all' ? `No ${studentFilter} students` : "No students enrolled yet"}
                                action={searchQuery || studentFilter !== 'all' ? {
                                    label: searchQuery ? 'Clear search' : 'Show all',
                                    onClick: () => { setSearchQuery(''); setStudentFilter('all'); }
                                } : undefined}
                            />
                        ) : isSearching ? (
                            /* Search Skeleton Loading */
                            <motion.div
                                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
                                    <motion.div
                                        key={i}
                                        className="p-4 bg-white rounded-xl border border-zinc-100"
                                        initial={{ opacity: 0.5 }}
                                        animate={{ opacity: [0.5, 0.8, 0.5] }}
                                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.05 }}
                                    >
                                        <div className="flex flex-col items-center">
                                            <div className="w-14 h-14 rounded-full bg-zinc-100 mb-3" />
                                            <div className="h-3 bg-zinc-200 rounded w-20 mb-2" />
                                            <div className="h-2 bg-zinc-100 rounded w-16 mb-2" />
                                            <div className="h-5 bg-zinc-50 rounded-full w-14" />
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div
                                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.1 }}
                            >
                                {filteredStudents.map((student: { id: number; name: string; status: string; role: string; email: string; avatar?: string }, index: number) => (
                                    <StudentCard
                                        key={student.id}
                                        student={student}
                                        index={index}
                                    />
                                ))}
                            </motion.div>
                        )}
                    </motion.div>
                );

            case 'teachers':
                if (isLoading) {
                    return (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 rounded-2xl border border-zinc-100 bg-white shadow-sm">
                            <div className="flex items-center gap-4">
                                <motion.div
                                    className="w-14 h-14 rounded-full bg-zinc-100"
                                    animate={{ opacity: [0.5, 0.8, 0.5] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                />
                                <div className="flex-1 space-y-2">
                                    <motion.div
                                        className="h-5 bg-zinc-100 rounded-md w-2/3"
                                        animate={{ opacity: [0.5, 0.8, 0.5] }}
                                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
                                    />
                                    <motion.div
                                        className="h-4 bg-zinc-100 rounded-md w-1/3"
                                        animate={{ opacity: [0.4, 0.7, 0.4] }}
                                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    );
                }
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        {/* Teacher Card - Professional Minimalistic Design */}
                        <div className="p-5 rounded-2xl bg-white border border-zinc-100 shadow-sm">
                            <div className="flex items-start gap-4">
                                {/* Avatar - Circular */}
                                <div className="relative flex-shrink-0">
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-blue-500/20">
                                        {instructor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </div>
                                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <p className="text-sm font-semibold text-zinc-800">{instructor.name}</p>
                                        <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-blue-50 text-blue-600 rounded border border-blue-100">
                                            INSTRUCTOR
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-500">{instructor.title} · Computer Science Department</p>
                                    <a
                                        href={`mailto:${instructor.email}`}
                                        className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors mt-1"
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                            <rect x="2" y="4" width="20" height="16" rx="2" />
                                            <path d="M22 6l-10 7L2 6" />
                                        </svg>
                                        {instructor.email}
                                    </a>

                                    {/* Quick Info */}
                                    <div className="flex items-center gap-4 mt-2">
                                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                <circle cx="12" cy="12" r="10" />
                                                <polyline points="12 6 12 12 16 14" />
                                            </svg>
                                            Office: MWF 2-4PM
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                                <circle cx="12" cy="10" r="3" />
                                            </svg>
                                            Room 301
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons - Professional Style */}
                            <div className="mt-4 pt-4 border-t border-zinc-100 flex gap-2">
                                <TeacherActionButton
                                    variant="primary"
                                    icon={
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                        </svg>
                                    }
                                    label="Send Message"
                                />
                                <TeacherActionButton
                                    variant="secondary"
                                    icon={
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                        </svg>
                                    }
                                    label="Schedule Meeting"
                                />
                                <TeacherActionButton
                                    variant="icon"
                                    icon={
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                    }
                                />
                            </div>
                        </div>
                    </motion.div>
                );
        }
    };


    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col bg-zinc-50">
            {/* Header - Clean minimalistic design */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="px-6 py-4"
            >
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-zinc-100 shadow-sm">
                    {/* Back Button */}
                    <motion.button
                        whileHover={{ scale: 1.05, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onBack}
                        className="w-10 h-10 rounded-xl bg-zinc-50 hover:bg-blue-50 flex items-center justify-center transition-colors flex-shrink-0"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                    </motion.button>

                    {/* Course Icon */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                        whileHover={{ scale: 1.08, rotate: 5, transition: { duration: 0.2 } }}
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                        style={{
                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)',
                        }}
                    >
                        {course.image ? (
                            <img src={course.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                            </svg>
                        )}
                    </motion.div>

                    {/* Title & Description */}
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                        className="flex-1 min-w-0"
                    >
                        <div className="flex items-center gap-2.5 mb-1">
                            <h1 className="text-lg font-semibold text-zinc-800 truncate" style={{ letterSpacing: '-0.3px' }}>
                                {displayTitle}
                            </h1>
                            <motion.span
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.25, duration: 0.3 }}
                                className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-wide flex-shrink-0"
                            >
                                {courseCode}
                            </motion.span>
                        </div>
                        <p className="text-xs text-zinc-500 font-normal">
                            {course.instructor || 'Instructor'} · BSIT101-A
                        </p>
                    </motion.div>
                </div>
            </motion.div>

            {/* Quick Stats Bar with Progress - Only show in Student View */}
            {!isTeacherMode && <QuickStatsBar courseId={course.id} progress={course.progress} />}

            {/* Teacher Mode Indicator Bar */}
            <AnimatePresence>
                {isTeacherMode && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="teacher-mode-header bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-yellow-400 flex items-center justify-center">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round">
                                        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                                        <path d="M6 12v5c3 3 9 3 12 0v-5" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">Teacher Mode Active</p>
                                    <p className="text-[10px] text-blue-200">Manage tasks, grade students, and use AI tools</p>
                                </div>
                            </div>
                            <div className="teacher-filters flex items-center gap-2">
                                {/* Year Level Filter - Custom Dropdown */}
                                <div className="relative" onClick={(e) => e.stopPropagation()}>
                                    <motion.button
                                        onClick={() => { setShowYearDropdown(!showYearDropdown); setShowSectionDropdown(false); }}
                                        className="h-9 px-3 pr-8 text-[11px] font-medium bg-white/10 text-white border border-white/20 rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2"
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                        </svg>
                                        {yearLevelFilter === 'all' ? 'All Years' : `${yearLevelFilter} Year`}
                                        <motion.svg
                                            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                            className="absolute right-2.5"
                                            animate={{ rotate: showYearDropdown ? 180 : 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <polyline points="6 9 12 15 18 9" />
                                        </motion.svg>
                                    </motion.button>
                                    <AnimatePresence>
                                        {showYearDropdown && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                                transition={{ duration: 0.15 }}
                                                className="absolute top-full left-0 mt-1 w-40 bg-white rounded-xl shadow-xl border border-zinc-100 overflow-hidden z-50"
                                            >
                                                {[
                                                    {
                                                        value: 'all', label: 'All Years', icon: (
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                                                                <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                                                            </svg>
                                                        )
                                                    },
                                                    { value: '1st', label: '1st Year', icon: <span className="text-[11px] font-bold text-blue-600">1</span> },
                                                    { value: '2nd', label: '2nd Year', icon: <span className="text-[11px] font-bold text-blue-600">2</span> },
                                                    { value: '3rd', label: '3rd Year', icon: <span className="text-[11px] font-bold text-blue-600">3</span> },
                                                    { value: '4th', label: '4th Year', icon: <span className="text-[11px] font-bold text-blue-600">4</span> },
                                                ].map((option) => (
                                                    <motion.button
                                                        key={option.value}
                                                        onClick={() => { setYearLevelFilter(option.value as YearLevel); setShowYearDropdown(false); }}
                                                        className={`w-full px-3 py-2.5 text-[11px] font-medium flex items-center gap-2.5 transition-colors ${yearLevelFilter === option.value
                                                            ? 'bg-blue-50 text-blue-600'
                                                            : 'text-zinc-700 hover:bg-zinc-50'
                                                            }`}
                                                        whileHover={{ x: 2 }}
                                                        transition={{ duration: 0.1 }}
                                                    >
                                                        <span className={`w-5 h-5 rounded-md flex items-center justify-center ${yearLevelFilter === option.value ? 'bg-blue-100' : 'bg-zinc-100'
                                                            }`}>
                                                            {option.icon}
                                                        </span>
                                                        {option.label}
                                                        {yearLevelFilter === option.value && (
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="ml-auto text-blue-600">
                                                                <polyline points="20 6 9 17 4 12" />
                                                            </svg>
                                                        )}
                                                    </motion.button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Section Filter - Custom Dropdown */}
                                <div className="relative" onClick={(e) => e.stopPropagation()}>
                                    <motion.button
                                        onClick={() => { setShowSectionDropdown(!showSectionDropdown); setShowYearDropdown(false); }}
                                        className="h-9 px-3 pr-8 text-[11px] font-medium bg-white/10 text-white border border-white/20 rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2"
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                        </svg>
                                        {sectionFilter === 'all' ? 'All Sections' : `Section ${sectionFilter}`}
                                        <motion.svg
                                            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                            className="absolute right-2.5"
                                            animate={{ rotate: showSectionDropdown ? 180 : 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <polyline points="6 9 12 15 18 9" />
                                        </motion.svg>
                                    </motion.button>
                                    <AnimatePresence>
                                        {showSectionDropdown && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                                transition={{ duration: 0.15 }}
                                                className="absolute top-full left-0 mt-1 w-40 bg-white rounded-xl shadow-xl border border-zinc-100 overflow-hidden z-50"
                                            >
                                                {[
                                                    {
                                                        value: 'all', label: 'All Sections', icon: (
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                                                                <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                                                            </svg>
                                                        )
                                                    },
                                                    { value: 'A', label: 'Section A', icon: <span className="text-[11px] font-bold text-blue-600">A</span> },
                                                    { value: 'B', label: 'Section B', icon: <span className="text-[11px] font-bold text-blue-600">B</span> },
                                                    { value: 'C', label: 'Section C', icon: <span className="text-[11px] font-bold text-blue-600">C</span> },
                                                    { value: 'D', label: 'Section D', icon: <span className="text-[11px] font-bold text-blue-600">D</span> },
                                                ].map((option) => (
                                                    <motion.button
                                                        key={option.value}
                                                        onClick={() => { setSectionFilter(option.value as Section); setShowSectionDropdown(false); }}
                                                        className={`w-full px-3 py-2.5 text-[11px] font-medium flex items-center gap-2.5 transition-colors ${sectionFilter === option.value
                                                            ? 'bg-blue-50 text-blue-600'
                                                            : 'text-zinc-700 hover:bg-zinc-50'
                                                            }`}
                                                        whileHover={{ x: 2 }}
                                                        transition={{ duration: 0.1 }}
                                                    >
                                                        <span className={`w-5 h-5 rounded-md flex items-center justify-center ${sectionFilter === option.value ? 'bg-blue-100' : 'bg-zinc-100'
                                                            }`}>
                                                            {option.icon}
                                                        </span>
                                                        {option.label}
                                                        {sectionFilter === option.value && (
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="ml-auto text-blue-600">
                                                                <polyline points="20 6 9 17 4 12" />
                                                            </svg>
                                                        )}
                                                    </motion.button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tabs - Different for Teacher Mode */}
            <div className="px-6 pt-2 pb-4">
                <div className="p-4 rounded-2xl bg-white border border-zinc-100 shadow-sm">
                    <div className="flex items-center justify-center">
                        <div
                            ref={tabsContainerRef}
                            className="relative flex gap-1 p-1 rounded-xl bg-zinc-50"
                        >
                            {/* Sliding Indicator */}
                            <motion.div
                                className="absolute top-1 bottom-1 rounded-lg bg-white border border-blue-100 shadow-sm"
                                style={{ zIndex: 0 }}
                                initial={false}
                                animate={{
                                    left: tabIndicatorStyle.left,
                                    width: tabIndicatorStyle.width
                                }}
                                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                            />

                            {isTeacherMode ? (
                                // Teacher Mode Tabs
                                <>
                                    {[
                                        {
                                            id: 'manage-tasks' as TeacherTabType, label: 'Manage Tasks', icon: (
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                    <path d="M14 2v6h6" /><path d="M12 18v-6" /><path d="M9 15h6" />
                                                </svg>
                                            )
                                        },
                                        {
                                            id: 'grade-students' as TeacherTabType, label: 'Grade Students', icon: (
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                    <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                                </svg>
                                            )
                                        },
                                        {
                                            id: 'analytics' as TeacherTabType, label: 'Analytics', icon: (
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                    <path d="M3 3v18h18" /><path d="M7 16l4-4 4 4 5-6" />
                                                </svg>
                                            )
                                        },
                                    ].map((tab) => (
                                        <motion.button
                                            key={tab.id}
                                            data-tab-id={tab.id}
                                            onClick={() => setTeacherTab(tab.id)}
                                            className={`relative z-10 flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium transition-colors duration-100 whitespace-nowrap ${teacherTab === tab.id
                                                ? 'text-blue-600'
                                                : 'text-zinc-500 hover:text-zinc-700'
                                                }`}
                                        >
                                            {tab.icon}
                                            {tab.label}
                                        </motion.button>
                                    ))}
                                </>
                            ) : (
                                // Student Mode Tabs
                                TABS.map((tab) => (
                                    <motion.button
                                        key={tab.id}
                                        data-tab-id={tab.id}
                                        onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }}
                                        className={`relative z-10 flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium transition-colors duration-100 whitespace-nowrap ${activeTab === tab.id
                                            ? 'text-blue-600'
                                            : 'text-zinc-500 hover:text-zinc-700'
                                            }`}
                                    >
                                        {tab.icon}
                                        {tab.label}
                                    </motion.button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <AnimatePresence mode="wait">
                    {isTeacherMode ? (
                        // Teacher Mode Content
                        <motion.div
                            key="teacher-content"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {teacherTab === 'manage-tasks' && (
                                isTeacherLoading ? (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                        {/* Header Skeleton */}
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-2">
                                                <motion.div className="h-4 w-32 bg-zinc-200 rounded-lg" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
                                                <motion.div className="h-3 w-48 bg-zinc-100 rounded-lg" animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }} />
                                            </div>
                                            <motion.div className="h-10 w-24 bg-zinc-200 rounded-xl" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
                                        </div>
                                        {/* Filter Pills Skeleton */}
                                        <div className="flex gap-2 overflow-x-auto pb-1">
                                            {[0, 1, 2, 3, 4, 5].map((i) => (
                                                <motion.div key={i} className="h-8 w-24 bg-zinc-100 rounded-lg flex-shrink-0" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }} />
                                            ))}
                                        </div>
                                        {/* Cards Skeleton */}
                                        <div className="flex gap-4 overflow-x-auto pt-2 pb-4 -mx-1 px-1">
                                            {[0, 1, 2, 3].map((i) => (
                                                <motion.div key={i} className="flex-shrink-0 w-64 h-48 bg-zinc-100 rounded-2xl" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }} />
                                            ))}
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Header with Add Button */}
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h2 className="text-sm font-semibold text-zinc-800">Course Tasks</h2>
                                                <p className="text-[11px] text-zinc-500 mt-0.5">Manage assignments, quizzes, and activities</p>
                                            </div>
                                            <motion.button
                                                onClick={() => setShowAddTaskModal(true)}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                transition={{ duration: 0.1 }}
                                                className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                    <path d="M12 5v14M5 12h14" />
                                                </svg>
                                                Add Task
                                            </motion.button>
                                        </div>

                                        {/* Task Type Filters - Horizontal Pills */}
                                        <div className="flex gap-2 overflow-x-auto pb-1">
                                            {TASK_CATEGORIES.map((cat) => (
                                                <motion.button
                                                    key={cat.id}
                                                    onClick={() => setSelectedTaskType(cat.id)}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    transition={{ duration: 0.1 }}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-lg whitespace-nowrap ${selectedTaskType === cat.id
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                                                        }`}
                                                >
                                                    {cat.icon}
                                                    {cat.label}
                                                </motion.button>
                                            ))}
                                        </div>

                                        {/* Tasks Cards - Horizontal Scroll */}
                                        {courseTasks.filter((t: { category: TaskCategory }) => selectedTaskType === 'all' || t.category === selectedTaskType).length === 0 ? (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="flex flex-col items-center justify-center py-16 px-6 text-center"
                                            >
                                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-50 to-zinc-50 flex items-center justify-center mb-5 border border-blue-100">
                                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round">
                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                        <polyline points="14 2 14 8 20 8" />
                                                        <line x1="12" y1="18" x2="12" y2="12" />
                                                        <line x1="9" y1="15" x2="15" y2="15" />
                                                    </svg>
                                                </div>
                                                <p className="text-base font-semibold text-zinc-800 mb-2">No tasks yet</p>
                                                <p className="text-sm text-zinc-500 max-w-sm mb-6">Create your first task to get started. Add assignments, quizzes, performance tasks, and more for your students.</p>
                                                <motion.button
                                                    onClick={() => setShowAddTaskModal(true)}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/25"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                        <path d="M12 5v14M5 12h14" />
                                                    </svg>
                                                    Create First Task
                                                </motion.button>
                                            </motion.div>
                                        ) : (
                                            <div
                                                ref={tasksScrollRef}
                                                className="flex gap-4 overflow-x-auto pt-2 pb-4 -mx-1 px-1 snap-x snap-mandatory scroll-smooth"
                                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                            >
                                                {courseTasks.filter((t: { category: TaskCategory }) => selectedTaskType === 'all' || t.category === selectedTaskType).map((task: typeof courseTasks[0], index: number) => (
                                                    <motion.div
                                                        key={task.id}
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        whileHover={{
                                                            y: -6,
                                                            scale: 1.02,
                                                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)'
                                                        }}
                                                        transition={{
                                                            type: 'spring',
                                                            stiffness: 400,
                                                            damping: 25,
                                                            delay: index * 0.03
                                                        }}
                                                        className="flex-shrink-0 w-64 bg-white rounded-2xl border border-blue-100 hover:border-blue-300 snap-start overflow-hidden cursor-pointer"
                                                    >
                                                        {/* Card Header with Category Color */}
                                                        <div className={`h-1.5 ${task.category === 'assignment' ? 'bg-blue-500' :
                                                            task.category === 'quiz' ? 'bg-yellow-500' :
                                                                task.category === 'performance' ? 'bg-blue-600' :
                                                                    task.category === 'practical' ? 'bg-blue-700' :
                                                                        'bg-blue-400'
                                                            }`} />

                                                        <div className="p-4">
                                                            {/* Category Badge */}
                                                            <div className="flex items-center justify-between mb-3">
                                                                <span className={`px-2 py-0.5 text-[9px] font-semibold rounded-full uppercase tracking-wide ${task.category === 'assignment' ? 'bg-blue-50 text-blue-600' :
                                                                    task.category === 'quiz' ? 'bg-yellow-50 text-yellow-600' :
                                                                        task.category === 'performance' ? 'bg-blue-50 text-blue-700' :
                                                                            task.category === 'practical' ? 'bg-blue-50 text-blue-700' :
                                                                                'bg-blue-50 text-blue-600'
                                                                    }`}>
                                                                    {task.category}
                                                                </span>
                                                                <span className={`text-[10px] font-medium ${task.status === 'submitted' ? 'text-blue-600' :
                                                                    task.status === 'pending' ? 'text-yellow-600' :
                                                                        'text-zinc-400'
                                                                    }`}>
                                                                    {task.status === 'submitted' ? 'Active' : task.status === 'pending' ? 'Due Soon' : 'Upcoming'}
                                                                </span>
                                                            </div>

                                                            {/* Task Title */}
                                                            <h3 className="text-sm font-semibold text-zinc-800 line-clamp-2 mb-2">{task.title}</h3>

                                                            {/* Due Date */}
                                                            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mb-4">
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                                    <line x1="16" y1="2" x2="16" y2="6" />
                                                                    <line x1="8" y1="2" x2="8" y2="6" />
                                                                    <line x1="3" y1="10" x2="21" y2="10" />
                                                                </svg>
                                                                Due: {task.due}
                                                            </div>

                                                            {/* Action Buttons */}
                                                            <div className="flex items-center gap-2">
                                                                <motion.button
                                                                    whileHover={{ scale: 1.02 }}
                                                                    whileTap={{ scale: 0.98 }}
                                                                    transition={{ duration: 0.1 }}
                                                                    className="flex-1 py-2 text-[10px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center justify-center gap-1.5"
                                                                >
                                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                                        <path d="M12 20h9" />
                                                                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                                                    </svg>
                                                                    Edit
                                                                </motion.button>
                                                                <motion.button
                                                                    whileHover={{ scale: 1.02 }}
                                                                    whileTap={{ scale: 0.98 }}
                                                                    transition={{ duration: 0.1 }}
                                                                    className="flex-1 py-2 text-[10px] font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-lg flex items-center justify-center gap-1.5"
                                                                >
                                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                                        <circle cx="12" cy="12" r="3" />
                                                                    </svg>
                                                                    View
                                                                </motion.button>
                                                                <motion.button
                                                                    whileHover={{ scale: 1.05 }}
                                                                    whileTap={{ scale: 0.95 }}
                                                                    transition={{ duration: 0.1 }}
                                                                    className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                                                >
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                                    </svg>
                                                                </motion.button>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            )}

                            {teacherTab === 'grade-students' && (
                                isTeacherLoading ? (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                        {/* Header Skeleton */}
                                        <div className="flex items-center justify-between">
                                            <motion.div className="h-4 w-40 bg-zinc-200 rounded-lg" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
                                            <motion.div className="h-9 w-28 bg-zinc-200 rounded-lg" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
                                        </div>
                                        {/* Submission Cards Skeleton */}
                                        <div className="flex gap-4 overflow-x-auto pt-2 pb-4 px-1 -mx-1">
                                            {[0, 1, 2, 3].map((i) => (
                                                <motion.div key={i} className="flex-shrink-0 w-72 bg-zinc-100 rounded-2xl overflow-hidden" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}>
                                                    <div className="p-4 pb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-11 h-11 rounded-full bg-zinc-200" />
                                                            <div className="flex-1 space-y-2">
                                                                <div className="h-3 w-24 bg-zinc-200 rounded" />
                                                                <div className="h-2 w-16 bg-zinc-200 rounded" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="px-4 pb-3 space-y-2">
                                                        <div className="h-3 w-32 bg-zinc-200 rounded" />
                                                        <div className="h-2 w-24 bg-zinc-200 rounded" />
                                                    </div>
                                                    <div className="px-4 pb-4 flex gap-2">
                                                        <div className="flex-1 h-8 bg-zinc-200 rounded-lg" />
                                                        <div className="flex-1 h-8 bg-zinc-200 rounded-lg" />
                                                        <div className="w-9 h-8 bg-zinc-200 rounded-lg" />
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-sm font-semibold text-zinc-800">Student Submissions</h2>
                                            <div className="flex items-center gap-2">
                                                <motion.button
                                                    whileHover={!isAiGrading ? { scale: 1.02 } : {}}
                                                    whileTap={!isAiGrading ? { scale: 0.98 } : {}}
                                                    disabled={isAiGrading}
                                                    onClick={() => {
                                                        // AI Grade All - grade all pending submissions
                                                        const pendingSubmissions = submissions.filter(
                                                            (s: Submission) => s.status === 'pending' &&
                                                                (yearLevelFilter === 'all' || s.yearLevel === yearLevelFilter) &&
                                                                (sectionFilter === 'all' || s.section === sectionFilter)
                                                        );

                                                        if (pendingSubmissions.length === 0) return;

                                                        setIsAiGrading(true);
                                                        setAiGradingProgress(0);
                                                        setShowAiWarning(true);

                                                        // Auto-hide warning after 10 seconds
                                                        setTimeout(() => setShowAiWarning(false), 10000);

                                                        // Simulate AI grading with staggered updates
                                                        pendingSubmissions.forEach((sub: Submission, index: number) => {
                                                            setTimeout(() => {
                                                                setSubmissions((prev: Submission[]) => prev.map((s: Submission) =>
                                                                    s.id === sub.id
                                                                        ? { ...s, status: 'ai-checked', aiScore: Math.floor(Math.random() * 25) + 75 }
                                                                        : s
                                                                ));
                                                                setAiGradingProgress(Math.round(((index + 1) / pendingSubmissions.length) * 100));

                                                                // End grading when all done
                                                                if (index === pendingSubmissions.length - 1) {
                                                                    setTimeout(() => {
                                                                        setIsAiGrading(false);
                                                                        setAiGradingProgress(0);
                                                                    }, 500);
                                                                }
                                                            }, (index + 1) * 500); // Stagger by 500ms
                                                        });
                                                    }}
                                                    className={`flex items-center gap-2 px-3 py-2 text-[11px] font-medium rounded-lg transition-colors ${isAiGrading
                                                        ? 'text-blue-400 bg-blue-100 cursor-not-allowed'
                                                        : 'text-white bg-blue-600 hover:bg-blue-700'
                                                        }`}
                                                >
                                                    {isAiGrading ? (
                                                        <motion.svg
                                                            width="12"
                                                            height="12"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            animate={{ rotate: 360 }}
                                                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                        >
                                                            <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                                                        </motion.svg>
                                                    ) : (
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                            <path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
                                                            <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
                                                        </svg>
                                                    )}
                                                    {isAiGrading ? `Grading... ${aiGradingProgress}%` : 'AI Grade All'}
                                                </motion.button>
                                            </div>
                                        </div>

                                        {/* AI Grading Loading Overlay - Minimalistic */}
                                        <AnimatePresence>
                                            {isAiGrading && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10, scale: 0.98 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                                                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                                    className="p-4 bg-white rounded-xl border border-blue-100 shadow-sm"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        {/* Circular Progress */}
                                                        <div className="relative w-11 h-11 flex-shrink-0">
                                                            <svg className="w-11 h-11 -rotate-90" viewBox="0 0 44 44">
                                                                <circle
                                                                    cx="22"
                                                                    cy="22"
                                                                    r="18"
                                                                    fill="none"
                                                                    stroke="#e5e7eb"
                                                                    strokeWidth="4"
                                                                />
                                                                <motion.circle
                                                                    cx="22"
                                                                    cy="22"
                                                                    r="18"
                                                                    fill="none"
                                                                    stroke="#2563eb"
                                                                    strokeWidth="4"
                                                                    strokeLinecap="round"
                                                                    initial={{ pathLength: 0 }}
                                                                    animate={{ pathLength: aiGradingProgress / 100 }}
                                                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                                                    style={{ strokeDasharray: '113.1', strokeDashoffset: '0' }}
                                                                />
                                                            </svg>
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <span className="text-[10px] font-bold text-blue-600">{aiGradingProgress}%</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            {/* Animated Status Text */}
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <AnimatePresence mode="wait">
                                                                    <motion.div
                                                                        key={aiGradingProgress < 50 ? 'analyzing' : aiGradingProgress < 80 ? 'grading' : 'finishing'}
                                                                        initial={{ opacity: 0, y: 8 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        exit={{ opacity: 0, y: -8 }}
                                                                        transition={{ duration: 0.2 }}
                                                                        className="flex items-center gap-2"
                                                                    >
                                                                        {/* SVG Icons based on progress */}
                                                                        {aiGradingProgress < 50 ? (
                                                                            <motion.svg
                                                                                width="14"
                                                                                height="14"
                                                                                viewBox="0 0 24 24"
                                                                                fill="none"
                                                                                stroke="#2563eb"
                                                                                strokeWidth="2"
                                                                                strokeLinecap="round"
                                                                                animate={{ scale: [1, 1.1, 1] }}
                                                                                transition={{ duration: 1.5, repeat: Infinity }}
                                                                            >
                                                                                <circle cx="11" cy="11" r="8" />
                                                                                <path d="m21 21-4.35-4.35" />
                                                                            </motion.svg>
                                                                        ) : aiGradingProgress < 80 ? (
                                                                            <motion.svg
                                                                                width="14"
                                                                                height="14"
                                                                                viewBox="0 0 24 24"
                                                                                fill="none"
                                                                                stroke="#2563eb"
                                                                                strokeWidth="2"
                                                                                strokeLinecap="round"
                                                                                animate={{ y: [0, -2, 0] }}
                                                                                transition={{ duration: 0.8, repeat: Infinity }}
                                                                            >
                                                                                <path d="M12 20h9" />
                                                                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                                                            </motion.svg>
                                                                        ) : (
                                                                            <motion.svg
                                                                                width="14"
                                                                                height="14"
                                                                                viewBox="0 0 24 24"
                                                                                fill="none"
                                                                                stroke="#2563eb"
                                                                                strokeWidth="2"
                                                                                strokeLinecap="round"
                                                                                initial={{ scale: 0 }}
                                                                                animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                                                                                transition={{ duration: 0.5 }}
                                                                            >
                                                                                <polyline points="20 6 9 17 4 12" />
                                                                            </motion.svg>
                                                                        )}
                                                                        <span className="text-sm font-medium text-zinc-800">
                                                                            {aiGradingProgress < 50 ? 'Analyzing submissions...' : aiGradingProgress < 80 ? 'Grading in progress...' : 'Almost done...'}
                                                                        </span>
                                                                    </motion.div>
                                                                </AnimatePresence>
                                                            </div>
                                                            <p className="text-[11px] text-zinc-500">Please wait a moment</p>

                                                            {/* Progress Bar - Solid Blue */}
                                                            <div className="mt-2 h-1 bg-zinc-100 rounded-full overflow-hidden">
                                                                <motion.div
                                                                    className="h-full bg-blue-600 rounded-full"
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${aiGradingProgress}%` }}
                                                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* AI Warning Tooltip */}
                                        <AnimatePresence>
                                            {showAiWarning && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                                    className="relative flex items-start gap-3 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200 shadow-sm"
                                                >
                                                    {/* Warning Icon */}
                                                    <motion.div
                                                        className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"
                                                        animate={{ scale: [1, 1.05, 1] }}
                                                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                                    >
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                                            <line x1="12" y1="9" x2="12" y2="13" />
                                                            <line x1="12" y1="17" x2="12.01" y2="17" />
                                                        </svg>
                                                    </motion.div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-amber-800">AI Grading Notice</p>
                                                        <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                                                            Please double-check the graded submissions. AI can sometimes make mistakes in evaluating answers.
                                                        </p>
                                                    </div>

                                                    {/* Close Button */}
                                                    <motion.button
                                                        onClick={() => setShowAiWarning(false)}
                                                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(217, 119, 6, 0.1)' }}
                                                        whileTap={{ scale: 0.95 }}
                                                        className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-amber-500 hover:text-amber-700 transition-colors"
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                            <path d="M18 6L6 18M6 6l12 12" />
                                                        </svg>
                                                    </motion.button>

                                                    {/* Progress bar for auto-dismiss */}
                                                    <motion.div
                                                        className="absolute bottom-0 left-0 h-1 bg-amber-400 rounded-b-xl"
                                                        initial={{ width: '100%' }}
                                                        animate={{ width: '0%' }}
                                                        transition={{ duration: 10, ease: 'linear' }}
                                                    />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Submissions List - Horizontal Scrolling Cards */}
                                        {submissions.length === 0 ? (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="flex flex-col items-center justify-center py-12 px-6 text-center"
                                            >
                                                <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
                                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round">
                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                        <polyline points="14 2 14 8 20 8" />
                                                        <line x1="16" y1="13" x2="8" y2="13" />
                                                        <line x1="16" y1="17" x2="8" y2="17" />
                                                    </svg>
                                                </div>
                                                <p className="text-sm font-semibold text-zinc-700 mb-1">No submissions yet</p>
                                                <p className="text-xs text-zinc-500 max-w-xs">Student submissions will appear here once they submit their assignments.</p>
                                            </motion.div>
                                        ) : (
                                            /* Cards Container */
                                            <div
                                                ref={submissionsScrollRef}
                                                className="flex gap-4 overflow-x-auto pt-2 pb-4 px-1 -mx-1 snap-x snap-mandatory scroll-smooth"
                                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                            >
                                                {submissions
                                                    .filter((s: Submission) => (yearLevelFilter === 'all' || s.yearLevel === yearLevelFilter) && (sectionFilter === 'all' || s.section === sectionFilter))
                                                    .map((submission: Submission, index: number) => (
                                                        <motion.div
                                                            key={submission.id}
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            whileHover={{
                                                                y: -6,
                                                                scale: 1.02,
                                                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)'
                                                            }}
                                                            transition={{
                                                                type: 'spring',
                                                                stiffness: 400,
                                                                damping: 25,
                                                                delay: index * 0.05
                                                            }}
                                                            className="flex-shrink-0 w-72 bg-white rounded-2xl border border-blue-100 hover:border-blue-300 snap-start overflow-hidden cursor-pointer"
                                                        >
                                                            {/* Card Header */}
                                                            <div className="p-4 pb-3">
                                                                <div className="flex items-center gap-3">
                                                                    <motion.div
                                                                        className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                                                                        whileHover={{ scale: 1.05 }}
                                                                        transition={{ type: 'spring', stiffness: 400 }}
                                                                    >
                                                                        {submission.studentName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                                                    </motion.div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm font-semibold text-zinc-800 truncate">{submission.studentName}</p>
                                                                        <p className="text-[10px] text-zinc-400">{submission.yearLevel} Year · Section {submission.section}</p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Task Info */}
                                                            <div className="px-4 pb-3">
                                                                <p className="text-[11px] text-zinc-600 truncate">{submission.task}</p>
                                                                <p className="text-[10px] text-zinc-400 mt-0.5">Submitted: {submission.submitted}</p>
                                                            </div>

                                                            {/* Score & Status Section */}
                                                            <div className="px-4 pb-3 flex items-center justify-between">
                                                                {/* Status Badge */}
                                                                <motion.span
                                                                    layout
                                                                    className={`px-2.5 py-1 text-[10px] font-semibold rounded-full ${submission.status === 'pending' ? 'bg-yellow-50 text-yellow-600' :
                                                                        submission.status === 'ai-checked' ? 'bg-blue-50 text-blue-600' :
                                                                            'bg-blue-600 text-white'
                                                                        }`}
                                                                >
                                                                    {submission.status === 'pending' ? 'Pending' : submission.status === 'ai-checked' ? 'AI Checked' : 'Graded'}
                                                                </motion.span>

                                                                {/* AI Score */}
                                                                <AnimatePresence>
                                                                    {submission.aiScore && (
                                                                        <motion.div
                                                                            initial={{ opacity: 0, scale: 0.8 }}
                                                                            animate={{ opacity: 1, scale: 1 }}
                                                                            className="text-right"
                                                                        >
                                                                            <p className="text-xl font-bold text-blue-600">{submission.aiScore}</p>
                                                                            <p className="text-[9px] text-zinc-400 -mt-0.5">AI Score</p>
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>

                                                            {/* Action Buttons */}
                                                            <div className="px-4 pb-4 flex items-center gap-2">
                                                                <motion.button
                                                                    whileHover={{ scale: 1.02 }}
                                                                    whileTap={{ scale: 0.98 }}
                                                                    onClick={() => {
                                                                        setSubmissions((prev: Submission[]) => prev.map((s: Submission) =>
                                                                            s.id === submission.id ? { ...s, status: 'ai-checked', aiScore: Math.floor(Math.random() * 25) + 75 } : s
                                                                        ));
                                                                    }}
                                                                    className="flex-1 py-2 text-[10px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                                                                >
                                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                                        <path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
                                                                        <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
                                                                    </svg>
                                                                    AI Check
                                                                </motion.button>
                                                                <motion.button
                                                                    whileHover={{ scale: 1.02 }}
                                                                    whileTap={{ scale: 0.98 }}
                                                                    className="flex-1 py-2 text-[10px] font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                                                                >
                                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                                        <path d="M12 20h9" />
                                                                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                                                    </svg>
                                                                    Grade
                                                                </motion.button>
                                                                <motion.button
                                                                    whileHover={{ scale: 1.05 }}
                                                                    whileTap={{ scale: 0.95 }}
                                                                    onClick={() => {
                                                                        setSubmissions((prev: Submission[]) => prev.map((s: Submission) =>
                                                                            s.id === submission.id ? { ...s, status: 'graded' } : s
                                                                        ));
                                                                    }}
                                                                    className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                >
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                                        <polyline points="20 6 9 17 4 12" />
                                                                    </svg>
                                                                </motion.button>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            )}

                            {teacherTab === 'analytics' && (() => {
                                // Calculate real statistics from submissions
                                const totalStudents = studentsData.length;
                                const totalSubmissions = submissions.length;
                                const pendingCount = submissions.filter((s: Submission) => s.status === 'pending').length;
                                const gradedSubmissions = submissions.filter((s: Submission) => s.aiScore !== null);
                                const averageGrade = gradedSubmissions.length > 0
                                    ? Math.round(gradedSubmissions.reduce((sum: number, s: Submission) => sum + (s.aiScore || 0), 0) / gradedSubmissions.length)
                                    : 0;
                                const completionRate = totalSubmissions > 0
                                    ? Math.round(((totalSubmissions - pendingCount) / totalSubmissions) * 100)
                                    : 0;
                                const onlineStudents = studentsData.filter((s: { status: string }) => s.status === 'online').length;

                                if (isTeacherLoading) {
                                    return (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                            {/* Header Skeleton */}
                                            <div className="flex items-center gap-3">
                                                <motion.div className="w-10 h-10 rounded-xl bg-zinc-200" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
                                                <div className="space-y-2">
                                                    <motion.div className="h-4 w-32 bg-zinc-200 rounded-lg" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
                                                    <motion.div className="h-3 w-48 bg-zinc-100 rounded-lg" animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }} />
                                                </div>
                                            </div>
                                            {/* Stats Grid Skeleton */}
                                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                                                {[0, 1, 2, 3, 4, 5].map((i) => (
                                                    <motion.div key={i} className="bg-zinc-100 rounded-2xl p-5 space-y-3" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.08 }}>
                                                        <div className="w-12 h-12 rounded-xl bg-zinc-200" />
                                                        <div className="h-2 w-16 bg-zinc-200 rounded" />
                                                        <div className="h-6 w-12 bg-zinc-200 rounded" />
                                                        <div className="h-2 w-10 bg-zinc-200 rounded" />
                                                    </motion.div>
                                                ))}
                                            </div>
                                            {/* Grade Distribution Skeleton */}
                                            <motion.div className="bg-zinc-100 rounded-2xl p-6 space-y-4" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-zinc-200" />
                                                    <div className="space-y-2">
                                                        <div className="h-4 w-32 bg-zinc-200 rounded" />
                                                        <div className="h-3 w-40 bg-zinc-200 rounded" />
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    {[0, 1, 2, 3, 4].map((i) => (
                                                        <div key={i} className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-zinc-200" />
                                                            <div className="flex-1 space-y-2">
                                                                <div className="h-2 w-full bg-zinc-200 rounded" />
                                                                <div className="h-2.5 w-full bg-zinc-200 rounded-full" />
                                                            </div>
                                                            <div className="w-10 h-4 bg-zinc-200 rounded" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                            {/* Quick Stats Skeleton */}
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                                {[0, 1, 2, 3].map((i) => (
                                                    <motion.div key={i} className="bg-zinc-100 rounded-2xl p-5 space-y-4" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.08 }}>
                                                        <div className="flex items-start justify-between">
                                                            <div className="w-11 h-11 rounded-xl bg-zinc-200" />
                                                            <div className="w-14 h-5 rounded-full bg-zinc-200" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <div className="h-2 w-20 bg-zinc-200 rounded" />
                                                            <div className="h-5 w-24 bg-zinc-200 rounded" />
                                                            <div className="h-3 w-16 bg-zinc-200 rounded" />
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    );
                                }

                                return (
                                    <div className="space-y-6">
                                        {/* Header */}
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex items-center gap-3"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                                                    <path d="M3 3v18h18" /><path d="M7 16l4-4 4 4 5-6" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h2 className="text-base font-semibold text-zinc-800">Class Analytics</h2>
                                                <p className="text-[11px] text-zinc-500">Overview of class performance</p>
                                            </div>
                                        </motion.div>

                                        {/* Stats Cards - Grid Layout */}
                                        <div className="analytics-stats-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                                            {[
                                                {
                                                    label: 'TOTAL STUDENTS',
                                                    value: String(totalStudents),
                                                    subtext: 'enrolled',
                                                    lordIcon: 'https://cdn.lordicon.com/atzcyedn.json',
                                                    trigger: 'hover',
                                                    color: 'blue'
                                                },
                                                {
                                                    label: 'AVERAGE GRADE',
                                                    value: `${averageGrade}%`,
                                                    subtext: 'class avg',
                                                    trend: averageGrade >= 80 ? '+3%' : '-2%',
                                                    lordIcon: 'https://cdn.lordicon.com/excswhey.json',
                                                    lordIconDown: 'https://cdn.lordicon.com/zwtssiaj.json',
                                                    trigger: 'hover',
                                                    color: 'blue'
                                                },
                                                {
                                                    label: 'SUBMISSIONS',
                                                    value: String(totalSubmissions),
                                                    subtext: 'total',
                                                    lordIcon: 'https://cdn.lordicon.com/mubdgyyw.json',
                                                    trigger: 'hover',
                                                    color: 'yellow'
                                                },
                                                {
                                                    label: 'PENDING',
                                                    value: String(pendingCount),
                                                    subtext: 'to review',
                                                    lordIcon: 'https://cdn.lordicon.com/okqjaags.json',
                                                    trigger: 'hover',
                                                    color: 'yellow'
                                                },
                                                {
                                                    label: 'COMPLETION',
                                                    value: `${completionRate}%`,
                                                    subtext: 'graded',
                                                    lordIcon: 'https://cdn.lordicon.com/uvofdfal.json',
                                                    trigger: 'hover',
                                                    color: 'blue'
                                                },
                                                {
                                                    label: 'ACTIVE NOW',
                                                    value: String(onlineStudents),
                                                    subtext: 'online',
                                                    lordIcon: 'https://cdn.lordicon.com/kthkkwpi.json',
                                                    trigger: 'hover',
                                                    color: 'green'
                                                },
                                            ].map((stat, index) => {
                                                // Determine icon colors based on stat color
                                                const primaryColor = stat.color === 'blue' ? '#3b82f6' :
                                                    stat.color === 'yellow' ? '#eab308' : '#22c55e';
                                                const secondaryColor = stat.color === 'blue' ? '#93c5fd' :
                                                    stat.color === 'yellow' ? '#fde047' : '#86efac';

                                                // For average grade, check if trend is negative
                                                const isNegativeTrend = stat.trend && stat.trend.startsWith('-');
                                                const iconSrc = isNegativeTrend && stat.lordIconDown ? stat.lordIconDown : stat.lordIcon;
                                                const iconPrimary = isNegativeTrend ? '#ef4444' : primaryColor;
                                                const iconSecondary = isNegativeTrend ? '#fca5a5' : secondaryColor;

                                                return (
                                                    <motion.div
                                                        key={stat.label}
                                                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        transition={{ delay: index * 0.08, type: 'spring', stiffness: 300, damping: 25 }}
                                                        whileHover={{ y: -4, scale: 1.02 }}
                                                        className="relative bg-white rounded-2xl border border-zinc-100 p-5 cursor-pointer group overflow-hidden"
                                                    >
                                                        {/* Lord Icon */}
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110 ${stat.color === 'blue' ? 'bg-blue-50' :
                                                            stat.color === 'yellow' ? 'bg-yellow-50' : 'bg-green-50'
                                                            }`}>
                                                            <lord-icon
                                                                src={iconSrc}
                                                                trigger={stat.trigger}
                                                                colors={`primary:${iconPrimary},secondary:${iconSecondary}`}
                                                                style={{ width: '32px', height: '32px' }}
                                                            />
                                                        </div>

                                                        {/* Label */}
                                                        <p className="text-[10px] font-semibold text-zinc-400 tracking-wider mb-1">{stat.label}</p>

                                                        {/* Value */}
                                                        <div className="flex items-baseline gap-2">
                                                            <p className={`text-2xl font-bold ${isNegativeTrend ? 'text-red-600' :
                                                                stat.color === 'blue' ? 'text-blue-600' :
                                                                    stat.color === 'yellow' ? 'text-yellow-600' : 'text-green-600'
                                                                }`}>
                                                                {stat.value}
                                                            </p>
                                                            {stat.trend && (
                                                                <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${isNegativeTrend ? 'text-red-500' : 'text-green-500'
                                                                    }`}>
                                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                                                                        <path d={isNegativeTrend ? "M6 9l6 6 6-6" : "M18 15l-6-6-6 6"} />
                                                                    </svg>
                                                                    {stat.trend}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Subtext */}
                                                        <p className="text-[11px] text-zinc-500 mt-0.5">{stat.subtext}</p>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>

                                        {/* Grade Distribution Card */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="bg-white rounded-2xl border border-zinc-100 p-6 overflow-hidden relative"
                                        >
                                            {/* Decorative Background */}
                                            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-blue-50 opacity-50" />
                                            <div className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-yellow-50 opacity-50" />

                                            <div className="relative">
                                                {/* Header */}
                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                                                            <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-zinc-800">Grade Distribution</p>
                                                        <p className="text-[10px] text-zinc-500">Performance breakdown by grade</p>
                                                    </div>
                                                </div>

                                                {/* Grade Bars */}
                                                <div className="space-y-4">
                                                    {[
                                                        { grade: 'A', range: '90-100', percent: 25, count: 11, color: 'from-blue-500 to-blue-600' },
                                                        { grade: 'B', range: '80-89', percent: 35, count: 16, color: 'from-blue-400 to-blue-500' },
                                                        { grade: 'C', range: '70-79', percent: 25, count: 11, color: 'from-yellow-400 to-yellow-500' },
                                                        { grade: 'D', range: '60-69', percent: 10, count: 5, color: 'from-orange-400 to-orange-500' },
                                                        { grade: 'F', range: 'Below 60', percent: 5, count: 2, color: 'from-red-400 to-red-500' },
                                                    ].map((item, index) => (
                                                        <motion.div
                                                            key={item.grade}
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: 0.4 + index * 0.08 }}
                                                            className="flex items-center gap-4"
                                                        >
                                                            {/* Grade Badge */}
                                                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-sm`}>
                                                                <span className="text-sm font-bold text-white">{item.grade}</span>
                                                            </div>

                                                            {/* Progress Section */}
                                                            <div className="flex-1">
                                                                <div className="flex items-center justify-between mb-1.5">
                                                                    <span className="text-[11px] text-zinc-600 font-medium">{item.range}</span>
                                                                    <span className="text-[11px] text-zinc-500">{item.count} students</span>
                                                                </div>
                                                                <div className="h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                                                                    <motion.div
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${item.percent}%` }}
                                                                        transition={{ duration: 0.6, delay: 0.5 + index * 0.1, ease: 'easeOut' }}
                                                                        className={`h-full bg-gradient-to-r ${item.color} rounded-full`}
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Percentage */}
                                                            <div className="w-12 text-right">
                                                                <span className="text-sm font-bold text-zinc-700">{item.percent}%</span>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>

                                        {/* Quick Stats Row - Minimalistic White Cards */}
                                        <div className="analytics-quick-stats grid grid-cols-2 lg:grid-cols-4 gap-4">
                                            {[
                                                {
                                                    label: 'TOP PERFORMER',
                                                    value: 'Maria Santos',
                                                    subtext: '98% Average',
                                                    badge: { text: '#1', color: 'blue' },
                                                    lordIcon: 'https://cdn.lordicon.com/namwvlmv.json',
                                                    iconBg: 'bg-blue-50',
                                                    primaryColor: '#3b82f6',
                                                    secondaryColor: '#93c5fd'
                                                },
                                                {
                                                    label: 'NEEDS ATTENTION',
                                                    value: '3 Students',
                                                    subtext: 'Below passing grade',
                                                    badge: { text: 'Alert', color: 'yellow' },
                                                    lordIcon: 'https://cdn.lordicon.com/jzwvffwx.json',
                                                    iconBg: 'bg-yellow-50',
                                                    primaryColor: '#eab308',
                                                    secondaryColor: '#fde047'
                                                },
                                                {
                                                    label: 'MOST IMPROVED',
                                                    value: 'Juan Dela Cruz',
                                                    subtext: '+15% this month',
                                                    badge: { text: '↑ Rising', color: 'green' },
                                                    lordIcon: 'https://cdn.lordicon.com/excswhey.json',
                                                    iconBg: 'bg-green-50',
                                                    primaryColor: '#22c55e',
                                                    secondaryColor: '#86efac'
                                                },
                                                {
                                                    label: 'CLASS ENGAGEMENT',
                                                    value: '87%',
                                                    subtext: 'Active participation',
                                                    badge: { text: 'High', color: 'blue' },
                                                    lordIcon: 'https://cdn.lordicon.com/dutqakce.json',
                                                    iconBg: 'bg-blue-50',
                                                    primaryColor: '#3b82f6',
                                                    secondaryColor: '#93c5fd'
                                                },
                                            ].map((card, index) => (
                                                <motion.div
                                                    key={card.label}
                                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: 0.5 + index * 0.08, type: 'spring', stiffness: 300, damping: 25 } }}
                                                    whileHover={{ y: -6, scale: 1.02, boxShadow: '0 12px 24px -8px rgba(0,0,0,0.1)' }}
                                                    transition={{ duration: 0.1 }}
                                                    className="bg-white rounded-2xl border border-zinc-100 p-5 cursor-pointer group"
                                                >
                                                    <div>
                                                        {/* Header with Icon and Badge */}
                                                        <div className="flex items-start justify-between mb-4">
                                                            {/* Lord Icon */}
                                                            <motion.div
                                                                className={`w-11 h-11 rounded-xl ${card.iconBg} flex items-center justify-center`}
                                                                whileHover={{ scale: 1.1, rotate: 5 }}
                                                                transition={{ duration: 0.1 }}
                                                            >
                                                                <lord-icon
                                                                    src={card.lordIcon}
                                                                    trigger="hover"
                                                                    colors={`primary:${card.primaryColor},secondary:${card.secondaryColor}`}
                                                                    style={{ width: '28px', height: '28px' }}
                                                                />
                                                            </motion.div>

                                                            {/* Badge */}
                                                            <motion.span
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                transition={{ delay: 0.7 + index * 0.08, type: 'spring', stiffness: 500 }}
                                                                className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${card.badge.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                                                                    card.badge.color === 'yellow' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'
                                                                    }`}
                                                            >
                                                                {card.badge.text}
                                                            </motion.span>
                                                        </div>

                                                        {/* Label */}
                                                        <p className="text-[10px] font-semibold text-zinc-600 tracking-wider mb-1">{card.label}</p>

                                                        {/* Value */}
                                                        <p className="text-lg font-bold text-zinc-900 mb-0.5">{card.value}</p>

                                                        {/* Subtext */}
                                                        <p className="text-[11px] text-zinc-700">{card.subtext}</p>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}
                        </motion.div>
                    ) : (
                        // Student Mode Content
                        <>
                            {/* Search Bar with Action Buttons - show for all tabs except teachers */}
                            {activeTab !== 'teachers' && (
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="flex-1">
                                        <SearchBar
                                            value={searchQuery}
                                            onChange={setSearchQuery}
                                            placeholder={getSearchPlaceholder()}
                                            isSearching={isSearching}
                                            resultCount={
                                                activeTab === 'modules' ? filteredModules.length :
                                                    activeTab === 'assignments' ? filteredTasks.length :
                                                        activeTab === 'news' ? filteredNews.length :
                                                            activeTab === 'students' ? filteredStudents.length : undefined
                                            }
                                            totalCount={
                                                activeTab === 'modules' ? courseModules.length :
                                                    activeTab === 'assignments' ? courseTasks.length :
                                                        activeTab === 'news' ? SAMPLE_NEWS.length :
                                                            activeTab === 'students' ? studentsData.length : undefined
                                            }
                                        />
                                    </div>
                                    {/* Action Button with Dropdown - shows for all tabs with actions */}
                                    <ActionsDropdown activeTab={activeTab} />
                                </div>
                            )}
                            {renderContent()}
                        </>
                    )}
                </AnimatePresence>
            </div>

            {/* Add Task Modal - Clean & Minimalistic */}
            <AnimatePresence>
                {showAddTaskModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 pt-16 pb-4 px-4"
                        onClick={() => setShowAddTaskModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                            onClick={(e) => e.stopPropagation()}
                            className={`rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-full ${isTeacherMode ? 'bg-zinc-900' : 'bg-white'
                                }`}
                        >
                            {/* Modal Header - Compact */}
                            <div className={`flex items-center justify-between px-5 py-4 border-b ${isTeacherMode ? 'border-zinc-700' : 'border-zinc-100'
                                }`}>
                                <div>
                                    <h3 className={`text-base font-semibold ${isTeacherMode ? 'text-white' : 'text-zinc-800'}`}>Create Task</h3>
                                    <p className={`text-xs mt-0.5 ${isTeacherMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Add a new task for your students</p>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowAddTaskModal(false)}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isTeacherMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'
                                        }`}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                </motion.button>
                            </div>

                            {/* Modal Body - Scrollable */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-4">
                                {/* Task Type - Compact Pills */}
                                <div>
                                    <label className={`text-xs font-medium mb-2 block ${isTeacherMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Type</label>
                                    <div className="flex flex-wrap gap-2">
                                        {TASK_CATEGORIES.filter(c => c.id !== 'all').map((cat) => (
                                            <motion.button
                                                key={cat.id}
                                                whileTap={{ scale: 0.97 }}
                                                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all ${selectedTaskType === cat.id
                                                    ? 'bg-blue-600 text-white'
                                                    : isTeacherMode
                                                        ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                                                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                                                    }`}
                                                onClick={() => setSelectedTaskType(cat.id)}
                                            >
                                                {cat.icon}
                                                {cat.label.replace('s', '')}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* Title */}
                                <div>
                                    <label className={`text-xs font-medium mb-1.5 block ${isTeacherMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                        Title <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={newTaskTitle}
                                        onChange={(e) => setNewTaskTitle(e.target.value)}
                                        placeholder="Enter task title..."
                                        className={`w-full h-10 px-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${isTeacherMode
                                            ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500'
                                            : 'bg-white border border-zinc-200 text-zinc-900 placeholder-zinc-400'
                                            }`}
                                    />
                                </div>

                                {/* Due Date and Points */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={`text-xs font-medium mb-1.5 block ${isTeacherMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                            Due Date <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={newTaskDueDate}
                                            onChange={(e) => setNewTaskDueDate(e.target.value)}
                                            className={`w-full h-10 px-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${isTeacherMode
                                                ? 'bg-zinc-800 border-zinc-700 text-white [color-scheme:dark]'
                                                : 'bg-white border border-zinc-200 text-zinc-900'
                                                }`}
                                        />
                                    </div>
                                    <div>
                                        <label className={`text-xs font-medium mb-1.5 block ${isTeacherMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Points</label>
                                        <input
                                            type="number"
                                            value={newTaskPoints}
                                            onChange={(e) => setNewTaskPoints(e.target.value)}
                                            placeholder="100"
                                            min="0"
                                            className={`w-full h-10 px-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${isTeacherMode
                                                ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500'
                                                : 'bg-white border border-zinc-200 text-zinc-900 placeholder-zinc-400'
                                                }`}
                                        />
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className={`text-xs font-medium mb-1.5 block ${isTeacherMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Description</label>
                                    <textarea
                                        value={newTaskDescription}
                                        onChange={(e) => setNewTaskDescription(e.target.value)}
                                        placeholder="Brief description..."
                                        rows={2}
                                        className={`w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none ${isTeacherMode
                                            ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500'
                                            : 'bg-white border border-zinc-200 text-zinc-900 placeholder-zinc-400'
                                            }`}
                                    />
                                </div>

                                {/* Instructions */}
                                <div>
                                    <label className={`text-xs font-medium mb-1.5 block ${isTeacherMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Instructions</label>
                                    <textarea
                                        value={newTaskInstructions}
                                        onChange={(e) => setNewTaskInstructions(e.target.value)}
                                        placeholder="Detailed instructions for students..."
                                        rows={3}
                                        className={`w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none ${isTeacherMode
                                            ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500'
                                            : 'bg-white border border-zinc-200 text-zinc-900 placeholder-zinc-400'
                                            }`}
                                    />
                                </div>

                                {/* File Attachments - Matching Tools Page Style */}
                                <div>
                                    <label className={`text-xs font-medium mb-1.5 block ${isTeacherMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Attachments</label>
                                    <input
                                        ref={taskFileInputRef}
                                        type="file"
                                        multiple
                                        onChange={(e) => {
                                            if (e.target.files) {
                                                setNewTaskFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                                            }
                                        }}
                                        className="hidden"
                                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif"
                                    />

                                    <motion.div
                                        onClick={() => newTaskFiles.length === 0 && taskFileInputRef.current?.click()}
                                        whileHover={newTaskFiles.length === 0 ? "animate" : undefined}
                                        className={`p-6 group/file block rounded-2xl w-full relative border-2 border-dashed transition-colors ${newTaskFiles.length === 0
                                            ? isTeacherMode
                                                ? "cursor-pointer border-zinc-700 hover:border-blue-500 bg-zinc-800/50"
                                                : "cursor-pointer border-gray-200 hover:border-blue-400 bg-gray-50/50"
                                            : isTeacherMode
                                                ? "border-zinc-700 bg-zinc-800/50"
                                                : "border-gray-200 bg-gray-50/50"
                                            }`}
                                    >
                                        <AnimatePresence mode="wait">
                                            {newTaskFiles.length === 0 ? (
                                                <motion.div
                                                    key="upload-area"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="flex flex-col items-center justify-center"
                                                >
                                                    <div className="relative w-full max-w-xl mx-auto mb-4 flex items-center justify-center">
                                                        <div className="relative h-20 w-20">
                                                            {/* Animated upload icon card with hover effect */}
                                                            <motion.div
                                                                variants={{
                                                                    initial: { x: 0, y: 0 },
                                                                    animate: { x: 20, y: -20, opacity: 0.9 }
                                                                }}
                                                                transition={{
                                                                    type: "spring",
                                                                    stiffness: 300,
                                                                    damping: 20,
                                                                }}
                                                                className={`relative group-hover/file:shadow-xl z-40 flex items-center justify-center h-20 w-20 rounded-xl shadow-md ${isTeacherMode
                                                                    ? 'bg-zinc-800 border border-zinc-600'
                                                                    : 'bg-white border border-gray-200'
                                                                    }`}
                                                            >
                                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isTeacherMode ? "#71717a" : "#9ca3af"} strokeWidth="2" strokeLinecap="round">
                                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                                    <polyline points="17 8 12 3 7 8" />
                                                                    <line x1="12" y1="3" x2="12" y2="15" />
                                                                </svg>
                                                            </motion.div>
                                                            {/* Secondary dashed border that appears on hover */}
                                                            <motion.div
                                                                variants={{
                                                                    initial: { opacity: 0 },
                                                                    animate: { opacity: 1 }
                                                                }}
                                                                className="absolute top-0 left-0 opacity-0 border-2 border-dashed border-blue-400 z-30 bg-transparent h-20 w-20 rounded-xl"
                                                            />
                                                        </div>
                                                    </div>
                                                    <p className={`font-semibold text-sm ${isTeacherMode ? 'text-zinc-300' : 'text-gray-700'}`}>
                                                        Upload files
                                                    </p>
                                                    <p className={`font-normal text-xs mt-1 ${isTeacherMode ? 'text-zinc-500' : 'text-gray-400'}`}>
                                                        PDF, DOC, PPT, Images (Max 10MB)
                                                    </p>
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="file-list"
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="flex flex-col gap-2"
                                                >
                                                    <AnimatePresence mode="popLayout">
                                                        {newTaskFiles.slice(0, 2).map((file, idx) => (
                                                            <motion.div
                                                                key={"file" + idx}
                                                                layout
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                                transition={{ delay: idx * 0.05, type: "spring", stiffness: 300, damping: 25 }}
                                                                className={`relative overflow-hidden z-40 flex flex-col items-start justify-start p-3 w-full rounded-xl shadow-sm ${isTeacherMode
                                                                    ? 'bg-zinc-800 border border-zinc-700'
                                                                    : 'bg-white border border-gray-200'
                                                                    }`}
                                                            >
                                                                <div className="flex justify-between w-full items-center gap-3">
                                                                    <p className={`text-sm font-medium truncate flex-1 min-w-0 ${isTeacherMode ? 'text-zinc-200' : 'text-gray-800'}`}>
                                                                        {file.name}
                                                                    </p>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`rounded-lg px-2 py-0.5 text-xs ${isTeacherMode
                                                                            ? 'text-emerald-400 bg-emerald-900/30 border border-emerald-800'
                                                                            : 'text-emerald-600 bg-emerald-50 border border-emerald-200'
                                                                            }`}>
                                                                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                                                                        </span>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setNewTaskFiles(prev => prev.filter((_, i) => i !== idx));
                                                                            }}
                                                                            className={`p-1 rounded-full transition-colors ${isTeacherMode ? 'hover:bg-zinc-700' : 'hover:bg-gray-100'
                                                                                }`}
                                                                        >
                                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={isTeacherMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-gray-400 hover:text-gray-600'}>
                                                                                <path d="M18 6L6 18M6 6l12 12" />
                                                                            </svg>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                <div className={`flex text-xs flex-row items-center w-full mt-1.5 justify-between ${isTeacherMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                                                                    <span className={`px-2 py-0.5 rounded-md ${isTeacherMode ? 'bg-zinc-700' : 'bg-gray-100'}`}>
                                                                        {file.type || "Unknown type"}
                                                                    </span>
                                                                    <span>
                                                                        modified {new Date(file.lastModified).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                            </motion.div>
                                                        ))}

                                                        {newTaskFiles.length > 2 && (
                                                            <motion.div
                                                                key="collapsed-summary"
                                                                layout
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                                                className={`relative z-40 flex items-center p-3 w-full rounded-xl ${isTeacherMode
                                                                    ? 'bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-800'
                                                                    : 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex -space-x-2">
                                                                        {newTaskFiles.slice(2, 5).map((_, i) => (
                                                                            <motion.div
                                                                                key={i}
                                                                                initial={{ scale: 0, opacity: 0 }}
                                                                                animate={{ scale: 1, opacity: 1 }}
                                                                                transition={{ delay: i * 0.1 }}
                                                                                className={`w-7 h-7 rounded-lg flex items-center justify-center shadow-sm ${isTeacherMode
                                                                                    ? 'bg-zinc-800 border border-blue-700'
                                                                                    : 'bg-white border border-blue-200'
                                                                                    }`}
                                                                            >
                                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round">
                                                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                                                    <polyline points="14 2 14 8 20 8" />
                                                                                </svg>
                                                                            </motion.div>
                                                                        ))}
                                                                    </div>
                                                                    <div className="text-left">
                                                                        <p className={`text-xs font-medium ${isTeacherMode ? 'text-blue-400' : 'text-blue-700'}`}>
                                                                            +{newTaskFiles.length - 2} more {newTaskFiles.length - 2 === 1 ? 'file' : 'files'}
                                                                        </p>
                                                                        <p className={`text-[10px] ${isTeacherMode ? 'text-blue-500' : 'text-blue-500'}`}>
                                                                            {(newTaskFiles.slice(2).reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(2)} MB total
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>

                                                    <motion.button
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: 0.1 }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            taskFileInputRef.current?.click();
                                                        }}
                                                        className={`w-full py-2.5 px-4 rounded-xl border-2 border-dashed text-sm font-medium hover:border-blue-400 hover:text-blue-500 transition-colors mt-1 ${isTeacherMode
                                                            ? 'border-zinc-600 text-zinc-400'
                                                            : 'border-gray-300 text-gray-500'
                                                            }`}
                                                    >
                                                        + Add more files
                                                    </motion.button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                </div>
                            </div>

                            {/* Modal Footer - Compact */}
                            <div className={`px-5 py-3 border-t flex items-center justify-end gap-2 ${isTeacherMode ? 'border-zinc-700' : 'border-zinc-100'
                                }`}>
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => {
                                        setShowAddTaskModal(false);
                                        setNewTaskTitle('');
                                        setNewTaskDescription('');
                                        setNewTaskDueDate('');
                                        setNewTaskPoints('100');
                                        setNewTaskInstructions('');
                                        setNewTaskFiles([]);
                                    }}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${isTeacherMode
                                        ? 'text-zinc-400 hover:bg-zinc-800'
                                        : 'text-zinc-600 hover:bg-zinc-100'
                                        }`}
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    disabled={!newTaskTitle || !newTaskDueDate || isCreatingTask}
                                    onClick={async () => {
                                        setIsCreatingTask(true);
                                        try {
                                            const taskInput: CreateTaskInput = {
                                                courseId: course.id,
                                                type: (selectedTaskType === 'all' || selectedTaskType === 'overdue') ? 'assignment' : selectedTaskType,
                                                title: newTaskTitle,
                                                description: newTaskDescription,
                                                instructions: newTaskInstructions,
                                                dueDate: newTaskDueDate,
                                                points: parseInt(newTaskPoints) || 100,
                                                files: newTaskFiles.length > 0 ? newTaskFiles : undefined
                                            };
                                            const createdTask = await createTask(taskInput);
                                            if (createdTask) {
                                                console.log('[CourseView] Task created:', createdTask.id);
                                            }
                                        } catch (err) {
                                            console.error('[CourseView] Error:', err);
                                        } finally {
                                            setIsCreatingTask(false);
                                            setShowAddTaskModal(false);
                                            setNewTaskTitle('');
                                            setNewTaskDescription('');
                                            setNewTaskDueDate('');
                                            setNewTaskPoints('100');
                                            setNewTaskInstructions('');
                                            setNewTaskFiles([]);
                                        }
                                    }}
                                    className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all flex items-center gap-1.5 ${!newTaskTitle || !newTaskDueDate || isCreatingTask
                                        ? 'bg-blue-400 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                >
                                    {isCreatingTask ? (
                                        <>
                                            <motion.svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                                                <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                                            </motion.svg>
                                            Creating...
                                        </>
                                    ) : (
                                        'Create Task'
                                    )}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Action Button */}
            <FloatingActionButton
                activeTab={activeTab}
                onAction={(action) => {
                    console.log(`FAB action: ${action} for course: ${course.title}`);
                    // Handle actions here - can be extended with actual functionality
                }}
            />

            {/* Teacher Mode Tutorial Modal */}
            <AnimatePresence>
                {showTeacherTutorial && (
                    <>
                        {/* Highlight Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[99] pointer-events-none"
                        >
                            {/* Dark overlay with cutout for highlighted element */}
                            <svg className="w-full h-full">
                                <defs>
                                    <mask id="teacher-tutorial-mask">
                                        <rect x="0" y="0" width="100%" height="100%" fill="white" />
                                        {highlightRect && (
                                            <motion.rect
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                x={highlightRect.left}
                                                y={highlightRect.top}
                                                width={highlightRect.width}
                                                height={highlightRect.height}
                                                rx="12"
                                                fill="black"
                                            />
                                        )}
                                    </mask>
                                </defs>
                                <rect
                                    x="0"
                                    y="0"
                                    width="100%"
                                    height="100%"
                                    fill="rgba(0,0,0,0.7)"
                                    mask="url(#teacher-tutorial-mask)"
                                />
                            </svg>

                            {/* Highlight border glow */}
                            {highlightRect && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="absolute rounded-xl border-2 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                                    style={{
                                        top: highlightRect.top,
                                        left: highlightRect.left,
                                        width: highlightRect.width,
                                        height: highlightRect.height,
                                    }}
                                />
                            )}
                        </motion.div>

                        {/* Tutorial Modal */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed z-[100] pointer-events-none"
                            style={{
                                top: modalPosition.top,
                                left: modalPosition.left,
                            }}
                        >
                            <motion.div
                                key={tutorialStep}
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white rounded-2xl w-80 overflow-hidden shadow-2xl pointer-events-auto"
                            >
                                {/* Progress Bar */}
                                <div className="h-1 bg-zinc-100">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${((tutorialStep + 1) / TEACHER_TUTORIAL_STEPS.length) * 100}%` }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </div>

                                {/* Content */}
                                <div className="p-5">
                                    {/* Step Indicator */}
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-[11px] font-semibold text-zinc-400 tracking-wider">
                                            STEP {tutorialStep + 1} OF {TEACHER_TUTORIAL_STEPS.length}
                                        </span>
                                        <motion.button
                                            onClick={handleTutorialSkip}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="text-[11px] font-medium text-zinc-500 hover:text-zinc-700 transition-colors"
                                        >
                                            Skip Tutorial
                                        </motion.button>
                                    </div>

                                    {/* Icon */}
                                    <motion.div
                                        key={tutorialStep}
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                        className={`w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center ${TEACHER_TUTORIAL_STEPS[tutorialStep].color === 'blue' ? 'bg-blue-100 text-blue-600' :
                                            TEACHER_TUTORIAL_STEPS[tutorialStep].color === 'yellow' ? 'bg-yellow-100 text-yellow-600' :
                                                'bg-green-100 text-green-600'
                                            }`}
                                    >
                                        <div className="scale-75">{TEACHER_TUTORIAL_STEPS[tutorialStep].icon}</div>
                                    </motion.div>

                                    {/* Title & Description */}
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={tutorialStep}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.2 }}
                                            className="text-center mb-5"
                                        >
                                            <h3 className="text-base font-bold text-zinc-900 mb-2">
                                                {TEACHER_TUTORIAL_STEPS[tutorialStep].title}
                                            </h3>
                                            <p className="text-xs text-zinc-600 leading-relaxed whitespace-pre-line">
                                                {TEACHER_TUTORIAL_STEPS[tutorialStep].description}
                                            </p>
                                        </motion.div>
                                    </AnimatePresence>

                                    {/* Step Dots */}
                                    <div className="flex items-center justify-center gap-2 mb-6">
                                        {TEACHER_TUTORIAL_STEPS.map((_, index) => (
                                            <motion.button
                                                key={index}
                                                onClick={() => setTutorialStep(index)}
                                                className={`w-2 h-2 rounded-full transition-colors ${index === tutorialStep ? 'bg-blue-600' :
                                                    index < tutorialStep ? 'bg-blue-300' : 'bg-zinc-200'
                                                    }`}
                                                whileHover={{ scale: 1.3 }}
                                                whileTap={{ scale: 0.9 }}
                                            />
                                        ))}
                                    </div>

                                    {/* Navigation Buttons */}
                                    <div className="flex items-center gap-3">
                                        {tutorialStep > 0 && (
                                            <motion.button
                                                onClick={handleTutorialPrev}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className="flex-1 py-3 text-sm font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors flex items-center justify-center gap-2"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                    <path d="M19 12H5M12 19l-7-7 7-7" />
                                                </svg>
                                                Back
                                            </motion.button>
                                        )}
                                        <motion.button
                                            onClick={handleTutorialNext}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className={`flex-1 py-3 text-sm font-semibold text-white rounded-xl transition-colors flex items-center justify-center gap-2 ${tutorialStep === TEACHER_TUTORIAL_STEPS.length - 1
                                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                                                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                                                }`}
                                        >
                                            {tutorialStep === TEACHER_TUTORIAL_STEPS.length - 1 ? (
                                                <>
                                                    Get Started
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                        <polyline points="22 4 12 14.01 9 11.01" />
                                                    </svg>
                                                </>
                                            ) : (
                                                <>
                                                    Next
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                                    </svg>
                                                </>
                                            )}
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Contact Instructor Tooltip - Portal */}
            {createPortal(
                <AnimatePresence>
                    {contactTooltip.visible && (
                        <motion.div
                            initial={{ opacity: 0, y: -6, x: '-50%' }}
                            animate={{ opacity: 1, y: 0, x: '-50%' }}
                            exit={{ opacity: 0, y: -6, x: '-50%' }}
                            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                            style={{
                                position: 'fixed',
                                top: contactTooltip.y,
                                left: contactTooltip.x,
                                zIndex: 99999,
                                pointerEvents: 'none',
                            }}
                        >
                            {/* Arrow pointing up */}
                            <div style={{
                                position: 'absolute',
                                top: '-6px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '12px',
                                height: '6px',
                                overflow: 'hidden',
                            }}>
                                <div style={{
                                    width: '10px',
                                    height: '10px',
                                    background: '#ffffff',
                                    border: '1px solid rgba(0, 0, 0, 0.06)',
                                    transform: 'rotate(45deg)',
                                    position: 'absolute',
                                    top: '3px',
                                    left: '1px',
                                    boxShadow: '0 -1px 3px rgba(0, 0, 0, 0.04)',
                                }} />
                            </div>
                            {/* Tooltip body */}
                            <div style={{
                                background: '#ffffff',
                                borderRadius: '8px',
                                padding: '6px 8px',
                                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.06)',
                                border: '1px solid rgba(0, 0, 0, 0.06)',
                                whiteSpace: 'nowrap',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div style={{
                                        width: '22px',
                                        height: '22px',
                                        borderRadius: '5px',
                                        background: 'rgba(239, 68, 68, 0.08)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                            <polyline points="22,6 12,13 2,6" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>
                                            Contact Instructor
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#0f172a', marginTop: '1px' }}>
                                            Reach out regarding this overdue task
                                        </div>
                                    </div>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '2px 5px',
                                    borderRadius: '4px',
                                    background: 'rgba(245, 158, 11, 0.06)',
                                    border: '1px solid rgba(245, 158, 11, 0.12)',
                                }}>
                                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                        <line x1="12" y1="9" x2="12" y2="13" />
                                        <line x1="12" y1="17" x2="12.01" y2="17" />
                                    </svg>
                                    <span style={{ fontSize: '10px', color: '#92400e', fontWeight: 500 }}>
                                        Please ensure you have a valid reason
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* View Instructions Modal */}
            <AnimatePresence>
                {instructionsModalTask && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm"
                        onClick={() => setInstructionsModalTask(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            transition={{ type: "spring", duration: 0.4 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="px-8 py-6 flex items-start justify-between bg-white relative border-b border-zinc-200/80">
                                <div className="pr-8">
                                    <h3 className="text-2xl font-bold text-zinc-900 tracking-tight mb-1.5">
                                        {instructionsModalTask.title}
                                    </h3>
                                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Task Instructions & Details</p>
                                </div>
                                <button
                                    onClick={() => setInstructionsModalTask(null)}
                                    className="absolute right-6 top-6 p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-all"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="px-8 pb-8 pt-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
                                <div className="space-y-6">
                                    {(instructionsModalTask as any).description && (
                                        <div className="border border-zinc-200/80 rounded-2xl p-6 bg-zinc-50/30">
                                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <line x1="12" y1="16" x2="12" y2="12" />
                                                    <line x1="12" y1="8" x2="12.01" y2="8" />
                                                </svg>
                                                Description
                                            </h4>
                                            <div className="text-[15px] text-zinc-700 leading-relaxed whitespace-pre-wrap font-normal">
                                                {(instructionsModalTask as any).description}
                                            </div>
                                        </div>
                                    )}

                                    {(instructionsModalTask as any).instructions ? (
                                        <div className="border border-zinc-200/80 rounded-2xl p-6 bg-zinc-50/30">
                                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                                </svg>
                                                Detailed Instructions
                                            </h4>
                                            <div
                                                className="text-[15px] text-zinc-700 leading-relaxed whitespace-pre-wrap prose prose-zinc prose-sm max-w-none font-normal"
                                                dangerouslySetInnerHTML={{ __html: (instructionsModalTask as any).instructions }}
                                            />
                                        </div>
                                    ) : (
                                        !((instructionsModalTask as any).description) && (
                                            <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-400">
                                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-50">
                                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                                    <line x1="9" y1="3" x2="9" y2="21" />
                                                </svg>
                                                <p className="text-[15px] font-medium">No additional details provided.</p>
                                            </div>
                                        )
                                    )}

                                    {/* Assignment Rules - show teacher's configured settings */}
                                    {((instructionsModalTask as any).allowLateSubmission !== undefined ||
                                        (instructionsModalTask as any).maxAttempts > 1 ||
                                        (instructionsModalTask as any).rubricEnabled) && (
                                            <div className="border border-zinc-200/80 rounded-2xl p-6 bg-zinc-50/30">
                                                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                                    </svg>
                                                    Assignment Rules
                                                </h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    {/* Late Submission Policy */}
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '10px',
                                                        padding: '10px 14px',
                                                        borderRadius: '12px',
                                                        background: (instructionsModalTask as any).allowLateSubmission
                                                            ? 'rgba(245, 158, 11, 0.08)'
                                                            : 'rgba(239, 68, 68, 0.06)',
                                                        border: (instructionsModalTask as any).allowLateSubmission
                                                            ? '1px solid rgba(245, 158, 11, 0.15)'
                                                            : '1px solid rgba(239, 68, 68, 0.12)',
                                                    }}>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                                            stroke={(instructionsModalTask as any).allowLateSubmission ? '#f59e0b' : '#ef4444'}
                                                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <circle cx="12" cy="12" r="10" />
                                                            <polyline points="12 6 12 12 16 14" />
                                                        </svg>
                                                        <div>
                                                            <div style={{
                                                                fontSize: '13px',
                                                                fontWeight: 600,
                                                                color: (instructionsModalTask as any).allowLateSubmission ? '#92400e' : '#991b1b',
                                                            }}>
                                                                {(instructionsModalTask as any).allowLateSubmission
                                                                    ? 'Late submissions allowed'
                                                                    : 'No late submissions'}
                                                            </div>
                                                            {(instructionsModalTask as any).allowLateSubmission && (instructionsModalTask as any).latePenalty > 0 && (
                                                                <div style={{ fontSize: '11px', color: '#b45309', marginTop: '2px' }}>
                                                                    {(instructionsModalTask as any).latePenalty}% penalty per day late
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Max Attempts */}
                                                    {(instructionsModalTask as any).maxAttempts > 1 && (
                                                        <div style={{
                                                            padding: '10px 14px',
                                                            borderRadius: '12px',
                                                            background: 'rgba(59, 130, 246, 0.06)',
                                                            border: '1px solid rgba(59, 130, 246, 0.12)',
                                                        }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <polyline points="1 4 1 10 7 10" />
                                                                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                                                                </svg>
                                                                <div>
                                                                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e40af' }}>
                                                                        {(instructionsModalTask as any).maxAttempts} attempts allowed
                                                                    </div>
                                                                    <div style={{ fontSize: '11px', color: '#3b82f6', marginTop: '2px' }}>
                                                                        {(() => {
                                                                            const used = (instructionsModalTask as any).submissionCount || 0;
                                                                            const max = (instructionsModalTask as any).maxAttempts || 1;
                                                                            const remaining = Math.max(0, max - used);
                                                                            if (used === 0) return `You have ${max} attempts remaining`;
                                                                            if (remaining === 0) return '⚠ No attempts remaining';
                                                                            return `${used} used · ${remaining} remaining`;
                                                                        })()}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Rubric Criteria Display */}
                                                    {(instructionsModalTask as any).rubricEnabled && (
                                                        <div style={{
                                                            padding: '14px',
                                                            borderRadius: '12px',
                                                            background: 'rgba(16, 185, 129, 0.06)',
                                                            border: '1px solid rgba(16, 185, 129, 0.12)',
                                                        }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: (instructionsModalTask as any).rubricCriteria?.length > 0 ? '12px' : '0' }}>
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                                                    <line x1="3" y1="9" x2="21" y2="9" />
                                                                    <line x1="9" y1="21" x2="9" y2="9" />
                                                                </svg>
                                                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#065f46' }}>
                                                                    Graded with rubric
                                                                </div>
                                                            </div>

                                                            {/* Show actual rubric criteria if available */}
                                                            {(instructionsModalTask as any).rubricCriteria?.length > 0 && (
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                    {((instructionsModalTask as any).rubricCriteria as any[]).map((criterion: any, idx: number) => (
                                                                        <div key={criterion.id || idx} style={{
                                                                            padding: '10px 12px',
                                                                            borderRadius: '8px',
                                                                            background: 'rgba(255, 255, 255, 0.7)',
                                                                            border: '1px solid rgba(16, 185, 129, 0.1)',
                                                                        }}>
                                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: criterion.description ? '4px' : '0' }}>
                                                                                <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                                                                                    {criterion.name}
                                                                                </span>
                                                                                <span style={{
                                                                                    fontSize: '11px',
                                                                                    fontWeight: 600,
                                                                                    padding: '2px 8px',
                                                                                    borderRadius: '6px',
                                                                                    background: 'rgba(16, 185, 129, 0.1)',
                                                                                    color: '#10b981',
                                                                                }}>
                                                                                    {criterion.points} pts
                                                                                </span>
                                                                            </div>
                                                                            {criterion.description && (
                                                                                <p style={{ fontSize: '11px', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                                                                                    {criterion.description}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-8 py-5 flex justify-end gap-3 bg-white border-t border-zinc-100/50">
                                <motion.button
                                    whileHover={{ scale: 1.02, backgroundColor: 'rgba(244, 244, 245, 1)' }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setInstructionsModalTask(null)}
                                    className="px-6 py-2.5 text-sm font-semibold text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-xl transition-all"
                                >
                                    Close
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ======================= SUBMIT ASSIGNMENT MODAL ======================= */}
            {createPortal(
                <AnimatePresence>
                    {submitModalTask && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => {
                                if (!isSubmitting) {
                                    setSubmitModalTask(null);
                                    setSubmissionText('');
                                    setSubmissionFiles([]);
                                    setSubmitSuccess(false);
                                }
                            }}
                            style={{
                                position: 'fixed', inset: 0, zIndex: 99999,
                                background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                padding: '24px',
                            }}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                                transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    width: '100%', maxWidth: '520px',
                                    background: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff',
                                    borderRadius: '20px',
                                    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255,255,255,0.05)',
                                    overflow: 'hidden',
                                    display: 'flex', flexDirection: 'column' as const,
                                }}
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
                                                background: document.documentElement.classList.contains('dark') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                margin: '0 auto 24px',
                                                boxShadow: document.documentElement.classList.contains('dark') ? 'inset 0 0 20px rgba(16, 185, 129, 0.05)' : 'inset 0 0 20px rgba(16, 185, 129, 0.1)',
                                            }}
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
                                            color: document.documentElement.classList.contains('dark') ? '#f1f5f9' : '#0f172a',
                                        }}>Submission Successful!</h3>
                                        <p style={{
                                            fontSize: '14px', marginBottom: '36px', lineHeight: 1.6,
                                            color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b',
                                            maxWidth: '90%', margin: '0 auto 36px'
                                        }}>
                                            Your assignment has been submitted to your teacher for grading. You'll be notified once it's graded.
                                        </p>
                                        <motion.button
                                            whileHover={{
                                                scale: 1.02,
                                                boxShadow: '0 6px 20px rgba(16, 185, 129, 0.25)',
                                            }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                                setSubmitModalTask(null);
                                                setSubmitSuccess(false);
                                                setSubmissionText('');
                                                setSubmissionFiles([]);
                                                fetchSupabaseTasks(); // Refresh task list to show updated status
                                            }}
                                            style={{
                                                margin: '0 auto',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '6px',
                                                padding: '10px 32px',
                                                background: document.documentElement.classList.contains('dark') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.08)',
                                                color: '#10b981',
                                                border: `1px solid ${document.documentElement.classList.contains('dark') ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)'}`,
                                                borderRadius: '10px',
                                                fontSize: '14px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            Done
                                        </motion.button>
                                    </motion.div>
                                ) : (
                                    <>
                                        {/* Header */}
                                        <div style={{
                                            padding: '24px 28px 0',
                                            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                                                <div style={{
                                                    width: '48px', height: '48px', borderRadius: '14px',
                                                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)',
                                                    flexShrink: 0,
                                                }}>
                                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M22 2L11 13" />
                                                        <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h2 style={{
                                                        fontSize: '17px', fontWeight: 700, margin: 0, lineHeight: 1.3,
                                                        color: document.documentElement.classList.contains('dark') ? '#f1f5f9' : '#0f172a',
                                                    }}>Submit Assignment</h2>
                                                    <p style={{
                                                        fontSize: '12px', margin: 0, marginTop: '2px',
                                                        color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b',
                                                    }}>{submitModalTask?.title}</p>
                                                </div>
                                            </div>
                                            <motion.button
                                                whileHover={{ scale: 1.1, backgroundColor: document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => {
                                                    setSubmitModalTask(null);
                                                    setSubmissionText('');
                                                    setSubmissionFiles([]);
                                                }}
                                                style={{
                                                    width: '32px', height: '32px', borderRadius: '10px',
                                                    border: 'none', background: 'transparent',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    cursor: 'pointer', flexShrink: 0,
                                                    color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#94a3b8',
                                                }}
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                                    <line x1="18" y1="6" x2="6" y2="18" />
                                                    <line x1="6" y1="6" x2="18" y2="18" />
                                                </svg>
                                            </motion.button>
                                        </div>

                                        {/* Task Info Badges */}
                                        <div style={{
                                            padding: '16px 28px',
                                            display: 'flex', gap: '8px', flexWrap: 'wrap' as const,
                                        }}>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
                                                background: document.documentElement.classList.contains('dark') ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)',
                                                color: '#3b82f6',
                                            }}>
                                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                                                </svg>
                                                {submitModalTask?.due}
                                            </span>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
                                                background: document.documentElement.classList.contains('dark') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.08)',
                                                color: '#10b981',
                                            }}>
                                                {(submitModalTask as any)?.points || 100} pts
                                            </span>
                                            {((submitModalTask as any)?.maxAttempts || 1) > 1 && (
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                    padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
                                                    background: document.documentElement.classList.contains('dark') ? 'rgba(0, 61, 165, 0.15)' : 'rgba(0, 61, 165, 0.08)',
                                                    color: '#003DA5',
                                                }}>
                                                    {((submitModalTask as any)?.maxAttempts || 1) - ((submitModalTask as any)?.submissionCount || 0)} attempt{((submitModalTask as any)?.maxAttempts || 1) - ((submitModalTask as any)?.submissionCount || 0) !== 1 ? 's' : ''} left
                                                </span>
                                            )}
                                        </div>

                                        {/* Divider */}
                                        <div style={{
                                            height: '1px', margin: '0 28px',
                                            background: document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                        }} />

                                        {/* Submission Content */}
                                        <div style={{ padding: '20px 28px', flex: 1 }}>
                                            {/* Text Area */}
                                            <label style={{
                                                display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '8px',
                                                color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b',
                                                textTransform: 'uppercase' as const, letterSpacing: '0.5px',
                                            }}>
                                                Your Answer / Comments
                                            </label>
                                            <textarea
                                                value={submissionText}
                                                onChange={(e) => setSubmissionText(e.target.value)}
                                                placeholder="Type your answer, solution, or any comments here..."
                                                style={{
                                                    width: '100%', minHeight: '120px', padding: '14px 16px',
                                                    borderRadius: '14px', border: `1.5px solid ${document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                                                    background: document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.05)' : 'rgba(248, 250, 252, 1)',
                                                    color: document.documentElement.classList.contains('dark') ? '#e2e8f0' : '#1e293b',
                                                    fontSize: '14px', lineHeight: 1.6, resize: 'vertical' as const,
                                                    outline: 'none', fontFamily: 'inherit',
                                                    transition: 'border-color 0.2s, box-shadow 0.2s',
                                                }}
                                                onFocus={(e) => {
                                                    e.currentTarget.style.borderColor = '#3b82f6';
                                                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                                                }}
                                                onBlur={(e) => {
                                                    e.currentTarget.style.borderColor = document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
                                                    e.currentTarget.style.boxShadow = 'none';
                                                }}
                                            />

                                            {/* File Attachments Section */}
                                            <div style={{ marginTop: '16px' }}>
                                                <label style={{
                                                    display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '8px',
                                                    color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b',
                                                    textTransform: 'uppercase' as const, letterSpacing: '0.5px',
                                                }}>
                                                    Attachments
                                                </label>

                                                <FileUpload
                                                    files={submissionFiles}
                                                    onChange={setSubmissionFiles}
                                                />
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div style={{
                                            padding: '16px 28px 24px',
                                            display: 'flex', gap: '10px', justifyContent: 'flex-end',
                                            borderTop: `1px solid ${document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                                        }}>
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => {
                                                    setSubmitModalTask(null);
                                                    setSubmissionText('');
                                                    setSubmissionFiles([]);
                                                }}
                                                disabled={isSubmitting}
                                                style={{
                                                    padding: '10px 22px', borderRadius: '12px', fontSize: '13px', fontWeight: 600,
                                                    border: `1px solid ${document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
                                                    background: document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                                                    color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b',
                                                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                                    opacity: isSubmitting ? 0.5 : 1,
                                                }}
                                            >
                                                Cancel
                                            </motion.button>

                                            <motion.button
                                                whileHover={!isSubmitting && (submissionText.trim() || submissionFiles.length > 0) ? { scale: 1.02, boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)' } : {}}
                                                whileTap={!isSubmitting && (submissionText.trim() || submissionFiles.length > 0) ? { scale: 0.98 } : {}}
                                                disabled={isSubmitting || (!submissionText.trim() && submissionFiles.length === 0)}
                                                onClick={async () => {
                                                    const currentUser = getCurrentUser();
                                                    if (!currentUser) return;

                                                    setIsSubmitting(true);
                                                    try {
                                                        const result = await createSubmission({
                                                            taskId: submitModalTask.id,
                                                            studentId: currentUser.student_id || currentUser.id,
                                                            studentName: currentUser.full_name,
                                                            section: currentUser.section || 'BSIT101A',
                                                            textContent: submissionText,
                                                            files: submissionFiles.length > 0 ? submissionFiles : undefined
                                                        });

                                                        if (result) {
                                                            setSubmissions((prev: any[]) => [...prev, result as any]);
                                                            setSubmitSuccess(true);
                                                        }
                                                    } catch (err) {
                                                        console.error('Failed to submit:', err);
                                                    } finally {
                                                        setIsSubmitting(false);
                                                    }
                                                }}
                                                style={{
                                                    padding: '10px 28px', borderRadius: '12px', fontSize: '13px', fontWeight: 700,
                                                    border: 'none',
                                                    background: isSubmitting || (!submissionText.trim() && submissionFiles.length === 0)
                                                        ? (document.documentElement.classList.contains('dark') ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.4)')
                                                        : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                                    color: '#fff',
                                                    cursor: isSubmitting || (!submissionText.trim() && submissionFiles.length === 0) ? 'not-allowed' : 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: '8px',
                                                    boxShadow: isSubmitting || (!submissionText.trim() && submissionFiles.length === 0)
                                                        ? 'none'
                                                        : '0 4px 14px rgba(59, 130, 246, 0.25)',
                                                }}
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <motion.svg
                                                            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                                                            animate={{ rotate: 360 }}
                                                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                        >
                                                            <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                                                        </motion.svg>
                                                        Submitting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M22 2L11 13" />
                                                            <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                                                        </svg>
                                                        Submit Assignment
                                                    </>
                                                )}
                                            </motion.button>
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </motion.div>
    );
};

export default CourseViewPage;
