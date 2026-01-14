import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { ROUTES } from './routes.constants';

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

// ============================================================
// LOADING FALLBACKS
// ============================================================

const PageLoader = () => (
    <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest">
                Загрузка...
            </p>
        </div>
    </div>
);

const InitLoader = () => (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="text-white text-xl animate-pulse font-light tracking-widest">
            HORECA CALCULATOR
        </div>
    </div>
);

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
        return <InitLoader />;
    }

    return (
        <Suspense fallback={<PageLoader />}>
            <Routes>
                {/* Public routes */}
                <Route
                    path={ROUTES.LANDING}
                    element={
                        <Suspense fallback={<PageLoader />}>
                            <Landing onStart={() => navigate(ROUTES.AUTH.LOGIN)} />
                        </Suspense>
                    }
                />

                {/* Auth routes (unauthenticated only) */}
                <Route element={<PublicRoute />}>
                    <Route
                        path={ROUTES.AUTH.LOGIN}
                        element={
                            <Suspense fallback={<PageLoader />}>
                                <HoRecaAuth initialMode="login" />
                            </Suspense>
                        }
                    />
                    <Route
                        path={ROUTES.AUTH.REGISTER}
                        element={
                            <Suspense fallback={<PageLoader />}>
                                <HoRecaAuth initialMode="register" />
                            </Suspense>
                        }
                    />
                    <Route
                        path={ROUTES.AUTH.FORGOT_PASSWORD}
                        element={
                            <Suspense fallback={<PageLoader />}>
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
                            <Suspense fallback={<PageLoader />}>
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
                                <Suspense fallback={<PageLoader />}>
                                    <ManagerDashboard />
                                </Suspense>
                            }
                        />
                    </Route>

                    <Route element={<ProtectedRoute allowedRoles={['client']} />}>
                        <Route
                            path={ROUTES.DASHBOARD.CLIENT}
                            element={
                                <Suspense fallback={<PageLoader />}>
                                    <ClientDashboard />
                                </Suspense>
                            }
                        />
                    </Route>

                    <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                        <Route
                            path={ROUTES.DASHBOARD.ADMIN}
                            element={
                                <Suspense fallback={<PageLoader />}>
                                    <AdminDashboard />
                                </Suspense>
                            }
                        />
                    </Route>
                </Route>

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to={ROUTES.LANDING} replace />} />
            </Routes>
        </Suspense>
    );
};
