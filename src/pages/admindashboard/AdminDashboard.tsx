import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Clock, RefreshCw, LayoutDashboard, Users, Megaphone, ShieldAlert, BarChart2, GraduationCap } from 'lucide-react';
import {
    fetchAdminStats,
    fetchSystemConfig,
    fetchAdminReports,
    fetchAuditLog,
    type AdminStats,
    type SystemConfigItem,
    type AdminReport,
    type AuditLogEntry
} from '../../services/adminService';
import { TabOverview, TabUsers, TabBroadcast, TabIntegrity, TabAnalytics, TabTeacherPerformance } from './components';
import { supabase } from '../../lib/supabase';

type Tab = 'overview' | 'users' | 'broadcast' | 'integrity' | 'analytics' | 'teachers';

const TAB_CONFIG: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview',   label: 'Overview',   icon: LayoutDashboard },
    { id: 'users',      label: 'Users',      icon: Users           },
    { id: 'broadcast',  label: 'Broadcast',  icon: Megaphone       },
    { id: 'integrity',  label: 'Integrity',  icon: ShieldAlert     },
    { id: 'analytics',  label: 'Analytics',  icon: BarChart2       },
    { id: 'teachers',   label: 'Teachers',   icon: GraduationCap   },
];

const STATS_CACHE_TTL = 60_000; // 60 seconds

const AdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [isLoading, setIsLoading] = useState(true);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [adminName, setAdminName] = useState<string>('Admin');
    const [lastLogin, setLastLogin] = useState<string | null>(null);
    const statsLastFetched = useRef<number>(0);
    const [stats, setStats] = useState<AdminStats>({ 
        totalStudents: 0, 
        totalTeachers: 0, 
        systemHealth: 'Degraded', 
        storageObjectBytes: 0, 
        storageDbBytes: 0, 
        aiTokensProcessed: 0, 
        aiEstimatedCost: 0, 
        aiTokensHistory: [], 
        activeSessionsToday: 0,
        aiHoursSaved: 0,
        activeExamsCount: 0,
        activeExamName: null,
        storageHeavyHitters: []
    });
    const [systemConfig, setSystemConfig] = useState<SystemConfigItem[]>([]);
    const [reports, setReports] = useState<AdminReport[]>([]);
    const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);

    const loadData = useCallback(async (force = false) => {
        const now = Date.now();
        const stale = now - statsLastFetched.current > STATS_CACHE_TTL;

        // Only re-fetch stats if cache is stale or forced (manual refresh button)
        if (force || stale) {
            setIsLoading(true);
            const [statsData, configData, reportsData, logData] = await Promise.all([
                fetchAdminStats(),
                fetchSystemConfig(),
                fetchAdminReports(),
                fetchAuditLog()
            ]);
            setStats(statsData);
            setSystemConfig(configData);
            setReports(reportsData);
            setAuditLog(logData);
            statsLastFetched.current = Date.now();
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData(true); // force on first mount
        if (!supabase) return;

        // Resolve admin identity for the activity widget
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) return;
            supabase!.from('users').select('full_name, last_login').eq('id', user.id).single()
                .then(({ data }) => {
                    if (data?.full_name) setAdminName(data.full_name.split(' ')[0]);
                    if (data?.last_login) setLastLogin(data.last_login);
                });
        });

        // PHASE 3: Supabase Realtime Presence Tracking
        const presenceChannel = supabase.channel('global_presence', {
            config: { presence: { key: 'admin_dashboard_' + Math.random().toString(36).substring(7) } },
        });

        presenceChannel
            .on('presence', { event: 'sync' }, () => {
                const newState = presenceChannel.presenceState();
                const activeCount = Object.keys(newState).length;
                setStats(prev => ({ ...prev, activeSessionsToday: activeCount }));
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await presenceChannel.track({
                        role: 'admin',
                        online_at: new Date().toISOString(),
                    });
                }
            });

        return () => {
            if (supabase) {
                supabase.removeChannel(presenceChannel);
            }
        };
    }, [loadData]);

    return (
        <div className="admin-dashboard-container min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors duration-300">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex flex-col gap-6 relative z-10">
                {/* Admin Header & Main Nav */}
                <header className="flex flex-col gap-4 py-4 md:py-6 relative z-30 mb-2">
                    {/* Title row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 m-0 leading-none">
                                Administrator Panel
                            </h1>
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                                    Welcome back, <span className="text-slate-700 dark:text-slate-300 font-semibold">{adminName}</span>
                                </span>
                                {lastLogin && (
                                    <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                                        <Clock size={11} />
                                        {new Date(lastLogin).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                                <button
                                    onClick={() => loadData(true)}
                                    disabled={isLoading}
                                    className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                    title="Force refresh"
                                >
                                    <RefreshCw size={11} className={isLoading ? 'animate-spin' : ''} />
                                    {isLoading ? 'Loading...' : 'Refresh'}
                                </button>
                            </div>
                        </div>

                        {/* Mobile: Hamburger */}
                        <div className="md:hidden relative self-start">
                            <button
                                onClick={() => setMobileNavOpen(v => !v)}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                            >
                                {mobileNavOpen ? <X size={15} /> : <Menu size={15} />}
                                {TAB_CONFIG.find(t => t.id === activeTab)?.label ?? activeTab}
                            </button>
                            <AnimatePresence>
                                {mobileNavOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute left-0 top-full mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 min-w-[160px]"
                                    >
                                        {TAB_CONFIG.map(({ id, label, icon: Icon }) => (
                                            <button
                                                key={id}
                                                onClick={() => { setActiveTab(id); setMobileNavOpen(false); }}
                                                className={`w-full text-left px-4 py-3 text-sm font-semibold border-b last:border-0 border-slate-100 dark:border-slate-700 transition-colors flex items-center gap-2.5 ${
                                                    activeTab === id
                                                        ? 'bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                                                }`}
                                            >
                                                <Icon size={14} />
                                                {label}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Desktop: Tab nav — full width row below title */}
                    <div className="hidden md:flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl gap-0.5 border border-slate-200/60 dark:border-slate-700/60 self-start" style={{ backdropFilter: 'blur(10px)' }}>
                        {TAB_CONFIG.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className={`relative flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors duration-150 z-10 ${
                                    activeTab === id
                                        ? 'text-slate-900 dark:text-slate-100'
                                        : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                                }`}
                            >
                                {activeTab === id && (
                                    <motion.div
                                        layoutId="admin-active-tab"
                                        className="absolute inset-0 bg-white dark:bg-slate-700 rounded-xl shadow-sm"
                                        style={{ zIndex: -1 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                    />
                                )}
                                <Icon size={13} />
                                <span>{label}</span>
                            </button>
                        ))}
                    </div>
                </header>

                {/* Dashboard Content Area */}
                <main className="relative">
                    <AnimatePresence mode="wait">
                        {activeTab === 'overview' && (
                            <TabOverview
                                key="overview"
                                stats={stats}
                                isLoading={isLoading}
                                systemConfig={systemConfig}
                                setSystemConfig={setSystemConfig}
                                reports={reports}
                                setReports={setReports}
                                auditLog={auditLog}
                                setAuditLog={setAuditLog}
                            />
                        )}
                        {activeTab === 'users' && (
                            <TabUsers key="users" />
                        )}
                        {activeTab === 'broadcast' && (
                            <TabBroadcast key="broadcast" />
                        )}
                        {activeTab === 'integrity' && (
                            <TabIntegrity key="integrity" />
                        )}
                        {activeTab === 'analytics' && (
                            <TabAnalytics key="analytics" />
                        )}
                        {activeTab === 'teachers' && (
                            <TabTeacherPerformance key="teachers" />
                        )}
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;
