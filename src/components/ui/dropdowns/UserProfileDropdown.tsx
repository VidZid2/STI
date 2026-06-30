'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';
import useClickOutside from '@/hooks/useClickOutside';
import { UiverseSwitch } from '../UiverseSwitch';

// Hook to detect dark mode
function useDarkMode() {
    const [isDark, setIsDark] = useState(() => 
        typeof document !== 'undefined' && document.body.classList.contains('dark-mode')
    );
    
    useEffect(() => {
        const checkDarkMode = () => {
            setIsDark(document.body.classList.contains('dark-mode'));
        };
        checkDarkMode();
        
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        
        return () => observer.disconnect();
    }, []);
    
    return isDark;
}
import {
    type UserProfile,
    type UserSettings,
    getProfile,
    saveProfile,
    getImages,
    saveCoverImage,
    saveProfileImage,
    getSettings,
    saveSettings,
} from '@/services/profileService';
import {
    getXPProgress,
    getCurrentLevel,
    checkRecentLevelUp,
    clearLevelUpNotification,
    getXPData,
    getXPNeededForLevel,
} from '@/services/studyTimeService';

import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar";
import { AvatarUploader } from "@/components/ui/avatar-uploader";
import { CoverUploader } from "@/components/ui/cover-uploader";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


type ProfileTab = 'profile' | 'settings';

