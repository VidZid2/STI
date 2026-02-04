/**
 * usePresence Hook - Manages real-time presence for group chat
 * Tracks who's currently viewing the chat
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    joinPresence,
    updatePresence,
    leavePresence,
    type PresenceUser,
} from '../../../../services/presenceService';

interface UsePresenceOptions {
    groupId: string | undefined;
    user: {
        id: string;
        name: string;
        avatar?: string;
    } | null;
    enabled?: boolean;
}

interface UsePresenceReturn {
    viewers: PresenceUser[];
    viewerCount: number;
    isConnected: boolean;
}

export const usePresence = ({
    groupId,
    user,
    enabled = true,
}: UsePresenceOptions): UsePresenceReturn => {
    const [viewers, setViewers] = useState<PresenceUser[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const cleanupRef = useRef<(() => void) | null>(null);
    const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

    // Handle presence changes
    const handlePresenceChange = useCallback((users: PresenceUser[]) => {
        setViewers(users);
        setIsConnected(true);
    }, []);

    // Join presence on mount
    useEffect(() => {
        if (!groupId || !user || !enabled) return;

        const initPresence = async () => {
            const cleanup = await joinPresence(groupId, user, handlePresenceChange);
            cleanupRef.current = cleanup;
        };

        initPresence();

        // Heartbeat to keep presence alive (every 30 seconds)
        heartbeatRef.current = setInterval(() => {
            if (groupId && user) {
                updatePresence(groupId, user);
            }
        }, 30000);

        // Cleanup on unmount
        return () => {
            if (cleanupRef.current) {
                cleanupRef.current();
                cleanupRef.current = null;
            }
            if (heartbeatRef.current) {
                clearInterval(heartbeatRef.current);
                heartbeatRef.current = null;
            }
            if (groupId) {
                leavePresence(groupId);
            }
            setIsConnected(false);
        };
    }, [groupId, user?.id, user?.name, user?.avatar, enabled, handlePresenceChange]);

    // Handle visibility change (pause/resume presence)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                // Page is hidden, could pause heartbeat
                if (heartbeatRef.current) {
                    clearInterval(heartbeatRef.current);
                    heartbeatRef.current = null;
                }
            } else {
                // Page is visible, resume heartbeat
                if (groupId && user && enabled && !heartbeatRef.current) {
                    updatePresence(groupId, user);
                    heartbeatRef.current = setInterval(() => {
                        updatePresence(groupId, user);
                    }, 30000);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [groupId, user, enabled]);

    return {
        viewers,
        viewerCount: viewers.length,
        isConnected,
    };
};

export default usePresence;
