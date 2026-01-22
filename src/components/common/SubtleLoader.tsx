import React, { useState, useEffect } from 'react';

interface SubtleLoaderProps {
    delay?: number;
}

/**
 * SubtleLoader - A transparent, elegant loader that only appears after a short delay.
 * Prevents "flickering" on fast transitions.
 */
export const SubtleLoader: React.FC<SubtleLoaderProps> = ({ delay = 400 }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/20 backdrop-blur-sm animate-in fade-in duration-500">
            <div className="relative flex flex-col items-center">
                <div className="w-12 h-12 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
                <div className="absolute inset-0 blur-[20px] bg-primary/10 rounded-full animate-pulse" />

                <span className="mt-6 text-[10px] font-black text-foreground/40 uppercase tracking-[0.3em] animate-pulse">
                    Синхронизация...
                </span>
            </div>
        </div>
    );
};
