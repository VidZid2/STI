// Deadlines Service - Manages upcoming deadlines with localStorage + Supabase sync

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getStudentId } from './databaseService';

export interface Deadline {
    id: string;
    title: string;
    type: 'quiz' | 'assignment' | 'performance' | 'exam' | 'project';
    courseId: string;
    courseName: string;
    dueDate: string; // ISO date string
    completed: boolean;
    createdAt: string;
}

const STORAGE_KEY = 'dashboard-deadlines';
const DEADLINES_RESET_KEY = 'deadlines-reset-v1'; // Flag for fresh start

// Course data for reference
export const COURSES = [
    { id: 'cp1', name: 'Computer Programming 1', shortName: 'CP1' },
    { id: 'euth1', name: 'Euthenics 1', shortName: 'Euth1' },
    { id: 'itc', name: 'Introduction to Computing', shortName: 'ITC' },
    { id: 'nstp1', name: 'NSTP 1', shortName: 'NSTP1' },
    { id: 'pe1', name: 'P.E./PATHFIT 1', shortName: 'PE1' },
    { id: 'ppc', name: 'Philippine Popular Culture', shortName: 'PPC' },
    { id: 'purcom', name: 'Purposive Communication', shortName: 'PurCom' },
    { id: 'tcw', name: 'The Contemporary World', shortName: 'TCW' },
    { id: 'uts', name: 'Understanding the Self', shortName: 'UTS' },
];

// Default deadlines - empty (no demo data)
const getDefaultDeadlines = (): Deadline[] => {
    return []; // Start with no deadlines
};

// Load deadlines from localStorage
export const getDeadlines = (): Deadline[] => {
    // Check if we need to reset to fresh start (no demo data)
    const hasReset = localStorage.getItem(DEADLINES_RESET_KEY);
    if (!hasReset) {
        console.log('[Deadlines] Resetting to fresh start (no demo data)');
        localStorage.setItem(DEADLINES_RESET_KEY, 'true');
        const defaults = getDefaultDeadlines();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
        // Sync to database
        saveDeadlinesToDb(defaults);
        return defaults;
    }

    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
        // Initialize with default deadlines
        const defaults = getDefaultDeadlines();
        saveDeadlines(defaults);
        return defaults;
    } catch {
        return getDefaultDeadlines();
    }
};

// Save deadlines to localStorage and database
export const saveDeadlines = (deadlines: Deadline[]): void => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deadlines));
    // Async save to database (non-blocking)
    saveDeadlinesToDb(deadlines).catch(console.error);
};

// Save deadlines to Supabase database
const saveDeadlinesToDb = async (deadlines: Deadline[]): Promise<boolean> => {
    if (!isSupabaseConfigured() || !supabase) {
        return false;
    }

    try {
        const studentId = getStudentId();
        const { error } = await supabase
            .from('student_stats')
            .upsert({
                student_id: studentId,
                deadlines_data: deadlines,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'student_id',
            });

        if (error) {
            console.error('[Deadlines] Error saving to database:', error);
            return false;
        }

        console.log('[Deadlines] Successfully saved to database');
        return true;
    } catch (err) {
        console.error('[Deadlines] Failed to save:', err);
        return false;
    }
};

// Load deadlines from Supabase database
export const loadDeadlinesFromDb = async (): Promise<Deadline[] | null> => {
    if (!isSupabaseConfigured() || !supabase) {
        return null;
    }

    try {
        const studentId = getStudentId();
        const { data, error } = await supabase
            .from('student_stats')
            .select('deadlines_data')
            .eq('student_id', studentId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null; // No record found
            }
            console.error('[Deadlines] Error loading from database:', error);
            return null;
        }

        if (data?.deadlines_data) {
            console.log('[Deadlines] Loaded from database');
            return data.deadlines_data as Deadline[];
        }
        return null;
    } catch (err) {
        console.error('[Deadlines] Failed to load:', err);
        return null;
    }
};

// Initialize deadlines (load from database if available)
export const initializeDeadlines = async (): Promise<void> => {
    const dbDeadlines = await loadDeadlinesFromDb();
    if (dbDeadlines) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dbDeadlines));
        localStorage.setItem(DEADLINES_RESET_KEY, 'true');
    }
};

// Add a new deadline
export const addDeadline = (deadline: Omit<Deadline, 'id' | 'createdAt' | 'completed'>): Deadline => {
    const deadlines = getDeadlines();
    const newDeadline: Deadline = {
        ...deadline,
        id: Date.now().toString(),
        completed: false,
        createdAt: new Date().toISOString(),
    };
    deadlines.push(newDeadline);
    saveDeadlines(deadlines);
    return newDeadline;
};

// Update a deadline
export const updateDeadline = (id: string, updates: Partial<Deadline>): Deadline | null => {
    const deadlines = getDeadlines();
    const index = deadlines.findIndex(d => d.id === id);
    if (index === -1) return null;
    
    deadlines[index] = { ...deadlines[index], ...updates };
    saveDeadlines(deadlines);
    return deadlines[index];
};

// Delete a deadline
export const deleteDeadline = (id: string): boolean => {
    const deadlines = getDeadlines();
    const filtered = deadlines.filter(d => d.id !== id);
    if (filtered.length === deadlines.length) return false;
    
    saveDeadlines(filtered);
    return true;
};

// Toggle deadline completion
export const toggleDeadlineComplete = (id: string): Deadline | null => {
    const deadlines = getDeadlines();
    const deadline = deadlines.find(d => d.id === id);
    if (!deadline) return null;
    
    return updateDeadline(id, { completed: !deadline.completed });
};

// Get upcoming deadlines (next 7 days, not completed)
export const getUpcomingDeadlines = (days: number = 7): Deadline[] => {
    const deadlines = getDeadlines();
    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + days);

    return deadlines
        .filter(d => {
            const dueDate = new Date(d.dueDate);
            return !d.completed && dueDate >= now && dueDate <= futureDate;
        })
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
};

// Get days until deadline
export const getDaysUntil = (dueDate: string): number => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Format days until as string
export const formatDaysUntil = (dueDate: string): { text: string; color: string } => {
    const days = getDaysUntil(dueDate);
    
    if (days < 0) {
        return { text: 'Overdue', color: 'text-red-600' };
    } else if (days === 0) {
        return { text: 'Today', color: 'text-red-500' };
    } else if (days === 1) {
        return { text: 'Tomorrow', color: 'text-red-500' };
    } else if (days <= 3) {
        return { text: `${days} days`, color: 'text-amber-500' };
    } else {
        return { text: `${days} days`, color: 'text-blue-500' };
    }
};

// Get deadline type color
export const getDeadlineTypeColor = (type: Deadline['type']): string => {
    switch (type) {
        case 'quiz': return 'bg-red-400';
        case 'assignment': return 'bg-amber-400';
        case 'performance': return 'bg-blue-400';
        case 'exam': return 'bg-purple-400';
        case 'project': return 'bg-emerald-400';
        default: return 'bg-zinc-400';
    }
};
