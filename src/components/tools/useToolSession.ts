import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface ToolSessionEnvelope<T> {
    version: 1;
    updatedAt: string;
    data: T;
}

export interface ToolSessionHistoryItem<T> {
    id: string;
    updatedAt: string;
    data: T;
}

interface UseToolSessionOptions<T> {
    emptySession: T;
    debounceMs?: number;
    historyLimit?: number;
    shouldPersist?: (session: T) => boolean;
}

const STORAGE_PREFIX = 'elms_tool_session';
const HISTORY_PREFIX = 'elms_tool_session_history';

const readSession = <T,>(toolId: string): ToolSessionEnvelope<T> | null => {
    if (typeof window === 'undefined') return null;

    try {
        const raw = window.localStorage.getItem(`${STORAGE_PREFIX}:${toolId}`);
        if (!raw) return null;

        const parsed = JSON.parse(raw) as ToolSessionEnvelope<T>;
        if (!parsed || parsed.version !== 1 || !parsed.updatedAt || typeof parsed !== 'object') {
            return null;
        }

        return parsed;
    } catch (error) {
        console.warn(`[ToolSession] Failed to read ${toolId}`, error);
        return null;
    }
};

const writeSession = <T,>(toolId: string, session: T): string | null => {
    if (typeof window === 'undefined') return null;

    try {
        const updatedAt = new Date().toISOString();
        const envelope: ToolSessionEnvelope<T> = {
            version: 1,
            updatedAt,
            data: session,
        };
        window.localStorage.setItem(`${STORAGE_PREFIX}:${toolId}`, JSON.stringify(envelope));
        return updatedAt;
    } catch (error) {
        console.warn(`[ToolSession] Failed to save ${toolId}`, error);
        return null;
    }
};

const removeSession = (toolId: string) => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(`${STORAGE_PREFIX}:${toolId}`);
};

const readSessionHistory = <T,>(toolId: string): ToolSessionHistoryItem<T>[] => {
    if (typeof window === 'undefined') return [];

    try {
        const raw = window.localStorage.getItem(`${HISTORY_PREFIX}:${toolId}`);
        if (!raw) return [];

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];

        return parsed.filter((item): item is ToolSessionHistoryItem<T> => (
            item &&
            typeof item === 'object' &&
            typeof item.id === 'string' &&
            typeof item.updatedAt === 'string' &&
            'data' in item
        ));
    } catch (error) {
        console.warn(`[ToolSession] Failed to read history for ${toolId}`, error);
        return [];
    }
};

const writeSessionHistory = <T,>(
    toolId: string,
    session: T,
    updatedAt: string,
    limit: number,
) => {
    if (typeof window === 'undefined') return [];

    try {
        const existing = readSessionHistory<T>(toolId);
        const fingerprint = JSON.stringify(session);
        const previousFingerprint = existing[0] ? JSON.stringify(existing[0].data) : '';

        if (fingerprint === previousFingerprint) {
            return existing;
        }

        const item: ToolSessionHistoryItem<T> = {
            id: `${toolId}-${updatedAt}`,
            updatedAt,
            data: session,
        };
        const next = [item, ...existing].slice(0, limit);
        window.localStorage.setItem(`${HISTORY_PREFIX}:${toolId}`, JSON.stringify(next));
        return next;
    } catch (error) {
        console.warn(`[ToolSession] Failed to save history for ${toolId}`, error);
        return readSessionHistory<T>(toolId);
    }
};

const removeSessionHistory = (toolId: string) => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(`${HISTORY_PREFIX}:${toolId}`);
};

export const useToolSession = <T,>(
    toolId: string,
    currentSession: T,
    options: UseToolSessionOptions<T>,
) => {
    const { debounceMs = 500, emptySession, historyLimit = 5, shouldPersist } = options;
    const initialSession = useMemo(() => readSession<T>(toolId), [toolId]);
    const initialHistory = useMemo(() => readSessionHistory<T>(toolId), [toolId]);
    const [lastSavedAt, setLastSavedAt] = useState<string | null>(initialSession?.updatedAt ?? null);
    const [hasSavedSession, setHasSavedSession] = useState(Boolean(initialSession));
    const [sessionHistory, setSessionHistory] = useState<ToolSessionHistoryItem<T>[]>(initialHistory);
    const firstRun = useRef(true);

    useEffect(() => {
        if (firstRun.current) {
            firstRun.current = false;
            return;
        }

        const canPersist = shouldPersist ? shouldPersist(currentSession) : true;
        const timer = window.setTimeout(() => {
            if (!canPersist) {
                removeSession(toolId);
                setHasSavedSession(false);
                setLastSavedAt(null);
                return;
            }

            const savedAt = writeSession(toolId, currentSession);
            if (savedAt) {
                setHasSavedSession(true);
                setLastSavedAt(savedAt);
            }
        }, debounceMs);

        return () => window.clearTimeout(timer);
    }, [currentSession, debounceMs, shouldPersist, toolId]);

    const clearSavedSession = useCallback(() => {
        removeSession(toolId);
        setHasSavedSession(false);
        setLastSavedAt(null);
    }, [toolId]);

    const clearSessionHistory = useCallback(() => {
        removeSessionHistory(toolId);
        setSessionHistory([]);
    }, [toolId]);

    const saveImmediately = useCallback((session: T, options?: { history?: boolean }) => {
        const canPersist = shouldPersist ? shouldPersist(session) : true;
        if (!canPersist) {
            clearSavedSession();
            return;
        }

        const savedAt = writeSession(toolId, session);
        if (savedAt) {
            setHasSavedSession(true);
            setLastSavedAt(savedAt);
            if (options?.history) {
                setSessionHistory(writeSessionHistory(toolId, session, savedAt, historyLimit));
            }
        }
    }, [clearSavedSession, historyLimit, shouldPersist, toolId]);

    const saveSnapshot = useCallback((session: T = currentSession) => {
        saveImmediately(session, { history: true });
    }, [currentSession, saveImmediately]);

    return {
        initialData: initialSession?.data ?? emptySession,
        initialUpdatedAt: initialSession?.updatedAt ?? null,
        hasSavedSession,
        lastSavedAt,
        sessionHistory,
        clearSavedSession,
        clearSessionHistory,
        saveImmediately,
        saveSnapshot,
    };
};

export const formatToolSessionTime = (isoDate: string | null) => {
    if (!isoDate) return 'Not saved yet';

    try {
        return new Intl.DateTimeFormat(undefined, {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        }).format(new Date(isoDate));
    } catch {
        return 'Saved recently';
    }
};
