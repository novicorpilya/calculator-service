import React, { memo } from 'react';
import { LandingHeader } from './components/LandingHeader';
import { LandingHero } from './components/LandingHero';
const LandingProblems = React.lazy(() =>
    import('./components/LandingProblems').then((m) => ({ default: m.LandingProblems }))
);
const LandingAreas = React.lazy(() =>
    import('./components/LandingAreas').then((m) => ({ default: m.LandingAreas }))
);
const LandingFeatures = React.lazy(() =>
    import('./components/LandingFeatures').then((m) => ({ default: m.LandingFeatures }))
);
const LandingFAQ = React.lazy(() =>
    import('./components/LandingFAQ').then((m) => ({ default: m.LandingFAQ }))
);
const LandingContact = React.lazy(() =>
    import('./components/LandingContact').then((m) => ({ default: m.LandingContact }))
);
const LandingFooter = React.lazy(() =>
    import('./components/LandingFooter').then((m) => ({ default: m.LandingFooter }))
);

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

                <React.Suspense fallback={<div className="h-96" />}>
                    <LandingProblems />
                    <LandingAreas />
                    <LandingFeatures onStart={onStart} />
                    <LandingFAQ />
                    <LandingContact />
                </React.Suspense>
            </main>

            <React.Suspense fallback={<div className="h-20" />}>
                <LandingFooter />
            </React.Suspense>
        </div>
    );
});
