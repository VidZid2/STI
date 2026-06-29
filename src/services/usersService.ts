/**
 * Users Service - Manages user accounts with Supabase integration
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getProfile, getImages, getSettings } from './profileService';
import { getCurrentLevel } from './studyTimeService';

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
    level?: number;
    xp?: number;
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
export const DEMO_USERS: UserAccount[] = [

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
    // Real classmates from BSIT101A section (30 students total)
    { id: 'student-2', student_id: '02000543211', email: 'delacruz.juan@meycauayan.sti.edu.ph', full_name: 'Juan Dela Cruz', first_name: 'Juan', last_name: 'Dela Cruz', role: 'student' as const, campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: true, last_active: new Date(Date.now() - 15 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-3', student_id: '02000543212', email: 'santos.maria@meycauayan.sti.edu.ph', full_name: 'Maria Santos', first_name: 'Maria', last_name: 'Santos', role: 'student' as const, campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date().toISOString(), created_at: new Date().toISOString() },
    { id: 'student-4', student_id: '02000543213', email: 'reyes.pedro@meycauayan.sti.edu.ph', full_name: 'Pedro Reyes', first_name: 'Pedro', last_name: 'Reyes', role: 'student' as const, campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: true, last_active: new Date(Date.now() - 45 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-5', student_id: '02000543214', email: 'cruz.ana@meycauayan.sti.edu.ph', full_name: 'Ana Cruz', first_name: 'Ana', last_name: 'Cruz', role: 'student' as const, campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: true, last_active: new Date().toISOString(), created_at: new Date().toISOString() },
    { id: 'student-6', student_id: '02000543215', email: 'mendoza.jose@meycauayan.sti.edu.ph', full_name: 'Jose Mendoza', first_name: 'Jose', last_name: 'Mendoza', role: 'student' as const, campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-7', student_id: '02000543216', email: 'bautista.luz@meycauayan.sti.edu.ph', full_name: 'Luz Bautista', first_name: 'Luz', last_name: 'Bautista', role: 'student' as const, campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: true, last_active: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-8', student_id: '02000543217', email: 'torres.miguel@meycauayan.sti.edu.ph', full_name: 'Miguel Torres', first_name: 'Miguel', last_name: 'Torres', role: 'student' as const, campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 45 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-9', student_id: '02000543218', email: 'villanueva.rosa@meycauayan.sti.edu.ph', full_name: 'Rosa Villanueva', first_name: 'Rosa', last_name: 'Villanueva', role: 'student' as const, campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-10', student_id: '02000543219', email: 'navarro.carlos@meycauayan.sti.edu.ph', full_name: 'Carlos Navarro', first_name: 'Carlos', last_name: 'Navarro', role: 'student' as const, campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: true, last_active: new Date().toISOString(), created_at: new Date().toISOString() },
    { id: 'student-11', student_id: '02000543220', email: 'ramos.elena@meycauayan.sti.edu.ph', full_name: 'Elena Ramos', first_name: 'Elena', last_name: 'Ramos', role: 'student' as const, campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 20 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-12', student_id: '02000543221', email: 'mercado.luis@meycauayan.sti.edu.ph', full_name: 'Luis Mercado', first_name: 'Luis', last_name: 'Mercado', role: 'student' as const, campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: true, last_active: new Date(Date.now() - 20 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-13', student_id: '02000543222', email: 'castro.carmen@meycauayan.sti.edu.ph', full_name: 'Carmen Castro', first_name: 'Carmen', last_name: 'Castro', role: 'student' as const, campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-14', student_id: '02000543223', email: 'deleon.manuel@meycauayan.sti.edu.ph', full_name: 'Manuel De Leon', first_name: 'Manuel', last_name: 'De Leon', role: 'student' as const, campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-15', student_id: '02000543224', email: 'gonzales.teresa@meycauayan.sti.edu.ph', full_name: 'Teresa Gonzales', first_name: 'Teresa', last_name: 'Gonzales', role: 'student' as const, campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-16', student_id: '02000543225', email: 'aquino.antonio@meycauayan.sti.edu.ph', full_name: 'Antonio Aquino', first_name: 'Antonio', last_name: 'Aquino', role: 'student' as const, campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 10 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-17', student_id: '02000543226', email: 'fernandez.clara@meycauayan.sti.edu.ph', full_name: 'Clara Fernandez', first_name: 'Clara', last_name: 'Fernandez', role: 'student' as const, campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-18', student_id: '02000543227', email: 'morales.francisco@meycauayan.sti.edu.ph', full_name: 'Francisco Morales', first_name: 'Francisco', last_name: 'Morales', role: 'student' as const, campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date().toISOString(), created_at: new Date().toISOString() },
    { id: 'student-19', student_id: '02000543228', email: 'perez.isabel@meycauayan.sti.edu.ph', full_name: 'Isabel Perez', first_name: 'Isabel', last_name: 'Perez', role: 'student' as const, campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 25 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-20', student_id: '02000543229', email: 'gomez.vicente@meycauayan.sti.edu.ph', full_name: 'Vicente Gomez', first_name: 'Vicente', last_name: 'Gomez', role: 'student' as const, campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-21', student_id: '02000543230', email: 'domingo.sofia@meycauayan.sti.edu.ph', full_name: 'Sofia Domingo', first_name: 'Sofia', last_name: 'Domingo', role: 'student' as const, campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-22', student_id: '02000543231', email: 'pascual.ramon@meycauayan.sti.edu.ph', full_name: 'Ramon Pascual', first_name: 'Ramon', last_name: 'Pascual', role: 'student' as const, campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 35 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-23', student_id: '02000543232', email: 'tolentino.beatriz@meycauayan.sti.edu.ph', full_name: 'Beatriz Tolentino', first_name: 'Beatriz', last_name: 'Tolentino', role: 'student' as const, campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-24', student_id: '02000543233', email: 'garcia.eduardo@meycauayan.sti.edu.ph', full_name: 'Eduardo Garcia', first_name: 'Eduardo', last_name: 'Garcia', role: 'student' as const, campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date().toISOString(), created_at: new Date().toISOString() },
    { id: 'student-25', student_id: '02000543234', email: 'ocampo.leonor@meycauayan.sti.edu.ph', full_name: 'Leonor Ocampo', first_name: 'Leonor', last_name: 'Ocampo', role: 'student' as const, campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 50 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-26', student_id: '02000543235', email: 'lopez.arturo@meycauayan.sti.edu.ph', full_name: 'Arturo Lopez', first_name: 'Arturo', last_name: 'Lopez', role: 'student' as const, campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-27', student_id: '02000543236', email: 'martinez.rosalinda@meycauayan.sti.edu.ph', full_name: 'Rosalinda Martinez', first_name: 'Rosalinda', last_name: 'Martinez', role: 'student' as const, campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-28', student_id: '02000543237', email: 'cruz.ricardo@meycauayan.sti.edu.ph', full_name: 'Ricardo Cruz', first_name: 'Ricardo', last_name: 'Cruz', role: 'student' as const, campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 40 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-29', student_id: '02000543238', email: 'santiago.magdalena@meycauayan.sti.edu.ph', full_name: 'Magdalena Santiago', first_name: 'Magdalena', last_name: 'Santiago', role: 'student' as const, campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: false, last_active: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() },
    { id: 'student-30', student_id: '02000543239', email: 'flores.fernando@meycauayan.sti.edu.ph', full_name: 'Fernando Flores', first_name: 'Fernando', last_name: 'Flores', role: 'student' as const, campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: true, last_active: new Date().toISOString(), created_at: new Date().toISOString() },
    { id: 'demo-user-1', student_id: '02000543210', email: 'deasis.462124@meycauayan.sti.edu.ph', full_name: 'Josiah P. De Asis', first_name: 'Josiah', last_name: 'De Asis', role: 'student' as const, campus: 'Meycauayan', program: 'BSIT', year_level: '1st Year', section: 'BSIT101A', is_active: true, is_online: true, last_active: new Date().toISOString(), created_at: new Date().toISOString() },
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
                full_name: `${profile.firstName} ${profile.lastName}`.trim() || user.full_name,
                first_name: profile.firstName || user.first_name,
                last_name: profile.lastName || user.last_name,
                profile_image: images.profileImage || user.profile_image,
                is_online: settings.showOnlineStatus, // Respect user's online status setting
                level: getCurrentLevel() || user.level || 1,
                program: profile.course || user.program,
                section: profile.section || user.section,
                year_level: profile.yearLevel || user.year_level,
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
        let dbStudents: UserAccount[] = [];
        let dbOthers: UserAccount[] = [];

        // Fetch students from 'students' table if filter is 'all' or 'student'
        if (filter === 'all' || filter === 'student') {
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .order('full_name', { ascending: true });

            if (data && !error) {
                dbStudents = data.map(s => ({
                    id: s.id,
                    student_id: s.student_id,
                    email: s.email || '',
                    full_name: s.full_name.includes(',') 
                        ? `${s.first_name} ${s.last_name}` 
                        : s.full_name, // Handle comma separated database name values gracefully
                    first_name: s.first_name,
                    last_name: s.last_name,
                    role: 'student' as const,
                    campus: s.campus || 'Meycauayan',
                    program: s.program || 'BSIT',
                    year_level: s.year_level || '1st Year',
                    section: s.section || 'BSIT101A',
                    is_active: s.is_active,
                    profile_image: s.avatar_url || '',
                    is_online: false,
                    last_active: new Date().toISOString(),
                    created_at: s.created_at || new Date().toISOString(),
                }));
            }
        }

        // Fetch others (teachers, admins) from 'users' table
        if (filter === 'all' || filter !== 'student') {
            let query = supabase.from('users').select('*');
            if (filter !== 'all') {
                query = query.eq('role', filter);
            } else {
                query = query.neq('role', 'student');
            }
            const { data, error } = await query;
            if (data && !error) {
                dbOthers = data;
            }
        }

        // If we found database records, merge them with fallbacks
        if (dbStudents.length > 0 || dbOthers.length > 0) {
            const dbStudentIds = new Set(dbStudents.map(u => u.student_id.toLowerCase()));
            const dbStudentEmails = new Set(dbStudents.map(u => u.email.toLowerCase()));
            const dbOtherEmails = new Set(dbOthers.map(u => u.email.toLowerCase()));

            const missingDemoUsers = DEMO_USERS.filter(u => {
                if (u.role === 'student') {
                    return !dbStudentIds.has(u.student_id.toLowerCase()) && 
                           !dbStudentEmails.has(u.email.toLowerCase());
                } else {
                    return !dbOtherEmails.has(u.email.toLowerCase());
                }
            });

            const mergedUsers = [...dbStudents, ...dbOthers, ...missingDemoUsers];

            // Apply filter
            const filteredUsers = filter === 'all' 
                ? mergedUsers 
                : mergedUsers.filter(u => u.role === filter);

            return enhanceWithCurrentUserProfile(filteredUsers.sort((a, b) => a.full_name.localeCompare(b.full_name)));
        }

        const fallbackUsers = filter === 'all'
            ? DEMO_USERS
            : DEMO_USERS.filter(u => u.role === filter);
        return enhanceWithCurrentUserProfile(fallbackUsers);
    } catch (err) {
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
            .from('students')
            .select('*')
            .eq('section', section)
            .order('full_name', { ascending: true });

        if (error) {
            const allClassmates = DEMO_USERS.filter(u => u.role === 'student' && u.section === section);
            return enhanceWithCurrentUserProfile(allClassmates);
        }

        // If database has classmates, use them; otherwise use demo data
        if (data && data.length > 0) {
            const mapped = data.map(s => ({
                id: s.id,
                student_id: s.student_id,
                email: s.email || '',
                full_name: s.full_name.includes(',') 
                    ? `${s.first_name} ${s.last_name}` 
                    : s.full_name,
                first_name: s.first_name,
                last_name: s.last_name,
                role: 'student' as const,
                campus: s.campus || 'Meycauayan',
                program: s.program || 'BSIT',
                year_level: s.year_level || '1st Year',
                section: s.section || 'BSIT101A',
                is_active: s.is_active,
                profile_image: s.avatar_url || '',
                is_online: false,
                last_active: new Date().toISOString(),
                created_at: s.created_at || new Date().toISOString(),
            }));
            return enhanceWithCurrentUserProfile(mapped);
        }

        const allClassmates = DEMO_USERS.filter(u => u.role === 'student' && u.section === section);
        return enhanceWithCurrentUserProfile(allClassmates.sort((a, b) => a.full_name.localeCompare(b.full_name)));
    } catch (err) {
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
            return null;
        }

        return data;
    } catch (err) {
        return null;
    }
};

/**
 * Toggle user active status
 */
export const toggleUserStatus = async (userId: string, isActive: boolean): Promise<boolean> => {
    if (!isSupabaseConfigured() || !supabase) {
        return true;
    }

    try {
        const { error } = await supabase
            .from('users')
            .update({ is_active: isActive })
            .eq('id', userId);

        if (error) {
            return false;
        }

        return true;
    } catch (err) {
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
            return DEMO_COURSES[teacherName] || [];
        }

        return data || DEMO_COURSES[teacherName] || [];
    } catch (err) {
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
        }
    }

    return newFavorites;
};
