import React from 'react';
import { Layers, Plus, Trash2 } from 'lucide-react';

import type { CalculatorConfig } from '@/features/calculator/calculator-config.types';

interface ZonesTabProps {
    config: CalculatorConfig;
    updateConfig: (config: CalculatorConfig) => void;
}

export const ZonesTab: React.FC<ZonesTabProps> = ({ config, updateConfig }) => {
const updateZone = (index: number, field: string, value: string | number) => {
        const newZones = [...config.zoneTypes];
        newZones[index] = { ...newZones[index], [field]: value } as typeof config.zoneTypes[0];
        updateConfig({ ...config, zoneTypes: newZones });
    };

    const removeZone = (index: number) => {
        const newZones = config.zoneTypes.filter((_, i: number) => i !== index);
        updateConfig({ ...config, zoneTypes: newZones });
    };

    const addZone = () => {
        updateConfig({
            ...config,
            zoneTypes: [...config.zoneTypes, { value: 'new_zone', label: 'Новая зона', color: 'gray', coeff: 1.0 }]
        });
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <Layers className="text-primary" size={20} />
                    Список доступных зон
                </h3>
                <button onClick={addZone} className="btn-icon bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg p-2 transition-colors">
                    <Plus size={20} />
                </button>
            </div>
            
            <div className="grid gap-4">
                {config.zoneTypes.map((zone, idx: number) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-muted/30 dark:bg-black/20 p-4 rounded-xl border border-border/40 dark:border-white/5 group hover:border-primary/30 transition-all hover:bg-muted/50 dark:hover:bg-white/5">
                        <div className="md:col-span-4">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Название</label>
                            <input 
                                value={zone.label} 
                                onChange={(e) => updateZone(idx, 'label', e.target.value)}
                                className="input-configurator"
                            />
                        </div>
                        <div className="md:col-span-3">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">ID (System)</label>
                            <input 
                                value={zone.value} 
                                onChange={(e) => updateZone(idx, 'value', e.target.value)}
                                className="input-configurator font-mono text-xs text-muted-foreground"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Коэфф.</label>
                            <input 
                                type="number"
                                step="0.1"
                                value={zone.coeff} 
                                onChange={(e) => updateZone(idx, 'coeff', parseFloat(e.target.value))}
                                className="input-configurator"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Цвет</label>
                            <select 
                                value={zone.color}
                                onChange={(e) => updateZone(idx, 'color', e.target.value)}
                                className="input-configurator text-sm cursor-pointer appearance-none"
                            >
                                <option value="blue">Blue</option>
                                <option value="green">Green</option>
                                <option value="red">Red</option>
                                <option value="yellow">Yellow</option>
                                <option value="purple">Purple</option>
                            </select>
                        </div>
                        <div className="md:col-span-1 flex justify-end">
                            <button onClick={() => removeZone(idx)} className="text-red-500/50 hover:text-red-500 transition-colors">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
