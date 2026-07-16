import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import './TeacherDashboard.css';

import SvgCourses from "../../components/icons/Courses";
import SvgAnnouncement from "../../components/icons/Announcement";
import SvgQuizAttempt from "../../components/icons/QuizAttempt";
import SvgAssignments from "../../components/icons/Assignments";
import SvgDiscussions from "../../components/icons/Discussions";
import SvgVideo from "../../components/icons/Video";
import SvgCertificate from "../../components/icons/Certificate";
import SvgAnalytics from "../../components/icons/Analytics";
import MyCoursesContent from './content/MyCoursesContent';
import NewCoursePage from './content/NewCoursePage';
import { getCurrentUser, recoverCurrentUser } from '../../services/authService';

/* ─── Icon Components (inline SVG, no external deps) ──────── */
const IconAcademy = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
  </svg>
);

const IconHome = ({ active }: { active?: boolean }) => {
  const outlinePath = "m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25";
  const filledPath1 = "M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z";
  const filledPath2 = "m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z";

  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em">
      <motion.path
        initial={false}
        animate={{ opacity: active ? 0 : 1 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        d={outlinePath}
      />
      
      <motion.path
        initial={false}
        animate={{ opacity: active ? 1 : 0 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        fill="currentColor"
        d={filledPath1}
      />
      <motion.path
        initial={false}
        animate={{ opacity: active ? 1 : 0 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        fill="currentColor"
        d={filledPath2}
      />
    </svg>
  );
};

const IconCourses = ({ active }: { active?: boolean }) => <SvgCourses active={active} />;
const IconAnnouncements = ({ active }: { active?: boolean }) => <SvgAnnouncement active={active} />;
const IconQuiz = ({ active }: { active?: boolean }) => <SvgQuizAttempt active={active} />;
const IconAssignments = ({ active }: { active?: boolean }) => <SvgAssignments active={active} />;
const IconDiscussions = ({ active }: { active?: boolean }) => <SvgDiscussions active={active} />;
const IconLiveClasses = ({ active }: { active?: boolean }) => <SvgVideo active={active} />;
const IconCertificate = ({ active }: { active?: boolean }) => <SvgCertificate active={active} />;
const IconAnalytics = ({ active }: { active?: boolean }) => <SvgAnalytics active={active} />;

const IconBell = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const IconCalendar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <path d="M8 14h.01" />
    <path d="M12 14h.01" />
    <path d="M16 14h.01" />
    <path d="M8 18h.01" />
    <path d="M12 18h.01" />
    <path d="M16 18h.01" />
  </svg>
);

const IconSettings = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="9" r="2.5" />
    <line x1="10.5" y1="9" x2="21" y2="9" />
    <line x1="3" y1="9" x2="5.5" y2="9" />
    <circle cx="16" cy="15" r="2.5" />
    <line x1="3" y1="15" x2="13.5" y2="15" />
    <line x1="18.5" y1="15" x2="21" y2="15" />
  </svg>
);

const IconGrip = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="12" r="1" />
    <circle cx="9" cy="5" r="1" />
    <circle cx="9" cy="19" r="1" />
    <circle cx="15" cy="12" r="1" />
    <circle cx="15" cy="5" r="1" />
    <circle cx="15" cy="19" r="1" />
  </svg>
);

const AnimatedCheckbox = ({ checked }: { checked: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" className={`td-checkbox-svg ${checked ? 'checked' : 'unchecked'}`}>
    <rect x="2" y="2" width="20" height="20" rx="4" ry="4" className="td-checkbox-rect" />
    <path 
      d="M7.5 12.5l2.5 2.5 6.5-6.5" 
      stroke="#fff" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="td-checkmark-path" 
    />
  </svg>
);

const IconDollar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
    <path d="M12 18V6" />
  </svg>
);

const IconDocument = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const IconGradCap = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5" />
  </svg>
);

const IconStar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const NAV_TOP = [
  { id: 'home', label: 'Dashboard', icon: IconHome },
  { id: 'courses', label: 'My Courses', icon: IconCourses },
  { id: 'announcements', label: 'Announcements', icon: IconAnnouncements },
  { id: 'quiz', label: 'Quiz Attempts', icon: IconQuiz },
  { id: 'assignments', label: 'Assignments', icon: IconAssignments },
];

const NAV_BOTTOM = [
  { id: 'discussions', label: 'Discussions', icon: IconDiscussions },
  { id: 'live', label: 'Live Classes', icon: IconLiveClasses },
  { id: 'certificate', label: 'Certificate', icon: IconCertificate },
  { id: 'analytics', label: 'Analytics', icon: IconAnalytics },
];

const DISTRIBUTION_TOTAL = 43049;
const DISTRIBUTION = [
  { label: 'Enrolled', count: 22000, className: 'enrolled' },
  { label: 'Completed', count: 12000, className: 'completed' },
  { label: 'In Progress', count: 5000, className: 'in-progress' },
  { label: 'Inactive', count: 4000, className: 'inactive' },
  { label: 'Cancelled', count: 49, className: 'cancelled' },
];
const EARNINGS_DATA = [
  { name: '', earnings: 22000, enrolled: 11000 },
  { name: 'Jan', earnings: 15000, enrolled: 8000 },
  { name: 'Feb', earnings: 8000, enrolled: 9000 },
  { name: 'Mar', earnings: 3000, enrolled: 6000 },
  { name: 'Apr', earnings: 28000, enrolled: 2000 },
  { name: 'May', earnings: 18000, enrolled: 14000 },
  { name: 'Jun', earnings: 6000, enrolled: 32000 },
  { name: 'Jul', earnings: 2000, enrolled: 15000 },
  { name: 'Aug', earnings: 8000, enrolled: 4000 },
  { name: 'Sep', earnings: 4000, enrolled: 12000 },
  { name: 'Oct', earnings: 8000, enrolled: 24000 },
  { name: 'Nov', earnings: 14000, enrolled: 18000 },
  { name: 'Dec', earnings: 18000, enrolled: 6000 },
  { name: ' ', earnings: 16000, enrolled: 2000 },
];

const TOP_COURSES = [
  { id: 1, title: 'Professional Brand Design: From Concept to Portfolio', revenue: '$42.5K', students: '1,250' },
  { id: 2, title: 'Complete Web Development Bootcamp', revenue: '$38.2K', students: '2,100' },
  { id: 3, title: 'Advanced UX/UI Principles', revenue: '$29.1K', students: '850' },
];

const INITIAL_DROPDOWN_ITEMS = [
  { id: 'enrolled', label: 'Enrolled Courses', checked: true },
  { id: 'active', label: 'Active Courses', checked: true },
  { id: 'completed', label: 'Completed Courses', checked: true },
  { id: 'total_students', label: 'Total Students', checked: true },
  { id: 'total_courses', label: 'Total Courses', checked: true },
  { id: 'total_earnings', label: 'Total Earnings', checked: true },
];

type NavItem = { id: string; label: string; icon: any };

const VIEW_MOTION = {
  initial: { opacity: 0, filter: 'blur(20px)', y: 6, scale: 0.99 },
  animate: { opacity: 1, filter: 'blur(0px)', y: 0, scale: 1 },
  exit: { opacity: 0, filter: 'blur(18px)', y: -5, scale: 0.992 },
  transition: { duration: 0.26, ease: [0.22, 1, 0.36, 1] },
} as const;

const REDUCED_VIEW_MOTION = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.12 },
} as const;

