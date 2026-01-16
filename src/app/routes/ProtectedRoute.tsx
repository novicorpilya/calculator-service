import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { ROUTES } from './routes.constants';

interface ProtectedRouteProps {
    allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
    const { isAuthenticated, user, isRecoveryFlow } = useAuth();
    const location = useLocation();

    // Если сейчас идет поток восстановления пароля, блокируем доступ к дашборду
    if (isRecoveryFlow) {
        return <Navigate to={ROUTES.AUTH.RESET_PASSWORD} replace />;
    }

    if (!isAuthenticated) {
        return <Navigate to={ROUTES.AUTH.LOGIN} state={{ from: location }} replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return <Navigate to={ROUTES.ERRORS.FORBIDDEN} replace />;
    }

    return <Outlet />;
};
