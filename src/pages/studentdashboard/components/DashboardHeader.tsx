/**
 * DashboardHeader — Extracted from StudentDashboard.tsx (Phase 1.4)
 * Pure presentational component — receives all state via props.
 * Zero logic changes from the original.
 */
import React from 'react';
import { motion } from 'motion/react';
import ToolbarExpandable from '../../../components/ui/toolbar/ToolbarExpandable';
import UserProfileDropdown from '../../../components/ui/dropdowns/UserProfileDropdown';
import NotificationBell from '../../../components/shared/NotificationBell';
import { ContainerTextFlip } from '../../../components/ui/primitives/container-text-flip';
import StreakDropdown from '../../../components/ui/dropdowns/StreakDropdown';

interface DashboardHeaderProps {
    sidebarActive: boolean;
    toggleSidebar: () => void;
    setActiveView: (view: string) => void;
    setSidebarActive: (active: boolean) => void;
    isDemoMode: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    sidebarActive,
    toggleSidebar,
    setActiveView,
    setSidebarActive,
    isDemoMode,
}) => (
    <header className="header">
        <div className="header-content">
            <div className="header-left">
                <motion.button
                    className="sidebar-toggle"
                    onClick={toggleSidebar}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <motion.path
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            animate={sidebarActive ? { d: "M 5 5 L 19 19" } : { d: "M 4 6 L 20 6" }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                        />
                        <motion.path
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            animate={sidebarActive ? { opacity: 0 } : { opacity: 1 }}
                            d="M 4 12 L 20 12"
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                        />
                        <motion.path
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            animate={sidebarActive ? { d: "M 5 19 L 19 5" } : { d: "M 4 18 L 20 18" }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                        />
                    </svg>
                </motion.button>

                <motion.div
                    className="logo"
                    onClick={() => { setActiveView('home'); setSidebarActive(false); }}
                    style={{ cursor: 'pointer' }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                >
                    <div
                        className="logo-icon-wrapper"
                        style={{
                            width: 36, height: 36,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderRadius: 8, overflow: 'hidden',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        }}
                    >
                        <img src="/file.svg" alt="STI Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 10, alignItems: 'flex-start' }}>
                        <ContainerTextFlip
                            words={['eLMS', 'Learn', 'Grow', 'Excel']}
                            interval={3000}
                            animationDuration={500}
                            className="!text-sm !py-1 !px-2 !rounded-md !font-bold"
                            textClassName="!text-sm"
                        />
                        <span style={{ fontSize: '0.6rem', fontWeight: 500, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: 4 }}>
                            Learning Portal
                        </span>
                    </div>
                </motion.div>

                <div style={{ width: 1, height: 24, backgroundColor: '#e4e4e7', marginLeft: 12, marginRight: 4 }} />
                <StreakDropdown />
            </div>

            <div className="header-center" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: '600px' }} />

            <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {isDemoMode ? (
                    <>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '4px 10px', borderRadius: '6px',
                                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                                border: '1px solid #f59e0b', fontSize: '11px', fontWeight: 600, color: '#b45309',
                            }}
                        >
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#f59e0b' }}
                            />
                            DEMO MODE
                        </motion.div>
                        <motion.button
                            onClick={() => {
                                import('../../../services/studyTimeService').then(({ resetAllData }) => {
                                    resetAllData();
                                    window.location.reload();
                                });
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '6px 12px', borderRadius: '8px',
                                border: '1px solid #fca5a5',
                                background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                                color: '#dc2626', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                            }}
                            title="Exit demo mode and reset all data"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                            Exit Demo
                        </motion.button>
                    </>
                ) : (
                    <motion.button
                        onClick={() => {
                            import('../../../services/studyTimeService').then(({ loadDemoData }) => {
                                loadDemoData();
                                window.location.reload();
                            });
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '6px 12px', borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                            color: '#0369a1', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                        }}
                        title="Load demo data (temporary - clears on refresh)"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                        Demo
                    </motion.button>
                )}
                <ToolbarExpandable />
                <NotificationBell />
                <UserProfileDropdown />
            </div>
        </div>
    </header>
);

export default DashboardHeader;
