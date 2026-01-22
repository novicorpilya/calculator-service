import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const AuthHeader: React.FC = () => {
    return (
        <div className="text-center mb-6 sm:mb-10 group cursor-default selection:none">
            {/* Logo Icon Container */}
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-background/50 backdrop-blur-xl rounded-[1.5rem] sm:rounded-[2.25rem] border border-white/5 mb-6 sm:mb-8 shadow-2xl relative">
                <div className="absolute inset-0 bg-primary/20 blur-[20px] sm:blur-[30px] rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-2xl relative z-10 transition-transform hover:scale-110 duration-500">
                    <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-[#050506] stroke-[2.5]" />
                </div>
            </div>

            {/* Text Identity */}
            <h1 className="text-4xl sm:text-5xl font-[1000] text-foreground tracking-[-0.05em] italic leading-tight">
                HICS
            </h1>
            <p className="text-primary text-[8px] sm:text-[10px] font-black uppercase tracking-[0.4em] sm:tracking-[0.6em] mt-2 sm:mt-3">
                Экосистема
            </p>
        </div>
    );
};
