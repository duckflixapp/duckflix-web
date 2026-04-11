import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        allowedHosts: ['duckflix.fun'],
    },
    build: {
        chunkSizeWarningLimit: 600,
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    'vendor-player': ['hls.js'],
                    'vendor-ui': ['lucide-react', 'framer-motion'],
                    'vendor-query': ['@tanstack/react-query'],
                },
            },
        },
    },
});
