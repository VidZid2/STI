import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Send, CheckCircle2, Megaphone, Users, Clock, Trash2, Globe } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { createBroadcast, expireBroadcast, fetchBroadcasts, type Broadcast } from '../../../services/adminService';
import { Shimmer } from './shared/Shimmer';
import { useToast } from '../contexts/ToastContext';
import { ConfirmModal } from './shared/ConfirmModal';

const TabBroadcast: React.FC = () => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [severity, setSeverity] = useState<'normal' | 'warning' | 'urgent'>('urgent');
    const [audience, setAudience] = useState<'all' | 'students' | 'teachers'>('all');

    const [history, setHistory] = useState<Broadcast[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [isDeploying, setIsDeploying] = useState(false);
    const [deployed, setDeployed] = useState(false);

    const { showToast } = useToast();
    const [confirmExpireId, setConfirmExpireId] = useState<string | null>(null);

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
            showToast('Broadcast deployed globally to all devices.', 'success');
        } else {
            showToast('Failed to deploy broadcast due to a network error.', 'error');
        }
    };

    const handleConfirmExpire = async () => {
        if (!confirmExpireId) return;
        const ok = await expireBroadcast(confirmExpireId);
        if (ok) {
            setHistory(prev => prev.map(b => b.id === confirmExpireId ? { ...b, status: 'expired' } : b));
            showToast('Broadcast expired and removed from client devices.', 'info');
        } else {
            showToast('Failed to expire broadcast.', 'error');
        }
        setConfirmExpireId(null);
    };

    const MAX_MESSAGE_LENGTH = 300;

    const getSeverityColors = (sev: string) => {
        switch (sev) {
            case 'urgent':  return { bg: 'bg-red-50 dark:bg-red-900/20',   border: 'border-red-200 dark:border-red-800/50',   text: 'text-red-800 dark:text-red-400',   icon: 'text-red-500' };
            case 'warning': return { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800/50', text: 'text-amber-800 dark:text-amber-400', icon: 'text-amber-500' };
            default:        return { bg: 'bg-blue-50 dark:bg-blue-900/20',  border: 'border-blue-200 dark:border-blue-800/50',  text: 'text-blue-800 dark:text-blue-400',  icon: 'text-blue-500' };
        }
    };

    const previewColors = getSeverityColors(severity);

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex flex-col lg:flex-row gap-6 w-full h-full relative"
        >
            {/* Left: Compose */}
            <div className="flex-1 lg:max-w-md xl:max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-black/5 dark:border-white/5 p-6 shadow-sm flex flex-col transition-colors">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg"><Megaphone size={20} /></div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight">Global Dispatch</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Push emergency banners instantly to all dashboards.</p>
                    </div>
                </div>

                <div className="space-y-5 flex-1 flex flex-col">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Headline</label>
                        <input
                            type="text"
                            placeholder="e.g. Typhoon Class Suspension"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 dark:text-slate-100 font-medium"
                        />
                    </div>

                    <div className="flex-1 flex flex-col">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Message Body</label>
                        <textarea
                            placeholder="Provide details about the announcement..."
                            value={message}
                            onChange={(e) => { if (e.target.value.length <= MAX_MESSAGE_LENGTH) setMessage(e.target.value); }}
                            maxLength={MAX_MESSAGE_LENGTH}
                            className="w-full flex-1 min-h-[100px] px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 dark:text-slate-100 resize-none"
                        />
                        <div className="flex justify-end mt-1">
                            <span className={`text-[11px] font-medium ${message.length > MAX_MESSAGE_LENGTH * 0.9 ? 'text-red-500' : message.length > MAX_MESSAGE_LENGTH * 0.7 ? 'text-amber-500' : 'text-slate-400'}`}>
                                {message.length}/{MAX_MESSAGE_LENGTH}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Severity Level</label>
                            <div className="flex gap-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-100 dark:border-slate-700">
                                {(['normal', 'warning', 'urgent'] as const).map(opt => (
                                    <button key={opt} onClick={() => setSeverity(opt)}
                                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${severity === opt ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Target Audience</label>
                            <div className="flex gap-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-100 dark:border-slate-700">
                                {(['all', 'students', 'teachers'] as const).map(opt => (
                                    <button key={opt} onClick={() => setAudience(opt)}
                                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${audience === opt ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-auto">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                            <AlertCircle size={14} /> Cannot be undone instantly.
                        </span>
                        <motion.button
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={handleDeploy}
                            disabled={isDeploying || !title.trim() || !message.trim()}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm ${
                                deployed ? 'bg-emerald-500 text-white shadow-emerald-500/25' :
                                'bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed'
                            }`}
                        >
                            {isDeploying ? (
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full" />
                            ) : deployed ? (
                                <><CheckCircle2 size={16} /> Dispatched</>
                            ) : (
                                <><Send size={16} /> Deploy Banner</>
                            )}
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Right: History & Preview */}
            <div className="flex-1 flex flex-col gap-6">
                {/* Live Preview (Conditional) */}
                <AnimatePresence>
                    {(title || message) && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0, marginBottom: 0 }} 
                            animate={{ opacity: 1, height: 'auto', marginBottom: 24 }} 
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 relative">
                                <div className="absolute top-4 left-6 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                    </span>
                                    Live Preview
                                </div>
                                <div className={`w-full max-w-lg mt-6 p-4 rounded-xl border shadow-sm flex items-start gap-3 ${previewColors.bg} ${previewColors.border} dark:bg-opacity-20 dark:border-opacity-40`}>
                                    <AlertCircle size={20} className={`mt-0.5 shrink-0 ${previewColors.icon}`} />
                                    <div>
                                        <h4 className={`text-sm font-bold m-0 leading-tight ${previewColors.text} dark:opacity-90`}>{title || '...'}</h4>
                                        <p className={`text-[13px] mt-1 m-0 leading-relaxed opacity-90 ${previewColors.text} dark:opacity-75`}>{message || '...'}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Dispatch History Grid */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-black/5 dark:border-white/5 p-6 flex-1 shadow-sm overflow-hidden flex flex-col transition-colors">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center justify-between">
                        Dispatch Grid
                        <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md text-slate-500 dark:text-slate-400 font-medium">Live sync</span>
                    </h3>

                    <div className="flex-1 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                        {isLoadingHistory ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex flex-col gap-3">
                                        <div className="flex justify-between items-start">
                                            <Shimmer className="h-5 w-16 rounded-md" />
                                            <Shimmer className="h-5 w-20 rounded-md" />
                                        </div>
                                        <Shimmer className="h-4 w-3/4 mt-2" />
                                        <Shimmer className="h-3 w-1/2" />
                                        <div className="flex justify-between items-center mt-4">
                                            <Shimmer className="h-3 w-24" />
                                            <Shimmer className="h-6 w-20 rounded-lg" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : history.length === 0 ? (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center h-full text-slate-400 py-12"
                            >
                                <div className="relative mb-4">
                                    <div className="absolute inset-0 bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-xl scale-150 animate-pulse" />
                                    <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center border border-blue-100 dark:border-blue-800/50 relative shadow-inner rotate-3">
                                        <Globe size={32} className="text-blue-500 -rotate-3" />
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">No Dispatches</h3>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-[200px] text-center leading-relaxed">
                                    The global dispatch network is currently clear.
                                </p>
                            </motion.div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <AnimatePresence>
                                    {history.map((item, idx) => {
                                        const c = getSeverityColors(item.severity);
                                        return (
                                            <motion.div
                                                key={item.id}
                                                layout
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="group relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col p-5"
                                            >
                                                {/* Status Indicator */}
                                                <div className={`absolute top-0 left-0 w-full h-1 transition-opacity ${item.status === 'active' ? 'bg-emerald-500 opacity-100' : 'bg-slate-300 dark:bg-slate-600 opacity-50'}`} />
                                                
                                                <div className="flex items-start justify-between mb-3">
                                                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md ${c.bg} ${c.text} dark:bg-opacity-20`}>
                                                        {item.severity}
                                                    </span>
                                                    {item.status === 'active' ? (
                                                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-800">
                                                            Expired
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight mb-2 line-clamp-1" title={item.title}>
                                                    {item.title}
                                                </h4>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3 mb-4 flex-1">
                                                    {item.message}
                                                </p>
                                                
                                                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700/50 mt-auto">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 capitalize">
                                                            <Users size={12} className="text-slate-400" /> {item.audience}
                                                        </span>
                                                        <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                                            <Clock size={12} className="text-slate-400" /> 
                                                            {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    
                                                    {item.status === 'active' && (
                                                        <button
                                                            onClick={() => setConfirmExpireId(item.id)}
                                                            className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-500/30"
                                                        >
                                                            <Trash2 size={14} /> Expire
                                                        </button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={!!confirmExpireId}
                title="Expire Broadcast?"
                message="This will instantly remove the broadcast from all active client devices. This action cannot be undone."
                confirmText="Expire Broadcast"
                isDestructive={true}
                onConfirm={handleConfirmExpire}
                onCancel={() => setConfirmExpireId(null)}
            />
        </motion.div>
    );
};

export default TabBroadcast;
