/**
 * Settings Modal
 * Minimalistic design matching Groups/Catalog page style
 * Professional blue theme with smooth hover effects
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT } from './constants';
import { useGradingSettings } from './contexts';
import { useDisplaySettings } from '../../contexts/DisplaySettingsContext';
import { useNotificationSettings } from '../../contexts/NotificationSettingsContext';

// ============================================
// TYPES
// ============================================
interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type SettingsTab = 'notifications' | 'display' | 'grading';

interface ToggleSetting {
    id: string;
    label: string;
    description: string;
    enabled: boolean;
}

// ============================================
// CONSTANTS
// ============================================
const ACCENT_COLOR = '#3b82f6';

// ============================================
// TOGGLE SWITCH STYLES (CSS-in-JS from Uiverse.io)
// ============================================
const toggleStyles = {
    switch: {
        fontSize: '12px',
        position: 'relative' as const,
        display: 'inline-block',
        width: '2.8em',
        height: '1.6em',
    },
    input: {
        opacity: 0,
        width: 0,
        height: 0,
        position: 'absolute' as const,
    },
    slider: (enabled: boolean, color: string) => ({
        position: 'absolute' as const,
        cursor: 'pointer',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: enabled ? color : '#fff',
        border: `1px solid ${enabled ? color : '#d1d5db'}`,
        transition: '0.3s',
        borderRadius: '20px',
    }),
    sliderBefore: (enabled: boolean) => ({
        position: 'absolute' as const,
        content: '""',
        height: '1.1em',
        width: '1.1em',
        borderRadius: '50%',
        left: enabled ? 'calc(100% - 1.35em)' : '0.2em',
        bottom: '0.2em',
        backgroundColor: enabled ? '#fff' : '#9ca3af',
        transition: '0.3s',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
    }),
};

// ============================================
// TOGGLE SWITCH COMPONENT
// ============================================
const ToggleSwitch: React.FC<{
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    color?: string;
}> = ({ enabled, onChange, color = ACCENT_COLOR }) => (
    <label style={toggleStyles.switch}>
        <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onChange(e.target.checked)}
            style={toggleStyles.input}
        />
        <span style={toggleStyles.slider(enabled, color)}>
            <span style={toggleStyles.sliderBefore(enabled)} />
        </span>
    </label>
);

// ============================================
// SETTING ROW COMPONENT
// ============================================
const SettingRow: React.FC<{
    setting: ToggleSetting;
    onToggle: (id: string, enabled: boolean) => void;
    color?: string;
}> = ({ setting, onToggle, color }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    return (
        <motion.div
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            animate={{ background: isHovered ? 'rgba(59, 130, 246, 0.04)' : 'transparent' }}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: BORDER_RADIUS.lg,
                cursor: 'default',
            }}
        >
            <div style={{ flex: 1, marginRight: '16px' }}>
                <div style={{
                    fontSize: FONT_SIZE.md,
                    fontWeight: FONT_WEIGHT.medium,
                    color: COLORS.textPrimary,
                    marginBottom: '2px',
                }}>
                    {setting.label}
                </div>
                <div style={{
                    fontSize: FONT_SIZE.sm,
                    color: COLORS.textMuted,
                }}>
                    {setting.description}
                </div>
            </div>
            <ToggleSwitch
                enabled={setting.enabled}
                onChange={(enabled) => onToggle(setting.id, enabled)}
                color={color}
            />
        </motion.div>
    );
};


// ============================================
// TAB BUTTON COMPONENT
// ============================================
const TabButton: React.FC<{
    tab: { id: SettingsTab; label: string; icon: React.ReactNode };
    isActive: boolean;
    onClick: () => void;
}> = ({ tab, isActive, onClick }) => (
    <motion.button
        onClick={onClick}
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.98 }}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            width: '100%',
            padding: '12px 14px',
            borderRadius: BORDER_RADIUS.lg,
            border: 'none',
            background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
            color: isActive ? ACCENT_COLOR : COLORS.textSecondary,
            fontSize: FONT_SIZE.md,
            fontWeight: isActive ? FONT_WEIGHT.semibold : FONT_WEIGHT.medium,
            cursor: 'pointer',
            textAlign: 'left',
        }}
    >
        <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            {tab.icon}
        </div>
        {tab.label}
    </motion.button>
);

// ============================================
// MAIN MODAL COMPONENT
// ============================================
const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('notifications');
    const modalRef = useRef<HTMLDivElement>(null);
    
    // Use grading settings from context
    const { settings: gradingCtx, updateSetting: updateGradingSetting } = useGradingSettings();
    
    // Use display settings from context
    const { settings: displayCtx, updateSetting: updateDisplaySetting } = useDisplaySettings();
    
    // Use notification settings from context
    const { settings: notificationCtx, updateSetting: updateNotificationSetting, requestPushPermission } = useNotificationSettings();
    
    // Notification settings derived from context (synced with NotificationSettingsContext)
    const notificationSettings: ToggleSetting[] = [
        { id: 'email_submissions', label: 'Email for new submissions', description: 'Get notified when students submit work', enabled: notificationCtx.emailSubmissions },
        { id: 'email_deadlines', label: 'Deadline reminders', description: 'Receive reminders before assignment deadlines', enabled: notificationCtx.emailDeadlines },
        { id: 'push_notifications', label: 'Push notifications', description: 'Browser notifications for urgent items', enabled: notificationCtx.pushNotifications },
        { id: 'weekly_summary', label: 'Weekly summary', description: 'Receive a weekly report of class activity', enabled: notificationCtx.weeklySummary },
    ];
    
    // Display settings derived from context (synced with DisplaySettingsContext)
    const displaySettings: ToggleSetting[] = [
        { id: 'compact_view', label: 'Compact view', description: 'Show more items with less spacing', enabled: displayCtx.compactView },
        { id: 'show_avatars', label: 'Show student avatars', description: 'Display profile pictures in lists', enabled: displayCtx.showAvatars },
        { id: 'animations', label: 'Enable animations', description: 'Smooth transitions and hover effects', enabled: displayCtx.animations },
        { id: 'hide_custom_cursor', label: 'Hide custom cursor', description: 'Use default system cursor instead', enabled: displayCtx.hideCustomCursor },
    ];
    
    // Grading settings derived from context (synced with GradingSettingsContext)
    const gradingSettings: ToggleSetting[] = [
        { id: 'auto_save', label: 'Auto-save grades', description: 'Automatically save as you enter scores', enabled: gradingCtx.autoSave },
        { id: 'confirm_submit', label: 'Confirm before submitting', description: 'Show confirmation dialog when finalizing grades', enabled: gradingCtx.confirmSubmit },
        { id: 'show_analytics', label: 'Show grade analytics', description: 'Display statistics when grading', enabled: gradingCtx.showAnalytics },
        { id: 'late_penalty', label: 'Apply late penalty', description: `Automatically deduct ${gradingCtx.latePenaltyPercent}% for late submissions`, enabled: gradingCtx.latePenalty },
    ];

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    // Notification toggle handler - updates context (persisted to localStorage)
    const handleNotificationToggle = async (id: string, enabled: boolean) => {
        const keyMap: Record<string, keyof typeof notificationCtx> = {
            'email_submissions': 'emailSubmissions',
            'email_deadlines': 'emailDeadlines',
            'push_notifications': 'pushNotifications',
            'weekly_summary': 'weeklySummary',
        };
        const key = keyMap[id];
        if (key) {
            // Special handling for push notifications - request permission
            if (key === 'pushNotifications' && enabled) {
                const granted = await requestPushPermission();
                if (!granted) {
                    // Permission denied, don't enable
                    return;
                }
            }
            updateNotificationSetting(key, enabled);
        }
    };
    
    // Display toggle handler - updates context (persisted to localStorage)
    const handleDisplayToggle = (id: string, enabled: boolean) => {
        const keyMap: Record<string, keyof typeof displayCtx> = {
            'compact_view': 'compactView',
            'show_avatars': 'showAvatars',
            'animations': 'animations',
            'hide_custom_cursor': 'hideCustomCursor',
        };
        const key = keyMap[id];
        if (key) {
            updateDisplaySetting(key, enabled);
        }
    };
    
    // Grading toggle handler - updates context (persisted to localStorage)
    const handleGradingToggle = (id: string, enabled: boolean) => {
        const keyMap: Record<string, keyof typeof gradingCtx> = {
            'auto_save': 'autoSave',
            'confirm_submit': 'confirmSubmit',
            'show_analytics': 'showAnalytics',
            'late_penalty': 'latePenalty',
        };
        const key = keyMap[id];
        if (key) {
            updateGradingSetting(key, enabled);
        }
    };

    // Tab definitions
    const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
        {
            id: 'notifications',
            label: 'Notifications',
            icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
            ),
        },
        {
            id: 'display',
            label: 'Display',
            icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
            ),
        },
        {
            id: 'grading',
            label: 'Grading',
            icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
            ),
        },
    ];

    // Get current settings based on active tab
    const getCurrentSettings = () => {
        switch (activeTab) {
            case 'notifications': return { settings: notificationSettings, handler: handleNotificationToggle, color: '#f59e0b' };
            case 'display': return { settings: displaySettings, handler: handleDisplayToggle, color: '#8b5cf6' };
            case 'grading': return { settings: gradingSettings, handler: handleGradingToggle, color: '#10b981' };
        }
    };

    const currentSettings = getCurrentSettings();

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
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
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: SPACING.xl,
                    }}
                >
                    <motion.div
                        ref={modalRef}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: '100%',
                            maxWidth: '720px',
                            maxHeight: '85vh',
                            background: COLORS.background,
                            borderRadius: BORDER_RADIUS.full,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: SPACING.xxl,
                            borderBottom: `1px solid ${COLORS.border}`,
                            background: COLORS.surface,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.lg }}>
                                    <motion.div
                                        whileHover={{ scale: 1.05, rotate: 15 }}
                                        transition={{ duration: 0.15, ease: 'easeOut' }}
                                        style={{
                                            width: '44px',
                                            height: '44px',
                                            borderRadius: BORDER_RADIUS.xl,
                                            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.08) 100%)',
                                            border: '1px solid rgba(139, 92, 246, 0.25)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#8b5cf6',
                                        }}
                                    >
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="3" />
                                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                        </svg>
                                    </motion.div>
                                    <div>
                                        <h2 style={{
                                            fontSize: FONT_SIZE.xxl,
                                            fontWeight: FONT_WEIGHT.semibold,
                                            color: COLORS.textPrimary,
                                            margin: 0,
                                        }}>
                                            Settings
                                        </h2>
                                        <p style={{
                                            fontSize: FONT_SIZE.sm,
                                            color: COLORS.textSecondary,
                                            margin: 0,
                                        }}>
                                            Customize your Teacher Portal experience
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Close Button */}
                                <motion.button
                                    whileHover={{ scale: 1.1, background: 'rgba(0,0,0,0.08)' }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={onClose}
                                    style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: BORDER_RADIUS.lg,
                                        border: 'none',
                                        background: 'rgba(0,0,0,0.04)',
                                        color: COLORS.textSecondary,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </motion.button>
                            </div>
                        </div>
                        
                        {/* Content */}
                        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                            {/* Sidebar */}
                            <div style={{
                                width: '200px',
                                padding: SPACING.lg,
                                borderRight: `1px solid ${COLORS.border}`,
                                background: COLORS.surface,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px',
                            }}>
                                {tabs.map((tab) => (
                                    <TabButton
                                        key={tab.id}
                                        tab={tab}
                                        isActive={activeTab === tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                    />
                                ))}
                            </div>
                            
                            {/* Settings Content */}
                            <div style={{
                                flex: 1,
                                padding: SPACING.xxl,
                                overflowY: 'auto',
                            }}>
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeTab}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        {/* Section Header */}
                                        <div style={{ marginBottom: SPACING.xl }}>
                                            <h3 style={{
                                                fontSize: FONT_SIZE.lg,
                                                fontWeight: FONT_WEIGHT.semibold,
                                                color: COLORS.textPrimary,
                                                margin: 0,
                                                marginBottom: '4px',
                                            }}>
                                                {tabs.find(t => t.id === activeTab)?.label} Settings
                                            </h3>
                                            <p style={{
                                                fontSize: FONT_SIZE.sm,
                                                color: COLORS.textMuted,
                                                margin: 0,
                                            }}>
                                                {activeTab === 'notifications' && 'Control how and when you receive updates'}
                                                {activeTab === 'display' && 'Customize the look and feel of your dashboard'}
                                                {activeTab === 'grading' && 'Configure grading preferences and defaults'}
                                            </p>
                                        </div>
                                        
                                        {/* Settings List */}
                                        <div style={{
                                            background: COLORS.surface,
                                            borderRadius: BORDER_RADIUS.xl,
                                            border: `1px solid ${COLORS.border}`,
                                            overflow: 'hidden',
                                        }}>
                                            {currentSettings.settings.map((setting, index) => (
                                                <React.Fragment key={setting.id}>
                                                    <SettingRow
                                                        setting={setting}
                                                        onToggle={currentSettings.handler}
                                                        color={currentSettings.color}
                                                    />
                                                    {index < currentSettings.settings.length - 1 && (
                                                        <div style={{
                                                            height: '1px',
                                                            background: COLORS.border,
                                                            marginLeft: '16px',
                                                            marginRight: '16px',
                                                        }} />
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>
                        
                        {/* Footer */}
                        <div style={{
                            padding: `${SPACING.lg} ${SPACING.xxl}`,
                            borderTop: `1px solid ${COLORS.border}`,
                            background: COLORS.surface,
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: SPACING.md,
                        }}>
                            <motion.button
                                whileHover={{ background: 'rgba(0,0,0,0.06)' }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onClose}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: BORDER_RADIUS.lg,
                                    border: `1px solid ${COLORS.border}`,
                                    background: 'transparent',
                                    color: COLORS.textSecondary,
                                    fontSize: FONT_SIZE.md,
                                    fontWeight: FONT_WEIGHT.medium,
                                    cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </motion.button>
                            <motion.button
                                whileHover={{ 
                                    background: '#2563eb',
                                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                                }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onClose}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: BORDER_RADIUS.lg,
                                    border: 'none',
                                    background: ACCENT_COLOR,
                                    color: '#fff',
                                    fontSize: FONT_SIZE.md,
                                    fontWeight: FONT_WEIGHT.medium,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Save Changes
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SettingsModal;
