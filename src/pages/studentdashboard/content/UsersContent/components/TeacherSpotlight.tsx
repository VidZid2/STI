/**
 * TeacherSpotlight + TeacherSpotlightSkeleton
 * Extracted from UsersContent.tsx during Phase 8.4
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { fetchUsers, getTeacherCourses, type UserAccount, type TeacherCourse } from '../../../../../services/usersService';
import { Carousel, CarouselContent, CarouselItem } from '../../../../../components/ui/carousel';
import { SkeletonPulse } from './UsersSkeleton';

// Teacher Spotlight Skeleton

const TeacherSpotlightSkeleton: React.FC<{
    
}> = ({ }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.4 }}
            className="rounded-[20px] sm:rounded-[24px] -mx-4 sm:-mx-6 lg:mx-0"
            style={{
                marginBottom: '24px',
                padding: '18px',
                background: 'var(--dashboard-surface)',
                border: `1px solid var(--border-color)`,
                overflow: 'hidden'
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <SkeletonPulse width="38px" height="38px" borderRadius="10px"  />
                <div style={{ flex: 1 }}>
                    <SkeletonPulse width="130px" height="15px" borderRadius="4px"  style={{ marginBottom: '6px' }} />
                    <SkeletonPulse width="180px" height="12px" borderRadius="4px"  />
                </div>
            </div>
            
            {/* Content */}
            <div style={{ display: 'flex', gap: '16px' }}>
                {/* Teacher Card */}
                <div style={{
                    width: '200px',
                    padding: '16px',
                    borderRadius: '12px',
                    border: `1px solid var(--border-color)`,
                    textAlign: 'center' }}>
                    <SkeletonPulse width="64px" height="64px" borderRadius="16px"  style={{ margin: '0 auto 12px' }} />
                    <SkeletonPulse width="80%" height="14px" borderRadius="4px"  style={{ margin: '0 auto 8px' }} />
                    <SkeletonPulse width="50px" height="20px" borderRadius="6px"  style={{ margin: '0 auto' }} />
                </div>
                
                {/* Courses */}
                <div style={{ flex: 1 }}>
                    <SkeletonPulse width="140px" height="11px" borderRadius="4px"  style={{ marginBottom: '10px' }} />
                    {[...Array(2)].map((_, i) => (
                        <div
                            key={i}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                border: `1px solid var(--border-color)`,
                                marginBottom: '8px' }}
                        >
                            <SkeletonPulse width="36px" height="36px" borderRadius="8px"  />
                            <div style={{ flex: 1 }}>
                                <SkeletonPulse width="70%" height="13px" borderRadius="4px"  style={{ marginBottom: '4px' }} />
                                <SkeletonPulse width="50%" height="11px" borderRadius="4px"  />
                            </div>
                            <SkeletonPulse width="45px" height="18px" borderRadius="5px"  />
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

// Teacher Spotlight Component - Featured carousel showing teachers this semester
interface TeacherWithCourses {
    teacher: UserAccount;
    courses: TeacherCourse[];
}

const TeacherSpotlight: React.FC<{
    
    onTeacherClick: (teacher: UserAccount) => void;
}> = ({  onTeacherClick }) => {
    const [teachers, setTeachers] = useState<TeacherWithCourses[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);


    // Load teachers and their courses
    useEffect(() => {
        const loadTeachers = async () => {
            setIsLoading(true);
            try {
                const allUsers = await fetchUsers('teacher');
                const teachersWithCourses: TeacherWithCourses[] = await Promise.all(
                    allUsers.map(async (teacher: UserAccount) => {
                        const courses = await getTeacherCourses(teacher.full_name);
                        return { teacher, courses };
                    })
                );
                // Filter to only teachers with courses
                setTeachers(teachersWithCourses.filter(t => t.courses.length > 0));
            } catch (err) {
            } finally {
                setIsLoading(false);
            }
        };
        loadTeachers();
    }, []);

    const handlePrev = () => {
        setCurrentIndex((prev) => Math.max(0, prev - 1));
    };

    const handleNext = () => {
        setCurrentIndex((prev) => Math.min(teachers.length - 1, prev + 1));
    };

    // Auto-advance carousel
    useEffect(() => {
        if (teachers.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev === teachers.length - 1 ? 0 : prev + 1));
        }, 5000);
        return () => clearInterval(interval);
    }, [teachers.length]);




    // Swipe and animation handled natively by Carousel component

    if (isLoading) {
        return <TeacherSpotlightSkeleton   />;
    }

    if (teachers.length === 0) return null;

    if (teachers.length === 0) return null;




    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.4 }}
            className="flex flex-col group transition-all duration-300 w-full relative h-full"
        >

            {/* Section Header */}
            <div className="flex items-center justify-between mb-5 w-full">
                <div className="flex items-center gap-3 min-w-0">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        whileHover={{ scale: 1.05, rotate: 15 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                        className="w-10 h-10 sm:w-11 sm:h-11 rounded-[12px] sm:rounded-[14px] bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800/50 flex items-center justify-center flex-shrink-0 shadow-sm relative transition-transform duration-300"
                    >
                        <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                    </motion.div>
                    <div className="flex flex-col min-w-0">
                        <h3 className="text-[15px] sm:text-[16px] font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight mb-0.5 transition-colors truncate">
                            Teacher Spotlight
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[12px] sm:text-[13px] font-medium text-slate-500 dark:text-slate-400 leading-none truncate">
                                Your Teachers This Semester
                            </p>
                            <div className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 border border-amber-200/50 dark:border-amber-700/50 text-amber-700 dark:text-amber-400 text-[10px] sm:text-[11px] font-bold tracking-wide flex items-center gap-1 shrink-0">
                                <span>{teachers.length}</span>
                                <span>Faculty</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Spotlight Content */}
            <div className="relative w-[calc(100%+8px)] -ml-1 flex flex-col flex-1 min-h-0 overflow-hidden px-1">
                <Carousel index={currentIndex} onIndexChange={setCurrentIndex} className="w-full">
                    <CarouselContent className="items-start">
                        {teachers.map((currentTeacher) => (
                            <CarouselItem key={currentTeacher.teacher.id} className="w-full flex flex-col gap-4 py-1">
                                    {/* Horizontal Teacher Profile Card */}
                                    <motion.div
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        onClick={() => onTeacherClick(currentTeacher.teacher)}
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-[20px] p-4 flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300"
                                    >
                                        {/* Avatar */}
                                        <div className="relative w-[52px] h-[52px] shrink-0">
                                            <div className="w-full h-full rounded-[14px] bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-[20px] font-bold overflow-hidden border border-blue-100 dark:border-blue-900/50 shadow-sm">
                                                {currentTeacher.teacher.profile_image ? (
                                                    <img 
                                                        src={currentTeacher.teacher.profile_image} 
                                                        alt={currentTeacher.teacher.full_name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    `${currentTeacher.teacher.first_name?.[0] || ''}${currentTeacher.teacher.last_name?.[0] || ''}`
                                                )}
                                            </div>
                                            {/* Online indicator */}
                                            <div className={`absolute -bottom-0.5 -right-0.5 w-[14px] h-[14px] rounded-full border-[2.5px] border-white dark:border-slate-800 ${currentTeacher.teacher.is_online ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-400 shadow-none'}`} />
                                        </div>
                                        
                                        {/* Name & Badge */}
                                        <div className="flex flex-col min-w-0 justify-center">
                                            <h4 className="text-[16px] font-bold text-slate-900 dark:text-slate-100 mb-1 leading-tight truncate">
                                                {currentTeacher.teacher.full_name}
                                            </h4>
                                            <div className="flex">
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold tracking-wider uppercase">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                                        <circle cx="9" cy="7" r="4" />
                                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                                    </svg>
                                                    Faculty
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Courses List - Compact */}
                                    <div className="w-full flex flex-col mt-2">
                                        <p className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 px-1">
                                            Teaching This Semester
                                        </p>
                                        <div className="flex flex-col gap-2.5 max-h-[180px] overflow-y-auto overflow-x-hidden px-1.5 -mx-1.5 pb-2 custom-scrollbar">
                                            {currentTeacher.courses.map((course, idx) => {
                                                const isEmerald = course.category === 'ge';
                                                const isBlue = course.category === 'major';
                                                const isPurple = course.category === 'nstp';
                                                const isAmber = course.category === 'pe';
                                                
                                                const iconColorClass = isEmerald ? 'text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30' :
                                                                    isBlue ? 'text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' :
                                                                    isPurple ? 'text-purple-500 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30' :
                                                                    isAmber ? 'text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30' :
                                                                    'text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800';
                                                
                                                const badgeColorClass = isEmerald ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' :
                                                                    isBlue ? 'text-blue-600 dark:text-blue-400 bg-blue-500/10' :
                                                                    isPurple ? 'text-purple-600 dark:text-purple-400 bg-purple-500/10' :
                                                                    isAmber ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10' :
                                                                    'text-slate-600 dark:text-slate-400 bg-slate-500/10';

                                                return (
                                                    <motion.div
                                                        key={course.id}
                                                        initial={{ opacity: 0, x: 10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.05 + idx * 0.03, duration: 0.2 }}
                                                        className="flex items-center gap-4 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-[16px] hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300"
                                                    >
                                                        {/* Course Icon Squircle */}
                                                        <div className={`w-[40px] h-[40px] shrink-0 rounded-[12px] flex items-center justify-center ${iconColorClass}`}>
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                                                            </svg>
                                                        </div>
                                                        
                                                        {/* Course Info */}
                                                        <div className="min-w-0 flex-1 flex flex-col justify-center gap-1">
                                                            <h5 className="text-[14px] font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">
                                                                {course.title}
                                                            </h5>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className={`px-2 py-[2px] rounded-[6px] text-[10px] font-extrabold uppercase tracking-wider leading-none ${badgeColorClass}`}>
                                                                    {course.category}
                                                                </span>
                                                                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate leading-none mt-px">
                                                                    {course.short_title}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
            </div>
            
            {/* Pagination Controls */}
                {teachers.length > 1 && (
                    <div className="w-full pt-2.5 mt-auto">
                        <div className="flex items-center justify-between w-full gap-2 bg-white dark:bg-slate-900/50 p-1.5 rounded-[14px] border border-slate-200/60 dark:border-slate-700/50 shadow-sm transition-all duration-300 hover:shadow-md">
                            <button 
                                type="button"
                                onClick={handlePrev} 
                                disabled={currentIndex === 0}
                                className={`w-9 h-9 rounded-[10px] flex items-center justify-center transition-all shadow-sm border ${
                                    currentIndex === 0
                                        ? 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50 text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-60'
                                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-500 hover:text-blue-600 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 hover:border-blue-300 dark:hover:border-blue-500 cursor-pointer'
                                }`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300 text-center tracking-wide flex-1">
                                Page {currentIndex + 1} <span className="text-slate-400 dark:text-slate-500 font-medium mx-0.5">/</span> {teachers.length}
                            </span>
                            <button 
                                type="button"
                                onClick={handleNext} 
                                disabled={currentIndex === teachers.length - 1}
                                className={`w-9 h-9 rounded-[10px] flex items-center justify-center transition-all shadow-sm border ${
                                    currentIndex === teachers.length - 1
                                        ? 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50 text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-60'
                                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-500 hover:text-blue-600 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 hover:border-blue-300 dark:hover:border-blue-500 cursor-pointer'
                                }`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                </div>
            )}
        </motion.div>
    );
};


export { TeacherSpotlight, TeacherSpotlightSkeleton };
