import React, { memo } from 'react';
import { motion } from 'motion/react';
import type { UserAccount } from '../../../services/usersService';

const StudentRow: React.FC<{
    student: UserAccount;
    index: number;
    onViewProfile?: (student: UserAccount) => void;
    showAvatars: boolean;
    shouldAnimate: boolean;
    isCompact: boolean;
}> = ({ student, index, onViewProfile, showAvatars, shouldAnimate, isCompact }) => {
    const initials = student.full_name
        ? student.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
        : '??';

    const Wrapper = shouldAnimate ? motion.div : 'div';
    const motionProps = shouldAnimate ? {
        initial: { opacity: 0, x: -10 },
        animate: { opacity: 1, x: 0 },
        transition: { delay: index * 0.02 },
        whileHover: { background: 'var(--accent-bg)', x: 2 },
    } : {};

    return (
        <Wrapper
            {...motionProps}
            onClick={() => onViewProfile?.(student)}
            className="border border-border-subtle flex items-center transition-all duration-150 rounded-[14px]"
            style={{
                padding: isCompact ? '10px 14px' : '14px 16px',
                background: 'transparent',
                cursor: onViewProfile ? 'pointer' : 'default',
                gap: isCompact ? '10px' : '12px',
            }}
        >
            {showAvatars && (
                <div className="rounded-xl flex items-center justify-center font-bold shrink-0"
                    style={{
                        width: isCompact ? '36px' : '42px',
                        height: isCompact ? '36px' : '42px',
                        background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.08) 100%)',
                        border: '1.5px solid rgba(59,130,246,0.15)',
                        color: 'var(--accent-primary)',
                        fontSize: isCompact ? '11px' : '13px',
                    }}>
                    {initials}
                </div>
            )}
            <div className="flex-1 min-w-0">
                <div className="font-semibold overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: isCompact ? '12.5px' : '13.5px', color: 'var(--text-primary)' }}>
                    {student.full_name || 'Unknown'}
                </div>
                {student.section && <div className="text-[11px] mt-px" style={{ color: 'var(--text-secondary)' }}>{student.section}</div>}
            </div>
            {student.email && (
                <div className="text-[11px] overflow-hidden text-ellipsis whitespace-nowrap shrink-0" style={{ maxWidth: '160px', color: 'var(--text-secondary)' }}>
                    {student.email}
                </div>
            )}
        </Wrapper>
    );
};

export default memo(StudentRow);
