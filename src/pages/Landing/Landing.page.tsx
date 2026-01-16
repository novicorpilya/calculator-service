import React, { memo } from 'react';
import { LandingHeader } from './components/LandingHeader';
import { LandingHero } from './components/LandingHero';
import { LandingProblems } from './components/LandingProblems';
import { LandingAreas } from './components/LandingAreas';
import { LandingFeatures } from './components/LandingFeatures';
import { LandingFooter } from './components/LandingFooter';

interface LandingProps {
    onStart: () => void;
}

export const Landing: React.FC<LandingProps> = memo(({ onStart }) => {
    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 overflow-x-hidden font-sans flex flex-col relative transition-colors duration-500">
            {/* Background Decorations - Optimized with pointer-events-none */}
            <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
            <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />

            <LandingHeader onStart={onStart} />

            <main className="flex-1">
                <LandingHero onStart={onStart} />
                <LandingProblems />
                <LandingAreas />
                <LandingFeatures onStart={onStart} />
            </main>

            <LandingFooter />
        </div>
    );
});
