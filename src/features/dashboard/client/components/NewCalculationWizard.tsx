import React, { useState, useMemo, useEffect } from 'react';
import {
    ChevronLeft, Plus, Trash2, AlertCircle, Sparkles, Layout, Ruler, CheckCircle2, Building2, ArrowRight, Pencil, Loader2, Save, ShieldCheck, X
} from 'lucide-react';
import {
    type Calculation,
    type CalculationResults,
    type Zone,
    ZONE_TYPES,
    OBJECT_TYPES,
    SANITARY_LEVELS,
    INTENSITY_LEVELS
} from '../../dashboard.types';
import { type Venue } from '@/services/venue.service';
import { type InventoryItemMaster } from '@/services/inventory.service';
import { CalculationEngine } from '@/utils/calculation-engine';
import { getTotalZonesArea, getTotalZonesStaff } from '@/core/domain/calculator.utils';
import { toast } from 'sonner';
import { CalculationBreakdown } from './CalculationBreakdown';
import { useAuth } from '@/features/auth';
import { useServices } from '@/core/di/ServiceContainer';
import { logger } from '@/app/services';

interface NewCalculationWizardProps {
    onCancel: () => void;
    onComplete: (calculation: Calculation) => void | Promise<void>;
    initialData?: Calculation;
}

/**
 * Step-by-step wizard for creating new HoReCa inventory calculations.
 * Supports venue data auto-filling and real-time inventory forecasting.
 */
