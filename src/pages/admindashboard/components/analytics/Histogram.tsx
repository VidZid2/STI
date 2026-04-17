import React, { useState } from 'react';
import { motion } from 'motion/react';
import type { GradeRange } from '../../../../services/analyticsService';

interface Props { data: GradeRange[]; }

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'];
const W = 320; const H = 140; const PAD = { t: 12, r: 12, b: 28, l: 32 };
const IW = W - PAD.l - PAD.r;
const IH = H - PAD.t - PAD.b;

const Histogram: React.FC<Props> = ({ data }) => {
    const [hovered, setHovered] = useState<number | null>(null);
    if (!data.length) return <div className="flex items-center justify-center h-36 text-xs text-slate-400">No grade data</div>;

    const maxVal = Math.max(...data.map(d => d.count), 1);
    const barW = (IW / data.length) * 0.7;
    const gap = IW / data.length;

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
            {[0, 0.5, 1].map(f => {
                const y = PAD.t + IH - f * IH;
                return (
                    <g key={f}>
                        <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
                        <text x={PAD.l - 4} y={y + 3} textAnchor="end" fontSize="8" fill="#94a3b8">{Math.round(f * maxVal)}</text>
                    </g>
                );
            })}

            {data.map((d, i) => {
                const barH = (d.count / maxVal) * IH;
                const x = PAD.l + i * gap + (gap - barW) / 2;
                const y = PAD.t + IH - barH;
                const isHov = hovered === i;
                return (
                    <g key={i}>
                        <motion.rect
                            x={x} y={y} width={barW} height={barH} rx="3"
                            fill={COLORS[i % COLORS.length]}
                            fillOpacity={isHov ? 1 : 0.8}
                            initial={{ height: 0, y: PAD.t + IH }}
                            animate={{ height: barH, y }}
                            transition={{ duration: 0.5, delay: i * 0.07, ease: 'easeOut' }}
                            onMouseEnter={() => setHovered(i)}
                            onMouseLeave={() => setHovered(null)}
                            style={{ cursor: 'pointer' }}
                        />
                        {isHov && (
                            <g>
                                <rect x={x + barW / 2 - 16} y={y - 20} width={32} height={16} rx="4" fill="#1e293b" />
                                <text x={x + barW / 2} y={y - 9} textAnchor="middle" fontSize="9" fill="white">{d.count}</text>
                            </g>
                        )}
                        <text x={x + barW / 2} y={H - 6} textAnchor="middle" fontSize="8" fill="#94a3b8">{d.range}</text>
                    </g>
                );
            })}
        </svg>
    );
};

export default Histogram;
