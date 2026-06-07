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

export const DEFAULT_TASKS = [
    { id: 101, title: 'Week 1 Assignment', due: 'Due Today', status: 'pending', score: null, category: 'assignment' as TaskCategory, semester: 'first' },
    { id: 102, title: 'Chapter 1 Quiz', due: 'Due in 3 days', status: 'pending', score: null, category: 'quiz' as TaskCategory, semester: 'first' },
    { id: 103, title: 'Performance Task 1', due: 'Due in 7 days', status: 'pending', score: null, category: 'performance' as TaskCategory, semester: 'first' },
    { id: 104, title: 'Practical Exam (Midterms)', due: 'Due in 14 days', status: 'pending', score: null, category: 'practical' as TaskCategory, semester: 'first' },
    { id: 105, title: 'Weekly Reflection Journal', due: 'Overdue in 2 days', status: 'overdue', score: null, category: 'journal' as TaskCategory, semester: 'first' },
    { id: 106, title: 'Pre-requisite Assignment', due: 'Due Dec 1', status: 'graded', score: 95, category: 'assignment' as TaskCategory, semester: 'first' },
    // 2nd Semester Tasks (Locked)
    { id: 201, title: 'Advanced Concepts Quiz', due: 'Locked', status: 'locked', score: null, category: 'quiz' as TaskCategory, semester: 'second' },
    { id: 202, title: 'Integration Project Proposal', due: 'Locked', status: 'locked', score: null, category: 'performance' as TaskCategory, semester: 'second' },
    { id: 203, title: 'Final Semester Reflection', due: 'Locked', status: 'locked', score: null, category: 'journal' as TaskCategory, semester: 'second' },
];

export const DEFAULT_MODULES = [
    {
        id: 1, title: 'Module 1: Introduction to Programming', status: 'in-progress', term: 'prelims', semester: 'first', contents: [
            { type: 'handout-a', title: 'Course Overview', completed: false },
            { type: 'handout-b', title: 'Getting Started Guide', completed: false },
            { type: 'slideshow', title: 'Introduction Slides', completed: false },
            { type: 'video', title: 'Welcome Video', completed: false },
        ]
    },
    {
        id: 2, title: 'Module 2: Variables and Data Types', status: 'in-progress', term: 'prelims', semester: 'first', contents: [
            { type: 'handout-a', title: 'Variables Explanation', completed: false },
            { type: 'slideshow', title: 'Data Types Slides', completed: false },
            { type: 'video', title: 'Variables Hands-on Video', completed: false },
        ]
    },
    {
        id: 3, title: 'Module 3: Control Structures', status: 'in-progress', term: 'midterm', semester: 'first', contents: [
            { type: 'handout-a', title: 'Conditional Statements', completed: false },
            { type: 'slideshow', title: 'Looping Slides', completed: false },
            { type: 'video', title: 'Loops & Conditionals Video', completed: false },
        ]
    },
    {
        id: 4, title: 'Module 4: Functions and Methods', status: 'locked', term: 'prefinals', semester: 'first', contents: [
            { type: 'handout-a', title: 'Writing Functions', completed: false },
            { type: 'slideshow', title: 'Methods Slides', completed: false },
            { type: 'video', title: 'Functions Walkthrough Video', completed: false },
        ]
    },
    {
        id: 5, title: 'Module 5: Arrays and Lists', status: 'locked', term: 'finals', semester: 'first', contents: [
            { type: 'handout-a', title: 'Array Basics', completed: false },
            { type: 'slideshow', title: 'List Structures Slides', completed: false },
            { type: 'video', title: 'Working with Arrays Video', completed: false },
        ]
    },
    // 2nd Semester Modules
    {
        id: 6, title: 'Module 6: Object-Oriented Programming', status: 'locked', term: 'prelims', semester: 'second', contents: [
            { type: 'handout-a', title: 'OOP Concepts', completed: false },
            { type: 'slideshow', title: 'Classes and Objects', completed: false },
            { type: 'video', title: 'Inheritance and Polymorphism', completed: false },
        ]
    },
    {
        id: 7, title: 'Module 7: Advanced Data Structures', status: 'locked', term: 'midterm', semester: 'second', contents: [
            { type: 'handout-a', title: 'Trees and Graphs', completed: false },
            { type: 'slideshow', title: 'Algorithms Slides', completed: false },
            { type: 'video', title: 'Graph Traversal Video', completed: false },
        ]
    },
    {
        id: 8, title: 'Module 8: Web Integration', status: 'locked', term: 'prefinals', semester: 'second', contents: [
            { type: 'handout-a', title: 'API Basics', completed: false },
            { type: 'slideshow', title: 'Connecting to Backends', completed: false },
            { type: 'video', title: 'Fetch and Axios', completed: false },
        ]
    },
    {
        id: 9, title: 'Module 9: Final Project', status: 'locked', term: 'finals', semester: 'second', contents: [
            { type: 'handout-a', title: 'Project Requirements', completed: false },
            { type: 'slideshow', title: 'Best Practices', completed: false },
            { type: 'video', title: 'Deployment Guide', completed: false },
        ]
    },
];


