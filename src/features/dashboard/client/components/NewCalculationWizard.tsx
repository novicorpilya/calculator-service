import React, { useState, useMemo } from 'react';
import { ChevronLeft, Plus, Trash2, AlertCircle, Sparkles, Layout, Ruler, CheckCircle2, Building2, ArrowRight, Pencil } from 'lucide-react';
import {
    type Calculation,
    type CalculationResults,
    type Zone,
    ZONE_TYPES,
    OBJECT_TYPES,
    SANITARY_LEVELS,
    INTENSITY_LEVELS
} from '../../dashboard.types';
import { venueService, type Venue } from '@/services/venue.service';
import { inventoryService, type InventoryItemMaster } from '@/services/inventory.service';
import { CalculationEngine } from '@/utils/calculation-engine';
import { toast } from 'sonner';
import { CalculationBreakdown } from './CalculationBreakdown';
import { useAuth } from '@/features/auth';

interface NewCalculationWizardProps {
    onCancel: () => void;
    onComplete: (calculation: Calculation) => void;
    initialData?: Calculation;
}

/**
 * Step-by-step wizard for creating new HoReCa inventory calculations.
 * Supports venue data auto-filling and real-time inventory forecasting.
 */
export const NewCalculationWizard = React.memo<NewCalculationWizardProps>(({ onCancel, onComplete, initialData }) => {
    const { user } = useAuth();

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

    const totalZonesArea = useMemo(() => zones.reduce((sum, zone) => sum + parseFloat(zone.area || '0'), 0), [zones]);
    const totalZonesStaff = useMemo(() => zones.reduce((sum, zone) => sum + parseInt(zone.staffCount || '0'), 0), [zones]);
    const hasAreaWarning = useMemo(() => objectData.totalArea && totalZonesArea > parseFloat(objectData.totalArea), [objectData.totalArea, totalZonesArea]);

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
                    inventoryService.getGlobalItems()
                ]);
                setVenues(vData);
                setGlobalInventory(iData);
            } catch (error) {
                console.error('Failed to fetch data', error);
            }
        };
        fetchVenues();
    }, []);

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
            toast.success(`Данные подтянуты из объекта "${selectedVenue.name}"`);
        }
    };

    const handleAddZone = () => {
        if (currentZone.type && currentZone.area && currentZone.color) {
            const zoneName = ZONE_TYPES.find(t => t.value === currentZone.type)?.label || '';
            setZones([...zones, {
                ...currentZone,
                name: zoneName,
                id: Date.now(),
                type: currentZone.type,
                area: currentZone.area,
                staffCount: currentZone.staffCount || '0',
                color: currentZone.color
            }]);
            setCurrentZone({ type: '', area: '', staffCount: '', color: '' });
            setShowModal(false);
        }
    };

    const handleDeleteZone = (id: number | string) => {
        setZones(zones.filter(zone => zone.id !== id));
    };

    const calculateInventory = () => {
        const calculationResults = CalculationEngine.calculateInventory(zones, objectData, globalInventory);
        setResults(calculationResults);
        setStep(3);
    };

    const sendToManager = () => {
        const selectedTypeLabel = OBJECT_TYPES.find(t => t.value === objectData.type)?.label || objectData.type;
        const newCalc: Calculation = {
            id: initialData?.id || Date.now(),
            organizationName: selectedTypeLabel,
            type: objectData.type,
            status: initialData?.status === 'draft' ? 'draft' : 'sent',
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
        onComplete(newCalc);
    };

    const totalItemsCount = useMemo(() => results?.summary.reduce((sum, item) => sum + item.total, 0) || 0, [results]);

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
                        <div className="fixed inset-0 bg-background/80 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 z-[100] animate-in fade-in duration-500">
                            <div className="glass-card max-w-md w-full scale-100 sm:scale-110 shadow-3xl animate-in zoom-in-95 duration-500 !p-6 sm:!p-10">
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
                <div className="animate-in fade-in slide-in-from-right-8 duration-700 space-y-12 pb-20">
                    {/* Specification Status Header */}
                    <div className="glass-card !p-12 text-center relative overflow-hidden">
                        <div className="relative z-10 space-y-6">
                            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
                                <CheckCircle2 size={36} />
                            </div>
                            <h2 className="text-[clamp(1.5rem,5vw,4rem)] font-black tracking-tighter leading-none italic uppercase">Спецификация сформирована</h2>
                            <p className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.5em] mt-4">Методология ISO 18406 + BICSc Standards</p>
                        </div>
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                    </div>

                    {/* Financial Summary Benchmarks */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="glass-card p-10 space-y-4">
                            <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest">Текущий запас (Stock)</p>
                            <h4 className="text-4xl font-black tracking-tighter">{totalItemsCount.toLocaleString()} <span className="text-xs text-foreground/20">ЕД</span></h4>
                        </div>
                        <div className="glass-card p-10 space-y-4">
                            <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest">Месячный заказ (Plan)</p>
                            <h4 className="text-4xl font-black tracking-tighter">
                                {results.summary.reduce((sum, item) => sum + (item.calculation?.monthlyOrder || 0), 0).toFixed(1)}
                                <span className="text-xs text-foreground/20 ml-1">ЕД/МЕС</span>
                            </h4>
                        </div>
                        <div className="glass-card p-10 space-y-4 !bg-primary text-white">
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Годовой бюджет (Est.)</p>
                            <h4 className="text-4xl font-black tracking-tighter">
                                {results.summary.reduce((sum, item) => sum + (item.calculation?.annualBudget || 0), 0).toLocaleString()}
                                <span className="text-xs text-white/50 ml-1">₽</span>
                            </h4>
                        </div>
                    </div>

                    {/* Detailed Product Breakdown Cards */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-6 px-1">
                            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-primary">Технический аудит позиций</h3>
                            <div className="h-px grow bg-primary/10" />
                        </div>
                        <div className="grid grid-cols-1 gap-12">
                            {results.summary.map((item, i) => (
                                <CalculationBreakdown key={i} item={item} />
                            ))}
                        </div>
                    </div>

                    {/* Global Summary Table for Export Preparation */}
                    <div className="glass-card !bg-card !p-0 overflow-hidden shadow-3xl">
                        <div className="p-8 border-b border-border-theme bg-primary/5 flex items-center justify-between">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Сводная ведомость по объекту</h3>
                            <div className="flex items-center gap-2 px-4 py-2 bg-background border border-border-theme rounded-xl">
                                <span className="text-[9px] font-black uppercase tracking-widest text-foreground/50">Валюта: RUB (₽)</span>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-border-theme">
                                        <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-foreground/30">Наименование инвентаря</th>
                                        <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-foreground/30 text-center">Зона</th>
                                        <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-foreground/30 text-center">Запас</th>
                                        <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-foreground/30 text-center">Сумма</th>
                                        <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-foreground/30 text-center">Годовой бюджет</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.summary.map((item, i) => (
                                        <tr key={i} className="border-b border-border-theme hover:bg-primary/5 transition-colors group">
                                            <td className="px-8 py-6">
                                                <p className="text-sm font-black group-hover:text-primary transition-colors">{item.inventory}</p>
                                                <p className="text-[8px] font-bold text-foreground/30 uppercase tracking-widest">{item.sku}</p>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="inline-block w-3 h-3 rounded-full border border-white/10" style={{ backgroundColor: item.color }} />
                                            </td>
                                            <td className="px-8 py-6 text-center font-black text-sm">{item.quantity} шт</td>
                                            <td className="px-8 py-6 text-center text-sm font-black">{(item.quantity * item.price).toLocaleString()} ₽</td>
                                            <td className="px-8 py-6 text-center text-sm font-black text-primary">{(item.calculation?.annualBudget || 0).toLocaleString()} ₽</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Final Action - Send to Expert */}
                    <div className="glass-card !bg-foreground !text-background relative overflow-hidden group p-10 sm:p-14 lg:p-20 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                            <div className="text-center md:text-left space-y-6">
                                <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary text-white rounded-full">
                                    <Sparkles size={14} />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Рекомендуемое действие</span>
                                </div>
                                <h3 className="text-[clamp(1.5rem,4vw,3.5rem)] font-black leading-tight tracking-tighter max-w-xl italic">
                                    Передать спецификацию эксперту на аудит
                                </h3>
                                <p className="text-white/40 text-sm font-medium italic">Менеджер проверит наличие на складе и сформирует коммерческое предложение за 15 минут.</p>
                            </div>
                            <button
                                onClick={sendToManager}
                                className="btn-premium lg:scale-150 lg:mr-20 h-20 px-12"
                                style={{
                                    background: 'white',
                                    color: 'black',
                                    boxShadow: '0 30px 60px -15px rgba(255,255,255,0.4)'
                                }}
                            >
                                <span className="grow">ОТПРАВИТЬ ЭКСПЕРТУ</span> <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                            </button>
                        </div>
                        {/* Interactive Design Element */}
                        <div className="absolute top-0 right-0 w-[60%] h-full bg-primary/20 blur-[130px] rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-primary/30 transition-colors duration-1000" />
                    </div>

                    <div className="flex justify-center pt-10">
                        <button
                            onClick={() => setStep(2)}
                            className="group flex items-center gap-4 text-[11px] font-black text-foreground/20 uppercase tracking-[0.5em] hover:text-primary transition-all"
                        >
                            <ChevronLeft className="w-6 h-6 transition-transform group-hover:-translate-x-2" /> РЕДАКТИРОВАТЬ ПАРАМЕТРЫ ОБЪЕКТА
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
});
