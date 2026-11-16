# Makkal Short News

Tamil-first short news site with an RSS-driven CMS and optional Gemini AI rewriting.

## Features
- Public short-news feed with category filters and source links
- Admin CMS at /admin
- Add/remove RSS feeds, manual RSS fetch, automatic polling
- Automatic publishing can be enabled without editor approval
- Duplicate detection by URL and original title
- Gemini AI rewrite when GEMINI_API_KEY is configured; transparent source-text fallback otherwise

## Run locally
Node.js 20+
`npm start` then open http://localhost:3000
Set ADMIN_PASSWORD and optionally GEMINI_API_KEY.

## Deployment notes
Render free web services can sleep when idle and their local filesystem is ephemeral. This starter stores data in data/store.json, so it is suitable for initial testing but is not durable production storage. Connect a free persistent PostgreSQL provider before relying on it for long-term publishing. Configure a strong ADMIN_PASSWORD and a free-tier Gemini API key in service environment variables.

RSS source content remains linked to the original publisher. AI output must not introduce facts absent from the source.
