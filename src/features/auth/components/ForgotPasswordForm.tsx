import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, ArrowLeft, Send } from 'lucide-react'
import { IconInput } from '@/components/ui/IconInput'
import { Button } from '@/components/ui/Button'
import { forgotPasswordSchema } from '@/features/auth/auth.validation'
import type { ForgotPasswordFormValues } from '@/features/auth/auth.form.types'

interface ForgotPasswordFormProps {
    onSubmit: (values: ForgotPasswordFormValues) => void
    onBackToLogin: () => void
    loading: boolean
    serverError?: string | null
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
        formState: { errors, isValid }
    } = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(forgotPasswordSchema),
        mode: 'onBlur'
    })

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <button
                type="button"
                onClick={onBackToLogin}
                className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors group text-sm font-bold uppercase tracking-wider"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Назад
            </button>

            {serverError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-700 text-sm font-medium">{serverError}</p>
                </div>
            )}

            <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 ml-1">Email</label>
                <IconInput
                    {...register('email')}
                    type="email"
                    placeholder="manager@restaurant.com"
                    icon={<Mail className="w-5 h-5" />}
                    error={errors.email?.message}
                />
            </div>

            <Button
                type="submit"
                disabled={loading || !isValid}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-200"
            >
                {loading ? 'Отправка...' : (
                    <div className="flex items-center justify-center gap-2">
                        <span>Отправить инструкцию</span>
                        <Send className="w-4 h-4" />
                    </div>
                )}
            </Button>
        </form>
    )
}
