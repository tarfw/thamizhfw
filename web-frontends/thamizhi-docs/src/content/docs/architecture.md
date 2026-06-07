---
title: Architecture Overview
description: How the Thamizhi system fits together — from scraping to publishing.
---

## System Diagram

```mermaid
graph TD
    A[GitHub Actions cron] -->|Batch scrape| B[Scrapers]
    B -->|Raw articles| C[Database]
    C -->|Trigger| D[AI Pipeline<br/>Groq LLM]
    D -->|Processed| C
    C -->|Published news| E[Cloudflare Workers<br/>API]
    E -->|Serve| F[React Native App<br/>Mobile + Web]
    G[Cloudflare Browser Run] -->|On-demand scrape| E
    H[Citizen submits] -->|via App| E
    E -->|Verify| D
    
    style A fill:#4A90D9,color:#fff
    style B fill:#50C878,color:#fff
    style C fill:#FF6B6B,color:#fff
    style D fill:#9B59B6,color:#fff
    style E fill:#F39C12,color:#fff
    style F fill:#1ABC9C,color:#fff
    style G fill:#3498DB,color:#fff
    style H fill:#E74C3C,color:#fff
```

## Data Flow

### 1. Collection (Scraping Layer)

```mermaid
graph LR
    A[RSS Feeds] -->|Python scraper| D[Raw Articles]
    B[News Sites<br/>JS-rendered] -->|Playwright| D
    C[YouTube/ Social] -->|API + Scraper| D
    D -->|Store| E[Database<br/>raw_articles]
```

- **GitHub Actions** runs cron every 30-60 min
- **RSS scraper** (BeautifulSoup) for feeds
- **Playwright scraper** for JS-heavy sites


### 2. Processing (AI Layer)

```mermaid
graph LR
    A[Raw Articles] -->|Groq LLM| B[Extract]
    B -->|Title, Summary, Category| C[Tag]
    C -->|District, Entities, Date| D[Cross-ref]
    D -->|Check duplicates, verify facts| E[Processed Articles]
```

- **Groq** (Llama 3 / Mixtral) handles:
  - Title extraction (Tamil + English)
  - 50-word and 150-word summaries
  - Category and sub-category classification
  - District/location extraction
  - Key entity identification
  - Initial fact-checking via cross-referencing

### 3. Publishing

```mermaid
graph LR
    A[Processed Article] -->|Generate| B[Poster Image]
    B -->|Playwright screenshot| C[Published News]
    C -->|CDN| D[App Feed]
    E[Citizen Report] -->|AI check| F[Pending]
    F -->|Community vote| G[Review]
    G -->|Expert sign-off| C
```

- **Poster generation**: HTML template → headless browser → screenshot
- **Citizen news**: follows same pipeline with extra verification layers

## Infrastructure Map

```
┌─────────────────────────────────────────────────┐
│  GITHUB ACTIONS (cron scraping, public repo)    │
│  → Python + Playwright + BeautifulSoup          │
│  → Unlimited run time                           │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  CLOUDFLARE WORKERS (API backend)               │
│  → TypeScript (Hono framework)                  │
│                                               │
│  → Auth, verification, citizen submission       │
└────┬────────────┬────────────┬──────────────────┘
     │            │            │
     ▼            ▼            ▼
┌─────────┐ ┌──────────────────┐
│ GROQ    │ │ CLOUDFLARE       │
│ (AI)    │ │ BROWSER RUN      │
│ LLM     │ │ on-demand scrape │
│infra    │ │                  │
└─────────┘ └──────────────────┘
     ▲
     │
┌────┴──────────┐
│  DATABASE     │
│               │
└───────────────┘
     ▲
     │
┌────┴──────────┐
│  REACT NATIVE │
│  (Mobile+Web) │
└───────────────┘
```
