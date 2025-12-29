import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { IconInput } from '@/components/ui/IconInput'
import { Button } from '@/components/ui/Button'
import { resetPasswordSchema } from '@/features/auth/auth.validation'
import type { ResetPasswordFormValues } from '@/features/auth/auth.form.types'

interface ResetPasswordFormProps {
    onSubmit: (values: ResetPasswordFormValues) => void
    loading: boolean
    serverError?: string | null
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
    onSubmit,
    loading,
    serverError
}) => {
    const [showPassword, setShowPassword] = React.useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors, isValid }
    } = useForm<ResetPasswordFormValues>({
        resolver: zodResolver(resetPasswordSchema),
        mode: 'onBlur'
    })

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {serverError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl animate-in fade-in slide-in-from-top-2">
                    <p className="text-red-700 text-sm font-medium">{serverError}</p>
                </div>
            )}

            <div className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Новый пароль</label>
                    <IconInput
                        {...register('password')}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        icon={<Lock className="w-5 h-5" />}
                        rightIcon={showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        onRightIconClick={() => setShowPassword(!showPassword)}
                        error={errors.password?.message}
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Подтвердите пароль</label>
                    <IconInput
                        {...register('confirmPassword')}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        icon={<Lock className="w-5 h-5" />}
                        error={errors.confirmPassword?.message}
                    />
                </div>
            </div>

            <div className="bg-blue-50/50 p-4 rounded-xl space-y-2 border border-blue-100/50">
                <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-2">Требования к паролю:</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <PasswordRule text="Мин. 8 символов" />
                    <PasswordRule text="Заглавная буква" />
                    <PasswordRule text="Цифра" />
                    <PasswordRule text="Спецсимвол" />
                </div>
            </div>

            <Button
                type="submit"
                disabled={loading || !isValid}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Обновление...</span>
                    </div>
                ) : (
                    'Обновить пароль'
                )}
            </Button>
        </form>
    )
}

const PasswordRule = ({ text }: { text: string }) => (
    <div className="flex items-center gap-1.5 text-blue-700/70">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        <span className="text-[10px] font-bold leading-none">{text}</span>
    </div>
)
