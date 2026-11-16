# Makkal Short News

Tamil-first short news site with RSS ingestion, AI rewriting and CMS.

## Features
- RSS feeds and category-based short news
- Admin CMS at /admin
- Auto publishing without editor approval
- Groq primary AI and OpenRouter fallback (OpenAI-compatible APIs)
- Cloudinary image storage for RSS images; if no RSS image is available, a simple Makkal Short News branded graphic is uploaded
- Duplicate detection and source attribution

## Required Render environment variables
- ADMIN_PASSWORD: strong private CMS password
- GROQ_API_KEY: optional Groq key
- OPENROUTER_API_KEY: optional OpenRouter key (fallback if Groq is unavailable)
- CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET: enable image uploads
- GROQ_MODEL (optional; default llama-3.3-70b-versatile)
- OPENROUTER_MODEL (optional; default openai/gpt-4o-mini)

Get API keys from the official Groq, OpenRouter and Cloudinary dashboards. Add them under Render -> service -> Environment. Do not commit keys to GitHub.

## Run locally
Node.js 20+: `npm start`; open http://localhost:3000.

## Free-tier and storage limitation
The service is configured for Render Free. Free web services may sleep when idle. The current JSON store is on the service filesystem, which is ephemeral on Render and may be lost on redeploy/restart. Connect a persistent free database (for example a compatible hosted PostgreSQL free tier) before relying on long-term news history. Provider free tiers, quotas and availability can change.

RSS content is transformed into short summaries and retains a link to its source. AI must not add facts absent from the source.
