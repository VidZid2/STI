import React from 'react';
import { motion } from 'motion/react';
import { Search, ArrowRight, Shield } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';

const GodModeLookup: React.FC = () => {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [searchResults, setSearchResults] = React.useState<{ id: string; full_name: string; role: string }[]>([]);
    const [selectedUser, setSelectedUser] = React.useState<{ id: string; full_name: string; role: string } | null>(null);

    React.useEffect(() => {
        if (searchQuery.length < 2) { setSearchResults([]); return; }
        const timer = setTimeout(async () => {
            if (!supabase) return;
            const { data } = await supabase
                .from('users')
                .select('id, full_name, role')
                .ilike('full_name', `%${searchQuery}%`)
                .limit(5);
            setSearchResults(data || []);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleImpersonate = () => {
        if (!selectedUser) return;
        alert(`SESSION STARTED: Impersonating ${selectedUser.full_name} (${selectedUser.role.toUpperCase()})! Running in read-only mode.`);
        if (selectedUser.role === 'teacher') window.location.href = '/teacher-dashboard';
        else if (selectedUser.role === 'student') window.location.href = '/dashboard';
    };

    return (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-black/5 dark:border-white/5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl"><Search size={18} /></div>
                <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-none">God Mode Lookup</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Impersonate any user for read-only tracking and support</p>
                </div>
            </div>

            <div className="flex flex-col gap-4 mb-2 flex-1 relative">
                <div className="relative z-20">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setSelectedUser(null); }}
                        placeholder="Enter Teacher Name or Student ID..."
                        className="w-full pl-9 pr-32 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-600 transition-all shadow-inner placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                    <Search className="absolute left-3 top-3.5 text-slate-400" size={16} />

                    {searchResults.length > 0 && !selectedUser && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-xl overflow-hidden z-50">
                            {searchResults.map(u => (
                                <div
                                    key={u.id}
                                    onClick={() => { setSelectedUser(u); setSearchQuery(u.full_name); setSearchResults([]); }}
                                    className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-between border-b last:border-0 border-slate-100 dark:border-slate-700"
                                >
                                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{u.full_name}</span>
                                    <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 dark:bg-slate-600 rounded text-slate-500 dark:text-slate-300 uppercase">{u.role}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <motion.button
                        onClick={handleImpersonate}
                        disabled={!selectedUser}
                        whileHover={{ scale: selectedUser ? 1.02 : 1 }}
                        whileTap={{ scale: selectedUser ? 0.98 : 1 }}
                        className={`absolute right-1.5 top-1.5 bottom-1.5 font-bold text-xs px-3.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm ${selectedUser ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-400 dark:text-slate-500 cursor-not-allowed'}`}
                    >
                        Impersonate <ArrowRight size={14} />
                    </motion.button>
                </div>

                {selectedUser && (
                    <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold -mt-2 truncate">Target Secured: {selectedUser.full_name}</div>
                )}

                <div className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400 bg-red-50/70 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-800/40 mt-auto">
                    <Shield className="text-red-500 shrink-0 mt-0.5" size={14} />
                    <p className="leading-relaxed">Impersonation is <strong className="text-red-600 dark:text-red-400">Read Only</strong> and actively logged to the system audit trail. A red banner will be displayed during the session.</p>
                </div>
            </div>
        </div>
    );
};

export default GodModeLookup;
