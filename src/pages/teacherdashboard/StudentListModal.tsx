/**
 * Student List Modal - View all students for teachers
 * Professional minimalistic design matching the app's design system
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { fetchUsers, searchUsers } from '../../services/usersService';
import type { UserAccount } from '../../services/usersService';
import { useDisplaySettings } from '../../contexts/DisplaySettingsContext';
import { exportGradesToExcel, exportGradesToPDF, type ClassGradesSummary } from '../../utils/exportUtils';
import { useResponsive } from './hooks';

interface StudentListModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type SortOption = 'name' | 'section' | 'recent';
type ViewMode = 'grid' | 'list';

// Custom Dropdown Component - Minimalistic Blue Design (matching GradeSubmissionsModal)
const CustomDropdown: React.FC<{
    value: string;
    options: { id: string; label: string; icon?: React.ReactNode }[];
    onChange: (value: string) => void;
    placeholder?: string;
    minWidth?: string;
}> = ({ value, options, onChange, placeholder = 'Select', minWidth = '120px' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(o => o.id === value);
    const accentColor = '#3b82f6';

    return (
        <div ref={dropdownRef} style={{ position: 'relative', minWidth, flex: 1 }}>
            {/* Trigger Button */}
            <motion.button
                whileTap={{ scale: 0.99 }}
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: isOpen
                        ? `1px solid ${accentColor}40`
                        : '1px solid rgba(0,0,0,0.08)',
                    background: '#ffffff',
                    color: '#0f172a',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isOpen ? `0 0 0 3px ${accentColor}10` : 'none',
                }}
            >
                <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: selectedOption ? '#0f172a' : '#94a3b8',
                }}>
                    {selectedOption?.icon}
                    {selectedOption?.label || placeholder}
                </span>
                <motion.svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ flexShrink: 0 }}
                >
                    <polyline points="6 9 12 15 18 9" />
                </motion.svg>
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                            position: 'absolute',
                            top: 'calc(100% + 6px)',
                            left: 0,
                            right: 0,
                            minWidth: '100%',
                            background: '#ffffff',
                            borderRadius: '12px',
                            border: '1px solid rgba(0,0,0,0.08)',
                            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.12), 0 2px 10px rgba(0, 0, 0, 0.06)',
                            padding: '6px',
                            zIndex: 1000,
                            maxHeight: '280px',
                            overflowY: 'auto',
                        }}
                    >
                        {options.map((option, index) => {
                            const isSelected = option.id === value;
                            const isHovered = hoveredId === option.id;

                            return (
                                <motion.button
                                    key={option.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.02 }}
                                    onMouseEnter={() => setHoveredId(option.id)}
                                    onMouseLeave={() => setHoveredId(null)}
                                    onClick={() => {
                                        onChange(option.id);
                                        setIsOpen(false);
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: isSelected
                                            ? `${accentColor}10`
                                            : isHovered
                                                ? 'rgba(0,0,0,0.03)'
                                                : 'transparent',
                                        color: isSelected ? accentColor : '#334155',
                                        fontSize: '13px',
                                        fontWeight: isSelected ? 600 : 500,
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'background 0.15s ease',
                                    }}
                                >
                                    {option.icon && (
                                        <span style={{
                                            color: isSelected ? accentColor : '#64748b',
                                            display: 'flex',
                                            alignItems: 'center',
                                            flexShrink: 0,
                                        }}>
                                            {option.icon}
                                        </span>
                                    )}
                                    <span style={{
                                        flex: 1,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {option.label}
                                    </span>
                                    {isSelected && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            style={{
                                                width: '18px',
                                                height: '18px',
                                                borderRadius: '50%',
                                                background: accentColor,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}
                                        >
                                            <svg
                                                width="10"
                                                height="10"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="#ffffff"
                                                strokeWidth="3"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        </motion.div>
                                    )}
                                </motion.button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Skeleton Loading Component
const StudentSkeleton: React.FC<{ viewMode: ViewMode; showAvatars: boolean }> = ({ viewMode, showAvatars }) => {
    const SkeletonPulse: React.FC<{ 
        width?: string; 
        height?: string; 
        borderRadius?: string;
        delay?: number;
    }> = ({ width = '100%', height = '16px', borderRadius = '8px', delay = 0 }) => (
        <div
            style={{
                width, 
                height, 
                borderRadius,
                background: 'linear-gradient(90deg, #f0f0f0 0%, #e0e0e0 20%, #f0f0f0 40%, #f0f0f0 100%)',
                backgroundSize: '200% 100%',
                animation: `shimmer 1.8s ease-in-out ${delay}s infinite`,
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <div style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
                animation: `shimmerSlide 1.8s ease-in-out ${delay}s infinite`,
            }} />
        </div>
    );

    if (viewMode === 'grid') {
        return (
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '16px',
            }}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.4 }}
                        style={{
                            background: '#fff',
                            borderRadius: '16px',
                            padding: '20px',
                            border: '1px solid rgba(0,0,0,0.06)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '12px',
                        }}
                    >
                        {showAvatars && (
                            <div style={{ position: 'relative' }}>
                                <SkeletonPulse width="56px" height="56px" borderRadius="50%" delay={i * 0.1} />
                                {/* Fake online indicator */}
                                {i % 3 === 0 && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '2px',
                                        right: '2px',
                                        width: '14px',
                                        height: '14px',
                                        borderRadius: '50%',
                                        background: '#e0e0e0',
                                        border: '2px solid #fff',
                                    }} />
                                )}
                            </div>
                        )}
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <SkeletonPulse width={`${60 + (i % 3) * 10}%`} height="14px" borderRadius="6px" delay={i * 0.1 + 0.1} />
                            <SkeletonPulse width={`${40 + (i % 4) * 8}%`} height="12px" borderRadius="6px" delay={i * 0.1 + 0.2} />
                        </div>
                        <SkeletonPulse width="70px" height="20px" borderRadius="20px" delay={i * 0.1 + 0.3} />
                    </motion.div>
                ))}
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        padding: '14px 16px',
                        borderRadius: '12px',
                        background: '#fff',
                        border: '1px solid rgba(0,0,0,0.04)',
                    }}
                >
                    {showAvatars && (
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                            <SkeletonPulse width="44px" height="44px" borderRadius="50%" delay={i * 0.05} />
                            {/* Random online indicators */}
                            {i % 4 === 0 && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: '0',
                                    right: '0',
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '50%',
                                    background: '#e0e0e0',
                                    border: '2px solid #fff',
                                }} />
                            )}
                        </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <SkeletonPulse 
                            width={`${50 + (i % 5) * 8}%`} 
                            height="14px" 
                            borderRadius="6px" 
                            delay={i * 0.05 + 0.1} 
                        />
                        <div style={{ marginTop: '8px' }}>
                            <SkeletonPulse 
                                width={`${35 + (i % 4) * 10}%`} 
                                height="12px" 
                                borderRadius="6px" 
                                delay={i * 0.05 + 0.2} 
                            />
                        </div>
                    </div>
                    <SkeletonPulse 
                        width="80px" 
                        height="24px" 
                        borderRadius="20px" 
                        delay={i * 0.05 + 0.15} 
                    />
                    <SkeletonPulse 
                        width="70px" 
                        height="24px" 
                        borderRadius="8px" 
                        delay={i * 0.05 + 0.25} 
                    />
                    <div style={{ width: '16px', height: '16px', flexShrink: 0 }}>
                        <SkeletonPulse 
                            width="16px" 
                            height="16px" 
                            borderRadius="4px" 
                            delay={i * 0.05 + 0.3} 
                        />
                    </div>
                </motion.div>
            ))}
        </div>
    );
};


