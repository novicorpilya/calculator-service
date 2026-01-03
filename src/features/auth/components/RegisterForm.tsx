import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, MapPin, Phone, Mail, Lock, Eye, EyeOff, ArrowRight, User as UserIcon } from 'lucide-react'
import { IconInput } from '@/components/ui/IconInput'
import { registerSchema } from '@/features/auth/auth.validation'
import type { RegisterFormValues } from '@/features/auth/auth.form.types'

interface RegisterFormProps {
    onSubmit: (values: RegisterFormValues) => void
    onSwitchToLogin: () => void
    loading: boolean
    serverError?: string | null
    initialData?: Partial<RegisterFormValues>
    role?: 'client' | 'manager' | 'admin'
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
    onSubmit,
    onSwitchToLogin,
    loading,
    serverError,
    initialData,
    role = 'client'
}) => {
    const [showPassword, setShowPassword] = React.useState(false)

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors, isValid }
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        mode: 'onBlur',
        defaultValues: {
            agreeToTerms: true,
            ...initialData
        }
    })

    // Middle+ UX: Сбрасываем форму, когда прилетают данные инвайта
    React.useEffect(() => {
        if (initialData) {
            reset({
                ...initialData,
                agreeToTerms: true
            })
        }
    }, [initialData, reset])

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '')
        setValue('phone', value, { shouldValidate: true })
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {serverError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl animate-in fade-in slide-in-from-top-2">
                    <p className="text-red-600 dark:text-red-400 text-xs font-bold leading-relaxed tracking-wide">{serverError}</p>
                </div>
            )}

            <div className="space-y-4">
                {role === 'client' ? (
                    <>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] ml-1">Организация</label>
                            <IconInput
                                {...register('organizationName')}
                                placeholder="ООО Ромашка"
                                icon={<Building2 />}
                                error={errors.organizationName?.message}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] ml-1">Адрес</label>
                            <IconInput
                                {...register('address')}
                                placeholder="г. Москва, ул. Примерная, д. 1"
                                icon={<MapPin />}
                                error={errors.address?.message}
                            />
                        </div>
                    </>
                ) : (
                    <>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] ml-1">Имя</label>
                            <IconInput
                                {...register('firstName')}
                                placeholder="Иван"
                                icon={<UserIcon />}
                                error={errors.firstName?.message}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] ml-1">Фамилия</label>
                            <IconInput
                                {...register('lastName')}
                                placeholder="Иванов"
                                icon={<UserIcon />}
                                error={errors.lastName?.message}
                            />
                        </div>
                    </>
                )}

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] ml-1">Телефон</label>
                    <IconInput
                        {...register('phone')}
                        placeholder="79991234567"
                        icon={<Phone />}
                        error={errors.phone?.message}
                        onChange={handlePhoneChange}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] ml-1">Email</label>
                    <IconInput
                        {...register('email')}
                        type="email"
                        placeholder="info@restaurant.com"
                        icon={<Mail />}
                        error={errors.email?.message}
                        disabled={!!initialData?.email}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] ml-1">Пароль</label>
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
                    <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] ml-1">Повтор</label>
                    <IconInput
                        {...register('confirmPassword')}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        icon={<Lock />}
                        error={errors.confirmPassword?.message}
                    />
                </div>
            </div>

            <div className="py-2 px-1">
                <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest leading-loose">
                    Нажимая кнопку, вы соглашаетесь с{' '}
                    <a href="#" className="text-primary hover:opacity-80 transition-opacity font-black">
                        политикой конфиденциальности
                    </a>
                </p>
            </div>

            <button
                type="submit"
                disabled={loading || !isValid}
                className="btn-premium w-full py-5 text-[11px] sm:text-[12px]"
            >
                <span className="relative z-10">{loading ? 'Создание...' : 'Зарегистрироваться'}</span>
                {!loading && <ArrowRight className="w-4 h-4 relative z-10 transition-transform group-hover:translate-x-1 shrink-0" />}
            </button>

            <div className="pt-2 text-center border-t border-border-theme pt-6">
                <p className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em]">
                    Уже есть аккаунт?{' '}
                    <button
                        type="button"
                        onClick={onSwitchToLogin}
                        className="text-primary hover:opacity-80 transition-opacity ml-1 font-black"
                    >
                        Войти
                    </button>
                </p>
            </div>
        </form>
    )
}
