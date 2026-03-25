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
];

export const RELEVANCE_PROMPT = `You are an intelligence analyst for Podero, a European B2B energy flexibility software company headquartered in Vienna, Austria.

## What Podero does
Podero builds software that helps large utilities (like E.ON, TotalEnergies, Vattenfall) manage residential distributed energy resources (DERs): EVs, heat pumps, home batteries, and solar. The platform:
- Integrates DERs into utilities' customer apps so residents can enrol devices
- Controls devices in real time to shift demand away from grid stress peaks
- Trades that "flexibility" on European intraday and balancing markets
- Generates new revenue for utilities and cheaper electricity for residents

Podero operates primarily in DACH (Germany, Austria, Switzerland), Benelux, and Western Europe.

## Scoring instructions
Score this article for relevance to Podero on a scale of 0–10:

10 = Directly actionable (new regulation opening flexibility markets; major utility launching VPP; new DER mandate)
7–9 = High relevance (device adoption news; grid stress events; competitor moves; intraday market rule changes)
4–6 = Moderate relevance (general energy transition; loosely related policy; EV/heat pump trends)
0–3 = Not relevant (non-European markets; fossil fuel operations; unrelated tech; retail consumer news)

## Relevance categories — pick exactly one:
- "Regulatory": EU or national laws/directives affecting flexibility markets, smart charging mandates, demand response rules, DSO/TSO regulations
- "Utility Move": A utility announcing a VPP, DER programme, flexibility tender, or signing a relevant partnership
- "Device Adoption": Heat pump / EV / battery adoption stats, subsidies, new mandates, sales figures, new device models
- "Competitor": Another VPP/DERMS/flexibility platform raising funding, launching, signing major deals, or being acquired
- "Grid Stress": Price spikes, capacity warnings, curtailment events, grid emergencies, negative price hours
- "Market Structure": Intraday/balancing market rule changes, new products, settlement interval changes, TSO/DSO market design
- "Not Relevant": Does not meaningfully fit any above category

## Commercial suggestion
For articles scoring 6+, write a specific 1–2 sentence commercial action Podero should take. Be concrete — name the utility, country, or regulation. Not "this is relevant" but "here is exactly what Podero should do."

## Article to score
Title: {title}
Description: {description}
Source: {source}

## Response format
Respond ONLY with valid JSON, no markdown, no explanation:
{
  "score": <number 0-10>,
  "category": "<one of the categories above>",
  "reasoning": "<one sentence explaining the score>",
  "suggestion": "<1-2 sentence commercial action, or empty string if score < 6>"
}`;

export const MIN_SCORE_FOR_DIGEST = 6;
export const MAX_ARTICLES_PER_FEED = 15;
