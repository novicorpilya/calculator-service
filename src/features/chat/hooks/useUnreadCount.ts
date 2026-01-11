
import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServices } from '@/core/di/ServiceContainer';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { type MessageEventType } from '../types';

export function useUnreadCount(userId?: string) {
    const { chatService } = useServices();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    
    // Use passed userId or fallback to current user
    const effectiveUserId = userId || user?.id;

    const queryKey = useMemo(() => ['unread-counts', effectiveUserId], [effectiveUserId]);

    const { data, isLoading, refetch } = useQuery({
        queryKey,
        queryFn: () => chatService.getUnreadCounts(effectiveUserId!),
        enabled: !!effectiveUserId,
        staleTime: 0,
        refetchOnWindowFocus: true
    });

    useEffect(() => {
        if (!effectiveUserId) return;

        // Subscribe to all incoming messages for this user to update counts
        const unsubscribe = chatService.subscribeToMessages((_msg, eventType: MessageEventType) => {
            // Listen for INSERT (new msg), UPDATE (read status/edit), or READ (custom broadcast)
            if (eventType === 'INSERT' || eventType === 'UPDATE' || eventType === 'READ') {
                // Invalidate to fetch fresh counts
                queryClient.invalidateQueries({ queryKey });
            }
        }, undefined, effectiveUserId);

        // Also listen for "read" events (broadcasted specially)
        // Note: ChatService handles 'broadcastMessagesRead' but access to raw channel might be needed 
        // if subscribeToMessages doesn't cover custom events.
        // Assuming 'subscribeToMessages' covers standard DB changes.
        // For custom 'read' events, we might need a separate subscription if they are not just DB updates.
        // But usually marking as read updates the 'messages' or 'read_markers' table, which triggers DB changes?
        // Actually, Realtime often listens to Postgres changes. 
        // If 'markAsRead' updates 'messages' (is_read=true), we get UPDATE event.
        // If 'markAsRead' inserts 'chat_read_markers', we might need to listen to that table too.
        
        return () => {
            unsubscribe();
        };
    }, [chatService, effectiveUserId, queryClient, queryKey]);

    const projectUnread = useMemo(() => 
        Object.values(data?.perProject || {}).reduce((a, b) => a + b, 0), 
    [data?.perProject]);

    const directUnread = useMemo(() => 
        Object.values(data?.perSender || {}).reduce((a, b) => a + b, 0), 
    [data?.perSender]);

    return {
        totalUnread: data?.total || 0,
        projectUnread,
        directUnread,
        projectCounts: data?.perProject || {},
        senderCounts: data?.perSender || {},
        isLoading,
        refetch
    };
}
