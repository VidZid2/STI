'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ViewerCounterProps {
    className?: string;
}

export function ViewerCounter({ className }: ViewerCounterProps) {
    // Temporarily hidden
    return null;
    
    const [viewerCount, setViewerCount] = useState(1);
    const [isHovered, setIsHovered] = useState(false);
    const [showPulse, setShowPulse] = useState(false);

    useEffect(() => {
        // Generate a session ID for this viewer
        const sessionId = `viewer_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
        
        // Store session in localStorage with timestamp
        const registerViewer = () => {
            const viewers = JSON.parse(localStorage.getItem('active_viewers') || '{}');
            viewers[sessionId] = Date.now();
            localStorage.setItem('active_viewers', JSON.stringify(viewers));
        };

        // Clean up old sessions (older than 30 seconds) and count active
        const updateViewerCount = () => {
            const viewers = JSON.parse(localStorage.getItem('active_viewers') || '{}');
            const now = Date.now();
            const activeViewers: Record<string, number> = {};
            
            Object.entries(viewers).forEach(([id, timestamp]) => {
                // Keep viewers active within last 30 seconds
                if (now - (timestamp as number) < 30000) {
                    activeViewers[id] = timestamp as number;
                }
            });
            
            // Update current session
            activeViewers[sessionId] = now;
            localStorage.setItem('active_viewers', JSON.stringify(activeViewers));
            
            const count = Object.keys(activeViewers).length;
            setViewerCount(prev => {
                if (count !== prev) {
                    setShowPulse(true);
                    setTimeout(() => setShowPulse(false), 600);
                }
                return count;
            });
        };

        // Register immediately
        registerViewer();
        updateViewerCount();

        // Update every 5 seconds
        const interval = setInterval(updateViewerCount, 5000);

        // Listen for storage changes from other tabs
        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'active_viewers') {
                updateViewerCount();
            }
        };
        window.addEventListener('storage', handleStorage);

        // Cleanup on unmount
        return () => {
            clearInterval(interval);
            window.removeEventListener('storage', handleStorage);
            
            // Remove this session
            const viewers = JSON.parse(localStorage.getItem('active_viewers') || '{}');
            delete viewers[sessionId];
            localStorage.setItem('active_viewers', JSON.stringify(viewers));
        };
    }, []);

    return (
        <div 
            className={`relative ${className || ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <motion.div
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-zinc-100/80 backdrop-blur-sm border border-zinc-200/50 cursor-default"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
            >
                {/* Live indicator dot - simple, no glow */}
                <div className="w-2 h-2 rounded-full bg-emerald-500" />

                {/* Eye icon */}
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-zinc-500"
                >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                </svg>

                {/* Viewer count */}
                <AnimatePresence mode="wait">
                    <motion.span
                        key={viewerCount}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.2 }}
                        className="text-xs font-medium text-zinc-600 min-w-[12px] text-center"
                    >
                        {viewerCount}
                    </motion.span>
                </AnimatePresence>

                {/* Pulse effect on count change */}
                <AnimatePresence>
                    {showPulse && (
                        <motion.div
                            className="absolute inset-0 rounded-full bg-emerald-400/20"
                            initial={{ scale: 1, opacity: 0.5 }}
                            animate={{ scale: 1.5, opacity: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.6 }}
                        />
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Tooltip - positioned relative to outer container */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 right-0 mt-2 mx-auto w-fit px-2 py-1 bg-zinc-800 text-white text-[10px] rounded-md whitespace-nowrap shadow-lg z-50"
                    >
                        {viewerCount === 1 ? '1 viewer online' : `${viewerCount} viewers online`}
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-800 rotate-45" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default ViewerCounter;
