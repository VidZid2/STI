import React from 'react';
import { BarChart as MuiBarChart } from '@mui/x-charts/BarChart';
import type { TeacherWorkload } from '../../../../services/analyticsService';

interface Props { data: TeacherWorkload[]; }

const WorkloadChart: React.FC<Props> = ({ data }) => {
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-44 text-xs text-slate-400">No teacher data</div>;
    }

    const xAxisData = data.map(d => {
        const parts = d.name.split(' ');
        if (parts.length > 1) {
            return `${parts[0]} ${parts[1][0]}.`;
        }
        return d.name;
    });
    
    const assignmentsData = data.map(d => d.assignments);
    const submissionsData = data.map(d => d.submissions);

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
                series={[
                    { 
                        id: 'Assignments',
                        data: assignmentsData, 
                        label: 'Assignments',
                        color: '#6366f1'
                    },
                    {
                        id: 'Graded',
                        data: submissionsData,
                        label: 'Graded',
                        color: '#c084fc'
                    }
                ]}
                margin={{ left: 30, right: 10, top: 20, bottom: 45 }}
                borderRadius={3}
                slotProps={{
                    legend: {
                        position: { vertical: 'bottom', horizontal: 'center' }
                    }
                }}
                sx={{
                    '.MuiChartsLegend-series text': { fontSize: '11px !important', fontWeight: '600 !important', fill: '#64748b !important' },
                    '.MuiChartsAxis-line': { stroke: '#e2e8f0' },
                    '.MuiChartsAxis-tick': { stroke: '#e2e8f0' },
                }}
            />
        </div>
    );
};

export default WorkloadChart;
