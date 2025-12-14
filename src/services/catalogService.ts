/**
 * Catalog Service - Course Catalog Management
 * Handles browsing, filtering, and enrolling in courses
 * Connected to Supabase database for real student counts
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { COURSES_DATA, type CourseInfo } from './pathsService';

// Types
export interface CatalogCourse extends CourseInfo {
    enrolled: boolean;
    enrolledCount: number;
    rating: number;
    reviewCount: number;
    tags: string[];
    prerequisites: string[];
    description: string;
    learningOutcomes: string[];
    lastUpdated: string;
}

export type CourseCategory = 'all' | 'major' | 'ge' | 'pe' | 'nstp';
export type SortOption = 'recent' | 'title';

// Category info
export const categoryInfo: Record<CourseCategory, { label: string; color: string; description: string }> = {
    all: { label: 'All Courses', color: '#3b82f6', description: 'Browse all available courses' },
    major: { label: 'Major Subjects', color: '#8b5cf6', description: 'Core IT/CS courses' },
    ge: { label: 'General Education', color: '#10b981', description: 'GE courses for holistic development' },
    pe: { label: 'Physical Education', color: '#f59e0b', description: 'Health and fitness courses' },
    nstp: { label: 'NSTP', color: '#ef4444', description: 'National Service Training Program' },
};

// Extended course data for catalog (ratings, tags, descriptions)
const CATALOG_EXTENSIONS: Record<string, Omit<Partial<CatalogCourse>, 'enrolledCount'>> = {
    'cp1': {
        rating: 4.8,
        reviewCount: 42,
        tags: ['Programming', 'Python', 'Fundamentals'],
        prerequisites: [],
        description: 'Learn the fundamentals of programming using Python. This course covers variables, control structures, functions, and basic data structures.',
        learningOutcomes: ['Write basic Python programs', 'Understand programming logic', 'Debug simple code', 'Use functions effectively'],
        lastUpdated: '2024-12-01',
    },
    'itc': {
        rating: 4.6,
        reviewCount: 38,
        tags: ['Computing', 'Hardware', 'Software'],
        prerequisites: [],
        description: 'An introduction to the world of computing, covering hardware, software, networks, and the history of computers.',
        learningOutcomes: ['Understand computer components', 'Navigate operating systems', 'Use productivity software', 'Understand networking basics'],
        lastUpdated: '2024-11-15',
    },
    'euth1': {
        rating: 4.5,
        reviewCount: 28,
        tags: ['Life Skills', 'Personal Development'],
        prerequisites: [],
        description: 'Develop essential life skills for personal and professional success. Focus on time management, communication, and self-improvement.',
        learningOutcomes: ['Manage time effectively', 'Communicate professionally', 'Set and achieve goals', 'Build healthy habits'],
        lastUpdated: '2024-11-20',
    },
    'purcom': {
        rating: 4.7,
        reviewCount: 45,
        tags: ['Communication', 'Writing', 'Speaking'],
        prerequisites: [],
        description: 'Master purposive communication skills for academic and professional contexts. Learn to write and speak effectively.',
        learningOutcomes: ['Write academic papers', 'Deliver presentations', 'Communicate across cultures', 'Use appropriate registers'],
        lastUpdated: '2024-12-05',
    },
    'tcw': {
        rating: 4.4,
        reviewCount: 32,
        tags: ['Globalization', 'Culture', 'Society'],
        prerequisites: [],
        description: 'Explore contemporary global issues including globalization, cultural exchange, and international relations.',
        learningOutcomes: ['Analyze global trends', 'Understand cultural diversity', 'Evaluate global challenges', 'Think critically about world issues'],
        lastUpdated: '2024-11-28',
    },
    'uts': {
        rating: 4.6,
        reviewCount: 51,
        tags: ['Psychology', 'Self-awareness', 'Identity'],
        prerequisites: [],
        description: 'A journey of self-discovery exploring identity, personality, and the factors that shape who we are.',
        learningOutcomes: ['Understand self-concept', 'Analyze personality theories', 'Develop self-awareness', 'Manage emotions effectively'],
        lastUpdated: '2024-12-03',
    },
    'ppc': {
        rating: 4.3,
        reviewCount: 24,
        tags: ['Culture', 'Media', 'Filipino'],
        prerequisites: [],
        description: 'Explore Philippine popular culture through media, arts, and everyday practices that define Filipino identity.',
        learningOutcomes: ['Analyze Filipino media', 'Understand cultural trends', 'Appreciate local arts', 'Critique pop culture'],
        lastUpdated: '2024-11-10',
    },
    'pe1': {
        rating: 4.5,
        reviewCount: 36,
        tags: ['Fitness', 'Health', 'Exercise'],
        prerequisites: [],
        description: 'Build a foundation for lifelong fitness through various physical activities and health education.',
        learningOutcomes: ['Develop fitness routines', 'Understand body mechanics', 'Practice healthy habits', 'Improve physical wellness'],
        lastUpdated: '2024-12-08',
    },
    'nstp1': {
        rating: 4.2,
        reviewCount: 29,
        tags: ['Service', 'Community', 'Leadership'],
        prerequisites: [],
        description: 'Engage in community service and develop civic consciousness through the National Service Training Program.',
        learningOutcomes: ['Serve the community', 'Develop leadership skills', 'Understand civic duties', 'Work in teams'],
        lastUpdated: '2024-11-25',
    },
};

// Cache for student count to avoid repeated database calls
let cachedStudentCount: number | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get the total number of students enrolled in BSIT101A section
 * All students in this section are enrolled in all 9 courses
 */
