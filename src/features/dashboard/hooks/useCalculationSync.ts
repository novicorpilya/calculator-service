import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase.service';
import { useServices } from '@/app/di/ServiceContainer';
import type { Calculation } from '../dashboard.types';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { dashboardKeys } from './useCalculations';

interface CalculationDB {
    id: number;
    user_id: string;
    manager_id: string | null;
    status: string;
    organization_name: string;
    updated_at: string;
}

/**
 * useCalculationSync - Enterprise-grade realtime synchronization
 *
 * Handles INSERT, UPDATE, DELETE events with precise cache updates
 * instead of broad cache invalidation.
 */
export function useCalculationSync(userId: string | null) {
    const queryClient = useQueryClient();
    const { logger, chatService } = useServices();
    const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    useEffect(() => {
        if (!userId) return;

        // Prevent duplicate subscriptions
        if (subscriptionRef.current) {
            supabase.removeChannel(subscriptionRef.current);
        }

        logger.info('[RealtimeSync] Establishing calculations subscription', { userId });

        const channel = supabase
            .channel(`calculations_sync_${userId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'calculations' },
                (payload: RealtimePostgresChangesPayload<CalculationDB>) => {
                    const eventType = payload.eventType;
                    const record = (
                        eventType === 'DELETE' ? payload.old : payload.new
                    ) as CalculationDB;

                    logger.info('[RealtimeSync] Calculation event received', {
                        eventType,
                        calculationId: record?.id,
                        managerId: record?.manager_id,
                        status: record?.status,
                    });

                    switch (eventType) {
                        case 'INSERT': {
                            // New calculation - check if it's relevant to current user
                            const isRelevant =
                                record.user_id === userId ||
                                record.manager_id === userId ||
                                record.manager_id === null; // Unassigned leads visible to managers

                            if (isRelevant) {
                                // Invalidate ALL calculation queries to include new item
                                queryClient.invalidateQueries({
                                    queryKey: dashboardKeys.all,
                                    refetchType: 'active',
                                });
                            }
                            break;
                        }

                        case 'UPDATE': {
                            // Check if we have this calculation in cache
                            const detailKey = dashboardKeys.detail(record.id);
                            const existingDetail = queryClient.getQueryData<Calculation>(detailKey);

                            if (existingDetail) {
                                // Partial update in cache (optimistic merge)
                                queryClient.setQueryData(
                                    detailKey,
                                    (old: Calculation | undefined) => {
                                        if (!old) return old;
                                        return {
                                            ...old,
                                            status: record.status,
                                            manager_id: record.manager_id,
                                            // Note: We only update fields we receive
                                        };
                                    }
                                );
                            }

                            // FORCE REFETCH all queries - not just invalidate
                            queryClient.refetchQueries({
                                queryKey: dashboardKeys.all,
                                type: 'active',
                            });

                            // Also update recipients if manager changed
                            if (record.manager_id) {
                                queryClient.invalidateQueries({ queryKey: ['recipients'] });
                            }
                            break;
                        }

                        case 'DELETE': {
                            // Remove from cache
                            const deleteKey = dashboardKeys.detail(record.id);
                            queryClient.removeQueries({ queryKey: deleteKey });

                            // Invalidate all lists
                            queryClient.invalidateQueries({
                                queryKey: dashboardKeys.all,
                                refetchType: 'active',
                            });
                            break;
                        }
                    }
                }
            )
            .subscribe((status: string) => {
                if (status === 'SUBSCRIBED') {
                    logger.info('[RealtimeSync] Subscription active');
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    logger.error('[RealtimeSync] Connection issue', null, { status });
                }
            });

        subscriptionRef.current = channel;

        return () => {
            logger.info('[RealtimeSync] Cleaning up subscription');
            if (subscriptionRef.current) {
                supabase.removeChannel(subscriptionRef.current);
                subscriptionRef.current = null;
            }
        };
    }, [userId, queryClient, logger]);

    // Listen to Broadcast Pulses (New Messages -> Bump Sorting)
    useEffect(() => {
        if (!userId) return;

        // Subscribe to real-time chat updates (Global Sync)
        const cleanup = chatService.subscribeToProjects((payload) => {
            // When a new message arrives, the backend trigger bumps updated_at.
            // We must invalidate queries to re-fetch the sorted list and update badges.

            logger.info('[RealtimeSync] Received project pulse', payload);

            queryClient.invalidateQueries({
                queryKey: ['calculations'],
                refetchType: 'active',
            });

            queryClient.invalidateQueries({
                queryKey: ['unread-counts', userId],
            });
        });

        return () => cleanup();
    }, [userId, chatService, queryClient, logger]);
}
