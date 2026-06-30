/**
 * MobileCoursesSheet
 * Bottom sheet for mobile: shows all enrolled courses with smooth slide-up animation.
 * Triggered by tapping "Courses" in the mobile bottom dock.
 * Design consistent with HomeContent patterns (slate palette, SaaS cards, hover micro-interactions).
 */
import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, type PanInfo } from 'motion/react';
import { getTimeLeftForCourse } from '../../../services/studyTimeService';
import { getSidebarCoursesWithProgress } from '../utils';
import type { SidebarCourse } from '../types';

interface MobileCoursesSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onCourseSelect: (course: SidebarCourse) => void;
    currentCourseId?: string | null;
}

const getCourseTag = (id: string) => {
    const majorCourses = ['cp1', 'itc'];
    const geCourses = ['ppc', 'purcom', 'tcw', 'uts'];
    if (majorCourses.includes(id)) return { label: 'MAJOR', color: 'bg-blue-600 text-white' };
    if (geCourses.includes(id)) return { label: 'GEN ED', color: 'bg-violet-600 text-white' };
    if (id === 'nstp1') return { label: 'NSTP', color: 'bg-amber-600 text-white' };
    if (id === 'pe1') return { label: 'PE', color: 'bg-emerald-600 text-white' };
    if (id === 'euth1') return { label: 'EUTHENICS', color: 'bg-rose-600 text-white' };
    return { label: 'COURSE', color: 'bg-slate-600 text-white' };
};

