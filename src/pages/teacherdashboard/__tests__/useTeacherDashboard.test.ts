/**
 * useTeacherDashboard Hook Tests
 * Phase 4D: Unit tests for the main dashboard hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

// Mock the services
vi.mock('../../../services/authService', () => ({
    getCurrentUser: vi.fn(),
    logoutUser: vi.fn(),
}));

vi.mock('../../../services/teacherService', () => ({
    teacherService: {
        getStats: vi.fn(),
        getActivity: vi.fn(),
    },
}));

// Import after mocking
import { useTeacherDashboard } from '../hooks/useTeacherDashboard';
import { getCurrentUser, logoutUser } from '../../../services/authService';
import { teacherService } from '../../../services/teacherService';

describe('useTeacherDashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockNavigate.mockClear();
    });

    describe('initialization', () => {
        it('should start with loading state', () => {
            (getCurrentUser as ReturnType<typeof vi.fn>).mockReturnValue({ role: 'teacher', first_name: 'Test' });
            (teacherService.getStats as ReturnType<typeof vi.fn>).mockResolvedValue({
                totalStudents: 10,
                totalCourses: 2,
                pendingSubmissions: 5,
                averageGrade: 85,
            });
            (teacherService.getActivity as ReturnType<typeof vi.fn>).mockResolvedValue([]);

            const { result } = renderHook(() => useTeacherDashboard());
            
            expect(result.current.isLoading).toBe(true);
        });

        it('should load user data on mount', async () => {
            const mockUser = { 
                role: 'teacher', 
                first_name: 'John',
                full_name: 'John Doe',
                email: 'john@test.com',
            };
            (getCurrentUser as ReturnType<typeof vi.fn>).mockReturnValue(mockUser);
            (teacherService.getStats as ReturnType<typeof vi.fn>).mockResolvedValue({
                totalStudents: 10,
                totalCourses: 2,
                pendingSubmissions: 5,
                averageGrade: 85,
            });
            (teacherService.getActivity as ReturnType<typeof vi.fn>).mockResolvedValue([]);

            const { result } = renderHook(() => useTeacherDashboard());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.user).toEqual(mockUser);
        });

        it('should fetch stats on initialization', async () => {
            const mockStats = {
                totalStudents: 41,
                totalCourses: 3,
                pendingSubmissions: 12,
                averageGrade: 87.5,
            };
            (getCurrentUser as ReturnType<typeof vi.fn>).mockReturnValue({ role: 'teacher' });
            (teacherService.getStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockStats);
            (teacherService.getActivity as ReturnType<typeof vi.fn>).mockResolvedValue([]);

            const { result } = renderHook(() => useTeacherDashboard());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.stats).toEqual(mockStats);
            expect(teacherService.getStats).toHaveBeenCalled();
        });

        it('should redirect non-teacher users to dashboard', async () => {
            (getCurrentUser as ReturnType<typeof vi.fn>).mockReturnValue({ role: 'student' });
            (teacherService.getStats as ReturnType<typeof vi.fn>).mockResolvedValue({});
            (teacherService.getActivity as ReturnType<typeof vi.fn>).mockResolvedValue([]);

            renderHook(() => useTeacherDashboard());

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
            });
        });

        it('should redirect unauthenticated users to login', async () => {
            (getCurrentUser as ReturnType<typeof vi.fn>).mockReturnValue(null);

            renderHook(() => useTeacherDashboard());

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/student-login');
            });
        });
    });

    describe('modal management', () => {
        beforeEach(() => {
            (getCurrentUser as ReturnType<typeof vi.fn>).mockReturnValue({ role: 'teacher' });
            (teacherService.getStats as ReturnType<typeof vi.fn>).mockResolvedValue({});
            (teacherService.getActivity as ReturnType<typeof vi.fn>).mockResolvedValue([]);
        });

        it('should open modal correctly', async () => {
            const { result } = renderHook(() => useTeacherDashboard());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            act(() => {
                result.current.openModal('isCreateAssignmentOpen');
            });

            expect(result.current.modals.isCreateAssignmentOpen).toBe(true);
        });

        it('should close modal correctly', async () => {
            const { result } = renderHook(() => useTeacherDashboard());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            act(() => {
                result.current.openModal('isCreateAssignmentOpen');
            });

            expect(result.current.modals.isCreateAssignmentOpen).toBe(true);

            act(() => {
                result.current.closeModal('isCreateAssignmentOpen');
            });

            expect(result.current.modals.isCreateAssignmentOpen).toBe(false);
        });

        it('should handle multiple modals independently', async () => {
            const { result } = renderHook(() => useTeacherDashboard());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            act(() => {
                result.current.openModal('isCreateAssignmentOpen');
                result.current.openModal('isStudentListOpen');
            });

            expect(result.current.modals.isCreateAssignmentOpen).toBe(true);
            expect(result.current.modals.isStudentListOpen).toBe(true);

            act(() => {
                result.current.closeModal('isCreateAssignmentOpen');
            });

            expect(result.current.modals.isCreateAssignmentOpen).toBe(false);
            expect(result.current.modals.isStudentListOpen).toBe(true);
        });
    });

    describe('quick actions', () => {
        beforeEach(() => {
            (getCurrentUser as ReturnType<typeof vi.fn>).mockReturnValue({ role: 'teacher' });
            (teacherService.getStats as ReturnType<typeof vi.fn>).mockResolvedValue({});
            (teacherService.getActivity as ReturnType<typeof vi.fn>).mockResolvedValue([]);
        });

        it('should handle create-assignment action', async () => {
            const { result } = renderHook(() => useTeacherDashboard());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            act(() => {
                result.current.handleQuickAction('create-assignment');
            });

            expect(result.current.modals.isCreateAssignmentOpen).toBe(true);
        });

        it('should handle grade-submissions action', async () => {
            const { result } = renderHook(() => useTeacherDashboard());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            act(() => {
                result.current.handleQuickAction('grade-submissions');
            });

            expect(result.current.modals.isGradeSubmissionsOpen).toBe(true);
        });

        it('should handle view-students action', async () => {
            const { result } = renderHook(() => useTeacherDashboard());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            act(() => {
                result.current.handleQuickAction('view-students');
            });

            expect(result.current.modals.isStudentListOpen).toBe(true);
        });

        it('should handle input-scores action', async () => {
            const { result } = renderHook(() => useTeacherDashboard());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            act(() => {
                result.current.handleQuickAction('input-scores');
            });

            expect(result.current.modals.isInputScoresOpen).toBe(true);
        });

        it('should handle unknown action gracefully', async () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const { result } = renderHook(() => useTeacherDashboard());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            act(() => {
                result.current.handleQuickAction('unknown-action');
            });

            expect(consoleSpy).toHaveBeenCalledWith('Unknown action: unknown-action');
            consoleSpy.mockRestore();
        });
    });

    describe('getStatValue', () => {
        beforeEach(() => {
            (getCurrentUser as ReturnType<typeof vi.fn>).mockReturnValue({ role: 'teacher' });
            (teacherService.getStats as ReturnType<typeof vi.fn>).mockResolvedValue({
                totalStudents: 41,
                totalCourses: 3,
                pendingSubmissions: 12,
                averageGrade: 87.5,
            });
            (teacherService.getActivity as ReturnType<typeof vi.fn>).mockResolvedValue([]);
        });

        it('should return correct stat values', async () => {
            const { result } = renderHook(() => useTeacherDashboard());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.getStatValue('students')).toBe(41);
            expect(result.current.getStatValue('courses')).toBe(3);
            expect(result.current.getStatValue('pending')).toBe(12);
            expect(result.current.getStatValue('average')).toBe('87.5%');
        });

        it('should return 0 for unknown stat', async () => {
            const { result } = renderHook(() => useTeacherDashboard());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.getStatValue('unknown')).toBe(0);
        });
    });

    describe('error handling', () => {
        it('should set error state on initialization failure', async () => {
            (getCurrentUser as ReturnType<typeof vi.fn>).mockImplementation(() => {
                throw new Error('Auth failed');
            });

            const { result } = renderHook(() => useTeacherDashboard());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.error).toBe('Auth failed');
        });

        it('should handle stats fetch failure gracefully', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            (getCurrentUser as ReturnType<typeof vi.fn>).mockReturnValue({ role: 'teacher' });
            (teacherService.getStats as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Stats failed'));
            (teacherService.getActivity as ReturnType<typeof vi.fn>).mockResolvedValue([]);

            const { result } = renderHook(() => useTeacherDashboard());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            // Should still complete loading even if stats fail
            expect(result.current.isLoading).toBe(false);
            consoleSpy.mockRestore();
        });
    });

    describe('logout', () => {
        it('should call logoutUser on handleLogout', async () => {
            (getCurrentUser as ReturnType<typeof vi.fn>).mockReturnValue({ role: 'teacher' });
            (teacherService.getStats as ReturnType<typeof vi.fn>).mockResolvedValue({});
            (teacherService.getActivity as ReturnType<typeof vi.fn>).mockResolvedValue([]);

            const { result } = renderHook(() => useTeacherDashboard());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            act(() => {
                result.current.handleLogout();
            });

            expect(logoutUser).toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });

    describe('refresh functions', () => {
        beforeEach(() => {
            (getCurrentUser as ReturnType<typeof vi.fn>).mockReturnValue({ role: 'teacher' });
            (teacherService.getStats as ReturnType<typeof vi.fn>).mockResolvedValue({
                totalStudents: 10,
                totalCourses: 2,
                pendingSubmissions: 5,
                averageGrade: 85,
            });
            (teacherService.getActivity as ReturnType<typeof vi.fn>).mockResolvedValue([]);
        });

        it('should refresh stats when called', async () => {
            const { result } = renderHook(() => useTeacherDashboard());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            // Clear mock to track new calls
            (teacherService.getStats as ReturnType<typeof vi.fn>).mockClear();
            (teacherService.getStats as ReturnType<typeof vi.fn>).mockResolvedValue({
                totalStudents: 50,
                totalCourses: 5,
                pendingSubmissions: 20,
                averageGrade: 90,
            });

            await act(async () => {
                await result.current.refreshStats();
            });

            expect(teacherService.getStats).toHaveBeenCalled();
            expect(result.current.stats.totalStudents).toBe(50);
        });

        it('should refresh activity when called', async () => {
            const { result } = renderHook(() => useTeacherDashboard());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            // Clear mock to track new calls
            (teacherService.getActivity as ReturnType<typeof vi.fn>).mockClear();
            (teacherService.getActivity as ReturnType<typeof vi.fn>).mockResolvedValue([
                { id: '1', type: 'submission', message: 'New submission', timestamp: new Date().toISOString() }
            ]);

            await act(async () => {
                await result.current.refreshActivity();
            });

            expect(teacherService.getActivity).toHaveBeenCalled();
            expect(result.current.activity).toHaveLength(1);
        });
    });
});
