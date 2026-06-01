---
title: Data Collection for LLM Models
description: How the scraped data feeds into future custom LLM training.
---

## Vision

Thamizhi's long-term goal is to train **custom small language models** specialized in:
- Tamil Nadu regional news understanding
- Tamil-English bilingual processing
- Fact-checking and misinformation detection
- Crime reporting analysis

## Data Collected for Training

| Data Type | Volume (Annual) | Used For |
|-----------|----------------|----------|
| News articles (English) | ~500,000 | General news understanding |
| News articles (Tamil) | ~300,000 | Tamil NLP, code-mixing |
| YouTube transcripts | ~50,000 videos | Spoken Tamil, slang |
| Citizen reports | ~10,000+ | Real-world submissions |
| Government data | ~1,000+ | Official language patterns |
| Court judgments | ~5,000+ | Legal Tamil terminology |
| Social media trends | ~1,000,000+ | Real-time language evolution |

## Data Export Format

```json
{
  "id": "article_123",
  "source": "The Hindu",
  "language": "ta",
  "title": "சென்னையில் 61 வயது மூதாட்டி கூட்டு பாலியல் வன்கொடுமை",
  "title_en": "61-yr-old woman gangraped in Chennai",
  "body_ta": "...",  // Tamil text
  "body_en": "...",  // English translation
  "summary": "...",
  "category": "crime_against_women",
  "district": "Chennai",
  "entities": ["Velachery", "Mohammed Muttab", "Mohammed Atheel"],
  "verified": true,
  "published_at": "2026-05-28"
}
```

## Fine-Tuning Roadmap

### Phase 1 (Data Collection)
- Collect all processed articles
- Export in standardized JSONL format
- Label with categories, entities

### Phase 2 (Small Models)
- Fine-tune Llama 3 8B on Tamil news corpus

- Evaluate on fact-checking benchmarks

### Phase 3 (Deployment)
- Deploy fine-tuned model via Groq or self-hosted
- Replace generic Groq prompts with custom model
- Continuous improvement cycle
