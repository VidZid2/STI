/**
 * Authentication Service — Supabase Auth migration (Step 3)
 *
 * Login flow:
 *  1. Try supabase.auth.signInWithPassword() — real JWT session
 *  2. On success, fetch the user's profile from the `users` table
 *     (role, student_id, section, etc. live there, not in auth.users)
 *  3. Store the profile in sessionStorage for fast synchronous reads
 *     (getCurrentUser() is called in many places synchronously)
 *  4. If Supabase is not configured, fall back to demo credentials
 *
 * Logout: calls supabase.auth.signOut() to invalidate the JWT server-side,
 * then clears sessionStorage.
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

const USER_STORAGE_KEY = 'elms_current_user';

// ============================================
// EMAIL VALIDATION (check if email exists in users table)
// ============================================

export interface EmailCheckResult {
    exists: boolean;
    isPersonalAccount: boolean; // email exists but not in our system
}

export const checkEmailExists = async (email: string): Promise<EmailCheckResult> => {
    const normalizedEmail = email.toLowerCase().trim();

    if (isSupabaseConfigured() && supabase) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('email')
                .eq('email', normalizedEmail)
                .maybeSingle();

            if (error) {
                // On query error, fall through to demo check
            } else {
                return {
                    exists: !!data,
                    isPersonalAccount: !data,
                };
            }
        } catch {
            // Network error — fall through to demo check
        }
    }

    // Demo fallback — check against known demo emails
    const demoEmails = [
        'deasis.student1@meycauayan.sti.edu.ph',
        'deasis.462124@meycauayan.sti.edu.ph',
        'teacher@meycauayan.sti.edu.ph',
        'david.teacher1@meycauayan.sti.edu.ph',
    ];
    const exists = demoEmails.includes(normalizedEmail);
    return { exists, isPersonalAccount: !exists };
};

// ============================================
// LOGIN
// ============================================

export const loginUser = async (email: string, password: string): Promise<LoginResult> => {
    if (!isSupabaseConfigured() || !supabase) {
        return loginDemo(email, password);
    }

    try {
        // Step 1: Authenticate via Supabase Auth (real JWT)
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email.toLowerCase().trim(),
            password,
        });

        if (authError || !authData.user) {
            // Auth failed — try demo fallback for dev convenience
            const demoResult = loginDemo(email, password);
            if (demoResult.success) return demoResult;
            return { success: false, error: 'Invalid email or password' };
        }

        // Step 2: Fetch the user's profile from the `users` table
        // (Supabase Auth only stores email + id; role/section/etc. live in our table)
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('id, student_id, email, full_name, first_name, last_name, role, campus, program, year_level, section, profile_image')
            .eq('id', authData.user.id)
            .single();

        // Fallback: try matching by email if id lookup fails
        // (handles edge case where auth.id doesn't match users.id)
        let finalProfile = profile;
        if (profileError || !profile) {
            const { data: profileByEmail } = await supabase
                .from('users')
                .select('id, student_id, email, full_name, first_name, last_name, role, campus, program, year_level, section, profile_image')
                .eq('email', authData.user.email?.toLowerCase() ?? '')
                .single();
            finalProfile = profileByEmail;
        }

        if (!finalProfile) {
            await supabase.auth.signOut();
            return { success: false, error: 'Account not found. Please contact your administrator.' };
        }

        // Step 3: Update last_login timestamp
        await supabase
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', finalProfile.id);

        const user: User = {
            id: finalProfile.id,
            student_id: finalProfile.student_id,
            email: finalProfile.email,
            full_name: finalProfile.full_name,
            first_name: finalProfile.first_name,
            last_name: finalProfile.last_name,
            role: finalProfile.role,
            campus: finalProfile.campus,
            program: finalProfile.program,
            year_level: finalProfile.year_level,
            section: finalProfile.section,
            profile_image: finalProfile.profile_image,
        };

        // Step 4: Cache profile for synchronous reads throughout the app
        sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        sessionStorage.setItem('student_id', user.student_id);

        return { success: true, user };

    } catch {
        // Network error — try demo fallback
        const demoResult = loginDemo(email, password);
        if (demoResult.success) return demoResult;
        return { success: false, error: 'An error occurred during login' };
    }
};

// ============================================
// DEMO FALLBACK (when Supabase is not configured or unreachable)
// ============================================

const loginDemo = (email: string, password: string): LoginResult => {
    const demoUsers = [
        {
            email: 'deasis.student1@meycauayan.sti.edu.ph',
            password: '123',
            user: {
                id: 'demo-student-josiah',
                student_id: '02000543210',
                email: 'deasis.student1@meycauayan.sti.edu.ph',
                full_name: 'Josiah De Asis',
                first_name: 'Josiah',
                last_name: 'De Asis',
                role: 'student' as const,
                campus: 'Meycauayan',
                program: 'BSIT',
                year_level: '1st Year',
                section: 'BSIT101A',
            },
        },
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
                section: 'BSIT101A',
            },
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
            },
        },
        {
            email: 'david.teacher1@meycauayan.sti.edu.ph',
            password: '123',
            user: {
                id: 'demo-teacher-david',
                student_id: 'TEACHER001',
                email: 'david.teacher1@meycauayan.sti.edu.ph',
                full_name: 'David Clarence Del Mundo',
                first_name: 'David Clarence',
                last_name: 'Del Mundo',
                role: 'teacher' as const,
                campus: 'Meycauayan',
            },
        },
    ];

    const found = demoUsers.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (found) {
        sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(found.user));
        sessionStorage.setItem('student_id', found.user.student_id);
        return { success: true, user: found.user };
    }

    return { success: false, error: 'Invalid email or password' };
};

// ============================================
// SESSION
// ============================================

/**
 * Synchronous read of the cached user profile.
 * Fast — reads from sessionStorage, no network call.
 */
export const getCurrentUser = (): User | null => {
    try {
        const saved = sessionStorage.getItem(USER_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
    } catch {
        // Corrupted storage — clear it
        sessionStorage.removeItem(USER_STORAGE_KEY);
    }
    return null;
};

export const isLoggedIn = (): boolean => getCurrentUser() !== null;

/**
 * Sign out — invalidates the Supabase JWT server-side, then clears local cache.
 */
export const logoutUser = async (): Promise<void> => {
    if (isSupabaseConfigured() && supabase) {
        // Fire and forget — don't block the UI on network
        supabase.auth.signOut().catch(() => {});
    }
    sessionStorage.removeItem(USER_STORAGE_KEY);
    sessionStorage.removeItem('student_id');
};

// ============================================
// SAVED ACCOUNTS ("Pick an account" feature)
// ============================================

export const getSavedAccounts = (): { email: string; name: string }[] => {
    try {
        const saved = localStorage.getItem('elms_saved_accounts');
        if (saved) return JSON.parse(saved);
    } catch {
        localStorage.removeItem('elms_saved_accounts');
    }
    return [];
};

export const saveAccount = (email: string, name: string): void => {
    const accounts = getSavedAccounts();
    if (!accounts.find(a => a.email === email)) {
        accounts.push({ email, name });
        localStorage.setItem('elms_saved_accounts', JSON.stringify(accounts));
    }
};

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
