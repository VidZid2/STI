'use client';

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
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
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [xpGain, setXpGain] = useState<number | null>(null);
    const [lastTotalXP, setLastTotalXP] = useState(() => getXPData().totalXP);
    const [isAvatarHovered, setIsAvatarHovered] = useState(false);
    const coverInputRef = useRef<HTMLInputElement>(null);
    const profileInputRef = useRef<HTMLInputElement>(null);
    const ref = useRef<HTMLDivElement>(null!);

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

    useClickOutside(ref, () => {
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
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsOpen(!isOpen)}
                    onMouseEnter={() => setIsAvatarHovered(true)}
                    onMouseLeave={() => setIsAvatarHovered(false)}
                    className={cn(
                        'flex items-center gap-2.5 px-2 py-1 rounded-xl transition-all duration-150',
                        isDarkMode
                            ? 'hover:bg-slate-700/50'
                            : 'hover:bg-zinc-50'
                    )}
                >
                <div className='text-right hidden sm:block'>
                    <div className={cn(
                        'text-[13px] font-semibold leading-tight',
                        isDarkMode ? 'text-slate-100' : 'text-zinc-800'
                    )}>{profile.firstName} {profile.lastName}</div>
                    <div className={cn(
                        'text-[10px] leading-tight mt-0.5',
                        isDarkMode ? 'text-slate-400' : 'text-zinc-400'
                    )}>{profile.course}</div>
                </div>
                <div className='relative'>
                    {/* XP Progress Ring */}
                    <svg 
                        className='absolute -inset-0.5 w-[42px] h-[42px]'
                        viewBox='0 0 42 42'
                        style={{ transform: 'rotate(-90deg)' }}
                    >
                        {/* Background ring */}
                        <circle
                            cx='21'
                            cy='21'
                            r='19.5'
                            fill='none'
                            stroke={isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
                            strokeWidth='2'
                        />
                        {/* Progress ring */}
                        <motion.circle
                            cx='21'
                            cy='21'
                            r='19.5'
                            fill='none'
                            stroke='var(--accent-primary, #3b82f6)'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeDasharray={2 * Math.PI * 19.5}
                            initial={{ strokeDashoffset: 2 * Math.PI * 19.5 }}
                            animate={{ 
                                strokeDashoffset: 2 * Math.PI * 19.5 * (1 - xpProgress / 100)
                            }}
                            transition={{ 
                                duration: 1.2, 
                                ease: [0.34, 1.56, 0.64, 1]
                            }}
                        />
                    </svg>
                    
                    {/* Profile Image */}
                    {profileImage ? (
                        <img src={profileImage} alt="Profile" className='w-[38px] h-[38px] rounded-full object-cover' style={{ boxShadow: isDarkMode ? '0 1px 3px rgba(0,0,0,0.4)' : '0 1px 3px rgba(0,0,0,0.08)' }} />
                    ) : (
                        <div className={cn(
                            'w-[38px] h-[38px] rounded-full flex items-center justify-center font-semibold text-sm',
                            isDarkMode
                                ? 'bg-gradient-to-br from-slate-600 to-slate-700 text-slate-200'
                                : 'bg-gradient-to-br from-zinc-200 to-zinc-300 text-zinc-600'
                        )} style={{ boxShadow: isDarkMode ? '0 1px 3px rgba(0,0,0,0.4)' : '0 1px 3px rgba(0,0,0,0.08)' }}>
                            {getInitials(profile.firstName, profile.lastName)}
                        </div>
                    )}
                    
                    {/* Level Badge */}
                    <motion.div 
                        className={cn(
                            'absolute -bottom-1.5 left-1/2 -translate-x-1/2 min-w-[28px] h-[16px] px-1.5 rounded-md flex items-center justify-center text-[8px] font-bold leading-none tracking-wide',
                            isDarkMode 
                                ? 'bg-blue-500 text-white border-[1.5px] border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.4)]' 
                                : 'bg-blue-500 text-white border-[1.5px] border-white shadow-[0_1px_3px_rgba(59,130,246,0.3)]'
                        )}
                        animate={showLevelUp ? { scale: [1, 1.3, 1] } : {}}
                        transition={{ duration: 0.5 }}
                    >
                        Lv.{level}
                    </motion.div>
                    
                    {/* Online Status */}
                    {showOnlineStatus && (
                        <div className={cn(
                            'absolute -top-0 -right-0 w-2.5 h-2.5 rounded-full border-[1.5px]',
                            isDarkMode 
                                ? 'bg-emerald-400 border-slate-800' 
                                : 'bg-emerald-500 border-white'
                        )}></div>
                    )}
                    
                </div>
            </motion.button>
            
            {/* XP Tooltip — Minimalist SaaS */}
            <AnimatePresence>
                {isAvatarHovered && !isOpen && (
                    <div
                        className="absolute top-full mt-2 z-50 pointer-events-none"
                        style={{ right: '8px' }}
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
                                {/* Arrow */}
                                <div
                                    className={cn(
                                        "absolute -top-[5px] w-[10px] h-[10px] rotate-45 border-l border-t",
                                        isDarkMode
                                            ? "bg-slate-900 border-slate-700/60"
                                            : "bg-white border-slate-200"
                                    )}
                                    style={{ right: '16px' }}
                                />

                                {/* Content */}
                                <div className="px-3.5 pt-3 pb-3 flex flex-col gap-3">
                                    {/* Header row */}
                                    <div className="flex items-center gap-2.5">
                                        <div className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                            isDarkMode ? "bg-blue-500/15" : "bg-blue-50"
                                        )}>
                                            {/* Zap bolt icon — thin stroke */}
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? '#60a5fa' : '#3b82f6'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                            </svg>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={cn(
                                                "text-[13px] font-bold leading-tight tracking-tight",
                                                isDarkMode ? "text-white" : "text-slate-900"
                                            )}>Level {level}</span>
                                            <span className={cn(
                                                "text-[11px] font-medium leading-none mt-0.5",
                                                isDarkMode ? "text-slate-400" : "text-slate-500"
                                            )}>Academic Level</span>
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className={cn("h-px w-full", isDarkMode ? "bg-slate-700/60" : "bg-slate-100")} />

                                    {/* Progress section */}
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex justify-between items-baseline">
                                            <span className={cn(
                                                "text-[11px] font-semibold",
                                                isDarkMode ? "text-slate-300" : "text-slate-600"
                                            )}>Progress</span>
                                            <span className={cn(
                                                "text-[11px] font-bold tabular-nums",
                                                isDarkMode ? "text-white" : "text-slate-900"
                                            )}>{getXPData().xpInCurrentLevel}<span className={cn("font-normal", isDarkMode ? "text-slate-500" : "text-slate-400")}>/100</span></span>
                                        </div>
                                        <div className={cn("h-1.5 w-full rounded-full overflow-hidden", isDarkMode ? "bg-slate-800" : "bg-slate-100")}>
                                            <motion.div
                                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${xpProgress}%` }}
                                                transition={{ duration: 0.6, ease: "easeOut" }}
                                            />
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="flex items-center gap-1.5">
                                        <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? '#94a3b8' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10" />
                                            <polyline points="12 6 12 12 16 14" />
                                        </svg>
                                        <span className={cn(
                                            "text-[10px] font-medium leading-none",
                                            isDarkMode ? "text-slate-400" : "text-slate-500"
                                        )}>{100 - getXPData().xpInCurrentLevel} XP until Level {level + 1}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Level Up Notification — Minimalist SaaS */}
            <AnimatePresence>
                {showLevelUp && (
                    <div
                        className="absolute top-full mt-2 z-50 pointer-events-none"
                        style={{ right: '8px' }}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.98 }}
                            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                        >
                            <div
                                className={cn(
                                    "w-[200px] rounded-xl border overflow-hidden relative",
                                    isDarkMode
                                        ? "bg-slate-900 border-slate-700/60 shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
                                        : "bg-white border-slate-200 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
                                )}
                            >
                                {/* Top accent line */}
                                <div className="h-[2px] w-full bg-gradient-to-r from-emerald-400 via-blue-500 to-violet-500" />

                                {/* Arrow */}
                                <div
                                    className={cn(
                                        "absolute -top-[5px] w-[10px] h-[10px] rotate-45 border-l border-t z-10",
                                        isDarkMode
                                            ? "bg-slate-900 border-slate-700/60"
                                            : "bg-white border-slate-200"
                                    )}
                                    style={{ right: '16px' }}
                                />

                                {/* Content */}
                                <div className="px-3.5 pt-3.5 pb-3 flex flex-col items-center gap-2.5">
                                    {/* Icon */}
                                    <motion.div
                                        initial={{ scale: 0.5, rotate: -20 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
                                        className={cn(
                                            "w-9 h-9 rounded-xl flex items-center justify-center",
                                            isDarkMode ? "bg-emerald-500/15" : "bg-emerald-50"
                                        )}
                                    >
                                        {/* Rocket icon — thin stroke */}
                                        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? '#34d399' : '#10b981'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                                            <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                                            <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                                            <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
                                        </svg>
                                    </motion.div>

                                    {/* Text */}
                                    <div className="flex flex-col items-center gap-0.5">
                                        <span className={cn(
                                            "text-[10px] font-bold tracking-widest uppercase",
                                            isDarkMode ? "text-emerald-400" : "text-emerald-600"
                                        )}>Level Up</span>
                                        <span className={cn(
                                            "text-[14px] font-extrabold tracking-tight",
                                            isDarkMode ? "text-white" : "text-slate-900"
                                        )}>Reached Level {level}</span>
                                    </div>

                                    {/* Divider */}
                                    <div className={cn("h-px w-12", isDarkMode ? "bg-slate-700/60" : "bg-slate-100")} />

                                    {/* Footer */}
                                    <span className={cn(
                                        "text-[10px] font-medium",
                                        isDarkMode ? "text-slate-400" : "text-slate-500"
                                    )}>Keep learning to level up!</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            
            {/* XP Gain Popup - minimalistic with smooth animation */}
            <AnimatePresence>
                {xpGain !== null && (
                    <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.9 }}
                        animate={{ opacity: 1, y: 4, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ 
                            duration: 0.5, 
                            ease: [0.25, 0.46, 0.45, 0.94] // smooth easeOut
                        }}
                        className='absolute top-full right-1 mt-1 px-2.5 py-1 bg-blue-600 text-yellow-300 text-[10px] font-semibold rounded-lg shadow-md whitespace-nowrap z-50'
                    >
                        <span className='opacity-80'>Nice!</span> +{xpGain} XP
                        <div className='absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-600 rotate-45' />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Dropdown Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.97 }}
                        transition={{ 
                            type: 'spring', 
                            stiffness: 500, 
                            damping: 30,
                            mass: 0.8
                        }}
                        style={{ transformOrigin: 'top right' }}
                        className='absolute top-full mt-2.5 right-0 w-80 sm:w-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.05)] overflow-hidden z-50'
                    >
                        {/* Header with Cover Photo */}
                        <div className='relative'>
                            {/* Cover Photo */}
                            <div 
                                className='h-24 bg-gradient-to-r from-blue-500 to-indigo-600 relative overflow-hidden cursor-pointer group'
                                onClick={() => coverInputRef.current?.click()}
                            >
                                {coverImage ? (
                                    <img src={coverImage} alt="Cover" className='w-full h-full object-cover' />
                                ) : (
                                    <div className='absolute inset-0 flex items-center justify-center'>
                                        <div className='text-white/30 text-xs flex flex-col items-center gap-1 group-hover:text-white/60 transition-colors'>
                                            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' />
                                            </svg>
                                            <span>Add cover photo</span>
                                        </div>
                                    </div>
                                )}
                                {/* Edit overlay */}
                                <div className='absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100'>
                                    <span className='text-white text-xs font-medium'>Change Cover</span>
                                </div>
                            </div>
                            <input
                                ref={coverInputRef}
                                type='file'
                                accept='image/*,.gif'
                                onChange={handleCoverUpload}
                                className='hidden'
                            />

                            {/* Profile Picture */}
                            <div className='absolute -bottom-8 left-4'>
                                <div 
                                    className='relative w-16 h-16 rounded-full border-4 border-white shadow-lg cursor-pointer group overflow-hidden'
                                    onClick={(e) => { e.stopPropagation(); profileInputRef.current?.click(); }}
                                >
                                    {profileImage ? (
                                        <img src={profileImage} alt="Profile" className='w-full h-full object-cover' />
                                    ) : (
                                        <div className='w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg'>
                                            {getInitials(profile.firstName, profile.lastName)}
                                        </div>
                                    )}
                                    {/* Edit overlay */}
                                    <div className='absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100'>
                                        <svg className='w-5 h-5 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z' />
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 13a3 3 0 11-6 0 3 3 0 016 0z' />
                                        </svg>
                                    </div>
                                </div>
                                {showOnlineStatus && (
                                    <div className='absolute -bottom-0.5 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white'></div>
                                )}
                            </div>
                            <input
                                ref={profileInputRef}
                                type='file'
                                accept='image/*,.gif'
                                onChange={handleProfileUpload}
                                className='hidden'
                            />
                        </div>

                        {/* User Info */}
                        <div className='pt-12 pb-4 px-5'>
                            <div className='font-bold text-xl text-slate-900 tracking-tight'>{profile.firstName} {profile.lastName}</div>
                            <div className='text-[13px] text-slate-500 mt-1 truncate'>{profile.email}</div>
                            <div className='inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 bg-slate-100 rounded-lg border border-slate-200/60'>
                                <svg className='w-3 h-3 text-slate-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 20l4-16m2 16l4-16M6 9h14M4 15h14' />
                                </svg>
                                <span className='text-[11px] font-semibold text-slate-600 tracking-wide'>{profile.studentId}</span>
                            </div>
                        </div>

                        {/* Level & XP Progress Section */}
                        <div className='px-5 pb-4 border-b border-slate-100/60'>
                            <div className='flex items-center justify-between text-xs font-semibold mb-1.5'>
                                <span className='text-slate-500'>Level {level}</span>
                                <span className='text-blue-600 font-bold'>{getXPData().xpInCurrentLevel} / 100 XP</span>
                            </div>
                            <div className='h-2 w-full bg-slate-100 rounded-full overflow-hidden relative'>
                                <motion.div 
                                    className='h-full bg-blue-500 rounded-full'
                                    initial={{ width: 0 }}
                                    animate={{ width: `${xpProgress}%` }}
                                    transition={{ duration: 1.2, ease: 'easeOut' }}
                                />
                            </div>
                            <div className='text-[10px] text-slate-400 mt-1 font-medium'>
                                {100 - getXPData().xpInCurrentLevel} XP to Level {level + 1}
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className='flex border-b border-slate-100 px-3 gap-1'>
                            {[
                                { 
                                    id: 'profile' as ProfileTab, 
                                    label: 'Profile', 
                                    icon: (
                                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                                        </svg>
                                    )
                                },
                                { 
                                    id: 'settings' as ProfileTab, 
                                    label: 'Settings', 
                                    icon: (
                                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' />
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                                        </svg>
                                    )
                                },

                            ].map((tab) => (
                                <motion.button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    whileHover={{ y: -1 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={cn(
                                        'flex-1 py-3 text-[13px] font-semibold transition-all relative flex items-center justify-center gap-2 rounded-t-xl',
                                        activeTab === tab.id 
                                            ? 'text-slate-900 bg-slate-50/80' 
                                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50/50'
                                    )}
                                >
                                    <motion.span
                                        animate={{ 
                                            scale: activeTab === tab.id ? 1.1 : 1,
                                            rotate: activeTab === tab.id && tab.id === 'settings' ? 90 : 0
                                        }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                    >
                                        {tab.icon}
                                    </motion.span>
                                    <span>{tab.label}</span>
                                    {activeTab === tab.id && (
                                        <motion.div
                                            layoutId="profileTabIndicator"
                                            className='absolute bottom-0 left-3 right-3 h-[2px] bg-blue-500 rounded-full'
                                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                        />
                                    )}
                                </motion.button>
                            ))}
                        </div>

                        {/* Save Message Toast */}
                        <AnimatePresence>
                            {saveMessage && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className={cn(
                                        'mx-4 mt-2 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2',
                                        saveMessage.type === 'success' 
                                            ? 'bg-green-50 text-green-700 border border-green-200' 
                                            : 'bg-red-50 text-red-700 border border-red-200'
                                    )}
                                >
                                    {saveMessage.type === 'success' ? (
                                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                                        </svg>
                                    ) : (
                                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                                        </svg>
                                    )}
                                    {saveMessage.text}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Content */}
                        <div className='p-5 max-h-80 overflow-y-auto' style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}>
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

                        {/* Footer */}
                        <div className='border-t border-slate-100 p-4 bg-white'>
                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSignOut}
                                className='w-full py-2.5 text-[13px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all border border-red-100/50 flex items-center justify-center gap-2 shadow-sm'
                            >
                                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1' />
                                </svg>
                                Sign Out
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
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
            icon: (
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
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
            icon: (
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M12 14l9-5-9-5-9 5 9 5z' />
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z' />
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
            icon: (
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
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
            className='space-y-5'
        >
            {/* Edit Button */}
            {!isEditing && (
                <motion.button
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={onEdit}
                    className='w-full py-2.5 text-[13px] font-semibold text-blue-700 bg-blue-50/80 hover:bg-blue-100 rounded-xl transition-all flex items-center justify-center gap-1.5 border border-blue-100/50 shadow-sm'
                >
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' />
                    </svg>
                    Edit Profile
                </motion.button>
            )}

            {/* Sections */}
            {sections.map((section, sectionIndex) => (
                <motion.div
                    key={section.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: sectionIndex * 0.1 }}
                    className='space-y-3'
                >
                    {/* Section Header */}
                    <div className='flex items-center gap-2 text-slate-500'>
                        {section.icon}
                        <span className='text-xs font-bold text-slate-700 uppercase tracking-widest'>{section.title}</span>
                    </div>

                    {/* Section Fields */}
                    <div className='bg-slate-50/80 border border-slate-100/60 rounded-2xl p-4 space-y-0 shadow-sm divide-y divide-slate-100/80'>
                        {section.fields.map((field, fieldIndex) => (
                            <motion.div
                                key={field.key}
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: sectionIndex * 0.1 + fieldIndex * 0.05 }}
                                className='flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0'
                            >
                                <span className='text-[13px] font-medium text-slate-400 shrink-0 min-w-[100px]'>{field.label}</span>
                                {isEditing && field.editable ? (
                                    <motion.input
                                        initial={{ scale: 0.98 }}
                                        animate={{ scale: 1 }}
                                        type={'type' in field ? field.type : 'text'}
                                        value={profile[field.key]}
                                        onChange={(e) => onChange(field.key, e.target.value)}
                                        className='flex-1 min-w-0 px-2.5 py-1.5 text-[13px] font-semibold text-slate-900 text-right border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white'
                                    />
                                ) : (
                                    <span className='text-[13px] font-semibold text-slate-900 text-right truncate min-w-0'>
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
                        className='flex gap-3 pt-2'
                    >
                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onCancel}
                            disabled={isSaving}
                            className='flex-1 py-2.5 text-[13px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all border border-slate-200/60 disabled:opacity-50'
                        >
                            Cancel
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: isSaving ? 1 : 1.01 }}
                            whileTap={{ scale: isSaving ? 1 : 0.98 }}
                            onClick={onSave}
                            disabled={isSaving}
                            className='flex-1 py-2.5 text-[13px] font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed'
                        >
                            {isSaving ? (
                                <>
                                    <svg className='w-4 h-4 animate-spin' fill='none' viewBox='0 0 24 24'>
                                        <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                                        <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                                    </svg>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
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
            icon: (
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' />
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
            icon: (
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' />
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
                    className='space-y-3'
                >
                    {/* Section Header */}
                    <div className='flex items-center gap-2 text-slate-500'>
                        {group.icon}
                        <span className='text-xs font-bold text-slate-700 uppercase tracking-widest'>{group.title}</span>
                    </div>

                    {/* Section Content */}
                    <div className='bg-slate-50/80 border border-slate-100/60 rounded-2xl overflow-hidden shadow-sm'>
                        {group.items.map((item, itemIndex) => (
                            <motion.div 
                                key={item.key}
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: groupIndex * 0.1 + itemIndex * 0.05 }}
                                className={cn(
                                    'flex items-center justify-between p-4 hover:bg-slate-100/80 transition-colors',
                                    itemIndex !== group.items.length - 1 && 'border-b border-slate-200/60'
                                )}
                            >
                                <div className='flex-1 min-w-0'>
                                    <div className='text-[13px] font-semibold text-slate-900'>{item.label}</div>
                                    <div className='text-xs text-slate-500 mt-0.5'>{item.desc}</div>
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


