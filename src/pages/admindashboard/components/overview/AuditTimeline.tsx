import { motion } from 'motion/react';
import { Terminal, Download } from 'lucide-react';
import type { AuditLogEntry } from '../../../../services/adminService';

const EVENT_ICONS: Record<string, { icon: string; color: string }> = {
    login:        { icon: '🔑', color: '#3b82f6' },
    logout:       { icon: '🚪', color: '#6b7280' },
    submission:   { icon: '📄', color: '#10b981' },
    grade:        { icon: '📊', color: '#8b5cf6' },
    ai_inference: { icon: '🤖', color: '#f59e0b' },
    broadcast:    { icon: '📢', color: '#ef4444' },
    config_change:{ icon: '⚙️', color: '#6366f1' },
    backup:       { icon: '💾', color: '#14b8a6' },
    report:       { icon: '🎫', color: '#f97316' },
    error:        { icon: '❌', color: '#ef4444' },
};

interface Props { auditLog: AuditLogEntry[]; isLoading: boolean; }

const AuditTimeline: React.FC<Props> = ({ auditLog, isLoading }) => {
    const formatTime = (dateStr: string) =>
        new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const exportCsv = () => {
        if (auditLog.length === 0) return;
        const header = ['Time', 'Event Type', 'Actor', 'Description'];
        const rows = auditLog.map(e => [
            new Date(e.created_at).toISOString(),
            e.event_type,
            e.actor_name,
            `"${e.description.replace(/"/g, '""')}"`,
        ]);
        const csv = [header, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-6 rounded-2xl bg-[#010614] text-white shadow-xl relative overflow-hidden border border-yellow-500/20 flex flex-col min-h-0">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-[0.04] pointer-events-none" />
            <div className="relative z-10 flex flex-col h-full flex-1">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-400/10 rounded-xl border border-yellow-400/20 shadow-[0_0_15px_rgba(250,204,21,0.1)]">
                            <Terminal size={18} className="text-yellow-400" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white leading-none tracking-wide">System Audit Log</h3>
                            <p className="text-xs text-slate-400 mt-1">Real-time platform event stream</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)] animate-pulse" />
                        <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-wider">Live</span>
                        {auditLog.length > 0 && (
                            <button
                                onClick={exportCsv}
                                title="Export CSV"
                                className="ml-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-[10px] font-semibold transition-colors border border-white/10"
                            >
                                <Download size={11} /> CSV
                            </button>
                        )}
                    </div>
                </div>

                <div className="space-y-1 overflow-y-auto pr-1 font-mono text-[12px] max-h-[320px]" style={{ scrollbarWidth: 'thin' }}>
                    {auditLog.length === 0 && !isLoading && (
                        <div className="text-center py-8 text-slate-600">
                            <p className="text-sm">No events recorded yet.</p>
                            <p className="text-xs mt-1 text-slate-700">System actions will appear here in real-time.</p>
                        </div>
                    )}
                    {auditLog.map((entry, i) => {
                        const evt = EVENT_ICONS[entry.event_type] || { icon: '📋', color: '#6b7280' };
                        return (
                            <motion.div
                                key={entry.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/5 transition-colors"
                            >
                                <span className="text-slate-600 text-[11px] font-medium shrink-0 w-[70px]">{formatTime(entry.created_at)}</span>
                                <span className="shrink-0">{evt.icon}</span>
                                <span className="text-slate-400 flex-1 truncate">
                                    <span className="text-slate-300 font-medium">{entry.actor_name}</span>
                                    {' — '}
                                    {entry.description}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0" style={{ color: evt.color, background: `${evt.color}15` }}>
                                    {entry.event_type.replace('_', ' ')}
                                </span>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default AuditTimeline;
