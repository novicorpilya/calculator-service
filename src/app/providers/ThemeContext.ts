import { createContext } from 'react';
import { type ThemeConfig, type ThemePalette } from '@/features/theming/types';

export interface ThemeContextType {
    theme: ThemeConfig;
    setTheme: (theme: ThemeConfig) => void;
    updateColor: (mode: 'light' | 'dark', key: keyof ThemePalette, value: string) => void;
    resetTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
