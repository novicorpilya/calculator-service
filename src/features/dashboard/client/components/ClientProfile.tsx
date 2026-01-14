import React, { useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useForm } from 'react-hook-form';
import { IconInput } from '@/components/ui/IconInput';
import { Building2, Mail, Phone, MapPin, Loader2, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileFormData {
    organizationName: string;
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
        formState: { isDirty },
    } = useForm<ProfileFormData>();

    useEffect(() => {
        if (user) {
            reset({
                organizationName: user.organizationName || '',
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
            organizationName: isManager ? undefined : data.organizationName,
            firstName: isManager ? data.firstName : undefined,
            lastName: isManager ? data.lastName : undefined,
            phone: data.phone,
            address: isManager ? undefined : data.address,
        });

        if (result.success) {
            toast.success('Профиль успешно обновлен');
        } else {
            toast.error(result.error.message || 'Ошибка при обновлении профиля');
        }
    };

    const isManager = user?.role === 'manager';

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
                    {isManager
                        ? 'Персональные данные сотрудника'
                        : 'Управление корпоративными данными'}
                </p>
            </div>

            <form
                onSubmit={handleSubmit(onSubmit)}
                className="glass-card !p-5 sm:!p-8 space-y-8 sm:space-y-10 border-border-theme bg-card shadow-xl"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                    {/* Role-based fields */}
                    {!isManager ? (
                        <>
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black text-foreground/80 uppercase tracking-[0.2em] ml-1">
                                    Название компании
                                </label>
                                <IconInput
                                    icon={<Building2 className="w-4 h-4" />}
                                    placeholder="ООО 'Ваша Организация'"
                                    {...register('organizationName')}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black text-foreground/80 uppercase tracking-[0.2em] ml-1">
                                    Имя
                                </label>
                                <IconInput
                                    icon={<UserIcon className="w-4 h-4" />}
                                    placeholder="Иван"
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
                                    {...register('lastName')}
                                />
                            </div>
                        </>
                    )}

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

                    {!isManager && (
                        <div className="space-y-3">
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
                </div>
            </form>
        </div>
    );
});
