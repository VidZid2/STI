import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CalendarClock, CheckCircle2, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { useSystemConfig, type MaintenanceWindow } from '../../../../contexts/SystemConfigContext';
import { logAuditEvent, getActorInfo } from '../../../../services/adminService';

const toLocalInput = (iso: string | null): string => {
    if (!iso) return '';
    // Convert ISO to datetime-local format (YYYY-MM-DDTHH:mm)
    return new Date(iso).toISOString().slice(0, 16);
};

const MaintenanceScheduler: React.FC = () => {
    const { maintenanceWindow, refreshConfig } = useSystemConfig();

    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [reason, setReason] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    // Populate fields from current window
    useEffect(() => {
        setStartTime(toLocalInput(maintenanceWindow.start_time));
        setEndTime(toLocalInput(maintenanceWindow.end_time));
        setReason(maintenanceWindow.reason || '');
    }, [maintenanceWindow]);

    const hasScheduled = !!(maintenanceWindow.start_time && maintenanceWindow.end_time);

    const saveWindow = async () => {
        if (!supabase || !startTime || !endTime) return;
        if (new Date(startTime) >= new Date(endTime)) {
            alert('End time must be after start time.');
            return;
        }
        setSaving(true);
        const win: MaintenanceWindow = {
            start_time: new Date(startTime).toISOString(),
            end_time: new Date(endTime).toISOString(),
            reason: reason.trim() || null,
        };
        const { error } = await supabase
            .from('system_config')
            .update({ text_value: JSON.stringify(win) })
            .eq('key', 'maintenance_window');

        if (!error) {
            const actor = await getActorInfo();
            await logAuditEvent('config_change', actor.name, actor.role,
                `Maintenance window scheduled: ${startTime} → ${endTime}`);
            refreshConfig();
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }
        setSaving(false);
    };

    const cancelWindow = async () => {
        if (!supabase) return;
        setCancelling(true);
        const empty: MaintenanceWindow = { start_time: null, end_time: null, reason: null };
        const { error } = await supabase
            .from('system_config')
            .update({ text_value: JSON.stringify(empty) })
            .eq('key', 'maintenance_window');

        if (!error) {
            const actor = await getActorInfo();
            await logAuditEvent('config_change', actor.name, actor.role, 'Maintenance window cancelled');
            refreshConfig();
            setStartTime(''); setEndTime(''); setReason('');
        }
        setCancelling(false);
    };

    const formatWindow = (w: MaintenanceWindow) => {
        if (!w.start_time || !w.end_time) return null;
        const fmt = (iso: string) => new Date(iso).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
        });
        return `${fmt(w.start_time)} → ${fmt(w.end_time)}`;
    };

    const isActive = hasScheduled &&
        Date.now() >= new Date(maintenanceWindow.start_time!).getTime() &&
        Date.now() <= new Date(maintenanceWindow.end_time!).getTime();

    const isUpcoming = hasScheduled && !isActive &&
        new Date(maintenanceWindow.start_time!).getTime() > Date.now();

    return (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-black/5 dark:border-white/5 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
                    <CalendarClock size={18} />
                </div>
                <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-none">Maintenance Scheduler</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Schedule a downtime window — users see a countdown banner 1 hour before</p>
                </div>
            </div>

            {/* Current window status */}
            {hasScheduled && (
                <div className={`flex items-start gap-3 p-3.5 rounded-xl border mb-5 ${
                    isActive
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40'
                        : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40'
                }`}>
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 animate-pulse ${isActive ? 'bg-red-500' : 'bg-amber-500'}`} />
                    <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${isActive ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
                            {isActive ? 'Active Now' : isUpcoming ? 'Scheduled' : 'Past Window'}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{formatWindow(maintenanceWindow)}</p>
                        {maintenanceWindow.reason && (
                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5 italic">"{maintenanceWindow.reason}"</p>
                        )}
                    </div>
                    <button
                        onClick={cancelWindow}
                        disabled={cancelling}
                        className="flex items-center gap-1 text-[11px] font-semibold text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors disabled:opacity-50 shrink-0"
                    >
                        <Trash2 size={11} /> {cancelling ? 'Cancelling...' : 'Cancel'}
                    </button>
                </div>
            )}

            {/* Form */}
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Start Time</label>
                        <input
                            type="datetime-local"
                            value={startTime}
                            onChange={e => setStartTime(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">End Time</label>
                        <input
                            type="datetime-local"
                            value={endTime}
                            onChange={e => setEndTime(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Reason <span className="font-normal text-slate-400">(shown to users)</span></label>
                    <input
                        type="text"
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder="e.g. Database migration and performance upgrades"
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all placeholder:text-slate-400"
                    />
                </div>

                <div className="flex items-center justify-between pt-1">
                    <div className="flex items-start gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                        <AlertTriangle size={11} className="mt-0.5 shrink-0 text-amber-400" />
                        <span>Users see a countdown banner 1 hour before start</span>
                    </div>
                    <motion.button
                        onClick={saveWindow}
                        disabled={saving || !startTime || !endTime}
                        whileHover={{ scale: saving ? 1 : 1.02 }}
                        whileTap={{ scale: saving ? 1 : 0.98 }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                            saved
                                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                                : 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-500/20'
                        }`}
                    >
                        {saving ? (
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                        ) : saved ? (
                            <><CheckCircle2 size={14} /> Scheduled</>
                        ) : (
                            <><CalendarClock size={14} /> Schedule</>
                        )}
                    </motion.button>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceScheduler;