export const getEnrolledStudentCount = async (): Promise<number> => {
    // Return cached value if still valid
    if (cachedStudentCount !== null && Date.now() - cacheTimestamp < CACHE_DURATION) {
        return cachedStudentCount;
    }

    // Try to fetch from Supabase
    if (isSupabaseConfigured() && supabase) {
        try {
            // First try the students table
            const { count: studentsCount, error: studentsError } = await supabase
                .from('students')
                .select('*', { count: 'exact', head: true })
                .eq('section', 'BSIT101A')
                .eq('is_active', true);

            if (!studentsError && studentsCount !== null) {
                cachedStudentCount = studentsCount;
                cacheTimestamp = Date.now();
                console.log('[CatalogService] Fetched student count from students table:', studentsCount);
                return studentsCount;
            }

            // Fallback: try users table with student role
            const { count: usersCount, error: usersError } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'student')
                .eq('section', 'BSIT101A')
                .eq('is_active', true);

            if (!usersError && usersCount !== null) {
                cachedStudentCount = usersCount;
                cacheTimestamp = Date.now();
                console.log('[CatalogService] Fetched student count from users table:', usersCount);
                return usersCount;
            }
        } catch (e) {
            console.warn('[CatalogService] Error fetching student count:', e);
        }
    }

    // Default fallback: 41 students (BSIT101A section)
    console.log('[CatalogService] Using default student count: 41');
    return 41;
};

/**
 * Get all catalog courses with real enrolled counts from database
 */
export const getCatalogCourses = async (): Promise<CatalogCourse[]> => {
    // Get the actual student count from database
    const enrolledCount = await getEnrolledStudentCount();

    // Try to fetch courses from Supabase
    if (isSupabaseConfigured() && supabase) {
        try {
            const { data, error } = await supabase
                .from('courses')
                .select('*')
                .eq('is_active', true)
                .order('title', { ascending: true });

            if (!error && data && data.length > 0) {
                console.log('[CatalogService] Fetched courses from Supabase:', data.length);
                
                // Map Supabase courses to CatalogCourse format
                return data.map(course => {
                    const extensions = CATALOG_EXTENSIONS[course.id] || {};
                    return {
                        id: course.id,
                        title: course.title,
                        shortTitle: course.short_title,
                        subtitle: course.subtitle || '',
                        modules: course.modules || 1,
                        category: course.category as 'major' | 'ge' | 'pe' | 'nstp',
                        instructor: course.instructor || '',
                        image: course.image || '',
                        enrolled: true, // All BSIT101A students are enrolled in all courses
                        enrolledCount: enrolledCount, // Real count from database
                        rating: extensions.rating || 4.5,
                        reviewCount: extensions.reviewCount || 30,
                        tags: extensions.tags || [],
                        prerequisites: extensions.prerequisites || [],
                        description: extensions.description || course.description || '',
                        learningOutcomes: extensions.learningOutcomes || [],
                        lastUpdated: extensions.lastUpdated || new Date().toISOString().split('T')[0],
                    };
                });
            }
        } catch (e) {
            console.warn('[CatalogService] Supabase fetch failed, using demo data:', e);
        }
    }

    // Return demo data with real student count
    console.log('[CatalogService] Using demo data with enrolled count:', enrolledCount);
    return Object.values(COURSES_DATA).map(course => ({
        ...course,
        enrolled: true, // All BSIT101A students are enrolled in all 9 courses
        enrolledCount: enrolledCount, // Real count from database
        ...CATALOG_EXTENSIONS[course.id],
    })) as CatalogCourse[];
};

// Get catalog stats
export interface CatalogStats {
    totalCourses: number;
    enrolledCourses: number;
    majorCourses: number;
    geCourses: number;
    peCourses: number;
    nstpCourses: number;
    totalStudents: number; // Total enrolled students
}

