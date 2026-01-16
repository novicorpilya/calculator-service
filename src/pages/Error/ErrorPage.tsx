import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, FileSearch, Hammer, ArrowLeft, Home } from 'lucide-react';

interface ErrorPageProps {
    code: '404' | '403' | '500' | 'maintenance';
    title: string;
    description: string;
    showHomeButton?: boolean;
    showBackButton?: boolean;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({
    code,
    title,
    description,
    showHomeButton = true,
    showBackButton = true,
}) => {
    const navigate = useNavigate();

    const getIcon = () => {
        switch (code) {
            case '404':
                return <FileSearch className="w-12 h-12 text-blue-500" />;
            case '403':
                return <ShieldAlert className="w-12 h-12 text-amber-500" />;
            case 'maintenance':
                return <Hammer className="w-12 h-12 text-slate-500" />;
            default:
                return <ShieldAlert className="w-12 h-12 text-red-500" />;
        }
    };

    const getBgColor = () => {
        switch (code) {
            case '404': return 'bg-blue-500/10';
            case '403': return 'bg-amber-500/10';
            case 'maintenance': return 'bg-slate-500/10';
            default: return 'bg-red-500/10';
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
            <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
                {/* Visual Representation */}
                <div className="relative">
                    <div className={`w-24 h-24 ${getBgColor()} rounded-3xl flex items-center justify-center mx-auto rotate-12 transition-transform hover:rotate-0 duration-500`}>
                        {getIcon()}
                    </div>
                    <div className="absolute top-0 right-1/2 translate-x-12 -translate-y-2">
                         <span className="px-3 py-1 bg-background border border-border-theme rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                            Status {code}
                         </span>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-3">
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground italic">
                        {title}
                    </h1>
                    <p className="text-foreground/50 text-sm leading-relaxed font-medium">
                        {description}
                    </p>
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                    {showBackButton && (
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center justify-center gap-2 px-6 py-4 bg-card border border-border-theme rounded-2xl font-bold text-sm hover:border-primary/50 transition-all active:scale-95"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Назад
                        </button>
                    )}
                    {showHomeButton && (
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl font-bold text-sm hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all active:scale-95 shadow-xl"
                        >
                            <Home className="w-4 h-4" />
                            На главную
                        </button>
                    )}
                </div>

                {/* Footer Decoration */}
                <div className="pt-12 opacity-10 flex justify-center gap-8 grayscale">
                     <span className="text-4xl font-black italic select-none">HORECA</span>
                     <span className="text-4xl font-black italic select-none">CALC</span>
                </div>
            </div>
        </div>
    );
};
