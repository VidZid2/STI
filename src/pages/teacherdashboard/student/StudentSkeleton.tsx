import React from 'react';

type ViewMode = 'grid' | 'list';

const SkeletonPulse: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = '', style }) => (
    <div
        className={`bg-surface-alt rounded-md animate-pulse ${className}`}
        style={style}
    />
);

const StudentSkeleton: React.FC<{
    viewMode: ViewMode;
    showAvatars: boolean;
}> = ({ viewMode, showAvatars }) => {
    const count = viewMode === 'grid' ? 6 : 5;

    if (viewMode === 'grid') {
        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                {Array.from({ length: count }).map((_, i) => (
                    <div key={i} className="bg-surface border border-border-subtle rounded-2xl p-5 flex flex-col items-center gap-3">
                        {showAvatars && <SkeletonPulse className="w-14 h-14 !rounded-full" />}
                        <SkeletonPulse style={{ width: '70%', height: '14px' }} />
                        <SkeletonPulse style={{ width: '50%', height: '12px' }} />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-surface border border-border-subtle rounded-2xl px-4 py-3.5 flex items-center gap-3">
                    {showAvatars && <SkeletonPulse className="w-[42px] h-[42px] !rounded-xl flex-shrink-0" />}
                    <div className="flex-1 flex flex-col gap-2">
                        <SkeletonPulse style={{ width: '40%', height: '13px' }} />
                        <SkeletonPulse style={{ width: '25%', height: '11px' }} />
                    </div>
                    <SkeletonPulse style={{ width: '60px', height: '24px', borderRadius: '8px', flexShrink: 0 }} />
                </div>
            ))}
        </div>
    );
};

export default StudentSkeleton;
