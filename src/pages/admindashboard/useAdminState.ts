import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export function useAdminState() {
    const [adminName, setAdminName] = useState<string>('Admin');
    const [lastLogin, setLastLogin] = useState<string | null>(null);
    const [activeSessions, setActiveSessions] = useState(0);

    useEffect(() => {
        if (!supabase) return;

        // Resolve admin identity for the activity widget
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) return;
            supabase!.from('users').select('full_name, last_login').eq('id', user.id).single()
                .then(({ data }) => {
                    if (data?.full_name) setAdminName(data.full_name.split(' ')[0]);
                    if (data?.last_login) setLastLogin(data.last_login);
                });
        });

        // Supabase Realtime Presence Tracking
        const presenceChannel = supabase.channel('global_presence', {
            config: { presence: { key: 'admin_dashboard_' + Math.random().toString(36).substring(7) } },
        });

        presenceChannel
            .on('presence', { event: 'sync' }, () => {
                const newState = presenceChannel.presenceState();
                const activeCount = Object.keys(newState).length;
                setActiveSessions(activeCount);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await presenceChannel.track({
                        role: 'admin',
                        online_at: new Date().toISOString(),
                    });
                }
            });

        return () => {
            if (supabase) {
                supabase.removeChannel(presenceChannel);
            }
        };
    }, []);

    return { adminName, lastLogin, activeSessions };
}
