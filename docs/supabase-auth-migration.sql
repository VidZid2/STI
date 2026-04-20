-- =====================================================
-- SUPABASE COMPLETE AUTH MIGRATION
-- eLMS — Meycauayan STI
--
-- Run in: Supabase Dashboard → SQL Editor → New Query
--
-- EXECUTION ORDER (run each part separately, check output):
--   Part 1 → Create auth.users from public.users
--   Part 2 → Verify auth users were created
--   Part 3 → Create course_enrollments table + enroll teachers
--   Part 4 → Verify teacher enrollments
--   Part 5 → Apply RLS: users table
--   Part 6 → Apply RLS: course_tasks + student_submissions
--   Part 7 → Final verification
--
-- SAFE TO RE-RUN: All statements use IF NOT EXISTS / ON CONFLICT / DROP IF EXISTS
-- =====================================================


-- =====================================================
-- PART 1: Create auth.users for all existing public.users
--
-- This syncs your existing users table into Supabase Auth
-- so that supabase.auth.signInWithPassword() works for them.
-- Uses the password_hash column as the plaintext password
-- (it will be bcrypt-hashed properly by crypt()).
--
-- Safe to re-run — skips users that already exist in auth.users.
-- =====================================================

DO $auth_sync$
DECLARE
    user_record RECORD;
    auth_uid UUID;
BEGIN
    FOR user_record IN
        SELECT id, email, password_hash, full_name
        FROM public.users
        WHERE is_active = true
    LOOP
        -- Check if auth user already exists for this email
        SELECT id INTO auth_uid
        FROM auth.users
        WHERE email = lower(user_record.email);

        IF auth_uid IS NULL THEN
            INSERT INTO auth.users (
                instance_id,
                id,
                aud,
                role,
                email,
                encrypted_password,
                email_confirmed_at,
                raw_app_meta_data,
                raw_user_meta_data,
                created_at,
                updated_at,
                confirmation_token,
                email_change,
                email_change_token_new,
                recovery_token
            ) VALUES (
                '00000000-0000-0000-0000-000000000000',
                user_record.id,
                'authenticated',
                'authenticated',
                lower(user_record.email),
                crypt(user_record.password_hash, gen_salt('bf')),
                NOW(),
                '{"provider": "email", "providers": ["email"]}',
                json_build_object('full_name', user_record.full_name),
                NOW(),
                NOW(),
                '', '', '', ''
            );
            RAISE NOTICE 'Created auth user: %', user_record.email;
        ELSE
            RAISE NOTICE 'Already exists: % (auth id: %)', user_record.email, auth_uid;
        END IF;
    END LOOP;
END $auth_sync$;


-- =====================================================
-- PART 2: Verify — confirm auth users were created
--
-- Expected: every row shows ✅ YES in has_auth_user.
-- If any show ❌ NO, re-run Part 1 or check for errors.
-- =====================================================

SELECT
    u.email,
    u.full_name,
    u.role,
    u.is_active,
    CASE WHEN au.id IS NOT NULL THEN '✅ YES' ELSE '❌ NO' END AS has_auth_user
FROM public.users u
LEFT JOIN auth.users au ON au.id = u.id
ORDER BY u.role, u.full_name;


-- =====================================================
-- PART 3: Create course_enrollments table + enroll teachers
--
-- This table links teachers (and students) to the courses
-- they are assigned to. Required for RLS policies in Part 6.
--
-- Safe to re-run — uses IF NOT EXISTS and ON CONFLICT DO NOTHING.
-- =====================================================