export default function UserProfileDropdown() {
    const navigate = useNavigate();
    const isDarkMode = useDarkMode();
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<ProfileTab>('profile');
    const [profile, setProfile] = useState<UserProfile>(() => getProfile());
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [editedProfile, setEditedProfile] = useState<UserProfile>(() => getProfile());
    const [coverImage, setCoverImage] = useState<string | null>(() => getImages().coverImage);
    const [profileImage, setProfileImage] = useState<string | null>(() => getImages().profileImage);
    const [showOnlineStatus, setShowOnlineStatus] = useState(() => getSettings().showOnlineStatus);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [xpProgress, setXpProgress] = useState(() => getXPProgress());
    const [level, setLevel] = useState(() => getCurrentLevel());
    const [isAvatarHovered, setIsAvatarHovered] = useState(false);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [lastTotalXP, setLastTotalXP] = useState(() => getXPData().totalXP);
    const ref = useRef<HTMLDivElement>(null!);
    const modalRef = useRef<HTMLDivElement>(null);
    const [isScrolled, setIsScrolled] = useState(false);


    // Check for level up
    useEffect(() => {
        const checkXP = () => {
            const currentData = getXPData();
            const newProgress = getXPProgress();
            const newLevel = getCurrentLevel();
            
            // Check if XP increased
            if (currentData.totalXP > lastTotalXP) {
                setLastTotalXP(currentData.totalXP); // Update the tracked XP
            }
            
            setXpProgress(newProgress);
            setLevel(newLevel);
            
            if (checkRecentLevelUp()) {
                setShowLevelUp(true);
                setTimeout(() => {
                    setShowLevelUp(false);
                    clearLevelUpNotification();
                }, 3000);
            }
        };
        
        checkXP();
        const interval = setInterval(checkXP, 5000);
        return () => clearInterval(interval);
    }, [lastTotalXP]); // Add lastTotalXP to dependency array to fix the bug

    // Listen for settings changes across components
    useEffect(() => {
        const handleSettingsUpdated = () => {
            setShowOnlineStatus(getSettings().showOnlineStatus);
        };
        window.addEventListener('settingsUpdated', handleSettingsUpdated);
        return () => window.removeEventListener('settingsUpdated', handleSettingsUpdated);
    }, []);

    // Handle sign out with fade transition
    const handleSignOut = () => {
        setIsSigningOut(true);
        setIsOpen(false);
        // Set flag for landing page to show fade out
        sessionStorage.setItem('fromSignOut', 'true');
        // Wait for fade animation then navigate
        setTimeout(() => {
            navigate('/');
        }, 600);
    };

    // Load saved data on mount
    useEffect(() => {
        const savedProfile = getProfile();
        const savedImages = getImages();
        setProfile(savedProfile);
        setEditedProfile(savedProfile);
        setCoverImage(savedImages.coverImage);
        setProfileImage(savedImages.profileImage);
    }, []);

    // Clear save message after 3 seconds
    useEffect(() => {
        if (saveMessage) {
            const timer = setTimeout(() => setSaveMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [saveMessage]);

    // Compress image to fit localStorage limits (preserves GIFs)
    const compressImage = (file: File, maxWidth: number, maxHeight: number, quality: number): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                
                // If it's a GIF, don't compress - preserve animation
                if (file.type === 'image/gif') {
                    // Check if file size is reasonable for localStorage (< 2MB)
                    if (file.size < 2 * 1024 * 1024) {
                        resolve(dataUrl);
                    } else {
                        reject(new Error('GIF file is too large. Please use a smaller GIF (under 2MB).'));
                    }
                    return;
                }
                
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let { width, height } = img;
                    
                    // Calculate new dimensions
                    if (width > maxWidth || height > maxHeight) {
                        const ratio = Math.min(maxWidth / width, maxHeight / height);
                        width = Math.round(width * ratio);
                        height = Math.round(height * ratio);
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error('Could not get canvas context'));
                        return;
                    }
                    
                    ctx.drawImage(img, 0, 0, width, height);
                    const compressedData = canvas.toDataURL('image/jpeg', quality);
                    resolve(compressedData);
                };
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = dataUrl;
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    };

    const handleCoverUploadFile = async (file: File) => {
        try {
            // Compress cover image: max 800x300, 70% quality
            const compressedImage = await compressImage(file, 800, 300, 0.7);
            setCoverImage(compressedImage);
            await saveCoverImage(compressedImage);
            return { success: true };
        } catch (error) {
            console.error('Error compressing cover image:', error);
            return { success: false };
        }
    };


    const handleProfileUploadFile = async (file: File) => {
        try {
            // Compress profile image: max 200x200, 70% quality
            const compressedImage = await compressImage(file, 200, 200, 0.7);
            setProfileImage(compressedImage);
            await saveProfileImage(compressedImage);
            return { success: true };
        } catch (error) {
            console.error('Error compressing profile image:', error);
            return { success: false };
        }
    };

    useClickOutside(ref, (event) => {
        if (isOpen && modalRef.current && modalRef.current.contains(event.target as Node)) {
            return;
        }
        // Don't close if the avatar or cover uploader modal is open
        if (document.querySelector('[data-avatar-uploader-open]') || document.querySelector('[data-cover-uploader-open]')) {
            return;
        }

        setIsOpen(false);
        setIsEditing(false);
    });

    const handleSave = async () => {
        setIsSaving(true);
        const result = await saveProfile(editedProfile);
        setIsSaving(false);
        
        if (result.success) {
            setProfile(editedProfile);
            setIsEditing(false);
            setSaveMessage({ type: 'success', text: result.message });
        } else {
            setSaveMessage({ type: 'error', text: result.message });
        }
    };

    const handleCancel = () => {
        setEditedProfile(profile);
        setIsEditing(false);
    };

    const getInitials = (first: string, last: string) => {
        return `${first[0]}${last[0]}`.toUpperCase();
    };

    const getLevelTitle = (lvl: number) => {
        if (lvl < 5) return 'New Scholar';
        if (lvl < 10) return 'Rising Student';
        if (lvl < 20) return 'Dedicated Learner';
        if (lvl < 30) return 'Academic Achiever';
        if (lvl < 40) return 'Honor Student';
        if (lvl < 50) return 'Distinguished Scholar';
        return 'Master Academic';
    };

    return (
        <>
            {/* Sign Out Fade Overlay - covers everything including dock */}
            <AnimatePresence>
                {isSigningOut && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            width: '100vw', height: '100vh',
                            backgroundColor: 'white',
                            zIndex: 2147483647, pointerEvents: 'all',
                        }}
                    />
                )}
            </AnimatePresence>

            <div ref={ref} className='relative'>
                {/* Profile Button */}
                <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsOpen(!isOpen)}
                    onMouseEnter={() => setIsAvatarHovered(true)}
                    onMouseLeave={() => setIsAvatarHovered(false)}
                    className={cn(
                        'relative flex items-center gap-2.5 px-0 sm:px-1.5 py-1 rounded-xl transition-all duration-150',
                        isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-zinc-50'
                    )}
                >
                    {/* Premium SaaS Avatar Container */}
                    <div className="relative shrink-0 w-8 h-8 sm:w-10 sm:h-10 sm:mr-1.5 flex items-center justify-center">
                        {/* Circular Level Gauge */}
                        <AnimatedCircularProgressBar
                            max={100}
                            min={0}
                            value={xpProgress}
                            gaugePrimaryColor={level >= 20 ? '#eab308' : '#3b82f6'}
                            gaugeSecondaryColor={isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(219, 234, 254, 0.6)'}
                            className="w-8 h-8 sm:w-10 sm:h-10 shrink-0"
                        >
                            <div className="absolute inset-1 sm:inset-1.5 rounded-full flex items-center justify-center shadow-sm overflow-hidden z-10" style={{ background: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(219, 234, 254, 0.6)' }}>
                                {profileImage ? (
                                    <img src={profileImage} alt="Profile" className='w-full h-full object-cover' />
                                ) : (
                                    <div className={cn('w-full h-full flex items-center justify-center font-bold text-[15px]', isDarkMode ? 'text-blue-400' : 'text-blue-600')}>
                                        {getInitials(profile.firstName, profile.lastName)}
                                    </div>
                                )}
                            </div>
                            
                            {/* Level Badge overlapping bottom center (Hidden on mobile to reduce clutter) */}
                            <div className="hidden sm:flex absolute -bottom-1 left-1/2 -translate-x-1/2 z-20 justify-center">
                                <motion.div 
                                    className={cn(
                                        `min-w-[32px] h-[16px] px-1 rounded-md flex items-center justify-center text-[8.5px] font-bold tracking-wider shadow-sm border-[2px] transition-colors duration-300 ${level >= 20 ? 'bg-yellow-400 text-blue-800' : 'bg-blue-500 text-white'}`,
                                        isDarkMode ? (showOnlineStatus ? 'border-emerald-400' : 'border-slate-800') : (showOnlineStatus ? 'border-emerald-500' : 'border-white')
                                    )}
                                    animate={showLevelUp ? { scale: [1, 1.3, 1] } : {}}
                                    transition={{ duration: 0.5 }}
                                >
                                    <span className="ml-[0.05em]">{level >= 20 ? 'MAX' : `LV.${level}`}</span>
                                </motion.div>
                            </div>
                        </AnimatedCircularProgressBar>
                    </div>

                    {/* Text Content matching Tools Page Cards */}
                    <div className='flex flex-col justify-center min-w-[70px] flex-1 text-left hidden sm:flex'>
                        <div className={cn('text-[13px] font-bold leading-tight whitespace-nowrap', isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                            {profile.firstName} {profile.lastName}
                        </div>
                        <div className={cn('text-[10.5px] font-medium leading-tight mt-0.5 whitespace-nowrap truncate max-w-[150px]', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                            {profile.course}
                        </div>
                    </div>
                </motion.button>
            
            {/* XP Tooltip — Minimalist SaaS */}
            <AnimatePresence>
                {isAvatarHovered && !isOpen && (
                    <div className="absolute top-full mt-2 right-[-22px] z-50 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92, filter: "blur(4px)" }}
                            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                            exit={{ opacity: 0, scale: 0.92, filter: "blur(4px)" }}
                            transition={{ 
                                type: "spring", stiffness: 400, damping: 24, mass: 0.6, 
                                filter: { type: "tween", ease: "easeOut", duration: 0.2 } 
                            }}
                            style={{ transformOrigin: 'top center' }}
                        >
                            <div className={cn(
                                "w-[250px] sm:w-[260px] rounded-[20px] border p-4 flex flex-col gap-3.5 relative transition-all duration-300",
                                isDarkMode ? "bg-slate-900 border-slate-800/80 shadow-[0_12px_30px_rgba(0,0,0,0.5)]" : "bg-white border-slate-200/80 shadow-[0_12px_30px_rgba(0,0,0,0.06)]"
                            )}>
                                {/* Arrow aligned to Avatar Center */}
                                <div className={cn(
                                    "absolute -top-[5px] right-[74px] sm:right-auto sm:left-[54px] w-[10px] h-[10px] rotate-45 border-l border-t z-10",
                                    isDarkMode ? "bg-slate-900 border-slate-800/80" : "bg-white border-slate-200/80"
                                )} />
                                
                                <div className="flex items-center gap-3 relative z-10">
                                    <div className={cn("w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0 shadow-sm border", 
                                        level >= 20 
                                            ? (isDarkMode ? "bg-yellow-500/10 border-yellow-500/20" : "bg-yellow-50 border-yellow-200") 
                                            : (isDarkMode ? "bg-blue-500/10 border-blue-500/20" : "bg-blue-50 border-blue-100")
                                    )}>
                                        {level >= 20 ? (
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? '#facc15' : '#eab308'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? '#60a5fa' : '#3b82f6'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
                                            {level >= 20 ? 'MAX Level' : `Level ${level}`}
                                        </h1>
                                        <span className={cn("text-[11px] font-bold leading-none mt-0.5", 
                                            level >= 20 ? (isDarkMode ? "text-yellow-400" : "text-yellow-600") : (isDarkMode ? "text-blue-400" : "text-blue-600")
                                        )}>{getLevelTitle(level)}</span>
                                    </div>
                                </div>
                                <div className={cn("flex items-center gap-3 p-3 rounded-[16px] border transition-colors relative z-10", 
                                    level >= 20 
                                        ? (isDarkMode ? "bg-slate-800/40 border-yellow-500/30" : "bg-yellow-50/50 border-yellow-200") 
                                        : (isDarkMode ? "bg-slate-800/40 border-slate-800/80" : "bg-slate-50/50 border-slate-100")
                                )}>
                                    <div className="flex flex-col text-left">
                                        <p className={cn("text-[9px] font-bold uppercase tracking-wider mb-0.5", 
                                            level >= 20 ? (isDarkMode ? "text-yellow-400" : "text-yellow-600") : (isDarkMode ? "text-blue-400" : "text-blue-600")
                                        )}>
                                            {level >= 20 ? 'LEGENDARY STATUS' : 'Almost There!'}
                                        </p>
                                        <p className="text-[12.5px] font-bold text-slate-900 dark:text-slate-100 leading-none">
                                            {level >= 20 ? (
                                                <>{getXPData().totalXP.toLocaleString()} <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Total XP Earned</span></>
                                            ) : (
                                                <>{getXPNeededForLevel(level) - getXPData().xpInCurrentLevel} <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">XP to Lv.{level + 1}</span></>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5 relative z-10">
                                    <div className={cn("h-2.5 w-full rounded-full overflow-hidden", 
                                        level >= 20 ? (isDarkMode ? "bg-yellow-900/30" : "bg-yellow-100") : (isDarkMode ? "bg-slate-700" : "bg-slate-200/80")
                                    )}>
                                        <motion.div 
                                            className={cn("h-full rounded-full", 
                                                level >= 20 ? "bg-gradient-to-r from-yellow-400 to-yellow-300" : "bg-gradient-to-r from-blue-500 to-blue-400"
                                            )} 
                                            initial={{ width: 0 }} 
                                            animate={{ width: level >= 20 ? '100%' : `${xpProgress}%` }} 
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal Overlay Panel */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 md:p-12 pointer-events-auto"
                        >
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                                onClick={() => { if (!document.querySelector('[data-avatar-uploader-open]') && !document.querySelector('[data-cover-uploader-open]')) setIsOpen(false); }}
                            />

                            {/* Modal Card - Responsive layout that works on Mobile and Desktop */}
                            <motion.div
                                ref={modalRef}
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }}
                                className={cn(
                                    "relative w-full max-w-3xl max-h-[92vh] sm:max-h-[85vh] rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col pointer-events-auto",
                                    isDarkMode ? "bg-slate-900 border border-slate-700/60" : "bg-white border border-slate-200/50"
                                )}
                                onClick={(e) => e.stopPropagation()}
                            >




                                {/* Scrollable Body */}
                                <div 
                                    className="flex-1 overflow-y-auto custom-scrollbar relative z-10" 
                                    style={{ scrollbarWidth: 'none' }}
                                    onScroll={(e) => setIsScrolled(e.currentTarget.scrollTop > 10)}
                                >
                                    {/* 1. Cohesive Background Banner */}
                                    <div className="absolute top-0 left-0 right-0 h-40 sm:h-48 md:h-56 z-0 pointer-events-none overflow-hidden group">
                                        {coverImage ? (
                                            <img src={coverImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Cover" />
                                        ) : (
                                            <div className="w-full h-full relative bg-gradient-to-br from-blue-600 via-indigo-500 to-violet-500">
                                                {/* Subtle animated pattern overlay */}
                                                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                                            </div>
                                        )}
                                        {/* Fade Gradient at the bottom - Much stronger fade */}
                                        <div className={cn(
                                            "absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t to-transparent",
                                            isDarkMode ? "from-slate-900" : "from-white"
                                        )}></div>
                                    </div>
                                    
                                    {/* Edit Banner Button (Premium Glassmorphic) */}
                                    <CoverUploader onUpload={handleCoverUploadFile}>
                                        <div className="absolute top-24 sm:top-32 md:top-40 right-4 sm:right-6 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-700 dark:text-slate-200 text-[11px] sm:text-xs font-bold rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer z-20 flex items-center gap-1.5 sm:gap-2 border border-slate-200/50 dark:border-slate-700/50 pointer-events-auto group/edit">
                                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-300 group-hover/edit:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span className="hidden sm:inline-block tracking-wide">Edit Cover</span>
                                        </div>
                                    </CoverUploader>

                                    <div className="px-4 sm:px-8 pb-8 pt-20 sm:pt-24 md:pt-32 relative z-10">
                                        
                                        {/* 2. Avatar & Info Section */}
                                        <div className="relative flex flex-col items-center sm:flex-row sm:items-end justify-between mb-6 gap-4 sm:gap-6 w-full z-10 pointer-events-none flex-wrap">
                                            <div className="flex flex-col items-center sm:flex-row sm:items-end gap-3 sm:gap-5 min-w-0 max-w-full pointer-events-auto">
                                                {/* Avatar */}
                                                <div className="relative z-10 p-1.5 bg-white dark:bg-slate-900 rounded-full shrink-0 inline-block shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
                                                    <AnimatedCircularProgressBar
                                                        max={100}
                                                        min={0}
                                                        value={xpProgress}
                                                        gaugePrimaryColor={level >= 20 ? '#eab308' : '#3b82f6'}
                                                        gaugeSecondaryColor={isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(219, 234, 254, 0.6)'}
                                                        className="!w-20 !h-20 sm:!w-28 sm:!h-28 md:!w-32 md:!h-32"
                                                    >
                                                        <AvatarUploader onUpload={handleProfileUploadFile}>
                                                            <div className="absolute inset-1.5 sm:inset-2 md:inset-2.5 rounded-full z-10 cursor-pointer overflow-hidden border-4 border-transparent hover:border-blue-500/50 transition-all">
                                                                <Avatar className="w-full h-full rounded-full cursor-pointer hover:opacity-80 transition-opacity">
                                                                    <AvatarImage src={profileImage || ''} className="object-cover w-full h-full" />
                                                                    <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold text-2xl sm:text-4xl shadow-inner w-full h-full">
                                                                        {getInitials(profile.firstName, profile.lastName)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                            </div>
                                                        </AvatarUploader>
                                                        
                                                        <div className={cn(
                                                            `absolute -bottom-1 sm:-bottom-1.5 left-1/2 -translate-x-1/2 min-w-[40px] sm:min-w-[50px] md:min-w-[56px] h-[20px] sm:h-[24px] md:h-[26px] px-2 rounded-md sm:rounded-lg flex items-center justify-center text-[10px] sm:text-[12px] md:text-[13px] font-bold tracking-wider shadow-sm border-[2px] z-20 transition-colors duration-300 ${level >= 20 ? 'bg-yellow-400 text-blue-800' : 'bg-blue-500 text-white'}`,
                                                            isDarkMode ? (showOnlineStatus ? 'border-emerald-400' : 'border-slate-800') : (showOnlineStatus ? 'border-emerald-500' : 'border-white')
                                                        )}>
                                                            <span className="ml-[0.05em]">{level >= 20 ? 'MAX' : `LV.${level}`}</span>
                                                        </div>

                                                        {/* Mobile persistent edit badge */}
                                                        <div className="sm:hidden absolute bottom-1 right-0 w-7 h-7 bg-blue-600 text-white rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-md pointer-events-none z-20">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                        </div>
                                                    </AnimatedCircularProgressBar>
                                                </div>
                                                
                                                {/* Name & Basic Info */}
                                                <div className="pb-1 sm:pb-3 flex flex-col items-center sm:items-start text-center sm:text-left mt-2 sm:mt-0 w-full sm:w-auto">
                                                    
                                                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                                                        {profile.firstName} {profile.lastName}
                                                    </h1>
                                                    <p className="text-[13px] sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                                                        {profile.email}
                                                    </p>

                                                    {/* NEW STUDENT ID BADGE */}
                                                    <div className="flex items-center gap-1.5 mt-2 bg-slate-50/80 dark:bg-slate-800/80 rounded-[8px] py-[3px] pl-2.5 pr-[3px] w-max mx-auto sm:mx-0 shadow-sm border border-slate-200/80 dark:border-slate-700/80 backdrop-blur-sm h-[28px]">
                                                        <div className="flex items-center gap-1.5 pl-0.5">
                                                            <span className="text-[9.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none mt-[1px]">Student ID</span>
                                                            <div className="w-[1.5px] h-3 bg-slate-300 dark:bg-slate-600 rounded-full shrink-0"></div>
                                                            <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200 leading-none tracking-wide truncate max-w-[120px] sm:max-w-none">{profile.studentId}</span>
                                                        </div>
                                                        
                                                        {/* Copy Button */}
                                                        <div 
                                                            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(profile.studentId); }}
                                                            className="w-[22px] min-w-[22px] h-[22px] min-h-[22px] flex items-center justify-center rounded-md bg-slate-100/80 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all active:scale-95 ml-1 cursor-pointer shrink-0"
                                                            title="Copy ID"
                                                            role="button"
                                                            tabIndex={0}
                                                        >
                                                            <svg className="w-3 h-3 text-slate-600 dark:text-slate-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                <rect x="9" y="9" width="13" height="13" rx="3" ry="3" />
                                                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>



                                        {/* Save Message Toast */}
                                        <AnimatePresence>
                                            {saveMessage && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className={cn(
                                                        'mb-6 px-4 py-3 rounded-xl text-[13px] font-bold flex items-center gap-2.5',
                                                        saveMessage.type === 'success' 
                                                            ? isDarkMode ? 'bg-green-500/15 text-green-400 border border-green-500/30' : 'bg-green-50 text-green-700 border border-green-200'
                                                            : isDarkMode ? 'bg-red-500/15 text-red-400 border border-red-500/30' : 'bg-red-50 text-red-700 border border-red-200'
                                                    )}
                                                >
                                                    {saveMessage.type === 'success' ? (
                                                        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M5 13l4 4L19 7' /></svg>
                                                    ) : (
                                                        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M6 18L18 6M6 6l12 12' /></svg>
                                                    )}
                                                    {saveMessage.text}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* 4. Horizontal Tabs (Sticky for Mobile & Desktop) - Redesigned as Segmented Control */}
                                    <div className={cn(
                                        "sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl z-30 pt-4 pb-2 px-4 sm:px-8 transition-all duration-200 border-b border-slate-200 dark:border-slate-700/80",
                                        isScrolled ? "shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_20px_-10px_rgba(0,0,0,0.3)] border-transparent" : ""
                                    )}>
                                        <div className="flex items-center gap-2.5 sm:gap-3 w-full">
                                            <div className="flex-1 flex items-center p-1.5 bg-slate-100/80 dark:bg-slate-800/80 rounded-[16px] border border-slate-200/50 dark:border-slate-700/50 shadow-inner overflow-hidden">
                                            <button 
                                                onClick={() => setActiveTab('profile')}
                                                className={cn(
                                                    "relative flex-1 justify-center py-2.5 sm:py-3 rounded-[12px] text-[13px] sm:text-[14px] font-bold whitespace-nowrap transition-colors flex items-center gap-2",
                                                    activeTab === 'profile' 
                                                        ? "text-slate-900 dark:text-white" 
                                                        : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                                                )}
                                            >
                                                {activeTab === 'profile' && (
                                                    <motion.div
                                                        layoutId="active-tab-indicator"
                                                        className="absolute inset-0 bg-white dark:bg-slate-700 rounded-[12px] shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-600"
                                                        transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                                                    />
                                                )}
                                                <svg className='w-4 h-4 hidden sm:block relative z-10' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' /></svg>
                                                <span className="hidden sm:block relative z-10">Personal Info</span>
                                                <span className="sm:hidden relative z-10">Profile</span>
                                            </button>
                                            <button 
                                                onClick={() => setActiveTab('settings')}
                                                className={cn(
                                                    "relative flex-1 justify-center py-2.5 sm:py-3 rounded-[12px] text-[13px] sm:text-[14px] font-bold whitespace-nowrap transition-colors flex items-center gap-2",
                                                    activeTab === 'settings' 
                                                        ? "text-slate-900 dark:text-white" 
                                                        : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                                                )}
                                            >
                                                {activeTab === 'settings' && (
                                                    <motion.div
                                                        layoutId="active-tab-indicator"
                                                        className="absolute inset-0 bg-white dark:bg-slate-700 rounded-[12px] shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-600"
                                                        transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                                                    />
                                                )}
                                                <svg className='w-4 h-4 hidden sm:block relative z-10' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' /><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' /></svg>
                                                <span className="hidden sm:block relative z-10">Account Settings</span>
                                                <span className="sm:hidden relative z-10">Settings</span>
                                            </button>
                                            
                                            <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700 mx-1.5 shrink-0"></div>
                                            
                                            <button 
                                                onClick={handleSignOut}
                                                className="px-3 sm:px-5 py-2.5 sm:py-3 rounded-[12px] text-[13px] sm:text-[14px] font-bold text-red-600 dark:text-red-400 bg-white sm:bg-transparent dark:bg-slate-700 sm:dark:bg-transparent shadow-sm sm:shadow-none hover:bg-white dark:hover:bg-slate-700 whitespace-nowrap transition-colors flex items-center justify-center gap-1.5 shrink-0"
                                            >
                                                <svg className='w-4 h-4 sm:w-4 sm:h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1' /></svg>
                                                <span className="hidden sm:inline">Sign Out</span>
                                            </button>
                                            
                                            <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0"></div>

                                            {/* Close Button Inside Container */}
                                            <button 
                                                onClick={() => setIsOpen(false)} 
                                                className="shrink-0 flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 text-slate-500 bg-white sm:bg-transparent dark:bg-slate-700 sm:dark:bg-transparent shadow-sm sm:shadow-none hover:bg-white hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100 rounded-[12px] transition-colors group/close"
                                                title="Close Profile"
                                            >
                                                <svg className="w-5 h-5 transition-transform duration-300 group-hover/close:rotate-90 group-hover/close:scale-110" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-4 sm:px-8 pb-8 pt-4">

                                        {/* 5. Tab Content Area */}
                                        <div className="relative min-h-[300px]">
                                            <AnimatePresence mode='wait'>
                                                {activeTab === 'profile' && (
                                                    <ProfileContent
                                                        profile={isEditing ? editedProfile : profile}
                                                        isEditing={isEditing}
                                                        isSaving={isSaving}
                                                        onEdit={() => { setEditedProfile(profile); setIsEditing(true); }}
                                                        onSave={handleSave}
                                                        onCancel={handleCancel}
                                                        onChange={(field: keyof UserProfile, value: string) => setEditedProfile({ ...editedProfile, [field]: value })}
                                                        isDarkMode={isDarkMode}
                                                    />
                                                )}
                                                {activeTab === 'settings' && (
                                                    <SettingsContent onShowOnlineStatusChange={setShowOnlineStatus} isDarkMode={isDarkMode} />
                                                )}
                                            </AnimatePresence>
                                        </div>

                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>

        </>
    );
}

function ProfileContent({ profile, isEditing, isSaving, onEdit, onSave, onCancel, onChange, isDarkMode: _isDarkMode }: any) {
    const sections = [
        {
            title: "Personal Information",
            desc: "Review and update your fundamental personal identity records.",
            icon: <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
            fields: [
                { key: "firstName", label: "First Name", editable: true },
                { key: "lastName", label: "Last Name", editable: true },
                { key: "birthday", label: "Birthday", type: "date", editable: true }
            ]
        },
        {
            title: "Academic Details",
            desc: "Your institutional status and enrolled program credentials.",
            icon: <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>,
            fields: [
                { key: "studentId", label: "Student ID", editable: false },
                { key: "course", label: "Program", editable: false },
                { key: "yearLevel", label: "Year Level", editable: false },
                { key: "section", label: "Section", editable: false }
            ]
        },
        {
            title: "Contact Information",
            desc: "Keep your communication channels and physical location current.",
            icon: <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
            fields: [
                { key: "email", label: "Email Address", type: "email", editable: false },
                { key: "phone", label: "Phone Number", type: "tel", editable: true },
                { key: "address", label: "Address", editable: true }
            ]
        }
    ];

    return (
        <motion.div key="profile" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1.0] }} className='space-y-6 relative pb-2 sm:pb-4'>
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-800/40 dark:to-slate-800/10 border border-slate-200/60 dark:border-slate-700/50 rounded-[1.25rem] p-5 sm:p-6 mt-2 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                {/* Decorative background blur */}
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-blue-500/10 dark:bg-blue-400/5 rounded-full blur-2xl pointer-events-none"></div>
                
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm border border-slate-200/60 dark:border-slate-700/60 shrink-0">
                        <svg className="w-6 h-6 text-slate-700 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
                    </div>
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">Profile Details</h2>
                        <p className="text-[13px] sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage your personal and academic information.</p>
                    </div>
                </div>

                <div className="relative z-10 w-full sm:w-auto shrink-0">
                    {!isEditing && (
                        <motion.button 
                            initial={{ opacity: 0, scale: 0.9 }} 
                            animate={{ opacity: 1, scale: 1 }} 
                            whileHover={{ scale: 1.05 }} 
                            whileTap={{ scale: 0.95 }} 
                            onClick={onEdit} 
                            className='w-full sm:w-auto px-5 py-2.5 text-[14px] font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm border border-slate-200/80 dark:border-slate-700/80'
                        >
                            <svg className='w-4 h-4 text-blue-600 dark:text-blue-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' /></svg>
                            Edit Profile
                        </motion.button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {sections.map((section, sectionIndex) => (
                    <motion.div key={section.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: sectionIndex * 0.1 }} className={cn('relative overflow-hidden bg-white dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 rounded-[1.25rem] p-5 sm:p-6 flex flex-col gap-5 transition-all duration-300 hover:shadow-sm', sectionIndex === 2 ? 'lg:col-span-2' : '')}>
                        <div className='flex items-center gap-4 relative z-10'>
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border", sectionIndex === 0 ? "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/50" : sectionIndex === 1 ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/50" : "bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800/50")}>
                                {section.icon}
                            </div>
                            <div>
                                <h3 className="text-[16px] font-bold text-slate-900 dark:text-white tracking-tight">{section.title}</h3>
                                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">{section.desc}</p>
                            </div>
                        </div>

                        <div className='bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-[1rem] p-3 shadow-inner divide-y divide-slate-100 dark:divide-slate-800/80'>
                            {section.fields.map((field) => (
                                <div key={field.key} className='flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 py-3 first:pt-1 last:pb-1'>
                                    <span className='text-[13px] font-semibold text-slate-500 dark:text-slate-400 shrink-0 min-w-[120px]'>{field.label}</span>
                                    {isEditing && field.editable ? (
                                        <input
                                            type={'type' in field ? field.type : 'text'}
                                            value={profile[field.key as keyof UserProfile] as string}
                                            onChange={(e) => onChange(field.key, e.target.value)}
                                            className='flex-1 min-w-0 px-3 py-2 text-[14px] font-bold text-slate-900 dark:text-white sm:text-right border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 bg-white dark:bg-slate-800 transition-all'
                                        />
                                    ) : (
                                        <span className='text-[14px] font-bold text-slate-900 dark:text-white sm:text-right truncate min-w-0'>{profile[field.key as keyof UserProfile] as React.ReactNode}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>

            <AnimatePresence>
                {isEditing && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className='sticky bottom-0 -mx-5 sm:-mx-8 -mb-5 sm:-mb-8 mt-6 p-4 sm:p-5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200/50 dark:border-slate-700/50 flex flex-col sm:flex-row gap-3 sm:justify-end z-20'>
                        <button onClick={onCancel} disabled={isSaving} className='w-full sm:w-auto px-6 py-2.5 text-[14px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-all disabled:opacity-50'>Cancel</button>
                        <button onClick={onSave} disabled={isSaving} className='w-full sm:w-auto px-6 py-2.5 text-[14px] font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-full transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed'>
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function SettingsContent({ onShowOnlineStatusChange, isDarkMode: _isDarkMode }: any) {
    const [settings, setSettings] = useState<UserSettings>(() => getSettings());
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

    useEffect(() => { if ('Notification' in window) setNotificationPermission(Notification.permission); }, []);

    const toggleSetting = async (key: keyof UserSettings) => {
        const newValue = !settings[key];
        const newSettings = { ...settings, [key]: newValue };
        setSettings(newSettings);
        await saveSettings(newSettings);
        if (key === 'showOnlineStatus' && onShowOnlineStatusChange) onShowOnlineStatusChange(newValue);
    };

    const settingGroups = [
        {
            title: 'Notifications',
            desc: 'Manage how and when you receive important updates.',
            icon: <svg className='w-6 h-6 text-blue-600 dark:text-blue-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' /></svg>,
            items: [
                { key: 'emailNotifications' as const, label: 'Email Notifications', desc: 'Receive updates via email' },
                { key: 'pushNotifications' as const, label: 'Push Notifications', desc: notificationPermission === 'denied' ? 'Blocked by browser' : 'Browser notifications' },
                { key: 'courseReminders' as const, label: 'Course Reminders', desc: 'Upcoming class alerts' },
                { key: 'assignmentAlerts' as const, label: 'Assignment Alerts', desc: 'Due date reminders' },
                { key: 'gradeUpdates' as const, label: 'Grade Updates', desc: 'New grade notifications' },
            ]
        },
        {
            title: 'Privacy',
            desc: 'Control your visibility and data preferences.',
            icon: <svg className='w-6 h-6 text-emerald-600 dark:text-emerald-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' /></svg>,
            items: [
                { key: 'showOnlineStatus' as const, label: 'Show Online Status', desc: 'Let others see when you\'re online' },
            ]
        }
    ];

    return (
        <motion.div key="settings" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1.0] }} className='space-y-6 pb-4'>
            <div className="mt-2 mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">App Settings</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Customize your app experience.</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {settingGroups.map((group, groupIndex) => (
                    <motion.div key={group.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: groupIndex * 0.1 }} className='relative overflow-hidden bg-white dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 rounded-[1.25rem] p-5 sm:p-6 flex flex-col gap-5 transition-all duration-300 hover:shadow-sm'>
                        <div className='flex items-center gap-4 relative z-10'>
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border", groupIndex === 0 ? "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/50" : "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/50")}>
                                {group.icon}
                            </div>
                            <div>
                                <h3 className="text-[16px] font-bold text-slate-900 dark:text-white tracking-tight">{group.title}</h3>
                                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">{group.desc}</p>
                            </div>
                        </div>

                        <div className='bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-[1rem] p-2 sm:p-3 shadow-inner divide-y divide-slate-100 dark:divide-slate-800/80'>
                            {group.items.map((item) => (
                                <div key={item.key} className='flex items-center justify-between p-3 hover:bg-white dark:hover:bg-slate-800 transition-colors rounded-xl'>
                                    <div className='flex-1 min-w-0 pr-4'>
                                        <div className='text-[14px] font-bold text-slate-900 dark:text-white truncate'>{item.label}</div>
                                        <div className='text-[12.5px] text-slate-500 dark:text-slate-400 mt-0.5 truncate'>{item.desc}</div>
                                    </div>
                                    <div style={{ flexShrink: 0, marginLeft: '12px', transform: 'scale(0.85)', transformOrigin: 'right' }}>
                                        <UiverseSwitch checked={settings[item.key]} onChange={() => toggleSetting(item.key)} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className='mt-8 pt-6 border-t border-slate-200 dark:border-slate-800'>
                <div className='flex items-center gap-2 mb-4'>
                    <svg className='w-5 h-5 text-red-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' /></svg>
                    <h3 className='text-[15px] font-bold text-red-600 dark:text-red-400'>Danger Zone</h3>
                </div>
                <div className='bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-[1.25rem] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
                    <div>
                        <h4 className='text-[14px] font-bold text-slate-900 dark:text-white'>Log Out of All Devices</h4>
                        <p className='text-[12.5px] text-slate-500 dark:text-slate-400 mt-0.5'>You will be signed out from all active sessions.</p>
                    </div>
                    <button className='w-full sm:w-auto px-5 py-2.5 text-[13px] font-bold text-red-600 dark:text-red-400 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all shadow-sm flex items-center justify-center flex-shrink-0'>
                        Sign Out Everywhere
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
