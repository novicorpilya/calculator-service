import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vitest/config'

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
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            // Split features into separate chunks
            if (id.includes('/features/chat/')) return 'feature-chat';
            if (id.includes('/features/dashboard/')) return 'feature-dashboard';
            if (id.includes('/features/auth/')) return 'feature-auth';
            return; // Let Rollup handle other app code
          }
          
          // --- VENDOR SPLITTING (order matters: specific first) ---
          
          // Emoji picker (VERY heavy, ~200KB) - check BEFORE react
          if (id.includes('emoji-picker-react') || id.includes('emoji-mart')) {
            return 'vendor-emoji';
          }
          
          // Forms - check BEFORE react
          if (id.includes('react-hook-form') || id.includes('@hookform')) {
            return 'vendor-forms';
          }
          
          // Supabase (heavy, ~150KB)
          if (id.includes('@supabase')) {
            return 'vendor-supabase';
          }
          
          // TanStack (Query + Virtual)
          if (id.includes('@tanstack')) {
            return 'vendor-tanstack';
          }
          
          // Zod validation
          if (id.includes('/zod/') || id.includes('zod@')) {
            return 'vendor-zod';
          }
          
          // Icons (lucide is large)
          if (id.includes('lucide-react')) {
            return 'vendor-icons';
          }
          
          // UI helpers
          if (id.includes('sonner') || id.includes('next-themes')) {
            return 'vendor-ui';
          }
          
          // Router - check BEFORE core react
          if (id.includes('react-router')) {
            return 'vendor-router';
          }
          
          // Core React (react, react-dom only)
          if (id.includes('/react@') || id.includes('/react-dom@') || 
              id.match(/node_modules[\\/]react[\\/]/) || 
              id.match(/node_modules[\\/]react-dom[\\/]/)) {
            return 'vendor-react';
          }
          
          // Scheduler (React dependency)
          if (id.includes('scheduler')) {
            return 'vendor-react';
          }
          
          // Everything else
          return 'vendor-misc';
        },
      },
    },
    chunkSizeWarningLimit: 850,
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
})