export const NewCalculationWizard = React.memo<NewCalculationWizardProps>(({ onCancel, onComplete, initialData }) => {
    const { user } = useAuth();
    const { venueService, inventoryService } = useServices();
    const [isSubmitting, setIsSubmitting] = useState<'draft' | 'sent' | null>(null);

    const [step, setStep] = useState(1);
    const [objectData, setObjectData] = useState({
        name: initialData?.organizationName || user?.organizationName || '',
        type: initialData?.type || '',
        totalArea: initialData?.totalArea.toString() || '',
        staffCount: initialData?.staffCount.toString() || '',
        dailyVisitors: initialData?.dailyVisitors.toString() || '',
        sanitaryLevel: initialData?.sanitaryLevel || 'medium',
        intensityLevel: initialData?.intensityLevel || 'medium',
        replacementCycle: initialData?.replacementCycle || 'weekly'
    });
    const [zones, setZones] = useState<Zone[]>(initialData?.zoneDetails || []);
    const [showModal, setShowModal] = useState(false);
    const [currentZone, setCurrentZone] = useState({ type: '', area: '', staffCount: '', color: '' });
    const [results, setResults] = useState<CalculationResults | null>(initialData?.results || null);
    const [venues, setVenues] = useState<Venue[]>([]);
    const [selectedVenueId, setSelectedVenueId] = useState<string>('');
    const [globalInventory, setGlobalInventory] = useState<InventoryItemMaster[]>([]);

    const totalZonesArea = useMemo(() => getTotalZonesArea(zones), [zones]);
    const totalZonesStaff = useMemo(() => getTotalZonesStaff(zones), [zones]);
    const hasAreaWarning = useMemo(() => objectData.totalArea && totalZonesArea > parseFloat(objectData.totalArea), [objectData.totalArea, totalZonesArea]);

    // Lock scroll when modal is open
    useEffect(() => {
        if (showModal) {
            const originalStyle = window.getComputedStyle(document.body).overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalStyle;
            };
        }
    }, [showModal]);

    // If initialData changes (e.g. edit mode started), update local states
    React.useEffect(() => {
        if (initialData) {
            setObjectData({
                name: initialData.organizationName,
                type: initialData.type || '',
                totalArea: initialData.totalArea.toString(),
                staffCount: initialData.staffCount.toString(),
                dailyVisitors: initialData.dailyVisitors.toString(),
                sanitaryLevel: initialData.sanitaryLevel,
                intensityLevel: initialData.intensityLevel || 'medium',
                replacementCycle: initialData.replacementCycle
            });
            setZones(initialData.zoneDetails || []);
            setResults(initialData.results);
            setStep(2);
        }
    }, [initialData]);

    React.useEffect(() => {
        const fetchVenues = async () => {
            try {
                const [vData, iData] = await Promise.all([
                    venueService.getVenues(),
                    inventoryService.getGlobalItems({ pageSize: 1000 })
                ]);
                setVenues(vData);
                setGlobalInventory(iData.data);
            } catch (error) {
                logger.error('Failed to fetch wizard data', { error });
            }
        };
        fetchVenues();
    }, [venueService, inventoryService]);

    const handleVenueSelect = (venueId: string) => {
        setSelectedVenueId(venueId);
        const selectedVenue = venues.find(v => v.id === venueId);
        if (selectedVenue) {
            setObjectData({
                ...objectData,
                name: selectedVenue.name,
                type: selectedVenue.type,
                totalArea: selectedVenue.total_area.toString(),
                staffCount: selectedVenue.staff_count.toString(),
                dailyVisitors: selectedVenue.visitors_per_day.toString()
            });
            toast.success("Данные подтянуты из объекта \"" + selectedVenue.name + "\"");
        }
    };

    const handleAddZone = () => {
        if (currentZone.type && currentZone.area && currentZone.color) {
            const zoneName = ZONE_TYPES.find(t => t.value === currentZone.type)?.label || '';
            setZones([...zones, {
                ...currentZone,
                name: zoneName,
                id: Date.now().toString(),
                type: currentZone.type,
                area: currentZone.area,
                staffCount: currentZone.staffCount || '0',
                color: currentZone.color
            } as Zone]);
            setCurrentZone({ type: '', area: '', staffCount: '', color: '' });
            setShowModal(false);
        }
    };

    const handleDeleteZone = (id: number | string) => {
        setZones(zones.filter(zone => zone.id !== id));
    };

    const calculateInventory = () => {
        const calculationResults = CalculationEngine.calculateInventory(zones, objectData, globalInventory);
        // Round primary quantities for cleaner summary
        calculationResults.summary = calculationResults.summary.map(item => ({
            ...item,
            quantity: Math.ceil(item.quantity)
        }));
        setResults(calculationResults);
        setStep(3);
    };

    const saveAsDraft = async () => {
        if (isSubmitting) return;
        setIsSubmitting('draft');
        try {
            const selectedTypeLabel = OBJECT_TYPES.find(t => t.value === objectData.type)?.label || objectData.type;
            const newCalc: Calculation = {
                id: initialData?.id || Date.now(),
                organizationName: selectedTypeLabel,
                type: objectData.type,
                status: 'draft',
                zones: zones.map(z => z.name),
                zoneDetails: zones,
                totalArea: parseFloat(objectData.totalArea),
                zonesCount: zones.length,
                staffCount: zones.length > 0 ? totalZonesStaff : parseInt(objectData.staffCount || '0'),
                dailyVisitors: parseInt(objectData.dailyVisitors || '0'),
                sanitaryLevel: objectData.sanitaryLevel,
                intensityLevel: objectData.intensityLevel,
                replacementCycle: objectData.replacementCycle,
                createdDate: initialData?.createdDate || new Date().toLocaleDateString('ru-RU'),
                manager: initialData?.manager || 'Назначается',
                comments: initialData?.comments || [],
                unreadComments: initialData?.unreadComments || 0,
                results: results
            };
            await onComplete(newCalc);
        } finally {
            setIsSubmitting(null);
        }
    };

    const sendToManager = async () => {
        if (isSubmitting) return;
        setIsSubmitting('sent');
        try {
            const selectedTypeLabel = OBJECT_TYPES.find(t => t.value === objectData.type)?.label || objectData.type;
            const newCalc: Calculation = {
                id: initialData?.id || Date.now(),
                organizationName: selectedTypeLabel,
                type: objectData.type,
                status: 'sent',
                zones: zones.map(z => z.name),
                zoneDetails: zones,
                totalArea: parseFloat(objectData.totalArea),
                zonesCount: zones.length,
                staffCount: zones.length > 0 ? totalZonesStaff : parseInt(objectData.staffCount || '0'),
                dailyVisitors: parseInt(objectData.dailyVisitors || '0'),
                sanitaryLevel: objectData.sanitaryLevel,
                intensityLevel: objectData.intensityLevel,
                replacementCycle: objectData.replacementCycle,
                createdDate: initialData?.createdDate || new Date().toLocaleDateString('ru-RU'),
                manager: initialData?.manager || 'Назначается',
                comments: initialData?.comments || [],
                unreadComments: initialData?.unreadComments || 0,
                results: results
            };
            await onComplete(newCalc);
        } finally {
            setIsSubmitting(null);
        }
    };



    return (
        <div className="w-full max-w-[min(100%,1000px)] mx-auto space-y-[clamp(2rem,6vh,4rem)] animate-in fade-in duration-700">
            {/* Fluid Header */}
            <div className="flex flex-col gap-6 sm:gap-8">
                <div className="flex flex-wrap items-center justify-between gap-4 sm:gap-6">
                    <button
                        onClick={onCancel}
                        className="group flex items-center gap-2 sm:gap-3 text-foreground/40 hover:text-primary transition-all font-black text-[9px] sm:text-[10px] uppercase tracking-widest"
                    >
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl border border-border-theme flex items-center justify-center group-hover:border-primary transition-colors">
                            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <span className="hidden min-[360px]:inline">Отмена</span>
                    </button>
                    <div className="text-center grow">
                        <h1 className="text-[clamp(1.25rem,4vw,2.5rem)]">Новый расчет</h1>
                        <p className="text-[8px] sm:text-[9px] font-black text-primary uppercase tracking-[0.2em] sm:tracking-[0.4em] mt-1 sm:mt-2 line-clamp-1">Смарт-инвентаризация</p>
                    </div>
                    <div className="w-[80px] hidden md:block" />
                </div>

                {/* Steps indicator - Fluid Flex */}
                <div className="flex items-center justify-center gap-3 sm:gap-8">
                    {[
                        { step: 1, icon: <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />, label: 'Объект' },
                        { step: 2, icon: <Layout className="w-4 h-4 sm:w-5 sm:h-5" />, label: 'Зоны' },
                        { step: 3, icon: <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />, label: 'Расчет' }
                    ].map((s, i) => {
                        const isPast = step > s.step;
                        const isActive = step === s.step;

                        return (
                            <React.Fragment key={s.step}>
                                <div
                                    onClick={() => (isPast || (initialData && step !== s.step)) && setStep(s.step)}
                                    className={`flex items-center gap-2 sm:gap-4 transition-all duration-300 ${step >= s.step ? 'opacity-100' : 'opacity-20'} ${(isPast || (initialData && !isActive)) ? 'cursor-pointer hover:text-primary group/step' : ''}`}
                                >
                                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-[1.25rem] flex items-center justify-center transition-all ${isActive ? 'bg-primary text-white shadow-xl shadow-primary/30 scale-110' :
                                        isPast ? 'bg-emerald-500 text-white group-hover/step:bg-primary' : 'bg-card border border-border-theme text-foreground/40'
                                        }`}>
                                        {s.icon}
                                    </div>
                                    <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest hidden lg:block ${isActive ? 'text-foreground' : 'text-foreground/40'}`}>
                                        {s.label}
                                    </span>
                                </div>
                                {i < 2 && <div className={`h-px grow max-w-[40px] sm:max-w-none sm:w-16 transition-all duration-700 ${step > i + 1 ? 'bg-emerald-500' : 'bg-border-theme'}`} />}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {step === 1 && (
                <div className="glass-card max-w-xl mx-auto !p-6 sm:!p-10 space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
                    <div className="space-y-10">
                        <div className="space-y-6">
                            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-primary border-b border-primary/10 pb-4">Характеристики объекта</h3>

                            {venues.length > 0 && (
                                <div className="space-y-3 bg-primary/5 p-6 rounded-3xl border border-primary/10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Sparkles className="w-4 h-4 text-primary" />
                                        <label className="block text-[10px] font-black text-primary uppercase tracking-[0.2em]">Выбрать из моих объектов</label>
                                    </div>
                                    <select
                                        value={selectedVenueId}
                                        onChange={(e) => handleVenueSelect(e.target.value)}
                                        className="w-full bg-background border border-primary/20 rounded-2xl px-6 py-4 text-[13px] font-black focus:border-primary outline-none transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">-- Выберите заведение для автозаполнения --</option>
                                        {venues.map(v => (
                                            <option key={v.id} value={v.id}>{v.name} ({v.total_area} м²)</option>
                                        ))}
                                    </select>
                                    <p className="text-[9px] font-bold text-primary/40 uppercase tracking-widest ml-1">Данные площади, персонала и трафика подтянутся автоматически</p>
                                </div>
                            )}

                            <div className="space-y-3">
                                <label className="block text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] ml-1">Тип объекта</label>
                                <select
                                    value={objectData.type}
                                    onChange={(e) => setObjectData({ ...objectData, type: e.target.value })}
                                    className="input-premium appearance-none cursor-pointer"
                                >
                                    <option value="">Выбрать тип...</option>
                                    {OBJECT_TYPES.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] ml-1">Площадь (м²)</label>
                                    <input
                                        type="number"
                                        value={objectData.totalArea}
                                        onChange={(e) => setObjectData({ ...objectData, totalArea: e.target.value })}
                                        className="input-premium"
                                        placeholder="90"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] ml-1">Общее количество персонала</label>
                                    <div className="relative group/staff">
                                        <input
                                            type="number"
                                            value={zones.length > 0 ? totalZonesStaff : objectData.staffCount}
                                            onChange={(e) => setObjectData({ ...objectData, staffCount: e.target.value })}
                                            disabled={zones.length > 0}
                                            className={`input-premium ${zones.length > 0 ? 'bg-primary/5 border-primary/20 text-primary font-black' : ''}`}
                                            placeholder="55"
                                        />
                                        {zones.length > 0 && (
                                            <p className="text-[8px] font-bold text-primary/50 uppercase tracking-widest mt-2 ml-1 animate-pulse">
                                                Сумма всех сотрудников по всем зонам
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] ml-1">Среднее количество посетителей в день</label>
                                <div className="space-y-2">
                                    <input
                                        type="number"
                                        value={objectData.dailyVisitors}
                                        onChange={(e) => setObjectData({ ...objectData, dailyVisitors: e.target.value })}
                                        className="input-premium"
                                        placeholder="100"
                                    />
                                    <p className="text-[8px] font-bold text-foreground/20 uppercase tracking-widest ml-1">Средний трафик посетителей за день</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 ml-1">Уровень санитарии (HACCP)</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {SANITARY_LEVELS.map(level => (
                                        <button
                                            key={level.value}
                                            onClick={() => setObjectData({ ...objectData, sanitaryLevel: level.value })}
                                            className={`p-4 rounded-2xl border-2 transition-all text-left flex items-center justify-between group ${objectData.sanitaryLevel === level.value
                                                ? 'bg-foreground border-foreground text-background shadow-xl'
                                                : 'bg-card border-transparent hover:border-border-theme'
                                                }`}
                                        >
                                            <div className="space-y-1">
                                                <p className={`text-[10px] font-black uppercase tracking-widest ${objectData.sanitaryLevel === level.value ? 'text-primary' : 'text-foreground'}`}>
                                                    {level.label.split(' (')[0]}
                                                </p>
                                                <p className={`text-[9px] font-bold opacity-40 ${objectData.sanitaryLevel === level.value ? 'text-background' : 'text-foreground'}`}>
                                                    {level.label.split(' (')[1]?.replace(')', '')}
                                                </p>
                                            </div>
                                            {objectData.sanitaryLevel === level.value && <CheckCircle2 className="w-5 h-5 text-primary" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 ml-1">Интенсивность нагрузки (BICSc)</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {INTENSITY_LEVELS.map(level => (
                                        <button
                                            key={level.value}
                                            onClick={() => setObjectData({ ...objectData, intensityLevel: level.value })}
                                            className={`p-4 rounded-2xl border-2 transition-all text-left flex items-center justify-between group ${objectData.intensityLevel === level.value
                                                ? 'bg-foreground border-foreground text-background shadow-xl'
                                                : 'bg-card border-transparent hover:border-border-theme'
                                                }`}
                                        >
                                            <div className="space-y-1">
                                                <p className={`text-[10px] font-black uppercase tracking-widest ${objectData.intensityLevel === level.value ? 'text-primary' : 'text-foreground'}`}>
                                                    {level.label}
                                                </p>
                                                <p className={`text-[9px] font-bold opacity-40 ${objectData.intensityLevel === level.value ? 'text-background' : 'text-foreground'}`}>
                                                    Коэффициент: {level.coeff.toFixed(1)}x
                                                </p>
                                            </div>
                                            {objectData.intensityLevel === level.value && <CheckCircle2 className="w-5 h-5 text-primary" />}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[8px] font-bold text-foreground/20 uppercase tracking-widest text-center mt-auto">Влияет на лимитирующий фактор и страховой запас</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setStep(2)}
                            disabled={!objectData.type || !objectData.totalArea}
                            className="btn-premium w-full"
                        >
                            Продолжить настройку <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-12">
                            <div className="glass-card flex flex-col sm:flex-row items-center sm:items-center justify-between gap-6 sm:gap-8 border-primary/10 !p-6 sm:!p-8">
                                <div className="space-y-2 text-center sm:text-left">
                                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-4">
                                        {objectData.name}
                                        <button
                                            onClick={() => setStep(1)}
                                            className="p-2 rounded-xl bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all shadow-sm group/edit"
                                            title="Изменить название или метраж"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                    </h2>
                                    <div className="flex items-center justify-center sm:justify-start gap-4">
                                        <span className="text-[9px] sm:text-[10px] font-black text-primary bg-primary/10 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full uppercase tracking-widest border border-primary/20">
                                            {objectData.type}
                                        </span>
                                        <div className="flex items-center gap-2 text-foreground/40 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                                            <Ruler className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {objectData.totalArea} м²
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="btn-premium w-full sm:w-auto"
                                >
                                    <Plus className="w-5 h-5" /> Добавить зону
                                </button>
                            </div>
                        </div>

                        <div className="lg:col-span-8 space-y-6">
                            {zones.length === 0 ? (
                                <div className="glass-card py-32 border-dashed flex flex-col items-center justify-center gap-6">
                                    <div className="w-20 h-20 bg-card rounded-[2rem] flex items-center justify-center text-foreground/10">
                                        <Layout size={40} />
                                    </div>
                                    <p className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.3em]">Зоны еще не определены</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-6">
                                    {zones.map(zone => (
                                        <div key={zone.id} className="glass-card relative overflow-hidden group">
                                            <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: zone.color }} />
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-4">
                                                    <p className="text-[9px] font-black text-foreground/30 uppercase tracking-[0.3em]">Параметры зоны</p>
                                                    <h3 className="text-xl font-black leading-none">{zone.name}</h3>
                                                    <div className="flex items-center gap-2 bg-card border border-border-theme px-3 py-1.5 rounded-xl w-fit">
                                                        <Ruler className="w-3.5 h-3.5 text-primary" />
                                                        <span className="text-[11px] font-black uppercase tracking-widest">{zone.area} м²</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteZone(zone.id)}
                                                    className="w-10 h-10 rounded-xl bg-red-500/5 text-red-500/40 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="lg:col-span-4 lg:sticky lg:top-24 h-fit">
                            <div className="glass-card !bg-foreground !text-background space-y-10">
                                <div className="space-y-6">
                                    <p className="text-[10px] font-black text-background/40 uppercase tracking-[0.3em]">Сводная информация</p>
                                    <div className="space-y-8">
                                        <div className="flex items-end justify-between border-b border-background/10 pb-4">
                                            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Количество зон</p>
                                            <p className="text-3xl font-black">{zones.length}</p>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-end justify-between">
                                                <p className="text-[10px] font-black text-primary uppercase tracking-widest">Площадь покрытия</p>
                                                <div className="text-right">
                                                    <span className={`text-3xl font-black ${hasAreaWarning ? 'text-red-400' : 'text-background'}`}>{totalZonesArea.toFixed(1)}</span>
                                                    <span className="text-[10px] font-bold text-background/30 block mt-1">ИЗ {objectData.totalArea} м²</span>
                                                </div>
                                            </div>
                                            {hasAreaWarning && (
                                                <div className="bg-red-500/10 text-red-400 p-4 rounded-2xl flex items-center gap-3 border border-red-500/20">
                                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                                    <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed">Превышена общая площадь объекта на {(totalZonesArea - parseFloat(objectData.totalArea)).toFixed(1)} м²</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <button
                                        onClick={calculateInventory}
                                        disabled={zones.length === 0}
                                        className="btn-premium w-full !bg-background !text-foreground hover:!bg-primary hover:!text-white disabled:opacity-20"
                                    >
                                        Сформировать расчет
                                    </button>
                                    <button
                                        onClick={() => setStep(1)}
                                        className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-background/40 hover:text-background transition-colors"
                                    >
                                        Вернуться назад
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {showModal && (
                        <div 
                            className="fixed inset-0 bg-background/80 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 z-[100] animate-in fade-in duration-500 cursor-pointer"
                            onClick={() => { setShowModal(false); setCurrentZone({ type: '', area: '', staffCount: '', color: '' }); }}
                        >
                            <div 
                                className="glass-card relative max-w-md w-full max-h-[calc(100vh-2rem)] overflow-y-auto scale-100 sm:scale-110 shadow-3xl animate-in zoom-in-95 duration-500 !p-6 sm:!p-10 cursor-auto"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={() => { setShowModal(false); setCurrentZone({ type: '', area: '', staffCount: '', color: '' }); }}
                                    className="absolute top-4 left-4 p-2 rounded-xl text-foreground/20 hover:text-foreground hover:bg-foreground/5 transition-all z-10"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="text-center mb-10">
                                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
                                        <Layout size={28} />
                                    </div>
                                    <h3 className="text-2xl font-black tracking-tight">Добавить помещение</h3>
                                    <p className="text-[9px] font-black text-foreground/30 uppercase tracking-[0.3em] mt-2">Параметры рабочей зоны</p>
                                </div>

                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] ml-1">Тип зоны</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {ZONE_TYPES.map(type => (
                                                <button
                                                    key={type.value}
                                                    onClick={() => setCurrentZone({ ...currentZone, type: type.value, color: type.color })}
                                                    className={`px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${currentZone.type === type.value
                                                        ? 'bg-foreground border-foreground text-background shadow-xl'
                                                        : 'bg-card border-transparent text-foreground/40 hover:border-border-theme'
                                                        }`}
                                                >
                                                    {type.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] ml-1">Площадь (м²)</label>
                                            <input
                                                type="number"
                                                value={currentZone.area}
                                                onChange={(e) => setCurrentZone({ ...currentZone, area: e.target.value })}
                                                className="input-premium"
                                                placeholder="50"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] ml-1">Персонал в зоне</label>
                                            <input
                                                type="number"
                                                value={currentZone.staffCount}
                                                onChange={(e) => setCurrentZone({ ...currentZone, staffCount: e.target.value })}
                                                className="input-premium"
                                                placeholder="5"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-12 flex flex-col gap-3">
                                    <button
                                        onClick={handleAddZone}
                                        disabled={!currentZone.type || !currentZone.area}
                                        className="btn-premium w-full"
                                    >
                                        Зафиксировать зону
                                    </button>
                                    <button
                                        onClick={() => { setShowModal(false); setCurrentZone({ type: '', area: '', staffCount: '', color: '' }); }}
                                        className="w-full py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 hover:text-foreground transition-colors"
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {step === 3 && results && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20">
                    <div className="glass-card !p-0 overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border-white/5">
                        {/* 1. Refined Center-Aligned Header */}
                        <div className="relative p-10 border-b border-white/5 bg-gradient-to-b from-primary/10 via-background to-transparent">
                            <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto space-y-6">
                                {/* Compact Status Badge */}
                                <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                    <CheckCircle2 size={14} className="text-emerald-500" />
                                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-500">Документ готов</span>
                                </div>

                                {/* Main Title */}
                                <div className="space-y-2">
                                    <h2 className="text-[clamp(1.5rem,4vw,3.5rem)] font-black tracking-tighter leading-tight uppercase">
                                        Расчет снабжения
                                    </h2>
                                </div>

                                {/* Meta Data Row - Compact & Highlighted */}
                                <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 pt-6 pb-2 border-t border-white/5 w-full">
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-[9px] font-black text-foreground/20 uppercase tracking-widest">Объект:</span>
                                        <span className="text-[10px] font-black uppercase text-foreground/60">{objectData.name}</span>
                                    </div>
                                    <div className="w-1 h-1 rounded-full bg-foreground/10 hidden sm:block" />
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-[9px] font-black text-foreground/20 uppercase tracking-widest">Дата формирования:</span>
                                        <span className="text-[10px] font-black uppercase text-foreground/60">{new Date().toLocaleDateString('ru-RU')}</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Visual Accent */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(var(--primary-rgb),0.15)_0%,transparent_70%)] pointer-events-none" />
                        </div>

                        {/* 2. Content Body */}
                        <div className="p-8 sm:p-12 lg:p-16 space-y-24">
                            
                            {/* Section 01: Product Audit */}
                            <div className="space-y-16">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" />
                                        <h3 className="text-[12px] font-black uppercase tracking-[0.5em] text-primary">01. Технический аудит позиций</h3>
                                    </div>
                                    <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest text-center max-w-lg">
                                        Детальный расчет по каждой позиции на основе норм расхода и специфики зон
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 gap-12">
                                    {results.summary.map((item, i) => (
                                        <CalculationBreakdown 
                                            key={i} 
                                            item={item} 
                                            hidePrices={user?.role !== 'admin' && user?.role !== 'manager'} 
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Section 02: Human-Readable Executive Summary */}
                            <div className="space-y-16">
                                <div className="flex flex-col items-center gap-4 text-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" />
                                        <h3 className="text-[12px] font-black uppercase tracking-[0.5em] text-primary">02. Итоговые цифры по объекту</h3>
                                    </div>
                                    <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest max-w-lg">
                                        Краткое резюме всего расчета для планирования бюджета
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {/* 1. SKU Count */}
                                    <div className="glass-card !bg-white/[0.02] border-white/5 p-8 space-y-4 hover:border-primary/20 transition-colors">
                                        <p className="text-[9px] font-black text-foreground/30 uppercase tracking-[0.2em]">Всего позиций</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-black tracking-tighter">{results.summary.length}</span>
                                            <span className="text-[10px] font-bold text-foreground/20 uppercase tracking-widest">в списке</span>
                                        </div>
                                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary/40 w-[60%]" />
                                        </div>
                                    </div>

                                    {/* 2. Total Units In Work */}
                                    <div className="glass-card !bg-white/[0.02] border-white/5 p-8 space-y-4 hover:border-primary/20 transition-colors">
                                        <p className="text-[9px] font-black text-foreground/30 uppercase tracking-[0.2em]">Основной инвентарь</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-black tracking-tighter">
                                                {results.summary.reduce((acc, item) => acc + Math.ceil(item.quantity), 0)}
                                            </span>
                                            <span className="text-[10px] font-bold text-foreground/20 uppercase tracking-widest">единиц</span>
                                        </div>
                                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500/40 w-[80%]" />
                                        </div>
                                    </div>

                                    {/* 3. Total Monthly Supply */}
                                    <div className="glass-card !bg-white/[0.02] border-white/5 p-8 space-y-4 hover:border-primary/20 transition-colors">
                                        <p className="text-[9px] font-black text-primary/40 uppercase tracking-[0.2em]">Докупать каждый месяц</p>
                                        <div className="flex items-baseline gap-2 text-primary">
                                            <span className="text-4xl font-black tracking-tighter">
                                                {results.summary.reduce((acc, item) => acc + (item.calculation ? Math.ceil(item.calculation.monthlyOrder) : 0), 0)}
                                            </span>
                                            <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">для обновления</span>
                                        </div>
                                        <div className="h-1 w-full bg-primary/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary/60 w-[45%]" />
                                        </div>
                                    </div>

                                    {/* 4. Total Annual Volume */}
                                    <div className="glass-card !bg-white/[0.02] border-white/5 p-8 space-y-4 hover:border-primary/20 transition-colors">
                                        <p className="text-[9px] font-black text-foreground/30 uppercase tracking-[0.2em]">Расход за 12 месяцев</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-black tracking-tighter">
                                                {results.summary.reduce((acc, item) => acc + (item.calculation ? Math.ceil(item.calculation.annualConsumption) : 0), 0)}
                                            </span>
                                            <span className="text-[10px] font-bold text-foreground/20 uppercase tracking-widest">планово</span>
                                        </div>
                                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-white/20 w-full" />
                                        </div>
                                    </div>
                                </div>

                                {/* Supply Health Insight */}
                                <div className="p-10 rounded-[2.5rem] bg-gradient-to-r from-primary/5 via-transparent to-transparent border border-white/5 flex items-center gap-8 shadow-2xl">
                                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                                        <ShieldCheck size={32} className="text-primary" />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-lg font-black uppercase tracking-tight italic">Ваш объект полностью укомплектован</h4>
                                        <p className="text-xs font-medium text-foreground/50 leading-relaxed max-w-2xl">
                                            Мы рассчитали оптимальное количество инвентаря, чтобы у вас всегда был запас для работы персонала, но не было «лишних» трат. 
                                            Расчет учитывает <span className="text-foreground">площадь зон, проходимость</span> и реальные <span className="text-foreground">нормы износа</span> каждого инструмента.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Report Footer / CTA */}
                        <div className="p-12 sm:p-16 lg:p-20 bg-foreground text-background relative overflow-hidden">
                            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                                <div className="space-y-6 flex-1 text-center lg:text-left">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 rounded-full border border-primary/10">
                                        <Sparkles className="w-4 h-4 text-primary" />
                                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Следующий шаг</span>
                                    </div>
                                    <h3 className="text-[clamp(1.5rem,4vw,3rem)] font-black leading-tight tracking-tighter italic uppercase">
                                        Передать на аудит <br />
                                        <span className="text-white/40">экспертному отделу</span>
                                    </h3>
                                    <p className="text-white/30 text-base font-medium italic max-w-xl mx-auto lg:mx-0">
                                        Наш менеджер проверит спецификацию на соответствие нормам и подготовит финальное коммерческое предложение в течение 15 минут.
                                    </p>
                                </div>
                                <div className="flex flex-col sm:flex-row lg:flex-col gap-4 w-full md:w-auto min-w-[320px]">
                                    <button 
                                        onClick={saveAsDraft}
                                        disabled={!!isSubmitting}
                                        className="h-16 px-8 text-[11px] font-black uppercase tracking-widest text-white/50 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 group"
                                    >
                                        {isSubmitting === 'draft' ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                                        {isSubmitting === 'draft' ? 'Сохранение...' : 'В черновики'}
                                    </button>
                                    <button 
                                        onClick={sendToManager}
                                        disabled={!!isSubmitting}
                                        className="h-24 px-12 bg-white text-black font-black rounded-2xl hover:bg-primary/10 hover:text-white hover:border-primary transition-all flex items-center justify-center gap-4 group disabled:opacity-50 shadow-[0_30px_60px_-15px_rgba(255,255,255,0.3)]"
                                    >
                                        <span className="text-[11px] uppercase tracking-[0.2em]">{isSubmitting === 'sent' ? 'ОТПРАВЛЯЕМ...' : 'ОТПРАВИТЬ ЭКСПЕРТУ'}</span>
                                        {isSubmitting === 'sent' ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />}
                                    </button>
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 w-[70%] h-full bg-primary/20 blur-[150px] rounded-full translate-x-1/3 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>

                    <div className="flex justify-center pt-12">
                        <button 
                            onClick={() => setStep(2)}
                            className="group flex items-center gap-4 text-[11px] font-black text-foreground/20 uppercase tracking-[0.5em] hover:text-primary transition-all"
                        >
                            <ChevronLeft className="w-6 h-6 transition-transform group-hover:-translate-x-2" /> 
                            Редактировать параметры
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
});
