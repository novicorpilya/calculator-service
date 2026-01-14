import React from 'react';
import { AuthHeader } from './AuthHeader';
import { AuthFooter } from './AuthFooter';

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
    return (
        <div className="min-h-screen bg-background relative flex items-center justify-center p-4 transition-colors duration-500">
            {/* Soft decorative elements */}
            <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="w-full max-w-[480px] relative z-10 animate-in fade-in zoom-in-95 duration-700">
                <AuthHeader />

                <div className="glass-card mb-8">
                    <div className="mb-10">
                        <h2 className="text-3xl font-black text-foreground mb-4 tracking-tight leading-tight">
                            {title}
                        </h2>
                        {subtitle && (
                            <p className="text-foreground/70 text-sm font-bold tracking-wide uppercase">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {children}
                </div>

                <AuthFooter />
            </div>
        </div>
    );
};
