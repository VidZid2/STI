import React from 'react';
import { motion } from 'motion/react';
import type { UserAccount } from '../../../services/usersService';

const StudentProfilePanel: React.FC<{
    student: UserAccount;
    onClose: () => void;
    showAvatars: boolean;
    shouldAnimate: boolean;
}> = ({ student, onClose, showAvatars, shouldAnimate }) => {
    const initials = student.full_name
        ? student.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
        : '??';

    const Wrapper = shouldAnimate ? motion.div : 'div';
    const motionProps = shouldAnimate ? {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 20 },
        transition: { duration: 0.2 },
    } : {};

    const row = (label: string, value?: string | null) =>
        value ? (
            <div className="flex flex-col gap-0.5 py-2.5 border-b border-border-subtle">
                <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide">{label}</span>
                <span className="text-[13px] text-text-primary font-medium">{value}</span>
            </div>
        ) : null;

    return (
        <Wrapper
            {...motionProps}
            className="bg-surface-alt border-l border-border-subtle flex flex-col overflow-hidden flex-shrink-0"
            style={{ width: '280px' }}
        >
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-border-subtle">
                <span className="text-[13px] font-semibold text-text-primary">Student Profile</span>
                <motion.button
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="w-7 h-7 rounded-lg border-none bg-border-subtle cursor-pointer flex items-center justify-center text-text-secondary"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </motion.button>
            </div>

            {/* Avatar + Name */}
            <div className="px-4 pt-6 pb-4 flex flex-col items-center gap-3 border-b border-border-subtle">
                {showAvatars && (
                    <div
                        className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-white font-bold text-2xl"
                        style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}
                    >
                        {initials}
                    </div>
                )}
                <div className="text-center">
                    <div className="text-[15px] font-bold text-text-primary">{student.full_name || 'Unknown'}</div>
                    {student.section && <div className="text-[12px] text-text-secondary mt-0.5">{student.section}</div>}
                </div>
            </div>

            {/* Details */}
            <div className="px-4 flex-1 overflow-y-auto">
                {row('Email', student.email)}
                {row('Student ID', student.student_id)}
                {row('Year Level', student.year_level)}
                {row('Status', student.is_active ? 'Active' : 'Inactive')}
            </div>
        </Wrapper>
    );
};

export default StudentProfilePanel;
