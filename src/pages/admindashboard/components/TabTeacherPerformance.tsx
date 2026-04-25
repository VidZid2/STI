import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    GraduationCap, Star, Users, TrendingUp,
    ChevronDown, ChevronUp, Flag, Sparkles, Download, RefreshCw
} from 'lucide-react';
import {
    fetchTeacherPerformance,
    sendEncouragement,
    flagTeacherForReview,
    type TeacherMetrics,
} from '../../../services/teacherPerformanceService';
import { Shimmer, ShimmerCircle } from './shared/Shimmer';

// ─── Band config ─────────────────────────────────────────────────────────────

const BAND_CONFIG = {
    excellent:      { label: 'Excellent',      color: '#10b981', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800/40', badge: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
    good:           { label: 'Good',           color: '#3b82f6', bg: 'bg-blue-50    dark:bg-blue-900/20',    border: 'border-blue-200    dark:border-blue-800/40',    badge: 'bg-blue-100    dark:bg-blue-900/40    text-blue-700    dark:text-blue-400',    dot: 'bg-blue-500'    },
    'needs-support':{ label: 'Needs Support',  color: '#f59e0b', bg: 'bg-amber-50  dark:bg-amber-900/20',  border: 'border-amber-200  dark:border-amber-800/40',  badge: 'bg-amber-100  dark:bg-amber-900/40  text-amber-700  dark:text-amber-400',  dot: 'bg-amber-500'  },
};

// ─── Mini bar ────────────────────────────────────────────────────────────────

const MiniBar: React.FC<{ value: number; max?: number; color: string }> = ({ value, max = 100, color }) => (
    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((value / max) * 100, 100)}%` }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: color }}
        />
    </div>
);

// ─── Stat pill ───────────────────────────────────────────────────────────────

const Stat: React.FC<{ label: string; value: string | number; icon: React.ElementType; color: string }> = ({ label, value, icon: Icon, color }) => (
    <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            <Icon size={10} color={color} /> {label}
        </div>
        <div className="text-base font-black text-slate-900 dark:text-slate-100">{value}</div>
    </div>
);

// ─── Teacher row ─────────────────────────────────────────────────────────────

interface RowProps {
    teacher: TeacherMetrics;
    rank: number;
    onEncourage: (id: string, name: string) => void;
    onFlag: (id: string, name: string) => void;
    actioning: string | null;
}

const TeacherRow: React.FC<RowProps> = ({ teacher, rank, onEncourage, onFlag, actioning }) => {
    const [expanded, setExpanded] = useState(false);
    const cfg = BAND_CONFIG[teacher.performanceBand];
    const busy = actioning === teacher.teacherId;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: rank * 0.04 }}
            className={`rounded-2xl border transition-all ${cfg.bg} ${cfg.border}`}
        >
            {/* Main row */}
            <div className="p-4 flex items-center gap-4">
                {/* Rank */}
                <div className="w-7 h-7 rounded-full bg-white/60 dark:bg-slate-800/60 flex items-center justify-center text-xs font-black text-slate-500 dark:text-slate-400 shrink-0">
                    {rank}
                </div>

                {/* Avatar initial */}
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0"
                    style={{ background: cfg.color }}>
                    {teacher.teacherName.charAt(0)}
                </div>

                {/* Name + band */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{teacher.teacherName}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{teacher.email}</div>
                </div>

                {/* Stats */}
                <div className="hidden sm:grid grid-cols-3 gap-6 shrink-0">
                    <Stat label="Avg Grade" value={`${teacher.avgStudentGrade}%`} icon={TrendingUp} color={cfg.color} />
                    <Stat label="Engagement" value={`${teacher.studentEngagementRate}%`} icon={Users} color={cfg.color} />
                    <Stat label="Assignments" value={teacher.totalAssignments} icon={GraduationCap} color={cfg.color} />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                    {teacher.performanceBand === 'excellent' && (
                        <motion.button
                            onClick={() => onEncourage(teacher.teacherId, teacher.teacherName)}
                            disabled={busy}
                            whileHover={{ scale: busy ? 1 : 1.05 }}
                            whileTap={{ scale: busy ? 1 : 0.95 }}
                            title="Send encouragement"
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                        >
                            <Sparkles size={11} />
                            <span className="hidden md:inline">Encourage</span>
                        </motion.button>
                    )}
                    {teacher.performanceBand === 'needs-support' && (
                        <motion.button
                            onClick={() => onFlag(teacher.teacherId, teacher.teacherName)}
                            disabled={busy}
                            whileHover={{ scale: busy ? 1 : 1.05 }}
                            whileTap={{ scale: busy ? 1 : 0.95 }}
                            title="Flag for review"
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                        >
                            <Flag size={11} />
                            <span className="hidden md:inline">Flag</span>
                        </motion.button>
                    )}
                    <button
                        onClick={() => setExpanded(v => !v)}
                        className="p-1.5 rounded-lg bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                    >
                        {expanded ? <ChevronUp size={14} color="#64748b" /> : <ChevronDown size={14} color="#64748b" />}
                    </button>
                </div>
            </div>

            {/* Mini bars */}
            <div className="px-4 pb-3 grid grid-cols-2 gap-3">
                <div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 mb-1">Avg Grade</div>
                    <MiniBar value={teacher.avgStudentGrade} color={cfg.color} />
                </div>
                <div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 mb-1">Engagement</div>
                    <MiniBar value={teacher.studentEngagementRate} color={cfg.color} />
                </div>
            </div>

            {/* Expanded breakdown */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 pt-1 border-t border-white/40 dark:border-slate-700/40">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-800/60">
                                    <div className="text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">Avg Grade</div>
                                    <div className="text-lg font-black text-slate-900 dark:text-slate-100">{teacher.avgStudentGrade}%</div>
                                </div>
                                <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-800/60">
                                    <div className="text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">Engagement</div>
                                    <div className="text-lg font-black text-slate-900 dark:text-slate-100">{teacher.studentEngagementRate}%</div>
                                </div>
                                <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-800/60">
                                    <div className="text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">Assignments</div>
                                    <div className="text-lg font-black text-slate-900 dark:text-slate-100">{teacher.totalAssignments}</div>
                                </div>
                                <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-800/60">
                                    <div className="text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">Turnaround</div>
                                    <div className="text-lg font-black text-slate-900 dark:text-slate-100">
                                        {teacher.avgTurnaroundHours > 0 ? `${teacher.avgTurnaroundHours}h` : '—'}
                                    </div>
                                </div>
                            </div>

                            {teacher.assignmentBreakdown.length > 0 && (
                                <>
                                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Top Assignments</div>
                                    <div className="space-y-2">
                                        {teacher.assignmentBreakdown.map(a => (
                                            <div key={a.taskId} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60">
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{a.title}</div>
                                                    <div className="text-[10px] text-slate-400 dark:text-slate-500">{a.submissionCount} submission{a.submissionCount !== 1 ? 's' : ''}</div>
                                                </div>
                                                <div className="text-sm font-black shrink-0" style={{ color: cfg.color }}>
                                                    {a.avgScore > 0 ? `${a.avgScore}%` : '—'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Skeleton: React.FC = () => (
    <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-black/5 dark:border-white/5 shadow-sm flex items-center gap-4">
                <ShimmerCircle size={28} />
                <Shimmer className="h-9 w-9 rounded-xl shrink-0" />
                <div className="flex-1 flex flex-col gap-1.5">
                    <Shimmer className="h-3 w-40" />
                    <Shimmer className="h-2.5 w-56" />
                </div>
                <div className="hidden sm:flex gap-6 shrink-0">
                    {[...Array(3)].map((_, j) => (
                        <div key={j} className="flex flex-col gap-1.5">
                            <Shimmer className="h-2 w-14" />
                            <Shimmer className="h-4 w-10" />
                        </div>
                    ))}
                </div>
                <Shimmer className="h-8 w-8 rounded-lg shrink-0" />
            </div>
        ))}
    </div>
);

// ─── Main Tab ─────────────────────────────────────────────────────────────────

type BandFilter = 'all' | 'excellent' | 'good' | 'needs-support';

const TabTeacherPerformance: React.FC = () => {
    const [teachers, setTeachers] = useState<TeacherMetrics[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<BandFilter>('all');
    const [actioning, setActioning] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    const load = () => {
        setIsLoading(true);
        fetchTeacherPerformance().then(data => { setTeachers(data); setIsLoading(false); });
    };

    useEffect(() => { load(); }, []);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const handleEncourage = async (id: string, name: string) => {
        setActioning(id);
        const ok = await sendEncouragement(id, name);
        setActioning(null);
        showToast(ok ? `🌟 Encouragement sent to ${name.split(' ')[0]}!` : 'Failed to send notification.');
    };

    const handleFlag = async (id: string, name: string) => {
        setActioning(id);
        const ok = await flagTeacherForReview(id, name);
        setActioning(null);
        showToast(ok ? `📋 ${name.split(' ')[0]} flagged for review.` : 'Failed to create report.');
    };

    const exportCsv = () => {
        if (!teachers.length) return;
        const header = ['Name', 'Email', 'Band', 'Avg Grade', 'Engagement %', 'Assignments', 'Turnaround (hrs)'];
        const rows = teachers.map(t => [
            t.teacherName,
            t.email,
            t.performanceBand,
            t.avgStudentGrade,
            t.studentEngagementRate,
            t.totalAssignments,
            t.avgTurnaroundHours,
        ]);
        const csv = [header, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `teacher-performance-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const filtered = filter === 'all' ? teachers : teachers.filter(t => t.performanceBand === filter);

    const counts = {
        excellent: teachers.filter(t => t.performanceBand === 'excellent').length,
        good: teachers.filter(t => t.performanceBand === 'good').length,
        'needs-support': teachers.filter(t => t.performanceBand === 'needs-support').length,
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex flex-col gap-6"
        >
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                        <GraduationCap size={20} />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-none">Teacher Performance</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Aggregated metrics from assignments, submissions, and grading activity
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={load}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} /> Refresh
                    </button>
                    <button
                        onClick={exportCsv}
                        disabled={!teachers.length}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <Download size={12} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Band summary cards */}
            {!isLoading && teachers.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                    {(Object.entries(BAND_CONFIG) as [BandFilter, typeof BAND_CONFIG['excellent']][]).map(([key, cfg]) => (
                        <button
                            key={key}
                            onClick={() => setFilter(prev => prev === key ? 'all' : key)}
                            className={`p-4 rounded-2xl border text-left transition-all ${cfg.bg} ${cfg.border} ${filter === key ? 'ring-2 ring-offset-1' : ''}`}
                            style={{ '--tw-ring-color': cfg.color } as React.CSSProperties}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.badge.split(' ').slice(-2).join(' ')}`}>{cfg.label}</span>
                            </div>
                            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{counts[key as keyof typeof counts]}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">teacher{counts[key as keyof typeof counts] !== 1 ? 's' : ''}</div>
                        </button>
                    ))}
                </div>
            )}

            {/* Methodology note */}
            <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                <Star size={13} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                    <strong className="text-slate-700 dark:text-slate-300">Band classification:</strong>{' '}
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Excellent</span> ≥75 combined score ·{' '}
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">Good</span> ≥50 ·{' '}
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">Needs Support</span> &lt;50.
                    Score = avg grade (60%) + engagement rate (40%). This is a support tool, not a surveillance system.
                </p>
            </div>

            {/* Teacher list */}
            {isLoading ? (
                <Skeleton />
            ) : filtered.length === 0 ? (
                <div className="text-center py-16">
                    <GraduationCap size={36} className="text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                        {filter === 'all' ? 'No teacher data yet' : `No ${BAND_CONFIG[filter].label.toLowerCase()} teachers`}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Teachers need assignments and graded submissions to appear here</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {filtered.map((teacher, i) => (
                            <TeacherRow
                                key={teacher.teacherId}
                                teacher={teacher}
                                rank={i + 1}
                                onEncourage={handleEncourage}
                                onFlag={handleFlag}
                                actioning={actioning}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-semibold rounded-2xl shadow-2xl z-50"
                    >
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default TabTeacherPerformance;
