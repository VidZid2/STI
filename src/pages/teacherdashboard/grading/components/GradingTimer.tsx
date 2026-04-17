import React, { useState, useEffect, useRef } from 'react';
import { formatSeconds } from '../utils';

const GradingTimer: React.FC<{
    isActive: boolean;
    gradedCount: number;
}> = ({ isActive, gradedCount }) => {
    const [seconds, setSeconds] = useState(0);
    const startTimeRef = useRef<number>(Date.now());

    useEffect(() => {
        if (!isActive) return;
        startTimeRef.current = Date.now();
        const interval = setInterval(() => {
            setSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [isActive]);

    const avgTime = gradedCount > 0 ? Math.floor(seconds / gradedCount) : 0;

    return (
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg"
            style={{ background: 'var(--color-success-bg)', border: '1px solid rgba(16,185,129,0.15)' }}>
            <div className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                <span className="text-[13px] font-semibold" style={{ color: 'var(--color-success)' }}>{formatSeconds(seconds)}</span>
            </div>
            {gradedCount > 0 && (
                <>
                    <div className="w-px h-4" style={{ background: 'rgba(16,185,129,0.2)' }} />
                    <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                        <span className="font-semibold" style={{ color: 'var(--color-success)' }}>{gradedCount}</span> graded • ~{formatSeconds(avgTime)}/each
                    </div>
                </>
            )}
        </div>
    );
};

export default GradingTimer;
