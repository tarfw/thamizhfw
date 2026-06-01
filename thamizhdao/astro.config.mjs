import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightThemeBlack from 'starlight-theme-black';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export default defineConfig({
  site: 'https://thamizhdao.pages.dev',
  integrations: [
    starlight({
      title: 'தமிழ் DAO',
      description: 'Decentralized Tamil People\'s Governance Operating System — civic platform for participatory democracy, AI-assisted accountability, and transparent governance',
      logo: {
        src: './src/assets/thamizhdao-logo.svg',
        alt: 'தமிழ் DAO',
      },
      favicon: '/favicon.svg',
      social: [
        { label: 'GitHub', href: 'https://github.com/your-org/thamizhdao', icon: 'github' },
      ],
      editLink: {
        baseUrl: 'https://github.com/your-org/thamizhdao/edit/main/',
      },
      plugins: [
        starlightThemeBlack({
          navLinks: [
            { label: 'Philosophy', link: '/philosophy/ideology/' },
            { label: 'Governance', link: '/governance/layers/' },
            { label: 'Modules', link: '/modules/overview/' },
          ],
          footerText: 'தமிழ் DAO — Decentralized Tamil People\'s Governance Operating System',
        }),
      ],
      sidebar: [
        {
          label: 'Philosophy',
          items: [
            { label: 'Core Ideology', slug: 'philosophy/ideology' },
            { label: 'Ideological Constitution', slug: 'philosophy/constitution' },
            { label: 'Adoption Strategy', slug: 'philosophy/adoption' },
          ],
        },
        {
          label: 'Governance',
          items: [
            { label: 'Architecture & Layers', slug: 'governance/layers' },
            { label: 'Decision Models', slug: 'governance/decisions' },
          ],
        },
        {
          label: 'Core Modules',
          items: [
            { label: 'Overview', slug: 'modules/overview' },
            { label: 'Makkal ID', slug: 'modules/makkal-id' },
            { label: 'Urimai Dashboard', slug: 'modules/urimai-dashboard' },
            { label: 'Makkal Kural', slug: 'modules/makkal-kural' },
            { label: 'Makkal Mandram', slug: 'modules/makkal-mandram' },
            { label: 'Proposal Engine', slug: 'modules/proposal-engine' },
            { label: 'Participatory Budget', slug: 'modules/participatory-budgeting' },
            { label: 'Anti-Caste Justice', slug: 'modules/anti-caste-justice' },
            { label: 'Rep. Accountability', slug: 'modules/representative-accountability' },
            { label: 'Public Law', slug: 'modules/public-law' },
            { label: 'Public Ledger', slug: 'modules/public-ledger' },
            { label: 'AI Public Servant', slug: 'modules/ai-public-servant' },
          ],
        },
        {
          label: 'Platform Features',
          items: [
            { label: 'Anti-Caste Abolition System', slug: 'features/abolition' },
            { label: 'Tamil Eelam Rights Layer', slug: 'features/eelam-rights' },
            { label: 'Democratic Socialist Economy', slug: 'features/socialist-economy' },
            { label: 'Global Tamil Diaspora Layer', slug: 'features/diaspora' },
            { label: 'Chats & Community', slug: 'features/chats-and-community' },
            { label: 'Blood Donor Registry', slug: 'features/blood-donor-registry' },
          ],
        },
        {
          label: 'Technical',
          items: [
            { label: 'Architecture', slug: 'technical/architecture' },
            { label: 'Tech Stack', slug: 'technical/tech-stack' },
          ],
        },
        {
          label: 'Accountability',
          items: [
            { label: 'Social Justice Scoring', slug: 'accountability/social-justice-scoring' },
            { label: 'Public Accountability System', slug: 'accountability/public-accountability' },
          ],
        },
        {
          label: 'AI Governance',
          slug: 'ai-governance',
        },
        {
          label: 'Test Plan',
          slug: 'test-plan',
        },
        {
          label: 'Roadmap & Vision',
          slug: 'roadmap',
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
