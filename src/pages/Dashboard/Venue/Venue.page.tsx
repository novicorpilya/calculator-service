import React, { useEffect, useState, useCallback } from 'react';
import {
    Plus,
    Building2,
    Users,
    Maximize2,
    MapPin,
    Trash2,
    Edit2,
    UtensilsCrossed,
    Coffee,
    Wine,
    Hotel,
    Save,
    X,
    type LucideIcon,
} from 'lucide-react';
import {
    OBJECT_TYPES,
    SANITARY_LEVELS,
    INTENSITY_LEVELS,
} from '@/features/dashboard/dashboard.types';

import { type Venue, type CreateVenueData } from '@/services/venue.service';
import { toast } from 'sonner';
import { useServices } from '@/app/di/ServiceContainer';
import { logger } from '@/core/logging/index.ts';

const VENUE_TYPE_CONFIG: Record<string, { label: string; icon: LucideIcon; color: string }> = {
    restaurant: { label: 'Ресторан', icon: UtensilsCrossed, color: 'text-orange-500' },
    cafe: { label: 'Кафе', icon: Coffee, color: 'text-blue-500' },
    bar: { label: 'Бар', icon: Wine, color: 'text-purple-500' },
    hotel: { label: 'Отель', icon: Hotel, color: 'text-emerald-500' },
    production_food: { label: 'Пищ. пр-во', icon: Building2, color: 'text-red-500' },
    production_nonfood: { label: 'Пр-во', icon: Building2, color: 'text-gray-500' },
    beauty: { label: 'Салон', icon: Users, color: 'text-pink-500' },
    mall: { label: 'ТЦ/Общ.', icon: Maximize2, color: 'text-indigo-500' },
    other: { label: 'Другое', icon: Building2, color: 'text-amber-500' },
};

