import * as React from 'react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createTask, type CreateTaskInput } from '../services/taskService';

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
type TaskCategory = 'all' | 'assignment' | 'performance' | 'quiz' | 'practical' | 'journal';

// Task category configuration for the Tasks tab filter
const TASK_CATEGORIES: { id: TaskCategory; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'all', label: 'All', icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
        </svg>
    ), color: 'zinc' },
    { id: 'assignment', label: 'Assignments', icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
        </svg>
    ), color: 'emerald' },
    { id: 'performance', label: 'Performance Tasks', icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
        </svg>
    ), color: 'purple' },
    { id: 'quiz', label: 'Quizzes', icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    ), color: 'amber' },
    { id: 'practical', label: 'Practical Exams', icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
    ), color: 'rose' },
    { id: 'journal', label: 'Journals', icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
    ), color: 'cyan' },
];

// Content type icons for modules
const CONTENT_TYPE_CONFIG: Record<ContentType, { label: string; icon: React.ReactNode; color: string }> = {
    'handout-a': { label: 'Handout A', icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
        </svg>
    ), color: 'blue' },
    'handout-b': { label: 'Handout B', icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
        </svg>
    ), color: 'indigo' },
    'slideshow': { label: 'Slideshow', icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
        </svg>
    ), color: 'amber' },
    'video': { label: 'Video', icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
    ), color: 'rose' },
};

