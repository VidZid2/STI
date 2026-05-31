import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, Shield, User, GraduationCap, Mail, Bell, ChevronLeft, ChevronRight, X, Copy, ExternalLink, Clock, MoreVertical, LayoutGrid, List, UserX } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { logAuditEvent, getActorInfo, sendNotification } from '../../../services/adminService';
import { Shimmer } from './shared/Shimmer';
import { Tooltip } from './shared/Tooltip';
import { useToast } from '../contexts/ToastContext';

interface UserData {
    id: string;
    full_name: string;
    email: string;
    role: string;
    student_id: string;
    created_at?: string;
}

const PAGE_SIZE = 12; // Adjusted for grid layout
const ROLE_OPTIONS = ['all', 'student', 'teacher', 'admin'] as const;

const TabUsers: React.FC = () => {
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [managingUser, setManagingUser] = useState<UserData | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const filterRef = useRef<HTMLDivElement>(null);

    // Close filter dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
                setShowFilterDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch users with server-side pagination and filtering
    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoading(true);
            try {
                if (!supabase) throw new Error('Supabase not initialized');

                const from = page * PAGE_SIZE;
                const to = from + PAGE_SIZE - 1;

                let query = supabase
                    .from('users')
                    .select('id, full_name, email, role, student_id, created_at', { count: 'exact' });

                if (roleFilter !== 'all') {
                    query = query.eq('role', roleFilter);
                }

                if (search.trim()) {
                    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,student_id.ilike.%${search}%`);
                }

                const { data, error, count } = await query
                    .order('full_name', { ascending: true })
                    .range(from, to);

                if (error) throw error;
                setUsers(data || []);
                setTotalCount(count || 0);
            } catch (err) {
                console.error('[AdminUsers] Failed to fetch users:', err);
                setUsers([]);
                setTotalCount(0);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, [page, roleFilter, search]);

    useEffect(() => {
        setPage(0);
    }, [roleFilter, search]);

    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    const showingFrom = totalCount === 0 ? 0 : page * PAGE_SIZE + 1;
    const showingTo = Math.min((page + 1) * PAGE_SIZE, totalCount);

    const getRoleConfig = (role: string) => {
        switch (role) {
            case 'admin': return { icon: Shield, color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30', border: 'border-purple-200 dark:border-purple-700/50', ring: 'hover:ring-purple-400 dark:hover:ring-purple-500/50', label: 'Admin' };
            case 'teacher': return { icon: GraduationCap, color: 'text-indigo-700 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-900/30', border: 'border-indigo-200 dark:border-indigo-700/50', ring: 'hover:ring-indigo-400 dark:hover:ring-indigo-500/50', label: 'Teacher' };
            case 'student': return { icon: User, color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-700/50', ring: 'hover:ring-blue-400 dark:hover:ring-blue-500/50', label: 'Student' };
            default: return { icon: User, color: 'text-slate-700 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700', ring: 'hover:ring-slate-400 dark:hover:ring-slate-500/50', label: role };
        }
    };
    const { showToast } = useToast();

    const handleNotify = async (user: UserData) => {
        try {
            const actor = await getActorInfo();
            const ok = await sendNotification(
                user.id,
                'Message from Admin',
                `You have received a direct notification from ${actor.name}.`,
                'info'
            );
            await logAuditEvent(
                'security_alert',
                actor.name,
                actor.role,
                `Admin sent direct notification to ${user.full_name} (${user.role})`,
                { target_user_id: user.id }
            );
            if (ok) {
                showToast(`Notification dispatched to ${user.full_name}.`, 'success');
            } else {
                showToast(`Notification queued for ${user.full_name} (offline sync).`, 'warning');
            }
        } catch (e) {
            console.error('Failed to send notification', e);
            showToast(`Failed to notify ${user.full_name}.`, 'error');
        }
    };

    const handleCopyId = (id: string) => {
        navigator.clipboard.writeText(id);
        showToast('Copied to clipboard.', 'success');
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'Unknown';
        return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex flex-col gap-6 h-full relative"
        >
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-black/5 dark:border-white/5 p-6 shadow-sm flex flex-col flex-1 min-h-[600px] transition-colors">
                
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">User Management</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">View and manage institutional accounts</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="Search name, email, ID..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-slate-100 transition-all w-full"
                            />
                        </div>
                        {/* Filter Dropdown */}
                        <div className="relative" ref={filterRef}>
                            <button 
                                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                                className={`p-2 border rounded-xl transition-colors flex items-center gap-1.5 h-full ${
                                    roleFilter !== 'all' 
                                        ? 'border-blue-300 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:border-blue-700/50 dark:text-blue-400' 
                                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                                }`}
                            >
                                <Filter size={18} />
                                {roleFilter !== 'all' && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider">{roleFilter}</span>
                                )}
                            </button>
                            <AnimatePresence>
                                {showFilterDropdown && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -5, scale: 0.95 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden z-50"
                                    >
                                        <div className="p-1.5">
                                            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filter by Role</div>
                                            {ROLE_OPTIONS.map(opt => (
                                                <button
                                                    key={opt}
                                                    onClick={() => { setRoleFilter(opt); setShowFilterDropdown(false); }}
                                                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors capitalize flex items-center justify-between ${
                                                        roleFilter === opt 
                                                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold' 
                                                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                                    }`}
                                                >
                                                    {opt === 'all' ? 'All Roles' : opt}
                                                    {roleFilter === opt && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        {/* View Toggle */}
                        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                            <Tooltip content="Grid view">
                                <button 
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                >
                                    <LayoutGrid size={16} />
                                </button>
                            </Tooltip>
                            <Tooltip content="List view">
                                <button 
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                >
                                    <List size={16} />
                                </button>
                            </Tooltip>
                        </div>
                    </div>
                </div>

                {/* Active Filter Pill */}
                {roleFilter !== 'all' && (
                    <div className="flex items-center gap-2 mb-6">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Filtered by:</span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold rounded-lg border border-blue-100 dark:border-blue-800/50 capitalize">
                            {roleFilter}
                            <button onClick={() => setRoleFilter('all')} className="hover:text-blue-900 dark:hover:text-blue-200 transition-colors">
                                <X size={12} />
                            </button>
                        </span>
                    </div>
                )}

                {/* Data View */}
                <div className="w-full flex-1 mb-6">
                    {isLoading ? (
                        <div className={
                            viewMode === 'grid' 
                                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" 
                                : "flex flex-col gap-3"
                        }>
                            {[...Array(PAGE_SIZE)].map((_, i) => (
                                <div key={i} className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 ${viewMode === 'list' ? 'flex items-center gap-4' : 'flex flex-col'}`}>
                                    <div className={`flex items-start ${viewMode === 'list' ? 'w-1/3' : 'mb-4'}`}>
                                        <div className="flex items-center gap-3">
                                            <Shimmer className="w-10 h-10 rounded-xl" />
                                            <div>
                                                <Shimmer className="h-4 w-32 mb-1.5" />
                                                <Shimmer className="h-2 w-16" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`flex ${viewMode === 'list' ? 'flex-1 items-center gap-6' : 'flex-col gap-3'}`}>
                                        <div className="flex items-center gap-2">
                                            <Shimmer className="w-3 h-3 rounded-full" />
                                            <Shimmer className="h-3 w-40" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Shimmer className="w-3 h-3 rounded-full" />
                                            <Shimmer className="h-3 w-24" />
                                        </div>
                                    </div>
                                    <div className={`flex gap-2 ${viewMode === 'list' ? 'ml-auto' : 'mt-5 pt-4 border-t border-slate-100 dark:border-slate-700/50'}`}>
                                        <Shimmer className="flex-1 h-8 rounded-lg" />
                                        <Shimmer className="flex-1 h-8 rounded-lg" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : users.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center h-[500px] gap-4"
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-2xl scale-150 animate-pulse" />
                                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/80 rounded-3xl flex items-center justify-center border border-slate-200 dark:border-slate-700 relative shadow-inner rotate-3">
                                    <UserX size={32} className="text-slate-400 dark:text-slate-500 -rotate-3" />
                                </div>
                            </div>
                            <div className="text-center mt-2">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">No users found</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-[250px] leading-relaxed">
                                    {search || roleFilter !== 'all' ? "We couldn't find anyone matching your current filters." : "There are currently no users registered in the system."}
                                </p>
                            </div>
                            {(search || roleFilter !== 'all') && (
                                <button 
                                    onClick={() => { setSearch(''); setRoleFilter('all'); }}
                                    className="mt-2 px-5 py-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold text-sm rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                >
                                    Clear all filters
                                </button>
                            )}
                        </motion.div>
                    ) : (
                        <div className={
                            viewMode === 'grid' 
                                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" 
                                : "flex flex-col gap-3"
                        }>
                            {users.map((user, idx) => {
                                const roleConf = getRoleConfig(user.role);
                                const Icon = roleConf.icon;
                                
                                return (
                                    <motion.div 
                                        key={user.id}
                                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        whileHover={{ y: -4, scale: 1.01 }}
                                        transition={{ delay: idx * 0.05, type: "spring", stiffness: 300, damping: 25 }}
                                        className={`group relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all overflow-hidden hover:ring-2 hover:ring-offset-2 hover:ring-offset-white dark:hover:ring-offset-slate-900 ${roleConf.ring} ${viewMode === 'list' ? 'flex items-center p-4 gap-4' : 'flex flex-col p-5'}`}
                                    >
                                        {/* Highlight Bar */}
                                        <div className={`absolute top-0 left-0 w-full h-1 ${roleConf.bg} opacity-0 group-hover:opacity-100 transition-opacity`} />
                                        
                                        <div className={`flex items-start ${viewMode === 'list' ? 'gap-4 w-1/3' : 'justify-between mb-4'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${roleConf.bg} ${roleConf.color} border ${roleConf.border}`}>
                                                    {user.full_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate" title={user.full_name}>{user.full_name}</h3>
                                                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider mt-1 ${roleConf.color}`}>
                                                        <Icon size={10} /> {roleConf.label}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className={`flex ${viewMode === 'list' ? 'flex-1 items-center gap-6 justify-between' : 'flex-col gap-3 flex-1'}`}>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                <Mail size={12} className="text-slate-400 shrink-0" />
                                                <span className="truncate">{user.email}</span>
                                                <Tooltip content="Copy Email"><button onClick={() => handleCopyId(user.email)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-slate-900 dark:hover:text-slate-100 transition-all"><Copy size={10}/></button></Tooltip>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                <ExternalLink size={12} className="text-slate-400 shrink-0" />
                                                <span className="font-mono bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-700 truncate">{user.student_id}</span>
                                                <Tooltip content="Copy ID"><button onClick={() => handleCopyId(user.student_id)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-slate-900 dark:hover:text-slate-100 transition-all"><Copy size={10}/></button></Tooltip>
                                            </div>
                                        </div>

                                        <div className={`flex gap-2 ${viewMode === 'list' ? 'ml-auto' : 'mt-5 pt-4 border-t border-slate-100 dark:border-slate-700/50'}`}>
                                            <button 
                                                onClick={() => handleNotify(user)}
                                                className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-blue-100 dark:hover:border-blue-800/50"
                                            >
                                                <Bell size={12} /> Notify
                                            </button>
                                            <button 
                                                onClick={() => setManagingUser(user)}
                                                className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                                            >
                                                <MoreVertical size={12} /> Manage
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer: Pagination & Count */}
                <div className="flex items-center justify-between pt-4 mt-auto border-t border-slate-100 dark:border-slate-800">
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {totalCount > 0 ? (
                            <>Showing <span className="font-bold text-slate-700 dark:text-slate-300">{showingFrom}–{showingTo}</span> of <span className="font-bold text-slate-700 dark:text-slate-300">{totalCount.toLocaleString()}</span> users</>
                        ) : (
                            'No records found'
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Tooltip content="Previous Page">
                            <button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={16} />
                            </button>
                        </Tooltip>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 min-w-[60px] text-center">
                            Page {page + 1} of {totalPages}
                        </span>
                        <Tooltip content="Next Page">
                            <button
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </Tooltip>
                    </div>
                </div>

            </div>

            {/* Slide-in Manage User Panel */}
            <AnimatePresence>
                {managingUser && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setManagingUser(null)}
                            className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[9998]"
                        />
                        <motion.div
                            initial={{ x: '100%', opacity: 0.8 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '100%', opacity: 0.8 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 bottom-0 w-full sm:w-[400px] bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-700 z-[9999] flex flex-col"
                        >
                            {/* Panel Header */}
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-800/20">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 ${getRoleConfig(managingUser.role).bg} ${getRoleConfig(managingUser.role).color} border ${getRoleConfig(managingUser.role).border}`}>
                                        {managingUser.full_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{managingUser.full_name}</h3>
                                        <div className={`mt-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${getRoleConfig(managingUser.role).color}`}>
                                            {React.createElement(getRoleConfig(managingUser.role).icon, { size: 12 })}
                                            {getRoleConfig(managingUser.role).label}
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setManagingUser(null)} 
                                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Panel Body */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">User Details</h4>
                                    <div className="space-y-2">
                                        <div className="group flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 transition-colors hover:border-slate-300 dark:hover:border-slate-600">
                                            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                                                <div className="p-1.5 bg-white dark:bg-slate-700 rounded-md shadow-sm">
                                                    <Mail size={14} className="text-slate-500 dark:text-slate-400" />
                                                </div>
                                                <span className="font-medium">{managingUser.email}</span>
                                            </div>
                                            <Tooltip content="Copy Email" position="left"><button onClick={() => handleCopyId(managingUser.email)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-slate-200 dark:bg-slate-600 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all">
                                                <Copy size={14} />
                                            </button></Tooltip>
                                        </div>
                                        <div className="group flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 transition-colors hover:border-slate-300 dark:hover:border-slate-600">
                                            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                                                <div className="p-1.5 bg-white dark:bg-slate-700 rounded-md shadow-sm">
                                                    <ExternalLink size={14} className="text-slate-500 dark:text-slate-400" />
                                                </div>
                                                <span className="font-mono text-xs">{managingUser.student_id}</span>
                                            </div>
                                            <Tooltip content="Copy ID" position="left"><button onClick={() => handleCopyId(managingUser.student_id)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-slate-200 dark:bg-slate-600 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all">
                                                <Copy size={14} />
                                            </button></Tooltip>
                                        </div>
                                        <div className="group flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 transition-colors hover:border-slate-300 dark:hover:border-slate-600">
                                            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                                                <div className="p-1.5 bg-white dark:bg-slate-700 rounded-md shadow-sm">
                                                    <Shield size={14} className="text-slate-500 dark:text-slate-400" />
                                                </div>
                                                <span className="font-mono text-xs">{managingUser.id}</span>
                                            </div>
                                            <Tooltip content="Copy UUID" position="left"><button onClick={() => handleCopyId(managingUser.id)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-slate-200 dark:bg-slate-600 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all">
                                                <Copy size={14} />
                                            </button></Tooltip>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400">
                                            <div className="p-1.5 bg-white dark:bg-slate-700 rounded-md shadow-sm">
                                                <Clock size={14} className="text-slate-500" />
                                            </div>
                                            <span>Joined {formatDate(managingUser.created_at)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Panel Footer Actions */}
                            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                                <button
                                    onClick={() => { handleNotify(managingUser); setManagingUser(null); }}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-blue-600/20 active:scale-[0.98]"
                                >
                                    <Bell size={16} /> Dispatch Global Notification
                                </button>
                                <button
                                    onClick={() => {
                                        if (managingUser.role === 'teacher') window.open('/teacher-dashboard', '_blank');
                                        else if (managingUser.role === 'student') window.open('/student-dashboard', '_blank');
                                    }}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-all active:scale-[0.98]"
                                >
                                    <ExternalLink size={16} /> Simulate Dashboard Login
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

        </motion.div>
    );
};

export default TabUsers;
