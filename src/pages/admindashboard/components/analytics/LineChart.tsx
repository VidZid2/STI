import React from 'react';
import { LineChart as MuiLineChart } from '@mui/x-charts/LineChart';
import type { EnrollmentPoint } from '../../../../services/analyticsService';

interface Props { data: EnrollmentPoint[]; }

const LineChart: React.FC<Props> = ({ data }) => {
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-44 text-xs text-slate-400">No data</div>;
    }

    const xAxisData = data.map(d => d.date);
    const studentsData = data.map(d => d.students);
    const teachersData = data.map(d => d.teachers);

    return (
        <div style={{ width: '100%', height: '220px' }} className="mt-2">
            <MuiLineChart
                xAxis={[{ 
                    data: xAxisData, 
                    scaleType: 'point',
                    tickLabelStyle: { fontSize: 10, fill: '#64748b', fontWeight: 500 }
                }]}
                yAxis={[{
                    tickLabelStyle: { fontSize: 10, fill: '#64748b', fontWeight: 500 }
                }]}
                series={[
                    {
                        id: 'Students',
                        data: studentsData,
                        label: 'Students',
                        color: '#3b82f6',
                        area: true,
                        showMark: false,
                    },
                    {
                        id: 'Teachers',
                        data: teachersData,
                        label: 'Teachers',
                        color: '#8b5cf6',
                        area: true,
                        showMark: false,
                    }
                ]}
                margin={{ left: 30, right: 10, top: 20, bottom: 40 }}
                slotProps={{
                    legend: {
                        position: { vertical: 'bottom', horizontal: 'center' }
                    }
                }}
                sx={{
                    '.MuiChartsLegend-series text': { fontSize: '11px !important', fontWeight: '600 !important', fill: '#64748b !important' },
                    '.MuiLineElement-root': { strokeWidth: 2.5 },
                    '.MuiAreaElement-series-Students': { fillOpacity: 0.15 },
                    '.MuiAreaElement-series-Teachers': { fillOpacity: 0.15 },
                    '.MuiChartsAxis-line': { stroke: '#e2e8f0' },
                    '.MuiChartsAxis-tick': { stroke: '#e2e8f0' },
                }}
            />
        </div>
    );
};

export default LineChart;
