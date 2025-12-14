/**
 * Learning Paths Service
 * Handles all database operations for learning paths
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Types
export interface LearningPath {
    id: string;
    title: string;
    description: string;
    icon: string;
    color: string;
    estimated_hours: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    courses: string[]; // Array of course IDs
    created_by: string;
    is_public: boolean;
    enrolled_count: number; // Number of students enrolled
    created_at: string;
    updated_at: string;
}

export interface PathProgress {
    id: string;
    path_id: string;
    student_id: string;
    completed_courses: string[];
    current_course_id: string | null;
    progress_percentage: number;
    started_at: string;
    last_activity_at: string;
    completed_at: string | null;
}

export interface PathWithProgress extends LearningPath {
    progress?: PathProgress;
    total_courses: number;
    completed_courses_count: number;
}

// Course data - matches the actual courses in the system
export interface CourseInfo {
    id: string;
    title: string;
    shortTitle: string;
    subtitle: string;
    modules: number;
    category: 'major' | 'ge' | 'pe' | 'nstp';
    instructor: string;
    image: string;
}

// All available courses in the system (synced with HomeContent.tsx)
// Note: modules count should match actual modules in each course
export const COURSES_DATA: Record<string, CourseInfo> = {
    'cp1': { 
        id: 'cp1', 
        title: 'Computer Programming 1', 
        shortTitle: 'CP1',
        subtitle: 'CITE1003 · BSIT101A', 
        modules: 1, 
        category: 'major',
        instructor: 'David Clarence Del Mundo',
        image: 'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=300&h=200&fit=crop&crop=center'
    },
    'itc': { 
        id: 'itc', 
        title: 'Introduction to Computing', 
        shortTitle: 'ITC',
        subtitle: 'CITE1004 · BSIT101A', 
        modules: 1, 
        category: 'major',
        instructor: 'Psalmmiracle Mariano',
        image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&h=200&fit=crop&crop=center'
    },
    'euth1': { 
        id: 'euth1', 
        title: 'Euthenics 1', 
        shortTitle: 'EUTH1',
        subtitle: 'STIC1002 · BSIT101A', 
        modules: 1, 
        category: 'ge',
        instructor: 'Claire Maurillo',
        image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=300&h=200&fit=crop&crop=center'
    },
    'purcom': { 
        id: 'purcom', 
        title: 'Purposive Communication', 
        shortTitle: 'PURCOM',
        subtitle: 'GEDC1016 · BSIT101A', 
        modules: 1, 
        category: 'ge',
        instructor: 'John Denielle San Martin',
        image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=300&h=200&fit=crop&crop=center'
    },
    'tcw': { 
        id: 'tcw', 
        title: 'The Contemporary World', 
        shortTitle: 'TCW',
        subtitle: 'GEDC1002 · BSIT101A', 
        modules: 1, 
        category: 'ge',
        instructor: 'Claire Maurillo',
        image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&h=200&fit=crop&crop=center'
    },
    'uts': { 
        id: 'uts', 
        title: 'Understanding the Self', 
        shortTitle: 'UTS',
        subtitle: 'GEDC1008 · BSIT101A', 
        modules: 1, 
        category: 'ge',
        instructor: 'Claire Maurillo',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop&crop=center'
    },
    'ppc': { 
        id: 'ppc', 
        title: 'Philippine Popular Culture', 
        shortTitle: 'PPC',
        subtitle: 'GEDC1041 · BSIT101A', 
        modules: 1, 
        category: 'ge',
        instructor: 'Claire Maurillo',
        image: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=300&h=200&fit=crop&crop=center'
    },
    'pe1': { 
        id: 'pe1', 
        title: 'P.E./PATHFIT 1', 
        shortTitle: 'PE1',
        subtitle: 'PHED1005 · BSIT101A', 
        modules: 1, 
        category: 'pe',
        instructor: 'Mark Joseph Danoy',
        image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=300&h=200&fit=crop&crop=center'
    },
    'nstp1': { 
        id: 'nstp1', 
        title: 'NSTP 1', 
        shortTitle: 'NSTP1',
        subtitle: 'NSTP1008 · BSIT101A', 
        modules: 1, 
        category: 'nstp',
        instructor: 'Dan Risty Montojo',
        image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=300&h=200&fit=crop&crop=center'
    },
};

// Learning paths using actual course IDs
// Note: Only admins can create/manage learning paths. Teachers manage individual courses.
const DEMO_PATHS: LearningPath[] = [
    {
        id: 'path-full-semester',
        title: 'Full 1st Semester',
        description: 'Complete all courses for your first semester as a BSIT student',
        icon: 'graduation',
        color: '#3b82f6',
        estimated_hours: 150,
        difficulty: 'advanced',
        courses: ['cp1', 'itc', 'euth1', 'purcom', 'tcw', 'uts', 'ppc', 'pe1', 'nstp1'], // All 9 courses
        created_by: 'admin',
        is_public: true,
        enrolled_count: 41, // BSIT101A section students
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
];

// Demo progress - connected to actual courses
// BSIT101A students are auto-enrolled in Full 1st Semester (they paid for these courses)
const DEMO_PROGRESS: Record<string, PathProgress> = {
    'path-full-semester': {
        id: 'progress-demo-student',
        path_id: 'path-full-semester',
        student_id: 'demo-student',
        completed_courses: [], // No courses completed yet
        current_course_id: 'cp1', // Starting with Computer Programming 1
        progress_percentage: 0,
        started_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
        completed_at: null, // Not completed yet - in progress
    },
};

// Student interface
export interface Student {
    id: string;
    student_id: string;
    full_name: string;
    first_name: string;
    last_name: string;
    email?: string;
    section: string;
    program: string;
    year_level: string;
    campus: string;
    avatar_url?: string;
    is_active: boolean;
}

// Demo students for BSIT101A (41 students)
const DEMO_STUDENTS: Student[] = [
    { id: '1', student_id: 'BSIT101A-001', full_name: 'Acorda, Divine Maureen', first_name: 'Divine Maureen', last_name: 'Acorda', section: 'BSIT101A', program: 'BSIT', year_level: '1st Year', campus: 'Meycauayan', is_active: true },
    { id: '2', student_id: 'BSIT101A-002', full_name: 'Adel, Rogini', first_name: 'Rogini', last_name: 'Adel', section: 'BSIT101A', program: 'BSIT', year_level: '1st Year', campus: 'Meycauayan', is_active: true },
    { id: '3', student_id: 'BSIT101A-003', full_name: 'Agao, Justin Dominick', first_name: 'Justin Dominick', last_name: 'Agao', section: 'BSIT101A', program: 'BSIT', year_level: '1st Year', campus: 'Meycauayan', is_active: true },
    { id: '4', student_id: 'BSIT101A-004', full_name: 'Antolin, Don Benn Federico', first_name: 'Don Benn Federico', last_name: 'Antolin', section: 'BSIT101A', program: 'BSIT', year_level: '1st Year', campus: 'Meycauayan', is_active: true },
    { id: '5', student_id: 'BSIT101A-005', full_name: 'Baldivas, Blake Cedrick', first_name: 'Blake Cedrick', last_name: 'Baldivas', section: 'BSIT101A', program: 'BSIT', year_level: '1st Year', campus: 'Meycauayan', is_active: true },
    { id: '6', student_id: 'BSIT101A-006', full_name: 'Bendolo, Mark Lawrence', first_name: 'Mark Lawrence', last_name: 'Bendolo', section: 'BSIT101A', program: 'BSIT', year_level: '1st Year', campus: 'Meycauayan', is_active: true },
    { id: '7', student_id: 'BSIT101A-007', full_name: 'Bergania, Jai Brielle', first_name: 'Jai Brielle', last_name: 'Bergania', section: 'BSIT101A', program: 'BSIT', year_level: '1st Year', campus: 'Meycauayan', is_active: true },
    { id: '8', student_id: 'BSIT101A-008', full_name: 'Buenaflor, Bradley', first_name: 'Bradley', last_name: 'Buenaflor', section: 'BSIT101A', program: 'BSIT', year_level: '1st Year', campus: 'Meycauayan', is_active: true },
    { id: '9', student_id: 'BSIT101A-009', full_name: 'Camacho, Karl Benedict', first_name: 'Karl Benedict', last_name: 'Camacho', section: 'BSIT101A', program: 'BSIT', year_level: '1st Year', campus: 'Meycauayan', is_active: true },
    { id: '10', student_id: 'BSIT101A-010', full_name: 'Canta, Ismael June', first_name: 'Ismael June', last_name: 'Canta', section: 'BSIT101A', program: 'BSIT', year_level: '1st Year', campus: 'Meycauayan', is_active: true },
    { id: '11', student_id: 'BSIT101A-011', full_name: 'Cariso, Cristy Shane', first_name: 'Cristy Shane', last_name: 'Cariso', section: 'BSIT101A', program: 'BSIT', year_level: '1st Year', campus: 'Meycauayan', is_active: true },
    { id: '12', student_id: 'BSIT101A-012', full_name: 'Carlos, Ayanamei', first_name: 'Ayanamei', last_name: 'Carlos', section: 'BSIT101A', program: 'BSIT', year_level: '1st Year', campus: 'Meycauayan', is_active: true },
    { id: '13', student_id: 'BSIT101A-013', full_name: 'Colambo, John Aldred', first_name: 'John Aldred', last_name: 'Colambo', section: 'BSIT101A', program: 'BSIT', year_level: '1st Year', campus: 'Meycauayan', is_active: true },
    { id: '14', student_id: 'BSIT101A-014', full_name: 'Dagohoy, Sophia Lorraine', first_name: 'Sophia Lorraine', last_name: 'Dagohoy', section: 'BSIT101A', program: 'BSIT', year_level: '1st Year', campus: 'Meycauayan', is_active: true },
    { id: '15', student_id: 'BSIT101A-015', full_name: 'De Asis, Josiah', first_name: 'Josiah', last_name: 'De Asis', section: 'BSIT101A', program: 'BSIT', year_level: '1st Year', campus: 'Meycauayan', is_active: true },
    { id: '16', student_id: 'BSIT101A-016', full_name: 'Del Mundo, David Clarence', first_name: 'David Clarence', last_name: 'Del Mundo', section: 'BSIT101A', program: 'BSIT', year_level: '1st Year', campus: 'Meycauayan', is_active: true },
    { id: '17', student_id: 'BSIT101A-017', full_name: 'Dela Cruz, Kevin', first_name: 'Kevin', last_name: 'Dela Cruz', section: 'BSIT101A', program: 'BSIT', year_level: '1st Year', campus: 'Meycauayan', is_active: true },
    { id: '18', student_id: 'BSIT101A-018', full_name: 'Evangelista, Lance Michael', first_name: 'Lance Michael', last_name: 'Evangelista', section: 'BSIT101A', program: 'BSIT', year_level: '1st Year', campus: 'Meycauayan', is_active: true },
    { id: '19', student_id: 'BSIT101A-019', full_name: 'Fajardo, Althea', first_name: 'Althea', last_name: 'Fajardo', section: 'BSIT101A', program: 'BSIT', year_level: '1st Year', campus: 'Meycauayan', is_active: true },
    { id: '20', student_id: 'BSIT101A-020', full_name: 'Halili, Andrei Jiroh', first_name: 'Andrei Jiroh', last_name: 'Halili', section: 'BSIT101A', program: 'BSIT', year_level: '1st Year', campus: 'Meycauayan', is_active: true },
    { id: '21', student_id: 'BSIT101A-021', full_name: 'Japsay, Jetro Josef', first_name: 'Jetro Josef', last_name: 'Japsay', section: 'BSIT101A', program: 'BSIT', year_level: '1st Year', campus: 'Meycauayan', is_active: true },
    { id: '22', student_id: 'BSIT101A-022', full_name: 'Juban, Jasper', first_name: 'Jasper', last_name: 'Juban', section: 'BSIT101A', program: 'BSIT', year_level: '1st Year', campus: 'Meycauayan', is_active: true },
    { id: '23', student_id: 'BSIT101A-023', full_name: 'Lim, Renato', first_name: 'Renato', last_name: 'Lim', section: 'BSIT101A', program: 'BSIT', year_level: '1st Year', campus: 'Meycauayan', is_active: true },
    { id: '24', student_id: 'BSIT101A-024', full_name: 'Macatulad, Renzo', first_name: 'Renzo', last_name: 'Macatulad', section: 'BSIT101A', program: 'BSIT', year_level: '1st Year', campus: 'Meycauayan', is_active: true },
    { id: '25', student_id: 'BSIT101A-025', full_name: 'Marfil, Christopher Jann', first_name: 'Christopher Jann', last_name: 'Marfil', section: 'BSIT101A', program: 'BSIT', year_level: '1st Year', campus: 'Meycauayan', is_active: true },
    { id: '26', student_id: 'BSIT101A-026', full_name: 'Orianda, Denmart Airon', first_name: 'Denmart Airon', last_name: 'Orianda', section: 'BSIT101A', program: 'BSIT', year_level: '1st Year', campus: 'Meycauayan', is_active: true },
    { id: '27', student_id: 'BSIT101A-027', full_name: 'Pagdanganan, Jan Mark', first_name: 'Jan Mark', last_name: 'Pagdanganan', section: 'BSIT101A', program: 'BSIT', year_level: '1st Year', campus: 'Meycauayan', is_active: true },
    { id: '28', student_id: 'BSIT101A-028', full_name: 'Paguirigan, Mary Chris Angelene', first_name: 'Mary Chris Angelene', last_name: 'Paguirigan', section: 'BSIT101A', program: 'BSIT', year_level: '1st Year', campus: 'Meycauayan', is_active: true },
    { id: '29', student_id: 'BSIT101A-029', full_name: 'Paras, Romeo', first_name: 'Romeo', last_name: 'Paras', section: 'BSIT101A', program: 'BSIT', year_level: '1st Year', campus: 'Meycauayan', is_active: true },
    { id: '30', student_id: 'BSIT101A-030', full_name: 'Ravela, Fontleroy', first_name: 'Fontleroy', last_name: 'Ravela', section: 'BSIT101A', program: 'BSIT', year_level: '1st Year', campus: 'Meycauayan', is_active: true },
    { id: '31', student_id: 'BSIT101A-031', full_name: 'Rodriguez, Carl Aaron', first_name: 'Carl Aaron', last_name: 'Rodriguez', section: 'BSIT101A', program: 'BSIT', year_level: '1st Year', campus: 'Meycauayan', is_active: true },
    { id: '32', student_id: 'BSIT101A-032', full_name: 'Rodriguez, Joel', first_name: 'Joel', last_name: 'Rodriguez', section: 'BSIT101A', program: 'BSIT', year_level: '1st Year', campus: 'Meycauayan', is_active: true },
    { id: '33', student_id: 'BSIT101A-033', full_name: 'San Vicente, Luigie', first_name: 'Luigie', last_name: 'San Vicente', section: 'BSIT101A', program: 'BSIT', year_level: '1st Year', campus: 'Meycauayan', is_active: true },
    { id: '34', student_id: 'BSIT101A-034', full_name: 'Santos, King Cyrhon', first_name: 'King Cyrhon', last_name: 'Santos', section: 'BSIT101A', program: 'BSIT', year_level: '1st Year', campus: 'Meycauayan', is_active: true },
    { id: '35', student_id: 'BSIT101A-035', full_name: 'Sausa, Rashae Gavin', first_name: 'Rashae Gavin', last_name: 'Sausa', section: 'BSIT101A', program: 'BSIT', year_level: '1st Year', campus: 'Meycauayan', is_active: true },
    { id: '36', student_id: 'BSIT101A-036', full_name: 'Segismundo, Jerome', first_name: 'Jerome', last_name: 'Segismundo', section: 'BSIT101A', program: 'BSIT', year_level: '1st Year', campus: 'Meycauayan', is_active: true },
    { id: '37', student_id: 'BSIT101A-037', full_name: 'Solanoy, Clariza', first_name: 'Clariza', last_name: 'Solanoy', section: 'BSIT101A', program: 'BSIT', year_level: '1st Year', campus: 'Meycauayan', is_active: true },
    { id: '38', student_id: 'BSIT101A-038', full_name: 'Sta. Ana, Benz Joshua', first_name: 'Benz Joshua', last_name: 'Sta. Ana', section: 'BSIT101A', program: 'BSIT', year_level: '1st Year', campus: 'Meycauayan', is_active: true },
    { id: '39', student_id: 'BSIT101A-039', full_name: 'Surigao, Arian Marie', first_name: 'Arian Marie', last_name: 'Surigao', section: 'BSIT101A', program: 'BSIT', year_level: '1st Year', campus: 'Meycauayan', is_active: true },
    { id: '40', student_id: 'BSIT101A-040', full_name: 'Tejada, James Ian Alexander', first_name: 'James Ian Alexander', last_name: 'Tejada', section: 'BSIT101A', program: 'BSIT', year_level: '1st Year', campus: 'Meycauayan', is_active: true },
    { id: '41', student_id: 'BSIT101A-041', full_name: 'Tobias, Ma. Jessiephine', first_name: 'Ma. Jessiephine', last_name: 'Tobias', section: 'BSIT101A', program: 'BSIT', year_level: '1st Year', campus: 'Meycauayan', is_active: true },
];

/**
 * Get students by section
 */
