---
title: Batch Scraping (GitHub Actions)
description: Scheduled scraping using GitHub Actions cron jobs with Python and Playwright.
---

## How It Works

GitHub Actions runs a scheduled workflow that:

1. Checks out the scraper code
2. Installs Python dependencies + Playwright browser
3. Runs scraping scripts against all configured sources
4. Writes results directly to the database

## Workflow Configuration

```yaml
# .github/workflows/scrape.yml
name: Scrape News
on:
  schedule:
    - cron: '*/30 * * * *'   # Every 30 minutes
  workflow_dispatch:          # Manual trigger

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          playwright install chromium
      - name: Run scrapers
        run: python run_scrapers.py
        env:
          GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}
```

## Scraper Script Structure

```
scrapers/
├── run_scrapers.py          # Orchestrator
├── rss_scraper.py           # RSS feed parser
├── playwright_scraper.py    # JS-rendered site scraper
├── youtube_scraper.py       # YouTube channel scraper
├── dedup.py                 # Deduplication logic
├── requirements.txt
└── utils/
    └── extractors.py        # HTML parsing helpers
```

## RSS Scraper (Lightweight)

```python
# rss_scraper.py (simplified)
import feedparser

SOURCES = [
    {"name": "The Hindu", "url": "https://www.thehindu.com/rss/"},
    {"name": "Dinamani", "url": "https://www.dinamani.com/rss/"},
    {"name": "Times of India", "url": "https://timesofindia.indiatimes.com/rssfeeds/"},
]

for source in SOURCES:
    feed = feedparser.parse(source["url"])
    for entry in feed.entries:
        insert_raw_article(
            source=source["name"],
            url=entry.link,
            title=entry.title,
            body_html=entry.description,
            fetched_at=datetime.utcnow(),
        )
```

## Playwright Scraper (JS Sites)

```python
# playwright_scraper.py (simplified)
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto("https://www.dinamalar.com/")
    page.wait_for_load_state("networkidle")
    
    articles = page.eval_on_selector_all(
        "article", 
        """els => els.map(el => ({
            title: el.querySelector('h2')?.innerText,
            url: el.querySelector('a')?.href,
            summary: el.querySelector('p')?.innerText
        }))"""
    )
    
    for article in articles:
        insert_raw_article(
            source="Dinamalar",
            url=article["url"],
            title=article["title"],
            body_html=article["summary"],
        )
```

## Limits

| Limit | Value |
|-------|-------|
| Max run time per job | 6 hours (generous) |
| Concurrent jobs | 20 (public repos) |
| Storage | 500 MB per job |
| Frequency | Every 30 min recommended (respect sites) |