const ROUTE_MOTION = {
  initial: { opacity: 0, filter: 'blur(14px)', scale: 0.995 },
  animate: { opacity: 1, filter: 'blur(0px)', scale: 1 },
  exit: { opacity: 0, filter: 'blur(14px)', scale: 0.995 },
  transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
} as const;

const REDUCED_ROUTE_MOTION = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.12 },
} as const;

const TeacherDashboard: React.FC = () => {
  const [teacherProfile, setTeacherProfile] = useState(() => getCurrentUser());

  React.useEffect(() => {
    if (teacherProfile) return;
    let active = true;
    void recoverCurrentUser().then((restoredProfile) => {
      if (active && restoredProfile) setTeacherProfile(restoredProfile);
    });
    return () => {
      active = false;
    };
  }, [teacherProfile]);

  const teacherFullName = teacherProfile?.full_name?.trim() || 'Teacher';
  const teacherFirstName = teacherProfile?.first_name?.trim()
    || teacherFullName.split(/\s+/)[0]
    || 'Teacher';
  const teacherInitials = teacherFullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((namePart) => namePart[0]?.toUpperCase())
    .join('') || 'T';
  const [activeNav, setActiveNav] = useState('home');
  const [showSettings, setShowSettings] = useState(false);
  const [dropdownItems, setDropdownItems] = useState(INITIAL_DROPDOWN_ITEMS);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const activeView = activeNav === 'courses' ? 'courses' : 'home';

  const viewMotion = shouldReduceMotion ? REDUCED_VIEW_MOTION : VIEW_MOTION;
  const routeMotion = shouldReduceMotion ? REDUCED_ROUTE_MOTION : ROUTE_MOTION;

  const blockSelect = (e: Event) => e.preventDefault();

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', index.toString());
    }
    setDraggedIndex(index);
    document.addEventListener('selectstart', blockSelect);
    window.getSelection()?.removeAllRanges();
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    window.getSelection()?.removeAllRanges();
    if (draggedIndex === null || draggedIndex === index) return;

    const newItems = [...dropdownItems];
    const draggedItem = newItems[draggedIndex];
    newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, draggedItem);

    if (document.startViewTransition) {
      document.startViewTransition(() => {
        setDropdownItems(newItems);
        setDraggedIndex(index);
      });
    } else {
      setDropdownItems(newItems);
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    document.removeEventListener('selectstart', blockSelect);
    window.getSelection()?.removeAllRanges();
  };

  const toggleDropdownItem = (index: number) => {
    const newItems = [...dropdownItems];
    newItems[index].checked = !newItems[index].checked;
    setDropdownItems(newItems);
  };

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = activeNav === item.id;
    return (
      <button
        key={item.id}
        className={`td-nav-item${isActive ? ' active' : ''}`}
        onClick={() => setActiveNav(item.id)}
      >
        <Icon active={isActive} />
        {item.label}
      </button>
    );
  };

  return (
    <div className="td-route-stage">
      <AnimatePresence mode="wait" initial={false}>
        {activeNav === 'new-course' ? (
          <motion.div
            key="new-course"
            className="td-route-transition"
            initial={routeMotion.initial}
            animate={routeMotion.animate}
            exit={routeMotion.exit}
            transition={routeMotion.transition}
          >
            <NewCoursePage onClose={() => setActiveNav('courses')} />
          </motion.div>
        ) : (
    <motion.div
      key="dashboard"
      className="teacher-dashboard td-route-transition"
      initial={routeMotion.initial}
      animate={routeMotion.animate}
      exit={routeMotion.exit}
      transition={routeMotion.transition}
    >
      <div className="td-body">
        <aside className="td-sidebar">
          <div className="td-sidebar-logo">
            <div className="td-header-logo-icon">
              <IconAcademy />
            </div>
            <span className="td-header-logo-text">Academy</span>
          </div>

          <nav className="td-sidebar-nav">
            {NAV_TOP.map(renderNavItem)}
          </nav>
          <div className="td-sidebar-separator" />
          <nav className="td-sidebar-nav">
            {NAV_BOTTOM.map(renderNavItem)}
          </nav>
        </aside>

        <div className="td-right">
          <header className="td-header">
            <div className="td-header-inner">
              <div className="td-header-greeting">
                <h2>
                  <span className="td-greeting-light">Hi,</span> {teacherFirstName}{' '}
                  <span aria-hidden="true">👋</span>
                </h2>
                <p><span className="td-stat-highlight">13</span> active courses • <span className="td-stat-highlight">1250</span> students enrolled</p>
              </div>

              <div className="td-header-actions">
                <button className="td-notification-btn" aria-label="Notifications">
                  <IconBell />
                  <span className="td-notification-dot" />
                </button>
                {teacherProfile?.profile_image ? (
                  <img
                    className="td-avatar"
                    src={teacherProfile.profile_image}
                    alt={teacherFullName}
                  />
                ) : (
                  <div className="td-avatar td-avatar-fallback" role="img" aria-label={teacherFullName}>
                    {teacherInitials}
                  </div>
                )}
              </div>
            </div>
          </header>

        <main className="td-main">
          <div className="td-main-inner">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeView}
              className="td-view-transition"
              initial={viewMotion.initial}
              animate={viewMotion.animate}
              exit={viewMotion.exit}
              transition={viewMotion.transition}
            >
            {activeView === 'courses' ? (
              <MyCoursesContent onCreateCourse={() => setActiveNav('new-course')} />
            ) : (
              <>
            <div className="td-section-header">
            <div className="td-section-title">
              <IconCalendar />
              All Time
            </div>
            <div className="td-section-actions">
              <button aria-label="Settings" onClick={() => setShowSettings(!showSettings)}>
                <IconSettings />
              </button>
              <div 
                className={`td-settings-dropdown ${showSettings ? 'show' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }}
              >
                {dropdownItems.map((item, i) => (
                  <div 
                    key={item.id} 
                    className={`td-sd-item ${draggedIndex === i ? 'dragging' : ''}`}
                    draggable
                    style={{ '--vt-name': `dropdown-item-${item.id}`, userSelect: 'none' } as React.CSSProperties}
                    onDragStart={(e) => handleDragStart(e, i)}
                    onDragOver={(e) => handleDragOver(e, i)}
                    onDragEnd={handleDragEnd}
                    onClick={() => toggleDropdownItem(i)}
                  >
                    <div className="td-sd-grip">
                      <IconGrip />
                    </div>
                    <AnimatedCheckbox checked={item.checked} />
                    <span className="td-sd-text">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="td-dashboard-grid">
            <div className="td-stats-row">
              <div className="td-stat-card">
                <div className="td-stat-label-row">
                  <span className="td-stat-label">Total Earnings</span>
                  <div className="td-stat-icon blue">
                    <IconDollar />
                  </div>
                </div>
                <div className="td-stat-value blue">$3949.00</div>
              </div>

              <div className="td-stat-card">
                <div className="td-stat-label-row">
                  <span className="td-stat-label">Total Courses</span>
                  <div className="td-stat-icon green">
                    <IconDocument />
                  </div>
                </div>
                <div className="td-stat-value green">7</div>
              </div>

              <div className="td-stat-card">
                <div className="td-stat-label-row">
                  <span className="td-stat-label">Total Students</span>
                  <div className="td-stat-icon indigo">
                    <IconGradCap />
                  </div>
                </div>
                <div className="td-stat-value indigo">1636</div>
              </div>

              <div className="td-stat-card">
                <div className="td-stat-label-row">
                  <span className="td-stat-label">Avg. Rating</span>
                  <div className="td-stat-icon orange">
                    <IconStar />
                  </div>
                </div>
                <div className="td-stat-value orange">2.3</div>
              </div>
            </div>

            <div className="td-distribution-card">
              <h3 className="td-distribution-title">Course Completion Distribution</h3>
              <div className="td-distribution-bar">
                {DISTRIBUTION.map((seg) => (
                  <div
                    key={seg.className}
                    className={`td-bar-segment ${seg.className}`}
                    style={{ width: `${(seg.count / DISTRIBUTION_TOTAL) * 100}%` }}
                    title={`${seg.label}: ${seg.count.toLocaleString()}`}
                  />
                ))}
              </div>
              <div className="td-distribution-legend">
                {DISTRIBUTION.map((seg) => (
                  <div key={seg.className} className="td-legend-item">
                    <span className="td-legend-label">
                      <span className={`td-legend-dot ${seg.className}`} />
                      {seg.label}
                    </span>
                    <span className="td-legend-value">{seg.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="td-earnings-chart-card">
            <div className="td-ecc-header">
              <h3 className="td-ecc-title">Earnings Over Time</h3>
              <div className="td-ecc-legend">
                <div className="td-ecc-legend-item">
                  <span className="td-ecc-legend-line blue"></span>
                  Earnings
                </div>
                <div className="td-ecc-legend-item">
                  <span className="td-ecc-legend-line green"></span>
                  Enrolled
                </div>
              </div>
            </div>
            <div className="td-ecc-chart">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={EARNINGS_DATA} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorEnrolled" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 13 }} 
                    dy={10} 
                    scale="point"
                    padding={{ left: 0, right: 0 }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="enrolled" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorEnrolled)" />
                  <Area type="monotone" dataKey="earnings" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorEarnings)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="td-top-courses-card">
            <div className="td-tcc-header">
              <h3 className="td-tcc-title">Top Performing Courses</h3>
              <div className="td-tcc-filter">
                <span className="td-tcc-filter-label">By:</span>
                <select className="td-tcc-filter-select">
                  <option value="revenue">Revenue</option>
                  <option value="students">Students</option>
                </select>
              </div>
            </div>
            <div className="td-tcc-list">
              {TOP_COURSES.map((course) => (
                <div key={course.id} className="td-tcc-item">
                  <div className="td-tcc-item-left">
                    <div className="td-tcc-rank">#{course.id}</div>
                    <div className="td-tcc-course-title">{course.title}</div>
                  </div>
                  <div className="td-tcc-item-right">
                    <div className="td-tcc-stat">
                      <div className="td-tcc-stat-label">
                        <IconDollar /> Revenue
                      </div>
                      <div className="td-tcc-stat-value">{course.revenue}</div>
                    </div>
                    <div className="td-tcc-stat">
                      <div className="td-tcc-stat-label">
                        <IconGradCap /> Students
                      </div>
                      <div className="td-tcc-stat-value">{course.students}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
              </>
            )}
            </motion.div>
          </AnimatePresence>
        </div>
        </main>
      </div>
    </div>
  </motion.div>
        )}
      </AnimatePresence>
    </div>
);
};

export default TeacherDashboard;
