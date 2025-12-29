import React from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { IconInput } from '@/components/ui/IconInput'
import { Button } from '@/components/ui/Button'
import { loginSchema } from '@/features/auth/auth.validation'
import type { LoginFormValues } from '@/features/auth/auth.form.types'

interface LoginFormProps {
    onSubmit: (values: LoginFormValues) => void
    onForgotPassword: () => void
    onSwitchToRegister: () => void
    loading: boolean
    serverError?: string | null
}

export const LoginForm: React.FC<LoginFormProps> = ({
    onSubmit,
    onForgotPassword,
    onSwitchToRegister,
    loading,
    serverError
}) => {
    const [showPassword, setShowPassword] = React.useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors, isValid }
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        mode: 'onBlur',
        defaultValues: {
            email: '',
            password: '',
            rememberMe: true
        }
    })

    const handleFormSubmit: SubmitHandler<LoginFormValues> = (data) => {
        onSubmit(data)
    }

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            {serverError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl animate-in fade-in slide-in-from-top-2">
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

            <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 ml-1">Пароль</label>
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

            <div className="flex items-center justify-between py-1 ml-1">
                <div className="flex items-center gap-2">
                    <div className="relative flex items-center">
                        <input
                            {...register('rememberMe')}
                            type="checkbox"
                            id="rememberMe"
                            className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-gray-300 transition-all checked:bg-blue-600 checked:border-blue-600 hover:border-blue-400 focus:outline-none"
                        />
                        <svg
                            className="absolute h-3.5 w-3.5 opacity-0 peer-checked:opacity-100 pointer-events-none left-0.5 text-white transition-opacity"
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
                        className="text-sm font-medium text-gray-600 cursor-pointer select-none"
                    >
                        Запомнить меня
                    </label>
                </div>

                <button
                    type="button"
                    onClick={onForgotPassword}
                    className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline tracking-tight"
                >
                    Забыли пароль?
                </button>
            </div>

            <Button
                type="submit"
                disabled={loading || !isValid}
                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-200 disabled:opacity-50"
            >
                {loading ? 'Вход...' : 'Войти в систему'}
            </Button>

            <div className="pt-4 text-center">
                <p className="text-sm text-gray-500 font-medium">
                    Нет аккаунта?{' '}
                    <button
                        type="button"
                        onClick={onSwitchToRegister}
                        className="text-blue-600 hover:text-blue-700 font-black uppercase tracking-wider text-xs"
                    >
                        Зарегистрироваться
                    </button>
                </p>
            </div>
        </form>
    )
}
