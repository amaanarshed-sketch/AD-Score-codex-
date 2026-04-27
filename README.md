# AdScore

Minimal SaaS MVP for scoring ad copy before spending media budget.

## Features

- Landing page with clear product positioning
- Dashboard for single ad analysis
- Compare mode for two ads side-by-side
- Results page with a 0-100 score and five-part breakdown
- API route that uses OpenAI or Claude when configured
- Mock fallback when AI is unavailable

## Environment

Create `.env.local` with one of these:

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

or:

```bash
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-haiku-latest
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