export async function getStudentsBySection(section: string): Promise<Student[]> {
    try {
        if (!isSupabaseConfigured() || !supabase) {
            return DEMO_STUDENTS.filter(s => s.section === section);
        }

        const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq('section', section)
            .eq('is_active', true)
            .order('last_name', { ascending: true });

        if (error) {
            console.error('[PathsService] Error fetching students:', error);
            return DEMO_STUDENTS.filter(s => s.section === section);
        }

        return data || DEMO_STUDENTS.filter(s => s.section === section);
    } catch (err) {
        console.error('[PathsService] Exception:', err);
        return DEMO_STUDENTS.filter(s => s.section === section);
    }
}

/**
 * Get total student count for a section
 */
export async function getStudentCount(section: string): Promise<number> {
    const students = await getStudentsBySection(section);
    return students.length;
}

/**
 * Get course info by ID
 */
export function getCourseInfo(courseId: string): CourseInfo | null {
    return COURSES_DATA[courseId] || null;
}

/**
 * Get all courses from Supabase (or demo data)
 */
export async function getAllCourses(): Promise<CourseInfo[]> {
    try {
        if (!isSupabaseConfigured() || !supabase) {
            return Object.values(COURSES_DATA);
        }

        const { data, error } = await supabase
            .from('courses')
            .select('*')
            .eq('is_active', true)
            .order('title', { ascending: true });

        if (error) {
            console.error('[PathsService] Error fetching courses:', error);
            return Object.values(COURSES_DATA);
        }

        // Map Supabase data to CourseInfo format
        return (data || []).map(course => ({
            id: course.id,
            title: course.title,
            shortTitle: course.short_title,
            subtitle: course.subtitle || '',
            modules: course.modules || 0,
            category: course.category as 'major' | 'ge' | 'pe' | 'nstp',
            instructor: course.instructor || '',
            image: course.image || '',
        }));
    } catch (err) {
        console.error('[PathsService] Exception:', err);
        return Object.values(COURSES_DATA);
    }
}

