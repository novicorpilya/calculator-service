import React from 'react'
import { HoRecaAuth } from '@/components/auth/HoRecaAuth'
import { AuthProvider } from '@/app/providers/AuthProvider'
import { QueryProvider } from '@/app/providers/QueryProvider'

export const App: React.FC = () => {
    return (
        <QueryProvider>
            <AuthProvider>
                <HoRecaAuth />
            </AuthProvider>
        </QueryProvider>
    )
}
