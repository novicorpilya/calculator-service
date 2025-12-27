

import React from 'react'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { IconInput } from '@/components/ui/IconInput'
import { Button } from '@/components/ui/Button'
import type { AuthFormState } from '@/features/auth/auth.form.types'

interface LoginFormProps {
    formData: AuthFormState['formData']
    showPassword: boolean
    loading: boolean
    error?: string | null
    fieldErrors?: AuthFormState['fieldErrors']
    rememberMe: boolean
    isFormValid?: boolean
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => void
    onTogglePassword: () => void
    onRememberMeChange: (checked: boolean) => void
    onSubmit: () => void
    onSwitchToRegister: () => void
}

export const LoginForm: React.FC<LoginFormProps> = ({
    formData,
    showPassword,
    loading,
    error,
    fieldErrors = {},
    rememberMe,
    isFormValid = true,
    onInputChange,
    onBlur,
    onTogglePassword,
    onRememberMeChange,
    onSubmit,
    onSwitchToRegister,
}) => {
    return (
        <>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Вход</h2>
            <p className="text-gray-600 text-sm mb-6">Войдите в свой аккаунт для доступа к калькулятору</p>

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <IconInput
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={onInputChange}
                        onBlur={onBlur}
                        placeholder="admin@restaurant.ru"
                        icon={<Mail />}
                        required
                        error={fieldErrors.email}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Пароль</label>
                    <IconInput
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={onInputChange}
                        onBlur={onBlur}
                        placeholder="••••••••"
                        icon={<Lock />}
                        rightIcon={showPassword ? <EyeOff /> : <Eye />}
                        onRightIconClick={onTogglePassword}
                        required
                        error={fieldErrors.password}
                    />
                </div>

                <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => onRememberMeChange(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 cursor-pointer text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-gray-700">Запомнить меня</span>
                    </label>
                    <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                        Забыли пароль?
                    </a>
                </div>

                <Button
                    onClick={onSubmit}
                    disabled={loading || !isFormValid}
                    className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Вход...' : 'Войти'}
                </Button>
            </div>

            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-600">или</span>
                </div>
            </div>

            <p className="text-center text-gray-700">
                Нет аккаунта?{' '}
                <button
                    onClick={onSwitchToRegister}
                    className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                    Создать аккаунт
                </button>
            </p>
        </>
    )
}
