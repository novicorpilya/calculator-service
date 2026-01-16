import React, { useState, useLayoutEffect, useRef } from 'react';
import { ResponsiveContainer } from 'recharts';

interface ChartContainerProps {
    children: React.ReactElement;
    height: number | string;
    id: string;
    className?: string;
}

/**
 * Senior-level Chart Wrapper
 * 
 * Features:
 * 1. Prevents Recharts warnings (-1 width/height) by deferring render until dimensions are stable.
 * 2. Enforces min-h-0/min-w-0 for correct Flexbox/Grid behavior.
 * 3. Centralizes ResponsiveContainer configuration.
 * 4. Provides a stable layout height to prevent layout shift.
 */
export const ChartContainer: React.FC<ChartContainerProps> = ({ 
    children, 
    height, 
    id,
    className = "" 
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

    useLayoutEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            const { width, height: rectHeight } = entry.contentRect;
            
            if (width > 0 && rectHeight > 0) {
                // Stabilize dimensions before passing to charts
                requestAnimationFrame(() => {
                    setDimensions({ width, height: rectHeight });
                });
            }
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div 
            ref={containerRef}
            className={`w-full relative min-h-0 min-w-0 ${className}`}
            style={{ height, minHeight: typeof height === 'number' ? `${height}px` : height }}
        >
            {dimensions ? (
                <ResponsiveContainer 
                    id={id} 
                    width={dimensions.width} 
                    height={dimensions.height}
                >
                    {children}
                </ResponsiveContainer>
            ) : (
                <div className="w-full h-full flex items-center justify-center opacity-0">
                    {/* Measurement placeholder */}
                </div>
            )}
        </div>
    );
};
