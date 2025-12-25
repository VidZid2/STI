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
                setLastTotalXP(currentData.totalXP);
                
                // Hide the +XP popup after 2 seconds
                setTimeout(() => setXpGain(null), 2000);
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
                className='flex items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-zinc-100 transition-colors'
            >
                <div className='text-right hidden sm:block'>
                    <div className='text-sm font-medium text-zinc-800'>{profile.firstName} {profile.lastName}</div>
                    <div className='text-[10px] text-zinc-500'>{profile.course}</div>
                </div>
                <div className='relative'>
                    {/* XP Progress Ring */}
                    <svg 
                        className='absolute -inset-1 w-12 h-12'
                        viewBox='0 0 48 48'
                        style={{ transform: 'rotate(-90deg)' }}
                    >
                        {/* Background ring */}
                        <circle
                            cx='24'
                            cy='24'
                            r='22'
                            fill='none'
                            stroke={isDarkMode ? '#1e3a5f' : '#dbeafe'}
                            strokeWidth='2.5'
                        />
                        {/* Progress ring */}
                        <motion.circle
                            cx='24'
                            cy='24'
                            r='22'
                            fill='none'
                            stroke={isDarkMode ? '#60a5fa' : '#3b82f6'}
                            strokeWidth='2.5'
                            strokeLinecap='round'
                            strokeDasharray={2 * Math.PI * 22}
                            initial={{ strokeDashoffset: 2 * Math.PI * 22 }}
                            animate={{ 
                                strokeDashoffset: 2 * Math.PI * 22 * (1 - xpProgress / 100)
                            }}
                            transition={{ 
                                duration: 1.2, 
                                ease: [0.34, 1.56, 0.64, 1] // Smooth spring-like easing
                            }}
                        />
                    </svg>
                    
                    {/* Profile Image */}
                    {profileImage ? (
                        <img src={profileImage} alt="Profile" className='w-10 h-10 rounded-full object-cover shadow-md' />
                    ) : (
                        <div className='w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-md'>
                            {getInitials(profile.firstName, profile.lastName)}
                        </div>
                    )}
                    
                    {/* Level Badge */}
                    <motion.div 
                        className={cn(
                            'absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shadow-sm',
                            isDarkMode 
                                ? 'bg-blue-400 text-blue-950 border-2 border-slate-700' 
                                : 'bg-blue-500 text-white border-2 border-white'
                        )}
                        animate={showLevelUp ? { scale: [1, 1.3, 1] } : {}}
                        transition={{ duration: 0.5 }}
                    >
                        {level}
                    </motion.div>
                    
                    {/* Online Status (moved to top-right) */}
                    {showOnlineStatus && (
                        <div className={cn(
                            'absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2',
                            isDarkMode 
                                ? 'bg-green-400 border-slate-700' 
                                : 'bg-green-500 border-white'
                        )}></div>
                    )}
                </div>
            </motion.button>
            
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
            
            {/* Level Up Tooltip */}
            <AnimatePresence>
                {showLevelUp && (
                    <motion.div
                        initial={{ opacity: 0, y: -5, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -5, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        className='absolute top-full right-0 mt-2 px-3 py-1.5 bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-lg whitespace-nowrap z-50'
                    >
                        <span className='mr-1'>🎉</span>
                        Level Up!
                        <div className='absolute -top-1 right-5 w-2 h-2 bg-blue-500 rotate-45' />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Dropdown Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        className='absolute top-full mt-2 right-0 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-zinc-200 overflow-hidden z-50'
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
                        <div className='pt-10 pb-3 px-4'>
                            <div className='font-semibold text-lg text-zinc-800'>{profile.firstName} {profile.lastName}</div>
                            <div className='text-sm text-zinc-500'>{profile.email}</div>
                            <div className='text-xs text-zinc-400 mt-0.5'>ID: {profile.studentId}</div>
                        </div>

                        {/* Tabs */}
                        <div className='flex border-b border-zinc-100 px-2'>
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
                                        'flex-1 py-3 text-xs font-medium transition-all relative flex items-center justify-center gap-1.5 rounded-t-lg mx-0.5',
                                        activeTab === tab.id 
                                            ? 'text-blue-600 bg-blue-50/50' 
                                            : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50'
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
                                    <span className='hidden sm:inline'>{tab.label}</span>
                                    {activeTab === tab.id && (
                                        <motion.div
                                            layoutId="profileTabIndicator"
                                            className='absolute bottom-0 left-2 right-2 h-0.5 bg-blue-500 rounded-full'
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
                        <div className='p-4 max-h-80 overflow-y-auto'>
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
                        <div className='border-t border-zinc-200 p-3 bg-zinc-50'>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSignOut}
                                className='w-full py-2 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-2'
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className='space-y-4'
        >
            {/* Edit Button */}
            {!isEditing && (
                <motion.button
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={onEdit}
                    className='w-full py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-1.5'
                >
                    <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
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
                    className='space-y-2'
                >
                    {/* Section Header */}
                    <div className='flex items-center gap-2 text-zinc-500'>
                        {section.icon}
                        <span className='text-[10px] font-semibold uppercase tracking-wider'>{section.title}</span>
                    </div>

                    {/* Section Fields */}
                    <div className='bg-zinc-50 rounded-xl p-3 space-y-2.5'>
                        {section.fields.map((field, fieldIndex) => (
                            <motion.div
                                key={field.key}
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: sectionIndex * 0.1 + fieldIndex * 0.05 }}
                                className='flex items-center justify-between'
                            >
                                <span className='text-xs text-zinc-500'>{field.label}</span>
                                {isEditing && field.editable ? (
                                    <motion.input
                                        initial={{ scale: 0.98 }}
                                        animate={{ scale: 1 }}
                                        type={'type' in field ? field.type : 'text'}
                                        value={profile[field.key]}
                                        onChange={(e) => onChange(field.key, e.target.value)}
                                        className='w-1/2 px-2 py-1 text-xs text-right border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white'
                                    />
                                ) : (
                                    <span className={cn(
                                        'text-xs font-medium',
                                        field.editable ? 'text-zinc-800' : 'text-zinc-600'
                                    )}>
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
                        className='flex gap-2 pt-1'
                    >
                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={onCancel}
                            disabled={isSaving}
                            className='flex-1 py-2 text-xs font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors disabled:opacity-50'
                        >
                            Cancel
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: isSaving ? 1 : 1.01 }}
                            whileTap={{ scale: isSaving ? 1 : 0.99 }}
                            onClick={onSave}
                            disabled={isSaving}
                            className='flex-1 py-2 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors flex items-center justify-center gap-1 disabled:opacity-70 disabled:cursor-not-allowed'
                        >
                            {isSaving ? (
                                <>
                                    <svg className='w-3.5 h-3.5 animate-spin' fill='none' viewBox='0 0 24 24'>
                                        <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                                        <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                                    </svg>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                                    </svg>
                                    Save
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className='space-y-4'
        >
            {settingGroups.map((group, groupIndex) => (
                <motion.div 
                    key={group.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: groupIndex * 0.1 }}
                    className='space-y-2'
                >
                    {/* Section Header */}
                    <div className='flex items-center gap-2 text-zinc-500'>
                        {group.icon}
                        <span className='text-[10px] font-semibold uppercase tracking-wider'>{group.title}</span>
                    </div>

                    {/* Section Content */}
                    <div className='bg-zinc-50 rounded-xl overflow-hidden'>
                        {group.items.map((item, itemIndex) => (
                            <motion.div 
                                key={item.key}
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: groupIndex * 0.1 + itemIndex * 0.05 }}
                                className={cn(
                                    'flex items-center justify-between p-3 hover:bg-zinc-100/50 transition-colors',
                                    itemIndex !== group.items.length - 1 && 'border-b border-zinc-100'
                                )}
                            >
                                <div className='flex-1 min-w-0'>
                                    <div className='text-xs font-medium text-zinc-700'>{item.label}</div>
                                    <div className='text-[10px] text-zinc-400 mt-0.5'>{item.desc}</div>
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


