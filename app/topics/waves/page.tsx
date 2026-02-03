export default function WavesTopicPage() {
  return (
    <main className="page" style={{ maxWidth: 1100 }}>
      <a
        href="/topics"
        style={{ textDecoration: "none", display: "inline-block", marginBottom: 12 }}
      >
        ← Back to Topics
      </a>

      <h1 style={{ fontSize: 32, marginBottom: 12 }}>Waves</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        <a
          href="/topics/waves/superposition"
          className="card"
          style={{ padding: 16, textDecoration: "none", color: "inherit", display: "block" }}
        >
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>
            Superposition
          </div>
          <div style={{ opacity: 0.8 }}>
            
          </div>
          <div style={{ marginTop: 10, color: "var(--accent)" }}>Open →</div>
        </a>
      </div>
    </main>
  );
}
