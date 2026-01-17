import React, { useState } from 'react';
import { 
    GitMerge, 
    CheckCircle2, 
    Boxes,
    Asterisk
} from 'lucide-react';
import { toast } from 'sonner';
import type { CalculatorConfig } from '@/features/calculator/calculator-config.types';

interface FormulaTabProps {
    config: CalculatorConfig;
    updateConfig: (config: CalculatorConfig) => void;
}

export const FormulaTab: React.FC<FormulaTabProps> = ({ config, updateConfig }) => {
    const [testResult, setTestResult] = useState<number | null>(null);
    const [testError, setTestError] = useState<string | null>(null);

    const runTestFormula = () => {
        try {
            const context = {
                q_area: 50, 
                q_staff: 10,
                q_visitors: 5,
                k_zone: 1.2,
                k_intensity: 1.1,
                k_reserve: 0.1,
                max: Math.max,
                min: Math.min,
                sum: (...args: number[]) => args.reduce((a, b) => a + b, 0),
                avg: (...args: number[]) => args.length ? args.reduce((a, b) => a + b, 0) / args.length : 0,
                ceil: Math.ceil,
                floor: Math.floor,
                round: Math.round,
                sqrt: Math.sqrt
            };
            
            const safeEval = new Function(...Object.keys(context), `return ${config.formula.customFormula};`);
            const result = safeEval(...Object.values(context));
            
            if (typeof result !== 'number' || isNaN(result)) {
                throw new Error('Результат не является числом');
            }
            setTestResult(result);
            setTestError(null);
            toast.success(`Тест прошел успешно! Результат: ${result.toFixed(2)}`);
        } catch (err: unknown) {
            const error = err as Error;
            setTestError(error.message || 'Syntax Error');
            setTestResult(null);
            toast.error('Ошибка синтаксиса формулы');
        }
    };

    const toggleFormulaFactor = (key: string) => {
        const factorKey = key as keyof typeof config.formula.factors;
        updateConfig({
            ...config,
            formula: {
                ...config.formula,
                factors: { ...config.formula.factors, [factorKey]: !config.formula.factors[factorKey] }
            }
        });
    };

    const toggleFormulaMultiplier = (key: string) => {
        const multiplierKey = key as keyof typeof config.formula.multipliers;
        updateConfig({
            ...config,
            formula: {
                ...config.formula,
                multipliers: { ...config.formula.multipliers, [multiplierKey]: !config.formula.multipliers[multiplierKey] }
            }
        });
    };

    const formulaString = React.useMemo(() => {
        const method = config.formula.baseMethod.toUpperCase();
        const factors = [];
        if (config.formula.factors.area) factors.push('Q_area');
        if (config.formula.factors.staff) factors.push('Q_staff');
        if (config.formula.factors.visitors) factors.push('Q_visitors');
        
        let eqn = `${method}(${factors.join(', ')})`;
        if (factors.length === 0) eqn = "0";
        
        if (config.formula.multipliers.zone) eqn += ` × K_zone`;
        if (config.formula.multipliers.intensity) eqn += ` × K_intensity`;
        if (config.formula.multipliers.reserve) eqn += ` × (1 + K_reserve)`;
        
        return eqn;
    }, [config.formula]);

    return (
        <div className="space-y-12 animate-in slide-in-from-right-4 duration-500">
            {/* Mode Toggle */}
            <div className="flex justify-center">
                <div className="bg-muted/50 dark:bg-black/30 p-1 rounded-full border border-border dark:border-white/10 flex relative">
                    <div 
                        className={`absolute top-1 bottom-1 w-[50%] bg-primary rounded-full transition-all duration-300 ${config.formula.isAdvanced ? 'left-[49%]' : 'left-1'}`}
                    />
                    <button 
                        onClick={() => updateConfig({ ...config, formula: { ...config.formula, isAdvanced: false } })}
                        className={`relative z-10 px-6 py-2 rounded-full text-sm font-bold transition-colors ${!config.formula.isAdvanced ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Visual Builder
                    </button>
                    <button 
                        onClick={() => updateConfig({ ...config, formula: { ...config.formula, isAdvanced: true } })}
                        className={`relative z-10 px-6 py-2 rounded-full text-sm font-bold transition-colors ${config.formula.isAdvanced ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Code Editor
                    </button>
                </div>
            </div>

            {/* Visual Equation */}
            <div className="relative">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">
                    Текущая формула расчета
                </div>
                <div className="p-8 md:p-12 rounded-[2rem] bg-gradient-to-br from-muted/50 to-muted/20 dark:from-black/40 dark:to-black/20 border border-border dark:border-white/10 flex items-center justify-center text-center shadow-lg dark:shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-grid-black/[0.05] dark:bg-grid-white/[0.02] bg-[length:24px_24px]" />
                    <div className="relative z-10 font-mono text-xl md:text-3xl lg:text-4xl font-bold tracking-tight text-foreground transition-all break-all">
                        <span className="text-muted-foreground mr-4">Q =</span>
                        {config.formula.isAdvanced ? config.formula.customFormula : formulaString}
                    </div>
                </div>
            </div>

            {!config.formula.isAdvanced ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                    {/* Method Column */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 text-primary">
                            <GitMerge size={20} />
                            <h3 className="font-bold text-lg">Метод Агрегации</h3>
                        </div>
                        <div className="space-y-3">
                            {['max', 'sum', 'avg'].map((method) => (
                                <button
                                    key={method}
                                    onClick={() => updateConfig({ ...config, formula: { ...config.formula, baseMethod: method as 'max' | 'sum' | 'avg' } })}
                                    className={`
                                        w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between group
                                        ${config.formula.baseMethod === method 
                                            ? 'bg-primary/10 border-primary text-primary shadow-lg shadow-primary/5' 
                                            : 'bg-muted/30 dark:bg-black/20 border-border/40 dark:border-white/5 hover:border-primary/20 hover:bg-muted/50 dark:hover:border-white/20 text-muted-foreground hover:text-foreground'
                                        }
                                    `}
                                >
                                    <span className="font-bold uppercase tracking-wider text-sm">{method}</span>
                                    {config.formula.baseMethod === method && <CheckCircle2 size={18} />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Factors Column */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 text-emerald-500">
                            <Boxes size={20} />
                            <h3 className="font-bold text-lg">Факторы расчета</h3>
                        </div>
                        <div className="space-y-3">
                            {[
                                { key: 'area', label: 'Площадь (Q_area)' },
                                { key: 'staff', label: 'Персонал (Q_staff)' },
                                { key: 'visitors', label: 'Посетители (Q_visitors)' },
                            ].map((item) => (
                                <div 
                                    key={item.key}
                                    onClick={() => toggleFormulaFactor(item.key)}
                                    className={`
                                        cursor-pointer w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between
                                        ${config.formula.factors[item.key as keyof typeof config.formula.factors]
                                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' 
                                            : 'bg-muted/30 dark:bg-black/20 border-border/40 dark:border-white/5 text-muted-foreground opacity-60 hover:opacity-100'
                                        }
                                    `}
                                >
                                    <span className="font-medium text-sm">{item.label}</span>
                                    <div className={`w-10 h-6 rounded-full p-1 transition-colors ${config.formula.factors[item.key as keyof typeof config.formula.factors] ? 'bg-emerald-500' : 'bg-muted dark:bg-white/10'}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${config.formula.factors[item.key as keyof typeof config.formula.factors] ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Multipliers Column */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 text-amber-500">
                            <Asterisk size={20} />
                            <h3 className="font-bold text-lg">Коэффициенты</h3>
                        </div>
                        <div className="space-y-3">
                            {[
                                { key: 'zone', label: 'Тип Зоны (K_zone)' },
                                { key: 'intensity', label: 'Нагрузка (K_intensity)' },
                                { key: 'reserve', label: 'Запас (Reserve)' },
                            ].map((item) => (
                                <div 
                                    key={item.key}
                                    onClick={() => toggleFormulaMultiplier(item.key)}
                                    className={`
                                        cursor-pointer w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between
                                        ${config.formula.multipliers[item.key as keyof typeof config.formula.multipliers]
                                            ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' 
                                            : 'bg-muted/30 dark:bg-black/20 border-border/40 dark:border-white/5 text-muted-foreground opacity-60 hover:opacity-100'
                                        }
                                    `}
                                >
                                    <span className="font-medium text-sm">{item.label}</span>
                                    <div className={`w-10 h-6 rounded-full p-1 transition-colors ${config.formula.multipliers[item.key as keyof typeof config.formula.multipliers] ? 'bg-amber-500' : 'bg-muted dark:bg-white/10'}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${config.formula.multipliers[item.key as keyof typeof config.formula.multipliers] ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                    <div className="bg-zinc-950 border border-border dark:border-white/10 rounded-2xl p-6 font-mono relative overflow-hidden text-emerald-400">
                         <div className="absolute top-4 right-4 text-xs font-bold text-muted-foreground bg-white/5 px-2 py-1 rounded">JS Expression</div>
                        <textarea
                            value={config.formula.customFormula}
                            onChange={(e) => updateConfig({ ...config, formula: { ...config.formula, customFormula: e.target.value } })}
                            className="w-full bg-transparent border-none outline-none text-emerald-400 font-medium text-lg min-h-[120px] resize-y placeholder:text-white/20"
                            placeholder="e.g. max(q_area, q_staff) * k_zone"
                        />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                        {['q_area', 'q_staff', 'q_visitors', 'k_zone', 'k_intensity', 'k_reserve', 'max()', 'min()', 'sum()', 'avg()', 'ceil()', 'round()', 'sqrt()'].map(token => (
                            <button 
                                key={token}
                                onClick={() => updateConfig({ ...config, formula: { ...config.formula, customFormula: (config.formula.customFormula || '') + ' ' + token } })}
                                className="bg-white/5 hover:bg-white/10 border border-white/5 rounded px-3 py-2 text-left truncate transition-colors text-muted-foreground hover:text-white"
                            >
                                {token}
                            </button>
                        ))}
                    </div>
                    <div className="flex justify-end">
                        <button 
                            onClick={runTestFormula}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
                        >
                            <CheckCircle2 size={14} />
                            Проверить формулу
                        </button>
                    </div>
                    {testResult !== null && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg text-emerald-500 text-sm font-mono">
                            <strong>Result:</strong> {testResult.toFixed(4)}
                        </div>
                    )}
                    {testError && (
                        <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-red-500 text-sm font-mono">
                            <strong>Error:</strong> {testError}
                        </div>
                    )}
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-4 items-start">
                        <div className="bg-amber-500/20 p-2 rounded-lg text-amber-500 shrink-0">
                            <Asterisk size={18} />
                        </div>
                        <div className="text-sm text-muted-foreground">
                            <strong className="text-amber-500 block mb-1">Advanced Mode</strong>
                            Вы используете режим прямого ввода формулы. Доступны переменные: <code>q_area</code>, <code>q_staff</code>, <code>q_visitors</code>, а также коэффициенты <code>k_zone</code>, <code>k_intensity</code>, <code>k_reserve</code>. Поддерживается Math JS.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
