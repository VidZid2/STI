/**
 * Users Service - Manages user accounts with Supabase integration
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getProfile, getImages, getSettings } from './profileService';

// User types
export interface UserAccount {
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
    is_active: boolean;
    is_online?: boolean;
    last_login?: string;
    last_active?: string;
    created_at: string;
}

// Sort options
export type UserSortOption = 'name' | 'role' | 'recent';

export interface UserStats {
    totalUsers: number;
    activeUsers: number;
    onlineUsers: number;
    students: number;
    teachers: number;
    admins: number;
}

export type UserRole = 'student' | 'teacher' | 'admin' | 'dean';
export type UserFilter = 'all' | UserRole;

// Demo users for fallback - includes all teachers from courses
const DEMO_USERS: UserAccount[] = [
    // Student
    {
        id: 'demo-user-1',
        student_id: '02000543210',
        email: 'deasis.462124@meycauayan.sti.edu.ph',
        full_name: 'Josiah P. De Asis',
        first_name: 'Josiah',
        last_name: 'De Asis',
        role: 'student',
        campus: 'Meycauayan',
        program: 'BSIT',
        year_level: '1st Year',
        section: 'BSIT101A',
        is_active: true,
        is_online: true,
        last_active: new Date().toISOString(),
        created_at: new Date().toISOString(),
    },
    // Teachers (from courses) - All offline
    {
        id: 'demo-teacher-1',
        student_id: 'TEACHER001',
        email: 'delmundo@meycauayan.sti.edu.ph',
        full_name: 'David Clarence Del Mundo',
        first_name: 'David Clarence',
        last_name: 'Del Mundo',
        role: 'teacher',
        campus: 'Meycauayan',
        is_active: true,
        is_online: false,
        last_active: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
        created_at: new Date().toISOString(),
    },
    {
        id: 'demo-teacher-2',
        student_id: 'TEACHER002',
        email: 'mariano@meycauayan.sti.edu.ph',
        full_name: 'Psalmmiracle Mariano',
        first_name: 'Psalmmiracle',
        last_name: 'Mariano',
        role: 'teacher',
        campus: 'Meycauayan',
        is_active: true,
        is_online: false,
        last_active: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        created_at: new Date().toISOString(),
    },
    {
        id: 'demo-teacher-3',
        student_id: 'TEACHER003',
        email: 'maurillo@meycauayan.sti.edu.ph',
        full_name: 'Claire Maurillo',
        first_name: 'Claire',
        last_name: 'Maurillo',
        role: 'teacher',
        campus: 'Meycauayan',
        is_active: true,
        is_online: false,
        last_active: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
        created_at: new Date().toISOString(),
    },
    {
        id: 'demo-teacher-4',
        student_id: 'TEACHER004',
        email: 'sanmartin@meycauayan.sti.edu.ph',
        full_name: 'John Denielle San Martin',
        first_name: 'John Denielle',
        last_name: 'San Martin',
        role: 'teacher',
        campus: 'Meycauayan',
        is_active: true,
        is_online: false,
        last_active: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
        created_at: new Date().toISOString(),
    },
    {
        id: 'demo-teacher-5',
        student_id: 'TEACHER005',
        email: 'danoy@meycauayan.sti.edu.ph',
        full_name: 'Mark Joseph Danoy',
        first_name: 'Mark Joseph',
        last_name: 'Danoy',
        role: 'teacher',
        campus: 'Meycauayan',
        is_active: true,
        is_online: false,
        last_active: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
        created_at: new Date().toISOString(),
    },
    {
        id: 'demo-teacher-6',
        student_id: 'TEACHER006',
        email: 'montojo@meycauayan.sti.edu.ph',
        full_name: 'Dan Risty Montojo',
        first_name: 'Dan Risty',
        last_name: 'Montojo',
        role: 'teacher',
        campus: 'Meycauayan',
        is_active: true,
        is_online: false,
        last_active: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        created_at: new Date().toISOString(),
    },
    {
        id: 'demo-teacher-7',
        student_id: 'TEACHER007',
        email: 'lumintigar@meycauayan.sti.edu.ph',
        full_name: 'Anne Jenell Lumintigar',
        first_name: 'Anne Jenell',
        last_name: 'Lumintigar',
        role: 'teacher',
        campus: 'Meycauayan',
        is_active: true,
        is_online: false,
        last_active: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        created_at: new Date().toISOString(),
    },
    {
        id: 'demo-teacher-8',
        student_id: 'TEACHER008',
        email: 'lazalita@meycauayan.sti.edu.ph',
        full_name: 'Jocel Lazalita',
        first_name: 'Jocel',
        last_name: 'Lazalita',
        role: 'teacher',
        campus: 'Meycauayan',
        is_active: true,
        is_online: false,
        last_active: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        created_at: new Date().toISOString(),
    },
    // Real classmates from BSIT101A section (41 students total)
    { id: 'student-2', student_id: '02000543211', email: 'acorda.divine@meycauayan.sti.edu.ph', full_name: 'Divine Maureen Acorda', first_name: 'Divine Maureen', last_name: 'Acorda', role: 'student', campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 15 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-3', student_id: '02000543212', email: 'adel.rogini@meycauayan.sti.edu.ph', full_name: 'Rogini Adel', first_name: 'Rogini', last_name: 'Adel', role: 'student', campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-4', student_id: '02000543213', email: 'agao.justin@meycauayan.sti.edu.ph', full_name: 'Justin Dominick Agao', first_name: 'Justin Dominick', last_name: 'Agao', role: 'student', campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 45 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-5', student_id: '02000543214', email: 'antolin.donbenn@meycauayan.sti.edu.ph', full_name: 'Don Benn Federico Antolin', first_name: 'Don Benn Federico', last_name: 'Antolin', role: 'student', campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 30 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-6', student_id: '02000543215', email: 'baldivas.blake@meycauayan.sti.edu.ph', full_name: 'Blake Cedrick Baldivas', first_name: 'Blake Cedrick', last_name: 'Baldivas', role: 'student', campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-7', student_id: '02000543216', email: 'bendolo.mark@meycauayan.sti.edu.ph', full_name: 'Mark Lawrence Bendolo', first_name: 'Mark Lawrence', last_name: 'Bendolo', role: 'student', campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-8', student_id: '02000543217', email: 'bergania.jai@meycauayan.sti.edu.ph', full_name: 'Jai Brielle Bergania', first_name: 'Jai Brielle', last_name: 'Bergania', role: 'student', campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 45 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-9', student_id: '02000543218', email: 'buenaflor.bradley@meycauayan.sti.edu.ph', full_name: 'Bradley Buenaflor', first_name: 'Bradley', last_name: 'Buenaflor', role: 'student', campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-10', student_id: '02000543219', email: 'camacho.karl@meycauayan.sti.edu.ph', full_name: 'Karl Benedict Camacho', first_name: 'Karl Benedict', last_name: 'Camacho', role: 'student', campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-11', student_id: '02000543220', email: 'canta.ismael@meycauayan.sti.edu.ph', full_name: 'Ismael June Canta', first_name: 'Ismael June', last_name: 'Canta', role: 'student', campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 20 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-12', student_id: '02000543221', email: 'cariso.cristy@meycauayan.sti.edu.ph', full_name: 'Cristy Shane Cariso', first_name: 'Cristy Shane', last_name: 'Cariso', role: 'student', campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 20 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-13', student_id: '02000543222', email: 'carlos.ayanamei@meycauayan.sti.edu.ph', full_name: 'Ayanamei Carlos', first_name: 'Ayanamei', last_name: 'Carlos', role: 'student', campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-14', student_id: '02000543223', email: 'colambo.john@meycauayan.sti.edu.ph', full_name: 'John Aldred Colambo', first_name: 'John Aldred', last_name: 'Colambo', role: 'student', campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-15', student_id: '02000543224', email: 'dagohoy.sophia@meycauayan.sti.edu.ph', full_name: 'Sophia Lorraine Dagohoy', first_name: 'Sophia Lorraine', last_name: 'Dagohoy', role: 'student', campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-16', student_id: '02000543225', email: 'delacruz.kevin@meycauayan.sti.edu.ph', full_name: 'Kevin Dela Cruz', first_name: 'Kevin', last_name: 'Dela Cruz', role: 'student', campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 10 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-17', student_id: '02000543226', email: 'evangelista.lance@meycauayan.sti.edu.ph', full_name: 'Lance Michael Evangelista', first_name: 'Lance Michael', last_name: 'Evangelista', role: 'student', campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-18', student_id: '02000543227', email: 'fajardo.althea@meycauayan.sti.edu.ph', full_name: 'Althea Fajardo', first_name: 'Althea', last_name: 'Fajardo', role: 'student', campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-19', student_id: '02000543228', email: 'halili.andrei@meycauayan.sti.edu.ph', full_name: 'Andrei Jiroh Halili', first_name: 'Andrei Jiroh', last_name: 'Halili', role: 'student', campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 25 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-20', student_id: '02000543229', email: 'japsay.jetro@meycauayan.sti.edu.ph', full_name: 'Jetro Josef Japsay', first_name: 'Jetro Josef', last_name: 'Japsay', role: 'student', campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-21', student_id: '02000543230', email: 'juban.jasper@meycauayan.sti.edu.ph', full_name: 'Jasper Juban', first_name: 'Jasper', last_name: 'Juban', role: 'student', campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-22', student_id: '02000543231', email: 'lim.renato@meycauayan.sti.edu.ph', full_name: 'Renato Lim', first_name: 'Renato', last_name: 'Lim', role: 'student', campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 35 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-23', student_id: '02000543232', email: 'macotulad.renzo@meycauayan.sti.edu.ph', full_name: 'Renzo Macotulad', first_name: 'Renzo', last_name: 'Macotulad', role: 'student', campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-24', student_id: '02000543233', email: 'marfil.christopher@meycauayan.sti.edu.ph', full_name: 'Christopher Jann Marfil', first_name: 'Christopher Jann', last_name: 'Marfil', role: 'student', campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-25', student_id: '02000543234', email: 'orlanda.denmart@meycauayan.sti.edu.ph', full_name: 'Denmart Airon Orlanda', first_name: 'Denmart Airon', last_name: 'Orlanda', role: 'student', campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 50 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-26', student_id: '02000543235', email: 'pagdanganan.jan@meycauayan.sti.edu.ph', full_name: 'Jan Mark Pagdanganan', first_name: 'Jan Mark', last_name: 'Pagdanganan', role: 'student', campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-27', student_id: '02000543236', email: 'paguirigan.mary@meycauayan.sti.edu.ph', full_name: 'Mary Chris Ann Paguirigan', first_name: 'Mary Chris Ann', last_name: 'Paguirigan', role: 'student', campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-28', student_id: '02000543237', email: 'paras.romeo@meycauayan.sti.edu.ph', full_name: 'Romeo Paras', first_name: 'Romeo', last_name: 'Paras', role: 'student', campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 40 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-29', student_id: '02000543238', email: 'ravela.fontleroy@meycauayan.sti.edu.ph', full_name: 'Fontleroy Ravela', first_name: 'Fontleroy', last_name: 'Ravela', role: 'student', campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-30', student_id: '02000543239', email: 'rodriguez.carl@meycauayan.sti.edu.ph', full_name: 'Carl Aaron Rodriguez', first_name: 'Carl Aaron', last_name: 'Rodriguez', role: 'student', campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-31', student_id: '02000543240', email: 'rodriguez.joel@meycauayan.sti.edu.ph', full_name: 'Joel Rodriguez', first_name: 'Joel', last_name: 'Rodriguez', role: 'student', campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 55 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-32', student_id: '02000543241', email: 'sanvicente.luigie@meycauayan.sti.edu.ph', full_name: 'Luigie San Vicente', first_name: 'Luigie', last_name: 'San Vicente', role: 'student', campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-33', student_id: '02000543242', email: 'santos.king@meycauayan.sti.edu.ph', full_name: 'King Cyrhon Santos', first_name: 'King Cyrhon', last_name: 'Santos', role: 'student', campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-34', student_id: '02000543243', email: 'sausa.rashae@meycauayan.sti.edu.ph', full_name: 'Rashae Gavin Sausa', first_name: 'Rashae Gavin', last_name: 'Sausa', role: 'student', campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 12 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-35', student_id: '02000543244', email: 'segismundo.jerome@meycauayan.sti.edu.ph', full_name: 'Jerome Segismundo', first_name: 'Jerome', last_name: 'Segismundo', role: 'student', campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-36', student_id: '02000543245', email: 'solanoy.clariza@meycauayan.sti.edu.ph', full_name: 'Clariza Solanoy', first_name: 'Clariza', last_name: 'Solanoy', role: 'student', campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-37', student_id: '02000543246', email: 'staana.benz@meycauayan.sti.edu.ph', full_name: 'Benz Joshua Sta. Ana', first_name: 'Benz Joshua', last_name: 'Sta. Ana', role: 'student', campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 18 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-38', student_id: '02000543247', email: 'surigao.arian@meycauayan.sti.edu.ph', full_name: 'Arian Marie Surigao', first_name: 'Arian Marie', last_name: 'Surigao', role: 'student', campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-39', student_id: '02000543248', email: 'tejada.james@meycauayan.sti.edu.ph', full_name: 'James Ian Alexander Tejada', first_name: 'James Ian Alexander', last_name: 'Tejada', role: 'student', campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 13 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-40', student_id: '02000543249', email: 'tobias.jessiephine@meycauayan.sti.edu.ph', full_name: 'Ma. Jessiephine Tobias', first_name: 'Ma. Jessiephine', last_name: 'Tobias', role: 'student', campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 22 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
];

/**
 * Sort users by specified option
 */
