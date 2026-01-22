import React, { useEffect, useRef, useState } from 'react';

type AnimationVariant =
    | 'fade-up'
    | 'fade-down'
    | 'fade-left'
    | 'fade-right'
    | 'zoom-in'
    | 'blur-in'
    | 'slide-up';

interface AnimateOnScrollProps {
    children: React.ReactNode;
    variant?: AnimationVariant;
    delay?: number; // in ms
    duration?: number; // in ms
    threshold?: number; // 0-1
    once?: boolean;
    className?: string;
    staggerChildren?: number; // delay between children in ms
}

/**
 * Premium scroll-triggered animation component.
 * Uses IntersectionObserver for performance.
 * Respects prefers-reduced-motion.
 */
export const AnimateOnScroll: React.FC<AnimateOnScrollProps> = ({
    children,
    variant = 'fade-up',
    delay = 0,
    duration = 800,
    threshold = 0.15,
    once = true,
    className = '',
    staggerChildren,
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        // Check for reduced motion preference
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReducedMotion(mediaQuery.matches);

        const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    useEffect(() => {
        if (prefersReducedMotion) {
            setIsVisible(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    if (once && ref.current) {
                        observer.unobserve(ref.current);
                    }
                } else if (!once) {
                    setIsVisible(false);
                }
            },
            { threshold, rootMargin: '0px 0px -50px 0px' }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [threshold, once, prefersReducedMotion]);

    const baseStyles: React.CSSProperties = {
        transitionProperty: 'opacity, transform, filter',
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        transitionDelay: `${delay}ms`,
    };

    const getInitialStyles = (): React.CSSProperties => {
        if (prefersReducedMotion) return {};

        const variants: Record<AnimationVariant, React.CSSProperties> = {
            'fade-up': { opacity: 0, transform: 'translateY(40px)' },
            'fade-down': { opacity: 0, transform: 'translateY(-40px)' },
            'fade-left': { opacity: 0, transform: 'translateX(40px)' },
            'fade-right': { opacity: 0, transform: 'translateX(-40px)' },
            'zoom-in': { opacity: 0, transform: 'scale(0.9)' },
            'blur-in': { opacity: 0, filter: 'blur(10px)', transform: 'translateY(20px)' },
            'slide-up': { opacity: 0, transform: 'translateY(60px)' },
        };
        return variants[variant];
    };

    const getVisibleStyles = (): React.CSSProperties => ({
        opacity: 1,
        transform: 'translateY(0) translateX(0) scale(1)',
        filter: 'blur(0px)',
    });

    // For staggered children, we use CSS custom properties
    const containerStyle: React.CSSProperties = staggerChildren
        ? ({ '--stagger-delay': `${staggerChildren}ms` } as React.CSSProperties)
        : {
              ...baseStyles,
              ...(isVisible ? getVisibleStyles() : getInitialStyles()),
          };

    return (
        <div ref={ref} className={className} style={containerStyle}>
            {children}
        </div>
    );
};

/**
 * Wrapper for staggered list animations
 */
export const StaggerContainer: React.FC<{
    children: React.ReactNode;
    staggerDelay?: number;
    className?: string;
}> = ({ children, staggerDelay = 100, className = '' }) => {
    return (
        <AnimateOnScroll variant="fade-up" delay={staggerDelay} className={className}>
            {children}
        </AnimateOnScroll>
    );
};
