---
title: React Native App
description: Cross-platform mobile app built with React Native and Expo.
---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native + Expo |
| Language | TypeScript |
| Navigation | Expo Router (file-based) |
| State | Zustand + React Query |
| Styling | Tailwind NativeWind |
| Sharing | React Native Share |

## Features

### News Feed
- Infinite scroll feed of published articles
- Filter by category, district, date
- Pull to refresh
- Each article shows poster + trust badge + summary

### Article Detail
- Full article view with poster image
- AI summary
- Source attribution
- Related articles
- Share button

### Citizen Submission
- Guided form with image upload
- Location picker (GPS + map)
- Submission status tracking
- Edit/resubmit after feedback

### User Profile
- Trust score display
- Submission history
- Review history (for reviewers)
- Badge display

### Search
- Search articles by keyword, location, or category
- Auto-suggest based on trending topics

## Project Structure

```
thamizhi-app/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Main tabs
│   │   ├── feed.tsx
│   │   ├── submit.tsx
│   │   ├── search.tsx
│   │   └── profile.tsx
│   ├── article/[id].tsx   # Article detail
│   └── _layout.tsx
├── components/            # Shared components
├── lib/                   # API client, utils
├── hooks/                 # Custom hooks
└── assets/                # Images, fonts
```