/**
 * Get all courses for a path
 */
export function getPathCourses(path: LearningPath): CourseInfo[] {
    return path.courses
        .map(id => COURSES_DATA[id])
        .filter((c): c is CourseInfo => c !== undefined);
}

/**
 * Calculate total modules in a path
 */
export function getPathTotalModules(path: LearningPath): number {
    return path.courses.reduce((total, courseId) => {
        const course = COURSES_DATA[courseId];
        return total + (course?.modules || 0);
    }, 0);
}

/**
 * Calculate estimated hours for a path based on modules
 * Assumes ~2 hours per module (reading, activities, assessments)
 */
export function getPathEstimatedHours(path: LearningPath): number {
    const totalModules = getPathTotalModules(path);
    return Math.round(totalModules * 2); // 2 hours per module
}

/**
 * Format estimated time in a readable way
 */
export function formatEstimatedTime(hours: number): string {
    if (hours < 1) return '<1h';
    if (hours <= 100) return `${hours}h`;
    // For longer durations, show in weeks (assuming 20 study hours per week)
    const weeks = Math.round(hours / 20);
    return `${weeks}w`; // Short format: "8w" instead of "8 weeks"
}

/**
 * Get demo paths from localStorage (when Demo button is clicked)
 */
function getDemoPathsFromStorage(): LearningPath[] {
    try {
        const stored = localStorage.getItem('demo-learning-paths');
        if (stored) {
            const demoPaths = JSON.parse(stored) as LearningPath[];
            // Combine with the default full semester path
            return [...DEMO_PATHS, ...demoPaths];
        }
    } catch (e) {
        console.error('[PathsService] Error loading demo paths from storage:', e);
    }
    return DEMO_PATHS;
}

