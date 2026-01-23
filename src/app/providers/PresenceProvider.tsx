import React, { createContext, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useServices } from '@/app/di/ServiceContainer';

import { logger } from '@/core/logging/index';

/**
 * PresenceProvider
 *
 * Separates Presence Lifecycle responsibility from AuthProvider.
 * Automatically tracks user presence when logged in.
 */

const PresenceContext = createContext(null);

export const PresenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { presenceService } = useServices();

    useEffect(() => {
        if (user) {
            // User logged in -> Track presence (WebSocket)
            presenceService
                .trackUser(user.id)
                .catch((err) => logger.error('[Presence] Track failed', err));
        } else {
            // User logged out -> Untrack
            presenceService
                .untrackUser()
                .catch((err) => logger.error('[Presence] Untrack failed', err));
        }

        return () => {
            // Component unmount -> Cleanup
            if (user) {
                presenceService
                    .untrackUser()
                    .catch((err) => logger.error('[Presence] Cleanup untrack failed', err));
            }
        };
    }, [user, presenceService]);

    return <PresenceContext.Provider value={null}>{children}</PresenceContext.Provider>;
};
