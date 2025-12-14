/**
 * Authentication Service
 * Handles user login/logout with Supabase database
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface User {
    id: string;
    student_id: string;
    email: string;
    full_name: string;
    first_name: string;
    last_name: string;
    role: 'student' | 'teacher' | 'admin' | 'dean';
    campus: string;
    program?: string;
    year_level?: string;
    section?: string;
    profile_image?: string;
}

export interface LoginResult {
    success: boolean;
    user?: User;
    error?: string;
}

// Storage key for current user
const USER_STORAGE_KEY = 'elms_current_user';

/**
 * Login with email and password
 */
export const loginUser = async (email: string, password: string): Promise<LoginResult> => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured() || !supabase) {
        // Fallback to demo mode
        return loginDemo(email, password);
    }

    try {
        // Query the users table
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email.toLowerCase())
            .eq('password_hash', password)
            .eq('is_active', true)
            .single();

        if (error || !data) {
            return {
                success: false,
                error: 'Invalid email or password'
            };
        }

        // Update last login
        await supabase
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', data.id);

        const user: User = {
            id: data.id,
            student_id: data.student_id,
            email: data.email,
            full_name: data.full_name,
            first_name: data.first_name,
            last_name: data.last_name,
            role: data.role,
            campus: data.campus,
            program: data.program,
            year_level: data.year_level,
            section: data.section,
            profile_image: data.profile_image,
        };

        // Save to localStorage
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        localStorage.setItem('student_id', user.student_id);

        return { success: true, user };
    } catch (err) {
        console.error('[Auth] Login error:', err);
        return {
            success: false,
            error: 'An error occurred during login'
        };
    }
};

/**
 * Demo login fallback when Supabase is not configured
 */
const loginDemo = (email: string, password: string): LoginResult => {
    // Demo credentials
    const demoUsers = [
        {
            email: 'deasis.462124@meycauayan.sti.edu.ph',
            password: 'testing101',
            user: {
                id: 'demo-user-1',
                student_id: '02000543210',
                email: 'deasis.462124@meycauayan.sti.edu.ph',
                full_name: 'Josiah P. De Asis',
                first_name: 'Josiah',
                last_name: 'De Asis',
                role: 'student' as const,
                campus: 'Meycauayan',
                program: 'BSIT',
                year_level: '1st Year',
                section: 'A',
            }
        },
        {
            email: 'teacher@meycauayan.sti.edu.ph',
            password: 'teacher123',
            user: {
                id: 'demo-teacher-1',
                student_id: 'TEACHER001',
                email: 'teacher@meycauayan.sti.edu.ph',
                full_name: 'David Clarence Del Mundo',
                first_name: 'David',
                last_name: 'Del Mundo',
                role: 'teacher' as const,
                campus: 'Meycauayan',
            }
        }
    ];

    const found = demoUsers.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (found) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(found.user));
        localStorage.setItem('student_id', found.user.student_id);
        return { success: true, user: found.user };
    }

    return {
        success: false,
        error: 'Invalid email or password'
    };
};

/**
 * Get current logged in user
 */
export const getCurrentUser = (): User | null => {
    try {
        const saved = localStorage.getItem(USER_STORAGE_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.error('[Auth] Failed to get current user:', e);
    }
    return null;
};

/**
 * Check if user is logged in
 */
export const isLoggedIn = (): boolean => {
    return getCurrentUser() !== null;
};

/**
 * Logout current user
 */
export const logoutUser = (): void => {
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem('student_id');
};

/**
 * Get user by email (for "Pick an account" feature)
 */
export const getSavedAccounts = (): { email: string; name: string }[] => {
    try {
        const saved = localStorage.getItem('elms_saved_accounts');
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.error('[Auth] Failed to get saved accounts:', e);
    }
    return [];
};

/**
 * Save account for "Pick an account" feature
 */
export const saveAccount = (email: string, name: string): void => {
    const accounts = getSavedAccounts();
    const exists = accounts.find(a => a.email === email);
    if (!exists) {
        accounts.push({ email, name });
        localStorage.setItem('elms_saved_accounts', JSON.stringify(accounts));
    }
};

/**
 * Remove saved account
 */
export const removeSavedAccount = (email: string): void => {
    const accounts = getSavedAccounts().filter(a => a.email !== email);
    localStorage.setItem('elms_saved_accounts', JSON.stringify(accounts));
};

export default {
    loginUser,
    getCurrentUser,
    isLoggedIn,
    logoutUser,
    getSavedAccounts,
    saveAccount,
    removeSavedAccount,
};
