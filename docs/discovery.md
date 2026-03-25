# Discovery: How Podero Pulse Was Designed

## Starting point: understanding the business

The brief asked for a news screening tool relevant to Podero. Before thinking about technology, I needed to understand what "relevant" actually means in this context — which required understanding the business deeply.

From reading *The Energy Constraint* and Podero's website, I built this picture:

**What Podero sells:** Software that turns residential energy devices (EVs, heat pumps, batteries) into a tradeable resource for utilities. The utility earns new revenue by selling "flexibility" — controlled shifts in device consumption — on intraday and balancing markets.

**Who the customer is:** Large European utilities (E.ON, TotalEnergies, Vattenfall), specifically their residential and smart energy teams.

**Where the value is created:** At the intersection of three forces:
1. Device adoption (more EVs and heat pumps = more flexibility potential)
2. Market rules (regulations that allow and pay for demand response)
3. Grid stress (higher stress = higher price for flexibility = more Podero value)

This immediately told me what categories of news matter, and more importantly, *why* they matter commercially.

---

## Defining the relevance taxonomy

This was the most important design decision. A relevance filter is only as good as its rubric.

I identified six categories that map directly to Podero's commercial levers:

### 1. Regulatory
**Why it matters:** A single directive can open or close an entire flexibility market overnight. The EU's RED III, national smart charging mandates, and DSO market design rules directly determine whether Podero can sell services in a given country.

**Commercial signal:** New regulation = new market entry opportunity OR existing market threat.

**Example action:** "Germany finalises §14a smart charging rules → Podero's DACH sales team should accelerate utility outreach before Q4 compliance deadlines."

### 2. Utility Move
**Why it matters:** When E.ON or Vattenfall announces a VPP programme or DER partnership, it signals they see flexibility as a priority — and are likely evaluating vendors. It also reveals who Podero's direct competitors are selling to.

**Commercial signal:** Utility announcement = warm sales moment.

**Example action:** "Vattenfall launches heat pump flexibility trial in Sweden → Podero should contact Vattenfall's residential team with a comparison of their trial's manual approach vs. Podero's automated platform."

### 3. Device Adoption
**Why it matters:** Each new EV mandate or heat pump subsidy directly expands Podero's total addressable market. A country that subsidises 500,000 heat pump installs is creating 500,000 potential Podero endpoints.

**Commercial signal:** Adoption milestone = expand addressable market argument for that country.

**Example action:** "Austria's heat pump subsidy hits 200,000 installs → Update Austrian utility pitch deck to reflect new TAM; lead with specific flexibility revenue per device."

### 4. Competitor
**Why it matters:** This is a young market with a small number of well-funded players (Next Kraftwerke, Ørsted Flex, Sympower, etc.). A competitor raising a round or signing a major utility deal changes the competitive landscape and signals where the market is moving.

**Commercial signal:** Competitor move = adjust positioning, accelerate deals in contested markets.

**Example action:** "Sympower signs deal with Danish DSO → Podero should audit its Danish pipeline and prioritise any utilities who haven't signed with a competitor yet."

### 5. Grid Stress
**Why it matters:** Grid stress events (price spikes, capacity warnings, curtailment) are the moments when flexibility value is highest and most visible. They're also the proof points that make Podero's value proposition concrete for utility buyers.

**Commercial signal:** Stress event = use as case study material, accelerate sales conversations.

**Example action:** "ENTSO-E issues capacity warning for Germany winter 2026 → Send existing German utility prospects a one-pager showing what Podero's fleet would have earned during this event."

### 6. Market Structure
**Why it matters:** Changes to how intraday and balancing markets work (settlement intervals, minimum bid sizes, new product types) directly affect what Podero can offer and at what economics.

**Commercial signal:** Market structure change = update commercial model, identify new revenue streams.

**Example action:** "EPEX SPOT launches 15-minute settlement product → Podero can now offer utilities finer-grained trading — update the platform roadmap and sales narrative."

---

## Why RSS feeds over a news API

**Decision:** Use curated RSS feeds rather than a general news API (like NewsAPI.org).

**Reasoning:**
- A general news API returns millions of articles; 99%+ are irrelevant. Even with filtering, signal-to-noise is poor for a niche B2B topic.
- Energy-specific RSS feeds are already filtered to the right domain. Every article in Recharge News or EURACTIV Energy is at least adjacent to Podero's world.
- RSS is free, has no rate limits, and the sources chosen (Recharge, EURACTIV, PV Magazine, Electrive, Energy Monitor, Montel) cover the specific signals Podero cares about.
- The cost of adding more feeds later is zero.

**Tradeoff:** RSS misses breaking news from non-specialist outlets (e.g., Reuters covering a major grid failure). A production system would add a lightweight general news query for high-urgency grid stress events.

---

## Why Claude Haiku for scoring

**Decision:** Use Claude Haiku 4.5, not Sonnet or Opus.

**Reasoning:**
- Scoring an article for relevance is a classification task, not a reasoning task. It requires understanding context and matching to a rubric — Haiku is capable at this.
- A typical run scores ~75 articles. At Haiku pricing (~$0.25 per million input tokens), a full run costs less than $0.02. Sonnet would cost ~10x more with no meaningful accuracy improvement for this task.
- Speed: Haiku is 3–5x faster than Sonnet, which matters for the live streaming UX.

**Tradeoff:** For very nuanced articles (complex regulatory language, multi-country policy), Haiku occasionally miscategorises. Production would use Sonnet for articles above a certain complexity threshold, or route all regulatory articles to Sonnet.

---

## The delivery format decision

**Decision:** Live web app with SSE streaming + browser digest preview + email delivery.

**Why not a static document or spreadsheet:**
- A document shows the output but not the process. The brief explicitly evaluates "ability to design a workflow that could actually run regularly." A live app demonstrates this concretely.
- The streaming UI makes the AI's decision-making visible — you watch it read and rank articles in real time. This is the memorable moment that answers "do you understand how this works and why it matters."

**Why email + browser preview:**
- Email is the natural delivery format for a digest (suits the "regular summary" brief).
- Browser preview lets reviewers see the output without checking their inbox.

**Why Vercel:**
- Zero-config Next.js deployment. The reviewer can click a URL, not download a repo.

---

## What I would build next (with more time)

1. **Scheduled runs** via Vercel Cron Jobs — daily 7am digest, triggered automatically
2. **Deduplication** — hash article URLs, skip articles seen in the last 7 days
3. **Trend detection** — "Regulatory category has spiked 3x this week" summary at the top of the digest
4. **Alert mode** — immediate Slack notification for articles scoring 9+ (grid emergency, major regulation)
5. **Feedback loop** — allow users to rate suggestions; use ratings to improve the relevance prompt over time
6. **Source expansion** — add ENTSO-E press releases, Bundesnetzagentur SMARD reports, and Austrian E-Control announcements for deeper DACH coverage