-- Create the table
CREATE TABLE IF NOT EXISTS course_enrollments (
    id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    course_id   TEXT        NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id     UUID        NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    role        TEXT        NOT NULL DEFAULT 'student'
                            CHECK (role IN ('teacher', 'student')),
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (course_id, user_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_id   ON course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_role      ON course_enrollments(role);

-- Enable RLS (open policy for now — tightened in Part 6)
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on course_enrollments" ON course_enrollments;
CREATE POLICY "Allow all operations on course_enrollments"
ON course_enrollments FOR ALL
USING (true)
WITH CHECK (true);

-- Enroll teachers in their courses based on the instructor field
-- Matches courses.instructor (full_name) → users.full_name WHERE role = 'teacher'
INSERT INTO course_enrollments (course_id, user_id, role)
SELECT
    c.id   AS course_id,
    u.id   AS user_id,
    'teacher' AS role
FROM courses c
JOIN users u ON u.full_name = c.instructor
WHERE u.role = 'teacher'
ON CONFLICT (course_id, user_id) DO NOTHING;


-- =====================================================
-- PART 4: Verify teacher enrollments
--
-- Expected: each course shows its assigned teacher.
-- If a course shows no teacher, check that courses.instructor
-- exactly matches users.full_name (case-sensitive).
-- =====================================================

SELECT
    c.short_title                                           AS course,
    c.instructor                                            AS instructor_name_in_courses,
    u.full_name                                             AS matched_user,
    CASE WHEN ce.id IS NOT NULL THEN '✅ Enrolled' ELSE '❌ Not enrolled' END AS status
FROM courses c
LEFT JOIN users u  ON u.full_name = c.instructor AND u.role = 'teacher'
LEFT JOIN course_enrollments ce ON ce.course_id = c.id AND ce.user_id = u.id
ORDER BY c.short_title;


-- =====================================================
-- PART 5: RLS — users table
--
-- Replaces the open "Allow all operations on users" policy
-- with scoped policies.
--
-- IMPORTANT: Click "Run without RLS" when prompted.
-- The ALTER TABLE statements below handle RLS explicitly.
-- =====================================================

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on users (clean slate)
DROP POLICY IF EXISTS "Allow all operations on users"      ON public.users;
DROP POLICY IF EXISTS "users_read_own_profile"             ON public.users;
DROP POLICY IF EXISTS "users_read_by_email"                ON public.users;
DROP POLICY IF EXISTS "admins_read_all_profiles"           ON public.users;
DROP POLICY IF EXISTS "teachers_read_student_profiles"     ON public.users;
DROP POLICY IF EXISTS "users_update_own_profile"           ON public.users;
DROP POLICY IF EXISTS "users_update_own"                   ON public.users;
DROP POLICY IF EXISTS "users_read_all_for_service"         ON public.users;

-- Authenticated users can read their own profile
CREATE POLICY "users_read_own_profile"
ON public.users FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = id);

-- Authenticated users can also read by email
-- (needed by authService.ts fallback: .eq('email', authData.user.email))
CREATE POLICY "users_read_by_email"
ON public.users FOR SELECT TO authenticated
USING (email = (SELECT auth.jwt() ->> 'email'));

-- Admins and deans can read all profiles
CREATE POLICY "admins_read_all_profiles"
ON public.users FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = (SELECT auth.uid())
          AND role IN ('admin', 'dean')
    )
);

-- Teachers can read student profiles (needed for student list modal)
CREATE POLICY "teachers_read_student_profiles"
ON public.users FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = (SELECT auth.uid())
          AND role = 'teacher'
    )
);

-- Users can update only their own profile
CREATE POLICY "users_update_own"
ON public.users FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = id)
WITH CHECK ((SELECT auth.uid()) = id);


-- =====================================================
-- PART 6: RLS — course_tasks + student_submissions
--
-- IMPORTANT: Click "Run without RLS" when prompted.
-- ALTER TABLE statements below handle RLS explicitly.
-- =====================================================

-- Ensure RLS is enabled on both tables
ALTER TABLE course_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_submissions ENABLE ROW LEVEL SECURITY;

-- ─── course_tasks ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Allow all operations on tasks"  ON course_tasks;
DROP POLICY IF EXISTS "all_read_tasks"                 ON course_tasks;
DROP POLICY IF EXISTS "authenticated_read_tasks"       ON course_tasks;
DROP POLICY IF EXISTS "teachers_write_tasks"           ON course_tasks;
DROP POLICY IF EXISTS "teachers_update_tasks"          ON course_tasks;

-- All authenticated users can read tasks
CREATE POLICY "authenticated_read_tasks"
ON course_tasks FOR SELECT TO authenticated
USING (true);

