import React from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { Landing } from '@/pages/Landing/Landing.page'
import { ClientDashboard, ManagerDashboard } from '@/pages/Dashboard'
import { HoRecaAuth, useAuth } from '@/features/auth'
import { ProtectedRoute } from './ProtectedRoute'
import { PublicRoute } from './PublicRoute'
import { ROUTES } from './routes.constants'

export const AppRoutes: React.FC = () => {
    const { user, isInitializing } = useAuth()
    const navigate = useNavigate()

    // Если приложение инициализируется, показываем экран загрузки глобально
    if (isInitializing) {
        return (
            <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
                <div className="text-white text-xl animate-pulse font-light tracking-widest">
                    HORECA CALCULATOR
                </div>
            </div>
        )
    }

    return (
        <Routes>
            {/* Публичные маршруты */}
            <Route path={ROUTES.LANDING} element={<Landing onStart={() => navigate(ROUTES.AUTH.LOGIN)} />} />

            {/* Маршруты только для неавторизованных */}
            <Route element={<PublicRoute />}>
                <Route path={ROUTES.AUTH.LOGIN} element={<HoRecaAuth initialMode="login" />} />
                <Route path={ROUTES.AUTH.REGISTER} element={<HoRecaAuth initialMode="register" />} />
                <Route path={ROUTES.AUTH.FORGOT_PASSWORD} element={<HoRecaAuth initialMode="forgot-password" />} />
            </Route>

            {/* Сброс пароля - автономный маршрут (упрощена логика для стабильности) */}
            <Route path={ROUTES.AUTH.RESET_PASSWORD} element={<HoRecaAuth initialMode="reset-password" />} />

            {/* Защищенные маршруты */}
            <Route element={<ProtectedRoute />}>
                <Route
                    path={ROUTES.DASHBOARD.ROOT}
                    element={
                        user?.role === 'manager'
                            ? <Navigate to={ROUTES.DASHBOARD.MANAGER} replace />
                            : <Navigate to={ROUTES.DASHBOARD.CLIENT} replace />
                    }
                />

                <Route element={<ProtectedRoute allowedRoles={['manager']} />}>
                    <Route path={ROUTES.DASHBOARD.MANAGER} element={<ManagerDashboard />} />
                </Route>

                <Route element={<ProtectedRoute allowedRoles={['client']} />}>
                    <Route path={ROUTES.DASHBOARD.CLIENT} element={<ClientDashboard />} />
                </Route>
            </Route>

            {/* Редирект для всех остальных путей */}
            <Route path="*" element={<Navigate to={ROUTES.LANDING} replace />} />
        </Routes>
    )
}