// Course-specific data configuration
const COURSE_DATA: Record<string, {
    modules: { id: number; title: string; status: string; contents: { type: ContentType; title: string; completed: boolean }[] }[];
    tasks: { id: number; title: string; due: string; status: string; score: string | null; category: TaskCategory }[];
    instructor: { name: string; title: string; email: string };
}> = {
    'cp1': {
        modules: [
            { id: 1, title: 'Module 1: Introduction to Programming', status: 'in-progress', contents: [
                { type: 'handout-a' as ContentType, title: 'Course Overview', completed: false },
                { type: 'handout-b' as ContentType, title: 'Getting Started Guide', completed: false },
                { type: 'slideshow' as ContentType, title: 'Introduction Slides', completed: false },
                { type: 'video' as ContentType, title: 'Welcome Video', completed: false },
            ]},
        ],
        tasks: [],
        instructor: { name: 'David Clarence Del Mundo', title: 'Instructor', email: 'd.delmundo@university.edu' }
    },
    'euth1': {
        modules: [
            { id: 1, title: 'Chapter 1: Introduction to Euthenics', status: 'in-progress', contents: [
                { type: 'handout-a' as ContentType, title: 'What is Euthenics?', completed: false },
                { type: 'slideshow' as ContentType, title: 'Course Introduction', completed: false },
                { type: 'video' as ContentType, title: 'Welcome to Euthenics', completed: false },
            ]},
        ],
        tasks: [],
        instructor: { name: 'Claire Maurillo', title: 'Instructor', email: 'c.maurillo@university.edu' }
    },
    'itc': {
        modules: [
            { id: 1, title: 'Module 1: Computer Fundamentals', status: 'in-progress', contents: [
                { type: 'handout-a' as ContentType, title: 'History of Computing', completed: false },
                { type: 'slideshow' as ContentType, title: 'Computer Components', completed: false },
                { type: 'video' as ContentType, title: 'Inside a Computer', completed: false },
            ]},
        ],
        tasks: [],
        instructor: { name: 'Psalmmiracle Mariano', title: 'Instructor', email: 'p.mariano@university.edu' }
    },
    'nstp1': {
        modules: [
            { id: 1, title: 'Unit 1: NSTP Overview', status: 'in-progress', contents: [
                { type: 'handout-a' as ContentType, title: 'NSTP Law & Guidelines', completed: false },
                { type: 'slideshow' as ContentType, title: 'Program Introduction', completed: false },
            ]},
        ],
        tasks: [],
        instructor: { name: 'Dan Risty Montojo', title: 'Instructor', email: 'd.montojo@university.edu' }
    },
    'pe1': {
        modules: [
            { id: 1, title: 'Week 1: Fitness Assessment', status: 'in-progress', contents: [
                { type: 'handout-a' as ContentType, title: 'Fitness Test Guide', completed: false },
                { type: 'video' as ContentType, title: 'Proper Form Demo', completed: false },
            ]},
        ],
        tasks: [],
        instructor: { name: 'Mark Joseph Danoy', title: 'Instructor', email: 'm.danoy@university.edu' }
    },
    'ppc': {
        modules: [
            { id: 1, title: 'Topic 1: Understanding Culture', status: 'in-progress', contents: [
                { type: 'handout-a' as ContentType, title: 'What is Culture?', completed: false },
                { type: 'slideshow' as ContentType, title: 'Cultural Elements', completed: false },
            ]},
        ],
        tasks: [],
        instructor: { name: 'Claire Maurillo', title: 'Instructor', email: 'c.maurillo@university.edu' }
    },
    'purcom': {
        modules: [
            { id: 1, title: 'Lesson 1: Communication Process', status: 'in-progress', contents: [
                { type: 'handout-a' as ContentType, title: 'Elements of Communication', completed: false },
                { type: 'slideshow' as ContentType, title: 'Communication Models', completed: false },
            ]},
        ],
        tasks: [],
        instructor: { name: 'John Denielle San Martin', title: 'Instructor', email: 'j.sanmartin@university.edu' }
    },
    'tcw': {
        modules: [
            { id: 1, title: 'Chapter 1: Globalization', status: 'in-progress', contents: [
                { type: 'handout-a' as ContentType, title: 'What is Globalization?', completed: false },
                { type: 'slideshow' as ContentType, title: 'Global Interconnectedness', completed: false },
            ]},
        ],
        tasks: [],
        instructor: { name: 'Claire Maurillo', title: 'Instructor', email: 'c.maurillo@university.edu' }
    },
    'uts': {
        modules: [
            { id: 1, title: 'Module 1: The Self from Various Perspectives', status: 'in-progress', contents: [
                { type: 'handout-a' as ContentType, title: 'Philosophical Self', completed: false },
                { type: 'slideshow' as ContentType, title: 'Who Am I?', completed: false },
            ]},
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
    modules: { id: number; title: string; status: string; contents: { type: ContentType; title: string; completed: boolean }[] }[];
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

// Quick Stats Component - Matching CourseCard grade display style
const QuickStatsBar: React.FC<{ courseId: string }> = ({ courseId: _courseId }) => {
    void _courseId;
    
    // Fresh start - 0% grade (C) and 0% attendance
    const stats = {
        grade: 0,
        gradeTrend: 'stable' as const,
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _hasGrade = stats.grade > 0; // Available for future use

    // Trend arrow component
    const TrendArrow = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
        if (trend === 'stable') return null;
        return (
            <motion.svg 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5"
                className={trend === 'up' ? 'text-blue-500' : 'text-red-500'}
                initial={{ y: 5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                {trend === 'up' ? (
                    <path d="M7 17l5-5 5 5M7 12l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
                ) : (
                    <path d="M7 7l5 5 5-5M7 12l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                )}
            </motion.svg>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-6 py-4 bg-white border-b border-zinc-100"
        >
            {/* Current Grade - Large letter style like CourseCard */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                whileHover={{ scale: 1.02 }}
                className={`rounded-xl p-4 cursor-pointer transition-shadow hover:shadow-md border ${
                    stats.grade === 0 
                        ? 'bg-gradient-to-br from-zinc-50 to-slate-50 border-zinc-100/50'
                        : 'bg-gradient-to-br from-blue-50 to-slate-50 border-blue-100/50'
                }`}
            >
                <div className="flex items-center gap-2">
                    <motion.span 
                        className={`text-3xl font-bold ${stats.grade === 0 ? 'text-zinc-400' : 'text-blue-600'}`}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                    >
                        {gradeLetter}
                    </motion.span>
                    <div className="flex items-center gap-1">
                        <span className={`text-lg font-semibold ${stats.grade === 0 ? 'text-zinc-400' : 'text-zinc-700'}`}>{stats.grade}%</span>
                        <TrendArrow trend={stats.gradeTrend} />
                    </div>
                </div>
                <p className={`text-[11px] font-medium uppercase tracking-wide mt-2 ${stats.grade === 0 ? 'text-zinc-400' : 'text-blue-500'}`}>Current Grade</p>
            </motion.div>

            {/* Attendance */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: 0.15 }}
                whileHover={{ scale: 1.02 }}
                className={`rounded-xl p-4 cursor-pointer transition-shadow hover:shadow-md border ${
                    stats.attendance === 0 
                        ? 'bg-gradient-to-br from-zinc-50 to-slate-50 border-zinc-100/50'
                        : 'bg-gradient-to-br from-blue-50 to-slate-50 border-blue-100/50'
                }`}
            >
                <div className="flex items-center gap-2">
                    <motion.span 
                        className={`text-3xl font-bold ${stats.attendance === 0 ? 'text-zinc-400' : 'text-blue-600'}`}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.25, type: 'spring', stiffness: 300 }}
                    >
                        {stats.attendance}%
                    </motion.span>
                </div>
                <p className={`text-[11px] font-medium uppercase tracking-wide mt-2 ${stats.attendance === 0 ? 'text-zinc-400' : 'text-blue-500'}`}>Attendance</p>
            </motion.div>

            {/* Next Deadline */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: 0.2 }}
                whileHover={{ scale: 1.02 }}
                className={`rounded-xl p-4 cursor-pointer transition-shadow hover:shadow-md border ${
                    stats.nextDeadline.days === 0
                        ? 'bg-gradient-to-br from-zinc-50 to-slate-50 border-zinc-100/50'
                        : stats.nextDeadline.days <= 2 
                            ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-100/50' 
                            : 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-100/50'
                }`}
            >
                <div className="flex items-center gap-2">
                    <motion.span 
                        className={`text-2xl font-bold ${
                            stats.nextDeadline.days === 0 ? 'text-zinc-400' :
                            stats.nextDeadline.days <= 2 ? 'text-red-600' : 'text-yellow-600'
                        }`}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
                    >
                        {stats.nextDeadline.days === 0 ? '-' : stats.nextDeadline.days}
                    </motion.span>
                    {stats.nextDeadline.days > 0 && (
                        <span className={`text-sm font-medium ${stats.nextDeadline.days <= 2 ? 'text-red-500' : 'text-yellow-500'}`}>days</span>
                    )}
                </div>
                <p className={`text-[11px] font-medium uppercase tracking-wide mt-2 ${
                    stats.nextDeadline.days === 0 ? 'text-zinc-500' :
                    stats.nextDeadline.days <= 2 ? 'text-red-500' : 'text-yellow-600'
                }`}>Next Deadline</p>
            </motion.div>

            {/* Announcements */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: 0.25 }}
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-xl p-4 cursor-pointer transition-shadow hover:shadow-md border border-blue-100/50"
            >
                <div className="flex items-center gap-2">
                    <motion.span 
                        className="text-3xl font-bold text-blue-600"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.35, type: 'spring', stiffness: 300 }}
                    >
                        {stats.unreadNews}
                    </motion.span>
                    {stats.unreadNews > 0 && (
                        <motion.span 
                            className="w-2 h-2 rounded-full bg-blue-500"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                    )}
                </div>
                <p className="text-[11px] font-medium text-blue-500 uppercase tracking-wide mt-2">Unread News</p>
            </motion.div>
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
}> = ({ value, onChange, placeholder = 'Search...', resultCount, totalCount }) => {
    const [isFocused, setIsFocused] = useState(false);
    
    return (
        <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="relative"
        >
            <motion.div
                className={`relative flex items-center rounded-xl border bg-white transition-all duration-200 ${
                    isFocused ? 'border-blue-300 shadow-sm ring-2 ring-blue-500/10' : 'border-zinc-200'
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
                    className="w-full h-10 pl-10 pr-20 text-sm rounded-xl bg-transparent placeholder-zinc-400 focus:outline-none"
                />
                <AnimatePresence>
                    {value && (
                        <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="absolute right-3 flex items-center gap-2"
                        >
                            {resultCount !== undefined && totalCount !== undefined && (
                                <span className="text-xs text-zinc-400">
                                    {resultCount}/{totalCount}
                                </span>
                            )}
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => onChange('')}
                                className="w-5 h-5 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors"
                            >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-zinc-500">
                                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                                </svg>
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
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
                    className={`absolute z-50 pointer-events-none transition-all duration-150 ${
                        isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
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

// Reusable Actions Dropdown Component - Minimalistic design matching CourseCard style
const ActionsDropdown: React.FC<{ activeTab: TabType }> = ({ activeTab }) => {
    const [isOpen, setIsOpen] = useState(false);
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
            className="relative flex-shrink-0"
        >
            {/* Trigger Button - Blue Style */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.1 }}
                className="h-10 px-4 text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-500/20 hover:from-blue-600 hover:to-blue-700"
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="19" cy="12" r="1" />
                    <circle cx="5" cy="12" r="1" />
                </svg>
                Actions
                <motion.div
                    animate={{ 
                        rotate: isOpen ? 180 : 0
                    }}
                    transition={{ 
                        duration: 0.2, 
                        ease: [0.4, 0, 0.2, 1]
                    }}
                    className="flex items-center justify-center"
                >
                    <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                    >
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </motion.div>
            </motion.button>

            {/* Dropdown Menu - Minimalistic Design */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute top-full right-0 mt-2 w-48 z-50"
                    >
                        <div className="bg-white rounded-xl border border-zinc-100 shadow-lg shadow-zinc-900/5 overflow-hidden">
                            {/* Actions List */}
                            <div className="py-1.5">
                                {actions.map((action, index) => (
                                    <motion.button
                                        key={action.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: index * 0.03 }}
                                        onClick={() => handleAction(action.id)}
                                        whileHover={{ x: 2 }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-zinc-600 hover:text-zinc-900 transition-colors group"
                                    >
                                        <div className="w-7 h-7 rounded-lg bg-zinc-50 group-hover:bg-zinc-100 flex items-center justify-center transition-colors">
                                            <div className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600 transition-colors">
                                                {action.icon}
                                            </div>
                                        </div>
                                        <span className="font-medium">{action.label}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
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
    const [activeTab, setActiveTab] = useState<TabType>('modules');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const modulesScrollRef = useRef<HTMLDivElement>(null);
    const tasksScrollRef = useRef<HTMLDivElement>(null);
    const studentsScrollRef = useRef<HTMLDivElement>(null);
    const submissionsScrollRef = useRef<HTMLDivElement>(null);
    
    const [taskFilter, setTaskFilter] = useState<TaskCategory>('all');
    const [studentFilter, setStudentFilter] = useState<'all' | 'online' | 'offline'>('all');
    
    // Teacher Mode State - persist across page refreshes
    const [isTeacherMode, setIsTeacherMode] = useState(() => {
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

    // Persist teacher mode state to sessionStorage
    useEffect(() => {
        sessionStorage.setItem('teacher_mode_active', isTeacherMode.toString());
    }, [isTeacherMode]);

    // Persist teacher tab to sessionStorage
    useEffect(() => {
        sessionStorage.setItem('teacher_mode_tab', teacherTab);
    }, [teacherTab]);

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
    const courseTasks = courseData.tasks;

    // Filtered data based on search
    const filteredModules = useMemo(() => 
        courseModules.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase())),
        [searchQuery, courseModules]
    );

    // Filtered tasks based on search and category
    const filteredTasks = useMemo(() => 
        courseTasks.filter(t => {
            const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = taskFilter === 'all' || t.category === taskFilter;
            return matchesSearch && matchesCategory;
        }),
        [searchQuery, taskFilter, courseTasks]
    );

    const filteredNews = useMemo(() => 
        SAMPLE_NEWS.filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase())),
        [searchQuery]
    );

    // Get students data (with demo mode support)
    const studentsData = useMemo(() => getStudentsData(), []);
    
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const teachersData = useMemo(() => getTeachersData(course.id), [course.id]);
    
    // Get AI grading data for this course (with demo mode support)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const aiGradingData = useMemo(() => getAIGradingData(course.id), [course.id]);

    // Handle wheel scroll to horizontal scroll for modules - snap to cards
    useEffect(() => {
        const modulesContainer = modulesScrollRef.current;
        if (!modulesContainer || activeTab !== 'modules' || isLoading) return;
        
        const handleWheel = (e: WheelEvent) => {
            // Prevent default vertical scroll behavior
            e.preventDefault();
            // Stop event from bubbling up to parent containers
            e.stopPropagation();
            
            // Card width (w-72 = 288px) + gap (gap-4 = 16px) = 304px per card
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
        
        // Use passive: false to allow preventDefault
        modulesContainer.addEventListener('wheel', handleWheel, { passive: false });
        
        return () => {
            modulesContainer.removeEventListener('wheel', handleWheel);
        };
    }, [activeTab, isLoading, filteredModules.length]);

    // Handle wheel scroll to horizontal scroll for tasks - snap to cards
    useEffect(() => {
        const tasksContainer = tasksScrollRef.current;
        if (!tasksContainer || activeTab !== 'assignments' || isLoading) return;
        
        const handleWheel = (e: WheelEvent) => {
            // Prevent default vertical scroll behavior
            e.preventDefault();
            // Stop event from bubbling up to parent containers
            e.stopPropagation();
            
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
        
        // Use passive: false to allow preventDefault
        tasksContainer.addEventListener('wheel', handleWheel, { passive: false });
        
        return () => {
            tasksContainer.removeEventListener('wheel', handleWheel);
        };
    }, [activeTab, isLoading, filteredTasks.length]);

    // Handle wheel scroll to horizontal scroll for students - snap to cards
    useEffect(() => {
        const studentsContainer = studentsScrollRef.current;
        if (!studentsContainer || activeTab !== 'students' || isLoading) return;
        
        const handleWheel = (e: WheelEvent) => {
            // Prevent default vertical scroll behavior
            e.preventDefault();
            // Stop event from bubbling up to parent containers
            e.stopPropagation();
            
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
        
        // Use passive: false to allow preventDefault
        studentsContainer.addEventListener('wheel', handleWheel, { passive: false });
        
        return () => {
            studentsContainer.removeEventListener('wheel', handleWheel);
        };
    }, [activeTab, isLoading, filteredStudents.length]);

    // Handle wheel scroll to horizontal scroll for submissions in teacher mode - snap to cards
    useEffect(() => {
        const submissionsContainer = submissionsScrollRef.current;
        if (!submissionsContainer || !isTeacherMode || teacherTab !== 'grade-students') return;
        
        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            e.stopPropagation();
            
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
        
        submissionsContainer.addEventListener('wheel', handleWheel, { passive: false });
        
        return () => {
            submissionsContainer.removeEventListener('wheel', handleWheel);
        };
    }, [isTeacherMode, teacherTab, submissions.length, yearLevelFilter, sectionFilter]);

    // Handle wheel scroll for teacher manage-tasks cards
    useEffect(() => {
        const tasksContainer = tasksScrollRef.current;
        if (!tasksContainer || !isTeacherMode || teacherTab !== 'manage-tasks') return;
        
        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            e.stopPropagation();
            
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
        
        tasksContainer.addEventListener('wheel', handleWheel, { passive: false });
        
        return () => {
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
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
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
                                description={searchQuery ? `No modules match "${searchQuery}"` : "This course doesn't have any modules yet"}
                                action={searchQuery ? { label: 'Clear search', onClick: () => setSearchQuery('') } : undefined}
                            />
                        ) : (
                            <div 
                                ref={modulesScrollRef}
                                className="flex gap-4 overflow-x-auto pt-1 pb-4 -mx-1 px-1 snap-x snap-mandatory scroll-smooth"
                            >
                                {filteredModules.map((module, index) => {
                                    const completedContents = module.contents.filter(c => c.completed).length;
                                    const progressPercent = module.contents.length > 0 ? Math.round((completedContents / module.contents.length) * 100) : 0;
                                    
                                    return (
                                        <motion.div
                                            key={module.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
                                            whileHover={{ y: -4, transition: { duration: 0.15 } }}
                                            className={`group flex-shrink-0 w-80 rounded-xl border overflow-hidden cursor-pointer transition-all snap-start ${
                                                module.status === 'locked' 
                                                    ? 'bg-zinc-50/50 border-zinc-100 opacity-60' 
                                                    : 'bg-white border-zinc-100 hover:border-blue-200 hover:shadow-lg'
                                            }`}
                                        >
                                            {/* Module Header with gradient */}
                                            <div className={`p-4 ${
                                                module.status === 'completed' ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/50' :
                                                module.status === 'in-progress' ? 'bg-gradient-to-br from-blue-50 to-blue-100/50' : 
                                                'bg-gradient-to-br from-zinc-50 to-zinc-100/50'
                                            }`}>
                                                <div className="flex items-start justify-between mb-3">
                                                    <motion.div 
                                                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                                            module.status === 'completed' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' :
                                                            module.status === 'in-progress' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 
                                                            'bg-zinc-300 text-white'
                                                        }`}
                                                        whileHover={{ scale: 1.05 }}
                                                    >
                                                        {module.status === 'completed' ? (
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                        ) : module.status === 'in-progress' ? (
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                                                        ) : (
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                                        )}
                                                    </motion.div>
                                                    {module.status === 'in-progress' && (
                                                        <span className="px-2 py-1 text-[9px] font-semibold bg-blue-500 text-white rounded-full uppercase tracking-wide">
                                                            Continue
                                                        </span>
                                                    )}
                                                    {module.status === 'completed' && (
                                                        <span className="px-2 py-1 text-[9px] font-semibold bg-emerald-500 text-white rounded-full uppercase tracking-wide">
                                                            Done
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm font-bold text-zinc-800 line-clamp-2 mb-2">{module.title}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-zinc-500">{completedContents}/{module.contents.length} items</span>
                                                </div>
                                            </div>
                                            
                                            {/* Progress & Content Preview */}
                                            <div className="p-4 bg-white">
                                                {/* Progress Bar */}
                                                <div className="mb-3">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Progress</span>
                                                        <span className={`text-[10px] font-bold ${progressPercent === 100 ? 'text-emerald-600' : 'text-blue-600'}`}>
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
                                                
                                                {/* Content Type Icons - Interactive */}
                                                <div className="flex items-center justify-center gap-2">
                                                    {module.contents.slice(0, 4).map((content, cIndex) => {
                                                        const config = CONTENT_TYPE_CONFIG[content.type];
                                                        const colorClasses: Record<string, { base: string; hover: string }> = {
                                                            blue: { 
                                                                base: content.completed ? 'bg-blue-100 text-blue-600' : 'bg-zinc-100 text-zinc-400',
                                                                hover: content.completed ? 'hover:bg-blue-200 hover:text-blue-700' : 'hover:bg-zinc-200 hover:text-zinc-600'
                                                            },
                                                            indigo: { 
                                                                base: content.completed ? 'bg-indigo-100 text-indigo-600' : 'bg-zinc-100 text-zinc-400',
                                                                hover: content.completed ? 'hover:bg-indigo-200 hover:text-indigo-700' : 'hover:bg-zinc-200 hover:text-zinc-600'
                                                            },
                                                            amber: { 
                                                                base: content.completed ? 'bg-amber-100 text-amber-600' : 'bg-zinc-100 text-zinc-400',
                                                                hover: content.completed ? 'hover:bg-amber-200 hover:text-amber-700' : 'hover:bg-zinc-200 hover:text-zinc-600'
                                                            },
                                                            rose: { 
                                                                base: content.completed ? 'bg-rose-100 text-rose-600' : 'bg-zinc-100 text-zinc-400',
                                                                hover: content.completed ? 'hover:bg-rose-200 hover:text-rose-700' : 'hover:bg-zinc-200 hover:text-zinc-600'
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
                                                        <motion.span 
                                                            className="text-[11px] text-zinc-400 font-medium ml-1 px-2 py-1 bg-zinc-50 rounded-lg"
                                                            whileHover={{ scale: 1.05 }}
                                                        >
                                                            +{module.contents.length - 4}
                                                        </motion.span>
                                                    )}
                                                </div>
                                                
                                                {/* Action Button */}
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    className={`w-full mt-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                                                        module.status === 'locked' 
                                                            ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                                                            : module.status === 'completed'
                                                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                                    }`}
                                                    disabled={module.status === 'locked'}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {module.status === 'locked' ? 'Locked' : module.status === 'completed' ? 'Review' : 'Continue'}
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
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
                    if (cat === 'all') return courseTasks.length;
                    return courseTasks.filter((t: { category: TaskCategory }) => t.category === cat).length;
                };
                
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                        {/* Task Category Filter */}
                        <motion.div 
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1"
                        >
                            {TASK_CATEGORIES.map((cat, index) => {
                                const count = getTaskCategoryCount(cat.id);
                                const isActive = taskFilter === cat.id;
                                const colorClasses: Record<string, { active: string; inactive: string }> = {
                                    zinc: { active: 'bg-zinc-800 text-white', inactive: 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300' },
                                    emerald: { active: 'bg-emerald-500 text-white', inactive: 'bg-white text-emerald-600 border-emerald-200 hover:border-emerald-300' },
                                    purple: { active: 'bg-purple-500 text-white', inactive: 'bg-white text-purple-600 border-purple-200 hover:border-purple-300' },
                                    amber: { active: 'bg-amber-500 text-white', inactive: 'bg-white text-amber-600 border-amber-200 hover:border-amber-300' },
                                    rose: { active: 'bg-rose-500 text-white', inactive: 'bg-white text-rose-600 border-rose-200 hover:border-rose-300' },
                                    cyan: { active: 'bg-cyan-500 text-white', inactive: 'bg-white text-cyan-600 border-cyan-200 hover:border-cyan-300' },
                                };
                                
                                return (
                                    <motion.button
                                        key={cat.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.03 }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setTaskFilter(cat.id)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex-shrink-0 ${
                                            isActive ? colorClasses[cat.color].active : colorClasses[cat.color].inactive
                                        }`}
                                    >
                                        <span className={isActive ? 'opacity-100' : 'opacity-70'}>{cat.icon}</span>
                                        <span>{cat.label}</span>
                                        {count > 0 && (
                                            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                                                isActive ? 'bg-white/20' : 'bg-zinc-100'
                                            }`}>
                                                {count}
                                            </span>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </motion.div>
                        
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
                                className="flex gap-3 overflow-x-auto pt-1 pb-4 -mx-1 px-1 snap-x snap-mandatory scroll-smooth"
                            >
                                {filteredTasks.map((task, index) => {
                                    const categoryConfig = TASK_CATEGORIES.find(c => c.id === task.category);
                                    const categoryColors: Record<string, string> = {
                                        assignment: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                                        performance: 'bg-purple-50 text-purple-600 border-purple-100',
                                        quiz: 'bg-amber-50 text-amber-600 border-amber-100',
                                        practical: 'bg-rose-50 text-rose-600 border-rose-100',
                                        journal: 'bg-cyan-50 text-cyan-600 border-cyan-100',
                                    };
                                    
                                    return (
                                        <motion.div
                                            key={task.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
                                            whileHover={{ y: -4, transition: { duration: 0.15 } }}
                                            className="group flex-shrink-0 w-56 p-4 rounded-xl border border-zinc-100 bg-white hover:border-blue-200 hover:shadow-lg cursor-pointer transition-all snap-start"
                                        >
                                            <div className="flex flex-col h-full">
                                                {/* Category & Status */}
                                                <div className="flex items-start justify-between mb-3">
                                                    <span className={`px-2 py-1 text-[9px] font-semibold rounded-lg border ${categoryColors[task.category] || 'bg-zinc-50 text-zinc-600 border-zinc-100'}`}>
                                                        {categoryConfig?.label.replace('s', '').toUpperCase()}
                                                    </span>
                                                    <span className={`text-[9px] font-semibold px-2 py-1 rounded-full uppercase tracking-wide ${
                                                        task.status === 'submitted' ? 'bg-emerald-100 text-emerald-700' :
                                                        task.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-zinc-100 text-zinc-600'
                                                    }`}>
                                                        {task.status === 'submitted' ? 'Done' : task.status === 'pending' ? 'Pending' : 'Upcoming'}
                                                    </span>
                                                </div>
                                                
                                                {/* Title */}
                                                <p className="text-sm font-semibold text-zinc-800 line-clamp-2 mb-1">{task.title}</p>
                                                
                                                {/* Due Date */}
                                                <p className="text-xs text-zinc-500 mb-3">Due: {task.due}</p>
                                                
                                                {/* Score or Action */}
                                                <div className="mt-auto">
                                                    {task.score ? (
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Score</span>
                                                            <span className="text-sm font-bold text-blue-600">{task.score}</span>
                                                        </div>
                                                    ) : (
                                                        <motion.button
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            className="w-full py-2 text-[10px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {task.status === 'pending' ? 'Submit Now' : 'View Details'}
                                                        </motion.button>
                                                    )}
                                                </div>
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
                                        className={`group flex-shrink-0 w-64 p-4 rounded-xl border bg-white hover:shadow-lg cursor-pointer transition-all snap-start ${
                                            news.unread ? 'border-blue-200 bg-gradient-to-br from-blue-50/50 to-white' : 'border-zinc-100 hover:border-blue-200'
                                        }`}
                                    >
                                        <div className="flex flex-col h-full">
                                            {/* Header with unread indicator */}
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                        news.unread ? 'bg-blue-100 text-blue-600' : 'bg-zinc-100 text-zinc-500'
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
                if (isLoading) {
                    return (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="mb-4 p-3 bg-zinc-50 rounded-xl animate-pulse">
                                <div className="h-4 bg-zinc-200 rounded w-1/3 mb-2" />
                                <div className="h-3 bg-zinc-100 rounded w-1/4" />
                            </div>
                            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                                {[0, 1, 2, 3, 4].map((i) => (
                                    <motion.div 
                                        key={i}
                                        className="flex-shrink-0 w-40 h-48 bg-zinc-100 rounded-xl"
                                        animate={{ opacity: [0.5, 0.8, 0.5] }}
                                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    );
                }
                
                const onlineCount = studentsData.filter((s: { status: string }) => s.status === 'online').length;
                const offlineCount = studentsData.filter((s: { status: string }) => s.status === 'offline').length;
                
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        {/* Stats Header */}
                        <motion.div 
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-4 p-4 bg-gradient-to-br from-zinc-50 to-white rounded-xl border border-zinc-100"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-zinc-700">Section: BSIT101-A</p>
                                    <p className="text-xs text-zinc-500 mt-0.5">
                                        {filteredStudents.length} {filteredStudents.length === 1 ? 'student' : 'students'} {searchQuery || studentFilter !== 'all' ? 'found' : 'enrolled'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <span>{onlineCount} online</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                                        <span className="w-2 h-2 rounded-full bg-zinc-300" />
                                        <span>{offlineCount} offline</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                        
                        {/* Filter Tabs */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="flex gap-2 mb-4"
                        >
                            {(['all', 'online', 'offline'] as const).map((filter) => (
                                <motion.button
                                    key={filter}
                                    onClick={() => setStudentFilter(filter)}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                                        studentFilter === filter 
                                            ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                                            : 'bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-300'
                                    }`}
                                >
                                    {filter === 'all' ? 'All' : filter === 'online' ? '🟢 Online' : '⚪ Offline'}
                                </motion.button>
                            ))}
                        </motion.div>
                        
                        {filteredStudents.length === 0 ? (
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
                        ) : (
                            <div 
                                ref={studentsScrollRef}
                                className="flex gap-4 overflow-x-auto pt-1 pb-4 -mx-1 px-1 snap-x snap-mandatory scroll-smooth"
                            >
                                {filteredStudents.map((student: { id: number; name: string; status: string; role: string; email: string; grade?: number; attendance?: number; submissions?: number; aiGraded?: boolean }, index: number) => (
                                    <motion.div
                                        key={student.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.03, type: 'spring', stiffness: 300, damping: 25 }}
                                        whileHover={{ y: -6, transition: { duration: 0.2 } }}
                                        className="group flex-shrink-0 w-44 p-5 rounded-2xl bg-white border border-zinc-100 hover:border-blue-200 hover:shadow-xl cursor-pointer transition-all snap-start"
                                    >
                                        {/* Avatar - Circular */}
                                        <div className="flex flex-col items-center">
                                            <motion.div 
                                                className="relative mb-4"
                                                whileHover={{ scale: 1.08, rotate: 3 }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                            >
                                                <div className="w-18 h-18 w-[72px] h-[72px] rounded-full bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-500/30 ring-4 ring-white">
                                                    {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                </div>
                                                <motion.div 
                                                    className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-3 border-white shadow-sm ${
                                                        student.status === 'online' ? 'bg-emerald-500' : 'bg-zinc-300'
                                                    }`}
                                                    animate={student.status === 'online' ? { scale: [1, 1.15, 1] } : {}}
                                                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                                />
                                            </motion.div>
                                            
                                            {/* Info - Centered */}
                                            <div className="text-center w-full">
                                                <motion.p 
                                                    className="text-sm font-bold text-zinc-800 truncate"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: index * 0.03 + 0.1 }}
                                                >
                                                    {student.name}
                                                </motion.p>
                                                <p className="text-[10px] text-zinc-400 truncate mt-1">{student.role}</p>
                                                <p className="text-[9px] text-zinc-400 truncate mt-0.5">{student.email}</p>
                                                
                                                {/* Status Badge */}
                                                <motion.span 
                                                    className={`inline-flex items-center gap-1 mt-3 px-2.5 py-1 text-[10px] font-semibold rounded-full ${
                                                        student.status === 'online' 
                                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                                            : 'bg-zinc-50 text-zinc-500 border border-zinc-100'
                                                    }`}
                                                    whileHover={{ scale: 1.05 }}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full ${student.status === 'online' ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                                                    {student.status === 'online' ? 'Online' : 'Offline'}
                                                </motion.span>
                                            </div>
                                            
                                            {/* Action Buttons */}
                                            <div className="flex gap-2 mt-4 w-full">
                                                <motion.button
                                                    whileHover={{ scale: 1.05, y: -1 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    transition={{ duration: 0.1 }}
                                                    className="flex-1 py-2 px-2 text-[10px] font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg transition-all shadow-sm shadow-blue-500/20 flex items-center justify-center gap-1"
                                                    onClick={(e) => { e.stopPropagation(); }}
                                                >
                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                                    </svg>
                                                    Chat
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.05, y: -1 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    transition={{ duration: 0.1 }}
                                                    className="py-2 px-2.5 text-[10px] font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors flex items-center justify-center"
                                                    onClick={(e) => { e.stopPropagation(); }}
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                        <circle cx="12" cy="12" r="1" />
                                                        <circle cx="19" cy="12" r="1" />
                                                        <circle cx="5" cy="12" r="1" />
                                                    </svg>
                                                </motion.button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                );

            case 'teachers':
                if (isLoading) {
                    return (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 rounded-xl border border-zinc-100 bg-white">
                            <div className="flex items-center gap-4">
                                <motion.div 
                                    className="w-16 h-16 rounded-xl bg-zinc-100"
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
                                    <motion.div 
                                        className="h-3 bg-zinc-100 rounded-md w-1/2"
                                        animate={{ opacity: [0.4, 0.6, 0.4] }}
                                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                                    />
                                </div>
                            </div>
                            <div className="mt-5 pt-4 border-t border-zinc-100 flex gap-3">
                                <motion.div 
                                    className="flex-1 h-10 bg-zinc-100 rounded-xl"
                                    animate={{ opacity: [0.4, 0.6, 0.4] }}
                                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                                />
                                <motion.div 
                                    className="flex-1 h-10 bg-zinc-100 rounded-xl"
                                    animate={{ opacity: [0.4, 0.6, 0.4] }}
                                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                                />
                            </div>
                        </motion.div>
                    );
                }
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            whileHover={{ y: -2 }}
                            className="relative overflow-hidden p-6 rounded-2xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all"
                        >
                            {/* Decorative Background Elements */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-500/5 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />
                            
                            {/* Actions Dropdown - Top Right of Card */}
                            <div className="absolute top-4 right-4 z-10">
                                <ActionsDropdown activeTab={activeTab} />
                            </div>
                            
                            <div className="relative flex items-start gap-5">
                                {/* Avatar - Circular with Ring */}
                                <motion.div 
                                    className="relative flex-shrink-0"
                                    whileHover={{ scale: 1.05, rotate: 3 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                >
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-blue-500/30 ring-4 ring-white">
                                        {instructor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </div>
                                    <motion.div 
                                        className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-3 border-white shadow-lg flex items-center justify-center"
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </motion.div>
                                </motion.div>
                                
                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <motion.p 
                                            className="text-lg font-bold text-zinc-800"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1 }}
                                        >
                                            {instructor.name}
                                        </motion.p>
                                        <motion.span 
                                            className="px-2 py-0.5 text-[9px] font-bold bg-blue-100 text-blue-700 rounded-full uppercase tracking-wide"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            Instructor
                                        </motion.span>
                                    </div>
                                    <motion.p 
                                        className="text-sm text-zinc-500 mb-2"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.15 }}
                                    >
                                        {instructor.title} · Computer Science Department
                                    </motion.p>
                                    <motion.a 
                                        href={`mailto:${instructor.email}`}
                                        className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
                                        whileHover={{ x: 3 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                            <rect x="2" y="4" width="20" height="16" rx="2" />
                                            <path d="M22 6l-10 7L2 6" />
                                        </svg>
                                        {instructor.email}
                                    </motion.a>
                                    
                                    {/* Quick Stats */}
                                    <motion.div 
                                        className="flex items-center gap-4 mt-3"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.25 }}
                                    >
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
                                    </motion.div>
                                </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <motion.div 
                                className="relative mt-5 pt-5 border-t border-blue-100/50 flex gap-3"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <motion.button 
                                    whileHover={{ scale: 1.02, y: -2 }} 
                                    whileTap={{ scale: 0.98 }}
                                    transition={{ duration: 0.1 }}
                                    className="flex-1 py-3 px-4 text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                    </svg>
                                    Send Message
                                </motion.button>
                                <motion.button 
                                    whileHover={{ scale: 1.02, y: -2 }} 
                                    whileTap={{ scale: 0.98 }}
                                    transition={{ duration: 0.1 }}
                                    className="flex-1 py-3 px-4 text-xs font-semibold text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-zinc-300 rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                        <line x1="16" y1="2" x2="16" y2="6" />
                                        <line x1="8" y1="2" x2="8" y2="6" />
                                        <line x1="3" y1="10" x2="21" y2="10" />
                                    </svg>
                                    Schedule Meeting
                                </motion.button>
                                <motion.button 
                                    whileHover={{ scale: 1.05, y: -2 }} 
                                    whileTap={{ scale: 0.95 }}
                                    transition={{ duration: 0.1 }}
                                    className="py-3 px-4 text-xs font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-all flex items-center justify-center"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                </motion.button>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                );
        }
    };


    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col bg-zinc-50">
            {/* Header */}
            <div className="bg-white border-b border-zinc-200 px-6 py-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onBack}
                            className="w-8 h-8 rounded-xl bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                        </motion.button>
                        <div className="flex items-center gap-3">
                            <img src={course.image} alt="" className="w-10 h-10 rounded-xl object-cover" />
                            <div>
                                <h1 className="text-base font-semibold text-zinc-800">{displayTitle}</h1>
                                <p className="text-xs text-zinc-500">{courseCode} · BSIT101-A</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Teacher Mode Toggle Button */}
                    <div className="relative group">
                        <motion.button
                            onClick={() => setIsTeacherMode(!isTeacherMode)}
                            whileHover={{ scale: 1.02, y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl shadow-sm transition-colors ${
                                isTeacherMode 
                                    ? 'text-blue-600 bg-yellow-400 shadow-yellow-400/25' 
                                    : 'text-yellow-400 bg-blue-600 shadow-blue-600/25'
                            }`}
                        >
                            <svg 
                                width="14" 
                                height="14" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                            >
                                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                                <path d="M6 12v5c3 3 9 3 12 0v-5" />
                            </svg>
                            {isTeacherMode ? 'Student View' : 'Teacher Mode'}
                        </motion.button>
                        
                        {/* Minimalistic Tooltip */}
                        <div className="absolute top-full right-0 mt-3 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200 ease-out pointer-events-none z-50">
                            <div className="relative bg-white border border-blue-200 rounded-lg px-3 py-1.5 shadow-sm whitespace-nowrap">
                                <p className="text-[11px] font-medium text-blue-600">
                                    {isTeacherMode ? 'Switch to Student View' : 'Switch to Teacher View'}
                                </p>
                                <div className="absolute -top-[5px] right-5 w-2 h-2 bg-white border-l border-t border-blue-200 transform rotate-45" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress Bar - Only show in Student View */}
                {!isTeacherMode && (
                    <div className="mt-4">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-zinc-500">Course Progress</span>
                            <span className="text-xs font-medium text-zinc-700">{course.progress}%</span>
                        </div>
                        <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${course.progress}%` }}
                                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                className={`h-full rounded-full ${course.progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Stats Bar - Only show in Student View */}
            {!isTeacherMode && <QuickStatsBar courseId={course.id} />}

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
                                                    { value: 'all', label: 'All Years', icon: (
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                                                            <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                                                        </svg>
                                                    )},
                                                    { value: '1st', label: '1st Year', icon: <span className="text-[11px] font-bold text-blue-600">1</span> },
                                                    { value: '2nd', label: '2nd Year', icon: <span className="text-[11px] font-bold text-blue-600">2</span> },
                                                    { value: '3rd', label: '3rd Year', icon: <span className="text-[11px] font-bold text-blue-600">3</span> },
                                                    { value: '4th', label: '4th Year', icon: <span className="text-[11px] font-bold text-blue-600">4</span> },
                                                ].map((option) => (
                                                    <motion.button
                                                        key={option.value}
                                                        onClick={() => { setYearLevelFilter(option.value as YearLevel); setShowYearDropdown(false); }}
                                                        className={`w-full px-3 py-2.5 text-[11px] font-medium flex items-center gap-2.5 transition-colors ${
                                                            yearLevelFilter === option.value 
                                                                ? 'bg-blue-50 text-blue-600' 
                                                                : 'text-zinc-700 hover:bg-zinc-50'
                                                        }`}
                                                        whileHover={{ x: 2 }}
                                                        transition={{ duration: 0.1 }}
                                                    >
                                                        <span className={`w-5 h-5 rounded-md flex items-center justify-center ${
                                                            yearLevelFilter === option.value ? 'bg-blue-100' : 'bg-zinc-100'
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
                                                    { value: 'all', label: 'All Sections', icon: (
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                                                            <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                                                        </svg>
                                                    )},
                                                    { value: 'A', label: 'Section A', icon: <span className="text-[11px] font-bold text-blue-600">A</span> },
                                                    { value: 'B', label: 'Section B', icon: <span className="text-[11px] font-bold text-blue-600">B</span> },
                                                    { value: 'C', label: 'Section C', icon: <span className="text-[11px] font-bold text-blue-600">C</span> },
                                                    { value: 'D', label: 'Section D', icon: <span className="text-[11px] font-bold text-blue-600">D</span> },
                                                ].map((option) => (
                                                    <motion.button
                                                        key={option.value}
                                                        onClick={() => { setSectionFilter(option.value as Section); setShowSectionDropdown(false); }}
                                                        className={`w-full px-3 py-2.5 text-[11px] font-medium flex items-center gap-2.5 transition-colors ${
                                                            sectionFilter === option.value 
                                                                ? 'bg-blue-50 text-blue-600' 
                                                                : 'text-zinc-700 hover:bg-zinc-50'
                                                        }`}
                                                        whileHover={{ x: 2 }}
                                                        transition={{ duration: 0.1 }}
                                                    >
                                                        <span className={`w-5 h-5 rounded-md flex items-center justify-center ${
                                                            sectionFilter === option.value ? 'bg-blue-100' : 'bg-zinc-100'
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
            <div className="bg-white border-b border-zinc-200 px-6">
                <div className="teacher-tabs flex gap-1 overflow-x-auto py-2">
                    {isTeacherMode ? (
                        // Teacher Mode Tabs
                        <>
                            {[
                                { id: 'manage-tasks' as TeacherTabType, label: 'Manage Tasks', icon: (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <path d="M14 2v6h6" /><path d="M12 18v-6" /><path d="M9 15h6" />
                                    </svg>
                                )},
                                { id: 'grade-students' as TeacherTabType, label: 'Grade Students', icon: (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                    </svg>
                                )},
                                { id: 'analytics' as TeacherTabType, label: 'Analytics', icon: (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <path d="M3 3v18h18" /><path d="M7 16l4-4 4 4 5-6" />
                                    </svg>
                                )},
                            ].map((tab) => (
                                <motion.button
                                    key={tab.id}
                                    onClick={() => setTeacherTab(tab.id)}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                                        teacherTab === tab.id 
                                            ? 'bg-blue-600 text-yellow-400' 
                                            : 'text-zinc-500 hover:bg-blue-50 hover:text-blue-600'
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
                                onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                                    activeTab === tab.id ? 'bg-blue-50 text-blue-600' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'
                                }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </motion.button>
                        ))
                    )}
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
                                                className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-lg whitespace-nowrap ${
                                                    selectedTaskType === cat.id 
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
                                                <div className={`h-1.5 ${
                                                    task.category === 'assignment' ? 'bg-blue-500' :
                                                    task.category === 'quiz' ? 'bg-yellow-500' :
                                                    task.category === 'performance' ? 'bg-blue-600' :
                                                    task.category === 'practical' ? 'bg-blue-700' :
                                                    'bg-blue-400'
                                                }`} />
                                                
                                                <div className="p-4">
                                                    {/* Category Badge */}
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className={`px-2 py-0.5 text-[9px] font-semibold rounded-full uppercase tracking-wide ${
                                                            task.category === 'assignment' ? 'bg-blue-50 text-blue-600' :
                                                            task.category === 'quiz' ? 'bg-yellow-50 text-yellow-600' :
                                                            task.category === 'performance' ? 'bg-blue-50 text-blue-700' :
                                                            task.category === 'practical' ? 'bg-blue-50 text-blue-700' :
                                                            'bg-blue-50 text-blue-600'
                                                        }`}>
                                                            {task.category}
                                                        </span>
                                                        <span className={`text-[10px] font-medium ${
                                                            task.status === 'submitted' ? 'text-blue-600' :
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
                                                className={`flex items-center gap-2 px-3 py-2 text-[11px] font-medium rounded-lg transition-colors ${
                                                    isAiGrading 
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
                                                        className={`px-2.5 py-1 text-[10px] font-semibold rounded-full ${
                                                            submission.status === 'pending' ? 'bg-yellow-50 text-yellow-600' :
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
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110 ${
                                                    stat.color === 'blue' ? 'bg-blue-50' : 
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
                                                    <p className={`text-2xl font-bold ${
                                                        isNegativeTrend ? 'text-red-600' :
                                                        stat.color === 'blue' ? 'text-blue-600' : 
                                                        stat.color === 'yellow' ? 'text-yellow-600' : 'text-green-600'
                                                    }`}>
                                                        {stat.value}
                                                    </p>
                                                    {stat.trend && (
                                                        <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${
                                                            isNegativeTrend ? 'text-red-500' : 'text-green-500'
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
                                                            className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                                                                card.badge.color === 'blue' ? 'bg-blue-100 text-blue-600' :
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
                            className={`rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-full ${
                                isTeacherMode ? 'bg-zinc-900' : 'bg-white'
                            }`}
                        >
                            {/* Modal Header - Compact */}
                            <div className={`flex items-center justify-between px-5 py-4 border-b ${
                                isTeacherMode ? 'border-zinc-700' : 'border-zinc-100'
                            }`}>
                                <div>
                                    <h3 className={`text-base font-semibold ${isTeacherMode ? 'text-white' : 'text-zinc-800'}`}>Create Task</h3>
                                    <p className={`text-xs mt-0.5 ${isTeacherMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Add a new task for your students</p>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowAddTaskModal(false)}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                        isTeacherMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'
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
                                                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                                                    selectedTaskType === cat.id 
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
                                        className={`w-full h-10 px-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                                            isTeacherMode 
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
                                            className={`w-full h-10 px-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                                                isTeacherMode 
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
                                            className={`w-full h-10 px-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                                                isTeacherMode 
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
                                        className={`w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none ${
                                            isTeacherMode 
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
                                        className={`w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none ${
                                            isTeacherMode 
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
                                        className={`p-6 group/file block rounded-2xl w-full relative border-2 border-dashed transition-colors ${
                                            newTaskFiles.length === 0
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
                                                                className={`relative group-hover/file:shadow-xl z-40 flex items-center justify-center h-20 w-20 rounded-xl shadow-md ${
                                                                    isTeacherMode 
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
                                                                className={`relative overflow-hidden z-40 flex flex-col items-start justify-start p-3 w-full rounded-xl shadow-sm ${
                                                                    isTeacherMode 
                                                                        ? 'bg-zinc-800 border border-zinc-700' 
                                                                        : 'bg-white border border-gray-200'
                                                                }`}
                                                            >
                                                                <div className="flex justify-between w-full items-center gap-3">
                                                                    <p className={`text-sm font-medium truncate flex-1 min-w-0 ${isTeacherMode ? 'text-zinc-200' : 'text-gray-800'}`}>
                                                                        {file.name}
                                                                    </p>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`rounded-lg px-2 py-0.5 text-xs ${
                                                                            isTeacherMode 
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
                                                                            className={`p-1 rounded-full transition-colors ${
                                                                                isTeacherMode ? 'hover:bg-zinc-700' : 'hover:bg-gray-100'
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
                                                                className={`relative z-40 flex items-center p-3 w-full rounded-xl ${
                                                                    isTeacherMode 
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
                                                                                className={`w-7 h-7 rounded-lg flex items-center justify-center shadow-sm ${
                                                                                    isTeacherMode 
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
                                                        className={`w-full py-2.5 px-4 rounded-xl border-2 border-dashed text-sm font-medium hover:border-blue-400 hover:text-blue-500 transition-colors mt-1 ${
                                                            isTeacherMode 
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
                            <div className={`px-5 py-3 border-t flex items-center justify-end gap-2 ${
                                isTeacherMode ? 'border-zinc-700' : 'border-zinc-100'
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
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                        isTeacherMode 
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
                                                type: selectedTaskType === 'all' ? 'assignment' : selectedTaskType,
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
                                    className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all flex items-center gap-1.5 ${
                                        !newTaskTitle || !newTaskDueDate || isCreatingTask
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
                                    className={`w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center ${
                                        TEACHER_TUTORIAL_STEPS[tutorialStep].color === 'blue' ? 'bg-blue-100 text-blue-600' :
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
                                            className={`w-2 h-2 rounded-full transition-colors ${
                                                index === tutorialStep ? 'bg-blue-600' : 
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
                                        className={`flex-1 py-3 text-sm font-semibold text-white rounded-xl transition-colors flex items-center justify-center gap-2 ${
                                            tutorialStep === TEACHER_TUTORIAL_STEPS.length - 1
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
        </motion.div>
    );
};

export default CourseViewPage;
