import React, { useState, memo } from 'react';
import { motion } from 'motion/react';

const ACCENT_COLOR = '#3b82f6';

export interface ActivityItem {
    id: string;
    action: string;
    student: string;
    studentId: string;
    course: string;
    taskTitle: string;
    time: string;
    timestamp: Date;
    type: 'submission' | 'grade' | 'late' | 'pending';
    score?: number;
    status: string;
}

const getTypeColor = (type: string) => {
    switch (type) {
        case 'grade': return 'var(--color-success)';
        case 'late': return 'var(--color-danger)';
        case 'pending': return 'var(--color-warning)';
        default: return ACCENT_COLOR;
    }
};

const getTypeIcon = (type: string) => {
    switch (type) {
        case 'submission': return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;
        case 'grade': return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;
        case 'late': return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
        case 'pending': return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>;
        default: return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /></svg>;
    }
};

const getScoreColor = (score: number) =>
    score >= 75 ? 'var(--color-success)' : score >= 60 ? 'var(--color-warning)' : 'var(--color-danger)';

const ActivityCard: React.FC<{ activity: ActivityItem; index: number }> = ({ activity, index }) => {
    const [isHovered, setIsHovered] = useState(false);
    const typeColor = getTypeColor(activity.type);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ delay: index * 0.02, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className="rounded-xl p-3 cursor-pointer"
            style={{
                background: 'var(--bg-surface)',
                border: `1px solid ${isHovered ? `${typeColor}30` : 'var(--border-subtle)'}`,
            }}
        >
            <div className="flex items-center gap-3">
                {/* Icon */}
                <div className="activity-card-icon w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
                    style={{ background: `${typeColor}15`, color: typeColor }}>
                    {getTypeIcon(activity.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold truncate mb-0.5" style={{ color: 'var(--text-primary)' }}>
                        {activity.action}
                    </div>
                    <div className="flex items-center flex-wrap gap-1 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                        <span className="font-medium">{activity.student}</span>
                        <span style={{ color: 'var(--text-muted)' }}>•</span>
                        <span>{activity.course}</span>
                        {activity.taskTitle && (
                            <>
                                <span style={{ color: 'var(--text-muted)' }}>•</span>
                                <span className="max-w-[150px] truncate">{activity.taskTitle}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Right: score + time + badge */}
                <div className="text-right shrink-0">
                    {activity.score !== undefined && activity.type === 'grade' && (
                        <div className="text-[13px] font-bold mb-0.5" style={{ color: getScoreColor(activity.score) }}>
                            {activity.score}%
                        </div>
                    )}
                    <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{activity.time}</div>
                    <div className="activity-card-badge mt-1.5 px-2 py-px rounded-md text-[10px] font-semibold capitalize"
                        style={{ background: `${typeColor}10`, border: `1px solid ${typeColor}25`, color: typeColor }}>
                        {activity.status}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default memo(ActivityCard);
