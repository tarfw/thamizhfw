The proper fix has **3 layers**:

---

### 1. Google Play Console — Content Rating Questionnaire (mandatory)

Log into Play Console → App content → Content rating → Fill out the questionnaire **honestly**. For your app this likely means:

- Select "**Contains user-generated content**" (chats, Bluesky feed)
- Select "**Contains sharing of user content/images**" (media library permissions)
- Select "**Sexual content / Violence / Hate speech**" as user-generated categories
- Answer truthfully about whether you have moderation/reporting

This alone won't fix the rejection—it's just the first step.

---

### 2. Implement Content Moderation & Safety Features (the main fix)

Google's Child Safety Standards requires apps with UGC to have:

| Feature | What to implement |
|---------|------------------|
| **In-app reporting** | A "Report" button on every message, post, and user profile that sends reports to you |
| **Blocking** | Allow users to block other users |
| **Content filtering** | Filter out child sexual abuse material (CSAM) and hate speech |
| **Community Guidelines** | In-app screen showing rules, linked from a visible location |
| **Age-gating** | Warning screens before entering chat spaces or social feed |

**Minimum viable implementation:**
- Add a `ReportContent` function to your SpacetimeDB module
- Add "Report" and "Block" UI buttons in chat messages and user profiles
- Add a "Community Guidelines" screen accessible from settings/hub
- Add a content warning modal before the Bluesky feed for users under 18

---

### 3. Submit an Appeal

After implementing the above, in Play Console:
- Go to **Policy status** → **Appeal** 
- Explain what moderation features you've added (reporting, blocking, content filtering)
- Attach screenshots showing the report and block buttons working

---

**Want me to implement the code-level fixes?** I can add:
- Report/block UI components in chat and Bluesky feed
- Community Guidelines screen
- Content warning modal
- API endpoints in your SpacetimeDB module
- Play Store content rating config in AndroidManifest