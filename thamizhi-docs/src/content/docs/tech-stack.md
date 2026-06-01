---
title: Tech Stack
description: Detailed breakdown of every technology used in Thamizhi and why it was chosen.
---

## Philosophy

Every technology choice prioritizes:
1. **Open source** — full control and transparency
2. **Edge-first** — fast, global by default

## Layer-by-Layer Breakdown

### Scraping Layer

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Batch scheduler | GitHub Actions (cron) | Runs scraping every 30-60 min |
| RSS scraper | Python + Feedparser + BeautifulSoup | Lightweight feed parsing |
| Browser scraper | Python + Playwright | JS-rendered page scraping |
| On-demand scraper | Cloudflare Browser Run API | Real-time URL scraping |
| AI extraction | Groq API (Llama 3) | Structured data from raw HTML |

### Backend / API Layer

| Component | Technology | Purpose |
|-----------|-----------|---------|
| API server | Cloudflare Workers (TypeScript) | All server-side logic |
| Framework | Hono (TypeScript) | Lightweight, edge-optimized |
| Auth | Cloudflare Turnstile + JWT | Bot protection + user sessions |

### AI / ML Layer

| Component | Technology | Purpose |
|-----------|-----------|---------|
| LLM inference | Groq API | Article processing, fact-checking |
| Models | Llama 3, Mixtral (via Groq) | Open-source LLMs |
| Image generation | Playwright (HTML→screenshot) | Poster creation |

### Frontend Layer

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Mobile app | React Native + Expo | iOS & Android |
| Web app | React Native Web (shared code) | PWA for desktop |
| State management | React Context + Zustand | Lightweight state |

### Deployment

| Component | Technology | Purpose |
|-----------|-----------|---------|
| API hosting | Cloudflare Workers | Edge-deployed |
| Static site | Cloudflare Pages | Documentation + web app |
| CI/CD | GitHub Actions | Automated builds & deploys |

