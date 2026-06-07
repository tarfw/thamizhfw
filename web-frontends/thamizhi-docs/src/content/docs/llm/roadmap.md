---
title: LLM Roadmap
description: The phased plan for building and deploying custom AI models for Thamizhi.
---

## Model Training Roadmap

### Q3 2026 — Data Foundation
- [ ] Collect 100,000+ processed Tamil news articles
- [ ] Build labeled dataset (categories, entities, quality scores)
- [ ] Create evaluation benchmark (1000 hand-labeled articles)
- [ ] Export in LLM training format (JSONL, Alpaca format)

### Q4 2026 — Small Model Training
- [ ] Fine-tune Llama 3 8B on Tamil news corpus
- [ ] Evaluate against baseline (generic Groq prompts)
- [ ] Deploy as custom Groq model or self-hosted

### Q1 2027 — Production Model
- [ ] Bilingual model (Tamil + English)
- [ ] Integrated fact-checking capability
- [ ] Replace generic AI prompts
- [ ] Continuous fine-tuning from citizen report feedback

### Q2 2027 — Edge Deployment
- [ ] Quantized model for edge/on-device
- [ ] Basic inference on Cloudflare Workers
- [ ] Offline capabilities for mobile app

