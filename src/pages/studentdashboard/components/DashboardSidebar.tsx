/**
 * DashboardSidebar — Persistent collapsible sidebar using shadcn primitives
 */
import React, { useState, useCallback } from 'react';
import ToolsNavTooltip from '../../../components/ui/misc/ToolsNavTooltip';
import { CoursesNavItem, HelpNavItem, PathsNavItem } from '../nav-items';
import MobileCoursesSheet from './MobileCoursesSheet';
import MobilePathsSheet from './MobilePathsSheet';
import { DockMenu } from './DockMenu';
import type { SidebarCourse, DashboardView } from '../types';
import { getSidebarCoursesWithProgress } from '../utils';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '../../../components/ui/sidebar';
import { ExpandableTabs } from '../../../components/motion/expandable-tabs';
import { Lock } from 'lucide-react';
import { getXPData, calculateLevel } from '../../../services/studyTimeService';

interface DashboardSidebarProps {
    sidebarActive: boolean;
    setSidebarActive: (active: boolean) => void;
    activeView: DashboardView;
    setActiveView: (view: DashboardView) => void;
    selectedCourse: SidebarCourse | null;
    setSelectedCourse: (course: SidebarCourse | null) => void;
    openSettingsModal: () => void;
    widgetsSidebarActive?: boolean;
}

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
    Courses: () => (
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
            <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
        </svg>
    ),
    Paths: () => (
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18"></path>
            <path d="m19 9-5 5-4-4-3 3"></path>
        </svg>
    ),
    Settings: () => (
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    )
};

interface NavItemProps {
    id: DashboardView;
    activeView: DashboardView;
    setActiveView: (view: DashboardView) => void;
    icon: React.ReactNode;
    label: string;
    description: string;
    isLocked?: boolean;
}

