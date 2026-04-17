import { Shimmer } from '../shared/Shimmer';

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`p-5 rounded-2xl bg-white dark:bg-slate-800 border border-black/5 dark:border-white/5 shadow-sm ${className}`}>
        {children}
    </div>
);

const OverviewSkeleton: React.FC = () => (
    <div className="flex flex-col gap-6">

        {/* Telemetry cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <Shimmer className="h-2.5 w-24" />
                        <Shimmer className="h-7 w-7 rounded-lg" />
                    </div>
                    <Shimmer className="h-8 w-28" />
                </Card>
            ))}
        </div>

        {/* Notification stats */}
        <Card className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <Shimmer className="h-8 w-8 rounded-xl" />
                <div className="flex flex-col gap-1.5">
                    <Shimmer className="h-3 w-36" />
                    <Shimmer className="h-2.5 w-24" />
                </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Shimmer key={i} className="h-16 rounded-xl" />
                ))}
            </div>
        </Card>

        {/* AI telemetry + God Mode */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900 dark:bg-slate-800 border border-slate-800 shadow-xl flex flex-col gap-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Shimmer className="h-9 w-9 rounded-xl" style={{ '--shimmer-base': '#1e293b', '--shimmer-highlight': '#334155' } as React.CSSProperties} />
                        <div className="flex flex-col gap-1.5">
                            <Shimmer className="h-3 w-36" style={{ '--shimmer-base': '#1e293b', '--shimmer-highlight': '#334155' } as React.CSSProperties} />
                            <Shimmer className="h-2.5 w-24" style={{ '--shimmer-base': '#1e293b', '--shimmer-highlight': '#334155' } as React.CSSProperties} />
                        </div>
                    </div>
                    <Shimmer className="h-6 w-24 rounded-lg" style={{ '--shimmer-base': '#1e293b', '--shimmer-highlight': '#334155' } as React.CSSProperties} />
                </div>
                <div className="flex gap-8">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex flex-col gap-1.5">
                            <Shimmer className="h-7 w-20" style={{ '--shimmer-base': '#1e293b', '--shimmer-highlight': '#334155' } as React.CSSProperties} />
                            <Shimmer className="h-2.5 w-16" style={{ '--shimmer-base': '#1e293b', '--shimmer-highlight': '#334155' } as React.CSSProperties} />
                        </div>
                    ))}
                </div>
                <div className="h-14 flex items-end gap-1">
                    {Array.from({ length: 15 }).map((_, i) => (
                        <Shimmer key={i} className="flex-1 rounded-t-sm" style={{ height: `${20 + (i % 5) * 12}%`, '--shimmer-base': '#1e293b', '--shimmer-highlight': '#334155' } as React.CSSProperties} />
                    ))}
                </div>
            </div>
            <Card className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <Shimmer className="h-9 w-9 rounded-xl" />
                    <div className="flex flex-col gap-1.5">
                        <Shimmer className="h-3 w-32" />
                        <Shimmer className="h-2.5 w-48" />
                    </div>
                </div>
                <Shimmer className="h-11 w-full rounded-xl" />
                <Shimmer className="h-16 w-full rounded-xl" />
            </Card>
        </div>

        {/* System controls + reports */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i} className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <Shimmer className="h-9 w-9 rounded-xl" />
                        <div className="flex flex-col gap-1.5">
                            <Shimmer className="h-3 w-28" />
                            <Shimmer className="h-2.5 w-40" />
                        </div>
                    </div>
                    {Array.from({ length: 3 }).map((_, j) => (
                        <div key={j} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                                <Shimmer className="h-8 w-8 rounded-lg" />
                                <div className="flex flex-col gap-1.5">
                                    <Shimmer className="h-3 w-32" />
                                    <Shimmer className="h-2.5 w-48" />
                                </div>
                            </div>
                            <Shimmer className="h-7 w-12 rounded-full" />
                        </div>
                    ))}
                </Card>
            ))}
        </div>

        {/* Maintenance scheduler */}
        <Card className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <Shimmer className="h-9 w-9 rounded-xl" />
                <div className="flex flex-col gap-1.5">
                    <Shimmer className="h-3 w-40" />
                    <Shimmer className="h-2.5 w-64" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Shimmer className="h-10 rounded-xl" />
                <Shimmer className="h-10 rounded-xl" />
            </div>
            <Shimmer className="h-10 rounded-xl" />
        </Card>

        {/* Audit log + storage */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900 dark:bg-slate-800 border border-yellow-500/20 shadow-xl flex flex-col gap-3">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <Shimmer className="h-9 w-9 rounded-xl" style={{ '--shimmer-base': '#1e293b', '--shimmer-highlight': '#334155' } as React.CSSProperties} />
                        <div className="flex flex-col gap-1.5">
                            <Shimmer className="h-3 w-32" style={{ '--shimmer-base': '#1e293b', '--shimmer-highlight': '#334155' } as React.CSSProperties} />
                            <Shimmer className="h-2.5 w-44" style={{ '--shimmer-base': '#1e293b', '--shimmer-highlight': '#334155' } as React.CSSProperties} />
                        </div>
                    </div>
                    <Shimmer className="h-4 w-10 rounded" style={{ '--shimmer-base': '#1e293b', '--shimmer-highlight': '#334155' } as React.CSSProperties} />
                </div>
                {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 py-1">
                        <Shimmer className="h-2.5 w-14" style={{ '--shimmer-base': '#1e293b', '--shimmer-highlight': '#334155' } as React.CSSProperties} />
                        <Shimmer className="h-4 w-4 rounded" style={{ '--shimmer-base': '#1e293b', '--shimmer-highlight': '#334155' } as React.CSSProperties} />
                        <Shimmer className="h-2.5 flex-1" style={{ '--shimmer-base': '#1e293b', '--shimmer-highlight': '#334155' } as React.CSSProperties} />
                        <Shimmer className="h-4 w-16 rounded" style={{ '--shimmer-base': '#1e293b', '--shimmer-highlight': '#334155' } as React.CSSProperties} />
                    </div>
                ))}
            </div>
            <Card className="flex flex-col gap-5">
                <div className="flex items-center gap-3">
                    <Shimmer className="h-9 w-9 rounded-xl" />
                    <div className="flex flex-col gap-1.5">
                        <Shimmer className="h-3 w-28" />
                        <Shimmer className="h-2.5 w-48" />
                    </div>
                </div>
                {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-2">
                        <div className="flex justify-between">
                            <Shimmer className="h-3 w-36" />
                            <Shimmer className="h-3 w-20" />
                        </div>
                        <Shimmer className="h-2.5 w-full rounded-full" />
                    </div>
                ))}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-col gap-2">
                    <Shimmer className="h-2.5 w-40" />
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Shimmer key={i} className="h-10 w-full rounded-lg" />
                    ))}
                </div>
            </Card>
        </div>

        {/* Disaster recovery */}
        <Card className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-4 flex-1">
                <Shimmer className="h-12 w-12 rounded-xl shrink-0" />
                <div className="flex flex-col gap-2 flex-1">
                    <Shimmer className="h-4 w-40" />
                    <Shimmer className="h-3 w-full max-w-md" />
                    <Shimmer className="h-3 w-3/4 max-w-sm" />
                </div>
            </div>
            <Shimmer className="h-11 w-48 rounded-xl shrink-0" />
        </Card>
    </div>
);

export default OverviewSkeleton;
