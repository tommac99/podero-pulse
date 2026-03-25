import { NextRequest } from "next/server";
import { fetchFeed } from "@/lib/fetcher";
import { scoreArticle, filterRelevant } from "@/lib/scorer";
import { generateDigest } from "@/lib/reporter";
import { sendDigest } from "@/lib/mailer";
import { RSS_SOURCES } from "@/config/sources";
import type { Article, ScoredArticle } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 120;

function sseMessage(type: string, payload: unknown): string {
  return `data: ${JSON.stringify({ type, payload })}\n\n`;
}

export async function POST(req: NextRequest) {
  let email: string;
  let claudeApiKey: string;

  try {
    const body = await req.json();
    email = body.email;
    claudeApiKey = body.claudeApiKey;
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  if (!email || !claudeApiKey) {
    return new Response("Missing required fields: email, claudeApiKey", { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (type: string, payload: unknown) => {
        try {
          controller.enqueue(encoder.encode(sseMessage(type, payload)));
        } catch {
          // Stream may already be closed
        }
      };

      try {
        // ── Phase 1: Fetch all RSS feeds ──────────────────────────────
        const allArticles: Article[] = [];

        for (const source of RSS_SOURCES) {
          send("source_fetching", { label: source.label });
          try {
            const articles = await fetchFeed(source.label, source.url);
            allArticles.push(...articles);
            send("source_done", { label: source.label, count: articles.length });
          } catch (err) {
            send("source_done", {
              label: source.label,
              count: 0,
              error: true,
              message: String(err),
            });
          }
        }

        // Deduplicate by URL
        const seen = new Set<string>();
        const deduped = allArticles.filter((a) => {
          if (!a.url || seen.has(a.url)) return false;
          seen.add(a.url);
          return true;
        });

        send("scoring_start", { total: deduped.length });

        // ── Phase 2: Score articles with Claude ───────────────────────
        const scoredArticles: ScoredArticle[] = [];

        for (const article of deduped) {
          try {
            const scored = await scoreArticle(article, claudeApiKey);
            scoredArticles.push(scored);
            send("article_scored", scored);
          } catch (err) {
            // If Claude API key is wrong, surface error immediately
            const message = String(err);
            if (message.includes("401") || message.includes("authentication")) {
              send("error", { message: "Invalid Anthropic API key. Please check and try again." });
              controller.close();
              return;
            }
            // Otherwise skip this article silently
          }
        }

        // ── Phase 3: Generate digest ──────────────────────────────────
        const relevant = filterRelevant(scoredArticles);
        const date = new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        const digest = generateDigest(relevant, date);

        // Send digest HTML as a separate chunk to avoid huge SSE messages
        send("digest_ready", { count: relevant.length, date });

        // ── Phase 4: Send email ───────────────────────────────────────
        try {
          await sendDigest(email, digest, date);
          send("email_sent", { to: email });
        } catch (err) {
          send("error", { message: `Email delivery failed: ${String(err)}` });
        }

        // ── Phase 5: Send full HTML for browser preview ───────────────
        // Sent last so it doesn't slow down the live feed
        send("digest_html", { html: digest });

      } catch (err) {
        send("error", { message: String(err) });
      } finally {
        send("done", {});
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
