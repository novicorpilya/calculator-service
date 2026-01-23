import React from 'react';
import { Wallet, ArrowRight } from 'lucide-react';
import { type BudgetObjectData } from '../hooks/useBudgetPlanner';
import { useVenues } from '@/hooks/useVenues';
import { toast } from 'sonner';
import { VenueSelector } from '@/features/calculator/components/VenueSelector';
import { ObjectBasicSpecs } from '@/features/calculator/components/ObjectBasicSpecs';

interface Step1Props {
    budget: number;
    setBudget: (val: number) => void;
    objectData: BudgetObjectData;
    setObjectData: (data: BudgetObjectData) => void;
    onNext: () => void;
    isEmbedMode?: boolean;
}

export const Step1_Envelope: React.FC<Step1Props> = ({
    budget,
    setBudget,
    objectData,
    setObjectData,
    onNext,
    isEmbedMode = false,
}) => {
    // If we're in embed mode, we don't fetch or show any existing venues for privacy reasons
    const { data: venues = [] } = useVenues({ enabled: !isEmbedMode });

    const handleVenueSelect = (venueId: string) => {
        const venue = venues.find((v) => v.id === venueId);
        if (venue) {
            setObjectData({
                ...objectData,
                type: venue.type,
                totalArea: venue.total_area.toString(),
                staffCount: venue.staff_count.toString(),
                dailyVisitors: venue.visitors_per_day.toString(),
                sanitaryLevel: venue.sanitary_level || 'medium',
                intensityLevel: venue.intensity_level || 'medium',
                selectedVenueId: venue.id, // Save the ID for UI sync
            });
            toast.success(`Данные подтянуты из объекта "${venue.name}"`);
        } else if (venueId === '') {
            // Handle reset if needed, though strictly not required by request
            setObjectData({ ...objectData, selectedVenueId: '' });
        }
    };
    return (
        <div className="space-y-8 sm:space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="text-center space-y-4 px-2">
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-primary/10 text-primary rounded-[28px] sm:rounded-[40px] flex items-center justify-center mx-auto mb-6 sm:mb-8 border border-primary/20 shadow-2xl shadow-primary/10">
                    <Wallet className="w-8 h-8 sm:w-10 sm:h-10" />
                </div>
                <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-none">
                    Просчитаем <span className="text-primary">ваш успех?</span>
                </h2>
                <p className="text-foreground/40 text-[9px] sm:text-[11px] font-black uppercase tracking-[0.3em] max-w-xs mx-auto">
                    Персонализированная смета за 2 минуты
                </p>
            </div>

            <div
                className={`glass-card p-6 sm:p-12 space-y-8 sm:space-y-12 max-w-2xl mx-auto rounded-[40px] shadow-2xl transition-all ${
                    isEmbedMode
                        ? '!bg-white !border-slate-100 shadow-xl/10'
                        : 'bg-white shadow-xl dark:bg-white/[0.03] dark:backdrop-blur-2xl dark:border-white/10 dark:shadow-2xl'
                }`}
            >
                <div className="space-y-6">
                    <label
                        className={`block text-[10px] font-black uppercase tracking-[0.2em] ml-2 ${isEmbedMode ? 'text-slate-400' : 'text-foreground/40'}`}
                    >
                        Планируемый годовой бюджет
                    </label>
                    <div className="relative group">
                        <input
                            type="number"
                            min="0"
                            value={budget || ''}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (e.target.value === '' || (!isNaN(val) && val >= 0)) {
                                    setBudget(val);
                                }
                            }}
                            placeholder="Напр. 1 000 000"
                            className={`w-full rounded-3xl pl-8 pr-24 py-5 sm:py-7 text-xl sm:text-3xl font-black outline-none transition-all duration-500 shadow-inner ${
                                isEmbedMode
                                    ? 'bg-slate-50 border-2 border-slate-100 text-slate-900 focus:border-primary placeholder:text-slate-300'
                                    : 'bg-slate-50 border-2 border-slate-100 text-slate-900 focus:border-primary placeholder:text-slate-300 dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-foreground/5'
                            }`}
                        />
                        <div className="absolute right-8 top-1/2 -translate-y-1/2 text-primary font-black italic text-sm sm:text-lg tracking-tighter">
                            RUB
                        </div>
                    </div>
                </div>

                {!isEmbedMode && (
                    <div className="space-y-4">

                        <VenueSelector
                            venues={venues}
                            selectedVenueId={objectData.selectedVenueId}
                            onSelect={handleVenueSelect}
                        />
                    </div>
                )}

                <div className="space-y-4">

                    <ObjectBasicSpecs
                        data={{
                            type: objectData.type,
                            totalArea: objectData.totalArea,
                            staffCount: objectData.staffCount,
                            dailyVisitors: objectData.dailyVisitors,
                        }}
                        onChange={(updates) => setObjectData({ ...objectData, ...updates })}
                    />
                </div>

                <div className="pt-4">
                    <button
                        onClick={onNext}
                        disabled={!budget || !objectData.type || !objectData.totalArea}
                        className="btn-premium w-full py-6 sm:py-8 flex items-center justify-center gap-4 disabled:opacity-20 disabled:grayscale transition-all duration-500 text-lg sm:text-xl group"
                    >
                        К планированию зон{' '}
                        <ArrowRight
                            className="group-hover:translate-x-2 transition-transform"
                            size={24}
                        />
                    </button>
                </div>
            </div>
        </div>
    );
};