const NavItemButton = React.memo(({ id, activeView, setActiveView, icon, label, description, isLocked }: NavItemProps) => {
    const isActive = activeView === id;
    const [shake, setShake] = React.useState(false);

    const handleClick = (e: React.MouseEvent) => {
        if (isLocked) {
            e.preventDefault();
            setShake(true);
            setTimeout(() => setShake(false), 500);
            return;
        }
        setActiveView(id);
    };

    return (
        <button
            type="button"
            className={`nav-item ${isActive ? 'active' : ''} ${isLocked ? 'opacity-80 grayscale-[20%]' : ''} ${shake ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}
            onClick={handleClick}
            aria-current={isActive ? 'page' : undefined}
            title={isLocked ? 'Unlocks at Level 2' : undefined}
        >
            <div className="nav-icon relative">
                {icon}
                {isLocked && (
                    <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-[2px] shadow-sm border border-slate-200 dark:border-slate-700">
                        <Lock className="w-2.5 h-2.5 text-slate-400" />
                    </div>
                )}
            </div>
            <div className="nav-content flex-1 text-left">
                <span className="nav-text flex items-center justify-between w-full">
                    {label}
                    {isLocked && <Lock className="w-3 h-3 text-slate-400 mr-2" />}
                </span>
                <span className={`nav-description ${isLocked ? 'text-amber-600 dark:text-amber-500 font-medium' : ''}`}>
                    {isLocked ? 'Unlocks at Level 2' : description}
                </span>
            </div>
        </button>
    );
});
NavItemButton.displayName = 'NavItemButton';

const DashboardSidebar: React.FC<DashboardSidebarProps> = React.memo(({
    sidebarActive: _sidebarActive,
    setSidebarActive: _setSidebarActive,
    activeView,
    setActiveView,
    selectedCourse,
    setSelectedCourse,
    openSettingsModal,
    widgetsSidebarActive }) => {
    const [isMobileCoursesOpen, setIsMobileCoursesOpen] = useState(false);
    const [isMobilePathsOpen, setIsMobilePathsOpen] = useState(false);
    const [activeDockMenu, setActiveDockMenu] = useState<string | null>(null);
    const [xpData] = useState(() => getXPData());
    const level = calculateLevel(xpData.totalXP).level;
    const courses = React.useMemo(() => getSidebarCoursesWithProgress(), []);

    const handleCourseSelect = useCallback((course: SidebarCourse) => {
        setSelectedCourse(course);
        setActiveView('course');
        import('../../../services/activityService')
            .then(({ logCourseAccess }) => {
                logCourseAccess(course.id, course.title.split(' - ')[0]);
            })
            .catch(err => console.error('Failed to log activity:', err));
    }, [setSelectedCourse, setActiveView]);

    const handleMobileCoursesTap = useCallback(() => {
        setIsMobileCoursesOpen(true);
    }, []);

    const handleMobilePathsTap = useCallback(() => {
        setIsMobilePathsOpen(true);
    }, []);

    return (
        <>
        <Sidebar collapsible="icon" variant="inset" className={`border-r-0 hidden lg:flex ${widgetsSidebarActive ? 'hidden-dock' : ''}`}>
            {/* Desktop Logo in Sidebar */}
            <SidebarHeader 
                className="hidden lg:flex flex-row items-center gap-2.5 px-6 pt-4 pb-6 cursor-pointer shrink-0"
                onClick={() => { setActiveView('home'); }}
            >
                <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm overflow-hidden border border-slate-200/60 dark:border-slate-700/60 bg-white"
                >
                    <img src="/file.svg" alt="STI Logo" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
                    <div className="text-[13px] font-bold leading-tight whitespace-nowrap text-slate-900 dark:text-slate-100">
                        STI eLMS
                    </div>
                    <div className="text-[10.5px] font-medium mt-0.5 leading-tight whitespace-nowrap truncate text-slate-500 dark:text-slate-400">
                        Student Dashboard
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent className="px-3 py-4 flex flex-col gap-1 lg:gap-0.5 overflow-y-auto select-none">
                <nav className="flex flex-col gap-1 lg:gap-0.5 w-full sidebar-nav desktop-sleek">
                    <div className="hidden lg:block text-[11px] font-semibold text-slate-500/70 dark:text-slate-400/70 uppercase tracking-wider px-3 mb-1 mt-2">Overview</div>
                    <NavItemButton id="home" activeView={activeView} setActiveView={setActiveView} icon={<Icons.Home />} label="Home" description="Dashboard overview" />

                    <hr className="hidden lg:block border-t-2 border-slate-200/80 dark:border-slate-800/60 mx-2 mt-3 mb-1" />
                    <div className="hidden lg:block text-[11px] font-semibold text-slate-500/70 dark:text-slate-400/70 uppercase tracking-wider px-3 mb-1 mt-2">Learning</div>
                    <CoursesNavItem
                        onSidebarClose={() => {/* no-op */}}
                        onCourseSelect={handleCourseSelect}
                        currentCourseId={activeView === 'course' ? selectedCourse?.id ?? null : null}
                        isExpanded={true}
                        onMobileCoursesTap={handleMobileCoursesTap}
                    />

                    <PathsNavItem
                        onSidebarClose={() => {/* no-op */}}
                        onViewPaths={() => setActiveView('paths')}
                        isActive={activeView === 'paths'}
                        isExpanded={true}
                        onMobilePathsTap={handleMobilePathsTap}
                    />

                    <NavItemButton id="goals" activeView={activeView} setActiveView={setActiveView} icon={<Icons.Goals />} label="Goals" description="Track progress" />

                    <hr className="hidden lg:block border-t-2 border-slate-200/80 dark:border-slate-800/60 mx-2 mt-3 mb-1" />
                    <div className="hidden lg:block text-[11px] font-semibold text-slate-500/70 dark:text-slate-400/70 uppercase tracking-wider px-3 mb-1 mt-2">Collaboration</div>
                    <NavItemButton id="groups" activeView={activeView} setActiveView={setActiveView} icon={<Icons.Groups />} label="Workspaces" description="Manage group projects" />
                    <NavItemButton id="users" activeView={activeView} setActiveView={setActiveView} icon={<Icons.Users />} label="Community" description="Connect with peers" />

                    <ToolsNavTooltip isExpanded={true}>
                        <div>
                            <NavItemButton id="tools" activeView={activeView} setActiveView={setActiveView} icon={<Icons.Tools />} label="Tools" description="Productivity utilities" isLocked={level < 2} />
                        </div>
                    </ToolsNavTooltip>
                </nav>
            </SidebarContent>

            <SidebarFooter className="px-3 py-4 border-none mt-auto flex flex-col gap-1 lg:gap-0.5 sidebar-bottom desktop-sleek">
                <hr className="hidden lg:block border-t-2 border-slate-200/80 dark:border-slate-800/60 mx-2 mb-1" />
                <button type="button" className="nav-item" id="settingsButton" onClick={openSettingsModal}>
                    <div className="nav-icon"><Icons.Settings /></div>
                    <div className="nav-content">
                        <span className="nav-text">Settings</span>
                        <span className="nav-description">Preferences</span>
                    </div>
                </button>
                <HelpNavItem onSidebarClose={() => {/* no-op */}} isExpanded={true} />
            </SidebarFooter>

            <MobileCoursesSheet
                isOpen={isMobileCoursesOpen}
                onClose={() => setIsMobileCoursesOpen(false)}
                onCourseSelect={handleCourseSelect}
                currentCourseId={activeView === 'course' ? selectedCourse?.id ?? null : null}
            />

            <MobilePathsSheet
                isOpen={isMobilePathsOpen}
                onClose={() => setIsMobilePathsOpen(false)}
                onPathSelect={() => setActiveView('paths')}
            />
        </Sidebar>
        
        {/* Mobile Dock using ExpandableTabs */}
        <div className={`flex lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[9000] transition-transform duration-300 ${widgetsSidebarActive ? 'translate-y-[150%]' : 'translate-y-0'} w-full max-w-[calc(100%-32px)] sm:max-w-md justify-center`}>
            <ExpandableTabs
                fullWidth
                value={activeDockMenu}
                selected={activeView}
                onValueChange={(val) => {
                    setActiveDockMenu(val);
                    if (val && !['course', 'paths'].includes(val)) {
                        setActiveView(val as DashboardView);
                        setActiveDockMenu(null);
                    }
                }}
                items={[
                    { id: 'home', label: 'Home', icon: <Icons.Home />, content: null },
                    { 
                        id: 'course', 
                        label: 'Courses', 
                        icon: <Icons.Courses />, 
                        content: <DockMenu rows={courses.map(course => ({
                            icon: Icons.Courses,
                            label: course.title.split(' - ')[0],
                            onClick: () => {
                                setActiveDockMenu(null);
                                handleCourseSelect(course);
                            }
                        }))} /> 
                    },
                    { 
                        id: 'paths', 
                        label: 'Paths', 
                        icon: <Icons.Paths />, 
                        content: <DockMenu rows={[
                            { icon: Icons.Paths, label: 'My Learning Paths', onClick: () => { setActiveDockMenu(null); setIsMobilePathsOpen(true); } },
                            { icon: Icons.Tools, label: 'Explore Paths', onClick: () => { setActiveDockMenu(null); setIsMobilePathsOpen(true); } }
                        ]} /> 
                    },
                    { id: 'goals', label: 'Goals', icon: <Icons.Goals />, content: null },
                    { id: 'groups', label: 'Workspaces', icon: <Icons.Groups />, content: null },
                    { id: 'users', label: 'Community', icon: <Icons.Users />, content: null },
                    { id: 'tools', label: 'Tools', icon: <Icons.Tools />, content: null, isLocked: level < 2 },
                ]}
            />
        </div>
        </>
    );
});

DashboardSidebar.displayName = 'DashboardSidebar';

export default DashboardSidebar;
