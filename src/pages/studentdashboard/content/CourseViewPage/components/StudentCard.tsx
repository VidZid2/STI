/**
 * StudentCard
 * Individual student card in the Students tab of CourseViewPage.
 * Extracted from CourseViewPage.tsx during Phase 8.1
 */
import * as React from 'react';
import { motion } from 'motion/react';
import { AnimatedCircularProgressBar } from '@/components/ui/animated-circular-progress-bar';
import Grainient from '@/components/ui/grainient';

interface StudentCardProps {
    student: {
        id: number;
        name: string;
        status: string;
        role: string;
        email: string;
        avatar?: string;
        section?: string;
        program?: string;
        level?: number;
    };
    index: number;
}

export const StudentCard: React.FC<StudentCardProps> = ({ student, index }) => {
    const isCurrentUser = student.name === 'Josiah P. De Asis';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ delay: index * 0.02, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={`relative pt-5 pb-5 px-5 bg-white dark:bg-slate-800 rounded-[14px] border-[2px] border-slate-200 dark:border-slate-700/50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-pointer flex flex-col items-start w-full overflow-hidden`}
        >
            {isCurrentUser && (
                <div className="absolute inset-0 z-0">
                    <Grainient 
                        color1="#ffffff" 
                        color2="#ffffff" 
                        color3="#3b82f6" 
                    />
                </div>
            )}

            {/* Avatar Profile Section */}
            <div className="relative z-10 flex flex-col items-center justify-center gap-3 w-full">
                <motion.div className="relative flex justify-center shrink-0">
                    <AnimatedCircularProgressBar
                        max={100}
                        min={0}
                        value={85}
                        gaugePrimaryColor="#3b82f6"
                        gaugeSecondaryColor="rgba(219, 234, 254, 0.6)"
                        className="w-16 h-16 shrink-0 relative z-10"
                    >
                        <div className="absolute inset-1.5 rounded-full flex items-center justify-center shadow-sm overflow-hidden z-10" style={{ background: 'rgba(219, 234, 254, 0.6)' }}>
                            {student.avatar ? (
                                <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center font-extrabold text-[16px] text-blue-600">
                                    {student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                </div>
                            )}
                        </div>
                        
                        {/* Level Badge */}
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-20 flex justify-center">
                            <div 
                                className={`min-w-[32px] h-[16px] px-1 rounded-md flex items-center justify-center text-[8.5px] font-bold tracking-wider shadow-sm border-[2px] transition-colors duration-300 bg-blue-500 text-white ${
                                    student.status.toLowerCase() === 'online' ? 'border-emerald-500 dark:border-emerald-400' : 'border-white dark:border-slate-800'
                                }`}
                            >
                                LV.{student.level || 1}
                            </div>
                        </div>
                    </AnimatedCircularProgressBar>
                </motion.div>
                
                <div className="flex flex-col items-center gap-1.5 overflow-hidden w-full">
                    <p className="text-[14px] leading-tight font-bold text-slate-800 dark:text-slate-200 truncate text-center w-full">{student.name}</p>
                    <div className="flex w-full items-center justify-center gap-1 sm:gap-1.5 overflow-hidden">
                        {student.section && (
                            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 rounded-[4px] text-[8px] sm:text-[8.5px] font-bold tracking-wider uppercase border border-slate-200 dark:border-slate-600 truncate min-w-0 shrink">
                                {student.section}
                            </span>
                        )}
                        <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-[4px] text-[8px] sm:text-[8.5px] font-bold tracking-wider uppercase border border-blue-100 dark:border-blue-800/50 truncate min-w-0 shrink">
                            1ST SEM
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default StudentCard;
