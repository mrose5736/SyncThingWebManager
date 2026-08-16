import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    // Project GitHub Pages sites are served from /<repo-name>/, not /.
    // Self-hosted / Docker builds don't set this, so `base` stays '/'.
    base: process.env.VITE_BASE_PATH || '/',
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 5173,
    },
})
