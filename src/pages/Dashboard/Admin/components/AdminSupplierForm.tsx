import React, { useState, useEffect } from 'react';
import {
    X,
    Save,
    Building2,
    Globe,
    Phone,
    Mail,
    MapPin,
    Star,
    Image,
    Cpu,
    Activity,
} from 'lucide-react';
import { toast } from 'sonner';
import { useServices } from '@/app/di/ServiceContainer';
import type { Supplier } from '@/features/dashboard/dashboard.types';
import type { SupplierInput } from '@/services/supplier.service';

interface AdminSupplierFormProps {
    initialData?: Supplier;
    onClose: () => void;
    onSuccess: () => void;
}

export const AdminSupplierForm: React.FC<AdminSupplierFormProps> = ({
    initialData,
    onClose,
    onSuccess,
}) => {
    const { supplierService } = useServices();
    const [loading, setLoading] = useState(false);

    // We treat contacts as flattened fields in UI for simplicity, then reconstruct object on submit
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        logo: '',
        rating: 5.0,
        integration_type: 'internal' as 'internal' | 'api_1c' | 'api_custom',
        status: 'active' as 'active' | 'inactive',
        // Contacts
        contact_phone: '',
        contact_email: '',
        contact_website: '',
        contact_address: '',
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                description: initialData.description || '',
                logo: initialData.logo || '',
                rating: initialData.rating || 5.0,
                integration_type: initialData.integration_type || 'internal',
                status: initialData.status,
                contact_phone: initialData.contacts?.phone || '',
                contact_email: initialData.contacts?.email || '',
                contact_website: initialData.contacts?.website || '',
                contact_address: initialData.contacts?.address || '',
            });
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload: Partial<SupplierInput> = {
                name: formData.name,
                description: formData.description || null,
                logo: formData.logo || null,
                rating: Number(formData.rating),
                integration_type: formData.integration_type,
                status: formData.status,
                contacts: {
                    phone: formData.contact_phone || undefined,
                    email: formData.contact_email || undefined,
                    website: formData.contact_website || undefined,
                    address: formData.contact_address || undefined,
                },
            };

            // Cleanup empty contacts object if all undefined
            if (Object.values(payload.contacts || {}).every((v) => v === undefined)) {
                payload.contacts = null;
            }

            let res;
            if (initialData) {
                res = await supplierService.updateSupplier(initialData.id, payload);
            } else {
                // For creation, we need the specific type.
                // Since payload is Partial<SupplierInput> and we validated it's compliant
                // (except ID/timestamps), we can cast it safely to the Omit type.
                res = await supplierService.createSupplier(
                    payload as Omit<SupplierInput, 'id' | 'created_at' | 'updated_at'>
                );
            }

            if (res.success) {
                toast.success(initialData ? 'Поставщик обновлен' : 'Поставщик создан');
                onSuccess();
            } else {
                toast.error(res.error?.message || 'Ошибка сохранения');
            }
        } catch {
            toast.error('Произошла ошибка');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-card w-full max-w-2xl rounded-[2rem] border border-border-theme shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-border-theme flex items-center justify-between bg-card">
                    <div>
                        <h2 className="text-xl font-black tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                <Building2 size={20} />
                            </div>
                            {initialData ? 'Редактировать поставщика' : 'Новый поставщик'}
                        </h2>
                        <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1 ml-1">
                            {initialData ? `ID: ${initialData.id}` : 'Добавление партнера'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form Content */}
                <form
                    onSubmit={handleSubmit}
                    className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8"
                >
                    {/* Main Info Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 text-primary/80 mb-2">
                            <Activity size={16} />
                            <h3 className="text-xs font-black uppercase tracking-[0.2em]">
                                Основная информация
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                                    Название компании <span className="text-red-500">*</span>
                                </label>
                                <div className="relative group">
                                    <Building2
                                        className="absolute left-4 top-3.5 text-muted-foreground group-focus-within:text-primary transition-colors"
                                        size={16}
                                    />
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                name: e.target.value,
                                            }))
                                        }
                                        className="w-full bg-background border border-border-theme rounded-xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-muted-foreground/50"
                                        placeholder="ООО 'Пример'"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                                    Описание
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            description: e.target.value,
                                        }))
                                    }
                                    className="w-full bg-background border border-border-theme rounded-xl py-3 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-muted-foreground/50 min-h-[80px] resize-none"
                                    placeholder="Краткое описание деятельности..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                                    Логотип (URL)
                                </label>
                                <div className="relative group">
                                    <Image
                                        className="absolute left-4 top-3.5 text-muted-foreground group-focus-within:text-primary transition-colors"
                                        size={16}
                                    />
                                    <input
                                        type="url"
                                        value={formData.logo}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                logo: e.target.value,
                                            }))
                                        }
                                        className="w-full bg-background border border-border-theme rounded-xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-muted-foreground/50"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                                    Рейтинг (0-5)
                                </label>
                                <div className="relative group">
                                    <Star
                                        className="absolute left-4 top-3.5 text-muted-foreground group-focus-within:text-amber-500 transition-colors"
                                        size={16}
                                    />
                                    <input
                                        type="number"
                                        min="0"
                                        max="5"
                                        step="0.1"
                                        value={formData.rating}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                rating: Number(e.target.value),
                                            }))
                                        }
                                        className="w-full bg-background border border-border-theme rounded-xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-muted-foreground/50"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Technical Info */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 text-indigo-400 mb-2">
                            <Cpu size={16} />
                            <h3 className="text-xs font-black uppercase tracking-[0.2em]">
                                Настройки интеграции
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                                    Тип интеграции
                                </label>
                                <div className="relative">
                                    <select
                                        value={formData.integration_type}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                integration_type: e.target.value as
                                                    | 'internal'
                                                    | 'api_1c'
                                                    | 'api_custom',
                                            }))
                                        }
                                        className="w-full bg-background border border-border-theme rounded-xl py-3 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="internal">Внутренняя</option>
                                        <option value="api_1c">API 1C</option>
                                        <option value="api_custom">Custom API</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                        ▼
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                                    Статус
                                </label>
                                <div className="relative">
                                    <select
                                        value={formData.status}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                status: e.target.value as 'active' | 'inactive',
                                            }))
                                        }
                                        className="w-full bg-background border border-border-theme rounded-xl py-3 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="active">Активен</option>
                                        <option value="inactive">Неактивен</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                        ▼
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contacts Info */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 text-emerald-400 mb-2">
                            <Phone size={16} />
                            <h3 className="text-xs font-black uppercase tracking-[0.2em]">
                                Контакты
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                                    Телефон
                                </label>
                                <div className="relative group">
                                    <Phone
                                        className="absolute left-4 top-3.5 text-muted-foreground group-focus-within:text-emerald-400 transition-colors"
                                        size={16}
                                    />
                                    <input
                                        type="tel"
                                        value={formData.contact_phone}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                contact_phone: e.target.value,
                                            }))
                                        }
                                        className="w-full bg-background border border-border-theme rounded-xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-muted-foreground/50"
                                        placeholder="+7 (999) 000-00-00"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                                    Email
                                </label>
                                <div className="relative group">
                                    <Mail
                                        className="absolute left-4 top-3.5 text-muted-foreground group-focus-within:text-emerald-400 transition-colors"
                                        size={16}
                                    />
                                    <input
                                        type="email"
                                        value={formData.contact_email}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                contact_email: e.target.value,
                                            }))
                                        }
                                        className="w-full bg-background border border-border-theme rounded-xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-muted-foreground/50"
                                        placeholder="info@company.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                                    Веб-сайт
                                </label>
                                <div className="relative group">
                                    <Globe
                                        className="absolute left-4 top-3.5 text-muted-foreground group-focus-within:text-emerald-400 transition-colors"
                                        size={16}
                                    />
                                    <input
                                        type="url"
                                        value={formData.contact_website}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                contact_website: e.target.value,
                                            }))
                                        }
                                        className="w-full bg-background border border-border-theme rounded-xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-muted-foreground/50"
                                        placeholder="https://company.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                                    Адрес
                                </label>
                                <div className="relative group">
                                    <MapPin
                                        className="absolute left-4 top-3.5 text-muted-foreground group-focus-within:text-emerald-400 transition-colors"
                                        size={16}
                                    />
                                    <input
                                        type="text"
                                        value={formData.contact_address}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                contact_address: e.target.value,
                                            }))
                                        }
                                        className="w-full bg-background border border-border-theme rounded-xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-muted-foreground/50"
                                        placeholder="Москва, ул. Ленина, 1"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </form>

                {/* Footer Buttons */}
                <div className="p-6 border-t border-border-theme/50 bg-card flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-6 py-3 rounded-xl font-bold bg-muted hover:bg-muted/80 text-foreground transition-all disabled:opacity-50"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-8 py-3 rounded-xl font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <span className="animate-pulse">Сохранение...</span>
                        ) : (
                            <>
                                <Save size={18} />
                                Сохранить
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