export const sortUsers = (users: UserAccount[], sortBy: UserSortOption): UserAccount[] => {
    const sorted = [...users];
    switch (sortBy) {
        case 'name':
            return sorted.sort((a, b) => a.full_name.localeCompare(b.full_name));
        case 'role':
            const roleOrder = { dean: 0, admin: 1, teacher: 2, student: 3 };
            return sorted.sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);
        case 'recent':
            return sorted.sort((a, b) => {
                const dateA = a.last_active ? new Date(a.last_active).getTime() : 0;
                const dateB = b.last_active ? new Date(b.last_active).getTime() : 0;
                return dateB - dateA; // Most recent first
            });
        default:
            return sorted;
    }
};

/**
 * Enhance users list with current logged-in user's profile data
 * This ensures the current user shows their actual profile picture and online status
 */
const enhanceWithCurrentUserProfile = (users: UserAccount[]): UserAccount[] => {
    const profile = getProfile();
    const images = getImages();
    const settings = getSettings();
    
    // Find the current user by email or student ID
    const currentUserStudentId = profile.studentId || '02000543210';
    
    return users.map(user => {
        // Check if this is the current logged-in user
        const isCurrentUser = 
            user.email.toLowerCase().includes('deasis') || 
            user.student_id === currentUserStudentId ||
            user.student_id === '02000543210' ||
            user.id === 'demo-user-1';
        
        if (isCurrentUser) {
            return {
                ...user,
                full_name: `${profile.firstName} ${profile.middleName ? profile.middleName + '. ' : ''}${profile.lastName}`.trim() || user.full_name,
                first_name: profile.firstName || user.first_name,
                last_name: profile.lastName || user.last_name,
                profile_image: images.profileImage || user.profile_image,
                is_online: settings.showOnlineStatus, // Respect user's online status setting
                last_active: new Date().toISOString(),
            };
        }
        return user;
    });
};

