import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const LandingFooter: React.FC = () => {
    const navigate = useNavigate();

    return (
        <footer className="py-20 sm:py-32 border-t border-border-theme bg-card/10 relative overflow-hidden">
            {/* Subtle glow in footer */}
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/5 blur-[100px] pointer-events-none" />

            <div className="fluid-container relative z-10">
                <div className="grid md:grid-cols-2 gap-16 items-start sm:items-center">
                    {/* Brand Identity */}
                    <div
                        className="flex flex-col items-start gap-6 cursor-pointer group"
                        onClick={() => {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            navigate('/');
                        }}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110 duration-500">
                                <ShieldCheck className="w-6 h-6 text-[#050506] stroke-[2.5]" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-2xl font-[1000] tracking-tighter italic uppercase text-foreground leading-none">
                                    HICS
                                </span>
                                <span className="text-[7px] font-black text-primary uppercase tracking-[0.6em] mt-1">
                                    Экосистема
                                </span>
                            </div>
                        </div>
                        <p className="text-[11px] font-bold text-foreground/30 uppercase tracking-[0.15em] max-w-sm leading-relaxed">
                            Интеллектуальный расчет оснащения <br />
                            нового поколения для лидеров рынка.
                        </p>
                    </div>

                    {/* Minimal Links */}
                    <div className="flex flex-col items-start md:items-end gap-10">
                        <div className="flex flex-wrap gap-8 sm:gap-12">
                            <button
                                onClick={() => navigate('/privacy')}
                                className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] hover:text-primary transition-all hover:tracking-[0.3em] duration-300"
                            >
                                Конфиденциальность
                            </button>
                        </div>
                        <div className="flex flex-col items-start md:items-end gap-2">
                            <div className="text-[10px] font-bold text-foreground/20 uppercase tracking-[0.2em]">
                                &copy; {new Date().getFullYear()} HICS ECOSYSTEM.
                            </div>
                            <div className="text-[8px] font-black text-primary/40 uppercase tracking-[0.4em]">
                                Engineering Efficiency
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};
