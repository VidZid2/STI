import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X, Megaphone } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ActiveBroadcast {
    id: string;
    title: string;
    message: string;
    severity: 'normal' | 'warning' | 'urgent';
    audience: 'all' | 'students' | 'teachers';
    created_at: string;
}

interface BroadcastBannerProps {
    /** The role of the current user viewing the dashboard */
    role: 'student' | 'teacher';
}

/**
 * BroadcastBanner — reads active broadcasts from the `broadcasts` table.
 * Supports real-time updates via Supabase Realtime.
 */
const BroadcastBanner: React.FC<BroadcastBannerProps> = ({ role }) => {
    const [broadcasts, setBroadcasts] = useState<ActiveBroadcast[]>([]);
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());

    useEffect(() => {
        const stored = sessionStorage.getItem('dismissed_broadcasts');
        if (stored) {
            try { setDismissed(new Set(JSON.parse(stored))); } catch { /* ignore */ }
        }

        const fetchBroadcasts = async () => {
            if (!supabase) return;
            try {
                const { data, error } = await supabase
                    .from('broadcasts')
                    .select('id, title, message, severity, audience, created_at')
                    .eq('status', 'active')
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (error) throw error;

                const filtered = (data as ActiveBroadcast[] || []).filter(
                    b => b.audience === 'all' || b.audience === `${role}s`
                );
                setBroadcasts(filtered);
            } catch (err) {
                console.error('[BroadcastBanner] Failed to fetch:', err);
            }
        };

        fetchBroadcasts();

        if (!supabase) return;

        const channel = supabase
            .channel(`broadcast-banner-${role}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'broadcasts' }, (payload) => {
                const b = payload.new as ActiveBroadcast & { status: string };
                if (b.status === 'active' && (b.audience === 'all' || b.audience === `${role}s`)) {
                    setBroadcasts(prev => [b, ...prev]);
                }
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'broadcasts' }, (payload) => {
                const b = payload.new as ActiveBroadcast & { status: string };
                // Remove from view if expired
                if (b.status === 'expired') {
                    setBroadcasts(prev => prev.filter(x => x.id !== b.id));
                }
            })
            .subscribe();

        return () => { supabase?.removeChannel(channel); };
    }, [role]);

    const handleDismiss = (id: string) => {
        const next = new Set(dismissed).add(id);
        setDismissed(next);
        sessionStorage.setItem('dismissed_broadcasts', JSON.stringify([...next]));
    };

    const visibleBroadcasts = broadcasts.filter(b => !dismissed.has(b.id));
    if (visibleBroadcasts.length === 0) return null;

    const getSeverityStyle = (severity: string) => {
        switch (severity) {
            case 'urgent':  return { bg: 'bg-red-50 border-red-200',    text: 'text-red-900',    icon: 'text-red-500',    dismissBtn: 'text-red-400 hover:text-red-600 hover:bg-red-100' };
            case 'warning': return { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-900', icon: 'text-amber-500',  dismissBtn: 'text-amber-400 hover:text-amber-600 hover:bg-amber-100' };
            default:        return { bg: 'bg-blue-50 border-blue-200',   text: 'text-blue-900',  icon: 'text-blue-500',   dismissBtn: 'text-blue-400 hover:text-blue-600 hover:bg-blue-100' };
        }
    };

    return (
        <div className="space-y-2 mb-4">
            <AnimatePresence>
                {visibleBroadcasts.map((broadcast) => {
                    const style = getSeverityStyle(broadcast.severity);
                    return (
                        <motion.div
                            key={broadcast.id}
                            initial={{ opacity: 0, y: -10, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                            exit={{ opacity: 0, y: -10, height: 0, marginBottom: 0 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className={`flex items-start gap-3 p-4 rounded-xl border shadow-sm ${style.bg}`}
                        >
                            <div className={`mt-0.5 shrink-0 ${style.icon}`}>
                                {broadcast.severity === 'urgent' ? <Megaphone size={18} /> : <AlertCircle size={18} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className={`text-sm font-bold leading-tight ${style.text}`}>{broadcast.title}</div>
                                {broadcast.message && (
                                    <p className={`text-[13px] mt-1 leading-relaxed opacity-85 ${style.text}`}>{broadcast.message}</p>
                                )}
                            </div>
                            <button
                                onClick={() => handleDismiss(broadcast.id)}
                                className={`p-1 rounded-lg transition-colors shrink-0 ${style.dismissBtn}`}
                                title="Dismiss"
                            >
                                <X size={16} />
                            </button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};

export default BroadcastBanner;
