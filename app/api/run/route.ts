import { NextRequest } from "next/server";
import { fetchFeed } from "@/lib/fetcher";
import { scoreAllArticles, filterRelevant, generateSynthesis } from "@/lib/scorer";
import { generateDigest } from "@/lib/reporter";
import { sendDigest } from "@/lib/mailer";
import { RSS_SOURCES } from "@/config/sources";
import type { Article } from "@/types";

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
          // Stream already closed
        }
      };

      try {
        // ── Phase 1: Fetch all RSS feeds in parallel ──────────────────
        const allArticles: Article[] = [];

        for (const source of RSS_SOURCES) {
          send("source_fetching", { label: source.label });
        }

        const fetchResults = await Promise.allSettled(
          RSS_SOURCES.map((source) => fetchFeed(source.label, source.url))
        );

        fetchResults.forEach((result, i) => {
          const source = RSS_SOURCES[i];
          if (result.status === "fulfilled") {
            allArticles.push(...result.value);
            send("source_done", { label: source.label, count: result.value.length });
          } else {
            send("source_done", { label: source.label, count: 0, error: true });
          }
        });

        // Deduplicate by URL
        const seen = new Set<string>();
        const deduped = allArticles.filter((a) => {
          if (!a.url || seen.has(a.url)) return false;
          seen.add(a.url);
          return true;
        });

        send("scoring_start", { total: deduped.length });

        // ── Phase 2: Batch score with Claude ─────────────────────────
        let scoredCount = 0;
        const scoredArticles = await scoreAllArticles(
          deduped,
          claudeApiKey,
          (batch) => {
            scoredCount += batch.length;
            for (const article of batch) {
              send("article_scored", article);
            }
            send("batch_progress", { scored: scoredCount, total: deduped.length });
          }
        );

        // ── Phase 3: Generate synthesis brief ────────────────────────
        const relevant = filterRelevant(scoredArticles);
        const synthesis = await generateSynthesis(relevant, claudeApiKey);

        // ── Phase 4: Generate digest ──────────────────────────────────
        const date = new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        const digest = generateDigest(relevant, date, synthesis);

        send("digest_ready", { count: relevant.length, date });

        // ── Phase 5: Send email ───────────────────────────────────────
        try {
          await sendDigest(email, digest, date);
          send("email_sent", { to: email });
        } catch (err) {
          send("error", { message: `Email delivery failed: ${String(err)}` });
        }

        // ── Phase 6: Send full HTML for browser preview ───────────────
        send("digest_html", { html: digest });

      } catch (err) {
        const message = String(err);
        if (message.includes("401") || message.includes("authentication")) {
          send("error", { message: "Invalid Anthropic API key. Please check and try again." });
        } else {
          send("error", { message });
        }
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
