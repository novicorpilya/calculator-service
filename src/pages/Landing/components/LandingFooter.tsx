import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const LandingFooter: React.FC = () => {
    const navigate = useNavigate();
    
    return (
        <footer className="py-24 border-t border-border-theme bg-card/20 transition-colors">
            <div className="fluid-container">
                <div className="flex flex-col md:flex-row justify-between items-center gap-16">
                    {/* Brand Identity */}
                    <div 
                        className="flex flex-col items-center md:items-start gap-6 cursor-pointer group"
                        onClick={() => navigate('/')}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                                <ShieldCheck className="w-6 h-6 text-[#050506] stroke-[2.5]" />
                            </div>
                            <span className="text-2xl font-[1000] tracking-tighter italic uppercase text-foreground">
                                HICS
                            </span>
                        </div>
                        <p className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.8em] max-w-xs text-center md:text-left leading-loose">
                            Экосистема
                        </p>
                    </div>

                    {/* Minimal Links */}
                    <div className="flex flex-col items-center md:items-end gap-6 text-center md:text-right">
                        <div className="flex flex-wrap justify-center gap-12">
                            <button
                                onClick={() => navigate('/privacy')}
                                className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] hover:text-primary transition-all hover:tracking-[0.3em] duration-300"
                            >
                                Конфиденциальность
                            </button>
                        </div>
                        <div className="text-[10px] font-bold text-foreground/20 uppercase tracking-[0.2em]">
                            &copy; {new Date().getFullYear()} HICS. Все права защищены.
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};
