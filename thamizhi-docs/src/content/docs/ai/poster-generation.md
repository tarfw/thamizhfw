---
title: Poster Generation
description: How Thamizhi auto-generates shareable image posters for every news article.
---

## Overview

Every news article gets a shareable image poster (1080×1080px) generated automatically. This makes news ready for sharing on social media, WhatsApp, and messaging apps.

## Generation Method

HTML template → Render in headless browser → Screenshot

This gives full control over design, fonts, and layout without needing image processing libraries.

## Poster Template

```html
<!-- poster template -->
<div class="poster">
  <div class="header">
    <span class="badge">{{district}} | {{category}}</span>
    <span class="date">{{date}}</span>
  </div>
  <div class="content">
    <h1 class="title">{{headline_tamil}}</h1>
    <ul class="bullets">
      {{#each bullet_points}}
      <li>{{this}}</li>
      {{/each}}
    </ul>
  </div>
  <div class="footer">
    <span class="brand">thámizhi</span>
    <span class="source">{{source}}</span>
    <span class="badge">{{verification_badge}}</span>
  </div>
</div>
```

## Generation Script

```python
from playwright.sync_api import sync_playwright
from jinja2 import Template

def generate_poster(article):
    template = Template(open("templates/poster.html").read())
    html = template.render(**article)
    
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(
            viewport={"width": 1080, "height": 1080}
        )
        page.set_content(html)
        page.wait_for_load_state("networkidle")
        
        screenshot = page.screenshot(full_page=True)
        return screenshot  # Save or upload
```

## Design Specifications

| Property | Value |
|----------|-------|
| Dimensions | 1080×1080px (square) |
| Format | PNG |
| Max file size | < 500 KB |
| Font | Noto Sans Tamil (bundled) |
| Colors | Dynamic (based on category) |

## Category Color Scheme

| Category | Primary Color |
|----------|--------------|
| crime_against_women | #E74C3C (Red) |
| crime_against_children | #C0392B (Dark Red) |
| politics | #3498DB (Blue) |
| accident | #F39C12 (Orange) |
| health | #2ECC71 (Green) |
| education | #9B59B6 (Purple) |
