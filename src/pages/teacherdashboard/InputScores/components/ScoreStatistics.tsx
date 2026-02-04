/**
 * Score Statistics Component - Philippine Grading System
 */

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
    calculateClassStatistics, 
    getGradeColor,
    type GradingSystem 
} from '../../../../lib/grading/philippineGrading';
import type { ExamScore } from '../types';

interface ScoreStatisticsProps {
    scores: ExamScore[];
    maxScore: number;
    gradingSystem?: GradingSystem;
}

export const ScoreStatistics: React.FC<ScoreStatisticsProps> = ({ 
    scores, 
    maxScore, 
    gradingSystem = 'sti' 
}) => {
    const stats = useMemo(() => {
        const validScores = scores.filter(s => s.score !== null && !s.isAbsent).map(s => s.score as number);
        
        if (validScores.length === 0) {
            return { 
                avg: 0, 
                highest: 0, 
                lowest: 0, 
                passing: 0, 
                entered: 0, 
                total: scores.length,
                avgTransmuted: 0,
                avgGPA: 0,
                passingRate: 0,
                gradeDistribution: {},
            };
        }

        const classStats = calculateClassStatistics(validScores, maxScore, gradingSystem);

        return {
            avg: classStats.average,
            highest: classStats.highest,
            lowest: classStats.lowest,
            passing: classStats.passingCount,
            entered: classStats.count,
            total: scores.length,
            avgTransmuted: classStats.averageTransmuted,
            avgGPA: classStats.averageGradePoint,
            passingRate: classStats.passingRate,
            gradeDistribution: classStats.gradeDistribution,
        };
    }, [scores, maxScore, gradingSystem]);

    const progressPercent = stats.total > 0 ? (stats.entered / stats.total) * 100 : 0;
    const avgGradeColor = getGradeColor(stats.avgTransmuted);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.06) 0%, rgba(59, 130, 246, 0.02) 100%)',
                borderRadius: '14px',
                padding: '16px 20px',
                border: '1px solid rgba(59, 130, 246, 0.12)',
            }}
        >
            {/* Entry Progress */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Entry Progress</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#3b82f6' }}>{stats.entered}/{stats.total}</span>
            </div>
            
            <div style={{ height: '6px', background: 'rgba(0,0,0,0.06)', borderRadius: '3px', overflow: 'hidden', marginBottom: '16px' }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    style={{ height: '100%', background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)', borderRadius: '3px' }}
                />
            </div>

            {/* Raw Score Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
                {[
                    { label: 'Raw Avg', value: stats.avg, color: '#3b82f6' },
                    { label: 'Highest', value: stats.highest, color: '#10b981' },
                    { label: 'Lowest', value: stats.lowest || '-', color: '#ef4444' },
                    { label: 'Passing', value: `${stats.passing}/${stats.entered}`, color: '#10b981' },
                ].map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        style={{ textAlign: 'center' }}
                    >
                        <div style={{ fontSize: '18px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>{stat.label}</div>
                    </motion.div>
                ))}
            </div>

            {/* Philippine Grading Stats */}
            {stats.entered > 0 && (
                <>
                    <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)', margin: '12px 0' }} />
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                            <path d="M6 12v5c3 3 9 3 12 0v-5" />
                        </svg>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Philippine Grading ({gradingSystem.toUpperCase()})
                        </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{ 
                                textAlign: 'center',
                                padding: '10px 8px',
                                borderRadius: '10px',
                                background: `${avgGradeColor}10`,
                                border: `1px solid ${avgGradeColor}20`,
                            }}
                        >
                            <div style={{ fontSize: '20px', fontWeight: 700, color: avgGradeColor }}>
                                {stats.avgTransmuted}
                            </div>
                            <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px', fontWeight: 500 }}>
                                TRANSMUTED
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.05 }}
                            style={{ 
                                textAlign: 'center',
                                padding: '10px 8px',
                                borderRadius: '10px',
                                background: 'rgba(139, 92, 246, 0.08)',
                                border: '1px solid rgba(139, 92, 246, 0.15)',
                            }}
                        >
                            <div style={{ fontSize: '20px', fontWeight: 700, color: '#8b5cf6' }}>
                                {stats.avgGPA.toFixed(2)}
                            </div>
                            <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px', fontWeight: 500 }}>
                                AVG GPA
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                            style={{ 
                                textAlign: 'center',
                                padding: '10px 8px',
                                borderRadius: '10px',
                                background: stats.passingRate >= 75 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                                border: `1px solid ${stats.passingRate >= 75 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}`,
                            }}
                        >
                            <div style={{ 
                                fontSize: '20px', 
                                fontWeight: 700, 
                                color: stats.passingRate >= 75 ? '#10b981' : '#ef4444',
                            }}>
                                {stats.passingRate}%
                            </div>
                            <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px', fontWeight: 500 }}>
                                PASS RATE
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.15 }}
                            style={{ 
                                textAlign: 'center',
                                padding: '10px 8px',
                                borderRadius: '10px',
                                background: 'rgba(245, 158, 11, 0.08)',
                                border: '1px solid rgba(245, 158, 11, 0.15)',
                            }}
                        >
                            <div style={{ fontSize: '20px', fontWeight: 700, color: '#f59e0b' }}>
                                {stats.total - stats.entered}
                            </div>
                            <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px', fontWeight: 500 }}>
                                PENDING
                            </div>
                        </motion.div>
                    </div>

                    {/* Grade Distribution */}
                    {Object.keys(stats.gradeDistribution).length > 0 && (
                        <div style={{ marginTop: '12px' }}>
                            <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '6px', fontWeight: 500 }}>
                                Grade Distribution
                            </div>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {Object.entries(stats.gradeDistribution).map(([descriptor, count]) => (
                                    <span
                                        key={descriptor}
                                        style={{
                                            padding: '3px 8px',
                                            borderRadius: '6px',
                                            background: 'rgba(0,0,0,0.04)',
                                            fontSize: '11px',
                                            fontWeight: 500,
                                            color: '#64748b',
                                        }}
                                    >
                                        {descriptor}: <span style={{ fontWeight: 700, color: '#334155' }}>{count}</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </motion.div>
    );
};

export default ScoreStatistics;
