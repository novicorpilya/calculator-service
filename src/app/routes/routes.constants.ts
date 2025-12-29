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
    },
} as const;

export type AppRoute = typeof ROUTES[keyof typeof ROUTES] | string;
