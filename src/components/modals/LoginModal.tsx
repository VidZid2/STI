import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
    ArrowRight, ArrowLeft, X,
    CheckCircle, XCircle, KeySquare, Contact
} from 'lucide-react';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
type ToastType = { message: string; type: 'success' | 'error' } | null;

function Toast({ toast }: { toast: ToastType }) {
    return (
        <AnimatePresence>
            {toast && (
                <motion.div
                    className="fixed top-5 right-5 z-[10000] flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl max-w-sm"
                    style={{ background: '#18181b', border: '1px solid #27272a' }}
                    initial={{ opacity: 0, y: -16, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -16, scale: 0.92 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                >
                    {toast.type === 'success'
                        ? <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                        : <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
                    <p className="text-sm font-medium text-white tracking-tight">{toast.message}</p>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();

    // 'roles' | 'student' | 'teacher' | 'admin'
    const [view, setView] = useState<'roles' | 'student' | 'teacher' | 'admin'>('roles');
    const [isTeacherMode, setIsTeacherMode] = useState(false);
    const [toast, setToast] = useState<ToastType>(null);

    // Reset view when modal closes
    useEffect(() => {
        if (!isOpen) setTimeout(() => setView('roles'), 300);
    }, [isOpen]);

    // Auto-clear toast
    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 4000);
        return () => clearTimeout(t);
    }, [toast]);

    const handleRoleSelect = (role: 'student' | 'teacher' | 'admin') => {
        if (role === 'admin') {
            navigate('/admin-login');
            onClose();
        } else {
            setIsTeacherMode(role === 'teacher');
            navigate('/student-login', { state: { isTeacherMode: role === 'teacher' } });
            onClose();
        }
    };

    return (
        <>
            <Toast toast={toast} />

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        onClick={onClose}
                    >
                        {/* Backdrop */}
                        <motion.div
                            className="absolute inset-0"
                            style={{ background: 'rgba(4,8,28,0.72)', backdropFilter: 'blur(14px)' }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        />

                        {/* Glow orbs */}
                        <div className="absolute w-96 h-96 rounded-full pointer-events-none"
                            style={{ background: 'radial-gradient(circle, rgba(30,64,175,0.28) 0%, transparent 70%)', filter: 'blur(60px)', top: '20%', left: '30%' }} />
                        <div className="absolute w-64 h-64 rounded-full pointer-events-none"
                            style={{ background: 'radial-gradient(circle, rgba(234,179,8,0.12) 0%, transparent 70%)', filter: 'blur(50px)', bottom: '20%', right: '30%' }} />

                        {/* ── Card ── */}
                        <motion.div
                            className="relative w-full max-w-[960px] rounded-[28px] overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-[540px]"
                            style={{
                                background: '#ffffff',
                                boxShadow: '0 40px 100px rgba(0,0,10,0.1), 0 0 0 1px rgba(0,0,0,0.05)',
                            }}
                            initial={{ opacity: 0, scale: 0.88, y: 28 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.88, y: 28 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 24, mass: 0.9 }}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Decorative glows inside card */}
                            <div className="absolute bottom-0 left-0 w-72 h-72 pointer-events-none"
                                style={{ background: 'radial-gradient(circle, rgba(234,179,8,0.2) 0%, transparent 70%)', filter: 'blur(40px)' }} />

                            {/* ── LEFT PANEL ── */}
                            <div className="relative hidden md:flex flex-col justify-between p-10 select-none overflow-hidden bg-[#ffffff]">
                                {/* The Picture Background */}
                                <div 
                                    className="absolute inset-0 z-0 bg-cover bg-center"
                                    style={{ backgroundImage: 'url(/Picture.png)' }}
                                />
                                
                                {/* Fading Effect at the bottom */}
                                <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-white/40 to-[#ffffff]" />

                                {/* STI Logo */}
                                <motion.div
                                    className="relative z-10"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 24 }}
                                >
                                    <img src="/file.svg" alt="STI Logo" className="h-14 w-14 object-cover rounded-2xl shadow-2xl" />
                                </motion.div>

                                {/* Bottom Content Space */}
                                <div className="relative z-10 mt-auto pt-20 pb-4">
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="flex flex-col gap-4"
                                    >
                                        <p className="text-[10px] font-bold tracking-[0.2em] text-neutral-400 uppercase">
                                            Engineered for Performance
                                        </p>
                                        
                                        <div className="flex flex-wrap items-center gap-5 opacity-80 hover:opacity-100 transition-opacity duration-300 mt-2">
                                            {/* React */}
                                            <img 
                                                src="/react-logo.svg" 
                                                alt="React" 
                                                className="h-6 object-contain grayscale hover:grayscale-0 transition-all duration-300" 
                                            />
                                            
                                            {/* Vite */}
                                            <img 
                                                src="/vite-logo.svg" 
                                                alt="Vite" 
                                                className="h-6 object-contain grayscale hover:grayscale-0 transition-all duration-300" 
                                            />
                                            
                                            {/* Framer Motion */}
                                            <img 
                                                src="/framer-logo.svg" 
                                                alt="Framer Motion" 
                                                className="h-6 object-contain grayscale hover:grayscale-0 transition-all duration-300" 
                                            />

                                            {/* Supabase */}
                                            <img 
                                                src="/supabase-logo.svg" 
                                                alt="Supabase" 
                                                className="h-6 object-contain grayscale hover:grayscale-0 transition-all duration-300" 
                                            />
                                            
                                            {/* Gemini */}
                                            <img 
                                                src="/gemini-logo.svg" 
                                                alt="Gemini" 
                                                className="h-6 object-contain grayscale hover:grayscale-0 transition-all duration-300" 
                                            />
                                        </div>
                                    </motion.div>
                                </div>
                            </div>

                            {/* ── RIGHT PANEL ── */}
                            <div className="relative flex flex-col justify-center px-8 py-10 md:px-12">

                                {/* Close button */}
                                <motion.button
                                    className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-900 transition-colors"
                                    style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)' }}
                                    onClick={onClose}
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                                >
                                    <X className="w-3.5 h-3.5" />
                                </motion.button>

                                <AnimatePresence mode="wait">

                                    {/* ── VIEW: Role Selection ── */}
                                    {view === 'roles' && (
                                        <motion.div
                                            key="roles"
                                            className="space-y-6"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                                        >
                                            <div>
                                                <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Welcome back</h1>
                                                <p className="text-zinc-500 mt-1 text-sm">Choose your account type to continue</p>
                                            </div>

                                            {/* Role cards */}
                                            <div className="space-y-3">
                                                {/* Student — Google-style button */}
                                                <motion.button
                                                    className="flex items-center justify-center gap-3 w-full h-[50px] bg-blue-700 hover:bg-blue-800 border border-blue-600 hover:border-blue-500 rounded-xl text-yellow-400 font-medium text-sm transition-all duration-200 active:scale-[0.99] outline-none focus:ring-2 focus:ring-blue-500/50 relative overflow-hidden group"
                                                    onClick={() => handleRoleSelect('student')}
                                                    initial={{ opacity: 0, x: -16 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 24 }}
                                                    whileTap={{ scale: 0.99 }}
                                                >
                                                    <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M21.25 7.99805V14.7188M21.25 7.99805L12 3.99805L2.75 7.99805L5.875 9.3494M21.25 7.99805L18.125 9.3494M5.875 9.3494L12 11.998L18.125 9.3494M5.875 9.3494V15.9258C5.875 15.9258 7.83653 18.9258 12 18.9258C16.1635 18.9258 18.125 15.9258 18.125 15.9258V9.3494" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                    </svg>
                                                    <span className="tracking-tight text-[14px]">Sign in as Student</span>
                                                </motion.button>

                                                {/* Teacher — GitHub-style button */}
                                                <motion.button
                                                    className="flex items-center justify-center gap-3 w-full h-[50px] bg-blue-700 hover:bg-blue-800 border border-blue-600 hover:border-blue-500 rounded-xl text-yellow-400 font-medium text-sm transition-all duration-200 active:scale-[0.99] outline-none focus:ring-2 focus:ring-blue-500/50 relative overflow-hidden group"
                                                    onClick={() => handleRoleSelect('teacher')}
                                                    initial={{ opacity: 0, x: -16 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.17, type: 'spring', stiffness: 300, damping: 24 }}
                                                    whileTap={{ scale: 0.99 }}
                                                >
                                                    <Contact className="w-[18px] h-[18px] shrink-0" />
                                                    <span className="tracking-tight text-[14px]">Sign in as Teacher</span>
                                                </motion.button>

                                                {/* Divider */}
                                                <div className="flex items-center gap-3 py-1">
                                                    <div className="h-[1px] flex-1 bg-neutral-200" />
                                                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400 select-none">OR CONTINUE WITH EMAIL</span>
                                                    <div className="h-[1px] flex-1 bg-neutral-200" />
                                                </div>

                                                {/* Admin — yellow accent button */}
                                                <motion.button
                                                    className="flex items-center justify-center gap-3 w-full h-[50px] bg-blue-700 hover:bg-blue-800 border border-blue-600 hover:border-blue-500 rounded-xl text-yellow-400 font-medium text-sm transition-all duration-200 active:scale-[0.99] outline-none focus:ring-2 focus:ring-blue-500/50 relative overflow-hidden group"
                                                    onClick={() => handleRoleSelect('admin')}
                                                    initial={{ opacity: 0, x: -16 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.24, type: 'spring', stiffness: 300, damping: 24 }}
                                                    whileTap={{ scale: 0.99 }}
                                                >
                                                    <KeySquare className="w-[18px] h-[18px] shrink-0" />
                                                    <span className="tracking-tight text-[14px]">Sign in as Admin</span>
                                                </motion.button>
                                            </div>

                                            {/* Footer */}
                                            <motion.p
                                                className="text-[11px] text-center text-[#52525b] leading-normal"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.4 }}
                                            >
                                                By continuing, you agree to our{' '}
                                                <a href="#" className="no-underline text-zinc-900 border-b border-neutral-300 pb-px mx-1 hover:text-blue-600 hover:border-blue-600 transition-colors">Terms of Service</a>
                                                {' '}and{' '}
                                                <a href="#" className="no-underline text-zinc-900 border-b border-neutral-300 pb-px mx-1 hover:text-blue-600 hover:border-blue-600 transition-colors">Privacy Policy</a>
                                            </motion.p>
                                        </motion.div>
                                    )}

                                </AnimatePresence>


                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default LoginModal;
