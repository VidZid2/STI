import React, { useState } from 'react';
import type { HeatmapCell } from '../../../../services/analyticsService';

interface Props { data: HeatmapCell[]; }

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOUR_LABELS = ['12a','2a','4a','6a','8a','10a','12p','2p','4p','6p','8p','10p'];

const HeatmapGrid: React.FC<Props> = ({ data }) => {
    const [tooltip, setTooltip] = useState<{ day: number; hour: number; count: number; x: number; y: number } | null>(null);

    if (!data.length) return <div className="flex items-center justify-center h-36 text-xs text-slate-400">No activity data</div>;

    const maxCount = Math.max(...data.map(d => d.count), 1);
    const cellW = 14;
    const cellH = 12;
    const labelW = 28;
    const labelH = 16;
    const totalW = labelW + 24 * cellW;
    const totalH = labelH + 7 * cellH;

    const opacity = (count: number) => count === 0 ? 0.04 : 0.15 + (count / maxCount) * 0.85;

    return (
        <div className="relative overflow-x-auto">
            <svg viewBox={`0 0 ${totalW} ${totalH}`} className="w-full min-w-[340px]">
                {/* Hour labels */}
                {HOUR_LABELS.map((label, i) => (
                    <text key={i} x={labelW + i * cellW * 2 + cellW} y={labelH - 3} textAnchor="middle" fontSize="7" fill="#94a3b8">{label}</text>
                ))}

                {/* Day labels + cells */}
                {DAYS.map((day, dayIdx) => (
                    <g key={dayIdx}>
                        <text x={labelW - 4} y={labelH + dayIdx * cellH + cellH * 0.7} textAnchor="end" fontSize="8" fill="#94a3b8">{day}</text>
                        {Array.from({ length: 24 }, (_, hour) => {
                            const cell = data.find(d => d.day === dayIdx && d.hour === hour);
                            const count = cell?.count || 0;
                            const x = labelW + hour * cellW;
                            const y = labelH + dayIdx * cellH;
                            return (
                                <rect
                                    key={hour}
                                    x={x + 1} y={y + 1}
                                    width={cellW - 2} height={cellH - 2}
                                    rx="2"
                                    fill="#3b82f6"
                                    fillOpacity={opacity(count)}
                                    style={{ cursor: count > 0 ? 'pointer' : 'default' }}
                                    onMouseEnter={e => count > 0 && setTooltip({ day: dayIdx, hour, count, x: x + cellW / 2, y })}
                                    onMouseLeave={() => setTooltip(null)}
                                />
                            );
                        })}
                    </g>
                ))}

                {/* Tooltip */}
                {tooltip && (
                    <g>
                        <rect x={tooltip.x - 36} y={tooltip.y - 26} width={72} height={22} rx="5" fill="#1e293b" />
                        <text x={tooltip.x} y={tooltip.y - 14} textAnchor="middle" fontSize="8" fill="#94a3b8">
                            {DAYS[tooltip.day]} {tooltip.hour}:00
                        </text>
                        <text x={tooltip.x} y={tooltip.y - 5} textAnchor="middle" fontSize="9" fill="white" fontWeight="600">
                            {tooltip.count} login{tooltip.count !== 1 ? 's' : ''}
                        </text>
                    </g>
                )}
            </svg>

            {/* Legend */}
            <div className="flex items-center gap-2 mt-1 justify-end">
                <span className="text-[10px] text-slate-400">Less</span>
                {[0.04, 0.25, 0.5, 0.75, 1].map((o, i) => (
                    <div key={i} className="w-3 h-3 rounded-sm" style={{ background: `rgba(59,130,246,${o})` }} />
                ))}
                <span className="text-[10px] text-slate-400">More</span>
            </div>
        </div>
    );
};

export default HeatmapGrid;
