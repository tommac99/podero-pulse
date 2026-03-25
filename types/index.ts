export interface Article {
  title: string;
  description: string;
  url: string;
  source: string;       // feed label e.g. "Recharge News"
  publishedAt: string;  // ISO date string
}

export interface ScoredArticle extends Article {
  score: number;             // 0–10
  category: RelevanceCategory;
  reasoning: string;         // one sentence why it's relevant
  suggestion: string;        // commercial suggestion for Podero
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
  | "email_sent"
  | "error"
  | "done";

export interface SSEEvent {
  type: SSEEventType;
  payload: Record<string, unknown>;
}
