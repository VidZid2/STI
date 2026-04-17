import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Clock, FileText, BarChart2, CheckCircle2, XCircle, ScanSearch, RefreshCw, AlertTriangle, ChevronDown } from 'lucide-react';
import { fetchAnomalies, reviewAnomaly, runAnomalyScan, type AnomalyFlag } from '../../../services/integrityService';
import { Shimmer } from './shared/Shimmer';

// ─── Config ──────────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
    timing:     { label: 'Timing',     icon: Clock,      color: '#f59e0b', bg: 'bg-amber-50  dark:bg-amber-900/20',  border: 'border-amber-200 dark:border-amber-800/40',  badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
    similarity: { label: 'Similarity', icon: FileText,   color: '#ef4444', bg: 'bg-red-50    dark:bg-red-900/20',    border: 'border-red-200   dark:border-red-800/40',    badge: 'bg-red-100   text-red-700   dark:bg-red-900/40   dark:text-red-400'   },
    score:      { label: 'Score',      icon: BarChart2,  color: '#8b5cf6', bg: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-200 dark:border-violet-800/40', badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400' },
};

const SEVERITY_CONFIG = {
    high:   { label: 'High',   dot: 'bg-red-500',    text: 'text-red-600   dark:text-red-400'   },
    medium: { label: 'Medium', dot: 'bg-amber-500',  text: 'text-amber-600 dark:text-amber-400' },
    low:    { label: 'Low',    dot: 'bg-slate-400',  text: 'text-slate-500 dark:text-slate-400' },
};

const formatRelative = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const EmptyState: React.FC<{ type: string }> = ({ type }) => (
    <div className="text-center py-10">
        <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No {type} anomalies</p>
        <p className="text-xs text-slate-400 mt-1">Run a scan to detect suspicious patterns</p>
    </div>
);

interface FlagCardProps {
    flag: AnomalyFlag;
    onReview: (id: string, verdict: 'reviewed' | 'dismissed') => void;
    actioning: string | null;
}

