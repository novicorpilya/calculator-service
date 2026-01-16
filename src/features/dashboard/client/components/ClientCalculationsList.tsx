import React, { useMemo } from 'react';
import {
    Plus,
    Search,
    ArrowUpRight,
    Briefcase,
    MessageSquare,
} from 'lucide-react';
import { useAuth } from '@/features/auth';
import { useUnreadCount } from '@/features/chat/hooks';
import { type Calculation, OBJECT_TYPES } from '../../dashboard.types';
import { CalculationEntity } from '@/core/domain/CalculationEntity';
import { CalculationViewModel } from '@/features/dashboard/presentation/CalculationViewModel';
import { ModernStatusBadge } from '../../components/ModernStatusBadge';

interface ClientCalculationsListProps {
    calculations: Calculation[];
    onSelect: (calc: Calculation) => void;
    onNewCalculation: () => void;
}




export const ClientCalculationsList = React.memo<ClientCalculationsListProps>(
    ({ calculations, onSelect, onNewCalculation }) => {


        // Auth context for unread count
        const { user } = useAuth();
        const { projectCounts } = useUnreadCount(user?.id);

        // Convert DTOs to VMs
        const viewModels = useMemo(
            () => calculations.map((c) => new CalculationViewModel(new CalculationEntity(c))),
            [calculations]
        );



        const filteredCalculations = viewModels;

        return (
            <div className="space-y-[clamp(2rem,8vh,5rem)] animate-in fade-in slide-in-from-bottom-8 duration-1000">
                {/* Header Section - Fluid Flex */}
                <div className="flex flex-wrap items-end justify-between gap-8">
                    <div className="space-y-4 max-w-2xl">
                        <h1 className="text-[clamp(2rem,6vw,4rem)]">Мои проекты</h1>
                        <p className="text-foreground/70 font-bold leading-relaxed uppercase text-[10px] sm:text-xs tracking-widest border-l-4 border-primary pl-4 sm:pl-6">
                            Интеллектуальное управление HoReCa инвентарем
                        </p>
                    </div>
                    <button onClick={onNewCalculation} className="btn-premium w-full sm:w-auto">
                        <Plus className="w-5 h-5" /> Новый проект
                    </button>
                </div>

                {/* Quick Stats Grid - Auto-fit */}




                {filteredCalculations.length === 0 ? (
                    <div className="text-center py-32 bg-card rounded-[3rem] border-4 border-dashed border-border-theme">
                        <div className="w-24 h-24 bg-background rounded-full flex items-center justify-center mx-auto mb-8">
                            <Search className="w-10 h-10 text-foreground/20" />
                        </div>
                        <h3 className="text-2xl font-black mb-2">Проекты не найдены</h3>
                        <p className="text-foreground/60 font-bold uppercase text-[10px] tracking-widest">
                            Измените поиск или создайте новый проект
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-6 sm:gap-8">
                        {filteredCalculations.map((vm, index) => {
                            const unreadCount = projectCounts[String(vm.id)] || 0;
                            return (
                                <div
                                    key={vm.id}
                                    onClick={() => onSelect(vm.rawData)}
                                    className={`
                                    relative glass-card cursor-pointer overflow-hidden transition-all duration-500
                                    hover:-translate-y-2 hover:shadow-2xl group
                                    ${unreadCount > 0 
                                        ? 'border-primary ring-2 ring-primary/20 shadow-brand-glow bg-primary/[0.02]' 
                                        : 'border-border-theme/60'
                                    }
                                    flex flex-col justify-between
                                `}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    {/* Project ID Watermark */}
                                    <div className="absolute -right-2 top-0 text-[7rem] font-black text-foreground/[0.03] select-none pointer-events-none italic leading-none transition-transform duration-1000 group-hover:scale-110 group-hover:-translate-x-4">
                                        {String(index + 1).padStart(3, '0')}
                                    </div>

                                    {/* Header Section: Manager & Badges */}
                                    <div className="flex justify-between items-center mb-8 relative z-10">
                                        {vm.manager && vm.manager !== 'Назначается' ? (
                                            <div className="flex items-center gap-3 project-manager-info">
                                                <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10 shadow-sm">
                                                    <Briefcase className="w-5 h-5 text-primary" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black text-foreground/30 uppercase tracking-[0.2em]">Куратор проекта</span>
                                                    <span className="text-[11px] font-black uppercase tracking-widest text-foreground/80 group-hover:text-primary transition-colors">
                                                        {vm.manager}
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 opacity-40">
                                                <div className="w-10 h-10 rounded-2xl bg-foreground/5 flex items-center justify-center">
                                                    <Briefcase className="w-5 h-5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black uppercase tracking-[0.2em]">Менеджер</span>
                                                    <span className="text-[11px] font-black uppercase tracking-widest">Ожидает назначения</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2">
                                            {(projectCounts[String(vm.id)] || 0) > 0 && (
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 animate-bounce-subtle">
                                                    <MessageSquare className="w-3.5 h-3.5" />
                                                    {projectCounts[String(vm.id)]}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-8 w-full">
                                        {/* Title & Category */}
                                        <div className="space-y-4">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] bg-primary/5 px-4 py-1.5 rounded-xl border border-primary/10">
                                                    {OBJECT_TYPES.find((t) => t.value === vm.type)
                                                        ?.label || 'Объект'}
                                                </span>
                                                {vm.isNew && (
                                                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-widest border border-red-500/10">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                                        NEW
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-[1.75rem] font-black tracking-tighter leading-[1.1] group-hover:text-primary transition-colors duration-300">
                                                {vm.organizationName}
                                            </h3>
                                        </div>

                                        {/* Main Data Grid */}
                                        <div className="grid gap-6 py-8 border-y border-border-theme/40 grid-cols-2 sm:grid-cols-3">
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-foreground/30 uppercase tracking-[0.2em]">
                                                    Площадь
                                                </p>
                                                <p className="text-base font-black flex items-center gap-1.5">
                                                    {vm.totalArea}
                                                    <span className="text-[11px] text-foreground/30 font-bold uppercase">м²</span>
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-foreground/30 uppercase tracking-[0.2em]">
                                                    Зоны
                                                </p>
                                                <p className="text-base font-black">{vm.zonesCount}</p>
                                            </div>
                                            <div className="col-span-2 sm:col-span-1 space-y-1">
                                                <p className="text-[9px] font-black text-foreground/30 uppercase tracking-[0.2em]">
                                                    Бюджет
                                                </p>
                                                <p className="text-base font-black text-primary">
                                                    {vm.totalCostDisplay}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Footer: Status & Date */}
                                        <div className="flex flex-wrap items-center justify-between gap-6 pt-2">
                                            {/* Status as a more structural element */}
                                            <div className="flex flex-col gap-2">
                                                <span className="text-[8px] font-black text-foreground/20 uppercase tracking-[0.3em]">Статус выполнения</span>
                                                <ModernStatusBadge status={vm.status} />
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[8px] font-black text-foreground/20 uppercase tracking-[0.3em]">Обновлено</span>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground/50">
                                                        {vm.formattedDate}
                                                    </span>
                                                </div>
                                                
                                                    <div className="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm border border-primary/5 group-hover:scale-110">
                                                        <ArrowUpRight className="w-6 h-6 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                                    </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }
);
