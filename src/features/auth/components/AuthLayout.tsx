import React from 'react'
import { AuthHeader } from './AuthHeader'
import { AuthFooter } from './AuthFooter'

interface AuthLayoutProps {
    children: React.ReactNode
    title: string
    subtitle?: string
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <AuthHeader />

                <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">{title}</h2>
                        {subtitle && <p className="text-gray-600 text-sm">{subtitle}</p>}
                    </div>
                    {children}
                </div>

                <AuthFooter />
            </div>
        </div>
    )
}
