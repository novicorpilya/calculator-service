import React from 'react'
import { ArrowRight, Layout, Palette, Ruler, PackageCheck, ShieldCheck, Sparkles } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

interface LandingProps {
    onStart: () => void
}

export const Landing: React.FC<LandingProps> = ({ onStart }) => {
    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 overflow-x-hidden font-sans flex flex-col relative transition-colors duration-500">
            {/* Background Glows */}
            <div className="absolute top-0 left-0 w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

            {/* Universal Header */}
            <header className="fluid-container py-10 flex justify-between items-center gap-4 z-50">
                <div className="flex items-center gap-3 shrink-0">
                    <div className="w-8 h-8 min-[400px]:w-10 min-[400px]:h-10 bg-primary/10 rounded-xl min-[400px]:rounded-2xl border border-primary/20 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 min-[400px]:w-6 min-[400px]:h-6 text-primary" />
                    </div>
                    <span className="text-[clamp(1rem,4vw,1.5rem)] font-black tracking-tighter uppercase whitespace-nowrap">Hics</span>
                </div>
                <div className="flex items-center gap-[clamp(0.5rem,3vw,1.5rem)]">
                    <ThemeToggle />
                    <button
                        onClick={onStart}
                        className="group flex items-center gap-2 px-4 min-[400px]:px-6 py-2.5 rounded-xl border-2 border-primary bg-transparent text-primary text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary hover:text-white transition-all active:scale-95 shadow-lg shadow-primary/10 whitespace-nowrap"
                    >
                        Вход <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1" />
                    </button>
                </div>
            </header>

            {/* Hero Section - Fluid Grid */}
            <main className="flex-1 fluid-container py-24 z-10">
                <div className="flex flex-wrap items-center gap-16">

                    <div className="flex-1 min-w-[min(100%,500px)] space-y-10">
                        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] border border-primary/20">
                            <Sparkles className="w-3.5 h-3.5" />
                            Профессиональный инструмент
                        </div>

                        <h1 className="text-[clamp(2.5rem,8vw,5.5rem)] font-black leading-[0.95] tracking-tighter">
                            Точный расчет <br />
                            <span className="text-primary italic">инвентаря</span>
                        </h1>

                        <p className="text-[clamp(1rem,3vw,1.35rem)] text-foreground/80 max-w-xl font-medium leading-relaxed">
                            Автоматизированная система планирования закупок для HoReCa на основе цветового кодирования и площади помещений.
                        </p>

                        <div className="flex flex-wrap gap-4 pt-4">
                            <button
                                onClick={onStart}
                                className="btn-premium"
                            >
                                Начать расчет <ArrowRight className="w-4 h-4 ml-2" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 min-w-[min(100%,400px)] relative">
                        <div className="glass-card relative z-10 group">
                            <div className="space-y-4">
                                {/* Zone Item Red */}
                                <div className="flex flex-col min-[450px]:flex-row min-[450px]:items-center gap-4 p-5 rounded-[2rem] bg-red-500/5 border border-red-500/10 group-hover:bg-red-500/10 transition-all duration-500">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 shrink-0 rounded-2xl bg-red-500 flex items-center justify-center text-white font-black text-base shadow-lg shadow-red-500/20">КР</div>
                                        <div>
                                            <h4 className="font-black text-foreground text-sm min-[400px]:text-base leading-tight">Санузлы</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-black text-foreground/40 uppercase tracking-widest">45 м²</span>
                                                <span className="w-1 h-1 rounded-full bg-foreground/20" />
                                                <span className="text-[10px] font-black text-foreground/40 uppercase tracking-widest">Зона 1</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex min-[450px]:ml-auto items-center justify-between border-t min-[450px]:border-t-0 border-red-500/10 pt-3 min-[450px]:pt-0">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-foreground/30 min-[450px]:hidden">Инвентарь:</span>
                                        <div className="text-lg font-black text-primary whitespace-nowrap">12 ед.</div>
                                    </div>
                                </div>

                                {/* Zone Item Blue */}
                                <div className="flex flex-col min-[450px]:flex-row min-[450px]:items-center gap-4 p-5 rounded-[2rem] bg-primary/5 border border-primary/10 group-hover:bg-primary/10 transition-all duration-500 delay-75">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 shrink-0 rounded-2xl bg-primary flex items-center justify-center text-white font-black text-base shadow-lg shadow-primary/20">СН</div>
                                        <div>
                                            <h4 className="font-black text-foreground text-sm min-[400px]:text-base leading-tight">Гостевой зал</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-black text-foreground/40 uppercase tracking-widest">120 м²</span>
                                                <span className="w-1 h-1 rounded-full bg-foreground/20" />
                                                <span className="text-[10px] font-black text-foreground/40 uppercase tracking-widest">Зона 6</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex min-[450px]:ml-auto items-center justify-between border-t min-[450px]:border-t-0 border-primary/10 pt-3 min-[450px]:pt-0">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-foreground/30 min-[450px]:hidden">Инвентарь:</span>
                                        <div className="text-lg font-black text-primary whitespace-nowrap">28 ед.</div>
                                    </div>
                                </div>

                                {/* Zone Item Yellow */}
                                <div className="flex flex-col min-[450px]:flex-row min-[450px]:items-center gap-4 p-5 rounded-[2rem] bg-yellow-500/5 border border-yellow-500/10 group-hover:bg-yellow-500/10 transition-all duration-500 delay-150">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 shrink-0 rounded-2xl bg-yellow-500 flex items-center justify-center text-white font-black text-base shadow-lg shadow-yellow-500/20">ЖЛ</div>
                                        <div>
                                            <h4 className="font-black text-foreground text-sm min-[400px]:text-base leading-tight">Кухонные цеха</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-black text-foreground/40 uppercase tracking-widest">80 м²</span>
                                                <span className="w-1 h-1 rounded-full bg-foreground/20" />
                                                <span className="text-[10px] font-black text-foreground/40 uppercase tracking-widest">Зона 4</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex min-[450px]:ml-auto items-center justify-between border-t min-[450px]:border-t-0 border-yellow-500/10 pt-3 min-[450px]:pt-0">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-foreground/30 min-[450px]:hidden">Инвентарь:</span>
                                        <div className="text-lg font-black text-primary whitespace-nowrap">15 ед.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Grid - No media queries, just auto-fit */}
                <div className="mt-40 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-8">
                    {[
                        { icon: <Layout className="w-6 h-6" />, title: 'Общая площадь', desc: 'Укажите размер помещения в м² для старта' },
                        { icon: <Palette className="w-6 h-6" />, title: 'Зонирование', desc: 'Разделите объект на цветовые зоны' },
                        { icon: <Ruler className="w-6 h-6" />, title: 'Точный расчет', desc: 'Алгоритм определит точные нормы' },
                        { icon: <PackageCheck className="w-6 h-6" />, title: 'Итог', desc: 'Готовая ведомость закупки инвентаря' }
                    ].map((step, idx) => (
                        <div key={idx} className="bg-card border border-border-theme p-8 rounded-[2rem] hover:shadow-2xl hover:-translate-y-2 transition-all">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                                {step.icon}
                            </div>
                            <h3 className="text-xl font-black mb-2">{step.title}</h3>
                            <p className="text-foreground/60 text-xs font-bold uppercase tracking-wider leading-relaxed">{step.desc}</p>
                        </div>
                    ))}
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full py-12 border-t border-border-theme z-10 transition-colors">
                <div className="fluid-container flex flex-wrap justify-between items-center gap-8">
                    <p className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.3em]">
                        &copy; 2025 HICS INVENTORY AG.
                    </p>
                    <div className="flex flex-wrap gap-10">
                        {['Terms', 'Privacy', 'Cookies'].map(i => (
                            <a key={i} href="#" className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.3em] hover:text-primary transition-colors">{i}</a>
                        ))}
                    </div>
                </div>
            </footer>
        </div>
    )
}
