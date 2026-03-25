import type { ScoredArticle } from "@/types";

const CATEGORY_COLORS: Record<string, string> = {
  "Regulatory":       "#7D5BE6",
  "Utility Move":     "#54E3EA",
  "Device Adoption":  "#079C43",
  "Competitor":       "#F44563",
  "Grid Stress":      "#B28504",
  "Market Structure": "#057BFF",
};

const CATEGORY_TEXT: Record<string, string> = {
  "Utility Move": "#262626",
};

const URGENCY_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  "Act now":   { bg: "#F44563", color: "#ffffff", label: "⚡ ACT NOW" },
  "This week": { bg: "#B28504", color: "#ffffff", label: "🕐 THIS WEEK" },
  "Monitor":   { bg: "#e0e0d8", color: "#666666", label: "👁 MONITOR" },
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function generateDigest(
  articles: ScoredArticle[],
  date: string,
  synthesis: string = ""
): string {
  const cards = articles.map((a) => {
    const bgColor = CATEGORY_COLORS[a.category] ?? "#7D5BE6";
    const textColor = CATEGORY_TEXT[a.category] ?? "#ffffff";
    const pubDate = formatDate(a.publishedAt);
    const urgency = URGENCY_STYLES[a.urgency] ?? URGENCY_STYLES["Monitor"];

    return `
    <div style="background:#ffffff;border-radius:10px;padding:24px;margin-bottom:16px;border-left:4px solid ${bgColor};box-shadow:0 1px 4px rgba(38,38,38,0.08);">

      <!-- Category + urgency row -->
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="background:${bgColor};color:${textColor};font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;letter-spacing:0.1em;text-transform:uppercase;font-family:Arial,sans-serif;">${a.category}</span>
          <span style="background:${urgency.bg};color:${urgency.color};font-size:9px;font-weight:700;padding:3px 8px;border-radius:20px;letter-spacing:0.08em;font-family:Arial,sans-serif;">${urgency.label}</span>
        </div>
        <span style="font-size:11px;color:#aaa;font-family:monospace;">${a.source} · ${pubDate} · ${a.score.toFixed(1)}/10</span>
      </div>

      <!-- Title -->
      <h3 style="font-size:16px;font-weight:700;margin:0 0 8px;color:#262626;line-height:1.35;font-family:Arial,sans-serif;">
        <a href="${a.url}" style="color:#7D5BE6;text-decoration:underline;text-underline-offset:3px;" target="_blank" rel="noopener">${a.title} <span style="font-size:13px;font-weight:400;">↗</span></a>
      </h3>

      <!-- Description -->
      ${a.description ? `<p style="font-size:13px;color:#666;margin:0 0 14px;line-height:1.55;font-family:Arial,sans-serif;">${a.description.slice(0, 240)}${a.description.length > 240 ? "…" : ""}</p>` : ""}

      <!-- Intelligence block -->
      ${(a.why_it_matters || a.action) ? `
      <div style="background:#F0F0E9;border-radius:6px;padding:14px 16px;border-left:3px solid #7D5BE6;">
        <div style="font-size:10px;font-weight:700;color:#7D5BE6;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;font-family:Arial,sans-serif;">Podero Intelligence</div>
        ${a.why_it_matters ? `<p style="font-size:13px;color:#444;margin:0 0 10px;line-height:1.6;font-family:Arial,sans-serif;">${a.why_it_matters}</p>` : ""}
        ${a.action ? `
        <div style="display:flex;align-items:flex-start;gap:8px;padding-top:10px;border-top:1px solid rgba(38,38,38,0.08);">
          <span style="font-size:10px;font-weight:700;color:#7D5BE6;text-transform:uppercase;letter-spacing:0.08em;white-space:nowrap;padding-top:2px;font-family:Arial,sans-serif;">Recommended action</span>
          <p style="font-size:13px;color:#262626;margin:0;line-height:1.55;font-family:Arial,sans-serif;font-weight:600;">${a.action}</p>
        </div>` : ""}
      </div>` : ""}

    </div>`;
  }).join("\n");

  const categoryBreakdown = Object.entries(
    articles.reduce((acc, a) => {
      acc[a.category] = (acc[a.category] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([cat, count]) => {
    const color = CATEGORY_COLORS[cat] ?? "#7D5BE6";
    const textCol = CATEGORY_TEXT[cat] ?? "#fff";
    return `<span style="background:${color};color:${textCol};font-size:10px;font-weight:700;padding:2px 8px;border-radius:12px;margin-right:6px;font-family:Arial,sans-serif;">${cat} ${count}</span>`;
  }).join("");

  const synthesisBlock = synthesis ? `
    <!-- Executive brief -->
    <div style="background:#7D5BE6;border-radius:10px;padding:24px;margin-bottom:24px;">
      <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.12em;margin-bottom:10px;font-family:Arial,sans-serif;">Intelligence Brief</div>
      <p style="font-size:14px;color:#ffffff;margin:0;line-height:1.7;font-family:Arial,sans-serif;">${synthesis}</p>
    </div>
    <!-- Divider -->
    <div style="height:1px;background:rgba(38,38,38,0.1);margin-bottom:24px;"></div>
  ` : `
    <!-- Divider -->
    <div style="height:1px;background:rgba(38,38,38,0.1);margin-bottom:24px;"></div>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Podero Pulse — ${date}</title>
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <style>
    :root { color-scheme: light; }
    body { background-color: #F0F0E9 !important; color: #262626 !important; }
    @media (prefers-color-scheme: dark) {
      body { background-color: #F0F0E9 !important; color: #262626 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#F0F0E9 !important;font-family:Arial,sans-serif;color-scheme:light;">
  <div style="max-width:680px;margin:0 auto;padding:40px 24px 60px;">

    <!-- Header -->
    <div style="margin-bottom:32px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
        <div style="width:28px;height:28px;background:#7D5BE6;border-radius:6px;display:flex;align-items:center;justify-content:center;">
          <span style="color:#fff;font-size:13px;font-weight:700;font-family:Arial;">P</span>
        </div>
        <span style="font-weight:700;color:#262626;font-size:14px;letter-spacing:-0.01em;">Podero Pulse</span>
      </div>
      <h1 style="font-size:26px;font-weight:700;color:#262626;margin:0 0 6px;letter-spacing:-0.02em;line-height:1.1;">
        European Energy Intelligence
      </h1>
      <p style="font-size:13px;color:#888;margin:0 0 16px;">${date} · ${articles.length} relevant signal${articles.length !== 1 ? "s" : ""} from ${new Set(articles.map(a => a.source)).size} feeds</p>
      <div style="margin-bottom:8px;">${categoryBreakdown}</div>
    </div>

    ${synthesisBlock}

    <!-- Cards -->
    ${cards}

    <!-- Footer -->
    <div style="margin-top:40px;padding-top:20px;border-top:1px solid rgba(38,38,38,0.1);text-align:center;">
      <p style="font-size:11px;color:#bbb;margin:0;">
        Generated by Podero Pulse · AI-powered news screening for energy flexibility markets<br>
        <a href="https://podero.energy" style="color:#7D5BE6;text-decoration:none;">podero.energy</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}
