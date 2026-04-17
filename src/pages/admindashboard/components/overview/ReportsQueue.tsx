import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { AdminReport } from '../../../../services/adminService';
import { updateReportStatus } from '../../../../services/adminService';

const PRIORITY_CONFIG: Record<string, { icon: string }> = {
    urgent: { icon: '🔴' },
    high:   { icon: '🟠' },
    medium: { icon: '🔵' },
    low:    { icon: '🟢' },
};

interface Props {
    reports: AdminReport[];
    setReports: React.Dispatch<React.SetStateAction<AdminReport[]>>;
    isLoading: boolean;
}

const ReportsQueue: React.FC<Props> = ({ reports, setReports, isLoading }) => {
    const formatRelative = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const handleResolve = async (reportId: string, status: 'resolved' | 'dismissed') => {
        const success = await updateReportStatus(reportId, status);
        if (success) setReports(prev => prev.filter(r => r.id !== reportId));
    };

    return (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-black/5 dark:border-white/5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-xl"><AlertTriangle size={18} /></div>
                    <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-none">Support Queue</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Pending teacher reports</p>
                    </div>
                </div>
                {reports.length > 0 && (
                    <span className="px-2.5 py-1 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 text-xs font-bold rounded-lg">{reports.length} Open</span>
                )}
            </div>

            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                {reports.length === 0 && !isLoading && (
                    <div className="text-center py-8">
                        <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-3" />
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">All clear!</p>
                        <p className="text-xs text-slate-400 mt-1">No pending reports from teachers.</p>
                    </div>
                )}
                {reports.map((report) => {
                    const pri = PRIORITY_CONFIG[report.priority] || PRIORITY_CONFIG.medium;
                    return (
                        <motion.div
                            key={report.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, height: 0 }}
                            className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-700/30 hover:bg-white dark:hover:bg-slate-700/60 transition-all group"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs">{pri.icon}</span>
                                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{report.title}</span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                        {report.reporter_name} · {report.category} · {formatRelative(report.created_at)}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleResolve(report.id, 'resolved')} className="px-2.5 py-1.5 text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors">Resolve</button>
                                    <button onClick={() => handleResolve(report.id, 'dismissed')} className="px-2.5 py-1.5 text-[11px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Dismiss</button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default ReportsQueue;
