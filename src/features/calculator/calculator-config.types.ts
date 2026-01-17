import { ZONE_TYPES, INTENSITY_LEVELS, OBJECT_TYPES } from '../dashboard/dashboard.types';

export interface FormulaConfig {
    isAdvanced: boolean;
    customFormula: string; // e.g. "max(area * norm_area, staff * norm_staff) * k_zone"
    baseMethod: 'max' | 'sum' | 'avg';
    factors: {
        area: boolean;
        staff: boolean;
        visitors: boolean;
    };
    multipliers: {
        zone: boolean;
        intensity: boolean;
        reserve: boolean;
    };
}

export interface CalculatorConfig {
    formula: FormulaConfig;
    objectTypes: { value: string; label: string; tiers: number[] }[];
    zoneTypes: { value: string; label: string; color: string; coeff: number }[];
    intensityLevels: { value: string; label: string; coeff: number; durabilityThreshold: number }[];
    reserveCoeffs: {
        low: number;
        medium: number;
        high: number;
        default: number;
    };
    durabilityThresholds: Record<string, number>;
}

export const DEFAULT_CALCULATOR_CONFIG: CalculatorConfig = {
    formula: {
        isAdvanced: false,
        customFormula: 'max(q_area, q_staff, q_visitors) * k_zone * k_intensity * (1 + k_reserve)',
        baseMethod: 'max',
        factors: { area: true, staff: true, visitors: true },
        multipliers: { zone: true, intensity: true, reserve: true },
    },
    objectTypes: OBJECT_TYPES.map(t => ({ ...t, tiers: [1, 2] })), // Default tier mapping
    zoneTypes: ZONE_TYPES.map(z => ({ 
        value: z.value, 
        label: z.label, 
        color: z.color, 
        coeff: 1.0 // Default, would need to map from ZONE_COEFFS if available
    })),
    intensityLevels: INTENSITY_LEVELS.map(l => ({
        value: l.value,
        label: l.label,
        coeff: l.coeff,
        durabilityThreshold: 0
    })),
    reserveCoeffs: {
        low: 0.1,
        medium: 0.2,
        high: 0.3,
        default: 0.2
    },
    durabilityThresholds: {
        high: 50,
        very_high: 100,
        critical: 200
    }
};
