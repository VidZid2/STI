import * as React from 'react';
import { motion } from 'motion/react';
import type { GradePrediction } from '../types';

interface GradePredictorWidgetProps {
    gradePredictor: GradePrediction;
    compactMode: boolean;
    onClose: () => void;
}

export const GradePredictorWidget = React.memo<GradePredictorWidgetProps>(({
    gradePredictor,
    compactMode,
    onClose,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
            className={`bg-white rounded-xl border border-zinc-100/80 overflow-hidden ${compactMode ? 'shadow-none' : 'shadow-sm'}`}
            id="grade-predictor-widget"
        >
            {/* Header */}
            <div className={`flex items-center justify-between ${compactMode ? 'px-3 py-2' : 'px-4 py-3'}`}>
                <div className="flex items-center gap-2">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className={`rounded-lg bg-gradient-to-br from-emerald-50 to-teal-100/50 flex items-center justify-center ${compactMode ? 'w-6 h-6' : 'w-8 h-8'}`}
                    >
                        <svg className={`text-emerald-500 ${compactMode ? 'w-3 h-3' : 'w-4 h-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </motion.div>
                    <span className={`font-medium text-zinc-700 ${compactMode ? 'text-xs' : 'text-sm'}`}>Grade Predictor</span>
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.2 }}
                        className={`px-1.5 py-0.5 rounded-full ${gradePredictor.confidence >= 70 ? 'bg-emerald-100 text-emerald-600' :
                                gradePredictor.confidence >= 40 ? 'bg-amber-100 text-amber-600' :
                                    'bg-zinc-100 text-zinc-500'
                            } ${compactMode ? 'text-[8px]' : 'text-[9px]'}`}
                    >
                        {gradePredictor.confidence}% confident
                    </motion.span>
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

            {/* Grade Display */}
            <div className={`${compactMode ? 'px-3 pb-3' : 'px-4 pb-4'}`}>
                {/* Main Grade Circle */}
                <div className="flex items-center gap-4 mb-3">
                    <div className="relative">
                        <svg className={`transform -rotate-90 ${compactMode ? 'w-14 h-14' : 'w-16 h-16'}`}>
                            {/* Background circle */}
                            <circle
                                cx="50%"
                                cy="50%"
                                r={compactMode ? 24 : 28}
                                fill="none"
                                stroke="#e5e7eb"
                                strokeWidth={compactMode ? 4 : 5}
                            />
                            {/* Progress circle */}
                            <motion.circle
                                cx="50%"
                                cy="50%"
                                r={compactMode ? 24 : 28}
                                fill="none"
                                stroke={
                                    gradePredictor.predictedGrade >= 85 ? '#10b981' :
                                        gradePredictor.predictedGrade >= 75 ? '#3b82f6' :
                                            gradePredictor.predictedGrade >= 60 ? '#f59e0b' : '#ef4444'
                                }
                                strokeWidth={compactMode ? 4 : 5}
                                strokeLinecap="round"
                                initial={{ strokeDasharray: `0 ${2 * Math.PI * (compactMode ? 24 : 28)}` }}
                                animate={{
                                    strokeDasharray: `${(gradePredictor.predictedGrade / 100) * 2 * Math.PI * (compactMode ? 24 : 28)} ${2 * Math.PI * (compactMode ? 24 : 28)}`
                                }}
                                transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                            />
                        </svg>
                        {/* Grade text in center */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <motion.span
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5, type: 'spring' }}
                                className={`font-bold ${gradePredictor.predictedGrade >= 85 ? 'text-emerald-600' :
                                        gradePredictor.predictedGrade >= 75 ? 'text-blue-600' :
                                            gradePredictor.predictedGrade >= 60 ? 'text-amber-600' : 'text-red-500'
                                    } ${compactMode ? 'text-sm' : 'text-base'}`}
                            >
                                {gradePredictor.letterGrade}
                            </motion.span>
                        </div>
                    </div>

                    {/* Grade Details */}
                    <div className="flex-1">
                        <div className="flex items-baseline gap-1.5 mb-1">
                            <motion.span
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className={`font-bold ${gradePredictor.predictedGrade >= 85 ? 'text-emerald-600' :
                                        gradePredictor.predictedGrade >= 75 ? 'text-blue-600' :
                                            gradePredictor.predictedGrade >= 60 ? 'text-amber-600' : 'text-red-500'
                                    } ${compactMode ? 'text-xl' : 'text-2xl'}`}
                            >
                                {gradePredictor.predictedGrade}%
                            </motion.span>
                            <span className={`text-zinc-400 ${compactMode ? 'text-[9px]' : 'text-[10px]'}`}>predicted</span>
                        </div>
                        <p className={`text-zinc-500 ${compactMode ? 'text-[9px]' : 'text-[10px]'}`}>
                            {gradePredictor.predictedGrade >= 85 ? 'Excellent performance!' :
                                gradePredictor.predictedGrade >= 75 ? 'Good progress, keep it up!' :
                                    gradePredictor.predictedGrade >= 60 ? 'Room for improvement' : 'Needs attention'}
                        </p>
                    </div>
                </div>

                {/* Top Contributing Courses */}
                {gradePredictor.breakdown.length > 0 && (
                    <div className="border-t border-zinc-100 pt-2">
                        <p className={`text-zinc-400 mb-2 ${compactMode ? 'text-[8px]' : 'text-[9px]'}`}>
                            Top contributors
                        </p>
                        <div className="space-y-1.5">
                            {gradePredictor.breakdown.map((course: any, index: number) => (
                                <motion.div
                                    key={course.name}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + index * 0.1 }}
                                    className="flex items-center gap-2"
                                >
                                    <div className={`flex-1 rounded-full overflow-hidden bg-zinc-100 ${compactMode ? 'h-1' : 'h-1.5'}`}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${course.progress}%` }}
                                            transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                                            className={`h-full rounded-full ${course.progress >= 80 ? 'bg-emerald-500' :
                                                    course.progress >= 50 ? 'bg-blue-500' :
                                                        course.progress >= 20 ? 'bg-amber-500' : 'bg-zinc-300'
                                                }`}
                                        />
                                    </div>
                                    <span className={`text-zinc-600 truncate ${compactMode ? 'text-[8px] w-16' : 'text-[9px] w-20'}`}>
                                        {course.name.split(' ').slice(0, 2).join(' ')}
                                    </span>
                                    <span className={`font-medium ${course.progress >= 80 ? 'text-emerald-600' :
                                            course.progress >= 50 ? 'text-blue-600' :
                                                course.progress >= 20 ? 'text-amber-600' : 'text-zinc-500'
                                        } ${compactMode ? 'text-[8px]' : 'text-[9px]'}`}>
                                        {course.progress}%
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
});

GradePredictorWidget.displayName = 'GradePredictorWidget';

export default GradePredictorWidget;
