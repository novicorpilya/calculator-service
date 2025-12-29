import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { AuthLayout } from './AuthLayout'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { ForgotPasswordForm } from './ForgotPasswordForm'
import { ResetPasswordForm } from './ResetPasswordForm'
import { SuccessView } from './SuccessView'
import type {
    AuthMode,
    LoginFormValues,
    RegisterFormValues,
    ForgotPasswordFormValues,
    ResetPasswordFormValues
} from '@/features/auth/auth.form.types'
import { translateAuthError } from '@/utils/errorTranslations'
import { ROUTES } from '@/app/routes/routes.constants'
import { setRememberMePreference } from '@/services/supabase/storage'

interface HoRecaAuthProps {
    initialMode?: AuthMode
}

export const HoRecaAuth: React.FC<HoRecaAuthProps> = ({ initialMode = 'login' }) => {
    const navigate = useNavigate()
    const { login, register, resetPassword, updatePassword, setIsRecoveryFlow, logout } = useAuth()

    const [mode, setMode] = React.useState<AuthMode>(initialMode)
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    React.useEffect(() => {
        setMode(initialMode)
        setError(null)
    }, [initialMode])

    React.useEffect(() => {
        setLoading(false)
        setError(null)
    }, [mode])

    const clearHash = () => {
        if (window.history.replaceState) {
            window.history.replaceState(null, '', window.location.pathname);
        }
    }

    const handleResetPassword = async (values: ResetPasswordFormValues) => {
        setLoading(true)
        setError(null)

        try {
            await updatePassword(values.password)
            setMode('reset-success')
            clearHash()
        } catch (err: any) {
            setError(translateAuthError(err.message))
            setLoading(false)
        }
    }

    // Обработка экранов успеха
    if (mode === 'reset-success') {
        return (
            <AuthLayout title="Пароль изменен" subtitle="Теперь вы можете войти с новыми данными">
                <SuccessView
                    type="reset-complete"
                    onContinue={async () => {
                        setIsRecoveryFlow(false)
                        await logout()
                        navigate(ROUTES.AUTH.LOGIN)
                    }}
                />
            </AuthLayout>
        )
    }

    if (mode === 'success-login' || mode === 'success-register') {
        return (
            <AuthLayout title="Успешно!">
                <SuccessView
                    type={mode === 'success-login' ? 'login' : 'registration'}
                    onContinue={() => navigate(ROUTES.DASHBOARD.ROOT)}
                />
            </AuthLayout>
        )
    }

    if (mode === 'forgot-success') {
        return (
            <AuthLayout title="Инструкции отправлены">
                <SuccessView
                    type="reset-request"
                    onContinue={() => setMode('login')}
                />
            </AuthLayout>
        )
    }

    const renderForm = () => {
        switch (mode) {
            case 'register':
                return (
                    <RegisterForm
                        onSubmit={async (v: RegisterFormValues) => {
                            setLoading(true)
                            setError(null)
                            try {
                                await register(v)
                                setMode('success-register')
                            } catch (e: any) {
                                setError(translateAuthError(e.message))
                                setLoading(false)
                            }
                        }}
                        onSwitchToLogin={() => setMode('login')}
                        loading={loading}
                        serverError={error}
                    />
                )
            case 'forgot-password':
                return (
                    <ForgotPasswordForm
                        onSubmit={async (v: ForgotPasswordFormValues) => {
                            setLoading(true)
                            setError(null)
                            try {
                                await resetPassword(v.email)
                                setMode('forgot-success')
                            } catch (e: any) {
                                setError(translateAuthError(e.message))
                                setLoading(false)
                            }
                        }}
                        onBackToLogin={() => setMode('login')}
                        loading={loading}
                        serverError={error}
                    />
                )
            case 'reset-password':
                return (
                    <ResetPasswordForm
                        onSubmit={handleResetPassword}
                        loading={loading}
                        serverError={error}
                    />
                )
            default:
                return (
                    <LoginForm
                        onSubmit={async (v: LoginFormValues) => {
                            setLoading(true)
                            setError(null)
                            try {
                                setRememberMePreference(!!v.rememberMe)
                                await login(v)
                                setMode('success-login')
                            } catch (e: any) {
                                setError(translateAuthError(e.message))
                                setLoading(false)
                            }
                        }}
                        onForgotPassword={() => setMode('forgot-password')}
                        onSwitchToRegister={() => setMode('register')}
                        loading={loading}
                        serverError={error}
                    />
                )
        }
    }

    const titles = {
        register: { t: "Регистрация", s: "Начните пользоваться сервисом бесплатно." },
        'forgot-password': { t: "Восстановление", s: "Мы поможем вернуть доступ" },
        'reset-password': { t: "Новый пароль", s: "Придумайте надежный пароль" },
        login: { t: "Вход в систему", s: "" }
    }

    const meta = titles[mode as keyof typeof titles] || titles.login

    return (
        <AuthLayout title={meta.t} subtitle={meta.s}>
            {renderForm()}
        </AuthLayout>
    )
}
