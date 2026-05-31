import React from 'react';
import { BarChart as MuiBarChart } from '@mui/x-charts/BarChart';
import type { SubmissionByDay } from '../../../../services/analyticsService';

interface Props { data: SubmissionByDay[]; color?: string; }

const BarChart: React.FC<Props> = ({ data, color = '#10b981' }) => {
    const ALL_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayMap = new Map(data.map(d => [d.day, d.count]));
    const normalizedData = ALL_DAYS.map(day => ({ day, count: dayMap.get(day) ?? 0 }));

    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-44 text-xs text-slate-400">No submission data</div>;
    }

    const xAxisData = normalizedData.map(d => d.day);
    const seriesData = normalizedData.map(d => d.count);

    return (
        <div style={{ width: '100%', height: '220px' }} className="mt-2">
            <MuiBarChart
                xAxis={[{ 
                    scaleType: 'band', 
                    data: xAxisData,
                    categoryGapRatio: 0.4,
                    tickLabelStyle: { fontSize: 10, fill: '#64748b', fontWeight: 500 }
                }]}
                yAxis={[{
                    tickLabelStyle: { fontSize: 10, fill: '#64748b', fontWeight: 500 }
                }]}
                series={[{ 
                    data: seriesData, 
                    color: color 
                }]}
                margin={{ left: 30, right: 10, top: 20, bottom: 25 }}
                borderRadius={4}
                sx={{
                    '.MuiChartsAxis-line': { stroke: '#e2e8f0' },
                    '.MuiChartsAxis-tick': { stroke: '#e2e8f0' },
                }}
            />
        </div>
    );
};

export default BarChart;
