import React from 'react';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import demoVideo from '@/assets/videos/calc-demo.webm';

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

                {/* Video Showcase */}
                <div className="mt-32 relative group perspective-container">
                    {/* Glow Effect */}
                    <div className="absolute inset-0 bg-primary/20 blur-[180px] -z-10 group-hover:bg-primary/30 transition-colors duration-1000" />
                    
                    <div className="glass-card !p-2 sm:!p-4 bg-card/60 border-primary/20 shadow-3xl max-w-6xl mx-auto transform-3d hover:transform-none transition-all duration-1000 ease-out cursor-default overflow-hidden rounded-[2.5rem]">
                        <div className="relative aspect-video rounded-[2rem] overflow-hidden border border-border-theme bg-background/50 backdrop-blur-sm group-hover:border-primary/30 transition-colors">
                            
                            {/* Video Player */}
                            <video 
                                autoPlay 
                                loop 
                                muted 
                                playsInline
                                className="w-full h-full object-cover"
                            >
                                <source src={demoVideo} type="video/webm" />
                                {/* Fallback text */}
                                Ваш браузер не поддерживает видео.
                            </video>

                            {/* Optional Overlay/Badge if needed */}
                            <div className="absolute bottom-6 left-8 px-5 py-2 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/10 transition-colors pointer-events-none">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Live Demo</span>
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
