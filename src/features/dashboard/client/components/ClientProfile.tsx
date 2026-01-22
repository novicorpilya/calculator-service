import React, { useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useForm } from 'react-hook-form';
import { IconInput } from '@/components/ui/IconInput';
import {
    Building2,
    Mail,
    Phone,
    MapPin,
    Loader2,
    User as UserIcon,
    Briefcase,
    Hash,
} from 'lucide-react';
import { toast } from 'sonner';
import { ProfileAvatar } from '../../components/ProfileAvatar';

interface ProfileFormData {
    organizationName: string;
    inn: string;
    jobTitle: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
}

/**
 * Profile management component for user account settings.
 * Optimized with React.memo to prevent unnecessary re-renders when navigating.
 */
export const ClientProfile = React.memo(() => {
    const { user, updateProfile, loading } = useAuth();
    const {
        register,
        handleSubmit,
        reset,
        formState: { isDirty, errors },
    } = useForm<ProfileFormData>();

    useEffect(() => {
        if (user) {
            reset({
                organizationName: user.organizationName || '',
                inn: user.inn || '',
                jobTitle: user.jobTitle || '',
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                phone: user.phone || '',
                address: user.address || '',
            });
        }
    }, [user, reset]);

    const onSubmit = async (data: ProfileFormData) => {
        const result = await updateProfile({
            organizationName: isInternalUser ? undefined : data.organizationName,
            inn: data.inn,
            jobTitle: data.jobTitle,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            address: isInternalUser ? undefined : data.address,
        });

        if (!result.success) {
            toast.error(result.error?.message || 'Ошибка при обновлении профиля');
        } else {
            toast.success('Профиль успешно обновлен');
        }
    };

    const handleAvatarUpdate = async (url: string | null) => {
        const result = await updateProfile({ avatarUrl: url });
        if (!result.success) {
            toast.error(result.error?.message || 'Ошибка при обновлении аватара');
        }
    };

    const isInternalUser = user?.role === 'manager' || user?.role === 'admin';

    // Input filters
    const restrictToDigits = (e: React.FormEvent<HTMLInputElement>) => {
        e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
    };

    const restrictNoDigits = (e: React.FormEvent<HTMLInputElement>) => {
        e.currentTarget.value = e.currentTarget.value.replace(/[0-9]/g, '');
    };

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="w-full max-w-[min(100%,800px)] animate-in fade-in slide-in-from-bottom-8 duration-700 bg-background text-foreground">
            <div className="mb-[clamp(1.5rem,6vh,4rem)]">
                <h1 className="text-[clamp(1.75rem,6vw,3.5rem)] mb-3 sm:mb-4 font-black">
                    Настройки профиля
                </h1>
                <p className="text-foreground/60 font-bold uppercase text-[9px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.3em]">
                    {isInternalUser
                        ? 'Персональные данные сотрудника'
                        : 'Управление корпоративными данными'}
                </p>
            </div>

            <form
                onSubmit={handleSubmit(onSubmit)}
                className="glass-card !p-5 sm:!p-8 space-y-8 sm:space-y-10 border-border-theme bg-card shadow-xl"
            >
                <ProfileAvatar avatarUrl={user.avatarUrl} onUpdate={handleAvatarUpdate} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                    {!isInternalUser && (
                        <div className="space-y-3 md:col-span-2">
                            <label className="block text-[10px] font-black text-foreground/80 uppercase tracking-[0.2em] ml-1">
                                Название компании
                            </label>
                            <IconInput
                                icon={<Building2 className="w-4 h-4" />}
                                placeholder="ООО 'Ваша Организация'"
                                {...register('organizationName')}
                            />
                        </div>
                    )}

                    <div className="space-y-3">
                        <label className="block text-[10px] font-black text-foreground/80 uppercase tracking-[0.2em] ml-1">
                            ИНН организации
                        </label>
                        <IconInput
                            icon={<Hash className="w-4 h-4" />}
                            placeholder="10 или 12 цифр"
                            onInput={restrictToDigits}
                            maxLength={12}
                            error={errors.inn?.message}
                            {...register('inn', {
                                pattern: {
                                    value: /^(\d{10}|\d{12})$/,
                                    message: 'ИНН должен быть 10 или 12 цифр',
                                },
                            })}
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="block text-[10px] font-black text-foreground/80 uppercase tracking-[0.2em] ml-1">
                            Должность
                        </label>
                        <IconInput
                            icon={<Briefcase className="w-4 h-4" />}
                            placeholder="Например: Закупщик"
                            onInput={restrictNoDigits}
                            error={errors.jobTitle?.message}
                            {...register('jobTitle')}
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="block text-[10px] font-black text-foreground/80 uppercase tracking-[0.2em] ml-1">
                            Имя
                        </label>
                        <IconInput
                            icon={<UserIcon className="w-4 h-4" />}
                            placeholder="Иван"
                            onInput={restrictNoDigits}
                            error={errors.firstName?.message}
                            {...register('firstName')}
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="block text-[10px] font-black text-foreground/80 uppercase tracking-[0.2em] ml-1">
                            Фамилия
                        </label>
                        <IconInput
                            icon={<UserIcon className="w-4 h-4" />}
                            placeholder="Иванов"
                            onInput={restrictNoDigits}
                            error={errors.lastName?.message}
                            {...register('lastName')}
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="block text-[10px] font-black text-foreground/80 uppercase tracking-[0.2em] ml-1">
                            Email адрес
                        </label>
                        <IconInput
                            icon={<Mail className="w-4 h-4" />}
                            type="email"
                            disabled
                            className="bg-card/30 opacity-60 cursor-not-allowed border-dashed"
                            {...register('email')}
                        />
                        <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest ml-1">
                            Основной логин аккаунта
                        </p>
                    </div>

                    <div className="space-y-3">
                        <label className="block text-[10px] font-black text-foreground/80 uppercase tracking-[0.2em] ml-1">
                            Контактный телефон
                        </label>
                        <IconInput
                            icon={<Phone className="w-4 h-4" />}
                            type="tel"
                            placeholder="+7 (___) ___-__-__"
                            {...register('phone')}
                        />
                    </div>

                    {!isInternalUser && (
                        <div className="space-y-3 md:col-span-2">
                            <label className="block text-[10px] font-black text-foreground/80 uppercase tracking-[0.2em] ml-1">
                                Юридический адрес
                            </label>
                            <IconInput
                                icon={<MapPin className="w-4 h-4" />}
                                placeholder="Город, улица, дом"
                                {...register('address')}
                            />
                        </div>
                    )}
                </div>

                <div className="pt-4 sm:pt-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                    <button
                        type="submit"
                        disabled={loading || !isDirty}
                        className="btn-premium w-full sm:w-auto min-w-[200px]"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {loading ? 'Сохранение...' : 'Обновить профиль'}
                    </button>
                    {!isDirty && !loading && (
                        <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest">
                            Нет изменений для сохранения
                        </p>
                    )}
                </div>
            </form>
        </div>
    );
});
