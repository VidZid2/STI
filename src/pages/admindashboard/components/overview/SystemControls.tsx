import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Power, Shield, Cpu, FileX, AlertTriangle } from 'lucide-react';
import type { SystemConfigItem } from '../../../../services/adminService';
import { toggleSystemConfig } from '../../../../services/adminService';

interface Props {
    systemConfig: SystemConfigItem[];
    setSystemConfig: React.Dispatch<React.SetStateAction<SystemConfigItem[]>>;
    isLoading: boolean;
}

const SystemControls: React.FC<Props> = ({ systemConfig, setSystemConfig, isLoading }) => {
    const [togglingKeys, setTogglingKeys] = React.useState<Set<string>>(new Set());
    // Confirmation dialog state
    const [pendingToggle, setPendingToggle] = React.useState<{ key: string; label: string; currentValue: boolean } | null>(null);

    const requestToggle = (key: string, label: string, currentValue: boolean) => {
        setPendingToggle({ key, label, currentValue });
    };

    const confirmToggle = async () => {
        if (!pendingToggle) return;
        const { key, currentValue } = pendingToggle;
        setPendingToggle(null);
        setTogglingKeys(prev => new Set(prev).add(key));
        const success = await toggleSystemConfig(key, !currentValue);
        if (success) {
            setSystemConfig(prev => prev.map(item => item.key === key ? { ...item, value: !currentValue } : item));
        }
        setTogglingKeys(prev => { const next = new Set(prev); next.delete(key); return next; });
    };

    return (
        <>
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-black/5 dark:border-white/5 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 bg-slate-900 dark:bg-slate-700 text-white rounded-xl"><Power size={18} /></div>
                    <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-none">System Controls</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Global kill switches for the platform</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {systemConfig.length === 0 && !isLoading && (
                        <p className="text-sm text-slate-400 text-center py-6">No config flags found. Run the SQL setup.</p>
                    )}
                    {systemConfig.map((item) => {
                        const isToggling = togglingKeys.has(item.key);
                        const isDanger = item.key === 'maintenance_mode';
                        return (
                            <div key={item.key} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isDanger && item.value ? 'border-red-200 dark:border-red-800/60 bg-red-50/50 dark:bg-red-900/20' : 'border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className={`p-1.5 rounded-lg ${isDanger ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                                        {isDanger ? <Shield size={16} /> : item.key === 'ai_enabled' ? <Cpu size={16} /> : <FileX size={16} />}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{item.label}</div>
                                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{item.description}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => requestToggle(item.key, item.label, item.value)}
                                    disabled={isToggling}
                                    className={`relative w-12 h-7 rounded-full transition-all duration-300 flex-shrink-0 ml-3 ${isToggling ? 'opacity-50' : ''} ${item.value ? (isDanger ? 'bg-red-500' : 'bg-emerald-500') : 'bg-slate-300 dark:bg-slate-600'}`}
                                >
                                    <motion.div
                                        animate={{ x: item.value ? 20 : 2 }}
                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                        className="absolute top-[3px] w-[22px] h-[22px] bg-white rounded-full shadow-md"
                                    />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Confirmation Dialog */}
            <AnimatePresence>
                {pendingToggle && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                        onClick={() => setPendingToggle(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-700"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
                                    <AlertTriangle size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base leading-tight">Confirm Toggle</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">This will take effect immediately.</p>
                                </div>
                            </div>
                            <p className="text-sm text-slate-700 dark:text-slate-300 mb-6 leading-relaxed">
                                Are you sure you want to <strong>{pendingToggle.currentValue ? 'disable' : 'enable'}</strong>{' '}
                                <strong className="text-slate-900 dark:text-slate-100">"{pendingToggle.label}"</strong>?
                                This will affect all users on the platform immediately.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setPendingToggle(null)}
                                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmToggle}
                                    className="flex-1 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
                                >
                                    Confirm
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default SystemControls;
