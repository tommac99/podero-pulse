# Podero Pulse

**European energy intelligence, automated.**

A hosted web app that monitors 6 European energy RSS feeds, scores each article for Podero-relevance using Claude AI (live, in your browser), and delivers a formatted digest to your inbox.

Built as a case assignment for the Podero GTM Engineer Intern role.

---

## What it does

1. **Fetches** articles from 6 curated European energy RSS feeds in parallel
2. **Scores** each article 0–10 for Podero-relevance using Claude Haiku, assigning a category and reasoning
3. **Surfaces** relevant articles (score ≥ 6) with a specific commercial suggestion for Podero
4. **Renders** a live digest in the browser as scoring happens — you watch the AI work
5. **Emails** the final digest to your inbox via Resend

---

## Live demo

> **https://podero-pulse.vercel.app**

---

## Run locally

### Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com) (users bring their own)
- A [Resend](https://resend.com) account + API key (for email delivery)

### Setup

```bash
git clone https://github.com/<your-username>/podero-pulse
cd podero-pulse
npm install
cp .env.example .env.local
```

Edit `.env.local`:

```env
RESEND_API_KEY=re_your_key_here
RESEND_FROM_EMAIL=onboarding@resend.dev
```

> **Note:** On Resend's free tier, `onboarding@resend.dev` only delivers to your own verified email. To send to any address, verify a domain in your Resend dashboard.

### Start

```bash
npm run dev
# → http://localhost:3000
```

Open the app, enter your email and Anthropic API key, and click **Run digest**.

---

## Deploy to Vercel

```bash
npx vercel --yes
```

Then set environment variables in the Vercel dashboard:
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

The Anthropic API key is entered by users in the UI — it is **never stored** server-side.

---

## Project structure

```
app/
  page.tsx           Landing page (form + schedule panel)
  run/page.tsx       Live run view (three-column: sources / scoring / digest)
  api/run/route.ts   SSE streaming API (fetch → score → email)
lib/
  fetcher.ts         RSS feed ingestion
  scorer.ts          Claude relevance scoring
  reporter.ts        HTML digest generation
  mailer.ts          Resend email delivery
config/
  sources.ts         Feed URLs, relevance prompt, category definitions
types/
  index.ts           Shared TypeScript interfaces
components/
  SourceCard.tsx     Feed status indicator
  ArticleCard.tsx    Scored article with live score animation
  DigestPreview.tsx  In-browser iframe digest preview
  SchedulePanel.tsx  Automation UI (cosmetic — see "What's not built")
docs/
  discovery.md       How the tool was designed — relevance taxonomy & decisions
  implementation-plan.md  Technical strategy and tradeoffs
  how-it-works.md    Full explanation of the system
```

---

## What's not built (and why)

| Feature | Decision |
|---|---|
| **Scheduling** | The UI shows the concept. In production: Vercel Cron Jobs (`vercel.json`) would trigger `/api/run` on a schedule. Skipped to stay within the time budget. |
| **Persistence** | No database — each run is stateless. Production would store digests in Postgres to enable deduplication, history, and trend analysis. |
| **Auth** | Anyone with the URL can use it. Production would use NextAuth or Clerk for user accounts and managed API keys. |
| **Deduplication** | Articles seen in a previous run are not filtered out. Production: hash article URLs and skip seen. |
| **Error retry** | If a feed fails, it's skipped. Production: exponential backoff + dead letter queue. |

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | Full-stack in one repo, streaming support, Vercel-native |
| Language | TypeScript | Type safety for the scoring pipeline is valuable here |
| AI | Claude Haiku 4.5 | Fast + cheap for per-article scoring at scale; Sonnet for production |
| Styling | Tailwind + Podero brand tokens | Matches Podero's design system exactly |
| Animation | Framer Motion | The live scoring animation is the key UX moment |
| Email | Resend | Simplest email API, free tier sufficient |
| Hosting | Vercel | Zero-config Next.js deployment |

---

## Feeds monitored

| Feed | Coverage |
|---|---|
| Recharge News | Leading renewables trade press |
| EURACTIV Energy | EU energy policy & directives |
| PV Magazine | Solar, storage, device adoption |
| Electrive | EV charging & mobility market |
| Energy Monitor | Energy transition analysis |
| Montel News | Energy trading & market prices |