/**
 * Check if demo mode is active
 */
function isDemoModeActive(): boolean {
    return localStorage.getItem('demo-mode-active') === 'true';
}

/**
 * Get all available learning paths
 */
export async function getAllPaths(): Promise<LearningPath[]> {
    try {
        // Check if demo mode is active - use localStorage demo paths
        if (isDemoModeActive()) {
            console.log('[PathsService] Demo mode active - using demo paths');
            return getDemoPathsFromStorage();
        }
        
        if (!isSupabaseConfigured() || !supabase) {
            console.log('[PathsService] Using demo paths data');
            return DEMO_PATHS;
        }

        const { data, error } = await supabase
            .from('learning_paths')
            .select('*')
            .eq('is_public', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[PathsService] Error fetching paths:', error);
            return DEMO_PATHS;
        }

        return data || DEMO_PATHS;
    } catch (err) {
        console.error('[PathsService] Exception:', err);
        return DEMO_PATHS;
    }
}

/**
 * Get a single learning path by ID
 */
export async function getPathById(pathId: string): Promise<LearningPath | null> {
    try {
        // Check demo mode first
        if (isDemoModeActive()) {
            const allPaths = getDemoPathsFromStorage();
            return allPaths.find(p => p.id === pathId) || null;
        }
        
        if (!isSupabaseConfigured() || !supabase) {
            return DEMO_PATHS.find(p => p.id === pathId) || null;
        }

        const { data, error } = await supabase
            .from('learning_paths')
            .select('*')
            .eq('id', pathId)
            .single();

        if (error) {
            console.error('[PathsService] Error fetching path:', error);
            return DEMO_PATHS.find(p => p.id === pathId) || null;
        }

        return data;
    } catch (err) {
        console.error('[PathsService] Exception:', err);
        return DEMO_PATHS.find(p => p.id === pathId) || null;
    }
}

