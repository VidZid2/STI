-- =====================================================
-- ELMS Student Statistics Database Setup
-- =====================================================
-- Copy and paste this entire script into Supabase SQL Editor
-- Go to: Your Project > SQL Editor > New Query > Paste > Run
-- =====================================================

-- =====================================================
-- Users Table (for login authentication)
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role TEXT DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin', 'dean')),
    campus TEXT DEFAULT 'Meycauayan',
    program TEXT,
    year_level TEXT,
    section TEXT,
    profile_image TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (for demo purposes)
DROP POLICY IF EXISTS "Allow all operations on users" ON users;
CREATE POLICY "Allow all operations on users" ON users
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Insert all 41 BSIT101A students
-- Using ON CONFLICT (student_id) to handle re-runs safely
INSERT INTO users (student_id, email, password_hash, full_name, first_name, last_name, role, campus, program, year_level, section)
VALUES 
    ('02000543210', 'deasis.462124@meycauayan.sti.edu.ph', 'testing101', 'Josiah P. De Asis', 'Josiah', 'De Asis', 'student', 'Meycauayan', 'BSIT', '1st Year', 'BSIT101A'),
    ('02000543211', 'acorda.divine@meycauayan.sti.edu.ph', 'student123', 'Divine Maureen Acorda', 'Divine Maureen', 'Acorda', 'student', 'Meycauayan', 'BSIT', '1st Year', 'BSIT101A'),
    ('02000543212', 'adel.rogini@meycauayan.sti.edu.ph', 'student123', 'Rogini Adel', 'Rogini', 'Adel', 'student', 'Meycauayan', 'BSIT', '1st Year', 'BSIT101A'),
    ('02000543213', 'agao.justin@meycauayan.sti.edu.ph', 'student123', 'Justin Dominick Agao', 'Justin Dominick', 'Agao', 'student', 'Meycauayan', 'BSIT', '1st Year', 'BSIT101A'),
    ('02000543214', 'antolin.donbenn@meycauayan.sti.edu.ph', 'student123', 'Don Benn Federico Antolin', 'Don Benn Federico', 'Antolin', 'student', 'Meycauayan', 'BSIT', '1st Year', 'BSIT101A'),
    ('02000543215', 'baldivas.blake@meycauayan.sti.edu.ph', 'student123', 'Blake Cedrick Baldivas', 'Blake Cedrick', 'Baldivas', 'student', 'Meycauayan', 'BSIT', '1st Year', 'BSIT101A'),
    ('02000543216', 'bendolo.mark@meycauayan.sti.edu.ph', 'student123', 'Mark Lawrence Bendolo', 'Mark Lawrence', 'Bendolo', 'student', 'Meycauayan', 'BSIT', '1st Year', 'BSIT101A'),
    ('02000543217', 'bergania.jai@meycauayan.sti.edu.ph', 'student123', 'Jai Brielle Bergania', 'Jai Brielle', 'Bergania', 'student', 'Meycauayan', 'BSIT', '1st Year', 'BSIT101A'),
    ('02000543218', 'buenaflor.bradley@meycauayan.sti.edu.ph', 'student123', 'Bradley Buenaflor', 'Bradley', 'Buenaflor', 'student', 'Meycauayan', 'BSIT', '1st Year', 'BSIT101A'),
    ('02000543219', 'camacho.karl@meycauayan.sti.edu.ph', 'student123', 'Karl Benedict Camacho', 'Karl Benedict', 'Camacho', 'student', 'Meycauayan', 'BSIT', '1st Year', 'BSIT101A'),
    ('02000543220', 'canta.ismael@meycauayan.sti.edu.ph', 'student123', 'Ismael June Canta', 'Ismael June', 'Canta', 'student', 'Meycauayan', 'BSIT', '1st Year', 'BSIT101A'),
    ('02000543221', 'cariso.cristy@meycauayan.sti.edu.ph', 'student123', 'Cristy Shane Cariso', 'Cristy Shane', 'Cariso', 'student', 'Meycauayan', 'BSIT', '1st Year', 'BSIT101A'),
    ('02000543222', 'carlos.ayanamei@meycauayan.sti.edu.ph', 'student123', 'Ayanamei Carlos', 'Ayanamei', 'Carlos', 'student', 'Meycauayan', 'BSIT', '1st Year', 'BSIT101A'),
    ('02000543223', 'colambo.john@meycauayan.sti.edu.ph', 'student123', 'John Aldred Colambo', 'John Aldred', 'Colambo', 'student', 'Meycauayan', 'BSIT', '1st Year', 'BSIT101A'),
    ('02000543224', 'dagohoy.sophia@meycauayan.sti.edu.ph', 'student123', 'Sophia Lorraine Dagohoy', 'Sophia Lorraine', 'Dagohoy', 'student', 'Meycauayan', 'BSIT', '1st Year', 'BSIT101A'),
    ('02000543225', 'delacruz.kevin@meycauayan.sti.edu.ph', 'student123', 'Kevin Dela Cruz', 'Kevin', 'Dela Cruz', 'student', 'Meycauayan', 'BSIT', '1st Year', 'BSIT101A'),
    ('02000543226', 'evangelista.lance@meycauayan.sti.edu.ph', 'student123', 'Lance Michael Evangelista', 'Lance Michael', 'Evangelista', 'student', 'Meycauayan', 'BSIT', '1st Year', 'BSIT101A'),
    ('02000543227', 'fajardo.althea@meycauayan.sti.edu.ph', 'student123', 'Althea Fajardo', 'Althea', 'Fajardo', 'student', 'Meycauayan', 'BSIT', '1st Year', 'BSIT101A'),
    ('02000543228', 'halili.andrei@meycauayan.sti.edu.ph', 'student123', 'Andrei Jiroh Halili', 'Andrei Jiroh', 'Halili', 'student', 'Meycauayan', 'BSIT', '1st Year', 'BSIT101A'),
    ('02000543229', 'japsay.jetro@meycauayan.sti.edu.ph', 'student123', 'Jetro Josef Japsay', 'Jetro Josef', 'Japsay', 'student', 'Meycauayan', 'BSIT', '1st Year', 'BSIT101A'),
    ('02000543230', 'juban.jasper@meycauayan.sti.edu.ph', 'student123', 'Jasper Juban', 'Jasper', 'Juban', 'student', 'Meycauayan', 'BSIT', '1st Year', 'BSIT101A'),
    ('02000543231', 'lim.renato@meycauayan.sti.edu.ph', 'student123', 'Renato Lim', 'Renato', 'Lim', 'student', 'Meycauayan', 'BSIT', '1st Year', 'BSIT101A'),
    ('02000543232', 'macotulad.renzo@meycauayan.sti.edu.ph', 'student123', 'Renzo Macotulad', 'Renzo', 'Macotulad', 'student', 'Meycauayan', 'BSIT', '1st Year', 'BSIT101A'),
    ('02000543233', 'marfil.christopher@meycauayan.sti.edu.ph', 'student123', 'Christopher Jann Marfil', 'Christopher Jann', 'Marfil', 'student', 'Meycauayan', 'BSIT', '1st Year', 'BSIT101A'),
    ('02000543234', 'orlanda.denmart@meycauayan.sti.edu.ph', 'student123', 'Denmart Airon Orlanda', 'Denmart Airon', 'Orlanda', 'student', 'Meycauayan', 'BSIT', '1st Year', 'BSIT101A'),
    ('02000543235', 'pagdanganan.jan@meycauayan.sti.edu.ph', 'student123', 'Jan Mark Pagdanganan', 'Jan Mark', 'Pagdanganan', 'student', 'Meycauayan', 'BSIT', '1st Year', 'BSIT101A'),
    ('02000543236', 'paguirigan.mary@meycauayan.sti.edu.ph', 'student123', 'Mary Chris Ann Paguirigan', 'Mary Chris Ann', 'Paguirigan', 'student', 'Meycauayan', 'BSIT', '1st Year', 'BSIT101A'),
    ('02000543237', 'paras.romeo@meycauayan.sti.edu.ph', 'student123', 'Romeo Paras', 'Romeo', 'Paras', 'student', 'Meycauayan', 'BSIT', '1st Year', 'BSIT101A'),
    ('02000543238', 'ravela.fontleroy@meycauayan.sti.edu.ph', 'student123', 'Fontleroy Ravela', 'Fontleroy', 'Ravela', 'student', 'Meycauayan', 'BSIT', '1st Year', 'BSIT101A'),
    ('02000543239', 'rodriguez.carl@meycauayan.sti.edu.ph', 'student123', 'Carl Aaron Rodriguez', 'Carl Aaron', 'Rodriguez', 'student', 'Meycauayan', 'BSIT', '1st Year', 'BSIT101A'),
    ('02000543240', 'rodriguez.joel@meycauayan.sti.edu.ph', 'student123', 'Joel Rodriguez', 'Joel', 'Rodriguez', 'student', 'Meycauayan', 'BSIT', '1st Year', 'BSIT101A'),
    ('02000543241', 'sanvicente.luigie@meycauayan.sti.edu.ph', 'student123', 'Luigie San Vicente', 'Luigie', 'San Vicente', 'student', 'Meycauayan', 'BSIT', '1st Year', 'BSIT101A'),
    ('02000543242', 'santos.king@meycauayan.sti.edu.ph', 'student123', 'King Cyrhon Santos', 'King Cyrhon', 'Santos', 'student', 'Meycauayan', 'BSIT', '1st Year', 'BSIT101A'),
    ('02000543243', 'sausa.rashae@meycauayan.sti.edu.ph', 'student123', 'Rashae Gavin Sausa', 'Rashae Gavin', 'Sausa', 'student', 'Meycauayan', 'BSIT', '1st Year', 'BSIT101A'),
    ('02000543244', 'segismundo.jerome@meycauayan.sti.edu.ph', 'student123', 'Jerome Segismundo', 'Jerome', 'Segismundo', 'student', 'Meycauayan', 'BSIT', '1st Year', 'BSIT101A'),
    ('02000543245', 'solanoy.clariza@meycauayan.sti.edu.ph', 'student123', 'Clariza Solanoy', 'Clariza', 'Solanoy', 'student', 'Meycauayan', 'BSIT', '1st Year', 'BSIT101A'),
    ('02000543246', 'staana.benz@meycauayan.sti.edu.ph', 'student123', 'Benz Joshua Sta. Ana', 'Benz Joshua', 'Sta. Ana', 'student', 'Meycauayan', 'BSIT', '1st Year', 'BSIT101A'),
    ('02000543247', 'surigao.arian@meycauayan.sti.edu.ph', 'student123', 'Arian Marie Surigao', 'Arian Marie', 'Surigao', 'student', 'Meycauayan', 'BSIT', '1st Year', 'BSIT101A'),
    ('02000543248', 'tejada.james@meycauayan.sti.edu.ph', 'student123', 'James Ian Alexander Tejada', 'James Ian Alexander', 'Tejada', 'student', 'Meycauayan', 'BSIT', '1st Year', 'BSIT101A'),
    ('02000543249', 'tobias.jessiephine@meycauayan.sti.edu.ph', 'student123', 'Ma. Jessiephine Tobias', 'Ma. Jessiephine', 'Tobias', 'student', 'Meycauayan', 'BSIT', '1st Year', 'BSIT101A')
