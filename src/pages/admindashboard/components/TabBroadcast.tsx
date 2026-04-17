import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Send, CheckCircle2, Megaphone, Users, Clock, Trash2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { createBroadcast, expireBroadcast, fetchBroadcasts, type Broadcast } from '../../../services/adminService';

const TabBroadcast: React.FC = () => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [severity, setSeverity] = useState<'normal' | 'warning' | 'urgent'>('urgent');
    const [audience, setAudience] = useState<'all' | 'students' | 'teachers'>('all');

    const [history, setHistory] = useState<Broadcast[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [isDeploying, setIsDeploying] = useState(false);
    const [deployed, setDeployed] = useState(false);

    // Fetch broadcast history from the broadcasts table
    useEffect(() => {
        const load = async () => {
            setIsLoadingHistory(true);
            const data = await fetchBroadcasts();
            setHistory(data);
            setIsLoadingHistory(false);
        };
        load();

        // Real-time: listen for new broadcasts
        if (!supabase) return;
        const channel = supabase
            .channel('broadcasts-realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'broadcasts' }, (payload) => {
                setHistory(prev => [payload.new as Broadcast, ...prev]);
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'broadcasts' }, (payload) => {
                setHistory(prev => prev.map(b => b.id === (payload.new as Broadcast).id ? payload.new as Broadcast : b));
            })
            .subscribe();

        return () => { supabase?.removeChannel(channel); };
    }, []);

    const handleDeploy = async () => {
        if (!title.trim() || !message.trim()) return;
        setIsDeploying(true);
        const result = await createBroadcast(title, message, severity, audience);
        setIsDeploying(false);
        if (result) {
            setDeployed(true);
            setTitle('');
            setMessage('');
            setTimeout(() => setDeployed(false), 3000);
        } else {
            alert('Failed to deploy broadcast. Check console for details.');
        }
    };

    const handleExpire = async (id: string) => {
        if (!confirm('Expire this broadcast? Users will no longer see it.')) return;
        const ok = await expireBroadcast(id);
        if (ok) setHistory(prev => prev.map(b => b.id === id ? { ...b, status: 'expired' } : b));
    };

    const MAX_MESSAGE_LENGTH = 300;

    const getSeverityColors = (sev: string) => {
        switch (sev) {
            case 'urgent':  return { bg: 'bg-red-50',   border: 'border-red-200',   text: 'text-red-800',   icon: 'text-red-500' };
            case 'warning': return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', icon: 'text-amber-500' };
            default:        return { bg: 'bg-blue-50',  border: 'border-blue-200',  text: 'text-blue-800',  icon: 'text-blue-500' };
        }
    };

    const previewColors = getSeverityColors(severity);

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex flex-col lg:flex-row gap-6 max-w-6xl w-full"
        >
            {/* Left: Compose */}
            <div className="flex-1 bg-white rounded-2xl border border-black/5 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Megaphone size={20} /></div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 leading-tight">Global Dispatch</h2>
                        <p className="text-sm text-slate-500">Push emergency banners instantly to all active user dashboards.</p>
                    </div>
                </div>

                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Headline</label>
                        <input
                            type="text"
                            placeholder="e.g. Typhoon Class Suspension"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 font-medium"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Message Body</label>
                        <textarea
                            rows={3}
                            placeholder="Provide details about the announcement..."
                            value={message}
                            onChange={(e) => { if (e.target.value.length <= MAX_MESSAGE_LENGTH) setMessage(e.target.value); }}
                            maxLength={MAX_MESSAGE_LENGTH}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 resize-none"
                        />
                        <div className="flex justify-end mt-1">
                            <span className={`text-[11px] font-medium ${message.length > MAX_MESSAGE_LENGTH * 0.9 ? 'text-red-500' : message.length > MAX_MESSAGE_LENGTH * 0.7 ? 'text-amber-500' : 'text-slate-400'}`}>
                                {message.length}/{MAX_MESSAGE_LENGTH}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Severity Level</label>
                            <div className="flex gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
                                {(['normal', 'warning', 'urgent'] as const).map(opt => (
                                    <button key={opt} onClick={() => setSeverity(opt)}
                                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${severity === opt ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Target Audience</label>
                            <div className="flex gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
                                {(['all', 'students', 'teachers'] as const).map(opt => (
                                    <button key={opt} onClick={() => setAudience(opt)}
                                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${audience === opt ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                            <AlertCircle size={14} /> This action cannot be undone instantly.
                        </span>
                        <motion.button
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={handleDeploy}
                            disabled={isDeploying || !title.trim() || !message.trim()}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm ${
                                deployed ? 'bg-emerald-500 text-white shadow-emerald-500/25' :
                                'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed'
                            }`}
                        >
                            {isDeploying ? (
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                            ) : deployed ? (
                                <><CheckCircle2 size={16} /> Dispatched</>
                            ) : (
                                <><Send size={16} /> Deploy Banner</>
                            )}
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Right: Preview + History */}
            <div className="flex-1 flex flex-col gap-6">
                {/* Live Preview */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-col items-center justify-center relative overflow-hidden" style={{ minHeight: '220px' }}>
                    <div className="absolute top-4 left-6 text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        Live Preview
                    </div>
                    <AnimatePresence mode="wait">
                        {(title || message) ? (
                            <motion.div key="preview" initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                className={`w-full max-w-sm mt-6 p-4 rounded-xl border shadow-sm flex items-start gap-3 ${previewColors.bg} ${previewColors.border}`}>
                                <AlertCircle size={20} className={`mt-0.5 shrink-0 ${previewColors.icon}`} />
                                <div>
                                    <h4 className={`text-sm font-bold m-0 leading-tight ${previewColors.text}`}>{title || '...'}</h4>
                                    <p className={`text-[13px] mt-1 m-0 leading-relaxed opacity-90 ${previewColors.text}`}>{message || '...'}</p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-slate-400 text-sm mt-6">
                                Start typing to see banner preview...
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Dispatch History */}
                <div className="bg-white rounded-2xl border border-black/5 p-6 flex-1 shadow-sm overflow-hidden flex flex-col">
                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center justify-between">
                        Recent Dispatches
                        <span className="text-xs bg-slate-100 px-2 py-1 rounded-md text-slate-500 font-medium">Live from DB</span>
                    </h3>

                    <div className="space-y-4 overflow-y-auto pr-2 flex-1" style={{ scrollbarWidth: 'thin' }}>
                        {isLoadingHistory ? (
                            <div className="text-center py-8">
                                <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto mb-3" />
                                <p className="text-sm text-slate-400">Loading dispatch history...</p>
                            </div>
                        ) : history.length === 0 ? (
                            <div className="text-center py-8">
                                <Megaphone size={28} className="text-slate-300 mx-auto mb-3" />
                                <p className="text-sm font-semibold text-slate-500">No dispatches yet</p>
                                <p className="text-xs text-slate-400 mt-1">Broadcasts you deploy will appear here in real-time.</p>
                            </div>
                        ) : (
                            history.map(item => (
                                <div key={item.id} className="flex gap-4 group">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-2 h-2 rounded-full mt-2 ring-4 ring-white ${item.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                        <div className="w-[1px] h-full bg-slate-100 group-last:hidden mt-2" />
                                    </div>
                                    <div className="flex-1 pb-4">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${item.severity === 'urgent' ? 'bg-red-100 text-red-700' : item.severity === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {item.severity}
                                            </span>
                                            <span className="text-[11px] text-slate-400 font-medium">
                                                {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <h4 className="text-sm font-semibold text-slate-900 leading-tight mb-1">{item.title}</h4>
                                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{item.message}</p>
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-400">
                                                <span className="flex items-center gap-1"><Users size={10} /> {item.audience}</span>
                                                <span className="flex items-center gap-1"><Clock size={10} /> {item.status}</span>
                                            </div>
                                            {item.status === 'active' && (
                                                <button
                                                    onClick={() => handleExpire(item.id)}
                                                    className="flex items-center gap-1 text-[10px] font-semibold text-red-400 hover:text-red-600 px-1.5 py-0.5 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Expire this broadcast"
                                                >
                                                    <Trash2 size={10} /> Expire
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default TabBroadcast;
