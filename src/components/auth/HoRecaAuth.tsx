// filepath: src/components/auth/HoRecaAuth.tsx

import React from 'react'
import { useAuthForm } from '@/hooks/useAuthForm'
import { AuthHeader, AuthFooter, LoginForm, RegisterForm, SuccessScreen } from '@/components/auth'

export const HoRecaAuth: React.FC = () => {
    const {
        mode,
        loading,
        formData,
        showPassword,
        error,
        fieldErrors,
        rememberMe,
        handleModeChange,
        handleInputChange,
        handleBlur,
        handleTogglePassword,
        handleRememberMeChange,
        handleLogin,
        handleRegister,
        handleReset,
    } = useAuthForm()

    if (mode === 'success') {
        return <SuccessScreen onContinue={handleReset} />
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <AuthHeader />

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
                    {mode === 'login' ? (
                        <LoginForm
                            formData={formData}
                            showPassword={showPassword}
                            loading={loading}
                            error={error}
                            fieldErrors={fieldErrors}
                            rememberMe={rememberMe}
                            onInputChange={handleInputChange}
                            onBlur={handleBlur}
                            onTogglePassword={handleTogglePassword}
                            onRememberMeChange={handleRememberMeChange}
                            onSubmit={handleLogin}
                            onSwitchToRegister={() => handleModeChange('register')}
                        />
                    ) : (
                        <RegisterForm
                            formData={formData}
                            showPassword={showPassword}
                            loading={loading}
                            error={error}
                            fieldErrors={fieldErrors}
                            onInputChange={handleInputChange}
                            onBlur={handleBlur}
                            onTogglePassword={handleTogglePassword}
                            onSubmit={handleRegister}
                            onSwitchToLogin={() => handleModeChange('login')}
                        />
                    )}
                </div>

                <AuthFooter />
            </div>
        </div>
    )
}
