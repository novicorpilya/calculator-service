import React from 'react';
import { Building2 } from 'lucide-react';

import type { CalculatorConfig } from '@/features/calculator/calculator-config.types';

interface ObjectsTabProps {
    config: CalculatorConfig;
    updateConfig: (config: CalculatorConfig) => void;
}

export const ObjectsTab: React.FC<ObjectsTabProps> = ({ config, updateConfig }) => {
const updateObject = (index: number, field: string, value: string) => {
        const newObjects = [...config.objectTypes];
        newObjects[index] = { ...newObjects[index], [field]: value } as typeof config.objectTypes[0];
        updateConfig({ ...config, objectTypes: newObjects });
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <Building2 className="text-primary" size={20} />
                    Типы объектов
                </h3>
            </div>
             <div className="grid gap-4">
                {config.objectTypes.map((obj, idx: number) => (
                    <div key={idx} className="md:flex gap-6 items-center bg-muted/30 dark:bg-black/20 p-4 rounded-xl border border-border/40 dark:border-white/5 hover:border-primary/30 transition-all hover:bg-muted/50 dark:hover:bg-white/5">
                        <div className="flex-1">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Название типа</label>
                            <input 
                                value={obj.label} 
                                onChange={(e) => updateObject(idx, 'label', e.target.value)}
                                className="input-configurator"
                            />
                        </div>
                        <div className="w-32">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Tiers (Levels)</label>
                            <input 
                                value={obj.tiers.join(', ')} 
                                disabled
                                className="input-configurator bg-transparent border-none text-muted-foreground font-mono text-sm shadow-none"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
