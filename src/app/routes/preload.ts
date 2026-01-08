/**
 * Route Preloading Utilities
 * 
 * Use these functions to preload routes before navigation,
 * enabling instant page transitions.
 */

// Preload functions for each lazy-loaded route
export const preloadClientDashboard = () =>
    import('@/pages/Dashboard/Client/ClientDashboard.page');

export const preloadManagerDashboard = () =>
    import('@/pages/Dashboard/Manager/ManagerDashboard.page');

export const preloadAdminDashboard = () =>
    import('@/pages/Dashboard/Admin/AdminDashboard.page');

export const preloadAuth = () =>
    import('@/features/auth');

export const preloadLanding = () =>
    import('@/pages/Landing/Landing.page');

/**
 * Preload dashboard based on user role
 * Call this after successful authentication
 */
export function preloadDashboardForRole(role: 'client' | 'manager' | 'admin') {
    switch (role) {
        case 'client':
            preloadClientDashboard();
            break;
        case 'manager':
            preloadManagerDashboard();
            break;
        case 'admin':
            preloadAdminDashboard();
            break;
    }
}

/**
 * Preload all dashboards (useful on idle)
 */
export function preloadAllDashboards() {
    // Use requestIdleCallback if available, otherwise setTimeout
    const schedulePreload = (fn: () => void) => {
        if ('requestIdleCallback' in window) {
            (window as any).requestIdleCallback(fn, { timeout: 3000 });
        } else {
            setTimeout(fn, 100);
        }
    };

    schedulePreload(preloadClientDashboard);
    schedulePreload(preloadManagerDashboard);
    schedulePreload(preloadAdminDashboard);
}
