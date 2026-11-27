import { ImageResponse } from "next/og";

// The link preview for shares on Slack, LinkedIn, X and messaging apps.
export const alt = "StockLens: paper-trade US stocks with $100,000 in virtual cash";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#050505",
          color: "#f3f4f6",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 56 }}>
            {[24, 40, 32, 56].map((h, i) => (
              <div key={i} style={{ width: 12, height: h, borderRadius: 3, background: "#e8ba40" }} />
            ))}
          </div>
          <div style={{ fontSize: 48, fontWeight: 700, letterSpacing: -1 }}>StockLens</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2, maxWidth: 960 }}>
            Paper-trade US stocks with $100,000 in virtual cash.
          </div>
          <div style={{ fontSize: 30, color: "#9095a1" }}>
            Live prices, a watchlist, market news and AI portfolio analysis.
          </div>
        </div>

        <div style={{ display: "flex", gap: 16, fontSize: 24, color: "#ccdadc" }}>
          <span style={{ color: "#e8ba40" }}>No real money involved</span>
          <span>·</span>
          <span>Try the demo account, no sign-up needed</span>
        </div>
      </div>
    ),
    size,
  );
}
