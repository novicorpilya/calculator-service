import React, { useState } from 'react';
import { 
    Calculator, 
    RotateCcw, 
    Layers,
    Building2,
    Gauge,
    Sigma,
    History
} from 'lucide-react';
import { useCalculatorConfig } from '@/features/calculator/useCalculatorConfig';
import { ConfigHistoryTab } from './ConfigHistoryTab';
import { toast } from 'sonner';

// Sub-components
import { FormulaTab } from './CalculatorConfig/FormulaTab';
import { ZonesTab } from './CalculatorConfig/ZonesTab';
import { ObjectsTab } from './CalculatorConfig/ObjectsTab';
import { CoeffsTab } from './CalculatorConfig/CoeffsTab';

export const AdminCalculatorConfig: React.FC = () => {
    const { config, updateConfig, resetConfig, isLoading } = useCalculatorConfig();
    const [activeTab, setActiveTab] = useState<'formula' | 'zones' | 'objects' | 'coeffs' | 'history'>('formula');

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const handleReset = () => {
        if (confirm('Вы уверены? Все настройки калькулятора вернутся к значениям по умолчанию.')) {
            resetConfig();
            toast.success('Настройки сброшены');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
             {/* Header */}
             <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                <div>
                    <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 rounded-2xl text-cyan-500 ring-1 ring-cyan-500/20 shadow-lg shadow-cyan-500/10">
                            <Calculator size={24} />
                        </div>
                        Конфигуратор Калькулятора
                    </h2>
                    <p className="text-muted-foreground mt-2 text-sm font-medium ml-1 max-w-lg">
                        Управление логикой расчета, коэффициентами и типами помещений без участия программиста.
                    </p>
                </div>

                <button
                    onClick={handleReset}
                    className="group px-6 py-3 rounded-xl bg-muted/50 hover:bg-muted dark:bg-white/5 dark:hover:bg-white/10 text-foreground font-bold transition-all border border-border dark:border-white/5 hover:border-border/80 dark:hover:border-white/10 flex items-center gap-2"
                >
                    <RotateCcw size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                    Сбросить
                </button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-muted/50 dark:bg-black/20 p-1 rounded-xl w-fit border border-border/50 dark:border-white/5 mx-auto md:mx-0 overflow-x-auto max-w-full">
                {[
                    { id: 'formula', label: 'Формула', icon: Sigma },
                    { id: 'zones', label: 'Зоны', icon: Layers },
                    { id: 'objects', label: 'Объекты', icon: Building2 },
                    { id: 'coeffs', label: 'Коэффициенты', icon: Gauge },
                    { id: 'history', label: 'История', icon: History },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`
                            px-6 py-3 rounded-lg text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap
                            ${activeTab === tab.id 
                                ? 'bg-primary text-primary-foreground shadow-lg scale-105' 
                                : 'text-muted-foreground hover:text-foreground hover:bg-background/50 dark:hover:bg-white/5'
                            }
                        `}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Container */}
            <div className="bg-card/50 dark:bg-card/30 border border-border dark:border-border-theme rounded-[2.5rem] p-6 sm:p-10 relative overflow-hidden min-h-[500px]">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

                {activeTab === 'formula' && <FormulaTab config={config} updateConfig={updateConfig} />}
                {activeTab === 'zones' && <ZonesTab config={config} updateConfig={updateConfig} />}
                {activeTab === 'objects' && <ObjectsTab config={config} updateConfig={updateConfig} />}
                {activeTab === 'coeffs' && <CoeffsTab config={config} updateConfig={updateConfig} />}
                {activeTab === 'history' && <ConfigHistoryTab />}
            </div>
        </div>
    );
};
