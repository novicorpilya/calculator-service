import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@/app': path.resolve(__dirname, './src/app'),
            '@/pages': path.resolve(__dirname, './src/pages'),
            '@/components': path.resolve(__dirname, './src/components'),
            '@/features': path.resolve(__dirname, './src/features'),
            '@/services': path.resolve(__dirname, './src/services'),
            '@/hooks': path.resolve(__dirname, './src/hooks'),
            '@/utils': path.resolve(__dirname, './src/utils'),
            '@/assets': path.resolve(__dirname, './src/assets'),
            '@/styles': path.resolve(__dirname, './src/styles'),
            '@/core': path.resolve(__dirname, './src/core'),
        },
    },
    build: {
        // SECURITY: No source maps in production
        sourcemap: false,
        // Minification
        minify: 'esbuild',
        // Strip console/debugger in production build
        target: 'es2020',
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (!id.includes('node_modules')) {
                        if (id.includes('/features/dashboard/')) return 'feature-dashboard';
                        if (id.includes('/features/auth/')) return 'feature-auth';
                        return;
                    }

                    // --- VENDOR SPLITTING (AGGRESSIVE) ---
                    if (id.includes('@supabase')) return 'vendor-supabase';
                    if (id.includes('@tanstack')) return 'vendor-query';
                    if (id.includes('recharts')) return 'vendor-charts';
                    if (id.includes('emoji-picker-react')) return 'vendor-emoji';
                    if (id.includes('jspdf') || id.includes('html2canvas')) return 'vendor-pdf';
                    if (id.includes('xlsx')) return 'vendor-excel';
                    if (id.includes('lucide-react')) return 'vendor-ui';

                    return 'vendor';
                },
            },
        },
        chunkSizeWarningLimit: 850,
    },
    esbuild: {
        // Strip console and debugger statements from production
        drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
        include: ['src/**/*.{test,spec}.{ts,tsx}'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
        },
    },
});
