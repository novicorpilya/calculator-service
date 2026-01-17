import React, { useEffect, useState } from 'react';
import { type CalculatorConfig, DEFAULT_CALCULATOR_CONFIG } from './calculator-config.types';
import { SettingsService } from '@/services/settings.service';
import { toast } from 'sonner';
import { CalculatorConfigContext } from './CalculatorConfigContext.context';

export const CalculatorConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [config, setConfig] = useState<CalculatorConfig>(DEFAULT_CALCULATOR_CONFIG);
    const [isLoading, setIsLoading] = useState(true);

    // Initial Load & Subscription
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const remoteConfig = await SettingsService.getCalculatorConfig();
                setConfig(remoteConfig);
            } catch (err) {
                console.error('Failed to load settings', err);
                toast.error('Failed to load calculator settings');
            } finally {
                setIsLoading(false);
            }
        };

        loadSettings();

        // Realtime Subscription
        const channel = SettingsService.subscribeToConfigChanges((newConfig) => {
            setConfig(newConfig);
            toast.info('Calculator config updated externally');
        });

        return () => {
            channel.unsubscribe();
        };
    }, []);

    const updateConfig = async (newConfig: CalculatorConfig) => {
        // Optimistic Update
        setConfig(newConfig);
        try {
            await SettingsService.saveCalculatorConfig(newConfig);
        } catch (err) {
            console.error('Failed to save settings', err);
            toast.error('Failed to save settings');
        }
    };

    const resetConfig = async () => {
        const def = DEFAULT_CALCULATOR_CONFIG;
        setConfig(def);
        await SettingsService.saveCalculatorConfig(def);
    };

    return (
        <CalculatorConfigContext.Provider value={{ config, updateConfig, resetConfig, isLoading }}>
            {children}
        </CalculatorConfigContext.Provider>
    );
};

