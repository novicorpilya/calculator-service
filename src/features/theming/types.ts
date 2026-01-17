export interface ThemePalette {
    primary: string;
    background: string;
    foreground: string;
    card: string;
    border: string;
}

export interface ThemeConfig {
    id: string;
    name: string;
    mode: 'light' | 'dark' | 'system';
    colors: {
        light: ThemePalette;
        dark: ThemePalette;
    };
    logo?: string;
    appName?: string;
    borderRadius?: string; // e.g. '0.5rem', '1rem', '2rem'
}

export const DEFAULT_THEME: ThemeConfig = {
    id: 'default',
    name: 'Default',
    mode: 'system',
    appName: 'HORECA CALC',
    colors: {
        light: {
            background: '#ffffff',
            foreground: '#0f172a',
            card: '#ffffff',
            border: '#f1f5f9',
            primary: '#2563eb', // blue-600
        },
        dark: {
            background: '#020617', // slate-950
            foreground: '#f8fafc', // slate-50
            card: '#0f172a', // slate-900
            border: '#1e293b', // slate-800
            primary: '#3b82f6', // blue-500
        },
    },
    borderRadius: '1.5rem',
};
