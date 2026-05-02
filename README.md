# Adnex

Minimal SaaS MVP for scoring ads before spending media budget.

## Features

- Landing page with clear product positioning
- Dashboard for single ad analysis
- Compare mode for two ads side-by-side
- Results page with a 0-100 score and structured decision breakdown
- Supabase Auth foundation with monthly credit tracking
- Lemon Squeezy subscription checkout + webhook endpoint
- API route that uses OpenAI when configured
- Mock fallback when AI is unavailable

## Environment

Create `.env.local` when you are ready to connect billing and real AI analysis:

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.4-mini
OPENAI_TEXT_MODEL=
OPENAI_VISION_MODEL=
# OPENAI_MODEL is used as the fallback when the text/vision overrides are empty.

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

LEMONSQUEEZY_API_KEY=
LEMONSQUEEZY_STORE_ID=
LEMONSQUEEZY_WEBHOOK_SECRET=
LEMONSQUEEZY_PLUS_VARIANT_ID=
LEMONSQUEEZY_PRO_VARIANT_ID=
LEMONSQUEEZY_TEST_MODE=true

NEXT_PUBLIC_APP_URL=http://127.0.0.1:3001
```

Run `supabase/schema.sql` in Supabase before enabling live auth, credits, or Lemon Squeezy webhooks.

## AI behavior

- Real AI calls use the OpenAI Responses API when `OPENAI_API_KEY` is set.
- The system prompt forces JSON-only, concise, non-chatbot outputs.
- Ad copy and context are trimmed before sending to control token usage.
- Images are compressed client-side before vision analysis.
- Video audits use up to 4 sampled frames only; audio and full video context are not assumed.
- If OpenAI fails or returns invalid JSON, the app falls back to mock output and refunds reserved credits.

## Scripts

```bash
npm run dev
npm run build
npm run lint
```
