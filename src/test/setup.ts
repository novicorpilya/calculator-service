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
    value: vi.fn().mockImplementation((query) => ({
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
// Mock indexedDB for ChatStorage
if (typeof window !== 'undefined') {
    const mockDb = {
        transaction: vi.fn().mockReturnValue({
            objectStore: vi.fn().mockReturnValue({
                put: vi.fn(),
                add: vi.fn(),
                get: vi.fn().mockReturnValue({ onsuccess: null }),
                delete: vi.fn(),
                index: vi.fn().mockReturnValue({
                    openCursor: vi.fn().mockReturnValue({ onsuccess: null }),
                }),
            }),
            oncomplete: null,
            onerror: null,
        }),
        objectStoreNames: {
            contains: vi.fn().mockReturnValue(true),
        },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).indexedDB = {
        open: vi.fn().mockImplementation(() => {
            const request = {
                onupgradeneeded: null,
                onsuccess: null,
                onerror: null,
                result: mockDb,
            } as unknown as IDBOpenDBRequest;
            setTimeout(() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if (request.onsuccess) request.onsuccess({ target: request } as any);
            }, 0);
            return request;
        }),
    };
}

// Mock Image for ChatImage component
if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Image = class {
        onload: () => void = () => {};
        src: string = '';
        complete: boolean = true;
        constructor() {
            setTimeout(() => this.onload(), 0);
        }
    };
}

// Mock navigator.onLine
if (typeof window !== 'undefined') {
    Object.defineProperty(navigator, 'onLine', {
        configurable: true,
        value: true,
        writable: true,
    });
}
