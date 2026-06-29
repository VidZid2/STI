/**
 * UserDetailModal
 * Detailed user profile modal.
 * Extracted from UsersContent.tsx during Phase 8.4
 */
import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { getRoleInfo, getTeacherCourses, getTeacherOfficeHours, type UserAccount, type TeacherCourse, type OfficeHours } from '../../../../../services/usersService';
import RoleIcon from '../components/RoleIcon';
import { SkeletonPulse } from '../components/UsersSkeleton';
import { getLastSeenText } from '../utils';
import { AnimatedCircularProgressBar } from '../../../../../components/ui/animated-circular-progress-bar';
import { getCurrentUser } from '../../../../../services/authService';

const maskEmail = (email: string) => {
    if (!email) return '';
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const [name, domain] = parts;
    if (name.length <= 3) return name[0] + '***@' + domain;
    return name.substring(0, 3) + '***@' + domain;
};

export interface UserDetailModalProps {
    user: UserAccount | null;
    isOpen: boolean;
    onClose: () => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ user, isOpen, onClose }) => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    const [courses, setCourses] = useState<TeacherCourse[]>([]);
    const [officeHours, setOfficeHours] = useState<OfficeHours[]>([]);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [isLoadingCourses, setIsLoadingCourses] = useState(false);

    const colors = {
        bg: isDarkMode ? '#0f172a' : '#ffffff',
        cardBg: isDarkMode ? '#1e293b' : '#f8fafc',
        border: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        textPrimary: isDarkMode ? '#f1f5f9' : '#0f172a',
        textSecondary: isDarkMode ? '#94a3b8' : '#64748b',
        textMuted: isDarkMode ? '#64748b' : '#94a3b8',
    };

    const currentUser = getCurrentUser();
    const isCurrentUser = currentUser && user && (currentUser.email === user.email || currentUser.id === user.id);

    // Load courses and office hours when modal opens
    useEffect(() => {
        if (isOpen && user && user.role === 'teacher') {
            setIsLoadingCourses(true);
            getTeacherCourses(user.full_name).then(data => {
                setCourses(data);
                setIsLoadingCourses(false);
            });
            setOfficeHours(getTeacherOfficeHours(user.full_name));
        }
    }, [isOpen, user]);

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Copy to clipboard
    const copyToClipboard = useCallback((text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    }, []);

    if (!user) return null;

    const roleInfo = getRoleInfo(user.role);

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
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0, 0, 0, 0.5)',
                            backdropFilter: 'blur(4px)',
                            zIndex: 9998,
                        }}
                    />

                    {/* Modal */}
                    <div 
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="user-modal-title"
                        style={{
                            position: 'fixed',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 9999,
                            pointerEvents: 'none',
                            padding: '20px',
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            style={{
                                width: '100%',
                                maxWidth: '480px',
                                maxHeight: '85vh',
                                background: colors.bg,
                                borderRadius: '20px',
                                boxShadow: isDarkMode
                                    ? '0 24px 48px rgba(0, 0, 0, 0.4)'
                                    : '0 24px 48px rgba(0, 0, 0, 0.15)',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                pointerEvents: 'auto',
                            }}
                        >
                            {/* Header */}
                            <div className="relative border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-t-[20px] p-2.5 sm:p-3 pb-0">
                                {/* Header Card */}
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 24, delay: 0.1 }}
                                    className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[16px] sm:rounded-[20px] flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 group transition-all duration-300 hover:shadow-md hover:border-blue-200/80 dark:hover:border-blue-800/50 w-full mb-2.5"
                                >
                                    {/* SaaS Background Accents */}
                                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
                                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-blue-400/10 dark:bg-blue-400/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />

                                    {/* Avatar */}
                                    <div className="relative z-10 flex-shrink-0">
                                        <AnimatedCircularProgressBar
                                            max={100}
                                            min={0}
                                            value={user.email === 'halili.andrei@meycauayan.sti.edu.ph' ? 75 : 0}
                                            gaugePrimaryColor={(user.level || 1) >= 20 ? '#eab308' : '#3b82f6'}
                                            gaugeSecondaryColor={isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(219, 234, 254, 0.6)'}
                                            className="w-[48px] h-[48px] sm:w-[52px] sm:h-[52px]"
                                        >
                                            <div className="absolute inset-1.5 sm:inset-1.5 rounded-full flex items-center justify-center shadow-sm overflow-hidden z-10 bg-blue-50 dark:bg-blue-900/30">
                                                {user.profile_image ? (
                                                    <img src={user.profile_image} alt={user.full_name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-[16px] sm:text-[18px] font-extrabold leading-none text-blue-600 dark:text-blue-400">
                                                        {user.first_name?.[0] || ''}{user.last_name?.[0] || ''}
                                                    </span>
                                                )}
                                            </div>

                                            <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 min-w-[32px] sm:min-w-[36px] h-[16px] sm:h-[18px] px-1.5 rounded-md flex items-center justify-center text-[9px] sm:text-[10px] font-bold tracking-wider shadow-sm border-[2px] z-20 transition-colors duration-300 ${(user.level || 1) >= 20 ? 'bg-yellow-400 text-blue-800' : 'text-white bg-blue-500'} ${isDarkMode ? (user.is_online ? 'border-emerald-400' : 'border-slate-800') : (user.is_online ? 'border-emerald-500' : 'border-white')}`}>
                                                <span className="ml-[0.05em]">{(user.level || 1) >= 20 ? 'MAX' : `LV.${user.level || 1}`}</span>
                                            </div>
                                        </AnimatedCircularProgressBar>
                                    </div>
                                    
                                    <div className="relative z-10 flex-1 min-w-0 pr-2">
                                        <motion.h2 
                                            className="text-[16px] sm:text-[17px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight m-0 mb-1 truncate"
                                            id="user-modal-title"
                                        >
                                            {user.full_name}
                                        </motion.h2>
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-2.5">
                                            <span style={{ background: roleInfo.bgColor, color: roleInfo.color }} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] sm:text-[12px] font-medium whitespace-nowrap leading-none">
                                                <RoleIcon role={user.role} size={14} />
                                                {roleInfo.label}
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800/50 text-[11px] sm:text-[12px] font-medium text-zinc-600 dark:text-zinc-300 leading-none whitespace-nowrap">
                                                <span className={`w-1.5 h-1.5 rounded-full ${user.is_online ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-slate-400'}`} />
                                                {getLastSeenText(user.last_active, user.is_online || false)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="relative z-20 self-start">
                                        <motion.button
                                            onClick={onClose}
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="flex-shrink-0 flex items-center justify-center rounded-lg sm:rounded-xl border border-zinc-200/80 bg-white/80 backdrop-blur-md p-2 text-zinc-500 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-700/80 dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:bg-zinc-700"
                                            aria-label="Close modal"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sm:w-5 sm:h-5">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        </motion.button>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-4 sm:p-5 sm:px-6 pb-2 sm:pb-4">
                                {/* Contact Info */}
                                <div className="mb-5 sm:mb-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-1.5 h-4 rounded-[3px] bg-blue-500"></div>
                                        <h3 className="text-[16px] font-bold text-zinc-900 dark:text-zinc-50 tracking-tight m-0">
                                            Contact Information
                                        </h3>
                                    </div>
                                    
                                    {/* Email */}
                                    <div
                                        onClick={() => isCurrentUser ? copyToClipboard(user.email, 'email') : undefined}
                                        className={`group flex items-center gap-3.5 p-3 sm:p-3.5 rounded-[14px] sm:rounded-[16px] border border-zinc-200/80 dark:border-zinc-800/80 mb-2.5 bg-white dark:bg-zinc-900/50 ${isCurrentUser ? 'hover:shadow-md hover:-translate-y-0.5 hover:border-blue-200/80 dark:hover:border-blue-800/50 transition-all duration-300 cursor-pointer' : ''}`}
                                    >
                                        <div className={`w-10 h-10 rounded-[12px] border flex items-center justify-center shrink-0 shadow-sm ${isCurrentUser ? 'bg-blue-50/80 dark:bg-blue-900/30 border-blue-100/50 dark:border-blue-800/30 text-blue-600 dark:text-blue-400 group-hover:scale-105 group-hover:rotate-[-5deg] transition-transform duration-300' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                                <polyline points="22,6 12,13 2,6" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
                                            <div className="text-[11.5px] font-semibold text-zinc-500 dark:text-zinc-400 mb-0.5 tracking-wide">Email</div>
                                            <div className="text-[13px] sm:text-[14px] font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                                {isCurrentUser ? user.email : maskEmail(user.email)}
                                            </div>
                                        </div>
                                        {isCurrentUser && (
                                            <motion.div
                                                initial={false}
                                                animate={{ scale: copiedField === 'email' ? [1, 1.15, 1] : 1 }}
                                                className={`flex items-center justify-center rounded-xl border p-2 shadow-sm transition-all duration-300 ${copiedField === 'email' ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400' : 'bg-zinc-50 border-zinc-200/80 text-zinc-500 group-hover:bg-blue-50 group-hover:border-blue-200 group-hover:text-blue-600 dark:bg-zinc-800/80 dark:border-zinc-700/80 dark:text-zinc-400 dark:group-hover:bg-blue-900/30 dark:group-hover:border-blue-800/50 dark:group-hover:text-blue-400'}`}
                                            >
                                                {copiedField === 'email' ? (
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                ) : (
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                                    </svg>
                                                )}
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* Campus */}
                                    <div className="group flex items-center gap-3.5 p-3 sm:p-3.5 rounded-[14px] sm:rounded-[16px] border border-zinc-200/80 dark:border-zinc-800/80 hover:shadow-md hover:-translate-y-0.5 hover:border-purple-200/80 dark:hover:border-purple-800/50 transition-all duration-300 bg-white dark:bg-zinc-900/50 cursor-default">
                                        <div className="w-10 h-10 rounded-[12px] bg-purple-50/80 dark:bg-purple-900/30 border border-purple-100/50 dark:border-purple-800/30 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-105 group-hover:rotate-[-5deg] transition-transform duration-300 shrink-0 shadow-sm">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                                <polyline points="9 22 9 12 15 12 15 22" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
                                            <div className="text-[11.5px] font-semibold text-zinc-500 dark:text-zinc-400 mb-0.5 tracking-wide">Campus</div>
                                            <div className="text-[13px] sm:text-[14px] font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                                STI College {user.campus}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Courses (for teachers) */}
                                {user.role === 'teacher' && (
                                    <div style={{ marginBottom: '20px' }}>
                                        <h3 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Courses Teaching
                                        </h3>
                                        {isLoadingCourses ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {[...Array(2)].map((_, i) => (
                                                    <div
                                                        key={i}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '12px',
                                                            padding: '12px',
                                                            borderRadius: '12px',
                                                            border: `1px solid ${colors.border}`,
                                                        }}
                                                    >
                                                        <SkeletonPulse width="36px" height="36px" borderRadius="10px" />
                                                        <div style={{ flex: 1 }}>
                                                            <SkeletonPulse width="70%" height="13px" borderRadius="4px" style={{ marginBottom: '4px' }} />
                                                            <SkeletonPulse width="50%" height="11px" borderRadius="4px" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : courses.length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {courses.map((course, index) => (
                                                    <motion.div
                                                        key={course.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '12px',
                                                            padding: '12px',
                                                            borderRadius: '12px',
                                                            border: `1px solid ${colors.border}`,
                                                            background: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                                                        }}
                                                    >
                                                        <div style={{
                                                            width: '36px',
                                                            height: '36px',
                                                            borderRadius: '10px',
                                                            background: 'rgba(16, 185, 129, 0.1)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                        }}>
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                                            </svg>
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontSize: '13px', fontWeight: 500, color: colors.textPrimary }}>{course.title}</div>
                                                            <div style={{ fontSize: '11px', color: colors.textMuted }}>{course.subtitle}</div>
                                                        </div>
                                                        <span style={{
                                                            fontSize: '10px',
                                                            fontWeight: 600,
                                                            padding: '3px 8px',
                                                            borderRadius: '6px',
                                                            background: course.category === 'major' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                                                            color: course.category === 'major' ? '#3b82f6' : '#8b5cf6',
                                                            textTransform: 'uppercase',
                                                        }}>
                                                            {course.short_title}
                                                        </span>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{ padding: '20px', textAlign: 'center', color: colors.textMuted, fontSize: '13px' }}>
                                                No courses assigned
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Office Hours (for teachers) */}
                                {user.role === 'teacher' && officeHours.length > 0 && (
                                    <div style={{ marginBottom: '20px' }}>
                                        <h3 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Office Hours
                                        </h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {officeHours.map((hours, index) => (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '12px',
                                                        padding: '10px 12px',
                                                        borderRadius: '10px',
                                                        background: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                                                        border: `1px solid ${colors.border}`,
                                                    }}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <circle cx="12" cy="12" r="10" />
                                                        <polyline points="12 6 12 12 16 14" />
                                                    </svg>
                                                    <span style={{ fontSize: '12px', fontWeight: 500, color: colors.textPrimary, minWidth: '80px' }}>{hours.day}</span>
                                                    <span style={{ fontSize: '12px', color: colors.textSecondary }}>{hours.time}</span>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Student Info */}
                                {user.role === 'student' && (
                                    <div className="mb-0">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-1.5 h-4 rounded-[3px] bg-blue-500"></div>
                                            <h3 className="text-[16px] font-bold text-zinc-900 dark:text-zinc-50 tracking-tight m-0">
                                                Academic Information
                                            </h3>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
                                            {user.program && (
                                                <div className="p-3 sm:p-3.5 rounded-[14px] sm:rounded-[16px] border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 transition-all duration-300 hover:border-emerald-200/80 dark:hover:border-emerald-800/50 hover:-translate-y-0.5 hover:shadow-sm flex flex-col justify-center">
                                                    <div className="text-[11px] sm:text-[11.5px] font-semibold text-zinc-500 dark:text-zinc-400 mb-0.5 tracking-wide">Program</div>
                                                    <div className="text-[13px] sm:text-[14px] font-bold text-zinc-900 dark:text-zinc-100 truncate">{user.program}</div>
                                                </div>
                                            )}
                                            {user.year_level && (
                                                <div className="p-3 sm:p-3.5 rounded-[14px] sm:rounded-[16px] border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 transition-all duration-300 hover:border-amber-200/80 dark:hover:border-amber-800/50 hover:-translate-y-0.5 hover:shadow-sm flex flex-col justify-center">
                                                    <div className="text-[11px] sm:text-[11.5px] font-semibold text-zinc-500 dark:text-zinc-400 mb-0.5 tracking-wide">Year Level</div>
                                                    <div className="text-[13px] sm:text-[14px] font-bold text-zinc-900 dark:text-zinc-100 truncate">{user.year_level}</div>
                                                </div>
                                            )}
                                            {user.section && (
                                                <div className="col-span-2 sm:col-span-1 p-3 sm:p-3.5 rounded-[14px] sm:rounded-[16px] border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 transition-all duration-300 hover:border-blue-200/80 dark:hover:border-blue-800/50 hover:-translate-y-0.5 hover:shadow-sm flex flex-col justify-center">
                                                    <div className="text-[11px] sm:text-[11.5px] font-semibold text-zinc-500 dark:text-zinc-400 mb-0.5 tracking-wide">Section</div>
                                                    <div className="text-[13px] sm:text-[14px] font-bold text-zinc-900 dark:text-zinc-100 truncate">{user.section}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-4 sm:p-5 border-t border-zinc-200/80 dark:border-zinc-800/80 flex flex-row gap-2.5 bg-zinc-50/50 dark:bg-zinc-900/30">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => window.location.href = `mailto:${user.email}`}
                                    className="flex-1 py-2.5 sm:py-3 px-4 text-[13px] sm:text-[14px] font-bold rounded-[14px] transition-colors flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900/70 text-blue-700 dark:text-blue-300 focus-visible:ring-blue-500"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                        <polyline points="22,6 12,13 2,6" />
                                    </svg>
                                    Send Message
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={onClose}
                                    className="flex-1 py-2.5 sm:py-3 px-4 text-[13px] sm:text-[14px] font-bold rounded-[14px] transition-colors flex items-center justify-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 focus-visible:ring-zinc-500"
                                >
                                    Close
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};


export { UserDetailModal };
export default UserDetailModal;
