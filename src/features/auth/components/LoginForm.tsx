import React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { IconInput } from '@/components/ui/IconInput';
import { loginSchema } from '@/features/auth/auth.validation';
import type { LoginFormValues } from '@/features/auth/auth.form.types';

interface LoginFormProps {
    onSubmit: (values: LoginFormValues) => void;
    onForgotPassword: () => void;
    onSwitchToRegister: () => void;
    loading: boolean;
    serverError?: string | null;
}

export const LoginForm: React.FC<LoginFormProps> = ({
    onSubmit,
    onForgotPassword,
    onSwitchToRegister,
    loading,
    serverError,
}) => {
    const [showPassword, setShowPassword] = React.useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        mode: 'onBlur',
        defaultValues: {
            email: '',
            password: '',
            rememberMe: true,
        },
    });

    const handleFormSubmit: SubmitHandler<LoginFormValues> = (data) => {
        onSubmit(data);
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {serverError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl animate-in fade-in slide-in-from-top-2">
                    <p className="text-red-600 dark:text-red-400 text-xs font-bold leading-relaxed tracking-wide">
                        {serverError}
                    </p>
                </div>
            )}

            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] ml-1">
                        Email
                    </label>
                    <IconInput
                        {...register('email')}
                        type="email"
                        placeholder="manager@restaurant.com"
                        icon={<Mail />}
                        error={errors.email?.message}
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em]">
                            Пароль
                        </label>
                        <button
                            type="button"
                            onClick={onForgotPassword}
                            className="text-[10px] font-black text-primary hover:opacity-80 uppercase tracking-widest transition-opacity"
                        >
                            Забыли?
                        </button>
                    </div>
                    <IconInput
                        {...register('password')}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        icon={<Lock />}
                        rightIcon={showPassword ? <EyeOff /> : <Eye />}
                        onRightIconClick={() => setShowPassword(!showPassword)}
                        error={errors.password?.message}
                    />
                </div>
            </div>

            <div className="flex items-center justify-between py-1 px-1">
                <div className="flex items-center gap-3">
                    <div className="relative flex items-center h-5">
                        <input
                            {...register('rememberMe')}
                            type="checkbox"
                            id="rememberMe"
                            className="peer h-5 w-5 cursor-pointer appearance-none rounded-lg border border-border-theme bg-card transition-all checked:bg-primary checked:border-primary hover:border-primary/50 focus:outline-none"
                        />
                        <svg
                            className="absolute h-3 w-3 opacity-0 peer-checked:opacity-100 pointer-events-none left-1 text-white transition-opacity"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                    <label
                        htmlFor="rememberMe"
                        className="text-[10px] font-black text-foreground/40 uppercase tracking-widest cursor-pointer hover:text-foreground/60 transition-colors"
                    >
                        Запомнить меня
                    </label>
                </div>
            </div>

            <button
                type="submit"
                disabled={loading || !isValid}
                className="btn-premium w-full !text-[10px] sm:!text-[12px] py-4 sm:py-6 group"
            >
                <span className="relative z-10">{loading ? 'Вход...' : 'Войти в систему'}</span>
                {!loading && (
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 relative z-10 transition-transform group-hover:translate-x-1" />
                )}
            </button>

            <div className="pt-6 text-center border-t border-border-theme">
                <p className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em]">
                    Нет аккаунта?{' '}
                    <button
                        type="button"
                        onClick={onSwitchToRegister}
                        className="text-primary hover:opacity-80 transition-opacity ml-1 font-black"
                    >
                        Создать аккаунт
                    </button>
                </p>
            </div>
        </form>
    );
};
