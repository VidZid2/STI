import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle2, XCircle, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    subscribeToNotifications,
    type AppNotification,
} from '../../services/notificationService';

const TYPE_CONFIG = {
    info:    { icon: Info,          color: '#3b82f6', bg: '#eff6ff',  border: '#bfdbfe' },
    success: { icon: CheckCircle2,  color: '#10b981', bg: '#f0fdf4',  border: '#bbf7d0' },
    warning: { icon: AlertTriangle, color: '#f59e0b', bg: '#fffbeb',  border: '#fde68a' },
    error:   { icon: XCircle,       color: '#ef4444', bg: '#fef2f2',  border: '#fecaca' },
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

interface NotificationBellProps {
    /** Override user id — if not provided, resolved from supabase.auth.getUser() */
    userId?: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ userId: propUserId }) => {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [userId, setUserId] = useState<string | null>(propUserId || null);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [markingAll, setMarkingAll] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const unread = notifications.filter(n => !n.is_read).length;

    // Resolve user id from Supabase Auth if not provided
    useEffect(() => {
        if (propUserId) { setUserId(propUserId); return; }
        if (!supabase) return;
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) setUserId(user.id);
        });
    }, [propUserId]);

    // Fetch on mount + subscribe to realtime
    useEffect(() => {
        if (!userId) return;
        fetchNotifications(userId).then(setNotifications);

        const channel = subscribeToNotifications(userId, (n) => {
            setNotifications(prev => [n, ...prev]);
        });

        return () => { if (channel && supabase) supabase.removeChannel(channel); };
    }, [userId]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleClick = async (n: AppNotification) => {
        setExpanded(prev => prev === n.id ? null : n.id);
        if (!n.is_read) {
            await markAsRead(n.id);
            setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
        }
    };

    const handleMarkAll = async () => {
        if (!userId) return;
        setMarkingAll(true);
        await markAllAsRead(userId);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setMarkingAll(false);
    };

    if (!userId) return null;

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            {/* Bell Button */}
            <motion.button
                onClick={() => setOpen(v => !v)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    border: '1px solid rgba(0,0,0,0.08)',
                    background: open ? '#f1f5f9' : 'white',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                }}
            >
                <motion.div
                    animate={unread > 0 ? { rotate: [0, -15, 15, -10, 10, 0] } : {}}
                    transition={{ duration: 0.5, repeat: unread > 0 ? Infinity : 0, repeatDelay: 4 }}
                >
                    <Bell size={16} color={unread > 0 ? '#3b82f6' : '#64748b'} />
                </motion.div>
                {unread > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        style={{
                            position: 'absolute',
                            top: -4,
                            right: -4,
                            minWidth: 16,
                            height: 16,
                            borderRadius: 8,
                            background: '#ef4444',
                            color: 'white',
                            fontSize: 9,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0 3px',
                            border: '2px solid white',
                        }}
                    >
                        {unread > 9 ? '9+' : unread}
                    </motion.span>
                )}
            </motion.button>

            {/* Dropdown Panel */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        style={{
                            position: 'absolute',
                            top: 'calc(100% + 8px)',
                            right: 0,
                            width: 340,
                            maxHeight: 480,
                            background: 'white',
                            borderRadius: 16,
                            border: '1px solid rgba(0,0,0,0.08)',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
                            overflow: 'hidden',
                            zIndex: 9999,
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        {/* Header */}
                        <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                            <div>
                                <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Notifications</span>
                                {unread > 0 && (
                                    <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, color: '#3b82f6', background: '#eff6ff', padding: '2px 7px', borderRadius: 20 }}>
                                        {unread} new
                                    </span>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                {unread > 0 && (
                                    <motion.button
                                        onClick={handleMarkAll}
                                        disabled={markingAll}
                                        whileHover={{ scale: 1.05 }}
                                        style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '4px 8px', cursor: 'pointer' }}
                                    >
                                        <CheckCheck size={12} /> Mark all read
                                    </motion.button>
                                )}
                                <motion.button onClick={() => setOpen(false)} whileHover={{ scale: 1.1 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 6, border: 'none', background: '#f1f5f9', cursor: 'pointer' }}>
                                    <X size={12} color="#64748b" />
                                </motion.button>
                            </div>
                        </div>

                        {/* List */}
                        <div style={{ overflowY: 'auto', flex: 1 }}>
                            {notifications.length === 0 ? (
                                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                                    <Bell size={28} color="#cbd5e1" style={{ margin: '0 auto 10px' }} />
                                    <p style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', margin: 0 }}>No notifications yet</p>
                                    <p style={{ fontSize: 12, color: '#cbd5e1', margin: '4px 0 0' }}>Admin messages will appear here</p>
                                </div>
                            ) : (
                                notifications.map((n) => {
                                    const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
                                    const Icon = cfg.icon;
                                    const isExpanded = expanded === n.id;
                                    return (
                                        <motion.div
                                            key={n.id}
                                            layout
                                            onClick={() => handleClick(n)}
                                            style={{
                                                padding: '12px 16px',
                                                borderBottom: '1px solid #f8fafc',
                                                cursor: 'pointer',
                                                background: n.is_read ? 'white' : '#fafbff',
                                                transition: 'background 0.15s',
                                            }}
                                            whileHover={{ background: '#f8fafc' }}
                                        >
                                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                                <div style={{ width: 30, height: 30, borderRadius: 8, background: cfg.bg, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <Icon size={14} color={cfg.color} />
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                                        <span style={{ fontSize: 13, fontWeight: n.is_read ? 500 : 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</span>
                                                        <span style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0 }}>{formatRelative(n.created_at)}</span>
                                                    </div>
                                                    {n.message && (
                                                        <p style={{ fontSize: 12, color: '#64748b', margin: '3px 0 0', lineHeight: 1.5, overflow: isExpanded ? 'visible' : 'hidden', display: isExpanded ? 'block' : '-webkit-box', WebkitLineClamp: isExpanded ? undefined : 2, WebkitBoxOrient: 'vertical' as const }}>
                                                            {n.message}
                                                        </p>
                                                    )}
                                                </div>
                                                {!n.is_read && (
                                                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#3b82f6', flexShrink: 0, marginTop: 4 }} />
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell;
