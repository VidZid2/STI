/**
 * demoCourses.ts
 * Static demo/fallback course data for CourseViewPage.
 * Extracted from CourseViewPage.tsx during Phase 9.2 (Demo Data Quarantine).
 *
 * RULE: This data is ONLY used when Supabase is unconfigured or demo mode is active.
 * Real Supabase data always takes priority.
 */

import { isSupabaseConfigured } from '../../../../../lib/supabase';

export type ContentType = 'handout-a' | 'handout-b' | 'slideshow' | 'video';
export type TaskCategory = 'all' | 'assignment' | 'performance' | 'quiz' | 'practical' | 'journal' | 'overdue';

export interface CourseTask {
    id: string | number;
    title: string;
    due: string;
    status: string;
    score: string | number | null;
    category: TaskCategory;
    points?: number;
    dueDate?: string;
    description?: string;
    instructions?: string;
    allowLateSubmission?: boolean;
    latePenalty?: number;
    maxAttempts?: number;
    rubricEnabled?: boolean;
    prerequisiteAssignmentId?: string | null;
    rubricCriteria?: { id?: string; name: string; points: number; description?: string }[];
    submissionCount?: number;
    attachments?: { name: string; url: string; type?: string }[];
    _diffDays?: number;
}

export type CourseDataType = {
    modules: {
        id: number;
        title: string;
        status: string;
        term?: 'prelims' | 'midterm' | 'prefinals' | 'finals';
        semester?: 'first' | 'second';
        contents: { type: ContentType; title: string; completed: boolean }[];
    }[];
    tasks: { id: number; title: string; due: string; status: string; score: string | null; category: TaskCategory }[];
    instructor: { name: string; title: string; email: string };
};

/** Guard: true when Supabase is not configured OR demo mode is explicitly active */
export const IS_DEMO =
    !isSupabaseConfigured() || localStorage.getItem('demo-mode-active') === 'true';

export const COURSE_DATA: Record<string, CourseDataType> = {
    'cp1': {
        modules: [
            {
                id: 1, title: 'Module 1: Introduction to Programming', status: 'in-progress', term: 'prelims', semester: 'first', contents: [
                    { type: 'handout-a', title: 'Course Overview', completed: false },
                    { type: 'handout-b', title: 'Getting Started Guide', completed: false },
                    { type: 'slideshow', title: 'Introduction Slides', completed: false },
                    { type: 'video', title: 'Welcome Video', completed: false },
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
                    { type: 'handout-a', title: 'What is Euthenics?', completed: false },
                    { type: 'slideshow', title: 'Course Introduction', completed: false },
                    { type: 'video', title: 'Welcome to Euthenics', completed: false },
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
                    { type: 'handout-a', title: 'History of Computing', completed: false },
                    { type: 'slideshow', title: 'Computer Components', completed: false },
                    { type: 'video', title: 'Inside a Computer', completed: false },
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
                    { type: 'handout-a', title: 'NSTP Law & Guidelines', completed: false },
                    { type: 'slideshow', title: 'Program Introduction', completed: false },
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
                    { type: 'handout-a', title: 'Fitness Test Guide', completed: false },
                    { type: 'video', title: 'Proper Form Demo', completed: false },
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
                    { type: 'handout-a', title: 'What is Culture?', completed: false },
                    { type: 'slideshow', title: 'Cultural Elements', completed: false },
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
                    { type: 'handout-a', title: 'Elements of Communication', completed: false },
                    { type: 'slideshow', title: 'Communication Models', completed: false },
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
                    { type: 'handout-a', title: 'What is Globalization?', completed: false },
                    { type: 'slideshow', title: 'Global Interconnectedness', completed: false },
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
                    { type: 'handout-a', title: 'Philosophical Self', completed: false },
                    { type: 'slideshow', title: 'Who Am I?', completed: false },
                ]
            },
        ],
        tasks: [],
        instructor: { name: 'Claire Maurillo', title: 'Instructor', email: 'c.maurillo@university.edu' }
    } };

const DEFAULT_FALLBACK: CourseDataType = {
    modules: COURSE_DATA['cp1'].modules,
    tasks: [],
    instructor: { name: 'Instructor', title: 'Instructor', email: 'instructor@university.edu' } };

/** Returns course data. Supabase data takes priority; this is the explicit fallback. */
export const getDemoCourseData = (courseId: string): CourseDataType => {
    if (IS_DEMO) {
        try {
            const demoModulesData = localStorage.getItem('demo-course-modules');
            if (demoModulesData) {
                const demoModules = JSON.parse(demoModulesData) as Record<string, {
                    modules: { id: number; title: string; status: string; contents: { type: string; title: string; completed: boolean }[] }[];
                    tasks?: { id: number; title: string; due: string; status: string; score: string | null; category: string }[];
                }>;
                if (demoModules[courseId]) {
                    const baseData = COURSE_DATA[courseId] || DEFAULT_FALLBACK;
                    const typedModules = demoModules[courseId].modules.map(m => ({
                        ...m,
                        contents: m.contents.map(c => ({ ...c, type: c.type as ContentType }))
                    }));
                    const typedTasks = demoModules[courseId].tasks?.map(t => ({
                        ...t,
                        category: t.category as TaskCategory
                    })) || baseData.tasks;
                    return { ...baseData, modules: typedModules, tasks: typedTasks };
                }
            }
        } catch {
            // Silently fall through to static data
        }
    }
    return COURSE_DATA[courseId] || DEFAULT_FALLBACK;
};

export const DEFAULT_STUDENTS = [
    { id: 1, name: 'Josiah P. De Asis', status: 'online', role: 'Student', email: 'deasis.462124@meycauayan.sti.edu.ph', grade: 0, attendance: 0, submissions: 0, aiGraded: false },
];

export const getDemoStudentsData = () => {
    if (!IS_DEMO) return DEFAULT_STUDENTS;
    try {
        const demoStudents = localStorage.getItem('demo-students');
        if (demoStudents) return JSON.parse(demoStudents);
    } catch { /* fall through */ }
    return DEFAULT_STUDENTS;
};

export const getDemoTeachersData = (courseId: string) => {
    if (!IS_DEMO) return [];
    try {
        const demoTeachers = localStorage.getItem('demo-teachers');
        if (demoTeachers) {
            const teachers = JSON.parse(demoTeachers);
            return teachers.filter((t: { courses: string[] }) => t.courses.includes(courseId));
        }
    } catch { /* fall through */ }
    return [];
};

export const getDemoAIGradingData = (courseId: string) => {
    if (!IS_DEMO) return null;
    try {
        const demoAIGrades = localStorage.getItem('demo-ai-grades');
        if (demoAIGrades) {
            const grades = JSON.parse(demoAIGrades);
            return grades[courseId] || null;
        }
    } catch { /* fall through */ }
    return null;
};
