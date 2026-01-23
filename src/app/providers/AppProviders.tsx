import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryProvider } from './QueryProvider';
import { AuthProvider } from './AuthProvider';
import { ThemeProvider } from './ThemeProvider';
import { ServiceProvider } from '@/app/di/ServiceContainer';
import { Toaster } from 'sonner';

interface AppProvidersProps {
    children: React.ReactNode;
}

/**
 * Combined App Providers component.
 * Organizes all global contexts in a clean hierarchy.
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
    return (
        <QueryProvider>
            <ThemeProvider>
                <AuthProvider>
                    <ServiceProvider>
                        <BrowserRouter>
                            {children}
                            <Toaster
                                position="top-right"
                                expand={false}
                                richColors
                                closeButton
                                theme="dark"
                                toastOptions={{
                                    style: {
                                        background: 'rgba(23, 23, 23, 0.8)',
                                        backdropFilter: 'blur(12px)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '24px',
                                    },
                                }}
                            />
                        </BrowserRouter>
                    </ServiceProvider>
                </AuthProvider>
            </ThemeProvider>
        </QueryProvider>
    );
};
