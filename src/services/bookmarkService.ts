/**
 * Bookmark Service
 * 
 * Manages course bookmarks with Supabase persistence and localStorage fallback.
 * Single source of truth used by both HomeContent and CatalogContent.
 * 
 * Table: student_bookmarks (student_id TEXT, course_id TEXT, PRIMARY KEY (student_id, course_id))
 * Run the SQL in docs/supabase-bookmarks.sql to create the table.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getCurrentUser } from './authService';

// ---------------------------------------------------------------------------
// Local storage fallback key (used when Supabase is unavailable)
// ---------------------------------------------------------------------------
const LOCAL_KEY = 'catalog-bookmarks';

// ---------------------------------------------------------------------------
// Internal helpers for localStorage
// ---------------------------------------------------------------------------
const localGet = (): string[] => {
    try {
        const stored = localStorage.getItem(LOCAL_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

const localSet = (ids: string[]): void => {
    try {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(ids));
    } catch {
        // Storage unavailable — ignore
    }
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Load all bookmarked course IDs for the current user.
 * Tries Supabase first; falls back to localStorage.
 * Also syncs Supabase result back to localStorage so the UI is always fast.
 */
export const getBookmarks = async (): Promise<string[]> => {
    const studentId = getCurrentUser()?.student_id;

    if (isSupabaseConfigured() && supabase && studentId) {
        try {
            const { data, error } = await supabase
                .from('student_bookmarks')
                .select('course_id')
                .eq('student_id', studentId)
                .order('created_at', { ascending: false });

            if (!error && data) {
                const ids = data.map((row: { course_id: string }) => row.course_id);
                // Keep localStorage in sync so `getBookmarksSync()` is accurate
                localSet(ids);
                return ids;
            }
        } catch {
            // Network error — fall through to localStorage
        }
    }

    return localGet();
};

/**
 * Synchronous read from localStorage only.
 * Use this for immediate UI rendering before the async load resolves.
 */
export const getBookmarksSync = (): string[] => localGet();

/**
 * Check whether a course is currently bookmarked (async).
 */
export const isBookmarked = async (courseId: string): Promise<boolean> => {
    const bookmarks = await getBookmarks();
    return bookmarks.includes(courseId);
};

/**
 * Toggle a bookmark for the given courseId.
 * Returns the new bookmarked state (true = now bookmarked).
 * Optimistic: updates localStorage immediately, then persists to Supabase.
 */
export const toggleBookmark = async (courseId: string): Promise<boolean> => {
    const current = localGet();
    const alreadyBookmarked = current.includes(courseId);
    const updated = alreadyBookmarked
        ? current.filter(id => id !== courseId)
        : [courseId, ...current];

    // Optimistic local update
    localSet(updated);

    const studentId = getCurrentUser()?.student_id;

    if (isSupabaseConfigured() && supabase && studentId) {
        try {
            if (alreadyBookmarked) {
                await supabase
                    .from('student_bookmarks')
                    .delete()
                    .eq('student_id', studentId)
                    .eq('course_id', courseId);
            } else {
                await supabase
                    .from('student_bookmarks')
                    .insert({ student_id: studentId, course_id: courseId });
            }
        } catch {
            // Supabase failed — localStorage already updated, so UI is still correct
        }
    }

    return !alreadyBookmarked;
};

/**
 * Synchronous toggle (localStorage only).
 * Use when you need instant response without awaiting.
 * Supabase sync still happens in the background.
 */
export const toggleBookmarkSync = (courseId: string): boolean => {
    const current = localGet();
    const alreadyBookmarked = current.includes(courseId);
    const updated = alreadyBookmarked
        ? current.filter(id => id !== courseId)
        : [courseId, ...current];
    localSet(updated);

    // Fire-and-forget Supabase sync
    const studentId = getCurrentUser()?.student_id;
    if (isSupabaseConfigured() && supabase && studentId) {
        if (alreadyBookmarked) {
            supabase
                .from('student_bookmarks')
                .delete()
                .eq('student_id', studentId)
                .eq('course_id', courseId)
                .then(() => {/* no-op */});
        } else {
            supabase
                .from('student_bookmarks')
                .insert({ student_id: studentId, course_id: courseId })
                .then(() => {/* no-op */});
        }
    }

    return !alreadyBookmarked;
};