/**
 * Get student's progress for all enrolled paths
 */
export async function getStudentPathProgress(studentId: string): Promise<PathProgress[]> {
    try {
        if (!isSupabaseConfigured() || !supabase) {
            return Object.values(DEMO_PROGRESS);
        }

        const { data, error } = await supabase
            .from('path_progress')
            .select('*')
            .eq('student_id', studentId);

        if (error) {
            console.error('[PathsService] Error fetching progress:', error);
            return Object.values(DEMO_PROGRESS);
        }

        return data || Object.values(DEMO_PROGRESS);
    } catch (err) {
        console.error('[PathsService] Exception:', err);
        return Object.values(DEMO_PROGRESS);
    }
}

/**
 * Get paths with progress for a student
 */
export async function getPathsWithProgress(studentId: string): Promise<PathWithProgress[]> {
    const [paths, progressList] = await Promise.all([
        getAllPaths(),
        getStudentPathProgress(studentId),
    ]);

    const progressMap = new Map(progressList.map(p => [p.path_id, p]));

    return paths.map(path => ({
        ...path,
        progress: progressMap.get(path.id),
        total_courses: path.courses.length,
        completed_courses_count: progressMap.get(path.id)?.completed_courses.length || 0,
    }));
}

/**
 * Get enrolled paths (paths with progress)
 */
