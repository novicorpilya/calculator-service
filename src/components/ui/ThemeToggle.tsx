import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';

/**
 * Переключатель темы с поддержкой View Transitions API.
 * Реализует эффект "циркулярной маски" при смене темы для Senior UX.
 */
export const ThemeToggle: React.FC = () => {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    if (!mounted)
        return <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />;

    const toggleTheme = (event: React.MouseEvent) => {
        // Проверка поддержки View Transitions API
        if (!document.startViewTransition) {
            setTheme(theme === 'dark' ? 'light' : 'dark');
            return;
        }

        const x = event.clientX;
        const y = event.clientY;
        const endRadius = Math.hypot(
            Math.max(x, innerWidth - x),
            Math.max(y, innerHeight - y)
        );

        const transition = document.startViewTransition(() => {
            document.documentElement.classList.add('view-transitioning');
            setTheme(theme === 'dark' ? 'light' : 'dark');
        });

        transition.finished.finally(() => {
            document.documentElement.classList.remove('view-transitioning');
        });

        transition.ready.then(() => {
            const clipPath = [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${endRadius}px at ${x}px ${y}px)`,
            ];
            
            document.documentElement.animate(
                {
                    clipPath: clipPath,
                },
                {
                    duration: 500,
                    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                    pseudoElement: '::view-transition-new(root)',
                }
            );
        });
    };

    return (
        <button
            onClick={toggleTheme}
            className="group relative p-3 bg-card hover:bg-primary/5 border border-border-theme rounded-2xl shadow-sm transition-all active:scale-90"
            title={`Текущая тема: ${theme === 'dark' ? 'Темная' : 'Светлая'}`}
        >
            <div className="relative z-10 transition-transform duration-500 group-active:rotate-12">
                {theme === 'dark' ? (
                    <Moon className="w-5 h-5 text-blue-400 fill-blue-400/20 animate-in zoom-in spin-in-90 duration-500" />
                ) : (
                    <Sun className="w-5 h-5 text-amber-500 fill-amber-500/20 animate-in zoom-in spin-in-45 duration-500" />
                )}
            </div>

            <div className="absolute inset-0 bg-primary/5 blur-lg opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
        </button>
    );
};
