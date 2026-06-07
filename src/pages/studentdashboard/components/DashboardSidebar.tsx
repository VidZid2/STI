/**
 * DashboardSidebar — Persistent collapsible sidebar (SaaS pattern)
 * Always visible on the left. Toggles between expanded (260px) and collapsed (72px).
 * No overlay. Smooth width + text transitions.
 */
import React, { useState, useEffect, useCallback } from 'react';
import ToolsNavTooltip from '../../../components/ui/misc/ToolsNavTooltip';
import { CoursesNavItem, HelpNavItem, PathsNavItem } from '../nav-items';
import type { SidebarCourse, DashboardView } from '../types';

interface DashboardSidebarProps {
    sidebarActive: boolean;
    setSidebarActive: (active: boolean) => void;
    activeView: DashboardView;
    setActiveView: (view: DashboardView) => void;
    selectedCourse: SidebarCourse | null;
    setSelectedCourse: (course: SidebarCourse | null) => void;
    openSettingsModal: () => void;
}

// Extracted SVGs to clean up component bloat
const Icons = {
    Home: () => (
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
    ),
    Goals: () => (
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
        </svg>
    ),
    Groups: () => (
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),

    Users: () => (
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    Tools: () => (
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
    ),
    Settings: () => (
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ),
    Chevron: () => (
        <svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
        </svg>
    )
};

// Extracted NavItem component for memoization and reusability
interface NavItemProps {
    id: DashboardView;
    activeView: DashboardView;
    setActiveView: (view: DashboardView) => void;
    icon: React.ReactNode;
    label: string;
    description: string;
}

const NavItemButton = React.memo(({ id, activeView, setActiveView, icon, label, description }: NavItemProps) => {
    const isActive = activeView === id;
    return (
        <button
            type="button"
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setActiveView(id)}
            aria-current={isActive ? 'page' : undefined}
        >
            <div className="nav-icon">{icon}</div>
            <div className="nav-content">
                <span className="nav-text">{label}</span>
                <span className="nav-description">{description}</span>
            </div>
        </button>
    );
});
NavItemButton.displayName = 'NavItemButton';

const DashboardSidebar: React.FC<DashboardSidebarProps> = React.memo(({
    sidebarActive,
    setSidebarActive,
    activeView,
    setActiveView,
    selectedCourse,
    setSelectedCourse,
    openSettingsModal }) => {
    const [isMobileDock, setIsMobileDock] = useState(false);

    useEffect(() => {
        const query = window.matchMedia('(max-width: 768px)');
        const syncMobileDock = (e: MediaQueryListEvent | MediaQueryList) => setIsMobileDock(e.matches);
        
        syncMobileDock(query);

        // Fallback for older iOS versions that don't support addEventListener on MediaQueryList
        if (query.addEventListener) {
            query.addEventListener('change', syncMobileDock as EventListener);
            return () => query.removeEventListener('change', syncMobileDock as EventListener);
        } else {
            // @ts-ignore - Deprecated but necessary for Safari < 14
            query.addListener(syncMobileDock);
            // @ts-ignore
            return () => query.removeListener(syncMobileDock);
        }
    }, []);
    
    // Auto-collapse sidebar if returning to desktop and it was left open? 
    // Usually it's better to preserve the explicit state from the user. We'll stick to `sidebarActive` logic
    const isExpanded = isMobileDock ? false : sidebarActive;

    const handleCourseSelect = useCallback((course: SidebarCourse) => {
        setSelectedCourse(course);
        setActiveView('course');
        import('../../../services/activityService')
            .then(({ logCourseAccess }) => {
                logCourseAccess(course.id, course.title.split(' - ')[0]);
            })
            .catch(err => console.error('Failed to log activity:', err));
    }, [setSelectedCourse, setActiveView]);

    return (
        <div className={`sidebar-wrapper ${isExpanded ? 'expanded' : 'collapsed'} ${isMobileDock ? 'mobile-dock' : ''}`}>
            {/* Toggle Button — outside the sidebar, on the right border edge */}
            <button
                className="sidebar-collapse-toggle"
                type="button"
                onClick={() => setSidebarActive(!isExpanded)}
                aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
                aria-expanded={isExpanded}
                aria-hidden={isMobileDock}
            >
                <Icons.Chevron />
            </button>

            <aside className={`sidebar persistent ${isExpanded ? 'expanded' : 'collapsed'}`}>
                <nav className="sidebar-nav">
                    <NavItemButton id="home" activeView={activeView} setActiveView={setActiveView} icon={<Icons.Home />} label="Home" description="Dashboard overview" />

                    <CoursesNavItem
                        onSidebarClose={() => {/* no-op: sidebar stays open */}}
                        onCourseSelect={handleCourseSelect}
                        currentCourseId={activeView === 'course' ? selectedCourse?.id ?? null : null}
                        isExpanded={isExpanded}
                    />

                    <PathsNavItem
                        onSidebarClose={() => {/* no-op */}}
                        onViewPaths={() => setActiveView('paths')}
                        isActive={activeView === 'paths'}
                        isExpanded={isExpanded}
                    />

                    <NavItemButton id="goals" activeView={activeView} setActiveView={setActiveView} icon={<Icons.Goals />} label="Goals" description="Track progress" />
                    <NavItemButton id="groups" activeView={activeView} setActiveView={setActiveView} icon={<Icons.Groups />} label="Groups" description="Collaborate together" />
                    <NavItemButton id="users" activeView={activeView} setActiveView={setActiveView} icon={<Icons.Users />} label="Users" description="Manage accounts" />

                    <ToolsNavTooltip isExpanded={isExpanded}>
                        <div>
                            <NavItemButton id="tools" activeView={activeView} setActiveView={setActiveView} icon={<Icons.Tools />} label="Tools" description="Productivity utilities" />
                        </div>
                    </ToolsNavTooltip>
                </nav>

                <div className="sidebar-bottom">
                    <button type="button" className="nav-item" id="settingsButton" onClick={openSettingsModal}>
                        <div className="nav-icon"><Icons.Settings /></div>
                        <div className="nav-content">
                            <span className="nav-text">Settings</span>
                            <span className="nav-description">Preferences</span>
                        </div>
                    </button>
                    <HelpNavItem onSidebarClose={() => {/* no-op */}} isExpanded={isExpanded} />
                </div>
            </aside>
        </div>
    );
});

DashboardSidebar.displayName = 'DashboardSidebar';

export default DashboardSidebar;