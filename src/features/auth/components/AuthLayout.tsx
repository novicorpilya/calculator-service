import React from 'react';
import { AuthHeader } from './AuthHeader';
import { AuthFooter } from './AuthFooter';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
    const navigate = useNavigate();
    
    return (
        <div className="min-h-screen bg-background relative flex items-center justify-center p-6 overflow-hidden selection:bg-primary/30">
            {/* Absolute Back Button */}
            <button
                onClick={() => navigate('/')}
                className="absolute top-10 left-10 z-50 flex items-center gap-3 px-6 py-3 bg-card border border-border-theme rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-primary transition-all active:scale-95 group shadow-xl"
            >
                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                На главную
            </button>

            {/* Immersive Atmospheric Ambient */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-primary/10 rounded-full blur-[160px] pointer-events-none animate-pulse duration-[8000ms]" />
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
            
            <div className="w-full max-w-[520px] relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <AuthHeader />

                <div className="bg-card/40 backdrop-blur-3xl border border-border-theme shadow-2xl rounded-[2.5rem] p-8 sm:p-12 relative overflow-hidden">
                    {/* Subtle Internal Glow - Controlled via local state or simplified */}
                    <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-primary/5 blur-[100px] pointer-events-none transition-colors duration-1000" />
                    
                    <div className="relative z-10">
                        <div className="mb-12">
                            <h2 className="text-4xl font-[1000] text-foreground mb-4 tracking-[-0.04em] italic leading-none">
                                {title}
                            </h2>
                            {subtitle && (
                                <p className="text-foreground/40 text-[10px] font-black tracking-[0.25em] uppercase">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                        {children}
                    </div>
                </div>

                <AuthFooter />
            </div>
        </div>
    );
};
