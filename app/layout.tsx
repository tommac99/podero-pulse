import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Podero Pulse — European Energy Intelligence",
  description: "AI-powered news screening for the European energy flexibility market. Monitor 6 RSS feeds, score articles with Claude, deliver a digest to your inbox.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