const MobileCoursesSheet: React.FC<MobileCoursesSheetProps> = ({
    isOpen,
    onClose,
    onCourseSelect,
    currentCourseId,
}) => {
    const courses = useMemo(() => getSidebarCoursesWithProgress(), []);

    const inProgressCourses = useMemo(() => courses.filter(c => c.progress < 100), [courses]);
    const completedCourses = useMemo(() => courses.filter(c => c.progress === 100), [courses]);
    const mostRecentCourse = inProgressCourses[0];
    const completedCount = completedCourses.length;

    // Lock body scroll and hide bottom dock when open
    useEffect(() => {
        if (!isOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.documentElement.setAttribute('data-mobile-nav-open', 'true');
        return () => {
            document.body.style.overflow = prev;
            document.documentElement.removeAttribute('data-mobile-nav-open');
        };
    }, [isOpen]);

    // Back button dismiss
    useEffect(() => {
        if (!isOpen) return;
        const handlePopState = () => onClose();
        window.addEventListener('popstate', handlePopState);
        history.pushState(null, '', location.href);
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [isOpen, onClose]);

    const handleDragEnd = (_: unknown, info: PanInfo) => {
        if (info.offset.y > 100 || info.velocity.y > 500) {
            onClose();
        }
    };

    const handleCourseClick = (courseId: string) => {
        const course = courses.find(c => c.id === courseId);
        if (course) {
            onCourseSelect(course);
        }
        onClose();
    };

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
                        className="fixed inset-0 bg-black/30 z-[9100] sm:hidden"
                        onClick={onClose}
                    />

                    {/* Bottom Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={0.2}
                        onDragEnd={handleDragEnd}
                        className="fixed bottom-0 left-0 right-0 z-[9100] sm:hidden bg-white dark:bg-slate-900 rounded-t-[24px] shadow-xl border-t border-slate-200/80 dark:border-slate-700/80 max-h-[85vh] flex flex-col overflow-hidden"
                    >
                        {/* Ambient Background Glow */}
                        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px] translate-x-1/3 -translate-y-1/3 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-emerald-500/5 rounded-full blur-[60px] -translate-x-1/3 translate-y-1/3 pointer-events-none" />

                        {/* Drag Handle */}
                        <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing relative z-10">
                            <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-5 relative z-10">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-12 h-12 rounded-[16px] bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 flex items-center justify-center flex-shrink-0 shadow-sm">
                                        <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                                            <path d="M6 12v5c3 3 9 3 12 0v-5" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                                            My Courses
                                        </h2>
                                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                                            {completedCount}/{courses.length} completed
                                        </p>
                                    </div>
                                </div>
                                <motion.button
                                    onClick={onClose}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="flex-shrink-0 flex items-center justify-center rounded-lg sm:rounded-xl border border-zinc-200/80 bg-white/80 backdrop-blur-md p-2 text-zinc-500 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-700/80 dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:bg-zinc-700"
                                    aria-label="Close menu"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sm:w-5 sm:h-5">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </motion.button>
                            </div>

                            {/* Continue Learning Card */}
                            {mostRecentCourse && (
                                <motion.button
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    onClick={() => handleCourseClick(mostRecentCourse.id)}
                                    className="w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 shadow-sm rounded-[20px] p-4 flex items-center gap-3.5 text-left relative overflow-hidden group transition-all duration-300 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700"
                                >
                                    {/* Ambient glow */}
                                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none transition-transform duration-700 group-hover:scale-150" />
                                    <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-20 h-20 bg-blue-400/10 rounded-full blur-2xl pointer-events-none transition-transform duration-700 group-hover:scale-150" />

                                    {/* Icon */}
                                    <motion.div
                                        whileHover={{ scale: 1.05, rotate: -5 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                        className="w-12 h-12 rounded-[14px] bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0 border border-blue-200/50 dark:border-blue-800/50 shadow-sm relative z-10"
                                    >
                                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polygon points="6 3 20 12 6 21 6 3" />
                                        </svg>
                                    </motion.div>

                                    {/* Text */}
                                    <div className="min-w-0 flex-1 relative z-10">
                                        <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest leading-none">
                                            Continue Learning
                                        </span>
                                        <h3 className="text-[14px] font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-snug mt-1 truncate">
                                            {mostRecentCourse.title.replace(' - SY2526-1T', '')}
                                        </h3>
                                        <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                            {mostRecentCourse.subtitle.split(' · ')[0]} &bull; {mostRecentCourse.progress}% done
                                        </p>
                                    </div>

                                    {/* Action */}
                                    <div className="flex-shrink-0 relative z-10 flex items-center gap-2">
                                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-[10px] border border-blue-200/50 dark:border-blue-800/30">
                                            <div className="w-5 h-5 rounded-[6px] bg-blue-200 dark:bg-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">~25 min</span>
                                        </div>
                                        <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center border border-blue-200/50">
                                            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="9 18 15 12 9 6" />
                                            </svg>
                                        </div>
                                    </div>
                                </motion.button>
                            )}

                            {/* Divider */}
                            <hr className="border-t border-slate-100 dark:border-slate-700/50" />

                            {/* Course List */}
                            <div>
                                <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-1">
                                    All Courses
                                </h3>
                                <div className="space-y-2.5">
                                    {courses.map((course, index) => {
                                        const timeLeft = getTimeLeftForCourse(course.id);
                                        const isActive = currentCourseId === course.id;
                                        const courseTag = getCourseTag(course.id);
                                        return (
                                            <motion.button
                                                key={course.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.03, duration: 0.2 }}
                                                onClick={() => handleCourseClick(course.id)}
                                                className={`w-full flex items-center gap-3 p-3 rounded-[18px] border text-left transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] ${
                                                    isActive
                                                        ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-800/40 shadow-sm'
                                                        : 'bg-white dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/50 hover:border-blue-200/60 dark:hover:border-blue-800/50'
                                                }`}
                                            >
                                                {/* Course Image */}
                                                <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0 border shadow-sm overflow-hidden transition-transform duration-300 group-hover:scale-105 ${
                                                    isActive
                                                        ? 'border-blue-200 dark:border-blue-800/50'
                                                        : 'border-slate-200/60 dark:border-slate-700'
                                                }`}>
                                                    <img
                                                        src={course.image}
                                                        alt=""
                                                        loading="lazy"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>

                                                {/* Course Info */}
                                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-[6px] leading-none ${courseTag.color}`}>
                                                            {courseTag.label}
                                                        </span>
                                                    </div>
                                                    <div className="text-[13px] font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-snug truncate">
                                                        {course.title.replace(' - SY2526-1T', '')}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                                        <span className="font-bold text-slate-700 dark:text-slate-300">
                                                            {course.subtitle.split(' · ')[0]}
                                                        </span>
                                                        <span className="text-slate-300 dark:text-slate-600">&bull;</span>
                                                        {course.progress === 100 ? (
                                                            <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                                                                Done
                                                            </span>
                                                        ) : (
                                                            <span className="uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
                                                                {timeLeft} LEFT
                                                            </span>
                                                        )}
                                                    </div>
                                                    {/* Mini Progress Bar */}
                                                    {course.progress > 0 && course.progress < 100 && (
                                                        <div className="w-full h-1.5 rounded-full bg-slate-200/80 dark:bg-slate-700 overflow-hidden mt-2 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] border border-black/5 dark:border-white/5">
                                                            <motion.div
                                                                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${course.progress}%` }}
                                                                transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 + index * 0.05 }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Progress Badge */}
                                                <div className="flex-shrink-0">
                                                    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] border transition-all duration-300 ${
                                                        course.progress === 100
                                                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/50 dark:border-emerald-800/30'
                                                            : isActive
                                                                ? 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-200/50 dark:border-blue-800/30'
                                                                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                                                    }`}>
                                                        {course.progress === 100 ? (
                                                            <div className="text-emerald-500 bg-emerald-100 dark:bg-emerald-950/40 p-0.5 rounded-md border border-emerald-200/50 flex-shrink-0">
                                                                <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                                                                    <polyline points="20 6 9 17 4 12" />
                                                                </svg>
                                                            </div>
                                                        ) : (
                                                            <div className="text-blue-500 bg-blue-100 dark:bg-blue-900/30 p-0.5 rounded-md border border-blue-200/50 flex-shrink-0">
                                                                <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                        <span className={`text-[11px] font-bold leading-none ${
                                                            course.progress === 100
                                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                                : 'text-slate-900 dark:text-slate-100'
                                                        }`}>
                                                            {course.progress}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default MobileCoursesSheet;
