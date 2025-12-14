import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [hoveredRole, setHoveredRole] = useState<'student' | 'admin' | null>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleRoleClick = (role: string) => {
        if (role === 'student') {
            navigate('/student-login');
            onClose();
        } else if (role === 'admin') {
            window.location.href = 'https://elms.sti.edu/admin';
        }
    };

    const handleMouseEnter = (role: 'student' | 'admin') => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }
        setHoveredRole(role);
    };

    const handleMouseLeave = () => {
        hoverTimeoutRef.current = setTimeout(() => {
            setHoveredRole(null);
        }, 100);
    };

    // Calculate tooltip position based on which role is hovered
    const getTooltipY = () => {
        if (hoveredRole === 'student') return 88;
        if (hoveredRole === 'admin') return 180;
        return 88;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[9999] flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    onClick={onClose}
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/25 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    {/* Modal Container - allows tooltip to show on right */}
                    <div className="relative flex items-start gap-3">
                        {/* Modal */}
                        <motion.div
                            className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-zinc-200/60 dark:border-slate-600/60 p-7 w-[380px] max-w-[92vw]"
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close Button */}
                            <motion.button
                                className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-100 dark:bg-slate-700 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-slate-600 transition-colors"
                                onClick={onClose}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                            </motion.button>

                            {/* Title */}
                            <motion.h2
                                className="text-xl font-semibold text-zinc-800 dark:text-zinc-100 mb-2"
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 }}
                            >
                                Sign In
                            </motion.h2>
                            <motion.p
                                className="text-sm text-zinc-500 dark:text-zinc-400 mb-6"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.08 }}
                            >
                                Choose your account type to continue
                            </motion.p>

                            {/* Role Options */}
                            <div className="flex flex-col gap-3">
                                {/* Student Option */}
                                <div 
                                    onMouseEnter={() => handleMouseEnter('student')}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <motion.button
                                        className="w-full flex items-center gap-4 p-4 rounded-xl border border-zinc-200 dark:border-slate-600 bg-white dark:bg-slate-700/50 hover:border-blue-300 dark:hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-500/10 transition-all text-left group"
                                        onClick={() => handleRoleClick('student')}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 }}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                    >
                                        <motion.div 
                                            className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 dark:group-hover:bg-blue-500/30 transition-colors"
                                            initial={{ scale: 0, rotate: -10 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ delay: 0.15, type: 'spring', stiffness: 300 }}
                                        >
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="8" r="4"/>
                                                <path d="M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2"/>
                                            </svg>
                                        </motion.div>
                                        <div className="flex-1 min-w-0">
                                            <motion.span 
                                                className="text-base font-medium text-zinc-700 dark:text-zinc-200 block"
                                                initial={{ opacity: 0, x: -5 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.18 }}
                                            >
                                                Student
                                            </motion.span>
                                            <motion.span 
                                                className="text-sm text-zinc-400 dark:text-zinc-500"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.22 }}
                                            >
                                                Access courses & materials
                                            </motion.span>
                                        </div>
                                        <motion.svg 
                                            className="w-5 h-5 text-zinc-300 dark:text-zinc-600 group-hover:text-blue-400 dark:group-hover:text-blue-400 transition-colors" 
                                            fill="none" 
                                            stroke="currentColor" 
                                            viewBox="0 0 24 24"
                                            initial={{ opacity: 0, x: -5 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </motion.svg>
                                    </motion.button>
                                </div>

                                {/* Admin Option */}
                                <div 
                                    onMouseEnter={() => handleMouseEnter('admin')}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <motion.button
                                        className="w-full flex items-center gap-4 p-4 rounded-xl border border-zinc-200 dark:border-slate-600 bg-zinc-50/50 dark:bg-slate-700/30 transition-all text-left group cursor-not-allowed"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 0.7, x: 0 }}
                                        transition={{ delay: 0.15 }}
                                    >
                                        <motion.div 
                                            className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-slate-600/50 flex items-center justify-center flex-shrink-0 transition-colors"
                                            initial={{ scale: 0, rotate: -10 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                                        >
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                                <circle cx="12" cy="16" r="1"/>
                                            </svg>
                                        </motion.div>
                                        <div className="flex-1 min-w-0">
                                            <motion.span 
                                                className="text-base font-medium text-zinc-500 dark:text-zinc-400 block"
                                                initial={{ opacity: 0, x: -5 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.23 }}
                                            >
                                                Admin
                                            </motion.span>
                                            <motion.span 
                                                className="text-sm text-zinc-400 dark:text-zinc-500"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.27 }}
                                            >
                                                Manage & configure system
                                            </motion.span>
                                        </div>
                                        <motion.div
                                            className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-500/20"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.25, type: 'spring' }}
                                        >
                                            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Soon</span>
                                        </motion.div>
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>

                        {/* Single Tooltip that slides between positions */}
                        <AnimatePresence mode="wait">
                            {hoveredRole && (
                                <motion.div
                                    key={hoveredRole}
                                    className="absolute left-full ml-3 w-[240px] z-10"
                                    initial={{ opacity: 0, x: -15, y: getTooltipY() }}
                                    animate={{ 
                                        opacity: 1, 
                                        x: 0, 
                                        y: getTooltipY(),
                                    }}
                                    exit={{ opacity: 0, x: -15 }}
                                    transition={{ 
                                        duration: 0.2, 
                                        ease: [0.4, 0, 0.2, 1],
                                        y: { type: 'spring', stiffness: 300, damping: 25 }
                                    }}
                                    style={{ top: 0 }}
                                    onMouseEnter={() => handleMouseEnter(hoveredRole)}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <motion.div 
                                        className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg border border-zinc-200 dark:border-slate-600 overflow-hidden"
                                        layout
                                    >
                                        {hoveredRole === 'student' ? (
                                            <>
                                                <motion.div 
                                                    className="flex items-center gap-2.5 mb-2"
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.05 }}
                                                >
                                                    <motion.span 
                                                        className="text-xl"
                                                        initial={{ scale: 0, rotate: -20 }}
                                                        animate={{ scale: 1, rotate: 0 }}
                                                        transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
                                                    >
                                                        👋
                                                    </motion.span>
                                                    <motion.span 
                                                        className="text-sm font-semibold text-blue-600 dark:text-blue-400"
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.08 }}
                                                    >
                                                        Welcome, Student!
                                                    </motion.span>
                                                </motion.div>
                                                <motion.p 
                                                    className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed"
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.12 }}
                                                >
                                                    Sign in to access your courses, view grades, and track your progress.
                                                </motion.p>
                                            </>
                                        ) : (
                                            <>
                                                <motion.div 
                                                    className="flex items-center gap-2.5 mb-2"
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.05 }}
                                                >
                                                    <motion.span 
                                                        className="text-xl"
                                                        initial={{ scale: 0, rotate: 20 }}
                                                        animate={{ scale: 1, rotate: 0 }}
                                                        transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
                                                    >
                                                        🚧
                                                    </motion.span>
                                                    <motion.span 
                                                        className="text-sm font-semibold text-amber-500 dark:text-amber-400"
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.08 }}
                                                    >
                                                        Under Construction
                                                    </motion.span>
                                                </motion.div>
                                                <motion.p 
                                                    className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed"
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.12 }}
                                                >
                                                    Admin portal is being developed. Check back later for updates.
                                                </motion.p>
                                            </>
                                        )}
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default LoginModal;
