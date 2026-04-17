import React, { useEffect, useState } from 'react';
import { Bell, Send, Eye, TrendingUp } from 'lucide-react';
import { fetchNotificationStats } from '../../../../services/notificationService';

const NotificationStats: React.FC = () => {
    const [stats, setStats] = useState({ total: 0, read: 0, deliveryRate: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotificationStats(7).then(s => { setStats(s); setLoading(false); });
    }, []);

    const items = [
        { label: 'Sent (7d)', value: stats.total, icon: Send, color: '#3b82f6', bg: '#eff6ff' },
        { label: 'Read',      value: stats.read,  icon: Eye,  color: '#10b981', bg: '#f0fdf4' },
        { label: 'Read Rate', value: `${stats.deliveryRate}%`, icon: TrendingUp, color: '#8b5cf6', bg: '#f5f3ff' },
    ];

    return (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-black/5 dark:border-white/5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                    <Bell size={16} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-none">Notification Delivery</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Last 7 days · Admin-sent only</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
                {items.map(({ label, value, icon: Icon, color, bg }) => (
                    <div key={label} className="flex flex-col items-center p-3 rounded-xl" style={{ background: bg }}>
                        <Icon size={14} color={color} className="mb-1.5" />
                        <span className="text-lg font-black" style={{ color }}>
                            {loading ? '—' : value}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mt-0.5 text-center">{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NotificationStats;
