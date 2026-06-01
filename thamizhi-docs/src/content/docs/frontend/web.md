---
title: Web App
description: Web version of Thamizhi built with React Native Web — shared code with mobile app.
---

## Approach

Thamizhi uses **React Native Web** to share ~90% of code between mobile and web:

```
thamizhi-app/
├── app/                    # Shared: Expo Router (RN + Web)
├── components/             # Shared: UI components
├── lib/                    # Shared: API client, utils
│
├── mobile-specific/        # Platform-specific (camera, GPS)
└── web-specific/           # Platform-specific (PWA, desktop)
```

## PWA Features

The web app is a **Progressive Web Application**:

- Installable on desktop and mobile browsers
- Offline support via service worker
- Push notifications (when we add them)
- Fast loading via static pre-rendering

## Web-Specific Features

- **Desktop layout**: Wider feed, multi-column grid
- **Keyboard shortcuts**: Quick navigation
- **Deep linking**: Shareable article URLs
- **SEO**: Server-side rendered for search engines
- **Social preview**: OG images for shared links

## Deployment

The web app deploys to **Cloudflare Pages**:

- Automatic builds from GitHub
- Global CDN
- Custom domain support
- No server to manage
