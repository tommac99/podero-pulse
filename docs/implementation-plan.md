# Implementation Plan & Technical Strategy

## Approach

Build a production-quality MVP in ~3–4 hours. The goal is to demonstrate full end-to-end thinking — not a polished product, but a working prototype with clear architecture, explicit tradeoffs, and a visible path to production.

**Rule I applied:** Build the parts that demonstrate thinking (the relevance rubric, the scoring pipeline, the live UI). Design the parts that would take disproportionate time (scheduling, persistence, auth) and document them explicitly.

---

## Architecture

```
Browser (Next.js client)
    │
    │  POST /api/run { email, claudeApiKey }
    ▼
API Route (Node.js, SSE stream)
    ├── fetcher.ts     RSS ingestion (parallel, 6 feeds)
    ├── scorer.ts      Claude Haiku per-article scoring (sequential)
    ├── reporter.ts    HTML digest generation
    └── mailer.ts      Resend email delivery
    │
    │  SSE events streamed back to browser
    ▼
Browser updates live:
    ├── Left column:   source status dots (idle → fetching → done)
    ├── Center column: article cards stream in with animated scores
    └── Right column:  digest iframe assembles when scoring complete
```

### Why SSE (Server-Sent Events) over WebSockets

SSE is one-directional (server → client) which is exactly what we need. It's simpler than WebSockets (no handshake, no library), works natively in the browser with `EventSource` or `ReadableStream`, and is supported by Vercel's streaming infrastructure. WebSockets would add complexity with no benefit here.

### Why sequential scoring (not parallel)

Scoring articles in parallel would be faster, but:
1. The live UI depends on articles arriving one-by-one (the streaming effect)
2. Claude API has rate limits; parallel requests on a new key may hit them
3. Sequential is simpler to reason about and debug

Production would use a queue with controlled concurrency (e.g., 5 simultaneous Claude calls).

---

## File responsibilities

| File | What it does | What it doesn't do |
|---|---|---|
| `config/sources.ts` | Feed URLs, relevance prompt, scoring categories | No API calls, no I/O |
| `lib/fetcher.ts` | Fetch and normalise RSS feeds | No scoring, no filtering |
| `lib/scorer.ts` | Call Claude, parse response, return scored article | No fetching, no rendering |
| `lib/reporter.ts` | Generate HTML string from scored articles | No email, no file I/O |
| `lib/mailer.ts` | Send email via Resend | No HTML generation |
| `app/api/run/route.ts` | Orchestrate all the above, stream events | No UI logic |
| `app/page.tsx` | Form UI, credential handling | No API calls |
| `app/run/page.tsx` | SSE subscription, live UI rendering | No business logic |

Each file has one job. This makes the system easy to test, debug, and extend independently.

---

## The relevance prompt (the critical design decision)

The prompt in `config/sources.ts` is the core intelligence of the system. It was designed in layers:

**Layer 1: Context** — Tells Claude what Podero does, who its customers are, and what markets it operates in. Without this, the AI scores based on general energy relevance, not Podero-specific relevance.

**Layer 2: Scoring rubric** — A calibrated 0–10 scale with explicit descriptions at each band. "10 = directly actionable" is different from "7–9 = high relevance." The distinction matters: a 10 triggers immediate action, a 7 goes in the digest.

**Layer 3: Category taxonomy** — Six categories that map to Podero's commercial levers. Each category implies a different action. Regulatory → sales enablement. Competitor → positioning. Grid Stress → case study material.

**Layer 4: Commercial suggestion instruction** — Explicitly asks for a concrete action, not an observation. "Here is exactly what Podero should do" forces specificity.

**Layer 5: Response format** — Strict JSON schema, no markdown. The `cleaned` step in `scorer.ts` strips code fences if Claude wraps the response despite instructions — a common model behaviour.

---

## Tradeoffs made during development

### Built
- Full SSE streaming pipeline (fetch → score → email)
- Live three-column UI with Framer Motion animations
- Podero brand design system (exact colours, Urbanist font)
- HTML digest with category-coded cards and commercial suggestion callouts
- sessionStorage for API key (never in URL, never on server after the request)
- Input validation (key format check, empty field prevention)
- Auth error detection (401 from Anthropic surfaces immediately to UI)

### Designed but not built (cosmetic/documented)
- Scheduling automation (UI panel shows the concept; Vercel Cron Jobs is the path)
- Deduplication across runs (hash URL → Redis set → skip seen)
- Trend detection (category frequency over rolling 7 days)

### Skipped entirely
- User accounts / auth — not needed for a single-team internal tool in v1
- Database — no history requirement in the brief; stateless is fine
- Test suite — given 3–4 hour constraint, manual verification was prioritised
- Multi-language support — English-first is appropriate for this market

---

## Production path

If I were building this for real at Podero, the next steps would be:

**Week 1:** Add Vercel Cron Job for scheduled runs. Store digests in Postgres (Vercel Postgres or Neon). Add URL deduplication with a simple `seen_articles` table.

**Week 2:** Add Slack/Teams webhook delivery as an alternative to email. Add a simple admin view to see past digests and adjust feed config without code changes.

**Month 1:** Add feedback buttons to digest cards ("useful" / "not useful"). Use feedback to fine-tune the relevance prompt via few-shot examples. Add category-based alerting (9+ score → immediate Slack ping).

**Month 3:** Replace RSS with a mix of RSS + targeted web scraping for ENTSO-E press releases, national regulator updates (Bundesnetzagentur, E-Control Austria), and EPEX SPOT market announcements. Add trend analysis ("Regulatory mentions up 40% this week").
