/**
 * Accessibility Audit — Teacher Dashboard
 * Uses axe-core via vitest-axe to catch automated WCAG violations.
 *
 * Scope: components that are rendered to the DOM and have interactive elements.
 * Components that require Supabase/context are mocked at the service layer.
 *
 * @vitest-environment jsdom
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import '@testing-library/jest-dom';

// ─── Custom matcher ───────────────────────────────────────────────────────────
// vitest-axe doesn't ship toHaveNoViolations — we assert directly.
const assertNoViolations = (results: Awaited<ReturnType<typeof axe>>) => {
    if (results.violations.length > 0) {
        const messages = results.violations.map(v =>
            `[${v.impact?.toUpperCase()}] ${v.id}: ${v.description}\n  Nodes: ${v.nodes.map(n => n.html).join(', ')}`
        ).join('\n\n');
        throw new Error(`axe found ${results.violations.length} accessibility violation(s):\n\n${messages}`);
    }
};

// ─── Global mocks ─────────────────────────────────────────────────────────────
vi.mock('motion/react', () => {
    const forwardRef = (fn: (props: Record<string, unknown>, ref: unknown) => React.ReactNode) =>
        React.forwardRef((props: Record<string, unknown>, ref) => fn(props, ref));

    const stripMotionProps = (props: Record<string, unknown>) => {
        const MOTION_KEYS = new Set([
            'initial', 'animate', 'exit', 'transition', 'variants',
            'whileHover', 'whileTap', 'whileFocus', 'whileDrag', 'whileInView',
            'layout', 'layoutId', 'onAnimationStart', 'onAnimationComplete',
            'onHoverStart', 'onHoverEnd', 'onTapStart', 'onTap', 'onTapCancel',
            'drag', 'dragConstraints', 'dragElastic', 'dragMomentum',
        ]);
        return Object.fromEntries(Object.entries(props).filter(([k]) => !MOTION_KEYS.has(k)));
    };

    const makeEl = (tag: string) =>
        forwardRef((props: Record<string, unknown>, ref) =>
            React.createElement(tag, { ...stripMotionProps(props), ref } as Record<string, unknown>)
        );

    return {
        motion: {
            div: makeEl('div'),
            button: makeEl('button'),
            span: makeEl('span'),
            header: makeEl('header'),
            a: makeEl('a'),
            p: makeEl('p'),
            h2: makeEl('h2'),
            h3: makeEl('h3'),
        },
        AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
        useAnimation: () => ({ start: vi.fn(), stop: vi.fn() }),
        useMotionValue: (v: unknown) => ({ get: () => v, set: vi.fn() }),
        useTransform: () => ({ get: vi.fn() }),
    };
});

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('../../../lib/supabase', () => ({ supabase: null, isSupabaseConfigured: () => false }));
vi.mock('../../../services/authService', () => ({
    getCurrentUser: () => ({ id: 'test-user', full_name: 'Test Teacher', email: 'test@test.com', first_name: 'Test', role: 'teacher' }),
    logoutUser: vi.fn(),
}));
vi.mock('../../../contexts/DisplaySettingsContext', () => ({
    useDisplaySettings: () => ({
        settings: { compactView: false, animationsEnabled: true, showAvatars: true },
        shouldAnimate: true,
        shouldShowAvatar: true,
    }),
}));
vi.mock('../../../contexts/SystemConfigContext', () => ({
    useSystemConfig: () => ({ systemConfig: { ai_enabled: false } }),
}));
vi.mock('../hooks', () => ({
    useResponsive: () => ({ isMobile: false, isSmallMobile: false }),
    useFocusTrap: () => React.createRef(),
    useTeacherDashboard: vi.fn(),
    useDashboardData: vi.fn(),
}));

// ─── Component imports ────────────────────────────────────────────────────────
import StatCard from '../components/StatCard';
import ErrorDisplay from '../components/ErrorDisplay';
import GradeConfirmDialog from '../grading/components/GradeConfirmDialog';
import AIReGradeWarningModal from '../grading/components/AIReGradeWarningModal';
import GradingTimer from '../grading/components/GradingTimer';
import ShortcutsPanel from '../grading/components/ShortcutsPanel';
import GradeHistoryPanel from '../grading/components/GradeHistoryPanel';
import { AtRiskFilterTabs } from '../atrisk';
import { ActivityFilterTabs } from '../activity';
import type { Submission, Task } from '../grading/types';

// ─── Test data ────────────────────────────────────────────────────────────────
const mockSubmission: Submission = {
    id: 'sub-1',
    task_id: 'task-1',
    student_id: 'stu-1',
    student_name: 'Juan Dela Cruz',
    section: 'BSIT-2A',
    attachments: [],
    status: 'submitted',
    score: null,
    submitted_at: new Date().toISOString(),
};

const mockTask: Task = {
    id: 'task-1',
    title: 'Week 5 Exercise',
    course_id: 'course-1',
    type: 'assignment',
    due_date: new Date().toISOString(),
    points: 100,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Teacher Dashboard — Accessibility Audit (axe-core)', () => {

    describe('StatCard', () => {
        it('has no axe violations', async () => {
            const { container } = render(
                <StatCard
                    title="Total Students"
                    value={42}
                    subtitle="Across all sections"
                    color="#3b82f6"
                    index={0}
                    icon={<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>}
                />
            );
            const results = await axe(container);
            assertNoViolations(results);
        });
    });

    describe('ErrorDisplay', () => {
        it('has no axe violations', async () => {
            const { container } = render(
                <ErrorDisplay message="Failed to load data" onRetry={vi.fn()} />
            );
            const results = await axe(container);
            assertNoViolations(results);
        });
    });

    describe('GradeConfirmDialog', () => {
        it('has no axe violations when visible', async () => {
            const { container } = render(
                <GradeConfirmDialog
                    show={true}
                    pendingGrade={{ score: 85, feedback: 'Good work on this assignment.' }}
                    submission={mockSubmission}
                    task={mockTask}
                    gradingSettings={{ latePenalty: false, latePenaltyPercent: 10 }}
                    onConfirm={vi.fn()}
                    onCancel={vi.fn()}
                />
            );
            const results = await axe(container);
            assertNoViolations(results);
        });

        it('renders nothing when hidden', () => {
            const { container } = render(
                <GradeConfirmDialog
                    show={false}
                    pendingGrade={null}
                    submission={mockSubmission}
                    task={mockTask}
                    onConfirm={vi.fn()}
                    onCancel={vi.fn()}
                />
            );
            expect(container.firstChild).toBeNull();
        });
    });

    describe('AIReGradeWarningModal', () => {
        it('has no axe violations when visible', async () => {
            const { container } = render(
                <AIReGradeWarningModal
                    show={true}
                    onConfirm={vi.fn()}
                    onCancel={vi.fn()}
                />
            );
            const results = await axe(container);
            assertNoViolations(results);
        });
    });

    describe('GradingTimer', () => {
        it('has no axe violations', async () => {
            const { container } = render(
                <GradingTimer isActive={true} gradedCount={5} />
            );
            const results = await axe(container);
            assertNoViolations(results);
        });
    });

    describe('ShortcutsPanel', () => {
        it('has no axe violations when visible', async () => {
            const { container } = render(<ShortcutsPanel visible={true} />);
            const results = await axe(container);
            assertNoViolations(results);
        });
    });

    describe('GradeHistoryPanel', () => {
        it('has no axe violations', async () => {
            const { container } = render(
                <GradeHistoryPanel
                    history={[
                        { score: 80, feedback: 'Good', graded_at: new Date().toISOString(), graded_by: 'teacher-1', version: 1 },
                        { score: 85, feedback: 'Better', graded_at: new Date().toISOString(), graded_by: 'teacher-1', version: 2 },
                    ]}
                    maxPoints={100}
                />
            );
            const results = await axe(container);
            assertNoViolations(results);
        });

        it('renders nothing with empty history', () => {
            const { container } = render(<GradeHistoryPanel history={[]} maxPoints={100} />);
            expect(container.firstChild).toBeNull();
        });
    });

    describe('AtRiskFilterTabs', () => {
        it('has no axe violations', async () => {
            const { container } = render(
                <AtRiskFilterTabs
                    activeFilter="all"
                    setActiveFilter={vi.fn()}
                    counts={{ all: 12, lowGrades: 5, absences: 3, missingWork: 4 }}
                />
            );
            const results = await axe(container);
            assertNoViolations(results);
        });

        it('has no axe violations with active filter', async () => {
            const { container } = render(
                <AtRiskFilterTabs
                    activeFilter="low-grades"
                    setActiveFilter={vi.fn()}
                    counts={{ all: 12, lowGrades: 5, absences: 3, missingWork: 4 }}
                />
            );
            const results = await axe(container);
            assertNoViolations(results);
        });
    });

    describe('ActivityFilterTabs', () => {
        it('has no axe violations', async () => {
            const { container } = render(
                <ActivityFilterTabs
                    activeFilter="all"
                    setActiveFilter={vi.fn()}
                    counts={{ all: 20, submissions: 8, graded: 7, late: 2, pending: 3 }}
                />
            );
            const results = await axe(container);
            assertNoViolations(results);
        });
    });

});

