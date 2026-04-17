import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../../services/authService';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface TeacherRouteGuardProps {
    children: React.ReactNode;
}

/**
 * TeacherRouteGuard — Phase 9.1 hardened version.
 *
 * Two-layer validation:
 *  1. Fast synchronous check: sessionStorage must have a valid user with an
 *     allowed role. Prevents flash of protected content.
 *  2. Async DB validation: if Supabase is configured, re-validates the user
 *     against the live `users` table to catch deactivated accounts or role
 *     changes that happened since the session was created.
 *
 * Allowed roles: 'teacher', 'admin', 'dean'
 * (Admins and deans may legitimately view the teacher dashboard.)
 */
const ALLOWED_ROLES = ['teacher', 'admin', 'dean'] as const;

export default function TeacherRouteGuard({ children }: TeacherRouteGuardProps) {
    const navigate = useNavigate();
    // 'checking' | 'authorized' | 'unauthorized'
    const [status, setStatus] = useState<'checking' | 'authorized' | 'unauthorized'>('checking');

    useEffect(() => {
        let cancelled = false;

        const validate = async () => {
            // --- Layer 1: synchronous sessionStorage check ---
            const user = getCurrentUser();

            if (!user || !ALLOWED_ROLES.includes(user.role as typeof ALLOWED_ROLES[number])) {
                if (!cancelled) {
                    navigate('/', { replace: true });
                    setStatus('unauthorized');
                }
                return;
            }

            // --- Layer 2: async DB re-validation (only when Supabase is live and not a demo user) ---
            if (isSupabaseConfigured() && supabase && !user.id.startsWith('demo-')) {
                try {
                    const { data, error } = await supabase
                        .from('users')
                        .select('id,role,is_active')
                        .eq('id', user.id)
                        .single();

                    if (cancelled) return;

                    if (
                        error ||
                        !data ||
                        !data.is_active ||
                        !ALLOWED_ROLES.includes(data.role as typeof ALLOWED_ROLES[number])
                    ) {
                        // Account deactivated or role changed — invalidate session
                        sessionStorage.removeItem('elms_current_user');
                        navigate('/', { replace: true });
                        setStatus('unauthorized');
                        return;
                    }
                } catch {
                    // Network error — fall back to trusting the sessionStorage user
                    // rather than locking out users on flaky connections.
                }
            }

            if (!cancelled) setStatus('authorized');
        };

        validate();
        return () => { cancelled = true; };
    }, [navigate]);

    if (status === 'checking') {
        // Minimal full-screen loader — prevents flash of protected content
        return (
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--bg-canvas, #f8fafc)',
                    zIndex: 9999,
                }}
                aria-label="Verifying access…"
                role="status"
            >
                <svg
                    width="32"
                    height="32"
                    viewBox="0 0 32 32"
                    fill="none"
                    style={{ animation: 'spin 0.8s linear infinite' }}
                >
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <circle cx="16" cy="16" r="13" stroke="rgba(59,130,246,0.15)" strokeWidth="3" />
                    <circle
                        cx="16" cy="16" r="13"
                        stroke="#3b82f6"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray="60"
                        strokeDashoffset="45"
                    />
                </svg>
            </div>
        );
    }

    if (status === 'unauthorized') return null;

    return <>{children}</>;
}
