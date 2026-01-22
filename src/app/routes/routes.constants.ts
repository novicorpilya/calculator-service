export const ROUTES = {
    LANDING: '/',
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        FORGOT_PASSWORD: '/auth/forgot-password',
        RESET_PASSWORD: '/auth/reset-password',
    },
    DASHBOARD: {
        ROOT: '/dashboard',
        MANAGER: '/dashboard/manager',
        CLIENT: '/dashboard/client',
        ADMIN: '/dashboard/admin',
        BUDGET_PLANNER: '/dashboard/client/budget-planner',
    },
    ERRORS: {
        NOT_FOUND: '/404',
        FORBIDDEN: '/403',
        MAINTENANCE: '/maintenance',
        PRIVACY: '/privacy',
    },
    PARTNER: {
        CALCULATOR: '/embed/calculator',
    },
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES] | string;
