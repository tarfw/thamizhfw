import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightThemeBlack from 'starlight-theme-black';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export default defineConfig({
  site: 'https://thamizhi-docs.pages.dev',
  integrations: [
    starlight({
      title: 'Thamizhi',
      description: 'Decentralized journalism platform powered by AI — collecting, verifying & publishing news with zero-cost infrastructure',
      logo: {
        src: './src/assets/thamizhi-logo.svg',
        alt: 'Thamizhi',
      },
      favicon: '/favicon.svg',
      social: [
        { label: 'GitHub', href: 'https://github.com/your-org/thamizhi', icon: 'github' },
      ],
      editLink: {
        baseUrl: 'https://github.com/your-org/thamizhi-docs/edit/main/',
      },
      plugins: [
        starlightThemeBlack({
          navLinks: [
            { label: 'Philosophy', link: '/philosophy/why-decentralized/' },
            { label: 'User Guide', link: '/user-guide/getting-started/' },
            { label: 'Technical', link: '/architecture/' },
          ],
          footerText: 'Thamizhi — Decentralized journalism platform powered by AI',
        }),
      ],
      sidebar: [
        {
          label: 'Philosophy',
          items: [
            { label: 'Why Decentralized', slug: 'philosophy/why-decentralized' },
            { label: 'Core Principles', slug: 'philosophy/principles' },
            { label: 'Tamil Nadu Context', slug: 'philosophy/tamil-nadu-context' },
          ],
        },
        {
          label: 'User Guide',
          items: [
            { label: 'Getting Started', slug: 'user-guide/getting-started' },
            { label: 'Submitting News', slug: 'user-guide/citizen-submission' },
            { label: 'Verification', slug: 'user-guide/verification' },
            { label: 'Reputation', slug: 'user-guide/reputation' },
            { label: 'Community Guidelines', slug: 'user-guide/community-guidelines' },
          ],
        },
        {
          label: 'Technical',
          items: [
            { label: 'Architecture', slug: 'architecture' },
            { label: 'Tech Stack', slug: 'tech-stack' },
            {
              label: 'Scraping Engine',
              items: [
                { label: 'Overview', slug: 'scraping/overview' },
                { label: 'GitHub Actions', slug: 'scraping/github-actions' },
                { label: 'Cloudflare Browser', slug: 'scraping/cloudflare-browser-run' },
                { label: 'Data Sources', slug: 'scraping/sources' },
              ],
            },
            {
              label: 'AI Pipeline',
              items: [
                { label: 'Overview', slug: 'ai/overview' },
                { label: 'Text Processing', slug: 'ai/text-processing' },
                { label: 'Fact-Checking', slug: 'ai/fact-checking' },
                { label: 'Poster Generation', slug: 'ai/poster-generation' },
              ],
            },
            {
              label: 'API',
              items: [
                { label: 'Endpoints', slug: 'api/endpoints' },
                { label: 'Authentication', slug: 'api/auth' },
              ],
            },
            {
              label: 'Frontend',
              items: [
                { label: 'React Native', slug: 'frontend/react-native' },
                { label: 'Web App', slug: 'frontend/web' },
              ],
            },
            {
              label: 'Deployment',
              items: [
                { label: 'Zero-Cost', slug: 'deployment/overview' },
                { label: 'Cloudflare Pages', slug: 'deployment/cloudflare-pages' },
              ],
            },
          ],
        },
        {
          label: 'Future',
          items: [
            { label: 'P2P Distribution', slug: 'future/p2p' },
            { label: 'LLM Training', slug: 'llm/data-collection' },
            { label: 'Roadmap', slug: 'future/roadmap' },
          ],
        },
      ],
      customCss: [
        './src/styles/custom.css',
      ],
      components: {
        ThemeProvider: './src/components/ThemeProvider.astro',
      },
    }),
    {
      name: 'force-light-theme',
      hooks: {
        'astro:build:done': async ({ dir }) => {
          const dirPath = dir.pathname.replace(/^\/([A-Za-z]:)/, '$1');
          async function walk(d) {
            const entries = await readdir(d, { withFileTypes: true });
            for (const e of entries) {
              const p = join(d, e.name);
              if (e.isDirectory()) await walk(p);
              else if (e.name.endsWith('.html')) {
                const c = await readFile(p, 'utf-8');
                const t = c.replace(/data-theme="dark"/g, 'data-theme="light"');
                if (t !== c) await writeFile(p, t, 'utf-8');
              }
            }
          }
          await walk(dirPath);
        },
      },
    },
  ],
});