const TASKS_CP1 = [
    { id: 101, title: 'Week 1 Logic Assignment', due: 'Due Today', status: 'pending', score: null, category: 'assignment' as TaskCategory, semester: 'first' },
    { id: 102, title: 'Syntax Quiz', due: 'Due in 3 days', status: 'pending', score: null, category: 'quiz' as TaskCategory, semester: 'first' },
    { id: 105, title: 'Weekly Reflection Journal', due: 'Overdue in 2 days', status: 'overdue', score: null, category: 'journal' as TaskCategory, semester: 'first' },
    { id: 201, title: 'OOP Concepts Quiz', due: 'Locked', status: 'locked', score: null, category: 'quiz' as TaskCategory, semester: 'second' },
    { id: 203, title: 'Final Semester Reflection', due: 'Locked', status: 'locked', score: null, category: 'journal' as TaskCategory, semester: 'second' },
];

const TASKS_EUTH1 = [
    { id: 101, title: 'STI History Essay', due: 'Due Today', status: 'pending', score: null, category: 'assignment' as TaskCategory, semester: 'first' },
    { id: 102, title: 'Study Habits Quiz', due: 'Due in 3 days', status: 'pending', score: null, category: 'quiz' as TaskCategory, semester: 'first' },
    { id: 105, title: 'Euthenics Reflection Journal', due: 'Overdue in 2 days', status: 'overdue', score: null, category: 'journal' as TaskCategory, semester: 'first' },
    { id: 201, title: 'Personal Development Quiz', due: 'Locked', status: 'locked', score: null, category: 'quiz' as TaskCategory, semester: 'second' },
];

const TASKS_ITC = [
    { id: 101, title: 'Hardware Identification', due: 'Due Today', status: 'pending', score: null, category: 'assignment' as TaskCategory, semester: 'first' },
    { id: 102, title: 'OS Basics Quiz', due: 'Due in 3 days', status: 'pending', score: null, category: 'quiz' as TaskCategory, semester: 'first' },
    { id: 201, title: 'Software Architecture Quiz', due: 'Locked', status: 'locked', score: null, category: 'quiz' as TaskCategory, semester: 'second' },
];

const TASKS_NSTP1 = [
    { id: 101, title: 'Community Needs Assessment', due: 'Due Today', status: 'pending', score: null, category: 'assignment' as TaskCategory, semester: 'first' },
    { id: 102, title: 'Volunteerism Quiz', due: 'Due in 3 days', status: 'pending', score: null, category: 'quiz' as TaskCategory, semester: 'first' },
    { id: 105, title: 'Community Outreach Journal', due: 'Overdue in 2 days', status: 'overdue', score: null, category: 'journal' as TaskCategory, semester: 'first' },
    { id: 201, title: 'Project Planning Quiz', due: 'Locked', status: 'locked', score: null, category: 'quiz' as TaskCategory, semester: 'second' },
];

const TASKS_PE1 = [
    { id: 101, title: 'Fitness Log Week 1', due: 'Due Today', status: 'pending', score: null, category: 'assignment' as TaskCategory, semester: 'first' },
    { id: 102, title: 'Nutrition Basics Quiz', due: 'Due in 3 days', status: 'pending', score: null, category: 'quiz' as TaskCategory, semester: 'first' },
    { id: 201, title: 'Advanced Aerobics Quiz', due: 'Locked', status: 'locked', score: null, category: 'quiz' as TaskCategory, semester: 'second' },
];

