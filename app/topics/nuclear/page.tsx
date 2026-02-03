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
       <div
  className="card"
  style={{
    padding: 22,
    display: "block",
    borderRadius: 18,
  }}
>
  <div style={{ fontWeight: 900, fontSize: 26, marginBottom: 6, }}>
    Inverse Square Law (γ)
  </div>

  <div style={{ opacity: 0.8, fontSize: 18, marginBottom: 14 }}>
    Research project
  </div>

  <a
    href="/topics/nuclear/inverse-square"
    style={{
      display: "inline-block",
      color: "var(--accent)",
      fontWeight: 800,
      textDecoration: "none",
    }}
  >
    Open →
  </a>
</div>

      </div>
    </main>
  );
}