ON CONFLICT (student_id) DO NOTHING;

-- Insert all 8 teachers (from courses)
-- Using ON CONFLICT (student_id) to handle re-runs safely
INSERT INTO users (student_id, email, password_hash, full_name, first_name, last_name, role, campus)
VALUES 
    ('TEACHER001', 'delmundo@meycauayan.sti.edu.ph', 'teacher123', 'David Clarence Del Mundo', 'David Clarence', 'Del Mundo', 'teacher', 'Meycauayan'),
    ('TEACHER002', 'mariano@meycauayan.sti.edu.ph', 'teacher123', 'Psalmmiracle Mariano', 'Psalmmiracle', 'Mariano', 'teacher', 'Meycauayan'),
    ('TEACHER003', 'maurillo@meycauayan.sti.edu.ph', 'teacher123', 'Claire Maurillo', 'Claire', 'Maurillo', 'teacher', 'Meycauayan'),
    ('TEACHER004', 'sanmartin@meycauayan.sti.edu.ph', 'teacher123', 'John Denielle San Martin', 'John Denielle', 'San Martin', 'teacher', 'Meycauayan'),
    ('TEACHER005', 'danoy@meycauayan.sti.edu.ph', 'teacher123', 'Mark Joseph Danoy', 'Mark Joseph', 'Danoy', 'teacher', 'Meycauayan'),
    ('TEACHER006', 'montojo@meycauayan.sti.edu.ph', 'teacher123', 'Dan Risty Montojo', 'Dan Risty', 'Montojo', 'teacher', 'Meycauayan'),
    ('TEACHER007', 'lumintigar@meycauayan.sti.edu.ph', 'teacher123', 'Anne Jenell Lumintigar', 'Anne Jenell', 'Lumintigar', 'teacher', 'Meycauayan'),
    ('TEACHER008', 'lazalita@meycauayan.sti.edu.ph', 'teacher123', 'Jocel Lazalita', 'Jocel', 'Lazalita', 'teacher', 'Meycauayan')
