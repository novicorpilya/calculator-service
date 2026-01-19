import React from 'react';
import { AppProviders } from '@/app/providers/AppProviders';
import { AppRoutes } from '@/app/routes/AppRoutes';
import { ErrorBoundary } from '@/core/components/ErrorBoundary';
import { ConnectivityBanner } from '@/components/common/ConnectivityBanner';

/**
 * Main Application Component.
 * Simplified structure using AppProviders for clean dependency management.
 */
export const App: React.FC = () => {
    return (
        <ErrorBoundary>
            <ConnectivityBanner />
            <AppProviders>
                <AppRoutes />
            </AppProviders>
        </ErrorBoundary>
    );
};
