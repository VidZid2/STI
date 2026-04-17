import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, BarChart2, Award, Users, Activity, Clock, CheckCircle, Zap } from 'lucide-react';
import { fetchAnalytics, type AnalyticsData, type DateRange } from '../../../services/analyticsService';
import LineChart from './analytics/LineChart';
import BarChart from './analytics/BarChart';
import Histogram from './analytics/Histogram';
import HeatmapGrid from './analytics/HeatmapGrid';
import WorkloadChart from './analytics/WorkloadChart';
import { Shimmer } from './shared/Shimmer';

// ─── KPI Card ────────────────────────────────────────────────────────────────

interface KpiProps {
    label: string;
    value: string | number;
    sub: string;
    icon: React.ElementType;
    color: string;
    bg: string;
}

const KpiCard: React.FC<KpiProps> = ({ label, value, sub, icon: Icon, color, bg }) => (
    <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-black/5 dark:border-white/5 shadow-sm flex items-center gap-4">
        <div className="p-2.5 rounded-xl shrink-0" style={{ background: bg }}>
            <Icon size={18} color={color} />
        </div>
        <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-none">{value}</div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">{label}</div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{sub}</div>
        </div>
    </div>
);

// ─── Chart Card ──────────────────────────────────────────────────────────────

interface ChartCardProps {
    title: string;
    subtitle: string;
    icon: React.ElementType;
    iconColor: string;
    iconBg: string;
    children: React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, subtitle, icon: Icon, iconColor, iconBg, children }) => (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-black/5 dark:border-white/5 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-xl" style={{ background: iconBg }}>
                <Icon size={16} color={iconColor} />
            </div>
            <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-none">{title}</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
            </div>
        </div>
        {children}
    </div>
);

// ─── Skeleton ────────────────────────────────────────────────────────────────

const Skeleton: React.FC = () => (
    <div className="flex flex-col gap-6">
        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-black/5 dark:border-white/5 shadow-sm flex items-center gap-4">
                    <Shimmer className="w-10 h-10 rounded-xl shrink-0" />
                    <div className="flex flex-col gap-2 flex-1">
                        <Shimmer className="h-6 w-16" />
                        <Shimmer className="h-2.5 w-24" />
                        <Shimmer className="h-2 w-20" />
                    </div>
                </div>
            ))}
        </div>
        {/* Chart cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-black/5 dark:border-white/5 shadow-sm flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <Shimmer className="h-8 w-8 rounded-xl" />
                        <div className="flex flex-col gap-1.5">
                            <Shimmer className="h-3 w-32" />
                            <Shimmer className="h-2.5 w-48" />
                        </div>
                    </div>
                    <Shimmer className="h-36 w-full rounded-xl" />
                </div>
            ))}
        </div>
        {/* Heatmap */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-black/5 dark:border-white/5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <Shimmer className="h-8 w-8 rounded-xl" />
                <div className="flex flex-col gap-1.5">
                    <Shimmer className="h-3 w-32" />
                    <Shimmer className="h-2.5 w-48" />
                </div>
            </div>
            <Shimmer className="h-24 w-full rounded-xl" />
        </div>
    </div>
);

// ─── Main Tab ─────────────────────────────────────────────────────────────────

const RANGES: { label: string; value: DateRange }[] = [
    { label: '7 days', value: '7d' },
    { label: '30 days', value: '30d' },
    { label: '90 days', value: '90d' },
    { label: 'All time', value: 'all' },
];

const TabAnalytics: React.FC = () => {
    const [range, setRange] = useState<DateRange>('30d');
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        fetchAnalytics(range).then(d => { setData(d); setIsLoading(false); });
    }, [range]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex flex-col gap-6"
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Platform Analytics</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Real data from your Supabase database</p>
                </div>

                {/* Date range selector */}
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-0.5">
                    {RANGES.map(r => (
                        <button
                            key={r.value}
                            onClick={() => setRange(r.value)}
                            className={`relative px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                                range === r.value
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {isLoading ? (
                    <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Skeleton />
                    </motion.div>
                ) : data ? (
                    <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-6">

                        {/* KPI row */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <KpiCard
                                label="Avg Grade"
                                value={`${data.kpis.avgGrade}%`}
                                sub="AI-graded submissions"
                                icon={Award}
                                color="#10b981"
                                bg="#f0fdf4"
                            />
                            <KpiCard
                                label="Graded Rate"
                                value={`${data.kpis.completionRate}%`}
                                sub="Submissions with scores"
                                icon={CheckCircle}
                                color="#3b82f6"
                                bg="#eff6ff"
                            />
                            <KpiCard
                                label="Active Users"
                                value={`${data.kpis.activeRatio}%`}
                                sub="Logged in this week"
                                icon={Zap}
                                color="#f59e0b"
                                bg="#fffbeb"
                            />
                            <KpiCard
                                label="Submissions"
                                value={data.submissionsByDay.reduce((a, b) => a + b.count, 0)}
                                sub={`In selected range`}
                                icon={Activity}
                                color="#8b5cf6"
                                bg="#f5f3ff"
                            />
                        </div>

                        {/* Charts row 1 */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <ChartCard
                                title="Enrollment Trend"
                                subtitle="New students & teachers over time"
                                icon={TrendingUp}
                                iconColor="#3b82f6"
                                iconBg="#eff6ff"
                            >
                                <LineChart data={data.enrollmentTrend} />
                            </ChartCard>

                            <ChartCard
                                title="Submissions by Day"
                                subtitle="Which days students submit most"
                                icon={BarChart2}
                                iconColor="#10b981"
                                iconBg="#f0fdf4"
                            >
                                <BarChart data={data.submissionsByDay} color="#10b981" />
                            </ChartCard>
                        </div>

                        {/* Charts row 2 */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <ChartCard
                                title="Grade Distribution"
                                subtitle="AI score buckets across all submissions"
                                icon={Award}
                                iconColor="#f59e0b"
                                iconBg="#fffbeb"
                            >
                                <Histogram data={data.gradeDistribution} />
                            </ChartCard>

                            <ChartCard
                                title="Teacher Workload"
                                subtitle="Assignments created vs. submissions graded"
                                icon={Users}
                                iconColor="#8b5cf6"
                                iconBg="#f5f3ff"
                            >
                                <WorkloadChart data={data.teacherWorkload} />
                            </ChartCard>
                        </div>

                        {/* Heatmap — full width */}
                        <ChartCard
                            title="Activity Heatmap"
                            subtitle="Login frequency by hour and day of week"
                            icon={Clock}
                            iconColor="#ef4444"
                            iconBg="#fef2f2"
                        >
                            <HeatmapGrid data={data.activityHeatmap} />
                        </ChartCard>

                    </motion.div>
                ) : null}
            </AnimatePresence>
        </motion.div>
    );
};

export default TabAnalytics;
