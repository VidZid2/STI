/**
 * DashboardSidebar — Persistent collapsible sidebar (SaaS pattern)
 * Always visible on the left. Toggles between expanded (260px) and collapsed (72px).
 * No overlay. Smooth width + text transitions.
 */
import React from 'react';
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

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
    sidebarActive,
    setSidebarActive,
    activeView,
    setActiveView,
    selectedCourse,
    setSelectedCourse,
    openSettingsModal }) => {
    
    const isExpanded = sidebarActive;

    return (
        <div className={`sidebar-wrapper ${isExpanded ? 'expanded' : 'collapsed'}`}>
            {/* Toggle Button — outside the sidebar, on the right border edge */}
            <button
                className="sidebar-collapse-toggle"
                onClick={() => setSidebarActive(!isExpanded)}
                aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            >
                <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ transform: isExpanded ? 'none' : 'rotate(180deg)', transition: 'transform 0.3s ease' }}
                >
                    <polyline points="15 18 9 12 15 6" />
                </svg>
            </button>

            <aside className={`sidebar persistent ${isExpanded ? 'expanded' : 'collapsed'}`}>
                <nav className="sidebar-nav">
                    {/* Home */}
                    <a href="#" className={`nav-item ${activeView === 'home' ? 'active' : ''}`}
                        onClick={(e) => { e.preventDefault(); setActiveView('home'); }}
                    >
                        <div className="nav-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                <polyline points="9 22 9 12 15 12 15 22" />
                            </svg>
                        </div>
                        <div className="nav-content">
                            <span className="nav-text">Home</span>
                            <span className="nav-description">Dashboard overview</span>
                        </div>
                    </a>

                    {/* Courses */}
                    <CoursesNavItem
                        onSidebarClose={() => {/* no-op: sidebar stays open */}}
                        onCourseSelect={(course) => {
                            setSelectedCourse(course);
                            setActiveView('course');
                            import('../../../services/activityService').then(({ logCourseAccess }) => {
                                logCourseAccess(course.id, course.title.split(' - ')[0]);
                            });
                        }}
                        currentCourseId={activeView === 'course' ? selectedCourse?.id ?? null : null}
                        isExpanded={isExpanded}
                    />

                    {/* Paths */}
                    <PathsNavItem
                        onSidebarClose={() => {/* no-op */}}
                        onViewPaths={() => setActiveView('paths')}
                        isActive={activeView === 'paths'}
                        isExpanded={isExpanded}
                    />

                    {/* Goals */}
                    <a href="#" className={`nav-item ${activeView === 'goals' ? 'active' : ''}`}
                        onClick={(e) => { e.preventDefault(); setActiveView('goals'); }}
                    >
                        <div className="nav-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
                            </svg>
                        </div>
                        <div className="nav-content">
                            <span className="nav-text">Goals</span>
                            <span className="nav-description">Track progress</span>
                        </div>
                    </a>

                    {/* Groups */}
                    <a href="#" className={`nav-item ${activeView === 'groups' ? 'active' : ''}`}
                        onClick={(e) => { e.preventDefault(); setActiveView('groups'); }}
                    >
                        <div className="nav-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                                <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </div>
                        <div className="nav-content">
                            <span className="nav-text">Groups</span>
                            <span className="nav-description">Collaborate together</span>
                        </div>
                    </a>

                    {/* Catalog */}
                    <a href="#" className={`nav-item ${activeView === 'catalog' ? 'active' : ''}`}
                        onClick={(e) => { e.preventDefault(); setActiveView('catalog'); }}
                    >
                        <div className="nav-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" />
                                <rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" />
                            </svg>
                        </div>
                        <div className="nav-content">
                            <span className="nav-text">Catalog</span>
                            <span className="nav-description">Browse all courses</span>
                        </div>
                    </a>

                    {/* Users */}
                    <a href="#" className={`nav-item ${activeView === 'users' ? 'active' : ''}`}
                        onClick={(e) => { e.preventDefault(); setActiveView('users'); }}
                    >
                        <div className="nav-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </div>
                        <div className="nav-content">
                            <span className="nav-text">Users</span>
                            <span className="nav-description">Manage accounts</span>
                        </div>
                    </a>

                    {/* Tools */}
                    <ToolsNavTooltip isExpanded={isExpanded}>
                        <a href="#" className={`nav-item ${activeView === 'tools' ? 'active' : ''}`}
                            onClick={(e) => { e.preventDefault(); setActiveView('tools'); }}
                        >
                            <div className="nav-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                                </svg>
                            </div>
                            <div className="nav-content">
                                <span className="nav-text">Tools</span>
                                <span className="nav-description">Productivity utilities</span>
                            </div>
                        </a>
                    </ToolsNavTooltip>
                </nav>

                <div className="sidebar-bottom">
                    <a href="#" className="nav-item" id="settingsButton" onClick={openSettingsModal}>
                        <div className="nav-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        </div>
                        <div className="nav-content">
                            <span className="nav-text">Settings</span>
                            <span className="nav-description">Preferences</span>
                        </div>
                    </a>
                    <HelpNavItem onSidebarClose={() => {/* no-op */}} isExpanded={isExpanded} />
                </div>
            </aside>
        </div>
    );
};

export default DashboardSidebar;
