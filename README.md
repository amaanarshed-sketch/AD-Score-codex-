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
OPENAI_MODEL=gpt-4o-mini

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

## Scripts

```bash
npm run dev
npm run build
npm run lint
```
