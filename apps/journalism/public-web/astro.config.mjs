import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load .env from monorepo root so Turso credentials are available in process.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../../../.env') });

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
