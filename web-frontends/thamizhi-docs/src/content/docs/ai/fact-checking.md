---
title: Fact-Checking
description: How the AI cross-references and verifies news articles before publication.
---

## Verification Layers

### Layer 1: Internal Consistency

The AI checks if the article is internally consistent:
- Do dates, names, and locations make sense?
- Are there contradictory statements?
- Does the tone match the content?

### Layer 2: Cross-Source Verification

When multiple sources cover the same story, the AI compares them:

```python
def cross_reference(article, similar_articles):
    prompt = f"""
    Compare these articles covering the same incident:
    
    Article A: {article['summary']}
    Article B: {similar_articles[0]['summary']}
    
    Identify:
    1. Confirmed facts (present in ALL articles)
    2. Discrepancies (differences between articles)
    3. Unique claims (present in only one article)
    4. Confidence score (0-1) based on agreement
    
    Return as JSON.
    """
    return groq_extract(prompt)
```

### Layer 3: Historical Pattern Check

The AI flags patterns that resemble known misinformation:
- Exaggerated numbers or claims
- Unnamed or vague sources ("sources say")
- Emotionally manipulative language

## Trust Score Calculation

```
Trust Score = 0.4 × AI_confidence 
           + 0.3 × cross_source_agreement 
           + 0.2 × source_reliability 
           + 0.1 × historical_pattern_score

Range: 0-100

Published if: score > 70 (scraped news)
               score > 80 (citizen news, after community review)
```

## Source Reliability Scoring

| Source Type | Base Reliability |
|------------|-----------------|
| Major newspaper | 0.9 |
| Government release | 0.95 |
| TV news transcript | 0.8 |
| Citizen report (verified) | 0.7 |
| Citizen report (unverified) | 0.3 |
| Social media | 0.2 |
