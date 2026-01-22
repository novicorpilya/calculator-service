import React from 'react';
import { Settings } from 'lucide-react';
import type { CalculationViewModel } from '@/features/dashboard/presentation/CalculationViewModel';
import type { CalculationEntity } from '@/core/domain/CalculationEntity';

interface AuditPricingPanelProps {
    vm: CalculationViewModel;
    entity: CalculationEntity;
    onUpdateAdjustments: (adjustments: Record<string, unknown>) => void;
}

export const AuditPricingPanel: React.FC<AuditPricingPanelProps> = ({
    entity,
    onUpdateAdjustments,
}) => {
    return (
        <div className="glass-card !bg-card p-10 border-primary/20 space-y-8 shadow-2xl animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                    <Settings size={24} />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight">
                    Панель управления ценообразованием
                </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 pl-1">
                        Глобальная наценка (коэф.)
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        defaultValue={(entity.managerAdjustments?.global_margin as number) || 1.0}
                        onBlur={(e) =>
                            onUpdateAdjustments({
                                ...entity.managerAdjustments,
                                global_margin: parseFloat(e.target.value) || 1.0,
                            })
                        }
                        onKeyDown={(e) =>
                            e.key === 'Enter' && (e.target as HTMLInputElement).blur()
                        }
                        className="w-full bg-background border border-border-theme p-4 rounded-2xl font-black focus:border-primary outline-none transition-all"
                    />
                    <p className="text-[9px] text-foreground/50 italic">
                        Пример: 1.1 = +10% к сумме товаров
                    </p>
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 pl-1">
                        Доставка (₽)
                    </label>
                    <input
                        type="number"
                        defaultValue={(entity.managerAdjustments?.delivery_cost as number) || 0}
                        onBlur={(e) =>
                            onUpdateAdjustments({
                                ...entity.managerAdjustments,
                                delivery_cost: parseFloat(e.target.value) || 0,
                            })
                        }
                        onKeyDown={(e) =>
                            e.key === 'Enter' && (e.target as HTMLInputElement).blur()
                        }
                        className="w-full bg-background border border-border-theme p-4 rounded-2xl font-black focus:border-primary outline-none transition-all"
                    />
                    <p className="text-[9px] text-foreground/50 italic">
                        Фиксированная стоимость логистики
                    </p>
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 pl-1">
                        Доп. услуги / Сборка (₽)
                    </label>
                    <input
                        type="number"
                        defaultValue={(entity.managerAdjustments?.service_cost as number) || 0}
                        onBlur={(e) =>
                            onUpdateAdjustments({
                                ...entity.managerAdjustments,
                                service_cost: parseFloat(e.target.value) || 0,
                            })
                        }
                        onKeyDown={(e) =>
                            e.key === 'Enter' && (e.target as HTMLInputElement).blur()
                        }
                        className="w-full bg-background border border-border-theme p-4 rounded-2xl font-black focus:border-primary outline-none transition-all"
                    />
                    <p className="text-[9px] text-foreground/50 italic">
                        Монтаж, занос или другие услуги
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 pl-1">
                    Специальные требования и примечания
                </label>
                <textarea
                    defaultValue={(entity.managerAdjustments?.notes as string) || ''}
                    onBlur={(e) =>
                        onUpdateAdjustments({
                            ...entity.managerAdjustments,
                            notes: e.target.value,
                        })
                    }
                    className="w-full bg-background border border-border-theme p-6 rounded-[2rem] text-sm focus:border-primary outline-none transition-all min-h-[120px] resize-none"
                    placeholder="Особенности объекта, температурные режимы, требования HACCP..."
                />
            </div>
        </div>
    );
};
