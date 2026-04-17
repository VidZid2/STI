import React, { memo } from 'react';
import { motion } from 'motion/react';
import type { UserAccount } from '../../../services/usersService';

const StudentCard: React.FC<{
    student: UserAccount;
    index: number;
    onViewProfile: (student: UserAccount) => void;
    showAvatars: boolean;
    shouldAnimate: boolean;
    isCompact: boolean;
}> = ({ student, index, onViewProfile, showAvatars, shouldAnimate, isCompact }) => {
    const initials = student.full_name
        ? student.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
        : '??';

    const Wrapper = shouldAnimate ? motion.div : 'div';
    const motionProps = shouldAnimate ? {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { delay: index * 0.03 },
        whileHover: { y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' },
    } : {};

    return (
        <Wrapper
            {...motionProps}
            onClick={() => onViewProfile(student)}
            className="border border-border-subtle cursor-pointer flex flex-col items-center text-center transition-all duration-200 rounded-2xl"
            style={{ padding: isCompact ? '14px' : '20px', gap: isCompact ? '8px' : '12px' }}
        >
            {showAvatars && (
                <div className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
                    style={{
                        width: isCompact ? '44px' : '56px',
                        height: isCompact ? '44px' : '56px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        fontSize: isCompact ? '14px' : '18px',
                    }}>
                    {initials}
                </div>
            )}
            <div className="min-w-0 w-full">
                <div className="font-semibold overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: isCompact ? '12px' : '13px', color: 'var(--text-primary)' }}>
                    {student.full_name || 'Unknown'}
                </div>
                {student.section && <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{student.section}</div>}
            </div>
        </Wrapper>
    );
};

export default memo(StudentCard);
