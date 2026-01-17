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
          
          // --- VENDOR SPLITTING ---
          
          // 1. Huge Libraries (keep separate)
          if (id.includes('emoji-picker-react') || id.includes('emoji-mart')) return 'vendor-emoji';
          if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('canvg')) return 'vendor-pdf';
          if (id.includes('xlsx') || id.includes('cpexcel')) return 'vendor-excel';
          if (id.includes('recharts') || id.includes('active-win')) return 'vendor-charts';
          
          // 2. Core Infrastructure (Supabase + Auth + Query)
          if (id.includes('@supabase') || id.includes('@tanstack')) {
            return 'vendor-infra';
          }

          // 3. UI Framework (React + Router + Icons + UI libs)
          // Grouping React, Router, Lucide, Radix/Sonner together prevents symbol resolution errors
          if (id.includes('react') || id.includes('router') || id.includes('lucide') || id.includes('sonner') || id.includes('next-themes')) {
            return 'vendor-ui-core';
          }
          
          // 4. Feature modules are handled above

          // Everything else is vendor-misc
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
