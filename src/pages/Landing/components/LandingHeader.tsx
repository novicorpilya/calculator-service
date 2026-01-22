import React, { useState, useEffect } from 'react';
import { ShieldCheck, ArrowRight, Menu, X, Instagram, Send, ArrowUpRight } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface LandingHeaderProps {
    onStart: () => void;
}

const NavLink = ({
    id,
    children,
    onClick,
}: {
    id: string;
    children: React.ReactNode;
    onClick?: () => void;
}) => (
    <a
        href={`#${id}`}
        className="text-[10px] font-black uppercase tracking-[0.25em] text-foreground/40 hover:text-primary transition-all duration-300 hover:tracking-[0.3em]"
        onClick={(e) => {
            e.preventDefault();
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
            if (onClick) onClick();
        }}
    >
        {children}
    </a>
);

export const LandingHeader: React.FC<LandingHeaderProps> = ({ onStart }) => {
    const [scrolled, setScrolled] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const menuItems = [
        { id: 'problems', label: 'Риски', num: '01' },
        { id: 'features', label: 'Платформа', num: '02' },
        { id: 'areas', label: 'Сферы', num: '03' },
        { id: 'faq', label: 'Вопросы', num: '04' },
        { id: 'contacts', label: 'Контакты', num: '05' },
    ];

    return (
        <>
            {/* Header - Always on top */}
            <header
                className={`fixed top-0 left-0 right-0 z-[200] transition-all duration-500 ${
                    scrolled || isOpen
                        ? 'py-3 bg-background/80 backdrop-blur-2xl border-b border-border-theme'
                        : 'py-5 bg-transparent'
                }`}
            >
                <div className="fluid-container flex justify-between items-center gap-4">
                    <div
                        className="flex items-center gap-2 shrink-0 group cursor-pointer"
                        onClick={() => {
                            if (isOpen) setIsOpen(false);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                    >
                        <div className="w-9 h-9 sm:w-11 sm:h-11 bg-white rounded-lg sm:rounded-xl flex items-center justify-center shadow-xl transition-transform group-hover:scale-110 duration-500">
                            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[#050506] stroke-[2.5]" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl sm:text-2xl font-[1000] tracking-tighter italic uppercase leading-none block text-foreground">
                                HICS
                            </span>
                            <span className="text-[6px] sm:text-[7px] font-black text-primary uppercase tracking-[0.6em] mt-1 leading-none">
                                Экосистема
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <nav className="hidden lg:flex items-center gap-8 mr-6">
                            {menuItems.map((item) => (
                                <NavLink key={item.id} id={item.id}>
                                    {item.label}
                                </NavLink>
                            ))}
                        </nav>

                        <div className="flex items-center gap-3 sm:gap-4">
                            <ThemeToggle />
                            <button
                                onClick={onStart}
                                className="group hidden sm:flex items-center gap-3 px-6 py-3.5 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                            >
                                <span className="italic">Старт</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>

                            <button
                                className={`
                                    lg:hidden w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300
                                    ${isOpen ? 'bg-primary text-white' : 'bg-foreground/5 text-foreground'}
                                `}
                                onClick={() => setIsOpen(!isOpen)}
                                aria-label={isOpen ? 'Закрыть меню' : 'Открыть меню'}
                            >
                                {isOpen ? <X size={22} /> : <Menu size={22} />}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* True Fullscreen Mobile Overlay */}
            <div
                className={`
                    fixed inset-0 w-full h-full bg-background z-[150] lg:hidden
                    flex flex-col transition-all duration-500 ease-[cubic-bezier(0.85,0,0.15,1)]
                    ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}
                `}
            >
                {/* Visual Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                    <div className="absolute top-[-10%] left-[-10%] w-full h-full bg-primary/20 blur-[150px] rounded-full" />
                    <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px]" />
                </div>

                {/* Content - Removed justify-center and reduced pt */}
                <div className="relative flex-1 flex flex-col pt-28 px-6 pb-8 overflow-y-auto">
                    {/* Navigation Links */}
                    <nav className="flex flex-col space-y-1">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setIsOpen(false);
                                    setTimeout(() => {
                                        document
                                            .getElementById(item.id)
                                            ?.scrollIntoView({ behavior: 'smooth' });
                                    }, 400);
                                }}
                                className="group w-full flex items-center justify-between py-4 border-b border-foreground/5 text-left active:bg-foreground/[0.02] transition-colors"
                            >
                                <div className="flex items-baseline gap-4">
                                    <span className="text-[10px] font-black text-primary tracking-widest leading-none">
                                        0{item.num}
                                    </span>
                                    <span className="text-[clamp(1.75rem,8vw,2.5rem)] font-[1000] italic uppercase tracking-tighter leading-none group-hover:text-primary transition-all">
                                        {item.label}
                                    </span>
                                </div>
                                <ArrowUpRight className="w-5 h-5 text-primary opacity-30 group-hover:opacity-100 transition-all" />
                            </button>
                        ))}
                    </nav>

                    {/* Bottom Utility Area */}
                    <div className="mt-12 space-y-8">
                        <div className="space-y-4">
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-foreground/30">
                                Связаться с разработкой
                            </p>
                            <div className="flex items-center gap-6">
                                <a
                                    href="tel:+79998887766"
                                    className="text-base font-black tracking-tight hover:text-primary transition-colors"
                                >
                                    +7 999 888-77-66
                                </a>
                                <div className="flex gap-4">
                                    <a
                                        href="#"
                                        className="p-2.5 rounded-lg bg-foreground/5 hover:bg-primary hover:text-white transition-all"
                                    >
                                        <Send size={16} />
                                    </a>
                                    <a
                                        href="#"
                                        className="p-2.5 rounded-lg bg-foreground/5 hover:bg-primary hover:text-white transition-all"
                                    >
                                        <Instagram size={16} />
                                    </a>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                onStart();
                                setIsOpen(false);
                            }}
                            className="bg-primary text-white w-full h-16 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-primary/30 active:scale-[0.98] transition-all italic"
                        >
                            Запустить расчет
                            <ArrowRight className="w-5 h-5" />
                        </button>

                        <div className="flex justify-between items-center pt-6 border-t border-foreground/5">
                            <p className="text-[8px] font-bold text-foreground/40 uppercase tracking-[0.2em] italic">
                                HICS &copy; 2026
                            </p>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500/50">
                                    Online
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
