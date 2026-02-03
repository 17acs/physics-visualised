export default function MechanicsPage() {
  return (
    <main style={{ padding: 32, fontFamily: "system-ui", maxWidth: 900 }}>
      <a href="/topics" style={{ textDecoration: "none" }}>
        ← Back to Topics
      </a>

      <h1 style={{ fontSize: 32, margin: "12px 0 8px" }}>Mechanics</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        
      </p>

      <div
        style={{
          marginTop: 16,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 12,
        }}
      >
        <a
          href="/topics/mechanics/projectile"
          style={{
            border: "1px solid #ddd",
            borderRadius: 14,
            padding: 16,
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
            Projectile motion
          </div>
          <div style={{ opacity: 0.8 }}>
            This should help with your three-pointers
          </div>
        </a>
      </div>
    </main>
  );
}