const FlagCard: React.FC<FlagCardProps> = ({ flag, onReview, actioning }) => {
    const [expanded, setExpanded] = useState(false);
    const cfg = TYPE_CONFIG[flag.type];
    const sev = SEVERITY_CONFIG[flag.severity];
    const Icon = cfg.icon;
    const busy = actioning === flag.id;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className={`rounded-xl border p-4 transition-all ${cfg.bg} ${cfg.border} ${flag.status !== 'pending' ? 'opacity-60' : ''}`}
        >
            <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-white/60 dark:bg-slate-800/60 shrink-0">
                    <Icon size={15} color={cfg.color} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${cfg.badge}`}>
                            {cfg.label}
                        </span>
                        <span className={`flex items-center gap-1 text-[10px] font-semibold ${sev.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sev.dot}`} />
                            {sev.label}
                        </span>
                        {flag.status !== 'pending' && (
                            <span className="text-[10px] font-semibold text-slate-400 uppercase">{flag.status}</span>
                        )}
                        <span className="text-[10px] text-slate-400 ml-auto">{formatRelative(flag.created_at)}</span>
                    </div>

                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-0.5">
                        {flag.student_a_name} &amp; {flag.student_b_name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{flag.detail}</p>

                    {/* Expand toggle */}
                    <button
                        onClick={() => setExpanded(v => !v)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mt-2 transition-colors"
                    >
                        <ChevronDown size={12} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
                        {expanded ? 'Hide' : 'Details'}
                    </button>

                    <AnimatePresence>
                        {expanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-3 pt-3 border-t border-white/40 dark:border-slate-700/40 grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <span className="text-slate-400 block">Student A</span>
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">{flag.student_a_name}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block">Student B</span>
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">{flag.student_b_name}</span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-slate-400 block">Task</span>
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">{flag.task_title}</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Actions */}
                {flag.status === 'pending' && (
                    <div className="flex flex-col gap-1.5 shrink-0">
                        <button
                            onClick={() => onReview(flag.id, 'reviewed')}
                            disabled={busy}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors disabled:opacity-50"
                        >
                            <CheckCircle2 size={11} /> Review
                        </button>
                        <button
                            onClick={() => onReview(flag.id, 'dismissed')}
                            disabled={busy}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                        >
                            <XCircle size={11} /> Dismiss
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

// ─── Section ─────────────────────────────────────────────────────────────────

interface SectionProps {
    title: string;
    icon: React.ElementType;
    color: string;
    flags: AnomalyFlag[];
    type: AnomalyFlag['type'];
    onReview: (id: string, verdict: 'reviewed' | 'dismissed') => void;
    actioning: string | null;
}

const Section: React.FC<SectionProps> = ({ title, icon: Icon, color, flags, type, onReview, actioning }) => {
    const pending = flags.filter(f => f.status === 'pending').length;
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl" style={{ background: `${color}15` }}>
                        <Icon size={18} color={color} />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-none">{title}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{flags.length} total flag{flags.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>
                {pending > 0 && (
                    <span className="px-2.5 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-xs font-bold rounded-lg">
                        {pending} pending
                    </span>
                )}
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                <AnimatePresence>
                    {flags.length === 0
                        ? <EmptyState type={type} />
                        : flags.map(f => (
                            <FlagCard key={f.id} flag={f} onReview={onReview} actioning={actioning} />
                        ))
                    }
                </AnimatePresence>
            </div>
        </div>
    );
};

// ─── Main Tab ─────────────────────────────────────────────────────────────────

const TabIntegrity: React.FC = () => {
    const [flags, setFlags] = useState<AnomalyFlag[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<{ inserted: number } | null>(null);
    const [actioning, setActioning] = useState<string | null>(null);

    useEffect(() => {
        fetchAnomalies().then(data => { setFlags(data); setIsLoading(false); });
    }, []);

    const handleScan = async () => {
        setIsScanning(true);
        setScanResult(null);
        const result = await runAnomalyScan();
        setScanResult({ inserted: result.inserted });
        if (result.inserted > 0) {
            // Refresh full list to include newly inserted flags
            const updated = await fetchAnomalies();
            setFlags(updated);
        }
        setIsScanning(false);
    };

    const handleReview = async (id: string, verdict: 'reviewed' | 'dismissed') => {
        setActioning(id);
        const ok = await reviewAnomaly(id, verdict);
        if (ok) setFlags(prev => prev.map(f => f.id === id ? { ...f, status: verdict } : f));
        setActioning(null);
    };

    const timing     = flags.filter(f => f.type === 'timing');
    const similarity = flags.filter(f => f.type === 'similarity');
    const score      = flags.filter(f => f.type === 'score');
    const totalPending = flags.filter(f => f.status === 'pending').length;

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex flex-col gap-6"
        >
            {/* Header bar */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl">
                        <ShieldAlert size={20} />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-none">Academic Integrity Monitor</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Statistical anomaly detection across student submissions
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    {/* Summary badges */}
                    {!isLoading && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{flags.length} flags</span>
                            {totalPending > 0 && (
                                <span className="flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-lg">
                                    <AlertTriangle size={11} /> {totalPending} pending
                                </span>
                            )}
                        </div>
                    )}

                    {/* Scan result toast */}
                    <AnimatePresence>
                        {scanResult !== null && (
                            <motion.span
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${
                                    scanResult.inserted > 0
                                        ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                                        : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                }`}
                            >
                                {scanResult.inserted > 0
                                    ? `⚠ ${scanResult.inserted} new flag${scanResult.inserted > 1 ? 's' : ''} found`
                                    : '✓ No new anomalies'}
                            </motion.span>
                        )}
                    </AnimatePresence>

                    <motion.button
                        onClick={handleScan}
                        disabled={isScanning}
                        whileHover={{ scale: isScanning ? 1 : 1.02 }}
                        whileTap={{ scale: isScanning ? 1 : 0.98 }}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-semibold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors disabled:opacity-60"
                    >
                        {isScanning
                            ? <><RefreshCw size={14} className="animate-spin" /> Scanning...</>
                            : <><ScanSearch size={14} /> Run Scan</>
                        }
                    </motion.button>
                </div>
            </div>

            {/* How it works note */}
            <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                    Flags are <strong className="text-slate-700 dark:text-slate-300">statistical indicators only</strong> — not proof of misconduct.
                    Detects: submissions within 60s of each other (timing), identical AI scores (score), and &gt;85% text similarity (similarity).
                    Always review context before taking action.
                </p>
            </div>

            {/* Three sections */}
            {isLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm p-6 flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <Shimmer className="h-9 w-9 rounded-xl" />
                                <div className="flex flex-col gap-1.5">
                                    <Shimmer className="h-3 w-28" />
                                    <Shimmer className="h-2.5 w-16" />
                                </div>
                            </div>
                            {[...Array(3)].map((_, j) => (
                                <div key={j} className="flex flex-col gap-2 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <div className="flex items-center gap-2">
                                        <Shimmer className="h-4 w-16 rounded-full" />
                                        <Shimmer className="h-3 w-12 rounded-full" />
                                    </div>
                                    <Shimmer className="h-3 w-48" />
                                    <Shimmer className="h-2.5 w-full" />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Section
                        title="Timing Anomalies"
                        icon={Clock}
                        color="#f59e0b"
                        flags={timing}
                        type="timing"
                        onReview={handleReview}
                        actioning={actioning}
                    />
                    <Section
                        title="Similarity Anomalies"
                        icon={FileText}
                        color="#ef4444"
                        flags={similarity}
                        type="similarity"
                        onReview={handleReview}
                        actioning={actioning}
                    />
                    <Section
                        title="Score Anomalies"
                        icon={BarChart2}
                        color="#8b5cf6"
                        flags={score}
                        type="score"
                        onReview={handleReview}
                        actioning={actioning}
                    />
                </div>
            )}
        </motion.div>
    );
};

export default TabIntegrity;
