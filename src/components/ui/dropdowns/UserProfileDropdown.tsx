'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';
import useClickOutside from '@/hooks/useClickOutside';

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
} from '@/services/studyTimeService';

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
    const [xpGain, setXpGain] = useState<{ amount: number; id: number } | null>(null);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const shouldReduceMotion = useReducedMotion();
    const [lastTotalXP, setLastTotalXP] = useState(() => getXPData().totalXP);
    const coverInputRef = useRef<HTMLInputElement>(null);
    const profileInputRef = useRef<HTMLInputElement>(null);
    const ref = useRef<HTMLDivElement>(null!);
    const modalRef = useRef<HTMLDivElement>(null);
    const [isScrolled, setIsScrolled] = useState(false);

    // Check for level up and update XP with gain animation
    useEffect(() => {
        const checkXP = () => {
            const currentData = getXPData();
            const newProgress = getXPProgress();
            const newLevel = getCurrentLevel();
            
            // Check if XP increased
            if (currentData.totalXP > lastTotalXP) {
                const gained = currentData.totalXP - lastTotalXP;
                setXpGain(gained);
                setLastTotalXP(currentData.totalXP); // Update the tracked XP
                
                // Hide the +XP popup after 6 seconds (as per requirement)
                setTimeout(() => setXpGain(null), 6000);
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

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                // Compress cover image: max 800x300, 70% quality
                const compressedImage = await compressImage(file, 800, 300, 0.7);
                setCoverImage(compressedImage);
                await saveCoverImage(compressedImage);
            } catch (error) {
                console.error('Error compressing cover image:', error);
            }
        }
    };

    const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                // Compress profile image: max 200x200, 70% quality
                const compressedImage = await compressImage(file, 200, 200, 0.7);
                setProfileImage(compressedImage);
                await saveProfileImage(compressedImage);
            } catch (error) {
                console.error('Error compressing profile image:', error);
            }
        }
    };

    useClickOutside(ref, (event) => {
        if (isOpen && modalRef.current && modalRef.current.contains(event.target as Node)) {
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
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            width: '100vw',
                            height: '100vh',
                            backgroundColor: 'white',
                            zIndex: 2147483647, // Maximum z-index value
                            pointerEvents: 'all',
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
                        'relative flex items-center gap-2.5 px-1.5 py-1 rounded-xl transition-all duration-150',
                        isDarkMode
                            ? 'hover:bg-slate-700/50'
                            : 'hover:bg-zinc-50'
                    )}
                >
                    {/* Premium SaaS Avatar Container */}
                    <div className="relative shrink-0 w-10 h-10 mr-1.5">
                        {/* Rounded Rectangle Level Gauge */}
                        <svg 
                            className="absolute -inset-[3px] w-[46px] h-[46px] pointer-events-none z-0" 
                            viewBox="0 0 46 46"
                            style={{ transform: 'rotate(-90deg)' }}
                        >
                            {/* Background track */}
                            <rect
                                x="3"
                                y="3"
                                width="40"
                                height="40"
                                rx="12"
                                fill="none"
                                stroke={isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(219, 234, 254, 0.6)'}
                                strokeWidth="2"
                            />
                            {/* Progress track */}
                            <motion.rect
                                x="3"
                                y="3"
                                width="40"
                                height="40"
                                rx="12"
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="2"
                                strokeLinecap="round"
                                pathLength="100"
                                strokeDasharray="100"
                                initial={{ strokeDashoffset: 100 }}
                                animate={{ strokeDashoffset: Math.max(0, 100 - xpProgress) }}
                                transition={{ duration: 1.2, ease: "easeOut" }}
                            />
                        </svg>

                        {/* The Avatar Box */}
                        <div 
                            className="w-full h-full rounded-xl flex items-center justify-center shadow-sm overflow-hidden relative z-10"
                            style={{ 
                                background: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(219, 234, 254, 0.6)'
                            }}
                        >
                            {profileImage ? (
                                <img src={profileImage} alt="Profile" className='w-full h-full object-cover' />
                            ) : (
                                <div className={cn(
                                    'w-full h-full flex items-center justify-center font-extrabold text-[15px]',
                                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                )}>
                                    {getInitials(profile.firstName, profile.lastName)}
                                </div>
                            )}
                        </div>
                        
                        {/* Level Badge overlapping bottom center */}
                        <motion.div 
                            className={cn(
                                'absolute -bottom-1.5 left-1/2 -translate-x-1/2 min-w-[32px] h-[16px] px-1 rounded-md flex items-center justify-center text-[8.5px] font-bold tracking-wider shadow-sm border-2 z-20',
                                isDarkMode 
                                    ? 'bg-blue-500 text-white border-slate-800' 
                                    : 'bg-blue-500 text-white border-white'
                            )}
                            animate={showLevelUp ? { scale: [1, 1.3, 1] } : {}}
                            transition={{ duration: 0.5 }}
                        >
                            LV.{level}
                        </motion.div>

                        {/* Online Status dot overlapping top right */}
                        {showOnlineStatus && (
                            <div className={cn(
                                'absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 z-20',
                                isDarkMode 
                                    ? 'bg-emerald-400 border-slate-800' 
                                    : 'bg-emerald-500 border-white'
                            )}></div>
                        )}
                    </div>

                    {/* Text Content matching Tools Page Cards */}
                    <div className='flex flex-col justify-center min-w-[70px] flex-1 text-left hidden sm:flex'>
                        <div className={cn(
                            'text-[13px] font-bold leading-tight whitespace-nowrap',
                            isDarkMode ? 'text-slate-100' : 'text-slate-900'
                        )}>
                            {profile.firstName} {profile.lastName}
                        </div>
                        <div className={cn(
                            'text-[10.5px] font-medium leading-tight mt-0.5 whitespace-nowrap truncate max-w-[150px]',
                            isDarkMode ? 'text-slate-400' : 'text-slate-500'
                        )}>
                            {profile.course}
                        </div>
                    </div>
                </motion.button>
            
            {/* XP Tooltip — Minimalist SaaS */}
            <AnimatePresence>
                {isAvatarHovered && !isOpen && (
                    <div
                        className="absolute top-full mt-2 right-0 sm:right-auto sm:left-0 z-50 pointer-events-none"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                        >
                            <div
                                className={cn(
                                    "w-[200px] rounded-xl border overflow-hidden",
                                    isDarkMode
                                        ? "bg-slate-900 border-slate-700/60 shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
                                        : "bg-white border-slate-200 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
                                )}
                            >
                                {/* Arrow aligned to Avatar Center */}
                                <div
                                    className={cn(
                                        "absolute -top-[5px] right-[24px] sm:right-auto sm:left-[26px] translate-x-1/2 sm:-translate-x-1/2 w-[10px] h-[10px] rotate-45 border-l border-t",
                                        isDarkMode
                                            ? "bg-slate-900 border-slate-700/60"
                                            : "bg-white border-slate-200"
                                    )}
                                />

                                {/* Content */}
                                <div className="px-3.5 pt-3 pb-3 flex flex-col gap-3">
                                    {/* Header row */}
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                                            isDarkMode ? "bg-blue-500/15" : "bg-blue-50"
                                        )}>
                                            {/* Zap bolt icon */}
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? '#60a5fa' : '#3b82f6'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                            </svg>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={cn(
                                                "text-[13px] font-bold leading-tight tracking-tight",
                                                isDarkMode ? "text-white" : "text-slate-900"
                                            )}>Level {level}</span>
                                            <span className={cn(
                                                "text-[10.5px] font-medium leading-none mt-0.5",
                                                isDarkMode ? "text-slate-400" : "text-slate-500"
                                            )}>Academic Level</span>
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className={cn("h-px w-full", isDarkMode ? "bg-slate-700/60" : "bg-slate-100")} />

                                    {/* Progress section */}
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between items-end">
                                            <span className={cn(
                                                "text-[9.5px] font-bold tracking-widest uppercase",
                                                isDarkMode ? "text-slate-400" : "text-slate-500"
                                            )}>Progress</span>
                                            <div className="flex items-baseline gap-0.5">
                                                <span className={cn(
                                                    "text-[13px] font-extrabold tabular-nums leading-none",
                                                    isDarkMode ? "text-white" : "text-slate-900"
                                                )}>{getXPData().xpInCurrentLevel}</span>
                                                <span className={cn(
                                                    "text-[10px] font-semibold",
                                                    isDarkMode ? "text-slate-500" : "text-slate-400"
                                                )}>/100</span>
                                            </div>
                                        </div>
                                        <div className={cn("h-2 w-full rounded-full overflow-hidden shadow-inner", isDarkMode ? "bg-slate-800" : "bg-slate-100")}>
                                            <motion.div
                                                className="h-full rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 relative"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${xpProgress}%` }}
                                                transition={{ duration: 0.8, ease: "easeOut" }}
                                            >
                                                {/* Premium Shine Effect */}
                                                <div className="absolute top-0 right-0 bottom-0 w-6 bg-gradient-to-r from-transparent to-white/30 rounded-full" />
                                            </motion.div>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className={cn(
                                        "flex items-center gap-2 py-1.5 px-2.5 rounded-lg mt-0.5 border",
                                        isDarkMode ? "bg-slate-800/60 border-slate-700/50" : "bg-slate-50 border-slate-200/60"
                                    )}>
                                        <svg className="w-3.5 h-3.5 shrink-0 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10" />
                                            <polyline points="12 6 12 12 16 14" />
                                        </svg>
                                        <span className={cn(
                                            "text-[10px] font-medium leading-tight",
                                            isDarkMode ? "text-slate-300" : "text-slate-600"
                                        )}>
                                            <span className={cn("font-bold", isDarkMode ? "text-white" : "text-slate-900")}>{100 - getXPData().xpInCurrentLevel} XP</span> to Level {level + 1}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Unified SaaS Notification Stack (Prevents Overlap) */}
            <div className="absolute top-full mt-2 right-0 sm:right-auto sm:left-0 z-50 flex flex-col gap-2 pointer-events-none items-end sm:items-start">
                
                {/* Level Up Notification */}
                <AnimatePresence>
                    {showLevelUp && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -10 }}
                            transition={{ type: "spring", stiffness: 500, damping: 25, mass: 0.8 }}
                        >
                            <div
                                className="p-2.5 rounded-[14px] flex items-center gap-3 relative overflow-hidden w-auto min-w-[200px] backdrop-blur-xl shadow-lg"
                                style={{
                                    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}`,
                                    boxShadow: isDarkMode 
                                        ? '0 10px 40px -10px rgba(0, 0, 0, 0.5), 0 1px 3px rgba(0,0,0,0.2)'
                                        : '0 10px 40px -10px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0,0,0,0.02)',
                                }}
                            >
                                {/* Arrow aligned to Avatar Center */}
                                <div
                                    className="absolute -top-[5px] right-[24px] sm:right-auto sm:left-[26px] translate-x-1/2 sm:-translate-x-1/2 z-10"
                                    style={{
                                        width: 0,
                                        height: 0,
                                        borderLeft: '6px solid transparent',
                                        borderRight: '6px solid transparent',
                                        borderBottom: `6px solid ${isDarkMode ? '#1e293b' : '#ffffff'}`
                                    }}
                                />

                                {/* Icon Container - Study Tools style */}
                                <div 
                                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
                                    style={{ background: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(209, 250, 229, 0.6)' }}
                                >
                                    <motion.div
                                        animate={shouldReduceMotion ? { scale: 1, rotate: 0 } : { scale: [1, 1.05, 0.98, 1.02, 1], rotate: [0, 3, -2, 1, 0] }}
                                        transition={shouldReduceMotion ? { duration: 0 } : { repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                                    >
                                        <svg className={`w-4 h-4 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                                            <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                                            <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                                            <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
                                        </svg>
                                    </motion.div>
                                </div>

                                {/* Text Layout matching Tools Page Cards */}
                                <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
                                    <div 
                                        className="text-[12px] font-bold leading-tight whitespace-nowrap"
                                        style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}
                                    >
                                        Level Up!
                                    </div>
                                    <div 
                                        className="text-[10px] font-medium mt-0.5 leading-tight whitespace-nowrap truncate"
                                        style={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}
                                    >
                                        Reached Level {level}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* XP Gain Notification */}
                <AnimatePresence>
                    {xpGain !== null && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -10 }}
                            transition={{ type: "spring", stiffness: 500, damping: 25, mass: 0.8 }}
                        >
                            <div
                                className="p-2.5 rounded-[14px] flex items-center gap-3 relative overflow-hidden w-auto min-w-[200px] backdrop-blur-xl shadow-lg"
                                style={{
                                    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}`,
                                    boxShadow: isDarkMode 
                                        ? '0 10px 40px -10px rgba(0, 0, 0, 0.5), 0 1px 3px rgba(0,0,0,0.2)'
                                        : '0 10px 40px -10px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0,0,0,0.02)',
                                }}
                            >
                                {/* Only show arrow if it's the top item in the stack */}
                                {!showLevelUp && (
                                    <div
                                        className="absolute -top-[5px] right-[24px] sm:right-auto sm:left-[26px] translate-x-1/2 sm:-translate-x-1/2 z-10"
                                        style={{
                                            width: 0,
                                            height: 0,
                                            borderLeft: '6px solid transparent',
                                            borderRight: '6px solid transparent',
                                            borderBottom: `6px solid ${isDarkMode ? '#1e293b' : '#ffffff'}`
                                        }}
                                    />
                                )}

                                {/* Icon Container - Study Tools style */}
                                <div 
                                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
                                    style={{ background: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(219, 234, 254, 0.6)' }}
                                >
                                    <motion.div
                                        animate={shouldReduceMotion ? { scale: 1, rotate: 0 } : { scale: [1, 1.05, 0.98, 1.02, 1], rotate: [0, 3, -2, 1, 0] }}
                                        transition={shouldReduceMotion ? { duration: 0 } : { repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                                    >
                                        <svg className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                        </svg>
                                    </motion.div>
                                </div>

                                {/* Text Layout matching Tools Page Cards */}
                                <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
                                    <div 
                                        className="text-[12px] font-bold leading-tight whitespace-nowrap"
                                        style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}
                                    >
                                        Nice Work!
                                    </div>
                                    <div 
                                        className="text-[10px] font-medium mt-0.5 leading-tight whitespace-nowrap truncate flex items-center gap-1"
                                        style={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}
                                    >
                                        <span style={{ color: isDarkMode ? '#60a5fa' : '#3b82f6', fontWeight: 700 }}>+{xpGain} XP</span> earned
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

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
                                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                                onClick={() => setIsOpen(false)}
                            />

                            {/* Modal Card */}
                            <motion.div
                                ref={modalRef}
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                transition={{ 
                                    type: 'spring', 
                                    stiffness: 400, 
                                    damping: 30,
                                    mass: 0.8
                                }}
                                className={cn(
                                    "relative w-full max-w-4xl max-h-full rounded-[2rem] shadow-2xl overflow-hidden flex flex-col pointer-events-auto",
                                    isDarkMode ? "bg-slate-900 border border-slate-700/60" : "bg-white border border-slate-200/50"
                                )}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Study Tools Style Close Button */}
                                <motion.button
                                    whileHover={{ scale: 1.05, backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2' }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setIsOpen(false)}
                                    className={cn(
                                        "absolute top-4 right-4 sm:top-6 sm:right-6 w-8 h-8 rounded-[10px] flex items-center justify-center transition-colors z-50 shadow-sm border",
                                        isDarkMode 
                                            ? "bg-slate-800 border-slate-700/60 text-slate-400 hover:text-red-400 hover:border-red-500/30" 
                                            : "bg-white border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
                                    )}
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                </motion.button>

                                {/* Premium Floating Card Header - Study Tools Style */}
                                <div className={cn(
                                    "relative overflow-hidden mb-0 pr-12 sm:pr-14 lg:pr-20 flex flex-col xl:flex-row items-start xl:items-center justify-between group transition-all duration-300 shrink-0 border shadow-sm z-20", 
                                    isDarkMode ? "bg-slate-800/80 border-slate-700/60" : "bg-white border-slate-200/80",
                                    isScrolled 
                                        ? "m-0 rounded-none border-x-0 border-t-0 p-3 sm:p-4 gap-3 lg:m-6 lg:rounded-[28px] lg:border lg:p-7 lg:gap-8" 
                                        : "m-3 sm:m-6 p-5 sm:p-6 lg:p-7 rounded-[24px] sm:rounded-[28px] gap-5 sm:gap-6 xl:gap-8"
                                )}>
                                    
                                    {/* SaaS Background Accents */}
                                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
                                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-48 h-48 bg-blue-400/10 dark:bg-blue-400/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
                                    
                                    {/* Left Side: Avatar Container & Title */}
                                    <div className="flex items-center gap-5 lg:gap-6 relative z-10 w-full xl:w-auto min-w-0">
                                        {/* Premium Animated Avatar Container matching Study Tools */}
                                        <div className="relative shrink-0 cursor-pointer" onClick={() => profileInputRef.current?.click()}>
                                            <motion.div
                                                whileHover={{ scale: 1.05, rotate: -5 }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                                className={cn("flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden border transition-all duration-300", 
                                                    isDarkMode ? "bg-blue-500/10 border-blue-500/20" : "bg-blue-50 border-blue-100",
                                                    isScrolled ? "w-10 h-10 lg:w-20 lg:h-20 rounded-[12px] lg:rounded-[24px]" : "w-16 h-16 lg:w-20 lg:h-20 rounded-[20px] lg:rounded-[24px]"
                                                )}
                                            >
                                                {profileImage ? (
                                                    <img src={profileImage} alt="Profile" className='w-full h-full object-cover' />
                                                ) : (
                                                    <div className={cn('w-full h-full flex items-center justify-center font-extrabold transition-all duration-300', 
                                                        isDarkMode ? 'text-blue-400' : 'text-blue-600',
                                                        isScrolled ? "text-[16px] lg:text-[26px]" : "text-[22px] lg:text-[26px]"
                                                    )}>
                                                        {getInitials(profile.firstName, profile.lastName)}
                                                    </div>
                                                )}
                                                {/* Edit overlay */}
                                                <div className='absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 hover:opacity-100'>
                                                    <svg className='w-6 h-6 lg:w-8 lg:h-8 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 13a3 3 0 11-6 0 3 3 0 016 0z' />
                                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z' />
                                                    </svg>
                                                </div>
                                            </motion.div>
                                            {/* Online Status Dot */}
                                            {showOnlineStatus && (
                                                <div className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-500 rounded-full border-[3px] border-white dark:border-slate-800 z-20 shadow-sm" />
                                            )}
                                        </div>
                                        <input ref={profileInputRef} type='file' accept='image/*,.gif' onChange={handleProfileUpload} className='hidden' />

                                        {/* Title & Email */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-3 mb-1.5">
                                                <h1 className={cn("font-black tracking-tight leading-none break-words transition-all duration-300", 
                                                    isDarkMode ? "text-slate-100" : "text-slate-900",
                                                    isScrolled ? "text-[18px] lg:text-3xl" : "text-[24px] lg:text-3xl"
                                                )}>
                                                    {profile.firstName} {profile.lastName}
                                                </h1>
                                            </div>
                                            <p className={cn("font-medium leading-relaxed break-all transition-all duration-300", 
                                                isDarkMode ? "text-slate-400" : "text-slate-500",
                                                isScrolled ? "hidden lg:block text-[14px] lg:text-[15px]" : "text-[14px] lg:text-[15px]"
                                            )}>
                                                {profile.email}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right Side: Modern Stat Cards */}
                                    <div className={cn("flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:gap-4 relative z-10 w-full xl:w-auto min-w-0 transition-all duration-300",
                                        isScrolled ? "hidden lg:flex" : "flex"
                                    )}>
                                        {/* Student ID Card */}
                                        <div className={cn("flex items-center gap-3 lg:gap-4 p-3 lg:p-4 rounded-[20px] lg:rounded-[24px] border transition-all duration-300 hover:shadow-md flex-1 xl:flex-none min-w-0", isDarkMode ? "bg-slate-800/50 border-slate-700/60 hover:border-slate-600" : "bg-slate-50/50 border-slate-200/60 hover:border-slate-300 hover:bg-white")}>
                                            <motion.div
                                                whileHover={{ scale: 1.05, rotate: -5 }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                                className={cn("w-10 h-10 lg:w-12 lg:h-12 rounded-[12px] lg:rounded-[14px] flex items-center justify-center flex-shrink-0 shadow-sm border", isDarkMode ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-white border-slate-200 text-slate-500")}
                                            >
                                                <svg className='w-5 h-5 lg:w-6 lg:h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M7 20l4-16m2 16l4-16M6 9h14M4 15h14' />
                                                </svg>
                                            </motion.div>
                                            <div className="flex flex-col min-w-0 pr-2">
                                                <p className={cn("text-[10px] lg:text-[12px] font-bold uppercase tracking-widest mb-0.5 truncate", isDarkMode ? "text-slate-500" : "text-slate-400")}>Student ID</p>
                                                <p className={cn("text-[15px] lg:text-[19px] font-black leading-none truncate", isDarkMode ? "text-slate-100" : "text-slate-900")}>{profile.studentId}</p>
                                            </div>
                                        </div>

                                        {/* Level Card */}
                                        <div className={cn("flex items-center gap-3 lg:gap-4 p-3 lg:p-4 rounded-[20px] lg:rounded-[24px] border transition-all duration-300 hover:shadow-md flex-1 xl:flex-none min-w-0", isDarkMode ? "bg-slate-800/50 border-slate-700/60 hover:border-blue-800/50" : "bg-slate-50/50 border-slate-200/60 hover:border-blue-200 hover:bg-white")}>
                                            <motion.div
                                                whileHover={{ scale: 1.05, rotate: -5 }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                                className={cn("w-10 h-10 lg:w-12 lg:h-12 rounded-[12px] lg:rounded-[14px] flex items-center justify-center flex-shrink-0 shadow-sm border", isDarkMode ? "text-blue-400 bg-blue-900/30 border-blue-800/50" : "text-blue-600 bg-blue-100/50 border-blue-200/60")}
                                            >
                                                <svg className='w-5 h-5 lg:w-6 lg:h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M13 10V3L4 14h7v7l9-11h-7z' />
                                                </svg>
                                            </motion.div>
                                            <div className="flex flex-col min-w-0 pr-2">
                                                <p className={cn("text-[10px] lg:text-[12px] font-bold uppercase tracking-widest mb-0.5 truncate", isDarkMode ? "text-slate-500" : "text-slate-400")}>Level</p>
                                                <p className={cn("text-[15px] lg:text-[19px] font-black leading-none truncate", isDarkMode ? "text-slate-100" : "text-slate-900")}>{level}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Body Content */}
                                <div 
                                    className={cn("flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8 pt-4 flex flex-col gap-5 sm:gap-6", isDarkMode ? "bg-slate-900/50" : "bg-slate-50/50")} 
                                    style={{ scrollbarWidth: 'none' }}
                                    onScroll={(e) => setIsScrolled(e.currentTarget.scrollTop > 10)}
                                >
                                    
                                    {/* Cover Image Upload Card - Premium SaaS Style */}
                                    <div className={cn("relative overflow-hidden border shadow-sm rounded-[24px] group transition-all duration-300 hover:shadow-md shrink-0 flex flex-col justify-center", isDarkMode ? "bg-slate-900 border-slate-700/60" : "bg-white border-slate-200/80", coverImage ? "min-h-[180px]" : "p-5 sm:p-6 lg:p-7")}>
                                        
                                        {/* Background Preview (If exists) */}
                                        {coverImage ? (
                                            <>
                                                <img src={coverImage} alt="Cover Preview" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                                <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] transition-opacity duration-300 group-hover:bg-slate-900/60" />
                                            </>
                                        ) : (
                                            <>
                                                {/* SaaS Background Accents */}
                                                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
                                                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-48 h-48 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
                                            </>
                                        )}

                                        <div className={cn("flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6 w-full relative z-10", coverImage ? "p-5 sm:p-6 lg:p-7" : "")}>
                                            {/* Left: Icon & Core Info */}
                                            <div className="flex items-center gap-5 lg:gap-6 w-full md:w-auto">
                                                <motion.div
                                                    whileHover={{ scale: 1.05, rotate: -5 }}
                                                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                                    className={cn("w-14 h-14 lg:w-16 lg:h-16 rounded-[18px] lg:rounded-[20px] flex items-center justify-center flex-shrink-0 shadow-sm border backdrop-blur-md transition-colors", coverImage ? "bg-white/20 border-white/30 text-white" : isDarkMode ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" : "bg-indigo-50 border-indigo-100 text-indigo-600")}
                                                >
                                                    <svg className="w-7 h-7 lg:w-8 lg:h-8" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </motion.div>

                                                <div>
                                                    <div className="flex items-center gap-3 mb-1.5">
                                                        <h2 className={cn("text-[20px] lg:text-[24px] font-black tracking-tight leading-none", coverImage ? "text-white" : isDarkMode ? "text-slate-100" : "text-slate-900")}>
                                                            Profile Banner
                                                        </h2>
                                                    </div>
                                                    <p className={cn("text-[13px] lg:text-[14.5px] font-medium max-w-md leading-relaxed", coverImage ? "text-white/80" : isDarkMode ? "text-slate-400" : "text-slate-500")}>
                                                        Upload a stunning background image to deeply personalize your study space experience.
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Right: Upload Button */}
                                            <div className="w-full md:w-auto shrink-0 relative">
                                                <input type="file" id="cover-upload-new" accept="image/*,.gif" onChange={handleCoverUpload} className="hidden" />
                                                <label htmlFor="cover-upload-new">
                                                    <motion.div
                                                        whileHover={{ scale: 1.02, y: -2 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        className={cn("cursor-pointer px-6 py-3 lg:px-7 lg:py-4 font-bold rounded-[16px] shadow-sm transition-all flex items-center justify-center gap-2.5 border", coverImage ? "bg-white/20 hover:bg-white/30 border-white/30 text-white backdrop-blur-md" : isDarkMode ? "bg-indigo-600 hover:bg-indigo-500 border-indigo-500 text-white shadow-indigo-500/20" : "bg-indigo-600 hover:bg-indigo-500 border-indigo-500 text-white shadow-indigo-500/20")}
                                                    >
                                                        <svg className="w-5 h-5 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                        </svg>
                                                        <span className="text-[14px] lg:text-[15px] tracking-wide">{coverImage ? "Change Banner" : "Upload Banner"}</span>
                                                    </motion.div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* XP Progress Block - Styled like Study Tools */}
                                    <div className={cn("relative overflow-hidden border shadow-sm rounded-[24px] p-5 sm:p-6 lg:p-7 flex flex-col gap-6 sm:gap-8 group transition-all duration-300 hover:shadow-md shrink-0", isDarkMode ? "bg-slate-900 border-slate-700/60 hover:border-blue-800/50" : "bg-white border-slate-200/80 hover:border-blue-200/80")}>
                                        
                                        {/* Background Accents (From ToolsHeader) */}
                                        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
                                        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-48 h-48 bg-blue-400/10 dark:bg-blue-400/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />

                                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 w-full relative z-10">
                                            {/* Left: Icon & Core Info */}
                                            <div className="flex items-center gap-6 w-full md:w-auto">
                                                <motion.div
                                                    whileHover={{ scale: 1.05, rotate: -5 }}
                                                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                                    className={cn("w-16 h-16 rounded-[20px] flex items-center justify-center flex-shrink-0 shadow-sm border", isDarkMode ? "bg-blue-500/10 border-blue-500/20" : "bg-blue-50 border-blue-100")}
                                                >
                                                    <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                    </svg>
                                                </motion.div>

                                                <div>
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h2 className={cn("text-3xl font-bold tracking-tight", isDarkMode ? "text-slate-100" : "text-slate-900")}>
                                                            Current Progress
                                                        </h2>
                                                    </div>
                                                    <p className={cn("text-base max-w-lg leading-relaxed", isDarkMode ? "text-slate-400" : "text-slate-600")}>
                                                        Keep completing modules to earn more experience points. Leveling up unlocks new study tools.
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Right: Modern Stat Cards */}
                                            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto shrink-0">
                                                {/* XP Earned Card */}
                                                <div className={cn("flex items-center gap-4 p-4 rounded-2xl border transition-colors hover:shadow-sm", isDarkMode ? "bg-slate-800/50 border-slate-700/60 hover:border-blue-800/50" : "bg-slate-50 border-slate-200/60 hover:border-blue-200/80")}>
                                                    <div className={cn("p-2.5 rounded-xl flex-shrink-0 border", isDarkMode ? "bg-blue-900/30 border-blue-800/50 text-blue-400" : "bg-blue-100 border-blue-200/60 text-blue-600")}>
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className={cn("text-[12px] font-bold uppercase tracking-wider mb-0.5", isDarkMode ? "text-slate-500" : "text-slate-400")}>Earned</p>
                                                        <p className={cn("text-lg font-black leading-none", isDarkMode ? "text-slate-100" : "text-slate-900")}>
                                                            {getXPData().xpInCurrentLevel} <span className={cn("text-sm font-semibold", isDarkMode ? "text-slate-400" : "text-slate-500")}>/ 100 XP</span>
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* XP Left Card */}
                                                <div className={cn("flex items-center gap-4 p-4 rounded-2xl border transition-colors hover:shadow-sm", isDarkMode ? "bg-slate-800/50 border-slate-700/60 hover:border-emerald-800/50" : "bg-slate-50 border-slate-200/60 hover:border-emerald-200/80")}>
                                                    <div className={cn("p-2.5 rounded-xl flex-shrink-0 border", isDarkMode ? "bg-emerald-900/30 border-emerald-800/50 text-emerald-400" : "bg-emerald-100 border-emerald-200/60 text-emerald-600")}>
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className={cn("text-[12px] font-bold uppercase tracking-wider mb-0.5", isDarkMode ? "text-slate-500" : "text-slate-400")}>To Level {level + 1}</p>
                                                        <p className={cn("text-lg font-black leading-none", isDarkMode ? "text-slate-100" : "text-slate-900")}>
                                                            {100 - getXPData().xpInCurrentLevel} XP
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress Bar (Full Width Below) */}
                                        <div className={cn("h-4 w-full rounded-full overflow-hidden shadow-inner relative z-10", isDarkMode ? "bg-slate-900/80 border border-slate-700/50" : "bg-slate-100/80 border border-slate-200/50")}>
                                            <motion.div
                                                className="h-full rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 relative"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${xpProgress}%` }}
                                                transition={{ duration: 1.2, ease: "easeOut" }}
                                            >
                                                <div className="absolute top-0 right-0 bottom-0 w-10 bg-gradient-to-r from-transparent to-white/30 rounded-full" />
                                            </motion.div>
                                        </div>
                                    </div>

                                    {/* Tabs and Content Area */}
                                    <div className="flex flex-col md:flex-row gap-6">
                                        {/* Left Sidebar for Tabs */}
                                        <div className="w-full md:w-[300px] lg:w-[320px] shrink-0 flex flex-col gap-4">
                                            {[
                                                { 
                                                    id: 'profile' as ProfileTab, 
                                                    label: 'Personal Info',
                                                    desc: 'Manage your profile details and preferences',
                                                    icon: (
                                                        <svg className='w-7 h-7' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                                                        </svg>
                                                    ),
                                                    colorClass: isDarkMode ? "text-blue-400 bg-blue-500/10 border-blue-500/20" : "text-blue-600 bg-blue-50 border-blue-100"
                                                },
                                                { 
                                                    id: 'settings' as ProfileTab, 
                                                    label: 'Account Settings',
                                                    desc: 'Configure security, alerts, and app behavior',
                                                    icon: (
                                                        <svg className='w-7 h-7' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' />
                                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                                                        </svg>
                                                    ),
                                                    colorClass: isDarkMode ? "text-purple-400 bg-purple-500/10 border-purple-500/20" : "text-purple-600 bg-purple-50 border-purple-100"
                                                },
                                            ].map((tab) => (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => setActiveTab(tab.id)}
                                                    className={cn(
                                                        "w-full rounded-[20px] p-4 lg:p-5 flex items-center gap-4 lg:gap-5 text-left transition-all duration-300 group border",
                                                        activeTab === tab.id 
                                                            ? isDarkMode ? "bg-slate-800 border-slate-600 shadow-md" : "bg-white border-blue-200/80 shadow-md ring-1 ring-blue-100/50"
                                                            : isDarkMode ? "bg-slate-900/40 border-slate-800/60 hover:bg-slate-800 hover:border-slate-700/80" : "bg-slate-50/50 border-slate-200/50 hover:bg-white hover:border-slate-200 hover:shadow-sm"
                                                    )}
                                                >
                                                    <motion.div
                                                        whileHover={{ scale: 1.05, rotate: -5 }}
                                                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                                        className={cn("w-12 h-12 lg:w-14 lg:h-14 rounded-[16px] flex items-center justify-center flex-shrink-0 shadow-sm border", tab.colorClass)}
                                                    >
                                                        {tab.icon}
                                                    </motion.div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className={cn("text-[16px] lg:text-[17px] font-bold tracking-tight mb-0.5 truncate", isDarkMode ? (activeTab === tab.id ? "text-white" : "text-slate-300") : (activeTab === tab.id ? "text-blue-950" : "text-slate-800"))}>
                                                            {tab.label}
                                                        </span>
                                                        <span className={cn("text-[12px] lg:text-[12.5px] leading-tight line-clamp-2", isDarkMode ? "text-slate-400" : "text-slate-500")}>
                                                            {tab.desc}
                                                        </span>
                                                    </div>
                                                </button>
                                            ))}

                                            {/* Sign Out Button Styled Similarly */}
                                            <div className={cn("mt-2 pt-6 border-t", isDarkMode ? "border-slate-800" : "border-slate-200/80")}>
                                                <button
                                                    onClick={handleSignOut}
                                                    className={cn(
                                                        "w-full rounded-[20px] p-4 lg:p-5 flex items-center gap-4 lg:gap-5 text-left transition-all duration-300 group border hover:shadow-sm",
                                                        isDarkMode ? "bg-slate-900/40 border-slate-800/60 hover:bg-slate-800 hover:border-red-500/30" : "bg-slate-50/50 border-slate-200/50 hover:bg-white hover:border-red-200 hover:bg-red-50/30"
                                                    )}
                                                >
                                                    <motion.div
                                                        whileHover={{ scale: 1.05, rotate: -5 }}
                                                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                                        className={cn("w-12 h-12 lg:w-14 lg:h-14 rounded-[16px] flex items-center justify-center flex-shrink-0 shadow-sm border transition-colors", isDarkMode ? "text-red-400 bg-red-500/10 border-red-500/20 group-hover:bg-red-500/20" : "text-red-600 bg-red-50 border-red-100 group-hover:bg-red-100 group-hover:border-red-200")}
                                                    >
                                                        <svg className='w-6 h-6 lg:w-7 lg:h-7' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1' />
                                                        </svg>
                                                    </motion.div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className={cn("text-[16px] lg:text-[17px] font-bold tracking-tight mb-0.5 truncate", isDarkMode ? "text-red-400 group-hover:text-red-300" : "text-red-700 group-hover:text-red-800")}>
                                                            Sign Out
                                                        </span>
                                                        <span className={cn("text-[12px] lg:text-[12.5px] leading-tight line-clamp-2 transition-colors", isDarkMode ? "text-slate-500 group-hover:text-red-400/80" : "text-slate-500 group-hover:text-red-600/80")}>
                                                            Securely end your current session
                                                        </span>
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {/* Right Side Content Area */}
                                        <div className="flex-1 min-w-0 flex flex-col">
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
                                                            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M5 13l4 4L19 7' />
                                                            </svg>
                                                        ) : (
                                                            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M6 18L18 6M6 6l12 12' />
                                                            </svg>
                                                        )}
                                                        {saveMessage.text}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            {/* Active Tab Content */}
                                            <AnimatePresence mode='wait'>
                                                {activeTab === 'profile' && (
                                                    <ProfileContent
                                                        profile={isEditing ? editedProfile : profile}
                                                        isEditing={isEditing}
                                                        isSaving={isSaving}
                                                        onEdit={() => { setEditedProfile(profile); setIsEditing(true); }}
                                                        onSave={handleSave}
                                                        onCancel={handleCancel}
                                                        onChange={(field, value) => setEditedProfile(prev => ({ ...prev, [field]: value }))}
                                                    />
                                                )}
                                                {activeTab === 'settings' && <SettingsContent onShowOnlineStatusChange={setShowOnlineStatus} />}
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


// Profile Tab Content
function ProfileContent({ 
    profile, 
    isEditing,
    isSaving,
    onEdit, 
    onSave, 
    onCancel,
    onChange 
}: { 
    profile: UserProfile, 
    isEditing: boolean,
    isSaving: boolean,
    onEdit: () => void,
    onSave: () => void,
    onCancel: () => void,
    onChange: (field: keyof UserProfile, value: string) => void
}) {
    const sections = [
        {
            title: 'Personal Information',
            desc: 'Review and update your fundamental personal identity records.',
            icon: (
                <svg className='w-7 h-7 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                </svg>
            ),
            fields: [
                { key: 'firstName' as const, label: 'First Name', editable: true },
                { key: 'lastName' as const, label: 'Last Name', editable: true },
                { key: 'birthday' as const, label: 'Birthday', type: 'date', editable: true },
            ]
        },
        {
            title: 'Academic Details',
            desc: 'Your institutional status and enrolled program credentials.',
            icon: (
                <svg className='w-7 h-7 text-emerald-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 14l9-5-9-5-9 5 9 5z' />
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z' />
                </svg>
            ),
            fields: [
                { key: 'studentId' as const, label: 'Student ID', editable: false },
                { key: 'course' as const, label: 'Program', editable: false },
                { key: 'yearLevel' as const, label: 'Year Level', editable: false },
                { key: 'section' as const, label: 'Section', editable: false },
            ]
        },
        {
            title: 'Contact Information',
            desc: 'Keep your communication channels and physical location current.',
            icon: (
                <svg className='w-7 h-7 text-purple-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
                </svg>
            ),
            fields: [
                { key: 'email' as const, label: 'Email Address', type: 'email', editable: false },
                { key: 'phone' as const, label: 'Phone Number', type: 'tel', editable: true },
                { key: 'address' as const, label: 'Address', editable: true },
            ]
        }
    ];

    return (
        <motion.div
            key="profile"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ 
                duration: 0.3, 
                ease: [0.25, 0.1, 0.25, 1.0]
            }}
            className='space-y-6'
        >
            {/* Edit Button Styled as a Premium Block */}
            {!isEditing && (
                <motion.button
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={onEdit}
                    className='w-full py-4 text-[15px] font-bold text-blue-700 bg-blue-50/80 hover:bg-blue-100 rounded-[20px] transition-all flex items-center justify-center gap-2 border border-blue-100/50 shadow-sm'
                >
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' />
                    </svg>
                    Edit Profile Details
                </motion.button>
            )}

            {/* Sections */}
            {sections.map((section, sectionIndex) => (
                <motion.div
                    key={section.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: sectionIndex * 0.1 }}
                    className='relative overflow-hidden bg-white border border-slate-200/80 rounded-[24px] p-6 lg:p-7 flex flex-col gap-6 group transition-all duration-300 hover:shadow-md hover:border-blue-200/80'
                >
                    {/* SaaS Background Accents */}
                    <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
                    
                    {/* Section Header */}
                    <div className='flex items-center gap-5 relative z-10'>
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: -5 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                            className={cn(
                                "w-16 h-16 rounded-[20px] flex items-center justify-center flex-shrink-0 shadow-sm border",
                                sectionIndex === 0 ? "bg-blue-50 border-blue-100" : 
                                sectionIndex === 1 ? "bg-emerald-50 border-emerald-100" : 
                                "bg-purple-50 border-purple-100"
                            )}
                        >
                            {section.icon}
                        </motion.div>
                        <div>
                            <h3 className="text-[19px] font-bold text-slate-900 tracking-tight mb-0.5">
                                {section.title}
                            </h3>
                            <p className="text-[13px] text-slate-500 leading-relaxed max-w-[280px] sm:max-w-md">
                                {section.desc}
                            </p>
                        </div>
                    </div>

                    {/* Section Fields Card */}
                    <div className='bg-slate-50/50 border border-slate-100/80 rounded-[18px] p-4 space-y-0 shadow-sm divide-y divide-slate-100/80 relative z-10'>
                        {section.fields.map((field, fieldIndex) => (
                            <motion.div
                                key={field.key}
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: sectionIndex * 0.1 + fieldIndex * 0.05 }}
                                className='flex items-center justify-between gap-4 py-3.5 first:pt-1 last:pb-1'
                            >
                                <span className='text-[13.5px] font-semibold text-slate-500 shrink-0 min-w-[100px]'>
                                    {field.label}
                                </span>
                                {isEditing && field.editable ? (
                                    <motion.input
                                        initial={{ scale: 0.98 }}
                                        animate={{ scale: 1 }}
                                        type={'type' in field ? field.type : 'text'}
                                        value={profile[field.key]}
                                        onChange={(e) => onChange(field.key, e.target.value)}
                                        className='flex-1 min-w-0 px-3 py-2 text-[14px] font-bold text-slate-900 text-right border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white transition-all'
                                    />
                                ) : (
                                    <span className='text-[14px] font-bold text-slate-900 text-right truncate min-w-0'>
                                        {profile[field.key]}
                                    </span>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            ))}

            {/* Action Buttons */}
            <AnimatePresence>
                {isEditing && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className='flex gap-4 pt-4'
                    >
                        <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onCancel}
                            disabled={isSaving}
                            className='flex-1 py-4 text-[15px] font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 hover:text-slate-800 rounded-[18px] transition-all border border-slate-200/80 hover:border-slate-300 hover:shadow-sm disabled:opacity-50'
                        >
                            Cancel
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: isSaving ? 1 : 1.02, y: isSaving ? 0 : -2 }}
                            whileTap={{ scale: isSaving ? 1 : 0.98 }}
                            onClick={onSave}
                            disabled={isSaving}
                            className='flex-1 py-4 text-[15px] font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-[18px] transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 border border-blue-500 hover:border-blue-400 disabled:opacity-70 disabled:cursor-not-allowed'
                        >
                            {isSaving ? (
                                <>
                                    <svg className='w-5 h-5 animate-spin' fill='none' viewBox='0 0 24 24'>
                                        <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                                        <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                                    </svg>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M5 13l4 4L19 7' />
                                    </svg>
                                    Save Changes
                                </>
                            )}
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// Settings Tab Content
function SettingsContent({ onShowOnlineStatusChange }: { onShowOnlineStatusChange?: (value: boolean) => void }) {
    // Load settings from localStorage on mount
    const [settings, setSettings] = useState<UserSettings>(() => getSettings());
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

    // Check notification permission on mount
    useEffect(() => {
        if ('Notification' in window) {
            setNotificationPermission(Notification.permission);
        }
    }, []);

    // Request browser notification permission
    const requestNotificationPermission = async (): Promise<boolean> => {
        if (!('Notification' in window)) {
            console.log('This browser does not support notifications');
            return false;
        }
        
        if (Notification.permission === 'granted') {
            return true;
        }
        
        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);
            return permission === 'granted';
        }
        
        return false;
    };

    // Show a test notification
    const showTestNotification = (title: string, body: string) => {
        if (Notification.permission === 'granted') {
            new Notification(title, {
                body,
                icon: '/vite.svg',
                badge: '/vite.svg',
            });
        }
    };

    // Save settings to localStorage whenever they change
    const toggleSetting = async (key: keyof UserSettings) => {
        const newValue = !settings[key];
        
        // Handle Push Notifications - request permission
        if (key === 'pushNotifications' && newValue) {
            const granted = await requestNotificationPermission();
            if (!granted) {
                console.log('Notification permission denied');
                return; // Don't enable if permission denied
            }
            // Show test notification
            showTestNotification('Notifications Enabled', 'You will now receive browser notifications');
        }
        
        const newSettings = { ...settings, [key]: newValue };
        setSettings(newSettings);
        await saveSettings(newSettings);
        
        // Show feedback for different settings
        if (key === 'emailNotifications' && newValue) {
            console.log('Email notifications enabled - updates will be sent to your email');
        }
        if (key === 'courseReminders' && newValue && settings.pushNotifications && notificationPermission === 'granted') {
            showTestNotification('Course Reminders', 'You will receive alerts for upcoming classes');
        }
        if (key === 'assignmentAlerts' && newValue && settings.pushNotifications && notificationPermission === 'granted') {
            showTestNotification('Assignment Alerts', 'You will receive due date reminders');
        }
        if (key === 'gradeUpdates' && newValue && settings.pushNotifications && notificationPermission === 'granted') {
            showTestNotification('Grade Updates', 'You will be notified of new grades');
        }
        
        // Notify parent if showOnlineStatus changed
        if (key === 'showOnlineStatus' && onShowOnlineStatusChange) {
            onShowOnlineStatusChange(newSettings.showOnlineStatus);
        }
    };

    const settingGroups = [
        {
            title: 'Notifications',
            desc: 'Manage how and when you receive important updates.',
            icon: (
                <svg className='w-7 h-7 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' />
                </svg>
            ),
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
            icon: (
                <svg className='w-7 h-7 text-emerald-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' />
                </svg>
            ),
            items: [
                { key: 'showOnlineStatus' as const, label: 'Show Online Status', desc: 'Let others see when you\'re online' },
            ]
        }
    ];

    return (
        <motion.div
            key="settings"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ 
                duration: 0.3, 
                ease: [0.25, 0.1, 0.25, 1.0]
            }}
            className='space-y-5'
        >
            {settingGroups.map((group, groupIndex) => (
                <motion.div 
                    key={group.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: groupIndex * 0.1 }}
                    className='relative overflow-hidden bg-white border border-slate-200/80 rounded-[24px] p-6 lg:p-7 flex flex-col gap-6 group transition-all duration-300 hover:shadow-md hover:border-blue-200/80'
                >
                    {/* SaaS Background Accents */}
                    <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
                    
                    {/* Section Header */}
                    <div className='flex items-center gap-5 relative z-10'>
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: -5 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                            className={cn(
                                "w-16 h-16 rounded-[20px] flex items-center justify-center flex-shrink-0 shadow-sm border",
                                groupIndex === 0 ? "bg-blue-50 border-blue-100" : "bg-emerald-50 border-emerald-100"
                            )}
                        >
                            {group.icon}
                        </motion.div>
                        <div>
                            <h3 className="text-[19px] font-bold text-slate-900 tracking-tight mb-0.5">
                                {group.title}
                            </h3>
                            <p className="text-[13px] text-slate-500 leading-relaxed max-w-[280px] sm:max-w-md">
                                {group.desc}
                            </p>
                        </div>
                    </div>

                    {/* Section Content */}
                    <div className='bg-slate-50/50 border border-slate-100/80 rounded-[18px] p-3 space-y-0 shadow-sm divide-y divide-slate-100/80 relative z-10'>
                        {group.items.map((item, itemIndex) => (
                            <motion.div 
                                key={item.key}
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: groupIndex * 0.1 + itemIndex * 0.05 }}
                                className='flex items-center justify-between p-3 lg:p-4 hover:bg-slate-100/80 transition-colors'
                            >
                                <div className='flex-1 min-w-0 pr-4'>
                                    <div className='text-[14.5px] font-bold text-slate-900 truncate'>{item.label}</div>
                                    <div className='text-[13px] text-slate-500 mt-0.5 truncate'>{item.desc}</div>
                                </div>
                                {/* Toggle Switch - Same style as SettingsModal */}
                                <label 
                                    className="settings-switch" 
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ flexShrink: 0, marginLeft: '12px' }}
                                >
                                    <input 
                                        type="checkbox" 
                                        checked={settings[item.key]} 
                                        onChange={() => toggleSetting(item.key)}
                                    />
                                    <div className="settings-slider">
                                        <div className="settings-circle">
                                            <svg 
                                                className="settings-cross" 
                                                viewBox="0 0 365.696 365.696" 
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path 
                                                    fill="currentColor" 
                                                    d="M243.188 182.86 356.32 69.726c12.5-12.5 12.5-32.766 0-45.247L341.238 9.398c-12.504-12.503-32.77-12.503-45.25 0L182.86 122.528 69.727 9.374c-12.5-12.5-32.766-12.5-45.247 0L9.375 24.457c-12.5 12.504-12.5 32.77 0 45.25l113.152 113.152L9.398 295.99c-12.503 12.503-12.503 32.769 0 45.25L24.48 356.32c12.5 12.5 32.766 12.5 45.247 0l113.132-113.132L295.99 356.32c12.503 12.5 32.769 12.5 45.25 0l15.081-15.082c12.5-12.504 12.5-32.77 0-45.25zm0 0"
                                                />
                                            </svg>
                                            <svg 
                                                className="settings-checkmark" 
                                                viewBox="0 0 24 24" 
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path 
                                                    fill="currentColor" 
                                                    d="M9.707 19.121a.997.997 0 0 1-1.414 0l-5.646-5.647a1.5 1.5 0 0 1 0-2.121l.707-.707a1.5 1.5 0 0 1 2.121 0L9 14.171l9.525-9.525a1.5 1.5 0 0 1 2.121 0l.707.707a1.5 1.5 0 0 1 0 2.121z"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                </label>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
}


