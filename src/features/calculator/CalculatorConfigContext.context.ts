import { createContext } from 'react';
import { type CalculatorConfig } from './calculator-config.types';

export interface CalculatorConfigContextType {
    config: CalculatorConfig;
    updateConfig: (newConfig: CalculatorConfig) => void;
    resetConfig: () => void;
    isLoading: boolean;
}

export const CalculatorConfigContext = createContext<CalculatorConfigContextType | undefined>(undefined);
