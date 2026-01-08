import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
    cleanup();
});

// Mocking some browser APIs that JSDOM doesn't support well
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // Deprecated
        removeListener: vi.fn(), // Deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock for URL.createObjectURL and revokeObjectURL
if (typeof window !== 'undefined') {
    window.URL.createObjectURL = vi.fn(() => 'blob:mock');
    window.URL.revokeObjectURL = vi.fn();
}

// Global mocks for common services if needed
vi.mock('sonner', () => ({
    toast: {
        error: vi.fn(),
        success: vi.fn(),
        info: vi.fn(),
        warning: vi.fn(),
    },
}));

// Mock Sentry (optional dependency)
vi.mock('@sentry/react', () => ({
    init: vi.fn(),
    setUser: vi.fn(),
    setContext: vi.fn(),
    addBreadcrumb: vi.fn(),
    captureException: vi.fn(),
    browserTracingIntegration: vi.fn(),
    replayIntegration: vi.fn(),
}));
