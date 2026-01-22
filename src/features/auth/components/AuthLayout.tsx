import React from 'react';
import { AuthHeader } from './AuthHeader';
import { AuthFooter } from './AuthFooter';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AuthLayoutProps {
    children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background relative flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden selection:bg-primary/30">
            {/* Absolute Back Button - Repositioned for mobile */}
            <button
                onClick={() => navigate('/')}
                className="fixed top-4 left-4 sm:top-10 sm:left-10 z-[100] flex items-center gap-2 sm:gap-3 px-4 py-2 sm:px-6 sm:py-3 bg-card/80 backdrop-blur-md border border-border-theme rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:border-primary transition-all active:scale-95 group shadow-xl"
            >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:-translate-x-1" />
                <span className="hidden xs:inline">На главную</span>
                <span className="xs:hidden">Назад</span>
            </button>

            {/* Immersive Atmospheric Ambient */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] sm:w-[60vw] h-[90vw] sm:h-[60vw] bg-primary/10 rounded-full blur-[80px] sm:blur-[160px] pointer-events-none animate-pulse duration-[8000ms]" />
            <div className="absolute -top-24 -left-24 w-64 h-64 sm:w-96 sm:h-96 bg-indigo-500/10 blur-[80px] sm:blur-[120px] rounded-full pointer-events-none" />

            <div className="w-full max-w-[480px] relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 mt-12 sm:mt-0">
                <AuthHeader />

                <div className="bg-card/40 backdrop-blur-3xl border border-border-theme shadow-2xl rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-12 relative overflow-hidden">
                    {/* Subtle Internal Glow */}
                    <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-primary/5 blur-[80px] sm:blur-[100px] pointer-events-none" />

                    <div className="relative z-10">{children}</div>
                </div>

                <AuthFooter />
            </div>
        </div>
    );
};
