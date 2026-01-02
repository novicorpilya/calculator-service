import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/app/providers/AuthProvider'
import { ThemeProvider } from '@/app/providers/ThemeProvider'
import { AppRoutes } from '@/app/routes/AppRoutes'

import { Toaster } from 'sonner'

/**
 * Корневой компонент приложения.
 * Структура провайдеров организована по принципу "снаружи внутрь".
 * Уровень: Middle+ Production Ready
 */
export const App: React.FC = () => {
    return (
        <ThemeProvider>
            <AuthProvider>
                <BrowserRouter>
                    <AppRoutes />
                    <Toaster
                        position="top-right"
                        expand={false}
                        richColors
                        theme="dark"
                        toastOptions={{
                            style: {
                                background: 'rgba(23, 23, 23, 0.8)',
                                backdropFilter: 'blur(12px)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '24px',
                            }
                        }}
                    />
                </BrowserRouter>
            </AuthProvider>
        </ThemeProvider>
    )
}
