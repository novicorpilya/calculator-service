import { useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServices } from '@/app/di/ServiceContainer';
import type { UnreadCounts, MessageEventType, ChatEventPayload } from '../types';

/**
 * useUnreadCount Hook
 * 
 * Provides global unread message counts for both direct and project chats.
 * Synchronized via Realtime.
 */
export function useUnreadCount(userId: string | undefined) {
    const { chatService } = useServices();
    const queryClient = useQueryClient();
    const queryKey = useMemo(() => ['unread-counts', userId], [userId]);

    const { data: counts = { total: 0, perSender: {}, perProject: {} } } = useQuery<UnreadCounts>({
        queryKey,
        queryFn: async () => {
            if (!userId) return { total: 0, perSender: {}, perProject: {} };
            const res = await chatService.getUnreadCounts(userId);
            if (!res.success) throw new Error(res.error?.message || 'Failed to fetch unread counts');
            return res.data || { total: 0, perSender: {}, perProject: {} };
        },
        enabled: !!userId,
        staleTime: 30000, 
    });

    useEffect(() => {
        if (!userId) return;

        // 1. Subscribe to ALL messages involving this user (Direct Chats)
        const unsubscribeMsgs = chatService.subscribeToMessages((_payload: ChatEventPayload, evt: MessageEventType) => {
            if (evt === 'INSERT' || evt === 'READ' || evt === 'DELETE') {
                queryClient.invalidateQueries({ queryKey });
            }
        }, undefined, userId);

        // 2. Subscribe to Project Pulses (Project Chats)
        // This ensures that when someone else sends a message in a project, 
        // or a project is marked as read, we refresh the counts.
        const unsubscribeProjects = chatService.subscribeToProjects(() => {
            queryClient.invalidateQueries({ queryKey });
        });

        return () => {
            unsubscribeMsgs();
            unsubscribeProjects();
        };
    }, [userId, chatService, queryClient, queryKey]);

    const directUnread = useMemo(() => {
        if (!counts.perSender) return 0;
        return Object.values(counts.perSender).reduce((acc, val) => acc + val, 0);
    }, [counts.perSender]);

    const projectUnread = useMemo(() => {
        if (!counts.perProject) return 0;
        return Object.values(counts.perProject).reduce((acc, val) => acc + val, 0);
    }, [counts.perProject]);

    return {
        directUnread,
        projectUnread,
        total: counts.total,
        directCounts: counts.perSender || {},
        projectCounts: counts.perProject || {},
        counts
    };
}
