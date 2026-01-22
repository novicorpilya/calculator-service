import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular' | 'card';
    width?: string | number;
    height?: string | number;
    lines?: number;
    animate?: boolean;
}

/**
 * Universal Skeleton component for loading states
 * Improves perceived performance and prevents layout shift
 */
export const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    variant = 'rectangular',
    width,
    height,
    lines = 1,
    animate = true,
}) => {
    const baseClasses = `bg-foreground/[0.06] ${animate ? 'animate-pulse' : ''}`;

    const variantClasses = {
        text: 'rounded-md h-4',
        circular: 'rounded-full',
        rectangular: 'rounded-xl',
        card: 'rounded-[2rem] border border-border-theme/30',
    };

    const style: React.CSSProperties = {
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
    };

    if (variant === 'text' && lines > 1) {
        return (
            <div className={`space-y-2 ${className}`}>
                {Array.from({ length: lines }).map((_, i) => (
                    <div
                        key={i}
                        className={`${baseClasses} ${variantClasses.text}`}
                        style={{
                            width: i === lines - 1 ? '60%' : '100%',
                            ...style,
                        }}
                    />
                ))}
            </div>
        );
    }

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={style}
            role="status"
            aria-label="Загрузка..."
        />
    );
};

/**
 * Skeleton for project/calculation cards
 */
export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div
        className={`bg-card border border-border-theme/30 rounded-[2rem] p-6 sm:p-8 space-y-6 animate-pulse ${className}`}
    >
        {/* Header */}
        <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
                <Skeleton variant="circular" width={48} height={48} animate={false} />
                <div className="space-y-2">
                    <Skeleton variant="text" width={80} animate={false} />
                    <Skeleton variant="text" width={120} animate={false} />
                </div>
            </div>
            <Skeleton
                variant="rectangular"
                width={80}
                height={28}
                className="rounded-full"
                animate={false}
            />
        </div>

        {/* Title */}
        <div className="space-y-2">
            <Skeleton variant="text" width="90%" animate={false} />
            <Skeleton variant="text" width="60%" animate={false} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border-theme/30">
            <div className="space-y-2">
                <Skeleton variant="text" width={60} animate={false} />
                <Skeleton variant="rectangular" height={28} animate={false} />
            </div>
            <div className="space-y-2">
                <Skeleton variant="text" width={60} animate={false} />
                <Skeleton variant="rectangular" height={28} animate={false} />
            </div>
        </div>
    </div>
);

/**
 * Skeleton for stats/KPI cards
 */
export const StatCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div
        className={`bg-card border border-border-theme/30 rounded-[2rem] p-6 space-y-4 animate-pulse ${className}`}
    >
        <div className="flex items-center justify-between">
            <Skeleton variant="circular" width={48} height={48} animate={false} />
            <Skeleton variant="circular" width={24} height={24} animate={false} />
        </div>
        <div className="space-y-2">
            <Skeleton variant="text" width={100} animate={false} />
            <Skeleton variant="rectangular" height={40} width="70%" animate={false} />
            <Skeleton variant="text" width={80} animate={false} />
        </div>
    </div>
);

/**
 * Skeleton for chart containers
 */
export const ChartSkeleton: React.FC<{ className?: string; height?: number }> = ({
    className = '',
    height = 300,
}) => (
    <div
        className={`bg-card border border-border-theme/30 rounded-[2rem] p-6 sm:p-8 animate-pulse ${className}`}
    >
        <div className="flex items-center justify-between mb-6">
            <div className="space-y-2">
                <Skeleton variant="text" width={150} animate={false} />
                <Skeleton variant="text" width={100} animate={false} />
            </div>
            <Skeleton
                variant="rectangular"
                width={120}
                height={36}
                className="rounded-xl"
                animate={false}
            />
        </div>
        <Skeleton variant="rectangular" height={height} className="rounded-2xl" animate={false} />
    </div>
);

/**
 * Skeleton for table rows
 */
export const TableRowSkeleton: React.FC<{ columns?: number; className?: string }> = ({
    columns = 5,
    className = '',
}) => (
    <div
        className={`flex items-center gap-4 p-4 border-b border-border-theme/20 animate-pulse ${className}`}
    >
        {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} variant="text" className="flex-1" animate={false} />
        ))}
    </div>
);

/**
 * Full page loading skeleton
 */
export const PageSkeleton: React.FC = () => (
    <div className="space-y-8 animate-pulse">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-3">
                <Skeleton variant="text" width={200} height={32} animate={false} />
                <Skeleton variant="text" width={150} animate={false} />
            </div>
            <Skeleton
                variant="rectangular"
                width={180}
                height={48}
                className="rounded-2xl"
                animate={false}
            />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((i) => (
                <StatCardSkeleton key={i} />
            ))}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            <ChartSkeleton />
            <ChartSkeleton />
        </div>
    </div>
);
