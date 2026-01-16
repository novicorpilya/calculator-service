import React from 'react';
import { TrendingDown, Zap, MessageSquare, AlertCircle } from 'lucide-react';

export const LandingProblems: React.FC = () => {
    return (
        <section id="problems" className="py-32 bg-[#0a0a0b] text-white relative overflow-hidden">
            {/* Dark Aesthetic Decorations */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[160px]" />
            </div>

            <div className="fluid-container relative z-10">
                <div className="grid lg:grid-cols-2 gap-24 items-center">
                    <div className="space-y-12">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Проблема рынка</span>
                            </div>
                            <h2 className="text-[clamp(2.5rem,6vw,5rem)] font-[1000] italic leading-[0.9] tracking-tighter">
                                Почему Excel <br />
                                <span className="text-white/30">больше не тянет?</span>
                            </h2>
                        </div>

                        <div className="space-y-10">
                            {[
                                {
                                    icon: TrendingDown,
                                    title: 'Хаотичный бюджет',
                                    desc: 'Закупки "на глаз" съедают до 30% чистой прибыли за счет избыточного стока.',
                                },
                                {
                                    icon: Zap,
                                    title: 'Технологический долг',
                                    desc: 'Устаревшие методы расчета ведут к простоям зон и нарушению санитарных норм.',
                                },
                                {
                                    icon: MessageSquare,
                                    title: 'Информационный шум',
                                    desc: 'Сотни сообщений в мессенджерах вместо единого утвержденного документа.',
                                },
                            ].map((item, i) => (
                                <div key={i} className="flex gap-8 group">
                                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-white group-hover:bg-primary group-hover:border-primary transition-all duration-500">
                                        <item.icon className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="text-2xl font-[1000] italic tracking-tight">{item.title}</h4>
                                        <p className="text-white/40 text-xs font-bold uppercase tracking-[0.15em] leading-relaxed max-w-md">
                                            {item.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Infographic Card */}
                    <div className="relative flex justify-center lg:justify-end">
                        <div className="absolute inset-0 bg-primary/20 blur-[100px] -z-10 rounded-full" />
                        <div className="w-full max-w-lg aspect-square bg-card/40 backdrop-blur-2xl border border-white/10 rounded-[4rem] p-12 flex flex-col justify-between shadow-3xl rotate-2 hover:rotate-0 transition-all duration-1000 group">
                            <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Efficiency Audit</p>
                                    <h3 className="text-4xl font-[1000] tracking-tighter italic leading-none text-white">
                                        Результат <br /> внедрения
                                    </h3>
                                </div>
                                <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/40">
                                    <Zap className="fill-white text-white" />
                                </div>
                            </div>

                            <div className="relative flex items-center justify-center">
                                <div className="absolute inset-0 bg-primary/10 blur-[80px] rounded-full animate-pulse" />
                                <span className="text-[10rem] font-[1000] italic leading-none tracking-[-0.1em] text-primary group-hover:scale-110 transition-transform duration-1000">
                                    -30%
                                </span>
                            </div>

                            <div className="space-y-6">
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-0.5">
                                    <div className="h-full bg-primary w-[70%] rounded-full shadow-[0_0_20px_rgba(99,102,241,0.6)]" />
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="space-y-2">
                                        <p className="text-xs font-black uppercase tracking-widest text-white">Снижение издержек</p>
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 leading-snug">
                                            Показатель оптимизации <br /> после первого месяца работы
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">ROI 350%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
