import React, { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/app/providers/AuthProvider'
import { ThemeProvider } from '@/app/providers/ThemeProvider'
import { AppRoutes } from '@/app/routes/AppRoutes'

import { Toaster } from 'sonner'

import { ServiceProvider } from '@/core/di/ServiceContainer'
import { ErrorBoundary } from '@/core/components/ErrorBoundary'
import { initTelemetry } from '@/core/utils/logger'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
})

/**
 * Корневой компонент приложения.
 * Структура провайдеров организована по принципу "снаружи внутрь".
 * Уровень: Senior Production Ready
 */
export const App: React.FC = () => {
    // Initialize telemetry on mount
    useEffect(() => {
        initTelemetry();
    }, []);

    return (
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider>
                    <AuthProvider>
                        <ServiceProvider>
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
                        </ServiceProvider>
                    </AuthProvider>
                </ThemeProvider>
            </QueryClientProvider>
        </ErrorBoundary>
    )
}

