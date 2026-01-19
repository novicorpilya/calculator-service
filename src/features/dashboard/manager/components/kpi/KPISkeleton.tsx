import React from 'react';

export const KPISkeleton: React.FC = () => {
    return (
        <div className="space-y-10 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border-theme/50">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-foreground/5" />
                        <div className="h-8 w-48 bg-foreground/5 rounded-lg" />
                    </div>
                    <div className="h-3 w-32 bg-foreground/5 rounded-md" />
                </div>
                <div className="h-10 w-36 bg-foreground/5 rounded-2xl" />
            </div>

            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-48 rounded-[2rem] bg-foreground/5 border border-border-theme/50" />
                ))}
            </div>

            {/* Main Content Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="h-[400px] rounded-[2rem] bg-foreground/5 border border-border-theme/50" />
                <div className="h-[400px] rounded-[2rem] bg-foreground/5 border border-border-theme/50" />
            </div>
        </div>
    );
};