// Student Card Component (Grid View)
const StudentCard: React.FC<{
    student: UserAccount;
    index: number;
    onViewProfile: (student: UserAccount) => void;
    showAvatars: boolean;
    shouldAnimate: boolean;
    isCompact: boolean;
}> = ({ student, index, onViewProfile, showAvatars, shouldAnimate, isCompact }) => {
    const [isHovered, setIsHovered] = useState(false);

    const getInitials = (name: string) => {
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const getAvatarColor = (name: string) => {
        const colors = [
            '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
            '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
        ];
        const idx = name.charCodeAt(0) % colors.length;
        return colors[idx];
    };

    const MotionWrapper = shouldAnimate ? motion.div : 'div';
    const motionProps = shouldAnimate ? {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { delay: index * 0.02, duration: 0.3 },
    } : {};

    const cardPadding = isCompact ? '14px' : '20px';

    return (
        <MotionWrapper
            {...motionProps}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => onViewProfile(student)}
            style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: cardPadding,
                border: `1px solid ${isHovered ? 'rgba(59, 130, 246, 0.3)' : 'rgba(0,0,0,0.06)'}`,
                cursor: 'pointer',
                transition: shouldAnimate ? 'all 0.2s ease' : 'none',
                boxShadow: isHovered && shouldAnimate ? '0 8px 24px rgba(59, 130, 246, 0.12)' : 'none',
                transform: isHovered && shouldAnimate ? 'translateY(-2px)' : 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: isCompact ? '8px' : '12px',
            }}
        >
            {/* Avatar - conditionally rendered */}
            {showAvatars && (
                <div style={{ position: 'relative' }}>
                    <div style={{
                        width: isCompact ? '44px' : '56px',
                        height: isCompact ? '44px' : '56px',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${getAvatarColor(student.full_name)} 0%, ${getAvatarColor(student.full_name)}dd 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: isCompact ? '14px' : '18px',
                        boxShadow: isHovered && shouldAnimate ? `0 4px 12px ${getAvatarColor(student.full_name)}40` : 'none',
                        transition: shouldAnimate ? 'box-shadow 0.2s ease' : 'none',
                    }}>
                        {student.profile_image ? (
                            <img
                                src={student.profile_image}
                                alt={student.full_name}
                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                            />
                        ) : (
                            getInitials(student.full_name)
                        )}
                    </div>
                    {/* Online indicator */}
                    {student.is_online && (
                        <div style={{
                            position: 'absolute',
                            bottom: '2px',
                            right: '2px',
                            width: isCompact ? '10px' : '14px',
                            height: isCompact ? '10px' : '14px',
                            borderRadius: '50%',
                            background: '#10b981',
                            border: '2px solid #fff',
                        }} />
                    )}
                </div>
            )}

            {/* Name */}
            <div style={{ textAlign: 'center' }}>
                <div style={{
                    fontSize: isCompact ? '13px' : '14px',
                    fontWeight: 600,
                    color: '#0f172a',
                    marginBottom: '4px',
                    lineHeight: 1.3,
                }}>
                    {student.full_name}
                </div>
                <div style={{
                    fontSize: isCompact ? '11px' : '12px',
                    color: '#64748b',
                }}>
                    {student.section || 'BSIT101A'}
                </div>
            </div>

            {/* Student ID Badge */}
            <div style={{
                fontSize: '10px',
                fontWeight: 500,
                color: '#64748b',
                padding: '4px 10px',
                borderRadius: '20px',
                background: 'rgba(0,0,0,0.04)',
            }}>
                {student.student_id}
            </div>
        </MotionWrapper>
    );
};


