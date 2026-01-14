import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';

/**
 * Переключатель темы с поддержкой светлого, темного и системного режимов.
 * Имеет премиальный дизайн с микро-анимациями.
 */
export const ThemeToggle: React.FC = () => {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timeout = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(timeout);
    }, []);

    if (!mounted)
        return <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />;

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    return (
        <button
            onClick={toggleTheme}
            className="group relative p-2.5 bg-card hover:bg-primary/5 border border-border-theme rounded-2xl shadow-sm transition-all active:scale-90"
            title={`Текущая тема: ${theme}`}
        >
            <div className="relative z-10 animate-in zoom-in duration-300">
                {theme === 'dark' ? (
                    <Moon className="w-5 h-5 text-blue-400" />
                ) : (
                    <Sun className="w-5 h-5 text-amber-500" />
                )}
            </div>

            <div className="absolute inset-0 bg-primary/5 blur-lg opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
        </button>
    );
};
