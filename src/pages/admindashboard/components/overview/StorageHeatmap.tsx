import { motion } from 'motion/react';
import { Database, HardDrive, Zap, AlertTriangle } from 'lucide-react';
import type { AdminStats } from '../../../../services/adminService';

interface Props { stats: AdminStats; isLoading: boolean; }

const StorageHeatmap: React.FC<Props> = ({ stats, isLoading }) => {
    const formatBytes = (bytes: number) => {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-black/5 dark:border-white/5 shadow-sm flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-xl"><Database size={18} /></div>
                <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-none">Supabase Quotas</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Database, Object Storage & Heavy Hitters</p>
                </div>
            </div>

            {/* DB Storage bar */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <HardDrive size={14} className="text-slate-400" /> Relational DB Storage
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {isLoading ? '...' : `${formatBytes(stats?.storageDbBytes)} (est.)`} / 500 MB
                    </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(((stats?.storageDbBytes || 0) / 524288000) * 100, 100)}%` }} transition={{ duration: 1 }} className="h-full bg-blue-500 rounded-full" />
                </div>
            </div>

            {/* Object Storage bar */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Zap size={14} className="text-slate-400" /> Object Storage (PDFs/Images)
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {isLoading ? '...' : `${formatBytes(stats?.storageObjectBytes)} (est.)`} / 5 GB
                    </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(((stats?.storageObjectBytes || 0) / 5368709120) * 100, 100)}%` }} transition={{ duration: 1, delay: 0.2 }} className="h-full bg-emerald-500 rounded-full" />
                </div>
            </div>

            {/* Heavy Hitters */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                <h4 className="text-[10px] font-bold text-slate-400 mb-2.5 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="text-rose-500 text-xs">🔥</span> Storage "Heavy Hitters" Heatmap
                </h4>
                <div className="space-y-2">
                    {!isLoading && stats?.storageHeavyHitters?.length === 0 && (
                        <p className="text-xs text-slate-400 text-center py-4">No storage data available yet.</p>
                    )}
                    {!isLoading && stats?.storageHeavyHitters?.map((hitter, i) => (
                        <div key={hitter.id} className="flex items-center justify-between p-2 lg:p-2.5 bg-slate-50/50 dark:bg-slate-700/30 hover:bg-rose-50/50 dark:hover:bg-rose-900/20 border border-slate-100 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800/40 rounded-lg group transition-colors">
                            <div className="flex items-center gap-2.5">
                                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 group-hover:bg-rose-200 dark:group-hover:bg-rose-900/40 group-hover:text-rose-700 dark:group-hover:text-rose-400 flex items-center justify-center text-[10px] font-bold transition-colors shrink-0">#{i + 1}</div>
                                <div className="min-w-0">
                                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{hitter.name}</div>
                                    <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">{hitter.department}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 lg:gap-3 shrink-0">
                                <span className="text-sm font-black tracking-tight text-slate-700 dark:text-slate-300 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">{formatBytes(hitter.bytes)}</span>
                                <button className="opacity-0 group-hover:opacity-100 px-2 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded flex items-center gap-1 transition-all">
                                    <AlertTriangle size={10} /> <span className="hidden lg:inline">Alert</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StorageHeatmap;
