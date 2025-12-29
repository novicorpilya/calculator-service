import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/app/providers/AuthProvider'
import { AppRoutes } from '@/app/routes/AppRoutes'

/**
 * Корневой компонент приложения.
 * Структура провайдеров организована по принципу "снаружи внутрь".
 * Уровень: Middle+ Production Ready
 */
export const App: React.FC = () => {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppRoutes />
            </BrowserRouter>
        </AuthProvider>
    )
}
