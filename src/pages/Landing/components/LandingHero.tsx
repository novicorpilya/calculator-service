import React, { useState, useEffect } from 'react';
import {
    ArrowRight,
    Sparkles,
    CheckCircle2,
    Plus,
    TrendingUp,
    Building2,
    Calculator,
    Shield,
    BarChart3,
} from 'lucide-react';

interface LandingHeroProps {
    onStart: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onStart }) => {
    const [activeSlide, setActiveSlide] = useState(0);
    const slidesCount = 3;

    useEffect(() => {
        const timer = setInterval(() => {
            setActiveSlide((prev) => (prev + 1) % slidesCount);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <section className="relative pt-32 sm:pt-48 pb-20 sm:pb-32 overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-[1400px] pointer-events-none -z-10">
                <div className="absolute top-[-5%] right-[-5%] w-[400px] sm:w-[800px] h-[400px] sm:h-[800px] bg-primary/10 blur-[100px] sm:blur-[160px] rounded-full animate-pulse duration-[10000ms]" />
                <div className="absolute bottom-[-5%] left-[-5%] w-[300px] sm:w-[700px] h-[300px] sm:h-[700px] bg-indigo-500/10 blur-[100px] sm:blur-[160px] rounded-full animate-pulse duration-[8000ms]" />
            </div>

            <div className="fluid-container">
                <div className="flex flex-col items-center text-center max-w-5xl mx-auto space-y-10 sm:space-y-16">
                    {/* Real App Status Badge */}
                    <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-foreground/5 dark:bg-white/5 border border-border-theme backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-1000 transition-[background-color,border-color]">
                        <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                        <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-foreground/60">
                            HICS CORE ENGINE v2.5.2
                        </span>
                    </div>

                    {/* App-Style Typography */}
                    <div className="space-y-6 sm:space-y-8">
                        <h1 className="text-[clamp(2.5rem,10vw,7.5rem)] font-[1000] leading-[0.9] tracking-[-0.06em] italic animate-in fade-in duration-700 uppercase">
                            Калькулятор <br />
                            <span className="text-primary not-italic">развития HoReCa.</span>
                        </h1>
                        <p className="text-[clamp(1rem,2.5vw,1.6rem)] text-foreground/50 max-w-3xl mx-auto font-medium leading-relaxed animate-in fade-in duration-700 delay-150 px-4 sm:px-0">
                            Профессиональный расчет снабжения, инвентаря и оборудования.
                            Автоматизация на базе живой экспертизы лидеров рынка.
                        </p>
                    </div>

                    {/* Features */}
                    <div className="flex flex-wrap justify-center gap-x-8 sm:gap-x-12 gap-y-4 opacity-0 animate-fade-in delay-600 fill-mode-forwards">
                        {[
                            'Рост маржинальности +18%',
                            'Защита от перезакупа',
                            'Готовая P&L модель',
                        ].map((text, i) => (
                            <div key={i} className="flex items-center gap-2 sm:gap-3">
                                <CheckCircle2
                                    className="w-4 h-4 sm:w-5 sm:h-5 text-primary"
                                    strokeWidth={3}
                                />
                                <span className="text-[9px] sm:text-[11px] font-[900] uppercase tracking-widest text-foreground/70 text-nowrap">
                                    {text}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* App CTA Style */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 pt-4 sm:pt-6 animate-in fade-in zoom-in duration-1000 delay-800 w-full px-4 sm:px-0">
                        <button
                            onClick={onStart}
                            className="btn-premium w-full sm:w-auto !px-12 sm:!px-16 !py-5 sm:!py-6 text-[11px] sm:text-[12px] shadow-[0_32px_64px_-16px_rgba(37,99,235,0.4)] hover:scale-105"
                        >
                            Создать расчет <Plus className="w-5 h-5 ml-3" />
                        </button>
                    </div>
                </div>

                {/* SLIDER SHOWCASE SECTION */}
                <div className="mt-24 sm:mt-40 relative group px-4 sm:px-0">
                    {/* Slides Container */}
                    <div className="relative h-[450px] sm:h-[650px] w-full max-w-6xl mx-auto perspective-container">
                        {[0, 1, 2].map((slideIndex) => (
                            <div
                                key={slideIndex}
                                className={`absolute inset-0 transition-all duration-1000 ease-out transform-3d ${
                                    activeSlide === slideIndex
                                        ? 'opacity-100 translate-x-0 scale-100 rotate-x-0 z-10'
                                        : 'opacity-0 translate-x-20 scale-95 rotate-x-12 -z-10 pointer-events-none'
                                }`}
                            >
                                {/* Slide 0: Dashboard */}
                                {slideIndex === 0 && (
                                    <div className="bg-background rounded-[2rem] sm:rounded-[3.5rem] border border-border-theme shadow-4xl overflow-hidden p-2 sm:p-4 h-full">
                                        <div className="bg-card/40 backdrop-blur-3xl p-6 sm:p-12 h-full flex flex-col space-y-8 sm:space-y-12">
                                            <div className="bg-foreground rounded-[2rem] sm:rounded-[3rem] p-8 sm:p-12 text-background relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-8">
                                                <div className="space-y-4 relative z-10 text-center sm:text-left">
                                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-[8px] font-black uppercase tracking-widest mx-auto sm:mx-0">
                                                        <Shield size={12} /> Панель управления
                                                    </div>
                                                    <h3 className="text-3xl sm:text-5xl font-black italic uppercase tracking-tighter leading-none">
                                                        Ваш бизнес{' '}
                                                        <br className="hidden sm:block" /> в деталях
                                                    </h3>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 relative z-10 w-full sm:w-auto">
                                                    <div className="p-4 rounded-xl bg-background/5 border border-background/10 text-center">
                                                        <p className="text-[10px] font-black italic">
                                                            HACCP
                                                        </p>
                                                        <p className="text-xs text-primary font-black">
                                                            АКТИВЕН
                                                        </p>
                                                    </div>
                                                    <div className="p-4 rounded-xl bg-background/5 border border-background/10 text-center">
                                                        <p className="text-[10px] font-black italic">
                                                            АУДИТ
                                                        </p>
                                                        <p className="text-xs text-emerald-500 font-black">
                                                            ПРОЙДЕН
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
                                            </div>
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                                                {[
                                                    {
                                                        label: 'Проектов',
                                                        val: '142',
                                                        icon: Building2,
                                                    },
                                                    {
                                                        label: 'В работе',
                                                        val: '12',
                                                        icon: TrendingUp,
                                                    },
                                                    {
                                                        label: 'Завершено',
                                                        val: '98%',
                                                        icon: CheckCircle2,
                                                    },
                                                    {
                                                        label: 'Экономия',
                                                        val: '1.2M',
                                                        icon: Calculator,
                                                    },
                                                ].map((s, i) => (
                                                    <div
                                                        key={i}
                                                        className="glass-card !p-6 sm:!p-8 rounded-[1.5rem] sm:rounded-[2rem] flex flex-col justify-between gap-4"
                                                    >
                                                        <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center text-primary">
                                                            <s.icon size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-foreground/30 mb-1">
                                                                {s.label}
                                                            </p>
                                                            <p className="text-xl sm:text-2xl font-black tracking-tighter">
                                                                {s.val}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Slide 1: Wizard */}
                                {slideIndex === 1 && (
                                    <div className="bg-background rounded-[2rem] sm:rounded-[3.5rem] border border-primary/30 shadow-4xl overflow-hidden p-2 sm:p-4 h-full relative">
                                        <div className="absolute inset-0 bg-primary/5 -z-10" />
                                        <div className="p-8 sm:p-16 h-full flex flex-col justify-center max-w-4xl mx-auto space-y-12">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 rounded-3xl bg-primary text-white flex items-center justify-center text-2xl font-black shadow-xl shadow-primary/30">
                                                    2
                                                </div>
                                                <div>
                                                    <h4 className="text-3xl sm:text-5xl font-black italic uppercase tracking-tighter">
                                                        Настройка зон
                                                    </h4>
                                                    <p className="text-xs font-black text-primary uppercase tracking-widest mt-1">
                                                        Визард создания расчета • v2.1
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="space-y-6">
                                                {[
                                                    {
                                                        name: 'Кухонный цех (ГОРЯЧИЙ)',
                                                        progress: 75,
                                                        active: true,
                                                    },
                                                    {
                                                        name: 'Барная зона',
                                                        progress: 0,
                                                        active: false,
                                                    },
                                                    {
                                                        name: 'Склад инвентаря',
                                                        progress: 0,
                                                        active: false,
                                                    },
                                                ].map((zone, i) => (
                                                    <div
                                                        key={i}
                                                        className={`p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border flex items-center justify-between transition-all ${zone.active ? 'bg-primary/5 border-primary/40 shadow-lg' : 'bg-foreground/5 border-transparent opacity-40'}`}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div
                                                                className={`w-2 h-2 rounded-full ${zone.active ? 'bg-primary animate-pulse' : 'bg-foreground/20'}`}
                                                            />
                                                            <span className="text-xs sm:text-sm font-black uppercase tracking-wider">
                                                                {zone.name}
                                                            </span>
                                                        </div>
                                                        {zone.active && (
                                                            <div className="h-2 w-32 bg-foreground/10 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-primary"
                                                                    style={{
                                                                        width: `${zone.progress}%`,
                                                                    }}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex items-center justify-between pt-8 border-t border-border-theme">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black uppercase text-foreground/30">
                                                        Предварительный итог
                                                    </p>
                                                    <p className="text-4xl font-black italic tracking-tighter text-primary">
                                                        4 280 000 ₽
                                                    </p>
                                                </div>
                                                <button className="btn-premium !py-5 !px-10">
                                                    Продолжить{' '}
                                                    <ArrowRight className="ml-2 w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Slide 2: Analytics */}
                                {slideIndex === 2 && (
                                    <div className="bg-foreground rounded-[2rem] sm:rounded-[3.5rem] shadow-4xl overflow-hidden p-6 sm:p-16 h-full text-background flex flex-col justify-between">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-4">
                                                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-primary/20 border border-primary/20 text-primary">
                                                    <BarChart3 size={16} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                                        Глобальная аналитика
                                                    </span>
                                                </div>
                                                <h3 className="text-4xl sm:text-6xl font-black italic uppercase tracking-tighter leading-none">
                                                    Умная <br /> аналитика
                                                </h3>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black uppercase opacity-40 mb-1">
                                                    Экономия P&L
                                                </p>
                                                <p className="text-3xl sm:text-5xl font-black text-primary italic">
                                                    +24.2%
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex-1 flex items-end gap-3 sm:gap-6 py-12">
                                            {[40, 60, 45, 90, 65, 80, 55, 95, 75, 85, 45, 70].map(
                                                (h, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex-1 bg-primary/20 rounded-t-xl hover:bg-primary transition-all duration-500 cursor-pointer relative group/bar"
                                                        style={{ height: `${h}%` }}
                                                    >
                                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-background text-foreground px-2 py-1 rounded text-[8px] font-black opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap">
                                                            {h}к / мес
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </div>

                                        <div className="grid grid-cols-3 gap-6 pt-8 border-t border-background/10 font-black uppercase italic tracking-widest text-[10px]">
                                            <div className="opacity-40">Рост выручки</div>
                                            <div className="text-primary underline underline-offset-8 decoration-2">
                                                Оборот инвентаря
                                            </div>
                                            <div className="opacity-40">Оптимизация затрат</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Progress Dots */}
                    <div className="flex justify-center gap-3 mt-12">
                        {[0, 1, 2].map((i) => (
                            <button
                                key={i}
                                onClick={() => setActiveSlide(i)}
                                className={`h-1.5 transition-all duration-500 rounded-full ${
                                    activeSlide === i ? 'w-12 bg-primary' : 'w-3 bg-foreground/10'
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
                .perspective-container {
                    perspective: 3000px;
                }
                .transform-3d {
                    transform: rotateX(15deg) translateY(-20px) scale(0.95);
                    transition: all 1s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .rotate-x-0 {
                    transform: rotateX(0) translateY(0) scale(1) !important;
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 1.2s cubic-bezier(0.16, 1, 0.3, 1) both;
                }
            `}</style>
        </section>
    );
};
