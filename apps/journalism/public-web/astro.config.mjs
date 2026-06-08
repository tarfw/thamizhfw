import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default defineConfig({
  site: 'https://thamizhi.app',
  output: 'static',
  integrations: [react()],
  vite: {
    optimizeDeps: {
      exclude: ['@tamilfw/core', '@tamilfw/ui'],
    },
    ssr: {
      noExternal: ['@tamilfw/core', '@tamilfw/ui'],
    },
    css: {
      postcss: {
        plugins: [tailwindcss(), autoprefixer()],
      },
    },
  },
});