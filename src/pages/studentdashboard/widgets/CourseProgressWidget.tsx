/**
 * CourseProgressWidget Component
 * Displays top 3 courses sorted by last accessed with progress bars
 * Visibility key: courses-widget
 */

import * as React from 'react';
import { motion } from 'motion/react';
import type { CourseProgressData } from '../../../services/studyTimeService';

const COURSE_NAMES: Record<string, string> = {
    'cp1': 'Computer Programming 1',
    'euth1': 'Euthenics 1',
    'itc': 'Intro to Computing',
    'nstp1': 'NSTP 1',
    'pe1': 'PE/PATHFIT 1',
    'ppc': 'Philippine Popular Culture',
    'purcom': 'Purposive Communication',
    'tcw': 'The Contemporary World',
    'uts': 'Understanding the Self',
};

interface CourseProgressWidgetProps {
    getCourseProgressData: () => CourseProgressData;
    compactMode?: boolean;
    onClose: () => void;
}

export const CourseProgressWidget = React.memo<CourseProgressWidgetProps>(({
    getCourseProgressData,
    compactMode = false,
    onClose,
}) => {
    const courseProgress = getCourseProgressData();

    // Get top 3 courses sorted by last accessed (most recent first)
    const sortedCourses = Object.entries(courseProgress)
        .map(([id, data]) => ({ id, ...data, name: COURSE_NAMES[id] || id }))
        .sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime())
        .slice(0, 3);

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
            className={`bg-white rounded-xl border border-zinc-100/80 overflow-hidden ${compactMode ? 'shadow-none' : 'shadow-sm'}`}
            id="courses-widget"
        >
            <div className={`flex items-center justify-between ${compactMode ? 'px-3 py-2' : 'px-4 py-3'}`}>
                <div className="flex items-center gap-2">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className={`rounded-lg bg-gradient-to-br from-indigo-50 to-purple-100/50 flex items-center justify-center ${compactMode ? 'w-6 h-6' : 'w-8 h-8'}`}
                    >
                        <svg className={`text-indigo-500 ${compactMode ? 'w-3 h-3' : 'w-4 h-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </motion.div>
                    <span className={`font-medium text-zinc-700 ${compactMode ? 'text-xs' : 'text-sm'}`}>My Courses</span>
                </div>
                <motion.button
                    whileHover={{ scale: 1.15, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onClose()}
                    className={`flex items-center justify-center rounded-md text-zinc-300 hover:text-red-400 transition-${compactMode ? 'w-5 h-5' : 'w-6 h-6'}`}
                >
                    <svg className={compactMode ? 'w-3 h-3' : 'w-3.5 h-3.5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </motion.button>
            </div>

            {/* Course List */}
            <div className={`${compactMode ? 'px-3 pb-3' : 'px-4 pb-4'}`}>
                {sortedCourses.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex flex-col items-center justify-center ${compactMode ? 'py-4' : 'py-6'}`}
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                            className={`rounded-full bg-gradient-to-br from-indigo-50 to-purple-100/80 flex items-center justify-center mb-3 ${compactMode ? 'w-10 h-10' : 'w-12 h-12'}`}
                        >
                            <svg className={`text-indigo-400 ${compactMode ? 'w-5 h-5' : 'w-6 h-6'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </motion.div>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className={`font-medium text-zinc-600 ${compactMode ? 'text-[11px]' : 'text-xs'}`}
                        >
                            No courses yet
                        </motion.p>
                    </motion.div>
                ) : (
                    <div className="space-y-2">
                        {sortedCourses.map((course, index) => {
                            const progressColor = course.progress >= 80 ? 'bg-emerald-500' :
                                course.progress >= 50 ? 'bg-blue-500' :
                                    course.progress >= 20 ? 'bg-amber-500' : 'bg-zinc-300';
                            const progressBg = course.progress >= 80 ? 'bg-emerald-100' :
                                course.progress >= 50 ? 'bg-blue-100' :
                                    course.progress >= 20 ? 'bg-amber-100' : 'bg-zinc-100';

                            return (
                                <motion.div
                                    key={course.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileHover={{ x: 4, backgroundColor: 'rgba(99, 102, 241, 0.05)' }}
                                    onClick={() => {
                                        // Navigate to course using event-driven architecture
                                        const event = new CustomEvent('navigate-to-course', {
                                            detail: { courseId: course.id }
                                        });
                                        window.dispatchEvent(event);
                                    }}
                                    className={`rounded-lg cursor-pointer transition-${compactMode ? 'p-2' : 'p-2.5'}`}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <p className={`font-medium text-zinc-700 truncate flex-1 ${compactMode ? 'text-[10px]' : 'text-xs'}`}>
                                            {course.name}
                                        </p>
                                        <span className={`font-semibold ml-2 ${course.progress >= 80 ? 'text-emerald-600' :
                                                course.progress >= 50 ? 'text-blue-600' :
                                                    course.progress >= 20 ? 'text-amber-600' : 'text-zinc-500'
                                            } ${compactMode ? 'text-[10px]' : 'text-xs'}`}>
                                            {course.progress}%
                                        </span>
                                    </div>
                                    {/* Progress Bar */}
                                    <div className={`w-full rounded-full overflow-hidden ${progressBg} ${compactMode ? 'h-1' : 'h-1.5'}`}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${course.progress}%` }}
                                            transition={{ delay: index * 0.1 + 0.2, duration: 0.5, ease: 'easeOut' }}
                                            className={`h-full rounded-full ${progressColor}`}
                                        />
                                    </div>
                                    <p className={`text-zinc-400 mt-1 ${compactMode ? 'text-[8px]' : 'text-[9px]'}`}>
                                        {course.completedModules}/{course.totalModules} modules
                                    </p>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </motion.div>
    );
});

CourseProgressWidget.displayName = 'CourseProgressWidget';

export default CourseProgressWidget;
