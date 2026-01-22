import React from 'react';
import { Utensils, Building2, Factory, Store } from 'lucide-react';
import { AnimateOnScroll } from '@/components/common/AnimateOnScroll';

export const LandingAreas: React.FC = () => {
    return (
        <section id="areas" className="py-20 sm:py-32 relative overflow-hidden">
            <div className="fluid-container">
                <AnimateOnScroll
                    variant="blur-in"
                    className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16 sm:mb-24 space-y-4 sm:space-y-6"
                >
                    <h2 className="text-[clamp(1.75rem,6vw,4.5rem)] font-[1000] italic leading-[1.1] sm:leading-none tracking-tight uppercase">
                        Единый стандарт <br />
                        <span className="text-primary not-italic">для всех индустрий.</span>
                    </h2>
                    <p className="text-[10px] sm:text-fluid-lg text-foreground/30 font-bold uppercase tracking-[0.3em] sm:tracking-widest">
                        Масштабируемость без границ
                    </p>
                </AnimateOnScroll>

                <div className="adaptive-grid gap-6 sm:gap-8">
                    {[
                        {
                            icon: Utensils,
                            title: 'HORECA',
                            subtitle: 'Премиальный сервис',
                            items: ['Рестораны', 'Кафе и бары', 'Dark Kitchens'],
                            color: 'from-orange-500/10 to-transparent',
                        },
                        {
                            icon: Building2,
                            title: 'HOTELS',
                            subtitle: 'Гостеприимство 5*',
                            items: ['Отели и курорты', 'Глэмпинги', 'Апартаменты'],
                            color: 'from-blue-500/10 to-transparent',
                        },
                        {
                            icon: Factory,
                            title: 'PRODUCTION',
                            subtitle: 'Масштаб',
                            items: ['Заводы и цеха', 'Фуд-корты', 'Склады'],
                            color: 'from-emerald-500/10 to-transparent',
                        },
                        {
                            icon: Store,
                            title: 'RETAIL',
                            subtitle: 'Торговые сети',
                            items: ['Супермаркеты', 'Кулинария', 'Ритейл'],
                            color: 'from-indigo-500/10 to-transparent',
                        },
                    ].map((area, i) => (
                        <AnimateOnScroll key={i} variant="fade-up" delay={i * 100}>
                            <div className="relative group p-8 sm:p-10 rounded-[2rem] sm:rounded-[3rem] bg-card border border-border-theme hover:border-primary/40 transition-all duration-700 hover:shadow-3xl overflow-hidden h-full">
                                {/* Accent Glow */}
                                <div
                                    className={`absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br ${area.color} blur-[80px] sm:blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000`}
                                />

                                <div className="relative z-10 space-y-6 sm:space-y-10">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-foreground/5 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-500">
                                            <area.icon className="w-6 h-6 sm:w-7 sm:h-7" />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[8px] sm:text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                                                {area.subtitle}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-6 sm:space-y-8">
                                        <h3 className="text-2xl sm:text-3xl font-[1000] italic tracking-tight uppercase">
                                            {area.title}
                                        </h3>
                                        <ul className="space-y-3 sm:space-y-5">
                                            {area.items.map((item) => (
                                                <li
                                                    key={item}
                                                    className="flex items-center gap-3 sm:gap-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-foreground/30 group-hover:text-foreground/60 transition-colors"
                                                >
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </AnimateOnScroll>
                    ))}
                </div>
            </div>
        </section>
    );
};