export const VenuePage: React.FC = () => {
    const { venueService } = useServices();
    const [venues, setVenues] = useState<Venue[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
    const [formData, setFormData] = useState<CreateVenueData>({
        name: '',
        type: 'restaurant',
        total_area: 0,
        seating_capacity: 0,
        staff_count: 0,
        visitors_per_day: 0,
        address: '',
        sanitary_level: 'medium',
        intensity_level: 'medium',
    });

    const fetchVenues = useCallback(async () => {
        try {
            setLoading(true);
            const res = await venueService.getVenues();
            if (res.success && res.data) {
                setVenues(res.data);
            } else {
                toast.error(res.error?.message || 'Не удалось загрузить список заведений');
            }
        } catch (error) {
            logger.error('Fetch venues error', error);
            toast.error('Не удалось загрузить список заведений');
        } finally {
            setLoading(false);
        }
    }, [venueService]);

    useEffect(() => {
        fetchVenues();
    }, [fetchVenues]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = editingVenue
                ? await venueService.updateVenue(editingVenue.id, formData)
                : await venueService.createVenue(formData);

            if (res.success) {
                toast.success(editingVenue ? 'Заведение обновлено' : 'Заведение успешно создано');
                fetchVenues();
                setIsModalOpen(false);
                setEditingVenue(null);
                setFormData({
                    name: '',
                    type: 'restaurant',
                    total_area: 0,
                    seating_capacity: 0,
                    staff_count: 0,
                    visitors_per_day: 0,
                    address: '',
                    sanitary_level: 'medium',
                    intensity_level: 'medium',
                });
            } else {
                toast.error(res.error?.message || 'Ошибка при сохранении заведения');
            }
        } catch (error) {
            logger.error('Failed to submit venue form', { error });
            toast.error('Ошибка при сохранении заведения');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Вы уверены, что хотите удалить это заведение?')) return;

        try {
            const res = await venueService.deleteVenue(id);
            if (res.success) {
                toast.success('Заведение удалено');
                fetchVenues();
            } else {
                toast.error(res.error?.message || 'Ошибка при удалении');
            }
        } catch (error) {
            logger.error('Delete venue error', error);
            toast.error('Ошибка при удалении');
        }
    };

    const openEditModal = (venue: Venue) => {
        setEditingVenue(venue);
        setFormData({
            name: venue.name,
            type: venue.type,
            total_area: venue.total_area,
            seating_capacity: venue.seating_capacity,
            staff_count: venue.staff_count,
            visitors_per_day: venue.visitors_per_day,
            address: venue.address || '',
            sanitary_level: venue.sanitary_level || 'medium',
            intensity_level: venue.intensity_level || 'medium',
        });
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                        Мои заведения
                    </h1>
                    <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-foreground/40">
                        Управление объектами и их параметрами
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditingVenue(null);
                        setFormData({
                            name: '',
                            type: 'restaurant',
                            total_area: 0,
                            seating_capacity: 0,
                            staff_count: 0,
                            visitors_per_day: 0,
                            address: '',
                            sanitary_level: 'medium',
                            intensity_level: 'medium',
                        });
                        setIsModalOpen(true);
                    }}
                    className="btn-premium flex items-center justify-center gap-2 py-4 px-6 md:px-8 group"
                >
                    <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
                    <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest leading-none">
                        Добавить объект
                    </span>
                </button>
            </div>

            {/* List */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="h-[280px] bg-card/50 border border-border-theme rounded-[2.5rem] animate-pulse"
                        />
                    ))}
                </div>
            ) : venues.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {venues.map((venue) => {
                        const Config = VENUE_TYPE_CONFIG[venue.type] || VENUE_TYPE_CONFIG.other;
                        return (
                            <div
                                key={venue.id}
                                className="group relative bg-card border border-border-theme rounded-[2.5rem] p-8 hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5"
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div className={`p-4 rounded-2xl bg-primary/5 ${Config.color}`}>
                                        <Config.icon size={24} />
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => openEditModal(venue)}
                                            className="p-2 hover:bg-primary/10 rounded-xl text-foreground/40 hover:text-primary transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(venue.id)}
                                            className="p-2 hover:bg-red-500/10 rounded-xl text-foreground/40 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="mb-8">
                                    <h3 className="text-lg font-black uppercase tracking-tight mb-2 truncate">
                                        {venue.name}
                                    </h3>
                                    <div className="flex items-center gap-2 text-[10px] font-black text-foreground/30 uppercase tracking-[0.1em]">
                                        <MapPin size={12} className="shrink-0" />
                                        <span className="truncate">
                                            {venue.address || 'Адрес не указан'}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border-theme">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-foreground/30">
                                            Площадь
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Maximize2 size={14} className="text-primary" />
                                            <span className="text-[12px] font-black tracking-tight">
                                                {venue.total_area} м²
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-foreground/30">
                                            Посетители
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Users size={14} className="text-primary" />
                                            <span className="text-[12px] font-black tracking-tight">
                                                {venue.visitors_per_day} / день
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 px-8 text-center bg-card/50 border-2 border-dashed border-border-theme rounded-[3rem]">
                    <div className="w-20 h-20 bg-primary/5 rounded-[2rem] flex items-center justify-center mb-6">
                        <Building2 size={40} className="text-primary/40" />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight mb-2">
                        Объекты не найдены
                    </h3>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-foreground/30 max-w-xs leading-loose">
                        Добавьте свое первое заведение, чтобы расчеты стали быстрее и точнее.
                    </p>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <div
                        className="absolute inset-0 bg-background/80 backdrop-blur-md animate-in fade-in duration-300"
                        onClick={() => setIsModalOpen(false)}
                    />

                    <div className="relative w-full max-w-xl bg-card border border-border-theme rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 pb-4 flex items-center justify-between">
                            <h2 className="text-xl font-black uppercase tracking-tight">
                                {editingVenue ? 'Редактировать объект' : 'Новый объект'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-primary/5 rounded-xl transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">
                                        Название предприятия
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.target.value })
                                        }
                                        className="w-full bg-background border border-border-theme rounded-2xl px-6 py-4 text-[13px] font-black focus:border-primary outline-none transition-all"
                                        placeholder="Напр. Terrace Bar & Grill"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">
                                        Тип заведения
                                    </label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                type: e.target.value as CreateVenueData['type'],
                                            })
                                        }
                                        className="w-full bg-background border border-border-theme rounded-2xl px-6 py-4 text-[13px] font-black focus:border-primary outline-none transition-all appearance-none"
                                    >
                                        {OBJECT_TYPES.map((t) => (
                                            <option key={t.value} value={t.value}>
                                                {t.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">
                                        Площадь (м²)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.total_area}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                total_area: Number(e.target.value),
                                            })
                                        }
                                        className="w-full bg-background border border-border-theme rounded-2xl px-6 py-4 text-[13px] font-black focus:border-primary outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">
                                        Посетителей в день
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.visitors_per_day}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                visitors_per_day: Number(e.target.value),
                                            })
                                        }
                                        className="w-full bg-background border border-border-theme rounded-2xl px-6 py-4 text-[13px] font-black focus:border-primary outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">
                                        Персонал
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.staff_count}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                staff_count: Number(e.target.value),
                                            })
                                        }
                                        className="w-full bg-background border border-border-theme rounded-2xl px-6 py-4 text-[13px] font-black focus:border-primary outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">
                                        Сан. уровень
                                    </label>
                                    <select
                                        value={formData.sanitary_level}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                sanitary_level: e.target.value,
                                            })
                                        }
                                        className="w-full bg-background border border-border-theme rounded-2xl px-6 py-4 text-[13px] font-black focus:border-primary outline-none transition-all appearance-none"
                                    >
                                        {SANITARY_LEVELS.map((l) => (
                                            <option key={l.value} value={l.value}>
                                                {l.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">
                                        Нагрузка
                                    </label>
                                    <select
                                        value={formData.intensity_level}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                intensity_level: e.target.value,
                                            })
                                        }
                                        className="w-full bg-background border border-border-theme rounded-2xl px-6 py-4 text-[13px] font-black focus:border-primary outline-none transition-all appearance-none"
                                    >
                                        {INTENSITY_LEVELS.map((l) => (
                                            <option key={l.value} value={l.value}>
                                                {l.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">
                                    Физический адрес
                                </label>
                                <input
                                    type="text"
                                    value={formData.address || ''}
                                    onChange={(e) =>
                                        setFormData({ ...formData, address: e.target.value })
                                    }
                                    className="w-full bg-background border border-border-theme rounded-2xl px-6 py-4 text-[13px] font-black focus:border-primary outline-none transition-all"
                                    placeholder="г. Москва, ул. Арбат, д. 1"
                                />
                            </div>

                            <button type="submit" className="btn-premium w-full py-5 group">
                                <Save className="w-4 h-4 transition-transform group-hover:scale-110" />
                                <span className="text-[11px] font-black uppercase tracking-widest">
                                    {editingVenue ? 'Сохранить изменения' : 'Создать заведение'}
                                </span>
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
