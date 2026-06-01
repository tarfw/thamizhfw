---
title: On-Demand Scraping (Cloudflare Browser Run)
description: Real-time news scraping using Cloudflare Browser Run for user-submitted URLs and verification.
---

## What is Cloudflare Browser Run?

Cloudflare Browser Run is a managed browser automation service that runs headless Chrome on Cloudflare's edge network. It provides:

- **Quick Actions**: Simple HTTP endpoints for screenshots, PDFs, markdown, JSON extraction
- **Browser Sessions**: Full Playwright/Puppeteer control via Workers

## Use Case in Thamizhi

On-demand scraping is triggered when:

1. A **citizen journalist submits a URL** — need to immediately fetch and verify the content
2. An **existing article needs re-verification** — re-scrape to check for updates
3. A **user searches for a specific story** — scrape on-the-fly

## Quick Actions for Scraping

The simplest approach — a single HTTP request:

```typescript
// Cloudflare Worker
const BROWSER_RUN_ENDPOINT = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/browser-run`;

async function scrapeUrl(url: string) {
  const response = await fetch(
    `${BROWSER_RUN_ENDPOINT}/content/scrape`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${API_TOKEN}` },
      body: JSON.stringify({ url })
    }
  );
  return response.json(); // Returns structured data
}
```

## JSON Extraction with AI

The JSON endpoint allows natural language prompts for AI-powered extraction:

```typescript
async function extractNews(url: string) {
  const response = await fetch(
    `${BROWSER_RUN_ENDPOINT}/content/json`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${API_TOKEN}` },
      body: JSON.stringify({
        url,
        prompt: "Extract the news article: title, date, author, body text, and category"
      })
    }
  );
  return response.json();
}
```

## Usage Budget

With 10 minutes/day (600 seconds):

| Task | Time per call | Daily capacity |
|------|-------------|----------------|
| Simple scrape | ~1-2 seconds | ~300-600 URLs |
| Full article extraction | ~3-5 seconds | ~120-200 URLs |
| Screenshot + AI extraction | ~5-8 seconds | ~75-120 URLs |

Sufficient for MVP-scale on-demand needs.
