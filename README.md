# Adnex

Minimal SaaS MVP for scoring ad copy before spending media budget.

## Features

- Landing page with clear product positioning
- Dashboard for single ad analysis
- Compare mode for two ads side-by-side
- Results page with a 0-100 score and structured decision breakdown
- API route that uses OpenAI when configured
- Mock fallback when AI is unavailable

## Environment

Create `.env.local` when you are ready to connect real AI analysis:

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

Future Supabase variables for auth, storage, and saved history:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Scripts

```bash
npm run dev
npm run build
npm run lint
```
