/**
 * Presence Service - Real-time presence tracking for group chats
 * Uses Supabase Realtime Presence for tracking who's viewing the chat
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface PresenceUser {
    id: string;
    name: string;
    avatar?: string;
    joinedAt: string;
    lastSeen: string;
}

export interface PresenceState {
    [key: string]: PresenceUser[];
}

// Store active channels
const activeChannels: Map<string, RealtimeChannel> = new Map();

/**
 * Join a group's presence channel
 */
export const joinPresence = async (
    groupId: string,
    user: { id: string; name: string; avatar?: string },
    onPresenceChange: (users: PresenceUser[]) => void
): Promise<(() => void) | null> => {
    if (!isSupabaseConfigured() || !supabase) {
        // Return mock presence for demo
        onPresenceChange([{
            id: user.id,
            name: user.name,
            avatar: user.avatar,
            joinedAt: new Date().toISOString(),
            lastSeen: new Date().toISOString(),
        }]);
        return null;
    }

    const channelName = `presence:group:${groupId}`;
    
    // Clean up existing channel if any
    const existingChannel = activeChannels.get(channelName);
    if (existingChannel) {
        await supabase.removeChannel(existingChannel);
        activeChannels.delete(channelName);
    }

    const channel = supabase.channel(channelName, {
        config: {
            presence: {
                key: user.id,
            },
        },
    });

    // Handle presence sync
    channel.on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceUser>();
        const users = Object.values(state).flat();
        onPresenceChange(users);
    });

    // Handle user join
    channel.on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('User joined:', newPresences);
    });

    // Handle user leave
    channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('User left:', leftPresences);
    });

    // Subscribe and track presence
    channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
            await channel.track({
                id: user.id,
                name: user.name,
                avatar: user.avatar,
                joinedAt: new Date().toISOString(),
                lastSeen: new Date().toISOString(),
            });
        }
    });

    activeChannels.set(channelName, channel);

    // Return cleanup function
    return async () => {
        await channel.untrack();
        if (supabase) {
            await supabase.removeChannel(channel);
        }
        activeChannels.delete(channelName);
    };
};

/**
 * Update presence (heartbeat)
 */
export const updatePresence = async (
    groupId: string,
    user: { id: string; name: string; avatar?: string }
): Promise<void> => {
    if (!isSupabaseConfigured() || !supabase) return;

    const channelName = `presence:group:${groupId}`;
    const channel = activeChannels.get(channelName);
    
    if (channel) {
        await channel.track({
            id: user.id,
            name: user.name,
            avatar: user.avatar,
            joinedAt: new Date().toISOString(),
            lastSeen: new Date().toISOString(),
        });
    }
};

/**
 * Leave presence channel
 */
export const leavePresence = async (groupId: string): Promise<void> => {
    if (!isSupabaseConfigured() || !supabase) return;

    const channelName = `presence:group:${groupId}`;
    const channel = activeChannels.get(channelName);
    
    if (channel) {
        await channel.untrack();
        await supabase.removeChannel(channel);
        activeChannels.delete(channelName);
    }
};

/**
 * Get current viewers count (for display)
 */
export const getViewersCount = (groupId: string): number => {
    const channelName = `presence:group:${groupId}`;
    const channel = activeChannels.get(channelName);
    
    if (channel) {
        const state = channel.presenceState<PresenceUser>();
        return Object.values(state).flat().length;
    }
    
    return 0;
};
