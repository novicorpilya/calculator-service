import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { type ThemeConfig, DEFAULT_THEME, type ThemePalette } from '@/features/theming/types';

import { ThemeContext } from './ThemeContext';

const applyTheme = (config: ThemeConfig) => {
    const root = document.documentElement;
    
    // Handle Dark/Light Mode
    if (config.mode === 'system') {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (systemDark) root.classList.add('dark');
        else root.classList.remove('dark');
    } else if (config.mode === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }

    // Apply Variables
    updateStyleTag(config);
};

const updateStyleTag = (config: ThemeConfig) => {
    let styleTag = document.getElementById('theme-overrides');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'theme-overrides';
        document.head.appendChild(styleTag);
    }

    const css = `
        :root {
            --background: ${config.colors.light.background};
            --foreground: ${config.colors.light.foreground};
            --card: ${config.colors.light.card};
            --border-theme: ${config.colors.light.border};
            --primary: ${config.colors.light.primary};
        }
        .dark {
            --background: ${config.colors.dark.background};
            --foreground: ${config.colors.dark.foreground};
            --card: ${config.colors.dark.card};
            --border-theme: ${config.colors.dark.border};
            --primary: ${config.colors.dark.primary};
        }
        
        .btn-premium, .glass-card, .rounded-2xl {
            border-radius: ${config.borderRadius || '1.5rem'} !important;
        }
        .input-premium, input, select {
            border-radius: ${config.borderRadius ? `calc(${config.borderRadius} * 0.75)` : '1rem'} !important;
        }
    `;
    
    styleTag.innerHTML = css;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Initialize from localStorage or default
    const [theme, setThemeState] = useState<ThemeConfig>(() => {
        const saved = localStorage.getItem('app_theme_config');
        return saved ? JSON.parse(saved) : DEFAULT_THEME;
    });

    useEffect(() => {
        localStorage.setItem('app_theme_config', JSON.stringify(theme));
        applyTheme(theme);
    }, [theme]);

    const updateColor = useCallback((mode: 'light' | 'dark', key: keyof ThemePalette, value: string) => {
        setThemeState(prev => ({
            ...prev,
            colors: {
                ...prev.colors,
                [mode]: {
                    ...prev.colors[mode],
                    [key]: value
                }
            }
        }));
    }, []);

    const resetTheme = useCallback(() => {
        setThemeState(DEFAULT_THEME);
    }, []);

    const value = useMemo(() => ({
        theme,
        setTheme: setThemeState,
        updateColor,
        resetTheme
    }), [theme, updateColor, resetTheme]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

