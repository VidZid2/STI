/**
 * Real-time Subscription Hook
 * Provides real-time updates using Supabase Realtime
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ============================================
// TYPES
// ============================================
export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export interface RealtimeOptions<T> {
    table: string;
    schema?: string;
    event?: RealtimeEvent;
    filter?: string;
    onInsert?: (payload: T) => void;
    onUpdate?: (payload: { old: T; new: T }) => void;
    onDelete?: (payload: T) => void;
    onAny?: (payload: { eventType: string; old: T | null; new: T | null }) => void;
}

export interface UseRealtimeReturn<T> {
    isConnected: boolean;
    lastEvent: { eventType: string; old: T | null; new: T | null } | null;
    error: Error | null;
    reconnect: () => void;
}

// ============================================
// HOOK: useRealtimeSubscription
// ============================================
export function useRealtimeSubscription<T>(
    options: RealtimeOptions<T>
): UseRealtimeReturn<T> {
    const [isConnected, setIsConnected] = useState(false);
    const [lastEvent, setLastEvent] = useState<{ eventType: string; old: T | null; new: T | null } | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const channelRef = useRef<RealtimeChannel | null>(null);

    const {
        table,
        schema = 'public',
        event = '*',
        filter,
        onInsert,
        onUpdate,
        onDelete,
        onAny,
    } = options;

    const subscribe = useCallback(() => {
        if (!supabase) {
            setError(new Error('Supabase client not available'));
            return;
        }

        // Unsubscribe from existing channel
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
        }

        // Create channel name
        const channelName = `realtime:${schema}:${table}:${Date.now()}`;

        // Create and subscribe to channel
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const channel = (supabase as any)
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event,
                    schema,
                    table,
                    ...(filter ? { filter } : {}),
                },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (payload: any) => {
                    const eventData = {
                        eventType: payload.eventType,
                        old: payload.old as T | null,
                        new: payload.new as T | null,
                    };
                    setLastEvent(eventData);
                    onAny?.(eventData);

                    switch (payload.eventType) {
                        case 'INSERT':
                            onInsert?.(payload.new as T);
                            break;
                        case 'UPDATE':
                            onUpdate?.({ old: payload.old as T, new: payload.new as T });
                            break;
                        case 'DELETE':
                            onDelete?.(payload.old as T);
                            break;
                    }
                }
            )
            .subscribe((status: string) => {
                if (status === 'SUBSCRIBED') {
                    setIsConnected(true);
                    setError(null);
                } else if (status === 'CHANNEL_ERROR') {
                    setIsConnected(false);
                    setError(new Error('Failed to subscribe to channel'));
                } else if (status === 'TIMED_OUT') {
                    setIsConnected(false);
                    setError(new Error('Subscription timed out'));
                }
            });

        channelRef.current = channel;
    }, [table, schema, event, filter, onInsert, onUpdate, onDelete, onAny]);

    const reconnect = useCallback(() => {
        setError(null);
        subscribe();
    }, [subscribe]);

    useEffect(() => {
        subscribe();

        return () => {
            if (channelRef.current && supabase) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [subscribe]);

    return {
        isConnected,
        lastEvent,
        error,
        reconnect,
    };
}

// ============================================
// HOOK: useRealtimeSubmissions
// Specialized hook for student submissions
// ============================================
export interface Submission {
    id: string;
    student_id: string;
    student_name: string;
    task_id: string;
    status: string;
    score: number | null;
    submitted_at: string;
    graded_at: string | null;
}

export function useRealtimeSubmissions(options?: {
    onNewSubmission?: (submission: Submission) => void;
    onGraded?: (submission: Submission) => void;
}) {
    const [newSubmissionsCount, setNewSubmissionsCount] = useState(0);
    const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);

    const { isConnected, error, reconnect } = useRealtimeSubscription<Submission>({
        table: 'student_submissions',
        event: '*',
        onInsert: (submission) => {
            setNewSubmissionsCount((prev) => prev + 1);
            setRecentSubmissions((prev) => [submission, ...prev].slice(0, 10));
            options?.onNewSubmission?.(submission);
        },
        onUpdate: ({ new: submission }) => {
            if (submission && submission.status === 'graded') {
                options?.onGraded?.(submission);
            }
            if (submission) {
                setRecentSubmissions((prev) =>
                    prev.map((s) => (s.id === submission.id ? submission : s))
                );
            }
        },
    });

    const clearNewCount = useCallback(() => {
        setNewSubmissionsCount(0);
    }, []);

    return {
        isConnected,
        error,
        reconnect,
        newSubmissionsCount,
        recentSubmissions,
        clearNewCount,
    };
}

// ============================================
// HOOK: useRealtimeNotifications
// For real-time notification updates
// ============================================
export interface Notification {
    id: string;
    user_id: string;
    type: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

export function useRealtimeNotifications(userId: string, options?: {
    onNewNotification?: (notification: Notification) => void;
}) {
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const { isConnected, error, reconnect } = useRealtimeSubscription<Notification>({
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
        onInsert: (notification) => {
            setUnreadCount((prev) => prev + 1);
            setNotifications((prev) => [notification, ...prev].slice(0, 20));
            options?.onNewNotification?.(notification);
        },
        onUpdate: ({ new: notification }) => {
            if (notification && notification.is_read) {
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
            if (notification) {
                setNotifications((prev) =>
                    prev.map((n) => (n.id === notification.id ? notification : n))
                );
            }
        },
    });

    const markAsRead = useCallback(async (notificationId: string) => {
        if (!supabase) return;
        
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);
    }, []);

    const markAllAsRead = useCallback(async () => {
        if (!supabase) return;
        
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);
        
        setUnreadCount(0);
    }, [userId]);

    return {
        isConnected,
        error,
        reconnect,
        unreadCount,
        notifications,
        markAsRead,
        markAllAsRead,
    };
}

// ============================================
// PRESENCE HOOK
// Track online users
// ============================================
export interface PresenceState {
    id: string;
    name: string;
    online_at: string;
}

export function usePresence(userId: string, userName: string) {
    const [onlineUsers, setOnlineUsers] = useState<PresenceState[]>([]);
    const channelRef = useRef<RealtimeChannel | null>(null);

    useEffect(() => {
        if (!supabase) return;

        const channel = supabase.channel('online-users', {
            config: {
                presence: {
                    key: userId,
                },
            },
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState<PresenceState>();
                const users = Object.values(state).flat();
                setOnlineUsers(users);
            })
            .on('presence', { event: 'join' }, ({ newPresences }) => {
                console.log('User joined:', newPresences);
            })
            .on('presence', { event: 'leave' }, ({ leftPresences }) => {
                console.log('User left:', leftPresences);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        id: userId,
                        name: userName,
                        online_at: new Date().toISOString(),
                    });
                }
            });

        channelRef.current = channel;

        return () => {
            if (channelRef.current && supabase) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [userId, userName]);

    return {
        onlineUsers,
        onlineCount: onlineUsers.length,
    };
}

export default useRealtimeSubscription;
