export interface Article {
  title: string;
  description: string;
  url: string;
  source: string;       // feed label e.g. "Recharge News"
  publishedAt: string;  // ISO date string
}

export type Urgency = "Act now" | "This week" | "Monitor";

export interface ScoredArticle extends Article {
  score: number;             // 0–10
  category: RelevanceCategory;
  reasoning: string;         // one sentence why it's relevant
  why_it_matters: string;    // 2-3 sentences of strategic context for Podero
  action: string;            // named, specific commercial action
  urgency: Urgency;          // time-sensitivity signal
}

export type RelevanceCategory =
  | "Regulatory"
  | "Utility Move"
  | "Device Adoption"
  | "Competitor"
  | "Grid Stress"
  | "Market Structure"
  | "Not Relevant";

export type SSEEventType =
  | "source_fetching"
  | "source_done"
  | "scoring_start"
  | "article_scored"
  | "digest_ready"
  | "digest_html"
  | "email_sent"
  | "batch_progress"
  | "error"
  | "done";

export interface SSEEvent {
  type: SSEEventType;
  payload: Record<string, unknown>;
}
