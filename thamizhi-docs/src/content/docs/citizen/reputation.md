---
title: Reputation System
description: How user trust scores are calculated and used in the verification process.
---

## Overview

The reputation system ensures trustworthy behavior is rewarded and spam/abuse is discouraged. Every user has a **trust score** (0-100) that affects how their submissions are processed and how much their reviews count.

## Score Calculation

```
Trust Score = (approved_reports_ratio × 40) 
            + (review_accuracy × 30) 
            + (account_age_bonus × 15) 
            + (verification_level × 15)
```

| Factor | Weight | Description |
|--------|--------|-------------|
| Approved reports ratio | 40% | % of submitted reports that were approved |
| Review accuracy | 30% | How often their reviews matched final outcome |
| Account age bonus | 15% | Longer history = more trust (max at 6 months) |
| Verification level | 15% | Phone verified / ID verified / expert status |

## Score Tiers

| Score Range | Tier | Benefits |
|-------------|------|----------|
| 0-20 | New | Can submit, every report goes through full verification |
| 21-50 | Trusted | Reports skip expert review if AI confidence > 80% |
| 51-80 | Established | Reviews count 2x; can flag articles |
| 81-100 | Expert | Review count 3x; can become expert reviewer |

## Actions That Affect Score

### Positive (+)
- Report approved: +10
- Review matches consensus: +5
- Flagging a fake report: +8
- Consistent activity over time: +2/week

### Negative (-)
- Report rejected: -15
- Spam submission: -30
- Review against consensus: -3
- Flagged for abuse: -50 (or ban)

## Database Schema

```sql
CREATE TABLE reputation (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  total_reports INTEGER DEFAULT 0,
  approved_reports INTEGER DEFAULT 0,
  rejected_reports INTEGER DEFAULT 0,
  reviews_given INTEGER DEFAULT 0,
  reviews_accurate INTEGER DEFAULT 0,
  trust_score REAL DEFAULT 0.0,
  last_activity_at TEXT
);
```
