// filepath: src/components/auth/RegisterForm.tsx

import React from 'react'
import { Mail, Lock, Building2, Phone, MapPin, Eye, EyeOff } from 'lucide-react'
import { IconInput } from '@/components/ui/IconInput'
import { Button } from '@/components/ui/Button'
import type { AuthFormState } from '@/features/auth/auth.form.types'

interface RegisterFormProps {
    formData: AuthFormState['formData']
    showPassword: boolean
    loading: boolean
    error?: string | null
    fieldErrors?: AuthFormState['fieldErrors']
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => void
    onTogglePassword: () => void
    onSubmit: () => void
    onSwitchToLogin: () => void
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
    formData,
    showPassword,
    loading,
    error,
    fieldErrors = {},
    onInputChange,
    onBlur,
    onTogglePassword,
    onSubmit,
    onSwitchToLogin,
}) => {
    return (
        <>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Регистрация</h2>
            <p className="text-gray-600 text-sm mb-6">Создайте аккаунт для доступа к калькулятору</p>

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Название организации
                    </label>
                    <IconInput
                        type="text"
                        name="organizationName"
                        value={formData.organizationName}
                        onChange={onInputChange}
                        onBlur={onBlur}
                        placeholder="ООО Мр Сити"
                        icon={<Building2 />}
                        required
                        error={fieldErrors.organizationName}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Адрес</label>
                    <IconInput
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={onInputChange}
                        onBlur={onBlur}
                        placeholder="ул. Ленина, 45, кв. 12"
                        icon={<MapPin />}
                        required
                        error={fieldErrors.address}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Телефон</label>
                    <IconInput
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={onInputChange}
                        onBlur={onBlur}
                        placeholder="+7 (999) 123-45-67"
                        icon={<Phone />}
                        required
                        error={fieldErrors.phone}
                    />
                </div>

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
                        placeholder="Минимум 8 символов"
                        icon={<Lock />}
                        rightIcon={showPassword ? <EyeOff /> : <Eye />}
                        onRightIconClick={onTogglePassword}
                        required
                        error={fieldErrors.password}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Подтвердить пароль
                    </label>
                    <IconInput
                        type={showPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={onInputChange}
                        onBlur={onBlur}
                        placeholder="Повторите пароль"
                        icon={<Lock />}
                        rightIcon={showPassword ? <EyeOff /> : <Eye />}
                        onRightIconClick={onTogglePassword}
                        required
                        error={fieldErrors.confirmPassword}
                    />
                </div>

                <label className="flex items-start cursor-pointer">
                    <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 mt-1"
                        required
                    />
                    <span className="ml-2 text-gray-700 text-sm">
                        Я согласен с{' '}
                        <a href="#" className="text-blue-600 hover:text-blue-700">
                            условиями использования
                        </a>{' '}
                        и{' '}
                        <a href="#" className="text-blue-600 hover:text-blue-700">
                            политикой конфиденциальности
                        </a>
                    </span>
                </label>

                <Button
                    onClick={onSubmit}
                    disabled={loading}
                    className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-75"
                >
                    {loading ? 'Регистрация...' : 'Создать аккаунт'}
                </Button>
            </div>

            <p className="text-center text-gray-700 mt-6">
                Уже есть аккаунт?{' '}
                <button
                    onClick={onSwitchToLogin}
                    className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                    Войти
                </button>
            </p>
        </>
    )
}
