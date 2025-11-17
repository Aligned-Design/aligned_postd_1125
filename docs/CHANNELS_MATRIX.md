# Channels Matrix

Canonical list of channels, capabilities, and phase assignments.

## Legend
- Category: social | email | blog | design
- Capabilities (examples): create_post, schedule, video_upload, stories, reels, blog_publish, email_send, design_editor, analytics_pull
- Phase: phase1 | phase2 | later

## Matrix

| Channel | Id | Category | Capabilities | Phase |
|---|---|---|---|---|
| Instagram | instagram | social | create_post, schedule, stories, reels, analytics_pull | phase1 |
| Facebook | facebook | social | create_post, schedule, analytics_pull | phase1 |
| Threads | threads | social | create_post | phase2 |
| LinkedIn | linkedin | social | create_post, analytics_pull | phase1 |
| X (Twitter) | twitter | social | create_post, analytics_pull | phase1 |
| TikTok | tiktok | social | video_upload, schedule (planned), analytics_pull | phase1 |
| Google Business Profile | google_business | social | create_post (updates/offers), analytics_pull | phase1 |
| Pinterest | pinterest | social | create_post, analytics_pull | phase2 |
| YouTube | youtube | social | video_upload, analytics_pull | phase2 |
| Squarespace | squarespace | blog | blog_publish | phase2 |
| Mailchimp | mailchimp | email | email_send, campaign_send | phase2 |
| WordPress | wordpress | blog | blog_publish | phase2 |
| Canva | canva | design | design_editor, asset_sync | phase2 |
| Bluesky | bluesky | social | create_post | later |
| Snapchat | snapchat | social | video_upload | later |

Notes:
- Phase 1 focuses on: Meta (IG/FB), LinkedIn, Twitter/X, TikTok (scaffold), Google Business Profile (scaffold), plus Stripe, AI Doc Agent, Mailchimp (choose transactional if needed), and Canva scaffolding.
- Capabilities are additive over time; keep payload/DTOs stable across connectors.


