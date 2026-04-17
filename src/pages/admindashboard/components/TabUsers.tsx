import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, Shield, User, GraduationCap, Mail, Bell, ChevronLeft, ChevronRight, X, Copy, ExternalLink, Clock } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { logAuditEvent, getActorInfo, sendNotification } from '../../../services/adminService';

interface UserData {
    id: string;
    full_name: string;
    email: string;
    role: string;
    student_id: string;
    created_at?: string;
}

const PAGE_SIZE = 10;
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

                // Build query
                let query = supabase
                    .from('users')
                    .select('id, full_name, email, role, student_id, created_at', { count: 'exact' });

                // Apply role filter
                if (roleFilter !== 'all') {
                    query = query.eq('role', roleFilter);
                }

                // Apply search filter
                if (search.trim()) {
                    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,student_id.ilike.%${search}%`);
                }

                // Apply pagination
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

    // Reset page when filters change
    useEffect(() => {
        setPage(0);
    }, [roleFilter, search]);

    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    const showingFrom = totalCount === 0 ? 0 : page * PAGE_SIZE + 1;
    const showingTo = Math.min((page + 1) * PAGE_SIZE, totalCount);

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin': return <span className="bg-purple-100 text-purple-700 px-2.5 py-1 inline-flex items-center gap-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider w-max"><Shield size={12} /> Admin</span>;
            case 'teacher': return <span className="bg-indigo-100 text-indigo-700 px-2.5 py-1 inline-flex items-center gap-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider w-max"><GraduationCap size={12} /> Teacher</span>;
            case 'student': return <span className="bg-blue-100 text-blue-700 px-2.5 py-1 inline-flex items-center gap-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider w-max"><User size={12} /> Student</span>;
            default: return <span className="bg-slate-100 text-slate-700 px-2.5 py-1 inline-flex items-center gap-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider w-max">{role}</span>;
        }
    };

    const handleNotify = async (user: UserData) => {
        try {
            const actor = await getActorInfo();
            // Insert into notifications table so the user's bell picks it up
            const ok = await sendNotification(
                user.id,
                'Message from Admin',
                `You have received a direct notification from ${actor.name}.`,
                'info'
            );
            // Also log to audit trail
            await logAuditEvent(
                'security_alert',
                actor.name,
                actor.role,
                `Admin sent direct notification to ${user.full_name} (${user.role})`,
                { target_user_id: user.id }
            );
            if (ok) {
                alert(`Notification sent to ${user.full_name}!`);
            } else {
                alert(`Notification queued for ${user.full_name} (DB write failed, check console).`);
            }
        } catch (e) {
            console.error('Failed to send notification', e);
            alert(`Failed to notify ${user.full_name}.`);
        }
    };

    const handleCopyId = (id: string) => {
        navigator.clipboard.writeText(id);
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
            className="flex flex-col gap-6"
        >
            <div className="bg-white rounded-2xl border border-black/5 p-6 shadow-sm flex flex-col min-h-[500px]">
                
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">User Management</h2>
                        <p className="text-sm text-slate-500">View and manage institutional accounts</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="Search name, email, ID..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-full sm:w-[260px]"
                            />
                        </div>
                        {/* Filter Dropdown */}
                        <div className="relative" ref={filterRef}>
                            <button 
                                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                                className={`p-2 border rounded-xl transition-colors flex items-center gap-1.5 ${
                                    roleFilter !== 'all' 
                                        ? 'border-blue-300 bg-blue-50 text-blue-600' 
                                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
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
                                        className="absolute right-0 top-full mt-2 w-44 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50"
                                    >
                                        <div className="p-1.5">
                                            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filter by Role</div>
                                            {ROLE_OPTIONS.map(opt => (
                                                <button
                                                    key={opt}
                                                    onClick={() => { setRoleFilter(opt); setShowFilterDropdown(false); }}
                                                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors capitalize flex items-center justify-between ${
                                                        roleFilter === opt 
                                                            ? 'bg-blue-50 text-blue-700 font-semibold' 
                                                            : 'text-slate-700 hover:bg-slate-50'
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
                    </div>
                </div>

                {/* Active Filter Pill */}
                {roleFilter !== 'all' && (
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-xs text-slate-500">Filtered by:</span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg border border-blue-100 capitalize">
                            {roleFilter}
                            <button onClick={() => setRoleFilter('all')} className="hover:text-blue-900 transition-colors">
                                <X size={12} />
                            </button>
                        </span>
                    </div>
                )}

                {/* Table Data */}
                <div className="w-full flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="pb-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Entity Name</th>
                                <th className="pb-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-[20%]">Identifier</th>
                                <th className="pb-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-[15%]">Role</th>
                                <th className="pb-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-[160px] text-right px-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center text-slate-400 text-sm">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
                                            Loading users from database...
                                        </div>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center text-slate-400 text-sm">
                                        <User size={28} className="mx-auto mb-2 text-slate-300" />
                                        No users found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user, idx) => (
                                    <motion.tr 
                                        key={user.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.03 }}
                                        className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors group"
                                    >
                                        <td className="py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                                                    user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                    user.role === 'teacher' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                    {user.full_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-semibold text-slate-900 text-sm truncate">{user.full_name}</div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate"><Mail size={10} /> {user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <div className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded inline-block">
                                                {user.student_id}
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            {getRoleBadge(user.role)}
                                        </td>
                                        <td className="py-4 text-right">
                                            <div className="flex justify-end items-center gap-2 pr-2">
                                                <button 
                                                    onClick={() => handleNotify(user)}
                                                    className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 hover:text-blue-700 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 shadow-sm border border-blue-100/60 rounded-lg transition-colors"
                                                >
                                                    <Bell size={12} /> Notify
                                                </button>
                                                <button 
                                                    onClick={() => setManagingUser(user)}
                                                    className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 shadow-sm border border-slate-200/60 rounded-lg transition-colors"
                                                >
                                                    Manage
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer: Pagination & Count */}
                <div className="flex items-center justify-between pt-4 mt-auto border-t border-slate-100">
                    <div className="text-xs text-slate-500 font-medium">
                        {totalCount > 0 ? (
                            <>Showing <span className="font-bold text-slate-700">{showingFrom}–{showingTo}</span> of <span className="font-bold text-slate-700">{totalCount.toLocaleString()}</span> users</>
                        ) : (
                            'No records found'
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-xs font-semibold text-slate-700 min-w-[60px] text-center">
                            Page {page + 1} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1}
                            className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

            </div>

            {/* Manage User Modal */}
            <AnimatePresence>
                {managingUser && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                        onClick={() => setManagingUser(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: 20 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            className="bg-white rounded-2xl border border-black/10 shadow-2xl w-full max-w-md overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="p-6 pb-4 flex items-start justify-between border-b border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${
                                        managingUser.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                        managingUser.role === 'teacher' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                        {managingUser.full_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">{managingUser.full_name}</h3>
                                        <div className="mt-1">{getRoleBadge(managingUser.role)}</div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setManagingUser(null)} 
                                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 space-y-4">
                                {/* Info Fields */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Mail size={14} className="text-slate-400" />
                                            <span className="font-medium">{managingUser.email}</span>
                                        </div>
                                        <button 
                                            onClick={() => handleCopyId(managingUser.email)} 
                                            className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors"
                                            title="Copy email"
                                        >
                                            <Copy size={13} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <ExternalLink size={14} className="text-slate-400" />
                                            <span className="font-mono text-xs">{managingUser.student_id}</span>
                                        </div>
                                        <button 
                                            onClick={() => handleCopyId(managingUser.student_id)} 
                                            className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors"
                                            title="Copy ID"
                                        >
                                            <Copy size={13} />
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-600">
                                        <Clock size={14} className="text-slate-400" />
                                        <span>Joined {formatDate(managingUser.created_at)}</span>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Shield size={14} className="text-slate-400" />
                                            <span className="font-mono text-xs">{managingUser.id}</span>
                                        </div>
                                        <button 
                                            onClick={() => handleCopyId(managingUser.id)} 
                                            className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors"
                                            title="Copy UUID"
                                        >
                                            <Copy size={13} />
                                        </button>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="pt-3 border-t border-slate-100 space-y-2">
                                    <button
                                        onClick={() => { handleNotify(managingUser); setManagingUser(null); }}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                                    >
                                        <Bell size={15} /> Send Platform Notification
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (managingUser.role === 'teacher') window.open('/teacher-dashboard', '_blank');
                                            else if (managingUser.role === 'student') window.open('/student-dashboard', '_blank');
                                        }}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
                                    >
                                        <ExternalLink size={15} /> View Dashboard as {managingUser.role}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </motion.div>
    );
};

export default TabUsers;
