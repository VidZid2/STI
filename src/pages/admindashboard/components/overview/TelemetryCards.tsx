import { Activity, Server } from 'lucide-react';
import type { AdminStats } from '../../../../services/adminService';

const UsersIcon: React.FC<{ size: number }> = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

interface Props { stats: AdminStats; isLoading: boolean; }

const TelemetryCards: React.FC<Props> = ({ stats, isLoading }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-black/5 dark:border-white/5 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-28 h-28 bg-blue-50 dark:bg-blue-900/20 rounded-full blur-2xl group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors" />
            <div className="relative z-10 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Students</h3>
                    <span className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg"><Activity size={14} /></span>
                </div>
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                    {isLoading ? '...' : stats.totalStudents.toLocaleString()}
                </div>
            </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-black/5 dark:border-white/5 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-28 h-28 bg-indigo-50 dark:bg-indigo-900/20 rounded-full blur-2xl group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors" />
            <div className="relative z-10 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Teachers</h3>
                    <span className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg"><UsersIcon size={14} /></span>
                </div>
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                    {isLoading ? '...' : stats.totalTeachers.toLocaleString()}
                </div>
            </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-black/5 dark:border-white/5 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-28 h-28 bg-amber-50 dark:bg-amber-900/20 rounded-full blur-2xl group-hover:bg-amber-100 dark:group-hover:bg-amber-900/30 transition-colors" />
            <div className="relative z-10 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse block" /> Live Users Online
                    </h3>
                    <span className="p-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg"><Activity size={14} /></span>
                </div>
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-baseline gap-2">
                    {isLoading ? '...' : stats.activeSessionsToday}
                    <span className="text-[11px] font-semibold text-amber-600/70 dark:text-amber-400/70 uppercase tracking-widest">Presence</span>
                </div>
            </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-black/5 dark:border-white/5 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-28 h-28 bg-emerald-50 dark:bg-emerald-900/20 rounded-full blur-2xl group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 transition-colors" />
            <div className="relative z-10 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">System Health</h3>
                    <span className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg"><Server size={14} /></span>
                </div>
                <div className={`text-3xl font-bold tracking-tight flex items-center gap-2.5 ${stats?.systemHealth === 'Operational' ? 'text-emerald-500' : 'text-amber-500'}`}>
                    <div className={`w-3 h-3 rounded-full animate-pulse ${stats?.systemHealth === 'Operational' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]'}`} />
                    {isLoading ? '...' : stats.systemHealth}
                </div>
            </div>
        </div>
    </div>
);

export default TelemetryCards;
