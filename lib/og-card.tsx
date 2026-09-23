/** Social preview card rendered by next/og (Satori): inline styles and flexbox only. */
export function OgCard({ kicker, title, route, meta }: { kicker: string; title: string; route?: string[]; meta?: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: "linear-gradient(135deg, #070a12 0%, #0b111c 45%, #1a2742 100%)",
        color: "#f5f1e8",
        fontFamily: "serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 999, border: "2px solid rgba(223,175,85,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 14, height: 14, borderRadius: 999, background: "#dfaf55" }} />
        </div>
        <div style={{ display: "flex", fontSize: 34, letterSpacing: 2 }}>
          TRIP<span style={{ color: "#dfaf55" }}>YYY</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ fontSize: 24, letterSpacing: 6, textTransform: "uppercase", color: "#dfaf55", fontFamily: "sans-serif" }}>{kicker}</div>
        <div style={{ fontSize: title.length > 40 ? 66 : 82, lineHeight: 1.04, maxWidth: 1000 }}>{title}</div>
        {route && route.length > 1 && (
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 30, fontFamily: "sans-serif", color: "#d9d4c8" }}>
            {route.map((c, i) => (
              <div key={`${c}-${i}`} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 12, height: 12, borderRadius: 999, background: i === route.length - 1 ? "#dfaf55" : "#f5f1e8" }} />
                <span style={{ color: i === route.length - 1 ? "#f0cf8a" : "#d9d4c8" }}>{c}</span>
                {i < route.length - 1 && <div style={{ width: 46, height: 2, background: "linear-gradient(90deg, #f5f1e8, #dfaf55)" }} />}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, fontFamily: "sans-serif", color: "#9299a8" }}>
        <span>{meta ?? "AI trip planner for India"}</span>
        <span>Every road, already planned.</span>
      </div>
    </div>
  );
}
