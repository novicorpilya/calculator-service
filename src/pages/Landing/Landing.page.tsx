import React, { memo } from 'react';
import {
    ArrowRight,
    Palette,
    ShieldCheck,
    Sparkles,
    MessageSquare,
    TrendingDown,
    Zap,
    CheckCircle2,
    Building2,
    Utensils,
    Factory,
    Stethoscope,
    FileText,
    ArrowUpRight,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface LandingProps {
    onStart: () => void;
}

// Sub-components for better maintainability and performance
const NavLink = ({ id, children }: { id: string; children: React.ReactNode }) => (
    <a
        href={`#${id}`}
        className="text-[11px] font-black uppercase tracking-widest text-foreground/60 hover:text-primary transition-colors duration-300"
        onClick={(e) => {
            e.preventDefault();
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
        }}
    >
        {children}
    </a>
);

const SectionHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div className="text-center space-y-4 mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-black uppercase tracking-tighter leading-none">
            {title}
        </h2>
        <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] text-primary">
            {subtitle}
        </p>
    </div>
);

export const Landing: React.FC<LandingProps> = memo(({ onStart }) => {
    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 overflow-x-hidden font-sans flex flex-col relative transition-colors duration-500">
            {/* Background Decorations - Optimized with pointer-events-none */}
            <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
            <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />

            {/* Universal Header - Optimized with glassmorphism */}
            <header className="fixed top-0 left-0 right-0 py-6 z-[100] bg-background/60 backdrop-blur-xl border-b border-border-theme/50 transition-all duration-300">
                <div className="fluid-container flex justify-between items-center gap-4">
                    <div
                        className="flex items-center gap-3 shrink-0 group cursor-pointer"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >
                        <div className="w-10 h-10 bg-primary/10 rounded-2xl border border-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all duration-500">
                            <ShieldCheck className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                        </div>
                        <span className="text-xl font-black tracking-tighter uppercase leading-none block">
                            Hics
                        </span>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-8">
                        <nav className="hidden lg:flex items-center gap-8">
                            <NavLink id="problems">Проблемы</NavLink>
                            <NavLink id="features">Решения</NavLink>
                            <NavLink id="areas">Отрасли</NavLink>
                        </nav>
                        <div className="flex items-center gap-3 sm:gap-4">
                            <ThemeToggle />
                            <button
                                onClick={onStart}
                                className="group flex items-center gap-2 px-5 sm:px-7 py-3 rounded-2xl bg-foreground text-background text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] hover:bg-primary hover:text-white transition-all active:scale-95 shadow-xl shadow-foreground/5 whitespace-nowrap"
                            >
                                Войти{' '}
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative pt-48 pb-24 z-10 overflow-hidden">
                    <div className="fluid-container">
                        <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-12">
                            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-primary/5 text-primary text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] border border-primary/10 animate-in fade-in slide-in-from-top-4 duration-1000">
                                <Sparkles className="w-4 h-4" />
                                Система управления экспертными закупками
                            </div>

                            <h1 className="text-[clamp(3.5rem,10vw,7.5rem)] font-black leading-[0.85] tracking-tighter animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                                Хватит закупать <br />
                                <span className="text-primary italic">на глаз.</span>
                            </h1>

                            <p className="text-[clamp(1.1rem,2.5vw,1.5rem)] text-foreground/60 max-w-2xl font-bold leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-400">
                                Превратите хаотичные расходы в точную науку. Интеллектуальный расчет
                                инвентаря на основе площади, проходимости и живой экспертизы.
                            </p>

                            <div className="flex flex-wrap items-center justify-center gap-6 pt-6 animate-in fade-in zoom-in duration-1000 delay-500">
                                <button
                                    onClick={onStart}
                                    className="btn-premium !px-10 sm:!px-14 !py-5 sm:!py-7 text-sm sm:text-base shadow-2xl shadow-primary/20"
                                >
                                    Начать экспертный расчет <ArrowRight className="w-5 h-5 ml-3" />
                                </button>
                            </div>
                        </div>

                        {/* Dashboard Preview - Real functional mockup */}
                        <div className="mt-24 relative animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-700">
                            <div className="absolute inset-0 bg-primary/20 blur-[150px] -z-10" />
                            <div className="glass-card !p-2 sm:!p-4 bg-card/40 border-primary/20 shadow-3xl max-w-6xl mx-auto rotate-1 hover:rotate-0 transition-transform duration-700">
                                <div className="rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden border border-border-theme relative aspect-[16/10] sm:aspect-[16/9]">
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-indigo-500/10" />
                                    <div className="p-4 sm:p-8 h-full flex flex-col">
                                        <div className="flex items-center justify-between mb-4 sm:mb-8">
                                            <div className="flex gap-2">
                                                <div className="w-2 sm:w-3 h-2 sm:h-3 rounded-full bg-red-500/50" />
                                                <div className="w-2 sm:w-3 h-2 sm:h-3 rounded-full bg-yellow-500/50" />
                                                <div className="w-2 sm:w-3 h-2 sm:h-3 rounded-full bg-green-500/50" />
                                            </div>
                                            <div className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[8px] sm:text-[10px] font-black text-primary uppercase tracking-widest">
                                                Результат расчета v2.0
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-12 gap-3 sm:gap-6 flex-1 overflow-hidden">
                                            {/* Left: Zones Selection (Mock) */}
                                            <div className="col-span-3 space-y-3 hidden md:block">
                                                <div className="text-[9px] font-black uppercase text-foreground/30 tracking-widest mb-4">
                                                    Настройка зон
                                                </div>
                                                {[
                                                    {
                                                        name: 'Кухня',
                                                        color: '#ef4444',
                                                        area: '45м²',
                                                    },
                                                    {
                                                        name: 'Зал',
                                                        color: '#3b82f6',
                                                        area: '120м²',
                                                    },
                                                    {
                                                        name: 'Санузел',
                                                        color: '#22c55e',
                                                        area: '15м²',
                                                    },
                                                ].map((z) => (
                                                    <div
                                                        key={z.name}
                                                        className="p-3 rounded-xl bg-foreground/5 border border-white/5 flex items-center justify-between group/zone cursor-pointer hover:bg-foreground/10 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className="w-2 h-2 rounded-full"
                                                                style={{ backgroundColor: z.color }}
                                                            />
                                                            <span className="text-[10px] font-bold">
                                                                {z.name}
                                                            </span>
                                                        </div>
                                                        <span className="text-[8px] opacity-30 font-black">
                                                            {z.area}
                                                        </span>
                                                    </div>
                                                ))}
                                                <div className="p-3 rounded-xl border border-dashed border-border-theme flex items-center justify-center text-[9px] font-black opacity-30 mt-4 cursor-pointer hover:opacity-100 transition-opacity">
                                                    + Добавить зону
                                                </div>
                                            </div>

                                            {/* Middle: Results Table (Mock) */}
                                            <div className="col-span-12 md:col-span-6 flex flex-col h-full">
                                                <div className="bg-foreground/5 rounded-2xl flex-1 border border-white/5 overflow-hidden flex flex-col">
                                                    <div className="p-3 sm:p-4 border-b border-white/5 bg-white/5 grid grid-cols-3 text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-foreground/40">
                                                        <span>Наименование</span>
                                                        <span className="text-center">Кол-во</span>
                                                        <span className="text-right">Всего</span>
                                                    </div>
                                                    <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 flex-1">
                                                        {[
                                                            {
                                                                n: 'Швабра проф. (Синяя)',
                                                                q: '4 ед.',
                                                                t: '12 400 ₽',
                                                            },
                                                            {
                                                                n: 'Сменная насадка',
                                                                q: '12 ед.',
                                                                t: '6 800 ₽',
                                                            },
                                                            {
                                                                n: 'Тележка двухведерная',
                                                                q: '2 ед.',
                                                                t: '24 100 ₽',
                                                            },
                                                        ].map((row, i) => (
                                                            <div
                                                                key={i}
                                                                className="grid grid-cols-3 text-[8px] sm:text-[10px] items-center border-b border-white/5 pb-2 last:border-0 border-dashed"
                                                            >
                                                                <span className="font-bold truncate pr-2">
                                                                    {row.n}
                                                                </span>
                                                                <span className="text-center font-black text-primary">
                                                                    {row.q}
                                                                </span>
                                                                <span className="text-right font-black opacity-60">
                                                                    {row.t}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="mt-auto p-4 bg-primary/5 border-t border-primary/10 flex justify-between items-center">
                                                        <span className="text-[7px] sm:text-[9px] font-black uppercase tracking-widest opacity-40">
                                                            Итоговая смета:
                                                        </span>
                                                        <span className="text-xs sm:text-sm font-black text-primary">
                                                            43 300 ₽
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right: Expert Chat (Mock) */}
                                            <div className="col-span-3 hidden lg:flex flex-col h-full">
                                                <div className="bg-foreground/5 rounded-2xl flex-1 border border-white/10 flex flex-col overflow-hidden shadow-inner">
                                                    <div className="p-3 border-b border-white/10 bg-primary/10 flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center text-[10px] text-white font-black">
                                                            M
                                                        </div>
                                                        <div className="text-[9px] font-black uppercase tracking-widest">
                                                            Чат с экспертом
                                                        </div>
                                                    </div>
                                                    <div className="p-3 space-y-4 flex-1 overflow-y-auto">
                                                        <div className="bg-white/5 p-2 rounded-lg rounded-tl-none border border-white/5 max-w-[90%]">
                                                            <p className="text-[8px] leading-tight opacity-70 italic whitespace-normal">
                                                                Здравствуйте! Проверьте расчет по
                                                                Санузлам, я добавил нормы по
                                                                интенсивности.
                                                            </p>
                                                        </div>
                                                        <div className="bg-primary/20 p-2 rounded-lg rounded-tr-none border border-primary/20 ml-auto max-w-[90%]">
                                                            <p className="text-[8px] leading-tight text-primary font-bold whitespace-normal">
                                                                Отлично, теперь бюджет сходится.
                                                                Согласовано.
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="p-2 border-t border-white/5 bg-white/5">
                                                        <div className="bg-white/5 rounded-lg h-7 flex items-center px-2 text-[8px] opacity-20">
                                                            Введите сообщение...
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Problems Section */}
                <section id="problems" className="py-24 sm:py-32 bg-foreground text-background">
                    <div className="fluid-container">
                        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
                            <div className="space-y-10">
                                <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-black leading-tight tracking-tighter">
                                    Почему Excel <br />
                                    <span className="opacity-50 italic">больше не работает?</span>
                                </h2>
                                <div className="space-y-10">
                                    {[
                                        {
                                            icon: <TrendingDown />,
                                            title: 'Неконтролируемый бюджет',
                                            desc: 'Закупки "на всякий случай" без учета реальных площадей съедают до 30% прибыли.',
                                        },
                                        {
                                            icon: <Zap />,
                                            title: 'Риск человеческой ошибки',
                                            desc: 'Ошибки в формулах и нормах расхода ведут к простоям или нехватке оборудования.',
                                        },
                                        {
                                            icon: <MessageSquare />,
                                            title: 'Сложная коммуникация',
                                            desc: 'WhatsApp и почта превращаются в свалку файлов, где невозможно найти финальную версию.',
                                        },
                                    ].map((item, i) => (
                                        <div key={i} className="flex gap-6 items-start group">
                                            <div className="w-14 h-14 rounded-2xl bg-background/5 border border-background/10 flex items-center justify-center shrink-0 text-primary group-hover:bg-primary group-hover:text-background transition-all duration-500">
                                                {item.icon}
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="text-xl font-black">{item.title}</h4>
                                                <p className="text-background/60 text-sm font-bold uppercase tracking-wider leading-relaxed">
                                                    {item.desc}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Efficiency Infographic */}
                            <div className="relative group">
                                <div className="aspect-square bg-white border border-white/10 rounded-[3rem] sm:rounded-[4rem] p-8 sm:p-12 overflow-hidden rotate-3 hover:rotate-0 transition-all duration-700 shadow-[0_50px_100px_-15px_rgba(0,0,0,0.5)]">
                                    <div className="h-full flex flex-col justify-between text-slate-900">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1 text-left">
                                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                                                    Efficiency Audit
                                                </p>
                                                <h3 className="text-2xl sm:text-3xl font-black uppercase leading-[0.9] text-slate-900">
                                                    Реальная <br /> выгода
                                                </h3>
                                            </div>
                                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                                <TrendingDown size={24} />
                                            </div>
                                        </div>

                                        <div className="relative flex items-center justify-center py-6">
                                            <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
                                            <span className="text-[8rem] sm:text-[11rem] font-black leading-none tracking-tighter italic text-primary drop-shadow-sm">
                                                30%
                                            </span>
                                        </div>

                                        <div className="space-y-5 text-left">
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                                                <div className="h-full bg-primary w-[30%] rounded-full shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)] transition-all duration-2000" />
                                            </div>
                                            <div>
                                                <p className="text-[12px] sm:text-[13px] font-black uppercase tracking-widest leading-none text-slate-900 mb-2">
                                                    Сокращение издержек
                                                </p>
                                                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                                                    Средний показатель оптимизации <br /> бюджета
                                                    после внедрения HICS
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Solution Areas Section */}
                <section id="areas" className="py-24 sm:py-32">
                    <div className="fluid-container">
                        <SectionHeader
                            title="Универсальное решение"
                            subtitle="Для любого типа бизнеса и сложности объекта"
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                            {[
                                {
                                    icon: <Utensils />,
                                    title: 'HORECA',
                                    items: ['Рестораны', 'Кафе', 'Бары'],
                                },
                                {
                                    icon: <Building2 />,
                                    title: 'HOTELS',
                                    items: ['Отели', 'Хозяева апартаментов', 'Глэмпинги'],
                                },
                                {
                                    icon: <Factory />,
                                    title: 'PRODUCTION',
                                    items: ['Заводы', 'Склады', 'Цеха'],
                                },
                                {
                                    icon: <Stethoscope />,
                                    title: 'MEDICAL',
                                    items: ['Клиники', 'Аптеки', 'Салоны красоты'],
                                },
                            ].map((area, i) => (
                                <div
                                    key={i}
                                    className="glass-card group hover:border-primary transition-all duration-500 cursor-default p-8 !rounded-[2.5rem]"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-primary/5 text-primary flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                                        {area.icon}
                                    </div>
                                    <h3 className="text-2xl font-black mb-6 tracking-tight">
                                        {area.title}
                                    </h3>
                                    <ul className="space-y-4">
                                        {area.items.map((item) => (
                                            <li
                                                key={item}
                                                className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-foreground/40 group-hover:text-foreground transition-colors"
                                            >
                                                <CheckCircle2
                                                    size={14}
                                                    className="text-primary shrink-0"
                                                />{' '}
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features (Value Props) Section */}
                <section id="features" className="py-24 sm:py-32 relative">
                    <div className="fluid-container relative z-10">
                        <div className="grid lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 grid md:grid-cols-2 gap-6 sm:gap-8">
                                {[
                                    {
                                        icon: <Zap />,
                                        title: 'Смарт-калькулятор',
                                        desc: 'Автоматизированный расчет норм расхода на основе площади и типа зон. Точность до 99%.',
                                    },
                                    {
                                        icon: <MessageSquare />,
                                        title: 'Экспертное сопровождение',
                                        desc: 'Прямая связь с персональным менеджером-консультантом для финальной калибровки сметы.',
                                    },
                                    {
                                        icon: <Palette />,
                                        title: 'HACCP Интеграция',
                                        desc: 'Строгое соблюдение стандартов цветового зонирования для пищевой безопасности.',
                                    },
                                    {
                                        icon: <FileText />,
                                        title: 'Авто-генерация смет',
                                        desc: 'Мгновенное формирование ведомостей закупок и ТЗ для поставщиков в формате PDF/XLS.',
                                    },
                                ].map((f, i) => (
                                    <div
                                        key={i}
                                        className="p-8 sm:p-10 rounded-[2.5rem] border border-border-theme bg-card/50 hover:bg-card transition-all group hover:shadow-2xl hover:-translate-y-1"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-500">
                                            {f.icon}
                                        </div>
                                        <h4 className="text-xl font-black mb-4 tracking-tight">
                                            {f.title}
                                        </h4>
                                        <p className="text-sm font-bold text-foreground/40 uppercase tracking-wider leading-relaxed">
                                            {f.desc}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* CTA Card */}
                            <div className="bg-primary rounded-[3rem] p-10 sm:p-12 text-white flex flex-col justify-between relative overflow-hidden group shadow-2xl shadow-primary/30">
                                <Sparkles className="absolute -top-10 -right-10 w-40 h-40 opacity-10 group-hover:rotate-12 transition-transform duration-2000" />
                                <div className="space-y-6 relative z-10">
                                    <h3 className="text-3xl sm:text-4xl font-black leading-none tracking-tighter">
                                        Начните <br /> оптимизацию <br /> сейчас
                                    </h3>
                                    <p className="text-white/70 font-bold uppercase tracking-[0.15em] text-[11px] leading-loose">
                                        Присоединяйтесь к сотням успешных объектов, которые уже
                                        перешли на экспертное управление инвентарем.
                                    </p>
                                </div>
                                <button
                                    onClick={onStart}
                                    className="mt-12 w-full py-5 sm:py-6 bg-white text-primary rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs sm:text-sm flex items-center justify-center gap-3 hover:bg-slate-100 hover:shadow-2xl hover:-translate-y-1 active:scale-95 transition-all relative z-10"
                                >
                                    Создать первый расчет <ArrowUpRight size={18} />
                                </button>
                                <div className="absolute bottom-[-20%] left-[-20%] w-64 h-64 bg-white/10 rounded-full blur-[80px]" />
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Simple Footer */}
            <footer className="py-20 border-t border-border-theme bg-card/20 transition-colors">
                <div className="fluid-container flex flex-col md:flex-row justify-between items-center gap-12 sm:gap-10">
                    <div className="flex flex-col items-center md:items-start gap-4 space-y-2">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="text-primary w-6 h-6" />
                            <span className="text-xl font-black tracking-tighter uppercase">
                                Hics
                            </span>
                        </div>
                        <p className="text-[9px] font-black text-foreground/20 uppercase tracking-[0.4em] text-center md:text-left">
                            Professional Inventory Management Ecosystem
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-8 sm:gap-12">
                        {['Terms', 'Cookie Policy', 'Privacy'].map((item) => (
                            <a
                                key={item}
                                href="#"
                                className="text-[9px] font-black text-foreground/30 uppercase tracking-[0.2em] hover:text-primary transition-colors duration-300"
                            >
                                {item}
                            </a>
                        ))}
                    </div>

                    <div className="text-[9px] font-black text-foreground/20 uppercase tracking-[0.15em] text-center">
                        &copy; {new Date().getFullYear()} HICS LABS. SYSTEM VERSION 2.1.0-PRO
                    </div>
                </div>
            </footer>
        </div>
    );
});
