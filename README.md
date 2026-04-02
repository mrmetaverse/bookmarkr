# Bookmarkr AI

AI assisted Chrome and Brave extension that cleans, reorganizes, and improves bookmark structure while preserving your existing folders whenever possible.

## What this baseline includes
- Manifest V3 extension with bookmark read and write access.
- Popup workflow: scan current bookmarks, generate plan, preview actions, apply changes.
- Agentic pipeline:
  - Snapshot and flatten bookmark tree
  - Detect duplicate bookmarks
  - Generate candidate actions
  - Validate actions
  - Apply actions to browser bookmarks
- Optional LangChain planner using OpenAI.
- shadcn style UI primitives on top of Tailwind v4.
- Optional Vercel serverless endpoint for remote planning.

## Tech stack
- TypeScript + React + Vite
- Chrome Extension MV3 via `@crxjs/vite-plugin`
- Tailwind CSS v4 + shadcn style component patterns
- LangChain (`langchain`, `@langchain/openai`, `@langchain/core`)
- Optional Vercel Function in `api/plan.ts`

## Local setup
1. Install dependencies:
   - `npm install`
2. Configure environment:
   - `cp .env.example .env`
   - Set `VITE_OPENAI_API_KEY` if you want in-extension LangChain planning.
3. Run dev build:
   - `npm run dev`
4. Build production extension:
   - `npm run build`

## Load extension in Chrome or Brave
1. Run `npm run build`.
2. Open `chrome://extensions` in Chrome or `brave://extensions` in Brave.
3. Enable Developer mode.
4. Click Load unpacked.
5. Select the generated extension folder in `dist`.

## Environment variables
- `VITE_OPENAI_API_KEY`: used by the extension for local LangChain calls.
- `OPENAI_API_KEY`: used by Vercel function `api/plan.ts`.

## Deploy API to Vercel
1. Install Vercel CLI:
   - `npm install -g vercel`
2. Login:
   - `vercel login`
3. Deploy:
   - `vercel --prod`
4. Add `OPENAI_API_KEY` in Vercel project settings.

## Architecture notes
- Background worker handles extension messaging and privileged bookmark mutations.
- Popup UI never mutates bookmarks directly.
- Planner prefers existing folders, then creates new folders only when needed.
- Delete actions currently target high-confidence duplicates.

## Product roadmap
See `ROADMAP.md` for phased delivery including future multi-user accounts, bookmark version control, and anonymous structure sharing.
