import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AuthLayout } from './AuthLayout';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { ResetPasswordForm } from './ResetPasswordForm';
import { SuccessView } from './SuccessView';
import type {
    AuthMode,
    LoginFormValues,
    RegisterFormValues,
    ForgotPasswordFormValues,
    ResetPasswordFormValues,
} from '@/features/auth/auth.form.types';
import { translateAuthError } from '@/utils/errorTranslations';
import { clearAuthHash } from '@/features/auth/utils/authPathUtils';
import { ROUTES } from '@/app/routes/routes.constants';
import { setRememberMePreference } from '@/services/supabase/storage';
import { authService } from '@/features/auth/auth.service';
import { toast } from 'sonner';
import { logger } from '@/core/logging';

interface HoRecaAuthProps {
    initialMode?: AuthMode;
}

export const HoRecaAuth: React.FC<HoRecaAuthProps> = ({ initialMode = 'login' }) => {
    const navigate = useNavigate();
    const { login, register, resetPassword, updatePassword, setIsRecoveryFlow, logout } = useAuth();

    const [mode, setMode] = React.useState<AuthMode>(initialMode);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [invitationData, setInvitationData] = React.useState<{
        email: string;
        role: 'client' | 'manager' | 'admin';
    } | null>(null);

    React.useEffect(() => {
        setMode(initialMode);
        setError(null);
    }, [initialMode]);

    React.useEffect(() => {
        setLoading(false);
        setError(null);
    }, [mode]);

    React.useEffect(() => {
        const checkInvite = async () => {
            const params = new URLSearchParams(window.location.search);
            const token = params.get('invite');

            if (token && mode === 'register') {
                try {
                    const result = await authService.getInvitationByToken(token);
                    if (result.success && result.data) {
                        setInvitationData(
                            result.data as { email: string; role: 'client' | 'manager' | 'admin' }
                        );
                        toast.success(`Приглашение подтверждено`, {
                            description: `Вы регистрируетесь как ${result.data.role === 'admin' ? 'Администратор' : result.data.role === 'manager' ? 'Менеджер' : 'Клиент'}`,
                        });
                    }
                } catch (e) {
                    logger.error('Invite check failed', { error: e });
                }
            }
        };
        checkInvite();
    }, [mode]);
    const handleResetPassword = async (values: ResetPasswordFormValues) => {
        setLoading(true);
        setError(null);

        const result = await updatePassword(values.password);
        if (result.success) {
            setMode('reset-success');
            clearAuthHash();
        } else {
            setError(translateAuthError(result.error?.message || 'Unknown error'));
            setLoading(false);
        }
    };

    // Обработка экранов успеха
    if (mode === 'reset-success') {
        return (
            <AuthLayout title="Пароль изменен" subtitle="Теперь вы можете войти с новыми данными">
                <SuccessView
                    type="reset-complete"
                    onContinue={async () => {
                        setIsRecoveryFlow(false);
                        await logout();
                        navigate(ROUTES.AUTH.LOGIN);
                    }}
                />
            </AuthLayout>
        );
    }

    if (mode === 'success-login') {
        return (
            <AuthLayout title="Успешно!">
                <SuccessView type="login" onContinue={() => navigate(ROUTES.DASHBOARD.ROOT)} />
            </AuthLayout>
        );
    }

    if (mode === 'success-register') {
        return (
            <AuthLayout title="Добро пожаловать! 🎉">
                <SuccessView
                    type="registration"
                    onContinue={() => navigate(ROUTES.DASHBOARD.ROOT)}
                />
            </AuthLayout>
        );
    }

    if (mode === 'forgot-success') {
        return (
            <AuthLayout title="Инструкции отправлены">
                <SuccessView type="reset-request" onContinue={() => setMode('login')} />
            </AuthLayout>
        );
    }

    const renderForm = () => {
        switch (mode) {
            case 'register':
                return (
                    <RegisterForm
                        initialData={invitationData ? { email: invitationData.email } : undefined}
                        role={invitationData?.role}
                        onSubmit={async (v: RegisterFormValues) => {
                            setLoading(true);
                            setError(null);

                            // Извлекаем токен из URL перед отправкой
                            const params = new URLSearchParams(window.location.search);
                            const inviteToken = params.get('invite') || undefined;

                            const result = await register({ ...v, inviteToken });
                            if (result.success) {
                                setMode('success-register');
                            } else {
                                setError(
                                    translateAuthError(
                                        result.error?.message || 'Registration failed'
                                    )
                                );
                                setLoading(false);
                            }
                        }}
                        onSwitchToLogin={() => setMode('login')}
                        loading={loading}
                        serverError={error}
                    />
                );
            case 'forgot-password':
                return (
                    <ForgotPasswordForm
                        onSubmit={async (v: ForgotPasswordFormValues) => {
                            setLoading(true);
                            setError(null);
                            const result = await resetPassword(v.email);
                            if (result.success) {
                                setMode('forgot-success');
                            } else {
                                setError(
                                    translateAuthError(result.error?.message || 'Reset failed')
                                );
                                setLoading(false);
                            }
                        }}
                        onBackToLogin={() => setMode('login')}
                        loading={loading}
                        serverError={error}
                    />
                );
            case 'reset-password':
                return (
                    <ResetPasswordForm
                        onSubmit={handleResetPassword}
                        loading={loading}
                        serverError={error}
                    />
                );
            default:
                return (
                    <LoginForm
                        onSubmit={async (v: LoginFormValues) => {
                            setLoading(true);
                            setError(null);
                            setRememberMePreference(!!v.rememberMe);
                            const result = await login(v);
                            if (result.success) {
                                setMode('success-login');
                            } else {
                                setError(
                                    translateAuthError(result.error?.message || 'Login failed')
                                );
                                setLoading(false);
                            }
                        }}
                        onForgotPassword={() => setMode('forgot-password')}
                        onSwitchToRegister={() => setMode('register')}
                        loading={loading}
                        serverError={error}
                    />
                );
        }
    };

    const titles = {
        register: { t: 'Регистрация', s: 'Начните пользоваться сервисом бесплатно.' },
        'forgot-password': { t: 'Восстановление', s: 'Мы поможем вернуть доступ' },
        'reset-password': { t: 'Новый пароль', s: 'Придумайте надежный пароль' },
        login: { t: 'Вход в систему', s: '' },
    };

    const meta = titles[mode as keyof typeof titles] || titles.login;

    return (
        <AuthLayout title={meta.t} subtitle={meta.s}>
            {renderForm()}
        </AuthLayout>
    );
};
