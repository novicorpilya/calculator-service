import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { ROUTES } from './routes.constants';
import { GlobalLoader } from '@/components/common/GlobalLoader';

// ============================================================
// LAZY LOADED COMPONENTS (Code Splitting)
// Each route is loaded on-demand, reducing initial bundle size
// ============================================================

// Public pages
const Landing = React.lazy(() =>
    import('@/pages/Landing/Landing.page').then((m) => ({ default: m.Landing }))
);
const HoRecaAuth = React.lazy(() =>
    import('@/features/auth').then((m) => ({ default: m.HoRecaAuth }))
);

// Dashboard pages (heavy components)
const ClientDashboard = React.lazy(() =>
    import('@/pages/Dashboard/Client/ClientDashboard.page').then((m) => ({
        default: m.ClientDashboard,
    }))
);
const ManagerDashboard = React.lazy(() =>
    import('@/pages/Dashboard/Manager/ManagerDashboard.page').then((m) => ({
        default: m.ManagerDashboard,
    }))
);
const AdminDashboard = React.lazy(() =>
    import('@/pages/Dashboard/Admin/AdminDashboard.page').then((m) => ({
        default: m.AdminDashboard,
    }))
);

// Error pages
const NotFoundPage = React.lazy(() =>
    import('@/pages/Error/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);
const ForbiddenPage = React.lazy(() =>
    import('@/pages/Error/ForbiddenPage').then((m) => ({ default: m.ForbiddenPage }))
);
const MaintenancePage = React.lazy(() =>
    import('@/pages/Error/MaintenancePage').then((m) => ({ default: m.MaintenancePage }))
);

// Fallback component for Suspense and Initial Loading
const Loader = () => <GlobalLoader />;

// ============================================================
// APP ROUTES
// ============================================================

export const AppRoutes: React.FC = () => {
    const { user, isInitializing, isRecoveryFlow, setIsRecoveryFlow } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Fix "Zombie" Recovery Flow: reset when navigating away from reset page
    React.useEffect(() => {
        if (isRecoveryFlow && location.pathname !== ROUTES.AUTH.RESET_PASSWORD) {
            setIsRecoveryFlow(false);
        }
    }, [location.pathname, isRecoveryFlow, setIsRecoveryFlow]);

    // Global initialization loader
    if (isInitializing) {
        return <Loader />;
    }

    // Maintenance Mode Check
    const isMaintenance = import.meta.env.VITE_MAINTENANCE_MODE === 'true';
    if (isMaintenance && location.pathname !== ROUTES.ERRORS.MAINTENANCE) {
        return <Navigate to={ROUTES.ERRORS.MAINTENANCE} replace />;
    }

    return (
        <Suspense fallback={<Loader />}>
            <Routes>
                {/* Public routes */}
                <Route
                    path={ROUTES.LANDING}
                    element={
                        <Suspense fallback={<Loader />}>
                            <Landing onStart={() => navigate(ROUTES.AUTH.LOGIN)} />
                        </Suspense>
                    }
                />

                {/* Auth routes (unauthenticated only) */}
                <Route element={<PublicRoute />}>
                    <Route
                        path={ROUTES.AUTH.LOGIN}
                        element={
                            <Suspense fallback={<Loader />}>
                                <HoRecaAuth initialMode="login" />
                            </Suspense>
                        }
                    />
                    <Route
                        path={ROUTES.AUTH.REGISTER}
                        element={
                            <Suspense fallback={<Loader />}>
                                <HoRecaAuth initialMode="register" />
                            </Suspense>
                        }
                    />
                    <Route
                        path={ROUTES.AUTH.FORGOT_PASSWORD}
                        element={
                            <Suspense fallback={<Loader />}>
                                <HoRecaAuth initialMode="forgot-password" />
                            </Suspense>
                        }
                    />
                </Route>

                {/* Password reset - special flow */}
                <Route
                    path={ROUTES.AUTH.RESET_PASSWORD}
                    element={
                        isRecoveryFlow || window.location.hash.includes('access_token') ? (
                            <Suspense fallback={<Loader />}>
                                <HoRecaAuth initialMode="reset-password" />
                            </Suspense>
                        ) : (
                            <Navigate to={ROUTES.LANDING} replace />
                        )
                    }
                />

                {/* Protected routes */}
                <Route element={<ProtectedRoute />}>
                    <Route
                        path={ROUTES.DASHBOARD.ROOT}
                        element={
                            user?.role === 'admin' ? (
                                <Navigate to={ROUTES.DASHBOARD.ADMIN} replace />
                            ) : user?.role === 'manager' ? (
                                <Navigate to={ROUTES.DASHBOARD.MANAGER} replace />
                            ) : (
                                <Navigate to={ROUTES.DASHBOARD.CLIENT} replace />
                            )
                        }
                    />

                    <Route element={<ProtectedRoute allowedRoles={['manager']} />}>
                        <Route
                            path={ROUTES.DASHBOARD.MANAGER}
                            element={
                                <Suspense fallback={<Loader />}>
                                    <ManagerDashboard />
                                </Suspense>
                            }
                        />
                    </Route>

                    <Route element={<ProtectedRoute allowedRoles={['client']} />}>
                        <Route
                            path={ROUTES.DASHBOARD.CLIENT}
                            element={
                                <Suspense fallback={<Loader />}>
                                    <ClientDashboard />
                                </Suspense>
                            }
                        />
                    </Route>

                    <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                        <Route
                            path={ROUTES.DASHBOARD.ADMIN}
                            element={
                                <Suspense fallback={<Loader />}>
                                    <AdminDashboard />
                                </Suspense>
                            }
                        />
                    </Route>
                </Route>

                {/* Error pages */}
                <Route
                    path={ROUTES.ERRORS.FORBIDDEN}
                    element={
                        <Suspense fallback={<Loader />}>
                            <ForbiddenPage />
                        </Suspense>
                    }
                />
                <Route
                    path={ROUTES.ERRORS.NOT_FOUND}
                    element={
                        <Suspense fallback={<Loader />}>
                            <NotFoundPage />
                        </Suspense>
                    }
                />
                <Route
                    path={ROUTES.ERRORS.MAINTENANCE}
                    element={
                        <Suspense fallback={<Loader />}>
                            <MaintenancePage />
                        </Suspense>
                    }
                />

                {/* Catch-all to 404 page */}
                <Route
                    path="*"
                    element={
                        <Suspense fallback={<Loader />}>
                            <NotFoundPage />
                        </Suspense>
                    }
                />
            </Routes>
        </Suspense>
    );
};
