/**
 * CourseViewPage Types
 * TypeScript type definitions for the course view page component
 */

// Component props
export interface CourseViewPageProps {
    course: CourseData;
    onBack: () => void;
}

// Course data structure
export interface CourseData {
    id: string;
    title: string;
    subtitle: string;
    image: string;
    progress: number;
    instructor?: string;
}

// Tab types
export type TabType = 'modules' | 'assignments' | 'news' | 'students' | 'teachers';

// Content types for modules
export type ContentType = 'handout-a' | 'handout-b' | 'slideshow' | 'video';

// Task categories
export type TaskCategory = 'all' | 'assignment' | 'performance' | 'quiz' | 'practical' | 'journal';

// Task category config
export interface TaskCategoryConfig {
    id: TaskCategory;
    label: string;
    icon: React.ReactNode;
    color: string;
}

// Content type config
export interface ContentTypeConfig {
    label: string;
    icon: React.ReactNode;
    color: string;
}

// Module structure
export interface CourseModule {
    id: string;
    title: string;
    description: string;
    duration: string;
    contents: ModuleContent[];
    isCompleted: boolean;
    isLocked: boolean;
}

// Module content item
export interface ModuleContent {
    id: string;
    type: ContentType;
    title: string;
    duration?: string;
    isCompleted: boolean;
}

// Assignment structure
export interface CourseAssignment {
    id: string;
    title: string;
    description: string;
    dueDate: string;
    category: TaskCategory;
    status: 'pending' | 'submitted' | 'graded';
    grade?: number;
    maxGrade?: number;
}

// News/Announcement structure
export interface CourseNews {
    id: string;
    title: string;
    content: string;
    date: string;
    author: string;
    isPinned: boolean;
}

// Student structure
export interface CourseStudent {
    id: string;
    name: string;
    avatar: string;
    progress: number;
    lastActive: string;
}

// Teacher structure
export interface CourseTeacher {
    id: string;
    name: string;
    avatar: string;
    role: string;
    email: string;
    officeHours?: string;
}
