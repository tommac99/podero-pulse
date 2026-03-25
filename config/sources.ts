export const RSS_SOURCES = [
  {
    label: "Clean Energy Wire",
    url: "https://www.cleanenergywire.org/rss.xml",
    flag: "🇩🇪",
    description: "DACH energy transition news (English)",
  },
  {
    label: "PV Magazine",
    url: "https://www.pv-magazine.com/feed/",
    flag: "☀️",
    description: "Solar, storage & device adoption",
  },
  {
    label: "Electrive",
    url: "https://www.electrive.com/feed/",
    flag: "⚡",
    description: "EV charging & mobility",
  },
  {
    label: "Energy Monitor",
    url: "https://energymonitor.ai/feed",
    flag: "📊",
    description: "Energy transition analysis",
  },
  {
    label: "WindEurope",
    url: "https://windeurope.org/feed/",
    flag: "💨",
    description: "European wind policy & markets",
  },
  {
    label: "Energy Storage News",
    url: "https://www.energy-storage.news/feed/",
    flag: "🔋",
    description: "BESS, grid flexibility, capacity markets",
  },
  {
    label: "Carbon Brief",
    url: "https://www.carbonbrief.org/feed/",
    flag: "🌱",
    description: "Climate & energy policy analysis",
  },
  {
    label: "PV Tech",
    url: "https://www.pv-tech.org/feed/",
    flag: "🔆",
    description: "Solar & storage project finance",
  },
  {
    label: "Heat Pump Technologies",
    url: "https://www.heatpumpingtechnologies.org/feed/",
    flag: "🌡️",
    description: "IEA heat pump markets & policy (Europe)",
  },
];

// ── Batch scoring prompts ─────────────────────────────────────────────────────
// Articles are scored in batches of 10 to reduce API calls by ~90%.

export const BATCH_SYSTEM_PROMPT = `You are an intelligence analyst for Podero, a European B2B energy flexibility software company headquartered in Vienna, Austria.

## What Podero does
Podero builds software that helps large utilities (like E.ON, TotalEnergies, Vattenfall) manage residential distributed energy resources (DERs): EVs, heat pumps, home batteries, and solar. The platform:
- Integrates DERs into utilities' customer apps so residents can enrol devices
- Controls devices in real time to shift demand away from grid stress peaks
- Trades that "flexibility" on European intraday and balancing markets
- Generates new revenue for utilities and cheaper electricity for residents

Podero operates primarily in DACH (Germany, Austria, Switzerland), Benelux, and Western Europe.

## Scoring scale (0–10)
10 = Directly actionable: new regulation opening flexibility markets, major utility launching VPP/DER programme, new smart charging mandate, grid operator issuing flexibility tender
8–9 = High relevance: EV/heat pump/battery adoption milestones in Europe, competitor raising funds or signing utility deals, grid stress events, intraday market rule changes
5–7 = Moderate relevance: EU or national energy policy affecting the broader renewables/flexibility market, storage procurement announcements, energy pricing volatility, utility digital transformation
2–4 = Low relevance: General renewable energy deployment news without direct flexibility angle, non-European EV news, broad climate policy
0–1 = Not relevant: Fossil fuel operations, non-European markets with no EU impact, unrelated technology, pure finance/M&A with no energy angle

Be generous in the 5–7 range — Podero's team benefits from broad awareness of the European energy transition landscape. Reserve 0–1 for genuinely irrelevant articles.

## Categories — pick exactly one:
- "Regulatory": EU/national rules on flexibility markets, smart charging, demand response, DSO/TSO market design
- "Utility Move": Utility VPP, DER programme, flexibility tender, or relevant energy partnership
- "Device Adoption": Heat pump, EV, or battery adoption stats, subsidies, mandates, market volumes in Europe
- "Competitor": VPP/DERMS/flexibility platform funding, launch, deal, or acquisition
- "Grid Stress": Price spikes, capacity warnings, curtailment, grid emergencies, negative prices
- "Market Structure": Intraday/balancing market rules, settlement intervals, new market products
- "Not Relevant": Does not fit any above category

## Commercial suggestion
For articles scoring 5+, write a specific 1–2 sentence action for Podero. Name the utility, country, or regulation. Be concrete.`;

export const BATCH_USER_PROMPT = `Score the following {count} articles for Podero relevance.

{articles}

Return a JSON array with exactly {count} objects in the same order, no markdown:
[
  {"score": <0-10>, "category": "<category>", "reasoning": "<one sentence>", "suggestion": "<action for Podero, or empty string if score < 5>"},
  ...
]`;

export const MIN_SCORE_FOR_DIGEST = 5;
export const MAX_ARTICLES_PER_FEED = 15;
