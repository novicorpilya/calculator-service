import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { IconInput } from '@/components/ui/IconInput';
import { forgotPasswordSchema } from '@/features/auth/auth.validation';
import type { ForgotPasswordFormValues } from '@/features/auth/auth.form.types';

interface ForgotPasswordFormProps {
    onSubmit: (values: ForgotPasswordFormValues) => void;
    onBackToLogin: () => void;
    loading: boolean;
    serverError?: string | null;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
    onSubmit,
    onBackToLogin,
    loading,
    serverError,
}) => {
    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
    } = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(forgotPasswordSchema),
        mode: 'onBlur',
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <button
                type="button"
                onClick={onBackToLogin}
                className="flex items-center gap-2 text-foreground/40 hover:text-primary transition-all group text-[10px] font-black uppercase tracking-[0.2em]"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Назад ко входу
            </button>

            {serverError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                    <p className="text-red-600 dark:text-red-400 text-xs font-bold leading-relaxed tracking-wide">
                        {serverError}
                    </p>
                </div>
            )}

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

            <button
                type="submit"
                disabled={loading || !isValid}
                className="btn-premium w-full !text-[12px] py-6"
            >
                <span className="relative z-10">
                    {loading ? 'Отправка...' : 'Отправить инструкцию'}
                </span>
                {!loading && (
                    <Send className="w-4 h-4 relative z-10 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                )}
            </button>
        </form>
    );
};
