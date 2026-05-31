import React from 'react';
import { BarChart as MuiBarChart } from '@mui/x-charts/BarChart';
import type { GradeRange } from '../../../../services/analyticsService';

interface Props { data: GradeRange[]; }

const Histogram: React.FC<Props> = ({ data }) => {
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-44 text-xs text-slate-400">No grade data</div>;
    }

    const xAxisData = data.map(d => d.range);
    const seriesData = data.map(d => d.count);

    return (
        <div style={{ width: '100%', height: '220px' }} className="mt-2">
            <MuiBarChart
                xAxis={[{ 
                    scaleType: 'band', 
                    data: xAxisData,
                    categoryGapRatio: 0.15, // Small gap to emulate a histogram
                    tickLabelStyle: { fontSize: 10, fill: '#64748b', fontWeight: 500 }
                }]}
                yAxis={[{
                    tickLabelStyle: { fontSize: 10, fill: '#64748b', fontWeight: 500 }
                }]}
                series={[{ 
                    data: seriesData, 
                    color: '#f59e0b' 
                }]}
                margin={{ left: 30, right: 10, top: 20, bottom: 25 }}
                borderRadius={2}
                sx={{
                    '.MuiChartsAxis-line': { stroke: '#e2e8f0' },
                    '.MuiChartsAxis-tick': { stroke: '#e2e8f0' },
                }}
            />
        </div>
    );
};

export default Histogram;
