import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Clock, RefreshCw, LayoutDashboard, Users, Megaphone, ShieldAlert, BarChart2 } from 'lucide-react';
import { TabOverview, TabUsers, TabBroadcast, TabIntegrity, TabAnalytics } from './components';
import { AnimatedThemeToggler } from '../../components/ui/animated-theme-toggler';
import { useAdminState } from './useAdminState';
import { ToastProvider } from './contexts/ToastContext';

type Tab = 'overview' | 'users' | 'broadcast' | 'integrity' | 'analytics';

const TAB_CONFIG: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview',   label: 'Overview',   icon: LayoutDashboard },
    { id: 'users',      label: 'Users',      icon: Users           },
    { id: 'broadcast',  label: 'Broadcast',  icon: Megaphone       },
    { id: 'integrity',  label: 'Integrity',  icon: ShieldAlert     },
    { id: 'analytics',  label: 'Analytics',  icon: BarChart2       },
];

const AdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    
    // Extracted global state logic
    const { adminName, lastLogin, activeSessions } = useAdminState();

    // Global force refresh trigger passed to active tab if needed
    const [globalRefreshTrigger, setGlobalRefreshTrigger] = useState(0);

    // Lock body scroll when mobile nav is open
    useEffect(() => {
        if (mobileNavOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [mobileNavOpen]);

    return (
        <ToastProvider>
            <div className="admin-dashboard-container min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors duration-300">
                <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex flex-col gap-6 relative z-10">
                    {/* Admin Header & Main Nav */}
                <header className="flex flex-col gap-4 py-4 md:py-6 relative z-30 mb-2">
                    {/* Title row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 m-0 leading-none">
                                    Administrator Panel
                                </h1>
                                <AnimatedThemeToggler className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors shadow-sm border border-slate-200 dark:border-slate-700" />
                            </div>
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
                                    onClick={() => setGlobalRefreshTrigger(Date.now())}
                                    className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                    title="Force refresh"
                                >
                                    <RefreshCw size={11} />
                                    Refresh
                                </button>
                            </div>
                        </div>

                        {/* Mobile: Hamburger */}
                        <div className="md:hidden relative self-start z-50">
                            <button
                                onClick={() => setMobileNavOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                            >
                                <Menu size={15} />
                                {TAB_CONFIG.find(t => t.id === activeTab)?.label ?? activeTab}
                            </button>
                            <AnimatePresence>
                                {mobileNavOpen && (
                                    <>
                                        {/* Backdrop */}
                                        <motion.div 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            onClick={() => setMobileNavOpen(false)}
                                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
                                            style={{ willChange: 'opacity' }}
                                        />
                                        {/* Slide-in Drawer */}
                                        <motion.div
                                            initial={{ x: '-100%' }}
                                            animate={{ x: 0 }}
                                            exit={{ x: '-100%' }}
                                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                            className="fixed left-0 top-0 bottom-0 w-[280px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-2xl border-r border-slate-200/50 dark:border-slate-700/50 z-[101] flex flex-col"
                                            style={{ willChange: 'transform' }}
                                        >
                                            <div className="flex items-center justify-between p-4 border-b border-slate-200/50 dark:border-slate-700/50">
                                                <span className="font-bold text-slate-900 dark:text-slate-100">Menu</span>
                                                <button onClick={() => setMobileNavOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                                                {TAB_CONFIG.map(({ id, label, icon: Icon }) => (
                                                    <button
                                                        key={id}
                                                        onClick={() => { setActiveTab(id); setMobileNavOpen(false); }}
                                                        className={`w-full text-left px-4 py-3 text-sm font-semibold rounded-xl transition-all flex items-center gap-3 ${
                                                            activeTab === id
                                                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                        }`}
                                                    >
                                                        <Icon size={16} className={activeTab === id ? 'text-blue-600 dark:text-blue-400' : ''} />
                                                        {label}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    </>
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
                                globalRefreshTrigger={globalRefreshTrigger}
                                activeSessions={activeSessions}
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
                    </AnimatePresence>
                </main>
            </div>
            </div>
        </ToastProvider>
    );
};

export default AdminDashboard;