/**
 * Fetch all users from Supabase or return demo data
 * Merges demo teachers if database doesn't have all teachers
 */
export const fetchUsers = async (filter: UserFilter = 'all'): Promise<UserAccount[]> => {
    if (!isSupabaseConfigured() || !supabase) {
        const users = filter === 'all' 
            ? DEMO_USERS 
            : DEMO_USERS.filter(u => u.role === filter);
        return enhanceWithCurrentUserProfile(users);
    }

    try {
        let query = supabase
            .from('users')
            .select('*')
            .order('full_name', { ascending: true });

        if (filter !== 'all') {
            query = query.eq('role', filter);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[Users] Fetch error:', error);
            return filter === 'all' 
                ? DEMO_USERS 
                : DEMO_USERS.filter(u => u.role === filter);
        }

        // If database has users, merge with DEMO_USERS that might be missing
        if (data && data.length > 0) {
            // Filter out example/demo emails from database results
            const exampleEmails = ['teacher@meycauayan.sti.edu.ph', 'student@meycauayan.sti.edu.ph', 'admin@meycauayan.sti.edu.ph'];
            const filteredData = data.filter((u: UserAccount) => !exampleEmails.includes(u.email.toLowerCase()));
            
            const dbStudentIds = new Set(filteredData.map((u: UserAccount) => u.student_id.toLowerCase()));
            
            // Add all DEMO_USERS that aren't in the database (both students and teachers)
            const missingUsers = DEMO_USERS.filter(u => !dbStudentIds.has(u.student_id.toLowerCase()));
            
            const mergedUsers = [...filteredData, ...missingUsers];
            
            // Apply filter if needed
            if (filter !== 'all') {
                return enhanceWithCurrentUserProfile(mergedUsers.filter(u => u.role === filter));
            }
            
            return enhanceWithCurrentUserProfile(mergedUsers.sort((a, b) => a.full_name.localeCompare(b.full_name)));
        }

        const fallbackUsers = filter === 'all' 
            ? DEMO_USERS 
            : DEMO_USERS.filter(u => u.role === filter);
        return enhanceWithCurrentUserProfile(fallbackUsers);
    } catch (err) {
        console.error('[Users] Fetch error:', err);
        const fallbackUsers = filter === 'all' 
            ? DEMO_USERS 
            : DEMO_USERS.filter(u => u.role === filter);
        return enhanceWithCurrentUserProfile(fallbackUsers);
    }
};