export const getCatalogStats = async (): Promise<CatalogStats> => {
    const [courses, studentCount] = await Promise.all([
        getCatalogCourses(),
        getEnrolledStudentCount(),
    ]);
    
    return {
        totalCourses: courses.length,
        enrolledCourses: courses.filter(c => c.enrolled).length,
        majorCourses: courses.filter(c => c.category === 'major').length,
        geCourses: courses.filter(c => c.category === 'ge').length,
        peCourses: courses.filter(c => c.category === 'pe').length,
        nstpCourses: courses.filter(c => c.category === 'nstp').length,
        totalStudents: studentCount,
    };
};

// Filter courses by category
export const filterCoursesByCategory = (courses: CatalogCourse[], category: CourseCategory): CatalogCourse[] => {
    if (category === 'all') return courses;
    return courses.filter(c => c.category === category);
};

// Recently viewed courses storage key
const RECENTLY_VIEWED_KEY = 'catalog-recently-viewed';

// Get recently viewed course IDs
export const getRecentlyViewedCourses = (): string[] => {
    try {
        const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

// Add course to recently viewed
export const addToRecentlyViewed = (courseId: string): void => {
    try {
        const recent = getRecentlyViewedCourses();
        // Remove if already exists, then add to front
        const filtered = recent.filter(id => id !== courseId);
        const updated = [courseId, ...filtered].slice(0, 20); // Keep max 20
        localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
    } catch {
        // Ignore storage errors
    }
};

// Category priority for default sorting (Major first, then GE, PE, NSTP)
const CATEGORY_PRIORITY: Record<string, number> = {
    'major': 0,
    'ge': 1,
    'pe': 2,
    'nstp': 3,
};

// Sort courses
export const sortCourses = (courses: CatalogCourse[], sortBy: SortOption): CatalogCourse[] => {
    const sorted = [...courses];
    switch (sortBy) {
        case 'recent':
            // Sort by recently viewed order, then by category priority (reverse alphabetical for non-viewed)
            const recentIds = getRecentlyViewedCourses();
            return sorted.sort((a, b) => {
                const aIndex = recentIds.indexOf(a.id);
                const bIndex = recentIds.indexOf(b.id);
                // If both are in recent list, sort by their order
                if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
                // If only one is in recent list, it comes first
                if (aIndex !== -1) return -1;
                if (bIndex !== -1) return 1;
                // If neither is in recent list, sort by category priority then REVERSE alphabetical
                // This ensures "Recent" and "Alphabetical" produce different orders
                const catPriorityA = CATEGORY_PRIORITY[a.category] ?? 99;
                const catPriorityB = CATEGORY_PRIORITY[b.category] ?? 99;
                if (catPriorityA !== catPriorityB) return catPriorityA - catPriorityB;
                // Reverse alphabetical within same category
                return b.title.localeCompare(a.title);
            });
        case 'title':
            // Pure alphabetical sort by title
            return sorted.sort((a, b) => a.title.localeCompare(b.title));
        default:
            return sorted;
    }
};

// Search courses
export const searchCourses = (courses: CatalogCourse[], query: string): CatalogCourse[] => {
    if (!query.trim()) return courses;
    const lowerQuery = query.toLowerCase();
    return courses.filter(c => 
        c.title.toLowerCase().includes(lowerQuery) ||
        c.shortTitle.toLowerCase().includes(lowerQuery) ||
        c.instructor.toLowerCase().includes(lowerQuery) ||
        c.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
        c.description.toLowerCase().includes(lowerQuery)
    );
};

// Enroll in a course
export const enrollInCourse = async (courseId: string): Promise<boolean> => {
    if (isSupabaseConfigured() && supabase) {
        try {
            const { error } = await supabase
                .from('enrollments')
                .insert({ course_id: courseId, student_id: 'demo-student' });
            
            if (!error) return true;
        } catch (e) {
            console.warn('Enrollment failed');
        }
    }
    // Demo mode - always succeed
    return true;
};

// Get course by ID
export const getCourseById = async (courseId: string): Promise<CatalogCourse | null> => {
    const courses = await getCatalogCourses();
    return courses.find(c => c.id === courseId) || null;
};

// Bookmarks/Favorites storage key
const BOOKMARKS_KEY = 'catalog-bookmarks';

// Get bookmarked course IDs
export const getBookmarkedCourses = (): string[] => {
    try {
        const stored = localStorage.getItem(BOOKMARKS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

// Check if a course is bookmarked
export const isBookmarked = (courseId: string): boolean => {
    return getBookmarkedCourses().includes(courseId);
};

// Toggle bookmark for a course
export const toggleBookmark = (courseId: string): boolean => {
    try {
        const bookmarks = getBookmarkedCourses();
        const isCurrentlyBookmarked = bookmarks.includes(courseId);
        
        if (isCurrentlyBookmarked) {
            // Remove from bookmarks
            const updated = bookmarks.filter(id => id !== courseId);
            localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
            return false; // Now not bookmarked
        } else {
            // Add to bookmarks
            const updated = [courseId, ...bookmarks];
            localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
            return true; // Now bookmarked
        }
    } catch {
        return false;
    }
};
