import Parser from "rss-parser";
import { RSS_SOURCES, MAX_ARTICLES_PER_FEED } from "@/config/sources";
import type { Article } from "@/types";

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "Podero-Pulse/1.0 (energy news aggregator)",
    "Accept": "application/rss+xml, application/xml, text/xml, */*",
  },
});

export async function fetchAllFeeds(): Promise<Article[]> {
  const results = await Promise.allSettled(
    RSS_SOURCES.map((source) => fetchFeed(source.label, source.url))
  );

  return results
    .filter((r): r is PromiseFulfilledResult<Article[]> => r.status === "fulfilled")
    .flatMap((r) => r.value);
}

export async function fetchFeed(label: string, url: string): Promise<Article[]> {
  const feed = await parser.parseURL(url);

  return feed.items.slice(0, MAX_ARTICLES_PER_FEED).map((item) => ({
    title:       (item.title ?? "Untitled").trim(),
    description: (item.contentSnippet ?? item.summary ?? item.content ?? "").replace(/<[^>]+>/g, "").slice(0, 600).trim(),
    url:         item.link ?? item.guid ?? "",
    source:      label,
    publishedAt: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
  }));
}
