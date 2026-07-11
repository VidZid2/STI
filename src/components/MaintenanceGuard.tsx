import React, { useState, useEffect } from 'react';
import { getCurrentUser } from '../services/authService';
import { useSystemConfig } from '../contexts/SystemConfigContext';

interface MaintenanceGuardProps {
    children: React.ReactNode;
}

/**
 * MaintenanceGuard checks:
 * 1. system_config.maintenance_mode boolean (manual kill switch)
 * 2. maintenance_window scheduled time range
 * Admin/dean users bypass both checks.
 */
const MaintenanceGuard: React.FC<MaintenanceGuardProps> = ({ children }) => {
    const { systemConfig, maintenanceWindow, isLoading } = useSystemConfig();

    if (isLoading) return null;

    const user = getCurrentUser();
    const isAdmin = user?.role === 'admin' || user?.role === 'dean';
    if (isAdmin) return <>{children}</>;

    // Check manual kill switch
    if (systemConfig.maintenance_mode) return <MaintenanceScreen reason={null} />;

    // Check scheduled window
    if (maintenanceWindow.start_time && maintenanceWindow.end_time) {
        const now = Date.now();
        const start = new Date(maintenanceWindow.start_time).getTime();
        const end = new Date(maintenanceWindow.end_time).getTime();
        if (now >= start && now <= end) {
            return <MaintenanceScreen reason={maintenanceWindow.reason} />;
        }
    }

    return <>{children}</>;
};

/**
 * Full-screen maintenance lockout screen.
 */
const MaintenanceScreen: React.FC<{ reason: string | null }> = ({ reason }) => {
    const [dots, setDots] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
        }, 500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
            color: 'white',
            fontFamily: "'Lexend Deca', sans-serif",
            overflow: 'hidden',
        }}>
            {/* Animated background circles */}
            <div style={{
                position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
            }}>
                <div style={{
                    position: 'absolute', top: '-10%', left: '-10%',
                    width: '400px', height: '400px', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
                    animation: 'float 8s infinite ease-in-out',
                }} />
                <div style={{
                    position: 'absolute', bottom: '-10%', right: '-10%',
                    width: '500px', height: '500px', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(234,179,8,0.12) 0%, transparent 70%)',
                    animation: 'float 10s infinite ease-in-out reverse',
                }} />
            </div>

            {/* Content */}
            <div style={{
                position: 'relative', zIndex: 10,
                textAlign: 'center', maxWidth: '480px', padding: '0 24px',
            }}>
                {/* STI Logo Effect */}
                <div style={{
                    width: '80px', height: '80px', margin: '0 auto 32px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, #eab308, #f59e0b)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 60px rgba(234,179,8,0.3)',
                    animation: 'pulse-glow 2s infinite ease-in-out',
                }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 6V2" /><path d="m8 2 4 4 4-4" />
                        <rect x="4" y="8" width="16" height="12" rx="2" />
                        <path d="M12 14v2" /><circle cx="12" cy="12" r="1" />
                    </svg>
                </div>

                <h1 style={{
                    fontSize: '28px', fontWeight: 800, marginBottom: '12px',
                    letterSpacing: '-0.02em', lineHeight: 1.2,
                }}>
                    System Under Maintenance
                </h1>

                <p style={{
                    fontSize: '15px', color: '#94a3b8', lineHeight: 1.7,
                    marginBottom: '32px',
                }}>
                    {reason
                        ? reason
                        : 'The STI eLMS platform is currently undergoing scheduled maintenance. Our team is working to improve your experience. Please check back shortly.'
                    }
                </p>

                {/* Status indicator */}
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '10px',
                    padding: '10px 20px', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                }}>
                    <div style={{
                        width: '10px', height: '10px', borderRadius: '50%',
                        background: '#eab308',
                        boxShadow: '0 0 12px rgba(234,179,8,0.6)',
                        animation: 'pulse-glow 1.5s infinite ease-in-out',
                    }} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>
                        Maintenance in progress{dots}
                    </span>
                </div>

                {/* Footer info */}
                <p style={{
                    marginTop: '40px', fontSize: '12px', color: '#475569',
                }}>
                    If you believe this is an error, contact your administrator.
                </p>
            </div>

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(30px, -30px) scale(1.1); }
                }
                @keyframes pulse-glow {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
            `}</style>
        </div>
    );
};

export default MaintenanceGuard;
