-- =====================================================
-- PHASE 2 SCHEMA MIGRATION
-- eLMS Student Dashboard Upgrade
-- Generated: 2026-04-17
--
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- SAFE TO RE-RUN: All statements use IF NOT EXISTS / ADD COLUMN IF NOT EXISTS
--
-- WHAT THIS FIXES:
--   1. Missing is_typing column on group_members (chatService.ts line 322)
--   2. student_submissions not in supabase_realtime publication
--      (CourseViewPage live grade update subscription)
--   3. group_members not in supabase_realtime publication
--      (groupsService online presence subscriptions)
--   4. student_goals not in supabase_realtime publication
--      (Phase 4 goals wiring preparation)
--   5. course_tasks not in supabase_realtime publication
--      (Phase 4 task list live updates)
-- =====================================================


-- =====================================================
-- PATCH 1: Add is_typing column to group_members
-- chatService.ts calls:
--   .from('group_members').update({ is_typing: isTyping })
-- This column is missing from the original schema.
-- =====================================================

ALTER TABLE group_members ADD COLUMN IF NOT EXISTS is_typing BOOLEAN DEFAULT false;

-- Index for efficient typing indicator queries
CREATE INDEX IF NOT EXISTS idx_group_members_is_typing
    ON group_members(group_id, is_typing)
    WHERE is_typing = true;


-- =====================================================
-- PATCH 2: Publish student_submissions to Realtime
-- CourseViewPage subscribes to grade updates:
--   supabase.channel('student_grade_updates')
--     .on('postgres_changes', { table: 'student_submissions', ... })
-- Without this, the live grade update subscription silently fails.
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND tablename = 'student_submissions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE student_submissions;
        RAISE NOTICE 'student_submissions added to supabase_realtime';
    ELSE
        RAISE NOTICE 'student_submissions already in supabase_realtime — skipped';
    END IF;
END $$;


-- =====================================================
-- PATCH 3: Publish group_members to Realtime
-- groupsService.ts subscribes to member presence:
--   supabase.channel(`group-members-${groupId}`)
--     .on('postgres_changes', { table: 'group_members', ... })
--   supabase.channel('all-group-members')
--     .on('postgres_changes', { table: 'group_members', ... })
-- Without this, online/offline status never updates in real-time.
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND tablename = 'group_members'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE group_members;
        RAISE NOTICE 'group_members added to supabase_realtime';
    ELSE
        RAISE NOTICE 'group_members already in supabase_realtime — skipped';
    END IF;
END $$;


-- =====================================================
-- PATCH 4: Publish student_goals to Realtime
-- Preparation for Phase 4 goals service wiring.
-- GoalsContent will subscribe to live goal progress updates.
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND tablename = 'student_goals'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE student_goals;
        RAISE NOTICE 'student_goals added to supabase_realtime';
    ELSE
        RAISE NOTICE 'student_goals already in supabase_realtime — skipped';
    END IF;
END $$;


-- =====================================================
-- PATCH 5: Publish course_tasks to Realtime
-- Preparation for Phase 4 task list live updates.
-- Students will see new tasks appear without page refresh.
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND tablename = 'course_tasks'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE course_tasks;
        RAISE NOTICE 'course_tasks added to supabase_realtime';
    ELSE
        RAISE NOTICE 'course_tasks already in supabase_realtime — skipped';
    END IF;
END $$;


-- =====================================================
-- PATCH 6: Publish goal_progress_history to Realtime
-- Preparation for Phase 4 live progress chart updates.
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND tablename = 'goal_progress_history'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE goal_progress_history;
        RAISE NOTICE 'goal_progress_history added to supabase_realtime';
    ELSE
        RAISE NOTICE 'goal_progress_history already in supabase_realtime — skipped';
    END IF;
END $$;


-- =====================================================
-- VERIFICATION QUERY
-- Run this after the patches to confirm everything is correct.
-- Every row should show ✅ in the realtime column.
-- =====================================================

SELECT
    t.tablename,
    CASE WHEN t.rowsecurity THEN '✅ RLS ON' ELSE '❌ RLS OFF' END AS rls_status,
    CASE
        WHEN pt.tablename IS NOT NULL THEN '✅ Realtime ON'
        ELSE '⚠️  Realtime OFF'
    END AS realtime_status
FROM pg_tables t
LEFT JOIN pg_publication_tables pt
    ON pt.tablename = t.tablename
    AND pt.pubname = 'supabase_realtime'
WHERE t.tablename IN (
    'users',
    'courses',
    'course_tasks',
    'course_enrollments',
    'student_submissions',
    'student_stats',
    'student_goals',
    'goal_progress_history',
    'study_groups',
    'group_members',
    'group_messages',
    'group_invites',
    'group_resources',
    'message_read_receipts',
    'learning_paths',
    'path_progress',
    'term_grades'
)
ORDER BY t.tablename;


-- =====================================================
-- STORAGE BUCKET REMINDER
-- These CANNOT be created via SQL — must be done manually:
--
-- 1. Supabase Dashboard → Storage → New Bucket
--    Name: task-attachments
--    Public: YES
--
-- 2. Supabase Dashboard → Storage → New Bucket
--    Name: chat-attachments
--    Public: YES
--
-- The RLS policies for both buckets are already in
-- docs/supabase-setup.sql and will apply automatically
-- once the buckets exist.
-- =====================================================


-- =====================================================
-- SUMMARY OF CHANGES
-- =====================================================
-- Table                  | Change
-- -----------------------|----------------------------------
-- group_members          | + is_typing BOOLEAN DEFAULT false
-- student_submissions    | + Added to supabase_realtime
-- group_members          | + Added to supabase_realtime
-- student_goals          | + Added to supabase_realtime
-- course_tasks           | + Added to supabase_realtime
-- goal_progress_history  | + Added to supabase_realtime
-- =====================================================
-- No tables were dropped. No data was modified.
-- All changes are non-destructive and safe to re-run.
-- =====================================================