export async function getEnrolledPaths(studentId: string): Promise<PathWithProgress[]> {
    const pathsWithProgress = await getPathsWithProgress(studentId);
    return pathsWithProgress.filter(p => p.progress !== undefined);
}

/**
 * Enroll in a learning path
 */
export async function enrollInPath(pathId: string, studentId: string): Promise<PathProgress | null> {
    try {
        const newProgress: Omit<PathProgress, 'id'> = {
            path_id: pathId,
            student_id: studentId,
            completed_courses: [],
            current_course_id: null,
            progress_percentage: 0,
            started_at: new Date().toISOString(),
            last_activity_at: new Date().toISOString(),
            completed_at: null,
        };

        if (!isSupabaseConfigured() || !supabase) {
            const progress: PathProgress = { ...newProgress, id: `progress-${Date.now()}` };
            DEMO_PROGRESS[pathId] = progress;
            return progress;
        }

        const { data, error } = await supabase
            .from('path_progress')
            .insert([newProgress])
            .select()
            .single();

        if (error) {
            console.error('[PathsService] Error enrolling:', error);
            return null;
        }

        return data;
    } catch (err) {
        console.error('[PathsService] Exception:', err);
        return null;
    }
}

/**
 * Update path progress
 */
export async function updatePathProgress(
    progressId: string,
    updates: Partial<PathProgress>
): Promise<PathProgress | null> {
    try {
        if (!isSupabaseConfigured() || !supabase) {
            // Update demo progress
            for (const key of Object.keys(DEMO_PROGRESS)) {
                if (DEMO_PROGRESS[key].id === progressId) {
                    DEMO_PROGRESS[key] = { ...DEMO_PROGRESS[key], ...updates };
                    return DEMO_PROGRESS[key];
                }
            }
            return null;
        }

        const { data, error } = await supabase
            .from('path_progress')
            .update({ ...updates, last_activity_at: new Date().toISOString() })
            .eq('id', progressId)
            .select()
            .single();

        if (error) {
            console.error('[PathsService] Error updating progress:', error);
            return null;
        }

        return data;
    } catch (err) {
        console.error('[PathsService] Exception:', err);
        return null;
    }
}

/**
 * Get path statistics
 */
