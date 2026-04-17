import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, X } from 'lucide-react';
import { useSystemConfig } from '../../contexts/SystemConfigContext';

const ONE_HOUR_MS = 60 * 60 * 1000;

const pad = (n: number) => String(n).padStart(2, '0');

const formatCountdown = (ms: number) => {
    if (ms <= 0) return '00:00:00';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

/**
 * MaintenanceBanner — shows an amber countdown banner on student/teacher dashboards
 * when a scheduled maintenance window starts within the next hour.
 * Disappears once the window starts (MaintenanceGuard takes over at that point).
 */
const MaintenanceBanner: React.FC = () => {
    const { maintenanceWindow } = useSystemConfig();
    const [dismissed, setDismissed] = useState(false);
    const [msUntil, setMsUntil] = useState<number | null>(null);

    useEffect(() => {
        if (!maintenanceWindow.start_time) { setMsUntil(null); return; }

        const tick = () => {
            const diff = new Date(maintenanceWindow.start_time!).getTime() - Date.now();
            // Show only if within 1 hour and not yet started
            if (diff > 0 && diff <= ONE_HOUR_MS) {
                setMsUntil(diff);
            } else {
                setMsUntil(null);
            }
        };

        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [maintenanceWindow.start_time]);

    const visible = msUntil !== null && !dismissed;

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: -12, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -12, height: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    style={{
                        background: 'linear-gradient(90deg, #fffbeb 0%, #fef3c7 100%)',
                        borderBottom: '1px solid #fde68a',
                        padding: '10px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        zIndex: 9998,
                        position: 'relative',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 28, height: 28, borderRadius: 8,
                            background: '#fef3c7', border: '1px solid #fde68a',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                            <Clock size={14} color="#d97706" />
                        </div>
                        <div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>
                                Scheduled Maintenance in{' '}
                                <span style={{
                                    fontFamily: 'monospace',
                                    background: '#fde68a',
                                    padding: '1px 6px',
                                    borderRadius: 4,
                                    letterSpacing: '0.05em',
                                }}>
                                    {formatCountdown(msUntil!)}
                                </span>
                            </span>
                            {maintenanceWindow.reason && (
                                <span style={{ fontSize: 12, color: '#b45309', marginLeft: 8 }}>
                                    — {maintenanceWindow.reason}
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={() => setDismissed(true)}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 24, height: 24, borderRadius: 6,
                            border: '1px solid #fde68a', background: 'transparent',
                            cursor: 'pointer', flexShrink: 0,
                        }}
                        title="Dismiss"
                    >
                        <X size={12} color="#b45309" />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default MaintenanceBanner;
