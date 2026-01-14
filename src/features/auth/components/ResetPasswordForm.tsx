import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react';
import { IconInput } from '@/components/ui/IconInput';
import { resetPasswordSchema } from '@/features/auth/auth.validation';
import type { ResetPasswordFormValues } from '@/features/auth/auth.form.types';

interface ResetPasswordFormProps {
    onSubmit: (values: ResetPasswordFormValues) => void;
    loading: boolean;
    serverError?: string | null;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
    onSubmit,
    loading,
    serverError,
}) => {
    const [showPassword, setShowPassword] = React.useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
    } = useForm<ResetPasswordFormValues>({
        resolver: zodResolver(resetPasswordSchema),
        mode: 'onBlur',
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                        Новый пароль
                    </label>
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

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] ml-1">
                        Подтвердите пароль
                    </label>
                    <IconInput
                        {...register('confirmPassword')}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        icon={<Lock />}
                        error={errors.confirmPassword?.message}
                    />
                </div>
            </div>

            <div className="bg-card border border-border-theme p-5 rounded-[1.5rem] space-y-3">
                <p className="text-[9px] font-black uppercase text-foreground/40 tracking-[0.2em]">
                    Безопасность:
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <PasswordRule text="Мин. 8 символов" />
                    <PasswordRule text="Заглавная буква" />
                    <PasswordRule text="Минимум одна цифра" />
                    <PasswordRule text="Спецсимвол" />
                </div>
            </div>

            <button
                type="submit"
                disabled={loading || !isValid}
                className="btn-premium w-full !text-[12px] py-6"
            >
                <span className="relative z-10">
                    {loading ? 'Обновление...' : 'Обновить пароль'}
                </span>
                {!loading && (
                    <ArrowRight className="w-4 h-4 relative z-10 transition-transform group-hover:translate-x-1" />
                )}
            </button>
        </form>
    );
};

const PasswordRule = ({ text }: { text: string }) => (
    <div className="flex items-center gap-2 group">
        <div className="w-4 h-4 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500 group-hover:text-white transition-colors" />
        </div>
        <span className="text-[9px] font-black text-foreground/40 uppercase tracking-widest leading-none">
            {text}
        </span>
    </div>
);
