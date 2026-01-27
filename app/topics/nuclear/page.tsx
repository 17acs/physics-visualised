export default function NuclearTopicPage() {
  return (
    <main className="page" style={{ maxWidth: 1100 }}>
      <a href="/topics">← Back to Topics</a>

      <h1 style={{ fontSize: 34, margin: "12px 0 6px" }}>Nuclear Physics</h1>
      <p style={{ marginTop: 0, opacity: 0.8, maxWidth: 760 }}>
        In case you enjoyed Oppenheimer and wanted to model your personality around it!
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 14,
          marginTop: 18,
        }}
      >
        <a
          href="/topics/nuclear/inverse-square"
          className="card"
          style={{ padding: 16, display: "block" }}
        >
          <div style={{ fontWeight: 900, fontSize: 18 }}>
            Inverse Square Law (γ)
          </div>
          <div style={{ opacity: 0.8, marginTop: 6 }}>
            Research project
          </div>
          <div style={{ marginTop: 10, color: "var(--accent)" }}>Open →</div>
        </a>
      </div>
    </main>
  );
}
