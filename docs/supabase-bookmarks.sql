-- =====================================================
-- student_bookmarks table
-- eLMS — Meycauayan STI
--
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- Safe to re-run (uses IF NOT EXISTS / DROP POLICY IF EXISTS)
-- =====================================================

-- Create the table
CREATE TABLE IF NOT EXISTS student_bookmarks (
    student_id  TEXT        NOT NULL,
    course_id   TEXT        NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (student_id, course_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_student_bookmarks_student_id ON student_bookmarks(student_id);
CREATE INDEX IF NOT EXISTS idx_student_bookmarks_course_id  ON student_bookmarks(course_id);

-- Enable Row Level Security
ALTER TABLE student_bookmarks ENABLE ROW LEVEL SECURITY;

-- Open policy (demo mode — matches other tables in the project)
DROP POLICY IF EXISTS "Allow all operations on student_bookmarks" ON student_bookmarks;
CREATE POLICY "Allow all operations on student_bookmarks"
ON student_bookmarks FOR ALL
USING (true)
WITH CHECK (true);

-- =====================================================
-- Verify
-- =====================================================
SELECT tablename, rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'student_bookmarks';
