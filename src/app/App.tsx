import React from 'react'
import { HoRecaAuth } from '@/components/auth/HoRecaAuth'
import { AuthProvider } from '@/app/providers/AuthProvider'
import { QueryProvider } from '@/app/providers/QueryProvider'
import { useAuth } from '@/app/providers/useAuthHook'
import { Landing } from '@/pages/Landing/Landing.page'
import { ClientDashboard } from '@/pages/Dashboard'

// Внутренний компонент с условным рендерингом
const AppContent: React.FC = () => {
    const { isAuthenticated, isInitializing } = useAuth()

    // Инициализируем состояние лендинга на основе URL
    const [showLanding, setShowLanding] = React.useState(() => {
        const params = new URLSearchParams(window.location.search)
        return params.get('auth') !== 'true'
    })

    // Если пользователь авторизовался, скрываем лендинг
    React.useEffect(() => {
        if (isAuthenticated) {
            setShowLanding(false)
        }
    }, [isAuthenticated])

    // Показываем загрузку только при первом запуске (проверка сессии)
    if (isInitializing) {
        return (
            <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
                <div className="text-white text-xl animate-pulse">Загрузка...</div>
            </div>
        )
    }

    // Если авторизован — показываем Dashboard
    if (isAuthenticated) {
        return <ClientDashboard />
    }

    // Если не авторизован — показываем Landing или Auth
    return showLanding ? (
        <Landing onStart={() => window.open(window.location.origin + '?auth=true', '_blank')} />
    ) : (
        <HoRecaAuth />
    )
}

export const App: React.FC = () => {
    return (
        <QueryProvider>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </QueryProvider>
    )
}