ON CONFLICT (student_id) DO NOTHING;

-- =====================================================
-- Courses Table (All courses in the system)
-- =====================================================

CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    short_title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    modules INTEGER DEFAULT 0,
    category TEXT DEFAULT 'ge' CHECK (category IN ('major', 'ge', 'pe', 'nstp')),
    instructor TEXT,
    instructor_id UUID REFERENCES users(id),
    image TEXT,
    section TEXT DEFAULT 'BSIT101A',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_section ON courses(section);

-- Enable Row Level Security
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Create policy
DROP POLICY IF EXISTS "Allow all operations on courses" ON courses;
CREATE POLICY "Allow all operations on courses" ON courses
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Insert BSIT101A Courses (9 courses for 1st semester)
INSERT INTO courses (id, title, short_title, subtitle, modules, category, instructor, image) VALUES
    ('cp1', 'Computer Programming 1', 'CP1', 'CITE1003 · BSIT101A', 1, 'major', 'David Clarence Del Mundo', 'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=300&h=200&fit=crop&crop=center'),
    ('itc', 'Introduction to Computing', 'ITC', 'CITE1004 · BSIT101A', 1, 'major', 'Psalmmiracle Mariano', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&h=200&fit=crop&crop=center'),
    ('euth1', 'Euthenics 1', 'EUTH1', 'STIC1002 · BSIT101A', 1, 'ge', 'Claire Maurillo', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=300&h=200&fit=crop&crop=center'),
    ('purcom', 'Purposive Communication', 'PURCOM', 'GEDC1016 · BSIT101A', 1, 'ge', 'John Denielle San Martin', 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=300&h=200&fit=crop&crop=center'),
    ('tcw', 'The Contemporary World', 'TCW', 'GEDC1002 · BSIT101A', 1, 'ge', 'Anne Jenell Lumintigar', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&h=200&fit=crop&crop=center'),
    ('uts', 'Understanding the Self', 'UTS', 'GEDC1008 · BSIT101A', 1, 'ge', 'Jocel Lazalita', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop&crop=center'),
    ('ppc', 'Philippine Popular Culture', 'PPC', 'GEDC1041 · BSIT101A', 1, 'ge', 'Claire Maurillo', 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=300&h=200&fit=crop&crop=center'),
    ('pe1', 'P.E./PATHFIT 1', 'PE1', 'PHED1005 · BSIT101A', 1, 'pe', 'Mark Joseph Danoy', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=300&h=200&fit=crop&crop=center'),
    ('nstp1', 'NSTP 1', 'NSTP1', 'NSTP1008 · BSIT101A', 1, 'nstp', 'Dan Risty Montojo', 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=300&h=200&fit=crop&crop=center')
ON CONFLICT (id) DO UPDATE SET
    modules = EXCLUDED.modules,
    instructor = EXCLUDED.instructor;

-- =====================================================
-- Student Stats Table
-- =====================================================

-- Create the student_stats table
CREATE TABLE IF NOT EXISTS student_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id TEXT NOT NULL UNIQUE,
    study_time_data JSONB DEFAULT '{}',
    streak_data JSONB DEFAULT '{}',
    course_progress JSONB DEFAULT '{}',
    xp_data JSONB DEFAULT '{"totalXP": 0, "currentLevel": 1, "xpInCurrentLevel": 0, "lastLevelUp": null}',
    deadlines_data JSONB DEFAULT '[]',
    recent_activity JSONB DEFAULT '[]',
    grade_prediction JSONB DEFAULT '{"predictedGrade": 0, "letterGrade": "N/A", "confidence": 0, "breakdown": [], "lastUpdated": null}',
    read_faqs JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add deadlines_data column if it doesn't exist (for existing tables)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_stats' AND column_name = 'deadlines_data') THEN
        ALTER TABLE student_stats ADD COLUMN deadlines_data JSONB DEFAULT '[]';
    END IF;
END $$;

-- Add recent_activity column if it doesn't exist (for existing tables)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_stats' AND column_name = 'recent_activity') THEN
        ALTER TABLE student_stats ADD COLUMN recent_activity JSONB DEFAULT '[]';
    END IF;
END $$;

-- Add grade_prediction column if it doesn't exist (for Grade Predictor widget)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_stats' AND column_name = 'grade_prediction') THEN
        ALTER TABLE student_stats ADD COLUMN grade_prediction JSONB DEFAULT '{"predictedGrade": 0, "letterGrade": "N/A", "confidence": 0, "breakdown": [], "lastUpdated": null}';
    END IF;
END $$;

-- Create index for faster lookups by student_id
CREATE INDEX IF NOT EXISTS idx_student_stats_student_id ON student_stats(student_id);

-- Enable Row Level Security
ALTER TABLE student_stats ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (for demo purposes)
-- In production, you'd want to restrict this based on authentication
DROP POLICY IF EXISTS "Allow all operations" ON student_stats;
CREATE POLICY "Allow all operations" ON student_stats
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at on changes
DROP TRIGGER IF EXISTS update_student_stats_updated_at ON student_stats;
CREATE TRIGGER update_student_stats_updated_at
    BEFORE UPDATE ON student_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Course Tasks Table
-- =====================================================

-- Create the course_tasks table for storing assignments, quizzes, etc.
CREATE TABLE IF NOT EXISTS course_tasks (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('assignment', 'performance', 'quiz', 'practical', 'journal')),
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    instructions TEXT DEFAULT '',
    due_date TIMESTAMPTZ NOT NULL,
    points INTEGER DEFAULT 100,
    attachments JSONB DEFAULT '[]',
    status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'closed')),
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_course_tasks_course_id ON course_tasks(course_id);
CREATE INDEX IF NOT EXISTS idx_course_tasks_due_date ON course_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_course_tasks_status ON course_tasks(status);

-- Enable Row Level Security
ALTER TABLE course_tasks ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (for demo purposes)
DROP POLICY IF EXISTS "Allow all operations on tasks" ON course_tasks;
CREATE POLICY "Allow all operations on tasks" ON course_tasks
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create trigger to auto-update updated_at on changes
DROP TRIGGER IF EXISTS update_course_tasks_updated_at ON course_tasks;
CREATE TRIGGER update_course_tasks_updated_at
    BEFORE UPDATE ON course_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Student Submissions Table
-- =====================================================

-- Create the student_submissions table for tracking task submissions
CREATE TABLE IF NOT EXISTS student_submissions (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES course_tasks(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'graded', 'ai-checked')),
    score INTEGER,
    ai_score INTEGER,
    feedback TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    graded_at TIMESTAMPTZ,
    graded_by TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_submissions_task_id ON student_submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON student_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON student_submissions(status);

-- Enable Row Level Security
ALTER TABLE student_submissions ENABLE ROW LEVEL SECURITY;

-- Create policy
DROP POLICY IF EXISTS "Allow all operations on submissions" ON student_submissions;
CREATE POLICY "Allow all operations on submissions" ON student_submissions
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- Storage Bucket Setup
-- =====================================================
-- 
-- IMPORTANT: You must create the storage bucket FIRST via Supabase Dashboard:
-- 
-- 1. Go to your Supabase project
-- 2. Click on "Storage" in the left sidebar
-- 3. Click "New bucket"
-- 4. Create a bucket named: task-attachments
-- 5. Make it PUBLIC (toggle the "Public bucket" option)
-- 6. Click "Create bucket"
-- 7. THEN come back and run this SQL
--
-- =====================================================

-- Storage policies for task-attachments bucket
-- These will only work AFTER you create the bucket in the Dashboard

-- Drop existing policies if they exist (to avoid errors on re-run)
DROP POLICY IF EXISTS "Public read access for task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads to task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow deletes from task attachments" ON storage.objects;

-- Allow public read access to task attachments
CREATE POLICY "Public read access for task attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'task-attachments');

-- Allow uploads to task attachments
CREATE POLICY "Allow uploads to task attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'task-attachments');

-- Allow deletes from task attachments
CREATE POLICY "Allow deletes from task attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'task-attachments');

-- =====================================================
-- Quick Fix: Add missing columns to existing tables
-- Run this if you're getting errors about missing columns
-- =====================================================

ALTER TABLE student_stats ADD COLUMN IF NOT EXISTS grade_prediction JSONB DEFAULT '{}';
ALTER TABLE student_stats ADD COLUMN IF NOT EXISTS recent_activity JSONB DEFAULT '[]';
ALTER TABLE student_stats ADD COLUMN IF NOT EXISTS read_faqs JSONB DEFAULT '[]';
ALTER TABLE student_stats ADD COLUMN IF NOT EXISTS favorites JSONB DEFAULT '[]';

-- =====================================================
-- SUCCESS! Your database is ready.
-- 
-- SETUP ORDER:
-- 1. First, create the 'task-attachments' bucket in Storage
-- 2. Then run this entire SQL script
-- 3. Go to Settings > API and copy your URL and anon key
-- =====================================================


-- =====================================================
-- Learning Paths Tables
-- =====================================================

-- Create the learning_paths table
CREATE TABLE IF NOT EXISTS learning_paths (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT DEFAULT 'code',
    color TEXT DEFAULT '#3b82f6',
    estimated_hours INTEGER DEFAULT 0,
    difficulty TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    courses TEXT[] DEFAULT '{}',
    created_by TEXT NOT NULL,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_learning_paths_is_public ON learning_paths(is_public);
CREATE INDEX IF NOT EXISTS idx_learning_paths_difficulty ON learning_paths(difficulty);
CREATE INDEX IF NOT EXISTS idx_learning_paths_created_by ON learning_paths(created_by);

-- Enable Row Level Security
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (for demo purposes)
DROP POLICY IF EXISTS "Allow all operations on learning_paths" ON learning_paths;
CREATE POLICY "Allow all operations on learning_paths" ON learning_paths
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create trigger to auto-update updated_at on changes
DROP TRIGGER IF EXISTS update_learning_paths_updated_at ON learning_paths;
CREATE TRIGGER update_learning_paths_updated_at
    BEFORE UPDATE ON learning_paths
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Path Progress Table (tracks student enrollment and progress)
-- =====================================================

CREATE TABLE IF NOT EXISTS path_progress (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    path_id TEXT NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    completed_courses TEXT[] DEFAULT '{}',
    current_course_id TEXT,
    progress_percentage INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE(path_id, student_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_path_progress_student_id ON path_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_path_progress_path_id ON path_progress(path_id);

-- Enable Row Level Security
ALTER TABLE path_progress ENABLE ROW LEVEL SECURITY;

-- Create policy
DROP POLICY IF EXISTS "Allow all operations on path_progress" ON path_progress;
CREATE POLICY "Allow all operations on path_progress" ON path_progress
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- Insert Demo Learning Paths (Only Full 1st Semester)
-- =====================================================

INSERT INTO learning_paths (id, title, description, icon, color, estimated_hours, difficulty, courses, created_by, is_public)
VALUES 
    ('path-full-semester', 'Full 1st Semester', 'Complete all courses for your first semester as a BSIT student', 'graduation', '#3b82f6', 150, 'advanced', ARRAY['cp1', 'itc', 'euth1', 'purcom', 'tcw', 'uts', 'ppc', 'pe1', 'nstp1'], 'admin', true)
ON CONFLICT (id) DO UPDATE SET
    color = '#3b82f6',
    created_by = 'admin';

-- Delete old demo paths (keeping only Full 1st Semester)
DELETE FROM learning_paths WHERE id IN ('path-it-core', 'path-communication', 'path-personal-dev', 'path-complete-ge');

-- =====================================================
-- Students Table (BSIT101A Section - 36 Students)
-- =====================================================

CREATE TABLE IF NOT EXISTS students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE,
    section TEXT DEFAULT 'BSIT101A',
    program TEXT DEFAULT 'BSIT',
    year_level TEXT DEFAULT '1st Year',
    campus TEXT DEFAULT 'Meycauayan',
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_students_section ON students(section);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);

-- Enable Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Create policy
DROP POLICY IF EXISTS "Allow all operations on students" ON students;
CREATE POLICY "Allow all operations on students" ON students
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Insert BSIT101A Students (36 students)
-- =====================================================

INSERT INTO students (student_id, full_name, first_name, last_name, section, email) VALUES
    -- Row 1 (from image 2)
    ('BSIT101A-001', 'Acorda, Divine Maureen', 'Divine Maureen', 'Acorda', 'BSIT101A', 'acorda.divine@meycauayan.sti.edu.ph'),
    ('BSIT101A-002', 'Adel, Rogini', 'Rogini', 'Adel', 'BSIT101A', 'adel.rogini@meycauayan.sti.edu.ph'),
    ('BSIT101A-003', 'Agao, Justin Dominick', 'Justin Dominick', 'Agao', 'BSIT101A', 'agao.justin@meycauayan.sti.edu.ph'),
    ('BSIT101A-004', 'Antolin, Don Benn Federico', 'Don Benn Federico', 'Antolin', 'BSIT101A', 'antolin.donbenn@meycauayan.sti.edu.ph'),
    ('BSIT101A-005', 'Baldivas, Blake Cedrick', 'Blake Cedrick', 'Baldivas', 'BSIT101A', 'baldivas.blake@meycauayan.sti.edu.ph'),
    -- Row 2
    ('BSIT101A-006', 'Bendolo, Mark Lawrence', 'Mark Lawrence', 'Bendolo', 'BSIT101A', 'bendolo.mark@meycauayan.sti.edu.ph'),
    ('BSIT101A-007', 'Bergania, Jai Brielle', 'Jai Brielle', 'Bergania', 'BSIT101A', 'bergania.jai@meycauayan.sti.edu.ph'),
    ('BSIT101A-008', 'Buenaflor, Bradley', 'Bradley', 'Buenaflor', 'BSIT101A', 'buenaflor.bradley@meycauayan.sti.edu.ph'),
    ('BSIT101A-009', 'Camacho, Karl Benedict', 'Karl Benedict', 'Camacho', 'BSIT101A', 'camacho.karl@meycauayan.sti.edu.ph'),
    ('BSIT101A-010', 'Canta, Ismael June', 'Ismael June', 'Canta', 'BSIT101A', 'canta.ismael@meycauayan.sti.edu.ph'),
    -- Row 3
    ('BSIT101A-011', 'Cariso, Cristy Shane', 'Cristy Shane', 'Cariso', 'BSIT101A', 'cariso.cristy@meycauayan.sti.edu.ph'),
    ('BSIT101A-012', 'Carlos, Ayanamei', 'Ayanamei', 'Carlos', 'BSIT101A', 'carlos.ayanamei@meycauayan.sti.edu.ph'),
    ('BSIT101A-013', 'Colambo, John Aldred', 'John Aldred', 'Colambo', 'BSIT101A', 'colambo.john@meycauayan.sti.edu.ph'),
    ('BSIT101A-014', 'Dagohoy, Sophia Lorraine', 'Sophia Lorraine', 'Dagohoy', 'BSIT101A', 'dagohoy.sophia@meycauayan.sti.edu.ph'),
    ('BSIT101A-015', 'De Asis, Josiah', 'Josiah', 'De Asis', 'BSIT101A', 'deasis.462124@meycauayan.sti.edu.ph'),
    -- Row 4
    ('BSIT101A-016', 'Del Mundo, David Clarence', 'David Clarence', 'Del Mundo', 'BSIT101A', 'delmundo.david@meycauayan.sti.edu.ph'),
    ('BSIT101A-017', 'Dela Cruz, Kevin', 'Kevin', 'Dela Cruz', 'BSIT101A', 'delacruz.kevin@meycauayan.sti.edu.ph'),
    ('BSIT101A-018', 'Evangelista, Lance Michael', 'Lance Michael', 'Evangelista', 'BSIT101A', 'evangelista.lance@meycauayan.sti.edu.ph'),
    ('BSIT101A-019', 'Fajardo, Althea', 'Althea', 'Fajardo', 'BSIT101A', 'fajardo.althea@meycauayan.sti.edu.ph'),
    ('BSIT101A-020', 'Halili, Andrei Jiroh', 'Andrei Jiroh', 'Halili', 'BSIT101A', 'halili.andrei@meycauayan.sti.edu.ph'),
    -- Row 5
    ('BSIT101A-021', 'Japsay, Jetro Josef', 'Jetro Josef', 'Japsay', 'BSIT101A', 'japsay.jetro@meycauayan.sti.edu.ph'),
    ('BSIT101A-022', 'Juban, Jasper', 'Jasper', 'Juban', 'BSIT101A', 'juban.jasper@meycauayan.sti.edu.ph'),
    ('BSIT101A-023', 'Lim, Renato', 'Renato', 'Lim', 'BSIT101A', 'lim.renato@meycauayan.sti.edu.ph'),
    ('BSIT101A-024', 'Macatulad, Renzo', 'Renzo', 'Macatulad', 'BSIT101A', 'macatulad.renzo@meycauayan.sti.edu.ph'),
    ('BSIT101A-025', 'Marfil, Christopher Jann', 'Christopher Jann', 'Marfil', 'BSIT101A', 'marfil.christopher@meycauayan.sti.edu.ph'),
    -- Row 1 (from image 1)
    ('BSIT101A-026', 'Orianda, Denmart Airon', 'Denmart Airon', 'Orianda', 'BSIT101A', 'orianda.denmart@meycauayan.sti.edu.ph'),
    ('BSIT101A-027', 'Pagdanganan, Jan Mark', 'Jan Mark', 'Pagdanganan', 'BSIT101A', 'pagdanganan.jan@meycauayan.sti.edu.ph'),
    ('BSIT101A-028', 'Paguirigan, Mary Chris Angelene', 'Mary Chris Angelene', 'Paguirigan', 'BSIT101A', 'paguirigan.mary@meycauayan.sti.edu.ph'),
    ('BSIT101A-029', 'Paras, Romeo', 'Romeo', 'Paras', 'BSIT101A', 'paras.romeo@meycauayan.sti.edu.ph'),
    ('BSIT101A-030', 'Ravela, Fontleroy', 'Fontleroy', 'Ravela', 'BSIT101A', 'ravela.fontleroy@meycauayan.sti.edu.ph'),
    -- Row 2
    ('BSIT101A-031', 'Rodriguez, Carl Aaron', 'Carl Aaron', 'Rodriguez', 'BSIT101A', 'rodriguez.carl@meycauayan.sti.edu.ph'),
    ('BSIT101A-032', 'Rodriguez, Joel', 'Joel', 'Rodriguez', 'BSIT101A', 'rodriguez.joel@meycauayan.sti.edu.ph'),
    ('BSIT101A-033', 'San Vicente, Luigie', 'Luigie', 'San Vicente', 'BSIT101A', 'sanvicente.luigie@meycauayan.sti.edu.ph'),
    ('BSIT101A-034', 'Santos, King Cyrhon', 'King Cyrhon', 'Santos', 'BSIT101A', 'santos.king@meycauayan.sti.edu.ph'),
    ('BSIT101A-035', 'Sausa, Rashae Gavin', 'Rashae Gavin', 'Sausa', 'BSIT101A', 'sausa.rashae@meycauayan.sti.edu.ph'),
    -- Row 3
    ('BSIT101A-036', 'Segismundo, Jerome', 'Jerome', 'Segismundo', 'BSIT101A', 'segismundo.jerome@meycauayan.sti.edu.ph'),
    ('BSIT101A-037', 'Solanoy, Clariza', 'Clariza', 'Solanoy', 'BSIT101A', 'solanoy.clariza@meycauayan.sti.edu.ph'),
    ('BSIT101A-038', 'Sta. Ana, Benz Joshua', 'Benz Joshua', 'Sta. Ana', 'BSIT101A', 'staana.benz@meycauayan.sti.edu.ph'),
    ('BSIT101A-039', 'Surigao, Arian Marie', 'Arian Marie', 'Surigao', 'BSIT101A', 'surigao.arian@meycauayan.sti.edu.ph'),
    ('BSIT101A-040', 'Tejada, James Ian Alexander', 'James Ian Alexander', 'Tejada', 'BSIT101A', 'tejada.james@meycauayan.sti.edu.ph'),
    -- Row 4
    ('BSIT101A-041', 'Tobias, Ma. Jessiephine', 'Ma. Jessiephine', 'Tobias', 'BSIT101A', 'tobias.jessiephine@meycauayan.sti.edu.ph')
ON CONFLICT (student_id) DO UPDATE SET email = EXCLUDED.email;

-- =====================================================
-- Add enrolled_count to learning_paths
-- =====================================================

ALTER TABLE learning_paths ADD COLUMN IF NOT EXISTS enrolled_count INTEGER DEFAULT 0;

-- Update enrolled count for Full 1st Semester (all 41 students)
UPDATE learning_paths SET enrolled_count = 41 WHERE id = 'path-full-semester';

-- =====================================================
-- Auto-enroll all BSIT101A students in Full 1st Semester
-- (They paid for these courses, so they're automatically enrolled)
-- =====================================================

-- Insert path progress for all BSIT101A students
INSERT INTO path_progress (id, path_id, student_id, completed_courses, current_course_id, progress_percentage, started_at, last_activity_at, completed_at)
SELECT 
    'progress-' || student_id,
    'path-full-semester',
    student_id,
    '{}',  -- No courses completed yet
    'cp1', -- Starting with Computer Programming 1
    0,     -- 0% progress
    NOW(),
    NOW(),
    NULL   -- Not completed
FROM students
WHERE section = 'BSIT101A' AND is_active = true
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SUCCESS! Students and Learning Paths tables are ready.
-- Total: 41 students in BSIT101A section
-- All BSIT101A students are auto-enrolled in Full 1st Semester
-- =====================================================


-- =====================================================
-- Student Goals Table
-- =====================================================

CREATE TABLE IF NOT EXISTS student_goals (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('study_time', 'course_completion', 'streak', 'grade', 'custom')),
    target_value INTEGER NOT NULL DEFAULT 1,
    current_value INTEGER NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'units',
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'expired')),
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add metadata column if it doesn't exist (for existing tables)
ALTER TABLE student_goals ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_student_goals_student_id ON student_goals(student_id);
CREATE INDEX IF NOT EXISTS idx_student_goals_status ON student_goals(status);
CREATE INDEX IF NOT EXISTS idx_student_goals_type ON student_goals(type);

-- Enable Row Level Security
ALTER TABLE student_goals ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (for demo purposes)
DROP POLICY IF EXISTS "Allow all operations on student_goals" ON student_goals;
CREATE POLICY "Allow all operations on student_goals" ON student_goals
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create trigger to auto-update updated_at on changes
DROP TRIGGER IF EXISTS update_student_goals_updated_at ON student_goals;
CREATE TRIGGER update_student_goals_updated_at
    BEFORE UPDATE ON student_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SUCCESS! Student Goals table is ready.
-- =====================================================


-- =====================================================
-- Goal Progress History Table (for tracking progress over time)
-- =====================================================

CREATE TABLE IF NOT EXISTS goal_progress_history (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    goal_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    progress_value NUMERIC NOT NULL DEFAULT 0,
    progress_percentage INTEGER NOT NULL DEFAULT 0,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_goal_progress_history_goal_id ON goal_progress_history(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_progress_history_student_id ON goal_progress_history(student_id);
CREATE INDEX IF NOT EXISTS idx_goal_progress_history_recorded_at ON goal_progress_history(recorded_at);

-- Enable Row Level Security
ALTER TABLE goal_progress_history ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (for demo purposes)
DROP POLICY IF EXISTS "Allow all operations on goal_progress_history" ON goal_progress_history;
CREATE POLICY "Allow all operations on goal_progress_history" ON goal_progress_history
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- SUCCESS! Goal Progress History table is ready.
-- =====================================================

-- =====================================================
-- Study Groups Tables
-- =====================================================

-- Create the study_groups table
CREATE TABLE IF NOT EXISTS study_groups (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT DEFAULT 'users',
    color TEXT DEFAULT '#3b82f6',
    category TEXT DEFAULT 'study' CHECK (category IN ('study', 'project', 'review', 'discussion')),
    course_id TEXT,
    course_name TEXT,
    avatar TEXT, -- Custom group avatar image (base64 or URL)
    is_pinned BOOLEAN DEFAULT false, -- Whether the group is pinned/favorited
    last_activity TIMESTAMPTZ DEFAULT NOW(), -- Last activity timestamp
    unread_count INTEGER DEFAULT 0, -- Unread messages count (per user basis would need separate table)
    max_members INTEGER DEFAULT 10,
    is_private BOOLEAN DEFAULT false,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add new columns if they don't exist (for existing tables)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'study_groups' AND column_name = 'avatar') THEN
        ALTER TABLE study_groups ADD COLUMN avatar TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'study_groups' AND column_name = 'is_pinned') THEN
        ALTER TABLE study_groups ADD COLUMN is_pinned BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_study_groups_category ON study_groups(category);
CREATE INDEX IF NOT EXISTS idx_study_groups_course_id ON study_groups(course_id);
CREATE INDEX IF NOT EXISTS idx_study_groups_created_by ON study_groups(created_by);
CREATE INDEX IF NOT EXISTS idx_study_groups_is_private ON study_groups(is_private);

-- Enable Row Level Security
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (for demo purposes)
DROP POLICY IF EXISTS "Allow all operations on study_groups" ON study_groups;
CREATE POLICY "Allow all operations on study_groups" ON study_groups
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create trigger to auto-update updated_at on changes
DROP TRIGGER IF EXISTS update_study_groups_updated_at ON study_groups;
CREATE TRIGGER update_study_groups_updated_at
    BEFORE UPDATE ON study_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Group Members Table
-- =====================================================

CREATE TABLE IF NOT EXISTS group_members (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    group_id TEXT NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_avatar TEXT,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    is_online BOOLEAN DEFAULT false,
    last_active TIMESTAMPTZ,
    UNIQUE(group_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_role ON group_members(role);

-- Enable Row Level Security
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Create policy
DROP POLICY IF EXISTS "Allow all operations on group_members" ON group_members;
CREATE POLICY "Allow all operations on group_members" ON group_members
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- GROUP INVITES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS group_invites (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    group_id TEXT NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    invite_code TEXT NOT NULL UNIQUE,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    max_uses INTEGER,
    use_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_group_invites_group_id ON group_invites(group_id);
CREATE INDEX IF NOT EXISTS idx_group_invites_code ON group_invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_group_invites_active ON group_invites(is_active);

-- Enable Row Level Security
ALTER TABLE group_invites ENABLE ROW LEVEL SECURITY;

-- Create policy
DROP POLICY IF EXISTS "Allow all operations on group_invites" ON group_invites;
CREATE POLICY "Allow all operations on group_invites" ON group_invites
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- Group Messages Table (for group chat)
-- =====================================================

CREATE TABLE IF NOT EXISTS group_messages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    group_id TEXT NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_avatar TEXT,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    reply_to TEXT REFERENCES group_messages(id) ON DELETE SET NULL,
    reactions JSONB DEFAULT '{}',
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_group_messages_group_id ON group_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_user_id ON group_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_created_at ON group_messages(created_at);

-- Enable Row Level Security
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

-- Create policy
DROP POLICY IF EXISTS "Allow all operations on group_messages" ON group_messages;
CREATE POLICY "Allow all operations on group_messages" ON group_messages
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Enable realtime for group_messages (safe to re-run)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'group_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE group_messages;
    END IF;
END $$;

-- =====================================================
-- Insert Demo Study Groups
-- =====================================================
-- Study Groups tables are ready (no demo data).
-- Groups will be created by users through the app.
-- =====================================================


-- =====================================================
-- Group Reports Table (for reporting groups to teachers/admin)
-- =====================================================

CREATE TABLE IF NOT EXISTS group_reports (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    group_id TEXT NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    group_name TEXT NOT NULL,
    reporter_id TEXT NOT NULL,
    reporter_name TEXT NOT NULL,
    reporter_email TEXT,
    reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'cheating', 'other')),
    details TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_group_reports_group_id ON group_reports(group_id);
CREATE INDEX IF NOT EXISTS idx_group_reports_reporter_id ON group_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_group_reports_status ON group_reports(status);
CREATE INDEX IF NOT EXISTS idx_group_reports_created_at ON group_reports(created_at);

-- Enable Row Level Security
ALTER TABLE group_reports ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (for demo purposes)
-- In production, restrict to: reporters can create, teachers/admin can read/update
DROP POLICY IF EXISTS "Allow all operations on group_reports" ON group_reports;
CREATE POLICY "Allow all operations on group_reports" ON group_reports
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create trigger to auto-update updated_at on changes
DROP TRIGGER IF EXISTS update_group_reports_updated_at ON group_reports;
CREATE TRIGGER update_group_reports_updated_at
    BEFORE UPDATE ON group_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SUCCESS! Group Reports table is ready.
-- Teachers and admins can view reports in their dashboard.
-- =====================================================


-- =====================================================
-- Demo Study Group for Testing (BSIT101A)
-- =====================================================
-- This creates a test group that all BSIT101A students can use
-- for testing the GroupChat and FocusMode real-time features
-- =====================================================

-- Create the BSIT101A Study Group
INSERT INTO study_groups (id, name, description, icon, color, category, course_id, course_name, max_members, is_private, created_by)
VALUES (
    'bsit101a-study-group',
    'BSIT101A Study Group',
    'Official study group for BSIT101A students. Share resources, discuss topics, and collaborate on projects!',
    'book',
    '#3b82f6',
    'study',
    'cp1',
    'Computer Programming 1',
    50,
    false,
    '02000543210'
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- Add Josiah De Asis as the owner
INSERT INTO group_members (group_id, user_id, user_name, user_email, role, is_online)
VALUES (
    'bsit101a-study-group',
    '02000543210',
    'Josiah De Asis',
    'deasis.462124@meycauayan.sti.edu.ph',
    'owner',
    true
) ON CONFLICT (group_id, user_id) DO UPDATE SET
    role = 'owner',
    is_online = true;

-- Add a few more students as members for testing
INSERT INTO group_members (group_id, user_id, user_name, user_email, role, is_online)
VALUES 
    ('bsit101a-study-group', '02000543211', 'Divine Maureen Acorda', 'acorda.divine@meycauayan.sti.edu.ph', 'member', false),
    ('bsit101a-study-group', '02000543212', 'Rogini Adel', 'adel.rogini@meycauayan.sti.edu.ph', 'member', false),
    ('bsit101a-study-group', '02000543213', 'Justin Dominick Agao', 'agao.justin@meycauayan.sti.edu.ph', 'member', true),
    ('bsit101a-study-group', '02000543214', 'Don Benn Federico Antolin', 'antolin.donbenn@meycauayan.sti.edu.ph', 'admin', false),
    ('bsit101a-study-group', '02000543215', 'Blake Cedrick Baldivas', 'baldivas.blake@meycauayan.sti.edu.ph', 'member', true)
ON CONFLICT (group_id, user_id) DO NOTHING;

-- Create an invite code for the group
INSERT INTO group_invites (group_id, invite_code, created_by, max_uses, is_active)
VALUES (
    'bsit101a-study-group',
    'BSIT101A-2025',
    '02000543210',
    50,
    true
) ON CONFLICT (invite_code) DO NOTHING;

-- Insert some sample messages for testing real-time sync
INSERT INTO group_messages (id, group_id, user_id, user_name, content, message_type, created_at)
VALUES 
    ('msg-demo-1', 'bsit101a-study-group', '02000543210', 'Josiah De Asis', 'Welcome to our study group! 🎉 Feel free to share resources and ask questions.', 'text', NOW() - INTERVAL '2 hours'),
    ('msg-demo-2', 'bsit101a-study-group', '02000543213', 'Justin Dominick Agao', 'Thanks for creating this group! Here''s a helpful link: https://react.dev/learn', 'text', NOW() - INTERVAL '1 hour'),
    ('msg-demo-3', 'bsit101a-study-group', '02000543214', 'Don Benn Federico Antolin', '```javascript
// Array methods example
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log(doubled); // [2, 4, 6, 8, 10]
```', 'text', NOW() - INTERVAL '30 minutes'),
    ('msg-demo-4', 'bsit101a-study-group', '02000543211', 'Divine Maureen Acorda', 'Check out this documentation: https://developer.mozilla.org/en-US/docs/Web/JavaScript', 'text', NOW() - INTERVAL '15 minutes'),
    ('msg-demo-5', 'bsit101a-study-group', '02000543215', 'Blake Cedrick Baldivas', '**Flashcard** 📚

**Q:** What is the difference between let and const in JavaScript?

**A:** `let` allows reassignment while `const` creates a read-only reference. Both are block-scoped.', 'text', NOW() - INTERVAL '5 minutes')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SUCCESS! Demo Study Group is ready.
-- 
-- Group ID: bsit101a-study-group
-- Invite Code: BSIT101A-2025
-- 
-- Access the group chat at: /chat/bsit101a-study-group
-- Access focus mode at: /focus/bsit101a-study-group
-- 
-- Real-time features:
-- - Messages sync instantly between GroupChat and FocusMode
-- - New links, code, and resources appear in Study Resources
-- =====================================================
