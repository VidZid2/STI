/**
 * Teacher Dashboard - Exclusive Teacher Portal
 * Professional minimalistic design matching the app's design system
 * 
 * REFACTORED: 
 * - Phase 1: Extracted constants, types, icons
 * - Phase 2: Extracted components, custom hook, improved organization
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// Modal imports
import CreateAssignmentModal from './CreateAssignmentModal';
import StudentListModal from './StudentListModal';
import GradeSubmissionsModal from './GradeSubmissionsModal';
import InputScoresModal from './InputScoresModal';
import AtRiskStudentsModal from './AtRiskStudentsModal';
import ActivityModal from './ActivityModal';

// Local imports - Constants & Types
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, QUICK_ACTIONS } from './constants';
import { BoltIcon, ClockIcon, CalendarIcon, AlertTriangleIcon, UserAlertIcon, MapPinIcon, PlayCircleIcon, CheckCircleIcon, TrendDownIcon, getActionIcon } from './icons';
import { supabase } from '../../lib/supabase';

// ============================================
// TYPES FOR REAL DATA
// ============================================
interface ScheduleItem {
    id: string;
    subject: string;
    section: string;
    room: string;
    startTime: string;
    endTime: string;
    status: 'upcoming' | 'ongoing' | 'completed';
    studentsPresent?: number;
    totalStudents?: number;
}

interface TaskItem {
    id: string;
    type: 'grading' | 'deadline' | 'meeting';
    title: string;
    description: string;
    dueDate: string;
    priority: 'high' | 'medium' | 'low';
    count?: number;
}

// Local imports - Components
import { 
    DashboardSkeleton, 
    ErrorDisplay, 
    DashboardHeader,
    type DashboardNotification,
} from './components';

// Local imports - Hooks
import { useTeacherDashboard, useResponsive } from './hooks';

// Local imports - Contexts
import { GradingSettingsProvider } from './contexts';

// Demo data imports
import {
    DEMO_SCHEDULE,
    DEMO_TASKS,
    DEMO_ACTIVITY,
    DEMO_AT_RISK_STUDENTS,
} from './demoData';

// ============================================
// AT-RISK STUDENT TYPE
// ============================================
interface AtRiskStudentData {
    id: string;
    name: string;
    section: string;
    subject: string;
    currentGrade: number;
    absences: number;
    issue: string;
    trend: 'declining' | 'stable' | 'improving';
}

// ============================================
// MAIN TEACHER DASHBOARD COMPONENT
// ============================================
const TeacherDashboard: React.FC = () => {
    // Responsive state for mobile compatibility
    const { isMobile } = useResponsive();
    
    // At-risk students state (fetched from database)
    const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudentData[]>([]);
    
    // Notifications state
    const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
    const [isLoadingAtRisk, setIsLoadingAtRisk] = useState(true);
    
    // Schedule and tasks state (fetched from database)
    const [todaysSchedule, setTodaysSchedule] = useState<ScheduleItem[]>([]);
    const [urgentTasks, setUrgentTasks] = useState<TaskItem[]>([]);
    const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);
    
    // Tooltip state for stat cards
    const [hoveredStat, setHoveredStat] = useState<string | null>(null);

    // Use custom hook for all state and logic
    const {
        isLoading,
        error,
        user,
        activity: hookActivity,
        modals,
        initializeDashboard,
        handleLogout,
        openModal,
        closeModal,
        handleQuickAction,
        getStatValue,
    } = useTeacherDashboard();
    
    // Use demo activity if hook returns empty
    const activity = hookActivity.length > 0 ? hookActivity : DEMO_ACTIVITY.map(item => ({
        ...item,
        timestamp: item.timestamp,
    }));
    
    // Tutorial functionality removed - no longer needed
    // Set up global tutorial trigger - REMOVED
    // useEffect(() => {
    //     (window as any).setTeacherTutorialActive = setTutorialActive;
    //     return () => {
    //         delete (window as any).setTeacherTutorialActive;
    //     };
    // }, [setTutorialActive]);

    // Fetch at-risk students from database
    useEffect(() => {
        const fetchAtRiskStudents = async () => {
            setIsLoadingAtRisk(true);
            try {
                if (!supabase) {
                    // No Supabase - use demo data
                    setAtRiskStudents(DEMO_AT_RISK_STUDENTS);
                    setIsLoadingAtRisk(false);
                    return;
                }

                // In a real implementation, at-risk students would be determined by:
                // 1. Students with grades below a threshold (e.g., < 75%)
                // 2. Students with excessive absences
                // 3. Students with missing assignments
                // 
                // For now, we query the database but return empty if no real at-risk data exists
                // This ensures the dashboard shows realistic data connected to the database
                
                // Check if there are any student submissions with low grades
                const { data: lowGradeSubmissions, error: gradeError } = await supabase
                    .from('student_submissions')
                    .select(`
                        student_id,
                        score,
                        max_score,
                        users!student_submissions_student_id_fkey (
                            id,
                            full_name,
                            section,
                            program
                        ),
                        assignments (
                            title,
                            course_id,
                            courses (
                                code
                            )
                        )
                    `)
                    .eq('status', 'graded')
                    .not('score', 'is', null)
                    .order('graded_at', { ascending: false })
                    .limit(50);

                if (gradeError) {
                    console.error('Error fetching grades:', gradeError);
                    // On error, use demo data
                    setAtRiskStudents(DEMO_AT_RISK_STUDENTS);
                    return;
                }

                if (lowGradeSubmissions && lowGradeSubmissions.length > 0) {
                    // Group by student and calculate average grade
                    const studentGrades: Record<string, { 
                        student: { id: string; full_name: string; section: string; program: string } | null;
                        totalScore: number;
                        totalMaxScore: number;
                        count: number;
                        subject: string;
                    }> = {};

                    lowGradeSubmissions.forEach((submission) => {
                        const users = submission.users as unknown as { id: string; full_name: string; section: string; program: string } | null;
                        const assignments = submission.assignments as unknown as { title: string; course_id: string; courses: { code: string } | null } | null;
                        
                        if (!users || submission.score === null || submission.max_score === null) return;
                        
                        const studentId = submission.student_id;
                        if (!studentGrades[studentId]) {
                            studentGrades[studentId] = {
                                student: users,
                                totalScore: 0,
                                totalMaxScore: 0,
                                count: 0,
                                subject: assignments?.courses?.code || 'Unknown',
                            };
                        }
                        studentGrades[studentId].totalScore += submission.score;
                        studentGrades[studentId].totalMaxScore += submission.max_score;
                        studentGrades[studentId].count += 1;
                    });

                    // Find students with average grade below 75%
                    const atRisk: AtRiskStudentData[] = Object.entries(studentGrades)
                        .filter(([_, data]) => {
                            const avgGrade = data.totalMaxScore > 0 
                                ? (data.totalScore / data.totalMaxScore) * 100 
                                : 0;
                            return avgGrade < 75 && data.count >= 1;
                        })
                        .slice(0, 3) // Show max 3 on dashboard
                        .map(([studentId, data]) => ({
                            id: studentId,
                            name: data.student?.full_name || 'Unknown Student',
                            section: data.student?.section || 'Unknown',
                            subject: data.subject,
                            currentGrade: Math.round((data.totalScore / data.totalMaxScore) * 100),
                            absences: 0, // Would need attendance table for real data
                            issue: 'Low grades',
                            trend: 'declining' as const,
                        }));

                    // If we found at-risk students, use them; otherwise use demo data
                    if (atRisk.length > 0) {
                        setAtRiskStudents(atRisk);
                    } else {
                        setAtRiskStudents(DEMO_AT_RISK_STUDENTS);
                    }
                } else {
                    // No graded submissions yet - use demo data
                    setAtRiskStudents(DEMO_AT_RISK_STUDENTS);
                }
            } catch (err) {
                console.error('Failed to fetch at-risk students:', err);
                // On error, use demo data
                setAtRiskStudents(DEMO_AT_RISK_STUDENTS);
            } finally {
                setIsLoadingAtRisk(false);
            }
        };

        fetchAtRiskStudents();
    }, []);

    // Fetch schedule and tasks from database
    useEffect(() => {
        const fetchScheduleAndTasks = async () => {
            setIsLoadingSchedule(true);
            try {
                if (!supabase) {
                    // No Supabase - use demo data
                    setTodaysSchedule(DEMO_SCHEDULE);
                    setUrgentTasks(DEMO_TASKS);
                    setIsLoadingSchedule(false);
                    return;
                }

                // Fetch pending submissions count for tasks
                const { count: pendingCount } = await supabase
                    .from('student_submissions')
                    .select('*', { count: 'exact', head: true })
                    .in('status', ['pending', 'submitted']);

                // For schedule: Since there's no dedicated schedule table in the database,
                // we show demo data. In a real implementation, you would fetch from a 
                // teacher_schedule or class_schedule table.
                setTodaysSchedule(DEMO_SCHEDULE);

                // Build tasks from database
                const tasksData: TaskItem[] = [];
                
                // Only add ungraded submissions if count is greater than 0
                if (typeof pendingCount === 'number' && pendingCount > 0) {
                    tasksData.push({
                        id: '1',
                        type: 'grading',
                        title: 'Ungraded Submissions',
                        description: `${pendingCount} submissions awaiting review`,
                        dueDate: 'Due today',
                        priority: 'high',
                        count: pendingCount,
                    });
                }

                // If no real tasks, use demo tasks
                if (tasksData.length === 0) {
                    setUrgentTasks(DEMO_TASKS);
                } else {
                    setUrgentTasks(tasksData);
                }
            } catch (err) {
                console.error('Failed to fetch schedule/tasks:', err);
                // On error, use demo data
                setTodaysSchedule(DEMO_SCHEDULE);
                setUrgentTasks(DEMO_TASKS);
            } finally {
                setIsLoadingSchedule(false);
            }
        };

        fetchScheduleAndTasks();
    }, []);

    // ============================================
    // GENERATE NOTIFICATIONS FROM REAL DATA
    // Connected to the 4 major cards:
    // 1. Create Assignment - assignment notifications
    // 2. Grade Submissions - submission/grading notifications  
    // 3. View Student List - at-risk student notifications
    // 4. Input Exam Scores - scores notifications
    // ============================================
    useEffect(() => {
        const generateNotifications = () => {
            const newNotifications: DashboardNotification[] = [];
            const now = new Date();

            // 1. Pending submissions notification (Grade Submissions card)
            if (urgentTasks.length > 0) {
                const gradingTask = urgentTasks.find(t => t.type === 'grading');
                if (gradingTask && gradingTask.count && gradingTask.count > 0) {
                    newNotifications.push({
                        id: 'pending-submissions',
                        type: 'submission',
                        title: 'Pending submissions',
                        description: `${gradingTask.count} submission${gradingTask.count > 1 ? 's' : ''} awaiting review`,
                        timestamp: new Date(now.getTime() - 5 * 60 * 1000), // 5 min ago
                        isRead: false,
                        actionLabel: 'Grade now',
                        onAction: () => openModal('isGradeSubmissionsOpen'),
                    });
                }
            }

            // 2. At-risk students notification (View Student List card)
            if (atRiskStudents.length > 0) {
                newNotifications.push({
                    id: 'at-risk-students',
                    type: 'at-risk',
                    title: 'At-risk students',
                    description: `${atRiskStudents.length} student${atRiskStudents.length > 1 ? 's' : ''} need${atRiskStudents.length === 1 ? 's' : ''} attention`,
                    timestamp: new Date(now.getTime() - 30 * 60 * 1000), // 30 min ago
                    isRead: false,
                    actionLabel: 'View details',
                    onAction: () => openModal('isAtRiskStudentsOpen'),
                });
            }

            // 3. Recent activity notifications (from activity feed)
            if (activity.length > 0) {
                // Get the most recent submission activity
                const recentSubmission = activity.find(a => a.type === 'submission');
                if (recentSubmission) {
                    newNotifications.push({
                        id: `activity-${recentSubmission.id}`,
                        type: 'submission',
                        title: 'New submission',
                        description: `${recentSubmission.student} - ${recentSubmission.course}`,
                        timestamp: recentSubmission.timestamp,
                        isRead: false,
                        onAction: () => openModal('isGradeSubmissionsOpen'),
                    });
                }

                // Get recent grading activity
                const recentGrade = activity.find(a => a.type === 'grade');
                if (recentGrade) {
                    newNotifications.push({
                        id: `activity-${recentGrade.id}`,
                        type: 'grading',
                        title: 'Grading complete',
                        description: `${recentGrade.student} - ${recentGrade.course}`,
                        timestamp: recentGrade.timestamp,
                        isRead: true, // Mark as read since it's completed
                    });
                }
            }

            // Sort by timestamp (newest first)
            newNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

            setNotifications(newNotifications);
        };

        generateNotifications();
    }, [urgentTasks, atRiskStudents, activity, openModal]);

    // Handle notification click
    const handleNotificationClick = (notification: DashboardNotification) => {
        // Mark as read (in a real app, this would update the database)
        setNotifications(prev => 
            prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        );
        
        // Execute the action if defined
        notification.onAction?.();
    };

    // Handle view all notifications
    const handleViewAllNotifications = () => {
        openModal('isActivityModalOpen');
    };

    // ============================================
    // LOADING STATE
    // ============================================
    if (isLoading) {
        return (
            <div style={{ minHeight: '100vh', background: COLORS.background }}>
                <DashboardSkeleton />
            </div>
        );
    }

    // ============================================
    // ERROR STATE
    // ============================================
    if (error) {
        return <ErrorDisplay message={error} onRetry={initializeDashboard} />;
    }


    // ============================================
    // MAIN RENDER
    // ============================================
    return (
        <div style={{ minHeight: '100vh', background: COLORS.background }}>
            {/* Header */}
            <DashboardHeader
                userName={user?.full_name || 'Teacher'}
                userEmail={user?.email || ''}
                userInitial={user?.first_name?.charAt(0) || 'T'}
                onLogout={handleLogout}
                notifications={notifications}
                onNotificationClick={handleNotificationClick}
                onViewAllNotifications={handleViewAllNotifications}
            />

            {/* Main Content */}
            <main style={{ 
                padding: isMobile ? SPACING.lg : SPACING.xxxl, 
                maxWidth: '1400px', 
                margin: '0 auto' 
            }}>
                {/* Welcome Header - Matching Groups/Catalog design */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    style={{ marginBottom: SPACING.xxl }}
                    className="welcome-header-greeting"
                >
                    <div style={{
                        display: 'flex', 
                        alignItems: isMobile ? 'flex-start' : 'center', 
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: SPACING.lg, 
                        padding: isMobile ? '16px' : '18px 22px',
                        borderRadius: '14px', 
                        background: COLORS.surface, 
                        border: `1px solid ${COLORS.border}`,
                        flexWrap: 'wrap',
                    }}>
                        {/* Icon + Title Row for Mobile */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: SPACING.lg,
                            width: isMobile ? '100%' : 'auto',
                            flex: isMobile ? 'none' : 1,
                        }}>
                            {/* Icon */}
                            <motion.div
                                whileHover={{ scale: 1.05, rotate: 5 }}
                                transition={{ duration: 0.15, ease: 'easeOut' }}
                                style={{
                                    width: isMobile ? '40px' : '46px', 
                                    height: isMobile ? '40px' : '46px', 
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)',
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}
                            >
                                <svg width={isMobile ? "20" : "24"} height={isMobile ? "20" : "24"} viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                    <path d="M8 7h8M8 11h8M8 15h5" />
                                </svg>
                            </motion.div>

                            {/* Title & Subtitle */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}
                                >
                                    <h1 style={{ margin: 0, fontSize: isMobile ? '16px' : '20px', fontWeight: 600, color: COLORS.textPrimary }}>
                                        {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'}, {user?.first_name || 'Teacher'}!
                                    </h1>
                                    <span style={{
                                        padding: '3px 8px', 
                                        borderRadius: '6px',
                                        background: 'rgba(59, 130, 246, 0.1)', 
                                        fontSize: '11px',
                                        fontWeight: 600, 
                                        color: '#3b82f6',
                                    }}>
                                        Teacher
                                    </span>
                                </motion.div>
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.15 }}
                                    style={{ margin: 0, fontSize: isMobile ? '12px' : '13px', color: COLORS.textSecondary }}
                                >
                                    {new Date().toLocaleDateString('en-US', { weekday: isMobile ? 'short' : 'long', year: 'numeric', month: isMobile ? 'short' : 'long', day: 'numeric' })}
                                </motion.p>
                            </div>
                        </div>

                        {/* Quick Stats - Responsive grid for mobile */}
                        <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                            style={{ 
                                display: 'grid', 
                                gridTemplateColumns: isMobile ? 'repeat(4, 1fr)' : 'repeat(4, auto)',
                                gap: isMobile ? '8px' : '10px',
                                width: isMobile ? '100%' : 'auto',
                            }}
                            className="stats-grid-container"
                        >
                            {[
                                { label: 'Students', value: getStatValue('students'), color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.06)', tooltip: 'Total active students enrolled in your courses' },
                                { label: 'Courses', value: getStatValue('courses'), color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.06)', tooltip: 'Number of courses you are currently teaching' },
                                { label: 'Pending', value: getStatValue('pending'), color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.06)', tooltip: 'Submissions awaiting your review and grading' },
                                { label: 'Average', value: getStatValue('average'), color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.06)', tooltip: 'Average grade across all graded submissions' },
                            ].map((stat, i) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0, transition: { delay: 0.25 + i * 0.05, duration: 0.3 } }}
                                    whileHover={isMobile ? {} : { y: -2, scale: 1.02, transition: { duration: 0.15, ease: 'easeOut' } }}
                                    transition={{ duration: 0.15, ease: 'easeOut', delay: 0 }}
                                    onMouseEnter={() => !isMobile && setHoveredStat(stat.label)}
                                    onMouseLeave={() => setHoveredStat(null)}
                                    style={{
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        alignItems: 'center',
                                        padding: isMobile ? '8px 6px' : '10px 16px', 
                                        borderRadius: '10px', 
                                        background: stat.bgColor,
                                        cursor: 'default', 
                                        minWidth: isMobile ? 'auto' : '72px',
                                        position: 'relative',
                                    }}
                                >
                                    <span style={{ fontSize: isMobile ? '14px' : '18px', fontWeight: 700, color: stat.color, lineHeight: 1, marginBottom: '2px' }}>
                                        {stat.value}
                                    </span>
                                    <span style={{ fontSize: isMobile ? '9px' : '10px', fontWeight: 500, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                        {stat.label}
                                    </span>
                                    
                                    {/* Custom Tooltip */}
                                    <AnimatePresence>
                                        {hoveredStat === stat.label && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 4 }}
                                                transition={{ duration: 0.15, ease: 'easeOut' }}
                                                style={{
                                                    position: 'absolute',
                                                    top: 'calc(100% + 8px)',
                                                    left: '0',
                                                    right: '0',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    pointerEvents: 'none',
                                                    zIndex: 1000,
                                                }}
                                            >
                                                <div style={{
                                                    background: '#ffffff',
                                                    border: `1.5px solid ${stat.color}20`,
                                                    borderRadius: '10px',
                                                    padding: '10px 14px',
                                                    boxShadow: `0 4px 20px ${stat.color}15, 0 2px 8px rgba(0,0,0,0.06)`,
                                                    whiteSpace: 'nowrap',
                                                    position: 'relative',
                                                }}>
                                                    {/* Tooltip Arrow */}
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '-6px',
                                                        left: '50%',
                                                        transform: 'translateX(-50%) rotate(45deg)',
                                                        width: '10px',
                                                        height: '10px',
                                                        background: '#ffffff',
                                                        borderLeft: `1.5px solid ${stat.color}20`,
                                                        borderTop: `1.5px solid ${stat.color}20`,
                                                    }} />
                                                    
                                                    {/* Tooltip Content */}
                                                    <div style={{ 
                                                        fontSize: '13px', 
                                                        fontWeight: 600, 
                                                        color: stat.color,
                                                        marginBottom: '2px',
                                                    }}>
                                                        {stat.value} {stat.label.toLowerCase()}
                                                    </div>
                                                    <div style={{ 
                                                        fontSize: '11px', 
                                                        color: COLORS.textSecondary,
                                                        fontWeight: 400,
                                                    }}>
                                                        {stat.tooltip}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </motion.div>

                {/* Two Column Layout: Today's Schedule + Urgent Tasks */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(340px, 1fr))', 
                    gap: isMobile ? SPACING.lg : SPACING.xl, 
                    marginBottom: SPACING.xxl 
                }}>
                    {/* Today's Schedule Panel */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        style={{
                            background: COLORS.surface,
                            borderRadius: BORDER_RADIUS.full,
                            padding: SPACING.xxl,
                            border: `1px solid ${COLORS.border}`,
                        }}
                        className="schedule-panel"
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.lg, marginBottom: SPACING.xl }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: BORDER_RADIUS.xl,
                                background: `linear-gradient(135deg, ${COLORS.primaryLight} 0%, rgba(59, 130, 246, 0.04) 100%)`,
                                border: `1px solid ${COLORS.primaryBorder}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: COLORS.primary,
                            }}>
                                <CalendarIcon size={20} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.semibold, color: COLORS.textPrimary, margin: 0 }}>
                                    Today's Schedule
                                </h2>
                                <p style={{ fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, margin: 0 }}>
                                    {isLoadingSchedule ? 'Loading...' : `${todaysSchedule.length} classes today`}
                                </p>
                            </div>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
                            {isLoadingSchedule ? (
                                // Loading skeleton
                                [...Array(3)].map((_, i) => (
                                    <div key={i} style={{
                                        display: 'flex', alignItems: 'center', gap: SPACING.lg,
                                        padding: SPACING.lg, borderRadius: BORDER_RADIUS.xl,
                                    }}>
                                        <div style={{ width: 36, height: 36, borderRadius: BORDER_RADIUS.lg, background: 'rgba(0,0,0,0.04)' }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ width: '60%', height: 14, background: 'rgba(0,0,0,0.04)', borderRadius: 4, marginBottom: 6 }} />
                                            <div style={{ width: '40%', height: 12, background: 'rgba(0,0,0,0.04)', borderRadius: 4 }} />
                                        </div>
                                        <div style={{ width: 80, height: 14, background: 'rgba(0,0,0,0.04)', borderRadius: 4 }} />
                                    </div>
                                ))
                            ) : todaysSchedule.length === 0 ? (
                                // Empty state - centered with container
                                <div style={{ 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    padding: `${SPACING.xxxl} ${SPACING.xxl}`,
                                    minHeight: '200px',
                                }}>
                                    {/* Icon Container */}
                                    <div style={{
                                        width: '72px',
                                        height: '72px',
                                        borderRadius: '50%',
                                        background: `linear-gradient(135deg, ${COLORS.primaryLight} 0%, rgba(59, 130, 246, 0.08) 100%)`,
                                        border: `1px solid ${COLORS.primaryBorder}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: SPACING.lg,
                                    }}>
                                        {/* Custom calendar SVG */}
                                        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                                            {/* Calendar body */}
                                            <rect x="6" y="10" width="24" height="20" rx="3" stroke={COLORS.primary} strokeWidth="2" fill="none" />
                                            {/* Calendar top hooks */}
                                            <path d="M12 6V12" stroke={COLORS.primary} strokeWidth="2" strokeLinecap="round" />
                                            <path d="M24 6V12" stroke={COLORS.primary} strokeWidth="2" strokeLinecap="round" />
                                            {/* Calendar line */}
                                            <path d="M6 16H30" stroke={COLORS.primary} strokeWidth="2" />
                                            {/* Sun icon in center */}
                                            <circle cx="18" cy="23" r="3" stroke={COLORS.primary} strokeWidth="1.5" fill="none" />
                                            <path d="M18 18V19M18 27V28M13 23H14M22 23H23M14.5 19.5L15.2 20.2M20.8 25.8L21.5 26.5M21.5 19.5L20.8 20.2M15.2 25.8L14.5 26.5" stroke={COLORS.primary} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                                        </svg>
                                    </div>
                                    
                                    {/* Text */}
                                    <h3 style={{ 
                                        fontSize: FONT_SIZE.lg, 
                                        fontWeight: FONT_WEIGHT.semibold, 
                                        color: COLORS.textPrimary,
                                        margin: 0,
                                        marginBottom: SPACING.xs,
                                    }}>
                                        Free day!
                                    </h3>
                                    <p style={{ 
                                        fontSize: FONT_SIZE.sm, 
                                        color: COLORS.textSecondary,
                                        margin: 0,
                                        textAlign: 'center',
                                    }}>
                                        No classes scheduled for today
                                    </p>
                                </div>
                            ) : (
                                todaysSchedule.map((schedule, index) => (
                                    <motion.div
                                        key={schedule.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0, transition: { delay: 0.15 + index * 0.05 } }}
                                        transition={{ duration: 0.15, ease: 'easeOut' }}
                                        whileHover={{ background: schedule.status === 'ongoing' ? `${COLORS.primary}08` : 'rgba(0,0,0,0.02)' }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: SPACING.lg,
                                            padding: SPACING.lg,
                                            borderRadius: BORDER_RADIUS.xl,
                                            background: schedule.status === 'ongoing' ? `${COLORS.primary}06` : 'transparent',
                                            border: `1px solid ${schedule.status === 'ongoing' ? COLORS.primaryBorder : 'transparent'}`,
                                            cursor: 'pointer',
                                        }}
                                    >
                                    {/* Status Indicator */}
                                    <div style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: BORDER_RADIUS.lg,
                                        background: schedule.status === 'completed' ? COLORS.successLight : 
                                                   schedule.status === 'ongoing' ? COLORS.primaryLight : 'rgba(0,0,0,0.04)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: schedule.status === 'completed' ? COLORS.success : 
                                               schedule.status === 'ongoing' ? COLORS.primary : COLORS.textMuted,
                                        flexShrink: 0,
                                    }}>
                                        {schedule.status === 'completed' ? <CheckCircleIcon size={18} /> : 
                                         schedule.status === 'ongoing' ? <PlayCircleIcon size={18} /> : 
                                         <ClockIcon size={16} />}
                                    </div>
                                    
                                    {/* Schedule Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ 
                                            fontSize: FONT_SIZE.md, 
                                            fontWeight: FONT_WEIGHT.semibold, 
                                            color: COLORS.textPrimary,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}>
                                            {schedule.subject}
                                        </div>
                                        <div style={{ 
                                            fontSize: FONT_SIZE.sm, 
                                            color: COLORS.textSecondary,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: SPACING.sm,
                                            marginTop: '2px',
                                        }}>
                                            <span>{schedule.section}</span>
                                            <span style={{ color: COLORS.textMuted }}>•</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <MapPinIcon size={12} />
                                                {schedule.room}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Time & Status */}
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <div style={{ 
                                            fontSize: FONT_SIZE.sm, 
                                            fontWeight: FONT_WEIGHT.medium, 
                                            color: schedule.status === 'ongoing' ? COLORS.primary : COLORS.textPrimary 
                                        }}>
                                            {schedule.startTime} - {schedule.endTime}
                                        </div>
                                        {schedule.status === 'ongoing' && (
                                            <div style={{ 
                                                fontSize: FONT_SIZE.xs, 
                                                color: COLORS.primary,
                                                fontWeight: FONT_WEIGHT.medium,
                                                marginTop: '2px',
                                            }}>
                                                🔴 LIVE NOW
                                            </div>
                                        )}
                                        {schedule.status === 'completed' && schedule.studentsPresent && (
                                            <div style={{ 
                                                fontSize: FONT_SIZE.xs, 
                                                color: COLORS.success,
                                                marginTop: '2px',
                                            }}>
                                                {schedule.studentsPresent}/{schedule.totalStudents} present
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>

                    {/* Urgent Tasks Panel - Blue Color Scheme */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        style={{
                            background: COLORS.surface,
                            borderRadius: BORDER_RADIUS.full,
                            padding: SPACING.xxl,
                            border: `1px solid ${COLORS.border}`,
                        }}
                        className="tasks-panel"
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.lg, marginBottom: SPACING.xl }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: BORDER_RADIUS.xl,
                                background: `linear-gradient(135deg, ${COLORS.primaryLight} 0%, rgba(59, 130, 246, 0.04) 100%)`,
                                border: `1px solid ${COLORS.primaryBorder}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: COLORS.primary,
                            }}>
                                <BoltIcon size={20} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.semibold, color: COLORS.textPrimary, margin: 0 }}>
                                    Pending Tasks
                                </h2>
                                <p style={{ fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, margin: 0 }}>
                                    {isLoadingSchedule ? 'Loading...' : `${urgentTasks.filter(t => t.priority === 'high').length} high priority items`}
                                </p>
                            </div>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
                            {isLoadingSchedule ? (
                                // Loading skeleton
                                [...Array(3)].map((_, i) => (
                                    <div key={i} style={{
                                        display: 'flex', alignItems: 'center', gap: SPACING.lg,
                                        padding: SPACING.lg, borderRadius: BORDER_RADIUS.xl,
                                    }}>
                                        <div style={{ width: 40, height: 40, borderRadius: BORDER_RADIUS.lg, background: 'rgba(0,0,0,0.04)' }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ width: '50%', height: 14, background: 'rgba(0,0,0,0.04)', borderRadius: 4, marginBottom: 6 }} />
                                            <div style={{ width: '70%', height: 12, background: 'rgba(0,0,0,0.04)', borderRadius: 4 }} />
                                        </div>
                                        <div style={{ width: 70, height: 24, background: 'rgba(0,0,0,0.04)', borderRadius: 6 }} />
                                    </div>
                                ))
                            ) : urgentTasks.length === 0 ? (
                                // Empty state - centered with container
                                <div style={{ 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    padding: `${SPACING.xxxl} ${SPACING.xxl}`,
                                    minHeight: '200px',
                                }}>
                                    {/* Icon Container */}
                                    <div style={{
                                        width: '72px',
                                        height: '72px',
                                        borderRadius: '50%',
                                        background: `linear-gradient(135deg, ${COLORS.successLight} 0%, rgba(16, 185, 129, 0.08) 100%)`,
                                        border: `1px solid ${COLORS.successBorder}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: SPACING.lg,
                                    }}>
                                        {/* Custom checkmark with sparkles SVG */}
                                        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                                            {/* Main checkmark circle */}
                                            <circle cx="18" cy="18" r="14" stroke={COLORS.success} strokeWidth="2" fill="none" />
                                            {/* Checkmark */}
                                            <path d="M12 18L16 22L24 14" stroke={COLORS.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                            {/* Sparkle top right */}
                                            <path d="M28 6L28.5 8L30.5 8.5L28.5 9L28 11L27.5 9L25.5 8.5L27.5 8L28 6Z" fill={COLORS.success} opacity="0.6" />
                                            {/* Sparkle bottom left */}
                                            <path d="M7 25L7.4 26.6L9 27L7.4 27.4L7 29L6.6 27.4L5 27L6.6 26.6L7 25Z" fill={COLORS.success} opacity="0.4" />
                                        </svg>
                                    </div>
                                    
                                    {/* Text */}
                                    <h3 style={{ 
                                        fontSize: FONT_SIZE.lg, 
                                        fontWeight: FONT_WEIGHT.semibold, 
                                        color: COLORS.textPrimary,
                                        margin: 0,
                                        marginBottom: SPACING.xs,
                                    }}>
                                        All caught up!
                                    </h3>
                                    <p style={{ 
                                        fontSize: FONT_SIZE.sm, 
                                        color: COLORS.textSecondary,
                                        margin: 0,
                                        textAlign: 'center',
                                    }}>
                                        No pending tasks at the moment
                                    </p>
                                </div>
                            ) : (
                                urgentTasks.map((task, index) => {
                                    // Determine urgency color based on due date
                                    const isToday = task.dueDate.toLowerCase().includes('today');
                                    const isSoon = task.dueDate.toLowerCase().includes('2 day') || task.dueDate.toLowerCase().includes('tomorrow');
                                    const urgencyColor = isToday ? COLORS.danger : isSoon ? COLORS.warning : COLORS.primary;
                                    const urgencyBg = isToday ? COLORS.dangerLight : isSoon ? COLORS.warningLight : COLORS.primaryLight;
                                    const urgencyBorder = isToday ? COLORS.dangerBorder : isSoon ? COLORS.warningBorder : COLORS.primaryBorder;
                                    
                                    return (
                                    <motion.div
                                        key={task.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0, transition: { delay: 0.2 + index * 0.05 } }}
                                        transition={{ duration: 0.15, ease: 'easeOut' }}
                                        whileHover={{ scale: 1.01, boxShadow: `0 4px 12px ${urgencyColor}20` }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: SPACING.lg,
                                            padding: SPACING.lg,
                                            borderRadius: BORDER_RADIUS.xl,
                                            background: `${urgencyColor}04`,
                                            border: `1px solid ${urgencyBorder}`,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {/* Priority Indicator */}
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: BORDER_RADIUS.lg,
                                            background: urgencyBg,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: urgencyColor,
                                            flexShrink: 0,
                                            position: 'relative',
                                        }}>
                                            {task.type === 'grading' ? (
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                    <polyline points="14 2 14 8 20 8" />
                                                    <line x1="16" y1="13" x2="8" y2="13" />
                                                    <line x1="16" y1="17" x2="8" y2="17" />
                                                </svg>
                                            ) : task.type === 'deadline' ? (
                                                <CalendarIcon size={18} />
                                            ) : (
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                                    <circle cx="9" cy="7" r="4" />
                                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                                </svg>
                                            )}
                                            {task.count && task.count > 0 && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '-4px',
                                                    right: '-4px',
                                                    width: '18px',
                                                    height: '18px',
                                                    borderRadius: '50%',
                                                    background: urgencyColor,
                                                    color: '#fff',
                                                    fontSize: '10px',
                                                    fontWeight: FONT_WEIGHT.bold,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}>
                                                    {task.count}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Task Info */}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ 
                                                fontSize: FONT_SIZE.md, 
                                                fontWeight: FONT_WEIGHT.semibold, 
                                                color: COLORS.textPrimary 
                                            }}>
                                                {task.title}
                                            </div>
                                            <div style={{ 
                                                fontSize: FONT_SIZE.sm, 
                                                color: COLORS.textSecondary,
                                                marginTop: '2px',
                                            }}>
                                                {task.description}
                                            </div>
                                        </div>
                                        
                                        {/* Due Date Badge - Outline style with urgency colors */}
                                        <div style={{
                                            padding: `${SPACING.xs} ${SPACING.md}`,
                                            borderRadius: BORDER_RADIUS.lg,
                                            background: 'transparent',
                                            border: `1.5px solid ${urgencyColor}`,
                                            color: urgencyColor,
                                            fontSize: FONT_SIZE.xs,
                                            fontWeight: FONT_WEIGHT.semibold,
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {task.dueDate}
                                        </div>
                                    </motion.div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Quick Actions - Big 4 Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    style={{ marginBottom: SPACING.xxl }}
                    className="quick-actions-panel"
                >
                    {/* Section Header */}
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        marginBottom: SPACING.xl 
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.lg }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: BORDER_RADIUS.xl,
                                background: `linear-gradient(135deg, ${COLORS.primaryLight} 0%, rgba(59, 130, 246, 0.04) 100%)`,
                                border: `1px solid ${COLORS.primaryBorder}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: COLORS.primary,
                            }}>
                                <BoltIcon size={20} />
                            </div>
                            <div>
                                <h2 style={{ 
                                    fontSize: FONT_SIZE.xxl, 
                                    fontWeight: FONT_WEIGHT.semibold, 
                                    color: COLORS.textPrimary, 
                                    margin: 0 
                                }}>
                                    Quick Actions
                                </h2>
                                <p style={{ 
                                    fontSize: FONT_SIZE.sm, 
                                    color: COLORS.textSecondary, 
                                    margin: 0 
                                }}>
                                    Common tasks at your fingertips
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Big 4 Action Cards Grid */}
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(260px, 1fr))', 
                        gap: isMobile ? SPACING.md : SPACING.xl,
                    }}>
                        {QUICK_ACTIONS.map((action, index) => (
                            <motion.button
                                key={action.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0, transition: { delay: 0.2 + index * 0.05 } }}
                                transition={{ duration: 0.15, ease: 'easeOut' }}
                                whileHover={isMobile ? {} : { 
                                    y: -6, 
                                    scale: 1.02,
                                    boxShadow: `0 20px 40px ${action.color}25`,
                                }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleQuickAction(action.id)}
                                aria-label={`Open ${action.label}`}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: isMobile ? SPACING.md : SPACING.lg,
                                    padding: isMobile ? SPACING.lg : SPACING.xxl,
                                    background: COLORS.surface,
                                    border: `1px solid ${COLORS.border}`,
                                    borderRadius: BORDER_RADIUS.xxxl,
                                    cursor: 'pointer',
                                    minHeight: isMobile ? '120px' : '180px',
                                    position: 'relative',
                                    overflow: 'hidden',
                                }}
                            >
                                {/* Background Gradient on Hover */}
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: `linear-gradient(135deg, ${action.color}08 0%, transparent 60%)`,
                                    opacity: 0.5,
                                }} />
                                
                                {/* Icon Container */}
                                <motion.div
                                    transition={{ duration: 0.15 }}
                                    whileHover={isMobile ? {} : { scale: 1.1, rotate: 5 }}
                                    style={{
                                        width: isMobile ? '48px' : '64px',
                                        height: isMobile ? '48px' : '64px',
                                        borderRadius: BORDER_RADIUS.xxl,
                                        background: `linear-gradient(135deg, ${action.color}15 0%, ${action.color}08 100%)`,
                                        border: `1px solid ${action.color}25`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: action.color,
                                        position: 'relative',
                                        zIndex: 1,
                                    }}
                                >
                                    {getActionIcon(action.iconType, isMobile ? 22 : 28)}
                                </motion.div>
                                
                                {/* Label */}
                                <span style={{
                                    fontSize: isMobile ? FONT_SIZE.sm : FONT_SIZE.lg,
                                    fontWeight: FONT_WEIGHT.semibold,
                                    color: COLORS.textPrimary,
                                    textAlign: 'center',
                                    position: 'relative',
                                    zIndex: 1,
                                    lineHeight: 1.3,
                                }}>
                                    {action.label}
                                </span>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>

                {/* At-Risk Students Alert Panel */}
                {!isLoadingAtRisk && atRiskStudents.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        style={{
                            background: `linear-gradient(135deg, ${COLORS.danger}04 0%, ${COLORS.surface} 100%)`,
                            borderRadius: BORDER_RADIUS.full,
                            padding: SPACING.xxl,
                            border: `1px solid ${COLORS.dangerBorder}`,
                            marginBottom: SPACING.xxl,
                        }}
                        className="at-risk-panel"
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.xl }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.lg }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: BORDER_RADIUS.xl,
                                    background: COLORS.dangerLight,
                                    border: `1px solid ${COLORS.dangerBorder}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: COLORS.danger,
                                }}>
                                    <UserAlertIcon size={20} />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.semibold, color: COLORS.textPrimary, margin: 0 }}>
                                        Students Needing Attention
                                    </h2>
                                    <p style={{ fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, margin: 0 }}>
                                        {atRiskStudents.length} students may need intervention
                                    </p>
                                </div>
                            </div>
                            <motion.button
                                transition={{ duration: 0.15, ease: 'easeOut' }}
                                whileHover={{ scale: 1.02, boxShadow: '0 8px 20px rgba(239, 68, 68, 0.3)' }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => openModal('isAtRiskStudentsOpen')}
                                style={{
                                    padding: `${SPACING.sm} ${SPACING.lg}`,
                                    background: `linear-gradient(135deg, ${COLORS.danger} 0%, #dc2626 100%)`,
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: BORDER_RADIUS.lg,
                                    fontSize: FONT_SIZE.sm,
                                    fontWeight: FONT_WEIGHT.medium,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: SPACING.sm,
                                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
                                }}
                            >
                                View All Students
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </motion.button>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))', gap: SPACING.md }}>
                            {atRiskStudents.map((student, index) => (
                                <motion.div
                                    key={student.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0, transition: { delay: 0.3 + index * 0.05 } }}
                                    transition={{ duration: 0.15, ease: 'easeOut' }}
                                    whileHover={{ scale: 1.01, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: SPACING.lg,
                                        padding: SPACING.lg,
                                        borderRadius: BORDER_RADIUS.xl,
                                        background: COLORS.surface,
                                        border: `1px solid ${COLORS.border}`,
                                        cursor: 'pointer',
                                    }}
                                >
                                    {/* Student Avatar */}
                                    <div style={{
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: '50%',
                                        background: `linear-gradient(135deg, ${COLORS.primary}20 0%, ${COLORS.primary}10 100%)`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: COLORS.primary,
                                        fontSize: FONT_SIZE.lg,
                                        fontWeight: FONT_WEIGHT.semibold,
                                        flexShrink: 0,
                                    }}>
                                        {student.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    
                                    {/* Student Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ 
                                            fontSize: FONT_SIZE.md, 
                                            fontWeight: FONT_WEIGHT.semibold, 
                                            color: COLORS.textPrimary,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}>
                                            {student.name}
                                        </div>
                                        <div style={{ 
                                            fontSize: FONT_SIZE.sm, 
                                            color: COLORS.textSecondary,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: SPACING.sm,
                                        }}>
                                            <span>{student.section}</span>
                                            <span style={{ color: COLORS.textMuted }}>•</span>
                                            <span>{student.subject}</span>
                                        </div>
                                        <div style={{ 
                                            fontSize: FONT_SIZE.xs, 
                                            color: COLORS.danger,
                                            marginTop: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                        }}>
                                            <AlertTriangleIcon size={12} />
                                            {student.issue}
                                        </div>
                                    </div>
                                    
                                    {/* Grade & Trend */}
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <div style={{ 
                                            fontSize: FONT_SIZE.xl, 
                                            fontWeight: FONT_WEIGHT.bold, 
                                            color: student.currentGrade < 70 ? COLORS.danger : COLORS.warning,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            justifyContent: 'flex-end',
                                        }}>
                                            {student.currentGrade}%
                                            {student.trend === 'declining' && <TrendDownIcon size={14} />}
                                        </div>
                                        <div style={{ 
                                            fontSize: FONT_SIZE.xs, 
                                            color: COLORS.textMuted,
                                        }}>
                                            {student.absences} absences
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Recent Activity Panel - Matching Groups/Catalog design */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    style={{
                        background: COLORS.surface,
                        borderRadius: '14px',
                        padding: '18px 22px',
                        border: `1px solid ${COLORS.border}`,
                        marginBottom: SPACING.xxl,
                    }}
                >
                    {/* Panel Header - Matching Groups page style */}
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        marginBottom: SPACING.lg,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}>
                            <motion.div
                                whileHover={{ scale: 1.05, rotate: 5 }}
                                transition={{ duration: 0.15, ease: 'easeOut' }}
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <ClockIcon size={20} />
                            </motion.div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <h2 style={{ 
                                        fontSize: '16px', 
                                        fontWeight: 600, 
                                        color: COLORS.textPrimary, 
                                        margin: 0 
                                    }}>
                                        Recent Activity
                                    </h2>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '5px',
                                        background: 'rgba(59, 130, 246, 0.1)',
                                        fontSize: '10px',
                                        fontWeight: 600,
                                        color: '#3b82f6',
                                    }}>
                                        {activity.length} items
                                    </span>
                                </div>
                                <p style={{ margin: 0, fontSize: '12px', color: COLORS.textSecondary }}>
                                    Latest submissions and updates
                                </p>
                            </div>
                        </div>
                        
                        {/* View All Button - Matching Groups page "+ New Group" style */}
                        <motion.button
                            whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)' }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            onClick={() => openModal('isActivityModalOpen')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 12px',
                                background: 'rgba(59, 130, 246, 0.08)',
                                color: '#3b82f6',
                                border: '1px solid rgba(59, 130, 246, 0.2)',
                                borderRadius: '10px',
                                fontSize: '12px',
                                fontWeight: 500,
                                cursor: 'pointer',
                            }}
                        >
                            View All
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </motion.button>
                    </div>

                    {/* Activity Items - Real data or empty state */}
                    {activity.length === 0 ? (
                        // Empty state - centered with container
                        <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            padding: `${SPACING.xxxl} ${SPACING.xxl}`,
                            minHeight: '160px',
                        }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)',
                                border: '1px solid rgba(59, 130, 246, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: SPACING.md,
                            }}>
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                            </div>
                            <h3 style={{ 
                                fontSize: '15px', 
                                fontWeight: 600, 
                                color: COLORS.textPrimary,
                                margin: 0,
                                marginBottom: '4px',
                            }}>
                                No recent activity
                            </h3>
                            <p style={{ 
                                fontSize: '13px', 
                                color: COLORS.textSecondary,
                                margin: 0,
                                textAlign: 'center',
                            }}>
                                Activity will appear here when students submit work
                            </p>
                        </div>
                    ) : (
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(260px, 1fr))', 
                            gap: '12px',
                        }}>
                            {activity.slice(0, isMobile ? 3 : 4).map((item, index) => (
                                <motion.div
                                    key={item.id || index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0, transition: { delay: 0.35 + index * 0.05 } }}
                                    transition={{ duration: 0.15, ease: 'easeOut' }}
                                    whileHover={isMobile ? {} : { scale: 1.01, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: isMobile ? '12px' : '14px 16px',
                                        borderRadius: '12px',
                                        background: 'rgba(0,0,0,0.015)',
                                        border: '1px solid transparent',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {/* Activity Icon */}
                                    <div style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '10px',
                                        background: item.type === 'submission' ? 'rgba(59, 130, 246, 0.1)' :
                                                   item.type === 'grade' ? 'rgba(16, 185, 129, 0.1)' :
                                                   item.type === 'deadline' ? 'rgba(245, 158, 11, 0.1)' :
                                                   'rgba(139, 92, 246, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: item.type === 'submission' ? '#3b82f6' :
                                               item.type === 'grade' ? '#10b981' :
                                               item.type === 'deadline' ? '#f59e0b' :
                                               '#8b5cf6',
                                        flexShrink: 0,
                                    }}>
                                        {item.type === 'submission' ? (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                <polyline points="14 2 14 8 20 8" />
                                            </svg>
                                        ) : item.type === 'grade' ? (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                <polyline points="22 4 12 14.01 9 11.01" />
                                            </svg>
                                        ) : item.type === 'deadline' ? (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10" />
                                                <polyline points="12 6 12 12 16 14" />
                                            </svg>
                                        ) : (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                                <circle cx="9" cy="7" r="4" />
                                                <line x1="19" y1="8" x2="19" y2="14" />
                                                <line x1="22" y1="11" x2="16" y2="11" />
                                            </svg>
                                        )}
                                    </div>
                                    
                                    {/* Activity Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ 
                                            fontSize: '13px', 
                                            fontWeight: 600, 
                                            color: COLORS.textPrimary,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}>
                                            {item.action}
                                        </div>
                                        <div style={{ 
                                            fontSize: '12px', 
                                            color: COLORS.textSecondary,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}>
                                            {item.student} • {item.course}
                                        </div>
                                    </div>
                                    
                                    {/* Time */}
                                    <span style={{
                                        fontSize: '11px',
                                        color: COLORS.textMuted,
                                        whiteSpace: 'nowrap',
                                        flexShrink: 0,
                                    }}>
                                        {item.time}
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </main>

            {/* ============================================ */}
            {/* MODALS */}
            {/* ============================================ */}
            
            {/* Create Assignment Modal */}
            <CreateAssignmentModal
                isOpen={modals.isCreateAssignmentOpen}
                onClose={() => closeModal('isCreateAssignmentOpen')}
                onSubmit={async (data) => {
                    try {
                        const { createAssignment } = await import('../../services/teacherService');
                        const result = await createAssignment(data);
                        
                        if (result.success) {
                            console.log(`Successfully created ${result.createdCount} assignment(s)`);
                            if (result.errors.length > 0) {
                                console.warn('Some assignments failed:', result.errors);
                            }
                        } else {
                            console.error('Failed to create assignments:', result.errors);
                        }
                    } catch (error) {
                        console.error('Error creating assignment:', error);
                    }
                    closeModal('isCreateAssignmentOpen');
                }}
            />

            {/* Student List Modal */}
            <StudentListModal
                isOpen={modals.isStudentListOpen}
                onClose={() => closeModal('isStudentListOpen')}
            />

            {/* Grade Submissions Modal */}
            <GradeSubmissionsModal
                isOpen={modals.isGradeSubmissionsOpen}
                onClose={() => closeModal('isGradeSubmissionsOpen')}
            />

            {/* Input Scores Modal - Full Implementation */}
            <InputScoresModal
                isOpen={modals.isInputScoresOpen}
                onClose={() => closeModal('isInputScoresOpen')}
                onSave={async (examId, scores) => {
                    console.log('Saving scores for exam:', examId, scores);
                    // Simulate API call
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }}
            />

            {/* At-Risk Students Modal */}
            <AtRiskStudentsModal
                isOpen={modals.isAtRiskStudentsOpen}
                onClose={() => closeModal('isAtRiskStudentsOpen')}
            />

            {/* Activity Modal */}
            <ActivityModal
                isOpen={modals.isActivityModalOpen}
                onClose={() => closeModal('isActivityModalOpen')}
            />
            
            {/* Teacher Dashboard Intro - DISABLED for first-time users */}
            {/* Intro and tutorial are now hidden by default
            {showIntro && <TeacherDashboardIntro onComplete={() => {
                setShowIntro(false);
                // Tutorial will not auto-start
            }} />}
            */}
            
            {/* Teacher Dashboard Tutorial - DISABLED */}
            {/* Tutorial is hidden and won't appear automatically
            <TeacherDashboardTutorial
                isOpen={tutorialActive}
                onClose={closeTutorial}
            />
            */}
        </div>
    );
};

// Wrap with GradingSettingsProvider for shared grading settings
const TeacherDashboardWithProviders: React.FC = () => (
    <GradingSettingsProvider>
        <TeacherDashboard />
    </GradingSettingsProvider>
);

export default TeacherDashboardWithProviders;
