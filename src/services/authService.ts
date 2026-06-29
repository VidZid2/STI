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
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = import.meta.env.VITE_STORAGE_KEY || 'sti_secure_fallback_key_2026';

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
// LOGIN
// ============================================

export const loginUser = async (email: string, password: string): Promise<LoginResult> => {
    if (!isSupabaseConfigured() || !supabase) {
        return { success: false, error: 'System configuration error. Please try again later.' };
    }

    try {
        // Step 1: Authenticate via Supabase Auth (real JWT)
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email.toLowerCase().trim(),
            password,
        });

        if (authError || !authData.user) {
            return { success: false, error: 'Invalid email or password' };
        }

        // Step 2: Fetch the user's profile from the `users` table
        let finalProfile = null;
        try {
            const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('id, student_id, email, full_name, first_name, last_name, role, campus, program, year_level, section, profile_image')
                .eq('id', authData.user.id)
                .single();

            finalProfile = profile;
            
            if (profileError || !profile) {
                const { data: profileByEmail } = await supabase
                    .from('users')
                    .select('id, student_id, email, full_name, first_name, last_name, role, campus, program, year_level, section, profile_image')
                    .eq('email', authData.user.email?.toLowerCase() ?? '')
                    .single();
                finalProfile = profileByEmail;
            }
        } catch (dbErr) {
            console.warn("Database query failed (possible 500 error), falling back to demo user...", dbErr);
        }

        if (!finalProfile) {
            const { DEMO_USERS } = await import('./usersService');
            const demoUser = DEMO_USERS?.find(u => u.email.toLowerCase() === email.toLowerCase());
            
            if (demoUser) {
                // Return the demo user as a fallback if they exist in our local demo data
                finalProfile = {
                    id: demoUser.id,
                    student_id: demoUser.student_id,
                    email: demoUser.email,
                    full_name: demoUser.full_name,
                    first_name: demoUser.first_name,
                    last_name: demoUser.last_name,
                    role: demoUser.role,
                    campus: demoUser.campus,
                    program: demoUser.program,
                    year_level: demoUser.year_level,
                    section: demoUser.section,
                    profile_image: demoUser.profile_image
                };
            } else {
                await supabase.auth.signOut();
                return { success: false, error: 'Account not found. Please contact your administrator.' };
            }
        }

        // Step 3: Update last_login timestamp
        try {
            await supabase
                .from('users')
                .update({ last_login: new Date().toISOString() })
                .eq('id', finalProfile.id);
        } catch (updateErr) {
            console.warn("Could not update last_login timestamp", updateErr);
        }

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

        // Step 4: Cache profile for synchronous reads throughout the app, ENCRYPTED
        const encryptedUser = CryptoJS.AES.encrypt(JSON.stringify(user), ENCRYPTION_KEY).toString();
        sessionStorage.setItem(USER_STORAGE_KEY, encryptedUser);

        return { success: true, user };

    } catch (e) {
        // Network error or other unexpected exception
        console.error("Login exception:", e);
        return { success: false, error: 'An error occurred during login' };
    }
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
        if (saved) {
            const bytes = CryptoJS.AES.decrypt(saved, ENCRYPTION_KEY);
            const decrypted = bytes.toString(CryptoJS.enc.Utf8);
            if (decrypted) {
                return JSON.parse(decrypted);
            }
        }
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
