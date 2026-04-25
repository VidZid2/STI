import React, { useState } from 'react';
import { motion } from 'motion/react';
import type { EnrollmentPoint } from '../../../../services/analyticsService';

interface Props { data: EnrollmentPoint[]; }

const W = 480; const H = 160; const PAD = { t: 16, r: 16, b: 32, l: 36 };
const IW = W - PAD.l - PAD.r;
const IH = H - PAD.t - PAD.b;

const LineChart: React.FC<Props> = ({ data }) => {
    const [tooltip, setTooltip] = useState<{ x: number; y: number; d: EnrollmentPoint } | null>(null);

    if (!data.length) return <div className="flex items-center justify-center h-40 text-xs text-slate-400">No enrollment data</div>;

    const maxVal = Math.max(...data.flatMap(d => [d.students, d.teachers]), 1);
    const xStep = IW / Math.max(data.length - 1, 1);

    const px = (i: number) => PAD.l + i * xStep;
    const py = (v: number) => PAD.t + IH - (v / maxVal) * IH;

    const pathFor = (key: 'students' | 'teachers') =>
        data.map((d, i) => `${i === 0 ? 'M' : 'L'}${px(i).toFixed(1)},${py(d[key]).toFixed(1)}`).join(' ');

    const areaFor = (key: 'students' | 'teachers') => {
        const line = pathFor(key);
        return `${line} L${px(data.length - 1).toFixed(1)},${(PAD.t + IH).toFixed(1)} L${PAD.l},${(PAD.t + IH).toFixed(1)} Z`;
    };

    // Y-axis ticks
    const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(f * maxVal));

    return (
        <div className="relative">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: 'visible' }}>
                {/* Grid lines */}
                {ticks.map(t => (
                    <g key={t}>
                        <line x1={PAD.l} x2={W - PAD.r} y1={py(t)} y2={py(t)} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 3" />
                        <text x={PAD.l - 6} y={py(t) + 4} textAnchor="end" fontSize="9" fill="#94a3b8">{t}</text>
                    </g>
                ))}

                {/* Area fills */}
                <motion.path d={areaFor('students')} fill="#3b82f6" fillOpacity="0.08" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} />
                <motion.path d={areaFor('teachers')} fill="#8b5cf6" fillOpacity="0.08" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.1 }} />

                {/* Lines */}
                <motion.path d={pathFor('students')} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, ease: 'easeOut' }} />
                <motion.path d={pathFor('teachers')} fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.1, ease: 'easeOut' }} />

                {/* Dots + hover targets */}
                {data.map((d, i) => (
                    <g key={i}>
                        <circle cx={px(i)} cy={py(d.students)} r="3" fill="#3b82f6" />
                        <circle cx={px(i)} cy={py(d.teachers)} r="3" fill="#8b5cf6" />
                        {/* Invisible hover target */}
                        <rect
                            x={px(i) - xStep / 2} y={PAD.t} width={xStep} height={IH}
                            fill="transparent"
                            onMouseEnter={_e => setTooltip({ x: px(i), y: Math.min(py(d.students), py(d.teachers)) - 8, d })}
                            onMouseLeave={() => setTooltip(null)}
                        />
                    </g>
                ))}

                {/* X-axis labels — show every nth */}
                {data.map((d, i) => {
                    const step = Math.max(1, Math.floor(data.length / 6));
                    if (i % step !== 0 && i !== data.length - 1) return null;
                    return (
                        <text key={i} x={px(i)} y={H - 4} textAnchor="middle" fontSize="9" fill="#94a3b8">
                            {d.date.slice(5)}
                        </text>
                    );
                })}

                {/* Tooltip */}
                {tooltip && (
                    <g>
                        <rect x={tooltip.x - 44} y={tooltip.y - 36} width={88} height={34} rx="6" fill="#1e293b" />
                        <text x={tooltip.x} y={tooltip.y - 22} textAnchor="middle" fontSize="9" fill="#94a3b8">{tooltip.d.date}</text>
                        <text x={tooltip.x} y={tooltip.y - 10} textAnchor="middle" fontSize="9" fill="white">
                            S:{tooltip.d.students} T:{tooltip.d.teachers}
                        </text>
                    </g>
                )}
            </svg>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-1 justify-end">
                <span className="flex items-center gap-1.5 text-[11px] text-slate-500"><span className="w-3 h-0.5 bg-blue-500 rounded inline-block" />Students</span>
                <span className="flex items-center gap-1.5 text-[11px] text-slate-500"><span className="w-3 h-0.5 bg-violet-500 rounded inline-block" />Teachers</span>
            </div>
        </div>
    );
};

export default LineChart;
