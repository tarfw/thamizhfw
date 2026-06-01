---
title: Verification Layers
description: The multi-layer hybrid verification system that ensures news quality.
---

## Verification Architecture

```
┌─────────────────────────────────────────────────────┐
│                  VERIFICATION STACK                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Layer 1: AI Pre-Screening (automated)              │
│  ┌─────────────────────────────────────────────┐   │
│  │ • Internal consistency check                 │   │
│  │ • Language analysis & sentiment              │   │
│  │ • Preliminary trust score (0-100)           │   │
│  │ • Flag suspicious claims                     │   │
│  │ • Duration: < 5 seconds per article          │   │
│  └──────────────┬──────────────────────────────┘   │
│                 │                                   │
│                 ▼                                   │
│  Layer 2: Community Review (crowdsourced)           │
│  ┌─────────────────────────────────────────────┐   │
│  │ • Min 5 reviews per article                  │   │
│  │ • Each reviewer's vote weighted by their     │   │
│  │   reputation score                           │   │
│  │ • High-reputation reviewers count more       │   │
│  │ • Reviews remain visible on article page     │   │
│  │ • Duration: minutes to hours                 │   │
│  └──────────────┬──────────────────────────────┘   │
│                 │                                   │
│                 ▼                                   │
│  Layer 3: Expert Validation (final sign-off)        │
│  ┌─────────────────────────────────────────────┐   │
│  │ • Verified journalists / domain experts      │   │
│  │ • Required only for flagged or contentious   │   │
│  │   articles                                   │   │
│  │ • Also used for high-impact breaking news    │   │
│  │ • Duration: minutes to hours                 │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## When Each Layer Applies

| Article Type | AI Check | Community | Expert |
|-------------|----------|-----------|--------|
| Scraped from major source | ✅ | Optional | ❌ |
| Scraped from small source | ✅ | If low confidence | If flagged |
| Citizen report (high trust user) | ✅ | ✅ 3 reviews | If flagged |
| Citizen report (new user) | ✅ | ✅ 5 reviews | ✅ Always |
| Breaking / sensitive news | ✅ | ✅ | ✅ Always |

## Badge System

Based on verification level, articles receive a badge:

| Badge | Description |
|-------|-------------|
| ✅ AI Verified | Passed AI pre-screening with high confidence |
| 👥 Community Verified | AI check + minimum community consensus |
| ⭐ Expert Verified | AI check + community + expert sign-off |
| 📱 Citizen Report | User-submitted, basic AI check passed |