/**
 * Get user statistics - uses fetchUsers to get accurate merged stats
 */
export const getUserStats = async (): Promise<UserStats> => {
    // Use fetchUsers to get the merged list (includes demo teachers)
    const allUsers = await fetchUsers('all');
    
    return {
        totalUsers: allUsers.length,
        activeUsers: allUsers.filter(u => u.is_active).length,
        onlineUsers: allUsers.filter(u => u.is_online).length,
        students: allUsers.filter(u => u.role === 'student').length,
        teachers: allUsers.filter(u => u.role === 'teacher').length,
        admins: allUsers.filter(u => u.role === 'admin' || u.role === 'dean').length,
    };
};

/**
 * Search users by name or email - searches through merged data
 */
export const searchUsers = async (query: string): Promise<UserAccount[]> => {
    const searchTerm = query.toLowerCase().trim();
    
    if (!searchTerm) {
        return fetchUsers();
    }

    // Get all users (merged with demo teachers)
    const allUsers = await fetchUsers('all');
    
    // Filter by search term
    return allUsers.filter(u => 
        u.full_name.toLowerCase().includes(searchTerm) ||
        u.email.toLowerCase().includes(searchTerm) ||
        u.student_id.toLowerCase().includes(searchTerm)
    );
};

/**
 * Get classmates in the same section
 */
