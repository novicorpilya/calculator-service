import React from 'react';
import {
    Zap,
    ShieldCheck,
    BarChart3,
    Users,
    ArrowRight,
    PackageSearch,
    BrainCircuit,
    LineChart,
    Webhook,
} from 'lucide-react';
import { AnimateOnScroll } from '@/components/common/AnimateOnScroll';

interface LandingFeaturesProps {
    onStart: () => void;
}

export const LandingFeatures: React.FC<LandingFeaturesProps> = ({ onStart }) => {
    const features = [
        {
            icon: Zap,
            title: 'Интеллектуальный расчет',
            description:
                'Создание полной сметы инвентаря на основе площади, проходимости и типа заведения за 3 минуты.',
            color: 'from-blue-500/20 to-blue-600/20',
            iconColor: 'text-blue-500',
        },
        {
            icon: BrainCircuit,
            title: 'База знаний HACCP',
            description:
                'Автоматическая интеграция санитарных норм и стандартов безопасности в каждый расчет.',
            color: 'from-indigo-500/20 to-indigo-600/20',
            iconColor: 'text-indigo-500',
        },
        {
            icon: ShieldCheck,
            title: 'Экспертный аудит',
            description:
                'Каждый проект проходит ручную проверку нашими технологами перед финальным согласованием.',
            color: 'from-emerald-500/20 to-emerald-600/20',
            iconColor: 'text-emerald-500',
        },
        {
            icon: PackageSearch,
            title: 'Каталог проверенных брендов',
            description:
                'Доступ к реестру профессионального инвентаря с актуальными ценами и характеристиками.',
            color: 'from-orange-500/20 to-orange-600/20',
            iconColor: 'text-orange-500',
        },
        {
            icon: BarChart3,
            title: 'Оптимизация бюджета',
            description:
                'Снижаем перерасход на 15-30% за счет исключения ненужных позиций и точной дозировки.',
            color: 'from-rose-500/20 to-rose-600/20',
            iconColor: 'text-rose-500',
        },
        {
            icon: Users,
            title: 'Единая среда работы',
            description:
                'Прозрачное взаимодействие между закупщиком, управляющим и штатным экспертом в чате.',
            color: 'from-violet-500/20 to-violet-600/20',
            iconColor: 'text-violet-500',
        },
        {
            icon: LineChart,
            title: 'Прогнозирование износа',
            description:
                'Предиктивная аналитика сроков замены инвентаря на основе интенсивности эксплуатации.',
            color: 'from-cyan-500/20 to-cyan-600/20',
            iconColor: 'text-cyan-500',
        },
        {
            icon: Webhook,
            title: 'API Интеграция',
            description:
                'Бесшовная синхронизация с 1С и iiko для автоматического обновления складских остатков.',
            color: 'from-fuchsia-500/20 to-fuchsia-600/20',
            iconColor: 'text-fuchsia-500',
        },
    ];

    return (
        <section
            id="features"
            className="py-20 sm:py-32 relative overflow-hidden bg-foreground/2 dark:bg-white/[0.02]"
        >
            <div className="fluid-container">
                <AnimateOnScroll
                    variant="blur-in"
                    className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16 sm:mb-24 space-y-4 sm:space-y-6"
                >
                    <h2 className="text-[clamp(1.75rem,6vw,4.5rem)] font-[1000] italic leading-[1.1] sm:leading-none tracking-tight uppercase">
                        Технологии <br />
                        <span className="text-primary not-italic">нового времени.</span>
                    </h2>
                    <p className="text-[10px] sm:text-fluid-lg text-foreground/40 font-bold uppercase tracking-[0.2em] sm:tracking-widest">
                        Почему лидеры рынка выбирают HICS
                    </p>
                </AnimateOnScroll>

                <div className="adaptive-grid gap-6 sm:gap-8">
                    {features.map((feature, index) => (
                        <AnimateOnScroll key={index} variant="zoom-in" delay={index * 80}>
                            <div className="group p-8 sm:p-12 rounded-[2rem] sm:rounded-[2.5rem] bg-card border border-border-theme hover:border-primary/30 transition-[border-color,box-shadow] duration-500 hover:shadow-2xl hover:shadow-primary/5 relative overflow-hidden h-full">
                                {/* Decorative Background */}
                                <div
                                    className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.color} blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`}
                                />

                                <div className="relative z-10 space-y-6 sm:space-y-8">
                                    <div
                                        className={`w-14 h-14 sm:w-16 h-16 rounded-xl sm:rounded-2xl bg-foreground/5 flex items-center justify-center transition-transform group-hover:scale-110 duration-500`}
                                    >
                                        <feature.icon
                                            className={`w-7 h-7 sm:w-8 h-8 ${feature.iconColor}`}
                                            strokeWidth={2.5}
                                        />
                                    </div>
                                    <div className="space-y-3 sm:space-y-4">
                                        <h3 className="text-xl sm:text-2xl font-[1000] italic tracking-tight uppercase">
                                            {feature.title}
                                        </h3>
                                        <p className="text-foreground/50 text-[10px] sm:text-[11px] font-bold leading-relaxed uppercase tracking-widest">
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </AnimateOnScroll>
                    ))}
                </div>

                <AnimateOnScroll variant="fade-up" delay={200}>
                    <div className="mt-20 sm:mt-24 flex flex-col items-center p-8 sm:p-12 lg:p-16 rounded-[2.5rem] sm:rounded-[3.5rem] bg-foreground dark:bg-card border border-border-theme text-background dark:text-foreground text-center space-y-8 sm:space-y-10 relative overflow-hidden shadow-3xl">
                        {/* Ambient Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/10 blur-[80px] sm:blur-[120px] pointer-events-none" />

                        <div className="relative z-10 space-y-3 sm:space-y-4">
                            <h4 className="text-[clamp(1.25rem,4vw,2.5rem)] font-[1000] tracking-tight italic uppercase leading-none">
                                Готовы к новому уровню эффективности?
                            </h4>
                            <p className="text-background/40 dark:text-foreground/40 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em]">
                                Бесплатный расчет первого объекта займет не более 5 минут
                            </p>
                        </div>

                        <div className="relative z-10 w-full sm:w-auto">
                            <button
                                onClick={onStart}
                                className="w-full sm:w-auto bg-primary text-white px-10 sm:px-14 py-5 sm:py-6 rounded-xl sm:rounded-2xl text-[11px] sm:text-[12px] font-black uppercase tracking-widest hover:scale-105 transition-transform flex items-center justify-center gap-4 group shadow-xl shadow-primary/30"
                            >
                                Создать первый проект
                                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
                            </button>
                        </div>
                    </div>
                </AnimateOnScroll>
            </div>
        </section>
    );
};
