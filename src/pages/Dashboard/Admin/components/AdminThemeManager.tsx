import React from 'react';
import { 
    Palette, 
    Moon, 
    Sun, 
    Monitor, 
    RotateCcw, 
    Check, 
    Smartphone,
    Layout
} from 'lucide-react';
import { useTheme } from '@/app/providers/useTheme';

const ColorInput: React.FC<{ 
    label: string, 
    value: string, 
    onChange: (val: string) => void
}> = ({ label, value, onChange }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
            {label}
        </label>
        <div className="flex items-center gap-3 bg-black/20 p-2 rounded-xl border border-white/5 group hover:border-white/10 transition-colors">
            <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/10">
                <input 
                    type="color" 
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] cursor-pointer p-0 m-0 border-0 outline-none"
                />
            </div>
            <div className="flex-1 font-mono text-xs text-muted-foreground group-hover:text-foreground transition-colors uppercase">
                {value}
            </div>
        </div>
    </div>
);

export const AdminThemeManager: React.FC = () => {
    const { theme, setTheme, updateColor, resetTheme } = useTheme();

    const handleModeChange = (mode: 'light' | 'dark' | 'system') => {
        setTheme({ ...theme, mode });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                <div>
                    <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-pink-500/20 to-rose-500/10 rounded-2xl text-pink-500 ring-1 ring-pink-500/20 shadow-lg shadow-pink-500/10">
                            <Palette size={24} />
                        </div>
                        Брендирование и Темы
                    </h2>
                    <p className="text-muted-foreground mt-2 text-sm font-medium ml-1 max-w-lg">
                        Настройте внешний вид панели управления под фирменный стиль вашей компании.
                    </p>
                </div>

                <button
                    onClick={resetTheme}
                    className="group px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-foreground font-bold transition-all border border-white/5 hover:border-white/10 flex items-center gap-2"
                >
                    <RotateCcw size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                    Сбросить настройки
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Controls */}
                <div className="space-y-8">
                    {/* Mode Selector */}
                    <section className="space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-wider text-primary flex items-center gap-2">
                             <Monitor size={16} /> Режим отображения
                        </h3>
                         <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'light', icon: Sun, label: 'Светлый' },
                                { id: 'dark', icon: Moon, label: 'Тёмный' },
                                { id: 'system', icon: Monitor, label: 'Системный' }
                            ].map((mode) => (
                                <button
                                    key={mode.id}
                                    onClick={() => handleModeChange(mode.id as 'light' | 'dark' | 'system')}
                                    className={`
                                        p-4 rounded-2xl flex flex-col items-center gap-3 border transition-all
                                        ${theme.mode === mode.id 
                                            ? 'bg-primary/10 border-primary/50 text-primary shadow-lg shadow-primary/10' 
                                            : 'bg-card border-border-theme text-muted-foreground hover:bg-card/80 hover:text-foreground'
                                        }
                                    `}
                                >
                                    <mode.icon size={24} />
                                    <span className="text-xs font-bold uppercase tracking-wider">{mode.label}</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Brand Settings */}
                    <section className="space-y-4">
                        <div className="space-y-2">
                             <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                                Название Приложения
                            </label>
                            <input 
                                type="text" 
                                value={theme.appName || ''}
                                onChange={(e) => setTheme({ ...theme, appName: e.target.value })}
                                className="w-full bg-background border border-border-theme rounded-xl px-4 py-3 font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                placeholder="HICS"
                            />
                        </div>
                    </section>

                    {/* Colors - Light */}
                    <section className="bg-card/30 border border-border-theme rounded-[2.5rem] p-8 space-y-6">
                        <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                            <Sun size={16} className="text-amber-500" /> Цвета Светлой Темы
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <ColorInput 
                                label="Основной цвет (Primary)" 
                                value={theme.colors.light.primary} 
                                onChange={(v) => updateColor('light', 'primary', v)} 
                            />
                            <ColorInput 
                                label="Фон (Background)" 
                                value={theme.colors.light.background} 
                                onChange={(v) => updateColor('light', 'background', v)} 
                            />
                            <ColorInput 
                                label="Карточки (Card)" 
                                value={theme.colors.light.card} 
                                onChange={(v) => updateColor('light', 'card', v)} 
                            />
                             <ColorInput 
                                label="Текст (Foreground)" 
                                value={theme.colors.light.foreground} 
                                onChange={(v) => updateColor('light', 'foreground', v)} 
                            />
                        </div>
                    </section>

                    {/* Colors - Dark */}
                     <section className="bg-card/30 border border-border-theme rounded-[2.5rem] p-8 space-y-6">
                        <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                            <Moon size={16} className="text-indigo-400" /> Цвета Тёмной Темы
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <ColorInput 
                                label="Основной цвет (Primary)" 
                                value={theme.colors.dark.primary} 
                                onChange={(v) => updateColor('dark', 'primary', v)} 
                            />
                            <ColorInput 
                                label="Фон (Background)" 
                                value={theme.colors.dark.background} 
                                onChange={(v) => updateColor('dark', 'background', v)} 
                            />
                            <ColorInput 
                                label="Карточки (Card)" 
                                value={theme.colors.dark.card} 
                                onChange={(v) => updateColor('dark', 'card', v)} 
                            />
                             <ColorInput 
                                label="Текст (Foreground)" 
                                value={theme.colors.dark.foreground} 
                                onChange={(v) => updateColor('dark', 'foreground', v)} 
                            />
                        </div>
                    </section>

                     {/* Border Radius */}
                     <section className="space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-wider text-primary flex items-center gap-2">
                             <Layout size={16} /> Скругление углов
                        </h3>
                        <div className="flex bg-black/20 p-1 rounded-2xl border border-white/5">
                            {['0rem', '0.5rem', '1rem', '1.5rem', '2rem'].map((radius) => (
                                <button
                                    key={radius}
                                    onClick={() => setTheme({ ...theme, borderRadius: radius })}
                                    className={`
                                        flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all
                                        ${theme.borderRadius === radius 
                                            ? 'bg-primary text-primary-foreground shadow-lg' 
                                            : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                                        }
                                    `}
                                >
                                    {radius === '0rem' ? '0' : 
                                     radius === '0.5rem' ? 'S' :
                                     radius === '1rem' ? 'M' :
                                     radius === '1.5rem' ? 'L' : 'XL'}
                                </button>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Preview */}
                <div className="space-y-6">
                     <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Smartphone size={16} /> Предпросмотр
                    </h3>
                    <div className="sticky top-8">
                        <div className="glass-card !p-8 space-y-8 relative overflow-hidden">
                            {/* Decorative */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                            <div className="relative z-10 space-y-6">
                                <div>
                                    <h4 className="text-2xl font-black tracking-tight mb-2">Пример Карточки</h4>
                                    <p className="text-muted-foreground">Здесь вы видите, как изменения влияют на интерфейс.</p>
                                </div>

                                <div className="flex gap-3">
                                    <button className="btn-premium">
                                        Кнопка
                                    </button>
                                    <button className="btn-premium-secondary">
                                        Вторичная
                                    </button>
                                </div>

                                <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-start gap-3">
                                    <Check className="text-primary mt-1" size={16} />
                                    <div>
                                        <h5 className="font-bold text-sm text-primary">Система работает</h5>
                                        <p className="text-xs text-primary/80 mt-1">Основные цвета применяются корректно.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                         <div className="mt-8 glass-card !p-6 flex items-center justify-between">
                            <span className="font-bold text-sm">Скругление элементов</span>
                            <div className="w-12 h-12 bg-card border-4 border-primary" style={{ borderRadius: theme.borderRadius || '1.5rem' }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
