import { supabase } from '../lib/supabase';

export interface AppNotification {
    id: string;
    user_id: string;
    type: 'info' | 'warning' | 'success' | 'error';
    title: string;
    message: string | null;
    is_read: boolean;
    source: string;
    created_at: string;
}

export const fetchNotifications = async (userId: string, limit = 20): Promise<AppNotification[]> => {
    if (!supabase || !userId) return [];
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('id, user_id, type, title, message, is_read, source, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error) throw error;
        return (data as AppNotification[]) || [];
    } catch (err) {
        console.error('[NotificationService] Failed to fetch:', err);
        return [];
    }
};

export const markAsRead = async (notificationId: string): Promise<boolean> => {
    if (!supabase) return false;
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);
        if (error) throw error;
        return true;
    } catch (err) {
        console.error('[NotificationService] Failed to mark as read:', err);
        return false;
    }
};

export const markAllAsRead = async (userId: string): Promise<boolean> => {
    if (!supabase || !userId) return false;
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);
        if (error) throw error;
        return true;
    } catch (err) {
        console.error('[NotificationService] Failed to mark all as read:', err);
        return false;
    }
};

export const getUnreadCount = async (userId: string): Promise<number> => {
    if (!supabase || !userId) return 0;
    try {
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false);
        if (error) throw error;
        return count || 0;
    } catch {
        return 0;
    }
};

export const subscribeToNotifications = (
    userId: string,
    callback: (n: AppNotification) => void
) => {
    if (!supabase || !userId) return null;
    return supabase
        .channel(`notifications-${userId}`)
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
            (payload) => callback(payload.new as AppNotification)
        )
        .subscribe();
};

// Admin stats: total sent + read in last N days
export const fetchNotificationStats = async (days = 7) => {
    if (!supabase) return { total: 0, read: 0, deliveryRate: 0 };
    try {
        const since = new Date(Date.now() - days * 86400000).toISOString();
        const { count: total } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', since);
        const { count: read } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', since)
            .eq('is_read', true);
        const t = total || 0;
        const r = read || 0;
        return { total: t, read: r, deliveryRate: t > 0 ? Math.round((r / t) * 100) : 0 };
    } catch {
        return { total: 0, read: 0, deliveryRate: 0 };
    }
};
