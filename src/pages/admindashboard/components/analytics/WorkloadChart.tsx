import React, { useState } from 'react';
import { motion } from 'motion/react';
import type { TeacherWorkload } from '../../../../services/analyticsService';

interface Props { data: TeacherWorkload[]; }

const WorkloadChart: React.FC<Props> = ({ data }) => {
    const [hovered, setHovered] = useState<number | null>(null);

    if (!data.length) return <div className="flex items-center justify-center h-36 text-xs text-slate-400">No teacher data</div>;

    const maxVal = Math.max(...data.flatMap(d => [d.assignments, d.submissions]), 1);
    const rowH = 28;
    const labelW = 64;
    const barAreaW = 260;
    const totalH = data.length * rowH + 20;

    const barW = (v: number) => (v / maxVal) * barAreaW;

    return (
        <div className="overflow-x-auto">
            <svg viewBox={`0 0 ${labelW + barAreaW + 60} ${totalH}`} className="w-full min-w-[320px]">
                {data.map((t, i) => {
                    const y = i * rowH + 10;
                    const isHov = hovered === i;
                    return (
                        <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ cursor: 'pointer' }}>
                            {/* Name */}
                            <text x={labelW - 6} y={y + 9} textAnchor="end" fontSize="10" fill={isHov ? '#0f172a' : '#64748b'} fontWeight={isHov ? '600' : '400'}>
                                {t.name.length > 10 ? t.name.slice(0, 10) + '…' : t.name}
                            </text>

                            {/* Assignments bar */}
                            <motion.rect x={labelW} y={y} width={barW(t.assignments)} height={10} rx="3"
                                fill="#3b82f6" fillOpacity={isHov ? 1 : 0.75}
                                initial={{ width: 0 }} animate={{ width: barW(t.assignments) }}
                                transition={{ duration: 0.6, delay: i * 0.05, ease: 'easeOut' }}
                            />

                            {/* Submissions bar */}
                            <motion.rect x={labelW} y={y + 12} width={barW(t.submissions)} height={10} rx="3"
                                fill="#8b5cf6" fillOpacity={isHov ? 1 : 0.75}
                                initial={{ width: 0 }} animate={{ width: barW(t.submissions) }}
                                transition={{ duration: 0.6, delay: i * 0.05 + 0.05, ease: 'easeOut' }}
                            />

                            {/* Value labels */}
                            {isHov && (
                                <>
                                    <text x={labelW + barW(t.assignments) + 4} y={y + 9} fontSize="9" fill="#3b82f6">{t.assignments}</text>
                                    <text x={labelW + barW(t.submissions) + 4} y={y + 21} fontSize="9" fill="#8b5cf6">{t.submissions}</text>
                                </>
                            )}
                        </g>
                    );
                })}
            </svg>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-1 justify-end">
                <span className="flex items-center gap-1.5 text-[11px] text-slate-500"><span className="w-3 h-0.5 bg-blue-500 rounded inline-block" />Assignments</span>
                <span className="flex items-center gap-1.5 text-[11px] text-slate-500"><span className="w-3 h-0.5 bg-violet-500 rounded inline-block" />Graded</span>
            </div>
        </div>
    );
};

export default WorkloadChart;
