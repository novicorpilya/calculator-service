import React from 'react';
import { ShieldCheck } from 'lucide-react';

/**
 * GlobalLoader - Senior Production Ready (HICS Edition)
 * Дизайн соответствует корпоративному стилю HICS:
 * - Использование логотипа ShieldCheck
 * - Тексты на русском языке
 * - Премиальные анимации и эффекты свечения
 */
export const GlobalLoader: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#050506] flex items-center justify-center relative overflow-hidden">
            {/* Атмосферное фоновое свечение */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-primary/10 rounded-full blur-[160px] animate-pulse duration-[4000ms]" />
            </div>

            <div className="relative z-10 flex flex-col items-center">
                {/* Логотип HICS */}
                <div className="mb-12 relative group animate-in fade-in zoom-in duration-1000">
                    <div className="absolute inset-0 bg-primary/20 blur-[40px] rounded-full opacity-60" />
                    <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.1)] relative z-10">
                        <ShieldCheck className="w-14 h-14 text-[#050506] stroke-[2.5]" />
                    </div>
                </div>

                {/* Текстовая идентификация */}
                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="overflow-hidden mb-3">
                        <h1 className="text-5xl sm:text-6xl font-[1000] tracking-[-0.05em] text-white flex gap-3 animate-brand-reveal">
                            <span>HICS</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-4 w-full px-4 opacity-0 animate-fade-in delay-700 fill-mode-forwards">
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.8em] whitespace-nowrap">
                            Экосистема
                        </p>
                        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-white/20 to-transparent" />
                    </div>
                </div>

                {/* Современный индикатор прогресса */}
                <div className="relative w-72 h-[4px] bg-white/5 rounded-full overflow-hidden shadow-2xl border border-white/5">
                    <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary/40 via-primary to-primary/40 w-full animate-high-end-loader shadow-[0_0_20px_rgba(99,102,241,0.6)]" />
                </div>

                {/* Состояние системы на русском */}
                <div className="mt-8 flex items-center gap-3 opacity-0 animate-fade-in delay-1000 fill-mode-forwards">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
                    <span className="text-[11px] font-black text-white/30 uppercase tracking-[0.3em]">
                        Инициализация экосистемы
                    </span>
                </div>
            </div>

            {/* Декоративный футер */}
            <div className="absolute bottom-12 flex flex-col items-center gap-4 opacity-10">
                <div className="h-[1px] w-24 bg-white" />
                <span className="text-[9px] font-black tracking-[0.5em] text-white uppercase italic">
                    HICS Infrastructure
                </span>
            </div>

            <style>{`
                @keyframes brand-reveal {
                    0% { transform: translateY(10px); opacity: 0; }
                    100% { transform: translateY(0); opacity: 1; }
                }
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes high-end-loader {
                    0% { transform: translateX(-100%) scaleX(0.2); }
                    45% { transform: translateX(0%) scaleX(0.7); }
                    55% { transform: translateX(0%) scaleX(0.7); }
                    100% { transform: translateX(100%) scaleX(0.2); }
                }
                .animate-brand-reveal {
                    animation: brand-reveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
                }
                .animate-fade-in {
                    animation: fade-in 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both;
                }
                .animate-high-end-loader {
                    animation: high-end-loader 2.8s cubic-bezier(0.65, 0, 0.35, 1) infinite;
                }
                .delay-700 { animation-delay: 100ms; }
                .delay-1000 { animation-delay: 200ms; }
                .fill-mode-forwards { animation-fill-mode: forwards; }
            `}</style>
        </div>
    );
};