export const getClassmates = async (section: string = 'BSIT101A'): Promise<UserAccount[]> => {
    if (!isSupabaseConfigured() || !supabase) {
        // Return all students in the section from DEMO_USERS
        const allClassmates = DEMO_USERS.filter(u => u.role === 'student' && u.section === section);
        return enhanceWithCurrentUserProfile(allClassmates.sort((a, b) => a.full_name.localeCompare(b.full_name)));
    }

    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('section', section)
            .eq('role', 'student')
            .order('full_name', { ascending: true });

        if (error) {
            console.error('[Users] Get classmates error:', error);
            const allClassmates = DEMO_USERS.filter(u => u.role === 'student' && u.section === section);
            return enhanceWithCurrentUserProfile(allClassmates);
        }

        // If database has classmates, use them; otherwise use demo data
        if (data && data.length > 0) {
            return enhanceWithCurrentUserProfile(data);
        }

        const allClassmates = DEMO_USERS.filter(u => u.role === 'student' && u.section === section);
        return enhanceWithCurrentUserProfile(allClassmates.sort((a, b) => a.full_name.localeCompare(b.full_name)));
    } catch (err) {
        console.error('[Users] Get classmates error:', err);
        const allClassmates = DEMO_USERS.filter(u => u.role === 'student' && u.section === section);
        return enhanceWithCurrentUserProfile(allClassmates);
    }
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<UserAccount | null> => {
    if (!isSupabaseConfigured() || !supabase) {
        return DEMO_USERS.find(u => u.id === userId) || null;
    }

    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('[Users] Get by ID error:', error);
            return null;
        }

        return data;
    } catch (err) {
        console.error('[Users] Get by ID error:', err);
        return null;
    }
};