-- Teachers can insert tasks for their assigned courses
CREATE POLICY "teachers_write_tasks"
ON course_tasks FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM course_enrollments ce
        WHERE ce.user_id = (SELECT auth.uid())
          AND ce.course_id = course_tasks.course_id
          AND ce.role = 'teacher'
    )
    OR EXISTS (
        SELECT 1 FROM users
        WHERE id = (SELECT auth.uid())
          AND role IN ('admin', 'dean')
    )
);

-- Teachers can update tasks for their assigned courses
CREATE POLICY "teachers_update_tasks"
ON course_tasks FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM course_enrollments ce
        WHERE ce.user_id = (SELECT auth.uid())
          AND ce.course_id = course_tasks.course_id
          AND ce.role = 'teacher'
    )
    OR EXISTS (
        SELECT 1 FROM users
        WHERE id = (SELECT auth.uid())
          AND role IN ('admin', 'dean')
    )
);

-- ─── student_submissions ─────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Allow all operations on submissions" ON student_submissions;
DROP POLICY IF EXISTS "students_own_submissions"            ON student_submissions;
DROP POLICY IF EXISTS "teachers_all_submissions"            ON student_submissions;
DROP POLICY IF EXISTS "teachers_course_submissions"         ON student_submissions;
DROP POLICY IF EXISTS "teachers_grade_submissions"          ON student_submissions;
DROP POLICY IF EXISTS "students_submit"                     ON student_submissions;

-- Students can read only their own submissions
CREATE POLICY "students_own_submissions"
ON student_submissions FOR SELECT TO authenticated
USING (
    student_id = (
        SELECT student_id FROM users WHERE id = (SELECT auth.uid())
    )
);

-- Teachers can read submissions for tasks in their assigned courses
-- Admins/deans can read all submissions
CREATE POLICY "teachers_course_submissions"
ON student_submissions FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = (SELECT auth.uid())
          AND role IN ('admin', 'dean')
    )
    OR task_id IN (
        SELECT ct.id
        FROM course_tasks ct
        JOIN course_enrollments ce ON ce.course_id = ct.course_id
        WHERE ce.user_id = (SELECT auth.uid())
          AND ce.role = 'teacher'
    )
);

-- Teachers can update (grade) submissions in their courses
CREATE POLICY "teachers_grade_submissions"
ON student_submissions FOR UPDATE TO authenticated
USING (
    task_id IN (
        SELECT ct.id
        FROM course_tasks ct
        JOIN course_enrollments ce ON ce.course_id = ct.course_id
        WHERE ce.user_id = (SELECT auth.uid())
          AND ce.role = 'teacher'
    )
    OR EXISTS (
        SELECT 1 FROM users
        WHERE id = (SELECT auth.uid())
          AND role IN ('admin', 'dean')
    )
);

-- Students can insert their own submissions
CREATE POLICY "students_submit"
ON student_submissions FOR INSERT TO authenticated
WITH CHECK (
    student_id = (
        SELECT student_id FROM users WHERE id = (SELECT auth.uid())
    )
);


-- =====================================================
-- PART 7: Final verification
--
-- Run this after all parts complete.
-- Every table should show RLS enabled + correct policy count.
-- =====================================================

-- Check RLS status on all affected tables
SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename IN (
    'users',
    'courses',
    'course_tasks',
    'course_enrollments',
    'student_submissions'
)
ORDER BY tablename;

-- Check policy count per table
SELECT
    tablename,
    COUNT(*) AS policy_count,
    string_agg(policyname, ', ' ORDER BY policyname) AS policies
FROM pg_policies
WHERE tablename IN (
    'users',
    'courses',
    'course_tasks',
    'course_enrollments',
    'student_submissions'
)
GROUP BY tablename
ORDER BY tablename;

-- Spot-check: confirm a teacher is enrolled in at least one course
SELECT
    u.full_name,
    u.role,
    COUNT(ce.id) AS courses_enrolled
FROM users u
LEFT JOIN course_enrollments ce ON ce.user_id = u.id AND ce.role = 'teacher'
WHERE u.role = 'teacher'
GROUP BY u.full_name, u.role
ORDER BY u.full_name;
