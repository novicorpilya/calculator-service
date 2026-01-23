import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/index.ts';
import { ROUTES } from './routes.constants';

export const PublicRoute: React.FC = () => {
    const { isAuthenticated, isRecoveryFlow } = useAuth();

    // Если авторизован и НЕ в режиме восстановления, отправляем в дашборд
    if (isAuthenticated && !isRecoveryFlow) {
        return <Navigate to={ROUTES.DASHBOARD.ROOT} replace />;
    }

    return <Outlet />;
};