export function getPathStats(paths: PathWithProgress[]): {
    totalPaths: number;
    enrolledPaths: number;
    completedPaths: number;
    inProgressPaths: number;
    totalHours: number;
} {
    const enrolled = paths.filter(p => p.progress);
    const completed = enrolled.filter(p => p.progress?.completed_at);
    const inProgress = enrolled.filter(p => p.progress && !p.progress.completed_at);

    return {
        totalPaths: paths.length,
        enrolledPaths: enrolled.length,
        completedPaths: completed.length,
        inProgressPaths: inProgress.length,
        totalHours: enrolled.reduce((sum, p) => sum + p.estimated_hours, 0),
    };
}

/**
 * Get difficulty label with color
 */
export function getDifficultyInfo(difficulty: LearningPath['difficulty']): { label: string; color: string } {
    switch (difficulty) {
        case 'beginner':
            return { label: 'Beginner', color: '#10b981' };
        case 'intermediate':
            return { label: 'Intermediate', color: '#f59e0b' };
        case 'advanced':
            return { label: 'Advanced', color: '#f59e0b' }; // Yellow/amber for advanced
        default:
            return { label: 'Unknown', color: '#6b7280' };
    }
}


/**
 * Course Unlock System
 * Courses are unlocked sequentially - completing one unlocks the next
 * The first course in a path is always unlocked when enrolled
 */

// Storage key for unlocked courses
const UNLOCKED_COURSES_KEY = 'unlocked-courses';

/**
 * Get list of unlocked course IDs from localStorage
 */
