# How It Works

## User perspective

1. Open the app (Vercel URL or `localhost:3000`)
2. Enter your email address and your Anthropic API key
3. Click **Run digest**
4. Watch the three-column live view:
   - **Left**: Each of the 6 RSS feeds lights up as it's fetched
   - **Centre**: Articles stream in one by one, each with an AI-assigned score (0–10) and category badge. Relevant articles (≥6) show a specific commercial suggestion. Irrelevant ones fade out.
   - **Right**: The final digest assembles itself as high-scoring articles are confirmed
5. The digest is emailed to you. You can also read it directly in the browser.

---

## Technical walkthrough

### Step 1: Credential handling

On the landing page, you enter your email and Anthropic API key. When you click Run:
- Both values are stored in `sessionStorage` (browser memory, not persisted, cleared when tab closes)
- The browser navigates to `/run`
- The run page reads the credentials from `sessionStorage`

**Why not pass them in the URL?** API keys in URLs appear in browser history, server access logs, and HTTP referer headers. `sessionStorage` keeps them in memory only, for the lifetime of this tab.

### Step 2: SSE stream opens

The run page sends a `POST /api/run` request with `{ email, claudeApiKey }` as JSON. The server responds with a `text/event-stream` — a long-lived HTTP connection that streams JSON events back to the browser as work progresses. The browser reads these events and updates the UI in real time.

### Step 3: RSS feed ingestion

The API route calls `fetchFeed()` for each of the 6 sources, one at a time. For each:
- Sends `source_fetching` event → left column dot turns teal + pulsing
- Fetches and parses the RSS XML using `rss-parser`
- Normalises each item into an `Article` (title, description, URL, source, date)
- Sends `source_done` event with article count → dot turns green

Articles are deduplicated by URL before scoring begins.

### Step 4: Claude scoring

For each article, the API route calls `scoreArticle()`:
1. Builds a prompt by injecting the article title, description, and source into the relevance template from `config/sources.ts`
2. Calls Claude Haiku 4.5 with the prompt (max 400 tokens output)
3. Parses the JSON response to extract: `score`, `category`, `reasoning`, `suggestion`
4. Sends an `article_scored` event to the browser

The browser receives each scored article and renders it as an `ArticleCard`. The score animates from 0 → final value. Articles scoring below 6 are dimmed. Articles scoring 8+ get a teal border.

### Step 5: Digest generation

After all articles are scored, `filterRelevant()` keeps articles with score ≥ 6, sorted by score descending. `generateDigest()` produces a self-contained HTML email with:
- Category-coded card per article
- Source, date, and score
- "Podero opportunity" callout block with the commercial suggestion

### Step 6: Email delivery

`sendDigest()` calls the Resend API with the HTML digest. The `RESEND_API_KEY` is a server-side environment variable — it never touches the browser. The user receives the digest in their inbox within seconds.

### Step 7: Browser preview

The full digest HTML is sent as a final SSE event and rendered in an `<iframe>` in the right column. This gives instant access to the digest without waiting for the email.

---

## The relevance scoring logic

The key to the tool is the prompt in `config/sources.ts`. It tells Claude:

1. **What Podero is** — B2B energy flexibility software for European utilities
2. **What the scoring scale means** — 10 = directly actionable, 0–3 = irrelevant, with concrete descriptions at each band
3. **The six categories** — each maps to a commercial action type
4. **What a good suggestion looks like** — not "this is relevant" but "here is the specific thing Podero should do"

Claude returns structured JSON. The scorer strips any markdown formatting Claude might add, then parses the JSON. If parsing fails (rare), the article gets a score of 0 and is filtered out.

---

## The schedule panel

The "Automate this digest" panel on the landing page is cosmetic — it doesn't do anything yet. In production, it would use **Vercel Cron Jobs**:

```json
// vercel.json
{
  "crons": [{
    "path": "/api/run-scheduled",
    "schedule": "0 7 * * 1-5"
  }]
}
```

This would trigger a new digest every weekday at 7am, using server-stored credentials (not user-provided), and deliver to a configured list of recipients. The UI would let you choose the frequency and manage recipients.

---

## What "relevant for Podero" means

An article is relevant if it changes Podero's commercial landscape in a measurable way:

| Category | What it changes | Example |
|---|---|---|
| **Regulatory** | Which markets Podero can enter; what the compliance deadline is | "Germany finalises §14a smart charging rules" |
| **Utility Move** | Which utilities are actively buying, and what they're evaluating | "E.ON launches residential VPP programme" |
| **Device Adoption** | How large the addressable device fleet is in a given market | "Austria hits 200,000 heat pump installs" |
| **Competitor** | Who else is selling what Podero sells, and to whom | "Sympower raises €50m Series B" |
| **Grid Stress** | When and where flexibility value is highest; proof points for sales | "ENTSO-E issues winter capacity warning for Germany" |
| **Market Structure** | How intraday/balancing markets pay for flexibility | "EPEX SPOT launches 15-minute product" |

An article about a UK coal plant closing is energy news, but it doesn't change any of these. Score: 1–2. Not in the digest.

An article about Austria mandating smart charging for all new EV installations directly expands Podero's addressable market in its home country. Score: 9. In the digest with a specific action.
