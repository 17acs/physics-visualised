export default function ModernPage() {
  return (
    <main style={{ padding: 32, fontFamily: "system-ui", maxWidth: 900 }}>
      <a href="/topics" style={{ textDecoration: "none" }}>← Back to Topics</a>
      <h1 style={{ fontSize: 32, margin: "12px 0 8px" }}>Modern Physics</h1>

      <div
        style={{
          marginTop: 16,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 12,
        }}
      >
        <a
          href="/topics/modern/photoelectric"
          style={{
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 14,
            padding: 16,
            textDecoration: "none",
            color: "inherit",
            background: "rgba(255,255,255,0.035)",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
            Photoelectric effect
          </div>
          <div style={{ opacity: 0.8 }}>
            Threshold frequency, stopping potential, and Kmax vs f
          </div>
        </a>
      </div>
    </main>
  );
}
