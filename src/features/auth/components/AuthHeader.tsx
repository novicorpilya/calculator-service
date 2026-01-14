import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const AuthHeader: React.FC = () => {
    return (
        <div className="text-center mb-10 transition-colors">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-card backdrop-blur-md rounded-[1.5rem] border border-border-theme mb-6 shadow-xl relative group">
                <div className="absolute inset-0 bg-primary/20 blur-[20px] rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="w-10 h-10 bg-foreground rounded-[1rem] flex items-center justify-center shadow-lg relative z-10 transition-colors">
                    <ShieldCheck className="w-6 h-6 text-background" />
                </div>
            </div>
            <h1 className="text-4xl font-black text-foreground mb-2 tracking-tighter">HICS</h1>
            <p className="text-foreground/40 text-[10px] font-black uppercase tracking-[0.3em]">
                Inventory Intelligence Systems
            </p>
        </div>
    );
};
