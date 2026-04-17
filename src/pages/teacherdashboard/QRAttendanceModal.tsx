import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Maximize, Smartphone, Users, CheckCircle2 } from 'lucide-react';

interface QRAttendanceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const QRAttendanceModal: React.FC<QRAttendanceModalProps> = ({ isOpen, onClose }) => {
    const [scannedCount, setScannedCount] = useState(0);
    const totalStudents = 42; // Mock total for 'Computer Programming 1'

    // Simulate live scanning of QR code by students
    useEffect(() => {
        if (!isOpen) return;
        
        let targetCount = 0;
        const interval = setInterval(() => {
            if (targetCount < totalStudents - 4) { // Let's say 4 are absent
                targetCount += Math.floor(Math.random() * 3);
                setScannedCount(() => Math.min(targetCount, totalStudents));
            }
        }, 1500);
        
        return () => clearInterval(interval);
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-4xl flex flex-col md:flex-row relative"
                >
                    {/* Demo Mode Banner — QR Attendance is not yet wired to live data */}
                    <div className="absolute top-0 left-0 right-0 z-20 bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        <span className="text-xs font-semibold text-amber-700">Demo Mode — Attendance data shown is simulated and will not be saved.</span>
                    </div>
                    {/* Close Button — sits below the demo banner */}
                    <button 
                        onClick={onClose}
                        aria-label="Close attendance modal"
                        className="absolute top-12 right-4 z-10 p-2 bg-white/50 backdrop-blur rounded-full hover:bg-slate-100 transition-colors"
                    >
                        <X size={20} className="text-slate-500" />
                    </button>

                    {/* LEFT PANEL: The Live QR Code */}
                    <div className="flex-1 bg-slate-50 p-8 md:p-12 pt-16 md:pt-16 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-200">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-slate-900 leading-tight">Class Started: CP1</h2>
                            <p className="text-slate-500 text-sm mt-1">Scan this code using the STI Student App</p>
                        </div>
                        
                        {/* Mock QR Code Graphic (SVG) */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center relative group">
                            <svg className="w-64 h-64 text-slate-900" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 3h8v8H3zM5 5v4h4V5zM13 3h8v8h-8zM15 5v4h4V5zM3 13h8v8H3zM5 15v4h4v-4zM18 13h3v3h-3zM13 13h3v3h-3zM13 18h3v3h-3zM18 18h3v3h-3zM15 15h3v3h-3zM9 9h2v2H9zM19 9h2v2h-2zM9 19h2v2H9z" />
                            </svg>
                            {/* Scanning Laser Animation overlay */}
                            <motion.div 
                                className="absolute top-6 left-6 right-6 h-[2px] bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                                animate={{ y: [0, 256, 0] }}
                                transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                            />
                            
                            <button className="absolute top-4 right-4 p-2 bg-slate-100 text-slate-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                <Maximize size={16} />
                            </button>
                        </div>
                        
                        <div className="mt-8 flex items-center gap-2 text-emerald-600 font-semibold bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            Session active and accepting scans
                        </div>
                    </div>

                    {/* RIGHT PANEL: Live Telemetry */}
                    <div className="w-full md:w-96 p-8 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                                    <Smartphone size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Live Attendance</h3>
                                    <p className="text-xs text-slate-500">Real-time sync to database</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 mb-6">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-5xl font-black text-slate-900 font-mono tracking-tighter">{scannedCount}</span>
                                    <span className="text-md font-bold text-slate-400 mb-1">/ {totalStudents}</span>
                                </div>
                                <div className="text-sm font-semibold text-slate-500 flex items-center gap-2 uppercase tracking-wider">
                                    <Users size={14} /> Students Present
                                </div>
                                
                                <div className="w-full h-2 bg-slate-200 rounded-full mt-5 overflow-hidden">
                                    <motion.div 
                                        className="h-full bg-blue-500 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(scannedCount / totalStudents) * 100}%` }}
                                        transition={{ duration: 0.5 }}
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recent Scans</h4>
                                {/* Live fake stream of names */}
                                <div className="flex flex-col gap-2 h-32 overflow-hidden relative">
                                    <div className="absolute bottom-0 w-full h-12 bg-gradient-to-t from-white to-transparent z-10" />
                                    <AnimatePresence>
                                        <motion.div 
                                            key={scannedCount}
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg"
                                        >
                                            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                            <span className="text-sm font-semibold text-slate-700 truncate">
                                                {scannedCount === 0 ? "Waiting for students..." : `Student ${scannedCount} connected`}
                                            </span>
                                            <span className="text-[10px] text-slate-400 ml-auto whitespace-nowrap">Just now</span>
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 mt-6 border-t border-slate-100">
                            <button 
                                className="w-full bg-slate-300 text-slate-500 font-bold py-3.5 rounded-xl cursor-not-allowed"
                                disabled
                                title="Live data saving is not yet available"
                            >
                                Conclude Session &amp; Save (Demo)
                            </button>
                            <p className="text-center text-xs text-amber-600 mt-2">Live saving unavailable in demo mode</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default QRAttendanceModal;
