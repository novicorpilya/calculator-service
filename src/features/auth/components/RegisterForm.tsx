import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, MapPin, Phone, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { IconInput } from '@/components/ui/IconInput'
import { Button } from '@/components/ui/Button'
import { registerSchema } from '@/features/auth/auth.validation'
import type { RegisterFormValues } from '@/features/auth/auth.form.types'

interface RegisterFormProps {
    onSubmit: (values: RegisterFormValues) => void
    onSwitchToLogin: () => void
    loading: boolean
    serverError?: string | null
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
    onSubmit,
    onSwitchToLogin,
    loading,
    serverError
}) => {
    const [showPassword, setShowPassword] = React.useState(false)

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors, isValid }
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        mode: 'onBlur',
        defaultValues: {
            agreeToTerms: true
        }
    })

    /**
     * Обработчик для телефона: разрешает только цифры
     */
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '') // Удаляем всё, кроме цифр
        setValue('phone', value, { shouldValidate: true })
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl animate-in fade-in slide-in-from-top-2">
                    <p className="text-red-700 text-sm font-medium">{serverError}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Организация</label>
                    <IconInput
                        {...register('organizationName')}
                        placeholder="ООО Ромашка"
                        icon={<Building2 className="w-5 h-5" />}
                        error={errors.organizationName?.message}
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Телефон</label>
                    <IconInput
                        {...register('phone')}
                        placeholder="79991234567"
                        icon={<Phone className="w-5 h-5" />}
                        error={errors.phone?.message}
                        onChange={handlePhoneChange} // Фильтрация ввода
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 ml-1">Адрес</label>
                <IconInput
                    {...register('address')}
                    placeholder="г. Москва, ул. Примерная, д. 1"
                    icon={<MapPin className="w-5 h-5" />}
                    error={errors.address?.message}
                />
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 ml-1">Email</label>
                <IconInput
                    {...register('email')}
                    type="email"
                    placeholder="info@restaurant.com"
                    icon={<Mail className="w-5 h-5" />}
                    error={errors.email?.message}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Повтор</label>
                    <IconInput
                        {...register('confirmPassword')}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        icon={<Lock className="w-5 h-5" />}
                        error={errors.confirmPassword?.message}
                    />
                </div>
            </div>

            <div className="py-2 ml-1">
                <p className="text-xs text-gray-500">
                    При нажатии на «Зарегистрироваться», вы соглашаетесь с нашей{' '}
                    <a href="#" className="font-medium text-blue-600 hover:text-blue-700 hover:underline">
                        политикой конфиденциальности
                    </a>
                    .
                </p>
            </div>

            <Button
                type="submit"
                disabled={loading || !isValid} // Кнопка активна СРАЗУ при валидности
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-200 disabled:opacity-50"
            >
                {loading ? 'Создание...' : 'Зарегистрироваться'}
            </Button>

            <div className="pt-2 text-center">
                <p className="text-sm text-gray-500 font-medium">
                    Уже есть аккаунт?{' '}
                    <button
                        type="button"
                        onClick={onSwitchToLogin}
                        className="text-blue-600 hover:text-blue-700 font-black uppercase tracking-wider text-xs"
                    >
                        Войти
                    </button>
                </p>
            </div>
        </form>
    )
}
