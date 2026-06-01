---
title: API Endpoints
description: Complete API reference for the Thamizhi Cloudflare Workers backend.
---

## Base URL

```
https://api.thamizhi.app/v1
```

## Authentication

Most endpoints require an API key or JWT token:

```
Authorization: Bearer <token>
```

## Endpoints

### News Feed

```http
GET /v1/news
```

Returns the published news feed.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| category | string | all | Filter by category |
| district | string | all | Filter by district |
| page | integer | 1 | Page number |
| limit | integer | 20 | Items per page (max 50) |

**Response:**
```json
{
  "data": [
    {
      "id": "abc123",
      "title_ta": "சென்னையில் 61 வயது மூதாட்டி கூட்டு பாலியல் வன்கொடுமை",
      "title_en": "61-yr-old woman gangraped in Chennai",
      "summary_50": "...",
      "category": "crime_against_women",
      "district": "Chennai",
      "poster_url": "https://images.thamizhi.app/posters/abc123.png",
      "badge": "ai_verified",
      "published_at": "2026-05-28T04:00:00Z",
      "source": "Times of India"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156
  }
}
```

### Single Article

```http
GET /v1/news/:id
```

### Citizen Submit

```http
POST /v1/citizen/submit
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | yes | News title |
| description | string | yes | Full description |
| image_urls | string[] | no | Attached image URLs |
| latitude | number | no | Location latitude |
| longitude | number | no | Location longitude |
| incident_date | string | yes | Date of incident (ISO 8601) |

### Scrape URL (On-Demand)

```http
POST /v1/scrape
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| url | string | yes | URL to scrape and process |

## Rate Limits

| Tier | Requests per hour |
|------|------------------|
| Unauthenticated | 60 |
| Authenticated (normal) | 300 |
| Authenticated (expert) | 1000 |
