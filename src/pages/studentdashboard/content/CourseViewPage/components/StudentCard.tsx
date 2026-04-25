/**
 * StudentCard
 * Individual student card in the Students tab of CourseViewPage.
 * Extracted from CourseViewPage.tsx during Phase 8.1
 */
import * as React from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';

interface StudentCardProps {
    student: {
        id: number;
        name: string;
        status: string;
        role: string;
        email: string;
        avatar?: string;
    };
    index: number;
}

const getAvatarColor = (name: string): string => {
    const = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return [hash % .length];
};

export const StudentCard: React.FC<StudentCardProps> = ({ student, index }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [showTooltip, setShowTooltip] = useState<string | null>(null);
    const [tooltipRect, setTooltipRect] = useState<DOMRect | null>(null);

    const avatarColor = getAvatarColor(student.name);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ delay: index * 0.02, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -3, scale: 1.01 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className={`relative p-4 rounded-xl bg-white border cursor-pointer transition-all duration-200 ${
                isHovered ? 'border-blue-200 shadow-lg shadow-blue-500/10' : 'border-zinc-100 hover:border-zinc-200'
            }`}
        >
            {/* Quick Action Buttons on Hover */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-2 right-2 flex gap-1 z-10"
                    >
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onMouseEnter={(e) => { setTooltipRect(e.currentTarget.getBoundingClientRect()); setShowTooltip('chat'); }}
                            onMouseLeave={() => { setShowTooltip(null); setTooltipRect(null); }}
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Send message"
                            className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center text-blue-600 transition-"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onMouseEnter={(e) => { setTooltipRect(e.currentTarget.getBoundingClientRect()); setShowTooltip('more'); }}
                            onMouseLeave={() => { setShowTooltip(null); setTooltipRect(null); }}
                            onClick={(e) => e.stopPropagation()}
                            aria-label="More options"
                            className="w-7 h-7 rounded-lg bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center text-zinc-500 transition-"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
                            </svg>
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tooltip Portal */}
            {showTooltip && tooltipRect && createPortal(
                <div
                    style={{
                        position: 'fixed',
                        top: tooltipRect.top - 28,
                        left: tooltipRect.left + tooltipRect.width / 2,
                        transform: 'translateX(-50%)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        background: '#1e293b',
                        color: 'white',
                        fontSize: '10px',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        zIndex: 99999,
                        pointerEvents: 'none' }}
                >
                    {showTooltip === 'chat' ? 'Send Message' : 'More Options'}
                    <div style={{
                        position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)',
                        width: 0, height: 0,
                        borderLeft: '4px solid transparent', borderRight: '4px solid transparent',
                        borderTop: '4px solid #1e293b' }} />
                </div>,
                document.body
            )}

            {/* Avatar */}
            <div className="flex flex-col items-center">
                <motion.div className="relative mb-3" whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
                    <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-semibold shadow-md"
                        style={{
                            background: student.avatar ? 'transparent' : `linear-gradient(135deg, ${avatarColor} 0%, ${avatarColor}dd 100%)`,
                            boxShadow: `0 4px 12px ${avatarColor}30` }}
                    >
                        {student.avatar ? (
                            <img src={student.avatar} alt={student.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            student.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                        )}
                    </div>
                    <motion.div
                        className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${student.status === 'online' ? 'bg-emerald-500' : 'bg-zinc-300'}`}
                        animate={student.status === 'online' ? { scale: [1, 1.15, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        role="status"
                        aria-label={student.status === 'online' ? 'Online' : 'Offline'}
                    />
                </motion.div>
                <p className="text-xs font-semibold text-zinc-800 text-center truncate w-full">{student.name}</p>
                <p className="text-[10px] text-zinc-400 text-center truncate w-full mt-0.5">{student.email.split('@')[0]}</p>
                <motion.span
                    className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 text-[9px] font-medium rounded-full ${
                        student.status === 'online' ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-50 text-zinc-500'
                    }`}
                    whileHover={{ scale: 1.05 }}
                >
                    <span className={`w-1.5 h-1.5 rounded-full ${student.status === 'online' ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                    {student.status === 'online' ? 'Online' : 'Offline'}
                </motion.span>
            </div>
        </motion.div>
    );
};

export default StudentCard;