const TASKS_PPC = [
    { id: 101, title: 'Media Analysis Essay', due: 'Due Today', status: 'pending', score: null, category: 'assignment' as TaskCategory, semester: 'first' },
    { id: 102, title: 'Pop Culture Icons Quiz', due: 'Due in 3 days', status: 'pending', score: null, category: 'quiz' as TaskCategory, semester: 'first' },
    { id: 201, title: 'Subcultures Quiz', due: 'Locked', status: 'locked', score: null, category: 'quiz' as TaskCategory, semester: 'second' },
];

const TASKS_PURCOM = [
    { id: 101, title: 'Communication Models Draft', due: 'Due Today', status: 'pending', score: null, category: 'assignment' as TaskCategory, semester: 'first' },
    { id: 102, title: 'Grammar & Syntax Quiz', due: 'Due in 3 days', status: 'pending', score: null, category: 'quiz' as TaskCategory, semester: 'first' },
    { id: 201, title: 'Professional Writing Quiz', due: 'Locked', status: 'locked', score: null, category: 'quiz' as TaskCategory, semester: 'second' },
];

const TASKS_TCW = [
    { id: 101, title: 'Globalization Case Study', due: 'Due Today', status: 'pending', score: null, category: 'assignment' as TaskCategory, semester: 'first' },
    { id: 102, title: 'Economic Systems Quiz', due: 'Due in 3 days', status: 'pending', score: null, category: 'quiz' as TaskCategory, semester: 'first' },
    { id: 201, title: 'Global Demography Quiz', due: 'Locked', status: 'locked', score: null, category: 'quiz' as TaskCategory, semester: 'second' },
];

const TASKS_UTS = [
    { id: 101, title: 'Self-Reflection Essay', due: 'Due Today', status: 'pending', score: null, category: 'assignment' as TaskCategory, semester: 'first' },
    { id: 102, title: 'Philosophical Perspectives Quiz', due: 'Due in 3 days', status: 'pending', score: null, category: 'quiz' as TaskCategory, semester: 'first' },
    { id: 201, title: 'Digital Self Quiz', due: 'Locked', status: 'locked', score: null, category: 'quiz' as TaskCategory, semester: 'second' },
];

