/**
 * useGradingData Hook - Fetches and manages grading data from database
 * 
 * Provides:
 * - Tasks and submissions from Supabase
 * - Fallback to demo data when DB is empty or unavailable
 * - Loading and error states
 * - Refresh functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

export interface GradingTask {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  totalSubmissions: number;
  gradedCount: number;
  status: 'pending' | 'in-progress' | 'completed';
}

export interface StudentSubmission {
  id: string;
  studentName: string;
  studentId: string;
  taskId: string;
  submittedAt: string;
  status: 'pending' | 'graded' | 'returned';
  score?: number;
  feedback?: string;
  attachments?: string[];
}

export interface UseGradingDataReturn {
  tasks: GradingTask[];
  submissions: StudentSubmission[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// Demo data for fallback
const DEMO_TASKS: GradingTask[] = [
  {
    id: '1',
    title: 'Midterm Essay',
    subject: 'English Literature',
    dueDate: '2024-03-15',
    totalSubmissions: 25,
    gradedCount: 18,
    status: 'in-progress',
  },
  {
    id: '2',
    title: 'Math Problem Set 5',
    subject: 'Mathematics',
    dueDate: '2024-03-20',
    totalSubmissions: 30,
    gradedCount: 30,
    status: 'completed',
  },
  {
    id: '3',
    title: 'Science Lab Report',
    subject: 'Physics',
    dueDate: '2024-03-25',
    totalSubmissions: 22,
    gradedCount: 0,
    status: 'pending',
  },
];

const DEMO_SUBMISSIONS: StudentSubmission[] = [
  {
    id: 's1',
    studentName: 'Alice Johnson',
    studentId: 'STU001',
    taskId: '1',
    submittedAt: '2024-03-14T10:30:00Z',
    status: 'pending',
  },
  {
    id: 's2',
    studentName: 'Bob Smith',
    studentId: 'STU002',
    taskId: '1',
    submittedAt: '2024-03-14T11:45:00Z',
    status: 'graded',
    score: 85,
    feedback: 'Good analysis, but needs more citations.',
  },
  {
    id: 's3',
    studentName: 'Carol Davis',
    studentId: 'STU003',
    taskId: '2',
    submittedAt: '2024-03-19T09:00:00Z',
    status: 'returned',
    score: 92,
    feedback: 'Excellent work!',
  },
];

export function useGradingData(): UseGradingDataReturn {
  const [tasks, setTasks] = useState<GradingTask[]>([]);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if supabase is available
      if (!supabase) {
        console.warn('Supabase not configured, using demo data');
        setTasks(DEMO_TASKS);
        setSubmissions(DEMO_SUBMISSIONS);
        return;
      }

      // Try to fetch from Supabase
      const { data: tasksData, error: tasksError } = await supabase
        .from('grading_tasks')
        .select('*')
        .order('due_date', { ascending: true });

      const { data: submissionsData, error: submissionsError } = await supabase
        .from('student_submissions')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (tasksError || submissionsError) {
        console.warn('Database fetch failed, using demo data:', tasksError || submissionsError);
        setTasks(DEMO_TASKS);
        setSubmissions(DEMO_SUBMISSIONS);
        return;
      }

      // Use demo data if database is empty
      if (!tasksData?.length && !submissionsData?.length) {
        setTasks(DEMO_TASKS);
        setSubmissions(DEMO_SUBMISSIONS);
        return;
      }

      // Map database fields to interface
      setTasks(
        (tasksData || []).map((t: Record<string, unknown>) => ({
          id: t.id as string,
          title: t.title as string,
          subject: t.subject as string,
          dueDate: t.due_date as string,
          totalSubmissions: (t.total_submissions as number) || 0,
          gradedCount: (t.graded_count as number) || 0,
          status: (t.status as GradingTask['status']) || 'pending',
        }))
      );

      setSubmissions(
        (submissionsData || []).map((s: Record<string, unknown>) => ({
          id: s.id as string,
          studentName: s.student_name as string,
          studentId: s.student_id as string,
          taskId: s.task_id as string,
          submittedAt: s.submitted_at as string,
          status: (s.status as StudentSubmission['status']) || 'pending',
          score: s.score as number | undefined,
          feedback: s.feedback as string | undefined,
          attachments: s.attachments as string[] | undefined,
        }))
      );
    } catch (err) {
      console.error('Error fetching grading data:', err);
      setError('Failed to load grading data. Using demo data.');
      setTasks(DEMO_TASKS);
      setSubmissions(DEMO_SUBMISSIONS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    tasks,
    submissions,
    isLoading,
    error,
    refresh: fetchData,
  };
}
