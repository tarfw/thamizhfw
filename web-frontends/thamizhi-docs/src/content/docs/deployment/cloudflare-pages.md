---
title: Cloudflare Pages
description: Deploying the Thamizhi documentation site on Cloudflare Pages.
---

## Why Cloudflare Pages

- **Fast**: Global CDN with edge caching
- **CI/CD**: Auto-deploys from GitHub on push
- **Custom domain**: SSL certificate
- **Workers integration**: API + frontend on same network

## Deployment Options

### Option 1: GitHub Integration (Recommended)

1. Push the docs repo to GitHub
2. Go to Cloudflare Dashboard → Pages → Create a project
3. Connect your GitHub repository
4. Set build settings:
   - **Build command**: `npm run build`
   - **Build output**: `dist`
5. Deploy

### Option 2: Wrangler CLI

```bash
# Install Wrangler
npm install -g wrangler

wrangler login

# Deploy
wrangler pages deploy dist/ --project-name thamizhi-docs
```

## Build Configuration

```toml
# wrangler.toml (optional - for advanced config)
name = "thamizhi-docs"
pages_build_output_dir = "dist"

[env.production]
routes = [
  { pattern = "thamizhi.app", custom_domain = true }
]
```

## Custom Domain

```bash
# Add custom domain in Cloudflare Dashboard
# Pages → thamizhi-docs → Custom domains → Add
# Enter: docs.thamizhi.app
# Cloudflare auto-provisions SSL
```
