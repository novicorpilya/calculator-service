import React, { useState, useEffect } from 'react';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface LandingHeaderProps {
    onStart: () => void;
}

const NavLink = ({ id, children }: { id: string; children: React.ReactNode }) => (
    <a
        href={`#${id}`}
        className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 hover:text-primary transition-all duration-300 hover:tracking-[0.25em]"
        onClick={(e) => {
            e.preventDefault();
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
        }}
    >
        {children}
    </a>
);

export const LandingHeader: React.FC<LandingHeaderProps> = ({ onStart }) => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header 
            className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
                scrolled 
                    ? 'py-4 bg-background/80 backdrop-blur-2xl border-b border-border-theme shadow-lg shadow-black/5' 
                    : 'py-8 bg-transparent'
            }`}
        >
            <div className="fluid-container flex justify-between items-center gap-4">
                <div
                    className="flex items-center gap-4 shrink-0 group cursor-pointer"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                    <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-xl transition-transform group-hover:scale-110 duration-500">
                        <ShieldCheck className="w-6 h-6 text-[#050506] stroke-[2.5]" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-2xl font-[1000] tracking-tighter italic uppercase leading-none block text-foreground">
                            HICS
                        </span>
                        <span className="text-[7px] font-black text-primary uppercase tracking-[0.6em] mt-1 leading-none">
                            Экосистема
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-10">
                    <nav className="hidden lg:flex items-center gap-10">
                        <NavLink id="problems">Риски</NavLink>
                        <NavLink id="features">Платформа</NavLink>
                        <NavLink id="areas">Сферы</NavLink>
                        <NavLink id="faq">Вопросы-ответы</NavLink>
                        <NavLink id="contacts">Контакты</NavLink>
                    </nav>
                    
                    <div className="flex items-center gap-3 sm:gap-6">
                        <ThemeToggle />
                        <div className="h-4 w-[1px] bg-border-theme hidden sm:block" />
                        <button
                            onClick={onStart}
                            className="group flex items-center gap-3 px-8 py-4 rounded-xl bg-primary text-white text-[11px] font-[1000] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
                        >
                            <span className="italic">Старт</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};