export function getUnlockedCourses(): string[] {
    try {
        const saved = localStorage.getItem(UNLOCKED_COURSES_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.error('[PathsService] Error loading unlocked courses:', e);
    }
    // Default: first course (cp1) is always unlocked
    return ['cp1'];
}

/**
 * Save unlocked courses to localStorage
 */
export function saveUnlockedCourses(courseIds: string[]): void {
    localStorage.setItem(UNLOCKED_COURSES_KEY, JSON.stringify(courseIds));
}

/**
 * Check if a course is unlocked
 */
export function isCourseUnlocked(courseId: string, path?: LearningPath): boolean {
    const unlocked = getUnlockedCourses();
    
    // If course is in unlocked list, it's unlocked
    if (unlocked.includes(courseId)) {
        return true;
    }
    
    // If no path provided, check if it's the first course in any path
    if (!path) {
        // Check all demo paths
        for (const p of DEMO_PATHS) {
            if (p.courses[0] === courseId) {
                return true;
            }
        }
        return false;
    }
    
    // First course in path is always unlocked
    if (path.courses[0] === courseId) {
        return true;
    }
    
    return false;
}

/**
 * Unlock the next course in a path when current course is completed
 * Returns the newly unlocked course ID or null if no course was unlocked
 */
export function unlockNextCourse(
    completedCourseId: string, 
    path: LearningPath,
    courseProgress: Record<string, { progress: number }>
): string | null {
    const courseIndex = path.courses.indexOf(completedCourseId);
    
    // If course not in path or is last course, nothing to unlock
    if (courseIndex === -1 || courseIndex >= path.courses.length - 1) {
        return null;
    }
    
    // Check if completed course is actually at 100%
    const progress = courseProgress[completedCourseId]?.progress || 0;
    if (progress < 100) {
        return null;
    }
    
    // Get next course
    const nextCourseId = path.courses[courseIndex + 1];
    
    // Check if already unlocked
    const unlocked = getUnlockedCourses();
    if (unlocked.includes(nextCourseId)) {
        return null; // Already unlocked
    }
    
    // Unlock the next course
    const newUnlocked = [...unlocked, nextCourseId];
    saveUnlockedCourses(newUnlocked);
    
    console.log(`[PathsService] Unlocked course: ${nextCourseId}`);
    return nextCourseId;
}

/**
 * Check and unlock courses based on current progress
 * Call this when course progress is updated
 */
export function checkAndUnlockCourses(
    path: LearningPath,
    courseProgress: Record<string, { progress: number }>
): string[] {
    const newlyUnlocked: string[] = [];
    
    // Go through each course in order
    for (let i = 0; i < path.courses.length - 1; i++) {
        const courseId = path.courses[i];
        const progress = courseProgress[courseId]?.progress || 0;
        
        // If this course is complete, try to unlock the next one
        if (progress >= 100) {
            const unlocked = unlockNextCourse(courseId, path, courseProgress);
            if (unlocked) {
                newlyUnlocked.push(unlocked);
            }
        }
    }
    
    return newlyUnlocked;
}

/**
 * Get the current course to continue (first incomplete unlocked course)
 */
export function getCurrentCourse(
    path: LearningPath,
    courseProgress: Record<string, { progress: number }>
): CourseInfo | null {
    const unlocked = getUnlockedCourses();
    
    for (const courseId of path.courses) {
        // First course is always unlocked, or check if in unlocked list
        const isUnlocked = path.courses[0] === courseId || unlocked.includes(courseId);
        
        if (!isUnlocked) {
            continue;
        }
        
        // Check if course is incomplete
        const progress = courseProgress[courseId]?.progress || 0;
        if (progress < 100) {
            return COURSES_DATA[courseId] || null;
        }
    }
    
    // All courses complete, return last course
    const lastCourseId = path.courses[path.courses.length - 1];
    return COURSES_DATA[lastCourseId] || null;
}


/**
 * Path Recommendation System
 * Recommends paths based on user's enrolled courses and interests
 */

export interface PathRecommendation {
    path: LearningPath;
    score: number; // 0-100 relevance score
    reason: string;
    matchedCourses: string[]; // Course IDs that match user's interests
}

/**
 * Get recommended paths based on user's course progress and interests
 * Analyzes enrolled courses to suggest relevant learning paths
 */
export async function getPathRecommendations(
    studentId: string,
    courseProgress: Record<string, { progress: number }>,
    enrolledPaths: PathWithProgress[]
): Promise<PathRecommendation[]> {
    try {
        const allPaths = await getAllPaths();
        const enrolledPathIds = new Set(enrolledPaths.map(p => p.id));
        
        // Get courses the user is actively working on (has progress)
        const activeCourseIds = Object.entries(courseProgress)
            .filter(([_, data]) => data.progress > 0)
            .map(([id]) => id);
        
        // Get course categories the user is interested in
        const userCategories = new Set<string>();
        activeCourseIds.forEach(courseId => {
            const course = COURSES_DATA[courseId];
            if (course) {
                userCategories.add(course.category);
            }
        });
        
        // Score each non-enrolled path
        const recommendations: PathRecommendation[] = [];
        
        for (const path of allPaths) {
            // Skip already enrolled paths
            if (enrolledPathIds.has(path.id)) continue;
            
            let score = 0;
            const matchedCourses: string[] = [];
            let reason = '';
            
            // Check course overlap
            const pathCourseSet = new Set(path.courses);
            activeCourseIds.forEach(courseId => {
                if (pathCourseSet.has(courseId)) {
                    matchedCourses.push(courseId);
                    score += 20; // 20 points per matching course
                }
            });
            
            // Check category match
            let categoryMatches = 0;
            path.courses.forEach(courseId => {
                const course = COURSES_DATA[courseId];
                if (course && userCategories.has(course.category)) {
                    categoryMatches++;
                }
            });
            score += Math.min(categoryMatches * 10, 30); // Up to 30 points for category matches
            
            // Bonus for beginner-friendly paths if user is new
            const totalProgress = Object.values(courseProgress).reduce((sum, c) => sum + c.progress, 0);
            if (totalProgress < 100 && path.difficulty === 'beginner') {
                score += 15;
            }
            
            // Bonus for paths with high enrollment (popular)
            if (path.enrolled_count > 30) {
                score += 10;
            }
            
            // Generate reason
            if (matchedCourses.length > 0) {
                const courseNames = matchedCourses
                    .map(id => COURSES_DATA[id]?.shortTitle || id)
                    .slice(0, 2)
                    .join(', ');
                reason = `Includes ${courseNames}${matchedCourses.length > 2 ? ` +${matchedCourses.length - 2} more` : ''}`;
            } else if (categoryMatches > 0) {
                reason = 'Matches your interests';
            } else if (path.difficulty === 'beginner') {
                reason = 'Great for getting started';
            } else {
                reason = 'Recommended for you';
            }
            
            // Only include paths with some relevance
            if (score > 0 || allPaths.length <= 3) {
                recommendations.push({
                    path,
                    score: Math.min(score, 100),
                    reason,
                    matchedCourses,
                });
            }
        }
        
        // Sort by score (highest first) and limit to top 3
        return recommendations
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
    } catch (err) {
        console.error('[PathsService] Error getting recommendations:', err);
        return [];
    }
}

/**
 * Get recommendation reason icon based on the reason type
 */
export function getRecommendationIcon(reason: string): 'match' | 'popular' | 'beginner' | 'interest' {
    if (reason.includes('Includes')) return 'match';
    if (reason.includes('popular') || reason.includes('Popular')) return 'popular';
    if (reason.includes('started') || reason.includes('beginner')) return 'beginner';
    return 'interest';
}
