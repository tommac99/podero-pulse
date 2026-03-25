import Anthropic from "@anthropic-ai/sdk";
import { BATCH_SYSTEM_PROMPT, BATCH_USER_PROMPT, MIN_SCORE_FOR_DIGEST } from "@/config/sources";
import type { Article, ScoredArticle, RelevanceCategory } from "@/types";

const BATCH_SIZE = 10;

interface BatchResult {
  score: number;
  category: RelevanceCategory;
  reasoning: string;
  suggestion: string;
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

  // Build the article list for the prompt
  const articleList = articles
    .map((a, i) => `[${i + 1}] Title: ${a.title}\nSource: ${a.source}\nDescription: ${a.description.slice(0, 300)}`)
    .join("\n\n");

  const userPrompt = BATCH_USER_PROMPT.replace("{articles}", articleList).replace(
    "{count}",
    String(articles.length)
  );

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 150 * articles.length, // ~150 tokens per article result
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
    // If parsing fails, return all articles as not relevant
    return articles.map((a) => ({
      ...a,
      score: 0,
      category: "Not Relevant" as RelevanceCategory,
      reasoning: "Batch parse failed",
      suggestion: "",
    }));
  }

  return articles.map((article, i) => {
    const r = results[i];
    if (!r) {
      return { ...article, score: 0, category: "Not Relevant" as RelevanceCategory, reasoning: "", suggestion: "" };
    }
    return {
      ...article,
      score:      Number(r.score) || 0,
      category:   (r.category as RelevanceCategory) ?? "Not Relevant",
      reasoning:  r.reasoning  ?? "",
      suggestion: r.suggestion ?? "",
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
