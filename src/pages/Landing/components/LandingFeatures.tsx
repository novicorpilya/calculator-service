import React from 'react';
import { 
    Zap, 
    ShieldCheck, 
    BarChart3, 
    Users, 
    ArrowRight, 
    PackageSearch,
    BrainCircuit
} from 'lucide-react';

interface LandingFeaturesProps {
    onStart: () => void;
}

export const LandingFeatures: React.FC<LandingFeaturesProps> = ({ onStart }) => {
    const features = [
        {
            icon: Zap,
            title: 'Интеллектуальный расчет',
            description: 'Создание полной сметы инвентаря на основе площади, проходимости и типа заведения за 3 минуты.',
            color: 'from-blue-500/20 to-blue-600/20',
            iconColor: 'text-blue-500'
        },
        {
            icon: BrainCircuit,
            title: 'База знаний HACCP',
            description: 'Автоматическая интеграция санитарных норм и стандартов безопасности в каждый расчет.',
            color: 'from-indigo-500/20 to-indigo-600/20',
            iconColor: 'text-indigo-500'
        },
        {
            icon: ShieldCheck,
            title: 'Экспертный аудит',
            description: 'Каждый проект проходит ручную проверку нашими технологами перед финальным согласованием.',
            color: 'from-emerald-500/20 to-emerald-600/20',
            iconColor: 'text-emerald-500'
        },
        {
            icon: PackageSearch,
            title: 'Каталог проверенных брендов',
            description: 'Доступ к реестру профессионального инвентаря с актуальными ценами и характеристиками.',
            color: 'from-orange-500/20 to-orange-600/20',
            iconColor: 'text-orange-500'
        },
        {
            icon: BarChart3,
            title: 'Оптимизация бюджета',
            description: 'Снижаем перерасход на 15-30% за счет исключения ненужных позиций и точной дозировки.',
            color: 'from-rose-500/20 to-rose-600/20',
            iconColor: 'text-rose-500'
        },
        {
            icon: Users,
            title: 'Единая среда работы',
            description: 'Прозрачное взаимодействие между закупщиком, управляющим и штатным экспертом в чате.',
            color: 'from-violet-500/20 to-violet-600/20',
            iconColor: 'text-violet-500'
        }
    ];

    return (
        <section id="features" className="py-32 relative overflow-hidden bg-foreground/2 dark:bg-white/[0.02]">
            <div className="fluid-container">
                <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-24 space-y-6">
                    <h2 className="text-[clamp(2rem,6vw,4.5rem)] font-[1000] italic leading-none tracking-tight">
                        Технологии <br />
                        <span className="text-primary not-italic">нового времени.</span>
                    </h2>
                    <p className="text-fluid-lg text-foreground/40 font-bold uppercase tracking-widest">
                        Почему лидеры рынка выбирают HICS
                    </p>
                </div>

                <div className="adaptive-grid gap-8">
                    {features.map((feature, index) => (
                        <div 
                            key={index}
                            className="group p-8 sm:p-12 rounded-[2.5rem] bg-card border border-border-theme hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 relative overflow-hidden"
                        >
                            {/* Decorative Background */}
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.color} blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`} />
                            
                            <div className="relative z-10 space-y-8">
                                <div className={`w-16 h-16 rounded-2xl bg-foreground/5 flex items-center justify-center transition-transform group-hover:scale-110 duration-500`}>
                                    <feature.icon className={`w-8 h-8 ${feature.iconColor}`} strokeWidth={2.5} />
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-[1000] italic tracking-tight">
                                        {feature.title}
                                    </h3>
                                    <p className="text-foreground/50 text-[11px] sm:text-xs font-bold leading-relaxed uppercase tracking-widest">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom CTA for Features */}
                <div className="mt-24 flex flex-col items-center p-12 rounded-[3.5rem] bg-foreground dark:bg-card border border-border-theme text-background dark:text-foreground text-center space-y-10 relative overflow-hidden shadow-3xl">
                    {/* Ambient Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/10 blur-[120px] pointer-events-none" />
                    
                    <div className="relative z-10 space-y-4">
                        <h4 className="text-[clamp(1.5rem,4vw,2.5rem)] font-[1000] tracking-tight italic">
                            Готовы к новому уровню эффективности?
                        </h4>
                        <p className="text-background/40 dark:text-foreground/40 text-[10px] font-black uppercase tracking-[0.4em]">
                            Бесплатный расчет первого объекта займет не более 5 минут
                        </p>
                    </div>

                    <div className="relative z-10">
                        <button
                            onClick={onStart}
                            className="bg-primary text-white px-14 py-6 rounded-2xl text-[12px] font-black uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-4 group shadow-xl shadow-primary/30"
                        >
                            Создать первый проект
                            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};
