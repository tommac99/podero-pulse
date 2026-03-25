import Anthropic from "@anthropic-ai/sdk";
import { RELEVANCE_PROMPT, MIN_SCORE_FOR_DIGEST } from "@/config/sources";
import type { Article, ScoredArticle, RelevanceCategory } from "@/types";

export async function scoreArticle(
  article: Article,
  apiKey: string
): Promise<ScoredArticle> {
  const client = new Anthropic({ apiKey });

  const prompt = RELEVANCE_PROMPT
    .replace("{title}", article.title)
    .replace("{description}", article.description.slice(0, 500))
    .replace("{source}", article.source);

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";

  // Strip markdown code fences if Claude wraps in ```json
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    return {
      ...article,
      score:      Number(parsed.score) || 0,
      category:   (parsed.category as RelevanceCategory) ?? "Not Relevant",
      reasoning:  parsed.reasoning  ?? "",
      suggestion: parsed.suggestion ?? "",
    };
  } catch {
    return {
      ...article,
      score:      0,
      category:   "Not Relevant",
      reasoning:  "Failed to parse AI response",
      suggestion: "",
    };
  }
}

export function filterRelevant(articles: ScoredArticle[]): ScoredArticle[] {
  return articles
    .filter((a) => a.score >= MIN_SCORE_FOR_DIGEST)
    .sort((a, b) => b.score - a.score);
}
