import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const AuthHeader: React.FC = () => {
    return (
        <div className="text-center mb-10 group cursor-default selection:none">
            {/* Logo Icon Container */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-background/50 backdrop-blur-xl rounded-[2.25rem] border border-white/5 mb-8 shadow-2xl relative">
                <div className="absolute inset-0 bg-primary/20 blur-[30px] rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-2xl relative z-10 transition-transform hover:scale-110 duration-500">
                    <ShieldCheck className="w-7 h-7 text-[#050506] stroke-[2.5]" />
                </div>
            </div>
            
            {/* Text Identity */}
            <h1 className="text-5xl font-[1000] text-foreground tracking-[-0.05em] italic">
                HICS
            </h1>
            <p className="text-primary text-[10px] font-black uppercase tracking-[0.6em] mt-3">
                Экосистема
            </p>
        </div>
    );
};
