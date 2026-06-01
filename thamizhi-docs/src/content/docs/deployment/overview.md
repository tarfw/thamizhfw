---
title: Deployment
description: How every component of Thamizhi is deployed.
---

## Deployment Map

```
┌──────────────────────────────────────────────────────────────┐
│                      DEPLOYMENT MAP                          │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  GitHub Actions ── scraping cron jobs                         │
│       │                                                       │
│       ▼                                                       │
│  Cloudflare Workers ── API backend (TypeScript)              │
│                                                               │
│  Cloudflare Pages ── Documentation + Web App (static)        │
│                                                               │
│  Groq ── AI Inference                                        │
│                                                               │
│  Cloudflare R2 ── Image/File Storage                         │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## Deployment Steps

### 1. Cloudflare Workers API
```bash
# Deploy API backend
npm create cloudflare@latest thamizhi-api
# Write Wrangler config
# Deploy: npx wrangler deploy
```

### 3. Cloudflare Pages (Docs)
```bash
# Build docs site
npm run build
# Deploy via Wrangler or GitHub integration
npx wrangler pages deploy dist/
```

### 3. GitHub Actions (Scraping)
```bash
# Add secrets to GitHub repo:
# GROQ_API_KEY
# Push .github/workflows/scrape.yml
```