// Student Row Component (List View)
const StudentRow: React.FC<{
    student: UserAccount;
    index: number;
    onViewProfile?: (student: UserAccount) => void;
    showAvatars: boolean;
    shouldAnimate: boolean;
    isCompact: boolean;
}> = ({ student, index, onViewProfile, showAvatars, shouldAnimate, isCompact }) => {
    const [isHovered, setIsHovered] = useState(false);

    const getInitials = (name: string) => {
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const getAvatarColor = (name: string) => {
        const colors = [
            '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
            '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
        ];
        const idx = name.charCodeAt(0) % colors.length;
        return colors[idx];
    };

    const formatLastActive = (dateStr?: string) => {
        if (!dateStr) return 'Never';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const MotionWrapper = shouldAnimate ? motion.div : 'div';
    const motionProps = shouldAnimate ? {
        initial: { opacity: 0, x: -10 },
        animate: { opacity: 1, x: 0 },
        transition: { delay: index * 0.015, duration: 0.25 },
    } : {};

    const rowPadding = isCompact ? '10px 12px' : '14px 16px';
    const avatarSize = isCompact ? '36px' : '44px';

    return (
        <MotionWrapper
            {...motionProps}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onViewProfile ? () => onViewProfile(student) : undefined}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: isCompact ? '10px' : '14px',
                padding: rowPadding,
                borderRadius: '12px',
                background: isHovered ? 'rgba(59, 130, 246, 0.04)' : 'rgba(0,0,0,0.015)',
                border: `1px solid ${isHovered ? 'rgba(59, 130, 246, 0.2)' : 'transparent'}`,
                cursor: onViewProfile ? 'pointer' : 'default',
                transition: shouldAnimate ? 'all 0.2s ease' : 'none',
            }}
        >
            {/* Avatar - conditionally rendered */}
            {showAvatars && (
                <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                        width: avatarSize,
                        height: avatarSize,
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${getAvatarColor(student.full_name)} 0%, ${getAvatarColor(student.full_name)}dd 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: isCompact ? '13px' : '15px',
                    }}>
                        {student.profile_image ? (
                            <img
                                src={student.profile_image}
                                alt={student.full_name}
                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                            />
                        ) : (
                            getInitials(student.full_name)
                        )}
                    </div>
                    {student.is_online && (
                        <div style={{
                            position: 'absolute',
                            bottom: '0',
                            right: '0',
                            width: isCompact ? '10px' : '12px',
                            height: isCompact ? '10px' : '12px',
                            borderRadius: '50%',
                            background: '#10b981',
                            border: '2px solid #fff',
                        }} />
                    )}
                </div>
            )}

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    fontSize: isCompact ? '13px' : '14px',
                    fontWeight: 600,
                    color: '#0f172a',
                    marginBottom: '2px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}>
                    {student.full_name}
                </div>
                <div style={{
                    fontSize: isCompact ? '11px' : '12px',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                }}>
                    <span>{student.email}</span>
                </div>
            </div>

            {/* Section Badge */}
            <div style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#3b82f6',
                padding: '4px 10px',
                borderRadius: '20px',
                background: 'rgba(59, 130, 246, 0.1)',
                flexShrink: 0,
            }}>
                {student.section || 'BSIT101A'}
            </div>

            {/* Last Active */}
            <div style={{
                fontSize: '11px',
                color: student.is_online ? '#10b981' : '#94a3b8',
                padding: '4px 10px',
                borderRadius: '8px',
                background: student.is_online ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0,0,0,0.03)',
                flexShrink: 0,
                minWidth: '70px',
                textAlign: 'center',
            }}>
                {student.is_online ? 'Online' : formatLastActive(student.last_active)}
            </div>

            {/* Arrow */}
            <div
                style={{
                    color: '#94a3b8',
                    flexShrink: 0,
                    transform: isHovered && shouldAnimate ? 'translateX(4px)' : 'none',
                    opacity: isHovered ? 1 : 0.4,
                    transition: shouldAnimate ? 'all 0.2s ease' : 'none',
                }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                </svg>
            </div>
        </MotionWrapper>
    );
};


