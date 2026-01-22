export interface BusinessRules {
    TAX_RATE: number; // e.g. 1.20 for 20%
    DEFAULT_MARGIN: number; // e.g. 1.10 for 10%
    MIN_PROFITABLE_MARGIN: number; // e.g. 1.05 for 5%
    SLA_WORKDAYS: number; // Days to complete expert review
}

export const DEFAULT_BUSINESS_RULES: BusinessRules = {
    TAX_RATE: 1.2,
    DEFAULT_MARGIN: 1.1,
    MIN_PROFITABLE_MARGIN: 1.05,
    SLA_WORKDAYS: 3,
};
