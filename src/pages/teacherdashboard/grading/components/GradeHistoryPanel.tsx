import React from 'react';
import type { GradeHistory } from '../types';
import { formatDate } from '../utils';

const GradeHistoryPanel: React.FC<{
    history: GradeHistory[];
    maxPoints: number;
}> = ({ history, maxPoints }) => {
    if (!history || history.length === 0) return null;

    return (
        <div className="p-3 rounded-[10px] mb-4"
            style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.1)' }}>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold mb-2.5" style={{ color: 'var(--color-purple)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                Previous Grades ({history.length})
            </div>
            <div className="flex flex-col gap-2">
                {history.map((h, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg"
                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                        <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0"
                            style={{ background: 'rgba(139,92,246,0.1)', color: 'var(--color-purple)' }}>
                            v{h.version}
                        </div>
                        <div className="flex-1">
                            <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                                {h.score}/{maxPoints} ({((h.score / maxPoints) * 100).toFixed(0)}%)
                            </div>
                            <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                                {formatDate(h.graded_at)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GradeHistoryPanel;
