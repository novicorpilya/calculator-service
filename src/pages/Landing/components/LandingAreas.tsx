import React from 'react';
import { Utensils, Building2, Factory, Store } from 'lucide-react';

export const LandingAreas: React.FC = () => {
    return (
        <section id="areas" className="py-32 relative overflow-hidden">
            <div className="fluid-container">
                <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-24 space-y-6">
                    <h2 className="text-[clamp(2.5rem,6vw,4.5rem)] font-[1000] italic leading-none tracking-tight">
                        Единый стандарт <br />
                        <span className="text-primary not-italic">для всех индустрий.</span>
                    </h2>
                    <p className="text-fluid-lg text-foreground/30 font-bold uppercase tracking-widest">
                        Масштабируемость без границ
                    </p>
                </div>

                <div className="adaptive-grid gap-8">
                    {[
                        {
                            icon: Utensils,
                            title: 'HORECA',
                            subtitle: 'Премиальный сервис',
                            items: ['Рестораны', 'Кафе и бары', 'Dark Kitchens'],
                            color: 'from-orange-500/10 to-transparent'
                        },
                        {
                            icon: Building2,
                            title: 'HOTELS',
                            subtitle: 'Гостеприимство 5*',
                            items: ['Отели и курорты', 'Глэмпинги', 'Апартаменты'],
                            color: 'from-blue-500/10 to-transparent'
                        },
                        {
                            icon: Factory,
                            title: 'PRODUCTION',
                            subtitle: 'Масштаб',
                            items: ['Заводы и цеха', 'Фуд-корты', 'Склады'],
                            color: 'from-emerald-500/10 to-transparent'
                        },
                        {
                            icon: Store,
                            title: 'RETAIL',
                            subtitle: 'Торговые сети',
                            items: ['Супермаркеты', 'Кулинария', 'Ритейл'],
                            color: 'from-indigo-500/10 to-transparent'
                        }
                    ].map((area, i) => (
                        <div
                            key={i}
                            className="relative group p-10 rounded-[3rem] bg-card border border-border-theme hover:border-primary/40 transition-all duration-700 hover:shadow-3xl overflow-hidden"
                        >
                            {/* Accent Glow */}
                            <div className={`absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br ${area.color} blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000`} />
                            
                            <div className="relative z-10 space-y-10">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="w-14 h-14 bg-foreground/5 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-500">
                                        <area.icon className="w-7 h-7" />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{area.subtitle}</p>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <h3 className="text-3xl font-[1000] italic tracking-tight">{area.title}</h3>
                                    <ul className="space-y-5">
                                        {area.items.map((item) => (
                                            <li
                                                key={item}
                                                className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-foreground/30 group-hover:text-foreground/60 transition-colors"
                                            >
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
