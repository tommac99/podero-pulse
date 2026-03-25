import Anthropic from "@anthropic-ai/sdk";
import {
  BATCH_SYSTEM_PROMPT,
  BATCH_USER_PROMPT,
  SYNTHESIS_SYSTEM_PROMPT,
  SYNTHESIS_USER_PROMPT,
  MIN_SCORE_FOR_DIGEST,
} from "@/config/sources";
import type { Article, ScoredArticle, RelevanceCategory, Urgency } from "@/types";

const BATCH_SIZE = 10;

interface BatchResult {
  score: number;
  category: RelevanceCategory;
  reasoning: string;
  why_it_matters: string;
  action: string;
  urgency: Urgency;
}

/**
 * Score a batch of articles in a single Claude call.
 * Returns scored articles in the same order as the input.
 */
export async function scoreBatch(
  articles: Article[],
  apiKey: string
): Promise<ScoredArticle[]> {
  const client = new Anthropic({ apiKey });

  const articleList = articles
    .map((a, i) => `[${i + 1}] Title: ${a.title}\nSource: ${a.source}\nDescription: ${a.description.slice(0, 300)}`)
    .join("\n\n");

  const userPrompt = BATCH_USER_PROMPT
    .replace("{articles}", articleList)
    .replace(/{count}/g, String(articles.length));

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 250 * articles.length, // more tokens for richer fields
    system: BATCH_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "[]";
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  let results: BatchResult[];
  try {
    results = JSON.parse(cleaned);
    if (!Array.isArray(results)) throw new Error("Not an array");
  } catch {
    return articles.map((a) => ({
      ...a,
      score: 0,
      category: "Not Relevant" as RelevanceCategory,
      reasoning: "Batch parse failed",
      why_it_matters: "",
      action: "",
      urgency: "Monitor" as Urgency,
    }));
  }

  return articles.map((article, i) => {
    const r = results[i];
    if (!r) {
      return {
        ...article,
        score: 0,
        category: "Not Relevant" as RelevanceCategory,
        reasoning: "",
        why_it_matters: "",
        action: "",
        urgency: "Monitor" as Urgency,
      };
    }
    return {
      ...article,
      score:           Number(r.score) || 0,
      category:        (r.category as RelevanceCategory) ?? "Not Relevant",
      reasoning:       r.reasoning       ?? "",
      why_it_matters:  r.why_it_matters  ?? "",
      action:          r.action          ?? "",
      urgency:         (r.urgency as Urgency) ?? "Monitor",
    };
  });
}

/**
 * Score all articles in batches, calling onBatchScored after each batch.
 */
export async function scoreAllArticles(
  articles: Article[],
  apiKey: string,
  onBatchScored: (batch: ScoredArticle[]) => void
): Promise<ScoredArticle[]> {
  const all: ScoredArticle[] = [];

  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    const batch = articles.slice(i, i + BATCH_SIZE);
    const scored = await scoreBatch(batch, apiKey);
    all.push(...scored);
    onBatchScored(scored);
  }

  return all;
}

export function filterRelevant(articles: ScoredArticle[]): ScoredArticle[] {
  return articles
    .filter((a) => a.score >= MIN_SCORE_FOR_DIGEST)
    .sort((a, b) => b.score - a.score);
}

/**
 * Generate a 4–6 sentence executive intelligence brief synthesising the top signals.
 */
export async function generateSynthesis(
  articles: ScoredArticle[],
  apiKey: string
): Promise<string> {
  if (articles.length === 0) return "";

  const client = new Anthropic({ apiKey });

  const signals = articles
    .slice(0, 12) // top 12 signals are enough context
    .map((a, i) =>
      `[${i + 1}] ${a.title} (${a.category}, ${a.score}/10)\n${a.why_it_matters || a.reasoning}`
    )
    .join("\n\n");

  const userPrompt = SYNTHESIS_USER_PROMPT.replace("{signals}", signals);

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: SYNTHESIS_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });
    return response.content[0].type === "text" ? response.content[0].text.trim() : "";
  } catch {
    return "";
  }
}
