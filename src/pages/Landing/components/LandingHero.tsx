import React from 'react';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface LandingHeroProps {
    onStart: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onStart }) => {
    return (
        <section className="relative pt-48 pb-32 overflow-hidden">
            {/* Immersive Background */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-[1400px] pointer-events-none -z-10">
                <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full animate-pulse duration-[8000ms]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse duration-[6000ms]" />
            </div>

            <div className="fluid-container">
                <div className="flex flex-col items-center text-center max-w-5xl mx-auto space-y-16">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-foreground/5 dark:bg-white/5 border border-border-theme backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-1000">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/60">
                            Профессиональная экосистема v2.5
                        </span>
                    </div>

                    {/* Headline */}
                    <div className="space-y-8">
                        <h1 className="text-[clamp(3rem,12vw,8.5rem)] font-[1000] leading-[0.85] tracking-[-0.06em] italic animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                            Закупки <br />
                            <span className="text-primary not-italic">стали наукой.</span>
                        </h1>
                        <p className="text-[clamp(1.1rem,2.5vw,1.6rem)] text-foreground/50 max-w-3xl mx-auto font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-400">
                            HICS — это интеллект вашего заведения. Автоматизированный расчет оснащения на базе 
                            экспертной методологии и живой экспертизы лидеров HoReCa.
                        </p>
                    </div>

                    {/* Features List (Social Proof) */}
                    <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 opacity-0 animate-fade-in delay-600 fill-mode-forwards">
                        {[
                            'Экономия бюджета до 24%',
                            '100% соответствие HACCP',
                            'Экспертный аудит 24/7'
                        ].map((text, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-primary" strokeWidth={3} />
                                <span className="text-[11px] font-[900] uppercase tracking-widest text-foreground/70">{text}</span>
                            </div>
                        ))}
                    </div>

                    {/* CTA */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-6 animate-in fade-in zoom-in duration-1000 delay-800">
                        <button
                            onClick={onStart}
                            className="btn-premium !px-16 !py-6 text-[12px] shadow-[0_32px_64px_-16px_rgba(37,99,235,0.4)] hover:scale-105"
                        >
                            Запустить расчет <ArrowRight className="w-5 h-5 ml-3" />
                        </button>
                    </div>
                </div>

                {/* Perspective Mockup */}
                <div className="mt-32 relative group perspective-container">
                    <div className="absolute inset-0 bg-primary/20 blur-[180px] -z-10 group-hover:bg-primary/30 transition-colors duration-1000" />
                    <div className="glass-card !p-3 sm:!p-6 bg-card/60 border-primary/20 shadow-3xl max-w-6xl mx-auto transform-3d hover:transform-none transition-all duration-1000 ease-out cursor-default overflow-hidden">
                        <div className="rounded-[2.5rem] overflow-hidden border border-border-theme relative aspect-[16/10] bg-background/40 backdrop-blur-sm">
                            {/* Inner Mockup UI */}
                            <div className="p-8 h-full flex flex-col">
                                <div className="flex items-center justify-between mb-12">
                                    <div className="flex gap-2.5">
                                        <div className="w-3.5 h-3.5 rounded-full bg-red-400/30" />
                                        <div className="w-3.5 h-3.5 rounded-full bg-yellow-400/30" />
                                        <div className="w-3.5 h-3.5 rounded-full bg-green-400/30" />
                                    </div>
                                    <div className="px-5 py-2 rounded-full bg-primary text-[10px] font-black text-white uppercase tracking-[0.2em] shadow-lg shadow-primary/20">
                                        HICS Intelligence v2.0
                                    </div>
                                </div>

                                <div className="grid grid-cols-12 gap-10 flex-1 overflow-hidden">
                                     {/* Mock Sidebar */}
                                     <div className="col-span-3 space-y-6 hidden lg:block opacity-40">
                                         {[1,2,3,4].map(i => (
                                             <div key={i} className="h-12 w-full bg-foreground/5 rounded-2xl" />
                                         ))}
                                     </div>
                                     {/* Mock Table */}
                                     <div className="col-span-12 lg:col-span-9 space-y-8">
                                         <div className="p-8 w-full bg-primary/5 rounded-[2rem] border border-primary/10 flex items-center justify-between">
                                             <div className="flex items-center gap-6">
                                                 <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white font-[1000] italic text-xl shadow-lg shadow-primary/20">H</div>
                                                 <div className="space-y-1">
                                                     <div className="text-[10px] font-black text-primary uppercase tracking-widest">Текущий проект</div>
                                                     <div className="text-sm font-black text-foreground">Ресторан "Grill & Wine"</div>
                                                 </div>
                                             </div>
                                             <div className="hidden sm:flex gap-8">
                                                 <div className="text-right">
                                                     <div className="text-[8px] font-black text-foreground/30 uppercase tracking-[0.2em]">Стадия</div>
                                                     <div className="text-[10px] font-bold text-foreground uppercase">Черновик</div>
                                                 </div>
                                                 <div className="text-right">
                                                     <div className="text-[8px] font-black text-foreground/30 uppercase tracking-[0.2em]">Позиций</div>
                                                     <div className="text-[10px] font-bold text-foreground">84</div>
                                                 </div>
                                             </div>
                                         </div>
                                         <div className="space-y-4">
                                             <div className="grid grid-cols-12 gap-6 px-6 pb-2">
                                                 <div className="col-span-6 text-[8px] font-black text-foreground/20 uppercase tracking-[0.4em]">Наименование</div>
                                                 <div className="col-span-2 text-[8px] font-black text-foreground/20 uppercase tracking-[0.4em]">Кол-во</div>
                                                 <div className="col-span-2 text-[8px] font-black text-foreground/20 uppercase tracking-[0.4em]">Цена</div>
                                                 <div className="col-span-2 text-[8px] font-black text-foreground/20 uppercase tracking-[0.4em]">Итого</div>
                                             </div>
                                             {[
                                                 { name: 'Тарелка обеденная 27см', qty: '120', price: '450 ₽', total: '54,000 ₽', active: true },
                                                 { name: 'Бокал для вина 450мл', qty: '96', price: '380 ₽', total: '36,480 ₽', active: false },
                                                 { name: 'Ложка столовая SteelPro', qty: '150', price: '120 ₽', total: '18,000 ₽', active: false },
                                                 { name: 'Нож столовый SteelPro', qty: '150', price: '145 ₽', total: '21,750 ₽', active: false },
                                             ].map((row, i) => (
                                                 <div key={i} className={`grid grid-cols-12 gap-6 p-5 rounded-2xl border ${row.active ? 'border-primary/20 bg-primary/5' : 'border-border-theme bg-foreground/[0.02]'}`}>
                                                     <div className="col-span-6 flex items-center gap-4">
                                                         <div className={`w-2 h-2 rounded-full ${row.active ? 'bg-primary animate-pulse' : 'bg-foreground/10'}`} />
                                                         <div className="text-[10px] font-black text-foreground/70 uppercase tracking-widest truncate">{row.name}</div>
                                                     </div>
                                                     <div className="col-span-2 text-[10px] font-bold text-foreground/40">{row.qty} шт.</div>
                                                     <div className="col-span-2 text-[10px] font-bold text-foreground/40">{row.price}</div>
                                                     <div className={`col-span-2 text-[10px] font-black ${row.active ? 'text-primary' : 'text-foreground/60'}`}>{row.total}</div>
                                                 </div>
                                             ))}
                                         </div>
                                     </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .perspective-container {
                    perspective: 2000px;
                }
                .transform-3d {
                    transform: rotateX(15deg) translateY(-20px) scale(0.95);
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 1.2s cubic-bezier(0.16, 1, 0.3, 1) both;
                }
            `}</style>
        </section>
    );
};
