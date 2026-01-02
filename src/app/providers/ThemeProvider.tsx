import React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

interface ThemeProviderProps {
    children: React.ReactNode
}

/**
 * Провайдер темы для автоматического переключения светлой/темной темы.
 * Использует библиотеку next-themes для корректной работы с системными настройками и local storage.
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            {children}
        </NextThemesProvider>
    )
}
