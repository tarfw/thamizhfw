---
title: AI Pipeline Overview
description: How Thamizhi uses AI to process, verify, and enrich news articles.
---

## AI Stack

| Component | Provider | Model |
|-----------|----------|-------|
| Text processing | Groq | Llama 3.3 70B |
| Fact-checking | Groq | Mixtral 8x7B |
| Translation | Groq | Llama 3 70B |
| Extraction | Groq | Llama 3.3 70B |

## What the AI Does

### For Scraped News

1. **Title extraction** — Extract clean title in original language + English translation
2. **Summarization** — Generate 50-word and 150-word summaries
3. **Classification** — Assign category, sub-category, district, location
4. **Entity extraction** — Identify people, places, organizations
5. **Sentiment analysis** — Determine tone and sentiment
6. **Cross-referencing** — Match against other articles on same topic

### For Citizen Reports

All of the above plus:
1. **Consistency check** — Does the report make logical sense?
2. **Verification scoring** — How likely is this to be true?
3. **Flag generation** — Highlight suspicious claims for human review

## Batch Processing

After each GitHub Actions scrape completes, a processing job runs:

```yaml
# Triggered after scrape
jobs:
  process:
    runs-on: ubuntu-latest
    steps:
      - name: Fetch unprocessed articles
        run: python fetch_pending.py
      - name: Process with Groq
        run: python ai_process.py
        env:
          GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}
```

## Prompt Template Example

```
You are a Tamil Nadu news analyst. Given a news article, extract:

1. Title in Tamil (original)
2. Title in English (translated)
3. 50-word summary in English
4. 150-word summary in English  
5. Category (one of: crime_against_women, crime_against_children, 
   politics, corruption, accident, health, education, environment)
6. Sub-category (more specific)
7. District in Tamil Nadu
8. Specific location
9. Incident date
10. Sentiment (positive/negative/neutral)
11. Key entities (JSON array of people, places, organizations)

Article: {article_text}
```
