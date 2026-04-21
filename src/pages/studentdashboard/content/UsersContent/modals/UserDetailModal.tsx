/**
 * UserDetailModal
 * Detailed user profile modal.
 * Extracted from UsersContent.tsx during Phase 8.4
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getRoleInfo, type UserAccount } from '../../../../../services/usersService';
import UserAvatar from '../components/UserAvatar';

const UserDetailModal: React.FC<UserDetailModalProps> = ({ user, isOpen, onClose, isDarkMode }) => {
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
                            <div style={{ padding: '24px 24px 20px', borderBottom: `1px solid ${colors.border}` }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                                    {/* Avatar */}
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
                                        style={{
                                            width: '64px',
                                            height: '64px',
                                            borderRadius: '16px',
                                            background: `linear-gradient(135deg, ${roleInfo.color}20 0%, ${roleInfo.color}10 100%)`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '24px',
                                            fontWeight: 600,
                                            color: roleInfo.color,
                                            flexShrink: 0,
                                        }}
                                    >
                                        {user.profile_image ? (
                                            <img src={user.profile_image} alt={user.full_name} style={{ width: '100%', height: '100%', borderRadius: '16px', objectFit: 'cover' }} />
                                        ) : `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()}
                                    </motion.div>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h2 id="user-modal-title" style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: colors.textPrimary, marginBottom: '4px' }}>
                                            {user.full_name}
                                        </h2>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                padding: '4px 10px',
                                                borderRadius: '8px',
                                                background: roleInfo.bgColor,
                                                fontSize: '12px',
                                                fontWeight: 500,
                                                color: roleInfo.color,
                                            }}>
                                                <RoleIcon role={user.role} size={12} />
                                                {roleInfo.label}
                                            </span>
                                            {/* Online/Last Seen Status */}
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                fontSize: '11px',
                                                color: user.is_online ? '#10b981' : colors.textMuted,
                                            }}>
                                                <span style={{ 
                                                    width: '6px', 
                                                    height: '6px', 
                                                    borderRadius: '50%', 
                                                    background: user.is_online ? '#10b981' : '#94a3b8',
                                                    boxShadow: user.is_online ? '0 0 6px rgba(16, 185, 129, 0.5)' : 'none',
                                                }} />
                                                {getLastSeenText(user.last_active, user.is_online || false)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Close Button */}
                                    <motion.button
                                        aria-label="Close modal"
                                        whileHover={{ scale: 1.1, background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={onClose}
                                        style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '10px',
                                            border: 'none',
                                            background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: colors.textSecondary,
                                        }}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <line x1="18" y1="6" x2="6" y2="18" />
                                            <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                    </motion.button>
                                </div>
                            </div>

                            {/* Content */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
                                {/* Contact Info */}
                                <div style={{ marginBottom: '20px' }}>
                                    <h3 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Contact Information
                                    </h3>
                                    
                                    {/* Email */}
                                    <motion.div
                                        whileHover={{ background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
                                        onClick={() => copyToClipboard(user.email, 'email')}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '12px',
                                            borderRadius: '12px',
                                            cursor: 'pointer',
                                            marginBottom: '8px',
                                            border: `1px solid ${colors.border}`,
                                        }}
                                    >
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '10px',
                                            background: 'rgba(59, 130, 246, 0.1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                                <polyline points="22,6 12,13 2,6" />
                                            </svg>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '11px', color: colors.textMuted, marginBottom: '2px' }}>Email</div>
                                            <div style={{ fontSize: '13px', color: colors.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {user.email}
                                            </div>
                                        </div>
                                        <motion.div
                                            initial={false}
                                            animate={{ scale: copiedField === 'email' ? [1, 1.2, 1] : 1 }}
                                            style={{ color: copiedField === 'email' ? '#10b981' : colors.textMuted }}
                                        >
                                            {copiedField === 'email' ? (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            ) : (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                                </svg>
                                            )}
                                        </motion.div>
                                    </motion.div>

                                    {/* Campus */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '12px',
                                        borderRadius: '12px',
                                        border: `1px solid ${colors.border}`,
                                    }}>
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '10px',
                                            background: 'rgba(139, 92, 246, 0.1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                                <polyline points="9 22 9 12 15 12 15 22" />
                                            </svg>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '11px', color: colors.textMuted, marginBottom: '2px' }}>Campus</div>
                                            <div style={{ fontSize: '13px', color: colors.textPrimary }}>STI College {user.campus}</div>
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
                                                        <SkeletonPulse width="36px" height="36px" borderRadius="10px" isDarkMode={isDarkMode} />
                                                        <div style={{ flex: 1 }}>
                                                            <SkeletonPulse width="70%" height="13px" borderRadius="4px" isDarkMode={isDarkMode} style={{ marginBottom: '4px' }} />
                                                            <SkeletonPulse width="50%" height="11px" borderRadius="4px" isDarkMode={isDarkMode} />
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
                                    <div style={{ marginBottom: '20px' }}>
                                        <h3 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Academic Information
                                        </h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                            {user.program && (
                                                <div style={{ padding: '12px', borderRadius: '10px', border: `1px solid ${colors.border}` }}>
                                                    <div style={{ fontSize: '11px', color: colors.textMuted, marginBottom: '4px' }}>Program</div>
                                                    <div style={{ fontSize: '13px', fontWeight: 500, color: colors.textPrimary }}>{user.program}</div>
                                                </div>
                                            )}
                                            {user.year_level && (
                                                <div style={{ padding: '12px', borderRadius: '10px', border: `1px solid ${colors.border}` }}>
                                                    <div style={{ fontSize: '11px', color: colors.textMuted, marginBottom: '4px' }}>Year Level</div>
                                                    <div style={{ fontSize: '13px', fontWeight: 500, color: colors.textPrimary }}>{user.year_level}</div>
                                                </div>
                                            )}
                                            {user.section && (
                                                <div style={{ padding: '12px', borderRadius: '10px', border: `1px solid ${colors.border}` }}>
                                                    <div style={{ fontSize: '11px', color: colors.textMuted, marginBottom: '4px' }}>Section</div>
                                                    <div style={{ fontSize: '13px', fontWeight: 500, color: colors.textPrimary }}>{user.section}</div>
                                                </div>
                                            )}
                                            <div style={{ padding: '12px', borderRadius: '10px', border: `1px solid ${colors.border}` }}>
                                                <div style={{ fontSize: '11px', color: colors.textMuted, marginBottom: '4px' }}>Student ID</div>
                                                <div style={{ fontSize: '13px', fontWeight: 500, color: colors.textPrimary }}>{user.student_id}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div style={{ padding: '16px 24px', borderTop: `1px solid ${colors.border}`, display: 'flex', gap: '12px' }}>
                                <motion.button
                                    whileHover={{ scale: 1.02, background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={onClose}
                                    style={{
                                        flex: 1,
                                        padding: '12px 20px',
                                        borderRadius: '10px',
                                        border: `1px solid ${colors.border}`,
                                        background: 'transparent',
                                        color: colors.textSecondary,
                                        fontSize: '14px',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Close
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)' }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => window.location.href = `mailto:${user.email}`}
                                    style={{
                                        flex: 2,
                                        padding: '12px 20px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: '#3b82f6',
                                        color: '#ffffff',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                        <polyline points="22,6 12,13 2,6" />
                                    </svg>
                                    Send Message
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
