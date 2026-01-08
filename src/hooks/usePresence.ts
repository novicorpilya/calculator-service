import { useState, useEffect, useCallback, useMemo } from 'react';
import { useServices } from '@/core/di/ServiceContainer';

/**
 * Hook to access online status of users.
 * Uses DI container to access PresenceService.
 */
export function usePresence(currentUserId: string | null | undefined) {
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(() => new Set());
    const { presenceService } = useServices();

    // Memoize userId to avoid unnecessary effect re-runs
    const userId = useMemo(() => currentUserId ?? null, [currentUserId]);

    useEffect(() => {
        // Early return without state changes when no user
        if (!userId) {
            return;
        }

        // Subscribe to online users updates
        const unsubscribe = presenceService.subscribeToOnlineUsers((users) => {
            setOnlineUsers(users);
        });

        return () => {
            unsubscribe();
        };
    }, [userId, presenceService]);

    // Handle clearing outside of useEffect
    const effectiveOnlineUsers = useMemo(() => {
        if (!userId) return new Set<string>();
        return onlineUsers;
    }, [userId, onlineUsers]);

    const isUserOnline = useCallback((targetUserId: string): boolean => {
        return effectiveOnlineUsers.has(targetUserId);
    }, [effectiveOnlineUsers]);

    return {
        onlineUsers: effectiveOnlineUsers,
        isUserOnline,
    };
}
