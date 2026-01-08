/**
 * Lazy-loaded Page Components
 * 
 * Uses React.lazy for code splitting.
 * Reduces initial bundle size significantly.
 */

import React, { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

// Loading fallback
const PageLoader: React.FC = () => (
    <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground/60">Загрузка...</p>
        </div>
    </div>
);

// Lazy load heavy pages
const LazyClientDashboard = lazy(() =>
    import('@/pages/Dashboard/Client/ClientDashboard.page')
        .then(m => ({ default: m.ClientDashboard }))
);

const LazyManagerDashboard = lazy(() =>
    import('@/pages/Dashboard/Manager/ManagerDashboard.page')
        .then(m => ({ default: m.ManagerDashboard }))
);

// Lazy wrapper HOC
function withLazy<P extends object>(
    LazyComponent: React.LazyExoticComponent<React.ComponentType<P>>
): React.FC<P> {
    const WrappedComponent: React.FC<P> = (props) => (
        <Suspense fallback={<PageLoader />}>
            <LazyComponent {...props} />
        </Suspense>
    );
    return WrappedComponent;
}

// Export wrapped components
export const ClientDashboardLazy = withLazy(LazyClientDashboard);
export const ManagerDashboardLazy = withLazy(LazyManagerDashboard);

// Also export the loader for reuse
export { PageLoader };