export const COURSE_DATA: Record<string, CourseDataType> = {
    "cp1": {
        modules: DEFAULT_MODULES,
        tasks: TASKS_CP1,
        instructor: { name: "David Clarence Del Mundo", title: "Instructor", email: "d.delmundo@university.edu" }
    },
    "euth1": {
        modules: [
            { id: 1, title: "Module 1: Introduction to STI and Euthenics", status: "in-progress", term: "prelims", semester: "first", contents: [{ type: "video", title: "STI History", completed: false }, { type: "handout-a", title: "Course Syllabus", completed: false }] },
            { id: 2, title: "Module 2: The STI Student", status: "locked", term: "prelims", semester: "first", contents: [{ type: "handout-a", title: "Student Guidelines", completed: false }] },
            { id: 3, title: "Module 3: Study Habits", status: "locked", term: "midterm", semester: "first", contents: [{ type: "slideshow", title: "Effective Studying", completed: false }] },
            { id: 6, title: "Module 4: Career Planning", status: "locked", term: "prelims", semester: "second", contents: [{ type: "video", title: "Career Paths", completed: false }] },
            { id: 7, title: "Module 5: Workplace Ethics", status: "locked", term: "midterm", semester: "second", contents: [{ type: "handout-a", title: "Professionalism", completed: false }] }
        ],
        tasks: TASKS_EUTH1,
        instructor: { name: "Claire Maurillo", title: "Instructor", email: "c.maurillo@university.edu" }
    },
    "itc": {
        modules: [
            { id: 1, title: "Module 1: Computer Hardware", status: "in-progress", term: "prelims", semester: "first", contents: [{ type: "video", title: "Inside a PC", completed: false }, { type: "handout-a", title: "Hardware Basics", completed: false }] },
            { id: 2, title: "Module 2: Operating Systems", status: "locked", term: "prelims", semester: "first", contents: [{ type: "handout-a", title: "OS Basics", completed: false }] },
            { id: 3, title: "Module 3: Software & Applications", status: "locked", term: "midterm", semester: "first", contents: [{ type: "slideshow", title: "Types of Software", completed: false }] },
            { id: 4, title: "Module 4: Networking Basics", status: "locked", term: "finals", semester: "first", contents: [{ type: "video", title: "How the Internet Works", completed: false }] },
            { id: 6, title: "Module 5: Information Security", status: "locked", term: "prelims", semester: "second", contents: [{ type: "video", title: "Cybersecurity 101", completed: false }] },
            { id: 7, title: "Module 6: Cloud Computing", status: "locked", term: "midterm", semester: "second", contents: [{ type: "slideshow", title: "Cloud Infrastructure", completed: false }] }
        ],
        tasks: TASKS_ITC,
        instructor: { name: "Psalmmiracle Mariano", title: "Instructor", email: "p.mariano@university.edu" }
    },
    "nstp1": {
        modules: [
            { id: 1, title: "Module 1: Civic Welfare Training", status: "in-progress", term: "prelims", semester: "first", contents: [{ type: "handout-a", title: "CWTS Overview", completed: false }, { type: "video", title: "CWTS Intro", completed: false }] },
            { id: 2, title: "Module 2: Volunteerism", status: "locked", term: "midterm", semester: "first", contents: [{ type: "video", title: "The Spirit of Volunteerism", completed: false }] },
            { id: 3, title: "Module 3: Community Organization", status: "locked", term: "finals", semester: "first", contents: [{ type: "slideshow", title: "Community Project Planning", completed: false }] },
            { id: 6, title: "Module 4: Disaster Risk Reduction", status: "locked", term: "prelims", semester: "second", contents: [{ type: "video", title: "Safety Protocols", completed: false }] },
            { id: 7, title: "Module 5: Environmental Awareness", status: "locked", term: "midterm", semester: "second", contents: [{ type: "handout-a", title: "Eco Conservation", completed: false }] }
        ],
        tasks: TASKS_NSTP1,
        instructor: { name: "Dan Risty Montojo", title: "Instructor", email: "d.montojo@university.edu" }
    },
    "pe1": {
        modules: [
            { id: 1, title: "Module 1: Physical Fitness Basics", status: "in-progress", term: "prelims", semester: "first", contents: [{ type: "handout-a", title: "Fitness Parameters", completed: false }, { type: "video", title: "Proper Warmups", completed: false }] },
            { id: 2, title: "Module 2: Aerobic Exercises", status: "locked", term: "midterm", semester: "first", contents: [{ type: "video", title: "Aerobics Demo", completed: false }] },
            { id: 3, title: "Module 3: Strength Training", status: "locked", term: "finals", semester: "first", contents: [{ type: "slideshow", title: "Basic Calisthenics", completed: false }] },
            { id: 6, title: "Module 4: Team Sports Basics", status: "locked", term: "prelims", semester: "second", contents: [{ type: "video", title: "Basketball Fundamentals", completed: false }] },
            { id: 7, title: "Module 5: Individual Sports", status: "locked", term: "midterm", semester: "second", contents: [{ type: "slideshow", title: "Badminton Rules", completed: false }] }
        ],
        tasks: TASKS_PE1,
        instructor: { name: "Mark Joseph Danoy", title: "Instructor", email: "m.danoy@university.edu" }
    },
    "ppc": {
        modules: [
            { id: 1, title: "Module 1: What is Pop Culture?", status: "in-progress", term: "prelims", semester: "first", contents: [{ type: "handout-a", title: "Definitions and Context", completed: false }, { type: "video", title: "Intro to PPC", completed: false }] },
            { id: 2, title: "Module 2: Media and Society", status: "locked", term: "midterm", semester: "first", contents: [{ type: "video", title: "Mass Media Influence", completed: false }] },
            { id: 3, title: "Module 3: Cultural Trends", status: "locked", term: "finals", semester: "first", contents: [{ type: "slideshow", title: "Filipino Internet Culture", completed: false }] },
            { id: 6, title: "Module 4: Subcultures & Fandoms", status: "locked", term: "prelims", semester: "second", contents: [{ type: "video", title: "Fandom Mechanics", completed: false }] },
            { id: 7, title: "Module 5: Global Pop Culture", status: "locked", term: "midterm", semester: "second", contents: [{ type: "handout-a", title: "K-Pop and Anime", completed: false }] }
        ],
        tasks: TASKS_PPC,
        instructor: { name: "Claire Maurillo", title: "Instructor", email: "c.maurillo@university.edu" }
    },
    "purcom": {
        modules: [
            { id: 1, title: "Module 1: Communication Principles", status: "in-progress", term: "prelims", semester: "first", contents: [{ type: "handout-a", title: "Verbal and Non-verbal", completed: false }, { type: "slideshow", title: "Communication Models", completed: false }] },
            { id: 2, title: "Module 2: Intercultural Communication", status: "locked", term: "midterm", semester: "first", contents: [{ type: "video", title: "Global Contexts", completed: false }] },
            { id: 3, title: "Module 3: Professional Writing", status: "locked", term: "finals", semester: "first", contents: [{ type: "slideshow", title: "Emails and Reports", completed: false }] },
            { id: 6, title: "Module 4: Public Speaking", status: "locked", term: "prelims", semester: "second", contents: [{ type: "video", title: "Speech Delivery", completed: false }] },
            { id: 7, title: "Module 5: Digital Communication", status: "locked", term: "midterm", semester: "second", contents: [{ type: "handout-a", title: "Netiquette", completed: false }] }
        ],
        tasks: TASKS_PURCOM,
        instructor: { name: "John Denielle San Martin", title: "Instructor", email: "j.sanmartin@university.edu" }
    },
    "tcw": {
        modules: [
            { id: 1, title: "Module 1: Intro to Globalization", status: "in-progress", term: "prelims", semester: "first", contents: [{ type: "video", title: "The Global Village", completed: false }, { type: "handout-a", title: "Global Issues", completed: false }] },
            { id: 2, title: "Module 2: Global Economy", status: "locked", term: "midterm", semester: "first", contents: [{ type: "handout-a", title: "Economic Systems", completed: false }] },
            { id: 3, title: "Module 3: Global Demography", status: "locked", term: "finals", semester: "first", contents: [{ type: "slideshow", title: "Population Trends", completed: false }] },
            { id: 6, title: "Module 4: Global Politics", status: "locked", term: "prelims", semester: "second", contents: [{ type: "video", title: "International Relations", completed: false }] },
            { id: 7, title: "Module 5: Sustainable Development", status: "locked", term: "midterm", semester: "second", contents: [{ type: "handout-a", title: "SDGs", completed: false }] }
        ],
        tasks: TASKS_TCW,
        instructor: { name: "Claire Maurillo", title: "Instructor", email: "c.maurillo@university.edu" }
    },
    "uts": {
        modules: [
            { id: 1, title: "Module 1: The Self in Philosophy", status: "in-progress", term: "prelims", semester: "first", contents: [{ type: "handout-a", title: "Socrates to Descartes", completed: false }, { type: "slideshow", title: "Philosophers", completed: false }] },
            { id: 2, title: "Module 2: Psychological Perspectives", status: "locked", term: "midterm", semester: "first", contents: [{ type: "video", title: "Cognitive Development", completed: false }] },
            { id: 3, title: "Module 3: The Digital Self", status: "locked", term: "finals", semester: "first", contents: [{ type: "slideshow", title: "Identity Online", completed: false }] },
            { id: 6, title: "Module 4: The Physical Self", status: "locked", term: "prelims", semester: "second", contents: [{ type: "video", title: "Body Image", completed: false }] },
            { id: 7, title: "Module 5: The Emotional Self", status: "locked", term: "midterm", semester: "second", contents: [{ type: "handout-a", title: "Emotional Intelligence", completed: false }] }
        ],
        tasks: TASKS_UTS,
        instructor: { name: "Claire Maurillo", title: "Instructor", email: "c.maurillo@university.edu" }
    } 
};


const DEFAULT_FALLBACK: CourseDataType = {
    modules: DEFAULT_MODULES,
    tasks: DEFAULT_TASKS,
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
