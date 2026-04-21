/**
 * CreateGroupModal
 * Multi-step group creation wizard.
 * Extracted from GroupsContent.tsx during Phase 8.2
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { supabase, isSupabaseConfigured } from '../../../../../lib/supabase';
import { createGroup, groupCategoryConfig, type GroupCategory } from '../../../../../services/groupsService';
import GroupIcon from '../components/GroupIcon';

const CreateGroupModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    isDarkMode: boolean;
    onCreateGroup: (group: {
        name: string;
        description: string;
        category: GroupCategory;
        icon: string;
        color: string;
        avatar?: string;
        courseName?: string;
        maxMembers: number;
        isPrivate: boolean;
    }) => void;
}> = ({ isOpen, onClose, isDarkMode, onCreateGroup }) => {
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<GroupCategory>('study');
    const [selectedIcon, setSelectedIcon] = useState('users');
    const [selectedColor, setSelectedColor] = useState('#3b82f6');
    const [maxMembers, setMaxMembers] = useState(10);
    const [isPrivate, setIsPrivate] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [showNameSuggestions, setShowNameSuggestions] = useState(false);
    const [inviteEmails, setInviteEmails] = useState<{
        email: string;
        name: string;
        section: string;
        program: string;
    }[]>([]);
    const [currentInviteEmail, setCurrentInviteEmail] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [confettiParticles, setConfettiParticles] = useState<{ id: number; x: number; y: number; color: string; rotation: number; scale: number }[]>([]);
    const [hoveredTooltip, setHoveredTooltip] = useState<{ text: string; x: number; y: number; color: string } | null>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    // Quick Templates
    const quickTemplates = [
        { name: 'Exam Prep Squad', description: 'Prepare for upcoming exams together', category: 'review' as GroupCategory, icon: 'check', color: '#f59e0b', maxMembers: 8 },
        { name: 'Homework Heroes', description: 'Help each other with assignments', category: 'study' as GroupCategory, icon: 'book', color: '#3b82f6', maxMembers: 10 },
        { name: 'Project Team', description: 'Collaborate on group projects', category: 'project' as GroupCategory, icon: 'code', color: '#8b5cf6', maxMembers: 6 },
        { name: 'Study Buddies', description: 'Regular study sessions & support', category: 'study' as GroupCategory, icon: 'users', color: '#10b981', maxMembers: 12 },
    ];

    // Name suggestions based on category
    const nameSuggestions: Record<GroupCategory, string[]> = {
        all: ['Study Squad', 'Learning Circle', 'Team Alpha', 'Think Tank', 'Knowledge Hub'],
        study: ['Study Squad', 'Learning Circle', 'Study Buddies', 'Brain Trust', 'Knowledge Hub'],
        project: ['Project Pioneers', 'Team Alpha', 'Code Crew', 'Build Squad', 'Dev Team'],
        review: ['Exam Prep Pro', 'Review Rangers', 'Quiz Masters', 'Test Tacklers', 'Ace Squad'],
        discussion: ['Think Tank', 'Debate Club', 'Idea Exchange', 'Discussion Den', 'Mind Meld'],
    };

    // Email added indicator
    const [showEmailAdded, setShowEmailAdded] = useState(false);
    const [recentlyAddedClassmate, setRecentlyAddedClassmate] = useState<string | null>(null);
    const [emailError, setEmailError] = useState(false);
    const [emailErrorMessage, setEmailErrorMessage] = useState('');
    const [isCheckingEmail, setIsCheckingEmail] = useState(false);
    
    // Course linking
    const [selectedCourse, setSelectedCourse] = useState<{ id: string; title: string; shortTitle: string } | null>(null);
    const [showCourseDropdown, setShowCourseDropdown] = useState(false);
    const enrolledCourses = [
        { id: 'cp1', title: 'Computer Programming 1', shortTitle: 'CP1' },
        { id: 'itc', title: 'Introduction to Computing', shortTitle: 'ITC' },
        { id: 'euth1', title: 'Euthenics 1', shortTitle: 'EUTH1' },
        { id: 'purcom', title: 'Purposive Communication', shortTitle: 'PURCOM' },
        { id: 'tcw', title: 'The Contemporary World', shortTitle: 'TCW' },
        { id: 'uts', title: 'Understanding the Self', shortTitle: 'UTS' },
        { id: 'ppc', title: 'Philippine Popular Culture', shortTitle: 'PPC' },
        { id: 'pe1', title: 'P.E./PATHFIT 1', shortTitle: 'PE1' },
        { id: 'nstp1', title: 'NSTP 1', shortTitle: 'NSTP1' },
    ];
    
    // Group avatar upload
    const [groupAvatar, setGroupAvatar] = useState<string | null>(null);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    
    // Invite link
    const [inviteLink, setInviteLink] = useState<string | null>(null);
    const [showInviteLinkCopied, setShowInviteLinkCopied] = useState(false);
    
    // Undo remove invite
    const [removedInvite, setRemovedInvite] = useState<{ email: string; name: string; section: string; program: string } | null>(null);
    const [showUndoToast, setShowUndoToast] = useState(false);
    const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    // Email validation helper - only accept @meycauayan.sti.edu.ph
    const isValidEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@meycauayan\.sti\.edu\.ph$/i;
        return emailRegex.test(email);
    };
    
    // Check if email exists in database
    // @ts-ignore - Reserved for future use
    const _checkEmailExists = async (email: string): Promise<boolean> => {
        if (!isSupabaseConfigured() || !supabase) return false;
        try {
            const db = supabase;
            const { data, error } = await db
                .from('students')
                .select('id, email')
                .ilike('email', email.toLowerCase())
                .eq('is_active', true)
                .limit(1);
            
            if (error) {
                return false;
            }
            
            return data && data.length > 0;
        } catch (err) {
            return false;
        }
    };
    
    // Classmates from Supabase
    const [classmates, setClassmates] = useState<{ 
        id: string; 
        name: string; 
        email: string; 
        avatar: string;
        section: string;
        program: string;
        yearLevel: string;
    }[]>([]);
    const [isLoadingClassmates, setIsLoadingClassmates] = useState(false);
    const [hoveredClassmateId, setHoveredClassmateId] = useState<string | null>(null);
    const [classmateSearchQuery, setClassmateSearchQuery] = useState('');
    const [isSearchingClassmates, setIsSearchingClassmates] = useState(false);
    const classmateSearchRef = useRef<HTMLInputElement>(null);
    
    // Pagination state for classmates
    const [classmatesPage, setClassmatesPage] = useState(1);
    const classmatesPerPage = 5;
    const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
    
    // Reset page when search query changes
    useEffect(() => {
        setClassmatesPage(1);
    }, [classmateSearchQuery]);

    // Fetch classmates from Supabase with server-side search
    useEffect(() => {
        if (!isOpen || !isSupabaseConfigured() || !supabase) return;
        
        const db = supabase;
        
        const fetchClassmates = async (searchQuery: string = '') => {
            setIsSearchingClassmates(true);
            try {
                let query = db
                    .from('students')
                    .select('id, full_name, email, section, program, year_level')
                    .eq('is_active', true);
                
                // Server-side search if query exists
                if (searchQuery.trim()) {
                    const q = searchQuery.trim().toLowerCase();
                    query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,section.ilike.%${q}%,program.ilike.%${q}%`);
                }
                
                const { data, error } = await query.order('full_name', { ascending: true });
                
                if (!error && data) {
                    setClassmates(data.map(student => ({
                        id: student.id,
                        name: student.full_name,
                        email: student.email || '',
                        avatar: student.full_name?.charAt(0)?.toUpperCase() || '?',
                        section: student.section || 'N/A',
                        program: student.program || 'N/A',
                        yearLevel: student.year_level || 'N/A',
                    })));
                }
            } catch (err) {
            }
            setIsSearchingClassmates(false);
            setIsLoadingClassmates(false);
        };

        // Initial load when modal opens
        if (!classmateSearchQuery) {
            setIsLoadingClassmates(true);
            fetchClassmates();
        }
    }, [isOpen]);

    // Debounced search effect
    useEffect(() => {
        if (!isOpen || !isSupabaseConfigured() || !supabase) return;
        
        const db = supabase;
        
        // Clear previous timeout
        if (searchDebounceRef.current) {
            clearTimeout(searchDebounceRef.current);
        }
        
        // Debounce search by 300ms
        searchDebounceRef.current = setTimeout(async () => {
            setIsSearchingClassmates(true);
            try {
                let query = db
                    .from('students')
                    .select('id, full_name, email, section, program, year_level')
                    .eq('is_active', true);
                
                if (classmateSearchQuery.trim()) {
                    const q = classmateSearchQuery.trim().toLowerCase();
                    query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,section.ilike.%${q}%,program.ilike.%${q}%`);
                }
                
                const { data, error } = await query.order('full_name', { ascending: true });
                
                if (!error && data) {
                    setClassmates(data.map(student => ({
                        id: student.id,
                        name: student.full_name,
                        email: student.email || '',
                        avatar: student.full_name?.charAt(0)?.toUpperCase() || '?',
                        section: student.section || 'N/A',
                        program: student.program || 'N/A',
                        yearLevel: student.year_level || 'N/A',
                    })));
                }
            } catch (err) {
            }
            setIsSearchingClassmates(false);
        }, 300);
        
        return () => {
            if (searchDebounceRef.current) {
                clearTimeout(searchDebounceRef.current);
            }
        };
    }, [classmateSearchQuery, isOpen]);

    const colors = {
        bg: isDarkMode ? '#0f172a' : '#ffffff',
        cardBg: isDarkMode ? '#1e293b' : '#f8fafc',
        border: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        textPrimary: isDarkMode ? '#f1f5f9' : '#0f172a',
        textSecondary: isDarkMode ? '#94a3b8' : '#475569',
        textMuted: isDarkMode ? '#64748b' : '#94a3b8',
        accent: '#3b82f6',
    };

    const iconOptions = [
        { id: 'users', label: 'Team', tooltip: 'Perfect for general study groups' },
        { id: 'book', label: 'Study', tooltip: 'For focused learning sessions' },
        { id: 'code', label: 'Code', tooltip: 'Programming & tech projects' },
        { id: 'chat', label: 'Discussion', tooltip: 'Open conversations & debates' },
        { id: 'check', label: 'Review', tooltip: 'Exam prep & quizzes' },
        { id: 'heart', label: 'Support', tooltip: 'Peer support & motivation' },
        { id: 'grid', label: 'General', tooltip: 'Multi-purpose group' },
        { id: 'lock', label: 'Private', tooltip: 'Exclusive invite-only' },
    ];

    const colorOptions = [
        { color: '#3b82f6', name: 'Blue' },
        { color: '#8b5cf6', name: 'Purple' },
        { color: '#10b981', name: 'Green' },
        { color: '#f59e0b', name: 'Amber' },
        { color: '#ef4444', name: 'Red' },
        { color: '#ec4899', name: 'Pink' },
        { color: '#06b6d4', name: 'Cyan' },
        { color: '#84cc16', name: 'Lime' },
    ];

    const categoryOptions: { id: GroupCategory; label: string; description: string; longDescription: string; icon: React.ReactNode; benefits: string[] }[] = [
        { 
            id: 'study', 
            label: 'Study Group', 
            description: 'Learn together with classmates',
            longDescription: 'Perfect for regular study sessions, sharing notes, and helping each other understand difficult concepts.',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
            ),
            benefits: ['Share notes', 'Ask questions', 'Study sessions']
        },
        { 
            id: 'project', 
            label: 'Project Team', 
            description: 'Collaborate on assignments',
            longDescription: 'Ideal for group projects, coding assignments, and any collaborative work that needs coordination.',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                </svg>
            ),
            benefits: ['Task tracking', 'File sharing', 'Deadlines']
        },
        { 
            id: 'review', 
            label: 'Exam Prep', 
            description: 'Prepare for tests together',
            longDescription: 'Great for exam preparation, quiz practice, and reviewing key concepts before important tests.',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
            ),
            benefits: ['Practice tests', 'Flashcards', 'Review notes']
        },
        { 
            id: 'discussion', 
            label: 'Discussion', 
            description: 'Share ideas and debate',
            longDescription: 'Best for open discussions, brainstorming sessions, and exploring different perspectives on topics.',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
            ),
            benefits: ['Share ideas', 'Get feedback', 'Brainstorm']
        },
    ];

    // Keyboard shortcuts: Enter to proceed, Escape to go back/close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            
            // Don't trigger if user is typing in an input
            const activeElement = document.activeElement;
            const isInputFocused = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';
            
            if (e.key === 'Escape') {
                e.preventDefault();
                if (showSuccess) {
                    onClose();
                } else if (step > 1) {
                    setStep(step - 1);
                } else {
                    onClose();
                }
            }
            
            // Enter to proceed (only if not in input)
            if (e.key === 'Enter' && !e.shiftKey && !isInputFocused) {
                e.preventDefault();
                if (showSuccess) {
                    onClose();
                } else if (step < 3) { // 3 total steps
                    // Only proceed if required fields are filled
                    if (step === 1 && name.trim()) {
                        setStep(step + 1);
                    } else if (step === 2) {
                        setStep(step + 1);
                    }
                } else if (step === 3 && name.trim() && !isCreating) {
                    handleCreate();
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, step, name, showSuccess, isCreating]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setStep(1);
            setName('');
            setDescription('');
            setCategory('study');
            setSelectedIcon('users');
            setSelectedColor('#3b82f6');
            setMaxMembers(10);
            setIsPrivate(false);
            setShowNameSuggestions(false);
            setInviteEmails([]);
            setCurrentInviteEmail('');
            setShowSuccess(false);
            setConfettiParticles([]);
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const applyTemplate = (template: typeof quickTemplates[0]) => {
        setName(template.name);
        setDescription(template.description);
        setCategory(template.category);
        setSelectedIcon(template.icon);
        setSelectedColor(template.color);
        setMaxMembers(template.maxMembers);
    };

    const addInviteEmail = async (email: string) => {
        // Clear any previous error
        setEmailError(false);
        setEmailErrorMessage('');
        
        if (!email.trim()) {
            return;
        }
        
        // Check max limit (80 invites)
        if (inviteEmails.length >= 80) {
            setEmailError(true);
            setEmailErrorMessage('Maximum 80 invites allowed');
            setTimeout(() => {
                setEmailError(false);
                setEmailErrorMessage('');
            }, 2500);
            return;
        }
        
        const normalizedEmail = email.toLowerCase().trim();
        const currentUserEmail = getProfile().email.toLowerCase().trim();
        
        // Show loading state immediately
        setIsCheckingEmail(true);
        
        // Small delay to show spinner
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Validate email format - must be @sti.edu.ph
        if (!isValidEmail(normalizedEmail)) {
            setIsCheckingEmail(false);
            setEmailError(true);
            setEmailErrorMessage('Only @meycauayan.sti.edu.ph emails allowed');
            setTimeout(() => {
                setEmailError(false);
                setEmailErrorMessage('');
            }, 2500);
            return;
        }
        
        // Prevent user from adding themselves
        if (normalizedEmail === currentUserEmail) {
            setIsCheckingEmail(false);
            setEmailError(true);
            setEmailErrorMessage("You can't invite yourself");
            setTimeout(() => {
                setEmailError(false);
                setEmailErrorMessage('');
            }, 2500);
            return;
        }
        
        // Check if already added
        if (inviteEmails.some(inv => inv.email === normalizedEmail)) {
            setIsCheckingEmail(false);
            setEmailError(true);
            setEmailErrorMessage('Email already added');
            setTimeout(() => {
                setEmailError(false);
                setEmailErrorMessage('');
            }, 2000);
            return;
        }
        
        // Check if email exists in database and get student data
        let studentData: { name: string; section: string; program: string } | null = null;
        
        if (isSupabaseConfigured() && supabase) {
            const { data, error } = await supabase
                .from('students')
                .select('full_name, section, program')
                .eq('email', normalizedEmail)
                .single();
            
            if (!error && data) {
                studentData = {
                    name: data.full_name || '',
                    section: data.section || 'N/A',
                    program: data.program || 'N/A',
                };
            }
        }
        
        setIsCheckingEmail(false);
        
        if (!studentData) {
            setEmailError(true);
            setEmailErrorMessage('Student not found in system');
            setTimeout(() => {
                setEmailError(false);
                setEmailErrorMessage('');
            }, 2500);
            return;
        }
        
        setInviteEmails([...inviteEmails, {
            email: normalizedEmail,
            name: studentData.name,
            section: studentData.section,
            program: studentData.program,
        }]);
        setShowEmailAdded(true);
        setTimeout(() => setShowEmailAdded(false), 1500);
        setCurrentInviteEmail('');
    };

    const removeInviteEmail = (email: string) => {
        const inviteToRemove = inviteEmails.find(inv => inv.email === email);
        if (inviteToRemove) {
            // Clear any existing undo timeout
            if (undoTimeoutRef.current) {
                clearTimeout(undoTimeoutRef.current);
            }
            
            // Store removed invite for undo
            setRemovedInvite(inviteToRemove);
            setShowUndoToast(true);
            
            // Remove from list
            setInviteEmails(inviteEmails.filter(inv => inv.email !== email));
            
            // Auto-hide undo toast after 4 seconds
            undoTimeoutRef.current = setTimeout(() => {
                setShowUndoToast(false);
                setRemovedInvite(null);
            }, 4000);
        }
    };
    
    const undoRemoveInvite = () => {
        if (removedInvite) {
            setInviteEmails(prev => [...prev, removedInvite]);
            setShowUndoToast(false);
            setRemovedInvite(null);
            if (undoTimeoutRef.current) {
                clearTimeout(undoTimeoutRef.current);
            }
        }
    };
    
    // Handle avatar upload
    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                alert('Image must be less than 2MB');
                return;
            }
            setIsUploadingAvatar(true);
            const reader = new FileReader();
            reader.onloadend = () => {
                setGroupAvatar(reader.result as string);
                setIsUploadingAvatar(false);
            };
            reader.readAsDataURL(file);
        }
    };
    
    // Generate invite link
    const generateInviteLink = () => {
        const linkId = Math.random().toString(36).substring(2, 10);
        const link = `${window.location.origin}/join/${linkId}`;
        setInviteLink(link);
    };
    
    // Copy invite link
    const copyInviteLink = async () => {
        if (inviteLink) {
            await navigator.clipboard.writeText(inviteLink);
            setShowInviteLinkCopied(true);
            setTimeout(() => setShowInviteLinkCopied(false), 2000);
        }
    };

    // Generate confetti particles
    const generateConfetti = () => {
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', selectedColor];
        const particles = Array.from({ length: 50 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * 360,
            scale: 0.5 + Math.random() * 0.5,
        }));
        setConfettiParticles(particles);
    };

    const handleCreate = async () => {
        if (!name.trim()) return;
        setIsCreating(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Show success animation
        setShowSuccess(true);
        generateConfetti();
        
        // Wait for animation then close
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        onCreateGroup({
            name: name.trim(),
            description: description.trim(),
            category,
            icon: selectedIcon,
            color: selectedColor,
            avatar: groupAvatar || undefined,
            courseName: selectedCourse?.shortTitle || undefined,
            maxMembers,
            isPrivate,
        });
        // Note: inviteEmails would be sent to backend here
        setIsCreating(false);
        setShowSuccess(false);
        setConfettiParticles([]);
        onClose();
    };

    const canProceed = step === 1 ? name.trim().length >= 3 : true;
    const totalSteps = 3;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)',
                            backdropFilter: 'blur(4px)', zIndex: 9998,
                        }}
                    />

                    {/* Success Animation with Confetti */}
                    <AnimatePresence>
                        {showSuccess && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                style={{
                                    position: 'fixed', inset: 0, zIndex: 10001,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    pointerEvents: 'none',
                                }}
                            >
                                {/* Confetti Particles */}
                                {confettiParticles.map((particle) => (
                                    <motion.div
                                        key={particle.id}
                                        initial={{ 
                                            x: '50%', y: '50%', 
                                            scale: 0, rotate: 0, opacity: 1 
                                        }}
                                        animate={{ 
                                            x: `${particle.x}%`, 
                                            y: `${particle.y + 100}%`,
                                            scale: particle.scale,
                                            rotate: particle.rotation + 360,
                                            opacity: 0,
                                        }}
                                        transition={{ 
                                            duration: 2, 
                                            ease: [0.22, 1, 0.36, 1],
                                            delay: Math.random() * 0.3,
                                        }}
                                        style={{
                                            position: 'absolute',
                                            width: '10px', height: '10px',
                                            background: particle.color,
                                            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                                        }}
                                    />
                                ))}
                                
                                {/* Success Message */}
                                <motion.div
                                    initial={{ scale: 0, y: 20 }}
                                    animate={{ scale: 1, y: 0 }}
                                    exit={{ scale: 0, y: -20 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                    style={{
                                        background: '#ffffff',
                                        borderRadius: '20px',
                                        padding: '32px 48px',
                                        textAlign: 'center',
                                        boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
                                    }}
                                >
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
                                        style={{
                                            width: '64px', height: '64px', borderRadius: '50%',
                                            background: `linear-gradient(135deg, ${selectedColor}20 0%, ${selectedColor}10 100%)`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            margin: '0 auto 16px',
                                        }}
                                    >
                                        <motion.svg 
                                            width="32" height="32" viewBox="0 0 24 24" fill="none" 
                                            stroke={selectedColor} strokeWidth="3" strokeLinecap="round"
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: 1 }}
                                            transition={{ delay: 0.4, duration: 0.5 }}
                                        >
                                            <motion.path d="M20 6L9 17l-5-5" />
                                        </motion.svg>
                                    </motion.div>
                                    <motion.h3
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 600, color: '#0f172a' }}
                                    >
                                        Group Created! ??
                                    </motion.h3>
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.4 }}
                                        style={{ margin: 0, fontSize: '14px', color: '#64748b' }}
                                    >
                                        {name} is ready for collaboration
                                    </motion.p>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    
                    {/* Modal */}
                    <div style={{
                        position: 'fixed', inset: 0, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', zIndex: 9999, pointerEvents: 'none', padding: '20px',
                    }}>
                        <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ 
                                type: 'spring', 
                                stiffness: 400, 
                                damping: 30,
                                layout: { type: 'spring', damping: 25, stiffness: 200 }
                            }}
                            style={{
                                width: '100%', maxWidth: '520px', maxHeight: '90vh',
                                background: colors.bg, borderRadius: '20px',
                                boxShadow: isDarkMode ? '0 24px 48px rgba(0, 0, 0, 0.4)' : '0 24px 48px rgba(0, 0, 0, 0.15)',
                                overflow: 'hidden', display: 'flex', flexDirection: 'column', pointerEvents: 'auto',
                            }}
                        >
                            {/* Progress Bar - At the very top */}
                            <div style={{
                                height: '4px',
                                background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                                borderRadius: '20px 20px 0 0',
                                overflow: 'hidden',
                            }}>
                                <motion.div
                                    initial={{ width: '33%' }}
                                    animate={{ width: `${(step / totalSteps) * 100}%` }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                    style={{ height: '100%', background: selectedColor }}
                                />
                            </div>

                            {/* Header */}
                            <div style={{
                                padding: '20px 24px', borderBottom: `1px solid ${colors.border}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
                                        style={{
                                            width: '42px', height: '42px', borderRadius: '12px',
                                            background: `linear-gradient(135deg, ${selectedColor}20 0%, ${selectedColor}10 100%)`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}
                                    >
                                        <GroupIcon icon={selectedIcon} color={selectedColor} size={22} />
                                    </motion.div>
                                    <div>
                                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: colors.textPrimary }}>
                                            Create Study Group
                                        </h2>
                                        <p style={{ margin: 0, fontSize: '12px', color: colors.textMuted }}>
                                            Step {step} of {totalSteps} • {step === 1 ? 'Basic Info' : step === 2 ? 'Customize' : 'Invite Friends'}
                                        </p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {/* Keyboard Shortcuts Hint */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <kbd style={{
                                                padding: '3px 6px', borderRadius: '4px',
                                                background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                                                fontSize: '10px', fontWeight: 500, color: colors.textMuted,
                                                fontFamily: 'system-ui, -apple-system, sans-serif',
                                            }}>
                                                Esc
                                            </kbd>
                                            <span style={{ fontSize: '10px', color: colors.textMuted }}>
                                                {step > 1 ? 'Back' : 'Close'}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <kbd style={{
                                                padding: '3px 6px', borderRadius: '4px',
                                                background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                                                fontSize: '10px', fontWeight: 500, color: colors.textMuted,
                                                fontFamily: 'system-ui, -apple-system, sans-serif',
                                            }}>
                                                Enter
                                            </kbd>
                                            <span style={{ fontSize: '10px', color: colors.textMuted }}>
                                                {step < totalSteps ? 'Next' : 'Create'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Close Button */}
                                    <motion.button
                                        onClick={onClose}
                                        whileHover={{ scale: 1.1, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
                                        whileTap={{ scale: 0.9 }}
                                        style={{
                                            width: '32px', height: '32px', borderRadius: '8px', border: 'none',
                                            background: 'transparent', cursor: 'pointer', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', color: colors.textMuted,
                                        }}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M18 6L6 18M6 6l12 12" />
                                        </svg>
                                    </motion.button>
                                </div>
                            </div>

                            {/* Content */}
                            <motion.div 
                                layout
                                transition={{ layout: { type: 'spring', damping: 25, stiffness: 200 } }}
                                style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}
                                onScroll={() => setHoveredTooltip(null)}
                            >
                                <AnimatePresence mode="wait">
                                    {step === 1 ? (
                                        <motion.div
                                            key="step1"
                                            layout
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            transition={{ duration: 0.2, layout: { type: 'spring', damping: 25, stiffness: 200 } }}
                                        >
                                            {/* Quick Templates */}
                                            <div style={{ marginBottom: '20px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={selectedColor} strokeWidth="2">
                                                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                                    </svg>
                                                    <label style={{
                                                        fontSize: '12px', fontWeight: 600,
                                                        color: colors.textSecondary,
                                                        textTransform: 'uppercase', letterSpacing: '0.5px',
                                                    }}>
                                                        Quick Start Templates
                                                    </label>
                                                    <span style={{
                                                        fontSize: '9px', padding: '2px 6px', borderRadius: '4px',
                                                        background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontWeight: 500,
                                                    }}>
                                                        One-click setup
                                                    </span>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                                    {quickTemplates.map((template, i) => (
                                                        <motion.button
                                                            key={i}
                                                            onClick={() => applyTemplate(template)}
                                                            whileHover={{ scale: 1.02, y: -2 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            style={{
                                                                padding: '10px 12px', borderRadius: '10px',
                                                                border: `1px solid ${name === template.name ? template.color : colors.border}`,
                                                                background: name === template.name ? `${template.color}10` : colors.cardBg,
                                                                cursor: 'pointer', textAlign: 'left',
                                                                transition: 'all 0.2s ease',
                                                            }}
                                                        >
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                                <div style={{
                                                                    width: '24px', height: '24px', borderRadius: '6px',
                                                                    background: `${template.color}20`,
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                }}>
                                                                    <GroupIcon icon={template.icon} color={template.color} size={14} />
                                                                </div>
                                                                <span style={{ fontSize: '12px', fontWeight: 600, color: colors.textPrimary }}>
                                                                    {template.name}
                                                                </span>
                                                            </div>
                                                            <p style={{ margin: 0, fontSize: '10px', color: colors.textMuted, lineHeight: 1.3 }}>
                                                                {template.description}
                                                            </p>
                                                        </motion.button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Divider */}
                                            <div style={{ 
                                                display: 'flex', alignItems: 'center', gap: '12px', 
                                                marginBottom: '20px', color: colors.textMuted 
                                            }}>
                                                <div style={{ flex: 1, height: '1px', background: colors.border }} />
                                                <span style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    or customize
                                                </span>
                                                <div style={{ flex: 1, height: '1px', background: colors.border }} />
                                            </div>

                                            {/* Group Name */}
                                            <div style={{ marginBottom: '20px', position: 'relative' }}>
                                                <label style={{
                                                    display: 'block', fontSize: '12px', fontWeight: 600,
                                                    color: colors.textSecondary, marginBottom: '8px',
                                                    textTransform: 'uppercase', letterSpacing: '0.5px',
                                                }}>
                                                    Group Name *
                                                </label>
                                                <div style={{ position: 'relative' }}>
                                                    <input
                                                        type="text"
                                                        value={name}
                                                        onChange={(e) => setName(e.target.value)}
                                                        onFocus={() => setShowNameSuggestions(true)}
                                                        onBlur={() => setTimeout(() => setShowNameSuggestions(false), 150)}
                                                        placeholder="e.g., CP1 Study Squad"
                                                        maxLength={50}
                                                        style={{
                                                            width: '100%', padding: '12px 14px', borderRadius: '10px',
                                                            border: `1px solid ${name.length >= 50 ? '#ef4444' : name.length >= 3 ? 'rgba(16, 185, 129, 0.4)' : colors.border}`,
                                                            background: name.length >= 50 ? (isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)') : colors.cardBg, 
                                                            color: colors.textPrimary,
                                                            fontSize: '14px', outline: 'none',
                                                            transition: 'all 0.2s ease',
                                                        }}
                                                    />
                                                    {/* Name Suggestions Dropdown */}
                                                    <AnimatePresence>
                                                        {showNameSuggestions && !name && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: -8 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, y: -8 }}
                                                                style={{
                                                                    position: 'absolute', top: '100%', left: 0, right: 0,
                                                                    marginTop: '4px', background: colors.cardBg,
                                                                    border: `1px solid ${colors.border}`, borderRadius: '10px',
                                                                    boxShadow: '0 6px 20px rgba(0,0,0,0.1)', zIndex: 10,
                                                                    overflow: 'hidden',
                                                                }}
                                                            >
                                                                <div style={{
                                                                    padding: '6px 10px', borderBottom: `1px solid ${colors.border}`,
                                                                    display: 'flex', alignItems: 'center', gap: '6px',
                                                                }}>
                                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={selectedColor} strokeWidth="2">
                                                                        <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
                                                                    </svg>
                                                                    <span style={{ fontSize: '10px', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase' }}>
                                                                        Suggestions for {categoryOptions.find(c => c.id === category)?.label}
                                                                    </span>
                                                                </div>
                                                                {nameSuggestions[category].map((suggestion, i) => (
                                                                    <motion.button
                                                                        key={i}
                                                                        onClick={() => { setName(suggestion); setShowNameSuggestions(false); }}
                                                                        whileHover={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}
                                                                        style={{
                                                                            width: '100%', padding: '8px 12px', border: 'none',
                                                                            background: 'transparent', cursor: 'pointer', textAlign: 'left',
                                                                            display: 'flex', alignItems: 'center', gap: '8px',
                                                                        }}
                                                                    >
                                                                        <span style={{ fontSize: '12px', color: colors.textPrimary }}>{suggestion}</span>
                                                                    </motion.button>
                                                                ))}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                                <div style={{
                                                    display: 'flex', justifyContent: 'space-between',
                                                    marginTop: '6px', fontSize: '11px',
                                                }}>
                                                    <span style={{ 
                                                        color: name.length < 3 ? '#f59e0b' : name.length >= 50 ? '#ef4444' : '#10b981',
                                                        display: 'flex', alignItems: 'center', gap: '4px',
                                                    }}>
                                                        {name.length < 3 ? (
                                                            <>
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                                                                </svg>
                                                                Minimum 3 characters
                                                            </>
                                                        ) : name.length >= 50 ? (
                                                            <>
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                                                                </svg>
                                                                Character limit reached
                                                            </>
                                                        ) : (
                                                            <>
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                                                                </svg>
                                                                Looks good!
                                                            </>
                                                        )}
                                                    </span>
                                                    <span style={{ 
                                                        color: name.length >= 50 ? '#ef4444' : name.length >= 45 ? '#f59e0b' : colors.textMuted,
                                                        fontWeight: name.length >= 45 ? 600 : 400,
                                                    }}>
                                                        {name.length}/50
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Description */}
                                            <div style={{ marginBottom: '20px' }}>
                                                <label style={{
                                                    display: 'block', fontSize: '12px', fontWeight: 600,
                                                    color: colors.textSecondary, marginBottom: '8px',
                                                    textTransform: 'uppercase', letterSpacing: '0.5px',
                                                }}>
                                                    Description
                                                </label>
                                                <textarea
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                    placeholder="What's this group about? Share your goals..."
                                                    maxLength={200}
                                                    rows={3}
                                                    style={{
                                                        width: '100%', padding: '12px 14px', borderRadius: '10px',
                                                        border: `1px solid ${description.length >= 200 ? '#ef4444' : colors.border}`, 
                                                        background: description.length >= 200 ? (isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)') : colors.cardBg,
                                                        color: colors.textPrimary, fontSize: '14px', outline: 'none',
                                                        resize: 'none', fontFamily: 'inherit',
                                                        transition: 'all 0.2s ease',
                                                    }}
                                                />
                                                <div style={{ 
                                                    display: 'flex', justifyContent: 'space-between',
                                                    marginTop: '6px', fontSize: '11px',
                                                }}>
                                                    <span style={{ 
                                                        color: description.length >= 200 ? '#ef4444' : colors.textMuted,
                                                        display: 'flex', alignItems: 'center', gap: '4px',
                                                    }}>
                                                        {description.length >= 200 && (
                                                            <>
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                                                                </svg>
                                                                Character limit reached
                                                            </>
                                                        )}
                                                    </span>
                                                    <span style={{ 
                                                        color: description.length >= 200 ? '#ef4444' : description.length >= 180 ? '#f59e0b' : colors.textMuted,
                                                        fontWeight: description.length >= 180 ? 600 : 400,
                                                    }}>
                                                        {description.length}/200
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Category Selection */}
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                                    <label style={{
                                                        fontSize: '12px', fontWeight: 600,
                                                        color: colors.textSecondary,
                                                        textTransform: 'uppercase', letterSpacing: '0.5px',
                                                    }}>
                                                        Category
                                                    </label>
                                                    <div 
                                                        title="Choose a category that best describes your group's purpose"
                                                        style={{
                                                            width: '16px', height: '16px', borderRadius: '50%',
                                                            background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            cursor: 'help',
                                                        }}
                                                    >
                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2">
                                                            <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                    {categoryOptions.map((cat) => (
                                                        <motion.button
                                                            key={cat.id}
                                                            onClick={() => setCategory(cat.id)}
                                                            whileHover={{ scale: 1.01 }}
                                                            whileTap={{ scale: 0.99 }}
                                                            style={{
                                                                padding: '16px', borderRadius: '14px', border: 'none',
                                                                background: category === cat.id ? '#ffffff' : '#f8fafc',
                                                                cursor: 'pointer', textAlign: 'left',
                                                                outline: category === cat.id ? `2px solid ${selectedColor}` : '1px solid #e2e8f0',
                                                                outlineOffset: '-1px',
                                                                transition: 'all 0.2s ease',
                                                                boxShadow: category === cat.id ? '0 4px 16px rgba(0,0,0,0.08)' : 'none',
                                                            }}
                                                        >
                                                            {/* Icon and Title Row */}
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                                                                <div style={{
                                                                    width: '36px', height: '36px', borderRadius: '10px',
                                                                    background: category === cat.id ? `${selectedColor}15` : '#f1f5f9',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    color: category === cat.id ? selectedColor : '#64748b',
                                                                    transition: 'all 0.2s ease',
                                                                }}>
                                                                    {cat.icon}
                                                                </div>
                                                                <span style={{
                                                                    fontSize: '14px', fontWeight: 600,
                                                                    color: category === cat.id ? selectedColor : '#0f172a',
                                                                }}>
                                                                    {cat.label}
                                                                </span>
                                                            </div>
                                                            
                                                            {/* Description */}
                                                            <p style={{ 
                                                                margin: '0 0 12px 0', fontSize: '12px', 
                                                                color: '#334155', lineHeight: 1.5,
                                                            }}>
                                                                {cat.longDescription}
                                                            </p>
                                                            
                                                            {/* Benefits Tags */}
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                                {cat.benefits.map((benefit, i) => (
                                                                    <span key={i} style={{
                                                                        fontSize: '10px', padding: '4px 8px', borderRadius: '6px',
                                                                        background: category === cat.id ? `${selectedColor}12` : '#f1f5f9',
                                                                        color: category === cat.id ? selectedColor : '#475569',
                                                                        fontWeight: 500,
                                                                        border: `1px solid ${category === cat.id ? `${selectedColor}25` : '#e2e8f0'}`,
                                                                    }}>
                                                                        {benefit}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </motion.button>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ) : step === 2 ? (
                                        <motion.div
                                            key="step2"
                                            layout
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.2, layout: { type: 'spring', damping: 25, stiffness: 200 } }}
                                        >
                                            {/* Live Preview Card */}
                                            <div style={{ marginBottom: '24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={selectedColor} strokeWidth="2">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                        <circle cx="12" cy="12" r="3" />
                                                    </svg>
                                                    <label style={{
                                                        fontSize: '12px', fontWeight: 600,
                                                        color: '#0f172a',
                                                        textTransform: 'uppercase', letterSpacing: '0.5px',
                                                    }}>
                                                        Live Preview
                                                    </label>
                                                    <span style={{
                                                        fontSize: '9px', padding: '2px 6px', borderRadius: '4px',
                                                        background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontWeight: 500,
                                                    }}>
                                                        Updates in real-time
                                                    </span>
                                                </div>
                                                <motion.div
                                                    layout
                                                    style={{
                                                        background: '#ffffff', borderRadius: '16px',
                                                        border: '1px solid #e2e8f0', padding: '16px',
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                                    }}
                                                >
                                                    {/* Preview Header */}
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                                                        <motion.div
                                                            key={selectedIcon + selectedColor + (groupAvatar ? 'avatar' : '')}
                                                            initial={{ scale: 0.8, rotate: -10 }}
                                                            animate={{ scale: 1, rotate: 0 }}
                                                            transition={{ type: 'spring', stiffness: 400 }}
                                                            style={{
                                                                width: 44, height: 44, borderRadius: '12px',
                                                                background: groupAvatar ? 'transparent' : `linear-gradient(135deg, ${selectedColor}20 0%, ${selectedColor}10 100%)`,
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                                overflow: 'hidden',
                                                            }}
                                                        >
                                                            {groupAvatar ? (
                                                                <img src={groupAvatar} alt="Group" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            ) : (
                                                                <GroupIcon icon={selectedIcon} color={selectedColor} size={22} />
                                                            )}
                                                        </motion.div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                                <motion.h3 
                                                                    key={name}
                                                                    initial={{ opacity: 0.5 }}
                                                                    animate={{ opacity: 1 }}
                                                                    style={{
                                                                        margin: 0, fontSize: '14px', fontWeight: 600, color: '#0f172a',
                                                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                                    }}
                                                                >
                                                                    {name || 'Your Group Name'}
                                                                </motion.h3>
                                                                {isPrivate && (
                                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                                                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                                    </svg>
                                                                )}
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <span style={{
                                                                    fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
                                                                    background: `${selectedColor}15`, color: selectedColor, fontWeight: 500,
                                                                }}>
                                                                    {categoryOptions.find(c => c.id === category)?.label || 'Study Group'}
                                                                </span>
                                                                {selectedCourse && (
                                                                    <span style={{
                                                                        fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
                                                                        background: '#f1f5f9', color: '#64748b', fontWeight: 500,
                                                                    }}>
                                                                        {selectedCourse.shortTitle}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* Preview Description */}
                                                    <p style={{
                                                        margin: '0 0 12px 0', fontSize: '12px', color: '#64748b',
                                                        lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                                    }}>
                                                        {description || 'Your group description will appear here...'}
                                                    </p>
                                                    {/* Preview Footer */}
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <div style={{ display: 'flex' }}>
                                                                {[0, 1, 2].map((i) => (
                                                                    <div key={i} style={{
                                                                        width: 24, height: 24, borderRadius: '50%',
                                                                        background: `linear-gradient(135deg, ${selectedColor} 0%, ${selectedColor}dd 100%)`,
                                                                        border: '2px solid white', marginLeft: i > 0 ? -8 : 0,
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                        fontSize: '10px', fontWeight: 600, color: 'white',
                                                                    }}>
                                                                        {['Y', 'O', 'U'][i]}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>
                                                                1/{maxMembers}
                                                            </span>
                                                        </div>
                                                        <span style={{
                                                            padding: '4px 10px', borderRadius: '6px',
                                                            background: 'rgba(16, 185, 129, 0.1)', color: '#10b981',
                                                            fontSize: '10px', fontWeight: 600,
                                                        }}>
                                                            Owner
                                                        </span>
                                                    </div>
                                                </motion.div>
                                            </div>

                                            {/* Course Linking */}
                                            <div style={{ marginBottom: '24px' }}>
                                                <label style={{
                                                    fontSize: '12px', fontWeight: 600, color: '#0f172a',
                                                    textTransform: 'uppercase', letterSpacing: '0.5px',
                                                    display: 'block', marginBottom: '10px',
                                                }}>
                                                    Link to Course (Optional)
                                                </label>
                                                <div style={{ position: 'relative' }}>
                                                    <motion.button
                                                        onClick={() => setShowCourseDropdown(!showCourseDropdown)}
                                                        whileHover={{ scale: 1.01 }}
                                                        whileTap={{ scale: 0.99 }}
                                                        style={{
                                                            width: '100%', padding: '12px 14px', borderRadius: '12px',
                                                            border: `1px solid ${selectedCourse ? selectedColor : '#e2e8f0'}`,
                                                            background: selectedCourse ? `${selectedColor}08` : '#f8fafc',
                                                            cursor: 'pointer', display: 'flex', alignItems: 'center',
                                                            justifyContent: 'space-between', gap: '10px',
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={selectedCourse ? selectedColor : '#94a3b8'} strokeWidth="2">
                                                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                                            </svg>
                                                            <span style={{ fontSize: '13px', fontWeight: 500, color: selectedCourse ? '#0f172a' : '#94a3b8' }}>
                                                                {selectedCourse ? `${selectedCourse.shortTitle} - ${selectedCourse.title}` : 'Select a course...'}
                                                            </span>
                                                        </div>
                                                        <motion.svg 
                                                            animate={{ rotate: showCourseDropdown ? 180 : 0 }}
                                                            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"
                                                        >
                                                            <polyline points="6 9 12 15 18 9" />
                                                        </motion.svg>
                                                    </motion.button>
                                                    
                                                    <AnimatePresence>
                                                        {showCourseDropdown && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                                                style={{
                                                                    position: 'absolute', top: '100%', left: 0, right: 0,
                                                                    marginTop: '6px', background: 'white', borderRadius: '12px',
                                                                    border: '1px solid #e2e8f0', boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                                                                    zIndex: 50, maxHeight: '200px', overflowY: 'auto',
                                                                }}
                                                            >
                                                                <button
                                                                    onClick={() => { setSelectedCourse(null); setShowCourseDropdown(false); }}
                                                                    style={{
                                                                        width: '100%', padding: '10px 14px', border: 'none',
                                                                        background: !selectedCourse ? `${selectedColor}08` : 'transparent',
                                                                        cursor: 'pointer', textAlign: 'left',
                                                                        fontSize: '12px', color: '#64748b',
                                                                        borderBottom: '1px solid #f1f5f9',
                                                                    }}
                                                                >
                                                                    No course (General group)
                                                                </button>
                                                                {enrolledCourses.map((course) => (
                                                                    <button
                                                                        key={course.id}
                                                                        onClick={() => { setSelectedCourse(course); setShowCourseDropdown(false); }}
                                                                        style={{
                                                                            width: '100%', padding: '10px 14px', border: 'none',
                                                                            background: selectedCourse?.id === course.id ? `${selectedColor}08` : 'transparent',
                                                                            cursor: 'pointer', textAlign: 'left', display: 'flex',
                                                                            alignItems: 'center', gap: '10px',
                                                                        }}
                                                                    >
                                                                        <span style={{
                                                                            padding: '2px 6px', borderRadius: '4px',
                                                                            background: `${selectedColor}15`, color: selectedColor,
                                                                            fontSize: '10px', fontWeight: 600,
                                                                        }}>
                                                                            {course.shortTitle}
                                                                        </span>
                                                                        <span style={{ fontSize: '12px', color: '#0f172a' }}>{course.title}</span>
                                                                    </button>
                                                                ))}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </div>

                                            {/* Group Avatar Upload */}
                                            <div style={{ marginBottom: '24px' }}>
                                                <label style={{
                                                    fontSize: '12px', fontWeight: 600, color: '#0f172a',
                                                    textTransform: 'uppercase', letterSpacing: '0.5px',
                                                    display: 'block', marginBottom: '10px',
                                                }}>
                                                    Group Avatar (Optional)
                                                </label>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                    <motion.div
                                                        whileHover={{ scale: 1.05 }}
                                                        onClick={() => avatarInputRef.current?.click()}
                                                        style={{
                                                            width: '72px', height: '72px', borderRadius: '16px',
                                                            border: `2px dashed ${groupAvatar ? selectedColor : '#e2e8f0'}`,
                                                            background: groupAvatar ? 'transparent' : `${selectedColor}08`,
                                                            cursor: 'pointer', display: 'flex', alignItems: 'center',
                                                            justifyContent: 'center', overflow: 'hidden',
                                                            position: 'relative',
                                                        }}
                                                    >
                                                        {isUploadingAvatar ? (
                                                            <motion.svg 
                                                                animate={{ rotate: 360 }} 
                                                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                                width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={selectedColor} strokeWidth="2"
                                                            >
                                                                <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                                                                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                                                            </motion.svg>
                                                        ) : groupAvatar ? (
                                                            <img src={groupAvatar} alt="Group avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : (
                                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={selectedColor} strokeWidth="1.5">
                                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                                                <circle cx="8.5" cy="8.5" r="1.5" />
                                                                <polyline points="21 15 16 10 5 21" />
                                                            </svg>
                                                        )}
                                                    </motion.div>
                                                    <input
                                                        ref={avatarInputRef}
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleAvatarUpload}
                                                        style={{ display: 'none' }}
                                                    />
                                                    <div>
                                                        <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#0f172a', fontWeight: 500 }}>
                                                            {groupAvatar ? 'Change image' : 'Upload an image'}
                                                        </p>
                                                        <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
                                                            PNG, JPG up to 2MB
                                                        </p>
                                                        {groupAvatar && (
                                                            <motion.button
                                                                onClick={(e) => { e.stopPropagation(); setGroupAvatar(null); }}
                                                                whileHover={{ scale: 1.02 }}
                                                                style={{
                                                                    marginTop: '6px', padding: '4px 8px', borderRadius: '6px',
                                                                    border: 'none', background: 'rgba(239, 68, 68, 0.1)',
                                                                    color: '#ef4444', fontSize: '10px', fontWeight: 500, cursor: 'pointer',
                                                                }}
                                                            >
                                                                Remove
                                                            </motion.button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Icon Selection */}
                                            <div style={{ marginBottom: '24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                                    <label style={{
                                                        fontSize: '12px', fontWeight: 600,
                                                        color: '#0f172a',
                                                        textTransform: 'uppercase', letterSpacing: '0.5px',
                                                    }}>
                                                        {groupAvatar ? 'Fallback Icon' : 'Choose Icon'}
                                                    </label>
                                                    {groupAvatar && (
                                                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>(used when image unavailable)</span>
                                                    )}
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                                                    {iconOptions.map((icon) => {
                                                        const isSelected = selectedIcon === icon.id;
                                                        const isHovered = hoveredTooltip?.text === icon.tooltip;
                                                        return (
                                                            <motion.button
                                                                key={icon.id}
                                                                onClick={() => setSelectedIcon(icon.id)}
                                                                whileHover={{ scale: 1.05, y: -2 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onMouseEnter={(e) => {
                                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                                    setHoveredTooltip({
                                                                        text: icon.tooltip,
                                                                        x: rect.left + rect.width / 2,
                                                                        y: rect.top,
                                                                        color: selectedColor,
                                                                    });
                                                                }}
                                                                onMouseLeave={() => setHoveredTooltip(null)}
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '14px 8px', borderRadius: '12px',
                                                                    border: isSelected || isHovered ? `2px solid ${selectedColor}` : '1px solid #e2e8f0',
                                                                    background: isSelected ? `${selectedColor}10` : isHovered ? `${selectedColor}08` : '#f8fafc',
                                                                    cursor: 'pointer', display: 'flex', flexDirection: 'column',
                                                                    alignItems: 'center', gap: '8px',
                                                                    boxShadow: isSelected || isHovered ? `0 4px 12px ${selectedColor}20` : 'none',
                                                                    transition: 'all 0.2s ease',
                                                                }}
                                                            >
                                                                <GroupIcon icon={icon.id} color={isSelected || isHovered ? selectedColor : '#94a3b8'} size={24} />
                                                                <span style={{
                                                                    fontSize: '11px', fontWeight: 500,
                                                                    color: isSelected || isHovered ? selectedColor : '#64748b',
                                                                }}>
                                                                    {icon.label}
                                                                </span>
                                                            </motion.button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Color Selection - Minimalistic */}
                                            <div style={{ marginBottom: '24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                    <label style={{
                                                        fontSize: '12px', fontWeight: 600,
                                                        color: '#0f172a',
                                                        textTransform: 'uppercase', letterSpacing: '0.5px',
                                                    }}>
                                                        Theme Color
                                                    </label>
                                                </div>
                                                <div style={{ 
                                                    display: 'grid', 
                                                    gridTemplateColumns: 'repeat(8, 1fr)', 
                                                    gap: '8px',
                                                }}>
                                                    {colorOptions.map((c) => {
                                                        const isSelected = selectedColor === c.color;
                                                        return (
                                                            <motion.button
                                                                key={c.color}
                                                                onClick={() => setSelectedColor(c.color)}
                                                                whileHover={{ scale: 1.08 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onMouseEnter={(e) => {
                                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                                    setHoveredTooltip({
                                                                        text: c.name,
                                                                        x: rect.left + rect.width / 2,
                                                                        y: rect.top,
                                                                        color: c.color,
                                                                    });
                                                                }}
                                                                onMouseLeave={() => setHoveredTooltip(null)}
                                                                style={{
                                                                    width: '100%',
                                                                    aspectRatio: '1',
                                                                    borderRadius: '10px',
                                                                    border: isSelected ? '2px solid white' : '2px solid transparent',
                                                                    background: c.color,
                                                                    cursor: 'pointer',
                                                                    boxShadow: isSelected
                                                                        ? `0 0 0 2px ${c.color}, 0 4px 12px ${c.color}40`
                                                                        : 'none',
                                                                    display: 'flex', 
                                                                    alignItems: 'center', 
                                                                    justifyContent: 'center',
                                                                    transition: 'box-shadow 0.2s ease',
                                                                    position: 'relative',
                                                                }}
                                                            >
                                                                {isSelected && (
                                                                    <motion.svg 
                                                                        initial={{ scale: 0 }} 
                                                                        animate={{ scale: 1 }} 
                                                                        width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"
                                                                    >
                                                                        <polyline points="20 6 9 17 4 12" />
                                                                    </motion.svg>
                                                                )}
                                                            </motion.button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Max Members */}
                                            <div style={{ marginBottom: '24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={selectedColor} strokeWidth="2">
                                                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                                                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                                        </svg>
                                                        <label style={{
                                                            fontSize: '12px', fontWeight: 600,
                                                            color: colors.textSecondary,
                                                            textTransform: 'uppercase', letterSpacing: '0.5px',
                                                        }}>
                                                            Group Size
                                                        </label>
                                                    </div>
                                                    <div style={{
                                                        padding: '4px 10px', borderRadius: '8px',
                                                        background: `${selectedColor}15`,
                                                        display: 'flex', alignItems: 'center', gap: '4px',
                                                    }}>
                                                        <span style={{ fontSize: '14px', fontWeight: 700, color: selectedColor }}>{maxMembers}</span>
                                                        <span style={{ fontSize: '11px', color: colors.textMuted }}>members</span>
                                                    </div>
                                                </div>
                                                <div style={{
                                                    padding: '16px', borderRadius: '12px', background: colors.cardBg,
                                                    border: `1px solid ${colors.border}`,
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2">
                                                                <circle cx="12" cy="12" r="10" /><path d="M12 8v8M8 12h8" />
                                                            </svg>
                                                            <span style={{ fontSize: '11px', color: colors.textMuted }}>5</span>
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min="5"
                                                            max="50"
                                                            value={maxMembers}
                                                            onChange={(e) => setMaxMembers(Number(e.target.value))}
                                                            style={{
                                                                flex: 1, height: '8px', borderRadius: '4px',
                                                                appearance: 'none', 
                                                                background: `linear-gradient(to right, ${selectedColor} 0%, ${selectedColor} ${((maxMembers - 5) / 45) * 100}%, ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'} ${((maxMembers - 5) / 45) * 100}%, ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'} 100%)`,
                                                                cursor: 'pointer',
                                                            }}
                                                        />
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <span style={{ fontSize: '11px', color: colors.textMuted }}>50</span>
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2">
                                                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                                                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                                                        <span style={{ fontSize: '10px', color: colors.textMuted }}>
                                                            {maxMembers <= 10 ? '?? Small & focused' : maxMembers <= 25 ? '??????????? Medium group' : '?? Large community'}
                                                        </span>
                                                        <span style={{ fontSize: '10px', color: colors.textMuted }}>
                                                            Recommended: 5-15 for study groups
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Privacy Toggle */}
                                            <div style={{
                                                padding: '16px', borderRadius: '12px', 
                                                background: isPrivate ? `${selectedColor}08` : colors.cardBg,
                                                border: `1px solid ${isPrivate ? `${selectedColor}30` : colors.border}`,
                                                transition: 'all 0.2s ease',
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                                            <div style={{
                                                                width: '32px', height: '32px', borderRadius: '8px',
                                                                background: isPrivate ? `${selectedColor}20` : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            }}>
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isPrivate ? selectedColor : colors.textMuted} strokeWidth="2">
                                                                    {isPrivate ? (
                                                                        <><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>
                                                                    ) : (
                                                                        <><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>
                                                                    )}
                                                                </svg>
                                                            </div>
                                                            <div>
                                                                <span style={{ fontSize: '13px', fontWeight: 600, color: isPrivate ? selectedColor : colors.textPrimary }}>
                                                                    {isPrivate ? 'Private Group' : 'Public Group'}
                                                                </span>
                                                                <p style={{ margin: 0, fontSize: '11px', color: colors.textMuted }}>
                                                                    {isPrivate ? 'Only invited members can join' : 'Anyone can discover and join'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {isPrivate && (
                                                            <motion.div 
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                style={{ marginTop: '10px', paddingLeft: '42px' }}
                                                            >
                                                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                                    {['Invite only', 'Hidden from search', 'Secure'].map((tag, i) => (
                                                                        <span key={i} style={{
                                                                            fontSize: '9px', padding: '3px 8px', borderRadius: '4px',
                                                                            background: `${selectedColor}15`, color: selectedColor, fontWeight: 500,
                                                                        }}>
                                                                            {tag}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </div>
                                                    <motion.button
                                                        onClick={() => setIsPrivate(!isPrivate)}
                                                        whileTap={{ scale: 0.95 }}
                                                        style={{
                                                            width: '44px', height: '24px', borderRadius: '12px',
                                                            border: 'none', cursor: 'pointer', position: 'relative',
                                                            background: isPrivate ? selectedColor : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                                                            transition: 'background 0.2s ease',
                                                        }}
                                                    >
                                                        <motion.div
                                                            animate={{ x: isPrivate ? 20 : 0 }}
                                                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                            style={{
                                                                width: '20px', height: '20px', borderRadius: '10px',
                                                                background: 'white', position: 'absolute',
                                                                top: '2px', left: '2px',
                                                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                                            }}
                                                        />
                                                    </motion.button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ) : step === 3 ? (
                                        <motion.div
                                            key="step3"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            {/* Invite Friends Header */}
                                            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ type: 'spring', stiffness: 400, delay: 0.1 }}
                                                    style={{
                                                        width: '56px', height: '56px', borderRadius: '16px',
                                                        background: `linear-gradient(135deg, ${selectedColor}20 0%, ${selectedColor}10 100%)`,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        margin: '0 auto 12px',
                                                    }}
                                                >
                                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={selectedColor} strokeWidth="2">
                                                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                                        <circle cx="9" cy="7" r="4" />
                                                        <line x1="19" y1="8" x2="19" y2="14" />
                                                        <line x1="22" y1="11" x2="16" y2="11" />
                                                    </svg>
                                                </motion.div>
                                                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 600, color: colors.textPrimary }}>
                                                    Invite Classmates
                                                </h3>
                                                <p style={{ margin: 0, fontSize: '12px', color: colors.textMuted }}>
                                                    Add friends to your group (optional)
                                                </p>
                                            </div>

                                            {/* Invite Link Generation */}
                                            <div style={{ 
                                                marginBottom: '20px', padding: '14px', borderRadius: '12px',
                                                background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                                border: `1px solid ${colors.border}`,
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={selectedColor} strokeWidth="2">
                                                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                                    </svg>
                                                    <span style={{ fontSize: '11px', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase' }}>
                                                        Shareable Invite Link
                                                    </span>
                                                </div>
                                                
                                                {!inviteLink ? (
                                                    <motion.button
                                                        onClick={generateInviteLink}
                                                        whileHover={{ scale: 1.01 }}
                                                        whileTap={{ scale: 0.99 }}
                                                        style={{
                                                            width: '100%', padding: '10px 14px', borderRadius: '10px',
                                                            border: `1px dashed ${selectedColor}40`, background: `${selectedColor}05`,
                                                            cursor: 'pointer', display: 'flex', alignItems: 'center',
                                                            justifyContent: 'center', gap: '8px',
                                                            color: selectedColor, fontSize: '12px', fontWeight: 500,
                                                        }}
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <circle cx="12" cy="12" r="10" />
                                                            <line x1="12" y1="8" x2="12" y2="16" />
                                                            <line x1="8" y1="12" x2="16" y2="12" />
                                                        </svg>
                                                        Generate Invite Link
                                                    </motion.button>
                                                ) : (
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <div style={{
                                                            flex: 1, padding: '10px 12px', borderRadius: '10px',
                                                            background: colors.cardBg, border: `1px solid ${colors.border}`,
                                                            fontSize: '11px', color: colors.textSecondary,
                                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                        }}>
                                                            {inviteLink}
                                                        </div>
                                                        <motion.button
                                                            onClick={copyInviteLink}
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            style={{
                                                                padding: '10px 14px', borderRadius: '10px', border: 'none',
                                                                background: showInviteLinkCopied ? '#10b981' : selectedColor,
                                                                color: 'white', cursor: 'pointer', display: 'flex',
                                                                alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 500,
                                                            }}
                                                        >
                                                            {showInviteLinkCopied ? (
                                                                <>
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                        <polyline points="20 6 9 17 4 12" />
                                                                    </svg>
                                                                    Copied!
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                                                    </svg>
                                                                    Copy
                                                                </>
                                                            )}
                                                        </motion.button>
                                                        <motion.button
                                                            onClick={() => setInviteLink(null)}
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            style={{
                                                                padding: '10px', borderRadius: '10px', border: 'none',
                                                                background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                                                                cursor: 'pointer', display: 'flex', alignItems: 'center',
                                                            }}
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M18 6L6 18M6 6l12 12" />
                                                            </svg>
                                                        </motion.button>
                                                    </div>
                                                )}
                                                <p style={{ margin: '8px 0 0 0', fontSize: '10px', color: colors.textMuted }}>
                                                    Share this link with classmates to let them join your group
                                                </p>
                                            </div>

                                            {/* Email Input */}
                                            <div style={{ marginBottom: '16px' }}>
                                                <motion.div 
                                                    animate={emailError ? { x: [0, -8, 8, -8, 8, 0] } : {}}
                                                    transition={{ duration: 0.4 }}
                                                    style={{ display: 'flex', gap: '8px' }}
                                                >
                                                    <input
                                                        type="email"
                                                        value={currentInviteEmail}
                                                        onChange={(e) => {
                                                            setCurrentInviteEmail(e.target.value);
                                                            if (emailError) {
                                                                setEmailError(false);
                                                                setEmailErrorMessage('');
                                                            }
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && currentInviteEmail) {
                                                                e.preventDefault();
                                                                addInviteEmail(currentInviteEmail);
                                                            }
                                                        }}
                                                        placeholder="Enter email address..."
                                                        style={{
                                                            flex: 1, padding: '10px 14px', borderRadius: '10px',
                                                            border: `1px solid ${emailError ? '#ef4444' : colors.border}`, 
                                                            background: emailError ? (isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)') : colors.cardBg,
                                                            color: colors.textPrimary, fontSize: '13px', outline: 'none',
                                                            transition: 'all 0.2s ease',
                                                        }}
                                                    />
                                                    <motion.button
                                                        onClick={() => addInviteEmail(currentInviteEmail)}
                                                        disabled={!currentInviteEmail || showEmailAdded || isCheckingEmail}
                                                        whileHover={currentInviteEmail && !showEmailAdded && !isCheckingEmail ? { scale: 1.02, boxShadow: `0 4px 12px ${selectedColor}25` } : {}}
                                                        whileTap={currentInviteEmail && !showEmailAdded && !isCheckingEmail ? { scale: 0.97 } : {}}
                                                        style={{
                                                            padding: '10px 16px', 
                                                            borderRadius: '10px', 
                                                            border: `1px solid ${showEmailAdded ? '#10b98140' : currentInviteEmail ? (isDarkMode ? `${selectedColor}40` : `${selectedColor}30`) : colors.border}`,
                                                            background: showEmailAdded 
                                                                ? (isDarkMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.12)')
                                                                : currentInviteEmail 
                                                                    ? (isDarkMode ? `${selectedColor}20` : `${selectedColor}12`)
                                                                    : colors.cardBg,
                                                            color: showEmailAdded ? '#10b981' : currentInviteEmail ? selectedColor : colors.textMuted,
                                                            fontSize: '12px', 
                                                            fontWeight: 500, 
                                                            cursor: currentInviteEmail && !showEmailAdded && !isCheckingEmail ? 'pointer' : 'not-allowed',
                                                            transition: 'all 0.2s ease',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            minWidth: '60px',
                                                            justifyContent: 'center',
                                                        }}
                                                    >
                                                        <AnimatePresence mode="wait">
                                                            {isCheckingEmail ? (
                                                                <motion.span
                                                                    key="checking"
                                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                                    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                                                                >
                                                                    <motion.svg
                                                                        width="12" height="12" viewBox="0 0 16 16" fill="none"
                                                                        animate={{ rotate: 360 }}
                                                                        transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                                                                    >
                                                                        <circle cx="8" cy="8" r="6" stroke={`${selectedColor}30`} strokeWidth="2" fill="none" />
                                                                        <circle cx="8" cy="8" r="6" stroke={selectedColor} strokeWidth="2" strokeLinecap="round" strokeDasharray="28" strokeDashoffset="21" fill="none" />
                                                                    </motion.svg>
                                                                </motion.span>
                                                            ) : showEmailAdded ? (
                                                                <motion.span
                                                                    key="added"
                                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                                    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                                                                >
                                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                                        <polyline points="20 6 9 17 4 12" />
                                                                    </svg>
                                                                    Added
                                                                </motion.span>
                                                            ) : (
                                                                <motion.span
                                                                    key="add"
                                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                                >
                                                                    Add
                                                                </motion.span>
                                                            )}
                                                        </AnimatePresence>
                                                    </motion.button>
                                                </motion.div>
                                                {/* Error Message */}
                                                <AnimatePresence>
                                                    {emailError && emailErrorMessage && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: -5 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -5 }}
                                                            transition={{ duration: 0.2 }}
                                                            style={{
                                                                marginTop: '6px',
                                                                fontSize: '11px',
                                                                color: '#ef4444',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                            }}
                                                        >
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <circle cx="12" cy="12" r="10" />
                                                                <line x1="12" y1="8" x2="12" y2="12" />
                                                                <line x1="12" y1="16" x2="12.01" y2="16" />
                                                            </svg>
                                                            {emailErrorMessage}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            {/* Added Emails - Detailed Cards Grid with Spring Animation */}
                                            {inviteEmails.length > 0 && (
                                                <motion.div 
                                                    layout
                                                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                                    style={{ marginBottom: '20px' }}
                                                >
                                                    <div style={{ 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'space-between',
                                                        marginBottom: '10px' 
                                                    }}>
                                                        <div style={{ 
                                                            fontSize: '11px', fontWeight: 600, color: colors.textMuted, 
                                                            textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' 
                                                        }}>
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={selectedColor} strokeWidth="2">
                                                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                                                <circle cx="9" cy="7" r="4" />
                                                                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                                            </svg>
                                                            Invites ({inviteEmails.length}{inviteEmails.length >= 80 ? '/80 max' : ''})
                                                        </div>
                                                        {inviteEmails.length > 3 && (
                                                            <motion.button
                                                                onClick={() => setInviteEmails([])}
                                                                whileHover={{ scale: 1.02 }}
                                                                whileTap={{ scale: 0.98 }}
                                                                style={{
                                                                    fontSize: '10px', color: '#ef4444', fontWeight: 500,
                                                                    background: 'rgba(239, 68, 68, 0.1)', border: 'none',
                                                                    padding: '4px 8px', borderRadius: '6px', cursor: 'pointer',
                                                                }}
                                                            >
                                                                Clear All
                                                            </motion.button>
                                                        )}
                                                    </div>
                                                    <motion.div 
                                                        layout
                                                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                                        style={{ 
                                                            display: 'grid', 
                                                            gridTemplateColumns: inviteEmails.length <= 3 
                                                                ? `repeat(${Math.min(inviteEmails.length, 3)}, 1fr)` 
                                                                : 'repeat(3, 1fr)',
                                                            gap: '10px',
                                                            maxHeight: inviteEmails.length > 9 ? '280px' : 'none',
                                                            overflowY: inviteEmails.length > 9 ? 'auto' : 'visible',
                                                            padding: inviteEmails.length > 9 ? '4px' : '0',
                                                        }}
                                                    >
                                                        <AnimatePresence mode="popLayout">
                                                            {inviteEmails.slice(0, 80).map((invite, i) => {
                                                                const initial = invite.name?.charAt(0)?.toUpperCase() || invite.email.charAt(0).toUpperCase();
                                                                const displayName = invite.name || invite.email.split('@')[0].split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
                                                                
                                                                return (
                                                                    <motion.div
                                                                        key={invite.email}
                                                                        layout
                                                                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                        exit={{ opacity: 0, scale: 0.8, y: -10 }}
                                                                        transition={{ 
                                                                            type: 'spring', 
                                                                            stiffness: 500, 
                                                                            damping: 30,
                                                                            delay: i * 0.03 
                                                                        }}
                                                                        whileHover={{ scale: 1.02, y: -3 }}
                                                                        style={{
                                                                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                                            padding: '14px 10px 12px', borderRadius: '14px',
                                                                            background: `linear-gradient(135deg, ${selectedColor}08 0%, ${selectedColor}04 100%)`, 
                                                                            border: `1px solid ${selectedColor}25`,
                                                                            position: 'relative',
                                                                            cursor: 'default',
                                                                            boxShadow: `0 2px 8px ${selectedColor}10`,
                                                                        }}
                                                                    >
                                                                        {/* Remove button */}
                                                                        <motion.button
                                                                            onClick={() => removeInviteEmail(invite.email)}
                                                                            whileHover={{ scale: 1.2, background: 'rgba(239, 68, 68, 0.25)' }}
                                                                            whileTap={{ scale: 0.9 }}
                                                                            style={{
                                                                                position: 'absolute', top: '6px', right: '6px',
                                                                                width: '18px', height: '18px', borderRadius: '5px',
                                                                                border: 'none', background: 'rgba(239, 68, 68, 0.1)', 
                                                                                cursor: 'pointer',
                                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                                color: '#ef4444', opacity: 0.8,
                                                                            }}
                                                                        >
                                                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                                <path d="M18 6L6 18M6 6l12 12" />
                                                                            </svg>
                                                                        </motion.button>
                                                                        
                                                                        {/* Avatar */}
                                                                        <motion.div 
                                                                            initial={{ scale: 0 }}
                                                                            animate={{ scale: 1 }}
                                                                            transition={{ type: 'spring', stiffness: 500, damping: 25, delay: i * 0.03 + 0.1 }}
                                                                            style={{
                                                                                width: '42px', height: '42px', borderRadius: '12px',
                                                                                background: `linear-gradient(135deg, ${selectedColor}35 0%, ${selectedColor}20 100%)`,
                                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                                fontSize: '16px', fontWeight: 700, color: selectedColor,
                                                                                marginBottom: '8px',
                                                                                boxShadow: `0 4px 12px ${selectedColor}20`,
                                                                            }}
                                                                        >
                                                                            {initial}
                                                                        </motion.div>
                                                                        
                                                                        {/* Name */}
                                                                        <span style={{ 
                                                                            fontSize: '11px', color: colors.textPrimary, fontWeight: 600,
                                                                            textAlign: 'center', lineHeight: 1.3,
                                                                            maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis',
                                                                            whiteSpace: 'nowrap', marginBottom: '6px',
                                                                        }}>
                                                                            {displayName.length > 14 ? displayName.slice(0, 12) + '..' : displayName}
                                                                        </span>
                                                                        
                                                                        {/* Badges Row */}
                                                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                                                            {/* Program Badge */}
                                                                            <span style={{
                                                                                padding: '2px 6px', borderRadius: '4px',
                                                                                background: `${selectedColor}18`,
                                                                                color: selectedColor,
                                                                                fontSize: '8px', fontWeight: 600,
                                                                                textTransform: 'uppercase',
                                                                            }}>
                                                                                {invite.program || 'BSIT'}
                                                                            </span>
                                                                            {/* Section Badge */}
                                                                            <span style={{
                                                                                padding: '2px 6px', borderRadius: '4px',
                                                                                background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                                                                                color: colors.textSecondary,
                                                                                fontSize: '8px', fontWeight: 500,
                                                                            }}>
                                                                                {invite.section || 'BSIT101A'}
                                                                            </span>
                                                                        </div>
                                                                    </motion.div>
                                                                );
                                                            })}
                                                        </AnimatePresence>
                                                    </motion.div>
                                                </motion.div>
                                            )}

                                            {/* Quick Add Classmates */}
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2">
                                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                                        <circle cx="9" cy="7" r="4" />
                                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                                    </svg>
                                                    <span style={{ fontSize: '11px', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase' }}>
                                                        Quick Add Classmates
                                                    </span>
                                                </div>
                                                
                                                {/* Search Classmates Input */}
                                                <div style={{ position: 'relative', marginBottom: '12px' }}>
                                                    <svg
                                                        width="16"
                                                        height="16"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke={colors.textMuted}
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        style={{
                                                            position: 'absolute',
                                                            left: '12px',
                                                            top: '50%',
                                                            transform: 'translateY(-50%)',
                                                            pointerEvents: 'none',
                                                            zIndex: 1,
                                                        }}
                                                    >
                                                        <circle cx="11" cy="11" r="8" />
                                                        <path d="m21 21-4.35-4.35" />
                                                    </svg>
                                                    <input
                                                        ref={classmateSearchRef}
                                                        type="text"
                                                        aria-label="Search classmates"
                                                        value={classmateSearchQuery}
                                                        onChange={(e) => {
                                                            setClassmateSearchQuery(e.target.value);
                                                            // Server-side search is triggered by useEffect with debounce
                                                        }}
                                                        onFocus={(e) => {
                                                            e.target.style.borderColor = `${selectedColor}50`;
                                                            e.target.style.boxShadow = `0 0 0 3px ${selectedColor}15`;
                                                        }}
                                                        onBlur={(e) => {
                                                            e.target.style.borderColor = colors.border;
                                                            e.target.style.boxShadow = 'none';
                                                        }}
                                                        placeholder="Search by name, email, section..."
                                                        style={{
                                                            width: '100%',
                                                            padding: '10px 36px 10px 38px',
                                                            borderRadius: '10px',
                                                            border: `1px solid ${colors.border}`,
                                                            background: colors.cardBg,
                                                            color: colors.textPrimary,
                                                            fontSize: '12px',
                                                            outline: 'none',
                                                            transition: 'all 0.2s ease',
                                                        }}
                                                    />
                                                    {/* Right side container for spinner/clear button */}
                                                    <div style={{
                                                        position: 'absolute',
                                                        right: '10px',
                                                        top: 0,
                                                        bottom: 0,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}>
                                                        <AnimatePresence mode="wait">
                                                            {isSearchingClassmates ? (
                                                                <motion.div 
                                                                    key="spinner"
                                                                    initial={{ opacity: 0, scale: 0.5 }} 
                                                                    animate={{ opacity: 1, scale: 1 }} 
                                                                    exit={{ opacity: 0, scale: 0.5 }} 
                                                                    transition={{ duration: 0.15 }}
                                                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                >
                                                                    <motion.svg 
                                                                        width="14" 
                                                                        height="14" 
                                                                        viewBox="0 0 16 16" 
                                                                        fill="none"
                                                                        style={{ display: 'block' }}
                                                                        animate={{ rotate: 360 }} 
                                                                        transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                                                                    >
                                                                        <circle cx="8" cy="8" r="6" stroke={`${selectedColor}30`} strokeWidth="2" fill="none" />
                                                                        <circle cx="8" cy="8" r="6" stroke={selectedColor} strokeWidth="2" strokeLinecap="round" strokeDasharray="28" strokeDashoffset="21" fill="none" />
                                                                    </motion.svg>
                                                                </motion.div>
                                                            ) : classmateSearchQuery ? (
                                                                <motion.button 
                                                                    key="clear"
                                                                    initial={{ opacity: 0, scale: 0.8 }} 
                                                                    animate={{ opacity: 1, scale: 1 }} 
                                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                                    transition={{ duration: 0.15 }}
                                                                    onClick={() => { setClassmateSearchQuery(''); setClassmatesPage(1); }}
                                                                    aria-label="Clear search"
                                                                    style={{ 
                                                                        background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', 
                                                                        border: 'none', 
                                                                        borderRadius: '5px', 
                                                                        width: '18px', 
                                                                        height: '18px',
                                                                        cursor: 'pointer',
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                        color: colors.textMuted,
                                                                        transition: 'all 0.15s ease',
                                                                    }}
                                                                    whileHover={{ scale: 1.1, background: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }}
                                                                    whileTap={{ scale: 0.9 }}
                                                                >
                                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                        <path d="M18 6L6 18M6 6l12 12" />
                                                                    </svg>
                                                                </motion.button>
                                                            ) : null}
                                                        </AnimatePresence>
                                                    </div>
                                                </div>

                                                <motion.div 
                                                    layout="position"
                                                    transition={{ 
                                                        layout: { type: 'spring', stiffness: 300, damping: 30 }
                                                    }}
                                                    style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
                                                >
                                                    {isLoadingClassmates || isSearchingClassmates ? (
                                                        // Loading Skeleton
                                                        <>
                                                            {[1, 2, 3, 4, 5].map((i) => (
                                                                <motion.div
                                                                    key={i}
                                                                    initial={{ opacity: 0 }}
                                                                    animate={{ opacity: 1 }}
                                                                    transition={{ delay: i * 0.05 }}
                                                                    style={{
                                                                        display: 'flex', alignItems: 'center', gap: '12px',
                                                                        padding: '12px 14px', borderRadius: '12px',
                                                                        border: `1px solid ${colors.border}`,
                                                                        background: colors.cardBg,
                                                                    }}
                                                                >
                                                                    {/* Avatar Skeleton */}
                                                                    <motion.div
                                                                        animate={{ opacity: [0.5, 1, 0.5] }}
                                                                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                                                                        style={{
                                                                            width: '40px', height: '40px', borderRadius: '10px',
                                                                            background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                                                            flexShrink: 0,
                                                                        }}
                                                                    />
                                                                    {/* Info Skeleton */}
                                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                                        <motion.div
                                                                            animate={{ opacity: [0.5, 1, 0.5] }}
                                                                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }}
                                                                            style={{
                                                                                width: '60%', height: '14px', borderRadius: '4px',
                                                                                background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                                                                marginBottom: '8px',
                                                                            }}
                                                                        />
                                                                        <div style={{ display: 'flex', gap: '6px' }}>
                                                                            <motion.div
                                                                                animate={{ opacity: [0.5, 1, 0.5] }}
                                                                                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                                                                                style={{
                                                                                    width: '40px', height: '16px', borderRadius: '4px',
                                                                                    background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                                                                }}
                                                                            />
                                                                            <motion.div
                                                                                animate={{ opacity: [0.5, 1, 0.5] }}
                                                                                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                                                                                style={{
                                                                                    width: '50px', height: '16px', borderRadius: '4px',
                                                                                    background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                                                                }}
                                                                            />
                                                                            <motion.div
                                                                                animate={{ opacity: [0.5, 1, 0.5] }}
                                                                                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                                                                                style={{
                                                                                    width: '35px', height: '16px', borderRadius: '4px',
                                                                                    background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    {/* Button Skeleton */}
                                                                    <motion.div
                                                                        animate={{ opacity: [0.5, 1, 0.5] }}
                                                                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                                                                        style={{
                                                                            width: '28px', height: '28px', borderRadius: '8px',
                                                                            background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                                                        }}
                                                                    />
                                                                </motion.div>
                                                            ))}
                                                        </>
                                                    ) : classmates.length === 0 ? (
                                                        <div style={{ 
                                                            padding: '20px', 
                                                            textAlign: 'center', 
                                                            color: colors.textMuted,
                                                            fontSize: '12px',
                                                        }}>
                                                            {classmateSearchQuery.trim() 
                                                                ? `No classmates match "${classmateSearchQuery.length > 20 ? classmateSearchQuery.slice(0, 20) + '...' : classmateSearchQuery}"`
                                                                : 'No classmates found'}
                                                        </div>
                                                    ) : (() => {
                                                        const currentUserEmail = getProfile().email.toLowerCase().trim();
                                                        // Only filter out current user (search is done server-side)
                                                        const filteredClassmates = classmates.filter((c) => {
                                                            return c.email.toLowerCase().trim() !== currentUserEmail;
                                                        });
                                                        
                                                        if (filteredClassmates.length === 0) {
                                                            const truncatedQuery = classmateSearchQuery.length > 20 
                                                                ? classmateSearchQuery.slice(0, 20) + '...' 
                                                                : classmateSearchQuery;
                                                            return (
                                                                <div style={{ 
                                                                    padding: '20px', 
                                                                    textAlign: 'center', 
                                                                    color: colors.textMuted,
                                                                    fontSize: '12px',
                                                                    maxWidth: '100%',
                                                                    overflow: 'hidden',
                                                                }}>
                                                                    No classmates match "{truncatedQuery}"
                                                                </div>
                                                            );
                                                        }
                                                        
                                                        // Pagination logic
                                                        const totalPages = Math.ceil(filteredClassmates.length / classmatesPerPage);
                                                        const startIndex = (classmatesPage - 1) * classmatesPerPage;
                                                        const paginatedClassmates = filteredClassmates.slice(startIndex, startIndex + classmatesPerPage);
                                                        
                                                        return (
                                                            <>
                                                                {paginatedClassmates.map((classmate, index) => {
                                                                    const isAdded = inviteEmails.some(inv => inv.email === classmate.email);
                                                                    const isHovered = hoveredClassmateId === classmate.id;
                                                                    const isRecentlyAdded = recentlyAddedClassmate === classmate.id;
                                                                    return (
                                                                        <motion.button
                                                                            key={classmate.id}
                                                                            layout="position"
                                                                            initial={{ opacity: 0, y: 10 }}
                                                                            animate={{ opacity: 1, y: 0 }}
                                                                            exit={{ opacity: 0, y: -10 }}
                                                                            transition={{ 
                                                                                delay: index * 0.03,
                                                                                layout: { type: 'spring', stiffness: 300, damping: 30 }
                                                                            }}
                                                                            onClick={() => {
                                                                                if (isAdded) {
                                                                                    removeInviteEmail(classmate.email);
                                                                                } else {
                                                                                    addInviteEmail(classmate.email);
                                                                                    setRecentlyAddedClassmate(classmate.id);
                                                                                    setTimeout(() => setRecentlyAddedClassmate(null), 1500);
                                                                                }
                                                                            }}
                                                                            onMouseEnter={() => setHoveredClassmateId(classmate.id)}
                                                                            onMouseLeave={() => setHoveredClassmateId(null)}
                                                                            whileTap={{ scale: 0.98 }}
                                                                            style={{
                                                                                display: 'flex', alignItems: 'center', gap: '12px',
                                                                                padding: '12px 14px', borderRadius: '12px',
                                                                                border: `1px solid ${isAdded ? selectedColor : isHovered ? `${selectedColor}40` : colors.border}`,
                                                                                background: isAdded ? `${selectedColor}08` : isHovered ? `${selectedColor}05` : colors.cardBg,
                                                                                cursor: 'pointer', textAlign: 'left',
                                                                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                                                                transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
                                                                                boxShadow: isHovered ? `0 4px 12px ${selectedColor}15` : 'none',
                                                                            }}
                                                                        >
                                                                            {/* Avatar */}
                                                                            <div style={{
                                                                                width: '40px', height: '40px', borderRadius: '10px',
                                                                                background: `linear-gradient(135deg, ${selectedColor}25 0%, ${selectedColor}10 100%)`,
                                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                                fontSize: '15px', fontWeight: 600, color: selectedColor,
                                                                                flexShrink: 0,
                                                                                transition: 'all 0.25s ease',
                                                                                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                                                                            }}>
                                                                                {classmate.avatar}
                                                                            </div>
                                                                            
                                                                            {/* Info */}
                                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                                <div style={{ 
                                                                                    fontSize: '13px', fontWeight: 600, color: colors.textPrimary,
                                                                                    marginBottom: '4px',
                                                                                    transition: 'color 0.2s ease',
                                                                                }}>
                                                                                    {classmate.name}
                                                                                </div>
                                                                                {/* Badges Row */}
                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                                                    {/* Program Badge */}
                                                                                    <span style={{
                                                                                        padding: '2px 6px', borderRadius: '4px',
                                                                                        background: `${selectedColor}15`,
                                                                                        color: selectedColor,
                                                                                        fontSize: '9px', fontWeight: 600,
                                                                                        textTransform: 'uppercase',
                                                                                        letterSpacing: '0.3px',
                                                                                    }}>
                                                                                        {classmate.program}
                                                                                    </span>
                                                                                    {/* Section Badge */}
                                                                                    <span style={{
                                                                                        padding: '2px 6px', borderRadius: '4px',
                                                                                        background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                                                                                        color: colors.textSecondary,
                                                                                        fontSize: '9px', fontWeight: 500,
                                                                                    }}>
                                                                                        {classmate.section}
                                                                                    </span>
                                                                                    {/* Year Level Badge */}
                                                                                    <span style={{
                                                                                        padding: '2px 6px', borderRadius: '4px',
                                                                                        background: 'rgba(16, 185, 129, 0.1)',
                                                                                        color: '#10b981',
                                                                                        fontSize: '9px', fontWeight: 500,
                                                                                    }}>
                                                                                        {classmate.yearLevel}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            
                                                                            {/* Add Button */}
                                                                            <motion.div 
                                                                                animate={isRecentlyAdded ? { scale: [1, 1.2, 1] } : {}}
                                                                                transition={{ duration: 0.3 }}
                                                                                style={{
                                                                                    width: '28px', height: '28px', borderRadius: '8px',
                                                                                    background: isAdded 
                                                                                        ? (isRecentlyAdded ? '#10b981' : selectedColor)
                                                                                        : isHovered 
                                                                                            ? `${selectedColor}20` 
                                                                                            : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                                    transition: 'all 0.25s ease',
                                                                                    transform: isHovered && !isAdded ? 'scale(1.1)' : 'scale(1)',
                                                                                }}
                                                                            >
                                                                                <AnimatePresence mode="wait">
                                                                                    {isAdded ? (
                                                                                        <motion.svg 
                                                                                            key="check"
                                                                                            initial={{ opacity: 0, scale: 0.5 }}
                                                                                            animate={{ opacity: 1, scale: 1 }}
                                                                                            exit={{ opacity: 0, scale: 0.5 }}
                                                                                            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"
                                                                                        >
                                                                                            <polyline points="20 6 9 17 4 12" />
                                                                                        </motion.svg>
                                                                                    ) : (
                                                                                        <motion.svg 
                                                                                            key="plus"
                                                                                            initial={{ opacity: 0, scale: 0.5 }}
                                                                                            animate={{ opacity: 1, scale: 1 }}
                                                                                            exit={{ opacity: 0, scale: 0.5 }}
                                                                                            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isHovered ? selectedColor : colors.textMuted} strokeWidth="2"
                                                                                        >
                                                                                            <line x1="12" y1="5" x2="12" y2="19" />
                                                                                            <line x1="5" y1="12" x2="19" y2="12" />
                                                                                        </motion.svg>
                                                                                    )}
                                                                                </AnimatePresence>
                                                                            </motion.div>
                                                                        </motion.button>
                                                                    );
                                                                })}
                                                                
                                                                {/* Pagination Controls */}
                                                                {totalPages > 1 && (
                                                                    <motion.div 
                                                                        layout="position"
                                                                        initial={{ opacity: 0, y: 10 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        transition={{ 
                                                                            delay: 0.15,
                                                                            layout: { type: 'spring', stiffness: 300, damping: 30 }
                                                                        }}
                                                                        style={{
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                            gap: '8px', marginTop: '12px', paddingTop: '12px',
                                                                            borderTop: `1px solid ${colors.border}`,
                                                                        }}
                                                                    >
                                                                        {/* Previous Button */}
                                                                        <motion.button
                                                                            onClick={() => setClassmatesPage(Math.max(1, classmatesPage - 1))}
                                                                            disabled={classmatesPage === 1}
                                                                            whileHover={classmatesPage !== 1 ? { scale: 1.05 } : {}}
                                                                            whileTap={classmatesPage !== 1 ? { scale: 0.95 } : {}}
                                                                            style={{
                                                                                padding: '6px 10px', borderRadius: '8px',
                                                                                border: `1px solid ${colors.border}`,
                                                                                background: classmatesPage === 1 ? 'transparent' : colors.cardBg,
                                                                                color: classmatesPage === 1 ? colors.textMuted : colors.textSecondary,
                                                                                fontSize: '11px', fontWeight: 500,
                                                                                cursor: classmatesPage === 1 ? 'not-allowed' : 'pointer',
                                                                                opacity: classmatesPage === 1 ? 0.5 : 1,
                                                                                display: 'flex', alignItems: 'center', gap: '4px',
                                                                                transition: 'all 0.2s ease',
                                                                            }}
                                                                        >
                                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                                <path d="M15 18l-6-6 6-6" />
                                                                            </svg>
                                                                            Prev
                                                                        </motion.button>
                                                                        
                                                                        {/* Page Info */}
                                                                        <span style={{
                                                                            fontSize: '11px', color: colors.textMuted,
                                                                            padding: '6px 12px', borderRadius: '8px',
                                                                            background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                                                        }}>
                                                                            {classmatesPage} / {totalPages}
                                                                        </span>
                                                                        
                                                                        {/* Next Button */}
                                                                        <motion.button
                                                                            onClick={() => setClassmatesPage(Math.min(totalPages, classmatesPage + 1))}
                                                                            disabled={classmatesPage === totalPages}
                                                                            whileHover={classmatesPage !== totalPages ? { scale: 1.05 } : {}}
                                                                            whileTap={classmatesPage !== totalPages ? { scale: 0.95 } : {}}
                                                                            style={{
                                                                                padding: '6px 10px', borderRadius: '8px',
                                                                                border: `1px solid ${colors.border}`,
                                                                                background: classmatesPage === totalPages ? 'transparent' : colors.cardBg,
                                                                                color: classmatesPage === totalPages ? colors.textMuted : colors.textSecondary,
                                                                                fontSize: '11px', fontWeight: 500,
                                                                                cursor: classmatesPage === totalPages ? 'not-allowed' : 'pointer',
                                                                                opacity: classmatesPage === totalPages ? 0.5 : 1,
                                                                                display: 'flex', alignItems: 'center', gap: '4px',
                                                                                transition: 'all 0.2s ease',
                                                                            }}
                                                                        >
                                                                            Next
                                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                                <path d="M9 18l6-6-6-6" />
                                                                            </svg>
                                                                        </motion.button>
                                                                    </motion.div>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </motion.div>
                                            </div>
                                        </motion.div>
                                    ) : null}
                                </AnimatePresence>
                            </motion.div>

                            {/* Footer */}
                            <div style={{
                                padding: '16px 24px', borderTop: `1px solid ${colors.border}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            }}>
                                {step > 1 ? (
                                    <motion.button
                                        onClick={() => setStep(step - 1)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        style={{
                                            padding: '10px 16px', borderRadius: '10px',
                                            border: `1px solid ${colors.border}`, background: 'transparent',
                                            color: colors.textSecondary, fontSize: '13px', fontWeight: 500,
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                                        }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M19 12H5M12 19l-7-7 7-7" />
                                        </svg>
                                        Back
                                    </motion.button>
                                ) : (
                                    <div />
                                )}
                                
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {step === 2 && (
                                        <motion.button
                                            onClick={handleCreate}
                                            disabled={!canProceed || isCreating}
                                            whileHover={canProceed ? { scale: 1.02 } : {}}
                                            whileTap={canProceed ? { scale: 0.98 } : {}}
                                            style={{
                                                padding: '10px 16px', borderRadius: '10px',
                                                border: `1px solid ${colors.border}`, background: 'transparent',
                                                color: colors.textSecondary, fontSize: '13px', fontWeight: 500,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            Skip & Create
                                        </motion.button>
                                    )}
                                    <motion.button
                                        onClick={() => {
                                            if (step < totalSteps) {
                                                setStep(step + 1);
                                            } else {
                                                handleCreate();
                                            }
                                        }}
                                        disabled={!canProceed || isCreating}
                                        whileHover={canProceed ? { scale: 1.03, boxShadow: `0 6px 20px ${selectedColor}30` } : {}}
                                        whileTap={canProceed ? { scale: 0.97 } : {}}
                                        style={{
                                            padding: '10px 18px', 
                                            borderRadius: '10px', 
                                            border: `1px solid ${canProceed ? (isDarkMode ? `${selectedColor}40` : `${selectedColor}30`) : 'transparent'}`,
                                            background: canProceed
                                                ? (isDarkMode ? `${selectedColor}20` : `${selectedColor}12`)
                                                : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                                            color: canProceed ? selectedColor : colors.textMuted,
                                            fontSize: '13px', 
                                            fontWeight: 500, 
                                            cursor: canProceed ? 'pointer' : 'not-allowed',
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '6px',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        {isCreating ? (
                                            <>
                                                <motion.svg
                                                    width="14" height="14" viewBox="0 0 16 16" fill="none"
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                                                >
                                                    <circle cx="8" cy="8" r="6" stroke={`${selectedColor}30`} strokeWidth="2" fill="none" />
                                                    <circle cx="8" cy="8" r="6" stroke={selectedColor} strokeWidth="2" strokeLinecap="round" strokeDasharray="28" strokeDashoffset="21" fill="none" />
                                                </motion.svg>
                                                Creating...
                                            </>
                                        ) : step < totalSteps ? (
                                            <>
                                                {step === 2 ? 'Invite Friends' : 'Continue'}
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                                </svg>
                                            </>
                                        ) : (
                                            <>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <line x1="12" y1="5" x2="12" y2="19" />
                                                    <line x1="5" y1="12" x2="19" y2="12" />
                                                </svg>
                                                Create Group{inviteEmails.length > 0 ? ` & Invite ${inviteEmails.length}` : ''}
                                            </>
                                        )}
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Portal Tooltip - Renders outside modal to avoid clipping */}
                    {hoveredTooltip && createPortal(
                        <motion.div
                            ref={tooltipRef}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            style={{
                                position: 'fixed',
                                left: hoveredTooltip.x,
                                top: hoveredTooltip.y - 10,
                                x: '-50%',
                                y: '-100%',
                                padding: '8px 12px',
                                background: '#ffffff',
                                borderRadius: '8px',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: hoveredTooltip.color,
                                whiteSpace: 'nowrap',
                                pointerEvents: 'none',
                                zIndex: 99999,
                            }}
                        >
                            {hoveredTooltip.text}
                            {/* Tooltip Arrow */}
                            <div style={{
                                position: 'absolute',
                                bottom: '-4px',
                                left: '50%',
                                transform: 'translateX(-50%) rotate(45deg)',
                                width: '8px',
                                height: '8px',
                                background: '#ffffff',
                                boxShadow: '2px 2px 4px rgba(0,0,0,0.08)',
                            }} />
                        </motion.div>,
                        document.body
                    )}
                    
                    {/* Undo Remove Toast */}
                    {createPortal(
                        <AnimatePresence>
                            {showUndoToast && removedInvite && (
                                <motion.div
                                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 20, scale: 0.9 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                    style={{
                                        position: 'fixed',
                                        bottom: '24px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        padding: '12px 16px',
                                        background: isDarkMode ? '#1e293b' : '#ffffff',
                                        borderRadius: '12px',
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                                        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        zIndex: 99999,
                                    }}
                                >
                                    <div style={{
                                        width: '32px', height: '32px', borderRadius: '8px',
                                        background: `${selectedColor}15`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '13px', fontWeight: 600, color: selectedColor,
                                    }}>
                                        {removedInvite.name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '12px', fontWeight: 500, color: colors.textPrimary }}>
                                            Removed {removedInvite.name?.split(' ')[0] || 'invite'}
                                        </p>
                                        <p style={{ margin: 0, fontSize: '10px', color: colors.textMuted }}>
                                            {removedInvite.email}
                                        </p>
                                    </div>
                                    <motion.button
                                        onClick={undoRemoveInvite}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        style={{
                                            padding: '6px 12px', borderRadius: '8px',
                                            border: 'none', background: selectedColor,
                                            color: 'white', fontSize: '11px', fontWeight: 600,
                                            cursor: 'pointer', marginLeft: '8px',
                                        }}
                                    >
                                        Undo
                                    </motion.button>
                                    <motion.button
                                        onClick={() => { setShowUndoToast(false); setRemovedInvite(null); }}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        style={{
                                            width: '20px', height: '20px', borderRadius: '6px',
                                            border: 'none', background: 'transparent',
                                            color: colors.textMuted, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M18 6L6 18M6 6l12 12" />
                                        </svg>
                                    </motion.button>
                                </motion.div>
                            )}
                        </AnimatePresence>,
                        document.body
                    )}
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};
