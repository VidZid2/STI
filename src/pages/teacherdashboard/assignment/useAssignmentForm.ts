/**
 * useAssignmentForm — Phase 7 extraction
 * All form state, Supabase fetching, and AI/submit handlers
 * extracted from CreateAssignmentModal.tsx.
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import {
    chatWithAssignmentAI,
    resolveDueDateSuggestion,
    isAIAssignmentConfigured,
    type ChatMessage,
    type GeneratedAssignmentData,
} from '../../../lib/assignment/aiAssignmentService';
import type { AssignmentFormData, RecentAssignment, CreateAssignmentModalProps } from './types';

const FALLBACK_COURSES = [
    { id: 'cp1',    name: 'Computer Programming 1',    sections: ['BSIT101A'] },
    { id: 'itc',    name: 'Introduction to Computing',  sections: ['BSIT101A'] },
    { id: 'purcom', name: 'Purposive Communication',    sections: ['BSIT101A'] },
    { id: 'euth1',  name: 'Euthenics 1',               sections: ['BSIT101A'] },
    { id: 'nstp1',  name: 'NSTP 1',                    sections: ['BSIT101A'] },
    { id: 'pe1',    name: 'Physical Education 1',       sections: ['BSIT101A'] },
    { id: 'ppc',    name: 'Philippine Popular Culture', sections: ['BSIT101A'] },
    { id: 'tcw',    name: 'The Contemporary World',     sections: ['BSIT101A'] },
    { id: 'uts',    name: 'Understanding the Self',     sections: ['BSIT101A'] },
];

const FALLBACK_RECENT: RecentAssignment[] = [
    { id: 'old1', title: 'Exploring Variables and Data Types in Java',    course: 'cp1', courseName: 'Computer Programming 1', date: 'Mar 7, 2026',  type: 'assignment', description: '', instructions: '', points: 100 },
    { id: 'old2', title: 'Setting Up Variables and Printing in Java',     course: 'cp1', courseName: 'Computer Programming 1', date: 'Mar 6, 2026',  type: 'assignment', description: '', instructions: '', points: 100 },
    { id: 'old3', title: "Bastard Eye's Challenge: Creative Problem-Solving", course: 'cp1', courseName: 'Computer Programming 1', date: 'Feb 19, 2026', type: 'assignment', description: '', instructions: '', points: 100 },
    { id: 'old4', title: 'HTML Basics Quiz',                              course: 'cp1', courseName: 'Computer Programming 1', date: 'Feb 18, 2026', type: 'quiz',       description: '', instructions: '', points: 30  },
    { id: 'old5', title: 'Lab Exercise Activity 01',                      course: 'cp1', courseName: 'Computer Programming 1', date: 'Jan 26, 2026', type: 'assignment', description: '', instructions: '', points: 50  },
];

const INITIAL_FORM: AssignmentFormData = {
    title: '',
    description: '',
    course: '',
    section: '',
    sections: [],
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
    schedulePublish: false,
    publishDate: '',
    publishTime: '08:00',
    copyToOtherCourses: [],
    prerequisiteEnabled: false,
    prerequisiteAssignment: '',
    saveAsTemplate: false,
    templateName: '',
};

export function useAssignmentForm(
    isOpen: boolean,
    onClose: CreateAssignmentModalProps['onClose'],
    onSubmit: CreateAssignmentModalProps['onSubmit'],
) {
    // ── Tab & scroll ──────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<'details' | 'rubric' | 'settings' | 'attachments' | 'preview'>('details');
    const scrollPositionsRef = useRef<Record<string, number>>({});
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollContainerRef.current) {
            const pos = scrollPositionsRef.current[activeTab] || 0;
            scrollContainerRef.current.scrollTop = pos;
            setTimeout(() => {
                if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = pos;
            }, 50);
        }
    }, [activeTab]);

    // ── Form data ─────────────────────────────────────────────────────────────
    const [formData, setFormData] = useState<AssignmentFormData>(INITIAL_FORM);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const updateFormData = useCallback(<K extends keyof AssignmentFormData>(key: K, value: AssignmentFormData[K]) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    }, []);

    // ── Courses ───────────────────────────────────────────────────────────────
    const [courses, setCourses] = useState<{ id: string; name: string; sections: string[] }[]>([]);
    const [loadingCourses, setLoadingCourses] = useState(false);

    useEffect(() => {
        const fetchCourses = async () => {
            if (!isOpen) return;
            setLoadingCourses(true);
            try {
                if (!supabase) { setCourses(FALLBACK_COURSES); return; }

                const { data: coursesData, error } = await supabase
                    .from('courses')
                    .select('id, title, short_title, section')
                    .eq('is_active', true)
                    .order('title', { ascending: true });

                if (error) throw error;

                if (coursesData && coursesData.length > 0) {
                    const courseMap = new Map<string, { id: string; name: string; sections: Set<string> }>();
                    coursesData.forEach(course => {
                        if (!courseMap.has(course.id)) {
                            courseMap.set(course.id, { id: course.id, name: course.title, sections: new Set() });
                        }
                        if (course.section) courseMap.get(course.id)!.sections.add(course.section);
                    });

                    const { data: sectionsData } = await supabase
                        .from('users')
                        .select('section')
                        .eq('role', 'student')
                        .eq('is_active', true);

                    const allSections = [...new Set(sectionsData?.map(s => s.section).filter(Boolean) || [])];

                    setCourses(Array.from(courseMap.values()).map(c => ({
                        id: c.id,
                        name: c.name,
                        sections: allSections.length > 0 ? allSections : ['BSIT101A'],
                    })));
                } else {
                    setCourses(FALLBACK_COURSES);
                }
            } catch {
                setCourses(FALLBACK_COURSES);
            } finally {
                setLoadingCourses(false);
            }
        };
        fetchCourses();
    }, [isOpen]);

    // ── Existing assignments (prerequisites) ──────────────────────────────────
    const [existingAssignments, setExistingAssignments] = useState<{ id: string; title: string; course: string; type: string }[]>([]);

    useEffect(() => {
        const fetchExisting = async () => {
            if (!isOpen || !formData.course) return;
            try {
                if (!supabase) {
                    setExistingAssignments([
                        { id: 'prereq-1', title: 'Introduction to Variables',  course: formData.course, type: 'assignment' },
                        { id: 'prereq-2', title: 'Basic Data Types Quiz',       course: formData.course, type: 'quiz' },
                        { id: 'prereq-3', title: 'Control Structures Lab',      course: formData.course, type: 'assignment' },
                        { id: 'prereq-4', title: 'Midterm Journal',             course: formData.course, type: 'journal' },
                    ]);
                    return;
                }
                const { data: tasks, error } = await supabase
                    .from('course_tasks')
                    .select('id, title, course_id, type')
                    .eq('course_id', formData.course)
                    .eq('status', 'published')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (tasks && tasks.length > 0) {
                    setExistingAssignments(tasks.map(t => ({ id: t.id, title: t.title, course: t.course_id, type: t.type })));
                } else {
                    setExistingAssignments([
                        { id: 'prereq-1', title: 'Introduction to Variables', course: formData.course, type: 'assignment' },
                        { id: 'prereq-2', title: 'Basic Data Types Quiz',      course: formData.course, type: 'quiz' },
                        { id: 'prereq-3', title: 'Control Structures Lab',     course: formData.course, type: 'assignment' },
                    ]);
                }
            } catch {
                setExistingAssignments([
                    { id: 'prereq-1', title: 'Introduction to Variables', course: formData.course, type: 'assignment' },
                    { id: 'prereq-2', title: 'Basic Data Types Quiz',      course: formData.course, type: 'quiz' },
                ]);
            }
        };
        fetchExisting();
    }, [isOpen, formData.course]);

    // ── Recent assignments ────────────────────────────────────────────────────
    const [recentAssignments, setRecentAssignments] = useState<RecentAssignment[]>([]);
    const [loadingRecentAssignments, setLoadingRecentAssignments] = useState(false);

    useEffect(() => {
        const fetchRecent = async () => {
            if (!isOpen) return;
            setLoadingRecentAssignments(true);
            try {
                if (!supabase) { setRecentAssignments(FALLBACK_RECENT); return; }

                const { data: tasks, error } = await supabase
                    .from('course_tasks')
                    .select('id, title, course_id, type, description, instructions, points, created_at')
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (error) throw error;

                if (tasks && tasks.length > 0) {
                    const courseIds = [...new Set(tasks.map(t => t.course_id))];
                    const { data: coursesData } = await supabase
                        .from('courses')
                        .select('id, title')
                        .in('id', courseIds);

                    const courseMap = new Map(coursesData?.map(c => [c.id, c.title]) || []);

                    setRecentAssignments(tasks.map(task => ({
                        id: task.id,
                        title: task.title,
                        course: task.course_id,
                        courseName: courseMap.get(task.course_id) || task.course_id.toUpperCase(),
                        date: new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                        type: task.type || 'assignment',
                        description: task.description || '',
                        instructions: task.instructions || '',
                        points: task.points || 100,
                    })));
                } else {
                    setRecentAssignments(FALLBACK_RECENT);
                }
            } catch {
                setRecentAssignments(FALLBACK_RECENT);
            } finally {
                setLoadingRecentAssignments(false);
            }
        };
        fetchRecent();
    }, [isOpen]);

    // ── Derived values ────────────────────────────────────────────────────────
    const selectedCourse = courses.find(c => c.id === formData.course);
    const availableSections = selectedCourse?.sections || [];
    const availablePrerequisites = existingAssignments.filter(a => a.course === formData.course);
    const otherCourses = courses.filter(c => c.id !== formData.course);

    // ── Modal lifecycle ───────────────────────────────────────────────────────
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = useCallback(async () => {
        setIsSubmitting(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        onSubmit(formData);
        setIsSubmitting(false);
        onClose();
    }, [formData, onSubmit, onClose]);

    // ── AI Chat ───────────────────────────────────────────────────────────────
    const [aiChatOpen, setAiChatOpen] = useState(false);
    const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
    const [aiConversationHistory, setAiConversationHistory] = useState<ChatMessage[]>([]);
    const [aiInput, setAiInput] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiApplied, setAiApplied] = useState(false);
    const [aiInstructionsLoading, setAiInstructionsLoading] = useState(false);
    const aiChatEndRef = useRef<HTMLDivElement>(null);
    const aiInputRef = useRef<HTMLTextAreaElement>(null);
    const aiConfigured = useMemo(() => isAIAssignmentConfigured(), []);

    const applyAIData = useCallback((data: GeneratedAssignmentData) => {
        setFormData(prev => ({
            ...prev,
            title: data.title || prev.title,
            description: data.description || prev.description,
            type: data.type || prev.type,
            points: data.points || prev.points,
            instructions: data.instructions || prev.instructions,
            allowLateSubmission: data.allowLateSubmission,
            latePenalty: data.latePenalty,
            maxAttempts: data.maxAttempts,
            rubricEnabled: data.rubricEnabled,
            rubricCriteria: data.rubricCriteria.length > 0 ? data.rubricCriteria : prev.rubricCriteria,
            dueDate: resolveDueDateSuggestion(data.dueDateSuggestion) || prev.dueDate,
        }));
        setAiApplied(true);
        if (data.rubricEnabled && data.rubricCriteria.length > 0) {
            setTimeout(() => setActiveTab('details'), 300);
        }
    }, []);

    const handleAISend = useCallback(async (directMessage?: string) => {
        const msg = (directMessage || aiInput).trim();
        if (!msg || aiLoading) return;

        setAiInput('');
        setAiMessages(prev => [...prev, { role: 'user', content: msg }]);
        setAiLoading(true);

        try {
            const result = await chatWithAssignmentAI(aiConversationHistory, msg, courses);
            if (result.error) {
                setAiMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${result.error}` }]);
            } else {
                setAiMessages(prev => [...prev, { role: 'assistant', content: result.message }]);
                setAiConversationHistory(prev => [
                    ...prev,
                    { role: 'user' as const, content: msg },
                    { role: 'assistant' as const, content: result.message },
                ]);
                if (result.ready && result.assignmentData) applyAIData(result.assignmentData);
            }
        } catch {
            setAiMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Something went wrong. Please try again.' }]);
        } finally {
            setAiLoading(false);
            setTimeout(() => aiChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
    }, [aiInput, aiLoading, aiConversationHistory, courses, applyAIData]);

    const resetAIChat = useCallback(() => {
        setAiMessages([]);
        setAiConversationHistory([]);
        setAiInput('');
        setAiApplied(false);
    }, []);

    // Auto-scroll AI chat
    useEffect(() => {
        aiChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [aiMessages]);

    // Focus AI input when chat opens
    useEffect(() => {
        if (aiChatOpen && aiInputRef.current) {
            setTimeout(() => aiInputRef.current?.focus(), 300);
        }
    }, [aiChatOpen]);

    return {
        // Tab
        activeTab, setActiveTab,
        scrollContainerRef, scrollPositionsRef,
        // Form
        formData, setFormData, updateFormData,
        isSubmitting, handleSubmit,
        // Data
        courses, loadingCourses,
        recentAssignments, loadingRecentAssignments,
        existingAssignments,
        // Derived
        availableSections, availablePrerequisites, otherCourses,
        // AI
        aiChatOpen, setAiChatOpen,
        aiMessages, aiInput, setAiInput,
        aiLoading, aiApplied, aiInstructionsLoading, setAiInstructionsLoading,
        aiChatEndRef, aiInputRef, aiConfigured,
        handleAISend, resetAIChat, applyAIData,
    };
}
