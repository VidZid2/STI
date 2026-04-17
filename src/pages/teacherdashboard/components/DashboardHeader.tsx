/**
 * DashboardHeader Component
 * Redesigned to match Groups/Catalog page minimalistic design
 * Migrated: inline styles → Tailwind + CSS variables
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AnimatedThemeToggler } from '../../../components/ui/animated-theme-toggler';
import { AnimatedPinkThemeToggler } from '../../../components/ui/animated-pink-theme-toggler';
import SettingsModal from '../SettingsModal';
import { useDisplaySettings } from '../../../contexts/DisplaySettingsContext';
import { useResponsive } from '../hooks';
import NotificationBell from '../../../components/shared/NotificationBell';

export type NotificationType = 'submission' | 'at-risk' | 'grading' | 'scores' | 'assignment';

export interface DashboardNotification {
    id: string;
    type: NotificationType;
    title: string;
    description: string;
    timestamp: Date;
    isRead: boolean;
    actionLabel?: string;
    onAction?: () => void;
}

interface DashboardHeaderProps {
    userName: string;
    userEmail: string;
    userInitial: string;
    onLogout: () => void;
    notifications?: DashboardNotification[];
    onNotificationClick?: (notification: DashboardNotification) => void;
    onViewAllNotifications?: () => void;
}

const IconButton: React.FC<{
    onClick: () => void;
    ariaLabel: string;
    title: string;
    hoverColor?: string;
    hoverBg?: string;
    hoverShadow?: string;
    isActive?: boolean;
    size?: 'sm' | 'md';
    children: React.ReactNode;
}> = ({ onClick, ariaLabel, title, hoverColor, hoverBg, hoverShadow, isActive, size = 'md', children }) => (
    <motion.button
        whileHover={{ scale: 1.05, boxShadow: hoverShadow || '0 4px 12px rgba(59,130,246,0.15)', background: hoverBg || 'rgba(59,130,246,0.08)', borderColor: hoverColor ? `${hoverColor}30` : 'rgba(59,130,246,0.2)' }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        onClick={onClick}
        aria-label={ariaLabel}
        title={title}
        className="flex items-center justify-center cursor-pointer p-0"
        style={{
            width: size === 'sm' ? '30px' : '34px',
            height: size === 'sm' ? '30px' : '34px',
            borderRadius: '8px',
            border: `1px solid ${isActive ? 'rgba(59,130,246,0.2)' : 'var(--border-subtle)'}`,
            background: isActive ? 'rgba(59,130,246,0.08)' : 'var(--bg-surface-alt)',
            color: isActive ? '#3b82f6' : 'var(--text-muted)',
        }}
    >
        {children}
    </motion.button>
);

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    userName, userEmail, userInitial, onLogout,
    notifications: _n, onNotificationClick: _nc, onViewAllNotifications: _van,
}) => {
    const [showSettings, setShowSettings] = useState(false);
    const { isMobile, isSmallMobile } = useResponsive();
    const { settings: displaySettings, shouldAnimate } = useDisplaySettings();

    const MotionWrapper = shouldAnimate ? motion.header : 'header';
    const motionProps = shouldAnimate ? { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } } : {};

    return (
        <MotionWrapper
            {...motionProps}
            className="sticky top-0 z-[100]"
            style={{
                background: 'var(--bg-surface)',
                borderBottom: '1px solid var(--border-subtle)',
                padding: isMobile ? '10px 12px' : (displaySettings.compactView ? '10px 20px' : '12px 24px'),
            }}
        >
            <div className="max-w-[1400px] mx-auto flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center" style={{ gap: isMobile ? '10px' : '14px' }}>
                    <div className="flex items-center justify-center shrink-0 rounded-[10px]"
                        style={{
                            width: isMobile ? '36px' : '40px',
                            height: isMobile ? '36px' : '40px',
                            background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.05) 100%)',
                            border: '1px solid rgba(59,130,246,0.1)',
                        }}>
                        <svg width={isMobile ? '18' : '20'} height={isMobile ? '18' : '20'} viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                            <path d="M8 7h8M8 11h8M8 15h5" />
                        </svg>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold" style={{ fontSize: isMobile ? '14px' : '16px', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                                {isSmallMobile ? 'Portal' : 'Teacher Portal'}
                            </span>
                            {!isSmallMobile && (
                                <span className="px-1.5 py-px rounded-md text-[10px] font-semibold uppercase tracking-[0.3px]"
                                    style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                                    Teacher
                                </span>
                            )}
                        </div>
                        {!isMobile && <div className="text-xs mt-px" style={{ color: 'var(--text-muted)' }}>eLMS Management System</div>}
                    </div>
                </div>

                {/* Right actions */}
                <div className="flex items-center" style={{ gap: isMobile ? '6px' : '8px' }}>
                    <div className="flex items-center justify-center rounded-lg">
                        <AnimatedPinkThemeToggler
                            className={`flex items-center justify-center ${isMobile ? 'w-[30px] h-[30px]' : 'w-[34px] h-[34px]'} rounded-lg border hover:bg-pink-500/10 hover:border-pink-500/20 transition-colors cursor-pointer hover:text-pink-500 [&_svg]:w-4 [&_svg]:h-4`}
                            style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface-alt)', color: 'var(--text-secondary)' }}
                            duration={500}
                        />
                    </div>

                    <NotificationBell />

                    <div className="flex items-center justify-center rounded-lg">
                        <AnimatedThemeToggler
                            className={`flex items-center justify-center ${isMobile ? 'w-[30px] h-[30px]' : 'w-[34px] h-[34px]'} rounded-lg border hover:bg-indigo-500/10 hover:border-indigo-500/20 transition-colors cursor-pointer hover:text-indigo-500 [&_svg]:w-4 [&_svg]:h-4`}
                            style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface-alt)', color: 'var(--text-secondary)' }}
                            duration={500}
                        />
                    </div>

                    <IconButton onClick={() => setShowSettings(true)} ariaLabel="Open settings" title="Settings"
                        size={isMobile ? 'sm' : 'md'} hoverColor="#8b5cf6" hoverBg="rgba(139,92,246,0.08)" hoverShadow="0 4px 12px rgba(139,92,246,0.15)">
                        <svg width={isMobile ? '14' : '16'} height={isMobile ? '14' : '16'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                    </IconButton>

                    {!isSmallMobile && <div className="w-px h-6 mx-1" style={{ background: 'var(--border-subtle)' }} />}

                    {/* User card */}
                    <motion.div
                        whileHover={isMobile ? {} : { background: 'rgba(59,130,246,0.04)', borderColor: 'rgba(59,130,246,0.15)' }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="flex items-center rounded-[10px] cursor-default"
                        style={{
                            gap: isMobile ? '6px' : '10px',
                            padding: isMobile ? '4px' : '6px 12px 6px 6px',
                            background: 'rgba(0,0,0,0.02)',
                            border: '1px solid transparent',
                        }}
                    >
                        <div className="flex items-center justify-center font-semibold rounded-lg"
                            style={{
                                width: isMobile ? '28px' : '32px',
                                height: isMobile ? '28px' : '32px',
                                background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(139,92,246,0.05) 100%)',
                                border: '1px solid rgba(139,92,246,0.1)',
                                color: 'var(--color-purple)',
                                fontSize: isMobile ? '11px' : '13px',
                            }}>
                            {userInitial}
                        </div>
                        {!isMobile && (
                            <div>
                                <div className="text-[13px] font-medium leading-[1.2]" style={{ color: 'var(--text-primary)' }}>{userName}</div>
                                <div className="text-[11px] leading-[1.2]" style={{ color: 'var(--text-muted)' }}>{userEmail}</div>
                            </div>
                        )}
                    </motion.div>

                    <IconButton onClick={onLogout} ariaLabel="Logout from Teacher Portal" title="Logout"
                        size={isMobile ? 'sm' : 'md'} hoverColor="#ef4444" hoverBg="rgba(239,68,68,0.08)" hoverShadow="0 4px 12px rgba(239,68,68,0.15)">
                        <svg width={isMobile ? '14' : '16'} height={isMobile ? '14' : '16'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                    </IconButton>
                </div>
            </div>

            <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
        </MotionWrapper>
    );
};

export default DashboardHeader;
