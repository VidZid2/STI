import * as React from 'react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { getClassmates, type UserAccount } from '../../../../services/usersService';
import { useSystemConfig } from '../../../../contexts/SystemConfigContext';
import { InstructionsModal, SubmitModal, AddTaskModal } from './modals';
import { QuickStatsBar } from './components/QuickStatsBar';
import { StudentCard } from './components/StudentCard';
import { SearchBar, EmptyState } from './components/SharedComponents';
import { ModuleCard, getLockedReason, type ModuleData } from './components/ModuleCard';
import { ActionsDropdown } from './components/ActionsDropdown';
import { useCourseTasks } from './hooks/useCourseTasks';
import { TeacherModeContent } from './components/TeacherModeContent';
import MobileNavModal from './components/MobileNavModal';
import { CourseAssignmentsTab } from './tabs/CourseAssignmentsTab';
import {
    type TaskCategory, getDemoCourseData } from './data/demoCourses';

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
// ContentType, TaskCategory, CourseDataType — imported from ./data/demoCourses

// Typed task shape used throughout CourseViewPage
// @ts-ignore - Reserved for future typed task handling
interface _CourseTask {
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

// Task category configuration for the Tasks tab filter
// @ts-ignore - Reserved for future Tasks tab filter
const _TASK_CATEGORIES: { id: TaskCategory; label: string; icon: React.ReactNode; color: string }[] = [
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

// Content type icons — moved to ./components/ModuleCard.tsx

// Demo helpers removed

// Sample announcements for the News tab
const SAMPLE_NEWS: { id: number; title: string; date: string; preview: string; unread: boolean }[] = [];

// QuickStatsBar — moved to ./components/QuickStatsBar.tsx
// SearchBar + EmptyState — moved to ./components/SharedComponents.tsx
// StudentCard — moved to ./components/StudentCard.tsx
// ContentIconWithTooltip + ModuleCard — moved to ./components/ModuleCard.tsx

// TAB_ACTIONS + ActionsDropdown + ActionMenuItem — moved to ./components/ActionsDropdown.tsx

// ActionMenuItem — moved to ./components/ActionsDropdown.tsx

// PaginationButton + PageNumberButton — moved to ./components/PaginationControls.tsx
// PreviewIconWithTooltip — moved to ./components/PreviewIconWithTooltip.tsx

// FloatingActionButton stub — all actions moved to top dropdown
const FloatingActionButton: React.FC<{
    activeTab: TabType;
    onAction: (action: string) => void;
}> = ({ activeTab: _activeTab, onAction: _onAction }) => {
    void _activeTab; void _onAction;
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
        ) },
    {
        id: 'assignments',
        label: 'Tasks',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
        ) },
    {
        id: 'news',
        label: 'News',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
        ) },
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
        ) },
    {
        id: 'teachers',
        label: 'Teachers',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
        ) },
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
    const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
    const [tabIndicatorStyle, setTabIndicatorStyle] = useState({ left: 4, width: 80 });
    const [modulesPage, setModulesPage] = useState(1);
    const [canScrollTabsLeft, setCanScrollTabsLeft] = useState(false);
    const [canScrollTabsRight, setCanScrollTabsRight] = useState(false);
    const [canScrollGradingLeft, setCanScrollGradingLeft] = useState(false);
    const [canScrollGradingRight, setCanScrollGradingRight] = useState(false);
    const gradingTabsRef = useRef<HTMLDivElement>(null);
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    // Supabase students data
    const [supabaseStudents, setSupabaseStudents] = useState<UserAccount[]>([]);
    const [isLoadingStudents, setIsLoadingStudents] = useState(true);

    // Supabase tasks — managed by useCourseTasks hook
    const { tasks: supabaseTasks, refetch: fetchSupabaseTasks } = useCourseTasks(course.id);

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



    const [submissions, setSubmissions] = useState(() => {
        // Fallback or empty state
        return SAMPLE_SUBMISSIONS;
    });

    // No-op or handle real submission saves here
    useEffect(() => {
        // Will be replaced by actual Supabase service
    }, [submissions, course.id]);

    // State for viewing task details in a modal
    const [instructionsModalTask, setInstructionsModalTask] = useState<any>(null);
    // State for the separate Submit Assignment modal
    const [submitModalTask, setSubmitModalTask] = useState<any>(null);

    const [showAddTaskModal, setShowAddTaskModal] = useState(false);
    const [selectedTaskType, setSelectedTaskType] = useState<TaskCategory>('assignment');

    const [isAiGrading, setIsAiGrading] = useState(false);
    const [aiGradingProgress, setAiGradingProgress] = useState(0);
    const [showAiWarning, setShowAiWarning] = useState(false);
    const [showYearDropdown, setShowYearDropdown] = useState(false);
    const [showSectionDropdown, setShowSectionDropdown] = useState(false);
    const [showTeacherTutorial, setShowTeacherTutorial] = useState(false);
    const [tutorialStep, setTutorialStep] = useState(0);
    const [contactTooltip, _setContactTooltip] = useState<{ visible: boolean; x: number; y: number }>({ visible: false, x: 0, y: 0 });

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
            setTabIndicatorStyle({
                left: activeButton.offsetLeft,
                width: activeButton.offsetWidth
            });
            // Auto-scroll the active tab into view on mobile/tablet
            activeButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
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
                setTabIndicatorStyle({
                    left: activeButton.offsetLeft,
                    width: activeButton.offsetWidth
                });
                activeButton.scrollIntoView({ block: 'nearest', inline: 'nearest' });
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
                height: (combinedRect.bottom - combinedRect.top) + padding * 2 + offset.height });

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
            'uts': { name: 'Jocel Lazalita', title: 'Instructor', email: 'j.lazalita@university.edu' } };
        return instructors[course.id] || { name: 'Instructor', title: 'Instructor', email: 'instructor@university.edu' };
    };

    const instructor = getInstructor();

    // Get course-specific data
    const initialModules = useMemo(() => getDemoCourseData(course.id).modules, [course.id]);
    const [courseModules, setCourseModules] = useState<ModuleData[]>(initialModules);
    
    useEffect(() => {
        setCourseModules(initialModules);
    }, [initialModules]);
    
    // Merge demo tasks with real Supabase tasks
    const demoTasks = useMemo(() => getDemoCourseData(course.id).tasks, [course.id]);
    const courseTasks = useMemo(() => {
        return [...supabaseTasks, ...demoTasks];
    }, [supabaseTasks, demoTasks]);

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

    // Automatically select the first module if none is selected or if the selected one is filtered out
    useEffect(() => {
        if (filteredModules.length > 0) {
            const isSelectedValid = selectedModuleId !== null && filteredModules.some(m => m.id === selectedModuleId);
            if (!isSelectedValid) {
                setSelectedModuleId(filteredModules[0].id);
            }
        } else {
            setSelectedModuleId(null);
        }
    }, [filteredModules, selectedModuleId]);

    // Reset modules pagination page when the list of modules changes
    useEffect(() => {
        setModulesPage(1);
    }, [filteredModules]);

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

            const taskAny = t as any;
            const matchesSemester = (taskAny.semester || 'first') === semesterFilter;

            return matchesSearch && matchesCategory && matchesSemester;
        }),
        [searchQuery, taskFilter, semesterFilter, courseTasks]
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
                lastActive: s.last_active }));
        }
        return [];
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

    // Teachers and AI Grading data moved to Supabase and will be fetched dynamically


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

                        {/* Desktop/Tablet: Filter Panels above sidebar */}
                        <div className="hidden sm:flex flex-col lg:flex-row items-stretch gap-4 w-full max-w-7xl mx-auto">
                            {/* Academic Semester Panel */}
                            <div className="w-full lg:w-[320px] xl:w-[380px] relative p-4 rounded-[20px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex-shrink-0">
                                <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
                                <div className="relative z-10">
                                    <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-1">Academic Semester</h4>
                                    <div className="flex p-1 bg-slate-50 dark:bg-slate-700/50 rounded-[12px] border border-slate-200/80 dark:border-slate-600/50 w-full">
                                        {[
                                            { id: 'first' as const, label: '1st Semester' },
                                            { id: 'second' as const, label: '2nd Semester' }
                                        ].map((sem) => {
                                            const isActive = semesterFilter === sem.id;
                                            return (
                                                <button
                                                    key={sem.id}
                                                    onClick={() => setSemesterFilter(sem.id)}
                                                    className={`relative flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-[10px] text-sm font-bold transition-colors duration-200 ${
                                                        isActive
                                                            ? 'text-blue-700 dark:text-blue-400'
                                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                                    }`}
                                                >
                                                    {isActive && (
                                                        <motion.div
                                                            layoutId="activeSemesterTabDesktop"
                                                            className="absolute inset-0 bg-white dark:bg-slate-600 rounded-[10px] shadow-sm border border-slate-200/50 dark:border-slate-500/50 z-0"
                                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                                        />
                                                    )}
                                                    <span className="relative z-10 whitespace-nowrap">{sem.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Grading Period Panel */}
                            <div className="flex-1 min-w-0 relative p-4 rounded-[20px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                                <div className="absolute top-0 right-0 -mr-10 -mt-10 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
                                <div className="relative z-10">
                                    <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-1">Grading Period</h4>
                                    <div className="flex flex-wrap p-1 bg-slate-50 dark:bg-slate-700/50 rounded-[12px] border border-slate-200/80 dark:border-slate-600/50 w-full">
                                        {[
                                            { id: 'all' as const, label: 'All' },
                                            { id: 'prelims' as const, label: 'Prelims' },
                                            { id: 'midterm' as const, label: 'Midterm' },
                                            { id: 'prefinals' as const, label: 'Pre-Finals' },
                                            { id: 'finals' as const, label: 'Finals' },
                                        ].map((term) => {
                                            const isActive = termFilter === term.id;
                                            return (
                                                <button
                                                    key={term.id}
                                                    onClick={() => setTermFilter(term.id)}
                                                    className={`relative flex-auto flex items-center justify-center gap-2 py-2 px-3 rounded-[10px] text-sm font-bold transition-colors duration-200 ${
                                                        isActive
                                                            ? 'text-blue-700 dark:text-blue-400'
                                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                                    }`}
                                                >
                                                    {isActive && (
                                                        <motion.div
                                                            layoutId="activeTermTabDesktop"
                                                            className="absolute inset-0 bg-white dark:bg-slate-600 rounded-[10px] shadow-sm border border-slate-200/50 dark:border-slate-500/50 z-0"
                                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                                        />
                                                    )}
                                                    <span className="relative z-10 whitespace-nowrap">{term.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar-Detail Navigation Layout */}
                        {(() => {
                            const selectedModule = filteredModules.find(m => m.id === selectedModuleId) || filteredModules[0];
                            const itemsPerPage = 3;
                            const totalPages = Math.ceil(filteredModules.length / itemsPerPage);
                            const currentPage = Math.min(modulesPage, totalPages || 1);
                            const startIndex = (currentPage - 1) * itemsPerPage;
                            const paginatedModules = filteredModules.slice(startIndex, startIndex + itemsPerPage);
                            
                            return (
                                <div className="flex flex-col lg:flex-row items-stretch lg:items-stretch gap-4 w-full max-w-7xl mx-auto">
                                    {/* Sidebar Navigation */}
                                    <div className="w-full lg:w-[320px] xl:w-[380px] shrink-0 flex flex-col gap-3 p-3.5 sm:p-4 rounded-[20px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm relative">
                                        {/* Semester Filter (mobile only) */}
                                        <div className="flex-shrink-0 sm:hidden">
                                            <h4 className="text-[10px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 px-0.5">Semester</h4>
                                            <div className="flex p-1 bg-slate-50 dark:bg-slate-700/50 rounded-[12px] border border-slate-200/80 dark:border-slate-600/50 w-full">
                                                {[
                                                    { id: 'first' as const, label: '1st Sem' },
                                                    { id: 'second' as const, label: '2nd Sem' }
                                                ].map((sem) => {
                                                    const isActive = semesterFilter === sem.id;
                                                    return (
                                                        <button
                                                            key={sem.id}
                                                            onClick={() => setSemesterFilter(sem.id)}
                                                            className={`relative flex-1 flex items-center justify-center gap-1.5 py-1.5 sm:py-2 px-2 sm:px-3 rounded-[9px] sm:rounded-[10px] text-xs sm:text-xs font-bold transition-colors duration-200 ${
                                                                isActive
                                                                    ? 'text-blue-700 dark:text-blue-400'
                                                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                                            }`}
                                                        >
                                                             {isActive && (
                                                                <motion.div
                                                                    layoutId="activeSemesterTab"
                                                                    className="absolute inset-0 bg-white dark:bg-slate-600 rounded-[9px] sm:rounded-[10px] shadow-sm border border-slate-200/50 dark:border-slate-500/50 z-0"
                                                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                                                />
                                                             )}
                                                            <span className="relative z-10 whitespace-nowrap">{sem.label}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Divider (mobile only) */}
                                        <hr className="border-t border-slate-100 dark:border-slate-700/50 sm:hidden" />

                                        {/* Grading Period Filter (mobile only) */}
                                        <div className="flex-shrink-0 sm:hidden">
                                            <h4 className="text-[10px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 px-0.5">Grading Period</h4>
                                            <div className="relative">
                                                {/* Left Fade */}
                                                {canScrollGradingLeft && (
                                                    <div className="absolute left-0 top-0 bottom-0 w-5 bg-gradient-to-r from-white dark:from-slate-800 to-transparent pointer-events-none z-20 rounded-l-[12px]" />
                                                )}
                                                {/* Right Fade */}
                                                {canScrollGradingRight && (
                                                    <div className="absolute right-0 top-0 bottom-0 w-5 bg-gradient-to-l from-white dark:from-slate-800 to-transparent pointer-events-none z-20 rounded-r-[12px]" />
                                                )}
                                                <div 
                                                    ref={gradingTabsRef}
                                                    onScroll={() => {
                                                        const el = gradingTabsRef.current;
                                                        if (!el) return;
                                                        const threshold = 5;
                                                        setCanScrollGradingLeft(el.scrollLeft > threshold);
                                                        setCanScrollGradingRight(el.scrollLeft < el.scrollWidth - el.clientWidth - threshold);
                                                    }}
                                                    className="flex gap-1.5 p-1.5 overflow-x-auto bg-slate-50 dark:bg-slate-700/50 rounded-[12px] border border-slate-200/80 dark:border-slate-600/50 w-full relative"
                                                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                                >
                                                    {[
                                                        { id: 'all' as const, label: 'All' },
                                                        { id: 'prelims' as const, label: 'Prelims' },
                                                        { id: 'midterm' as const, label: 'Midterm' },
                                                        { id: 'prefinals' as const, label: 'Pre-Finals' },
                                                        { id: 'finals' as const, label: 'Finals' },
                                                    ].map((term) => {
                                                        const isActive = termFilter === term.id;
                                                        return (
                                                            <button
                                                                key={term.id}
                                                                onClick={() => setTermFilter(term.id)}
                                                                className={`relative shrink-0 flex items-center justify-center gap-1.5 py-2.5 sm:py-2.5 px-4 sm:px-4 rounded-lg text-sm sm:text-xs font-bold whitespace-nowrap transition-colors duration-200 ${
                                                                isActive
                                                                    ? 'text-blue-700 dark:text-blue-400'
                                                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                                            }`}
                                                        >
                                                            {isActive && (
                                                                <motion.div
                                                                    layoutId="activeTermTab"
                                                                    className="absolute inset-0 bg-white dark:bg-slate-600 rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-500/50 z-0"
                                                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                                                />
                                                            )}
                                                            <span className="relative z-10 whitespace-nowrap truncate">{term.label}</span>
                                                        </button>
                                                    );
                                                })}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Divider (mobile only) */}
                                        <hr className="border-t border-slate-100 dark:border-slate-700/50 sm:hidden" />

                                        {/* Module List */}
                                        <div className="flex flex-col gap-2.5 py-1 min-h-0 sm:flex-1">
                                            <AnimatePresence mode="wait">
                                                {filteredModules.length === 0 ? (
                                                    <motion.div 
                                                        key="empty-sidebar-modules"
                                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                                        className="flex flex-col items-center justify-center h-full text-center py-10 px-4"
                                                    >
                                                        <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-zinc-800/50 flex items-center justify-center text-slate-400 dark:text-zinc-500 mb-3 border border-slate-100 dark:border-zinc-800 shadow-sm">
                                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                                                <path d="M8 7h8M8 11h6M8 15h4" />
                                                            </svg>
                                                        </div>
                                                        <h3 className="text-[13px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
                                                            {searchQuery ? `No modules match "${searchQuery}"` : termFilter !== 'all' ? `No modules in ${termFilter === 'prelims' ? 'Preliminaries' : termFilter === 'midterm' ? 'Midterm' : termFilter === 'prefinals' ? 'Pre-Finals' : 'Finals'}` : "No modules found"}
                                                        </h3>
                                                        <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-500 tracking-wide">
                                                            Nothing yet, so be ready!
                                                        </p>
                                                    </motion.div>
                                                ) : (
                                                    <motion.div
                                                        key={paginatedModules.map(m => m.id).join('-')}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: 10 }}
                                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                                        className="flex flex-col gap-3"
                                                    >
                                                        {paginatedModules.map((m, index) => {
                                                            const globalIndex = startIndex + index;
                                                            const isSelected = m.id === selectedModuleId;
                                                            const completedCount = m.contents.filter((c: any) => c.completed).length;
                                                            const progress = m.contents.length > 0 ? Math.round((completedCount / m.contents.length) * 100) : 0;
                                                            
                                                            let statusIcon;
                                                            if (m.status === 'locked') {
                                                                statusIcon = (
                                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
                                                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                                                    </svg>
                                                                );
                                                            } else if (progress === 100) {
                                                                statusIcon = (
                                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                                                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                                                    </svg>
                                                                );
                                                            } else {
                                                                statusIcon = (
                                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                        <circle cx="12" cy="12" r="10"></circle>
                                                                        <polygon points="10 8 16 12 10 16 10 8"></polygon>
                                                                    </svg>
                                                                );
                                                            }

                                                            return (
                                                                <motion.button
                                                                    key={m.id}
                                                                    onClick={() => setSelectedModuleId(m.id)}
                                                                    whileHover={m.status !== 'locked' ? { scale: 1.02, y: -2 } : {}}
                                                                    whileTap={m.status !== 'locked' ? { scale: 0.98 } : {}}
                                                                    className={`relative overflow-hidden flex items-center justify-between p-4 rounded-2xl border transition-colors duration-200 min-w-[250px] lg:min-w-0 w-full sm:flex-1 ${
                                                                        isSelected 
                                                                            ? 'bg-white border-blue-200/80 shadow-sm dark:bg-zinc-900 dark:border-blue-800/50 hover:shadow-md hover:border-blue-200/80 dark:hover:border-blue-800/50 group' 
                                                                            : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 group'
                                                                    } ${m.status === 'locked' ? 'opacity-70 grayscale-[0.2]' : ''}`}
                                                                >
                                                                    {/* SaaS Background Accents */}
                                                                    {isSelected && (
                                                                        <>
                                                                            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-32 h-32 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-300 group-hover:scale-150" aria-hidden="true" />
                                                                            <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-24 h-24 bg-blue-400/10 dark:bg-blue-400/5 rounded-full blur-3xl pointer-events-none transition-transform duration-300 group-hover:scale-150" aria-hidden="true" />
                                                                        </>
                                                                    )}

                                                                    <div className="flex items-center gap-3.5 min-w-0 flex-1 relative z-10">
                                                                        {/* Custom Icon Container */}
                                                                        <motion.div
                                                                            whileHover={m.status !== 'locked' ? { scale: 1.05, rotate: -5 } : {}}
                                                                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                                                            className={`w-9 h-9 sm:w-11 sm:h-11 rounded-[10px] sm:rounded-[12px] flex items-center justify-center border shrink-0 shadow-sm relative transition-colors duration-200 ${
                                                                                m.status === 'locked'
                                                                                    ? 'border-zinc-200/40 dark:border-zinc-800/40 bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-400 dark:text-zinc-500'
                                                                                    : isSelected
                                                                                        ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400'
                                                                                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/20 group-hover:border-blue-200 dark:group-hover:border-blue-800/50 group-hover:text-blue-500 dark:group-hover:text-blue-400'
                                                                            }`}
                                                                        >
                                                                            {statusIcon}
                                                                        </motion.div>

                                                                        <div className="min-w-0 flex-1 text-left flex flex-col items-start justify-center pr-2">
                                                                            <p className={`text-[10px] sm:text-[11px] font-bold tracking-wider uppercase mb-0.5 ${isSelected ? 'text-blue-500' : 'text-slate-400'}`}>
                                                                                Module {globalIndex + 1}
                                                                            </p>
                                                                            <p className={`text-[13px] sm:text-[14px] font-bold leading-snug tracking-tight transition-colors line-clamp-2 w-full ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400'}`} title={m.title}>
                                                                                {m.title.replace(/^Module \d+:\s*/i, '').replace(/^Chapter \d+:\s*/i, '').replace(/^Unit \d+:\s*/i, '')}
                                                                            </p>
                                                                            {m.status === 'locked' && (
                                                                                <p className="text-[11px] font-semibold text-rose-500 dark:text-rose-400 leading-normal mt-1 truncate w-full">
                                                                                    {getLockedReason(m).short}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    {/* Action / Percentage Badge Redesign */}
                                                                    {(() => {
                                                                        const radius = 10;
                                                                        const circumference = 2 * Math.PI * radius;
                                                                        const strokeDashoffset = circumference - (progress / 100) * circumference;

                                                                        return (
                                                                            <div className="relative w-auto h-8 sm:h-10 px-2 sm:px-3 flex items-center justify-center shrink-0 ml-2 sm:ml-3 z-10 bg-zinc-50 dark:bg-zinc-800/50 rounded-[10px] sm:rounded-[12px] border border-zinc-200/80 dark:border-zinc-700 shadow-sm transition-all duration-300 group-hover:border-blue-200 dark:group-hover:border-blue-700/50 group-hover:bg-blue-50/50 dark:group-hover:bg-blue-900/20">
                                                                                {progress === 100 ? (
                                                                                    <div className="flex items-center gap-1 sm:gap-1.5">
                                                                                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 dark:text-emerald-400" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                                                                                            <polyline points="20 6 9 17 4 12" />
                                                                                        </svg>
                                                                                        <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 dark:text-emerald-400">DONE</span>
                                                                                    </div>
                                                                                ) : m.status === 'locked' ? (
                                                                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                                                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                                                                    </svg>
                                                                                ) : (
                                                                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                                                                        <svg className="-rotate-90 w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24">
                                                                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" className="text-zinc-200/50 dark:text-zinc-700/50" />
                                                                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" className="text-blue-500 dark:text-blue-400 transition-all duration-500" style={{ strokeDasharray: circumference, strokeDashoffset }} strokeLinecap="round" />
                                                                                        </svg>
                                                                                        <span className="text-[10px] sm:text-[12px] font-bold text-blue-600 dark:text-blue-400 w-7 sm:w-9 text-right">{Math.round(progress)}%</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })()}
                                                                </motion.button>
                                                            );
                                                        })}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Pagination Controls */}
                                        {filteredModules.length > itemsPerPage && (
                                            <div className="w-full pt-2.5 mt-auto border-t border-zinc-100 dark:border-zinc-800/80">
                                                <div className="flex items-center justify-between w-full gap-2 bg-white dark:bg-zinc-900 p-1.5 rounded-[14px] border border-zinc-200/60 dark:border-zinc-700/50 shadow-sm transition-all duration-300 hover:shadow-md">
                                                    <motion.button 
                                                        type="button"
                                                        onClick={() => setModulesPage(prev => Math.max(prev - 1, 1))}
                                                        disabled={currentPage === 1}
                                                        whileHover={currentPage > 1 ? { scale: 1.05 } : {}}
                                                        whileTap={currentPage > 1 ? { scale: 0.95 } : {}}
                                                        className={`w-9 h-9 rounded-[10px] flex items-center justify-center transition-colors duration-150 shadow-sm cursor-pointer border ${
                                                            currentPage === 1
                                                                ? 'bg-zinc-50/50 dark:bg-zinc-900/20 border-zinc-100 dark:border-zinc-800/40 text-zinc-300 dark:text-zinc-700 cursor-not-allowed'
                                                                : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600 text-zinc-500 hover:text-blue-600 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 hover:border-blue-300 dark:hover:border-blue-500'
                                                        }`}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                                                    </motion.button>
                                                    <span className="text-[13px] font-bold text-zinc-700 dark:text-zinc-300 text-center tracking-wide flex-1">
                                                        Page {currentPage} <span className="text-zinc-400 dark:text-zinc-500 font-medium mx-0.5">/</span> {totalPages}
                                                    </span>
                                                    <motion.button 
                                                        type="button"
                                                        onClick={() => setModulesPage(prev => Math.min(prev + 1, totalPages))}
                                                        disabled={currentPage === totalPages}
                                                        whileHover={currentPage < totalPages ? { scale: 1.05 } : {}}
                                                        whileTap={currentPage < totalPages ? { scale: 0.95 } : {}}
                                                        className={`w-9 h-9 rounded-[10px] flex items-center justify-center transition-colors duration-150 shadow-sm cursor-pointer border ${
                                                            currentPage === totalPages
                                                                ? 'bg-zinc-50/50 dark:bg-zinc-900/20 border-zinc-100 dark:border-zinc-800/40 text-zinc-300 dark:text-zinc-700 cursor-not-allowed'
                                                                : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600 text-zinc-500 hover:text-blue-600 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 hover:border-blue-300 dark:hover:border-blue-500'
                                                        }`}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                                    </motion.button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Detail Panel */}
                                    <div className="flex-1 min-w-0" ref={modulesScrollRef}>
                                        <AnimatePresence mode="wait">
                                            {filteredModules.length === 0 ? (
                                                <motion.div
                                                    key="empty-detail-modules"
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    transition={{ duration: 0.25, ease: 'easeOut' }}
                                                    className="h-full"
                                                >
                                                    <EmptyState
                                                        icon={
                                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                                                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                                                <path d="M8 7h8M8 11h6M8 15h4" />
                                                            </svg>
                                                        }
                                                        title={searchQuery ? `No modules match "${searchQuery}"` : termFilter !== 'all' ? `No modules in ${termFilter === 'prelims' ? 'Preliminaries' : termFilter === 'midterm' ? 'Midterm' : termFilter === 'prefinals' ? 'Pre-Finals' : 'Finals'}` : "No modules found"}
                                                        description="Nothing yet, so be ready!"
                                                        className="h-full min-h-[380px]"
                                                        action={(searchQuery || termFilter !== 'all') ? {
                                                            label: searchQuery ? 'Clear search' : 'Show all',
                                                            onClick: () => { setSearchQuery(''); setTermFilter('all'); }
                                                        } : undefined}
                                                    />
                                                </motion.div>
                                            ) : selectedModule && (
                                                <motion.div
                                                    key={selectedModule.id}
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    transition={{ duration: 0.25, ease: 'easeOut' }}
                                                >
                                                    <ModuleCard 
                                                        module={selectedModule} 
                                                        index={filteredModules.findIndex(m => m.id === selectedModule.id)} 
                                                        onUpdate={(updatedModule) => {
                                                            setCourseModules(prev => prev.map(m => m.id === updatedModule.id ? updatedModule : m));
                                                        }}
                                                    />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            );
                        })()}
                    </motion.div>
                );

            case 'assignments':
                // Assignments tab — extracted to ./tabs/CourseAssignmentsTab.tsx
                return (
                    <CourseAssignmentsTab
                        course={course}
                        isLoading={isLoading}
                        courseTasks={courseTasks}
                        taskFilter={taskFilter}
                        setTaskFilter={setTaskFilter}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        isSearching={isSearching}
                        systemConfig={systemConfig}
                        showAddTaskModal={showAddTaskModal}
                        setShowAddTaskModal={setShowAddTaskModal}
                        refetchTasks={fetchSupabaseTasks}
                        setSubmitModalTask={setSubmitModalTask}
                        setInstructionsModalTask={setInstructionsModalTask}
                    />
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
                                    <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                        <line x1="12" y1="2" x2="12" y2="4" />
                                    </svg>
                                }
                                title="No Announcements"
                                description={searchQuery ? `No news match "${searchQuery}"` : "There are currently no announcements from your instructor. Check back later for updates!"}
                                action={searchQuery ? { label: "Clear Search", onClick: () => setSearchQuery('') } : undefined}
                            />
                        ) : (
                            <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[22px] p-3.5 shadow-sm flex flex-col gap-2.5">
                                {filteredNews.map((news, index) => (
                                    <motion.div
                                        key={news.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05, duration: 0.2 }}
                                        whileHover={{ y: -2, scale: 1.01, transition: { duration: 0.12, ease: 'easeOut' } }}
                                        whileTap={{ scale: 0.99, transition: { duration: 0.08 } }}
                                        className={`relative flex items-center justify-between p-4 rounded-2xl border transition-colors duration-200 ${
                                            news.unread 
                                                ? 'bg-gradient-to-br from-blue-50/30 to-white dark:from-blue-900/10 dark:to-slate-800/80 border-blue-200 dark:border-blue-800/50' 
                                                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60'
                                        } shadow-[0_2px_8px_-3px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer group/row`}
                                    >
                                        <div className="flex items-start gap-4 min-w-0 flex-1">
                                            {/* Icon Container */}
                                            <motion.div
                                                whileHover={{ scale: 1.05, rotate: -5 }}
                                                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                                className={`w-12 h-12 rounded-[14px] flex items-center justify-center border shrink-0 shadow-sm relative transition-colors duration-200 ${
                                                    news.unread
                                                        ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/30 dark:border-blue-800/50 dark:text-blue-400 group-hover/row:border-blue-300 dark:group-hover/row:border-blue-700'
                                                        : 'bg-zinc-50 border-zinc-200 text-zinc-500 dark:bg-zinc-800/50 dark:border-zinc-700 dark:text-zinc-400 group-hover/row:bg-blue-50 dark:group-hover/row:border-blue-200 dark:group-hover/row:text-blue-500 dark:group-hover/row:bg-blue-950/20'
                                                }`}
                                            >
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                                </svg>
                                                {news.unread && (
                                                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white dark:border-slate-800" />
                                                )}
                                            </motion.div>

                                            {/* Text Content */}
                                            <div className="min-w-0 flex-1 text-left flex flex-col items-start justify-center">
                                                <p className={`text-[15px] font-bold leading-snug tracking-tight transition-colors truncate pr-1 w-full ${news.unread ? 'text-slate-900 dark:text-slate-100 group-hover/row:text-blue-700 dark:group-hover/row:text-blue-400' : 'text-slate-800 dark:text-slate-200 group-hover/row:text-blue-700 dark:group-hover/row:text-blue-400'}`}>
                                                    {news.title}
                                                </p>
                                                <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed mt-1 mb-2.5 line-clamp-2 w-full pr-4">
                                                    {news.preview}
                                                </p>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <motion.div 
                                                        whileHover={{ scale: 1.03 }}
                                                        whileTap={{ scale: 0.97 }}
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 text-zinc-500 dark:text-zinc-400 shadow-sm cursor-pointer group-hover/row:border-blue-200/80 dark:group-hover/row:border-blue-800/50 group-hover/row:text-blue-600 dark:group-hover/row:text-blue-400 transition-colors duration-150"
                                                    >
                                                        <span className="text-zinc-400 dark:text-zinc-500 group-hover/row:text-blue-500 dark:group-hover/row:text-blue-400 shrink-0 flex items-center justify-center w-3.5 h-3.5 [&>svg]:w-full [&>svg]:h-full transition-colors">
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                                                <line x1="3" y1="10" x2="21" y2="10"></line>
                                                            </svg>
                                                        </span>
                                                        <span>{news.date}</span>
                                                    </motion.div>
                                                    {news.unread && (
                                                        <div className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 shadow-sm">
                                                            New
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Read More Action Button */}
                                        <motion.div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center border transition-colors duration-200 shrink-0 bg-zinc-50 border-zinc-200 text-zinc-500 group-hover/row:bg-blue-50 group-hover/row:border-blue-200 group-hover/row:text-blue-600 dark:bg-zinc-800/40 dark:border-zinc-700 dark:text-zinc-400 dark:group-hover/row:bg-blue-950/30 dark:group-hover/row:border-blue-900/40 dark:group-hover/row:text-blue-400 ml-2 hidden sm:flex"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="9 18 15 12 9 6" />
                                            </svg>
                                        </motion.div>
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
                        {/* Split Cards matching the Academic Semester / Grading Period layout */}
                        <div className="mb-4 flex flex-col md:flex-row gap-4">
                            {/* Section Info Card */}
                            <div className="flex-1 p-5 rounded-[20px] bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-sm flex flex-col justify-center transition-all duration-300 hover:shadow-md">
                                <span className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">CURRENT SECTION</span>
                                <div className="flex items-center gap-3.5">
                                    <div className="w-12 h-12 rounded-[14px] bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0 shadow-sm border border-blue-100/50 dark:border-blue-800/30">
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-[16px] font-extrabold text-slate-800 dark:text-slate-200 leading-tight">BSIT101-A</h3>
                                        <p className="text-[13px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                                            {filteredStudents.length} {filteredStudents.length === 1 ? 'student' : 'students'} {searchQuery || studentFilter !== 'all' ? 'found' : 'enrolled'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Status Filter Card */}
                            <div className="flex-[2] p-5 rounded-[20px] bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-sm flex flex-col justify-center transition-all duration-300 hover:shadow-md">
                                <span className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">STUDENT STATUS</span>
                                <div className="inline-flex items-center p-1.5 rounded-[16px] bg-slate-50/80 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-700/50 w-full sm:w-auto overflow-x-auto">
                                    {studentFilterTabs.map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setStudentFilter(tab.id)}
                                            className={`relative flex items-center justify-center gap-2 px-5 py-2.5 rounded-[12px] text-[13px] font-bold transition-colors duration-200 outline-none flex-1 sm:flex-none whitespace-nowrap ${
                                                studentFilter === tab.id
                                                    ? 'text-blue-700 dark:text-blue-400'
                                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                            }`}
                                        >
                                            {studentFilter === tab.id && (
                                                <motion.div
                                                    layoutId="studentFilterTabIndicator"
                                                    className="absolute inset-0 bg-white dark:bg-zinc-700 rounded-[12px] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] border border-slate-200/60 dark:border-zinc-600/50"
                                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                                />
                                            )}
                                            <span className="relative z-10 flex items-center gap-1.5">
                                                <span className={studentFilter === tab.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}>{tab.icon}</span>
                                                {tab.label}
                                                <span className={`ml-1 px-2 py-0.5 rounded-[8px] text-[11px] font-extrabold leading-none ${
                                                    studentFilter === tab.id 
                                                        ? 'bg-blue-100/70 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' 
                                                        : 'bg-slate-200/60 text-slate-500 dark:bg-zinc-800 dark:text-slate-400'
                                                }`}>
                                                    {tab.count}
                                                </span>
                                            </span>
                                        </button>
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
                        {/* Teacher Card - Profile Layout Redesign */}
                        <div className="group relative overflow-hidden flex flex-col md:flex-row items-center md:items-center gap-6 lg:gap-8 rounded-[20px] border p-6 lg:p-7 bg-white md:bg-gradient-to-r md:from-white md:to-slate-50/50 dark:bg-zinc-900 dark:md:from-zinc-900 dark:md:to-zinc-800/20 border-zinc-200/80 dark:border-zinc-800/80 shadow-sm hover:shadow-md hover:border-blue-200/80 dark:hover:border-blue-800/50 transition-all duration-300 md:max-w-5xl md:mx-auto">
                            
                            {/* Profile Avatar */}
                            <div className="flex-shrink-0 pt-1 md:pt-0">
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 border-4 border-white dark:border-zinc-800 shadow-[0_4px_14px_-4px_rgba(0,0,0,0.1)] flex items-center justify-center relative"
                                >
                                    <span className="text-3xl font-black md:text-4xl md:font-extrabold text-blue-600 dark:text-blue-400 tracking-tight">
                                        {instructor.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                    </span>
                                    <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-[3px] border-white dark:border-zinc-900 shadow-sm" />
                                </motion.div>
                            </div>

                            {/* Profile Details & Tags */}
                            <div className="flex flex-col flex-1 text-center md:text-left min-w-0 w-full">
                                {/* Type badge */}
                                <div className="mb-3 flex justify-center md:justify-start">
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '8px',
                                        background: 'rgba(59, 130, 246, 0.1)',
                                        border: '1px solid rgba(59, 130, 246, 0.2)',
                                        color: '#2563eb',
                                        fontSize: '10px',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }} className="inline-flex items-center gap-1.5 shadow-sm dark:text-blue-400">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                        </svg>
                                        INSTRUCTOR
                                    </span>
                                </div>

                                <h3 className="text-[20px] sm:text-[22px] font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug truncate">
                                    {instructor.name}
                                </h3>
                                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider mt-1 truncate">
                                    {instructor.title} · Computer Science Department
                                </p>
                                
                                <div className="mt-2.5 mb-1 hidden md:block">
                                    <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                                        Connect with your instructor for questions, office hours, or extra help regarding the course material.
                                    </p>
                                </div>

                                {/* Meta Tag Rows */}
                                <div className="flex flex-row items-center gap-2 w-full mt-4 justify-center md:justify-start">
                                    {/* Office Hours Tag */}
                                    <div className="flex items-center gap-2.5 px-3 py-2.5 bg-white dark:bg-slate-800 rounded-[12px] border border-slate-200 dark:border-slate-700/50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-default group/tag flex-1 min-w-0 md:flex-none md:w-[200px] lg:w-[220px]">
                                        <div className="w-7 h-7 rounded-[8px] bg-blue-50 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover/tag:scale-110 transition-transform duration-300 flex-shrink-0">
                                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                                        </div>
                                        <div className="flex flex-col flex-1 min-w-0 justify-center text-left">
                                            <span className="text-[9px] font-bold text-blue-600/70 dark:text-blue-400/70 uppercase tracking-wider mb-0.5 leading-none truncate">OFFICE HOURS</span>
                                            <span className="text-[12px] font-bold text-slate-800 dark:text-slate-200 leading-none truncate">MWF 2-4PM</span>
                                        </div>
                                    </div>
                                    
                                    {/* Location Tag */}
                                    <div className="flex items-center gap-2.5 px-3 py-2.5 bg-white dark:bg-slate-800 rounded-[12px] border border-slate-200 dark:border-slate-700/50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-default group/tag flex-1 min-w-0 md:flex-none md:w-[200px] lg:w-[220px]">
                                        <div className="w-7 h-7 rounded-[8px] bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover/tag:scale-110 transition-transform duration-300 flex-shrink-0">
                                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                        </div>
                                        <div className="flex flex-col flex-1 min-w-0 justify-center text-left">
                                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5 leading-none truncate">LOCATION</span>
                                            <span className="text-[12px] font-bold text-slate-800 dark:text-slate-200 leading-none truncate">Room 301</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions Panel */}
                            <div className="flex flex-col gap-2.5 w-full md:w-56 shrink-0 mt-2 md:mt-0 pt-5 md:pt-0 border-t md:border-t-0 md:border-l border-zinc-150 dark:border-zinc-800/60 md:pl-6 justify-center">
                                <motion.a
                                    href={`mailto:${instructor.email}`}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full flex items-center justify-center gap-1.5 font-bold py-3 md:py-2.5 px-4 rounded-[14px] transition-colors shadow-sm bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900/70 text-blue-700 dark:text-blue-300 focus:outline-none"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                    Send Message
                                </motion.a>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full flex items-center justify-center gap-1.5 font-bold py-3 md:py-2.5 px-4 rounded-[14px] transition-colors shadow-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                    Schedule Meeting
                                </motion.button>
                            </div>

                        </div>
                    </motion.div>
                );
        }
    };


    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col bg-slate-50">
            {/* Back Navigation — SaaS breadcrumb style, above the card */}
            <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                whileHover={{ x: -3 }}
                whileTap={{ scale: 0.97 }}
                onClick={onBack}
                className="mx-6 mt-4 mb-2 flex items-center gap-2 text-sm font-medium text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer w-fit group/back"
            >
                <svg className="w-4 h-4 transition-transform duration-200 group-hover/back:-translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
            </motion.button>

            {/* Header - HomeContent Study Tools Style */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.99 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                className="mx-2 sm:mx-6 mb-4 sm:mb-6 relative overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-[20px] sm:rounded-[24px] p-3.5 sm:p-6 lg:p-8 lg:px-10 flex flex-col gap-3 sm:gap-5 group transition-all duration-300 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 cursor-default"
            >
                {/* Ambient Background Glow */}
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px] translate-x-1/3 -translate-y-1/3 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-emerald-500/5 rounded-full blur-[60px] -translate-x-1/3 translate-y-1/3 pointer-events-none" />

                {/* Top Row: Icon, Title & Section */}
                <div className="flex items-center gap-3 sm:gap-5 w-full relative z-10">
                    <motion.div
                        whileHover={{ scale: 1.05, rotate: -5 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                        className="w-11 h-11 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-[14px] sm:rounded-[20px] lg:rounded-[22px] bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/50 flex items-center justify-center flex-shrink-0 shadow-sm relative overflow-hidden"
                    >
                        {course.image ? (
                            <img src={course.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                            </svg>
                        )}
                    </motion.div>
                    <div className="flex flex-col flex-1 min-w-0">
                        <h1 className="text-base sm:text-xl lg:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight sm:leading-none mb-1 sm:mb-1.5 transition-colors truncate">
                            {displayTitle}
                        </h1>
                        <p className="leading-none mt-0.5">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-[12px] border border-slate-200 dark:border-slate-700/50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-default">
                                <span className="w-6 h-6 rounded-[8px] bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-3 h-3 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                    </svg>
                                </span>
                                <span className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">Section BSIT101-A</span>
                            </span>
                        </p>
                    </div>
                </div>

                {/* Info Badges + Progress — 2-column grid on mobile, row on tablet+ */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 relative z-10 w-full">
                    {/* Progress — mobile/tablet only, hidden on desktop (QuickStatsBar handles it) */}
                    <div className="flex items-center gap-3 sm:flex-1 sm:min-w-0 w-full lg:hidden">
                        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white dark:bg-slate-800 rounded-[10px] border border-slate-200 dark:border-slate-700/50 flex-shrink-0">
                            <div className="w-5 h-5 rounded-[6px] bg-blue-50 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">{course.progress}%</span>
                        </div>
                        <div className="flex-1 h-2.5 sm:h-3 rounded-full bg-slate-200/80 dark:bg-slate-700 overflow-hidden shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.15)] border border-black/5 dark:border-white/5">
                            <motion.div
                                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.max(course.progress, 2)}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                        </div>
                    </div>
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
                                        className="h-9 px-3 pr-8 text-[11px] font-medium bg-white/10 text-white border border-white/20 rounded-xl hover:bg-white/20 transition-flex items-center gap-2"
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
                                                        className={`w-full px-3 py-2.5 text-[11px] font-medium flex items-center gap-2.5 transition-${yearLevelFilter === option.value
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
                                        className="h-9 px-3 pr-8 text-[11px] font-medium bg-white/10 text-white border border-white/20 rounded-xl hover:bg-white/20 transition-flex items-center gap-2"
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
                                                        className={`w-full px-3 py-2.5 text-[11px] font-medium flex items-center gap-2.5 transition-${sectionFilter === option.value
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
            <div className="mx-2 sm:mx-6 pt-2 pb-4">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileTap={{ scale: 0.995 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                    className="relative z-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-[20px] sm:rounded-[24px] p-3.5 sm:p-5 lg:p-6 flex flex-col gap-3 sm:gap-5 group transition-all duration-300 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600"
                >
                    {/* Ambient Background Glow */}
                    <div className="absolute top-0 right-0 w-[250px] h-[250px] bg-blue-500/5 rounded-full blur-[80px] translate-x-1/3 -translate-y-1/3 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-[180px] h-[180px] bg-indigo-500/5 rounded-full blur-[60px] -translate-x-1/3 translate-y-1/3 pointer-events-none" />

                    {/* Top Row: Icon & Title */}
                    <div className="flex items-center gap-3 sm:gap-4 w-full relative z-10">
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: -5 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-[12px] sm:rounded-[14px] bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 flex items-center justify-center flex-shrink-0 shadow-sm"
                        >
                            {isTeacherMode ? (
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                                </svg>
                            )}
                        </motion.div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none truncate">
                                {isTeacherMode ? "Course Console" : "Information Base"}
                            </h1>
                            <p className="hidden sm:block text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 leading-none mt-0.5">
                                {isTeacherMode
                                    ? "Manage tasks, grade students, and view analytics."
                                    : "Access modules, tasks, news, and class participants."}
                            </p>
                        </div>
                    </div>

                    {/* Bottom Row: Tabs, Search Bar & Actions */}
                    <div className={`flex flex-col lg:flex-row items-start lg:items-center w-full relative z-10 pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-slate-700/50 gap-3 sm:gap-4 ${!isTeacherMode && activeTab === 'teachers' ? 'lg:justify-center' : 'lg:justify-between'}`}>

                        {/* Tabs Pill Container — visible on all screens */}
                        <motion.div layout transition={{ type: 'spring', stiffness: 400, damping: 30 }} className="flex items-center gap-4 relative z-10 w-full lg:w-auto min-w-0 flex-shrink-0">
                            <div className="relative flex-1 lg:flex-initial w-full">
                                {/* Left Fade */}
                                {canScrollTabsLeft && (
                                    <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white dark:from-slate-800 to-transparent pointer-events-none z-20 rounded-l-xl" />
                                )}

                                <div
                                    ref={tabsContainerRef}
                                    onScroll={() => {
                                        const el = tabsContainerRef.current;
                                        if (!el) return;
                                        const threshold = 5;
                                        setCanScrollTabsLeft(el.scrollLeft > threshold);
                                        setCanScrollTabsRight(el.scrollLeft < el.scrollWidth - el.clientWidth - threshold);
                                    }}
                                    className="flex gap-1 sm:gap-1 p-1 rounded-xl shadow-sm border bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 relative w-full overflow-x-auto"
                                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                >
                                {/* Sliding Indicator */}
                                <motion.div
                                    className="absolute top-1 bottom-1 rounded-lg bg-white border border-slate-200 shadow-sm dark:bg-slate-700 dark:border-slate-600"
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
                                                id: 'manage-tasks' as TeacherTabType, label: 'Tasks', icon: (
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                        <path d="M14 2v6h6" /><path d="M12 18v-6" /><path d="M9 15h6" />
                                                    </svg>
                                                )
                                            },
                                            {
                                                id: 'grade-students' as TeacherTabType, label: 'Grades', icon: (
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
                                                whileTap={{ scale: 0.97 }}
                                                className={`relative z-10 flex items-center justify-center gap-1.5 px-4 py-2.5 sm:px-4 sm:py-2.5 rounded-lg text-sm sm:text-xs font-bold transition-colors whitespace-nowrap flex-shrink-0 ${teacherTab === tab.id
                                                    ? 'text-blue-600 dark:text-slate-100'
                                                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
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
                                            whileTap={{ scale: 0.97 }}
                                            className={`relative z-10 flex items-center justify-center gap-1.5 px-4 py-2.5 sm:px-4 sm:py-2.5 rounded-lg text-sm sm:text-xs font-bold transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === tab.id
                                                ? 'text-blue-600 dark:text-slate-100'
                                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                                }`}
                                        >
                                            {tab.icon}
                                            {tab.label}
                                        </motion.button>
                                    ))
                                )}
                                </div>

                                {/* Right Fade */}
                                {canScrollTabsRight && (
                                    <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white dark:from-slate-800 to-transparent pointer-events-none z-20 rounded-r-xl" />
                                )}
                            </div>
                        </motion.div>

                        {/* Search Bar & Actions */}
                        <AnimatePresence mode="popLayout">
                            {!isTeacherMode && activeTab !== 'teachers' && (
                                <motion.div 
                                    layout
                                    initial={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
                                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
                                    transition={{ duration: 0.25, ease: "easeInOut" }}
                                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:flex-1 min-w-0 sm:justify-end origin-right"
                                >
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
                                    <ActionsDropdown activeTab={activeTab} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-2 sm:px-6">
                <AnimatePresence mode="wait">
                    {isTeacherMode ? (
                        // Teacher Mode Content — extracted to ./components/TeacherModeContent.tsx
                        <TeacherModeContent
                            course={course}
                            teacherTab={teacherTab}
                            setTeacherTab={setTeacherTab}
                            isTeacherLoading={isTeacherLoading}
                            yearLevelFilter={yearLevelFilter}
                            setYearLevelFilter={setYearLevelFilter}
                            sectionFilter={sectionFilter}
                            setSectionFilter={setSectionFilter}
                            submissions={submissions}
                            setSubmissions={setSubmissions}
                            isAiGrading={isAiGrading}
                            setIsAiGrading={setIsAiGrading}
                            aiGradingProgress={aiGradingProgress}
                            setAiGradingProgress={setAiGradingProgress}
                            showAiWarning={showAiWarning}
                            setShowAiWarning={setShowAiWarning}
                            selectedTaskType={selectedTaskType}
                            setSelectedTaskType={setSelectedTaskType}
                            showAddTaskModal={showAddTaskModal}
                            setShowAddTaskModal={setShowAddTaskModal}
                            supabaseStudents={supabaseStudents}
                            supabaseTasks={supabaseTasks}
                            refetchTasks={fetchSupabaseTasks}
                        />
                    ) : (
                        // Student Mode Content
                        <>
                            {/* Search Bar and Actions moved to Information Base Header */}
                            {renderContent()}
                        </>
                    )}
                </AnimatePresence>
            </div>

            {/* Add Task Modal - Extracted to modals/AddTaskModal.tsx */}
            <AddTaskModal
                isOpen={showAddTaskModal}
                isTeacherMode={isTeacherMode}
                courseId={course.id}
                onClose={() => setShowAddTaskModal(false)}
                onTaskCreated={() => fetchSupabaseTasks()}
            />

            {/* Mobile Navigation Modal */}
            <MobileNavModal
                isOpen={isMobileNavOpen}
                onClose={() => setIsMobileNavOpen(false)}
                activeTab={activeTab}
                onTabChange={(tab) => { setActiveTab(tab); setSearchQuery(''); }}
                semesterFilter={semesterFilter}
                onSemesterChange={setSemesterFilter}
                termFilter={termFilter}
                onTermChange={setTermFilter}
                isTeacherMode={isTeacherMode}
                teacherTab={teacherTab}
                onTeacherTabChange={setTeacherTab}
            />

            {/* Floating Action Button */}
            <FloatingActionButton
                activeTab={activeTab}
                onAction={(_action) => {
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
                                        height: highlightRect.height }}
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
                                left: modalPosition.left }}
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
                                            className="text-[11px] font-medium text-zinc-500 hover:text-zinc-700 transition-"
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
                                                className={`w-2 h-2 rounded-full transition-${index === tutorialStep ? 'bg-blue-600' :
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
                                                className="flex-1 py-3 text-sm font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-flex items-center justify-center gap-2"
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
                                            className={`flex-1 py-3 text-sm font-semibold text-white rounded-xl transition-flex items-center justify-center gap-2 ${tutorialStep === TEACHER_TUTORIAL_STEPS.length - 1
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
                                pointerEvents: 'none' }}
                        >
                            {/* Arrow pointing up */}
                            <div style={{
                                position: 'absolute',
                                top: '-6px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '12px',
                                height: '6px',
                                overflow: 'hidden' }}>
                                <div style={{
                                    width: '10px',
                                    height: '10px',
                                    background: '#ffffff',
                                    border: '1px solid rgba(0, 0, 0, 0.06)',
                                    transform: 'rotate(45deg)',
                                    position: 'absolute',
                                    top: '3px',
                                    left: '1px',
                                    boxShadow: '0 -1px 3px rgba(0, 0, 0, 0.04)' }} />
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
                                gap: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div style={{
                                        width: '22px',
                                        height: '22px',
                                        borderRadius: '5px',
                                        background: 'rgba(239, 68, 68, 0.08)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0 }}>
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
                                    border: '1px solid rgba(245, 158, 11, 0.12)' }}>
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

            {/* View Instructions Modal - Extracted to modals/InstructionsModal.tsx */}
            <InstructionsModal
                task={instructionsModalTask}
                onClose={() => setInstructionsModalTask(null)}
            />

            {/* ======================= SUBMIT ASSIGNMENT MODAL - Extracted to modals/SubmitModal.tsx ======================= */}
            <SubmitModal
                task={submitModalTask}
                onClose={() => setSubmitModalTask(null)}
                onSubmitSuccess={() => fetchSupabaseTasks()}
            />
        </motion.div>
    );
};

export default CourseViewPage;
