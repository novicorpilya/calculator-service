import { useContext } from 'react';
import { CalculatorConfigContext } from '@/features/calculator/CalculatorConfigContext.context';

export const useCalculatorConfig = () => {
    const context = useContext(CalculatorConfigContext);
    if (!context) {
        throw new Error('useCalculatorConfig must be used within a CalculatorConfigProvider');
    }
    return context;
};
