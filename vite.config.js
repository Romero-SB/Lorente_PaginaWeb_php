import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { bunny } from 'laravel-vite-plugin/fonts';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.jsx'],
            refresh: true,
            fonts: [
                bunny('Inter', {
                    weights: [400, 500, 600, 700],
                    preload: [{ weight: 400 }, { weight: 600 }, { weight: 700 }],
                }),
                bunny('Playfair Display', {
                    weights: [600, 700, 800, 900],
                    styles: ['normal', 'italic'],
                    preload: [{ weight: 600 }, { weight: 700 }],
                }),
                bunny('Poppins', {
                    weights: [400, 500, 600, 700],
                    preload: false,
                }),
                bunny('Montserrat', {
                    weights: [400, 500, 600, 700],
                    preload: false,
                }),
                bunny('Lora', {
                    weights: [400, 500, 600, 700],
                    styles: ['normal', 'italic'],
                    preload: false,
                }),
                bunny('Oswald', {
                    weights: [400, 500, 600, 700],
                    preload: false,
                }),
            ],
        }),
        react(),
        tailwindcss(),
    ],
    server: {
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
    build: {
        chunkSizeWarningLimit: 1100,
    },
});
