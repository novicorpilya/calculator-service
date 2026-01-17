import React from 'react';
import { Gauge, Activity } from 'lucide-react';
import type { CalculatorConfig } from '@/features/calculator/calculator-config.types';


interface CoeffsTabProps {
    config: CalculatorConfig;
    updateConfig: (config: CalculatorConfig) => void;
}

export const CoeffsTab: React.FC<CoeffsTabProps> = ({ config, updateConfig }) => {
    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div>
                <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
                    <Gauge className="text-amber-500" size={20} />
                    Коэффициенты запаса (Reserve)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {Object.entries(config.reserveCoeffs).map(([key, val]) => (
                        <div key={key} className="bg-muted/30 dark:bg-black/20 p-4 rounded-xl border border-border/40 dark:border-white/5 hover:border-amber-500/30 transition-all hover:bg-muted/50 dark:hover:bg-white/5">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground mb-2 block">{key.toUpperCase()}</label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number"
                                    step="0.05"
                                    value={val}
                                    onChange={(e) => updateConfig({
                                        ...config,
                                        reserveCoeffs: { ...config.reserveCoeffs, [key]: parseFloat(e.target.value) }
                                    })}
                                    className="input-configurator text-xl font-black text-primary"
                                />
                                <span className="text-muted-foreground font-bold">%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
                    <Activity className="text-emerald-500" size={20} />
                    Уровни нагрузки (Intensity)
                </h3>
                <div className="grid gap-4">
                    {config.intensityLevels.map((level, idx: number) => (
                        <div key={idx} className="flex gap-4 items-center bg-muted/30 dark:bg-black/20 p-4 rounded-xl border border-border/40 dark:border-white/5 hover:border-emerald-500/30 transition-all hover:bg-muted/50 dark:hover:bg-white/5">
                            <div className="w-32 font-bold text-foreground">{level.label}</div>
                            <div className="flex-1">
                                <input 
                                    type="range"
                                    min="0.5"
                                    max="3.0"
                                    step="0.1"
                                    value={level.coeff}
                                    onChange={(e) => {
                                        const newLevels = [...config.intensityLevels];
                                        newLevels[idx].coeff = parseFloat(e.target.value);
                                        updateConfig({ ...config, intensityLevels: newLevels });
                                    }}
                                    className="w-full accent-primary"
                                />
                            </div>
                            <div className="w-16 font-mono font-bold text-right text-primary">
                                x{level.coeff.toFixed(1)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
