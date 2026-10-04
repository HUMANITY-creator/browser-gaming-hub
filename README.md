# GameForge AI Hub

A browser-first gaming hub built with Next.js.

## Included in v0.1

- Playable **Neon Dodge** canvas game
- Local high-score persistence
- AI Game Coach panel
- Clean arcade dashboard UI
- Vercel-ready Next.js App Router setup

## AI setup

The UI works without a key using local fallback responses.

For live model responses, add:

```bash
OPENAI_API_KEY=...
OPENAI_MODEL=...
```

The server calls the OpenAI Responses API from the Next.js route handler, so the key never ships to the browser.

## Development

```bash
npm install
npm run dev
```
