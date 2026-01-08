import React, { createContext, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useServices } from '@/core/di/ServiceContainer';

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
            presenceService.trackUser(user.id).catch(console.error);
        } else {
            // User logged out -> Untrack
            presenceService.untrackUser().catch(console.error);
        }

        return () => {
            // Component unmount -> Cleanup
            // We don't un-track here strictly because re-renders might cause flickering, 
            // but for a top-level provider it's fine.
            if (user) {
                presenceService.untrackUser().catch(console.error);
            }
        };
    }, [user, presenceService]);

    return (
        <PresenceContext.Provider value={null}>
            {children}
        </PresenceContext.Provider>
    );
};