/**
 * Toggle user active status
 */
export const toggleUserStatus = async (userId: string, isActive: boolean): Promise<boolean> => {
    if (!isSupabaseConfigured() || !supabase) {
        console.log('[Users] Demo mode - status toggle simulated');
        return true;
    }

    try {
        const { error } = await supabase
            .from('users')
            .update({ is_active: isActive })
            .eq('id', userId);

        if (error) {
            console.error('[Users] Toggle status error:', error);
            return false;
        }

        return true;
    } catch (err) {
        console.error('[Users] Toggle status error:', err);
        return false;
    }
};

/**
 * Get role display info
 */
export const getRoleInfo = (role: UserRole): { label: string; color: string; bgColor: string } => {
    const roleMap = {
        student: { label: 'Student', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)' },
        teacher: { label: 'Teacher', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)' },
        admin: { label: 'Admin', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' },
        dean: { label: 'Dean', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)' },
    };
    return roleMap[role] || roleMap.student;
};

// Course info for teachers
export interface TeacherCourse {
    id: string;
    title: string;
    short_title: string;
    subtitle: string;
    category: string;
}

// Demo courses data (matching courses from database)
const DEMO_COURSES: Record<string, TeacherCourse[]> = {
    'David Clarence Del Mundo': [
        { id: 'cp1', title: 'Computer Programming 1', short_title: 'CP1', subtitle: 'CITE1003', category: 'major' },
    ],
    'Psalmmiracle Mariano': [
        { id: 'itc', title: 'Introduction to Computing', short_title: 'ITC', subtitle: 'CITE1004', category: 'major' },
    ],
    'Claire Maurillo': [
        { id: 'euth1', title: 'Euthenics 1', short_title: 'EUTH1', subtitle: 'STIC1002', category: 'ge' },
        { id: 'ppc', title: 'Philippine Popular Culture', short_title: 'PPC', subtitle: 'GEDC1041', category: 'ge' },
    ],
    'John Denielle San Martin': [
        { id: 'purcom', title: 'Purposive Communication', short_title: 'PURCOM', subtitle: 'GEDC1016', category: 'ge' },
    ],
    'Mark Joseph Danoy': [
        { id: 'pe1', title: 'P.E./PATHFIT 1', short_title: 'PE1', subtitle: 'PHED1005', category: 'pe' },
    ],
    'Dan Risty Montojo': [
        { id: 'nstp1', title: 'NSTP 1', short_title: 'NSTP1', subtitle: 'NSTP1008', category: 'nstp' },
    ],
    'Anne Jenell Lumintigar': [
        { id: 'tcw', title: 'The Contemporary World', short_title: 'TCW', subtitle: 'GEDC1002', category: 'ge' },
    ],
    'Jocel Lazalita': [
        { id: 'uts', title: 'Understanding the Self', short_title: 'UTS', subtitle: 'GEDC1008', category: 'ge' },
    ],
};

// Office hours data
export interface OfficeHours {
    day: string;
    time: string;
}

const DEMO_OFFICE_HOURS: Record<string, OfficeHours[]> = {
    'David Clarence Del Mundo': [
        { day: 'Monday', time: '9:00 AM - 11:00 AM' },
        { day: 'Wednesday', time: '2:00 PM - 4:00 PM' },
    ],
    'Psalmmiracle Mariano': [
        { day: 'Tuesday', time: '10:00 AM - 12:00 PM' },
        { day: 'Thursday', time: '1:00 PM - 3:00 PM' },
    ],
    'Claire Maurillo': [
        { day: 'Monday', time: '1:00 PM - 3:00 PM' },
        { day: 'Friday', time: '9:00 AM - 11:00 AM' },
    ],
    'John Denielle San Martin': [
        { day: 'Wednesday', time: '10:00 AM - 12:00 PM' },
        { day: 'Friday', time: '2:00 PM - 4:00 PM' },
    ],
    'Mark Joseph Danoy': [
        { day: 'Tuesday', time: '8:00 AM - 10:00 AM' },
        { day: 'Thursday', time: '3:00 PM - 5:00 PM' },
    ],
    'Dan Risty Montojo': [
        { day: 'Monday', time: '10:00 AM - 12:00 PM' },
        { day: 'Wednesday', time: '1:00 PM - 3:00 PM' },
    ],
    'Anne Jenell Lumintigar': [
        { day: 'Tuesday', time: '9:00 AM - 11:00 AM' },
        { day: 'Thursday', time: '2:00 PM - 4:00 PM' },
    ],
    'Jocel Lazalita': [
        { day: 'Monday', time: '2:00 PM - 4:00 PM' },
        { day: 'Friday', time: '10:00 AM - 12:00 PM' },
    ],
};

/**
 * Get courses taught by a teacher
 */
export const getTeacherCourses = async (teacherName: string): Promise<TeacherCourse[]> => {
    if (!isSupabaseConfigured() || !supabase) {
        return DEMO_COURSES[teacherName] || [];
    }

    try {
        const { data, error } = await supabase
            .from('courses')
            .select('id, title, short_title, subtitle, category')
            .eq('instructor', teacherName);

        if (error) {
            console.error('[Users] Get teacher courses error:', error);
            return DEMO_COURSES[teacherName] || [];
        }

        return data || DEMO_COURSES[teacherName] || [];
    } catch (err) {
        console.error('[Users] Get teacher courses error:', err);
        return DEMO_COURSES[teacherName] || [];
    }
};

/**
 * Get office hours for a teacher
 */
export const getTeacherOfficeHours = (teacherName: string): OfficeHours[] => {
    return DEMO_OFFICE_HOURS[teacherName] || [];
};

// =====================================================
// User Favorites Management
// =====================================================

const FAVORITES_STORAGE_KEY = 'user_favorites';

/**
 * Get user favorites from localStorage (with Supabase sync when available)
 */
export const getUserFavorites = async (studentId: string): Promise<string[]> => {
    // First try localStorage
    const localFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
    const favorites = localFavorites ? JSON.parse(localFavorites) : [];

    if (!isSupabaseConfigured() || !supabase) {
        return favorites;
    }

    try {
        const { data, error } = await supabase
            .from('student_stats')
            .select('favorites')
            .eq('student_id', studentId)
            .single();

        if (error || !data?.favorites) {
            return favorites;
        }

        // Sync localStorage with Supabase data
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(data.favorites));
        return data.favorites;
    } catch (err) {
        console.error('[Users] Get favorites error:', err);
        return favorites;
    }
};

/**
 * Toggle a user favorite (add/remove)
 */
export const toggleUserFavorite = async (
    studentId: string,
    favoriteUserId: string
): Promise<string[]> => {
    // Get current favorites
    const localFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
    const currentFavorites: string[] = localFavorites ? JSON.parse(localFavorites) : [];

    // Toggle the favorite
    const newFavorites = currentFavorites.includes(favoriteUserId)
        ? currentFavorites.filter((id) => id !== favoriteUserId)
        : [...currentFavorites, favoriteUserId];

    // Save to localStorage immediately
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newFavorites));

    // Sync to Supabase if configured
    if (isSupabaseConfigured() && supabase) {
        try {
            await supabase
                .from('student_stats')
                .upsert(
                    {
                        student_id: studentId,
                        favorites: newFavorites,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'student_id' }
                );
        } catch (err) {
            console.error('[Users] Save favorites error:', err);
        }
    }

    return newFavorites;
};
