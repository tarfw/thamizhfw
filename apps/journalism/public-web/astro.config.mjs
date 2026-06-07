import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://thamizhi.app',
  output: 'static',
  integrations: [],
  vite: {
    optimizeDeps: {
      exclude: ['@tamilfw/core', '@tamilfw/ui'],
    },
    ssr: {
      noExternal: ['@tamilfw/core', '@tamilfw/ui'],
    },
  },
});