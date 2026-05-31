import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { getTimeLeftForCourse } from '../../../services/studyTimeService';

interface Course {
    id: string;
    title: string;
    subtitle: string;
    image: string;
    progress: number;
}

interface SidebarCoursesDropdownProps {
    isOpen: boolean;
    onClose: () => void;
    courses: Course[];
    onCourseClick?: (courseId: string) => void;
    anchorRef?: React.RefObject<HTMLDivElement | null>;
    currentCourseId?: string | null;
}

// Course Item Component with proper hover state
const CourseItem: React.FC<{
    course: Course;
    index: number;
    onClick?: (id: string) => void;
    isActive?: boolean;
}> = ({ course, index, onClick, isActive }) => {
    const displayTitle = useMemo(
        () => course.title.replace(' - SY2526-1T', ''),
        [course.title]
    );
    
    const timeLeft = useMemo(() => getTimeLeftForCourse(course.id), [course.id]);

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.02, duration: 0.2 }}
            onClick={() => onClick?.(course.id)}
            className={`flex items-center gap-3.5 p-3 rounded-[18px] cursor-pointer transition-all duration-300 border group ${
                isActive 
                    ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-800/40 shadow-sm' 
                    : 'bg-white dark:bg-zinc-900/40 border-zinc-150 dark:border-zinc-800/50 hover:border-blue-200/60 dark:hover:border-blue-800/50 hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 hover:shadow-md'
            }`}
            style={{ marginBottom: '8px' }}
        >
            {/* Student Tools style Image Container with spring hover animation */}
            <motion.div 
                whileHover={{ scale: 1.05, rotate: -3 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className={`w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0 border shadow-sm overflow-hidden ${
                    isActive 
                        ? 'border-blue-200 dark:border-blue-800/50 bg-white dark:bg-zinc-800' 
                        : 'border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-800'
                }`}
            >
                <img
                    src={course.image}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
            </motion.div>

            {/* Course Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="text-[13.5px] font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {displayTitle}
                </div>
                
                {/* Legible, high-contrast detail row with dot separators */}
                <div className="flex items-center gap-1.5 mt-1 text-[10.5px] text-zinc-500 dark:text-zinc-400 leading-none flex-wrap font-medium">
                    <span className="font-bold text-zinc-700 dark:text-zinc-350">
                        {course.subtitle.split(' · ')[0]}
                    </span>
                    <span className="text-zinc-300 dark:text-zinc-700">•</span>
                    {course.progress === 100 ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-0.5 uppercase tracking-wider">
                            Completed
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 uppercase tracking-wider font-extrabold text-zinc-400 dark:text-zinc-500">
                            <svg className="w-3 h-3 text-zinc-400 dark:text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            {timeLeft} LEFT
                        </span>
                    )}
                </div>
            </div>

            {/* Progress Pill / Stat badge style from Student Tools */}
            <div className="flex-shrink-0">
                <div className={`flex items-center gap-1.5 p-1.5 px-2 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:border-blue-200 dark:hover:border-blue-800/60 transition-colors ${
                    isActive ? 'border-blue-200 bg-blue-50/20' : 'group-hover:border-blue-200'
                }`}>
                    {course.progress === 100 ? (
                        <div className="text-emerald-500 bg-emerald-100 dark:bg-emerald-950/40 p-1 rounded-lg border border-emerald-200/50 flex-shrink-0">
                            <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                    ) : (
                        <div className="text-blue-500 bg-blue-100 dark:bg-blue-900/30 p-1 rounded-lg border border-blue-200/50 flex-shrink-0">
                            <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                        </div>
                    )}
                    <span className={`text-[11px] font-black leading-none ${
                        course.progress === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-zinc-100'
                    }`}>
                        {course.progress}%
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

// Continue Learning Card Component (Re-engineered to exactly match Student Tools card layout)
const ContinueLearningCard: React.FC<{
    course: Course;
    onCourseClick?: (id: string) => void;
}> = ({ course, onCourseClick }) => {
    const displayTitle = useMemo(() => course.title.replace(' - SY2526-1T', ''), [course.title]);
    
    return (
        <div
            onClick={() => onCourseClick?.(course.id)}
            className="mx-4 my-3 p-4 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[20px] flex items-center gap-3.5 group transition-all duration-300 hover:shadow-md hover:border-blue-200/80 dark:hover:border-blue-800/50 relative overflow-hidden cursor-pointer"
        >
            {/* SaaS Background Accents */}
            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-24 h-24 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-2xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
            <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-20 h-20 bg-blue-400/10 dark:bg-blue-400/5 rounded-full blur-2xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
            
            {/* Play Icon Container (Wrench Style with hover rotate/scale) */}
            <motion.div
                whileHover={{ scale: 1.05, rotate: -5 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className="w-12 h-12 rounded-[14px] bg-blue-50 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 flex items-center justify-center flex-shrink-0 shadow-sm relative z-10"
            >
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 fill-blue-600/10 group-hover:fill-blue-600/20 transition-colors" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <polygon points="6 3 20 12 6 21 6 3" />
                </svg>
            </motion.div>
            
            {/* Text Info */}
            <div className="min-w-0 flex-1 relative z-10">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest leading-none">
                        Continue Learning
                    </span>
                    
                    {/* Compact, elegant inline progress badge */}
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100/60 dark:border-blue-800/30 leading-none">
                        {course.progress}% PROGRESS
                    </span>
                </div>
                
                <h3 className="text-[14px] font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {displayTitle}
                </h3>
                
                <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 leading-normal font-medium flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-zinc-700 dark:text-zinc-350">{course.subtitle.split(' · ')[0]}</span>
                    <span className="text-zinc-300 dark:text-zinc-700">•</span>
                    <span>Resume course where you left off</span>
                </p>
            </div>
        </div>
    );
};


// Skeleton Loading
const CourseSkeleton: React.FC = () => (
    <div className="px-2 py-1">
        {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3.5 py-2.5 border-b border-zinc-50 dark:border-zinc-800/30 last:border-0">
                <div className="w-10 h-10 rounded-[12px] bg-zinc-100 dark:bg-zinc-800/60 animate-pulse flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <div className="h-3.5 w-2/3 bg-zinc-100 dark:bg-zinc-800/60 rounded animate-pulse mb-2" />
                    <div className="h-2.5 w-1/3 bg-zinc-100 dark:bg-zinc-800/60 rounded animate-pulse" />
                </div>
            </div>
        ))}
    </div>
);

// View All Button Component
const ViewAllButton: React.FC = () => {
    return (
        <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-2.5 px-4 rounded-[12px] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/60 hover:border-blue-200 dark:hover:border-blue-800/50 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-[12px] font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
        >
            <span>View All Courses</span>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6" />
            </svg>
        </motion.button>
    );
};

const SidebarCoursesDropdown: React.FC<SidebarCoursesDropdownProps> = ({
    isOpen,
    onClose,
    courses,
    onCourseClick,
    anchorRef,
    currentCourseId,
}) => {
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const closeTimeoutRef = useRef<number | null>(null);

    // Calculate stats
    const completedCount = courses.filter(c => c.progress === 100).length;
    const inProgressCourses = courses.filter(c => c.progress < 100);
    const mostRecentCourse = inProgressCourses[0];

    // Simulate loading
    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            const timer = setTimeout(() => setIsLoading(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && anchorRef?.current) {
            const rect = anchorRef.current.getBoundingClientRect();
            setPosition({
                top: rect.top - 20,
                left: rect.right + 12,
            });
        }
    }, [isOpen, anchorRef]);

    const scheduleClose = useCallback(() => {
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = window.setTimeout(onClose, 200);
    }, [onClose]);

    const cancelClose = useCallback(() => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
    }, []);

    useEffect(() => {
        return () => {
            if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        };
    }, []);

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, x: -8, scale: 0.98 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -8, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    onMouseEnter={cancelClose}
                    onMouseLeave={scheduleClose}
                    className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 text-zinc-900 dark:text-zinc-100 shadow-2xl rounded-[20px] overflow-hidden"
                    style={{
                        position: 'fixed',
                        top: position.top,
                        left: position.left,
                        width: '350px',
                        zIndex: 10000,
                    }}
                >
                    {/* Header - Re-engineered for SaaS Professionalism (Student Tools Style) */}
                    <div className="p-5 pb-4 border-b border-zinc-100 dark:border-zinc-800/80 relative overflow-hidden bg-white dark:bg-zinc-900">
                        {/* Background subtle accents */}
                        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
                        
                        <div className="flex items-center justify-between gap-4 relative z-10">
                            {/* Left: Icon, Title & Description */}
                            <div className="flex items-center gap-4 flex-1">
                                <motion.div
                                    whileHover={{ scale: 1.05, rotate: -5 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                    className="w-12 h-12 rounded-[14px] bg-blue-50 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 flex items-center justify-center flex-shrink-0 shadow-sm"
                                >
                                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                                        <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                                    </svg>
                                </motion.div>
                                
                                <div>
                                    <h2 className="text-[17px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight mb-0.5">
                                        My Courses
                                    </h2>
                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                                        Track your academic progression.
                                    </p>
                                </div>
                            </div>

                            {/* Right: Modern Stat Card */}
                            <div className="flex-shrink-0">
                                <div className="flex items-center gap-2.5 p-2.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:border-blue-200 dark:hover:border-blue-800/60 transition-colors">
                                    <div className="text-blue-500 bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-lg flex-shrink-0 border border-blue-200/50 dark:border-blue-800/30">
                                        <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none mb-0.5">Progress</p>
                                        <p className="text-[12px] font-black text-zinc-900 dark:text-zinc-100 leading-none">{completedCount}/{courses.length}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Continue Learning Card */}
                    {mostRecentCourse && !isLoading && (
                        <ContinueLearningCard 
                            course={mostRecentCourse} 
                            onCourseClick={onCourseClick} 
                        />
                    )}

                    {/* Course List */}
                    <div style={{ 
                        maxHeight: '240px', 
                        overflowY: 'auto', 
                        padding: '4px 8px',
                    }}>
                        {isLoading ? (
                            <CourseSkeleton />
                        ) : (
                            courses.map((course, index) => (
                                <CourseItem
                                    key={course.id}
                                    course={course}
                                    index={index}
                                    onClick={onCourseClick}
                                    isActive={currentCourseId === course.id}
                                />
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/30">
                        <ViewAllButton />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default React.memo(SidebarCoursesDropdown);
