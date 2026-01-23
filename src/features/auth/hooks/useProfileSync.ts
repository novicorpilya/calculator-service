import { useEffect, useRef } from 'react';
import { supabase } from '@/services/supabase/client';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { authService } from '../auth.service';
import type { User } from '../auth.types';

interface UseProfileSyncOptions {
    userId: string | undefined;
    isMounted: boolean;
    onProfileUpdate: (user: User) => void;
    onSyncError: () => void;
}

/**
 * Hook to synchronize user profile data in real-time via Postgres changes.
 * Handles user blocking and profile deletions.
 */
export function useProfileSync({
    userId,
    isMounted,
    onProfileUpdate,
    onSyncError,
}: UseProfileSyncOptions) {
    const subscriptionRef = useRef<RealtimeChannel | null>(null);

    useEffect(() => {
        if (!userId || !isMounted) {
            if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
                subscriptionRef.current = null;
            }
            return;
        }

        const setupListener = () => {
            if (subscriptionRef.current) subscriptionRef.current.unsubscribe();

            subscriptionRef.current = supabase
                .channel(`public:profiles:id=eq.${userId}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'profiles',
                        filter: `id=eq.${userId}`,
                    },
                    (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
                        if (!isMounted) return;

                        // IF DELETED
                        if (payload.eventType === 'DELETE') {
                            onSyncError();
                            return;
                        }

                        // For UPDATE/INSERT, re-fetch profile to ensure safe mapping and validation
                        authService.getUserProfile(userId).then((res) => {
                            if (!isMounted) return;
                            const profile = res.success ? res.data : null;
                            if (!profile || profile.status === 'blocked') {
                                onSyncError();
                            } else {
                                onProfileUpdate(profile);
                            }
                        });
                    }
                )
                .subscribe();
        };

        setupListener();

        return () => {
            if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
                subscriptionRef.current = null;
            }
        };
    }, [userId, isMounted, onProfileUpdate, onSyncError]);
}
