import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { ColorPicker } from '../../../../../components/ui/color-picker';
import { createPortal } from 'react-dom';
import { supabase, isSupabaseConfigured } from '../../../../../lib/supabase';
import { getProfile } from '../../../../../services/profileService';
import { type GroupCategory } from '../../../../../services/groupsService';
import { getClassmates as getLocalClassmates } from '../../../../../services/usersService';
import { AnimatedCircularProgressBar } from '../../../../../components/ui/animated-circular-progress-bar';
import GroupIcon from '../components/GroupIcon';
import { X, ChevronRight, Check, Users, Link as LinkIcon, Search, AlertCircle, Copy, HelpCircle, Briefcase, Plus, Book, Code, MessagesSquare, BookOpen, GraduationCap, Trash2 } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem } from '../../../../../components/ui/carousel';
import { UiverseSwitch } from '../../../../../components/ui/UiverseSwitch';
import { triggerGlobalToast } from '../../../components/DailyInspirationToast';

interface CreateGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
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
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose, onCreateGroup }) => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    const [step, setStep] = useState(1);
    
    // Core Form States
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<GroupCategory>('project');
    const [selectedIcon, setSelectedIcon] = useState('users');
    const [selectedColor, setSelectedColor] = useState('#3b82f6');
    const [maxMembers, setMaxMembers] = useState(10);
    const [isPrivate, setIsPrivate] = useState(false);
    
    // Course and Avatar
    const [selectedCourse, setSelectedCourse] = useState<{ id: string; title: string; shortTitle: string } | null>(null);
    const [showCourseDropdown, setShowCourseDropdown] = useState(false);
    const [groupAvatar, setGroupAvatar] = useState<string | null>(null);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [imageError, setImageError] = useState<{type: 'size' | 'inappropriate' | 'warning' | null, message: string}>({ type: null, message: '' });
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const courseDropdownRef = useRef<HTMLDivElement>(null);
    const [hoveredCourseId, setHoveredCourseId] = useState<string | null>(null);
    const [hoveredCategory, setHoveredCategory] = useState<GroupCategory | null>(null);
    const [hoveredColor, setHoveredColor] = useState<string | null>(null);
    const [hoveredIconId, setHoveredIconId] = useState<string | null>(null);
    const [hoveredPreset, setHoveredPreset] = useState<number | null>(null);
    
    // Teammate Invitation States
    const [inviteEmails, setInviteEmails] = useState<{
        email: string;
        name: string;
        section: string;
        program: string;
        profile_image?: string;
        level?: number;
        progress?: number;
    }[]>([]);
    const [currentInviteEmail, setCurrentInviteEmail] = useState('');
    const [emailError, setEmailError] = useState(false);
    const [emailErrorMessage, setEmailErrorMessage] = useState('');
    const [isCheckingEmail, setIsCheckingEmail] = useState(false);
    const [showEmailAdded, setShowEmailAdded] = useState(false);
    
    // Classmates Search
    const [classmates, setClassmates] = useState<{ 
        id: string; 
        name: string; 
        email: string; 
        avatar: string;
        section: string;
        program: string;
        profile_image?: string;
        level?: number;
        progress?: number;
    }[]>([]);
    const [classmateSearchQuery, setClassmateSearchQuery] = useState('');
    const [isSearchingClassmates, setIsSearchingClassmates] = useState(false);
    const [classmatesPage, setClassmatesPage] = useState(1);
    const classmatesPerPage = 4;
    const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

    // Shareable Link
    const [inviteLink, setInviteLink] = useState<string | null>(null);
    const [showInviteLinkCopied, setShowInviteLinkCopied] = useState(false);

    // Success and loading animation
    const [showAllMembers, setShowAllMembers] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    
    // Auto-resizing classmates card container
    const [classmatesContainerHeight, setClassmatesContainerHeight] = useState<number | 'auto'>('auto');
    const classmatesContentRef = useRef<HTMLDivElement>(null);

    // Quick Start Presets
    const presets = [
        { name: 'Capstone', description: 'Final year thesis or capstone team project', category: 'project' as GroupCategory, icon: 'star', color: '#f59e0b', maxMembers: 5 },
        { name: 'Web', description: 'Collaborate on programming and coding assignments', category: 'project' as GroupCategory, icon: 'code', color: '#3b82f6', maxMembers: 6 },
        { name: 'Research', description: 'Collaborate on academic research papers and literature reviews', category: 'project' as GroupCategory, icon: 'book', color: '#8b5cf6', maxMembers: 4 },
        { name: 'Presentation', description: 'Work on slides, scripts, and group presentations', category: 'project' as GroupCategory, icon: 'users', color: '#10b981', maxMembers: 8 },
        { name: 'Group Project', description: 'General purpose collaborative team workspace', category: 'project' as GroupCategory, icon: 'briefcase', color: '#ec4899', maxMembers: 10 },
        { name: 'Custom (Specify)', description: 'Create and specify your own custom group', category: 'general' as GroupCategory, icon: 'edit', color: '#64748b', maxMembers: 10 },
    ];

    const enrolledCourses = [
        { id: 'cp1', title: 'Computer Programming 1', shortTitle: 'CP1', description: 'Fundamental concepts of programming and logic formulation' },
        { id: 'itc', title: 'Introduction to Computing', shortTitle: 'ITC', description: 'Introduction to computer systems, hardware, and digital literacy' },
        { id: 'euth1', title: 'Euthenics 1', shortTitle: 'EUTH1', description: 'Personal development, ethics, and values education' },
        { id: 'purcom', title: 'Purposive Communication', shortTitle: 'PURCOM', description: 'Communication principles for professional and academic contexts' },
        { id: 'tcw', title: 'The Contemporary World', shortTitle: 'TCW', description: 'Global systems, economic trends, and international relations' },
        { id: 'uts', title: 'Understanding the Self', shortTitle: 'UTS', description: 'Self-exploration, psychology, and holistic development' },
        { id: 'ppc', title: 'Philippine Popular Culture', shortTitle: 'PPC', description: 'Philippine media, culture, art, and national identity' },
        { id: 'pe1', title: 'P.E./PATHFIT 1', shortTitle: 'PE1', description: 'Physical fitness, health education, and PATHFIT courses' },
        { id: 'nstp1', title: 'NSTP 1', shortTitle: 'NSTP1', description: 'National Service Training Program civic service learning' },
    ];

    const hoveredIndex = hoveredCourseId === 'clear' 
        ? 0 
        : enrolledCourses.findIndex(c => c.id === hoveredCourseId) !== -1
            ? (selectedCourse ? enrolledCourses.findIndex(c => c.id === hoveredCourseId) + 1 : enrolledCourses.findIndex(c => c.id === hoveredCourseId))
            : -1;

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

    const iconOptions = [
        { id: 'users', label: 'Team' },
        { id: 'book', label: 'Study' },
        { id: 'code', label: 'Code' },
        { id: 'chat', label: 'Discuss' },
        { id: 'check', label: 'Review' },
        { id: 'grid', label: 'General' },
    ];

    const categoryOptions: { id: GroupCategory; label: string; description: string; icon: React.ReactNode }[] = [
        { 
            id: 'project', 
            label: 'Project Team', 
            description: 'Dedicated workspace for group projects, task delegation, and collaborative output.',
            icon: <Briefcase size={20} strokeWidth={2.5} />
        },
        { 
            id: 'study', 
            label: 'Study Group', 
            description: 'A collaborative environment to share notes, discuss lectures, and prepare for exams.',
            icon: <Book size={20} strokeWidth={2.5} />
        },
        { 
            id: 'review', 
            label: 'Exam Prep', 
            description: 'Focused study space with a goal-oriented setup to ace upcoming midterms or finals.',
            icon: <Check size={20} strokeWidth={2.5} />
        },
        { 
            id: 'discussion', 
            label: 'Discussion', 
            description: 'Open forum for brainstorming, Q&A, and casual academic discourse.',
            icon: <MessagesSquare size={20} strokeWidth={2.5} />
        },
    ];

    // Load initial classmates
    useEffect(() => {
        if (!isOpen) return;
        
        const fetchClassmates = async () => {
            setIsSearchingClassmates(true);
            try {
                if (isSupabaseConfigured() && supabase) {
                    const { data, error } = await supabase
                        .from('students')
                        .select('id, full_name, email, section, program, profile_image')
                        .eq('is_active', true)
                        .order('full_name', { ascending: true })
                        .limit(40);
                    
                    if (!error && data) {
                        setClassmates(data.map(student => {
                            const nameSum = (student.full_name || '').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
                            const calculatedLevel = (nameSum % 10) + 1;
                            const calculatedProgress = (nameSum % 80) + 10;
                            return {
                                id: student.id,
                                name: student.full_name,
                                email: student.email || '',
                                avatar: student.full_name?.charAt(0)?.toUpperCase() || '?',
                                section: student.section || 'N/A',
                                program: student.program || 'N/A',
                                profile_image: student.profile_image,
                                level: calculatedLevel,
                                progress: calculatedProgress
                            };
                        }));
                        setIsSearchingClassmates(false);
                        return;
                    }
                }
                
                // Local fallback
                const localData = await getLocalClassmates();
                setClassmates(localData.map(c => {
                    const nameSum = (c.full_name || '').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
                    const calculatedLevel = c.level || (nameSum % 10) + 1;
                    const calculatedProgress = c.xp ? (c.xp % 100) : (nameSum % 80) + 10;
                    return {
                        id: c.id,
                        name: c.full_name,
                        email: c.email || '',
                        avatar: c.full_name?.charAt(0)?.toUpperCase() || '?',
                        section: c.section || 'N/A',
                        program: c.program || 'N/A',
                        profile_image: c.profile_image,
                        level: calculatedLevel,
                        progress: calculatedProgress
                    };
                }));
            } catch (err) {
                console.error('Error fetching classmates:', err);
            }
            setIsSearchingClassmates(false);
        };
        fetchClassmates();
    }, [isOpen]);

    // Search debounced effect
    useEffect(() => {
        if (!isOpen) return;
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        
        setIsSearchingClassmates(true);
        searchDebounceRef.current = setTimeout(async () => {
            try {
                if (isSupabaseConfigured() && supabase) {
                    let query = supabase
                        .from('students')
                        .select('id, full_name, email, section, program, profile_image')
                        .eq('is_active', true);
                    
                    if (classmateSearchQuery.trim()) {
                        const q = classmateSearchQuery.trim().toLowerCase();
                        query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,section.ilike.%${q}%,program.ilike.%${q}%`);
                    }
                    
                    const { data, error } = await query.order('full_name', { ascending: true }).limit(40);
                    
                    if (!error && data) {
                        setClassmates(data.map(student => {
                            const nameSum = (student.full_name || '').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
                            const calculatedLevel = (nameSum % 10) + 1;
                            const calculatedProgress = (nameSum % 80) + 10;
                            return {
                                id: student.id,
                                name: student.full_name,
                                email: student.email || '',
                                avatar: student.full_name?.charAt(0)?.toUpperCase() || '?',
                                section: student.section || 'N/A',
                                program: student.program || 'N/A',
                                profile_image: student.profile_image,
                                level: calculatedLevel,
                                progress: calculatedProgress
                            };
                        }));
                        setClassmatesPage(1);
                        setIsSearchingClassmates(false);
                        return;
                    }
                }
                
                // Local search fallback
                const localData = await getLocalClassmates();
                let filtered = localData;
                if (classmateSearchQuery.trim()) {
                    const q = classmateSearchQuery.trim().toLowerCase();
                    filtered = localData.filter(c => 
                        c.full_name.toLowerCase().includes(q) || 
                        c.email?.toLowerCase().includes(q) || 
                        c.section?.toLowerCase().includes(q) || 
                        c.program?.toLowerCase().includes(q)
                    );
                }
                
                setClassmates(filtered.map(c => {
                    const nameSum = (c.full_name || '').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
                    const calculatedLevel = c.level || (nameSum % 10) + 1;
                    const calculatedProgress = c.xp ? (c.xp % 100) : (nameSum % 80) + 10;
                    return {
                        id: c.id,
                        name: c.full_name,
                        email: c.email || '',
                        avatar: c.full_name?.charAt(0)?.toUpperCase() || '?',
                        section: c.section || 'N/A',
                        program: c.program || 'N/A',
                        profile_image: c.profile_image,
                        level: calculatedLevel,
                        progress: calculatedProgress
                    };
                }));
                setClassmatesPage(1);
            } catch (err) {
                console.error('Error searching classmates:', err);
            }
            setIsSearchingClassmates(false);
        }, 300);
        
        return () => {
            if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        };
    }, [classmateSearchQuery, isOpen]);

    // Sync search input to classmate search query
    useEffect(() => {
        setClassmateSearchQuery(currentInviteEmail);
    }, [currentInviteEmail]);

    // Reset when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setName('');
            setDescription('');
            setCategory('project');
            setSelectedIcon('users');
            setSelectedColor('#3b82f6');
            setMaxMembers(10);
            setIsPrivate(false);
            setInviteEmails([]);
            setCurrentInviteEmail('');
            setInviteLink(null);
            setGroupAvatar(null);
            setSelectedCourse(null);
        }
    }, [isOpen]);

    // Keydown handlers
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            const target = e.target as HTMLElement;
            const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
            
            if (e.key === 'Escape') {
                e.preventDefault();
                if (step > 1) setStep(step - 1);
                else onClose();
            }
            if (e.key === 'Enter' && !isInputFocused) {
                e.preventDefault();
                if (step === 1 && name.trim().length >= 3) {
                    setStep(2);
                } else if (step === 2 && !isCreating) {
                    handleCreate();
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, step, name, isCreating]);

    // Handle course dropdown click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (courseDropdownRef.current && !courseDropdownRef.current.contains(event.target as Node)) {
                setShowCourseDropdown(false);
            }
        };
        if (showCourseDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showCourseDropdown]);

    // Classmates container height auto-observer for smooth height transitions
    useEffect(() => {
        if (!isOpen) return;
        const element = classmatesContentRef.current;
        if (!element) return;

        const observer = new ResizeObserver((entries) => {
            if (!entries || entries.length === 0) return;
            const rect = entries[0].contentRect;
            // The card container has padding-top and padding-bottom of p-2 (8px + 8px = 16px)
            setClassmatesContainerHeight(rect.height + 16);
        });

        observer.observe(element);
        return () => observer.disconnect();
    }, [isOpen, step, classmatesPage, isSearchingClassmates, classmates.length, inviteEmails.length]);

    // Reset container height when changing steps or opening/closing modal
    useEffect(() => {
        setClassmatesContainerHeight('auto');
    }, [step, isOpen]);

    // Apply Presets (One-click Quick Fill)
    const applyPreset = (preset: typeof presets[0]) => {
        if (preset.name === 'Custom (Specify)') {
            setName('');
            setDescription('');
            setCategory(preset.category);
            setSelectedIcon(preset.icon as GroupIconType);
            setSelectedColor(preset.color);
            return;
        }
        setName(preset.name);
        setDescription(preset.description);
        setCategory(preset.category);
        setSelectedIcon(preset.icon as GroupIconType);
        setSelectedColor(preset.color);
        setMaxMembers(preset.maxMembers);
    };

    // Form validation
    const isValidEmail = (email: string): boolean => {
        return /^[^\s@]+@meycauayan\.sti\.edu\.ph$/i.test(email);
    };

    const addInviteEmail = async (email: string) => {
        setEmailError(false);
        setEmailErrorMessage('');
        
        if (!email.trim()) return;
        const normalized = email.toLowerCase().trim();
        const currentUser = getProfile();
        
        if (!isValidEmail(normalized)) {
            setEmailError(true);
            setEmailErrorMessage('Only @meycauayan.sti.edu.ph emails allowed');
            return;
        }

        if (currentUser && normalized === currentUser.email?.toLowerCase().trim()) {
            setEmailError(true);
            setEmailErrorMessage("You cannot invite yourself");
            return;
        }

        if (inviteEmails.some(inv => inv.email === normalized)) {
            setEmailError(true);
            setEmailErrorMessage('Already invited');
            return;
        }

        setIsCheckingEmail(true);
        try {
            if (isSupabaseConfigured() && supabase) {
                const { data, error } = await supabase
                    .from('students')
                    .select('full_name, section, program')
                    .eq('email', normalized)
                    .single();
                
                if (!error && data) {
                    const nameSum = (data.full_name || '').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
                    setInviteEmails(prev => [...prev, {
                        email: normalized,
                        name: data.full_name || 'Classmate',
                        section: data.section || 'N/A',
                        program: data.program || 'N/A',
                        profile_image: data.profile_image,
                        level: data.level || (nameSum % 10) + 1,
                        progress: data.xp ? (data.xp % 100) : (nameSum % 80) + 10
                    }]);
                    setCurrentInviteEmail('');
                    setShowEmailAdded(true);
                    setTimeout(() => setShowEmailAdded(false), 1500);
                } else {
                    setEmailError(true);
                    setEmailErrorMessage('Student not found in STI database');
                }
            } else {
                // Config fallback
                const localData = await getLocalClassmates();
                const matched = localData.find(c => c.email?.toLowerCase().trim() === normalized);
                
                if (matched) {
                    const nameSum = (matched.full_name || '').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
                    setInviteEmails(prev => [...prev, {
                        email: normalized,
                        name: matched.full_name,
                        section: matched.section || 'N/A',
                        program: matched.program || 'N/A',
                        profile_image: matched.profile_image,
                        level: matched.level || (nameSum % 10) + 1,
                        progress: matched.xp ? (matched.xp % 100) : (nameSum % 80) + 10
                    }]);
                    setCurrentInviteEmail('');
                    setShowEmailAdded(true);
                    setTimeout(() => setShowEmailAdded(false), 1500);
                } else {
                    // Fallback formatting for other valid meycauayan emails
                    const namePart = normalized.split('@')[0];
                    const capitalized = namePart
                        .split('.')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');
                    
                    const nameSum = capitalized.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
                    setInviteEmails(prev => [...prev, {
                        email: normalized,
                        name: capitalized,
                        section: 'N/A',
                        program: 'N/A',
                        level: (nameSum % 10) + 1,
                        progress: (nameSum % 80) + 10
                    }]);
                    setCurrentInviteEmail('');
                    setShowEmailAdded(true);
                    setTimeout(() => setShowEmailAdded(false), 1500);
                }
            }
        } catch (err) {
            setEmailError(true);
            setEmailErrorMessage('Error looking up classmate');
        } finally {
            setIsCheckingEmail(false);
        }
    };

    const addClassmate = (c: typeof classmates[0]) => {
        if (inviteEmails.some(inv => inv.email === c.email)) return;
        setInviteEmails(prev => [...prev, {
            email: c.email,
            name: c.name,
            section: c.section,
            program: c.program,
            profile_image: c.profile_image,
            level: c.level,
            progress: c.progress
        }]);
    };

    const removeInviteEmail = (email: string) => {
        setInviteEmails(prev => prev.filter(inv => inv.email !== email));
    };

    const generateInviteLink = () => {
        const id = Math.random().toString(36).substring(2, 10);
        setInviteLink(`${window.location.origin}/join/${id}`);
    };

    const copyInviteLink = async () => {
        if (inviteLink) {
            await navigator.clipboard.writeText(inviteLink);
            setShowInviteLinkCopied(true);
            setTimeout(() => setShowInviteLinkCopied(false), 2000);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file size (2MB limit)
            if (file.size > 2 * 1024 * 1024) {
                setImageError({ type: 'size', message: 'File is too large! Maximum size is 2MB.' });
                setGroupAvatar(null);
                if (avatarInputRef.current) avatarInputRef.current.value = '';
                return;
            }

            // Reset error state and begin MiMo 2.5 scanning simulation
            setImageError({ type: null, message: '' });
            setIsUploadingAvatar(true);

            // Mock MiMo 2.5 Image Processing Delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Mock Inappropriate Image Detection (For demonstration, trigger if filename contains certain words)
            const lowerName = file.name.toLowerCase();
            const isBad = lowerName.includes('bad') || lowerName.includes('nsfw') || lowerName.includes('inappropriate');
            
            if (isBad) {
                setIsUploadingAvatar(false);
                setImageError({ 
                    type: 'inappropriate', 
                    message: '⚠️ MiMo 2.5 Security: Inappropriate image detected. This has been automatically reported to the Admin and your Teachers.' 
                });
                setGroupAvatar(null);
                if (avatarInputRef.current) avatarInputRef.current.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                const img = new Image();
                img.onload = () => {
                    if (img.width !== 256 || img.height !== 256) {
                        setImageError({ type: 'warning', message: `Image is ${img.width}x${img.height}. We recommend 256x256px for the best display.` });
                    }
                    setGroupAvatar(result);
                    setIsUploadingAvatar(false);
                };
                img.src = result;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCreate = async () => {
        if (!name.trim()) return;
        setIsCreating(true);
        
        // Simulating submission delay
        await new Promise(resolve => setTimeout(resolve, 850));
        
        triggerGlobalToast('group_created', { title: 'Group Card Created!', message: 'Initializing workspace and channels...' });
        
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

        setIsCreating(false);
        onClose();
    };

    // Paginated filtered classmates
    const filteredClassmates = classmates.filter(c => !inviteEmails.some(inv => inv.email === c.email));
    const totalPages = Math.ceil(filteredClassmates.length / classmatesPerPage);
    const paginatedClassmates = filteredClassmates.slice((classmatesPage - 1) * classmatesPerPage, classmatesPage * classmatesPerPage);

    // Added members collapsing logic
    const shouldCollapse = inviteEmails.length > 7;
    const displayLimit = inviteEmails.length > 10 ? 8 : 6;
    const visibleMembers = shouldCollapse && !showAllMembers 
        ? inviteEmails.slice(0, displayLimit) 
        : inviteEmails;

    // Auto-minimizing header state
    const [isMinimized, setIsMinimized] = useState(false);
    const lastScrollY = useRef(0);
    const scrollDirection = useRef<'up' | 'down' | null>(null);
    const anchorScrollY = useRef(0);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const currentScrollY = e.currentTarget.scrollTop;
        
        // Handle iOS rubber banding / top of scroll
        if (currentScrollY <= 10) {
            setIsMinimized(false);
            lastScrollY.current = currentScrollY;
            scrollDirection.current = null;
            anchorScrollY.current = currentScrollY;
            return;
        }

        const delta = currentScrollY - lastScrollY.current;
        
        if (delta > 0) {
            if (scrollDirection.current !== 'down') {
                scrollDirection.current = 'down';
                anchorScrollY.current = lastScrollY.current;
            }
            if (currentScrollY - anchorScrollY.current > 30) {
                setIsMinimized(true);
            }
        } else if (delta < 0) {
            if (scrollDirection.current !== 'up') {
                scrollDirection.current = 'up';
                anchorScrollY.current = lastScrollY.current;
            }
            // Do not expand just by scrolling up. Only expand at the very top.
        }

        lastScrollY.current = currentScrollY;
    }, []);
    const livePreviewCard = (
        <div className="flex flex-col w-full mt-auto relative z-10 pt-6 border-t border-zinc-200/50 dark:border-zinc-800/50">
            <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">Live Preview</div>
            <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-[20px] border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm transition-all duration-300">
                <div className="w-12 h-12 rounded-[14px] bg-zinc-100/80 dark:bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0 border border-zinc-200/50 dark:border-zinc-700/50">
                    {groupAvatar ? <img src={groupAvatar} className="w-full h-full object-cover" /> : <GroupIcon icon={selectedIcon} color={selectedColor} size={22} />}
                </div>
                <div className="overflow-hidden flex-1 min-w-0">
                    <div className="text-[15px] font-bold text-zinc-900 dark:text-white truncate mb-0.5">{name || 'Unnamed Group'}</div>
                    <div className="text-[13px] text-zinc-500 dark:text-zinc-400 truncate font-medium">{description || 'No description yet'}</div>
                </div>
            </div>
        </div>
    );

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-0 sm:p-5">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'absolute', inset: 0,
                            background: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.55)',
                            backdropFilter: 'blur(12px)',
                        }}
                    />

                    {/* Success Animation Overlay Removed - Now using Toast */}

                    {/* Side-by-Side Modal Box */}
                    <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                        className="relative w-full max-w-[1080px] h-[100dvh] sm:h-auto sm:max-h-[95vh] md:h-[720px] bg-white dark:bg-[#0f172a] rounded-none sm:rounded-[24px] shadow-2xl border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden flex flex-col md:flex-row pointer-events-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* LEFT SIDEBAR (Hidden on mobile, 340px on PC) */}
                        <div className="hidden md:flex flex-col w-[340px] bg-zinc-50/50 dark:bg-zinc-900/50 border-r border-zinc-200/50 dark:border-zinc-800/50 p-6 lg:p-8 relative overflow-hidden group/sidebar">
                             {/* Background decorations */}
                             <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-1000 group-hover/sidebar:scale-110" />
                             <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-blue-400/5 dark:bg-blue-400/5 rounded-full blur-3xl pointer-events-none" />
                             
                             {/* Header Card inside Sidebar */}
                             <motion.div 
                                 initial={{ opacity: 0, x: -20 }}
                                 animate={{ opacity: 1, x: 0 }}
                                 transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 25 }}
                                 className="bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[20px] p-5 shadow-sm relative z-10 mb-10 mt-2 overflow-hidden group hover:shadow-md hover:border-blue-200/80 dark:hover:border-blue-800/50 transition-all duration-300"
                             >
                                  {/* Inner Glow */}
                                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                  <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 mb-4 shadow-sm group-hover:scale-105 group-hover:rotate-[-5deg] transition-all duration-300">
                                      <GroupIcon icon={selectedIcon} color={selectedColor} size={24} />
                                  </div>
                                  <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white mb-1 tracking-tight">Create Workspace</h2>
                                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Setup your new project environment and invite teammates.</p>
                             </motion.div>

                             {/* Steps Indicator */}
                             <div className="space-y-0 relative z-10 pl-2">
                                 {/* Connecting Line */}
                                 <div className="absolute left-[26px] top-[40px] bottom-[40px] w-[2px] bg-zinc-200/60 dark:bg-zinc-800/60 rounded-full" />
                                 
                                 {/* Step 1 Item */}
                                 <motion.div 
                                     initial={{ opacity: 0, x: -20 }}
                                     animate={{ opacity: 1, x: 0 }}
                                     transition={{ delay: 0.2, type: "spring" }}
                                     className={`relative flex gap-5 items-start pb-8 transition-all duration-300 ${step === 1 ? 'opacity-100 scale-[1.02]' : 'opacity-50 hover:opacity-70 cursor-pointer'}`}
                                     onClick={() => { if(step > 1) setStep(1); }}
                                 >
                                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 z-10 transition-all duration-500 shadow-sm ${step === 1 ? 'bg-blue-500 text-white border border-blue-600 shadow-blue-500/20 scale-110' : 'bg-white dark:bg-zinc-900 text-zinc-400 border border-zinc-200 dark:border-zinc-800'}`}>
                                         {step > 1 ? <Check size={16} strokeWidth={3} className="text-blue-500 dark:text-blue-400" /> : '1'}
                                     </div>
                                     <div className="mt-0.5">
                                         <h3 className={`text-sm font-bold transition-colors ${step === 1 ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-500 dark:text-zinc-400'}`}>Details & Theme</h3>
                                         <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1 font-medium leading-relaxed max-w-[200px]">Name your group, select a category, and choose a custom theme color.</p>
                                     </div>
                                 </motion.div>
                                 
                                 {/* Step 2 Item */}
                                 <motion.div 
                                     initial={{ opacity: 0, x: -20 }}
                                     animate={{ opacity: 1, x: 0 }}
                                     transition={{ delay: 0.3, type: "spring" }}
                                     className={`relative flex gap-5 items-start transition-all duration-300 ${step === 2 ? 'opacity-100 scale-[1.02]' : 'opacity-50 hover:opacity-70'}`}
                                 >
                                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 z-10 transition-all duration-500 shadow-sm ${step === 2 ? 'bg-blue-500 text-white border border-blue-600 shadow-blue-500/20 scale-110' : 'bg-white dark:bg-zinc-900 text-zinc-400 border border-zinc-200 dark:border-zinc-800'}`}>
                                         2
                                     </div>
                                     <div className="mt-0.5">
                                         <h3 className={`text-sm font-bold transition-colors ${step === 2 ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-500 dark:text-zinc-400'}`}>Members & Privacy</h3>
                                         <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1 font-medium leading-relaxed max-w-[200px]">Invite classmates via email or share a link. Manage privacy settings.</p>
                                     </div>
                                 </motion.div>
                             </div>

                             {/* Live Preview of Group Name/Desc */}
                             {livePreviewCard}
                        </div>

                        {/* RIGHT CONTENT AREA */}
                        <div className="flex-1 flex flex-col relative z-10 w-full h-full min-h-0 min-w-0">
                            {/* Unified Auto-Minimizing Header */}
                            <motion.div 
                                animate={{
                                    padding: isMinimized ? '12px 16px' : '16px 20px'
                                }}
                                className="relative border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 flex-shrink-0 z-20"
                            >
                                <motion.div 
                                    animate={{ marginBottom: isMinimized ? '0px' : '8px' }}
                                    className="flex items-start gap-3 sm:gap-4"
                                >
                                    {/* Header Card */}
                                    <motion.div 
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ 
                                            opacity: 1, 
                                            y: 0,
                                            padding: isMinimized ? '12px 16px' : '16px',
                                            gap: isMinimized ? '12px' : '16px'
                                        }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 24, delay: 0.1 }}
                                        className="flex-1 relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[20px] flex items-center group transition-all duration-300 hover:shadow-md hover:border-blue-200/80 dark:hover:border-blue-800/50 text-left"
                                    >
                                        {/* SaaS Background Accents */}
                                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
                                        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-blue-400/10 dark:bg-blue-400/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />

                                        <motion.div
                                            animate={{
                                                width: isMinimized ? 40 : 48,
                                                height: isMinimized ? 40 : 48,
                                                borderRadius: isMinimized ? 12 : 14
                                            }}
                                            whileHover={{ scale: 1.05, rotate: -5 }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                            className="bg-blue-50 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 flex items-center justify-center flex-shrink-0 shadow-sm text-blue-600 dark:text-blue-400 relative z-10"
                                        >
                                            <div className="hidden sm:flex">
                                                <GroupIcon icon={selectedIcon} color={selectedColor} size={isMinimized ? 20 : 24} />
                                            </div>
                                            <div className="flex sm:hidden">
                                                <GroupIcon icon={selectedIcon} color={selectedColor} size={isMinimized ? 18 : 20} />
                                            </div>
                                        </motion.div>
                                        
                                        <div className="relative z-10 flex-1 min-w-0 pr-2 sm:pr-4">
                                            <motion.h2 
                                                animate={{ fontSize: isMinimized ? '16px' : '18px' }}
                                                className="font-bold text-zinc-900 dark:text-zinc-100 tracking-tight m-0 mb-0.5 truncate"
                                            >
                                                Create Workspace
                                            </motion.h2>
                                            <motion.div 
                                                animate={{ 
                                                    height: isMinimized ? 0 : 'auto',
                                                    opacity: isMinimized ? 0 : 1,
                                                    marginTop: isMinimized ? 0 : '4px'
                                                }}
                                                className="overflow-hidden"
                                            >
                                                <p className="text-zinc-500 dark:text-zinc-400 font-medium m-0 text-xs sm:text-[13px] leading-snug">
                                                    Setup your new project environment and invite teammates.
                                                </p>
                                            </motion.div>
                                        </div>
                                        <div className="relative z-20 self-start">
                                            <motion.button
                                                onClick={onClose}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="lg:hidden flex-shrink-0 flex items-center justify-center rounded-lg sm:rounded-xl border border-zinc-200/80 bg-white/80 backdrop-blur-md p-2 text-zinc-500 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-700/80 dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:bg-zinc-700"
                                                aria-label="Close modal"
                                            >
                                                <X size={18} strokeWidth={2.5} className="sm:w-5 sm:h-5" />
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            </motion.div>

                            {/* Scrollable Form Content */}
                            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar relative" onScroll={handleScroll}>
                                <AnimatePresence mode="wait">
                                     {step === 1 ? (
                                        <motion.div
                                            key="step1"
                                            initial={{ opacity: 0, x: -12 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 12 }}
                                            transition={{ duration: 0.2 }}
                                            className="space-y-6 max-w-none p-4 sm:p-6 md:max-w-none md:mx-0 md:p-8 w-full min-w-0"
                                        >

                                            {/* Mobile Live Preview */}
                                            <div className="md:hidden pb-2">
                                                {livePreviewCard}
                                            </div>

                                            {/* Presets Row */}
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                                    <GroupIcon icon="star" color="#888" size={12} />
                                                    Quick-Fill Presets
                                                </div>
                                                <div className="bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200/50 dark:border-zinc-800/80 rounded-[1.25rem] p-2 shadow-inner w-full">
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                        {presets.map((preset, idx) => (
                                                            <motion.button
                                                                key={idx}
                                                                type="button"
                                                                whileHover={{ scale: 1.02 }}
                                                                whileTap={{ scale: 0.98 }}
                                                                onClick={() => applyPreset(preset)}
                                                                className="w-full p-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white hover:bg-zinc-50 dark:bg-zinc-955/60 dark:hover:bg-zinc-900 text-left transition-all cursor-pointer shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 flex flex-col gap-1.5"
                                                            >
                                                                <div className="flex items-start justify-between gap-2 w-full">
                                                                    <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate pt-1">{preset.name}</span>
                                                                    <div 
                                                                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border"
                                                                        style={{ backgroundColor: `${preset.color}15`, borderColor: `${preset.color}40`, color: preset.color }}
                                                                    >
                                                                        <GroupIcon icon={preset.icon} color={preset.color} size={14} />
                                                                    </div>
                                                                </div>
                                                                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-snug line-clamp-2 pr-2">
                                                                    {preset.description}
                                                                </div>
                                                            </motion.button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Name Field */}
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block">
                                                    Workspace Name <span className="text-red-500">*</span>
                                                </label>
                                                <div className="bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200/50 dark:border-zinc-800/80 rounded-[1.25rem] p-2 shadow-inner w-full">
                                                    <input
                                                        type="text"
                                                        value={name}
                                                        onChange={(e) => setName(e.target.value)}
                                                        placeholder="e.g., CP1 Capstone Project Group 1"
                                                        maxLength={50}
                                                        className="w-full block px-4 py-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80 bg-white dark:bg-zinc-950/60 text-sm font-medium text-zinc-900 dark:text-zinc-100 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder-zinc-400 shadow-sm"
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500 font-medium px-1">
                                                    <span>Minimum 3 characters</span>
                                                    <span>{name.length}/50</span>
                                                </div>
                                            </div>

                                            {/* Description Field */}
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block">
                                                    Description
                                                </label>
                                                <div className="bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200/50 dark:border-zinc-800/80 rounded-[1.25rem] p-2 shadow-inner w-full">
                                                    <textarea
                                                        value={description}
                                                        onChange={(e) => setDescription(e.target.value)}
                                                        placeholder="Explain the project scope, roles, or learning objective..."
                                                        maxLength={200}
                                                        rows={3}
                                                        className="w-full block px-4 py-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80 bg-white dark:bg-zinc-950/60 text-sm font-medium text-zinc-900 dark:text-zinc-100 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder-zinc-400 resize-none shadow-sm"
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500 font-medium px-1">
                                                    <span>Optional</span>
                                                    <span className={description.length >= 200 ? 'text-red-500 font-bold' : ''}>{description.length}/200</span>
                                                </div>
                                            </div>

                                            {/* Course Linking */}
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 tracking-wider uppercase flex items-center gap-1.5 mb-2 select-none">
                                                    <BookOpen size={12} strokeWidth={2.5} className="text-zinc-400 dark:text-zinc-500" />
                                                    Link to Course
                                                </label>
                                                <div className="relative" ref={courseDropdownRef}>
                                                    <div className="bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200/50 dark:border-zinc-800/80 rounded-[1.25rem] p-2 shadow-inner w-full">
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowCourseDropdown(!showCourseDropdown)}
                                                            className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 flex items-center gap-3 cursor-pointer outline-none shadow-sm ${
                                                                showCourseDropdown
                                                                    ? 'border-blue-500 ring-4 ring-blue-500/10 bg-white dark:bg-zinc-955/60 text-zinc-900 dark:text-zinc-100'
                                                                    : 'border-zinc-200/60 dark:border-zinc-800/80 bg-white dark:bg-zinc-955/60 hover:bg-zinc-50 dark:hover:bg-zinc-900/80 text-zinc-800 dark:text-zinc-200'
                                                            }`}
                                                        >
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                                                                selectedCourse 
                                                                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' 
                                                                    : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-400 dark:text-zinc-500 border border-zinc-200/50 dark:border-zinc-700/50'
                                                            }`}>
                                                                {selectedCourse ? <GraduationCap size={16} strokeWidth={2.2} /> : <BookOpen size={16} strokeWidth={2.2} />}
                                                            </div>
                                                            <div className="flex-1 text-left overflow-hidden">
                                                                <div className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider leading-none mb-1">
                                                                    Course Link
                                                                </div>
                                                                <div className={`text-[13.5px] truncate font-bold ${
                                                                    selectedCourse ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-650'
                                                                }`}>
                                                                    {selectedCourse ? `${selectedCourse.shortTitle} — ${selectedCourse.title}` : 'Select related subject (optional)...'}
                                                                </div>
                                                            </div>
                                                            <ChevronRight 
                                                                size={18} 
                                                                className={`text-zinc-400 dark:text-zinc-500 transition-transform duration-300 flex-shrink-0 ${
                                                                    showCourseDropdown ? 'rotate-90 text-blue-500 dark:text-blue-400' : ''
                                                                }`} 
                                                            />
                                                        </button>
                                                    </div>
                                                    <AnimatePresence>
                                                        {showCourseDropdown && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: -8 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, y: -8 }}
                                                                className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xl max-h-[280px] overflow-y-auto z-[60] p-1.5 scrollbar-none"
                                                                onMouseLeave={() => setHoveredCourseId(null)}
                                                            >
                                                                <div className="flex flex-col gap-1 relative w-full">
                                                                    <AnimatePresence>
                                                                        {hoveredIndex !== -1 && (
                                                                            <motion.div
                                                                                initial={{ opacity: 0 }}
                                                                                animate={{ 
                                                                                    opacity: 1,
                                                                                    y: hoveredIndex * 54, // 50px height + 4px gap
                                                                                }}
                                                                                exit={{ opacity: 0 }}
                                                                                className="absolute left-0 right-0 h-[50px] bg-gradient-to-r from-zinc-200/60 to-zinc-100/40 dark:from-zinc-800/70 dark:to-zinc-800/30 rounded-lg pointer-events-none z-0 shadow-sm border border-zinc-200/20 dark:border-zinc-700/10"
                                                                                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                                                            />
                                                                        )}
                                                                    </AnimatePresence>
                                                                    {selectedCourse && (
                                                                        <button
                                                                            type="button"
                                                                            onMouseEnter={() => setHoveredCourseId('clear')}
                                                                            onClick={() => { setSelectedCourse(null); setShowCourseDropdown(false); }}
                                                                            className="w-full text-left px-3 h-[50px] rounded-lg cursor-pointer transition-colors flex items-center justify-between relative z-10"
                                                                        >
                                                                            <div className="flex flex-col justify-center min-w-0 flex-1 pr-4">
                                                                                <span className="font-bold text-xs text-red-500">
                                                                                    Clear course link
                                                                                </span>
                                                                                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium truncate mt-0.5">
                                                                                    Remove course association from this workspace
                                                                                </span>
                                                                            </div>
                                                                            <div className="w-8 h-8 rounded-md bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center flex-shrink-0 relative z-10">
                                                                                <X size={14} strokeWidth={2.5} />
                                                                            </div>
                                                                        </button>
                                                                    )}

                                                                    {enrolledCourses.map((c) => {
                                                                        const isSelected = selectedCourse?.id === c.id;
                                                                        return (
                                                                            <button
                                                                                key={c.id}
                                                                                type="button"
                                                                                onMouseEnter={() => setHoveredCourseId(c.id)}
                                                                                onClick={() => { setSelectedCourse(c); setShowCourseDropdown(false); }}
                                                                                className={`w-full text-left px-3 h-[50px] rounded-lg flex items-center justify-between cursor-pointer transition-all duration-200 relative overflow-hidden z-10 ${
                                                                                    isSelected
                                                                                        ? 'bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-l-2 border-blue-500 pl-2.5'
                                                                                        : 'text-zinc-700 dark:text-zinc-300 border-l-2 border-transparent hover:text-zinc-950 dark:hover:text-zinc-50'
                                                                                }`}
                                                                            >
                                                                                <div className="flex flex-col justify-center min-w-0 flex-1 pr-4 relative z-10">
                                                                                    <span className={`font-bold text-xs truncate ${isSelected ? 'text-blue-600 dark:text-blue-450' : 'text-zinc-800 dark:text-zinc-200'}`}>
                                                                                        {c.title}
                                                                                    </span>
                                                                                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium truncate mt-0.5">
                                                                                        {c.description}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex items-center gap-2.5 flex-shrink-0 relative z-10">
                                                                                    <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border transition-colors duration-200 ${
                                                                                        isSelected
                                                                                            ? 'bg-blue-500 border-blue-600 text-white dark:border-blue-500 shadow-sm'
                                                                                            : 'bg-blue-50 dark:bg-blue-955/40 border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400'
                                                                                    }`}>
                                                                                        {c.shortTitle}
                                                                                    </span>
                                                                                    {isSelected && <Check size={14} className="text-blue-500 dark:text-blue-400" strokeWidth={2.5} />}
                                                                                </div>
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </div>

                                            {/* Appearance Section */}
                                            <div className="space-y-6 pt-2">
                                                {/* Category Options */}
                                                <div className="space-y-3">
                                                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block">
                                                        Workspace Category
                                                    </label>
                                                    <div className="bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200/50 dark:border-zinc-800/80 rounded-[1.25rem] p-2 shadow-inner w-full">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {categoryOptions.map((opt) => {
                                                                const isSelected = category === opt.id;
                                                                return (
                                                                    <motion.button
                                                                        key={opt.id}
                                                                        type="button"
                                                                        onClick={() => setCategory(opt.id as GroupCategory)}
                                                                        whileHover="hover"
                                                                        className={`p-4 rounded-[16px] border flex items-start gap-4 transition-all duration-300 cursor-pointer text-left relative overflow-hidden group hover:shadow-md hover:-translate-y-0.5 ${
                                                                            isSelected 
                                                                                ? 'shadow-sm text-zinc-900 dark:text-zinc-100' 
                                                                                : 'bg-white dark:bg-zinc-950/60 border-zinc-200/60 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-650 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                                                                        }`}
                                                                        style={isSelected ? {
                                                                            borderColor: selectedColor,
                                                                            backgroundColor: `${selectedColor}08`,
                                                                            boxShadow: `0 2px 8px -2px ${selectedColor}25, 0 0 0 1px ${selectedColor}40`
                                                                        } : {}}
                                                                    >
                                                                        {/* Background Glow when selected - REMOVED per user request */}
                                                                        
                                                                        <div className="flex flex-col justify-center min-w-0 flex-1 relative z-10 pt-1 pr-2">
                                                                            <div className="flex items-center justify-between mb-1.5">
                                                                                <span className={`font-bold text-base tracking-tight transition-colors duration-200 ${isSelected ? '' : 'text-zinc-800 dark:text-zinc-200'}`} style={isSelected ? { color: selectedColor } : {}}>
                                                                                    {opt.label}
                                                                                </span>
                                                                            </div>
                                                                            <span className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 font-medium">
                                                                                {opt.description}
                                                                            </span>
                                                                        </div>
                                                                        <motion.div 
                                                                            variants={{ hover: { scale: 1.05, rotate: -5 } }}
                                                                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                                                            className={`w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0 shadow-sm relative z-10 border transition-colors duration-300 ${
                                                                                isSelected ? '' : 'bg-zinc-50 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700/50 text-zinc-500 dark:text-zinc-400'
                                                                            }`}
                                                                            style={isSelected ? { backgroundColor: `${selectedColor}15`, borderColor: `${selectedColor}40`, color: selectedColor } : {}}
                                                                        >
                                                                            {opt.icon}
                                                                        </motion.div>
                                                                    </motion.button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Fallback Icon Select */}
                                                <div className="space-y-3">
                                                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block text-left">
                                                        Workspace Icon
                                                    </label>
                                                    <div className="bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200/50 dark:border-zinc-800/80 rounded-[1.25rem] p-2 shadow-inner w-full">
                                                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                                            {iconOptions.map((icon) => {
                                                                const isSelected = selectedIcon === icon.id;
                                                                return (
                                                                    <motion.button
                                                                        key={icon.id}
                                                                        type="button"
                                                                        onClick={() => setSelectedIcon(icon.id)}
                                                                        whileHover="hover"
                                                                        className={`h-[48px] px-3 rounded-xl border flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer overflow-hidden relative group hover:shadow-md hover:-translate-y-0.5 ${
                                                                            isSelected
                                                                                ? 'shadow-sm'
                                                                                : 'bg-white dark:bg-zinc-955/60 border-zinc-200/60 dark:border-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100'
                                                                        }`}
                                                                        style={isSelected ? {
                                                                            borderColor: selectedColor,
                                                                            backgroundColor: `${selectedColor}12`,
                                                                            color: selectedColor,
                                                                            boxShadow: `0 2px 8px -2px ${selectedColor}25, 0 0 0 1px ${selectedColor}40`
                                                                        } : {}}
                                                                    >
                                                                        {/* Background Glow when selected - REMOVED per user request */}
                                                                        <motion.div 
                                                                            variants={{ hover: { scale: 1.1, rotate: -5 } }}
                                                                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                                                            className={`relative z-10 flex items-center justify-center ${isSelected ? 'scale-110' : ''}`}
                                                                        >
                                                                            <GroupIcon 
                                                                                icon={icon.id} 
                                                                                color={isSelected ? selectedColor : 'currentColor'} 
                                                                                size={18} 
                                                                            />
                                                                        </motion.div>
                                                                        <span className="text-[13px] font-bold tracking-wide relative z-10">
                                                                            {icon.label}
                                                                        </span>
                                                                    </motion.button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Theme Colors */}
                                                <div className="space-y-3">
                                                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block text-left">
                                                        Theme Color
                                                    </label>
                                                    <div className="bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200/50 dark:border-zinc-800/80 rounded-[1.25rem] p-2 shadow-inner w-full">
                                                        <ColorPicker 
                                                            onChange={setSelectedColor} 
                                                            value={selectedColor} 
                                                            className="w-full rounded-xl bg-white dark:bg-zinc-950/60 border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm" 
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Avatar Upload */}
                                            <div className="pt-2">
                                                <div className="bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200/50 dark:border-zinc-800/80 rounded-[1.25rem] p-2 shadow-inner w-full">
                                                    <div 
                                                        onClick={() => avatarInputRef.current?.click()}
                                                        className={`p-4 sm:p-5 rounded-xl border ${imageError.type === 'size' || imageError.type === 'inappropriate' ? 'border-red-500/50 bg-red-50/50 dark:border-red-500/50 dark:bg-red-950/20' : imageError.type === 'warning' ? 'border-yellow-400/80 bg-yellow-50/50 dark:border-yellow-500/50 dark:bg-yellow-900/10' : 'border-zinc-200/60 dark:border-zinc-800/80 bg-white dark:bg-zinc-950/60 hover:bg-zinc-50 dark:hover:bg-zinc-900'} shadow-sm hover:shadow-md ${!imageError.type ? 'hover:border-blue-300/80 dark:hover:border-blue-750/80' : ''} transition-all duration-300 flex items-center gap-4 sm:gap-5 group cursor-pointer relative overflow-hidden`}
                                                    >
                                                        {/* Background ambient glow effect for SaaS feel */}
                                                        {!imageError.type && <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />}
                                                        
                                                        <div className={`w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl ${!groupAvatar || isUploadingAvatar ? 'border-2 border-dashed' : 'border border-zinc-200/50 dark:border-zinc-700/50 shadow-sm'} ${imageError.type === 'size' || imageError.type === 'inappropriate' ? 'border-red-400 bg-red-100/50 dark:border-red-500/50 dark:bg-red-900/30 text-red-500' : imageError.type === 'warning' ? 'border-yellow-400 bg-yellow-100/50 dark:border-yellow-500/50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-500' : 'border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-400 dark:text-zinc-500 group-hover:border-blue-500 group-hover:bg-blue-50/50 dark:group-hover:border-blue-500 dark:group-hover:bg-blue-900/20 group-hover:text-blue-500 dark:group-hover:text-blue-400'} flex items-center justify-center overflow-hidden transition-all flex-shrink-0 relative z-10`}>
                                                            {isUploadingAvatar ? (
                                                                <svg className="h-6 w-6 text-blue-500 dark:text-blue-400 animate-spin" viewBox="0 0 24 24" fill="none">
                                                                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3.5" className="opacity-20" />
                                                                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="56" strokeDashoffset="16" />
                                                                </svg>
                                                            ) : groupAvatar ? (
                                                                <img src={groupAvatar} alt="Avatar" className="w-full h-full object-cover rounded-[14px]" />
                                                            ) : (
                                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-colors">
                                                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                                                    <polyline points="21 15 16 10 5 21" />
                                                                </svg>
                                                            )}
                                                            <input 
                                                                type="file" 
                                                                ref={avatarInputRef} 
                                                                onChange={handleAvatarUpload} 
                                                                accept="image/png, image/jpeg, image/webp" 
                                                                className="hidden" 
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0 relative z-10 flex items-center justify-between gap-3">
                                                            <div>
                                                                <h4 className={`text-[13px] sm:text-[15px] font-bold ${imageError.type === 'size' || imageError.type === 'inappropriate' ? 'text-red-700 dark:text-red-400' : imageError.type === 'warning' ? 'text-yellow-700 dark:text-yellow-500' : 'text-zinc-900 dark:text-zinc-100'} tracking-tight mb-0.5`}>
                                                                    {isUploadingAvatar ? 'Scanning with MiMo 2.5...' : groupAvatar ? 'Custom Image Uploaded' : 'Upload Custom Image'}
                                                                </h4>
                                                                {imageError.type ? (
                                                                    <p className={`text-[11px] sm:text-[12px] ${imageError.type === 'warning' ? 'text-yellow-600 dark:text-yellow-400/90 font-medium' : 'text-red-600 dark:text-red-400 font-bold'} leading-snug`}>{imageError.message}</p>
                                                                ) : (
                                                                    <p className="text-[11px] sm:text-[13px] text-zinc-500 dark:text-zinc-400 font-medium truncate">Recommended: 256×256px. Max: 2MB.</p>
                                                                )}
                                                            </div>
                                                            
                                                            {/* Change Button */}
                                                            {groupAvatar && !isUploadingAvatar && imageError.type !== 'size' && imageError.type !== 'inappropriate' && (
                                                                <div className="flex px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[11px] sm:text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shrink-0">
                                                                    Change
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                     ) : (
                                         <motion.div
                                            key="step2"
                                            initial={{ opacity: 0, x: 12 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -12 }}
                                            transition={{ duration: 0.2 }}
                                            className="space-y-8 max-w-none p-4 sm:p-6 md:max-w-none md:mx-0 md:p-8 w-full min-w-0"
                                         >

                                            {/* Invite Members via Search/Email */}
                                            <div className="space-y-4">
                                                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block">
                                                    Invite Members
                                                </label>
                                                <div className="flex gap-2">
                                                    <div className="relative flex-1">
                                                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                                        <input
                                                            type="text"
                                                            value={currentInviteEmail}
                                                            onChange={(e) => setCurrentInviteEmail(e.target.value)}
                                                            placeholder="Search name or type @meycauayan.sti.edu.ph email"
                                                            className={`w-full pl-10 pr-4 py-3 rounded-xl border ${emailError ? 'border-red-500/50 focus:ring-red-500/10' : 'border-zinc-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-blue-500/10'} bg-white dark:bg-zinc-900 text-sm font-medium text-zinc-900 dark:text-zinc-100 outline-none transition-all focus:ring-4 shadow-sm`}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    addInviteEmail(currentInviteEmail);
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => addInviteEmail(currentInviteEmail)}
                                                        disabled={!currentInviteEmail.trim() || isCheckingEmail}
                                                        className="px-5 py-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2"
                                                    >
                                                        {isCheckingEmail ? (
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
                                                                <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                                                                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                                                            </svg>
                                                        ) : (
                                                            <>
                                                                <Plus size={16} strokeWidth={3} />
                                                                Add
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                                
                                                <AnimatePresence>
                                                    {emailError && (
                                                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-red-500 text-[11px] font-bold flex items-center gap-1.5 ml-1">
                                                            <AlertCircle size={12} strokeWidth={2.5} />
                                                            {emailErrorMessage}
                                                        </motion.div>
                                                    )}
                                                    {showEmailAdded && (
                                                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-emerald-500 text-[11px] font-bold flex items-center gap-1.5 ml-1">
                                                            <Check size={12} strokeWidth={2.5} />
                                                            Added successfully!
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            {/* Suggested Classmates (if enrolled in a course or general search) */}
                                            <div className="space-y-3">
                                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                                    Suggested Classmates
                                                    {isSearchingClassmates && (
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin text-zinc-400">
                                                            <circle cx="12" cy="12" r="10" strokeOpacity="0.3" /><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                                                        </svg>
                                                    )}
                                                </label>
                                                
                                                <motion.div 
                                                    animate={{ height: classmatesContainerHeight }}
                                                    transition={{ type: "spring", stiffness: 350, damping: 32 }}
                                                    style={{ height: classmatesContainerHeight }}
                                                    className="bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200/50 dark:border-zinc-800/80 rounded-[1.25rem] p-2 shadow-inner relative overflow-hidden flex flex-col w-full"
                                                >
                                                    <div ref={classmatesContentRef} className="w-full flex flex-col">
                                                        <AnimatePresence mode="wait">
                                                            {isSearchingClassmates ? (
                                                                <motion.div
                                                                    key="skeleton"
                                                                    initial={{ opacity: 0 }}
                                                                    animate={{ opacity: 1 }}
                                                                    exit={{ opacity: 0 }}
                                                                    transition={{ duration: 0.12 }}
                                                                    className="divide-y divide-zinc-200/50 dark:divide-zinc-800/60 flex flex-col w-full"
                                                                >
                                                                    {Array.from({ length: 4 }).map((_, i) => (
                                                                        <div key={i} className="p-3 flex items-center justify-between gap-4 first:pt-1 last:pb-1">
                                                                            <div className="flex items-center gap-3.5 flex-1 min-w-0">
                                                                                <div className="relative flex-shrink-0">
                                                                                    <div className="w-14 h-14 rounded-full border-[3px] border-zinc-200/20 dark:border-zinc-800/30 flex items-center justify-center bg-zinc-200/10 dark:bg-zinc-800/20">
                                                                                        <div className="w-10 h-10 rounded-full relative overflow-hidden bg-zinc-200 dark:bg-zinc-800">
                                                                                            <div className="absolute inset-0 -translate-x-full animate-skeleton-shimmer bg-gradient-to-r from-transparent via-white/35 dark:via-zinc-700/35 to-transparent" />
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-4 relative overflow-hidden bg-zinc-200 dark:bg-zinc-800 rounded-md border-[2px] border-zinc-150/55 dark:border-zinc-900/55">
                                                                                        <div className="absolute inset-0 -translate-x-full animate-skeleton-shimmer bg-gradient-to-r from-transparent via-white/35 dark:via-zinc-700/35 to-transparent" />
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex-1 space-y-2 min-w-0">
                                                                                    <div className="h-[14px] relative overflow-hidden bg-zinc-200 dark:bg-zinc-800 rounded-[4px] w-[65%]">
                                                                                        <div className="absolute inset-0 -translate-x-full animate-skeleton-shimmer bg-gradient-to-r from-transparent via-white/35 dark:via-zinc-700/35 to-transparent" />
                                                                                    </div>
                                                                                    <div className="h-[10px] relative overflow-hidden bg-zinc-200/60 dark:bg-zinc-800/60 rounded-[3px] w-[40%]">
                                                                                        <div className="absolute inset-0 -translate-x-full animate-skeleton-shimmer bg-gradient-to-r from-transparent via-white/35 dark:via-zinc-700/35 to-transparent" />
                                                                                    </div>
                                                                                    <div className="h-[9px] relative overflow-hidden bg-zinc-200/50 dark:bg-zinc-800/50 rounded-[3px] w-[20%]">
                                                                                        <div className="absolute inset-0 -translate-x-full animate-skeleton-shimmer bg-gradient-to-r from-transparent via-white/35 dark:via-zinc-700/35 to-transparent" />
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="w-9 h-9 rounded-xl relative overflow-hidden bg-zinc-200/40 dark:bg-zinc-850 flex-shrink-0">
                                                                                <div className="absolute inset-0 -translate-x-full animate-skeleton-shimmer bg-gradient-to-r from-transparent via-white/35 dark:via-zinc-700/35 to-transparent" />
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </motion.div>
                                                            ) : filteredClassmates.length === 0 ? (
                                                                <motion.div
                                                                    key="empty"
                                                                    initial={{ opacity: 0 }}
                                                                    animate={{ opacity: 1 }}
                                                                    exit={{ opacity: 0 }}
                                                                    transition={{ duration: 0.12 }}
                                                                    className="text-center py-12 w-full flex flex-col justify-center items-center h-[288px]"
                                                                >
                                                                    <p className="text-sm font-medium text-zinc-500">No classmates found or all are added.</p>
                                                                </motion.div>
                                                            ) : (
                                                                <motion.div
                                                                    key="carousel-content"
                                                                    initial={{ opacity: 0, x: 10 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                    exit={{ opacity: 0, x: -10 }}
                                                                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                                                    className="w-full"
                                                                >
                                                                    <Carousel 
                                                                        key={filteredClassmates.length} 
                                                                        index={classmatesPage - 1} 
                                                                        onIndexChange={(idx) => setClassmatesPage(idx + 1)} 
                                                                        disableDrag={false}
                                                                        className="w-full"
                                                                    >
                                                                        <CarouselContent className="w-full">
                                                                            {Array.from({ length: totalPages }).map((_, pageIdx) => {
                                                                                const pageClassmates = filteredClassmates.slice(
                                                                                    pageIdx * classmatesPerPage,
                                                                                    (pageIdx + 1) * classmatesPerPage
                                                                                );
                                                                                return (
                                                                                    <CarouselItem key={pageIdx} className="w-full shrink-0 px-0.5">
                                                                                        <div className="divide-y divide-zinc-200/50 dark:divide-zinc-800/60 flex flex-col">
                                                                                            {pageClassmates.map(c => (
                                                                                                <div key={c.id} className="p-3 hover:bg-white dark:hover:bg-zinc-950/60 transition-colors rounded-[12px] flex items-center justify-between gap-4 group/row first:pt-1 last:pb-1">
                                                                                                    <div className="flex items-center gap-3.5">
                                                                                                        <div className="relative flex-shrink-0 group-hover/row:scale-105 transition-transform duration-300">
                                                                                                            <AnimatedCircularProgressBar
                                                                                                                max={100}
                                                                                                                min={0}
                                                                                                                value={c.progress || 0}
                                                                                                                gaugePrimaryColor="#3b82f6"
                                                                                                                gaugeSecondaryColor={isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(219, 234, 254, 0.6)'}
                                                                                                                className="w-14 h-14"
                                                                                                            >
                                                                                                                <div className="absolute inset-1.5 rounded-full flex items-center justify-center shadow-sm overflow-hidden z-10 bg-blue-50 dark:bg-blue-900/30">
                                                                                                                    {c.profile_image ? (
                                                                                                                        <img src={c.profile_image} alt={c.name} className="w-full h-full object-cover" />
                                                                                                                    ) : (
                                                                                                                        <span className="text-[14px] font-extrabold leading-none text-blue-600 dark:text-blue-400">
                                                                                                                            {c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                                                                                        </span>
                                                                                                                    )}
                                                                                                                </div>

                                                                                                                <div className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 min-w-[32px] h-[16px] px-1 rounded-md flex items-center justify-center text-[9px] font-bold tracking-wider shadow-sm border-[2px] z-20 text-white bg-blue-500 ${isDarkMode ? 'border-zinc-950' : 'border-white'}`}>
                                                                                                                    LV.{c.level || 1}
                                                                                                                </div>
                                                                                                            </AnimatedCircularProgressBar>
                                                                                                        </div>
                                                                                                        <div className="overflow-hidden">
                                                                                                            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover/row:text-blue-600 dark:group-hover/row:text-blue-400 transition-colors">{c.name}</p>
                                                                                                            <p className="text-[10px] font-medium text-zinc-500 truncate mt-0.5">{c.section} &bull; {c.program}</p>
                                                                                                            <p className="text-[9px] font-semibold text-emerald-500 dark:text-emerald-400 mt-0.5">Online</p>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                    <button 
                                                                                                        type="button"
                                                                                                        onClick={() => addClassmate(c)}
                                                                                                        className={`w-9 h-9 rounded-xl border flex items-center justify-center shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 flex-shrink-0 ${
                                                                                                            isDarkMode 
                                                                                                                ? 'border-zinc-700 bg-zinc-850/80 text-zinc-300 hover:bg-zinc-700 hover:text-blue-400 hover:border-blue-500/50' 
                                                                                                                : 'border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 hover:text-blue-600 hover:border-blue-300'
                                                                                                        }`}
                                                                                                    >
                                                                                                        <Plus size={16} strokeWidth={2.5} />
                                                                                                    </button>
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    </CarouselItem>
                                                                                );
                                                                            })}
                                                                        </CarouselContent>
                                                                    </Carousel>
                                                                    
                                                                    {totalPages > 1 && (
                                                                        <div className="w-full pt-2.5 pb-1">
                                                                            <div className="flex items-center justify-between w-full gap-2 bg-white dark:bg-zinc-900/50 p-1.5 rounded-[14px] border border-zinc-200/60 dark:border-zinc-800/50 shadow-sm transition-all duration-300 hover:shadow-md">
                                                                                <button 
                                                                                    type="button"
                                                                                    onClick={() => setClassmatesPage(p => Math.max(1, p - 1))}
                                                                                    disabled={classmatesPage === 1}
                                                                                    className={`w-9 h-9 rounded-[10px] flex items-center justify-center transition-all shadow-sm cursor-pointer border ${
                                                                                        classmatesPage === 1
                                                                                            ? 'bg-zinc-50/50 dark:bg-zinc-800/40 border-zinc-100/30 dark:border-zinc-700/40 text-zinc-300 dark:text-zinc-600 cursor-not-allowed'
                                                                                            : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-blue-600 hover:bg-zinc-50/50 dark:hover:bg-zinc-700/50 hover:border-blue-300 dark:hover:border-blue-500'
                                                                                    }`}
                                                                                >
                                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                                                                                </button>
                                                                                <span className="text-[13px] font-bold text-zinc-700 dark:text-zinc-300 text-center tracking-wide flex-1">
                                                                                    Page {classmatesPage} <span className="text-zinc-400 dark:text-zinc-500 font-medium mx-0.5">/</span> {totalPages}
                                                                                </span>
                                                                                <button 
                                                                                    type="button"
                                                                                    onClick={() => setClassmatesPage(p => Math.min(totalPages, p + 1))}
                                                                                    disabled={classmatesPage === totalPages}
                                                                                    className={`w-9 h-9 rounded-[10px] flex items-center justify-center transition-all shadow-sm cursor-pointer border ${
                                                                                        classmatesPage === totalPages
                                                                                            ? 'bg-zinc-50/50 dark:bg-zinc-800/40 border-zinc-100/30 dark:border-zinc-700/40 text-zinc-300 dark:text-zinc-600 cursor-not-allowed'
                                                                                            : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-blue-600 hover:bg-zinc-50/50 dark:hover:bg-zinc-700/50 hover:border-blue-300 dark:hover:border-blue-500'
                                                                                    }`}
                                                                                >
                                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                        
                                                        {/* Added Members List (Combined into the same card container) */}
                                                        {inviteEmails.length > 0 && (
                                                            <div className="flex flex-col w-full">
                                                                <div className="w-full h-px bg-zinc-200/80 dark:bg-zinc-800/80 my-2" />
                                                                <div className="flex flex-col w-full pt-1 pb-1">
                                                                    <div className="flex items-center justify-between mb-3 px-1">
                                                                        <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block">
                                                                            Added Members ({inviteEmails.length})
                                                                        </label>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setInviteEmails([])}
                                                                            title="Clear All"
                                                                            className="w-[28px] h-[28px] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
                                                                        >
                                                                            <Trash2 size={14} strokeWidth={2.5} />
                                                                        </button>
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-2 px-1">
                                                                        <AnimatePresence mode="popLayout">
                                                                            {visibleMembers.map((inv) => (
                                                                                <motion.div
                                                                                    key={inv.email}
                                                                                    layout
                                                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                                                    className="bg-blue-50/40 dark:bg-blue-955/20 border border-blue-200/60 dark:border-blue-800/40 rounded-xl p-3 flex items-center justify-between gap-3 shadow-sm w-full sm:w-[calc(50%-0.25rem)]"
                                                                                >
                                                                                    <div className="flex items-center gap-3.5 min-w-0">
                                                                                        <div className="relative flex-shrink-0 scale-95 origin-left">
                                                                                            <AnimatedCircularProgressBar
                                                                                                max={100}
                                                                                                min={0}
                                                                                                value={inv.progress || 0}
                                                                                                gaugePrimaryColor="#3b82f6"
                                                                                                gaugeSecondaryColor={isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(219, 234, 254, 0.6)'}
                                                                                                className="w-12 h-12"
                                                                                            >
                                                                                                <div className="absolute inset-1.5 rounded-full flex items-center justify-center shadow-sm overflow-hidden z-10 bg-blue-50 dark:bg-blue-900/30">
                                                                                                    {inv.profile_image ? (
                                                                                                        <img src={inv.profile_image} alt={inv.name} className="w-full h-full object-cover" />
                                                                                                    ) : (
                                                                                                        <span className="text-[12px] font-extrabold leading-none text-blue-600 dark:text-blue-400">
                                                                                                            {inv.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                                                                        </span>
                                                                                                    )}
                                                                                                </div>

                                                                                                <div className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 min-w-[28px] h-[14px] px-1 rounded-md flex items-center justify-center text-[8px] font-bold tracking-wider shadow-sm border-[2px] z-20 text-white bg-blue-500 ${isDarkMode ? 'border-zinc-950' : 'border-white'}`}>
                                                                                                    LV.{inv.level || 1}
                                                                                                </div>
                                                                                            </AnimatedCircularProgressBar>
                                                                                        </div>
                                                                                        <div className="flex flex-col min-w-0">
                                                                                            <span className="text-sm font-bold text-blue-900 dark:text-blue-100 truncate leading-snug">{inv.name}</span>
                                                                                            <span className="text-[11px] text-blue-600/70 dark:text-blue-400/70 truncate leading-none mt-0.5">{inv.email}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => removeInviteEmail(inv.email)}
                                                                                        className="p-1.5 hover:bg-blue-100/50 dark:hover:bg-blue-900/30 rounded-md text-blue-600 dark:text-blue-400 transition-colors flex-shrink-0 cursor-pointer"
                                                                                    >
                                                                                        <X size={14} strokeWidth={2.5} />
                                                                                    </button>
                                                                                </motion.div>
                                                                            ))}
                                                                            
                                                                            {shouldCollapse && (
                                                                                <div className="w-full flex justify-center pt-1">
                                                                                    <motion.button
                                                                                        key="toggle-show-all-members"
                                                                                        layout
                                                                                        type="button"
                                                                                        onClick={() => setShowAllMembers(!showAllMembers)}
                                                                                        className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-650 dark:text-zinc-300 shadow-sm transition-all duration-205 active:scale-95 cursor-pointer"
                                                                                    >
                                                                                        {showAllMembers ? 'Show Less' : `+${inviteEmails.length - displayLimit} more`}
                                                                                    </motion.button>
                                                                                </div>
                                                                            )}
                                                                        </AnimatePresence>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            </div>

                                            <div className="border-t border-zinc-200 dark:border-zinc-800 my-6"></div>

                                            {/* Share Link */}
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block">
                                                        Share Invite Link
                                                    </label>
                                                    <span className="text-[10px] font-medium text-zinc-500 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800">Optional</span>
                                                </div>
                                                {!inviteLink ? (
                                                    <div className="bg-zinc-50/50 dark:bg-zinc-900/30 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-[1rem] p-2 shadow-inner">
                                                        <button
                                                            type="button"
                                                            onClick={generateInviteLink}
                                                            className="w-full py-3 hover:bg-white dark:hover:bg-zinc-950/60 transition-colors rounded-[12px] flex items-center justify-center gap-2 text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                                                        >
                                                            <LinkIcon size={16} strokeWidth={2.5} />
                                                            Generate Invite Link
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200/50 dark:border-zinc-800/80 rounded-[1rem] p-2 shadow-inner flex items-center gap-3">
                                                        <div className="flex-1 px-3 py-2 bg-white dark:bg-zinc-950/60 rounded-xl text-sm font-medium text-zinc-650 dark:text-zinc-350 truncate border border-zinc-200/40 dark:border-zinc-800/40">
                                                            {inviteLink}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={copyInviteLink}
                                                            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm shrink-0 border cursor-pointer ${
                                                                showInviteLinkCopied 
                                                                    ? 'bg-emerald-500 border-emerald-600 text-white shadow-emerald-500/20' 
                                                                    : isDarkMode
                                                                    ? 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700 hover:text-white'
                                                                    : 'bg-zinc-900 border-zinc-900 text-white hover:bg-zinc-800'
                                                            }`}
                                                        >
                                                            {showInviteLinkCopied ? (
                                                                <><Check size={14} strokeWidth={3} /> Copied</>
                                                            ) : (
                                                                <><Copy size={14} strokeWidth={2.5} /> Copy</>
                                                            )}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Privacy Settings */}
                                            <div className="space-y-4 pt-2">
                                                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block">
                                                    Privacy & Limits
                                                </label>
                                                
                                                <div className="bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200/50 dark:border-zinc-800/80 rounded-[1rem] p-2 shadow-inner divide-y divide-zinc-200/50 dark:divide-zinc-800/60 flex flex-col">
                                                    {/* Private Toggle */}
                                                    <div className={`p-3.5 hover:bg-white dark:hover:bg-zinc-950/60 transition-colors rounded-[14px] flex items-center justify-between cursor-pointer border border-transparent hover:border-zinc-200/80 dark:hover:border-zinc-800/80 hover:shadow-sm`} onClick={() => setIsPrivate(!isPrivate)}>
                                                        <div>
                                                            <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-0.5">Private Workspace</div>
                                                            <div className="text-[12.5px] text-zinc-500 font-medium">Only invited members can view and join.</div>
                                                        </div>
                                                        <div style={{ flexShrink: 0, marginLeft: '12px', transform: 'scale(0.85)', transformOrigin: 'right' }}>
                                                            <UiverseSwitch checked={isPrivate} onChange={setIsPrivate} />
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Max Members */}
                                                    <div className="p-3 hover:bg-white dark:hover:bg-zinc-950/60 transition-colors rounded-[12px] flex items-center justify-between gap-4 first:pt-3 last:pb-3">
                                                        <div>
                                                            <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-0.5">Max Members</div>
                                                            <div className="text-xs text-zinc-500 font-medium">Limit the number of people who can join.</div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <input 
                                                                type="range" 
                                                                min="2" 
                                                                max="50" 
                                                                value={maxMembers} 
                                                                onChange={(e) => setMaxMembers(parseInt(e.target.value))}
                                                                className="w-24 accent-blue-500 cursor-pointer"
                                                            />
                                                            <span className="text-sm font-bold text-zinc-900 dark:text-white w-6 text-center">{maxMembers}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                         </motion.div>
                                     )}
                                </AnimatePresence>
                            </div>

                            {/* Bottom Footer actions (sticky) */}
                            <motion.div 
                                animate={{ padding: isMinimized ? '16px 24px' : '20px 32px' }}
                                className="border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-[#0f172a]/80 backdrop-blur-xl flex items-center justify-between sticky bottom-0 z-20"
                            >
                                {step === 1 ? (
                                    <>
                                        <button onClick={onClose} className="min-w-[140px] h-[44px] px-6 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-300 rounded-[14px] text-sm font-bold flex items-center justify-center gap-2 transition-all">
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={() => name.trim().length >= 3 && setStep(2)} 
                                            disabled={name.trim().length < 3}
                                            className="min-w-[140px] h-[44px] px-6 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900/70 text-blue-700 dark:text-blue-300 rounded-[14px] text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Next Step
                                            <ChevronRight size={16} strokeWidth={3} />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => setStep(1)} className="min-w-[140px] h-[44px] px-6 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-300 rounded-[14px] text-sm font-bold flex items-center justify-center gap-2 transition-all">
                                            Back
                                        </button>
                                        <button 
                                            onClick={handleCreate} 
                                            disabled={isCreating}
                                            className="min-w-[140px] h-[44px] px-6 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900/70 text-blue-700 dark:text-blue-300 rounded-[14px] text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isCreating ? (
                                                <>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="animate-spin">
                                                        <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                                                        <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                                                    </svg>
                                                    Creating...
                                                </>
                                            ) : (
                                                'Create Group'
                                            )}
                                        </button>
                                    </>
                                )}
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default CreateGroupModal;
