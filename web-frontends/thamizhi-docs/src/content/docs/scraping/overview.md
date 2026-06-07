---
title: Scraping Overview
description: How Thamizhi collects news from multiple sources.
---

## Dual Scraper Architecture

Thamizhi uses two complementary scraping approaches:

| Approach | Platform | Time Limit | Best For |
|----------|----------|-----------|----------|
| **Batch Scraping** | GitHub Actions | Unlimited (public repo) | Scheduled bulk collection |
| **On-Demand Scraping** | Cloudflare Browser Run | 10 min/day | Real-time URL fetch |

### Why Two Approaches?

- **Batch scraping** handles the heavy lifting — collecting hundreds of articles daily from RSS feeds and known news sites
- **On-demand scraping** handles real-time requests — user submits a link, Cloudflare Browser Run fetches it immediately for verification

## Scraping Methods by Source Type

| Source Type | Method | Speed | Effort |
|------------|--------|-------|--------|
| RSS feeds | Python + Feedparser | Fast | Minimal |
| Static HTML sites | Python + requests + BeautifulSoup | Fast | Low |
| JS-rendered sites | Python + Playwright | Medium | Medium |
| YouTube channels | YouTube Data API | Fast | Low |
| Social media | Public APIs / scrapers | Varies | Medium |
| Government data | RSS + Playwright | Varies | Medium |

## Data Deduplication

Scraped articles are deduplicated before processing:

1. **URL hash** — exact URL match
2. **Title similarity** — fuzzy matching (Levenshtein distance)
3. **Content overlap** — N-gram comparison for same story across sources

Duplicate articles are linked via `cross_refs` JSON field.

## See Also

- [Batch Scraping (GitHub Actions)](/scraping/github-actions/)
- [On-Demand Scraping (Cloudflare)](/scraping/cloudflare-browser-run/)
- [Data Sources List](/scraping/sources/)