// Student Profile Panel (Side Panel)
const StudentProfilePanel: React.FC<{
    student: UserAccount | null;
    onClose: () => void;
    showAvatars: boolean;
    shouldAnimate: boolean;
}> = ({ student, onClose, showAvatars, shouldAnimate }) => {
    if (!student) return null;

    const getInitials = (name: string) => {
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const getAvatarColor = (name: string) => {
        const colors = [
            '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
            '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
        ];
        const idx = name.charCodeAt(0) % colors.length;
        return colors[idx];
    };

    const InfoRow: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 0',
            borderBottom: '1px solid rgba(0,0,0,0.04)',
        }}>
            <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(59, 130, 246, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3b82f6',
                flexShrink: 0,
            }}>
                {icon}
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>{label}</div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#1e293b' }}>{value}</div>
            </div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            style={{
                width: '320px',
                background: '#ffffff',
                borderLeft: '1px solid rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
            }}
        >
            {/* Header */}
            <div style={{
                padding: '20px',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>
                    Student Profile
                </h3>
                <motion.button
                    whileHover={{ scale: 1.1, background: 'rgba(0,0,0,0.08)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'rgba(0,0,0,0.04)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#64748b',
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </motion.button>
            </div>

            {/* Profile Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '24px 20px' }}>
                {/* Avatar & Name */}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    {showAvatars && (
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: `linear-gradient(135deg, ${getAvatarColor(student.full_name)} 0%, ${getAvatarColor(student.full_name)}dd 100%)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: '28px',
                            margin: '0 auto 16px',
                            boxShadow: shouldAnimate ? `0 8px 24px ${getAvatarColor(student.full_name)}30` : 'none',
                        }}>
                            {student.profile_image ? (
                                <img
                                    src={student.profile_image}
                                    alt={student.full_name}
                                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                />
                            ) : (
                                getInitials(student.full_name)
                            )}
                        </div>
                    )}
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
                        {student.full_name}
                    </h4>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        color: student.is_online ? '#10b981' : '#64748b',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        background: student.is_online ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0,0,0,0.04)',
                    }}>
                        <div style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: student.is_online ? '#10b981' : '#94a3b8',
                        }} />
                        {student.is_online ? 'Online' : 'Offline'}
                    </div>
                </div>

                {/* Info Rows */}
                <InfoRow
                    label="Student ID"
                    value={student.student_id}
                    icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>}
                />
                <InfoRow
                    label="Email Address"
                    value={student.email}
                    icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>}
                />
                <InfoRow
                    label="Section"
                    value={student.section || 'BSIT101A'}
                    icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
                />
                <InfoRow
                    label="Program"
                    value={student.program || 'BSIT'}
                    icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>}
                />
                <InfoRow
                    label="Year Level"
                    value={student.year_level || '1st Year'}
                    icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
                />
                <InfoRow
                    label="Campus"
                    value={student.campus || 'Meycauayan'}
                    icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>}
                />

                {/* Quick Actions */}
                <div style={{ marginTop: '24px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '12px' }}>
                        Quick Actions
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <motion.button
                            whileHover={{ background: 'rgba(59, 130, 246, 0.08)' }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '12px 14px',
                                borderRadius: '10px',
                                border: '1px solid rgba(0,0,0,0.06)',
                                background: '#fff',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 500,
                                color: '#334155',
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                            </svg>
                            Send Email
                        </motion.button>
                        <motion.button
                            whileHover={{ background: 'rgba(16, 185, 129, 0.08)' }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '12px 14px',
                                borderRadius: '10px',
                                border: '1px solid rgba(0,0,0,0.06)',
                                background: '#fff',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 500,
                                color: '#334155',
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                            </svg>
                            View Submissions
                        </motion.button>
                        <motion.button
                            whileHover={{ background: 'rgba(139, 92, 246, 0.08)' }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '12px 14px',
                                borderRadius: '10px',
                                border: '1px solid rgba(0,0,0,0.06)',
                                background: '#fff',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 500,
                                color: '#334155',
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                                <line x1="18" y1="20" x2="18" y2="10" />
                                <line x1="12" y1="20" x2="12" y2="4" />
                                <line x1="6" y1="20" x2="6" y2="14" />
                            </svg>
                            View Grades
                        </motion.button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};


// Main Modal Component
const StudentListModal: React.FC<StudentListModalProps> = ({ isOpen, onClose }) => {
    // Responsive state for mobile compatibility
    const { isMobile, isSmallMobile } = useResponsive();

    const [students, setStudents] = useState<UserAccount[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('name');
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [selectedStudent, setSelectedStudent] = useState<UserAccount | null>(null);
    const [sectionFilter, setSectionFilter] = useState<string>('all');
    const [showExportMenu, setShowExportMenu] = useState(false);

    // Get display settings
    const { settings: displaySettings, shouldAnimate, shouldShowAvatar } = useDisplaySettings();
    const isCompact = displaySettings.compactView;

    // Fetch students on mount
    useEffect(() => {
        if (isOpen) {
            loadStudents();
        }
    }, [isOpen]);

    const loadStudents = async () => {
        setIsLoading(true);
        try {
            const data = await fetchUsers('student');
            setStudents(data);
        } catch (error) {
            console.error('Failed to load students:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle search
    useEffect(() => {
        const handleSearch = async () => {
            if (searchQuery.trim()) {
                const results = await searchUsers(searchQuery);
                setStudents(results.filter(u => u.role === 'student'));
            } else {
                loadStudents();
            }
        };

        const debounce = setTimeout(handleSearch, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery]);

    // Get unique sections
    const sections = useMemo(() => {
        const sectionSet = new Set(students.map(s => s.section || 'BSIT101A'));
        return Array.from(sectionSet).sort();
    }, [students]);

    // Filter and sort students
    const filteredStudents = useMemo(() => {
        let result = [...students];

        // Filter by section
        if (sectionFilter !== 'all') {
            result = result.filter(s => (s.section || 'BSIT101A') === sectionFilter);
        }

        // Sort
        switch (sortBy) {
            case 'name':
                result.sort((a, b) => a.full_name.localeCompare(b.full_name));
                break;
            case 'section':
                result.sort((a, b) => (a.section || '').localeCompare(b.section || ''));
                break;
            case 'recent':
                result.sort((a, b) => {
                    const dateA = a.last_active ? new Date(a.last_active).getTime() : 0;
                    const dateB = b.last_active ? new Date(b.last_active).getTime() : 0;
                    return dateB - dateA;
                });
                break;
        }

        return result;
    }, [students, sectionFilter, sortBy]);

    // Stats
    const stats = useMemo(() => ({
        total: filteredStudents.length,
        online: filteredStudents.filter(s => s.is_online).length,
    }), [filteredStudents]);

    // Export handler
    const handleExport = (format: 'pdf' | 'excel') => {
        const exportData: ClassGradesSummary = {
            courseName: 'Student Directory',
            courseCode: sectionFilter === 'all' ? 'ALL' : sectionFilter,
            section: sectionFilter === 'all' ? 'All Sections' : sectionFilter,
            semester: '1st Semester 2025-2026',
            teacherName: 'Teacher',
            exportDate: new Date().toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
            }),
            assignmentTitles: ['Attendance', 'Participation', 'Quiz Avg', 'Project'],
            students: filteredStudents.map((student, index) => ({
                rank: index + 1,
                name: student.full_name,
                studentId: student.student_id || student.id.slice(0, 8).toUpperCase(),
                assignments: [95, 88, 82, 90], // Placeholder - would come from real grades
                average: 88.75,
                grade: 'B+',
                remarks: 'PASSED',
            })),
        };

        if (format === 'pdf') {
            exportGradesToPDF(exportData);
        } else {
            exportGradesToExcel(exportData);
        }
        setShowExportMenu(false);
    };

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                if (selectedStudent) {
                    setSelectedStudent(null);
                } else {
                    onClose();
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, selectedStudent]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

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

                    {/* Modal Container */}
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        display: 'flex',
                        alignItems: isMobile ? 'stretch' : 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        pointerEvents: 'none',
                        padding: isMobile ? 0 : '20px',
                    }}>
                        <motion.div
                            initial={{ opacity: 0, scale: isMobile ? 1 : 0.95, y: isMobile ? '100%' : 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: isMobile ? 1 : 0.95, y: isMobile ? '100%' : 20 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            style={{
                                width: '100%',
                                maxWidth: isMobile ? '100%' : (selectedStudent ? '1200px' : '900px'),
                                height: isMobile ? '100%' : undefined,
                                maxHeight: isMobile ? '100%' : '90vh',
                                background: '#f8fafc',
                                borderRadius: isMobile ? 0 : '20px',
                                boxShadow: isMobile ? 'none' : '0 24px 48px rgba(0, 0, 0, 0.15)',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                pointerEvents: 'auto',
                                transition: 'max-width 0.3s ease',
                            }}
                        >
                            {/* Header */}
                            <div style={{
                                padding: isMobile ? '12px 16px' : '20px 24px',
                                background: '#ffffff',
                                borderBottom: '1px solid rgba(0,0,0,0.06)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: isMobile ? '10px' : '16px',
                            }}>
                                <div style={{
                                    width: isMobile ? '40px' : '48px',
                                    height: isMobile ? '40px' : '48px',
                                    borderRadius: isMobile ? '10px' : '14px',
                                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
                                    border: '1px solid rgba(16, 185, 129, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#10b981',
                                    flexShrink: 0,
                                }}>
                                    <svg width={isMobile ? "20" : "24"} height={isMobile ? "20" : "24"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h2 style={{ margin: 0, fontSize: isMobile ? '15px' : '18px', fontWeight: 600, color: '#0f172a' }}>
                                        {isMobile ? 'Students' : 'Student Directory'}
                                    </h2>
                                    <p style={{ margin: '2px 0 0 0', fontSize: isMobile ? '11px' : '13px', color: '#64748b' }}>
                                        {stats.total} students • {stats.online} online
                                    </p>
                                </div>
                                <motion.button
                                    whileHover={!isMobile ? { scale: 1.1, background: 'rgba(0,0,0,0.08)' } : undefined}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={onClose}
                                    style={{
                                        width: isMobile ? '32px' : '36px',
                                        height: isMobile ? '32px' : '36px',
                                        borderRadius: isMobile ? '8px' : '10px',
                                        border: 'none',
                                        background: 'rgba(0,0,0,0.04)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#64748b',
                                    }}
                                >
                                    <svg width={isMobile ? "16" : "18"} height={isMobile ? "16" : "18"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </motion.button>
                            </div>

                            {/* Toolbar */}
                            <div style={{
                                padding: isMobile ? '12px 16px' : '16px 24px',
                                background: '#ffffff',
                                borderBottom: '1px solid rgba(0,0,0,0.06)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: isMobile ? '8px' : '12px',
                                flexWrap: 'wrap',
                            }}>
                                {/* Search */}
                                <div style={{
                                    flex: 1,
                                    minWidth: isMobile ? '100%' : '200px',
                                    position: 'relative',
                                    order: isMobile ? -1 : 0,
                                }}>
                                    <svg
                                        width="16" height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#94a3b8"
                                        strokeWidth="2"
                                        style={{
                                            position: 'absolute',
                                            left: '12px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                        }}
                                    >
                                        <circle cx="11" cy="11" r="8" />
                                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                    </svg>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={isMobile ? "Search students..." : "Search by name, email, or ID..."}
                                        style={{
                                            width: '100%',
                                            padding: isMobile ? '8px 12px 8px 36px' : '10px 12px 10px 40px',
                                            borderRadius: '10px',
                                            border: '1px solid rgba(0,0,0,0.1)',
                                            background: '#f8fafc',
                                            fontSize: '13px',
                                            color: '#1e293b',
                                            outline: 'none',
                                            transition: 'all 0.2s ease',
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#3b82f6';
                                            e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'rgba(0,0,0,0.1)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>

                                {/* Section Filter */}
                                <CustomDropdown
                                    value={sectionFilter}
                                    onChange={(val) => setSectionFilter(val)}
                                    placeholder="All Sections"
                                    minWidth={isMobile ? '100px' : '140px'}
                                    options={[
                                        { id: 'all', label: 'All Sections' },
                                        ...sections.map(section => ({ id: section, label: section }))
                                    ]}
                                />

                                {/* Sort */}
                                <CustomDropdown
                                    value={sortBy}
                                    onChange={(val) => setSortBy(val as SortOption)}
                                    placeholder="Sort by"
                                    minWidth={isMobile ? '90px' : '130px'}
                                    options={[
                                        { id: 'name', label: 'Name' },
                                        { id: 'section', label: 'Section' },
                                        { id: 'recent', label: 'Recent' },
                                    ]}
                                />

                                {/* View Toggle - hide on mobile */}
                                {!isMobile && (
                                    <div style={{
                                        display: 'flex',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(0,0,0,0.1)',
                                        overflow: 'hidden',
                                    }}>
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setViewMode('list')}
                                            style={{
                                                padding: '8px 12px',
                                                border: 'none',
                                                background: viewMode === 'list' ? '#3b82f6' : '#f8fafc',
                                                color: viewMode === 'list' ? '#fff' : '#64748b',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="8" y1="6" x2="21" y2="6" />
                                                <line x1="8" y1="12" x2="21" y2="12" />
                                                <line x1="8" y1="18" x2="21" y2="18" />
                                                <line x1="3" y1="6" x2="3.01" y2="6" />
                                                <line x1="3" y1="12" x2="3.01" y2="12" />
                                                <line x1="3" y1="18" x2="3.01" y2="18" />
                                            </svg>
                                        </motion.button>
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setViewMode('grid')}
                                            style={{
                                                padding: '8px 12px',
                                                border: 'none',
                                                borderLeft: '1px solid rgba(0,0,0,0.1)',
                                                background: viewMode === 'grid' ? '#3b82f6' : '#f8fafc',
                                                color: viewMode === 'grid' ? '#fff' : '#64748b',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="3" y="3" width="7" height="7" />
                                                <rect x="14" y="3" width="7" height="7" />
                                                <rect x="14" y="14" width="7" height="7" />
                                                <rect x="3" y="14" width="7" height="7" />
                                            </svg>
                                        </motion.button>
                                    </div>
                                )}

                                {/* Export Button with Dropdown - hide on small mobile */}
                                {!isSmallMobile && (
                                    <div style={{ position: 'relative' }}>
                                        <motion.button
                                            whileHover={{ background: 'rgba(59, 130, 246, 0.1)' }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setShowExportMenu(!showExportMenu)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: isMobile ? '8px 10px' : '10px 14px',
                                                borderRadius: '10px',
                                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                                background: showExportMenu ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                                                color: '#3b82f6',
                                                fontSize: isMobile ? '12px' : '13px',
                                                fontWeight: 500,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="7 10 12 15 17 10" />
                                                <line x1="12" y1="15" x2="12" y2="3" />
                                            </svg>
                                            {!isMobile && 'Export'}
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M6 9l6 6 6-6" />
                                            </svg>
                                        </motion.button>

                                        {/* Export Dropdown */}
                                        <AnimatePresence>
                                            {showExportMenu && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    transition={{ duration: 0.15 }}
                                                    style={{
                                                        position: 'absolute',
                                                        top: 'calc(100% + 8px)',
                                                        right: 0,
                                                        background: '#fff',
                                                        borderRadius: '12px',
                                                        border: '1px solid rgba(0,0,0,0.08)',
                                                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                                        overflow: 'hidden',
                                                        zIndex: 100,
                                                        minWidth: '180px',
                                                    }}
                                                >
                                                    <motion.button
                                                        whileHover={{ background: 'rgba(239, 68, 68, 0.08)' }}
                                                        onClick={() => handleExport('pdf')}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '10px',
                                                            width: '100%',
                                                            padding: '12px 16px',
                                                            border: 'none',
                                                            background: 'transparent',
                                                            cursor: 'pointer',
                                                            fontSize: '13px',
                                                            fontWeight: 500,
                                                            color: '#334155',
                                                            textAlign: 'left',
                                                        }}
                                                    >
                                                        <div style={{
                                                            width: '32px',
                                                            height: '32px',
                                                            borderRadius: '8px',
                                                            background: 'rgba(239, 68, 68, 0.1)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                        }}>
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                                <polyline points="14 2 14 8 20 8" />
                                                                <line x1="16" y1="13" x2="8" y2="13" />
                                                                <line x1="16" y1="17" x2="8" y2="17" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <div>Export as PDF</div>
                                                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Grade report document</div>
                                                        </div>
                                                    </motion.button>
                                                    <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)', margin: '0 12px' }} />
                                                    <motion.button
                                                        whileHover={{ background: 'rgba(16, 185, 129, 0.08)' }}
                                                        onClick={() => handleExport('excel')}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '10px',
                                                            width: '100%',
                                                            padding: '12px 16px',
                                                            border: 'none',
                                                            background: 'transparent',
                                                            cursor: 'pointer',
                                                            fontSize: '13px',
                                                            fontWeight: 500,
                                                            color: '#334155',
                                                            textAlign: 'left',
                                                        }}
                                                    >
                                                        <div style={{
                                                            width: '32px',
                                                            height: '32px',
                                                            borderRadius: '8px',
                                                            background: 'rgba(16, 185, 129, 0.1)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                        }}>
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                                                <line x1="3" y1="9" x2="21" y2="9" />
                                                                <line x1="3" y1="15" x2="21" y2="15" />
                                                                <line x1="9" y1="3" x2="9" y2="21" />
                                                                <line x1="15" y1="3" x2="15" y2="21" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <div>Export as Excel</div>
                                                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Spreadsheet format</div>
                                                        </div>
                                                    </motion.button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: isMobile ? 'column' : 'row' }}>
                                {/* Student List */}
                                <div style={{
                                    flex: 1,
                                    overflow: 'auto',
                                    padding: isMobile ? '12px 16px' : '20px 24px',
                                }}>
                                    {isLoading ? (
                                        <StudentSkeleton viewMode={viewMode} showAvatars={shouldShowAvatar} />
                                    ) : filteredStudents.length === 0 ? (
                                        <div style={{
                                            textAlign: 'center',
                                            padding: '60px 20px',
                                            color: '#64748b',
                                        }}>
                                            <div style={{
                                                width: '64px',
                                                height: '64px',
                                                borderRadius: '16px',
                                                background: 'rgba(0,0,0,0.04)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                margin: '0 auto 16px',
                                            }}>
                                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                                                    <circle cx="11" cy="11" r="8" />
                                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                                </svg>
                                            </div>
                                            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600, color: '#334155' }}>
                                                No students found
                                            </h3>
                                            <p style={{ margin: 0, fontSize: '13px' }}>
                                                Try adjusting your search or filter criteria
                                            </p>
                                        </div>
                                    ) : viewMode === 'grid' && !isMobile ? (
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: `repeat(auto-fill, minmax(${isCompact ? '180px' : '200px'}, 1fr))`,
                                            gap: isCompact ? '12px' : '16px',
                                        }}>
                                            {filteredStudents.map((student, index) => (
                                                <StudentCard
                                                    key={student.id}
                                                    student={student}
                                                    index={index}
                                                    onViewProfile={setSelectedStudent}
                                                    showAvatars={shouldShowAvatar}
                                                    shouldAnimate={shouldAnimate && !isMobile}
                                                    isCompact={isCompact}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '4px' : (isCompact ? '4px' : '8px') }}>
                                            {filteredStudents.map((student, index) => (
                                                <StudentRow
                                                    key={student.id}
                                                    student={student}
                                                    index={index}
                                                    onViewProfile={isMobile ? undefined : setSelectedStudent}
                                                    showAvatars={shouldShowAvatar}
                                                    shouldAnimate={shouldAnimate && !isMobile}
                                                    isCompact={isCompact || isMobile}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Profile Panel - hide on mobile */}
                                {!isMobile && (
                                    <AnimatePresence>
                                        {selectedStudent && (
                                            <StudentProfilePanel
                                                student={selectedStudent}
                                                onClose={() => setSelectedStudent(null)}
                                                showAvatars={shouldShowAvatar}
                                                shouldAnimate={shouldAnimate}
                                            />
                                        )}
                                    </AnimatePresence>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default StudentListModal;
